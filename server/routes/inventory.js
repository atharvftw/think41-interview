const express = require('express');
const router = express.Router();
const database = require('../database/connection');

// Get inventory for all products or specific product
router.get('/', async (req, res) => {
    try {
        const { 
            product_id,
            distribution_center_id,
            low_stock_only = false,
            page = 1,
            limit = 20
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let params = [];

        if (product_id) {
            whereConditions.push('i.product_id = ?');
            params.push(product_id);
        }

        if (distribution_center_id) {
            whereConditions.push('i.distribution_center_id = ?');
            params.push(distribution_center_id);
        }

        if (low_stock_only === 'true') {
            whereConditions.push('i.quantity <= i.min_stock_level');
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                i.*,
                p.name as product_name,
                p.sku,
                p.retail_price,
                b.brand_name,
                c.category_name,
                dc.location as distribution_center_location,
                CASE 
                    WHEN i.quantity <= i.min_stock_level THEN 'low'
                    WHEN i.quantity >= i.max_stock_level THEN 'high'
                    ELSE 'normal'
                END as stock_status
            FROM inventory i
            JOIN products p ON i.product_id = p.product_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN distribution_centers dc ON i.distribution_center_id = dc.distribution_center_id
            ${whereClause}
            ORDER BY 
                CASE 
                    WHEN i.quantity <= i.min_stock_level THEN 1
                    ELSE 2
                END,
                p.name
            LIMIT ? OFFSET ?
        `;

        const countQuery = `
            SELECT COUNT(*) as total
            FROM inventory i
            JOIN products p ON i.product_id = p.product_id
            ${whereClause}
        `;

        const [inventory, countResult] = await Promise.all([
            database.query(query, [...params, parseInt(limit), parseInt(offset)]),
            database.query(countQuery, params)
        ]);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            inventory,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get inventory summary statistics
router.get('/summary', async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total_products,
                SUM(i.quantity) as total_items,
                SUM(CASE WHEN i.quantity <= i.min_stock_level THEN 1 ELSE 0 END) as low_stock_products,
                SUM(CASE WHEN i.quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_products,
                AVG(i.quantity) as avg_stock_level,
                SUM(i.quantity * p.cost) as total_inventory_value
            FROM inventory i
            JOIN products p ON i.product_id = p.product_id
            WHERE p.is_active = 1
        `;

        const summary = await database.get(query);

        // Get top products by inventory value
        const topProductsQuery = `
            SELECT 
                p.name,
                p.sku,
                b.brand_name,
                i.quantity,
                p.retail_price,
                (i.quantity * p.cost) as inventory_value
            FROM inventory i
            JOIN products p ON i.product_id = p.product_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            WHERE p.is_active = 1
            ORDER BY inventory_value DESC
            LIMIT 10
        `;

        const topProducts = await database.query(topProductsQuery);

        // Get low stock alerts
        const lowStockQuery = `
            SELECT 
                p.name,
                p.sku,
                b.brand_name,
                i.quantity,
                i.min_stock_level,
                dc.location
            FROM inventory i
            JOIN products p ON i.product_id = p.product_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN distribution_centers dc ON i.distribution_center_id = dc.distribution_center_id
            WHERE i.quantity <= i.min_stock_level AND p.is_active = 1
            ORDER BY i.quantity ASC
            LIMIT 20
        `;

        const lowStockAlerts = await database.query(lowStockQuery);

        res.json({
            summary,
            topProducts,
            lowStockAlerts
        });

    } catch (error) {
        console.error('Error fetching inventory summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update inventory quantity
router.put('/:inventory_id', async (req, res) => {
    try {
        const { inventory_id } = req.params;
        const { quantity, min_stock_level, max_stock_level } = req.body;

        // Check if inventory record exists
        const inventory = await database.get(
            'SELECT inventory_id FROM inventory WHERE inventory_id = ?',
            [inventory_id]
        );

        if (!inventory) {
            return res.status(404).json({ error: 'Inventory record not found' });
        }

        const updates = {};
        const params = [];

        if (quantity !== undefined) {
            if (quantity < 0) {
                return res.status(400).json({ error: 'Quantity cannot be negative' });
            }
            updates.quantity = quantity;
            params.push(quantity);
        }

        if (min_stock_level !== undefined) {
            if (min_stock_level < 0) {
                return res.status(400).json({ error: 'Minimum stock level cannot be negative' });
            }
            updates.min_stock_level = min_stock_level;
            params.push(min_stock_level);
        }

        if (max_stock_level !== undefined) {
            if (max_stock_level < 0) {
                return res.status(400).json({ error: 'Maximum stock level cannot be negative' });
            }
            updates.max_stock_level = max_stock_level;
            params.push(max_stock_level);
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        // Validate that min <= max if both are provided
        if (min_stock_level !== undefined && max_stock_level !== undefined && min_stock_level > max_stock_level) {
            return res.status(400).json({ error: 'Minimum stock level cannot be greater than maximum stock level' });
        }

        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        params.push(inventory_id);

        await database.run(
            `UPDATE inventory SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE inventory_id = ?`,
            params
        );

        res.json({ 
            message: 'Inventory updated successfully',
            inventory_id: parseInt(inventory_id),
            updates
        });

    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add inventory for a product at a distribution center
router.post('/', async (req, res) => {
    try {
        const { product_id, distribution_center_id, quantity = 0, min_stock_level = 10, max_stock_level = 1000 } = req.body;

        if (!product_id || !distribution_center_id) {
            return res.status(400).json({ error: 'Product ID and Distribution Center ID are required' });
        }

        if (quantity < 0 || min_stock_level < 0 || max_stock_level < 0) {
            return res.status(400).json({ error: 'All quantities must be non-negative' });
        }

        if (min_stock_level > max_stock_level) {
            return res.status(400).json({ error: 'Minimum stock level cannot be greater than maximum stock level' });
        }

        // Check if product exists
        const product = await database.get(
            'SELECT product_id FROM products WHERE product_id = ?',
            [product_id]
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if distribution center exists
        const distributionCenter = await database.get(
            'SELECT distribution_center_id FROM distribution_centers WHERE distribution_center_id = ?',
            [distribution_center_id]
        );

        if (!distributionCenter) {
            return res.status(404).json({ error: 'Distribution center not found' });
        }

        // Check if inventory record already exists
        const existingInventory = await database.get(
            'SELECT inventory_id FROM inventory WHERE product_id = ? AND distribution_center_id = ?',
            [product_id, distribution_center_id]
        );

        if (existingInventory) {
            return res.status(400).json({ 
                error: 'Inventory record already exists for this product at this distribution center',
                inventory_id: existingInventory.inventory_id
            });
        }

        // Create inventory record
        const result = await database.run(
            'INSERT INTO inventory (product_id, distribution_center_id, quantity, min_stock_level, max_stock_level) VALUES (?, ?, ?, ?, ?)',
            [product_id, distribution_center_id, quantity, min_stock_level, max_stock_level]
        );

        res.status(201).json({
            message: 'Inventory record created successfully',
            inventory_id: result.id,
            product_id: parseInt(product_id),
            distribution_center_id: parseInt(distribution_center_id),
            quantity: parseInt(quantity)
        });

    } catch (error) {
        console.error('Error creating inventory record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Adjust inventory (add/subtract from current quantity)
router.post('/:inventory_id/adjust', async (req, res) => {
    try {
        const { inventory_id } = req.params;
        const { adjustment, reason = 'Manual adjustment' } = req.body;

        if (adjustment === undefined || adjustment === 0) {
            return res.status(400).json({ error: 'Adjustment amount is required and cannot be zero' });
        }

        // Get current inventory
        const inventory = await database.get(
            `SELECT i.*, p.name as product_name FROM inventory i 
             JOIN products p ON i.product_id = p.product_id 
             WHERE i.inventory_id = ?`,
            [inventory_id]
        );

        if (!inventory) {
            return res.status(404).json({ error: 'Inventory record not found' });
        }

        const newQuantity = inventory.quantity + adjustment;

        if (newQuantity < 0) {
            return res.status(400).json({ 
                error: 'Adjustment would result in negative inventory',
                currentQuantity: inventory.quantity,
                requestedAdjustment: adjustment,
                resultingQuantity: newQuantity
            });
        }

        // Update inventory
        await database.run(
            'UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE inventory_id = ?',
            [newQuantity, inventory_id]
        );

        res.json({
            message: 'Inventory adjusted successfully',
            inventory_id: parseInt(inventory_id),
            product_name: inventory.product_name,
            previousQuantity: inventory.quantity,
            adjustment: adjustment,
            newQuantity: newQuantity,
            reason: reason
        });

    } catch (error) {
        console.error('Error adjusting inventory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete inventory record
router.delete('/:inventory_id', async (req, res) => {
    try {
        const { inventory_id } = req.params;

        // Check if inventory record exists
        const inventory = await database.get(
            'SELECT inventory_id FROM inventory WHERE inventory_id = ?',
            [inventory_id]
        );

        if (!inventory) {
            return res.status(404).json({ error: 'Inventory record not found' });
        }

        await database.run(
            'DELETE FROM inventory WHERE inventory_id = ?',
            [inventory_id]
        );

        res.json({ message: 'Inventory record deleted successfully' });

    } catch (error) {
        console.error('Error deleting inventory record:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
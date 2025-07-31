const express = require('express');
const router = express.Router();
const database = require('../database/connection');

// Get all products with optional filtering, searching, and pagination
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            search,
            category_id,
            brand_id,
            department_id,
            min_price,
            max_price,
            sort_by = 'name',
            sort_order = 'ASC'
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = ['p.is_active = 1'];
        let params = [];

        // Build WHERE conditions
        if (search) {
            whereConditions.push('(p.name LIKE ? OR p.sku LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category_id) {
            whereConditions.push('p.category_id = ?');
            params.push(category_id);
        }

        if (brand_id) {
            whereConditions.push('p.brand_id = ?');
            params.push(brand_id);
        }

        if (department_id) {
            whereConditions.push('p.department_id = ?');
            params.push(department_id);
        }

        if (min_price) {
            whereConditions.push('p.retail_price >= ?');
            params.push(min_price);
        }

        if (max_price) {
            whereConditions.push('p.retail_price <= ?');
            params.push(max_price);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Validate sort parameters
        const validSortColumns = ['name', 'retail_price', 'created_at', 'brand_name', 'category_name'];
        const validSortOrders = ['ASC', 'DESC'];
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'name';
        const sortOrderClause = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'ASC';

        let sortClause = `ORDER BY p.${sortColumn} ${sortOrderClause}`;
        if (sortColumn === 'brand_name') sortClause = `ORDER BY b.brand_name ${sortOrderClause}`;
        if (sortColumn === 'category_name') sortClause = `ORDER BY c.category_name ${sortOrderClause}`;

        // Main query with joins
        const query = `
            SELECT 
                p.*,
                b.brand_name,
                c.category_name,
                d.department_name,
                COALESCE(SUM(i.quantity), 0) as total_inventory
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN departments d ON p.department_id = d.department_id
            LEFT JOIN inventory i ON p.product_id = i.product_id
            ${whereClause}
            GROUP BY p.product_id
            ${sortClause}
            LIMIT ? OFFSET ?
        `;

        // Count query for pagination
        const countQuery = `
            SELECT COUNT(DISTINCT p.product_id) as total
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN departments d ON p.department_id = d.department_id
            ${whereClause}
        `;

        const [products, countResult] = await Promise.all([
            database.query(query, [...params, parseInt(limit), parseInt(offset)]),
            database.query(countQuery, params)
        ]);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            products,
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
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                p.*,
                b.brand_name,
                c.category_name,
                d.department_name,
                COALESCE(SUM(i.quantity), 0) as total_inventory
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN departments d ON p.department_id = d.department_id
            LEFT JOIN inventory i ON p.product_id = i.product_id
            WHERE p.product_id = ? AND p.is_active = 1
            GROUP BY p.product_id
        `;

        const product = await database.get(query, [id]);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);

    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get related products (same category, different brand or same brand, different category)
router.get('/:id/related', async (req, res) => {
    try {
        const { id } = req.params;
        const limit = req.query.limit || 6;

        // First get the current product's details
        const currentProduct = await database.get(
            'SELECT brand_id, category_id, department_id FROM products WHERE product_id = ?',
            [id]
        );

        if (!currentProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const query = `
            SELECT 
                p.*,
                b.brand_name,
                c.category_name,
                d.department_name,
                COALESCE(SUM(i.quantity), 0) as total_inventory
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN departments d ON p.department_id = d.department_id
            LEFT JOIN inventory i ON p.product_id = i.product_id
            WHERE p.product_id != ? 
                AND p.is_active = 1
                AND (
                    (p.category_id = ? AND p.brand_id != ?) OR 
                    (p.brand_id = ? AND p.category_id != ?) OR
                    p.department_id = ?
                )
            GROUP BY p.product_id
            ORDER BY 
                CASE 
                    WHEN p.category_id = ? THEN 1
                    WHEN p.brand_id = ? THEN 2
                    ELSE 3
                END,
                p.retail_price
            LIMIT ?
        `;

        const relatedProducts = await database.query(query, [
            id,
            currentProduct.category_id, currentProduct.brand_id,
            currentProduct.brand_id, currentProduct.category_id,
            currentProduct.department_id,
            currentProduct.category_id,
            currentProduct.brand_id,
            parseInt(limit)
        ]);

        res.json(relatedProducts);

    } catch (error) {
        console.error('Error fetching related products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search products with autocomplete suggestions
router.get('/search/suggestions', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json([]);
        }

        const query = `
            SELECT DISTINCT 
                p.name,
                b.brand_name,
                c.category_name
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE (p.name LIKE ? OR b.brand_name LIKE ? OR c.category_name LIKE ?)
                AND p.is_active = 1
            LIMIT 10
        `;

        const suggestions = await database.query(query, [`%${q}%`, `%${q}%`, `%${q}%`]);
        
        // Format suggestions for autocomplete
        const formatted = suggestions.map(item => ({
            text: item.name,
            type: 'product'
        }));

        res.json(formatted);

    } catch (error) {
        console.error('Error fetching search suggestions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
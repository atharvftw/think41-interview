const express = require('express');
const router = express.Router();
const database = require('../database/connection');

// Middleware to extract user ID (simplified - in production, use proper JWT auth)
const getUserId = (req, res, next) => {
    // For demo purposes, use a fixed user ID or get from headers
    req.userId = req.headers['x-user-id'] || 1;
    next();
};

// Get user's cart
router.get('/', getUserId, async (req, res) => {
    try {
        const query = `
            SELECT 
                ci.*,
                p.name,
                p.retail_price,
                p.sku,
                p.image_url,
                b.brand_name,
                c.category_name,
                COALESCE(SUM(i.quantity), 0) as available_inventory,
                (ci.quantity * p.retail_price) as item_total
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.product_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN inventory i ON p.product_id = i.product_id
            WHERE ci.user_id = ? AND p.is_active = 1
            GROUP BY ci.cart_item_id
            ORDER BY ci.created_at DESC
        `;

        const cartItems = await database.query(query, [req.userId]);

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + item.item_total, 0);
        const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

        res.json({
            items: cartItems,
            summary: {
                itemCount,
                subtotal: subtotal.toFixed(2),
                tax: (subtotal * 0.08).toFixed(2), // 8% tax
                total: (subtotal * 1.08).toFixed(2)
            }
        });

    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add item to cart
router.post('/add', getUserId, async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;

        if (!product_id) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        if (quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        // Check if product exists and is active
        const product = await database.get(
            'SELECT product_id, name FROM products WHERE product_id = ? AND is_active = 1',
            [product_id]
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check inventory availability
        const inventory = await database.get(
            'SELECT COALESCE(SUM(quantity), 0) as available FROM inventory WHERE product_id = ?',
            [product_id]
        );

        if (inventory.available < quantity) {
            return res.status(400).json({ 
                error: 'Insufficient inventory',
                available: inventory.available
            });
        }

        // Check if item already exists in cart
        const existingItem = await database.get(
            'SELECT cart_item_id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
            [req.userId, product_id]
        );

        if (existingItem) {
            // Update existing item
            const newQuantity = existingItem.quantity + quantity;
            
            if (inventory.available < newQuantity) {
                return res.status(400).json({ 
                    error: 'Insufficient inventory for requested quantity',
                    available: inventory.available,
                    currentInCart: existingItem.quantity
                });
            }

            await database.run(
                'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_item_id = ?',
                [newQuantity, existingItem.cart_item_id]
            );

            res.json({ 
                message: 'Cart updated successfully',
                quantity: newQuantity
            });
        } else {
            // Add new item
            const result = await database.run(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [req.userId, product_id, quantity]
            );

            res.status(201).json({ 
                message: 'Item added to cart successfully',
                cart_item_id: result.id,
                quantity
            });
        }

    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update cart item quantity
router.put('/update/:cart_item_id', getUserId, async (req, res) => {
    try {
        const { cart_item_id } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        // Check if cart item belongs to user
        const cartItem = await database.get(
            'SELECT ci.*, p.name FROM cart_items ci JOIN products p ON ci.product_id = p.product_id WHERE ci.cart_item_id = ? AND ci.user_id = ?',
            [cart_item_id, req.userId]
        );

        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        // Check inventory availability
        const inventory = await database.get(
            'SELECT COALESCE(SUM(quantity), 0) as available FROM inventory WHERE product_id = ?',
            [cartItem.product_id]
        );

        if (inventory.available < quantity) {
            return res.status(400).json({ 
                error: 'Insufficient inventory',
                available: inventory.available
            });
        }

        // Update quantity
        await database.run(
            'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_item_id = ?',
            [quantity, cart_item_id]
        );

        res.json({ 
            message: 'Cart item updated successfully',
            quantity
        });

    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove item from cart
router.delete('/remove/:cart_item_id', getUserId, async (req, res) => {
    try {
        const { cart_item_id } = req.params;

        // Check if cart item belongs to user
        const cartItem = await database.get(
            'SELECT cart_item_id FROM cart_items WHERE cart_item_id = ? AND user_id = ?',
            [cart_item_id, req.userId]
        );

        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        // Remove item
        await database.run(
            'DELETE FROM cart_items WHERE cart_item_id = ?',
            [cart_item_id]
        );

        res.json({ message: 'Item removed from cart successfully' });

    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Clear entire cart
router.delete('/clear', getUserId, async (req, res) => {
    try {
        await database.run(
            'DELETE FROM cart_items WHERE user_id = ?',
            [req.userId]
        );

        res.json({ message: 'Cart cleared successfully' });

    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get cart item count
router.get('/count', getUserId, async (req, res) => {
    try {
        const result = await database.get(
            'SELECT COALESCE(SUM(quantity), 0) as count FROM cart_items WHERE user_id = ?',
            [req.userId]
        );

        res.json({ count: result.count });

    } catch (error) {
        console.error('Error fetching cart count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
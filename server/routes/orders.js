const express = require('express');
const router = express.Router();
const database = require('../database/connection');

// Middleware to extract user ID (simplified - in production, use proper JWT auth)
const getUserId = (req, res, next) => {
    req.userId = req.headers['x-user-id'] || 1;
    next();
};

// Generate order number
function generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp.slice(-8)}-${random}`;
}

// Get user's orders
router.get('/', getUserId, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE o.user_id = ?';
        let params = [req.userId];

        if (status) {
            whereClause += ' AND o.status = ?';
            params.push(status);
        }

        const query = `
            SELECT 
                o.*,
                COUNT(oi.order_item_id) as item_count,
                sa.street_address as shipping_address,
                sa.city as shipping_city,
                sa.state as shipping_state,
                sa.zip_code as shipping_zip
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN addresses sa ON o.shipping_address_id = sa.address_id
            ${whereClause}
            GROUP BY o.order_id
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const countQuery = `
            SELECT COUNT(*) as total FROM orders o ${whereClause}
        `;

        const [orders, countResult] = await Promise.all([
            database.query(query, [...params, parseInt(limit), parseInt(offset)]),
            database.query(countQuery, params)
        ]);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            orders,
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
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single order with items
router.get('/:order_id', getUserId, async (req, res) => {
    try {
        const { order_id } = req.params;

        // Get order details
        const orderQuery = `
            SELECT 
                o.*,
                sa.street_address as shipping_street,
                sa.city as shipping_city,
                sa.state as shipping_state,
                sa.zip_code as shipping_zip,
                sa.country as shipping_country,
                ba.street_address as billing_street,
                ba.city as billing_city,
                ba.state as billing_state,
                ba.zip_code as billing_zip,
                ba.country as billing_country
            FROM orders o
            LEFT JOIN addresses sa ON o.shipping_address_id = sa.address_id
            LEFT JOIN addresses ba ON o.billing_address_id = ba.address_id
            WHERE o.order_id = ? AND o.user_id = ?
        `;

        const order = await database.get(orderQuery, [order_id, req.userId]);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get order items
        const itemsQuery = `
            SELECT 
                oi.*,
                p.name,
                p.sku,
                p.image_url,
                b.brand_name,
                c.category_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE oi.order_id = ?
            ORDER BY oi.order_item_id
        `;

        const items = await database.query(itemsQuery, [order_id]);

        res.json({
            ...order,
            items
        });

    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create order from cart
router.post('/create', getUserId, async (req, res) => {
    try {
        const { shipping_address, billing_address } = req.body;

        // Get cart items
        const cartQuery = `
            SELECT 
                ci.*,
                p.name,
                p.retail_price,
                p.sku,
                COALESCE(SUM(i.quantity), 0) as available_inventory
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.product_id
            LEFT JOIN inventory i ON p.product_id = i.product_id
            WHERE ci.user_id = ? AND p.is_active = 1
            GROUP BY ci.cart_item_id
        `;

        const cartItems = await database.query(cartQuery, [req.userId]);

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Validate inventory
        for (const item of cartItems) {
            if (item.available_inventory < item.quantity) {
                return res.status(400).json({ 
                    error: `Insufficient inventory for ${item.name}`,
                    product: item.name,
                    requested: item.quantity,
                    available: item.available_inventory
                });
            }
        }

        // Calculate totals
        const subtotal = cartItems.reduce((sum, item) => sum + (item.quantity * item.retail_price), 0);
        const taxAmount = subtotal * 0.08; // 8% tax
        const shippingCost = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
        const totalAmount = subtotal + taxAmount + shippingCost;

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Create addresses if provided
        let shippingAddressId = null;
        let billingAddressId = null;

        if (shipping_address) {
            const shippingResult = await database.run(
                `INSERT INTO addresses (user_id, type, street_address, city, state, zip_code, country)
                 VALUES (?, 'shipping', ?, ?, ?, ?, ?)`,
                [req.userId, shipping_address.street, shipping_address.city, 
                 shipping_address.state, shipping_address.zip, shipping_address.country || 'USA']
            );
            shippingAddressId = shippingResult.id;
        }

        if (billing_address) {
            const billingResult = await database.run(
                `INSERT INTO addresses (user_id, type, street_address, city, state, zip_code, country)
                 VALUES (?, 'billing', ?, ?, ?, ?, ?)`,
                [req.userId, billing_address.street, billing_address.city, 
                 billing_address.state, billing_address.zip, billing_address.country || 'USA']
            );
            billingAddressId = billingResult.id;
        }

        // Create order
        const orderResult = await database.run(
            `INSERT INTO orders (user_id, order_number, status, total_amount, shipping_cost, tax_amount, shipping_address_id, billing_address_id)
             VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)`,
            [req.userId, orderNumber, totalAmount.toFixed(2), shippingCost.toFixed(2), 
             taxAmount.toFixed(2), shippingAddressId, billingAddressId]
        );

        const orderId = orderResult.id;

        // Create order items and update inventory
        for (const item of cartItems) {
            // Add order item
            await database.run(
                `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
                 VALUES (?, ?, ?, ?, ?)`,
                [orderId, item.product_id, item.quantity, item.retail_price, 
                 (item.quantity * item.retail_price).toFixed(2)]
            );

            // Update inventory
            await database.run(
                `UPDATE inventory SET quantity = quantity - ? WHERE product_id = ?`,
                [item.quantity, item.product_id]
            );
        }

        // Clear cart
        await database.run('DELETE FROM cart_items WHERE user_id = ?', [req.userId]);

        res.status(201).json({
            message: 'Order created successfully',
            order_id: orderId,
            order_number: orderNumber,
            total_amount: totalAmount.toFixed(2)
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update order status (admin functionality)
router.put('/:order_id/status', async (req, res) => {
    try {
        const { order_id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'Invalid status',
                validStatuses
            });
        }

        // Check if order exists
        const order = await database.get(
            'SELECT order_id, status FROM orders WHERE order_id = ?',
            [order_id]
        );

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update status
        await database.run(
            'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
            [status, order_id]
        );

        res.json({ 
            message: 'Order status updated successfully',
            order_id: parseInt(order_id),
            old_status: order.status,
            new_status: status
        });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cancel order
router.put('/:order_id/cancel', getUserId, async (req, res) => {
    try {
        const { order_id } = req.params;

        // Check if order exists and belongs to user
        const order = await database.get(
            'SELECT order_id, status FROM orders WHERE order_id = ? AND user_id = ?',
            [order_id, req.userId]
        );

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ 
                error: 'Order cannot be cancelled',
                currentStatus: order.status
            });
        }

        // Get order items to restore inventory
        const orderItems = await database.query(
            'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
            [order_id]
        );

        // Restore inventory
        for (const item of orderItems) {
            await database.run(
                'UPDATE inventory SET quantity = quantity + ? WHERE product_id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Update order status
        await database.run(
            'UPDATE orders SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
            [order_id]
        );

        res.json({ 
            message: 'Order cancelled successfully',
            order_id: parseInt(order_id)
        });

    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
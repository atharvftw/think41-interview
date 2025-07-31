const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const database = require('../database/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to extract user ID (simplified - in production, use proper JWT auth)
const getUserId = (req, res, next) => {
    req.userId = req.headers['x-user-id'] || 1;
    next();
};

// Register user
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').trim().isLength({ min: 1 }),
    body('last_name').trim().isLength({ min: 1 }),
    body('phone').optional().isMobilePhone()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { email, password, first_name, last_name, phone } = req.body;

        // Check if user already exists
        const existingUser = await database.get(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await database.run(
            'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)',
            [email, passwordHash, first_name, last_name, phone]
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: result.id, email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                user_id: result.id,
                email,
                first_name,
                last_name,
                phone
            },
            token
        });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login user
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user
        const user = await database.get(
            'SELECT * FROM users WHERE email = ? AND is_active = 1',
            [email]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.user_id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            user: {
                user_id: user.user_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone
            },
            token
        });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user profile
router.get('/profile', getUserId, async (req, res) => {
    try {
        const user = await database.get(
            'SELECT user_id, email, first_name, last_name, phone, created_at FROM users WHERE user_id = ? AND is_active = 1',
            [req.userId]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
router.put('/profile', getUserId, [
    body('first_name').optional().trim().isLength({ min: 1 }),
    body('last_name').optional().trim().isLength({ min: 1 }),
    body('phone').optional().isMobilePhone()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { first_name, last_name, phone } = req.body;
        const updates = {};
        const params = [];

        if (first_name !== undefined) {
            updates.first_name = first_name;
            params.push(first_name);
        }
        if (last_name !== undefined) {
            updates.last_name = last_name;
            params.push(last_name);
        }
        if (phone !== undefined) {
            updates.phone = phone;
            params.push(phone);
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        params.push(req.userId);

        await database.run(
            `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
            params
        );

        res.json({ 
            message: 'Profile updated successfully',
            updates
        });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user addresses
router.get('/addresses', getUserId, async (req, res) => {
    try {
        const addresses = await database.query(
            'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [req.userId]
        );

        res.json(addresses);

    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add address
router.post('/addresses', getUserId, [
    body('type').isIn(['shipping', 'billing']),
    body('street_address').trim().isLength({ min: 1 }),
    body('city').trim().isLength({ min: 1 }),
    body('state').trim().isLength({ min: 1 }),
    body('zip_code').trim().isLength({ min: 1 }),
    body('country').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { type, street_address, city, state, zip_code, country = 'USA', is_default = false } = req.body;

        // If setting as default, unset other defaults of same type
        if (is_default) {
            await database.run(
                'UPDATE addresses SET is_default = 0 WHERE user_id = ? AND type = ?',
                [req.userId, type]
            );
        }

        const result = await database.run(
            'INSERT INTO addresses (user_id, type, street_address, city, state, zip_code, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [req.userId, type, street_address, city, state, zip_code, country, is_default ? 1 : 0]
        );

        res.status(201).json({
            message: 'Address added successfully',
            address_id: result.id
        });

    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update address
router.put('/addresses/:address_id', getUserId, [
    body('type').optional().isIn(['shipping', 'billing']),
    body('street_address').optional().trim().isLength({ min: 1 }),
    body('city').optional().trim().isLength({ min: 1 }),
    body('state').optional().trim().isLength({ min: 1 }),
    body('zip_code').optional().trim().isLength({ min: 1 }),
    body('country').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { address_id } = req.params;
        const { type, street_address, city, state, zip_code, country, is_default } = req.body;

        // Check if address belongs to user
        const address = await database.get(
            'SELECT address_id, type FROM addresses WHERE address_id = ? AND user_id = ?',
            [address_id, req.userId]
        );

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        const updates = {};
        const params = [];

        if (type !== undefined) {
            updates.type = type;
            params.push(type);
        }
        if (street_address !== undefined) {
            updates.street_address = street_address;
            params.push(street_address);
        }
        if (city !== undefined) {
            updates.city = city;
            params.push(city);
        }
        if (state !== undefined) {
            updates.state = state;
            params.push(state);
        }
        if (zip_code !== undefined) {
            updates.zip_code = zip_code;
            params.push(zip_code);
        }
        if (country !== undefined) {
            updates.country = country;
            params.push(country);
        }
        if (is_default !== undefined) {
            updates.is_default = is_default;
            params.push(is_default ? 1 : 0);
            
            // If setting as default, unset other defaults of same type
            if (is_default) {
                const addressType = type || address.type;
                await database.run(
                    'UPDATE addresses SET is_default = 0 WHERE user_id = ? AND type = ? AND address_id != ?',
                    [req.userId, addressType, address_id]
                );
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        params.push(address_id);

        await database.run(
            `UPDATE addresses SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE address_id = ?`,
            params
        );

        res.json({ 
            message: 'Address updated successfully',
            updates
        });

    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete address
router.delete('/addresses/:address_id', getUserId, async (req, res) => {
    try {
        const { address_id } = req.params;

        // Check if address belongs to user
        const address = await database.get(
            'SELECT address_id FROM addresses WHERE address_id = ? AND user_id = ?',
            [address_id, req.userId]
        );

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        await database.run(
            'DELETE FROM addresses WHERE address_id = ?',
            [address_id]
        );

        res.json({ message: 'Address deleted successfully' });

    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
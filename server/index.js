const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const database = require('./database/connection');

// Route imports
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const inventoryRoutes = require('./routes/inventory');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client build
app.use(express.static(path.join(__dirname, '../client/build')));

// Initialize database connection
database.connect().catch(err => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Get all brands, categories, and departments for filters
app.get('/api/filters', async (req, res) => {
    try {
        const [brands, categories, departments] = await Promise.all([
            database.query('SELECT * FROM brands ORDER BY brand_name'),
            database.query('SELECT * FROM categories ORDER BY category_name'),
            database.query('SELECT * FROM departments ORDER BY department_name')
        ]);

        res.json({
            brands,
            categories,
            departments
        });
    } catch (error) {
        console.error('Error fetching filters:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    database.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    database.close();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 API available at http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend available at http://localhost:${PORT}`);
});
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const db = new sqlite3.Database('./database/products.db');

// API endpoint to get all products with pagination
app.get('/api/products', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const category = req.query.category || '';
  const department = req.query.department || '';

  let query = `SELECT * FROM products WHERE 1=1`;
  let countQuery = `SELECT COUNT(*) as total FROM products WHERE 1=1`;
  let params = [];

  // Add search filters
  if (search) {
    query += ` AND (name LIKE ? OR brand LIKE ? OR category LIKE ?)`;
    countQuery += ` AND (name LIKE ? OR brand LIKE ? OR category LIKE ?)`;
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  if (category) {
    query += ` AND category = ?`;
    countQuery += ` AND category = ?`;
    params.push(category);
  }

  if (department) {
    query += ` AND department = ?`;
    countQuery += ` AND department = ?`;
    params.push(department);
  }

  query += ` ORDER BY id LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  // Get total count
  db.get(countQuery, params.slice(0, -2), (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get products
    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        products: rows,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// API endpoint to get unique categories
app.get('/api/categories', (req, res) => {
  db.all('SELECT DISTINCT category FROM products ORDER BY category', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows.map(row => row.category));
  });
});

// API endpoint to get unique departments
app.get('/api/departments', (req, res) => {
  db.all('SELECT DISTINCT department FROM products ORDER BY department', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows.map(row => row.department));
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Products viewer server running at http://localhost:${PORT}`);
});
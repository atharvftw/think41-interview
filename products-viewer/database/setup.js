const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Create database
const db = new sqlite3.Database('./database/products.db');

// Create products table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    cost REAL,
    category TEXT,
    name TEXT,
    brand TEXT,
    retail_price REAL,
    department TEXT,
    sku TEXT,
    distribution_center_id INTEGER
  )`);

  // Clear existing data
  db.run('DELETE FROM products');

  console.log('Database initialized. Starting CSV import...');

  // Import CSV data
  const csvPath = path.join(__dirname, '../../products.csv');
  let count = 0;

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      const stmt = db.prepare(`INSERT INTO products (
        id, cost, category, name, brand, retail_price, department, sku, distribution_center_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      stmt.run([
        parseInt(row.id),
        parseFloat(row.cost),
        row.category,
        row.name,
        row.brand,
        parseFloat(row.retail_price),
        row.department,
        row.sku,
        parseInt(row.distribution_center_id)
      ]);
      
      stmt.finalize();
      count++;
      
      if (count % 1000 === 0) {
        console.log(`Imported ${count} products...`);
      }
    })
    .on('end', () => {
      console.log(`CSV import completed! Total products imported: ${count}`);
      db.close();
    })
    .on('error', (error) => {
      console.error('Error reading CSV:', error);
      db.close();
    });
});
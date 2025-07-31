const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, '../database/ecommerce.db');

// Sample data based on the provided JSON
const sampleData = {
  "Brands": [
    {
      "brand_id": 1,
      "brand_name": "MG"
    }
  ],
  "Categories": [
    {
      "category_id": 1,
      "category_name": "Accessories"
    }
  ],
  "Departments": [
    {
      "department_id": 1,
      "department_name": "Women"
    }
  ],
  "DistributionCenters": [
    {
      "distribution_center_id": 1,
      "location": "Warehouse A"
    }
  ],
  "Products": [
    {
      "product_id": 13842,
      "name": "Low Profile Dyed Cotton Twill Cap - Navy W39S55D",
      "brand_id": 1,
      "category_id": 1,
      "department_id": 1,
      "sku": "EBD58B8A3F1D72F4206201DA62FB1204",
      "retail_price": 6.25,
      "cost": 2.518749991
    },
    {
      "product_id": 13928,
      "name": "Low Profile Dyed Cotton Twill Cap - Putty W39S55D",
      "brand_id": 1,
      "category_id": 1,
      "department_id": 1,
      "sku": "2EAC42424D12436BDD6A5B8A88480CC3",
      "retail_price": 5.95,
      "cost": 2.338349915
    },
    {
      "product_id": 14115,
      "name": "Enzyme Regular Solid Army Caps-Black W35S45D",
      "brand_id": 1,
      "category_id": 1,
      "department_id": 1,
      "sku": "EE364229B2791D1EF9355708EFF0BA34",
      "retail_price": 10.99,
      "cost": 4.879559879
    },
    {
      "product_id": 14157,
      "name": "Enzyme Regular Solid Army Caps-Olive W35S45D (One Size)",
      "brand_id": 1,
      "category_id": 1,
      "department_id": 1,
      "sku": "00BD13095D06C20B11A2993CA419D16B",
      "retail_price": 10.99,
      "cost": 4.648769887
    },
    {
      "product_id": 14273,
      "name": "Washed Canvas Ivy Cap - Black W11S64C",
      "brand_id": 1,
      "category_id": 1,
      "department_id": 1,
      "sku": "F531DC20FDE20B7ADF3A73F52B71D0AF",
      "retail_price": 15.99,
      "cost": 6.507929886
    }
  ],
  "Inventory": [
    {
      "inventory_id": 1,
      "product_id": 13842,
      "distribution_center_id": 1,
      "quantity": 100
    },
    {
      "inventory_id": 2,
      "product_id": 13928,
      "distribution_center_id": 1,
      "quantity": 80
    },
    {
      "inventory_id": 3,
      "product_id": 14115,
      "distribution_center_id": 1,
      "quantity": 70
    },
    {
      "inventory_id": 4,
      "product_id": 14157,
      "distribution_center_id": 1,
      "quantity": 60
    },
    {
      "inventory_id": 5,
      "product_id": 14273,
      "distribution_center_id": 1,
      "quantity": 50
    }
  ]
};

function seedDatabase() {
    return new Promise((resolve, reject) => {
        console.log('Seeding database with sample data...');
        
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
                return;
            }
            console.log('Connected to database for seeding.');
        });

        db.serialize(() => {
            // Clear existing data
            console.log('Clearing existing data...');
            const clearQueries = [
                'DELETE FROM cart_items',
                'DELETE FROM order_items',
                'DELETE FROM orders',
                'DELETE FROM addresses',
                'DELETE FROM users',
                'DELETE FROM inventory',
                'DELETE FROM products',
                'DELETE FROM distribution_centers',
                'DELETE FROM departments',
                'DELETE FROM categories',
                'DELETE FROM brands'
            ];

            clearQueries.forEach(query => {
                db.run(query, (err) => {
                    if (err) console.error('Error clearing data:', err.message);
                });
            });

            // Insert Brands
            console.log('Inserting brands...');
            const brandStmt = db.prepare('INSERT INTO brands (brand_id, brand_name) VALUES (?, ?)');
            sampleData.Brands.forEach(brand => {
                brandStmt.run(brand.brand_id, brand.brand_name);
            });
            brandStmt.finalize();

            // Insert Categories
            console.log('Inserting categories...');
            const categoryStmt = db.prepare('INSERT INTO categories (category_id, category_name) VALUES (?, ?)');
            sampleData.Categories.forEach(category => {
                categoryStmt.run(category.category_id, category.category_name);
            });
            categoryStmt.finalize();

            // Insert Departments
            console.log('Inserting departments...');
            const departmentStmt = db.prepare('INSERT INTO departments (department_id, department_name) VALUES (?, ?)');
            sampleData.Departments.forEach(department => {
                departmentStmt.run(department.department_id, department.department_name);
            });
            departmentStmt.finalize();

            // Insert Distribution Centers
            console.log('Inserting distribution centers...');
            const dcStmt = db.prepare('INSERT INTO distribution_centers (distribution_center_id, location) VALUES (?, ?)');
            sampleData.DistributionCenters.forEach(dc => {
                dcStmt.run(dc.distribution_center_id, dc.location);
            });
            dcStmt.finalize();

            // Insert Products
            console.log('Inserting products...');
            const productStmt = db.prepare(`
                INSERT INTO products (product_id, name, brand_id, category_id, department_id, sku, retail_price, cost)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            sampleData.Products.forEach(product => {
                productStmt.run(
                    product.product_id,
                    product.name,
                    product.brand_id,
                    product.category_id,
                    product.department_id,
                    product.sku,
                    product.retail_price,
                    product.cost
                );
            });
            productStmt.finalize();

            // Insert Inventory
            console.log('Inserting inventory...');
            const inventoryStmt = db.prepare(`
                INSERT INTO inventory (inventory_id, product_id, distribution_center_id, quantity)
                VALUES (?, ?, ?, ?)
            `);
            sampleData.Inventory.forEach(inventory => {
                inventoryStmt.run(
                    inventory.inventory_id,
                    inventory.product_id,
                    inventory.distribution_center_id,
                    inventory.quantity
                );
            });
            inventoryStmt.finalize();

            // Create a sample user for testing
            console.log('Creating sample user...');
            const bcrypt = require('bcryptjs');
            const hashedPassword = bcrypt.hashSync('password123', 10);
            db.run(`
                INSERT INTO users (email, password_hash, first_name, last_name)
                VALUES ('test@example.com', ?, 'John', 'Doe')
            `, [hashedPassword], (err) => {
                if (err) {
                    console.error('Error creating sample user:', err.message);
                }
            });

            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                    reject(err);
                } else {
                    console.log('Database seeding completed successfully!');
                    console.log('Sample user created: test@example.com / password123');
                    resolve();
                }
            });
        });
    });
}

// Run seeding if called directly
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('Database seeding process completed.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Database seeding failed:', error);
            process.exit(1);
        });
}

module.exports = { seedDatabase };
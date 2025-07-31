const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, '../database/ecommerce.db');
const schemaPath = path.join(__dirname, '../database/schema.sql');

// Create database and tables
function setupDatabase() {
    return new Promise((resolve, reject) => {
        console.log('Setting up SQLite database...');
        
        // Create database directory if it doesn't exist
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Create database connection
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
                return;
            }
            console.log('Connected to SQLite database.');
        });

        // Read and execute schema
        fs.readFile(schemaPath, 'utf8', (err, schema) => {
            if (err) {
                console.error('Error reading schema file:', err.message);
                reject(err);
                return;
            }

            // Execute schema (split by semicolon and filter out empty statements)
            const statements = schema.split(';').filter(stmt => stmt.trim());
            
            db.serialize(() => {
                statements.forEach((statement, index) => {
                    if (statement.trim()) {
                        db.run(statement, (err) => {
                            if (err) {
                                console.error(`Error executing statement ${index + 1}:`, err.message);
                                console.error('Statement:', statement.trim());
                            }
                        });
                    }
                });

                db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                        reject(err);
                    } else {
                        console.log('Database setup completed successfully!');
                        console.log(`Database created at: ${dbPath}`);
                        resolve();
                    }
                });
            });
        });
    });
}

// Run setup if called directly
if (require.main === module) {
    setupDatabase()
        .then(() => {
            console.log('Database setup process completed.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Database setup failed:', error);
            process.exit(1);
        });
}

module.exports = { setupDatabase };
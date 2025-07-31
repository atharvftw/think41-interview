#!/usr/bin/env node

const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function checkNodeVersion() {
  log('\n🔍 Checking Node.js version...', 'cyan');
  
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    log(`❌ Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 16 or higher.`, 'red');
    process.exit(1);
  }
  
  log(`✅ Node.js version ${nodeVersion} is supported.`, 'green');
}

async function installDependencies() {
  log('\n📦 Installing dependencies...', 'cyan');
  
  try {
    // Install server dependencies
    log('Installing server dependencies...', 'yellow');
    await execCommand('npm install');
    log('✅ Server dependencies installed successfully.', 'green');
    
    // Check if client directory exists, if not create it and package.json
    if (!fs.existsSync('./client')) {
      log('Creating client directory...', 'yellow');
      fs.mkdirSync('./client', { recursive: true });
    }
    
    // Install client dependencies
    if (fs.existsSync('./client/package.json')) {
      log('Installing client dependencies...', 'yellow');
      await execCommand('npm install', './client');
      log('✅ Client dependencies installed successfully.', 'green');
    } else {
      log('⚠️  Client package.json not found. Skipping client dependency installation.', 'yellow');
    }
    
  } catch (error) {
    log(`❌ Failed to install dependencies: ${error.error?.message || error.stderr}`, 'red');
    process.exit(1);
  }
}

async function setupDatabase() {
  log('\n🗄️  Setting up database...', 'cyan');
  
  try {
    // Check if database setup script exists
    if (!fs.existsSync('./server/scripts/setupDatabase.js')) {
      log('❌ Database setup script not found.', 'red');
      return;
    }
    
    log('Creating database and tables...', 'yellow');
    await execCommand('node server/scripts/setupDatabase.js');
    log('✅ Database setup completed successfully.', 'green');
    
    // Seed database if script exists
    if (fs.existsSync('./server/scripts/seedDatabase.js')) {
      log('Seeding database with sample data...', 'yellow');
      await execCommand('node server/scripts/seedDatabase.js');
      log('✅ Database seeded with sample data.', 'green');
    }
    
  } catch (error) {
    log(`❌ Failed to setup database: ${error.error?.message || error.stderr}`, 'red');
    process.exit(1);
  }
}

async function createEnvFile() {
  log('\n⚙️  Creating environment configuration...', 'cyan');
  
  const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_PATH=./server/database/ecommerce.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
`;

  const clientEnvContent = `# React App Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=MG Store
`;

  try {
    // Create server .env file if it doesn't exist
    if (!fs.existsSync('.env')) {
      fs.writeFileSync('.env', envContent);
      log('✅ Server environment file created (.env)', 'green');
    } else {
      log('⚠️  Server environment file already exists, skipping creation.', 'yellow');
    }
    
    // Create client .env file if it doesn't exist
    if (fs.existsSync('./client') && !fs.existsSync('./client/.env')) {
      fs.writeFileSync('./client/.env', clientEnvContent);
      log('✅ Client environment file created (client/.env)', 'green');
    }
    
  } catch (error) {
    log(`❌ Failed to create environment files: ${error.message}`, 'red');
  }
}

function printStartupInstructions() {
  log('\n🎉 Setup completed successfully!', 'green');
  log('\n📋 Next steps:', 'bright');
  log('1. Start the development servers:', 'cyan');
  log('   npm run dev', 'yellow');
  log('\n2. Or start them separately:', 'cyan');
  log('   Backend:  npm run server', 'yellow');
  log('   Frontend: npm run client', 'yellow');
  log('\n3. Open your browser and visit:', 'cyan');
  log('   Frontend: http://localhost:3000', 'yellow');
  log('   Backend:  http://localhost:5000', 'yellow');
  log('   API:      http://localhost:5000/api', 'yellow');
  log('\n4. Sample login credentials:', 'cyan');
  log('   Email:    test@example.com', 'yellow');
  log('   Password: password123', 'yellow');
  log('\n🛠️  Additional commands:', 'bright');
  log('   npm run setup-db  - Reset and setup database', 'yellow');
  log('   npm run seed-db   - Seed database with sample data', 'yellow');
  log('   npm run build     - Build production version', 'yellow');
  log('\n📖 For more information, check the README.md file.', 'cyan');
}

async function main() {
  log('🚀 Setting up MG Store Ecommerce Platform...', 'bright');
  
  try {
    await checkNodeVersion();
    await installDependencies();
    await createEnvFile();
    await setupDatabase();
    printStartupInstructions();
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
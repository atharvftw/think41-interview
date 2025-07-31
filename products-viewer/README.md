# Products Viewer

A web application that imports product data from CSV into SQLite and displays it in a beautiful, searchable interface.

## Features

- 📊 **SQLite Database**: Imports CSV data into a local SQLite database
- 🔍 **Search & Filter**: Search by product name, brand, or category
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 📄 **Pagination**: Handle large datasets efficiently
- 🎨 **Modern UI**: Clean, gradient design with hover effects

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Database**:
   ```bash
   npm run setup
   ```
   This will create the SQLite database and import data from `../products.csv`

3. **Start Server**:
   ```bash
   npm start
   ```
   The server will start on http://localhost:3000

## Usage

1. Open your browser and go to `http://localhost:3000`
2. Browse products with pagination (20 products per page)
3. Use the search bar to find specific products
4. Filter by category or department using the dropdown menus
5. Clear all filters with the "Clear Filters" button

## File Structure

```
products-viewer/
├── database/
│   ├── setup.js           # Database setup and CSV import script
│   └── products.db        # SQLite database (created after setup)
├── public/
│   ├── index.html         # Main HTML page
│   ├── styles.css         # CSS styling
│   └── script.js          # Frontend JavaScript
├── server.js              # Express server with API endpoints
├── package.json           # Node.js dependencies
└── README.md              # This file
```

## API Endpoints

- `GET /api/products` - Get paginated products with search/filter options
- `GET /api/categories` - Get all unique product categories
- `GET /api/departments` - Get all unique departments

## Technologies Used

- **Backend**: Node.js, Express.js, SQLite3
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Data**: CSV parsing with csv-parser package

## Data Structure

The application imports products with the following fields:
- ID, Cost, Category, Name, Brand
- Retail Price, Department, SKU
- Distribution Center ID

Imported **29,120 products** from the CSV file.
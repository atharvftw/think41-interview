# MG Store - Ecommerce Platform

A modern, full-stack ecommerce platform built with React, Express.js, and SQLite. Features a clean, product-first design with complete shopping functionality.

![Platform Overview](https://img.shields.io/badge/Platform-Full%20Stack-blue)
![Frontend](https://img.shields.io/badge/Frontend-React-61dafb)
![Backend](https://img.shields.io/badge/Backend-Express.js-green)
![Database](https://img.shields.io/badge/Database-SQLite-blue)

## ✨ Features

### 🛍️ **Core Ecommerce Functionality**
- **Product Catalog**: Browse products with advanced filtering and search
- **Shopping Cart**: Add, update, and remove items with real-time updates
- **User Authentication**: Secure registration and login system
- **Order Management**: Complete order processing and tracking
- **Inventory Management**: Real-time stock tracking and updates

### 🎨 **Modern Design**
- **Responsive Design**: Optimized for all devices and screen sizes
- **Clean UI/UX**: Product-first design with intuitive navigation
- **Fast Performance**: Optimized API calls and efficient state management
- **Accessibility**: Built with accessibility best practices

### 🔧 **Technical Features**
- **RESTful API**: Complete backend API with comprehensive endpoints
- **Database Relations**: Properly structured SQLite database with foreign keys
- **Context Management**: Global state management for cart and user data
- **Error Handling**: Comprehensive error handling and user feedback
- **Security**: Password hashing, JWT tokens, and input validation

## 🚀 Quick Start

### Prerequisites
- Node.js 16 or higher
- npm or yarn package manager

### 🔧 Automatic Setup
Run the automated setup script to install dependencies and configure the platform:

```bash
node setup.js
```

### 🏃‍♂️ Start Development Servers
After setup, start both frontend and backend:

```bash
npm run dev
```

Or start them separately:
```bash
# Backend server (port 5000)
npm run server

# Frontend development server (port 3000)
npm run client
```

### 🌐 Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── context/       # React Context providers
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions and API calls
│   │   └── index.js       # App entry point
│   └── package.json
├── server/                 # Express.js backend
│   ├── database/          # Database files and schema
│   ├── routes/            # API route handlers
│   ├── scripts/           # Database setup and seeding scripts
│   └── index.js           # Server entry point
├── package.json           # Root package.json
├── setup.js              # Automated setup script
└── README.md
```

## 🗄️ Database Schema

The platform uses SQLite with the following main tables:

### Core Tables
- **`brands`** - Product brands (MG, etc.)
- **`categories`** - Product categories (Accessories, etc.)
- **`departments`** - Product departments (Women, Men, etc.)
- **`products`** - Main product information
- **`inventory`** - Stock levels per distribution center

### User & Order Tables
- **`users`** - Customer accounts and profiles
- **`addresses`** - Customer shipping/billing addresses
- **`orders`** - Order information and status
- **`order_items`** - Individual items within orders
- **`cart_items`** - Shopping cart contents

### Sample Data
The platform comes with pre-loaded sample data including:
- 5 Premium cap products from MG brand
- Accessories category in Women department
- 1 Distribution center (Warehouse A)
- Sample inventory for all products
- Test user account: `test@example.com` / `password123`

## 🛠️ API Endpoints

### Products
- `GET /api/products` - Get all products with filtering
- `GET /api/products/:id` - Get single product
- `GET /api/products/:id/related` - Get related products

### Shopping Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:id` - Update cart item quantity
- `DELETE /api/cart/remove/:id` - Remove item from cart

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders/create` - Create new order

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `GET /api/users/addresses` - Get user addresses

### Filters & Utilities
- `GET /api/filters` - Get brands, categories, departments
- `GET /api/health` - Server health check

## 🎯 Usage Examples

### Adding Products to Cart
```javascript
// Using the cart context
const { addToCart } = useCart();
await addToCart(productId, quantity);
```

### User Authentication
```javascript
// Using the user context
const { login } = useUser();
const result = await login(email, password);
```

### Fetching Products
```javascript
// Using the API utility
import { api } from './utils/api';
const response = await api.get('/products?category_id=1');
```

## 🔐 Authentication

The platform uses a simplified authentication system suitable for development:

- **JWT Tokens**: Stored in localStorage for persistent sessions
- **Password Hashing**: bcryptjs for secure password storage
- **User Context**: Global authentication state management
- **Protected Routes**: Automatic redirect for unauthorized access

## 🎨 Styling & Design

The platform features a modern, clean design system:

- **CSS Variables**: Consistent color palette and spacing
- **Responsive Design**: Mobile-first approach with breakpoints
- **Component Styling**: Modular CSS for each component
- **Accessibility**: ARIA labels and semantic HTML
- **Performance**: Optimized CSS with minimal dependencies

## 📱 Responsive Design

Optimized for all devices:
- **Desktop**: Full-featured experience with sidebar navigation
- **Tablet**: Adapted layouts with collapsible elements
- **Mobile**: Touch-friendly interface with hamburger menu

## 🚀 Production Deployment

### Building for Production
```bash
npm run build
```

### Environment Variables
Create production environment files:

**.env** (Server):
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-production-secret-key
```

**client/.env** (Frontend):
```env
REACT_APP_API_URL=https://your-api-domain.com/api
```

### Deployment Checklist
- [ ] Update JWT secret key
- [ ] Configure production database
- [ ] Set up CORS for production domain
- [ ] Enable HTTPS
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring and logging

## 🛡️ Security Considerations

- **Password Security**: Passwords are hashed using bcryptjs
- **Input Validation**: All API inputs are validated
- **SQL Injection**: Parameterized queries prevent injection attacks
- **CORS**: Configured for development, customize for production
- **Authentication**: JWT tokens with expiration
- **Error Handling**: Secure error messages without sensitive data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 5000
npx kill-port 5000

# Kill process on port 3000
npx kill-port 3000
```

**Database Issues**
```bash
# Reset database
npm run setup-db

# Reseed with sample data
npm run seed-db
```

**Dependency Issues**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules client/node_modules
npm install
cd client && npm install
```

**Cannot Connect to API**
- Ensure backend server is running on port 5000
- Check environment variables in client/.env
- Verify CORS configuration

### Getting Help

If you encounter issues:
1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure both frontend and backend servers are running
4. Check the browser's network tab for API call failures

## 🎯 Future Enhancements

Potential features to add:
- [ ] Payment integration (Stripe, PayPal)
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Advanced inventory management
- [ ] Multi-vendor support
- [ ] Analytics and reporting

---

**Happy coding! 🚀**
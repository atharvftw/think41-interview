import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useCart } from '../../context/CartContext';
import { Search, ShoppingCart, User, Menu, X, LogOut } from 'lucide-react';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useUser();
  const { cart } = useCart();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Close menus when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="logo">
            <span className="logo-text">MG Store</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            <Link 
              to="/" 
              className={`nav-link ${isActiveRoute('/') ? 'active' : ''}`}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className={`nav-link ${isActiveRoute('/products') ? 'active' : ''}`}
            >
              Products
            </Link>
          </nav>

          {/* Search Bar */}
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </form>

          {/* Header Actions */}
          <div className="header-actions">
            {/* Cart Button */}
            <Link to="/cart" className="header-action-btn">
              <div className="cart-icon-container">
                <ShoppingCart size={20} />
                {cart.summary.itemCount > 0 && (
                  <span className="cart-badge">{cart.summary.itemCount}</span>
                )}
              </div>
              <span className="action-text">Cart</span>
            </Link>

            {/* User Menu */}
            <div className="user-menu">
              <button 
                className="header-action-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <User size={20} />
                <span className="action-text">
                  {isAuthenticated ? user?.first_name || 'Account' : 'Login'}
                </span>
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="user-dropdown">
                  {isAuthenticated ? (
                    <>
                      <div className="user-info">
                        <p className="user-name">{user?.first_name} {user?.last_name}</p>
                        <p className="user-email">{user?.email}</p>
                      </div>
                      <hr className="dropdown-divider" />
                      <Link to="/profile" className="dropdown-link">
                        <User size={16} />
                        Profile
                      </Link>
                      <Link to="/orders" className="dropdown-link">
                        <ShoppingCart size={16} />
                        Orders
                      </Link>
                      <hr className="dropdown-divider" />
                      <button onClick={handleLogout} className="dropdown-link logout-btn">
                        <LogOut size={16} />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="dropdown-link">
                        <User size={16} />
                        Login
                      </Link>
                      <Link to="/register" className="dropdown-link">
                        <User size={16} />
                        Register
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="nav-mobile">
            <Link to="/" className="mobile-nav-link">Home</Link>
            <Link to="/products" className="mobile-nav-link">Products</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="mobile-nav-link">Profile</Link>
                <Link to="/orders" className="mobile-nav-link">Orders</Link>
                <button onClick={handleLogout} className="mobile-nav-link logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-nav-link">Login</Link>
                <Link to="/register" className="mobile-nav-link">Register</Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Github, Twitter, Instagram } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section">
            <h3 className="footer-title">MG Store</h3>
            <p className="footer-description">
              Quality accessories and caps for every style. 
              Discover our curated collection of premium products 
              designed with intention and lasting personality.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="social-link" aria-label="GitHub">
                <Github size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4 className="footer-subtitle">Quick Links</h4>
            <nav className="footer-nav">
              <Link to="/" className="footer-link">Home</Link>
              <Link to="/products" className="footer-link">Products</Link>
              <Link to="/products?category_id=1" className="footer-link">Accessories</Link>
              <Link to="/products?department_id=1" className="footer-link">Women</Link>
            </nav>
          </div>

          {/* Customer Service */}
          <div className="footer-section">
            <h4 className="footer-subtitle">Customer Service</h4>
            <nav className="footer-nav">
              <Link to="/orders" className="footer-link">Order Status</Link>
              <a href="#" className="footer-link">Shipping Info</a>
              <a href="#" className="footer-link">Returns</a>
              <a href="#" className="footer-link">Size Guide</a>
              <a href="#" className="footer-link">Contact Us</a>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h4 className="footer-subtitle">Contact</h4>
            <div className="contact-info">
              <div className="contact-item">
                <Mail size={16} />
                <span>hello@mgstore.com</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="contact-item">
                <MapPin size={16} />
                <span>123 Store St, City, ST 12345</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="newsletter-section">
          <div className="newsletter-content">
            <div className="newsletter-text">
              <h4>Stay Updated</h4>
              <p>Subscribe to our newsletter for the latest products and exclusive offers.</p>
            </div>
            <form className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email"
                className="newsletter-input"
                required
              />
              <button type="submit" className="newsletter-btn">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} MG Store. All rights reserved.
            </p>
            <div className="legal-links">
              <a href="#" className="legal-link">Privacy Policy</a>
              <a href="#" className="legal-link">Terms of Service</a>
              <a href="#" className="legal-link">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
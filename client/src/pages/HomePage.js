import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, formatPrice } from '../utils/api';
import { ArrowRight, Star, Truck, Shield, Headphones } from 'lucide-react';
import toast from 'react-hot-toast';
import './HomePage.css';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products?limit=6&sort_by=retail_price&sort_order=DESC');
      setFeaturedProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      toast.error('Failed to load featured products');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Truck size={24} />,
      title: 'Free Shipping',
      description: 'Free shipping on orders over $50'
    },
    {
      icon: <Shield size={24} />,
      title: 'Secure Payment',
      description: 'Your payment information is secure'
    },
    {
      icon: <Headphones size={24} />,
      title: '24/7 Support',
      description: 'Get help when you need it'
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Premium Accessories
                <span className="hero-accent">For Every Style</span>
              </h1>
              <p className="hero-description">
                Discover our curated collection of quality caps and accessories. 
                Each piece is designed with intention, utility, and lasting personality.
              </p>
              <div className="hero-actions">
                <Link to="/products" className="btn btn-primary btn-lg">
                  Shop Collection
                  <ArrowRight size={20} />
                </Link>
                <Link to="/products?category_id=1" className="btn btn-outline btn-lg">
                  View Accessories
                </Link>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-placeholder">
                <div className="hero-pattern"></div>
                <h2>MG</h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Products</h2>
            <p className="section-subtitle">
              Handpicked items from our premium collection
            </p>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {featuredProducts.map((product) => (
                  <div key={product.product_id} className="product-card">
                    <Link to={`/products/${product.product_id}`} className="product-link">
                      <div className="product-image">
                        <div className="product-placeholder">
                          <span>{product.name.split(' ')[0]}</span>
                        </div>
                        {product.total_inventory <= 10 && (
                          <div className="stock-badge">Low Stock</div>
                        )}
                      </div>
                      <div className="product-info">
                        <h3 className="product-name">{product.name}</h3>
                        <p className="product-brand">{product.brand_name}</p>
                        <div className="product-rating">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              className={i < 4 ? 'star-filled' : 'star-empty'} 
                            />
                          ))}
                          <span className="rating-text">(4.0)</span>
                        </div>
                        <div className="product-price">
                          <span className="current-price">{formatPrice(product.retail_price)}</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
              
              <div className="section-footer">
                <Link to="/products" className="btn btn-outline">
                  View All Products
                  <ArrowRight size={18} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Find Your Perfect Style?</h2>
            <p className="cta-description">
              Join thousands of satisfied customers who trust MG Store for quality accessories.
            </p>
            <Link to="/products" className="btn btn-primary btn-lg">
              Start Shopping
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
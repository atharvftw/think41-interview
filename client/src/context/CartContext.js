import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({
    items: [],
    summary: {
      itemCount: 0,
      subtotal: '0.00',
      tax: '0.00',
      total: '0.00'
    }
  });
  const [loading, setLoading] = useState(false);

  // Fetch cart data
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);
      await api.post('/cart/add', {
        product_id: productId,
        quantity
      });
      await fetchCart();
      toast.success('Item added to cart');
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      const message = error.response?.data?.error || 'Failed to add item to cart';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (cartItemId, quantity) => {
    try {
      setLoading(true);
      await api.put(`/cart/update/${cartItemId}`, { quantity });
      await fetchCart();
      toast.success('Cart updated');
      return true;
    } catch (error) {
      console.error('Error updating cart item:', error);
      const message = error.response?.data?.error || 'Failed to update cart';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartItemId) => {
    try {
      setLoading(true);
      await api.delete(`/cart/remove/${cartItemId}`);
      await fetchCart();
      toast.success('Item removed from cart');
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      const message = error.response?.data?.error || 'Failed to remove item';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      setLoading(true);
      await api.delete('/cart/clear');
      await fetchCart();
      toast.success('Cart cleared');
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      const message = error.response?.data?.error || 'Failed to clear cart';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get cart item count
  const getCartCount = async () => {
    try {
      const response = await api.get('/cart/count');
      return response.data.count;
    } catch (error) {
      console.error('Error fetching cart count:', error);
      return 0;
    }
  };

  // Load cart on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const value = {
    cart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    fetchCart,
    getCartCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
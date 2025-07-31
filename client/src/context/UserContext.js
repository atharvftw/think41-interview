import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post('/users/login', { email, password });
      
      const { user: userData, token } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      toast.success('Login successful!');
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await api.post('/users/register', userData);
      
      const { user: newUser, token } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      toast.success('Registration successful!');
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  // Get user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile');
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      // If unauthorized, clear local storage
      if (error.response?.status === 401) {
        logout();
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      const response = await api.put('/users/profile', updates);
      
      // Fetch updated profile
      const updatedUser = await fetchProfile();
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      const message = error.response?.data?.error || 'Failed to update profile';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Get user addresses
  const fetchAddresses = async () => {
    try {
      const response = await api.get('/users/addresses');
      return response.data;
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
      return [];
    }
  };

  // Add address
  const addAddress = async (addressData) => {
    try {
      const response = await api.post('/users/addresses', addressData);
      toast.success('Address added successfully');
      return { success: true, address_id: response.data.address_id };
    } catch (error) {
      console.error('Error adding address:', error);
      const message = error.response?.data?.error || 'Failed to add address';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Update address
  const updateAddress = async (addressId, updates) => {
    try {
      await api.put(`/users/addresses/${addressId}`, updates);
      toast.success('Address updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating address:', error);
      const message = error.response?.data?.error || 'Failed to update address';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Delete address
  const deleteAddress = async (addressId) => {
    try {
      await api.delete(`/users/addresses/${addressId}`);
      toast.success('Address deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error deleting address:', error);
      const message = error.response?.data?.error || 'Failed to delete address';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        
        // Optionally verify token with server
        fetchProfile();
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        logout();
      }
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
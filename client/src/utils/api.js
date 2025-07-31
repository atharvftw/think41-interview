import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add user ID header for simplified auth (for demo purposes)
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        config.headers['x-user-id'] = userData.user_id;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if we're not already on login/register pages
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API methods for products
export const productsAPI = {
  getAll: (params = {}) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getRelated: (id, limit = 6) => api.get(`/products/${id}/related?limit=${limit}`),
  search: (query) => api.get('/products/search/suggestions', { params: { q: query } }),
};

// API methods for cart
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (productId, quantity = 1) => api.post('/cart/add', { product_id: productId, quantity }),
  update: (cartItemId, quantity) => api.put(`/cart/update/${cartItemId}`, { quantity }),
  remove: (cartItemId) => api.delete(`/cart/remove/${cartItemId}`),
  clear: () => api.delete('/cart/clear'),
  getCount: () => api.get('/cart/count'),
};

// API methods for orders
export const ordersAPI = {
  getAll: (params = {}) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (orderData) => api.post('/orders/create', orderData),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
};

// API methods for users
export const usersAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (email, password) => api.post('/users/login', { email, password }),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (updates) => api.put('/users/profile', updates),
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (addressData) => api.post('/users/addresses', addressData),
  updateAddress: (id, updates) => api.put(`/users/addresses/${id}`, updates),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
};

// API methods for inventory
export const inventoryAPI = {
  getAll: (params = {}) => api.get('/inventory', { params }),
  getSummary: () => api.get('/inventory/summary'),
  update: (id, updates) => api.put(`/inventory/${id}`, updates),
  create: (inventoryData) => api.post('/inventory', inventoryData),
  adjust: (id, adjustment, reason) => api.post(`/inventory/${id}/adjust`, { adjustment, reason }),
  delete: (id) => api.delete(`/inventory/${id}`),
};

// API method for filters (brands, categories, departments)
export const filtersAPI = {
  getAll: () => api.get('/filters'),
};

// Utility functions
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export const formatDate = (dateString) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
};

export const formatDateTime = (dateString) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

export { api };
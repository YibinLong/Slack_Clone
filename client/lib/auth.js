/**
 * Authentication utilities
 * Handles login/logout and token management
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses by redirecting to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Get current token from localStorage
  getToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  // Store user and token
  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  },

  // Clear auth data
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('token');
    return !!token;
  }
};

export default api;

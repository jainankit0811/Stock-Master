import axiosInstance from './axiosInstance';

/**
 * Authentication API calls
 */

// Register new user
export const register = async (userData) => {
  const response = await axiosInstance.post('/api/auth/register', userData);
  return response.data;
};

// Login user
export const login = async (credentials) => {
  const response = await axiosInstance.post('/api/auth/login', credentials);
  return response.data;
};

// Get current user profile
export const getMe = async () => {
  const response = await axiosInstance.get('/api/auth/me');
  return response.data;
};

// Forgot password - request reset token
export const forgotPassword = async (emailData) => {
  const response = await axiosInstance.post('/api/auth/forgot-password', emailData);
  return response.data;
};

// Reset password with token
export const resetPassword = async (resetData) => {
  const response = await axiosInstance.post('/api/auth/reset-password', resetData);
  return response.data;
};



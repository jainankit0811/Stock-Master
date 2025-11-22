import axiosInstance from './axiosInstance';

/**
 * Products API calls
 */

// Get all products with optional filters
export const getProducts = async (params = {}) => {
  const response = await axiosInstance.get('/api/products', { params });
  return response.data;
};

// Get single product by ID
export const getProduct = async (id) => {
  const response = await axiosInstance.get(`/api/products/${id}`);
  return response.data;
};

// Create new product
export const createProduct = async (productData) => {
  const response = await axiosInstance.post('/api/products', productData);
  return response.data;
};

// Update product
export const updateProduct = async (id, productData) => {
  const response = await axiosInstance.put(`/api/products/${id}`, productData);
  return response.data;
};

// Delete product
export const deleteProduct = async (id) => {
  const response = await axiosInstance.delete(`/api/products/${id}`);
  return response.data;
};


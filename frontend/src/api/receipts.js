import axiosInstance from './axiosInstance';

/**
 * Receipts API calls
 */

// Get all receipts with optional filters
export const getReceipts = async (params = {}) => {
  const response = await axiosInstance.get('/api/receipts', { params });
  return response.data;
};

// Get single receipt by ID
export const getReceipt = async (id) => {
  const response = await axiosInstance.get(`/api/receipts/${id}`);
  return response.data;
};

// Create new receipt
export const createReceipt = async (receiptData) => {
  const response = await axiosInstance.post('/api/receipts', receiptData);
  return response.data;
};

// Update receipt
export const updateReceipt = async (id, receiptData) => {
  const response = await axiosInstance.put(`/api/receipts/${id}`, receiptData);
  return response.data;
};

// Validate receipt (only manager)
export const validateReceipt = async (id) => {
  const response = await axiosInstance.post(`/api/receipts/${id}/validate`);
  return response.data;
};

// Delete receipt
export const deleteReceipt = async (id) => {
  const response = await axiosInstance.delete(`/api/receipts/${id}`);
  return response.data;
};



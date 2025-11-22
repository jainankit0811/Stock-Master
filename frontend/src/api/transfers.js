import axiosInstance from './axiosInstance';

/**
 * Internal Transfers API calls
 */

// Get all transfers with optional filters
export const getTransfers = async (params = {}) => {
  const response = await axiosInstance.get('/api/transfers', { params });
  return response.data;
};

// Get single transfer by ID
export const getTransfer = async (id) => {
  const response = await axiosInstance.get(`/api/transfers/${id}`);
  return response.data;
};

// Create new transfer
export const createTransfer = async (transferData) => {
  const response = await axiosInstance.post('/api/transfers', transferData);
  return response.data;
};

// Update transfer
export const updateTransfer = async (id, transferData) => {
  const response = await axiosInstance.put(`/api/transfers/${id}`, transferData);
  return response.data;
};

// Validate transfer (only manager)
export const validateTransfer = async (id) => {
  const response = await axiosInstance.post(`/api/transfers/${id}/validate`);
  return response.data;
};

// Delete transfer
export const deleteTransfer = async (id) => {
  const response = await axiosInstance.delete(`/api/transfers/${id}`);
  return response.data;
};


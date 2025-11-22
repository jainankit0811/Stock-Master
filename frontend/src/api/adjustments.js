import axiosInstance from './axiosInstance';

/**
 * Stock Adjustments API calls
 */

// Get all adjustments with optional filters
export const getAdjustments = async (params = {}) => {
  const response = await axiosInstance.get('/api/adjustments', { params });
  return response.data;
};

// Get single adjustment by ID
export const getAdjustment = async (id) => {
  const response = await axiosInstance.get(`/api/adjustments/${id}`);
  return response.data;
};

// Create new adjustment
export const createAdjustment = async (adjustmentData) => {
  const response = await axiosInstance.post('/api/adjustments', adjustmentData);
  return response.data;
};

// Update adjustment
export const updateAdjustment = async (id, adjustmentData) => {
  const response = await axiosInstance.put(`/api/adjustments/${id}`, adjustmentData);
  return response.data;
};

// Validate adjustment (only manager)
export const validateAdjustment = async (id) => {
  const response = await axiosInstance.post(`/api/adjustments/${id}/validate`);
  return response.data;
};

// Delete adjustment
export const deleteAdjustment = async (id) => {
  const response = await axiosInstance.delete(`/api/adjustments/${id}`);
  return response.data;
};



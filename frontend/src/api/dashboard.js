import axiosInstance from './axiosInstance';

/**
 * Dashboard API calls
 */

// Get dashboard KPIs
export const getDashboardKPIs = async () => {
  const response = await axiosInstance.get('/api/dashboard');
  return response.data;
};

// Get inventory operations with filters
export const getInventoryOperations = async (params = {}) => {
  const response = await axiosInstance.get('/api/dashboard/operations', { params });
  return response.data;
};



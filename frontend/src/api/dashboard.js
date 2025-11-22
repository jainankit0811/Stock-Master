import axiosInstance from './axiosInstance';

/**
 * Dashboard API calls
 */

// Get dashboard KPIs
export const getDashboardKPIs = async () => {
  const response = await axiosInstance.get('/api/dashboard');
  return response.data;
};


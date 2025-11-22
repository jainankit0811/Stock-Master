import axiosInstance from './axiosInstance';

/**
 * Stock Alerts API calls
 */

// Get all active (unresolved) stock alerts
export const getActiveStockAlerts = async () => {
  const response = await axiosInstance.get('/api/stock-alerts/active');
  return response.data;
};

// Resolve a specific stock alert
export const resolveStockAlert = async (alertId) => {
  const response = await axiosInstance.put(`/api/stock-alerts/${alertId}/resolve`);
  return response.data;
};

// Trigger a manual low stock check
export const triggerStockCheck = async () => {
  const response = await axiosInstance.post('/api/stock-alerts/check');
  return response.data;
};

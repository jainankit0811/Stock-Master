import axiosInstance from './axiosInstance';

/**
 * Delivery Orders API calls
 */

// Get all delivery orders with optional filters
export const getDeliveryOrders = async (params = {}) => {
  const response = await axiosInstance.get('/api/delivery-orders', { params });
  return response.data;
};

// Get single delivery order by ID
export const getDeliveryOrder = async (id) => {
  const response = await axiosInstance.get(`/api/delivery-orders/${id}`);
  return response.data;
};

// Create new delivery order
export const createDeliveryOrder = async (orderData) => {
  const response = await axiosInstance.post('/api/delivery-orders', orderData);
  return response.data;
};

// Update delivery order
export const updateDeliveryOrder = async (id, orderData) => {
  const response = await axiosInstance.put(`/api/delivery-orders/${id}`, orderData);
  return response.data;
};

// Validate delivery order (only manager)
export const validateDeliveryOrder = async (id) => {
  const response = await axiosInstance.post(`/api/delivery-orders/${id}/validate`);
  return response.data;
};

// Delete delivery order
export const deleteDeliveryOrder = async (id) => {
  const response = await axiosInstance.delete(`/api/delivery-orders/${id}`);
  return response.data;
};



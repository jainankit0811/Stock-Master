import axiosInstance from './axiosInstance';

/**
 * Warehouses API calls
 */

// Get all warehouses
export const getWarehouses = async () => {
  const response = await axiosInstance.get('/api/warehouses');
  return response.data;
};

// Get single warehouse by ID
export const getWarehouse = async (id) => {
  const response = await axiosInstance.get(`/api/warehouses/${id}`);
  return response.data;
};

// Create new warehouse
export const createWarehouse = async (warehouseData) => {
  const response = await axiosInstance.post('/api/warehouses', warehouseData);
  return response.data;
};

// Update warehouse
export const updateWarehouse = async (id, warehouseData) => {
  const response = await axiosInstance.put(`/api/warehouses/${id}`, warehouseData);
  return response.data;
};

// Delete warehouse
export const deleteWarehouse = async (id) => {
  const response = await axiosInstance.delete(`/api/warehouses/${id}`);
  return response.data;
};



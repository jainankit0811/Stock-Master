import axiosInstance from './axiosInstance';

/**
 * Locations API calls
 * Note: Locations are managed through warehouses in this system
 * This file provides a consistent API interface
 */

// Get all locations (warehouses)
export const getLocations = async () => {
  const response = await axiosInstance.get('/api/warehouses');
  return response.data;
};

// Get single location by ID
export const getLocation = async (id) => {
  const response = await axiosInstance.get(`/api/warehouses/${id}`);
  return response.data;
};

// Create new location
export const createLocation = async (locationData) => {
  const response = await axiosInstance.post('/api/warehouses', locationData);
  return response.data;
};

// Update location
export const updateLocation = async (id, locationData) => {
  const response = await axiosInstance.put(`/api/warehouses/${id}`, locationData);
  return response.data;
};

// Delete location
export const deleteLocation = async (id) => {
  const response = await axiosInstance.delete(`/api/warehouses/${id}`);
  return response.data;
};


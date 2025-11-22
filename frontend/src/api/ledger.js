import axiosInstance from './axiosInstance';

/**
 * Ledger API calls
 */

// Get ledger entries with optional filters
export const getLedgerEntries = async (params = {}) => {
  const response = await axiosInstance.get('/api/ledger', { params });
  return response.data;
};

// Get single ledger entry by ID
export const getLedgerEntry = async (id) => {
  const response = await axiosInstance.get(`/api/ledger/${id}`);
  return response.data;
};



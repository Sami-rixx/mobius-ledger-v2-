/**
 * Income Service
 * API client for income management operations
 * Centralizes all income-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for income API endpoints
 */
const BASE_URL = '/income';

/**
 * Get paginated list of income records
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {string} params.search - Search term
 * @param {number} params.categoryId - Filter by category ID
 * @param {string} params.startDate - Filter by start date
 * @param {string} params.endDate - Filter by end date
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - Paginated result with income records and metadata
 */
export const getIncome = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.search) queryParams.append('search', params.search);
  if (params.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get all income records without pagination
 * @returns {Promise<Array>} - Array of all income records
 */
export const getAllIncome = async () => {
  return api.get(`${BASE_URL}/all`);
};

/**
 * Get a single income record by ID
 * @param {number} id - Income record ID
 * @returns {Promise<Object>} - Income record object
 */
export const getIncomeById = async (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Get income record by receipt number
 * @param {string} receiptNumber - Receipt number
 * @returns {Promise<Object>} - Income record object
 */
export const getIncomeByReceiptNumber = async (receiptNumber) => {
  return api.get(`${BASE_URL}/receipt/${receiptNumber}`);
};

/**
 * Get income records by category
 * @param {number} categoryId - Category ID
 * @returns {Promise<Array>} - Income records in the category
 */
export const getIncomeByCategory = async (categoryId) => {
  return api.get(`${BASE_URL}/category/${categoryId}`);
};

/**
 * Get income records by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} - Income records in the date range
 */
export const getIncomeByDateRange = async (startDate, endDate) => {
  return api.get(`${BASE_URL}/date-range?startDate=${startDate}&endDate=${endDate}`);
};

/**
 * Get income statistics
 * @returns {Promise<Object>} - Income statistics
 */
export const getIncomeStatistics = async () => {
  return api.get(`${BASE_URL}/statistics`);
};

/**
 * Create a new income record
 * @param {Object} incomeData - Income data
 * @param {number} incomeData.category_id - Category ID (required)
 * @param {number} incomeData.amount - Amount (required)
 * @param {string} incomeData.source - Source of income
 * @param {string} incomeData.description - Description
 * @param {string} incomeData.receipt_number - Receipt number
 * @param {string} incomeData.date - Date (YYYY-MM-DD)
 * @param {string} incomeData.payment_method - Payment method
 * @param {string} incomeData.reference - Reference number
 * @param {boolean} incomeData.is_verified - Verification status
 * @returns {Promise<Object>} - Created income record
 */
export const createIncome = async (incomeData) => {
  return api.post(BASE_URL, incomeData);
};

/**
 * Update an income record (full update)
 * @param {number} id - Income record ID
 * @param {Object} incomeData - Complete income data
 * @returns {Promise<Object>} - Updated income record
 */
export const updateIncome = async (id, incomeData) => {
  return api.put(`${BASE_URL}/${id}`, incomeData);
};

/**
 * Delete an income record
 * @param {number} id - Income record ID
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteIncome = async (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

/**
 * Mark income as verified
 * @param {number} id - Income record ID
 * @returns {Promise<Object>} - Verification confirmation
 */
export const verifyIncome = async (id) => {
  return api.post(`${BASE_URL}/${id}/verify`);
};

// Export all functions
export default {
  getIncome,
  getAllIncome,
  getIncomeById,
  getIncomeByReceiptNumber,
  getIncomeByCategory,
  getIncomeByDateRange,
  getIncomeStatistics,
  createIncome,
  updateIncome,
  deleteIncome,
  verifyIncome
};

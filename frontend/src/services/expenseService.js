/**
 * Expense Service
 * API client for expense management operations
 * Centralizes all expense-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for expense API endpoints
 */
const BASE_URL = '/expenses';

/**
 * Get paginated list of expense records
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {string} params.search - Search term
 * @param {number} params.categoryId - Filter by category ID
 * @param {string} params.startDate - Filter by start date
 * @param {string} params.endDate - Filter by end date
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - Paginated result with expense records and metadata
 */
export const getExpenses = async (params = {}) => {
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
 * Get all expense records without pagination
 * @returns {Promise<Array>} - Array of all expense records
 */
export const getAllExpenses = async () => {
  return api.get(`${BASE_URL}/all`);
};

/**
 * Get a single expense record by ID
 * @param {number} id - Expense record ID
 * @returns {Promise<Object>} - Expense record object
 */
export const getExpenseById = async (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Get expense record by receipt number
 * @param {string} receiptNumber - Receipt number
 * @returns {Promise<Object>} - Expense record object
 */
export const getExpenseByReceiptNumber = async (receiptNumber) => {
  return api.get(`${BASE_URL}/receipt/${encodeURIComponent(receiptNumber)}`);
};

/**
 * Get expense records by category
 * @param {number} categoryId - Category ID
 * @returns {Promise<Array>} - Expense records in the category
 */
export const getExpensesByCategory = async (categoryId) => {
  return api.get(`${BASE_URL}/category/${categoryId}`);
};

/**
 * Get expense records by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} - Expense records in the date range
 */
export const getExpensesByDateRange = async (startDate, endDate) => {
  return api.get(`${BASE_URL}/date-range?startDate=${startDate}&endDate=${endDate}`);
};

/**
 * Get expense statistics
 * @returns {Promise<Object>} - Expense statistics including total, count, by category, etc.
 */
export const getExpenseStatistics = async () => {
  return api.get(`${BASE_URL}/statistics`);
};

/**
 * Search expenses with a query
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query string
 * @param {number} params.categoryId - Filter by category
 * @param {string} params.startDate - Filter by start date
 * @param {string} params.endDate - Filter by end date
 * @param {number} params.minAmount - Minimum amount
 * @param {number} params.maxAmount - Maximum amount
 * @returns {Promise<Array>} - Matching expense records
 */
export const searchExpenses = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.query) queryParams.append('query', params.query);
  if (params.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.minAmount) queryParams.append('minAmount', params.minAmount);
  if (params.maxAmount) queryParams.append('maxAmount', params.maxAmount);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/search${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Create a new expense record
 * @param {Object} expenseData - Expense data
 * @param {number} expenseData.expense_category_id - Category ID (required)
 * @param {number} expenseData.amount - Amount (required)
 * @param {string} expenseData.description - Description
 * @param {string} expenseData.vendor_name - Vendor name (required)
 * @param {string} expenseData.vendor_contact - Vendor contact information
 * @param {number} expenseData.payment_method_id - Payment method ID
 * @param {number} expenseData.transaction_id - Related transaction ID
 * @param {string} expenseData.expense_date - Date (YYYY-MM-DD)
 * @param {string} expenseData.receipt_number - Receipt number
 * @param {string} expenseData.notes - Additional notes
 * @param {boolean} expenseData.is_verified - Verification status
 * @param {number} expenseData.created_by - User ID who created the expense
 * @returns {Promise<Object>} - Created expense record
 */
export const createExpense = async (expenseData) => {
  return api.post(BASE_URL, expenseData);
};

/**
 * Update an expense record (full update)
 * @param {number} id - Expense record ID
 * @param {Object} expenseData - Complete expense data
 * @returns {Promise<Object>} - Updated expense record
 */
export const updateExpense = async (id, expenseData) => {
  return api.put(`${BASE_URL}/${id}`, expenseData);
};

/**
 * Delete an expense record
 * @param {number} id - Expense record ID
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteExpense = async (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

/**
 * Mark expense as verified
 * @param {number} id - Expense record ID
 * @returns {Promise<Object>} - Verification confirmation
 */
export const verifyExpense = async (id) => {
  return api.post(`${BASE_URL}/${id}/verify`);
};

// Export all functions
export default {
  getExpenses,
  getAllExpenses,
  getExpenseById,
  getExpenseByReceiptNumber,
  getExpensesByCategory,
  getExpensesByDateRange,
  getExpenseStatistics,
  searchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  verifyExpense
};

/**
 * Director Withdrawal Service
 * API client for director withdrawal management operations
 * Centralizes all director withdrawal-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for director withdrawal API endpoints
 */
const BASE_URL = '/withdrawals';

/**
 * Withdrawal status constants
 */
export const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Get paginated list of director withdrawals
 * @param {Object} params - Query parameters
 * @param {string} params.label - Filter by withdrawal label
 * @param {string} params.status - Filter by status (pending, approved, rejected, completed, cancelled)
 * @param {string} params.recipientName - Filter by recipient name
 * @param {string} params.startDate - Filter by start date (YYYY-MM-DD)
 * @param {string} params.endDate - Filter by end date (YYYY-MM-DD)
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction (ASC/DESC)
 * @returns {Promise<Object>} - Paginated result with withdrawal records and metadata
 */
export const getWithdrawals = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.label !== undefined) queryParams.append('label', params.label);
  if (params.status !== undefined) queryParams.append('status', params.status);
  if (params.recipientName !== undefined) queryParams.append('recipientName', params.recipientName);
  if (params.startDate !== undefined) queryParams.append('startDate', params.startDate);
  if (params.endDate !== undefined) queryParams.append('endDate', params.endDate);
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.orderBy !== undefined) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir !== undefined) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get all director withdrawals without pagination
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise<Object>} - Result with all withdrawal records
 */
export const getAllWithdrawals = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.label !== undefined) queryParams.append('label', params.label);
  if (params.status !== undefined) queryParams.append('status', params.status);
  if (params.recipientName !== undefined) queryParams.append('recipientName', params.recipientName);
  if (params.startDate !== undefined) queryParams.append('startDate', params.startDate);
  if (params.endDate !== undefined) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/all${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get a single director withdrawal by ID
 * @param {number} id - Withdrawal ID
 * @returns {Promise<Object>} - Withdrawal record object
 */
export const getWithdrawalById = async (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Create a new director withdrawal
 * @param {Object} withdrawalData - Withdrawal data
 * @param {number} withdrawalData.amount - Withdrawal amount
 * @param {string} withdrawalData.label - Configurable label for the withdrawal
 * @param {string} withdrawalData.purpose - Purpose of the withdrawal (required)
 * @param {string} withdrawalData.description - Detailed description
 * @param {string} withdrawalData.recipientName - Name of the recipient (required)
 * @param {string} withdrawalData.recipientContact - Contact information for recipient
 * @param {number} withdrawalData.paymentMethodId - Payment method ID
 * @param {string} withdrawalData.withdrawalDate - Date of withdrawal (YYYY-MM-DD)
 * @param {string} withdrawalData.notes - Additional notes
 * @returns {Promise<Object>} - Created withdrawal record
 */
export const createWithdrawal = async (withdrawalData) => {
  return api.post(BASE_URL, withdrawalData);
};

/**
 * Update a director withdrawal
 * @param {number} id - Withdrawal ID
 * @param {Object} withdrawalData - Withdrawal data to update
 * @returns {Promise<Object>} - Updated withdrawal record
 */
export const updateWithdrawal = async (id, withdrawalData) => {
  return api.put(`${BASE_URL}/${id}`, withdrawalData);
};

/**
 * Delete a director withdrawal
 * @param {number} id - Withdrawal ID
 * @returns {Promise<Object>} - Result with success message
 */
export const deleteWithdrawal = async (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

/**
 * Approve a director withdrawal
 * @param {number} id - Withdrawal ID
 * @param {string} notes - Approval notes (optional)
 * @returns {Promise<Object>} - Updated withdrawal record
 */
export const approveWithdrawal = async (id, notes = null) => {
  const data = notes ? { notes } : {};
  return api.post(`${BASE_URL}/${id}/approve`, data);
};

/**
 * Reject a director withdrawal
 * @param {number} id - Withdrawal ID
 * @param {string} reason - Reason for rejection (required)
 * @returns {Promise<Object>} - Updated withdrawal record
 */
export const rejectWithdrawal = async (id, reason) => {
  return api.post(`${BASE_URL}/${id}/reject`, { reason });
};

/**
 * Mark a director withdrawal as completed
 * @param {number} id - Withdrawal ID
 * @param {number} transactionId - Optional transaction ID
 * @returns {Promise<Object>} - Updated withdrawal record
 */
export const completeWithdrawal = async (id, transactionId = null) => {
  const data = transactionId ? { transactionId } : {};
  return api.post(`${BASE_URL}/${id}/complete`, data);
};

/**
 * Cancel a director withdrawal
 * @param {number} id - Withdrawal ID
 * @param {string} reason - Reason for cancellation (optional)
 * @returns {Promise<Object>} - Updated withdrawal record
 */
export const cancelWithdrawal = async (id, reason = null) => {
  const data = reason ? { reason } : {};
  return api.post(`${BASE_URL}/${id}/cancel`, data);
};

/**
 * Get withdrawal statistics
 * @returns {Promise<Object>} - Withdrawal statistics object
 */
export const getWithdrawalStatistics = async () => {
  return api.get(`${BASE_URL}/statistics`);
};

/**
 * Get all unique labels
 * @returns {Promise<Object>} - Result with array of labels
 */
export const getAllLabels = async () => {
  return api.get(`${BASE_URL}/labels`);
};

/**
 * Get pending withdrawals (awaiting approval)
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction (ASC/DESC)
 * @returns {Promise<Object>} - Paginated result with pending withdrawal records
 */
export const getPendingWithdrawals = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.orderBy !== undefined) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir !== undefined) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/pending${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Search withdrawals
 * @param {string} query - Search term
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction (ASC/DESC)
 * @returns {Promise<Object>} - Paginated result with matching withdrawal records
 */
export const searchWithdrawals = async (query, params = {}) => {
  const queryParams = new URLSearchParams({ q: query });
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.orderBy !== undefined) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir !== undefined) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/search?${queryString}`;
  
  return api.get(url);
};

/**
 * Get count of director withdrawals
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise<Object>} - Result with count
 */
export const getWithdrawalsCount = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.label !== undefined) queryParams.append('label', params.label);
  if (params.status !== undefined) queryParams.append('status', params.status);
  if (params.recipientName !== undefined) queryParams.append('recipientName', params.recipientName);
  if (params.startDate !== undefined) queryParams.append('startDate', params.startDate);
  if (params.endDate !== undefined) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/count${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get withdrawals by status
 * @param {string} status - Status to filter by
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} - Result with matching withdrawal records
 */
export const getWithdrawalsByStatus = async (status, params = {}) => {
  return getWithdrawals({ ...params, status });
};

/**
 * Get withdrawals by label
 * @param {string} label - Label to filter by
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} - Result with matching withdrawal records
 */
export const getWithdrawalsByLabel = async (label, params = {}) => {
  return getWithdrawals({ ...params, label });
};

/**
 * Get withdrawals by recipient
 * @param {string} recipientName - Recipient name to filter by
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} - Result with matching withdrawal records
 */
export const getWithdrawalsByRecipient = async (recipientName, params = {}) => {
  return getWithdrawals({ ...params, recipientName });
};

/**
 * Get withdrawals by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} - Result with matching withdrawal records
 */
export const getWithdrawalsByDateRange = async (startDate, endDate, params = {}) => {
  return getWithdrawals({ ...params, startDate, endDate });
};

export default {
  getWithdrawals,
  getAllWithdrawals,
  getWithdrawalById,
  createWithdrawal,
  updateWithdrawal,
  deleteWithdrawal,
  approveWithdrawal,
  rejectWithdrawal,
  completeWithdrawal,
  cancelWithdrawal,
  getWithdrawalStatistics,
  getAllLabels,
  getPendingWithdrawals,
  searchWithdrawals,
  getWithdrawalsCount,
  getWithdrawalsByStatus,
  getWithdrawalsByLabel,
  getWithdrawalsByRecipient,
  getWithdrawalsByDateRange,
  WITHDRAWAL_STATUS
};

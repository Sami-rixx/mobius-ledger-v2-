/**
 * Daily Ledger Service
 * API client for daily ledger operations
 * Centralizes all daily ledger-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for daily ledger API endpoints
 */
const BASE_URL = '/daily-ledger';

/**
 * Default pagination parameters
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: 20
};

/**
 * Validation constants for daily ledger data
 */
export const DAILY_LEDGER_PARAMS = {
  DATE_REGEX: /^\d{4}-\d{2}-\d{2}$/,
  MIN_DATE: '2000-01-01',
  MAX_DATE: '2099-12-31',
  MIN_AMOUNT: 0,
  MAX_AMOUNT: 99999999.99
};

/**
 * Format date as YYYY-MM-DD
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return date || '';
};

/**
 * Format currency as Kenyan Shillings
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'KSh 0.00';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format number with commas
 * @param {number} value - Number to format
 * @returns {string} - Formatted number string
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('en-KE').format(value);
};

/**
 * Validate daily ledger parameters
 * @param {Object} params - Parameters to validate
 * @returns {boolean} - Whether parameters are valid
 */
export const validateDailyLedgerParams = (params = {}) => {
  if (params.startDate && !DAILY_LEDGER_PARAMS.DATE_REGEX.test(params.startDate)) {
    return false;
  }
  if (params.endDate && !DAILY_LEDGER_PARAMS.DATE_REGEX.test(params.endDate)) {
    return false;
  }
  if (params.startDate && params.endDate && params.startDate > params.endDate) {
    return false;
  }
  return true;
};

/**
 * Get list of daily ledger records with pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.pageSize - Items per page (default: 20)
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {string} params.orderBy - Field to order by (default: 'date')
 * @param {string} params.orderDirection - Order direction: 'ASC' or 'DESC' (default: 'DESC')
 * @returns {Promise<Object>} - Paginated list of daily ledger records
 */
export const getDailyLedgers = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDirection) queryParams.append('orderDirection', params.orderDirection);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Count total daily ledger records
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Count of daily ledger records
 */
export const getDailyLedgerCount = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/count${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get a single daily ledger by ID
 * @param {number} id - Ledger record ID
 * @returns {Promise<Object>} - Daily ledger record
 */
export const getDailyLedgerById = async (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Get daily ledger by date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} - Daily ledger record for the specified date
 */
export const getDailyLedgerByDate = async (date) => {
  return api.get(`${BASE_URL}/date/${date}`);
};

/**
 * Get today's daily ledger
 * @returns {Promise<Object>} - Today's daily ledger record
 */
export const getTodayDailyLedger = async () => {
  return api.get(`${BASE_URL}/today`);
};

/**
 * Get yesterday's daily ledger
 * @returns {Promise<Object>} - Yesterday's daily ledger record
 */
export const getYesterdayDailyLedger = async () => {
  return api.get(`${BASE_URL}/yesterday`);
};

/**
 * Get recent daily ledger records
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of records to return (default: 10)
 * @returns {Promise<Array>} - Recent daily ledger records
 */
export const getRecentDailyLedgers = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.limit) queryParams.append('limit', params.limit);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/recent${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get daily ledgers for a specific month
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<Array>} - Daily ledger records for the specified month
 */
export const getMonthlyDailyLedgers = async (year, month) => {
  return api.get(`${BASE_URL}/month/${year}/${month}`);
};

/**
 * Get daily ledger statistics
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Statistics including total days, total income, total expenses, etc.
 */
export const getDailyLedgerStatistics = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/statistics${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Create a new daily ledger record
 * @param {Object} data - Daily ledger data
 * @param {string} data.date - Date in YYYY-MM-DD format
 * @param {number} data.opening_balance - Opening balance
 * @param {number} data.total_income - Total income
 * @param {number} data.total_expenses - Total expenses
 * @param {number} data.closing_balance - Closing balance
 * @param {number} data.net_movement - Net movement
 * @param {number} data.transaction_count - Transaction count
 * @returns {Promise<Object>} - Created daily ledger record
 */
export const createDailyLedger = async (data) => {
  return api.post(BASE_URL, data);
};

/**
 * Update an existing daily ledger record
 * @param {number} id - Ledger record ID
 * @param {Object} data - Updated daily ledger data
 * @returns {Promise<Object>} - Updated daily ledger record
 */
export const updateDailyLedger = async (id, data) => {
  return api.put(`${BASE_URL}/${id}`, data);
};

/**
 * Delete a daily ledger record
 * @param {number} id - Ledger record ID
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteDailyLedger = async (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

/**
 * Get missing dates in the ledger sequence
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Missing dates and count
 */
export const getMissingDailyLedgerDates = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/missing-dates${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Generate ledger for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} - Generated ledger record
 */
export const generateDailyLedgerForDate = async (date) => {
  return api.post(`${BASE_URL}/generate/${date}`);
};

/**
 * Generate ledger for a date range
 * @param {Object} data - Generation parameters
 * @param {string} data.startDate - Start date (YYYY-MM-DD)
 * @param {string} data.endDate - End date (YYYY-MM-DD)
 * @param {boolean} data.force - Whether to force regeneration (default: false)
 * @returns {Promise<Object>} - Generation result
 */
export const generateDailyLedgerForDateRange = async (data) => {
  return api.post(`${BASE_URL}/generate`, data);
};

/**
 * Fill missing ledger dates in a date range
 * @param {Object} data - Fill parameters
 * @param {string} data.startDate - Start date (YYYY-MM-DD)
 * @param {string} data.endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Fill result with count of filled dates
 */
export const fillMissingDailyLedgerDates = async (data) => {
  return api.post(`${BASE_URL}/fill-missing`, data);
};

/**
 * Get ledger summary
 * @param {Object} params - Query parameters
 * @param {number} params.days - Number of days to summarize (default: 30)
 * @returns {Promise<Object>} - Ledger summary with totals and averages
 */
export const getDailyLedgerSummary = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.days) queryParams.append('days', params.days);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/summary${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Calculate net balance from income and expenses
 * @param {number} openingBalance - Opening balance
 * @param {number} totalIncome - Total income
 * @param {number} totalExpenses - Total expenses
 * @returns {number} - Calculated closing balance
 */
export const calculateClosingBalance = (openingBalance, totalIncome, totalExpenses) => {
  return openingBalance + totalIncome - totalExpenses;
};

/**
 * Calculate net movement from income and expenses
 * @param {number} totalIncome - Total income
 * @param {number} totalExpenses - Total expenses
 * @returns {number} - Net movement
 */
export const calculateNetMovement = (totalIncome, totalExpenses) => {
  return totalIncome - totalExpenses;
};

/**
 * Get daily ledger data for a specific period
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Ledger data for the period
 */
export const getDailyLedgerForPeriod = async (params = {}) => {
  return getDailyLedgers(params);
};

// Export all functions as default
export default {
  getDailyLedgers,
  getDailyLedgerCount,
  getDailyLedgerById,
  getDailyLedgerByDate,
  getTodayDailyLedger,
  getYesterdayDailyLedger,
  getRecentDailyLedgers,
  getMonthlyDailyLedgers,
  getDailyLedgerStatistics,
  createDailyLedger,
  updateDailyLedger,
  deleteDailyLedger,
  getMissingDailyLedgerDates,
  generateDailyLedgerForDate,
  generateDailyLedgerForDateRange,
  fillMissingDailyLedgerDates,
  getDailyLedgerSummary,
  getDailyLedgerForPeriod,
  // Utility functions
  formatDate,
  formatCurrency,
  formatNumber,
  validateDailyLedgerParams,
  calculateClosingBalance,
  calculateNetMovement,
  // Constants
  DEFAULT_PAGINATION,
  DAILY_LEDGER_PARAMS
};

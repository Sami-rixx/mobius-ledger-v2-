/**
 * Dashboard Service
 * API client for dashboard data and visualizations
 * Centralizes all dashboard-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for dashboard API endpoints
 */
const BASE_URL = '/dashboard';

/**
 * Get comprehensive dashboard summary
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Dashboard summary with financial, student, school fees, and transaction data
 */
export const getDashboardSummary = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get quick statistics for dashboard cards
 * @returns {Promise<Object>} - Quick stats including total students, income, expenses, net balance, withdrawals, transactions
 */
export const getQuickStats = async () => {
  return api.get(`${BASE_URL}/summary`);
};

/**
 * Get income vs expense chart data over time
 * @param {Object} params - Query parameters
 * @param {string} params.period - Period type: 'day', 'week', 'month', 'year' (default: 'month')
 * @param {number} params.limit - Number of periods to return (default: 12)
 * @returns {Promise<Object>} - Chart data with periods, periodLabel, and values
 */
export const getIncomeVsExpenseChart = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.period) queryParams.append('period', params.period);
  if (params.limit) queryParams.append('limit', params.limit);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/charts/income-expense${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get income distribution by category for pie chart
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of categories to return (default: 10)
 * @returns {Promise<Array>} - Array of income categories with amount and count
 */
export const getIncomeByCategory = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.limit) queryParams.append('limit', params.limit);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/charts/income-by-category${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get expense distribution by category for pie chart
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of categories to return (default: 10)
 * @returns {Promise<Array>} - Array of expense categories with amount and count
 */
export const getExpensesByCategory = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.limit) queryParams.append('limit', params.limit);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/charts/expenses-by-category${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get recent activity feed
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of activity items to return (default: 10)
 * @returns {Promise<Array>} - Array of recent activity items with type, description, amount, date
 */
export const getRecentActivity = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.limit) queryParams.append('limit', params.limit);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/recent-activity${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get student distribution by class
 * @returns {Promise<Array>} - Array of classes with student counts
 */
export const getStudentDistribution = async () => {
  return api.get(`${BASE_URL}/students/distribution`);
};

/**
 * Get filtered dashboard summary with date range
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Filtered dashboard summary
 */
export const getFilteredSummary = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/filtered${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Format currency value for display
 * @param {number} value - The value to format
 * @param {string} currency - Currency symbol (default: 'KES')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value, currency = 'KES', decimals = 2) => {
  const formatted = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value || 0);
  
  return formatted;
};

/**
 * Format number with commas for display
 * @param {number} value - The value to format
 * @returns {string} - Formatted number string
 */
export const formatNumber = (value) => {
  return new Intl.NumberFormat('en-KE').format(value || 0);
};

/**
 * Calculate percentage
 * @param {number} value - The value
 * @param {number} total - The total
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} - Percentage string
 */
export const calculatePercentage = (value, total, decimals = 1) => {
  if (total === 0) return '0%';
  const percentage = ((value || 0) / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Get dashboard data for a specific date range
 * @param {Object} params - Query parameters
 * @param {string} params.days - Number of days to look back (alternative to date range)
 * @param {string} params.weeks - Number of weeks to look back (alternative to date range)
 * @param {string} params.months - Number of months to look back (alternative to date range)
 * @returns {Promise<Object>} - Dashboard summary for the specified period
 */
export const getDashboardForPeriod = async (params = {}) => {
  // Calculate date range based on period parameters
  const endDate = new Date();
  let startDate = new Date();
  
  if (params.days) {
    startDate.setDate(endDate.getDate() - parseInt(params.days));
  } else if (params.weeks) {
    startDate.setDate(endDate.getDate() - parseInt(params.weeks) * 7);
  } else if (params.months) {
    startDate.setMonth(endDate.getMonth() - parseInt(params.months));
  }
  
  // Format dates as YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  return getDashboardSummary({
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  });
};

/**
 * Validation constants for dashboard parameters
 */
export const DASHBOARD_PARAMS = {
  VALID_PERIODS: ['day', 'week', 'month', 'year'],
  DEFAULT_PERIOD: 'month',
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
  DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/
};

/**
 * Validate dashboard query parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateDashboardParams = (params = {}) => {
  const errors = [];
  const validated = { ...params };
  
  if (params.period && !DASHBOARD_PARAMS.VALID_PERIODS.includes(params.period)) {
    errors.push(`Invalid period. Must be one of: ${DASHBOARD_PARAMS.VALID_PERIODS.join(', ')}`);
  }
  
  if (params.limit !== undefined) {
    const limit = parseInt(params.limit);
    if (isNaN(limit) || limit < DASHBOARD_PARAMS.MIN_LIMIT || limit > DASHBOARD_PARAMS.MAX_LIMIT) {
      errors.push(`Limit must be between ${DASHBOARD_PARAMS.MIN_LIMIT} and ${DASHBOARD_PARAMS.MAX_LIMIT}`);
    }
    validated.limit = limit;
  }
  
  if (params.startDate && !DASHBOARD_PARAMS.DATE_FORMAT.test(params.startDate)) {
    errors.push('Start date must be in YYYY-MM-DD format');
  }
  
  if (params.endDate && !DASHBOARD_PARAMS.DATE_FORMAT.test(params.endDate)) {
    errors.push('End date must be in YYYY-MM-DD format');
  }
  
  if (params.startDate && params.endDate) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    if (start > end) {
      errors.push('Start date must be before end date');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    validated
  };
};

export default {
  getDashboardSummary,
  getQuickStats,
  getIncomeVsExpenseChart,
  getIncomeByCategory,
  getExpensesByCategory,
  getRecentActivity,
  getStudentDistribution,
  getFilteredSummary,
  getDashboardForPeriod,
  formatCurrency,
  formatNumber,
  calculatePercentage,
  DASHBOARD_PARAMS,
  validateDashboardParams
};

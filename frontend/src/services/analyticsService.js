/**
 * Analytics Service
 * API client for financial analytics operations
 * Centralizes all analytics-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for analytics API endpoints
 */
const BASE_URL = '/analytics';

/**
 * Get comprehensive dashboard analytics data
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date for the dashboard data
 * @param {string} params.endDate - End date for the dashboard data
 * @returns {Promise<Object>} - Dashboard data with overall stats, trends, top items, etc.
 */
export const getDashboardData = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/dashboard${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get income vs expense comparison data
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {string} params.groupBy - Group by: 'day', 'week', 'month', 'year'
 * @returns {Promise<Array>} - Array of comparison data by period
 */
export const getIncomeVsExpense = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.groupBy) queryParams.append('groupBy', params.groupBy);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/income-vs-expense${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get income statistics by category
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {number} params.limit - Limit number of results
 * @returns {Promise<Array>} - Array of income category statistics
 */
export const getIncomeByCategory = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.limit) queryParams.append('limit', params.limit);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/income-by-category${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get expense statistics by category
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {number} params.limit - Limit number of results
 * @returns {Promise<Array>} - Array of expense category statistics
 */
export const getExpensesByCategory = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.limit) queryParams.append('limit', params.limit);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/expenses-by-category${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get top income sources
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {number} params.limit - Limit number of results (default: 10)
 * @returns {Promise<Array>} - Array of top income sources
 */
export const getTopIncomeSources = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.limit) queryParams.append('limit', params.limit);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/top-income-sources${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get top expenses by vendor
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {number} params.limit - Limit number of results (default: 10)
 * @returns {Promise<Array>} - Array of top expenses
 */
export const getTopExpenses = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.limit) queryParams.append('limit', params.limit);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/top-expenses${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get overall statistics
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Overall statistics including income, expenses, net flow, etc.
 */
export const getOverallStatistics = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/statistics${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get income trends over time
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {string} params.interval - Interval: 'day', 'week', 'month'
 * @returns {Promise<Array>} - Array of income trend data points
 */
export const getIncomeTrends = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.interval) queryParams.append('interval', params.interval);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/income-trends${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get expense trends over time
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {string} params.interval - Interval: 'day', 'week', 'month'
 * @returns {Promise<Array>} - Array of expense trend data points
 */
export const getExpenseTrends = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.interval) queryParams.append('interval', params.interval);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/expense-trends${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get net cash flow trends over time
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {string} params.interval - Interval: 'day', 'week', 'month'
 * @returns {Promise<Array>} - Array of net flow trend data points
 */
export const getNetFlowTrends = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.interval) queryParams.append('interval', params.interval);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/net-flow${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get recent daily summaries
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Limit number of results
 * @returns {Promise<Array>} - Array of recent daily summary records
 */
export const getRecentDailySummaries = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.limit) queryParams.append('limit', params.limit);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/daily-summaries${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get daily summary statistics
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Daily summary statistics
 */
export const getDailySummaryStatistics = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/summary-statistics${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

// Export all functions
export default {
  getDashboardData,
  getIncomeVsExpense,
  getIncomeByCategory,
  getExpensesByCategory,
  getTopIncomeSources,
  getTopExpenses,
  getOverallStatistics,
  getIncomeTrends,
  getExpenseTrends,
  getNetFlowTrends,
  getRecentDailySummaries,
  getDailySummaryStatistics
};

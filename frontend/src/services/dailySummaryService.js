/**
 * Daily Summary Service
 * API client for daily financial summary operations
 * Centralizes all daily summary-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for daily summary API endpoints
 */
const BASE_URL = '/daily-summaries';

/**
 * Get paginated list of daily summaries
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {string} params.startDate - Filter by start date (YYYY-MM-DD)
 * @param {string} params.endDate - Filter by end date (YYYY-MM-DD)
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - Paginated result with daily summaries and metadata
 */
export const getDailySummaries = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get all daily summaries without pagination
 * @returns {Promise<Array>} - Array of all daily summary records
 */
export const getAllDailySummaries = async () => {
  return api.get(`${BASE_URL}/all`);
};

/**
 * Get a daily summary by date
 * @param {string} date - Summary date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Daily summary record
 */
export const getDailySummaryByDate = async (date) => {
  return api.get(`${BASE_URL}/date/${date}`);
};

/**
 * Get a daily summary by ID
 * @param {number} id - Daily summary ID
 * @returns {Promise<Object>} - Daily summary record
 */
export const getDailySummaryById = async (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Get the most recent daily summary
 * @returns {Promise<Object>} - Most recent daily summary record
 */
export const getLatestDailySummary = async () => {
  return api.get(`${BASE_URL}/latest`);
};

/**
 * Get daily summaries by date range
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of daily summaries in the date range
 */
export const getDailySummariesByDateRange = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/range${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get daily summaries by month
 * @param {string} year - Year (YYYY)
 * @param {string} month - Month (MM, 1-12)
 * @returns {Promise<Array>} - Array of daily summaries for the month
 */
export const getDailySummariesByMonth = async (year, month) => {
  return api.get(`${BASE_URL}/month/${year}/${month}`);
};

/**
 * Get daily summaries by week
 * @param {string} startDate - Start of week (YYYY-MM-DD, typically Monday)
 * @returns {Promise<Array>} - Array of daily summaries for the week
 */
export const getDailySummariesByWeek = async (startDate) => {
  return api.get(`${BASE_URL}/week/${startDate}`);
};

/**
 * Generate daily summary for a specific date (GET)
 * @param {string} date - Date to generate summary for (YYYY-MM-DD)
 * @returns {Promise<Object>} - Generated daily summary data
 */
export const generateDailySummary = async (date) => {
  return api.get(`${BASE_URL}/generate/${date}`);
};

/**
 * Get daily summary statistics
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Summary statistics
 */
export const getDailySummaryStatistics = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/statistics${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get weekly summary
 * @param {string} startDate - Start of week (YYYY-MM-DD)
 * @returns {Promise<Object>} - Weekly summary data
 */
export const getWeeklySummary = async (startDate) => {
  return api.get(`${BASE_URL}/weekly/${startDate}`);
};

/**
 * Get monthly summary
 * @param {string} year - Year (YYYY)
 * @param {string} month - Month (MM, 1-12)
 * @returns {Promise<Object>} - Monthly summary data
 */
export const getMonthlySummary = async (year, month) => {
  return api.get(`${BASE_URL}/monthly/${year}/${month}`);
};

/**
 * Generate and save daily summary for a specific date
 * @param {string} date - Date to generate and save (YYYY-MM-DD)
 * @returns {Promise<Object>} - Saved daily summary record
 */
export const generateAndSaveDailySummary = async (date) => {
  return api.post(`${BASE_URL}/generate/${date}`);
};

/**
 * Generate daily summaries for a date range
 * @param {Object} data - Generation parameters
 * @param {string} data.startDate - Start date (YYYY-MM-DD)
 * @param {string} data.endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of generated daily summaries
 */
export const generateDailySummariesForRange = async (data = {}) => {
  return api.post(`${BASE_URL}/generate-range`, data);
};

/**
 * Create a daily summary record directly
 * @param {Object} summaryData - Daily summary data
 * @param {string} summaryData.summary_date - Summary date (YYYY-MM-DD) (required)
 * @param {number} summaryData.total_income - Total income for the day (required)
 * @param {number} summaryData.income_count - Number of income records (required)
 * @param {number} summaryData.total_expenses - Total expenses for the day (required)
 * @param {number} summaryData.expense_count - Number of expense records (required)
 * @param {number} summaryData.net_flow - Net flow (income - expenses) (required)
 * @param {number} summaryData.transaction_count - Total transaction count (required)
 * @returns {Promise<Object>} - Created daily summary record with ID
 */
export const createDailySummary = async (summaryData) => {
  return api.post(BASE_URL, summaryData);
};

/**
 * Update a daily summary record
 * @param {number} id - Daily summary ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated daily summary record
 */
export const updateDailySummary = async (id, updates) => {
  return api.put(`${BASE_URL}/${id}`, updates);
};

/**
 * Delete a daily summary record
 * @param {number} id - Daily summary ID
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteDailySummary = async (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

// Export all functions
export default {
  getDailySummaries,
  getAllDailySummaries,
  getDailySummaryByDate,
  getDailySummaryById,
  getLatestDailySummary,
  getDailySummariesByDateRange,
  getDailySummariesByMonth,
  getDailySummariesByWeek,
  generateDailySummary,
  getDailySummaryStatistics,
  getWeeklySummary,
  getMonthlySummary,
  generateAndSaveDailySummary,
  generateDailySummariesForRange,
  createDailySummary,
  updateDailySummary,
  deleteDailySummary
};

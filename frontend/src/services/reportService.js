/**
 * Report Service
 * API client for report management operations
 * Centralizes all report-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for report API endpoints
 */
const BASE_URL = '/reports';

/**
 * Get paginated list of reports
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {string} params.search - Search term
 * @param {string} params.reportType - Filter by report type
 * @param {string} params.startDate - Filter by start date
 * @param {string} params.endDate - Filter by end date
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - Paginated result with reports and metadata
 */
export const getReports = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.search) queryParams.append('search', params.search);
  if (params.reportType) queryParams.append('reportType', params.reportType);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get all reports without pagination
 * @returns {Promise<Array>} - Array of all report records
 */
export const getAllReports = async () => {
  return api.get(`${BASE_URL}/all`);
};

/**
 * Get a single report by ID
 * @param {number} id - Report ID
 * @returns {Promise<Object>} - Report object
 */
export const getReportById = async (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Get reports by type
 * @param {string} reportType - Report type (e.g., 'daily_summary', 'monthly_summary', 'income_expense', etc.)
 * @param {Object} params - Query parameters for pagination
 * @returns {Promise<Object>} - Paginated result with reports of the specified type
 */
export const getReportsByType = async (reportType, params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/type/${reportType}${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get the latest report of a specific type
 * @param {string} reportType - Report type
 * @returns {Promise<Object>} - Latest report of the specified type
 */
export const getLatestReportByType = async (reportType) => {
  return api.get(`${BASE_URL}/latest/${reportType}`);
};

/**
 * Get report statistics
 * @returns {Promise<Object>} - Report statistics
 */
export const getReportStatistics = async () => {
  return api.get(`${BASE_URL}/statistics`);
};

/**
 * Search reports
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {string} params.reportType - Filter by report type
 * @param {string} params.startDate - Filter by start date
 * @param {string} params.endDate - Filter by end date
 * @returns {Promise<Object>} - Search results
 */
export const searchReports = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.query) queryParams.append('query', params.query);
  if (params.reportType) queryParams.append('reportType', params.reportType);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/search${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Generate a daily summary report
 * @param {Object} data - Report generation parameters
 * @param {string} data.date - Date for the report (YYYY-MM-DD)
 * @param {string} data.title - Report title (optional)
 * @param {string} data.description - Report description (optional)
 * @returns {Promise<Object>} - Generated report
 */
export const generateDailySummaryReport = async (data = {}) => {
  return api.post(`${BASE_URL}/daily`, data);
};

/**
 * Generate a date range summary report
 * @param {Object} data - Report generation parameters
 * @param {string} data.startDate - Start date (YYYY-MM-DD)
 * @param {string} data.endDate - End date (YYYY-MM-DD)
 * @param {string} data.title - Report title (optional)
 * @param {string} data.description - Report description (optional)
 * @returns {Promise<Object>} - Generated report
 */
export const generateDateRangeReport = async (data = {}) => {
  return api.post(`${BASE_URL}/range`, data);
};

/**
 * Generate an income vs expense comparison report
 * @param {Object} data - Report generation parameters
 * @param {string} data.startDate - Start date (YYYY-MM-DD)
 * @param {string} data.endDate - End date (YYYY-MM-DD)
 * @param {string} data.groupBy - Group by: 'day', 'week', 'month', 'year'
 * @param {string} data.title - Report title (optional)
 * @param {string} data.description - Report description (optional)
 * @returns {Promise<Object>} - Generated report
 */
export const generateIncomeVsExpenseReport = async (data = {}) => {
  return api.post(`${BASE_URL}/income-expense`, data);
};

/**
 * Generate a category summary report
 * @param {Object} data - Report generation parameters
 * @param {string} data.startDate - Start date (YYYY-MM-DD)
 * @param {string} data.endDate - End date (YYYY-MM-DD)
 * @param {string} data.categoryType - Category type: 'income', 'expense', 'both'
 * @param {string} data.title - Report title (optional)
 * @param {string} data.description - Report description (optional)
 * @returns {Promise<Object>} - Generated report
 */
export const generateCategorySummaryReport = async (data = {}) => {
  return api.post(`${BASE_URL}/category-summary`, data);
};

/**
 * Create a report record directly
 * @param {Object} reportData - Report data
 * @param {string} reportData.report_type - Report type (required)
 * @param {string} reportData.title - Report title (required)
 * @param {string} reportData.description - Report description
 * @param {Object} reportData.parameters - Report generation parameters
 * @param {Object} reportData.report_data - Report data (can be large JSON)
 * @param {string} reportData.file_path - Path to generated file (if any)
 * @param {number} reportData.generated_by - User ID who generated the report
 * @returns {Promise<Object>} - Created report record
 */
export const createReport = async (reportData) => {
  return api.post(BASE_URL, reportData);
};

/**
 * Update a report record
 * @param {number} id - Report ID
 * @param {Object} reportData - Updated report data
 * @returns {Promise<Object>} - Updated report record
 */
export const updateReport = async (id, reportData) => {
  return api.put(`${BASE_URL}/${id}`, reportData);
};

/**
 * Delete a report record
 * @param {number} id - Report ID
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteReport = async (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

// Export all functions
export default {
  getReports,
  getAllReports,
  getReportById,
  getReportsByType,
  getLatestReportByType,
  getReportStatistics,
  searchReports,
  generateDailySummaryReport,
  generateDateRangeReport,
  generateIncomeVsExpenseReport,
  generateCategorySummaryReport,
  createReport,
  updateReport,
  deleteReport
};

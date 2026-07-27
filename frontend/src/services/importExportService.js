/**
 * Import/Export Service
 * API client for data import and export operations
 * Centralizes all import/export-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for import/export API endpoints
 */
const BASE_URL = '/import-export';

/**
 * Default pagination parameters
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: 20
};

/**
 * Validation constants for import/export parameters
 */
export const IMPORT_EXPORT_PARAMS = {
  TABLE_NAME_REGEX: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  FILE_NAME_REGEX: /^[a-zA-Z0-9_-]+\.(sql|csv|json|txt)$/,
  DATE_REGEX: /^\d{4}-\d{2}-\d{2}$/,
  ACTION_TYPES: ['export', 'import', 'backup', 'restore'],
  EXPORT_FORMATS: ['csv', 'sql', 'json'],
  MIN_RECORD_COUNT: 0,
  MAX_RECORD_COUNT: 1000000
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
  const num = Number(amount);
  if (isNaN(num)) return 'KSh 0.00';
  return `KSh ${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/**
 * Format number with commas
 * @param {number} value - Number to format
 * @returns {string} - Formatted number string
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Validate import/export parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} - Validation result with valid flag and errors
 */
export const validateImportExportParams = (params = {}) => {
  const errors = [];
  const validated = {};

  // Validate table name
  if (params.tableName !== undefined) {
    if (!IMPORT_EXPORT_PARAMS.TABLE_NAME_REGEX.test(params.tableName)) {
      errors.push(`Invalid table name: ${params.tableName}`);
    } else {
      validated.tableName = params.tableName;
    }
  }

  // Validate filename
  if (params.filename !== undefined) {
    if (!IMPORT_EXPORT_PARAMS.FILE_NAME_REGEX.test(params.filename)) {
      errors.push(`Invalid filename: ${params.filename}`);
    } else {
      validated.filename = params.filename;
    }
  }

  // Validate page
  if (params.page !== undefined) {
    const page = parseInt(params.page, 10);
    if (isNaN(page) || page < 1) {
      errors.push('Page must be a positive integer');
    } else {
      validated.page = page;
    }
  }

  // Validate page size
  if (params.pageSize !== undefined) {
    const pageSize = parseInt(params.pageSize, 10);
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      errors.push('Page size must be between 1 and 100');
    } else {
      validated.pageSize = pageSize;
    }
  }

  // Validate date range
  if (params.startDate !== undefined) {
    if (!IMPORT_EXPORT_PARAMS.DATE_REGEX?.test(params.startDate)) {
      errors.push(`Invalid start date format: ${params.startDate}`);
    } else {
      validated.startDate = params.startDate;
    }
  }

  if (params.endDate !== undefined) {
    if (!IMPORT_EXPORT_PARAMS.DATE_REGEX?.test(params.endDate)) {
      errors.push(`Invalid end date format: ${params.endDate}`);
    } else {
      validated.endDate = params.endDate;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    ...validated
  };
};

/**
 * Get all import/export logs with pagination
 * @param {Object} params - Query parameters (page, pageSize, type, action, status, startDate, endDate)
 * @returns {Promise} - Promise resolving to logs data
 */
export const getImportExportLogs = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('limit', params.pageSize);
    if (params.type) queryParams.append('type', params.type);
    if (params.action) queryParams.append('action', params.action);
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.tableName) queryParams.append('tableName', params.tableName);

    const response = await api.get(`${BASE_URL}/logs`, { params: queryParams });
    return response.data;
  } catch (error) {
    console.error('Error fetching import/export logs:', error);
    throw error;
  }
};

/**
 * Get import/export log count
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise} - Promise resolving to count data
 */
export const getImportExportLogCount = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.type) queryParams.append('type', params.type);
    if (params.action) queryParams.append('action', params.action);
    if (params.status) queryParams.append('status', params.status);
    if (params.tableName) queryParams.append('tableName', params.tableName);

    const response = await api.get(`${BASE_URL}/logs/count`, { params: queryParams });
    return response.data;
  } catch (error) {
    console.error('Error fetching import/export log count:', error);
    throw error;
  }
};

/**
 * Get import/export log by ID
 * @param {number} id - Log ID
 * @returns {Promise} - Promise resolving to log data
 */
export const getImportExportLogById = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/logs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching import/export log ${id}:`, error);
    throw error;
  }
};

/**
 * Get import/export statistics
 * @returns {Promise} - Promise resolving to statistics data
 */
export const getImportExportStatistics = async () => {
  try {
    const response = await api.get(`${BASE_URL}/statistics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching import/export statistics:', error);
    throw error;
  }
};

/**
 * Export database to SQL file
 * @param {Object} options - Export options (filename)
 * @returns {Promise} - Promise resolving to export result
 */
export const exportDatabase = async (options = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (options.filename) queryParams.append('filename', options.filename);
    
    const response = await api.get(`${BASE_URL}/database/export`, { 
      params: queryParams,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting database:', error);
    throw error;
  }
};

/**
 * Import database from SQL file
 * @param {Object} data - Import data (filepath)
 * @returns {Promise} - Promise resolving to import result
 */
export const importDatabase = async (data) => {
  try {
    const response = await api.post(`${BASE_URL}/database/import`, data);
    return response.data;
  } catch (error) {
    console.error('Error importing database:', error);
    throw error;
  }
};

/**
 * Export table to CSV
 * @param {Object} options - Export options (tableName, filename)
 * @returns {Promise} - Promise resolving to export result
 */
export const exportToCSV = async (options = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (options.tableName) queryParams.append('tableName', options.tableName);
    if (options.filename) queryParams.append('filename', options.filename);
    
    const response = await api.get(`${BASE_URL}/csv/export`, { 
      params: queryParams,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
};

/**
 * Import data from CSV
 * @param {Object} data - Import data (tableName, filepath)
 * @returns {Promise} - Promise resolving to import result
 */
export const importFromCSV = async (data) => {
  try {
    const response = await api.post(`${BASE_URL}/csv/import`, data);
    return response.data;
  } catch (error) {
    console.error('Error importing from CSV:', error);
    throw error;
  }
};

/**
 * Create database backup
 * @param {Object} data - Backup data (filename)
 * @returns {Promise} - Promise resolving to backup result
 */
export const createBackup = async (data = {}) => {
  try {
    const response = await api.post(`${BASE_URL}/backup`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

/**
 * Restore database from backup
 * @param {Object} data - Restore data (filename)
 * @returns {Promise} - Promise resolving to restore result
 */
export const restoreBackup = async (data) => {
  try {
    const response = await api.post(`${BASE_URL}/restore`, data);
    return response.data;
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
};

/**
 * List all backup files
 * @returns {Promise} - Promise resolving to list of backups
 */
export const listBackups = async () => {
  try {
    const response = await api.get(`${BASE_URL}/backups`);
    return response.data;
  } catch (error) {
    console.error('Error listing backups:', error);
    throw error;
  }
};

/**
 * List all export files
 * @returns {Promise} - Promise resolving to list of exports
 */
export const listExports = async () => {
  try {
    const response = await api.get(`${BASE_URL}/exports`);
    return response.data;
  } catch (error) {
    console.error('Error listing exports:', error);
    throw error;
  }
};

/**
 * Delete a backup file
 * @param {string} filename - Backup filename
 * @returns {Promise} - Promise resolving to deletion result
 */
export const deleteBackup = async (filename) => {
  try {
    const response = await api.delete(`${BASE_URL}/backups/${filename}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting backup ${filename}:`, error);
    throw error;
  }
};

/**
 * Delete an export file
 * @param {string} filename - Export filename
 * @returns {Promise} - Promise resolving to deletion result
 */
export const deleteExport = async (filename) => {
  try {
    const response = await api.delete(`${BASE_URL}/exports/${filename}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting export ${filename}:`, error);
    throw error;
  }
};

/**
 * Get supported tables for export/import
 * @returns {Promise} - Promise resolving to list of supported tables
 */
export const getSupportedTables = async () => {
  try {
    const response = await api.get(`${BASE_URL}/tables`);
    return response.data;
  } catch (error) {
    console.error('Error fetching supported tables:', error);
    throw error;
  }
};

/**
 * Export data for a specific date range
 * @param {Object} params - Export parameters
 * @returns {Promise} - Promise resolving to export result
 */
export const exportForPeriod = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.tableName) queryParams.append('tableName', params.tableName);
    
    const response = await api.get(`${BASE_URL}/database/export`, { 
      params: queryParams,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting for period:', error);
    throw error;
  }
};

/**
 * Trigger automatic backup with timestamp
 * @returns {Promise} - Promise resolving to backup result
 */
export const createTimestampedBackup = async () => {
  try {
    const timestamp = formatDate(new Date()).replace(/-/g, '') + '_' + new Date().toTimeString().replace(/:/g, '').substring(0, 6);
    const filename = `backup_${timestamp}.sql`;
    
    const response = await api.post(`${BASE_URL}/backup`, { filename });
    return response.data;
  } catch (error) {
    console.error('Error creating timestamped backup:', error);
    throw error;
  }
};

/**
 * Download a file from the server
 * @param {string} url - File URL
 * @param {string} filename - Local filename
 * @returns {Promise} - Promise resolving to download result
 */
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob'
    });
    
    // In browser environment, create a download link
    if (typeof window !== 'undefined') {
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error downloading file ${filename}:`, error);
    throw error;
  }
};

/**
 * Get recent import/export activity
 * @param {number} limit - Number of recent items to fetch
 * @returns {Promise} - Promise resolving to recent activity
 */
export const getRecentActivity = async (limit = 10) => {
  try {
    const response = await api.get(`${BASE_URL}/logs`, {
      params: { limit, page: 1 }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
};

/**
 * Export all financial data (transactions, income, expenses)
 * @param {Object} options - Export options
 * @returns {Promise} - Promise resolving to export result
 */
export const exportFinancialData = async (options = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (options.filename) queryParams.append('filename', options.filename);
    if (options.tableName) queryParams.append('tableName', options.tableName);
    
    const response = await api.get(`${BASE_URL}/database/export`, { 
      params: queryParams,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting financial data:', error);
    throw error;
  }
};

export default {
  // Base URL
  BASE_URL,
  
  // Constants
  DEFAULT_PAGINATION,
  IMPORT_EXPORT_PARAMS,
  
  // Utility functions
  formatDate,
  formatCurrency,
  formatNumber,
  formatFileSize,
  validateImportExportParams,
  
  // Log functions
  getImportExportLogs,
  getImportExportLogCount,
  getImportExportLogById,
  getImportExportStatistics,
  getRecentActivity,
  
  // Database functions
  exportDatabase,
  importDatabase,
  
  // CSV functions
  exportToCSV,
  importFromCSV,
  
  // Backup functions
  createBackup,
  restoreBackup,
  listBackups,
  deleteBackup,
  createTimestampedBackup,
  
  // Export file functions
  listExports,
  deleteExport,
  
  // Table functions
  getSupportedTables,
  
  // Utility functions
  exportForPeriod,
  downloadFile,
  exportFinancialData
};

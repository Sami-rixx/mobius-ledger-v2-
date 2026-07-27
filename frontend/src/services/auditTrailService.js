/**
 * Audit Trail Service
 * API client for audit trail endpoints
 * 
 * Provides:
 * - CRUD operations for audit trail entries
 * - Pagination support
 * - Filtering by action, table, record, user, date range
 * - Statistics
 * - Financial action logging
 */

import { api } from './api.js';

// Base URL for audit trail endpoints
const BASE_URL = '/api/audit-trail';

// Valid action types
export const AUDIT_ACTIONS = ['CREATE', 'UPDATE', 'DELETE'];

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Get paginated list of audit trail entries
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @param {string} params.action - Filter by action type
 * @param {string} params.tableName - Filter by table name
 * @param {number} params.recordId - Filter by record ID
 * @param {number} params.userId - Filter by user ID
 * @param {string} params.startDate - Filter by start date
 * @param {string} params.endDate - Filter by end date
 * @param {string} params.search - Search term
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - API response with data and pagination
 */
export const getAuditTrails = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.action) queryParams.append('action', params.action);
  if (params.tableName) queryParams.append('tableName', params.tableName);
  if (params.recordId !== undefined) queryParams.append('recordId', params.recordId);
  if (params.userId !== undefined) queryParams.append('userId', params.userId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.search) queryParams.append('search', params.search);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching audit trails:', error);
    throw error;
  }
};

/**
 * Get audit trail count
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - API response with count
 */
export const getAuditTrailCount = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.action) queryParams.append('action', params.action);
  if (params.tableName) queryParams.append('tableName', params.tableName);
  if (params.recordId !== undefined) queryParams.append('recordId', params.recordId);
  if (params.userId !== undefined) queryParams.append('userId', params.userId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/count${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching audit trail count:', error);
    throw error;
  }
};

/**
 * Get a single audit trail entry by ID
 * @param {number} id - Audit trail entry ID
 * @returns {Promise<Object>} - API response with audit trail data
 */
export const getAuditTrailById = async (id) => {
  if (!id) {
    throw new Error('Audit trail ID is required');
  }
  
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching audit trail by ID:', error);
    throw error;
  }
};

/**
 * Get audit trail entries for a specific record
 * @param {string} tableName - Table name
 * @param {number} recordId - Record ID
 * @returns {Promise<Object>} - API response with audit trail entries
 */
export const getAuditTrailsByRecord = async (tableName, recordId) => {
  if (!tableName || !recordId) {
    throw new Error('Table name and record ID are required');
  }
  
  try {
    const response = await api.get(`${BASE_URL}/record/${encodeURIComponent(tableName)}/${recordId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching audit trails by record:', error);
    throw error;
  }
};

/**
 * Get audit trail entries for a specific table
 * @param {string} tableName - Table name
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @returns {Promise<Object>} - API response with audit trail entries and pagination
 */
export const getAuditTrailsByTable = async (tableName, params = {}) => {
  if (!tableName) {
    throw new Error('Table name is required');
  }
  
  const queryParams = new URLSearchParams();
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/table/${encodeURIComponent(tableName)}${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching audit trails by table:', error);
    throw error;
  }
};

/**
 * Get recent audit trail entries
 * @param {number} limit - Number of entries to return
 * @returns {Promise<Object>} - API response with recent audit trail entries
 */
export const getRecentAuditTrails = async (limit = 20) => {
  try {
    const response = await api.get(`${BASE_URL}/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent audit trails:', error);
    throw error;
  }
};

/**
 * Create a new audit trail entry
 * @param {Object} data - Audit trail data
 * @returns {Promise<Object>} - API response with created audit trail entry
 */
export const createAuditTrail = async (data) => {
  if (!data) {
    throw new Error('Audit trail data is required');
  }
  
  try {
    const response = await api.post(BASE_URL, data);
    return response.data;
  } catch (error) {
    console.error('Error creating audit trail:', error);
    throw error;
  }
};

/**
 * Delete an audit trail entry
 * @param {number} id - Audit trail entry ID
 * @returns {Promise<Object>} - API response with success status
 */
export const deleteAuditTrail = async (id) => {
  if (!id) {
    throw new Error('Audit trail ID is required');
  }
  
  try {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting audit trail:', error);
    throw error;
  }
};

/**
 * Search audit trail entries
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} - API response with search results and pagination
 */
export const searchAuditTrails = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.action) queryParams.append('action', params.action);
  if (params.tableName) queryParams.append('tableName', params.tableName);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.search) queryParams.append('search', params.search);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/search${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error searching audit trails:', error);
    throw error;
  }
};

/**
 * Get audit trail statistics
 * @param {Object} params - Filter parameters
 * @returns {Promise<Object>} - API response with statistics
 */
export const getAuditTrailStatistics = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.tableName) queryParams.append('tableName', params.tableName);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/stats${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching audit trail statistics:', error);
    throw error;
  }
};

/**
 * Log a financial action to audit trail
 * @param {string} action - Action type (CREATE, UPDATE, DELETE)
 * @param {string} tableName - Table name
 * @param {number} recordId - Record ID
 * @param {Object} oldValues - Old values (for UPDATE/DELETE)
 * @param {Object} newValues - New values (for CREATE/UPDATE)
 * @param {Object} userContext - User context (userId, ipAddress, userAgent)
 * @returns {Promise<Object>} - API response with audit trail result
 */
export const logFinancialAction = async (action, tableName, recordId, oldValues, newValues, userContext = {}) => {
  if (!action || !tableName || !recordId) {
    throw new Error('Action, table name, and record ID are required');
  }
  
  const data = {
    action,
    tableName,
    recordId,
    oldValues,
    newValues,
    ...userContext
  };
  
  try {
    const response = await api.post(`${BASE_URL}/log-financial`, data);
    return response.data;
  } catch (error) {
    console.error('Error logging financial action:', error);
    throw error;
  }
};

/**
 * Get label for audit action
 * @param {string} action - Action type
 * @returns {string} - Display label
 */
export const getAuditActionLabel = (action) => {
  const labels = {
    CREATE: 'Created',
    UPDATE: 'Updated',
    DELETE: 'Deleted'
  };
  return labels[action] || action;
};

/**
 * Get color for audit action
 * @param {string} action - Action type
 * @returns {string} - CSS color class
 */
export const getAuditActionColor = (action) => {
  const colors = {
    CREATE: 'success',
    UPDATE: 'warning',
    DELETE: 'danger'
  };
  return colors[action] || 'secondary';
};

/**
 * Format audit trail entry for display
 * @param {Object} auditTrail - Audit trail entry
 * @returns {Object} - Formatted audit trail entry
 */
export const formatAuditTrail = (auditTrail) => {
  if (!auditTrail) return null;
  
  return {
    ...auditTrail,
    actionLabel: getAuditActionLabel(auditTrail.action),
    actionColor: getAuditActionColor(auditTrail.action),
    oldValues: auditTrail.old_values ? JSON.parse(auditTrail.old_values) : null,
    newValues: auditTrail.new_values ? JSON.parse(auditTrail.new_values) : null
  };
};

/**
 * Filter audit trails by date range
 * @param {Array} auditTrails - Array of audit trail entries
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array} - Filtered audit trail entries
 */
export const filterAuditTrailsByDateRange = (auditTrails, startDate, endDate) => {
  if (!auditTrails || auditTrails.length === 0) return [];
  
  return auditTrails.filter(trail => {
    const trailDate = trail.created_at?.split('T')[0];
    if (!trailDate) return true;
    
    if (startDate && trailDate < startDate) return false;
    if (endDate && trailDate > endDate) return false;
    return true;
  });
};

export default {
  getAuditTrails,
  getAuditTrailCount,
  getAuditTrailById,
  getAuditTrailsByRecord,
  getAuditTrailsByTable,
  getRecentAuditTrails,
  createAuditTrail,
  deleteAuditTrail,
  searchAuditTrails,
  getAuditTrailStatistics,
  logFinancialAction,
  getAuditActionLabel,
  getAuditActionColor,
  formatAuditTrail,
  filterAuditTrailsByDateRange,
  AUDIT_ACTIONS
};

/**
 * AuditTrail Service
 * Business logic layer for audit trail operations
 * 
 * Handles:
 * - Audit trail validation
 * - Business rule enforcement
 * - Data transformation
 * - Pagination
 * - Advanced filtering and search
 */

import {
  getAllAuditTrails as getAllAuditTrailsModel,
  getAuditTrailCount as getAuditTrailCountModel,
  getAuditTrailById as getAuditTrailByIdModel,
  getAuditTrailByRecord as getAuditTrailByRecordModel,
  getAuditTrailByTable as getAuditTrailByTableModel,
  getRecentAuditTrails as getRecentAuditTrailsModel,
  createAuditTrail as createAuditTrailModel,
  deleteAuditTrail as deleteAuditTrailModel,
  getAuditTrailStatistics as getAuditTrailStatisticsModel
} from '../models/AuditTrail.js';

// Valid action types
const VALID_ACTIONS = ['CREATE', 'UPDATE', 'DELETE'];

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Validate audit trail data
 * @param {Object} data - Audit trail data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateAuditTrail = (data) => {
  const errors = [];
  
  // Required fields
  if (!data.action) {
    errors.push('Action is required');
  } else if (!VALID_ACTIONS.includes(data.action)) {
    errors.push(`Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`);
  }
  
  if (!data.tableName) {
    errors.push('Table name is required');
  } else if (typeof data.tableName !== 'string') {
    errors.push('Table name must be a string');
  }
  
  if (data.recordId === undefined || data.recordId === null) {
    errors.push('Record ID is required');
  } else if (isNaN(parseInt(data.recordId))) {
    errors.push('Record ID must be a valid number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get paginated audit trails with optional filtering
 * @param {Object} options - Filter and pagination options
 * @param {number} options.page - Page number
 * @param {number} options.pageSize - Items per page
 * @param {string} options.action - Filter by action type
 * @param {string} options.tableName - Filter by table name
 * @param {number} options.recordId - Filter by record ID
 * @param {number} options.userId - Filter by user ID
 * @param {string} options.startDate - Filter by start date
 * @param {string} options.endDate - Filter by end date
 * @param {string} options.search - Search term
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction
 * @returns {Object} - Paginated result with data and pagination info
 */
export const getPaginatedAuditTrails = (options = {}) => {
  const {
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    action,
    tableName,
    recordId,
    userId,
    startDate,
    endDate,
    search,
    orderBy,
    orderDir
  } = options;
  
  const offset = (page - 1) * pageSize;
  
  // Build filter options for model
  const filterOptions = {
    action,
    tableName,
    recordId,
    userId,
    startDate,
    endDate,
    orderBy: orderBy || 'created_at',
    orderDir: orderDir || 'DESC',
    limit: pageSize,
    offset
  };
  
  // Apply search if provided
  if (search) {
    // For now, search is handled by filtering
    if (!tableName) {
      filterOptions.tableName = search;
    }
  }
  
  const auditTrails = getAllAuditTrailsModel(filterOptions);
  const total = getAuditTrailCountModel(filterOptions);
  
  const pagination = {
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    total,
    totalPages: Math.ceil(total / pageSize),
    hasNextPage: offset + pageSize < total,
    hasPrevPage: page > 1
  };
  
  return { data: auditTrails, pagination };
};

/**
 * Get a single audit trail entry by ID with validation
 * @param {number} id - Audit trail entry ID
 * @returns {Object|null} - Audit trail entry or null
 */
export const getAuditTrail = (id) => {
  if (!id || isNaN(id)) {
    return null;
  }
  return getAuditTrailByIdModel(id);
};

/**
 * Get audit trail entries for a specific record
 * @param {string} tableName - Table name
 * @param {number} recordId - Record ID
 * @returns {Array} - Array of audit trail entries
 */
export const getAuditTrailsByRecord = (tableName, recordId) => {
  if (!tableName || !recordId || isNaN(recordId)) {
    return [];
  }
  return getAuditTrailByRecordModel(tableName, recordId);
};

/**
 * Get audit trail entries for a specific table
 * @param {string} tableName - Table name
 * @param {Object} options - Pagination options
 * @returns {Array} - Array of audit trail entries
 */
export const getAuditTrailsByTable = (tableName, options = {}) => {
  if (!tableName) {
    return [];
  }
  
  const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = options;
  const offset = (page - 1) * pageSize;
  
  const auditTrails = getAuditTrailByTableModel(tableName, {
    limit: pageSize,
    offset
  });
  
  const total = getAuditTrailCountModel({ tableName });
  
  const pagination = {
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    total,
    totalPages: Math.ceil(total / pageSize),
    hasNextPage: offset + pageSize < total,
    hasPrevPage: page > 1
  };
  
  return { data: auditTrails, pagination };
};

/**
 * Get recent audit trail entries
 * @param {number} limit - Number of entries to return
 * @returns {Array} - Array of recent audit trail entries
 */
export const getRecentAuditTrails = (limit = 20) => {
  return getRecentAuditTrailsModel(limit);
};

/**
 * Create a new audit trail entry
 * @param {Object} data - Audit trail data
 * @param {Object} userContext - User context for audit fields
 * @returns {Object} - Created audit trail entry or error
 */
export const createAuditTrailRecord = (data, userContext = {}) => {
  // Validate data
  const validation = validateAuditTrail(data);
  if (!validation.isValid) {
    return { success: false, error: validation.errors.join(', ') };
  }
  
  // Set user context fields
  const auditData = {
    ...data,
    userId: userContext.userId || data.userId,
    ipAddress: userContext.ipAddress || data.ipAddress,
    userAgent: userContext.userAgent || data.userAgent
  };
  
  try {
    const auditTrail = createAuditTrailModel(auditData);
    return { success: true, data: auditTrail };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete an audit trail entry
 * @param {number} id - Audit trail entry ID
 * @returns {Object} - Success status
 */
export const deleteAuditTrailRecord = (id) => {
  if (!id || isNaN(id)) {
    return { success: false, error: 'Invalid audit trail ID' };
  }
  
  try {
    const existing = getAuditTrailByIdModel(id);
    if (!existing) {
      return { success: false, error: 'Audit trail entry not found' };
    }
    
    const deleted = deleteAuditTrailModel(id);
    return { success: deleted, data: deleted ? existing : null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Search audit trails
 * @param {Object} options - Search options
 * @returns {Object} - Paginated search results
 */
export const searchAuditTrails = (options = {}) => {
  // For now, delegate to getPaginatedAuditTrails with search parameter
  return getPaginatedAuditTrails(options);
};

/**
 * Get audit trail statistics
 * @param {Object} options - Filter options
 * @returns {Object} - Statistics
 */
export const getAuditTrailStats = (options = {}) => {
  return getAuditTrailStatisticsModel(options);
};

/**
 * Get audit trail count by filter
 * @param {Object} options - Filter options
 * @returns {number} - Count
 */
export const getAuditTrailCountByFilter = (options = {}) => {
  return getAuditTrailCountModel(options);
};

/**
 * Log a financial action to audit trail
 * @param {string} action - Action type (CREATE, UPDATE, DELETE)
 * @param {string} tableName - Table name
 * @param {number} recordId - Record ID
 * @param {Object} oldValues - Old values (for UPDATE/DELETE)
 * @param {Object} newValues - New values (for CREATE/UPDATE)
 * @param {Object} userContext - User context
 * @returns {Object} - Audit trail result
 */
export const logFinancialAction = (action, tableName, recordId, oldValues, newValues, userContext = {}) => {
  // Validate action
  if (!VALID_ACTIONS.includes(action)) {
    return { success: false, error: `Invalid action: ${action}` };
  }
  
  // Validate table name
  if (!tableName) {
    return { success: false, error: 'Table name is required' };
  }
  
  // Validate record ID
  if (!recordId || isNaN(recordId)) {
    return { success: false, error: 'Record ID is required' };
  }
  
  // Create audit trail entry
  try {
    const auditData = {
      action,
      tableName,
      recordId: parseInt(recordId),
      oldValues: oldValues || null,
      newValues: newValues || null,
      userId: userContext.userId,
      ipAddress: userContext.ipAddress,
      userAgent: userContext.userAgent
    };
    
    return createAuditTrailRecord(auditData, userContext);
  } catch (error) {
    // Don't let audit trail failures block financial operations
    console.error('Failed to log audit trail:', error);
    return { success: true, data: null, warning: 'Audit trail logging failed but operation continued' };
  }
};

export default {
  validateAuditTrail,
  getPaginatedAuditTrails,
  getAuditTrail,
  getAuditTrailsByRecord,
  getAuditTrailsByTable,
  getRecentAuditTrails,
  createAuditTrailRecord,
  deleteAuditTrailRecord,
  searchAuditTrails,
  getAuditTrailStats,
  getAuditTrailCountByFilter,
  logFinancialAction
};

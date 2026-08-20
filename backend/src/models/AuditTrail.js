import db from '../config/database.js';

/**
 * AuditTrail Model
 * Data access layer for audit_trail table
 * 
 * Tracks all changes to financial data with:
 * - Action type (CREATE, UPDATE, DELETE)
 * - Table name
 * - Record ID
 * - Old values (for UPDATE and DELETE)
 * - New values (for CREATE and UPDATE)
 * - User information
 * - Timestamp
 */

// Table name
const TABLE = 'audit_trail';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  ACTION: 'action',
  TABLE_NAME: 'table_name',
  RECORD_ID: 'record_id',
  OLD_VALUES: 'old_values',
  NEW_VALUES: 'new_values',
  USER_ID: 'user_id',
  IP_ADDRESS: 'ip_address',
  USER_AGENT: 'user_agent',
  CREATED_AT: 'created_at'
};

// Valid actions
const VALID_ACTIONS = ['CREATE', 'UPDATE', 'DELETE'];

// Valid table names for financial operations
const TRACKED_TABLES = [
  'students', 'classes', 'school_fees', 'lunch_payments', 'lunch_attendance',
  'student_charges', 'student_charge_assignments', 'income', 'income_categories',
  'expenses', 'expense_categories', 'director_withdrawals', 'transactions',
  'daily_summaries', 'reports'
];

/**
 * Get all audit trail entries with optional filtering
 * @param {Object} options - Filter options
 * @param {string} options.action - Filter by action type
 * @param {string} options.tableName - Filter by table name
 * @param {number} options.recordId - Filter by record ID
 * @param {number} options.userId - Filter by user ID
 * @param {string} options.startDate - Filter by start date
 * @param {string} options.endDate - Filter by end date
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Array} - Array of audit trail objects
 */
export const getAllAuditTrails = (options = {}) => {
  const {
    action,
    tableName,
    recordId,
    userId,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
    orderBy = 'created_at',
    orderDir = 'DESC'
  } = options;

  let query = `SELECT * FROM ${TABLE}`;
  const params = [];
  const conditions = [];

  if (action) {
    conditions.push(`action = ?`);
    params.push(action);
  }

  if (tableName) {
    conditions.push(`table_name = ?`);
    params.push(tableName);
  }

  if (recordId) {
    conditions.push(`record_id = ?`);
    params.push(recordId);
  }

  if (userId) {
    conditions.push(`user_id = ?`);
    params.push(userId);
  }

  if (startDate) {
    conditions.push(`created_at >= ?`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`created_at <= ?`);
    params.push(endDate);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

/**
 * Get audit trail count
 * @param {Object} options - Filter options
 * @returns {number} - Count of audit trail entries
 */
export const getAuditTrailCount = (options = {}) => {
  const { action, tableName, recordId, userId, startDate, endDate } = options;
  
  let query = `SELECT COUNT(*) as count FROM ${TABLE}`;
  const params = [];
  const conditions = [];

  if (action) {
    conditions.push(`action = ?`);
    params.push(action);
  }

  if (tableName) {
    conditions.push(`table_name = ?`);
    params.push(tableName);
  }

  if (recordId) {
    conditions.push(`record_id = ?`);
    params.push(recordId);
  }

  if (userId) {
    conditions.push(`user_id = ?`);
    params.push(userId);
  }

  if (startDate) {
    conditions.push(`created_at >= ?`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`created_at <= ?`);
    params.push(endDate);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const result = db.prepare(query).get(...params);
  return result?.count || 0;
};

/**
 * Get a single audit trail entry by ID
 * @param {number} id - Audit trail entry ID
 * @returns {Object|null} - Audit trail entry or null
 */
export const getAuditTrailById = (id) => {
  const stmt = db.prepare(`SELECT * FROM ${TABLE} WHERE id = ?`);
  return stmt.get(id) || null;
};

/**
 * Get audit trail entries for a specific record
 * @param {string} tableName - Table name
 * @param {number} recordId - Record ID
 * @returns {Array} - Array of audit trail entries for the record
 */
export const getAuditTrailByRecord = (tableName, recordId) => {
  const stmt = db.prepare(`
    SELECT * FROM ${TABLE} 
    WHERE table_name = ? AND record_id = ? 
    ORDER BY created_at DESC
  `);
  return stmt.all(tableName, recordId);
};

/**
 * Get audit trail entries for a specific table
 * @param {string} tableName - Table name
 * @param {Object} options - Filter and pagination options
 * @returns {Array} - Array of audit trail entries for the table
 */
export const getAuditTrailByTable = (tableName, options = {}) => {
  const { limit = 100, offset = 0, orderBy = 'created_at', orderDir = 'DESC' } = options;
  
  let query = `SELECT * FROM ${TABLE} WHERE table_name = ?`;
  const params = [tableName];

  query += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

/**
 * Get recent audit trail entries
 * @param {number} limit - Number of entries to return
 * @returns {Array} - Array of recent audit trail entries
 */
export const getRecentAuditTrails = (limit = 20) => {
  const stmt = db.prepare(`
    SELECT * FROM ${TABLE} 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  return stmt.all(limit);
};

/**
 * Create a new audit trail entry
 * @param {Object} data - Audit trail data
 * @returns {Object} - Created audit trail entry
 */
export const createAuditTrail = (data) => {
  const {
    action,
    tableName,
    recordId,
    oldValues,
    newValues,
    userId,
    ipAddress,
    userAgent
  } = data;

  const stmt = db.prepare(`
    INSERT INTO ${TABLE} 
    (action, table_name, record_id, old_values, new_values, user_id, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    action,
    tableName,
    recordId,
    oldValues ? JSON.stringify(oldValues) : null,
    newValues ? JSON.stringify(newValues) : null,
    userId,
    ipAddress,
    userAgent
  );

  return getAuditTrailById(result.lastInsertRowid);
};

/**
 * Delete an audit trail entry (use with caution)
 * @param {number} id - Audit trail entry ID
 * @returns {boolean} - True if deleted
 */
export const deleteAuditTrail = (id) => {
  const existing = getAuditTrailById(id);
  if (!existing) {
    return false;
  }

  const stmt = db.prepare(`DELETE FROM ${TABLE} WHERE id = ?`);
  stmt.run(id);
  return true;
};

/**
 * Get audit trail statistics
 * @param {Object} options - Filter options
 * @returns {Object} - Statistics
 */
export const getAuditTrailStatistics = (options = {}) => {
  const { tableName, startDate, endDate } = options;
  
  let query = `SELECT action, COUNT(*) as count FROM ${TABLE}`;
  const params = [];
  const conditions = [];

  if (tableName) {
    conditions.push(`table_name = ?`);
    params.push(tableName);
  }

  if (startDate) {
    conditions.push(`created_at >= ?`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`created_at <= ?`);
    params.push(endDate);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` GROUP BY action`;
  const stmt = db.prepare(query);
  const results = stmt.all(...params);

  const stats = {
    total: 0,
    byAction: {},
    byTable: {}
  };

  // Calculate total
  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM ${TABLE}`);
  const countResult = countStmt.get(...params);
  stats.total = countResult?.count || 0;

  // By action
  results.forEach(row => {
    stats.byAction[row.action] = row.count;
  });

  // By table
  let tableQuery = `SELECT table_name, COUNT(*) as count FROM ${TABLE}`;
  const tableParams = [];
  const tableConditions = [];

  if (startDate) {
    tableConditions.push(`created_at >= ?`);
    tableParams.push(startDate);
  }

  if (endDate) {
    tableConditions.push(`created_at <= ?`);
    tableParams.push(endDate);
  }

  if (tableConditions.length > 0) {
    tableQuery += ` WHERE ${tableConditions.join(' AND ')}`;
  }

  tableQuery += ` GROUP BY table_name`;
  const tableStmt = db.prepare(tableQuery);
  const tableResults = tableStmt.all(...tableParams);

  tableResults.forEach(row => {
    stats.byTable[row.table_name] = row.count;
  });

  return stats;
};

export default {
  getAllAuditTrails,
  getAuditTrailCount,
  getAuditTrailById,
  getAuditTrailByRecord,
  getAuditTrailByTable,
  getRecentAuditTrails,
  createAuditTrail,
  deleteAuditTrail,
  getAuditTrailStatistics
};

import db from '../config/database.js';

/**
 * Permission Model
 * Data access layer for permissions table
 * 
 * Manages system permissions with:
 * - Permission name (unique identifier)
 * - Display name (human-readable)
 * - Description
 * - Module/category grouping
 * - Active status
 * - Creation timestamp
 */

// Table name
export const PERMISSIONS_TABLE = 'permissions';

// Field names for consistency
export const PERMISSION_FIELDS = {
  ID: 'id',
  NAME: 'name',
  DISPLAY_NAME: 'display_name',
  DESCRIPTION: 'description',
  MODULE: 'module',
  IS_ACTIVE: 'is_active',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
};

// Permission modules
export const PERMISSION_MODULES = {
  DASHBOARD: 'dashboard',
  STUDENTS: 'students',
  CLASSES: 'classes',
  SCHOOL_FEES: 'school_fees',
  LUNCH: 'lunch',
  CHARGES: 'charges',
  INCOME: 'income',
  EXPENSES: 'expenses',
  REPORTS: 'reports',
  DIRECTOR_WITHDRAWALS: 'director_withdrawals',
  TRANSACTIONS: 'transactions',
  AUDIT_TRAIL: 'audit_trail',
  NOTIFICATIONS: 'notifications',
  USER_SESSIONS: 'user_sessions',
  USERS: 'users',
  ROLES: 'roles',
  SYSTEM: 'system'
};

/**
 * Create a new permission
 * @param {Object} data - Permission data
 * @param {string} data.name - Unique permission name
 * @param {string} data.displayName - Human-readable display name
 * @param {string} data.description - Permission description
 * @param {string} data.module - Module/category
 * @param {boolean} data.isActive - Active status (default: true)
 * @returns {Object} - Created permission record
 */
export const createPermission = (data) => {
  const { name, displayName, description, module, isActive = true } = data;
  
  const stmt = db.prepare(`
    INSERT INTO ${PERMISSIONS_TABLE} 
    (${PERMISSION_FIELDS.NAME}, ${PERMISSION_FIELDS.DISPLAY_NAME}, ${PERMISSION_FIELDS.DESCRIPTION}, 
     ${PERMISSION_FIELDS.MODULE}, ${PERMISSION_FIELDS.IS_ACTIVE}, ${PERMISSION_FIELDS.CREATED_AT}, ${PERMISSION_FIELDS.UPDATED_AT})
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  
  const result = stmt.run(name, displayName, description, module, isActive ? 1 : 0);
  
  return getPermissionById(result.lastInsertRowid);
};

/**
 * Get permission by ID
 * @param {number} id - Permission ID
 * @returns {Object|null} - Permission record or null
 */
export const getPermissionById = (id) => {
  const stmt = db.prepare(`
    SELECT * FROM ${PERMISSIONS_TABLE} 
    WHERE ${PERMISSION_FIELDS.ID} = ?
  `);
  
  return stmt.get(id) || null;
};

/**
 * Get permission by name
 * @param {string} name - Permission name
 * @returns {Object|null} - Permission record or null
 */
export const getPermissionByName = (name) => {
  const stmt = db.prepare(`
    SELECT * FROM ${PERMISSIONS_TABLE} 
    WHERE ${PERMISSION_FIELDS.NAME} = ?
  `);
  
  return stmt.get(name) || null;
};

/**
 * Get all permissions
 * @param {boolean} includeInactive - Include inactive permissions (default: false)
 * @returns {Array} - Array of permission records
 */
export const getAllPermissions = (includeInactive = false) => {
  let query = `SELECT * FROM ${PERMISSIONS_TABLE}`;
  const params = [];
  
  if (!includeInactive) {
    query += ` WHERE ${PERMISSION_FIELDS.IS_ACTIVE} = 1`;
  }
  
  query += ` ORDER BY ${PERMISSION_FIELDS.MODULE}, ${PERMISSION_FIELDS.DISPLAY_NAME}`;
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
};

/**
 * Get permissions by module
 * @param {string} module - Module name
 * @param {boolean} includeInactive - Include inactive permissions (default: false)
 * @returns {Array} - Array of permission records
 */
export const getPermissionsByModule = (module, includeInactive = false) => {
  let query = `SELECT * FROM ${PERMISSIONS_TABLE} WHERE ${PERMISSION_FIELDS.MODULE} = ?`;
  const params = [module];
  
  if (!includeInactive) {
    query += ` AND ${PERMISSION_FIELDS.IS_ACTIVE} = 1`;
  }
  
  query += ` ORDER BY ${PERMISSION_FIELDS.DISPLAY_NAME}`;
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
};

/**
 * Update permission
 * @param {number} id - Permission ID
 * @param {Object} data - Updated permission data
 * @returns {Object|null} - Updated permission record or null
 */
export const updatePermission = (id, data) => {
  const { displayName, description, module, isActive } = data;
  
  const stmt = db.prepare(`
    UPDATE ${PERMISSIONS_TABLE} 
    SET ${PERMISSION_FIELDS.DISPLAY_NAME} = ?, 
        ${PERMISSION_FIELDS.DESCRIPTION} = ?, 
        ${PERMISSION_FIELDS.MODULE} = ?, 
        ${PERMISSION_FIELDS.IS_ACTIVE} = ?, 
        ${PERMISSION_FIELDS.UPDATED_AT} = datetime('now')
    WHERE ${PERMISSION_FIELDS.ID} = ?
  `);
  
  const result = stmt.run(displayName, description, module, isActive ? 1 : 0, id);
  
  return result.changes > 0 ? getPermissionById(id) : null;
};

/**
 * Delete permission
 * @param {number} id - Permission ID
 * @returns {boolean} - Success status
 */
export const deletePermission = (id) => {
  const stmt = db.prepare(`
    DELETE FROM ${PERMISSIONS_TABLE} 
    WHERE ${PERMISSION_FIELDS.ID} = ?
  `);
  
  const result = stmt.run(id);
  return result.changes > 0;
};

/**
 * Check if permission exists by name
 * @param {string} name - Permission name
 * @returns {boolean} - Existence status
 */
export const permissionExists = (name) => {
  const stmt = db.prepare(`
    SELECT 1 FROM ${PERMISSIONS_TABLE} 
    WHERE ${PERMISSION_FIELDS.NAME} = ?
  `);
  
  return stmt.get(name) !== undefined;
};

/**
 * Get permission count
 * @param {string|null} module - Optional module filter
 * @returns {number} - Count of permissions
 */
export const getPermissionCount = (module = null) => {
  let query = `SELECT COUNT(*) as count FROM ${PERMISSIONS_TABLE}`;
  const params = [];
  
  if (module) {
    query += ` WHERE ${PERMISSION_FIELDS.MODULE} = ?`;
    params.push(module);
  }
  
  const stmt = db.prepare(query);
  const result = stmt.get(...params);
  return result.count;
};

/**
 * Get permission count by module
 * @returns {Array} - Array of objects with module and count
 */
export const getPermissionCountByModule = () => {
  const stmt = db.prepare(`
    SELECT ${PERMISSION_FIELDS.MODULE}, COUNT(*) as count 
    FROM ${PERMISSIONS_TABLE} 
    GROUP BY ${PERMISSION_FIELDS.MODULE} 
    ORDER BY count DESC
  `);
  
  return stmt.all();
};

/**
 * Search permissions
 * @param {string} searchTerm - Search term
 * @returns {Array} - Array of matching permission records
 */
export const searchPermissions = (searchTerm) => {
  const stmt = db.prepare(`
    SELECT * FROM ${PERMISSIONS_TABLE} 
    WHERE ${PERMISSION_FIELDS.NAME} LIKE ? 
       OR ${PERMISSION_FIELDS.DISPLAY_NAME} LIKE ?
       OR ${PERMISSION_FIELDS.DESCRIPTION} LIKE ?
       OR ${PERMISSION_FIELDS.MODULE} LIKE ?
    ORDER BY ${PERMISSION_FIELDS.MODULE}, ${PERMISSION_FIELDS.DISPLAY_NAME}
  `);
  
  const searchPattern = `%${searchTerm}%`;
  return stmt.all(searchPattern, searchPattern, searchPattern, searchPattern);
};

export default {
  PERMISSIONS_TABLE,
  PERMISSION_FIELDS,
  PERMISSION_MODULES,
  createPermission,
  getPermissionById,
  getPermissionByName,
  getAllPermissions,
  getPermissionsByModule,
  updatePermission,
  deletePermission,
  permissionExists,
  getPermissionCount,
  getPermissionCountByModule,
  searchPermissions
};

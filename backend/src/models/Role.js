import db from '../config/database.js';

/**
 * Role Model
 * Data access layer for roles table
 * 
 * Manages user roles with:
 * - Role name (unique identifier)
 * - Display name (human-readable)
 * - Description
 * - Active status
 * - Default role flag
 * - Creation timestamp
 */

// Table name
export const ROLES_TABLE = 'roles';

// Field names for consistency
export const ROLE_FIELDS = {
  ID: 'id',
  NAME: 'name',
  DISPLAY_NAME: 'display_name',
  DESCRIPTION: 'description',
  IS_ACTIVE: 'is_active',
  IS_DEFAULT: 'is_default',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
};

// Default role names
export const DEFAULT_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  ACCOUNTANT: 'accountant',
  TEACHER: 'teacher',
  PARENT: 'parent',
  STUDENT: 'student'
};

/**
 * Create a new role
 * @param {Object} data - Role data
 * @param {string} data.name - Unique role name
 * @param {string} data.displayName - Human-readable display name
 * @param {string} data.description - Role description
 * @param {boolean} data.isActive - Active status (default: true)
 * @param {boolean} data.isDefault - Default role flag (default: false)
 * @returns {Object} - Created role record
 */
export const createRole = (data) => {
  const { name, displayName, description, isActive = true, isDefault = false } = data;
  
  const stmt = db.prepare(`
    INSERT INTO ${ROLES_TABLE} 
    (${ROLE_FIELDS.NAME}, ${ROLE_FIELDS.DISPLAY_NAME}, ${ROLE_FIELDS.DESCRIPTION}, 
     ${ROLE_FIELDS.IS_ACTIVE}, ${ROLE_FIELDS.IS_DEFAULT}, ${ROLE_FIELDS.CREATED_AT}, ${ROLE_FIELDS.UPDATED_AT})
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  
  const result = stmt.run(name, displayName, description, isActive ? 1 : 0, isDefault ? 1 : 0);
  
  return getRoleById(result.lastInsertRowid);
};

/**
 * Get role by ID
 * @param {number} id - Role ID
 * @returns {Object|null} - Role record or null
 */
export const getRoleById = (id) => {
  const stmt = db.prepare(`
    SELECT * FROM ${ROLES_TABLE} 
    WHERE ${ROLE_FIELDS.ID} = ?
  `);
  
  return stmt.get(id) || null;
};

/**
 * Get role by name
 * @param {string} name - Role name
 * @returns {Object|null} - Role record or null
 */
export const getRoleByName = (name) => {
  const stmt = db.prepare(`
    SELECT * FROM ${ROLES_TABLE} 
    WHERE ${ROLE_FIELDS.NAME} = ?
  `);
  
  return stmt.get(name) || null;
};

/**
 * Get all roles
 * @param {boolean} includeInactive - Include inactive roles (default: false)
 * @returns {Array} - Array of role records
 */
export const getAllRoles = (includeInactive = false) => {
  let query = `SELECT * FROM ${ROLES_TABLE}`;
  const params = [];
  
  if (!includeInactive) {
    query += ` WHERE ${ROLE_FIELDS.IS_ACTIVE} = 1`;
  }
  
  query += ` ORDER BY ${ROLE_FIELDS.IS_DEFAULT} DESC, ${ROLE_FIELDS.DISPLAY_NAME}`;
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
};

/**
 * Get default role
 * @returns {Object|null} - Default role record or null
 */
export const getDefaultRole = () => {
  const stmt = db.prepare(`
    SELECT * FROM ${ROLES_TABLE} 
    WHERE ${ROLE_FIELDS.IS_DEFAULT} = 1 
    AND ${ROLE_FIELDS.IS_ACTIVE} = 1
    LIMIT 1
  `);
  
  return stmt.get() || null;
};

/**
 * Update role
 * @param {number} id - Role ID
 * @param {Object} data - Updated role data
 * @returns {Object|null} - Updated role record or null
 */
export const updateRole = (id, data) => {
  const { displayName, description, isActive, isDefault } = data;
  
  const stmt = db.prepare(`
    UPDATE ${ROLES_TABLE} 
    SET ${ROLE_FIELDS.DISPLAY_NAME} = ?, 
        ${ROLE_FIELDS.DESCRIPTION} = ?, 
        ${ROLE_FIELDS.IS_ACTIVE} = ?, 
        ${ROLE_FIELDS.IS_DEFAULT} = ?, 
        ${ROLE_FIELDS.UPDATED_AT} = datetime('now')
    WHERE ${ROLE_FIELDS.ID} = ?
  `);
  
  const result = stmt.run(displayName, description, isActive ? 1 : 0, isDefault ? 1 : 0, id);
  
  return result.changes > 0 ? getRoleById(id) : null;
};

/**
 * Delete role
 * @param {number} id - Role ID
 * @returns {boolean} - Success status
 */
export const deleteRole = (id) => {
  const stmt = db.prepare(`
    DELETE FROM ${ROLES_TABLE} 
    WHERE ${ROLE_FIELDS.ID} = ?
  `);
  
  const result = stmt.run(id);
  return result.changes > 0;
};

/**
 * Check if role exists by name
 * @param {string} name - Role name
 * @returns {boolean} - Existence status
 */
export const roleExists = (name) => {
  const stmt = db.prepare(`
    SELECT 1 FROM ${ROLES_TABLE} 
    WHERE ${ROLE_FIELDS.NAME} = ?
  `);
  
  return stmt.get(name) !== undefined;
};

/**
 * Get role count
 * @returns {number} - Count of roles
 */
export const getRoleCount = () => {
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM ${ROLES_TABLE}`);
  const result = stmt.get();
  return result.count;
};

/**
 * Set default role
 * @param {number} roleId - Role ID to set as default
 * @returns {boolean} - Success status
 */
export const setDefaultRole = (roleId) => {
  const stmt = db.prepare(`
    UPDATE ${ROLES_TABLE} 
    SET ${ROLE_FIELDS.IS_DEFAULT} = CASE WHEN ${ROLE_FIELDS.ID} = ? THEN 1 ELSE 0 END
  `);
  
  const result = stmt.run(roleId);
  return result.changes > 0;
};

/**
 * Search roles
 * @param {string} searchTerm - Search term
 * @returns {Array} - Array of matching role records
 */
export const searchRoles = (searchTerm) => {
  const stmt = db.prepare(`
    SELECT * FROM ${ROLES_TABLE} 
    WHERE ${ROLE_FIELDS.NAME} LIKE ? 
       OR ${ROLE_FIELDS.DISPLAY_NAME} LIKE ?
       OR ${ROLE_FIELDS.DESCRIPTION} LIKE ?
    ORDER BY ${ROLE_FIELDS.IS_DEFAULT} DESC, ${ROLE_FIELDS.DISPLAY_NAME}
  `);
  
  const searchPattern = `%${searchTerm}%`;
  return stmt.all(searchPattern, searchPattern, searchPattern);
};

/**
 * Get roles with permission count
 * @returns {Array} - Array of roles with permission count
 */
export const getRolesWithPermissionCount = () => {
  const stmt = db.prepare(`
    SELECT r.*, 
           (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.${ROLE_FIELDS.ID}) as permission_count
    FROM ${ROLES_TABLE} r
    WHERE r.${ROLE_FIELDS.IS_ACTIVE} = 1
    ORDER BY r.${ROLE_FIELDS.IS_DEFAULT} DESC, r.${ROLE_FIELDS.DISPLAY_NAME}
  `);
  
  return stmt.all();
};

export default {
  ROLES_TABLE,
  ROLE_FIELDS,
  DEFAULT_ROLES,
  createRole,
  getRoleById,
  getRoleByName,
  getAllRoles,
  getDefaultRole,
  updateRole,
  deleteRole,
  roleExists,
  getRoleCount,
  setDefaultRole,
  searchRoles,
  getRolesWithPermissionCount
};

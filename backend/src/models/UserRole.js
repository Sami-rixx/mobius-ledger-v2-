import db from '../config/database.js';

/**
 * UserRole Model
 * Data access layer for user_roles table (many-to-many mapping between users and roles)
 * 
 * Manages user-role assignments with:
 * - User ID reference
 * - Role ID reference
 * - Assigned timestamp
 * - Assigned by user
 */

// Table name
export const USER_ROLES_TABLE = 'user_roles';

// Field names for consistency
export const USER_ROLE_FIELDS = {
  ID: 'id',
  USER_ID: 'user_id',
  ROLE_ID: 'role_id',
  ASSIGNED_AT: 'assigned_at',
  ASSIGNED_BY: 'assigned_by'
};

/**
 * Assign role to user
 * @param {Object} data - Assignment data
 * @param {number} data.userId - User ID
 * @param {number} data.roleId - Role ID
 * @param {number} data.assignedBy - User ID who assigned this role (default: null)
 * @returns {Object} - Created user-role record
 */
export const assignRoleToUser = (data) => {
  const { userId, roleId, assignedBy = null } = data;
  
  // Check if this assignment already exists
  const existing = getUserRoleByUserAndRole(userId, roleId);
  if (existing) {
    return existing;
  }
  
  const stmt = db.prepare(`
    INSERT INTO ${USER_ROLES_TABLE} 
    (${USER_ROLE_FIELDS.USER_ID}, ${USER_ROLE_FIELDS.ROLE_ID}, ${USER_ROLE_FIELDS.ASSIGNED_AT}, ${USER_ROLE_FIELDS.ASSIGNED_BY})
    VALUES (?, ?, datetime('now'), ?)
  `);
  
  const result = stmt.run(userId, roleId, assignedBy);
  
  return getUserRoleById(result.lastInsertRowid);
};

/**
 * Get user-role assignment by ID
 * @param {number} id - Assignment ID
 * @returns {Object|null} - User-role record or null
 */
export const getUserRoleById = (id) => {
  const stmt = db.prepare(`
    SELECT * FROM ${USER_ROLES_TABLE} 
    WHERE ${USER_ROLE_FIELDS.ID} = ?
  `);
  
  return stmt.get(id) || null;
};

/**
 * Get user-role assignment by user and role
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {Object|null} - User-role record or null
 */
export const getUserRoleByUserAndRole = (userId, roleId) => {
  const stmt = db.prepare(`
    SELECT * FROM ${USER_ROLES_TABLE} 
    WHERE ${USER_ROLE_FIELDS.USER_ID} = ? 
      AND ${USER_ROLE_FIELDS.ROLE_ID} = ?
  `);
  
  return stmt.get(userId, roleId) || null;
};

/**
 * Get all roles for a user
 * @param {number} userId - User ID
 * @returns {Array} - Array of role records with assignment info
 */
export const getRolesByUserId = (userId) => {
  const stmt = db.prepare(`
    SELECT ur.*, r.* 
    FROM ${USER_ROLES_TABLE} ur
    JOIN roles r ON ur.${USER_ROLE_FIELDS.ROLE_ID} = r.id
    WHERE ur.${USER_ROLE_FIELDS.USER_ID} = ?
    ORDER BY r.is_default DESC, r.display_name
  `);
  
  return stmt.all(userId);
};

/**
 * Get role IDs for a user
 * @param {number} userId - User ID
 * @returns {Array} - Array of role IDs
 */
export const getRoleIdsByUserId = (userId) => {
  const stmt = db.prepare(`
    SELECT ${USER_ROLE_FIELDS.ROLE_ID} as role_id 
    FROM ${USER_ROLES_TABLE} 
    WHERE ${USER_ROLE_FIELDS.USER_ID} = ?
  `);
  
  const results = stmt.all(userId);
  return results.map(r => r.role_id);
};

/**
 * Get all users for a role
 * @param {number} roleId - Role ID
 * @returns {Array} - Array of user IDs
 */
export const getUsersByRoleId = (roleId) => {
  const stmt = db.prepare(`
    SELECT ${USER_ROLE_FIELDS.USER_ID} as user_id 
    FROM ${USER_ROLES_TABLE} 
    WHERE ${USER_ROLE_FIELDS.ROLE_ID} = ?
  `);
  
  const results = stmt.all(roleId);
  return results.map(r => r.user_id);
};

/**
 * Get all user-role assignments
 * @returns {Array} - Array of all user-role records
 */
export const getAllUserRoles = () => {
  const stmt = db.prepare(`
    SELECT ur.*, r.name as role_name, r.display_name as role_display_name
    FROM ${USER_ROLES_TABLE} ur
    JOIN roles r ON ur.${USER_ROLE_FIELDS.ROLE_ID} = r.id
    ORDER BY ur.${USER_ROLE_FIELDS.USER_ID}, r.display_name
  `);
  
  return stmt.all();
};

/**
 * Remove role from user
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {boolean} - Success status
 */
export const removeRoleFromUser = (userId, roleId) => {
  const stmt = db.prepare(`
    DELETE FROM ${USER_ROLES_TABLE} 
    WHERE ${USER_ROLE_FIELDS.USER_ID} = ? 
      AND ${USER_ROLE_FIELDS.ROLE_ID} = ?
  `);
  
  const result = stmt.run(userId, roleId);
  return result.changes > 0;
};

/**
 * Remove all roles from user
 * @param {number} userId - User ID
 * @returns {boolean} - Success status
 */
export const removeAllRolesFromUser = (userId) => {
  const stmt = db.prepare(`
    DELETE FROM ${USER_ROLES_TABLE} 
    WHERE ${USER_ROLE_FIELDS.USER_ID} = ?
  `);
  
  const result = stmt.run(userId);
  return result.changes > 0;
};

/**
 * Check if user has role
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {boolean} - Has role status
 */
export const userHasRole = (userId, roleId) => {
  const stmt = db.prepare(`
    SELECT 1 FROM ${USER_ROLES_TABLE} 
    WHERE ${USER_ROLE_FIELDS.USER_ID} = ? 
      AND ${USER_ROLE_FIELDS.ROLE_ID} = ?
  `);
  
  return stmt.get(userId, roleId) !== undefined;
};

/**
 * Check if user has any of the given roles
 * @param {number} userId - User ID
 * @param {Array} roleIds - Array of role IDs
 * @returns {boolean} - Has any role status
 */
export const userHasAnyRole = (userId, roleIds) => {
  if (!roleIds || roleIds.length === 0) {
    return false;
  }
  
  const placeholders = roleIds.map(() => '?').join(', ');
  const stmt = db.prepare(`
    SELECT 1 FROM ${USER_ROLES_TABLE} 
    WHERE ${USER_ROLE_FIELDS.USER_ID} = ? 
      AND ${USER_ROLE_FIELDS.ROLE_ID} IN (${placeholders})
    LIMIT 1
  `);
  
  return stmt.get(userId, ...roleIds) !== undefined;
};

/**
 * Get user-role count
 * @returns {number} - Count of user-role assignments
 */
export const getUserRoleCount = () => {
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM ${USER_ROLES_TABLE}`);
  const result = stmt.get();
  return result.count;
};

/**
 * Get user count for a role
 * @param {number} roleId - Role ID
 * @returns {number} - Count of users with this role
 */
export const getUserCountForRole = (roleId) => {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM ${USER_ROLES_TABLE} 
    WHERE ${USER_ROLE_FIELDS.ROLE_ID} = ?
  `);
  
  const result = stmt.get(roleId);
  return result.count;
};

/**
 * Get role count for a user
 * @param {number} userId - User ID
 * @returns {number} - Count of roles assigned to user
 */
export const getRoleCountForUser = (userId) => {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM ${USER_ROLES_TABLE} 
    WHERE ${USER_ROLE_FIELDS.USER_ID} = ?
  `);
  
  const result = stmt.get(userId);
  return result.count;
};

/**
 * Replace all roles for a user (removes existing and assigns new ones)
 * @param {number} userId - User ID
 * @param {Array} roleIds - Array of role IDs to assign
 * @param {number} assignedBy - User ID who assigned these roles
 * @returns {Array} - Array of created assignments
 */
export const replaceUserRoles = (userId, roleIds, assignedBy = null) => {
  // Remove existing roles
  removeAllRolesFromUser(userId);
  
  // Assign new roles
  const assignments = [];
  for (const roleId of roleIds) {
    const assignment = assignRoleToUser({ userId, roleId, assignedBy });
    if (assignment) {
      assignments.push(assignment);
    }
  }
  
  return assignments;
};

export default {
  USER_ROLES_TABLE,
  USER_ROLE_FIELDS,
  assignRoleToUser,
  getUserRoleById,
  getUserRoleByUserAndRole,
  getRolesByUserId,
  getRoleIdsByUserId,
  getUsersByRoleId,
  getAllUserRoles,
  removeRoleFromUser,
  removeAllRolesFromUser,
  userHasRole,
  userHasAnyRole,
  getUserRoleCount,
  getUserCountForRole,
  getRoleCountForUser,
  replaceUserRoles
};

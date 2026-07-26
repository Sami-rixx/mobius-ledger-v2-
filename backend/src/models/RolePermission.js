import db from '../config/database.js';

/**
 * RolePermission Model
 * Data access layer for role_permissions table (many-to-many mapping between roles and permissions)
 * 
 * Manages role-permission assignments with:
 * - Role ID reference
 * - Permission ID reference
 * - Assigned timestamp
 * - Assigned by user
 */

// Table name
export const ROLE_PERMISSIONS_TABLE = 'role_permissions';

// Field names for consistency
export const ROLE_PERMISSION_FIELDS = {
  ID: 'id',
  ROLE_ID: 'role_id',
  PERMISSION_ID: 'permission_id',
  ASSIGNED_AT: 'assigned_at',
  ASSIGNED_BY: 'assigned_by'
};

/**
 * Assign permission to role
 * @param {Object} data - Assignment data
 * @param {number} data.roleId - Role ID
 * @param {number} data.permissionId - Permission ID
 * @param {number} data.assignedBy - User ID who assigned this permission (default: null)
 * @returns {Object} - Created role-permission record
 */
export const assignPermissionToRole = (data) => {
  const { roleId, permissionId, assignedBy = null } = data;
  
  // Check if this assignment already exists
  const existing = getRolePermissionByRoleAndPermission(roleId, permissionId);
  if (existing) {
    return existing;
  }
  
  const stmt = db.prepare(`
    INSERT INTO ${ROLE_PERMISSIONS_TABLE} 
    (${ROLE_PERMISSION_FIELDS.ROLE_ID}, ${ROLE_PERMISSION_FIELDS.PERMISSION_ID}, ${ROLE_PERMISSION_FIELDS.ASSIGNED_AT}, ${ROLE_PERMISSION_FIELDS.ASSIGNED_BY})
    VALUES (?, ?, datetime('now'), ?)
  `);
  
  const result = stmt.run(roleId, permissionId, assignedBy);
  
  return getRolePermissionById(result.lastInsertRowid);
};

/**
 * Get role-permission assignment by ID
 * @param {number} id - Assignment ID
 * @returns {Object|null} - Role-permission record or null
 */
export const getRolePermissionById = (id) => {
  const stmt = db.prepare(`
    SELECT * FROM ${ROLE_PERMISSIONS_TABLE} 
    WHERE ${ROLE_PERMISSION_FIELDS.ID} = ?
  `);
  
  return stmt.get(id) || null;
};

/**
 * Get role-permission assignment by role and permission
 * @param {number} roleId - Role ID
 * @param {number} permissionId - Permission ID
 * @returns {Object|null} - Role-permission record or null
 */
export const getRolePermissionByRoleAndPermission = (roleId, permissionId) => {
  const stmt = db.prepare(`
    SELECT * FROM ${ROLE_PERMISSIONS_TABLE} 
    WHERE ${ROLE_PERMISSION_FIELDS.ROLE_ID} = ? 
      AND ${ROLE_PERMISSION_FIELDS.PERMISSION_ID} = ?
  `);
  
  return stmt.get(roleId, permissionId) || null;
};

/**
 * Get all permissions for a role
 * @param {number} roleId - Role ID
 * @returns {Array} - Array of permission records with assignment info
 */
export const getPermissionsByRoleId = (roleId) => {
  const stmt = db.prepare(`
    SELECT rp.*, p.* 
    FROM ${ROLE_PERMISSIONS_TABLE} rp
    JOIN permissions p ON rp.${ROLE_PERMISSION_FIELDS.PERMISSION_ID} = p.id
    WHERE rp.${ROLE_PERMISSION_FIELDS.ROLE_ID} = ?
    ORDER BY p.module, p.display_name
  `);
  
  return stmt.all(roleId);
};

/**
 * Get permission IDs for a role
 * @param {number} roleId - Role ID
 * @returns {Array} - Array of permission IDs
 */
export const getPermissionIdsByRoleId = (roleId) => {
  const stmt = db.prepare(`
    SELECT ${ROLE_PERMISSION_FIELDS.PERMISSION_ID} as permission_id 
    FROM ${ROLE_PERMISSIONS_TABLE} 
    WHERE ${ROLE_PERMISSION_FIELDS.ROLE_ID} = ?
  `);
  
  const results = stmt.all(roleId);
  return results.map(r => r.permission_id);
};

/**
 * Get all roles for a permission
 * @param {number} permissionId - Permission ID
 * @returns {Array} - Array of role IDs
 */
export const getRolesByPermissionId = (permissionId) => {
  const stmt = db.prepare(`
    SELECT ${ROLE_PERMISSION_FIELDS.ROLE_ID} as role_id 
    FROM ${ROLE_PERMISSIONS_TABLE} 
    WHERE ${ROLE_PERMISSION_FIELDS.PERMISSION_ID} = ?
  `);
  
  const results = stmt.all(permissionId);
  return results.map(r => r.role_id);
};

/**
 * Get all role-permission assignments
 * @returns {Array} - Array of all role-permission records
 */
export const getAllRolePermissions = () => {
  const stmt = db.prepare(`
    SELECT rp.*, 
           r.name as role_name, r.display_name as role_display_name,
           p.name as permission_name, p.display_name as permission_display_name
    FROM ${ROLE_PERMISSIONS_TABLE} rp
    JOIN roles r ON rp.${ROLE_PERMISSION_FIELDS.ROLE_ID} = r.id
    JOIN permissions p ON rp.${ROLE_PERMISSION_FIELDS.PERMISSION_ID} = p.id
    ORDER BY r.display_name, p.display_name
  `);
  
  return stmt.all();
};

/**
 * Remove permission from role
 * @param {number} roleId - Role ID
 * @param {number} permissionId - Permission ID
 * @returns {boolean} - Success status
 */
export const removePermissionFromRole = (roleId, permissionId) => {
  const stmt = db.prepare(`
    DELETE FROM ${ROLE_PERMISSIONS_TABLE} 
    WHERE ${ROLE_PERMISSION_FIELDS.ROLE_ID} = ? 
      AND ${ROLE_PERMISSION_FIELDS.PERMISSION_ID} = ?
  `);
  
  const result = stmt.run(roleId, permissionId);
  return result.changes > 0;
};

/**
 * Remove all permissions from role
 * @param {number} roleId - Role ID
 * @returns {boolean} - Success status
 */
export const removeAllPermissionsFromRole = (roleId) => {
  const stmt = db.prepare(`
    DELETE FROM ${ROLE_PERMISSIONS_TABLE} 
    WHERE ${ROLE_PERMISSION_FIELDS.ROLE_ID} = ?
  `);
  
  const result = stmt.run(roleId);
  return result.changes > 0;
};

/**
 * Check if role has permission
 * @param {number} roleId - Role ID
 * @param {number} permissionId - Permission ID
 * @returns {boolean} - Has permission status
 */
export const roleHasPermission = (roleId, permissionId) => {
  const stmt = db.prepare(`
    SELECT 1 FROM ${ROLE_PERMISSIONS_TABLE} 
    WHERE ${ROLE_PERMISSION_FIELDS.ROLE_ID} = ? 
      AND ${ROLE_PERMISSION_FIELDS.PERMISSION_ID} = ?
  `);
  
  return stmt.get(roleId, permissionId) !== undefined;
};

/**
 * Check if role has any of the given permissions
 * @param {number} roleId - Role ID
 * @param {Array} permissionIds - Array of permission IDs
 * @returns {boolean} - Has any permission status
 */
export const roleHasAnyPermission = (roleId, permissionIds) => {
  if (!permissionIds || permissionIds.length === 0) {
    return false;
  }
  
  const placeholders = permissionIds.map(() => '?').join(', ');
  const stmt = db.prepare(`
    SELECT 1 FROM ${ROLE_PERMISSIONS_TABLE} 
    WHERE ${ROLE_PERMISSION_FIELDS.ROLE_ID} = ? 
      AND ${ROLE_PERMISSION_FIELDS.PERMISSION_ID} IN (${placeholders})
    LIMIT 1
  `);
  
  return stmt.get(roleId, ...permissionIds) !== undefined;
};

/**
 * Get role-permission count
 * @returns {number} - Count of role-permission assignments
 */
export const getRolePermissionCount = () => {
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM ${ROLE_PERMISSIONS_TABLE}`);
  const result = stmt.get();
  return result.count;
};

/**
 * Get permission count for a role
 * @param {number} roleId - Role ID
 * @returns {number} - Count of permissions assigned to role
 */
export const getPermissionCountForRole = (roleId) => {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM ${ROLE_PERMISSIONS_TABLE} 
    WHERE ${ROLE_PERMISSION_FIELDS.ROLE_ID} = ?
  `);
  
  const result = stmt.get(roleId);
  return result.count;
};

/**
 * Get role count for a permission
 * @param {number} permissionId - Permission ID
 * @returns {number} - Count of roles with this permission
 */
export const getRoleCountForPermission = (permissionId) => {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM ${ROLE_PERMISSIONS_TABLE} 
    WHERE ${ROLE_PERMISSION_FIELDS.PERMISSION_ID} = ?
  `);
  
  const result = stmt.get(permissionId);
  return result.count;
};

/**
 * Replace all permissions for a role (removes existing and assigns new ones)
 * @param {number} roleId - Role ID
 * @param {Array} permissionIds - Array of permission IDs to assign
 * @param {number} assignedBy - User ID who assigned these permissions
 * @returns {Array} - Array of created assignments
 */
export const replaceRolePermissions = (roleId, permissionIds, assignedBy = null) => {
  // Remove existing permissions
  removeAllPermissionsFromRole(roleId);
  
  // Assign new permissions
  const assignments = [];
  for (const permissionId of permissionIds) {
    const assignment = assignPermissionToRole({ roleId, permissionId, assignedBy });
    if (assignment) {
      assignments.push(assignment);
    }
  }
  
  return assignments;
};

export default {
  ROLE_PERMISSIONS_TABLE,
  ROLE_PERMISSION_FIELDS,
  assignPermissionToRole,
  getRolePermissionById,
  getRolePermissionByRoleAndPermission,
  getPermissionsByRoleId,
  getPermissionIdsByRoleId,
  getRolesByPermissionId,
  getAllRolePermissions,
  removePermissionFromRole,
  removeAllPermissionsFromRole,
  roleHasPermission,
  roleHasAnyPermission,
  getRolePermissionCount,
  getPermissionCountForRole,
  getRoleCountForPermission,
  replaceRolePermissions
};

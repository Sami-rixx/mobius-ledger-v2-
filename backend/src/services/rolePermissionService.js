/**
 * RolePermission Service
 * Business logic layer for role-permission assignment management
 * 
 * Handles:
 * - Role-permission validation
 * - Business rule enforcement
 * - Pagination
 * - Advanced filtering and search
 * - Role-permission lifecycle management
 */

import {
  assignPermissionToRole as assignPermissionToRoleModel,
  getRolePermissionById as getRolePermissionByIdModel,
  getRolePermissionByRoleAndPermission as getRolePermissionByRoleAndPermissionModel,
  getPermissionsByRoleId as getPermissionsByRoleIdModel,
  getPermissionIdsByRoleId as getPermissionIdsByRoleIdModel,
  getRolesByPermissionId as getRolesByPermissionIdModel,
  getAllRolePermissions as getAllRolePermissionsModel,
  removePermissionFromRole as removePermissionFromRoleModel,
  removeAllPermissionsFromRole as removeAllPermissionsFromRoleModel,
  roleHasPermission as roleHasPermissionModel,
  roleHasAnyPermission as roleHasAnyPermissionModel,
  getRolePermissionCount as getRolePermissionCountModel,
  getPermissionCountForRole as getPermissionCountForRoleModel,
  getRoleCountForPermission as getRoleCountForPermissionModel,
  replaceRolePermissions as replaceRolePermissionsModel,
  ROLE_PERMISSIONS_TABLE,
  ROLE_PERMISSION_FIELDS
} from '../models/RolePermission.js';

import { getRoleById as getRoleByIdModel } from '../models/Role.js';
import { getPermissionById as getPermissionByIdModel } from '../models/Permission.js';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Validate role-permission assignment data
 * @param {Object} data - Assignment data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateRolePermissionAssignment = (data) => {
  const errors = [];

  if (!data.roleId) {
    errors.push('Role ID is required');
  } else {
    const roleId = parseInt(data.roleId);
    if (isNaN(roleId) || roleId < 1) {
      errors.push('Role ID must be a valid positive number');
    }
  }

  if (!data.permissionId) {
    errors.push('Permission ID is required');
  } else {
    const permissionId = parseInt(data.permissionId);
    if (isNaN(permissionId) || permissionId < 1) {
      errors.push('Permission ID must be a valid positive number');
    }
  }

  if (data.assignedBy !== undefined && data.assignedBy !== null) {
    const assignedBy = parseInt(data.assignedBy);
    if (isNaN(assignedBy) || assignedBy < 1) {
      errors.push('Assigned by must be a valid positive number or null');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Assign permission to role with validation
 * @param {Object} data - Assignment data
 * @returns {Object} - Created assignment or validation errors
 */
export const assignPermissionToRole = async (data) => {
  const validation = validateRolePermissionAssignment(data);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Check if role exists
  const role = getRoleByIdModel(data.roleId);
  if (!role) {
    throw new Error(`Role with ID ${data.roleId} not found`);
  }

  // Check if permission exists
  const permission = getPermissionByIdModel(data.permissionId);
  if (!permission) {
    throw new Error(`Permission with ID ${data.permissionId} not found`);
  }

  return assignPermissionToRoleModel(data);
};

/**
 * Get role-permission assignment by ID
 * @param {number} id - Assignment ID
 * @returns {Object|null} - Role-permission record or null
 */
export const getRolePermissionById = (id) => {
  return getRolePermissionByIdModel(id);
};

/**
 * Get role-permission assignment by role and permission
 * @param {number} roleId - Role ID
 * @param {number} permissionId - Permission ID
 * @returns {Object|null} - Role-permission record or null
 */
export const getRolePermissionByRoleAndPermission = (roleId, permissionId) => {
  return getRolePermissionByRoleAndPermissionModel(roleId, permissionId);
};

/**
 * Get all permissions for a role (with permission details)
 * @param {number} roleId - Role ID
 * @returns {Array} - Array of permission records with assignment info
 */
export const getPermissionsByRoleId = (roleId) => {
  return getPermissionsByRoleIdModel(roleId);
};

/**
 * Get permission IDs for a role
 * @param {number} roleId - Role ID
 * @returns {Array} - Array of permission IDs
 */
export const getPermissionIdsByRoleId = (roleId) => {
  return getPermissionIdsByRoleIdModel(roleId);
};

/**
 * Get all roles for a permission
 * @param {number} permissionId - Permission ID
 * @returns {Array} - Array of role IDs
 */
export const getRolesByPermissionId = (permissionId) => {
  return getRolesByPermissionIdModel(permissionId);
};

/**
 * Get paginated role-permission assignments
 * @param {Object} options - Pagination and filtering options
 * @param {number} options.page - Page number (default: DEFAULT_PAGE)
 * @param {number} options.pageSize - Items per page (default: DEFAULT_PAGE_SIZE)
 * @returns {Object} - Paginated results with assignments and total count
 */
export const getPaginatedRolePermissions = (options = {}) => {
  const {
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE
  } = options;

  const allAssignments = getAllRolePermissionsModel();
  const totalCount = allAssignments.length;
  const offset = (page - 1) * pageSize;
  const assignments = allAssignments.slice(offset, offset + pageSize);
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    rolePermissions: assignments,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

/**
 * Get all role-permission assignments
 * @returns {Array} - Array of all role-permission records
 */
export const getAllRolePermissions = () => {
  return getAllRolePermissionsModel();
};

/**
 * Remove permission from role
 * @param {number} roleId - Role ID
 * @param {number} permissionId - Permission ID
 * @returns {boolean} - Success status
 */
export const removePermissionFromRole = (roleId, permissionId) => {
  return removePermissionFromRoleModel(roleId, permissionId);
};

/**
 * Remove all permissions from role
 * @param {number} roleId - Role ID
 * @returns {boolean} - Success status
 */
export const removeAllPermissionsFromRole = (roleId) => {
  return removeAllPermissionsFromRoleModel(roleId);
};

/**
 * Check if role has permission
 * @param {number} roleId - Role ID
 * @param {number} permissionId - Permission ID
 * @returns {boolean} - Has permission status
 */
export const roleHasPermission = (roleId, permissionId) => {
  return roleHasPermissionModel(roleId, permissionId);
};

/**
 * Check if role has any of the given permissions
 * @param {number} roleId - Role ID
 * @param {Array} permissionIds - Array of permission IDs
 * @returns {boolean} - Has any permission status
 */
export const roleHasAnyPermission = (roleId, permissionIds) => {
  return roleHasAnyPermissionModel(roleId, permissionIds);
};

/**
 * Get role-permission count
 * @returns {number} - Count of role-permission assignments
 */
export const getRolePermissionCount = () => {
  return getRolePermissionCountModel();
};

/**
 * Get permission count for a role
 * @param {number} roleId - Role ID
 * @returns {number} - Count of permissions assigned to role
 */
export const getPermissionCountForRole = (roleId) => {
  return getPermissionCountForRoleModel(roleId);
};

/**
 * Get role count for a permission
 * @param {number} permissionId - Permission ID
 * @returns {number} - Count of roles with this permission
 */
export const getRoleCountForPermission = (permissionId) => {
  return getRoleCountForPermissionModel(permissionId);
};

/**
 * Replace all permissions for a role
 * @param {number} roleId - Role ID
 * @param {Array} permissionIds - Array of permission IDs to assign
 * @param {number} assignedBy - User ID who assigned these permissions
 * @returns {Array} - Array of created assignments
 */
export const replaceRolePermissions = async (roleId, permissionIds, assignedBy = null) => {
  // Validate role exists
  const role = getRoleByIdModel(roleId);
  if (!role) {
    throw new Error(`Role with ID ${roleId} not found`);
  }

  // Validate all permissions exist
  for (const permissionId of permissionIds) {
    const permission = getPermissionByIdModel(permissionId);
    if (!permission) {
      throw new Error(`Permission with ID ${permissionId} not found`);
    }
  }

  return replaceRolePermissionsModel(roleId, permissionIds, assignedBy);
};

/**
 * Get statistics for role-permission assignments
 * @returns {Object} - Role-permission statistics
 */
export const getRolePermissionStatistics = () => {
  const allAssignments = getAllRolePermissionsModel();
  const totalCount = getRolePermissionCountModel();

  return {
    totalAssignments: totalCount,
    assignmentCount: allAssignments.length
  };
};

export default {
  ROLE_PERMISSIONS_TABLE,
  ROLE_PERMISSION_FIELDS,
  validateRolePermissionAssignment,
  assignPermissionToRole,
  getRolePermissionById,
  getRolePermissionByRoleAndPermission,
  getPermissionsByRoleId,
  getPermissionIdsByRoleId,
  getRolesByPermissionId,
  getPaginatedRolePermissions,
  getAllRolePermissions,
  removePermissionFromRole,
  removeAllPermissionsFromRole,
  roleHasPermission,
  roleHasAnyPermission,
  getRolePermissionCount,
  getPermissionCountForRole,
  getRoleCountForPermission,
  replaceRolePermissions,
  getRolePermissionStatistics
};

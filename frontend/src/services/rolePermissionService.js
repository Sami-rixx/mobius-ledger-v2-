/**
 * RolePermission Service
 * API client for role-permission assignment endpoints
 * 
 * Provides:
 * - CRUD operations for role-permission assignments
 * - Pagination support
 * - Filtering by role and permission
 * - Permission checking functionality
 * - Statistics
 */

import { api } from './api.js';

// Base URL for role-permission endpoints
const BASE_URL = '/api/role-permissions';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Get paginated list of role-permission assignments
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @param {number} params.roleId - Filter by role ID
 * @param {number} params.permissionId - Filter by permission ID
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - API response with data and pagination
 */
export const getRolePermissions = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.roleId !== undefined) queryParams.append('roleId', params.roleId);
  if (params.permissionId !== undefined) queryParams.append('permissionId', params.permissionId);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    throw error;
  }
};

/**
 * Get role-permission assignment count
 * @param {Object} params - Query parameters
 * @param {number} params.roleId - Filter by role ID
 * @param {number} params.permissionId - Filter by permission ID
 * @returns {Promise<Object>} - API response with count
 */
export const getRolePermissionCount = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.roleId !== undefined) queryParams.append('roleId', params.roleId);
  if (params.permissionId !== undefined) queryParams.append('permissionId', params.permissionId);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/count${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching role permission count:', error);
    throw error;
  }
};

/**
 * Get a single role-permission assignment by ID
 * @param {number} id - RolePermission ID
 * @returns {Promise<Object>} - API response with role-permission data
 */
export const getRolePermissionById = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching role permission ${id}:`, error);
    throw error;
  }
};

/**
 * Get role-permission by role and permission
 * @param {number} roleId - Role ID
 * @param {number} permissionId - Permission ID
 * @returns {Promise<Object>} - API response with role-permission data
 */
export const getRolePermissionByRoleAndPermission = async (roleId, permissionId) => {
  try {
    const response = await api.get(`${BASE_URL}/role/${roleId}/permission/${permissionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching role permission for role ${roleId} permission ${permissionId}:`, error);
    throw error;
  }
};

/**
 * Get all permissions for a role
 * @param {number} roleId - Role ID
 * @returns {Promise<Object>} - API response with permissions data
 */
export const getPermissionsForRole = async (roleId) => {
  try {
    const response = await api.get(`${BASE_URL}/role/${roleId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching permissions for role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Get permission IDs for a role
 * @param {number} roleId - Role ID
 * @returns {Promise<Object>} - API response with permission IDs
 */
export const getPermissionIdsForRole = async (roleId) => {
  try {
    const response = await api.get(`${BASE_URL}/role/${roleId}/ids`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching permission IDs for role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Get all roles for a permission
 * @param {number} permissionId - Permission ID
 * @returns {Promise<Object>} - API response with roles data
 */
export const getRolesForPermission = async (permissionId) => {
  try {
    const response = await api.get(`${BASE_URL}/permission/${permissionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching roles for permission ${permissionId}:`, error);
    throw error;
  }
};

/**
 * Check if role has a specific permission
 * @param {number} roleId - Role ID
 * @param {number} permissionId - Permission ID
 * @returns {Promise<Object>} - API response with boolean result
 */
export const checkRoleHasPermission = async (roleId, permissionId) => {
  try {
    const response = await api.get(`${BASE_URL}/role/${roleId}/has-permission/${permissionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error checking role ${roleId} has permission ${permissionId}:`, error);
    throw error;
  }
};

/**
 * Check if role has any of the given permissions
 * @param {number} roleId - Role ID
 * @param {Array<number>} permissionIds - Array of permission IDs to check
 * @returns {Promise<Object>} - API response with boolean result
 */
export const checkRoleHasAnyPermission = async (roleId, permissionIds) => {
  try {
    const response = await api.post(`${BASE_URL}/role/${roleId}/has-any-permission`, { permissionIds });
    return response.data;
  } catch (error) {
    console.error(`Error checking role ${roleId} has any permission:`, error);
    throw error;
  }
};

/**
 * Get permission count for a role
 * @param {number} roleId - Role ID
 * @returns {Promise<Object>} - API response with count
 */
export const getPermissionCountForRole = async (roleId) => {
  try {
    const response = await api.get(`${BASE_URL}/role/${roleId}/permissions/count`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching permission count for role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Get role count for a permission
 * @param {number} permissionId - Permission ID
 * @returns {Promise<Object>} - API response with count
 */
export const getRoleCountForPermission = async (permissionId) => {
  try {
    const response = await api.get(`${BASE_URL}/permission/${permissionId}/roles/count`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching role count for permission ${permissionId}:`, error);
    throw error;
  }
};

/**
 * Get role-permission statistics
 * @returns {Promise<Object>} - API response with statistics
 */
export const getRolePermissionStats = async () => {
  try {
    const response = await api.get(`${BASE_URL}/statistics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching role permission statistics:', error);
    throw error;
  }
};

/**
 * Assign permission to role
 * @param {Object} rolePermissionData - Role-permission data
 * @param {number} rolePermissionData.role_id - Role ID
 * @param {number} rolePermissionData.permission_id - Permission ID
 * @returns {Promise<Object>} - API response with created role-permission
 */
export const assignPermissionToRole = async (rolePermissionData) => {
  try {
    const response = await api.post(BASE_URL, rolePermissionData);
    return response.data;
  } catch (error) {
    console.error('Error assigning permission to role:', error);
    throw error;
  }
};

/**
 * Remove permission from role
 * @param {number} roleId - Role ID
 * @param {number} permissionId - Permission ID
 * @returns {Promise<Object>} - API response with deletion status
 */
export const removePermissionFromRole = async (roleId, permissionId) => {
  try {
    const response = await api.delete(`${BASE_URL}/role/${roleId}/permission/${permissionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing permission ${permissionId} from role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Remove all permissions from role
 * @param {number} roleId - Role ID
 * @returns {Promise<Object>} - API response with deletion status
 */
export const removeAllPermissionsFromRole = async (roleId) => {
  try {
    const response = await api.delete(`${BASE_URL}/role/${roleId}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing all permissions from role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Replace all permissions for a role
 * @param {number} roleId - Role ID
 * @param {Array<number>} permissionIds - Array of permission IDs to assign
 * @returns {Promise<Object>} - API response with update status
 */
export const replaceRolePermissions = async (roleId, permissionIds) => {
  try {
    const response = await api.put(`${BASE_URL}/role/${roleId}`, { permissionIds });
    return response.data;
  } catch (error) {
    console.error(`Error replacing permissions for role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Create pagination parameters object
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @returns {Object} - Pagination parameters
 */
export const createPaginationParams = (page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE) => ({
  page,
  pageSize
});

/**
 * Get role permissions as a map of permission name to permission object
 * @param {number} roleId - Role ID
 * @returns {Promise<Object>} - Map of permission name to permission object
 */
export const getRolePermissionsMap = async (roleId) => {
  try {
    const permissions = await getPermissionsForRole(roleId);
    const permissionMap = {};
    permissions.forEach(permission => {
      permissionMap[permission.name] = permission;
    });
    return permissionMap;
  } catch (error) {
    console.error(`Error getting permission map for role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Get permission names for a role
 * @param {number} roleId - Role ID
 * @returns {Promise<Array<string>>} - Array of permission names
 */
export const getPermissionNamesForRole = async (roleId) => {
  try {
    const permissions = await getPermissionsForRole(roleId);
    return permissions.map(permission => permission.name);
  } catch (error) {
    console.error(`Error getting permission names for role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Check if a role has all required permissions
 * @param {number} roleId - Role ID
 * @param {Array<number>} requiredPermissionIds - Array of required permission IDs
 * @returns {Promise<boolean>} - True if role has all required permissions
 */
export const roleHasAllPermissions = async (roleId, requiredPermissionIds) => {
  try {
    const result = await checkRoleHasAnyPermission(roleId, requiredPermissionIds);
    return result.hasAll || false;
  } catch (error) {
    console.error(`Error checking role ${roleId} has all permissions:`, error);
    return false;
  }
};

// Export all functions
export default {
  getRolePermissions,
  getRolePermissionCount,
  getRolePermissionById,
  getRolePermissionByRoleAndPermission,
  getPermissionsForRole,
  getPermissionIdsForRole,
  getRolesForPermission,
  checkRoleHasPermission,
  checkRoleHasAnyPermission,
  getPermissionCountForRole,
  getRoleCountForPermission,
  getRolePermissionStats,
  assignPermissionToRole,
  removePermissionFromRole,
  removeAllPermissionsFromRole,
  replaceRolePermissions,
  createPaginationParams,
  getRolePermissionsMap,
  getPermissionNamesForRole,
  roleHasAllPermissions,
  BASE_URL,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE
};

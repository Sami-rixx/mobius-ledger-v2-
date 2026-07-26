/**
 * UserRole Service
 * API client for user-role assignment endpoints
 * 
 * Provides:
 * - CRUD operations for user-role assignments
 * - Pagination support
 * - Filtering by user and role
 * - Role checking functionality
 * - Statistics
 */

import { api } from './api.js';

// Base URL for user-role endpoints
const BASE_URL = '/api/user-roles';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Get paginated list of user-role assignments
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @param {number} params.userId - Filter by user ID
 * @param {number} params.roleId - Filter by role ID
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - API response with data and pagination
 */
export const getUserRoles = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.userId !== undefined) queryParams.append('userId', params.userId);
  if (params.roleId !== undefined) queryParams.append('roleId', params.roleId);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    throw error;
  }
};

/**
 * Get user-role assignment count
 * @param {Object} params - Query parameters
 * @param {number} params.userId - Filter by user ID
 * @param {number} params.roleId - Filter by role ID
 * @returns {Promise<Object>} - API response with count
 */
export const getUserRoleCount = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.userId !== undefined) queryParams.append('userId', params.userId);
  if (params.roleId !== undefined) queryParams.append('roleId', params.roleId);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/count${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching user role count:', error);
    throw error;
  }
};

/**
 * Get a single user-role assignment by ID
 * @param {number} id - UserRole ID
 * @returns {Promise<Object>} - API response with user-role data
 */
export const getUserRoleById = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user role ${id}:`, error);
    throw error;
  }
};

/**
 * Get user-role assignment by user and role
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {Promise<Object>} - API response with user-role data
 */
export const getUserRoleByUserAndRole = async (userId, roleId) => {
  try {
    const response = await api.get(`${BASE_URL}/user/${userId}/role/${roleId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user role for user ${userId} role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Get all roles for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - API response with roles data
 */
export const getRolesForUser = async (userId) => {
  try {
    const response = await api.get(`${BASE_URL}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching roles for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get role IDs for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - API response with role IDs
 */
export const getRoleIdsForUser = async (userId) => {
  try {
    const response = await api.get(`${BASE_URL}/user/${userId}/ids`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching role IDs for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get all users for a role
 * @param {number} roleId - Role ID
 * @returns {Promise<Object>} - API response with users data
 */
export const getUsersForRole = async (roleId) => {
  try {
    const response = await api.get(`${BASE_URL}/role/${roleId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching users for role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Check if user has a specific role
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {Promise<Object>} - API response with boolean result
 */
export const checkUserHasRole = async (userId, roleId) => {
  try {
    const response = await api.get(`${BASE_URL}/user/${userId}/has-role/${roleId}`);
    return response.data;
  } catch (error) {
    console.error(`Error checking user ${userId} has role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Check if user has any of the given roles
 * @param {number} userId - User ID
 * @param {Array<number>} roleIds - Array of role IDs to check
 * @returns {Promise<Object>} - API response with boolean result
 */
export const checkUserHasAnyRole = async (userId, roleIds) => {
  try {
    const response = await api.post(`${BASE_URL}/user/${userId}/has-any-role`, { roleIds });
    return response.data;
  } catch (error) {
    console.error(`Error checking user ${userId} has any role:`, error);
    throw error;
  }
};

/**
 * Get user count for a role
 * @param {number} roleId - Role ID
 * @returns {Promise<Object>} - API response with count
 */
export const getUserCountForRole = async (roleId) => {
  try {
    const response = await api.get(`${BASE_URL}/role/${roleId}/users/count`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user count for role ${roleId}:`, error);
    throw error;
  }
};

/**
 * Get role count for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - API response with count
 */
export const getRoleCountForUser = async (userId) => {
  try {
    const response = await api.get(`${BASE_URL}/user/${userId}/roles/count`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching role count for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get user-role statistics
 * @returns {Promise<Object>} - API response with statistics
 */
export const getUserRoleStats = async () => {
  try {
    const response = await api.get(`${BASE_URL}/statistics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user role statistics:', error);
    throw error;
  }
};

/**
 * Assign role to user
 * @param {Object} userRoleData - User-role data
 * @param {number} userRoleData.user_id - User ID
 * @param {number} userRoleData.role_id - Role ID
 * @returns {Promise<Object>} - API response with created user-role
 */
export const assignRoleToUser = async (userRoleData) => {
  try {
    const response = await api.post(BASE_URL, userRoleData);
    return response.data;
  } catch (error) {
    console.error('Error assigning role to user:', error);
    throw error;
  }
};

/**
 * Remove role from user
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {Promise<Object>} - API response with deletion status
 */
export const removeRoleFromUser = async (userId, roleId) => {
  try {
    const response = await api.delete(`${BASE_URL}/user/${userId}/role/${roleId}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing role ${roleId} from user ${userId}:`, error);
    throw error;
  }
};

/**
 * Remove all roles from user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - API response with deletion status
 */
export const removeAllRolesFromUser = async (userId) => {
  try {
    const response = await api.delete(`${BASE_URL}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing all roles from user ${userId}:`, error);
    throw error;
  }
};

/**
 * Replace all roles for a user
 * @param {number} userId - User ID
 * @param {Array<number>} roleIds - Array of role IDs to assign
 * @returns {Promise<Object>} - API response with update status
 */
export const replaceUserRoles = async (userId, roleIds) => {
  try {
    const response = await api.put(`${BASE_URL}/user/${userId}`, { roleIds });
    return response.data;
  } catch (error) {
    console.error(`Error replacing roles for user ${userId}:`, error);
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
 * Check if user is an admin
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - True if user has admin role
 */
export const isUserAdmin = async (userId) => {
  try {
    // Assuming admin role has ID 1
    const result = await checkUserHasRole(userId, 1);
    return result.hasRole || false;
  } catch (error) {
    console.error(`Error checking if user ${userId} is admin:`, error);
    return false;
  }
};

/**
 * Get user roles as a map of role name to role object
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Map of role name to role object
 */
export const getUserRolesMap = async (userId) => {
  try {
    const roles = await getRolesForUser(userId);
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.name] = role;
    });
    return roleMap;
  } catch (error) {
    console.error(`Error getting role map for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get role names for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array<string>>} - Array of role names
 */
export const getRoleNamesForUser = async (userId) => {
  try {
    const roles = await getRolesForUser(userId);
    return roles.map(role => role.name);
  } catch (error) {
    console.error(`Error getting role names for user ${userId}:`, error);
    throw error;
  }
};

// Export all functions
export default {
  getUserRoles,
  getUserRoleCount,
  getUserRoleById,
  getUserRoleByUserAndRole,
  getRolesForUser,
  getRoleIdsForUser,
  getUsersForRole,
  checkUserHasRole,
  checkUserHasAnyRole,
  getUserCountForRole,
  getRoleCountForUser,
  getUserRoleStats,
  assignRoleToUser,
  removeRoleFromUser,
  removeAllRolesFromUser,
  replaceUserRoles,
  createPaginationParams,
  isUserAdmin,
  getUserRolesMap,
  getRoleNamesForUser,
  BASE_URL,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE
};

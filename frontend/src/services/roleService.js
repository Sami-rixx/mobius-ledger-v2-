/**
 * Role Service
 * API client for role endpoints
 * 
 * Provides:
 * - CRUD operations for roles
 * - Pagination support
 * - Filtering by name, default status, active status
 * - Role-permission management
 * - Search functionality
 * - Statistics
 */

import { api } from './api.js';

// Base URL for role endpoints
const BASE_URL = '/api/roles';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Get paginated list of roles
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @param {string} params.search - Search term
 * @param {boolean} params.isDefault - Filter by default status
 * @param {boolean} params.isActive - Filter by active status
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - API response with data and pagination
 */
export const getRoles = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.search) queryParams.append('search', params.search);
  if (params.isDefault !== undefined) queryParams.append('isDefault', params.isDefault);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

/**
 * Get role count
 * @param {Object} params - Query parameters
 * @param {string} params.search - Search term
 * @param {boolean} params.isDefault - Filter by default status
 * @param {boolean} params.isActive - Filter by active status
 * @returns {Promise<Object>} - API response with count
 */
export const getRoleCount = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.search) queryParams.append('search', params.search);
  if (params.isDefault !== undefined) queryParams.append('isDefault', params.isDefault);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/count${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching role count:', error);
    throw error;
  }
};

/**
 * Get a single role by ID
 * @param {number} id - Role ID
 * @returns {Promise<Object>} - API response with role data
 */
export const getRoleById = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching role ${id}:`, error);
    throw error;
  }
};

/**
 * Get role by name
 * @param {string} name - Role name
 * @returns {Promise<Object>} - API response with role data
 */
export const getRoleByName = async (name) => {
  try {
    const response = await api.get(`${BASE_URL}/name/${encodeURIComponent(name)}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching role by name ${name}:`, error);
    throw error;
  }
};

/**
 * Get default role
 * @returns {Promise<Object>} - API response with default role data
 */
export const getDefaultRole = async () => {
  try {
    const response = await api.get(`${BASE_URL}/default`);
    return response.data;
  } catch (error) {
    console.error('Error fetching default role:', error);
    throw error;
  }
};

/**
 * Check if role exists
 * @param {string} name - Role name
 * @returns {Promise<Object>} - API response with exists status
 */
export const checkRoleExists = async (name) => {
  try {
    const response = await api.get(`${BASE_URL}/check/${encodeURIComponent(name)}`);
    return response.data;
  } catch (error) {
    console.error(`Error checking role ${name}:`, error);
    throw error;
  }
};

/**
 * Get roles with permission count
 * @returns {Promise<Object>} - API response with roles and permission counts
 */
export const getRolesWithPermissionCount = async () => {
  try {
    const response = await api.get(`${BASE_URL}/with-permissions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching roles with permission count:', error);
    throw error;
  }
};

/**
 * Search roles
 * @param {Object} params - Query parameters
 * @param {string} params.query - Search query
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @returns {Promise<Object>} - API response with search results
 */
export const searchRoles = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.query) queryParams.append('query', params.query);
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/search${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error searching roles:', error);
    throw error;
  }
};

/**
 * Get role statistics
 * @returns {Promise<Object>} - API response with statistics
 */
export const getRoleStats = async () => {
  try {
    const response = await api.get(`${BASE_URL}/statistics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching role statistics:', error);
    throw error;
  }
};

/**
 * Get all default role names
 * @returns {Promise<Object>} - API response with default role names
 */
export const getDefaultRoleNames = async () => {
  try {
    const response = await api.get(`${BASE_URL}/default-names`);
    return response.data;
  } catch (error) {
    console.error('Error fetching default role names:', error);
    throw error;
  }
};

/**
 * Create a new role
 * @param {Object} roleData - Role data
 * @param {string} roleData.name - Role name
 * @param {string} roleData.description - Role description
 * @param {boolean} roleData.is_default - Default status
 * @param {boolean} roleData.is_active - Active status
 * @returns {Promise<Object>} - API response with created role
 */
export const createRole = async (roleData) => {
  try {
    const response = await api.post(BASE_URL, roleData);
    return response.data;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

/**
 * Update a role
 * @param {number} id - Role ID
 * @param {Object} roleData - Role data to update
 * @returns {Promise<Object>} - API response with updated role
 */
export const updateRole = async (id, roleData) => {
  try {
    const response = await api.put(`${BASE_URL}/${id}`, roleData);
    return response.data;
  } catch (error) {
    console.error(`Error updating role ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a role
 * @param {number} id - Role ID
 * @returns {Promise<Object>} - API response with deletion status
 */
export const deleteRole = async (id) => {
  try {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting role ${id}:`, error);
    throw error;
  }
};

/**
 * Set a role as default
 * @param {number} id - Role ID
 * @returns {Promise<Object>} - API response with update status
 */
export const setDefaultRole = async (id) => {
  try {
    const response = await api.post(`${BASE_URL}/set-default`, { id });
    return response.data;
  } catch (error) {
    console.error(`Error setting default role ${id}:`, error);
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
 * Get active roles
 * @param {Object} paginationParams - Pagination parameters
 * @returns {Promise<Object>} - API response with active roles
 */
export const getActiveRoles = async (paginationParams = {}) => {
  return getRoles({ ...paginationParams, isActive: true });
};

/**
 * Get inactive roles
 * @param {Object} paginationParams - Pagination parameters
 * @returns {Promise<Object>} - API response with inactive roles
 */
export const getInactiveRoles = async (paginationParams = {}) => {
  return getRoles({ ...paginationParams, isActive: false });
};

/**
 * Get default roles
 * @param {Object} paginationParams - Pagination parameters
 * @returns {Promise<Object>} - API response with default roles
 */
export const getDefaultRoles = async (paginationParams = {}) => {
  return getRoles({ ...paginationParams, isDefault: true });
};

// Export all functions
export default {
  getRoles,
  getRoleCount,
  getRoleById,
  getRoleByName,
  getDefaultRole,
  checkRoleExists,
  getRolesWithPermissionCount,
  searchRoles,
  getRoleStats,
  getDefaultRoleNames,
  createRole,
  updateRole,
  deleteRole,
  setDefaultRole,
  createPaginationParams,
  getActiveRoles,
  getInactiveRoles,
  getDefaultRoles,
  BASE_URL,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE
};

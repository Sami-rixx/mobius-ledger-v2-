/**
 * Permission Service
 * API client for permission endpoints
 * 
 * Provides:
 * - CRUD operations for permissions
 * - Pagination support
 * - Filtering by module, name, active status
 * - Search functionality
 * - Statistics
 */

import { api } from './api.js';

// Base URL for permission endpoints
const BASE_URL = '/api/permissions';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Get paginated list of permissions
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @param {string} params.module - Filter by module
 * @param {string} params.search - Search term
 * @param {boolean} params.isActive - Filter by active status
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - API response with data and pagination
 */
export const getPermissions = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.module) queryParams.append('module', params.module);
  if (params.search) queryParams.append('search', params.search);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching permissions:', error);
    throw error;
  }
};

/**
 * Get permission count
 * @param {Object} params - Query parameters
 * @param {string} params.module - Filter by module
 * @param {string} params.search - Search term
 * @param {boolean} params.isActive - Filter by active status
 * @returns {Promise<Object>} - API response with count
 */
export const getPermissionCount = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.module) queryParams.append('module', params.module);
  if (params.search) queryParams.append('search', params.search);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/count${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching permission count:', error);
    throw error;
  }
};

/**
 * Get a single permission by ID
 * @param {number} id - Permission ID
 * @returns {Promise<Object>} - API response with permission data
 */
export const getPermissionById = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching permission ${id}:`, error);
    throw error;
  }
};

/**
 * Get permission by name
 * @param {string} name - Permission name
 * @returns {Promise<Object>} - API response with permission data
 */
export const getPermissionByName = async (name) => {
  try {
    const response = await api.get(`${BASE_URL}/name/${encodeURIComponent(name)}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching permission by name ${name}:`, error);
    throw error;
  }
};

/**
 * Get permissions by module
 * @param {string} module - Module name
 * @returns {Promise<Object>} - API response with permissions data
 */
export const getPermissionsByModule = async (module) => {
  try {
    const response = await api.get(`${BASE_URL}/module/${encodeURIComponent(module)}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching permissions by module ${module}:`, error);
    throw error;
  }
};

/**
 * Check if permission exists
 * @param {string} name - Permission name
 * @returns {Promise<Object>} - API response with exists status
 */
export const checkPermissionExists = async (name) => {
  try {
    const response = await api.get(`${BASE_URL}/check/${encodeURIComponent(name)}`);
    return response.data;
  } catch (error) {
    console.error(`Error checking permission ${name}:`, error);
    throw error;
  }
};

/**
 * Search permissions
 * @param {Object} params - Query parameters
 * @param {string} params.query - Search query
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @returns {Promise<Object>} - API response with search results
 */
export const searchPermissions = async (params = {}) => {
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
    console.error('Error searching permissions:', error);
    throw error;
  }
};

/**
 * Get permission statistics
 * @returns {Promise<Object>} - API response with statistics
 */
export const getPermissionStats = async () => {
  try {
    const response = await api.get(`${BASE_URL}/statistics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching permission statistics:', error);
    throw error;
  }
};

/**
 * Get all permission modules
 * @returns {Promise<Object>} - API response with modules
 */
export const getPermissionModules = async () => {
  try {
    const response = await api.get(`${BASE_URL}/modules`);
    return response.data;
  } catch (error) {
    console.error('Error fetching permission modules:', error);
    throw error;
  }
};

/**
 * Get permission count by module
 * @returns {Promise<Object>} - API response with count by module
 */
export const getPermissionCountByModule = async () => {
  try {
    const response = await api.get(`${BASE_URL}/count-by-module`);
    return response.data;
  } catch (error) {
    console.error('Error fetching permission count by module:', error);
    throw error;
  }
};

/**
 * Create a new permission
 * @param {Object} permissionData - Permission data
 * @param {string} permissionData.name - Permission name
 * @param {string} permissionData.description - Permission description
 * @param {string} permissionData.module - Permission module
 * @param {boolean} permissionData.is_active - Active status
 * @returns {Promise<Object>} - API response with created permission
 */
export const createPermission = async (permissionData) => {
  try {
    const response = await api.post(BASE_URL, permissionData);
    return response.data;
  } catch (error) {
    console.error('Error creating permission:', error);
    throw error;
  }
};

/**
 * Update a permission
 * @param {number} id - Permission ID
 * @param {Object} permissionData - Permission data to update
 * @returns {Promise<Object>} - API response with updated permission
 */
export const updatePermission = async (id, permissionData) => {
  try {
    const response = await api.put(`${BASE_URL}/${id}`, permissionData);
    return response.data;
  } catch (error) {
    console.error(`Error updating permission ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a permission
 * @param {number} id - Permission ID
 * @returns {Promise<Object>} - API response with deletion status
 */
export const deletePermission = async (id) => {
  try {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting permission ${id}:`, error);
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
 * Get paginated permissions for a specific module
 * @param {string} module - Module name
 * @param {Object} paginationParams - Pagination parameters
 * @returns {Promise<Object>} - API response with data and pagination
 */
export const getPermissionsByModulePaginated = async (module, paginationParams = {}) => {
  return getPermissions({ ...paginationParams, module });
};

/**
 * Get active permissions
 * @param {Object} paginationParams - Pagination parameters
 * @returns {Promise<Object>} - API response with active permissions
 */
export const getActivePermissions = async (paginationParams = {}) => {
  return getPermissions({ ...paginationParams, isActive: true });
};

/**
 * Get inactive permissions
 * @param {Object} paginationParams - Pagination parameters
 * @returns {Promise<Object>} - API response with inactive permissions
 */
export const getInactivePermissions = async (paginationParams = {}) => {
  return getPermissions({ ...paginationParams, isActive: false });
};

// Export all functions
export default {
  getPermissions,
  getPermissionCount,
  getPermissionById,
  getPermissionByName,
  getPermissionsByModule,
  checkPermissionExists,
  searchPermissions,
  getPermissionStats,
  getPermissionModules,
  getPermissionCountByModule,
  createPermission,
  updatePermission,
  deletePermission,
  createPaginationParams,
  getPermissionsByModulePaginated,
  getActivePermissions,
  getInactivePermissions,
  BASE_URL,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE
};

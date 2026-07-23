/**
 * Class Service
 * API client for class management operations
 * Centralizes all class-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for class API endpoints
 */
const BASE_URL = '/classes';

/**
 * Get paginated list of classes
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {string} params.search - Search term for name or description
 * @param {boolean} params.isActive - Filter by active status
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - Paginated result with classes and metadata
 */
export const getClasses = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.search) queryParams.append('search', params.search);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get all classes without pagination
 * @param {Object} params - Query parameters
 * @param {string} params.search - Search term
 * @param {boolean} params.isActive - Filter by active status
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - All matching classes
 */
export const getAllClasses = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.search) queryParams.append('search', params.search);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/all${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get a single class by ID
 * @param {number} id - Class ID
 * @returns {Promise<Object>} - Class object
 */
export const getClassById = async (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Get a class by name
 * @param {string} name - Class name
 * @returns {Promise<Object>} - Class object
 */
export const getClassByName = async (name) => {
  return api.get(`${BASE_URL}/name/${encodeURIComponent(name)}`);
};

/**
 * Create a new class
 * @param {Object} classData - Class data
 * @param {string} classData.name - Class name (required)
 * @param {string} classData.description - Class description
 * @param {boolean} classData.is_active - Active status
 * @returns {Promise<Object>} - Created class
 */
export const createClass = async (classData) => {
  return api.post(BASE_URL, classData);
};

/**
 * Update a class (full update)
 * @param {number} id - Class ID
 * @param {Object} classData - Complete class data
 * @returns {Promise<Object>} - Updated class
 */
export const updateClass = async (id, classData) => {
  return api.put(`${BASE_URL}/${id}`, classData);
};

/**
 * Partially update a class
 * @param {number} id - Class ID
 * @param {Object} classData - Partial class data
 * @returns {Promise<Object>} - Updated class
 */
export const patchClass = async (id, classData) => {
  return api.patch(`${BASE_URL}/${id}`, classData);
};

/**
 * Delete a class
 * @param {number} id - Class ID
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteClass = async (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

/**
 * Get all active classes
 * @returns {Promise<Object>} - Array of active classes
 */
export const getActiveClasses = async () => {
  return api.get(`${BASE_URL}/active`);
};

/**
 * Search classes by name or description
 * @param {string} query - Search query (minimum 2 characters)
 * @returns {Promise<Object>} - Matching classes
 */
export const searchClasses = async (query) => {
  return api.get(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
};

/**
 * Get class statistics
 * @returns {Promise<Object>} - Class statistics (total, active, inactive)
 */
export const getClassStatistics = async () => {
  return api.get(`${BASE_URL}/statistics`);
};

/**
 * Get classes with student counts
 * @returns {Promise<Object>} - Classes with student count
 */
export const getClassesWithStudentCounts = async () => {
  return api.get(`${BASE_URL}/with-students`);
};

/**
 * Check if class name is available
 * @param {string} name - Class name to check
 * @param {number} excludeId - Class ID to exclude from check (for updates)
 * @returns {Promise<Object>} - Availability status
 */
export const checkClassName = async (name, excludeId = null) => {
  const url = excludeId 
    ? `${BASE_URL}/check-name/${encodeURIComponent(name)}?excludeId=${excludeId}`
    : `${BASE_URL}/check-name/${encodeURIComponent(name)}`;
  return api.get(url);
};

// Export all functions
export default {
  getClasses,
  getAllClasses,
  getClassById,
  getClassByName,
  createClass,
  updateClass,
  patchClass,
  deleteClass,
  getActiveClasses,
  searchClasses,
  getClassStatistics,
  getClassesWithStudentCounts,
  checkClassName
};

/**
 * Income Category Service
 * API client for income category management operations
 * Centralizes all income category-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for income category API endpoints
 */
const BASE_URL = '/income-categories';

/**
 * Get paginated list of income categories
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {string} params.search - Search term for name or description
 * @param {boolean} params.isActive - Filter by active status
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - Paginated result with categories and metadata
 */
export const getIncomeCategories = async (params = {}) => {
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
 * Get all income categories without pagination
 * @returns {Promise<Array>} - Array of all income categories
 */
export const getAllIncomeCategories = async () => {
  return api.get(`${BASE_URL}/all`);
};

/**
 * Get all active income categories
 * @returns {Promise<Array>} - Array of active income categories
 */
export const getActiveIncomeCategories = async () => {
  return api.get(`${BASE_URL}/active`);
};

/**
 * Get a single income category by ID
 * @param {number} id - Income category ID
 * @returns {Promise<Object>} - Income category object
 */
export const getIncomeCategoryById = async (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Get income category by name
 * @param {string} name - Category name
 * @returns {Promise<Object>} - Income category object
 */
export const getIncomeCategoryByName = async (name) => {
  return api.get(`${BASE_URL}/name/${encodeURIComponent(name)}`);
};

/**
 * Get income categories with usage count
 * @returns {Promise<Array>} - Categories with usage count
 */
export const getIncomeCategoriesWithUsage = async () => {
  return api.get(`${BASE_URL}/usage`);
};

/**
 * Get count of income categories
 * @returns {Promise<Object>} - Count of income categories
 */
export const getIncomeCategoryCount = async () => {
  return api.get(`${BASE_URL}/count`);
};

/**
 * Create a new income category
 * @param {Object} categoryData - Income category data
 * @param {string} categoryData.name - Category name (required)
 * @param {string} categoryData.description - Category description
 * @param {boolean} categoryData.is_active - Active status
 * @param {string} categoryData.color - Display color
 * @param {string} categoryData.icon - Icon identifier
 * @returns {Promise<Object>} - Created income category
 */
export const createIncomeCategory = async (categoryData) => {
  return api.post(BASE_URL, categoryData);
};

/**
 * Update an income category (full update)
 * @param {number} id - Income category ID
 * @param {Object} categoryData - Complete category data
 * @returns {Promise<Object>} - Updated income category
 */
export const updateIncomeCategory = async (id, categoryData) => {
  return api.put(`${BASE_URL}/${id}`, categoryData);
};

/**
 * Delete an income category
 * @param {number} id - Income category ID
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteIncomeCategory = async (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

// Export all functions
export default {
  getIncomeCategories,
  getAllIncomeCategories,
  getActiveIncomeCategories,
  getIncomeCategoryById,
  getIncomeCategoryByName,
  getIncomeCategoriesWithUsage,
  getIncomeCategoryCount,
  createIncomeCategory,
  updateIncomeCategory,
  deleteIncomeCategory
};

/**
 * Expense Category Service
 * API client for expense category management operations
 * Centralizes all expense category-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for expense category API endpoints
 */
const BASE_URL = '/expense-categories';

/**
 * Get paginated list of expense categories
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {string} params.search - Search term for name or description
 * @param {boolean} params.isActive - Filter by active status
 * @param {boolean} params.isKitchen - Filter by kitchen flag
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - Paginated result with categories and metadata
 */
export const getExpenseCategories = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.search) queryParams.append('search', params.search);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  if (params.isKitchen !== undefined) queryParams.append('isKitchen', params.isKitchen);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get all expense categories without pagination
 * @returns {Promise<Array>} - Array of all expense categories
 */
export const getAllExpenseCategories = async () => {
  return api.get(`${BASE_URL}/all`);
};

/**
 * Get all active expense categories
 * @returns {Promise<Array>} - Array of active expense categories
 */
export const getActiveExpenseCategories = async () => {
  return api.get(`${BASE_URL}/active`);
};

/**
 * Get all kitchen expense categories
 * @returns {Promise<Array>} - Array of kitchen expense categories
 */
export const getKitchenExpenseCategories = async () => {
  return api.get(`${BASE_URL}/kitchen`);
};

/**
 * Get root expense categories (categories without a parent)
 * @returns {Promise<Array>} - Array of root expense categories
 */
export const getRootExpenseCategories = async () => {
  return api.get(`${BASE_URL}/root`);
};

/**
 * Get child categories for a specific parent
 * @param {number} parentId - Parent category ID
 * @returns {Promise<Array>} - Array of child categories
 */
export const getChildExpenseCategories = async (parentId) => {
  return api.get(`${BASE_URL}/parent/${parentId}`);
};

/**
 * Get hierarchical category tree
 * @returns {Promise<Array>} - Hierarchical tree structure of categories
 */
export const getExpenseCategoryTree = async () => {
  return api.get(`${BASE_URL}/tree`);
};

/**
 * Get a single expense category by ID
 * @param {number} id - Expense category ID
 * @returns {Promise<Object>} - Expense category object
 */
export const getExpenseCategoryById = async (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Get expense category by name
 * @param {string} name - Category name
 * @returns {Promise<Object>} - Expense category object
 */
export const getExpenseCategoryByName = async (name) => {
  return api.get(`${BASE_URL}/name/${encodeURIComponent(name)}`);
};

/**
 * Get categories with usage count (number of expenses in each category)
 * @returns {Promise<Array>} - Categories with usage count
 */
export const getExpenseCategoriesWithUsage = async () => {
  return api.get(`${BASE_URL}/usage`);
};

/**
 * Get count of expense categories
 * @returns {Promise<Object>} - Count information
 */
export const getExpenseCategoryCount = async () => {
  return api.get(`${BASE_URL}/count`);
};

/**
 * Check if a category name already exists
 * @param {string} name - Category name to check
 * @returns {Promise<Object>} - Object with exists boolean
 */
export const checkExpenseCategoryNameExists = async (name) => {
  return api.get(`${BASE_URL}/check-name/${encodeURIComponent(name)}`);
};

/**
 * Create a new expense category
 * @param {Object} categoryData - Expense category data
 * @param {string} categoryData.name - Category name (required)
 * @param {string} categoryData.description - Category description
 * @param {number} categoryData.parent_id - Parent category ID (optional, for hierarchy)
 * @param {boolean} categoryData.is_active - Active status
 * @param {boolean} categoryData.is_system - System category flag
 * @param {boolean} categoryData.is_kitchen - Kitchen category flag
 * @param {number} categoryData.created_by - User ID who created the category
 * @returns {Promise<Object>} - Created expense category
 */
export const createExpenseCategory = async (categoryData) => {
  return api.post(BASE_URL, categoryData);
};

/**
 * Update an expense category (full update)
 * @param {number} id - Expense category ID
 * @param {Object} categoryData - Complete category data
 * @returns {Promise<Object>} - Updated expense category
 */
export const updateExpenseCategory = async (id, categoryData) => {
  return api.put(`${BASE_URL}/${id}`, categoryData);
};

/**
 * Delete an expense category
 * @param {number} id - Expense category ID
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteExpenseCategory = async (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

// Export all functions
export default {
  getExpenseCategories,
  getAllExpenseCategories,
  getActiveExpenseCategories,
  getKitchenExpenseCategories,
  getRootExpenseCategories,
  getChildExpenseCategories,
  getExpenseCategoryTree,
  getExpenseCategoryById,
  getExpenseCategoryByName,
  getExpenseCategoriesWithUsage,
  getExpenseCategoryCount,
  checkExpenseCategoryNameExists,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory
};

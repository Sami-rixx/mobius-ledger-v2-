/**
 * User Service
 * API client for user-related operations
 * Part of Authorization & Permissions module
 */

import { api } from './api.js';

// User service base path
const USER_BASE_PATH = '/api/users';

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise} - Resolves to user data
 */
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`${USER_BASE_PATH}/${userId}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get all users (paginated)
 * @param {Object} params - Query parameters
 * @returns {Promise} - Resolves to paginated user list
 */
export const getUsers = async (params = {}) => {
  try {
    const response = await api.get(USER_BASE_PATH, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Get all users (non-paginated)
 * @returns {Promise} - Resolves to array of all users
 */
export const getAllUsers = async () => {
  try {
    const response = await api.get(`${USER_BASE_PATH}/all`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise} - Resolves to created user
 */
export const createUser = async (userData) => {
  try {
    const response = await api.post(USER_BASE_PATH, userData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update user
 * @param {number} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise} - Resolves to updated user
 */
export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`${USER_BASE_PATH}/${userId}`, userData);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    throw error;
  }
};

/**
 * Delete user
 * @param {number} userId - User ID
 * @returns {Promise} - Resolves on successful deletion
 */
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`${USER_BASE_PATH}/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
};

/**
 * Search users
 * @param {Object} params - Search parameters
 * @returns {Promise} - Resolves to search results
 */
export const searchUsers = async (params = {}) => {
  try {
    const response = await api.get(`${USER_BASE_PATH}/search`, { params });
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

/**
 * Get user count
 * @returns {Promise} - Resolves to user count
 */
export const getUserCount = async () => {
  try {
    const response = await api.get(`${USER_BASE_PATH}/count`);
    return response.data.data || 0;
  } catch (error) {
    console.error('Error fetching user count:', error);
    throw error;
  }
};

/**
 * Get users by role
 * @param {number} roleId - Role ID
 * @returns {Promise} - Resolves to array of users
 */
export const getUsersByRole = async (roleId) => {
  try {
    const response = await api.get(`${USER_BASE_PATH}/role/${roleId}`);
    return response.data.data || [];
  } catch (error) {
    console.error(`Error fetching users by role ${roleId}:`, error);
    throw error;
  }
};

// User validation helpers
/**
 * Validate user data
 * @param {Object} userData - User data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateUserData = (userData) => {
  const errors = {};
  const { username, email, password } = userData;

  if (!username || username.trim().length === 0) {
    errors.username = 'Username is required';
  }

  if (!email || email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = 'Invalid email format';
  }

  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Default pagination settings
export const DEFAULT_USER_PAGINATION = {
  page: 1,
  pageSize: 10,
  sortBy: 'username',
  sortOrder: 'asc'
};

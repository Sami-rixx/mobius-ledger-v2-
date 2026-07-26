/**
 * UserSession Service
 * API client for user session endpoints
 * 
 * Provides:
 * - CRUD operations for user sessions
 * - Pagination support
 * - Filtering by user ID, active status, IP address
 * - Session validation
 * - Session lifecycle management
 * - Statistics
 * - Force logout
 * - Cleanup expired sessions
 */

import { api } from './api.js';

// Base URL for user session endpoints
const BASE_URL = '/api/user-sessions';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Get paginated list of user sessions
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @param {number} params.userId - Filter by user ID
 * @param {boolean} params.isActive - Filter by active status
 * @param {string} params.ipAddress - Filter by IP address
 * @param {string} params.search - Search term
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - API response with data and pagination
 */
export const getSessions = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.userId !== undefined) queryParams.append('userId', params.userId);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  if (params.ipAddress) queryParams.append('ipAddress', params.ipAddress);
  if (params.search) queryParams.append('search', params.search);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    throw error;
  }
};

/**
 * Get user session count
 * @param {Object} params - Query parameters
 * @param {number} params.userId - Filter by user ID
 * @param {boolean} params.isActive - Filter by active status
 * @returns {Promise<Object>} - API response with count
 */
export const getSessionCount = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.userId !== undefined) queryParams.append('userId', params.userId);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/count${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching session count:', error);
    throw error;
  }
};

/**
 * Get a single user session by ID
 * @param {number} id - Session ID
 * @returns {Promise<Object>} - API response with session data
 */
export const getSessionById = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching session ${id}:`, error);
    throw error;
  }
};

/**
 * Get a user session by session token
 * @param {string} sessionToken - Session token
 * @returns {Promise<Object>} - API response with session data
 */
export const getSessionByToken = async (sessionToken) => {
  try {
    const response = await api.get(`${BASE_URL}/token/${encodeURIComponent(sessionToken)}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching session by token ${sessionToken}:`, error);
    throw error;
  }
};

/**
 * Get all active sessions for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - API response with sessions array
 */
export const getActiveSessionsByUser = async (userId) => {
  try {
    const response = await api.get(`${BASE_URL}/user/${userId}/active`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching active sessions for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Create a new user session
 * @param {Object} sessionData - Session data
 * @param {number} sessionData.userId - User ID
 * @param {string} sessionData.sessionToken - Session token
 * @param {string} sessionData.ipAddress - Client IP address
 * @param {string} sessionData.userAgent - Client user agent
 * @param {Date|string} sessionData.expiresAt - Expiration timestamp
 * @returns {Promise<Object>} - API response with created session
 */
export const createSession = async (sessionData) => {
  try {
    const response = await api.post(BASE_URL, sessionData);
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

/**
 * Update a user session
 * @param {number} id - Session ID
 * @param {Object} sessionData - Session data to update
 * @returns {Promise<Object>} - API response with updated session
 */
export const updateSession = async (id, sessionData) => {
  try {
    const response = await api.put(`${BASE_URL}/${id}`, sessionData);
    return response.data;
  } catch (error) {
    console.error(`Error updating session ${id}:`, error);
    throw error;
  }
};

/**
 * Deactivate a user session (logout)
 * @param {number} id - Session ID
 * @returns {Promise<Object>} - API response with success status
 */
export const deactivateSession = async (id) => {
  try {
    const response = await api.post(`${BASE_URL}/${id}/deactivate`);
    return response.data;
  } catch (error) {
    console.error(`Error deactivating session ${id}:`, error);
    throw error;
  }
};

/**
 * Deactivate all sessions for a user (force logout)
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - API response with success status and count
 */
export const deactivateAllSessionsByUser = async (userId) => {
  try {
    const response = await api.post(`${BASE_URL}/user/${userId}/deactivate-all`);
    return response.data;
  } catch (error) {
    console.error(`Error deactivating all sessions for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Deactivate all expired sessions (cleanup)
 * @returns {Promise<Object>} - API response with cleanup result
 */
export const cleanupExpiredSessions = async () => {
  try {
    const response = await api.post(`${BASE_URL}/cleanup`);
    return response.data;
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    throw error;
  }
};

/**
 * Delete a user session
 * @param {number} id - Session ID
 * @returns {Promise<Object>} - API response with success status
 */
export const deleteSession = async (id) => {
  try {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting session ${id}:`, error);
    throw error;
  }
};

/**
 * Delete all sessions for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - API response with success status
 */
export const deleteAllSessionsByUser = async (userId) => {
  try {
    const response = await api.delete(`${BASE_URL}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting all sessions for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Validate a session token
 * @param {string} sessionToken - Session token to validate
 * @returns {Promise<Object>} - API response with validation result and session data
 */
export const validateSessionToken = async (sessionToken) => {
  try {
    const response = await api.post(`${BASE_URL}/validate`, { sessionToken });
    return response.data;
  } catch (error) {
    console.error('Error validating session token:', error);
    throw error;
  }
};

/**
 * Extend a session's expiration time
 * @param {number} id - Session ID
 * @param {number} extendByHours - Hours to extend by (default 24)
 * @returns {Promise<Object>} - API response with updated session
 */
export const extendSession = async (id, extendByHours = 24) => {
  try {
    const response = await api.post(`${BASE_URL}/${id}/extend`, { extendByHours });
    return response.data;
  } catch (error) {
    console.error(`Error extending session ${id}:`, error);
    throw error;
  }
};

/**
 * Get session statistics
 * @returns {Promise<Object>} - API response with session statistics
 */
export const getSessionStats = async () => {
  try {
    const response = await api.get(`${BASE_URL}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching session statistics:', error);
    throw error;
  }
};

/**
 * Force logout a user by deactivating all their sessions
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - API response with result
 */
export const forceLogoutUser = async (userId) => {
  return deactivateAllSessionsByUser(userId);
};

/**
 * Get current user's active session (if available)
 * This is a convenience function that assumes the current user's ID is available
 * @param {number} currentUserId - Current user ID
 * @returns {Promise<Array>} - Active sessions for current user
 */
export const getCurrentUserSessions = async (currentUserId) => {
  return getActiveSessionsByUser(currentUserId);
};

/**
 * Check if a session token is valid and active
 * @param {string} sessionToken - Session token to check
 * @returns {Promise<boolean>} - Whether the session is valid
 */
export const isSessionValid = async (sessionToken) => {
  try {
    const result = await validateSessionToken(sessionToken);
    return result.valid === true;
  } catch (error) {
    return false;
  }
};

// Export constants
const DEFAULT_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

// Pagination helper
/**
 * Create pagination parameters with defaults
 * @param {Object} params - Input parameters
 * @returns {Object} - Parameters with defaults applied
 */
export const createPaginationParams = (params = {}) => ({
  page: params.page || DEFAULT_PAGE,
  pageSize: params.pageSize || DEFAULT_PAGE_SIZE
});

// Re-export all functions for convenience
export default {
  getSessions,
  getSessionCount,
  getSessionById,
  getSessionByToken,
  getActiveSessionsByUser,
  createSession,
  updateSession,
  deactivateSession,
  deactivateAllSessionsByUser,
  cleanupExpiredSessions,
  deleteSession,
  deleteAllSessionsByUser,
  validateSessionToken,
  extendSession,
  getSessionStats,
  forceLogoutUser,
  getCurrentUserSessions,
  isSessionValid,
  createPaginationParams,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  BASE_URL
};

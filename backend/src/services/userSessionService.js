/**
 * UserSession Service
 * Business logic layer for user session management
 * 
 * Handles:
 * - Session validation
 * - Business rule enforcement
 * - Pagination
 * - Advanced filtering and search
 * - Session lifecycle management
 */

import {
  createUserSession as createUserSessionModel,
  getUserSessionById as getUserSessionByIdModel,
  getUserSessionByToken as getUserSessionByTokenModel,
  getActiveSessionsByUser as getActiveSessionsByUserModel,
  getAllUserSessions as getAllUserSessionsModel,
  updateUserSession as updateUserSessionModel,
  deactivateUserSession as deactivateUserSessionModel,
  deactivateAllUserSessions as deactivateAllUserSessionsModel,
  deactivateExpiredSessions as deactivateExpiredSessionsModel,
  deleteUserSession as deleteUserSessionModel,
  deleteAllUserSessions as deleteAllUserSessionsModel,
  getUserSessionCount as getUserSessionCountModel,
  validateSessionToken as validateSessionTokenModel,
  extendUserSession as extendUserSessionModel,
  USER_SESSIONS_TABLE,
  USER_SESSION_FIELDS
} from '../models/UserSession.js';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Validation constants
 */
const VALIDATION = {
  USER_ID_MIN: 1,
  SESSION_TOKEN_MAX_LENGTH: 500,
  IP_ADDRESS_MAX_LENGTH: 45,
  USER_AGENT_MAX_LENGTH: 500,
  SESSION_DURATION_MIN_HOURS: 1,
  SESSION_DURATION_MAX_HOURS: 720 // 30 days
};

/**
 * Validate session data
 * @param {Object} data - Session data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateSession = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.userId !== undefined) {
    if (data.userId === undefined || data.userId === null || data.userId === '') {
      errors.push('User ID is required');
    } else {
      const userId = parseInt(data.userId);
      if (isNaN(userId) || userId < VALIDATION.USER_ID_MIN) {
        errors.push(`User ID must be a valid positive number (minimum ${VALIDATION.USER_ID_MIN})`);
      }
    }
  }

  if (!isUpdate || data.sessionToken !== undefined) {
    if (!data.sessionToken || data.sessionToken.trim() === '') {
      errors.push('Session token is required');
    } else if (data.sessionToken.length > VALIDATION.SESSION_TOKEN_MAX_LENGTH) {
      errors.push(`Session token must be at most ${VALIDATION.SESSION_TOKEN_MAX_LENGTH} characters`);
    }
  }

  if (data.ipAddress !== undefined && data.ipAddress !== null) {
    if (data.ipAddress.length > VALIDATION.IP_ADDRESS_MAX_LENGTH) {
      errors.push(`IP address must be at most ${VALIDATION.IP_ADDRESS_MAX_LENGTH} characters`);
    }
  }

  if (data.userAgent !== undefined && data.userAgent !== null) {
    if (data.userAgent.length > VALIDATION.USER_AGENT_MAX_LENGTH) {
      errors.push(`User agent must be at most ${VALIDATION.USER_AGENT_MAX_LENGTH} characters`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get paginated list of user sessions with optional filtering
 * @param {Object} options - Filter and pagination options
 * @param {number} options.userId - Filter by user ID
 * @param {boolean} options.isActive - Filter by active status
 * @param {string} options.ipAddress - Filter by IP address
 * @param {string} options.search - Search term (searches in IP address and user agent)
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Object} - Paginated result with sessions and pagination info
 */
export const getPaginatedSessions = (options = {}) => {
  const {
    userId,
    isActive,
    ipAddress,
    search,
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    orderBy = USER_SESSION_FIELDS.CREATED_AT,
    orderDir = 'DESC'
  } = options;

  const offset = (page - 1) * pageSize;

  // Get filtered sessions
  let sessions = getAllUserSessionsModel({ userId, isActive, ipAddress });

  // Apply search filter
  if (search && search.trim() !== '') {
    const searchTerm = search.toLowerCase();
    sessions = sessions.filter(session => {
      return (
        session[USER_SESSION_FIELDS.IP_ADDRESS]?.toLowerCase().includes(searchTerm) ||
        session[USER_SESSION_FIELDS.USER_AGENT]?.toLowerCase().includes(searchTerm) ||
        session[USER_SESSION_FIELDS.SESSION_TOKEN]?.toLowerCase().includes(searchTerm)
      );
    });
  }

  // Sort
  const sortedSessions = sessions.sort((a, b) => {
    const aVal = a[orderBy];
    const bVal = b[orderBy];
    
    if (orderDir === 'ASC') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  // Paginate
  const total = sortedSessions.length;
  const paginatedSessions = sortedSessions.slice(offset, offset + pageSize);

  return {
    data: paginatedSessions,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: offset + pageSize < total,
      hasPreviousPage: page > 1
    }
  };
};

/**
 * Create a new user session
 * @param {Object} data - Session data
 * @returns {Object} - Created session record
 */
export const createSession = (data) => {
  const validation = validateSession(data);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  return createUserSessionModel(data);
};

/**
 * Get a user session by ID
 * @param {number} id - Session ID
 * @returns {Object|null} - Session record or null if not found
 */
export const getSessionById = (id) => {
  return getUserSessionByIdModel(id);
};

/**
 * Get a user session by session token
 * @param {string} sessionToken - Session token
 * @returns {Object|null} - Session record or null if not found
 */
export const getSessionByToken = (sessionToken) => {
  return getUserSessionByTokenModel(sessionToken);
};

/**
 * Get all active sessions for a user
 * @param {number} userId - User ID
 * @returns {Array} - Array of active session records
 */
export const getActiveSessionsByUser = (userId) => {
  return getActiveSessionsByUserModel(userId);
};

/**
 * Get all user sessions with optional filtering
 * @param {Object} options - Filter options
 * @param {number} options.userId - Filter by user ID
 * @param {boolean} options.isActive - Filter by active status
 * @param {string} options.ipAddress - Filter by IP address
 * @returns {Array} - Array of session records
 */
export const getAllSessions = (options = {}) => {
  return getAllUserSessionsModel(options);
};

/**
 * Update a user session
 * @param {number} id - Session ID
 * @param {Object} data - Data to update
 * @returns {Object|null} - Updated session record or null if not found
 */
export const updateSession = (id, data) => {
  const validation = validateSession(data, true);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  return updateUserSessionModel(id, data);
};

/**
 * Deactivate a user session (logout)
 * @param {number} id - Session ID
 * @returns {boolean} - True if session was deactivated
 */
export const deactivateSession = (id) => {
  return deactivateUserSessionModel(id);
};

/**
 * Deactivate all sessions for a user
 * @param {number} userId - User ID
 * @returns {number} - Number of sessions deactivated
 */
export const deactivateAllUserSessions = (userId) => {
  return deactivateAllUserSessionsModel(userId);
};

/**
 * Deactivate all expired sessions
 * @returns {number} - Number of sessions deactivated
 */
export const deactivateExpiredSessions = () => {
  return deactivateExpiredSessionsModel();
};

/**
 * Delete a user session
 * @param {number} id - Session ID
 * @returns {boolean} - True if session was deleted
 */
export const deleteSession = (id) => {
  return deleteUserSessionModel(id);
};

/**
 * Delete all sessions for a user
 * @param {number} userId - User ID
 * @returns {number} - Number of sessions deleted
 */
export const deleteAllUserSessions = (userId) => {
  return deleteAllUserSessionsModel(userId);
};

/**
 * Get user session count with optional filtering
 * @param {Object} options - Filter options
 * @returns {number} - Count of sessions
 */
export const getSessionCount = (options = {}) => {
  return getUserSessionCountModel(options);
};

/**
 * Validate a session token and return the session if valid
 * @param {string} sessionToken - Session token to validate
 * @returns {Object|null} - Valid session record or null
 */
export const validateSessionToken = (sessionToken) => {
  return validateSessionTokenModel(sessionToken);
};

/**
 * Extend a session's expiration time
 * @param {number} id - Session ID
 * @param {number} extendByHours - Hours to extend by (default 24)
 * @returns {Object|null} - Updated session record
 */
export const extendSession = (id, extendByHours = 24) => {
  if (extendByHours < VALIDATION.SESSION_DURATION_MIN_HOURS) {
    throw new Error(`Extension duration must be at least ${VALIDATION.SESSION_DURATION_MIN_HOURS} hour(s)`);
  }
  if (extendByHours > VALIDATION.SESSION_DURATION_MAX_HOURS) {
    throw new Error(`Extension duration must be at most ${VALIDATION.SESSION_DURATION_MAX_HOURS} hours`);
  }

  return extendUserSessionModel(id, extendByHours);
};

/**
 * Get session statistics
 * @returns {Object} - Session statistics
 */
export const getSessionStatistics = () => {
  const allSessions = getAllSessions();
  const activeSessions = getAllSessions({ isActive: true });
  const total = allSessions.length;
  const activeCount = activeSessions.length;
  const inactiveCount = total - activeCount;

  return {
    total,
    active: activeCount,
    inactive: inactiveCount,
    activePercentage: total > 0 ? Math.round((activeCount / total) * 100) : 0
  };
};

/**
 * Clean up expired and inactive sessions
 * @returns {Object} - Cleanup result with counts
 */
export const cleanupExpiredSessions = () => {
  const expiredCount = deactivateExpiredSessions();
  return {
    expiredDeactivated: expiredCount,
    message: `Deactivated ${expiredCount} expired session(s)`
  };
};

/**
 * Force logout a user by deactivating all their sessions
 * @param {number} userId - User ID
 * @returns {Object} - Result with count of deactivated sessions
 */
export const forceLogoutUser = (userId) => {
  const count = deactivateAllUserSessions(userId);
  return {
    userId,
    sessionsDeactivated: count,
    message: `Forced logout for user ${userId}: ${count} session(s) deactivated`
  };
};

// Export table constant for reference
export { USER_SESSIONS_TABLE, USER_SESSION_FIELDS };

// Export default with all functions
export default {
  validateSession,
  getPaginatedSessions,
  createSession,
  getSessionById,
  getSessionByToken,
  getActiveSessionsByUser,
  getAllSessions,
  updateSession,
  deactivateSession,
  deactivateAllUserSessions,
  deactivateExpiredSessions,
  deleteSession,
  deleteAllUserSessions,
  getSessionCount,
  validateSessionToken,
  extendSession,
  getSessionStatistics,
  cleanupExpiredSessions,
  forceLogoutUser,
  USER_SESSIONS_TABLE,
  USER_SESSION_FIELDS
};

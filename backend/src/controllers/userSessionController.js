/**
 * UserSession Controller
 * HTTP request handlers for user session endpoints
 * 
 * Handles:
 * - RESTful CRUD operations for user sessions
 * - Request/response handling
 * - Error handling with appropriate HTTP status codes
 * - Session validation and management
 */

import {
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
} from '../services/userSessionService.js';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * List user sessions with pagination and filtering
 * GET /api/user-sessions
 */
export const listSessions = (req, res) => {
  try {
    const {
      userId,
      isActive,
      ipAddress,
      search,
      page = DEFAULT_PAGE,
      pageSize = DEFAULT_PAGE_SIZE,
      orderBy,
      orderDir
    } = req.query;

    const options = {
      userId: userId ? parseInt(userId) : undefined,
      isActive: isActive ? JSON.parse(isActive) : undefined,
      ipAddress,
      search,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      orderBy,
      orderDir
    };

    const result = getPaginatedSessions(options);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get user session count
 * GET /api/user-sessions/count
 */
export const countSessions = (req, res) => {
  try {
    const {
      userId,
      isActive
    } = req.query;

    const options = {
      userId: userId ? parseInt(userId) : undefined,
      isActive: isActive ? JSON.parse(isActive) : undefined
    };

    const count = getSessionCount(options);
    res.json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get a single user session by ID
 * GET /api/user-sessions/:id
 */
export const getSingleSession = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }

    const session = getSessionById(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get a user session by session token
 * GET /api/user-sessions/token/:sessionToken
 */
export const getSessionByTokenHandler = (req, res) => {
  try {
    const { sessionToken } = req.params;
    
    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        error: 'Session token is required'
      });
    }

    const session = getSessionByToken(sessionToken);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all active sessions for a user
 * GET /api/user-sessions/user/:userId/active
 */
export const getActiveSessionsByUserHandler = (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const sessions = getActiveSessionsByUser(userId);
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a new user session
 * POST /api/user-sessions
 */
export const createUserSession = (req, res) => {
  try {
    const data = req.body;
    
    // Validate
    const validation = validateSession(data);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const session = createSession(data);
    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update a user session
 * PUT /api/user-sessions/:id
 */
export const updateUserSessionHandler = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }

    const data = req.body;
    const validation = validateSession(data, true);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const session = updateSession(id, data);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Deactivate a user session (logout)
 * POST /api/user-sessions/:id/deactivate
 */
export const deactivateUserSessionHandler = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }

    const result = deactivateSession(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or already inactive'
      });
    }

    res.json({
      success: true,
      message: 'Session deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Deactivate all sessions for a user (force logout)
 * POST /api/user-sessions/user/:userId/deactivate-all
 */
export const deactivateAllUserSessionsHandler = (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const result = forceLogoutUser(userId);
    res.json({
      success: true,
      message: result.message,
      sessionsDeactivated: result.sessionsDeactivated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Deactivate all expired sessions
 * POST /api/user-sessions/cleanup
 */
export const deactivateExpiredSessionsHandler = (req, res) => {
  try {
    const result = cleanupExpiredSessions();
    res.json({
      success: true,
      message: result.message,
      expiredDeactivated: result.expiredDeactivated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a user session
 * DELETE /api/user-sessions/:id
 */
export const deleteUserSessionHandler = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }

    const result = deleteSession(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete all sessions for a user
 * DELETE /api/user-sessions/user/:userId
 */
export const deleteAllUserSessionsHandler = (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const count = deleteAllUserSessions(userId);
    res.json({
      success: true,
      message: `Deleted ${count} session(s) for user ${userId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Validate a session token
 * POST /api/user-sessions/validate
 */
export const validateSessionTokenHandler = (req, res) => {
  try {
    const { sessionToken } = req.body;
    
    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        error: 'Session token is required'
      });
    }

    const session = validateSessionToken(sessionToken);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session token'
      });
    }

    res.json({
      success: true,
      valid: true,
      session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Extend a session's expiration time
 * POST /api/user-sessions/:id/extend
 */
export const extendSessionHandler = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }

    const { extendByHours = 24 } = req.body;
    const session = extendSession(id, extendByHours);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session,
      message: `Session extended by ${extendByHours} hours`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get session statistics
 * GET /api/user-sessions/stats
 */
export const getSessionStatsHandler = (req, res) => {
  try {
    const stats = getSessionStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export table constant for reference
export { USER_SESSIONS_TABLE, USER_SESSION_FIELDS };

// Export default with all functions
export default {
  listSessions,
  countSessions,
  getSingleSession,
  getSessionByTokenHandler,
  getActiveSessionsByUserHandler,
  createUserSession,
  updateUserSessionHandler,
  deactivateUserSessionHandler,
  deactivateAllUserSessionsHandler,
  deactivateExpiredSessionsHandler,
  deleteUserSessionHandler,
  deleteAllUserSessionsHandler,
  validateSessionTokenHandler,
  extendSessionHandler,
  getSessionStatsHandler,
  USER_SESSIONS_TABLE,
  USER_SESSION_FIELDS
};

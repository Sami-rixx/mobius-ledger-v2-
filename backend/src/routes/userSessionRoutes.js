/**
 * UserSession Routes
 * RESTful API endpoint definitions for user session operations
 * 
 * Endpoints:
 * - GET /api/user-sessions - List user sessions with pagination and filtering
 * - GET /api/user-sessions/count - Get user session count
 * - GET /api/user-sessions/:id - Get a single user session by ID
 * - GET /api/user-sessions/token/:sessionToken - Get user session by session token
 * - GET /api/user-sessions/user/:userId/active - Get all active sessions for a user
 * - POST /api/user-sessions - Create a new user session
 * - PUT /api/user-sessions/:id - Update a user session
 * - POST /api/user-sessions/:id/deactivate - Deactivate a user session (logout)
 * - POST /api/user-sessions/user/:userId/deactivate-all - Deactivate all sessions for a user (force logout)
 * - POST /api/user-sessions/cleanup - Deactivate all expired sessions
 * - DELETE /api/user-sessions/:id - Delete a user session
 * - DELETE /api/user-sessions/user/:userId - Delete all sessions for a user
 * - POST /api/user-sessions/validate - Validate a session token
 * - POST /api/user-sessions/:id/extend - Extend a session's expiration time
 * - GET /api/user-sessions/stats - Get session statistics
 */

import { Router } from 'express';
import {
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
  getSessionStatsHandler
} from '../controllers/userSessionController.js';

const router = Router();

// GET /api/user-sessions - List user sessions with pagination and filtering
router.get('/', listSessions);

// GET /api/user-sessions/count - Get user session count
router.get('/count', countSessions);

// GET /api/user-sessions/:id - Get a single user session by ID
router.get('/:id', getSingleSession);

// GET /api/user-sessions/token/:sessionToken - Get user session by session token
router.get('/token/:sessionToken', getSessionByTokenHandler);

// GET /api/user-sessions/user/:userId/active - Get all active sessions for a user
router.get('/user/:userId/active', getActiveSessionsByUserHandler);

// POST /api/user-sessions - Create a new user session
router.post('/', createUserSession);

// PUT /api/user-sessions/:id - Update a user session
router.put('/:id', updateUserSessionHandler);

// POST /api/user-sessions/:id/deactivate - Deactivate a user session (logout)
router.post('/:id/deactivate', deactivateUserSessionHandler);

// POST /api/user-sessions/user/:userId/deactivate-all - Deactivate all sessions for a user (force logout)
router.post('/user/:userId/deactivate-all', deactivateAllUserSessionsHandler);

// POST /api/user-sessions/cleanup - Deactivate all expired sessions
router.post('/cleanup', deactivateExpiredSessionsHandler);

// DELETE /api/user-sessions/:id - Delete a user session
router.delete('/:id', deleteUserSessionHandler);

// DELETE /api/user-sessions/user/:userId - Delete all sessions for a user
router.delete('/user/:userId', deleteAllUserSessionsHandler);

// POST /api/user-sessions/validate - Validate a session token
router.post('/validate', validateSessionTokenHandler);

// POST /api/user-sessions/:id/extend - Extend a session's expiration time
router.post('/:id/extend', extendSessionHandler);

// GET /api/user-sessions/stats - Get session statistics
router.get('/stats', getSessionStatsHandler);

export default router;

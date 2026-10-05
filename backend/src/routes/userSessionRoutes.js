/**
 * UserSession Routes (Admin-only session administration)
 *
 * Mounted behind `requirePermission('sessions.manage')` in app.js (Admin
 * role only). Real sessions are only ever created by the authentication
 * flow (see controllers/authController.js#login) - this router no longer
 * exposes a generic "create a session with an arbitrary token" endpoint,
 * nor raw-token lookup/"validate" endpoints (the `session_token` column
 * now stores a SHA-256 hash, never the raw bearer value - see
 * services/sessionService.js - so a client-supplied raw token could never
 * usefully be looked up here anyway).
 *
 * Endpoints:
 * - GET /api/user-sessions - List sessions with pagination/filtering
 * - GET /api/user-sessions/stats - Session statistics
 * - GET /api/user-sessions/count - Count sessions
 * - GET /api/user-sessions/user/:userId/active - Active sessions for a user
 * - GET /api/user-sessions/:id - Get a single session by ID
 * - POST /api/user-sessions/:id/deactivate - Revoke a session (admin force-logout)
 * - POST /api/user-sessions/user/:userId/deactivate-all - Revoke all sessions for a user
 * - POST /api/user-sessions/cleanup - Deactivate all expired sessions
 * - DELETE /api/user-sessions/:id - Delete a session row
 * - DELETE /api/user-sessions/user/:userId - Delete all session rows for a user
 */

import { Router } from 'express';
import {
  listSessions,
  countSessions,
  getSingleSession,
  getActiveSessionsByUserHandler,
  deactivateUserSessionHandler,
  deactivateAllUserSessionsHandler,
  deactivateExpiredSessionsHandler,
  deleteUserSessionHandler,
  deleteAllUserSessionsHandler,
  getSessionStatsHandler
} from '../controllers/userSessionController.js';

const router = Router();

router.get('/', listSessions);
router.get('/count', countSessions);
router.get('/stats', getSessionStatsHandler);
router.get('/user/:userId/active', getActiveSessionsByUserHandler);
router.get('/:id', getSingleSession);

router.post('/:id/deactivate', deactivateUserSessionHandler);
router.post('/user/:userId/deactivate-all', deactivateAllUserSessionsHandler);
router.post('/cleanup', deactivateExpiredSessionsHandler);

router.delete('/:id', deleteUserSessionHandler);
router.delete('/user/:userId', deleteAllUserSessionsHandler);

export default router;

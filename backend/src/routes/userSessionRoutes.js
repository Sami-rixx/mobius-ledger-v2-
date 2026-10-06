/**
 * Session administration routes (sessions.manage — Admin only).
 *
 * SECURITY REDESIGN (specification §4/§15): the previous client-facing
 * session CRUD surface has been removed. In particular:
 * - GET /token/:sessionToken (raw session-token lookup)  -> REMOVED
 * - POST / (client-side session creation)                 -> REMOVED
 * - POST /validate (token oracle)                         -> REMOVED
 * - POST /:id/extend, PUT /:id, DELETE endpoints          -> REMOVED
 * Sessions are created exclusively by POST /api/auth/login and are stored
 * only as SHA-256 token hashes. Session rows returned by this admin API
 * never include token material.
 */
import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import db from '../config/database.js';
import { revokeSession, revokeAllSessionsForUser } from '../services/authService.js';
import { recordAuditEvent, AUDIT, auditContext } from '../services/auditService.js';
import { parsePagination } from '../utils/sqlSafety.js';
import { parseId } from '../utils/sqlSafety.js';

const router = Router();

const SAFE_COLUMNS = `
  s.id, s.user_id, u.username, s.ip_address, s.user_agent,
  s.expires_at, s.last_activity_at, s.absolute_expires_at,
  s.is_active, s.created_at, s.updated_at
`;

// GET /api/user-sessions - list sessions (no token material)
router.get('/', requirePermission('sessions.manage'), (req, res, next) => {
  try {
    const { page, pageSize, limit, offset } = parsePagination(req.query.page, req.query.pageSize);
    const conditions = [];
    const params = [];
    if (req.query.userId !== undefined) {
      conditions.push('s.user_id = ?');
      params.push(parseId(req.query.userId, 'userId'));
    }
    if (req.query.isActive !== undefined) {
      conditions.push('s.is_active = ?');
      params.push(req.query.isActive === 'true' || req.query.isActive === '1' ? 1 : 0);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = db.prepare(`SELECT COUNT(*) AS c FROM user_sessions s ${where}`).get(...params).c;
    const rows = db.prepare(`
      SELECT ${SAFE_COLUMNS}
      FROM user_sessions s JOIN users u ON u.id = s.user_id
      ${where}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
    return res.json({
      success: true,
      data: rows,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 }
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/user-sessions/stats
router.get('/stats', requirePermission('sessions.manage'), (req, res, next) => {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
        COUNT(DISTINCT user_id) AS users
      FROM user_sessions
    `).get();
    return res.json({ success: true, data: stats });
  } catch (error) {
    return next(error);
  }
});

// GET /api/user-sessions/:id - single session (no token material)
router.get('/:id', requirePermission('sessions.manage'), (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const row = db.prepare(`
      SELECT ${SAFE_COLUMNS}
      FROM user_sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ?
    `).get(id);
    if (!row) return res.status(404).json({ success: false, error: true, message: 'Session not found' });
    return res.json({ success: true, data: row });
  } catch (error) {
    return next(error);
  }
});

// POST /api/user-sessions/:id/deactivate - revoke one session
router.post('/:id/deactivate', requirePermission('sessions.manage'), (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const row = db.prepare('SELECT id, user_id FROM user_sessions WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ success: false, error: true, message: 'Session not found' });
    revokeSession(id);
    recordAuditEvent({ action: AUDIT.SESSION_REVOKED, tableName: 'user_sessions', recordId: id, ...auditContext(req) });
    return res.json({ success: true, message: 'Session revoked' });
  } catch (error) {
    return next(error);
  }
});

// POST /api/user-sessions/user/:userId/deactivate-all - revoke all of a user's sessions
router.post('/user/:userId/deactivate-all', requirePermission('sessions.manage'), (req, res, next) => {
  try {
    const userId = parseId(req.params.userId, 'userId');
    const changes = revokeAllSessionsForUser(userId);
    recordAuditEvent({
      action: AUDIT.SESSION_REVOKED,
      tableName: 'user_sessions',
      recordId: null,
      newValues: { userId, revoked: changes },
      ...auditContext(req)
    });
    return res.json({ success: true, message: `Revoked ${changes} session(s)` });
  } catch (error) {
    return next(error);
  }
});

// POST /api/user-sessions/cleanup - deactivate expired sessions
router.post('/cleanup', requirePermission('sessions.manage'), (req, res, next) => {
  try {
    const result = db.prepare(`
      UPDATE user_sessions SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE is_active = 1 AND (expires_at < datetime('now') OR absolute_expires_at < datetime('now'))
    `).run();
    return res.json({ success: true, message: `Deactivated ${result.changes} expired session(s)` });
  } catch (error) {
    return next(error);
  }
});

export default router;

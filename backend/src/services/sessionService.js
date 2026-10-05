import crypto from 'crypto';
import db from '../config/database.js';

/**
 * Server-side session lifecycle (owner-approved: server-side sessions, not
 * JWT - D1). This is the ONLY source of trusted actor identity for the
 * application; backend/src/middleware/auth.js's `authenticate` middleware
 * is the sole place a request becomes associated with `req.user`.
 *
 * Session policy (owner-approved, D3/D4):
 *  - 8-hour idle timeout: `expires_at` is refreshed to now+IDLE_TIMEOUT_MS
 *    on every successfully authenticated request, capped by
 *    `absolute_expires_at`.
 *  - 24-hour sliding token lifetime: the raw session token itself is
 *    rotated (a new token/cookie is issued, the old one invalidated)
 *    after it has been in use for more than SLIDING_ROTATION_MS, while the
 *    underlying session row/login continues uninterrupted. This bounds how
 *    long any single captured token value remains useful even if the
 *    session as a whole is still within its idle/absolute window.
 *  - 7-day absolute lifetime: `absolute_expires_at` is fixed at session
 *    creation and is never extended; the session is unusable afterward no
 *    matter how recently it was active.
 *  - Max 5 concurrent sessions per user: creating a 6th active session
 *    revokes the least-recently-active existing session first.
 *
 * Tokens: a raw, cryptographically random 32+ byte token is generated and
 * returned to the caller exactly once (to be set as an HttpOnly cookie).
 * Only `sha256(rawToken)` is ever persisted in `user_sessions.session_token`
 * - the raw value never touches the database, logs, or audit trail.
 */

export const SESSION_POLICY = {
  IDLE_TIMEOUT_MS: 8 * 60 * 60 * 1000, // 8 hours
  SLIDING_ROTATION_MS: 24 * 60 * 60 * 1000, // 24 hours
  ABSOLUTE_LIFETIME_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  MAX_CONCURRENT_SESSIONS: 5
};

export function generateRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function generateCsrfToken() {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Create a new session for a user, enforcing the max concurrent session
 * limit (evicts the oldest active session(s) first).
 * @param {Object} params
 * @param {number} params.userId
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 * @returns {{ rawToken: string, csrfToken: string, session: Object }}
 */
export function createSession({ userId, ipAddress, userAgent }) {
  enforceConcurrentSessionLimit(userId);

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const csrfToken = generateCsrfToken();

  const now = new Date();
  const idleExpiresAt = new Date(now.getTime() + SESSION_POLICY.IDLE_TIMEOUT_MS);
  const absoluteExpiresAt = new Date(now.getTime() + SESSION_POLICY.ABSOLUTE_LIFETIME_MS);

  const result = db.prepare(`
    INSERT INTO user_sessions
      (user_id, session_token, ip_address, user_agent, expires_at, is_active,
       created_at, updated_at, last_activity_at, absolute_expires_at, csrf_token, token_issued_at)
    VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'), datetime('now'), ?, ?, datetime('now'))
  `).run(
    userId,
    tokenHash,
    ipAddress || null,
    userAgent || null,
    idleExpiresAt.toISOString(),
    absoluteExpiresAt.toISOString(),
    csrfToken
  );

  const session = db.prepare('SELECT * FROM user_sessions WHERE id = ?').get(result.lastInsertRowid);
  return { rawToken, csrfToken, session };
}

function enforceConcurrentSessionLimit(userId) {
  const active = db.prepare(`
    SELECT id FROM user_sessions
    WHERE user_id = ? AND is_active = 1 AND expires_at > datetime('now')
    ORDER BY last_activity_at ASC
  `).all(userId);

  if (active.length >= SESSION_POLICY.MAX_CONCURRENT_SESSIONS) {
    const excess = active.length - SESSION_POLICY.MAX_CONCURRENT_SESSIONS + 1;
    const toRevoke = active.slice(0, excess);
    const revokeStmt = db.prepare(`
      UPDATE user_sessions
      SET is_active = 0, revoked_at = datetime('now'), revoked_reason = 'concurrent-session-limit'
      WHERE id = ?
    `);
    for (const row of toRevoke) revokeStmt.run(row.id);
  }
}

/**
 * Validate a raw session token presented by a client and, if valid,
 * refresh its idle expiry ("sliding window"). Returns null for any
 * invalid/expired/revoked/disabled-user condition - callers must treat
 * null as "unauthenticated" (401), never falling back to any default
 * identity.
 * @param {string} rawToken
 * @returns {{ session: Object, user: Object, rotated?: { rawToken: string } } | null}
 */
export function validateAndTouchSession(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return null;
  const tokenHash = hashToken(rawToken);

  const session = db.prepare('SELECT * FROM user_sessions WHERE session_token = ?').get(tokenHash);
  if (!session) return null;
  if (!session.is_active) return null;

  const now = Date.now();
  if (new Date(session.expires_at).getTime() <= now) return null;
  if (session.absolute_expires_at && new Date(session.absolute_expires_at).getTime() <= now) return null;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  if (!user || !user.is_active) return null;

  // Idle timeout slides forward on every valid request, but never past the
  // absolute lifetime cap.
  const absoluteCap = session.absolute_expires_at ? new Date(session.absolute_expires_at).getTime() : Infinity;
  const newIdleExpiry = Math.min(now + SESSION_POLICY.IDLE_TIMEOUT_MS, absoluteCap);

  let rotated;
  const tokenAgeMs = session.token_issued_at ? now - new Date(session.token_issued_at).getTime() : 0;

  if (tokenAgeMs > SESSION_POLICY.SLIDING_ROTATION_MS) {
    // 24h sliding token rotation: issue a fresh raw token/hash for the same
    // session row, bounding how long any single token value is usable.
    const newRawToken = generateRawToken();
    const newHash = hashToken(newRawToken);
    db.prepare(`
      UPDATE user_sessions
      SET session_token = ?, token_issued_at = datetime('now'),
          last_activity_at = datetime('now'), expires_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newHash, new Date(newIdleExpiry).toISOString(), session.id);
    rotated = { rawToken: newRawToken };
  } else {
    db.prepare(`
      UPDATE user_sessions
      SET last_activity_at = datetime('now'), expires_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(new Date(newIdleExpiry).toISOString(), session.id);
  }

  return { session, user, rotated };
}

/**
 * Revoke a single session (logout).
 */
export function revokeSessionByRawToken(rawToken, reason = 'logout') {
  const tokenHash = hashToken(rawToken);
  const result = db.prepare(`
    UPDATE user_sessions SET is_active = 0, revoked_at = datetime('now'), revoked_reason = ?
    WHERE session_token = ? AND is_active = 1
  `).run(reason, tokenHash);
  return result.changes > 0;
}

/**
 * Revoke all sessions for a user (e.g. force logout, password change,
 * account disable).
 */
export function revokeAllSessionsForUser(userId, reason = 'revoked-all') {
  const result = db.prepare(`
    UPDATE user_sessions SET is_active = 0, revoked_at = datetime('now'), revoked_reason = ?
    WHERE user_id = ? AND is_active = 1
  `).run(reason, userId);
  return result.changes;
}

export default {
  SESSION_POLICY,
  generateRawToken,
  hashToken,
  generateCsrfToken,
  createSession,
  validateAndTouchSession,
  revokeSessionByRawToken,
  revokeAllSessionsForUser
};

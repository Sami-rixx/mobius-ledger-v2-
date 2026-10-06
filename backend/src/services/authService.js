/**
 * Authentication & session service.
 *
 * OWNER DECISIONS implemented here:
 * - D1: server-side sessions (user_sessions table), cookie transport.
 * - D2: Argon2id password verification (passwordService).
 * - D3: 8h idle timeout / 24h sliding lifetime / 7d absolute lifetime.
 * - D4: maximum 5 concurrently active sessions per user (oldest revoked).
 *
 * Token model (specification §4): 32 cryptographically secure random bytes;
 * the raw token is only ever sent to the client in an HttpOnly cookie; the
 * database stores ONLY the SHA-256 hash of the token. Raw tokens are never
 * persisted and never returned in response bodies.
 */
import crypto from 'crypto';
import db from '../config/database.js';
import { verifyPassword, hashPassword, passwordPolicyViolation } from './passwordService.js';
import { recordAuditEvent, AUDIT } from './auditService.js';

export const SESSION_COOKIE_NAME = 'ml_session';

export const SESSION_POLICY = {
  IDLE_TIMEOUT_MS: 8 * 60 * 60 * 1000,        // 8 hours idle timeout
  SLIDING_LIFETIME_MS: 24 * 60 * 60 * 1000,   // 24 hours sliding lifetime
  ABSOLUTE_LIFETIME_MS: 7 * 24 * 60 * 60 * 1000, // 7 days absolute lifetime
  MAX_CONCURRENT_SESSIONS: 5
};

const toSqlDateTime = (date) => date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');

export function hashSessionToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken, 'utf8').digest('hex');
}

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Load the permissions of a user through the normalized RBAC tables.
 */
export function getUserPermissions(userId) {
  const rows = db.prepare(`
    SELECT DISTINCT p.name
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id AND r.is_active = 1
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id AND p.is_active = 1
    WHERE ur.user_id = ?
  `).all(userId);
  return rows.map((r) => r.name);
}

export function getUserRoles(userId) {
  const rows = db.prepare(`
    SELECT r.name
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id AND r.is_active = 1
    WHERE ur.user_id = ?
  `).all(userId);
  return rows.map((r) => r.name);
}

/**
 * Create a session for a user. Enforces the 5-concurrent-session cap by
 * revoking the oldest active sessions. Returns the RAW token (for the
 * cookie) — only its SHA-256 hash is stored.
 */
export function createSession(userId, { ipAddress = null, userAgent = null } = {}) {
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const now = new Date();
  const slidingExpiry = new Date(now.getTime() + SESSION_POLICY.SLIDING_LIFETIME_MS);
  const absoluteExpiry = new Date(now.getTime() + SESSION_POLICY.ABSOLUTE_LIFETIME_MS);

  const create = db.transaction(() => {
    // Enforce max concurrent sessions (revoke oldest first)
    const active = db.prepare(`
      SELECT id FROM user_sessions
      WHERE user_id = ? AND is_active = 1
      ORDER BY created_at ASC, id ASC
    `).all(userId);
    const excess = active.length - (SESSION_POLICY.MAX_CONCURRENT_SESSIONS - 1);
    if (excess > 0) {
      const revoke = db.prepare('UPDATE user_sessions SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      for (let i = 0; i < excess; i++) revoke.run(active[i].id);
    }

    // session_token column is legacy NOT NULL UNIQUE — store the hash there
    // as well so no plaintext token ever reaches the database.
    const result = db.prepare(`
      INSERT INTO user_sessions (user_id, session_token, token_hash, ip_address, user_agent, expires_at, last_activity_at, absolute_expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      userId, tokenHash, tokenHash, ipAddress, userAgent,
      toSqlDateTime(slidingExpiry), toSqlDateTime(now), toSqlDateTime(absoluteExpiry)
    );
    return result.lastInsertRowid;
  });

  const sessionId = create();
  return { rawToken, sessionId, expiresAt: slidingExpiry, absoluteExpiresAt: absoluteExpiry };
}

/**
 * Validate a raw session token. Enforces: active flag, disabled-user check,
 * idle timeout (8h), sliding lifetime (24h, renewed on activity) and
 * absolute lifetime (7d). Returns { session, user } or null.
 */
export function validateSession(rawToken) {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 32) return null;
  const tokenHash = hashSessionToken(rawToken);
  const row = db.prepare(`
    SELECT s.id AS session_id, s.user_id, s.expires_at, s.last_activity_at, s.absolute_expires_at,
           s.is_active AS session_active, s.created_at AS session_created_at,
           u.id AS uid, u.username, u.full_name, u.email, u.is_active AS user_active
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).get(tokenHash);

  if (!row) return null;
  if (!row.session_active || !row.user_active) return null;

  const now = Date.now();
  const lastActivity = Date.parse(`${row.last_activity_at}Z`) || Date.parse(row.last_activity_at);
  const slidingExpiry = Date.parse(`${row.expires_at}Z`) || Date.parse(row.expires_at);
  const absoluteExpiry = Date.parse(`${row.absolute_expires_at}Z`) || Date.parse(row.absolute_expires_at);

  if (Number.isFinite(absoluteExpiry) && now > absoluteExpiry) {
    revokeSession(row.session_id);
    return null;
  }
  if (Number.isFinite(slidingExpiry) && now > slidingExpiry) {
    revokeSession(row.session_id);
    return null;
  }
  if (Number.isFinite(lastActivity) && now - lastActivity > SESSION_POLICY.IDLE_TIMEOUT_MS) {
    revokeSession(row.session_id);
    return null;
  }

  // Touch activity: renew sliding expiry (never beyond the absolute cap).
  const newSliding = Math.min(now + SESSION_POLICY.SLIDING_LIFETIME_MS, absoluteExpiry || Infinity);
  db.prepare(`
    UPDATE user_sessions
    SET last_activity_at = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(toSqlDateTime(new Date(now)), toSqlDateTime(new Date(newSliding)), row.session_id);

  return {
    session: { id: row.session_id, userId: row.user_id },
    user: {
      id: row.uid,
      username: row.username,
      fullName: row.full_name,
      email: row.email
    }
  };
}

export function revokeSession(sessionId) {
  db.prepare('UPDATE user_sessions SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(sessionId);
}

export function revokeAllSessionsForUser(userId, { exceptSessionId = null } = {}) {
  if (exceptSessionId) {
    return db.prepare('UPDATE user_sessions SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id != ?')
      .run(userId, exceptSessionId).changes;
  }
  return db.prepare('UPDATE user_sessions SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
    .run(userId).changes;
}

/**
 * Authenticate username + password and create a session.
 * Audits LOGIN_SUCCESS / LOGIN_FAILURE. Fails closed on NULL hashes.
 */
export async function login(username, password, { ipAddress = null, userAgent = null } = {}) {
  const genericFailure = { success: false, error: 'Invalid username or password', statusCode: 401 };

  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return genericFailure;
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  // Always run a verification (against a dummy hash when the user does not
  // exist) to keep timing roughly uniform.
  const hashToCheck = user?.password_hash
    || '$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const passwordOk = await verifyPassword(hashToCheck, password);

  if (!user || !user.password_hash || !passwordOk || !user.is_active) {
    recordAuditEvent({
      action: AUDIT.LOGIN_FAILURE,
      tableName: 'users',
      recordId: user?.id ?? null,
      newValues: { username: String(username).slice(0, 64) },
      userId: user?.id ?? null,
      ipAddress,
      userAgent
    });
    return genericFailure;
  }

  const { rawToken, sessionId, expiresAt } = createSession(user.id, { ipAddress, userAgent });

  recordAuditEvent({
    action: AUDIT.LOGIN_SUCCESS,
    tableName: 'user_sessions',
    recordId: sessionId,
    userId: user.id,
    ipAddress,
    userAgent
  });

  return {
    success: true,
    rawToken,
    sessionId,
    expiresAt,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      roles: getUserRoles(user.id),
      permissions: getUserPermissions(user.id)
    }
  };
}

export function logout(sessionId, actor = null, meta = {}) {
  revokeSession(sessionId);
  recordAuditEvent({
    action: AUDIT.LOGOUT,
    tableName: 'user_sessions',
    recordId: sessionId,
    userId: actor?.id ?? null,
    ipAddress: meta.ipAddress ?? null,
    userAgent: meta.userAgent ?? null
  });
}

/**
 * Change the password of the authenticated user. Requires the current
 * password, enforces the password policy, revokes all other sessions.
 */
export async function changePassword(userId, currentPassword, newPassword, { sessionId = null, ipAddress = null } = {}) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user || !user.is_active) {
    return { success: false, error: 'User not found', statusCode: 404 };
  }

  const currentOk = await verifyPassword(user.password_hash, currentPassword);
  if (!currentOk) {
    return { success: false, error: 'Current password is incorrect', statusCode: 400 };
  }

  const violation = passwordPolicyViolation(newPassword);
  if (violation) {
    return { success: false, error: violation, statusCode: 400 };
  }

  const newHash = await hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, userId);
  revokeAllSessionsForUser(userId, { exceptSessionId: sessionId });

  recordAuditEvent({
    action: AUDIT.PASSWORD_CHANGE,
    tableName: 'users',
    recordId: userId,
    userId,
    ipAddress
  });

  return { success: true };
}

/** Build the secure cookie options for the session cookie. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api',
    maxAge: SESSION_POLICY.SLIDING_LIFETIME_MS
  };
}

export default {
  SESSION_COOKIE_NAME,
  SESSION_POLICY,
  hashSessionToken,
  generateSessionToken,
  createSession,
  validateSession,
  revokeSession,
  revokeAllSessionsForUser,
  login,
  logout,
  changePassword,
  getUserPermissions,
  getUserRoles,
  sessionCookieOptions
};

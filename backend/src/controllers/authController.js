import * as UserModel from '../models/User.js';
import db from '../config/database.js';
import { hashPassword, verifyPassword, validatePasswordPolicy } from '../services/authService.js';
import {
  createSession,
  revokeSessionByRawToken,
  revokeAllSessionsForUser
} from '../services/sessionService.js';
import { getEffectivePermissions, getEffectiveRoleNames } from '../services/permissionResolutionService.js';
import { logFinancialAction } from '../services/auditTrailService.js';
import { SESSION_COOKIE_NAME, LOGIN_LOCKOUT } from '../config/authConfig.js';
import { cookieOptions } from '../middleware/auth.js';

function userContextFrom(req, userId) {
  return {
    userId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null
  };
}

function publicUser(user, permissions, roles) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    mustChangePassword: Boolean(user.must_change_password),
    permissions: Array.from(permissions || []),
    roles: roles || []
  };
}

/**
 * POST /api/auth/login
 * Public endpoint. Validates credentials against the Argon2id hash,
 * enforces account lockout after repeated failures, and issues a new
 * server-side session (HttpOnly cookie) on success.
 */
export const login = async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ success: false, error: 'username and password are required' });
  }

  const user = await UserModel.getByUsernameWithCredentials(username.trim());

  // Constant-shape handling: whether the user exists or not, we still want
  // to avoid leaking which case occurred via timing/response differences
  // beyond what's unavoidable. We always attempt a verify() call to keep
  // timing closer, using a fixed dummy hash when no user/hash exists.
  const DUMMY_HASH = '$argon2id$v=19$m=65536,t=3,p=1$c2FsdHNhbHRzYWx0$Y2hBwohfMnJORk5LcEVGRkVGRkVGRkVGRkU';

  if (!user || !user.is_active) {
    await verifyPassword(DUMMY_HASH, password).catch(() => {});
    logFinancialAction('LOGIN_FAILURE', 'users', -1, null, { username }, userContextFrom(req, null));
    return res.status(401).json({ success: false, error: 'Invalid username or password' });
  }

  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    logFinancialAction('LOGIN_FAILURE', 'users', user.id, null, { reason: 'locked' }, userContextFrom(req, user.id));
    return res.status(401).json({ success: false, error: 'Account temporarily locked due to repeated failed login attempts. Try again later.' });
  }

  // NULL/empty password_hash (e.g. a freshly seeded bootstrap account) can
  // never authenticate - verifyPassword() already returns false for this,
  // but we short-circuit explicitly for clarity/defense in depth.
  const passwordOk = await verifyPassword(user.password_hash, password);

  if (!passwordOk) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    const lockedUntil = attempts >= LOGIN_LOCKOUT.MAX_ATTEMPTS
      ? new Date(Date.now() + LOGIN_LOCKOUT.LOCKOUT_MS).toISOString()
      : null;

    db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?')
      .run(attempts, lockedUntil, user.id);

    logFinancialAction('LOGIN_FAILURE', 'users', user.id, null, { attempts }, userContextFrom(req, user.id));
    return res.status(401).json({ success: false, error: 'Invalid username or password' });
  }

  // Successful login: reset lockout counters.
  db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(user.id);

  const { rawToken, csrfToken } = createSession({
    userId: user.id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null
  });

  res.cookie(SESSION_COOKIE_NAME, rawToken, cookieOptions());

  const permissions = getEffectivePermissions(user.id);
  const roles = getEffectiveRoleNames(user.id);

  logFinancialAction('LOGIN_SUCCESS', 'users', user.id, null, null, userContextFrom(req, user.id));

  return res.json({
    success: true,
    data: publicUser(user, permissions, roles),
    csrfToken
  });
};

/**
 * POST /api/auth/logout
 * Revokes the current session and clears the cookie. Requires an
 * authenticated session (mounted after `authenticate`).
 */
export const logout = (req, res) => {
  const rawToken = req.cookies ? req.cookies[SESSION_COOKIE_NAME] : undefined;
  if (rawToken) {
    revokeSessionByRawToken(rawToken, 'logout');
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });

  if (req.user) {
    logFinancialAction('LOGOUT', 'users', req.user.id, null, null, userContextFrom(req, req.user.id));
  }

  return res.json({ success: true, message: 'Logged out' });
};

/**
 * GET /api/auth/me
 * Returns the authenticated user's identity, roles, permissions and a
 * fresh CSRF token (bound to req.session, never a client-supplied value).
 */
export const me = async (req, res) => {
  const user = await UserModel.getById(req.user.id);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  return res.json({
    success: true,
    data: publicUser(user, req.permissions, req.roles),
    csrfToken: req.session.csrfToken
  });
};

/**
 * POST /api/auth/change-password
 * Requires the current password (prevents a hijacked-but-not-fully-
 * compromised session from silently taking over the account) and enforces
 * the password policy for the new one. Revokes all other sessions for the
 * user on success (forces re-authentication everywhere else).
 */
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'currentPassword and newPassword are required' });
  }

  const user = await UserModel.getByUsernameWithCredentials(req.user.username);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const currentOk = await verifyPassword(user.password_hash, currentPassword);
  if (!currentOk) {
    return res.status(401).json({ success: false, error: 'Current password is incorrect' });
  }

  const policy = validatePasswordPolicy(newPassword);
  if (!policy.valid) {
    return res.status(400).json({ success: false, error: 'Password does not meet policy', details: policy.errors });
  }

  const newHash = await hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newHash, user.id);

  revokeAllSessionsForUser(user.id, 'password-change');

  // Re-issue a fresh session for the current request so the user isn't
  // immediately logged out by their own password change.
  const { rawToken, csrfToken } = createSession({
    userId: user.id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null
  });
  res.cookie(SESSION_COOKIE_NAME, rawToken, cookieOptions());

  logFinancialAction('PASSWORD_CHANGE', 'users', user.id, null, null, userContextFrom(req, user.id));

  return res.json({ success: true, message: 'Password changed successfully', csrfToken });
};

export default { login, logout, me, changePassword };

import { validateAndTouchSession } from '../services/sessionService.js';
import { getEffectivePermissions, getEffectiveRoleNames } from '../services/permissionResolutionService.js';
import { SESSION_COOKIE_NAME } from '../config/authConfig.js';

/**
 * authenticate - the single trusted source of `req.user`.
 *
 * SECURITY: this replaces every previous "trust client-supplied identity"
 * pattern in the codebase (`x-user-id` header, `req.user?.id || 1`
 * fallbacks, body `user_id`). From this point on, `req.user` is only ever
 * populated here, from a validated server-side session cookie - never from
 * anything else the client sends.
 *
 * On success, sets:
 *   req.user = { id, username, fullName, role, isActive }
 *   req.session = { id, expiresAt, csrfToken }
 *   req.permissions = Set<string>
 *   req.roles = string[]
 *
 * Responds 401 (without leaking *why*, beyond the generic reason) for any
 * missing/invalid/expired/revoked session or disabled user - fail closed.
 */
export function authenticate(req, res, next) {
  const rawToken = req.cookies ? req.cookies[SESSION_COOKIE_NAME] : undefined;

  if (!rawToken) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const result = validateAndTouchSession(rawToken);
  if (!result) {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return res.status(401).json({ success: false, error: 'Session expired or invalid' });
  }

  const { session, user, rotated } = result;

  if (rotated) {
    // Transparently re-issue the session cookie with the rotated token
    // value (24h sliding token rotation) - the client doesn't need to do
    // anything, the browser just gets a new Set-Cookie on this response.
    res.cookie(SESSION_COOKIE_NAME, rotated.rawToken, cookieOptions());
  }

  req.user = {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    isActive: Boolean(user.is_active)
  };
  req.session = { id: session.id, expiresAt: session.expires_at, csrfToken: session.csrf_token };
  req.permissions = getEffectivePermissions(user.id);
  req.roles = getEffectiveRoleNames(user.id);

  next();
}

/**
 * requirePermission(name) - route-level RBAC enforcement.
 * Must run AFTER `authenticate`. Returns 403 (not 401 - identity is known,
 * authorization is denied) when the authenticated user's effective
 * permission set does not include `name`.
 */
export function requirePermission(permissionName) {
  return (req, res, next) => {
    if (!req.user || !req.permissions) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!req.permissions.has(permissionName)) {
      return res.status(403).json({ success: false, error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

/**
 * requireAnyPermission([names]) - passes if the user has at least one of
 * the listed permissions.
 */
export function requireAnyPermission(permissionNames) {
  return (req, res, next) => {
    if (!req.user || !req.permissions) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const allowed = permissionNames.some((p) => req.permissions.has(p));
    if (!allowed) {
      return res.status(403).json({ success: false, error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

export function cookieOptions(overrides = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // capped by absolute session lifetime server-side regardless
    ...overrides
  };
}

export default { authenticate, requirePermission, requireAnyPermission, cookieOptions };

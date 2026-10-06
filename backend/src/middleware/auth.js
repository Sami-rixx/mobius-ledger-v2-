/**
 * Authentication / authorization / CSRF middleware.
 *
 * Security model (specification §4/§5/§10):
 * - authenticate: validates the session cookie, loads an ACTIVE user and
 *   sets the trusted req.user. 401 for missing/invalid/expired/revoked
 *   sessions and for disabled users. Client-supplied identity (x-user-id,
 *   body user ids) is NEVER trusted.
 * - requirePermission(name): 403 (and an AUTHZ_DENIED audit event) when the
 *   authenticated user lacks the permission. Route-level authorization is
 *   the API security boundary; frontend guards are UX only.
 * - csrfProtection: cookie-based sessions require CSRF defense. All
 *   state-changing /api requests must carry the custom X-Requested-With
 *   header; browsers cannot attach custom headers cross-site without a CORS
 *   preflight, which the narrow CORS policy rejects.
 */
import {
  SESSION_COOKIE_NAME,
  validateSession,
  getUserPermissions,
  getUserRoles
} from '../services/authService.js';
import { recordAuditEvent, AUDIT } from '../services/auditService.js';

/** Paths (relative to /api) that are reachable without a session. */
export const PUBLIC_API_PATHS = [
  { method: 'POST', path: '/auth/login' },
  { method: 'GET', path: '/health' },
  { method: 'GET', path: '/health/db' }
];

export function authenticate(req, res, next) {
  const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (!rawToken) {
    return res.status(401).json({ success: false, error: true, message: 'Authentication required' });
  }

  const result = validateSession(rawToken);
  if (!result) {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/api' });
    return res.status(401).json({ success: false, error: true, message: 'Session is invalid or expired' });
  }

  const permissions = new Set(getUserPermissions(result.user.id));
  req.user = {
    id: result.user.id,
    username: result.user.username,
    fullName: result.user.fullName,
    email: result.user.email,
    roles: getUserRoles(result.user.id),
    permissions,
    hasPermission: (name) => permissions.has(name)
  };
  req.session = result.session;
  return next();
}

export function requirePermission(permissionName) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: true, message: 'Authentication required' });
    }
    if (!req.user.hasPermission(permissionName)) {
      recordAuditEvent({
        action: AUDIT.AUTHZ_DENIED,
        tableName: 'permissions',
        newValues: { permission: permissionName, method: req.method, path: req.originalUrl },
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      return res.status(403).json({
        success: false,
        error: true,
        message: 'You do not have permission to perform this action'
      });
    }
    return next();
  };
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const header = req.get('x-requested-with');
  if (header !== 'XMLHttpRequest') {
    return res.status(403).json({
      success: false,
      error: true,
      message: 'Missing required X-Requested-With header'
    });
  }
  return next();
}

export default { authenticate, requirePermission, csrfProtection, PUBLIC_API_PATHS };

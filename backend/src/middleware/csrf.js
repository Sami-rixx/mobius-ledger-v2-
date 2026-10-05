import { CSRF_HEADER_NAME } from '../config/authConfig.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF protection for the cookie-based session model.
 *
 * Because the session identifier lives in an HttpOnly cookie, the browser
 * will automatically attach it to any cross-site request a malicious page
 * triggers (classic CSRF). We mitigate this with a synchronizer-token
 * pattern: the server hands the authenticated client a per-session CSRF
 * token (in the JSON body of /api/auth/login and /api/auth/me - never in a
 * cookie), and every state-changing request must echo it back in the
 * `x-csrf-token` header. A cross-site attacker can make the browser send
 * the cookie, but has no way to read/know the token value (no-cors
 * cross-origin requests cannot read response bodies), so the request is
 * rejected.
 *
 * Must run AFTER `authenticate` (needs req.session.csrfToken).
 * Safe (GET/HEAD/OPTIONS) requests are exempt, matching standard CSRF
 * guidance that only state-changing requests need protection.
 */
export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  // Login/logout don't have (or are destroying) a session yet; they are
  // exempt by route placement (mounted before this middleware) rather than
  // here, to keep this middleware's contract simple: "if you got this far,
  // req.session must exist and its csrfToken must match."
  if (!req.session || !req.session.csrfToken) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const provided = req.get(CSRF_HEADER_NAME);
  if (!provided || provided !== req.session.csrfToken) {
    return res.status(403).json({ success: false, error: 'Invalid or missing CSRF token' });
  }

  next();
}

export default csrfProtection;

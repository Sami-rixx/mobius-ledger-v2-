/**
 * Centralized auth-related configuration constants.
 */
export const SESSION_COOKIE_NAME = 'mobius_session';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export const LOGIN_LOCKOUT = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_MS: 15 * 60 * 1000 // 15 minutes
};

export default { SESSION_COOKIE_NAME, CSRF_HEADER_NAME, LOGIN_LOCKOUT };

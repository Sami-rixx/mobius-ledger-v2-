/**
 * Auth Service
 * Login / logout / current-user against the server-side session API.
 * The session token lives in an HttpOnly cookie and is never stored in
 * JavaScript, localStorage or URLs.
 */
import { api } from './api.js';

/**
 * Log in with username/password. On success the server sets the HttpOnly
 * session cookie. Returns { success, data: { user } }.
 */
export const login = async (username, password) => {
  return api.post('/auth/login', { username, password });
};

/** Log out: revokes the server-side session and clears the cookie. */
export const logout = async () => {
  return api.post('/auth/logout');
};

/** Fetch the currently authenticated user (401 when not signed in). */
export const getCurrentUser = async () => {
  return api.get('/auth/me');
};

/** Change the current user's password (revokes other sessions). */
export const changePassword = async (currentPassword, newPassword) => {
  return api.post('/auth/change-password', { currentPassword, newPassword });
};

export default { login, logout, getCurrentUser, changePassword };

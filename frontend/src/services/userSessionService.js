/**
 * User Session Service (admin-only API surface)
 *
 * SECURITY REDESIGN: sessions are created exclusively by the server during
 * login and stored only as token hashes. The old client-side session CRUD
 * (create/update/delete/extend/validate-token/lookup-by-token) no longer
 * exists on the server. The remaining surface — gated by the
 * `sessions.manage` permission — is:
 *
 *   GET  /api/user-sessions                     list (no token material)
 *   GET  /api/user-sessions/stats               aggregate stats
 *   GET  /api/user-sessions/:id                 single session
 *   POST /api/user-sessions/:id/deactivate      revoke one session
 *   POST /api/user-sessions/user/:userId/deactivate-all  revoke all for user
 *   POST /api/user-sessions/cleanup             purge expired sessions
 */
import { api } from './api.js';

const BASE_URL = '/user-sessions';

/**
 * List user sessions (admin only).
 * @param {Object} params - { page, pageSize, userId, isActive }
 * @returns {Promise<Object>} - { success, data, pagination }
 */
export const getSessions = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.userId !== undefined) queryParams.append('userId', params.userId);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  return api.get(url);
};

/**
 * Get a single session by id (admin only; never includes token material).
 */
export const getSessionById = async (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Revoke (deactivate) a session.
 */
export const deactivateSession = async (id) => {
  return api.post(`${BASE_URL}/${id}/deactivate`);
};

/**
 * Revoke all sessions for a user.
 */
export const deactivateAllSessionsByUser = async (userId) => {
  return api.post(`${BASE_URL}/user/${userId}/deactivate-all`);
};

/**
 * Purge expired/inactive sessions.
 */
export const cleanupExpiredSessions = async () => {
  return api.post(`${BASE_URL}/cleanup`);
};

/**
 * Aggregate session statistics.
 */
export const getSessionStats = async () => {
  return api.get(`${BASE_URL}/stats`);
};

export default {
  getSessions,
  getSessionById,
  deactivateSession,
  deactivateAllSessionsByUser,
  cleanupExpiredSessions,
  getSessionStats
};

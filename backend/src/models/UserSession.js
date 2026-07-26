import db from '../config/database.js';

/**
 * UserSession Model
 * Data access layer for user_sessions table
 * 
 * Manages user authentication sessions with:
 * - Session token for authentication
 * - User ID reference
 * - IP address tracking
 * - User agent information
 * - Expiration time
 * - Active status
 * - Creation timestamp
 */

// Table name
export const USER_SESSIONS_TABLE = 'user_sessions';

// Field names for consistency
export const USER_SESSION_FIELDS = {
  ID: 'id',
  USER_ID: 'user_id',
  SESSION_TOKEN: 'session_token',
  IP_ADDRESS: 'ip_address',
  USER_AGENT: 'user_agent',
  EXPIRES_AT: 'expires_at',
  IS_ACTIVE: 'is_active',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
};

// Default session duration: 24 hours in milliseconds
const DEFAULT_SESSION_DURATION = 24 * 60 * 60 * 1000;

/**
 * Create a new user session
 * @param {Object} data - Session data
 * @param {number} data.userId - User ID
 * @param {string} data.sessionToken - Unique session token
 * @param {string} data.ipAddress - Client IP address
 * @param {string} data.userAgent - Client user agent
 * @param {Date} data.expiresAt - Expiration timestamp
 * @returns {Object} - Created session record
 */
export const createUserSession = (data) => {
  const { userId, sessionToken, ipAddress, userAgent, expiresAt = new Date(Date.now() + DEFAULT_SESSION_DURATION) } = data;
  
  const stmt = db.prepare(`
    INSERT INTO ${USER_SESSIONS_TABLE} 
    (${USER_SESSION_FIELDS.USER_ID}, ${USER_SESSION_FIELDS.SESSION_TOKEN}, 
     ${USER_SESSION_FIELDS.IP_ADDRESS}, ${USER_SESSION_FIELDS.USER_AGENT}, 
     ${USER_SESSION_FIELDS.EXPIRES_AT}, ${USER_SESSION_FIELDS.IS_ACTIVE}, 
     ${USER_SESSION_FIELDS.CREATED_AT}, ${USER_SESSION_FIELDS.UPDATED_AT})
    VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
  `);
  
  const result = stmt.run(userId, sessionToken, ipAddress, userAgent, expiresAt.toISOString());
  return getUserSessionById(result.lastInsertRowid);
};

/**
 * Get a user session by ID
 * @param {number} id - Session ID
 * @returns {Object|null} - Session record or null if not found
 */
export const getUserSessionById = (id) => {
  const stmt = db.prepare(`
    SELECT * FROM ${USER_SESSIONS_TABLE} 
    WHERE ${USER_SESSION_FIELDS.ID} = ?
  `);
  return stmt.get(id) || null;
};

/**
 * Get a user session by session token
 * @param {string} sessionToken - Session token
 * @returns {Object|null} - Session record or null if not found
 */
export const getUserSessionByToken = (sessionToken) => {
  const stmt = db.prepare(`
    SELECT * FROM ${USER_SESSIONS_TABLE} 
    WHERE ${USER_SESSION_FIELDS.SESSION_TOKEN} = ?
  `);
  return stmt.get(sessionToken) || null;
};

/**
 * Get all active sessions for a user
 * @param {number} userId - User ID
 * @returns {Array} - Array of active session records
 */
export const getActiveSessionsByUser = (userId) => {
  const stmt = db.prepare(`
    SELECT * FROM ${USER_SESSIONS_TABLE} 
    WHERE ${USER_SESSION_FIELDS.USER_ID} = ? 
    AND ${USER_SESSION_FIELDS.IS_ACTIVE} = 1
    AND ${USER_SESSION_FIELDS.EXPIRES_AT} > datetime('now')
    ORDER BY ${USER_SESSION_FIELDS.CREATED_AT} DESC
  `);
  return stmt.all(userId);
};

/**
 * Get all user sessions with optional filtering
 * @param {Object} options - Filter options
 * @param {number} options.userId - Filter by user ID
 * @param {boolean} options.isActive - Filter by active status
 * @param {string} options.ipAddress - Filter by IP address
 * @returns {Array} - Array of session records
 */
export const getAllUserSessions = (options = {}) => {
  const { userId, isActive, ipAddress } = options;
  
  let query = `SELECT * FROM ${USER_SESSIONS_TABLE}`;
  const params = [];
  const conditions = [];
  
  if (userId !== undefined) {
    conditions.push(`${USER_SESSION_FIELDS.USER_ID} = ?`);
    params.push(userId);
  }
  
  if (isActive !== undefined) {
    conditions.push(`${USER_SESSION_FIELDS.IS_ACTIVE} = ?`);
    params.push(isActive ? 1 : 0);
  }
  
  if (ipAddress) {
    conditions.push(`${USER_SESSION_FIELDS.IP_ADDRESS} = ?`);
    params.push(ipAddress);
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  query += ` ORDER BY ${USER_SESSION_FIELDS.CREATED_AT} DESC`;
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
};

/**
 * Update a user session
 * @param {number} id - Session ID
 * @param {Object} data - Data to update
 * @returns {Object|null} - Updated session record or null if not found
 */
export const updateUserSession = (id, data) => {
  const { userId, sessionToken, ipAddress, userAgent, expiresAt, isActive } = data;
  
  const updates = [];
  const params = [];
  
  if (userId !== undefined) {
    updates.push(`${USER_SESSION_FIELDS.USER_ID} = ?`);
    params.push(userId);
  }
  if (sessionToken !== undefined) {
    updates.push(`${USER_SESSION_FIELDS.SESSION_TOKEN} = ?`);
    params.push(sessionToken);
  }
  if (ipAddress !== undefined) {
    updates.push(`${USER_SESSION_FIELDS.IP_ADDRESS} = ?`);
    params.push(ipAddress);
  }
  if (userAgent !== undefined) {
    updates.push(`${USER_SESSION_FIELDS.USER_AGENT} = ?`);
    params.push(userAgent);
  }
  if (expiresAt !== undefined) {
    updates.push(`${USER_SESSION_FIELDS.EXPIRES_AT} = ?`);
    params.push(expiresAt);
  }
  if (isActive !== undefined) {
    updates.push(`${USER_SESSION_FIELDS.IS_ACTIVE} = ?`);
    params.push(isActive ? 1 : 0);
  }
  
  if (updates.length === 0) {
    return getUserSessionById(id);
  }
  
  updates.push(`${USER_SESSION_FIELDS.UPDATED_AT} = datetime('now')`);
  params.push(id);
  
  const stmt = db.prepare(`
    UPDATE ${USER_SESSIONS_TABLE} 
    SET ${updates.join(', ')} 
    WHERE ${USER_SESSION_FIELDS.ID} = ?
  `);
  
  stmt.run(...params);
  return getUserSessionById(id);
};

/**
 * Deactivate a user session (logout)
 * @param {number} id - Session ID
 * @returns {boolean} - True if session was deactivated
 */
export const deactivateUserSession = (id) => {
  const stmt = db.prepare(`
    UPDATE ${USER_SESSIONS_TABLE} 
    SET ${USER_SESSION_FIELDS.IS_ACTIVE} = 0, 
        ${USER_SESSION_FIELDS.UPDATED_AT} = datetime('now')
    WHERE ${USER_SESSION_FIELDS.ID} = ?
  `);
  
  const result = stmt.run(id);
  return result.changes > 0;
};

/**
 * Deactivate all sessions for a user
 * @param {number} userId - User ID
 * @returns {number} - Number of sessions deactivated
 */
export const deactivateAllUserSessions = (userId) => {
  const stmt = db.prepare(`
    UPDATE ${USER_SESSIONS_TABLE} 
    SET ${USER_SESSION_FIELDS.IS_ACTIVE} = 0, 
        ${USER_SESSION_FIELDS.UPDATED_AT} = datetime('now')
    WHERE ${USER_SESSION_FIELDS.USER_ID} = ?
  `);
  
  const result = stmt.run(userId);
  return result.changes;
};

/**
 * Deactivate all expired sessions
 * @returns {number} - Number of sessions deactivated
 */
export const deactivateExpiredSessions = () => {
  const stmt = db.prepare(`
    UPDATE ${USER_SESSIONS_TABLE} 
    SET ${USER_SESSION_FIELDS.IS_ACTIVE} = 0, 
        ${USER_SESSION_FIELDS.UPDATED_AT} = datetime('now')
    WHERE ${USER_SESSION_FIELDS.EXPIRES_AT} <= datetime('now')
    AND ${USER_SESSION_FIELDS.IS_ACTIVE} = 1
  `);
  
  const result = stmt.run();
  return result.changes;
};

/**
 * Delete a user session
 * @param {number} id - Session ID
 * @returns {boolean} - True if session was deleted
 */
export const deleteUserSession = (id) => {
  const stmt = db.prepare(`
    DELETE FROM ${USER_SESSIONS_TABLE} 
    WHERE ${USER_SESSION_FIELDS.ID} = ?
  `);
  
  const result = stmt.run(id);
  return result.changes > 0;
};

/**
 * Delete all sessions for a user
 * @param {number} userId - User ID
 * @returns {number} - Number of sessions deleted
 */
export const deleteAllUserSessions = (userId) => {
  const stmt = db.prepare(`
    DELETE FROM ${USER_SESSIONS_TABLE} 
    WHERE ${USER_SESSION_FIELDS.USER_ID} = ?
  `);
  
  const result = stmt.run(userId);
  return result.changes;
};

/**
 * Get user session count
 * @param {Object} options - Filter options
 * @returns {number} - Count of sessions
 */
export const getUserSessionCount = (options = {}) => {
  const { userId, isActive } = options;
  
  let query = `SELECT COUNT(*) as count FROM ${USER_SESSIONS_TABLE}`;
  const params = [];
  const conditions = [];
  
  if (userId !== undefined) {
    conditions.push(`${USER_SESSION_FIELDS.USER_ID} = ?`);
    params.push(userId);
  }
  
  if (isActive !== undefined) {
    conditions.push(`${USER_SESSION_FIELDS.IS_ACTIVE} = ?`);
    params.push(isActive ? 1 : 0);
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  const stmt = db.prepare(query);
  const result = stmt.get(...params);
  return result ? result.count : 0;
};

/**
 * Validate a session token
 * @param {string} sessionToken - Session token to validate
 * @returns {Object|null} - Valid session record or null
 */
export const validateSessionToken = (sessionToken) => {
  const session = getUserSessionByToken(sessionToken);
  
  if (!session) {
    return null;
  }
  
  // Check if session is active
  if (session.is_active !== 1) {
    return null;
  }
  
  // Check if session has expired
  if (new Date(session.expires_at) <= new Date()) {
    return null;
  }
  
  return session;
};

/**
 * Extend a session's expiration time
 * @param {number} id - Session ID
 * @param {number} extendByHours - Hours to extend by
 * @returns {Object|null} - Updated session record
 */
export const extendUserSession = (id, extendByHours = 24) => {
  const extendByMs = extendByHours * 60 * 60 * 1000;
  const newExpiresAt = new Date(Date.now() + extendByMs);
  
  return updateUserSession(id, { expiresAt: newExpiresAt.toISOString() });
};

// Export all functions for use in services
export default {
  createUserSession,
  getUserSessionById,
  getUserSessionByToken,
  getActiveSessionsByUser,
  getAllUserSessions,
  updateUserSession,
  deactivateUserSession,
  deactivateAllUserSessions,
  deactivateExpiredSessions,
  deleteUserSession,
  deleteAllUserSessions,
  getUserSessionCount,
  validateSessionToken,
  extendUserSession,
  USER_SESSIONS_TABLE,
  USER_SESSION_FIELDS,
  DEFAULT_SESSION_DURATION
};

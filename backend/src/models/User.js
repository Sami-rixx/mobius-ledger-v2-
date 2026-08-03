import db from '../config/database.js';

/**
 * User Model
 * Data access layer for users table
 * 
 * Represents system users with authentication and authorization information
 */

// Table name
const TABLE = 'users';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  USERNAME: 'username',
  FULL_NAME: 'full_name',
  EMAIL: 'email',
  PHONE: 'phone',
  PASSWORD_HASH: 'password_hash',
  ROLE: 'role',
  IS_ACTIVE: 'is_active',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
};

// User roles
const USER_ROLES = {
  ADMIN: 'admin',
  DIRECTOR: 'director',
  TEACHER: 'teacher',
  ACCOUNTANT: 'accountant',
  PARENT: 'parent',
  STUDENT: 'student',
  USER: 'user'
};

/**
 * Get user by ID
 * @param {number} id - User ID
 * @returns {Object|null} - User object or null if not found
 */
export async function getById(id) {
  const row = db.prepare(`SELECT * FROM ${TABLE} WHERE ${FIELDS.ID} = ?`).get(id);
  return row || null;
}

/**
 * Get user by username
 * @param {string} username - Username
 * @returns {Object|null} - User object or null if not found
 */
export async function getByUsername(username) {
  const row = db.prepare(`SELECT * FROM ${TABLE} WHERE ${FIELDS.USERNAME} = ?`).get(username);
  return row || null;
}

/**
 * Get all users
 * @param {Object} options - Filter options
 * @param {string} options.role - Filter by role
 * @param {boolean} options.activeOnly - Only return active users
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @returns {Array} - Array of user objects
 */
export async function getAll(options = {}) {
  const {
    role,
    activeOnly = false,
    limit = 100,
    offset = 0
  } = options;

  let whereClause = '';
  const params = [];

  if (role) {
    whereClause = `WHERE ${FIELDS.ROLE} = ?`;
    params.push(role);
  }

  if (activeOnly) {
    whereClause = whereClause ? `${whereClause} AND ${FIELDS.IS_ACTIVE} = 1` : `WHERE ${FIELDS.IS_ACTIVE} = 1`;
  }

  const rows = db.prepare(`SELECT * FROM ${TABLE} ${whereClause} ORDER BY ${FIELDS.FULL_NAME} ASC LIMIT ? OFFSET ?`).all(...params, limit, offset);
  return rows;
}

/**
 * Get all active users
 * @returns {Array} - Array of active user objects
 */
export async function getAllActive() {
  return getAll({ activeOnly: true });
}

/**
 * Get users by role
 * @param {string} role - Role to filter by
 * @returns {Array} - Array of user objects with the specified role
 */
export async function getByRole(role) {
  return getAll({ role });
}

/**
 * Create a new user
 * @param {Object} data - User data
 * @param {string} data.username - Username (required, unique)
 * @param {string} data.full_name - Full name (required)
 * @param {string} data.email - Email address
 * @param {string} data.phone - Phone number
 * @param {string} data.password_hash - Hashed password
 * @param {string} data.role - User role (default: 'user')
 * @param {boolean} data.is_active - Whether user is active (default: true)
 * @returns {Object} - Created user object
 */
export async function create(data) {
  const {
    username,
    full_name,
    email = null,
    phone = null,
    password_hash = null,
    role = USER_ROLES.USER,
    is_active = true
  } = data;

  const result = db.prepare(`
    INSERT INTO ${TABLE} (${FIELDS.USERNAME}, ${FIELDS.FULL_NAME}, ${FIELDS.EMAIL}, ${FIELDS.PHONE}, ${FIELDS.PASSWORD_HASH}, ${FIELDS.ROLE}, ${FIELDS.IS_ACTIVE})
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(username, full_name, email, phone, password_hash, role, is_active ? 1 : 0);

  return getById(result.lastID);
}

/**
 * Update a user
 * @param {number} id - User ID
 * @param {Object} data - User data to update
 * @returns {Object|null} - Updated user object or null if not found
 */
export async function update(id, data) {
  const existing = await getById(id);
  if (!existing) return null;

  const {
    username = existing.username,
    full_name = existing.full_name,
    email = existing.email,
    phone = existing.phone,
    password_hash = existing.password_hash,
    role = existing.role,
    is_active = existing.is_active
  } = data;

  db.prepare(`
    UPDATE ${TABLE} SET
      ${FIELDS.USERNAME} = ?,
      ${FIELDS.FULL_NAME} = ?,
      ${FIELDS.EMAIL} = ?,
      ${FIELDS.PHONE} = ?,
      ${FIELDS.PASSWORD_HASH} = ?,
      ${FIELDS.ROLE} = ?,
      ${FIELDS.IS_ACTIVE} = ?,
      ${FIELDS.UPDATED_AT} = CURRENT_TIMESTAMP
    WHERE ${FIELDS.ID} = ?
  `).run(username, full_name, email, phone, password_hash, role, is_active ? 1 : 0, id);

  return getById(id);
}

/**
 * Delete a user
 * @param {number} id - User ID
 * @returns {boolean} - True if deleted, false if not found
 */
export async function deleteById(id) {
  const result = db.prepare(`DELETE FROM ${TABLE} WHERE ${FIELDS.ID} = ?`).run(id);
  return result.changes > 0;
}

/**
 * Check if a user exists by ID
 * @param {number} id - User ID
 * @returns {boolean} - True if the user exists
 */
export async function exists(id) {
  return (await getById(id)) !== null;
}

/**
 * Check if a username exists
 * @param {string} username - Username to check
 * @returns {boolean} - True if the username exists
 */
export async function usernameExists(username) {
  return (await getByUsername(username)) !== null;
}

/**
 * Count users
 * @param {Object} options - Filter options
 * @param {string} options.role - Filter by role
 * @param {boolean} options.activeOnly - Only count active users
 * @returns {number} - Count of users
 */
export async function count(options = {}) {
  const { role, activeOnly = false } = options;

  let whereClause = '';
  const params = [];

  if (role) {
    whereClause = `WHERE ${FIELDS.ROLE} = ?`;
    params.push(role);
  }

  if (activeOnly) {
    whereClause = whereClause ? `${whereClause} AND ${FIELDS.IS_ACTIVE} = 1` : `WHERE ${FIELDS.IS_ACTIVE} = 1`;
  }

  const result = db.prepare(`SELECT COUNT(*) as count FROM ${TABLE} ${whereClause}`).get(...params);
  return result.count || 0;
}

// Export constants
export { TABLE, FIELDS, USER_ROLES };

// Export model name for consistency
export const MODEL_NAME = 'User';

import db from '../config/database.js';

/**
 * User Model
 * Data access layer for the `users` table.
 *
 * The `users` table has existed in database/schema.sql since Milestone 0
 * ("for future authentication") but this model file was never created even
 * though backend/src/services/directorWithdrawalService.js already imports
 * it (`import * as UserModel from '../models/User.js'`). That missing file
 * caused ERR_MODULE_NOT_FOUND on every backend startup, because app.js
 * eagerly imports the director withdrawal route chain.
 *
 * This module intentionally only covers data access (CRUD + lookups).
 * Password hashing/verification and session issuance remain service-layer
 * concerns (see docs/audits/ARENA_ENGINEERING_HANDOVER.md for the current
 * state of authentication, which is NOT wired up end-to-end yet).
 */

export const USERS_TABLE = 'users';

export const USER_FIELDS = {
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

const FIELDS = USER_FIELDS;
const TABLE = USERS_TABLE;

// Columns that are safe to return to API consumers (never leak password_hash)
const PUBLIC_COLUMNS = `${FIELDS.ID}, ${FIELDS.USERNAME}, ${FIELDS.FULL_NAME}, ${FIELDS.EMAIL}, ${FIELDS.PHONE}, ${FIELDS.ROLE}, ${FIELDS.IS_ACTIVE}, ${FIELDS.CREATED_AT}, ${FIELDS.UPDATED_AT}`;

function sanitize(row) {
  if (!row) return row;
  return { ...row, is_active: Boolean(row.is_active) };
}

/**
 * Get all users (never includes password_hash)
 * @param {Object} options
 * @param {boolean} [options.isActive]
 * @param {string} [options.role]
 * @param {string} [options.search]
 * @returns {Promise<Array>}
 */
export async function getAll(options = {}) {
  const { isActive, role, search } = options;
  let whereClause = '';
  const params = [];

  if (isActive !== undefined) {
    whereClause += ` AND ${FIELDS.IS_ACTIVE} = ?`;
    params.push(isActive ? 1 : 0);
  }
  if (role) {
    whereClause += ` AND ${FIELDS.ROLE} = ?`;
    params.push(role);
  }
  if (search) {
    whereClause += ` AND (${FIELDS.USERNAME} LIKE ? OR ${FIELDS.FULL_NAME} LIKE ? OR ${FIELDS.EMAIL} LIKE ?)`;
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern);
  }

  const query = `SELECT ${PUBLIC_COLUMNS} FROM ${TABLE} WHERE 1=1 ${whereClause} ORDER BY ${FIELDS.USERNAME} ASC`;
  const rows = db.prepare(query).all(params);
  return rows.map(sanitize);
}

/**
 * Get a user by ID (never includes password_hash)
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
export async function getById(id) {
  const row = db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM ${TABLE} WHERE ${FIELDS.ID} = ?`).get(id);
  return sanitize(row) || null;
}

/**
 * Get a user by username (never includes password_hash)
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
export async function getByUsername(username) {
  const row = db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM ${TABLE} WHERE ${FIELDS.USERNAME} = ?`).get(username);
  return sanitize(row) || null;
}

/**
 * Get a user by username INCLUDING password_hash.
 * Only intended for use by the authentication service when verifying a
 * login attempt - never expose the result of this function directly to API
 * responses.
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
export async function getByUsernameWithCredentials(username) {
  const row = db.prepare(`SELECT * FROM ${TABLE} WHERE ${FIELDS.USERNAME} = ?`).get(username);
  return sanitize(row) || null;
}

/**
 * Create a new user. `passwordHash` must already be hashed by the caller
 * (this model never hashes or verifies passwords itself).
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function create(data) {
  const {
    username,
    fullName,
    email = null,
    phone = null,
    passwordHash = null,
    role = 'admin',
    isActive = true
  } = data;

  const result = db.prepare(`
    INSERT INTO ${TABLE} (${FIELDS.USERNAME}, ${FIELDS.FULL_NAME}, ${FIELDS.EMAIL}, ${FIELDS.PHONE}, ${FIELDS.PASSWORD_HASH}, ${FIELDS.ROLE}, ${FIELDS.IS_ACTIVE})
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(username, fullName, email, phone, passwordHash, role, isActive ? 1 : 0);

  return getById(result.lastInsertRowid);
}

/**
 * Update a user's profile fields (not the password - see updatePassword).
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
export async function update(id, data) {
  const existing = await getById(id);
  if (!existing) return null;

  const fullName = data.fullName !== undefined ? data.fullName : existing.full_name;
  const email = data.email !== undefined ? data.email : existing.email;
  const phone = data.phone !== undefined ? data.phone : existing.phone;
  const role = data.role !== undefined ? data.role : existing.role;
  const isActive = data.isActive !== undefined ? data.isActive : existing.is_active;

  db.prepare(`
    UPDATE ${TABLE}
    SET ${FIELDS.FULL_NAME} = ?, ${FIELDS.EMAIL} = ?, ${FIELDS.PHONE} = ?, ${FIELDS.ROLE} = ?, ${FIELDS.IS_ACTIVE} = ?, ${FIELDS.UPDATED_AT} = CURRENT_TIMESTAMP
    WHERE ${FIELDS.ID} = ?
  `).run(fullName, email, phone, role, isActive ? 1 : 0, id);

  return getById(id);
}

/**
 * Update a user's password hash. `passwordHash` must already be hashed by
 * the caller.
 * @param {number} id
 * @param {string} passwordHash
 * @returns {Promise<boolean>}
 */
export async function updatePassword(id, passwordHash) {
  const result = db.prepare(`
    UPDATE ${TABLE} SET ${FIELDS.PASSWORD_HASH} = ?, ${FIELDS.UPDATED_AT} = CURRENT_TIMESTAMP WHERE ${FIELDS.ID} = ?
  `).run(passwordHash, id);
  return result.changes > 0;
}

/**
 * Delete a user by ID
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteById(id) {
  const result = db.prepare(`DELETE FROM ${TABLE} WHERE ${FIELDS.ID} = ?`).run(id);
  return result.changes > 0;
}

/**
 * Count users
 * @param {Object} options
 * @returns {Promise<number>}
 */
export async function count(options = {}) {
  const { isActive, role } = options;
  let whereClause = '';
  const params = [];

  if (isActive !== undefined) {
    whereClause += ` AND ${FIELDS.IS_ACTIVE} = ?`;
    params.push(isActive ? 1 : 0);
  }
  if (role) {
    whereClause += ` AND ${FIELDS.ROLE} = ?`;
    params.push(role);
  }

  const result = db.prepare(`SELECT COUNT(*) as count FROM ${TABLE} WHERE 1=1 ${whereClause}`).get(params);
  return result.count || 0;
}

export default {
  USERS_TABLE,
  USER_FIELDS,
  getAll,
  getById,
  getByUsername,
  getByUsernameWithCredentials,
  create,
  update,
  updatePassword,
  deleteById,
  count
};

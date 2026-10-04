import db from '../config/database.js';

/**
 * Payment Method Model
 * Data access layer for payment_methods table
 *
 * Represents payment methods (Cash, M-Pesa, Bank Transfer, etc.) used across
 * income, expenses, student charges, and director withdrawals.
 *
 * NOTE: This model was previously referenced (via
 * `import * as PaymentMethodModel from '../models/PaymentMethod.js'`) by
 * backend/src/services/directorWithdrawalService.js but the file did not
 * exist, which caused the whole backend process to crash on startup
 * (ERR_MODULE_NOT_FOUND) because app.js eagerly imports every route module,
 * including the director withdrawal route chain.
 */

// Table name
export const PAYMENT_METHODS_TABLE = 'payment_methods';

// Field names for consistency
export const PAYMENT_METHOD_FIELDS = {
  ID: 'id',
  NAME: 'name',
  DESCRIPTION: 'description',
  IS_ACTIVE: 'is_active',
  IS_SYSTEM: 'is_system',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by'
};

const FIELDS = PAYMENT_METHOD_FIELDS;
const TABLE = PAYMENT_METHODS_TABLE;

/**
 * Get all payment methods with optional filtering
 * @param {Object} options
 * @param {boolean} [options.isActive] - Filter by active status
 * @param {string} [options.search] - Search term for name/description
 * @returns {Promise<Array>} Array of payment methods
 */
export async function getAll(options = {}) {
  const { isActive, search } = options;

  let whereClause = '';
  const params = [];

  if (isActive !== undefined) {
    whereClause += ` AND ${FIELDS.IS_ACTIVE} = ?`;
    params.push(isActive ? 1 : 0);
  }

  if (search) {
    whereClause += ` AND (${FIELDS.NAME} LIKE ? OR ${FIELDS.DESCRIPTION} LIKE ?)`;
    const pattern = `%${search}%`;
    params.push(pattern, pattern);
  }

  const query = `SELECT * FROM ${TABLE} WHERE 1=1 ${whereClause} ORDER BY ${FIELDS.NAME} ASC`;

  const rows = db.prepare(query).all(params);
  return rows.map((row) => ({
    ...row,
    is_active: Boolean(row.is_active),
    is_system: Boolean(row.is_system)
  }));
}

/**
 * Get all active payment methods
 * @returns {Promise<Array>}
 */
export async function getAllActive() {
  return getAll({ isActive: true });
}

/**
 * Get a payment method by ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
export async function getById(id) {
  const row = db.prepare(`SELECT * FROM ${TABLE} WHERE ${FIELDS.ID} = ?`).get(id);
  if (!row) return null;
  return { ...row, is_active: Boolean(row.is_active), is_system: Boolean(row.is_system) };
}

/**
 * Get a payment method by name
 * @param {string} name
 * @returns {Promise<Object|null>}
 */
export async function getByName(name) {
  const row = db.prepare(`SELECT * FROM ${TABLE} WHERE ${FIELDS.NAME} = ?`).get(name);
  if (!row) return null;
  return { ...row, is_active: Boolean(row.is_active), is_system: Boolean(row.is_system) };
}

/**
 * Create a new payment method
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function create(data) {
  const { name, description = null, isActive = true, createdBy = null } = data;

  const result = db.prepare(`
    INSERT INTO ${TABLE} (${FIELDS.NAME}, ${FIELDS.DESCRIPTION}, ${FIELDS.IS_ACTIVE}, ${FIELDS.IS_SYSTEM}, ${FIELDS.CREATED_BY}, ${FIELDS.UPDATED_BY})
    VALUES (?, ?, ?, 0, ?, ?)
  `).run(name, description, isActive ? 1 : 0, createdBy, createdBy);

  return getById(result.lastInsertRowid);
}

/**
 * Update a payment method
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
export async function update(id, data) {
  const existing = await getById(id);
  if (!existing) return null;

  const name = data.name !== undefined ? data.name : existing.name;
  const description = data.description !== undefined ? data.description : existing.description;
  const isActive = data.isActive !== undefined ? data.isActive : existing.is_active;
  const updatedBy = data.updatedBy !== undefined ? data.updatedBy : existing.updated_by;

  db.prepare(`
    UPDATE ${TABLE}
    SET ${FIELDS.NAME} = ?, ${FIELDS.DESCRIPTION} = ?, ${FIELDS.IS_ACTIVE} = ?, ${FIELDS.UPDATED_BY} = ?, ${FIELDS.UPDATED_AT} = CURRENT_TIMESTAMP
    WHERE ${FIELDS.ID} = ?
  `).run(name, description, isActive ? 1 : 0, updatedBy, id);

  return getById(id);
}

/**
 * Delete a payment method by ID.
 * System payment methods (is_system = 1) cannot be deleted.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function deleteById(id) {
  const existing = await getById(id);
  if (!existing) return false;
  if (existing.is_system) {
    throw new Error('Cannot delete a system payment method');
  }

  const result = db.prepare(`DELETE FROM ${TABLE} WHERE ${FIELDS.ID} = ?`).run(id);
  return result.changes > 0;
}

/**
 * Count payment methods
 * @param {Object} options
 * @returns {Promise<number>}
 */
export async function count(options = {}) {
  const { isActive } = options;
  let whereClause = '';
  const params = [];

  if (isActive !== undefined) {
    whereClause += ` AND ${FIELDS.IS_ACTIVE} = ?`;
    params.push(isActive ? 1 : 0);
  }

  const result = db.prepare(`SELECT COUNT(*) as count FROM ${TABLE} WHERE 1=1 ${whereClause}`).get(params);
  return result.count || 0;
}

export default {
  PAYMENT_METHODS_TABLE,
  PAYMENT_METHOD_FIELDS,
  getAll,
  getAllActive,
  getById,
  getByName,
  create,
  update,
  deleteById,
  count
};

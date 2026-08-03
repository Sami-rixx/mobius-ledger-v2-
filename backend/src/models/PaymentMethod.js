import db from '../config/database.js';

/**
 * PaymentMethod Model
 * Data access layer for payment_methods table
 * 
 * Represents payment methods used across the system including:
 * - Cash
 * - Bank Transfer
 * - Mobile Money
 * - Cheque
 * - Card
 * - Other custom methods
 */

// Table name
const TABLE = 'payment_methods';

// Field names for consistency
const FIELDS = {
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

/**
 * Get payment method by ID
 * @param {number} id - Payment method ID
 * @returns {Promise<Object|null>} - Single payment method record or null if not found
 */
export async function getById(id) {
  const row = db.prepare(`SELECT * FROM ${TABLE} WHERE ${FIELDS.ID} = ?`).get(id);
  return row || null;
}

/**
 * Get payment method by name
 * @param {string} name - Payment method name
 * @returns {Promise<Object|null>} - Single payment method record or null if not found
 */
export async function getByName(name) {
  const row = db.prepare(`SELECT * FROM ${TABLE} WHERE ${FIELDS.NAME} = ?`).get(name);
  return row || null;
}

/**
 * Get all payment methods
 * @param {Object} options - Filter options
 * @param {boolean} options.activeOnly - Only return active payment methods
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @returns {Promise<Array>} - Array of payment method records
 */
export async function getAll(options = {}) {
  const {
    activeOnly = false,
    limit = 100,
    offset = 0
  } = options;

  let whereClause = '';

  if (activeOnly) {
    whereClause = `WHERE ${FIELDS.IS_ACTIVE} = 1`;
  }

  const rows = db.prepare(`SELECT * FROM ${TABLE} ${whereClause} ORDER BY ${FIELDS.NAME} ASC LIMIT ? OFFSET ?`).all(limit, offset);
  return rows;
}

/**
 * Get all active payment methods
 * @returns {Promise<Array>} - Array of active payment method records
 */
export async function getAllActive() {
  return getAll({ activeOnly: true });
}

/**
 * Create a new payment method
 * @param {Object} data - Payment method data
 * @param {string} data.name - Payment method name (required)
 * @param {string} data.description - Description of the payment method
 * @param {boolean} data.isActive - Whether the payment method is active (default: true)
 * @param {boolean} data.isSystem - Whether the payment method is a system method (default: false)
 * @param {number} data.createdBy - ID of user who created the payment method
 * @returns {Promise<Object>} - Created payment method record
 */
export async function create(data) {
  const {
    name,
    description = null,
    isActive = true,
    isSystem = false,
    createdBy = null
  } = data;

  const result = db.prepare(`
    INSERT INTO ${TABLE} (${FIELDS.NAME}, ${FIELDS.DESCRIPTION}, ${FIELDS.IS_ACTIVE}, ${FIELDS.IS_SYSTEM}, ${FIELDS.CREATED_BY})
    VALUES (?, ?, ?, ?, ?)
  `).run(name, description, isActive ? 1 : 0, isSystem ? 1 : 0, createdBy);

  return getById(result.lastID);
}

/**
 * Update an existing payment method
 * @param {number} id - Payment method ID
 * @param {Object} data - Payment method data to update
 * @param {string} data.name - Payment method name
 * @param {string} data.description - Description of the payment method
 * @param {boolean} data.isActive - Whether the payment method is active
 * @param {boolean} data.isSystem - Whether the payment method is a system method
 * @param {number} data.updatedBy - ID of user who updated the payment method
 * @returns {Promise<Object|null>} - Updated payment method record or null if not found
 */
export async function update(id, data) {
  const existing = await getById(id);
  if (!existing) return null;

  const {
    name = existing.name,
    description = existing.description,
    isActive = existing.is_active,
    isSystem = existing.is_system,
    updatedBy = null
  } = data;

  db.prepare(`
    UPDATE ${TABLE} SET
      ${FIELDS.NAME} = ?,
      ${FIELDS.DESCRIPTION} = ?,
      ${FIELDS.IS_ACTIVE} = ?,
      ${FIELDS.IS_SYSTEM} = ?,
      ${FIELDS.UPDATED_AT} = CURRENT_TIMESTAMP,
      ${FIELDS.UPDATED_BY} = ?
    WHERE ${FIELDS.ID} = ?
  `).run(name, description, isActive ? 1 : 0, isSystem ? 1 : 0, updatedBy, id);

  return getById(id);
}

/**
 * Delete a payment method
 * @param {number} id - Payment method ID
 * @returns {Promise<boolean>} - True if deleted, false if not found or system method
 */
export async function deleteById(id) {
  // Prevent deletion of system payment methods
  const paymentMethod = await getById(id);
  if (!paymentMethod || paymentMethod.is_system === 1) {
    return false;
  }

  const result = db.prepare(`DELETE FROM ${TABLE} WHERE ${FIELDS.ID} = ?`).run(id);
  return result.changes > 0;
}

/**
 * Count total payment methods
 * @param {Object} options - Filter options
 * @param {boolean} options.activeOnly - Only count active payment methods
 * @returns {Promise<number>} - Total count of payment methods
 */
export async function count(options = {}) {
  const { activeOnly = false } = options;

  let whereClause = '';
  if (activeOnly) {
    whereClause = `WHERE ${FIELDS.IS_ACTIVE} = 1`;
  }

  const result = db.prepare(`SELECT COUNT(*) as count FROM ${TABLE} ${whereClause}`).get();
  return result.count || 0;
}

/**
 * Check if a payment method exists
 * @param {number} id - Payment method ID
 * @returns {Promise<boolean>} - True if the payment method exists
 */
export async function exists(id) {
  const paymentMethod = await getById(id);
  return paymentMethod !== null;
}

// Export constants
export { TABLE, FIELDS };

// Export model name for consistency
export const MODEL_NAME = 'PaymentMethod';

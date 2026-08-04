import db from '../config/database.js';
import { toCents, fromCents, getAmount } from '../utils/money.js';

/**
 * Director Withdrawal Model
 * Data access layer for director_withdrawals table
 * 
 * Represents director/management withdrawals with:
 * - Amount and date
 * - Purpose/description
 * - Approval status workflow
 * - Recipient information
 * - Payment method
 * - Configurable label
 * - Audit fields (created_by, updated_by, timestamps)
 */

// Table name
const TABLE = 'director_withdrawals';

// Related tables
const PAYMENT_METHODS_TABLE = 'payment_methods';
const TRANSACTIONS_TABLE = 'transactions';
const USERS_TABLE = 'users';

// Withdrawal status constants
const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Field names for consistency
const FIELDS = {
  ID: 'id',
  AMOUNT: 'amount',
  LABEL: 'label',
  PURPOSE: 'purpose',
  DESCRIPTION: 'description',
  RECIPIENT_NAME: 'recipient_name',
  RECIPIENT_CONTACT: 'recipient_contact',
  PAYMENT_METHOD_ID: 'payment_method_id',
  TRANSACTION_ID: 'transaction_id',
  WITHDRAWAL_DATE: 'withdrawal_date',
  STATUS: 'status',
  APPROVED_BY: 'approved_by',
  APPROVED_AT: 'approved_at',
  REJECTED_BY: 'rejected_by',
  REJECTED_AT: 'rejected_at',
  REJECTION_REASON: 'rejection_reason',
  NOTES: 'notes',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by'
};

/**
 * Get all director withdrawals with optional filtering
 * @param {Object} options - Filter options
 * @param {string} options.label - Filter by withdrawal label
 * @param {string} options.status - Filter by status (pending, approved, rejected, completed, cancelled)
 * @param {string} options.recipientName - Filter by recipient name
 * @param {string} options.startDate - Filter by start date (inclusive)
 * @param {string} options.endDate - Filter by end date (inclusive)
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDirection - ASC or DESC
 * @returns {Array} - Array of director withdrawal records
 */
export function getAll(options = {}) {
  const {
    label,
    status,
    recipientName,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
    orderBy = FIELDS.WITHDRAWAL_DATE,
    orderDirection = 'DESC'
  } = options;

  let whereClause = '';
  const params = [];

  if (label) {
    whereClause += ` AND ${TABLE}.${FIELDS.LABEL} LIKE ?`;
    params.push(`%${label}%`);
  }

  if (status) {
    whereClause += ` AND ${TABLE}.${FIELDS.STATUS} = ?`;
    params.push(status);
  }

  if (recipientName) {
    whereClause += ` AND ${TABLE}.${FIELDS.RECIPIENT_NAME} LIKE ?`;
    params.push(`%${recipientName}%`);
  }

  if (startDate) {
    whereClause += ` AND ${TABLE}.${FIELDS.WITHDRAWAL_DATE} >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ` AND ${TABLE}.${FIELDS.WITHDRAWAL_DATE} <= ?`;
    params.push(endDate);
  }

  // Validate orderBy to prevent SQL injection
  const validOrderFields = [
    FIELDS.ID,
    FIELDS.AMOUNT,
    FIELDS.LABEL,
    FIELDS.WITHDRAWAL_DATE,
    FIELDS.RECIPIENT_NAME,
    FIELDS.STATUS,
    FIELDS.CREATED_AT
  ];
  const orderField = validOrderFields.includes(orderBy) ? orderBy : FIELDS.WITHDRAWAL_DATE;
  const validDirection = orderDirection === 'ASC' ? 'ASC' : 'DESC';

  const query = `
    SELECT ${TABLE}.*, 
           ${PAYMENT_METHODS_TABLE}.name as payment_method_name,
           ${USERS_TABLE}.username as created_by_username,
           approved_user.username as approved_by_username,
           rejected_user.username as rejected_by_username
    FROM ${TABLE}
    LEFT JOIN ${PAYMENT_METHODS_TABLE} ON ${TABLE}.${FIELDS.PAYMENT_METHOD_ID} = ${PAYMENT_METHODS_TABLE}.id
    LEFT JOIN ${USERS_TABLE} ON ${TABLE}.${FIELDS.CREATED_BY} = ${USERS_TABLE}.id
    LEFT JOIN ${USERS_TABLE} as approved_user ON ${TABLE}.${FIELDS.APPROVED_BY} = approved_user.id
    LEFT JOIN ${USERS_TABLE} as rejected_user ON ${TABLE}.${FIELDS.REJECTED_BY} = rejected_user.id
    WHERE 1=1 ${whereClause}
    ORDER BY ${TABLE}.${orderField} ${validDirection}
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);

  try {
    const rows = db.prepare(query).all(...params);
    return rows.map(row => ({
      ...row,
      amount: getAmount(row, FIELDS.AMOUNT),
      is_approved: row.status === WITHDRAWAL_STATUS.APPROVED,
      is_pending: row.status === WITHDRAWAL_STATUS.PENDING,
      is_rejected: row.status === WITHDRAWAL_STATUS.REJECTED,
      is_completed: row.status === WITHDRAWAL_STATUS.COMPLETED,
      is_cancelled: row.status === WITHDRAWAL_STATUS.CANCELLED
    }));
  } catch (error) {
    console.error('Error in getAll director withdrawals:', error.message);
    throw error;
  }
}

/**
 * Get director withdrawal by ID
 * @param {number} id - Director withdrawal record ID
 * @returns {Object|null} - Director withdrawal record or null
 */
export function getById(id) {
  const query = `
    SELECT ${TABLE}.*, 
           ${PAYMENT_METHODS_TABLE}.name as payment_method_name,
           ${USERS_TABLE}.username as created_by_username,
           approved_user.username as approved_by_username,
           rejected_user.username as rejected_by_username
    FROM ${TABLE}
    LEFT JOIN ${PAYMENT_METHODS_TABLE} ON ${TABLE}.${FIELDS.PAYMENT_METHOD_ID} = ${PAYMENT_METHODS_TABLE}.id
    LEFT JOIN ${USERS_TABLE} ON ${TABLE}.${FIELDS.CREATED_BY} = ${USERS_TABLE}.id
    LEFT JOIN ${USERS_TABLE} as approved_user ON ${TABLE}.${FIELDS.APPROVED_BY} = approved_user.id
    LEFT JOIN ${USERS_TABLE} as rejected_user ON ${TABLE}.${FIELDS.REJECTED_BY} = rejected_user.id
    WHERE ${TABLE}.${FIELDS.ID} = ?
  `;

  try {
    const row = db.prepare(query).get(id);
    if (!row) return null;
    
    return {
      ...row,
      amount: getAmount(row, FIELDS.AMOUNT),
      is_approved: row.status === WITHDRAWAL_STATUS.APPROVED,
      is_pending: row.status === WITHDRAWAL_STATUS.PENDING,
      is_rejected: row.status === WITHDRAWAL_STATUS.REJECTED,
      is_completed: row.status === WITHDRAWAL_STATUS.COMPLETED,
      is_cancelled: row.status === WITHDRAWAL_STATUS.CANCELLED
    };
  } catch (error) {
    console.error('Error in getById director withdrawal:', error.message);
    throw error;
  }
}

/**
 * Create a new director withdrawal
 * @param {Object} data - Director withdrawal data
 * @param {number} data.amount - Withdrawal amount
 * @param {string} data.label - Configurable label for the withdrawal
 * @param {string} data.purpose - Purpose of the withdrawal
 * @param {string} data.description - Detailed description
 * @param {string} data.recipientName - Name of the recipient
 * @param {string} data.recipientContact - Contact information for recipient
 * @param {number} data.paymentMethodId - Payment method ID
 * @param {string} data.withdrawalDate - Date of withdrawal (YYYY-MM-DD)
 * @param {string} data.notes - Additional notes
 * @param {number} data.createdBy - ID of user creating the withdrawal
 * @returns {Object} - Created director withdrawal record
 */
export function create(data) {
  const {
    amount,
    label,
    purpose,
    description,
    recipientName,
    recipientContact,
    paymentMethodId,
    withdrawalDate = new Date().toISOString().split('T')[0],
    notes,
    createdBy
  } = data;

  // Convert amount to cents for storage
  const amountCents = toCents(amount);

  const query = `
    INSERT INTO ${TABLE} (
      ${FIELDS.AMOUNT},
      ${FIELDS.LABEL},
      ${FIELDS.PURPOSE},
      ${FIELDS.DESCRIPTION},
      ${FIELDS.RECIPIENT_NAME},
      ${FIELDS.RECIPIENT_CONTACT},
      ${FIELDS.PAYMENT_METHOD_ID},
      ${FIELDS.WITHDRAWAL_DATE},
      ${FIELDS.STATUS},
      ${FIELDS.NOTES},
      ${FIELDS.CREATED_BY},
      ${FIELDS.UPDATED_BY},
      ${FIELDS.CREATED_AT},
      ${FIELDS.UPDATED_AT}
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;

  const params = [
    amountCents,
    label,
    purpose,
    description,
    recipientName,
    recipientContact,
    paymentMethodId || null,
    withdrawalDate,
    WITHDRAWAL_STATUS.PENDING,
    notes || null,
    createdBy,
    createdBy
  ];

  try {
    const result = db.prepare(query).run(...params);
    return getById(result.lastInsertRowid);
  } catch (error) {
    console.error('Error in create director withdrawal:', error.message);
    throw error;
  }
}

/**
 * Update a director withdrawal
 * @param {number} id - Director withdrawal ID
 * @param {Object} data - Director withdrawal data to update
 * @param {number} data.amount - Withdrawal amount
 * @param {string} data.label - Configurable label for the withdrawal
 * @param {string} data.purpose - Purpose of the withdrawal
 * @param {string} data.description - Detailed description
 * @param {string} data.recipientName - Name of the recipient
 * @param {string} data.recipientContact - Contact information for recipient
 * @param {number} data.paymentMethodId - Payment method ID
 * @param {string} data.withdrawalDate - Date of withdrawal (YYYY-MM-DD)
 * @param {string} data.status - Status (pending, approved, rejected, completed, cancelled)
 * @param {string} data.notes - Additional notes
 * @param {number} data.updatedBy - ID of user updating the withdrawal
 * @returns {Object} - Updated director withdrawal record
 */
export function update(id, data) {
  const {
    amount,
    label,
    purpose,
    description,
    recipientName,
    recipientContact,
    paymentMethodId,
    withdrawalDate,
    status,
    notes,
    updatedBy
  } = data;

  // Calculate amount if amount is being updated
  let amountCents = undefined;
  if (amount !== undefined) {
    amountCents = toCents(amount);
  }

  const query = `
    UPDATE ${TABLE} SET
      ${FIELDS.AMOUNT} = ?,
      ${FIELDS.LABEL} = ?,
      ${FIELDS.PURPOSE} = ?,
      ${FIELDS.DESCRIPTION} = ?,
      ${FIELDS.RECIPIENT_NAME} = ?,
      ${FIELDS.RECIPIENT_CONTACT} = ?,
      ${FIELDS.PAYMENT_METHOD_ID} = ?,
      ${FIELDS.WITHDRAWAL_DATE} = ?,
      ${FIELDS.STATUS} = ?,
      ${FIELDS.NOTES} = ?,
      ${FIELDS.UPDATED_BY} = ?,
      ${FIELDS.UPDATED_AT} = CURRENT_TIMESTAMP
    WHERE ${FIELDS.ID} = ?
  `;

  const params = [
    amountCents,
    label,
    purpose,
    description,
    recipientName,
    recipientContact,
    paymentMethodId || null,
    withdrawalDate,
    status,
    notes || null,
    updatedBy,
    id
  ];

  try {
    db.prepare(query).run(...params);
    return getById(id);
  } catch (error) {
    console.error('Error in update director withdrawal:', error.message);
    throw error;
  }
}

/**
 * Delete a director withdrawal
 * @param {number} id - Director withdrawal ID
 * @returns {boolean} - True if deleted, false otherwise
 */
export function deleteById(id) {
  const query = `DELETE FROM ${TABLE} WHERE ${FIELDS.ID} = ?`;

  try {
    const result = db.prepare(query).run(id);
    return result.changes > 0;
  } catch (error) {
    console.error('Error in deleteById director withdrawal:', error.message);
    throw error;
  }
}

/**
 * Get director withdrawals by status
 * @param {string} status - Status to filter by
 * @param {Object} options - Additional filter options
 * @returns {Array} - Array of director withdrawal records
 */
export function getByStatus(status, options = {}) {
  return getAll({ ...options, status });
}

/**
 * Get pending director withdrawals (awaiting approval)
 * @param {Object} options - Filter options
 * @returns {Array} - Array of pending director withdrawal records
 */
export function getPending(options = {}) {
  return getByStatus(WITHDRAWAL_STATUS.PENDING, options);
}

/**
 * Get approved director withdrawals
 * @param {Object} options - Filter options
 * @returns {Array} - Array of approved director withdrawal records
 */
export function getApproved(options = {}) {
  return getByStatus(WITHDRAWAL_STATUS.APPROVED, options);
}

/**
 * Get rejected director withdrawals
 * @param {Object} options - Filter options
 * @returns {Array} - Array of rejected director withdrawal records
 */
export function getRejected(options = {}) {
  return getByStatus(WITHDRAWAL_STATUS.REJECTED, options);
}

/**
 * Approve a director withdrawal
 * @param {number} id - Director withdrawal ID
 * @param {number} approvedBy - ID of user approving
 * @param {string} notes - Approval notes
 * @returns {Object} - Updated director withdrawal record
 */
export function approve(id, approvedBy, notes = null) {
  const query = `
    UPDATE ${TABLE} SET
      ${FIELDS.STATUS} = ?,
      ${FIELDS.APPROVED_BY} = ?,
      ${FIELDS.APPROVED_AT} = CURRENT_TIMESTAMP,
      ${FIELDS.NOTES} = COALESCE(${FIELDS.NOTES}, '') || ?,
      ${FIELDS.UPDATED_BY} = ?,
      ${FIELDS.UPDATED_AT} = CURRENT_TIMESTAMP
    WHERE ${FIELDS.ID} = ?
  `;

  try {
    db.prepare(query).run(
      WITHDRAWAL_STATUS.APPROVED,
      approvedBy,
      notes ? `\nApproval note: ${notes}` : '',
      approvedBy,
      id
    );
    return getById(id);
  } catch (error) {
    console.error('Error in approve director withdrawal:', error.message);
    throw error;
  }
}

/**
 * Reject a director withdrawal
 * @param {number} id - Director withdrawal ID
 * @param {number} rejectedBy - ID of user rejecting
 * @param {string} reason - Reason for rejection
 * @returns {Object} - Updated director withdrawal record
 */
export function reject(id, rejectedBy, reason) {
  const query = `
    UPDATE ${TABLE} SET
      ${FIELDS.STATUS} = ?,
      ${FIELDS.REJECTED_BY} = ?,
      ${FIELDS.REJECTED_AT} = CURRENT_TIMESTAMP,
      ${FIELDS.REJECTION_REASON} = ?,
      ${FIELDS.UPDATED_BY} = ?,
      ${FIELDS.UPDATED_AT} = CURRENT_TIMESTAMP
    WHERE ${FIELDS.ID} = ?
  `;

  try {
    db.prepare(query).run(
      WITHDRAWAL_STATUS.REJECTED,
      rejectedBy,
      reason,
      rejectedBy,
      id
    );
    return getById(id);
  } catch (error) {
    console.error('Error in reject director withdrawal:', error.message);
    throw error;
  }
}

/**
 * Mark a director withdrawal as completed
 * @param {number} id - Director withdrawal ID
 * @param {number} updatedBy - ID of user marking as completed
 * @param {number} transactionId - Optional transaction ID
 * @returns {Object} - Updated director withdrawal record
 */
export function markAsCompleted(id, updatedBy, transactionId = null) {
  const query = `
    UPDATE ${TABLE} SET
      ${FIELDS.STATUS} = ?,
      ${FIELDS.TRANSACTION_ID} = ?,
      ${FIELDS.UPDATED_BY} = ?,
      ${FIELDS.UPDATED_AT} = CURRENT_TIMESTAMP
    WHERE ${FIELDS.ID} = ?
  `;

  try {
    db.prepare(query).run(
      WITHDRAWAL_STATUS.COMPLETED,
      transactionId || null,
      updatedBy,
      id
    );
    return getById(id);
  } catch (error) {
    console.error('Error in markAsCompleted director withdrawal:', error.message);
    throw error;
  }
}

/**
 * Cancel a director withdrawal
 * @param {number} id - Director withdrawal ID
 * @param {number} updatedBy - ID of user cancelling
 * @param {string} reason - Reason for cancellation
 * @returns {Object} - Updated director withdrawal record
 */
export function cancel(id, updatedBy, reason = null) {
  const query = `
    UPDATE ${TABLE} SET
      ${FIELDS.STATUS} = ?,
      ${FIELDS.NOTES} = COALESCE(${FIELDS.NOTES}, '') || ?,
      ${FIELDS.UPDATED_BY} = ?,
      ${FIELDS.UPDATED_AT} = CURRENT_TIMESTAMP
    WHERE ${FIELDS.ID} = ?
  `;

  try {
    db.prepare(query).run(
      WITHDRAWAL_STATUS.CANCELLED,
      reason ? `\nCancellation reason: ${reason}` : '',
      updatedBy,
      id
    );
    return getById(id);
  } catch (error) {
    console.error('Error in cancel director withdrawal:', error.message);
    throw error;
  }
}

/**
 * Get withdrawal statistics
 * @returns {Object} - Statistics object
 */
export function getStatistics() {
  const query = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN 1 ELSE 0 END) as approved_count,
      SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN 1 ELSE 0 END) as rejected_count,
      SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN 1 ELSE 0 END) as completed_count,
      SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN 1 ELSE 0 END) as cancelled_count,
      COALESCE(SUM(${FIELDS.AMOUNT}), SUM(${FIELDS.AMOUNT} * 100)) as total_amount,
      COALESCE(SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN ${FIELDS.AMOUNT} ELSE 0 END), SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN ${FIELDS.AMOUNT} * 100 ELSE 0 END)) as pending_amount,
      COALESCE(SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN ${FIELDS.AMOUNT} ELSE 0 END), SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN ${FIELDS.AMOUNT} * 100 ELSE 0 END)) as approved_amount,
      COALESCE(SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN ${FIELDS.AMOUNT} ELSE 0 END), SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN ${FIELDS.AMOUNT} * 100 ELSE 0 END)) as rejected_amount,
    FROM ${TABLE}
  `;

  const params = [
    WITHDRAWAL_STATUS.PENDING,
    WITHDRAWAL_STATUS.APPROVED,
    WITHDRAWAL_STATUS.REJECTED,
    WITHDRAWAL_STATUS.COMPLETED,
    WITHDRAWAL_STATUS.CANCELLED,
    WITHDRAWAL_STATUS.PENDING,
    WITHDRAWAL_STATUS.PENDING,
    WITHDRAWAL_STATUS.APPROVED,
    WITHDRAWAL_STATUS.APPROVED,
    WITHDRAWAL_STATUS.REJECTED,
    WITHDRAWAL_STATUS.REJECTED
  ];

  try {
    const row = db.prepare(query).get(...params);
    return {
      total: row.total || 0,
      by_status: {
        pending: row.pending_count || 0,
        approved: row.approved_count || 0,
        rejected: row.rejected_count || 0,
        completed: row.completed_count || 0,
        cancelled: row.cancelled_count || 0
      },
      by_amount: {
        total: parseFloat(fromCents(row.total_amount || 0)),
        pending: parseFloat(fromCents(row.pending_amount || 0)),
        approved: parseFloat(fromCents(row.approved_amount || 0)),
        rejected: parseFloat(fromCents(row.rejected_amount || 0))
      }
    };
  } catch (error) {
    console.error('Error in getStatistics director withdrawals:', error.message);
    throw error;
  }
}

/**
 * Get all unique labels
 * @returns {Array} - Array of unique labels
 */
export function getAllLabels() {
  const query = `
    SELECT DISTINCT ${FIELDS.LABEL} 
    FROM ${TABLE} 
    WHERE ${FIELDS.LABEL} IS NOT NULL 
    ORDER BY ${FIELDS.LABEL}
  `;

  try {
    const rows = db.prepare(query).all();
    return rows.map(row => row.label);
  } catch (error) {
    console.error('Error in getAllLabels director withdrawals:', error.message);
    throw error;
  }
}

/**
 * Get director withdrawals by date range
 * @param {string} startDate - Start date (inclusive)
 * @param {string} endDate - End date (inclusive)
 * @param {Object} options - Additional filter options
 * @returns {Array} - Array of director withdrawal records
 */
export function getByDateRange(startDate, endDate, options = {}) {
  return getAll({ ...options, startDate, endDate });
}

/**
 * Get count of director withdrawals
 * @param {Object} options - Filter options
 * @returns {number} - Count of records
 */
export function getCount(options = {}) {
  const {
    label,
    status,
    recipientName,
    startDate,
    endDate
  } = options;

  let whereClause = '';
  const params = [];

  if (label) {
    whereClause += ` AND ${FIELDS.LABEL} LIKE ?`;
    params.push(`%${label}%`);
  }

  if (status) {
    whereClause += ` AND ${FIELDS.STATUS} = ?`;
    params.push(status);
  }

  if (recipientName) {
    whereClause += ` AND ${FIELDS.RECIPIENT_NAME} LIKE ?`;
    params.push(`%${recipientName}%`);
  }

  if (startDate) {
    whereClause += ` AND ${FIELDS.WITHDRAWAL_DATE} >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ` AND ${FIELDS.WITHDRAWAL_DATE} <= ?`;
    params.push(endDate);
  }

  const query = `SELECT COUNT(*) as count FROM ${TABLE} WHERE 1=1 ${whereClause}`;

  try {
    const row = db.prepare(query).get(...params);
    return row.count || 0;
  } catch (error) {
    console.error('Error in getCount director withdrawals:', error.message);
    throw error;
  }
}

// Export constants
export { TABLE, FIELDS, WITHDRAWAL_STATUS };

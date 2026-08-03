import db from '../config/database.js';
import { toCents, fromCents, getAmount } from '../utils/money.js';

/**
 * Income Model
 * Data access layer for income table
 * 
 * Represents income records with:
 * - Unique receipt number
 * - Amount and date
 * - Category reference
 * - Payer information
 * - Payment method
 * - Audit fields (created_by, updated_by, timestamps)
 */

// Table name
const TABLE = 'income';

// Related tables
const INCOME_CATEGORIES_TABLE = 'income_categories';
const PAYMENT_METHODS_TABLE = 'payment_methods';
const TRANSACTIONS_TABLE = 'transactions';
const USERS_TABLE = 'users';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  RECEIPT_NUMBER: 'receipt_number',
  AMOUNT: 'amount',
  INCOME_CATEGORY_ID: 'income_category_id',
  DESCRIPTION: 'description',
  PAYER_NAME: 'payer_name',
  PAYER_CONTACT: 'payer_contact',
  PAYMENT_METHOD_ID: 'payment_method_id',
  TRANSACTION_ID: 'transaction_id',
  INCOME_DATE: 'income_date',
  NOTES: 'notes',
  IS_VERIFIED: 'is_verified',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by'
};

/**
 * Get all income records with optional filtering
 * @param {Object} options - Filter options
 * @param {number} options.categoryId - Filter by income category ID
 * @param {string} options.receiptNumber - Filter by receipt number
 * @param {string} options.payerName - Filter by payer name
 * @param {string} options.startDate - Filter by start date (inclusive)
 * @param {string} options.endDate - Filter by end date (inclusive)
 * @param {boolean} options.isVerified - Filter by verification status
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDirection - ASC or DESC
 * @returns {Promise<Array>} - Array of income records
 */
export async function getAll(options = {}) {
  const {
    categoryId,
    receiptNumber,
    payerName,
    startDate,
    endDate,
    isVerified,
    limit = 100,
    offset = 0,
    orderBy = FIELDS.INCOME_DATE,
    orderDirection = 'DESC'
  } = options;

  let whereClause = '';
  const params = [];

  if (categoryId !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.INCOME_CATEGORY_ID} = ?`;
    params.push(categoryId);
  }

  if (receiptNumber) {
    whereClause += ` AND ${TABLE}.${FIELDS.RECEIPT_NUMBER} LIKE ?`;
    params.push(`%${receiptNumber}%`);
  }

  if (payerName) {
    whereClause += ` AND ${TABLE}.${FIELDS.PAYER_NAME} LIKE ?`;
    params.push(`%${payerName}%`);
  }

  if (startDate) {
    whereClause += ` AND ${TABLE}.${FIELDS.INCOME_DATE} >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ` AND ${TABLE}.${FIELDS.INCOME_DATE} <= ?`;
    params.push(endDate);
  }

  if (isVerified !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.IS_VERIFIED} = ?`;
    params.push(isVerified ? 1 : 0);
  }

  // Validate orderBy to prevent SQL injection
  const validOrderFields = [
    FIELDS.ID,
    FIELDS.RECEIPT_NUMBER,
    FIELDS.AMOUNT,
    FIELDS.INCOME_DATE,
    FIELDS.PAYER_NAME,
    FIELDS.CREATED_AT
  ];
  const orderField = validOrderFields.includes(orderBy) ? orderBy : FIELDS.INCOME_DATE;
  const validDirection = orderDirection === 'ASC' ? 'ASC' : 'DESC';

  const query = `
    SELECT ${TABLE}.*, 
           ${INCOME_CATEGORIES_TABLE}.name as category_name,
           ${PAYMENT_METHODS_TABLE}.name as payment_method_name
    FROM ${TABLE}
    LEFT JOIN ${INCOME_CATEGORIES_TABLE} ON ${TABLE}.${FIELDS.INCOME_CATEGORY_ID} = ${INCOME_CATEGORIES_TABLE}.id
    LEFT JOIN ${PAYMENT_METHODS_TABLE} ON ${TABLE}.${FIELDS.PAYMENT_METHOD_ID} = ${PAYMENT_METHODS_TABLE}.id
    WHERE 1=1 ${whereClause}
    ORDER BY ${TABLE}.${orderField} ${validDirection}
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);

  try {
    const rows = await db.all(query, params);
    return rows.map(row => ({
      ...row,
      is_verified: Boolean(row.is_verified),
      amount: getAmount(row, FIELDS.AMOUNT)
    }));
  } catch (error) {
    console.error('Error in getAll income:', error.message);
    throw error;
  }
}

/**
 * Get income record by ID
 * @param {number} id - Income record ID
 * @returns {Promise<Object|null>} - Income record or null
 */
export async function getById(id) {
  const query = `
    SELECT ${TABLE}.*, 
           ${INCOME_CATEGORIES_TABLE}.name as category_name,
           ${PAYMENT_METHODS_TABLE}.name as payment_method_name
    FROM ${TABLE}
    LEFT JOIN ${INCOME_CATEGORIES_TABLE} ON ${TABLE}.${FIELDS.INCOME_CATEGORY_ID} = ${INCOME_CATEGORIES_TABLE}.id
    LEFT JOIN ${PAYMENT_METHODS_TABLE} ON ${TABLE}.${FIELDS.PAYMENT_METHOD_ID} = ${PAYMENT_METHODS_TABLE}.id
    WHERE ${TABLE}.${FIELDS.ID} = ?
  `;

  try {
    const row = await db.get(query, [id]);
    if (row) {
      return {
        ...row,
        is_verified: Boolean(row.is_verified),
        amount: getAmount(row, FIELDS.AMOUNT)
      };
    }
    return null;
  } catch (error) {
    console.error('Error in getById income:', error.message);
    throw error;
  }
}

/**
 * Get income record by receipt number
 * @param {string} receiptNumber - Receipt number
 * @returns {Promise<Object|null>} - Income record or null
 */
export async function getByReceiptNumber(receiptNumber) {
  const query = `
    SELECT ${TABLE}.*, 
           ${INCOME_CATEGORIES_TABLE}.name as category_name,
           ${PAYMENT_METHODS_TABLE}.name as payment_method_name
    FROM ${TABLE}
    LEFT JOIN ${INCOME_CATEGORIES_TABLE} ON ${TABLE}.${FIELDS.INCOME_CATEGORY_ID} = ${INCOME_CATEGORIES_TABLE}.id
    LEFT JOIN ${PAYMENT_METHODS_TABLE} ON ${TABLE}.${FIELDS.PAYMENT_METHOD_ID} = ${PAYMENT_METHODS_TABLE}.id
    WHERE ${TABLE}.${FIELDS.RECEIPT_NUMBER} = ?
  `;

  try {
    const row = await db.get(query, [receiptNumber]);
    if (row) {
      return {
        ...row,
        is_verified: Boolean(row.is_verified),
        amount: getAmount(row, FIELDS.AMOUNT)
      };
    }
    return null;
  } catch (error) {
    console.error('Error in getByReceiptNumber income:', error.message);
    throw error;
  }
}

/**
 * Get income records by category
 * @param {number} categoryId - Income category ID
 * @param {Object} options - Additional filter options
 * @returns {Promise<Array>} - Array of income records
 */
export async function getByCategory(categoryId, options = {}) {
  const { limit = 100, offset = 0 } = options;
  
  const query = `
    SELECT ${TABLE}.*, 
           ${INCOME_CATEGORIES_TABLE}.name as category_name,
           ${PAYMENT_METHODS_TABLE}.name as payment_method_name
    FROM ${TABLE}
    LEFT JOIN ${INCOME_CATEGORIES_TABLE} ON ${TABLE}.${FIELDS.INCOME_CATEGORY_ID} = ${INCOME_CATEGORIES_TABLE}.id
    LEFT JOIN ${PAYMENT_METHODS_TABLE} ON ${TABLE}.${FIELDS.PAYMENT_METHOD_ID} = ${PAYMENT_METHODS_TABLE}.id
    WHERE ${TABLE}.${FIELDS.INCOME_CATEGORY_ID} = ?
    ORDER BY ${TABLE}.${FIELDS.INCOME_DATE} DESC
    LIMIT ? OFFSET ?
  `;

  try {
    const rows = await db.all(query, [categoryId, limit, offset]);
    return rows.map(row => ({
      ...row,
      is_verified: Boolean(row.is_verified),
      amount: getAmount(row, FIELDS.AMOUNT)
    }));
  } catch (error) {
    console.error('Error in getByCategory income:', error.message);
    throw error;
  }
}

/**
 * Get income records by date range
 * @param {string} startDate - Start date (inclusive)
 * @param {string} endDate - End date (inclusive)
 * @returns {Promise<Array>} - Array of income records
 */
export async function getByDateRange(startDate, endDate) {
  const query = `
    SELECT ${TABLE}.*, 
           ${INCOME_CATEGORIES_TABLE}.name as category_name,
           ${PAYMENT_METHODS_TABLE}.name as payment_method_name
    FROM ${TABLE}
    LEFT JOIN ${INCOME_CATEGORIES_TABLE} ON ${TABLE}.${FIELDS.INCOME_CATEGORY_ID} = ${INCOME_CATEGORIES_TABLE}.id
    LEFT JOIN ${PAYMENT_METHODS_TABLE} ON ${TABLE}.${FIELDS.PAYMENT_METHOD_ID} = ${PAYMENT_METHODS_TABLE}.id
    WHERE ${TABLE}.${FIELDS.INCOME_DATE} BETWEEN ? AND ?
    ORDER BY ${TABLE}.${FIELDS.INCOME_DATE} DESC
  `;

  try {
    const rows = await db.all(query, [startDate, endDate]);
    return rows.map(row => ({
      ...row,
      is_verified: Boolean(row.is_verified),
      amount: getAmount(row, FIELDS.AMOUNT)
    }));
  } catch (error) {
    console.error('Error in getByDateRange income:', error.message);
    throw error;
  }
}

/**
 * Create a new income record
 * @param {Object} data - Income data
 * @returns {Promise<Object>} - Created income record
 */
export async function create(data) {
  const {
    receiptNumber,
    amount,
    incomeCategoryId,
    description,
    payerName,
    payerContact,
    paymentMethodId,
    transactionId,
    incomeDate,
    notes,
    isVerified = false,
    createdBy,
    updatedBy
  } = data;

  // Convert amount to cents for storage
  const amountCents = toCents(amount);

  const query = `
    INSERT INTO ${TABLE} (
      ${FIELDS.RECEIPT_NUMBER},
      ${FIELDS.AMOUNT},
      ${FIELDS.INCOME_CATEGORY_ID},
      ${FIELDS.DESCRIPTION},
      ${FIELDS.PAYER_NAME},
      ${FIELDS.PAYER_CONTACT},
      ${FIELDS.PAYMENT_METHOD_ID},
      ${FIELDS.TRANSACTION_ID},
      ${FIELDS.INCOME_DATE},
      ${FIELDS.NOTES},
      ${FIELDS.IS_VERIFIED},
      ${FIELDS.CREATED_BY},
      ${FIELDS.UPDATED_BY}
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    receiptNumber,
    amountCents,
    incomeCategoryId,
    description,
    payerName,
    payerContact,
    paymentMethodId,
    transactionId,
    incomeDate,
    notes,
    isVerified ? 1 : 0,
    createdBy,
    updatedBy
  ];

  try {
    const result = await db.run(query, params);
    return await getById(result.lastInsertRowid);
  } catch (error) {
    console.error('Error in create income:', error.message);
    throw error;
  }
}

/**
 * Update an income record
 * @param {number} id - Income record ID
 * @param {Object} data - Updated income data
 * @returns {Promise<Object>} - Updated income record
 */
export async function update(id, data) {
  const {
    receiptNumber,
    amount,
    incomeCategoryId,
    description,
    payerName,
    payerContact,
    paymentMethodId,
    transactionId,
    incomeDate,
    notes,
    isVerified,
    updatedBy
  } = data;

  const updates = [];
  const params = [];

  if (receiptNumber !== undefined) {
    updates.push(`${FIELDS.RECEIPT_NUMBER} = ?`);
    params.push(receiptNumber);
  }
  if (amount !== undefined) {
    updates.push(`${FIELDS.AMOUNT} = ?`);
    updates.push(`${FIELDS.AMOUNT} = ?`);
    params.push(amount);
    params.push(toCents(amount));
  }
  if (incomeCategoryId !== undefined) {
    updates.push(`${FIELDS.INCOME_CATEGORY_ID} = ?`);
    params.push(incomeCategoryId);
  }
  if (description !== undefined) {
    updates.push(`${FIELDS.DESCRIPTION} = ?`);
    params.push(description);
  }
  if (payerName !== undefined) {
    updates.push(`${FIELDS.PAYER_NAME} = ?`);
    params.push(payerName);
  }
  if (payerContact !== undefined) {
    updates.push(`${FIELDS.PAYER_CONTACT} = ?`);
    params.push(payerContact);
  }
  if (paymentMethodId !== undefined) {
    updates.push(`${FIELDS.PAYMENT_METHOD_ID} = ?`);
    params.push(paymentMethodId);
  }
  if (transactionId !== undefined) {
    updates.push(`${FIELDS.TRANSACTION_ID} = ?`);
    params.push(transactionId);
  }
  if (incomeDate !== undefined) {
    updates.push(`${FIELDS.INCOME_DATE} = ?`);
    params.push(incomeDate);
  }
  if (notes !== undefined) {
    updates.push(`${FIELDS.NOTES} = ?`);
    params.push(notes);
  }
  if (isVerified !== undefined) {
    updates.push(`${FIELDS.IS_VERIFIED} = ?`);
    params.push(isVerified ? 1 : 0);
  }
  if (updatedBy !== undefined) {
    updates.push(`${FIELDS.UPDATED_BY} = ?`);
    params.push(updatedBy);
  }

  if (updates.length === 0) {
    return await getById(id);
  }

  updates.push(`${FIELDS.UPDATED_AT} = CURRENT_TIMESTAMP`);
  params.push(id);

  const query = `
    UPDATE ${TABLE} 
    SET ${updates.join(', ')}
    WHERE ${FIELDS.ID} = ?
  `;

  try {
    await db.run(query, params);
    return await getById(id);
  } catch (error) {
    console.error('Error in update income:', error.message);
    throw error;
  }
}

/**
 * Delete an income record
 * @param {number} id - Income record ID
 * @returns {Promise<Object>} - Deleted income record
 */
export async function deleteById(id) {
  const query = `DELETE FROM ${TABLE} WHERE ${FIELDS.ID} = ?`;

  try {
    const row = await getById(id);
    if (!row) {
      return null;
    }
    await db.run(query, [id]);
    return row;
  } catch (error) {
    console.error('Error in deleteById income:', error.message);
    throw error;
  }
}

/**
 * Get total count of income records
 * @param {Object} options - Filter options (same as getAll)
 * @returns {Promise<number>} - Total count
 */
export async function count(options = {}) {
  const {
    categoryId,
    receiptNumber,
    payerName,
    startDate,
    endDate,
    isVerified
  } = options;

  let whereClause = '';
  const params = [];

  if (categoryId !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.INCOME_CATEGORY_ID} = ?`;
    params.push(categoryId);
  }

  if (receiptNumber) {
    whereClause += ` AND ${TABLE}.${FIELDS.RECEIPT_NUMBER} LIKE ?`;
    params.push(`%${receiptNumber}%`);
  }

  if (payerName) {
    whereClause += ` AND ${TABLE}.${FIELDS.PAYER_NAME} LIKE ?`;
    params.push(`%${payerName}%`);
  }

  if (startDate) {
    whereClause += ` AND ${TABLE}.${FIELDS.INCOME_DATE} >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ` AND ${TABLE}.${FIELDS.INCOME_DATE} <= ?`;
    params.push(endDate);
  }

  if (isVerified !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.IS_VERIFIED} = ?`;
    params.push(isVerified ? 1 : 0);
  }

  const query = `SELECT COUNT(*) as count FROM ${TABLE} WHERE 1=1 ${whereClause}`;

  try {
    const result = await db.get(query, params);
    return result.count;
  } catch (error) {
    console.error('Error in count income:', error.message);
    throw error;
  }
}

/**
 * Get income statistics (total, count by category, etc.)
 * @returns {Promise<Object>} - Statistics object
 */
export async function getStatistics() {
  try {
    // Total income - use COALESCE to prefer cents column, fall back to decimal
    const totalQuery = `SELECT COALESCE(SUM(${FIELDS.AMOUNT}), SUM(${FIELDS.AMOUNT} * 100)) as totalAmountCents, COUNT(*) as totalCount FROM ${TABLE}`;
    const totalResult = await db.get(totalQuery);

    // Income by category
    const byCategoryQuery = `
      SELECT 
        ${INCOME_CATEGORIES_TABLE}.id,
        ${INCOME_CATEGORIES_TABLE}.name as category_name,
        COALESCE(SUM(${TABLE}.${FIELDS.AMOUNT}), SUM(${TABLE}.${FIELDS.AMOUNT} * 100)) as 
        COUNT(${TABLE}.${FIELDS.ID}) as count
      FROM ${INCOME_CATEGORIES_TABLE}
      LEFT JOIN ${TABLE} ON ${TABLE}.${FIELDS.INCOME_CATEGORY_ID} = ${INCOME_CATEGORIES_TABLE}.id
      GROUP BY ${INCOME_CATEGORIES_TABLE}.id, ${INCOME_CATEGORIES_TABLE}.name
    `;
    const byCategoryResult = await db.all(byCategoryQuery);

    // Monthly income for current year
    const currentYear = new Date().getFullYear();
    const monthlyQuery = `
      SELECT 
        strftime('%Y-%m', ${FIELDS.INCOME_DATE}) as month,
        COALESCE(SUM(${FIELDS.AMOUNT}), SUM(${FIELDS.AMOUNT} * 100)) as 
        COUNT(*) as count
      FROM ${TABLE}
      WHERE strftime('%Y', ${FIELDS.INCOME_DATE}) = ?
      GROUP BY strftime('%Y-%m', ${FIELDS.INCOME_DATE})
      ORDER BY month
    `;
    const monthlyResult = await db.all(monthlyQuery, [currentYear.toString()]);

    return {
      total: {
        amount: parseFloat(fromCents(totalResult.totalAmountCents || 0)),
        count: totalResult.totalCount
      },
      byCategory: byCategoryResult.map(row => ({
        categoryId: row.id,
        categoryName: row.category_name,
        amount: parseFloat(fromCents(row.amount || 0)),
        count: row.count
      })),
      monthly: monthlyResult.map(row => ({
        month: row.month,
        amount: parseFloat(fromCents(row.amount || 0)),
        count: row.count
      }))
    };
  } catch (error) {
    console.error('Error in getStatistics income:', error.message);
    throw error;
  }
}

/**
 * Search income records by receipt number, payer name, or description
 * @param {string} searchTerm - Search term
 * @param {Object} options - Additional filter options
 * @returns {Promise<Array>} - Array of matching income records
 */
export async function search(searchTerm, options = {}) {
  const { limit = 100, offset = 0 } = options;

  const query = `
    SELECT ${TABLE}.*, 
           ${INCOME_CATEGORIES_TABLE}.name as category_name,
           ${PAYMENT_METHODS_TABLE}.name as payment_method_name
    FROM ${TABLE}
    LEFT JOIN ${INCOME_CATEGORIES_TABLE} ON ${TABLE}.${FIELDS.INCOME_CATEGORY_ID} = ${INCOME_CATEGORIES_TABLE}.id
    LEFT JOIN ${PAYMENT_METHODS_TABLE} ON ${TABLE}.${FIELDS.PAYMENT_METHOD_ID} = ${PAYMENT_METHODS_TABLE}.id
    WHERE ${TABLE}.${FIELDS.RECEIPT_NUMBER} LIKE ?
       OR ${TABLE}.${FIELDS.PAYER_NAME} LIKE ?
       OR ${TABLE}.${FIELDS.DESCRIPTION} LIKE ?
       OR ${INCOME_CATEGORIES_TABLE}.name LIKE ?
    ORDER BY ${TABLE}.${FIELDS.INCOME_DATE} DESC
    LIMIT ? OFFSET ?
  `;

  const searchPattern = `%${searchTerm}%`;

  try {
    const rows = await db.all(query, [
      searchPattern, searchPattern, searchPattern, searchPattern, limit, offset
    ]);
    return rows.map(row => ({
      ...row,
      is_verified: Boolean(row.is_verified),
      amount: getAmount(row, FIELDS.AMOUNT)
    }));
  } catch (error) {
    console.error('Error in search income:', error.message);
    throw error;
  }
}

// Export all functions as the default export
export default {
  getAll,
  getById,
  getByReceiptNumber,
  getByCategory,
  getByDateRange,
  create,
  update,
  deleteById,
  count,
  getStatistics,
  search,
  TABLE,
  FIELDS
};

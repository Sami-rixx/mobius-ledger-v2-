import db from '../config/database.js';
import { toCents, fromCents, getAmount } from '../utils/money.js';

/**
 * Expense Model
 * Data access layer for expenses table
 * 
 * Represents expense records with:
 * - Amount and date
 * - Category reference (hierarchical)
 * - Vendor/supplier information
 * - Payment method
 * - Receipt/reference number
 * - Audit fields (created_by, updated_by, timestamps)
 */

// Table name
const TABLE = 'expenses';

// Related tables
const EXPENSE_CATEGORIES_TABLE = 'expense_categories';
const PAYMENT_METHODS_TABLE = 'payment_methods';
const TRANSACTIONS_TABLE = 'transactions';
const USERS_TABLE = 'users';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  AMOUNT: 'amount',
  EXPENSE_CATEGORY_ID: 'expense_category_id',
  DESCRIPTION: 'description',
  VENDOR_NAME: 'vendor_name',
  VENDOR_CONTACT: 'vendor_contact',
  PAYMENT_METHOD_ID: 'payment_method_id',
  TRANSACTION_ID: 'transaction_id',
  EXPENSE_DATE: 'expense_date',
  RECEIPT_NUMBER: 'receipt_number',
  NOTES: 'notes',
  IS_VERIFIED: 'is_verified',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by'
};

/**
 * Get all expense records with optional filtering
 * @param {Object} options - Filter options
 * @param {number} options.categoryId - Filter by expense category ID
 * @param {string} options.receiptNumber - Filter by receipt number
 * @param {string} options.vendorName - Filter by vendor name
 * @param {string} options.startDate - Filter by start date (inclusive)
 * @param {string} options.endDate - Filter by end date (inclusive)
 * @param {boolean} options.isVerified - Filter by verification status
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDirection - ASC or DESC
 * @returns {Promise<Array>} - Array of expense records
 */
export async function getAll(options = {}) {
  const {
    categoryId,
    receiptNumber,
    vendorName,
    startDate,
    endDate,
    isVerified,
    limit = 100,
    offset = 0,
    orderBy = FIELDS.EXPENSE_DATE,
    orderDirection = 'DESC'
  } = options;

  let whereClause = '';
  const params = [];

  if (categoryId !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.EXPENSE_CATEGORY_ID} = ?`;
    params.push(categoryId);
  }

  if (receiptNumber) {
    whereClause += ` AND ${TABLE}.${FIELDS.RECEIPT_NUMBER} LIKE ?`;
    params.push(`%${receiptNumber}%`);
  }

  if (vendorName) {
    whereClause += ` AND ${TABLE}.${FIELDS.VENDOR_NAME} LIKE ?`;
    params.push(`%${vendorName}%`);
  }

  if (startDate) {
    whereClause += ` AND ${TABLE}.${FIELDS.EXPENSE_DATE} >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ` AND ${TABLE}.${FIELDS.EXPENSE_DATE} <= ?`;
    params.push(endDate);
  }

  if (isVerified !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.IS_VERIFIED} = ?`;
    params.push(isVerified ? 1 : 0);
  }

  // Validate orderBy to prevent SQL injection
  const validOrderFields = [
    FIELDS.ID,
    FIELDS.AMOUNT,
    FIELDS.EXPENSE_CATEGORY_ID,
    FIELDS.EXPENSE_DATE,
    FIELDS.VENDOR_NAME,
    FIELDS.RECEIPT_NUMBER,
    FIELDS.CREATED_AT
  ];
  const orderField = validOrderFields.includes(orderBy) ? orderBy : FIELDS.EXPENSE_DATE;
  const validDirection = orderDirection === 'ASC' ? 'ASC' : 'DESC';

  const query = `
    SELECT ${TABLE}.*, 
           ${EXPENSE_CATEGORIES_TABLE}.name as category_name,
           ${EXPENSE_CATEGORIES_TABLE}.parent_id as category_parent_id,
           ${PAYMENT_METHODS_TABLE}.name as payment_method_name
    FROM ${TABLE}
    LEFT JOIN ${EXPENSE_CATEGORIES_TABLE} ON ${TABLE}.${FIELDS.EXPENSE_CATEGORY_ID} = ${EXPENSE_CATEGORIES_TABLE}.id
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
    console.error('Error in getAll expenses:', error.message);
    throw error;
  }
}

/**
 * Get expense record by ID
 * @param {number} id - Expense record ID
 * @returns {Promise<Object|null>} - Expense record or null
 */
export async function getById(id) {
  const query = `
    SELECT ${TABLE}.*, 
           ${EXPENSE_CATEGORIES_TABLE}.name as category_name,
           ${EXPENSE_CATEGORIES_TABLE}.parent_id as category_parent_id,
           ${EXPENSE_CATEGORIES_TABLE}.description as category_description,
           ${PAYMENT_METHODS_TABLE}.name as payment_method_name
    FROM ${TABLE}
    LEFT JOIN ${EXPENSE_CATEGORIES_TABLE} ON ${TABLE}.${FIELDS.EXPENSE_CATEGORY_ID} = ${EXPENSE_CATEGORIES_TABLE}.id
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
    console.error('Error in getById expense:', error.message);
    throw error;
  }
}

/**
 * Get expense record by receipt number
 * @param {string} receiptNumber - Receipt number
 * @returns {Promise<Object|null>} - Expense record or null
 */
export async function getByReceiptNumber(receiptNumber) {
  const query = `
    SELECT ${TABLE}.*, 
           ${EXPENSE_CATEGORIES_TABLE}.name as category_name,
           ${PAYMENT_METHODS_TABLE}.name as payment_method_name
    FROM ${TABLE}
    LEFT JOIN ${EXPENSE_CATEGORIES_TABLE} ON ${TABLE}.${FIELDS.EXPENSE_CATEGORY_ID} = ${EXPENSE_CATEGORIES_TABLE}.id
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
    console.error('Error in getByReceiptNumber expense:', error.message);
    throw error;
  }
}

/**
 * Get expense records by category
 * @param {number} categoryId - Expense category ID
 * @param {Object} options - Additional filter options
 * @returns {Promise<Array>} - Array of expense records
 */
export async function getByCategory(categoryId, options = {}) {
  const { limit = 100, offset = 0 } = options;
  
  const query = `
    SELECT ${TABLE}.*, 
           ${EXPENSE_CATEGORIES_TABLE}.name as category_name,
           ${PAYMENT_METHODS_TABLE}.name as payment_method_name
    FROM ${TABLE}
    LEFT JOIN ${EXPENSE_CATEGORIES_TABLE} ON ${TABLE}.${FIELDS.EXPENSE_CATEGORY_ID} = ${EXPENSE_CATEGORIES_TABLE}.id
    LEFT JOIN ${PAYMENT_METHODS_TABLE} ON ${TABLE}.${FIELDS.PAYMENT_METHOD_ID} = ${PAYMENT_METHODS_TABLE}.id
    WHERE ${TABLE}.${FIELDS.EXPENSE_CATEGORY_ID} = ?
    ORDER BY ${TABLE}.${FIELDS.EXPENSE_DATE} DESC
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
    console.error('Error in getByCategory expense:', error.message);
    throw error;
  }
}

/**
 * Get expense records by date range
 * @param {string} startDate - Start date (inclusive)
 * @param {string} endDate - End date (inclusive)
 * @returns {Promise<Array>} - Array of expense records
 */
export async function getByDateRange(startDate, endDate) {
  const query = `
    SELECT ${TABLE}.*, 
           ${EXPENSE_CATEGORIES_TABLE}.name as category_name,
           ${PAYMENT_METHODS_TABLE}.name as payment_method_name
    FROM ${TABLE}
    LEFT JOIN ${EXPENSE_CATEGORIES_TABLE} ON ${TABLE}.${FIELDS.EXPENSE_CATEGORY_ID} = ${EXPENSE_CATEGORIES_TABLE}.id
    LEFT JOIN ${PAYMENT_METHODS_TABLE} ON ${TABLE}.${FIELDS.PAYMENT_METHOD_ID} = ${PAYMENT_METHODS_TABLE}.id
    WHERE ${TABLE}.${FIELDS.EXPENSE_DATE} BETWEEN ? AND ?
    ORDER BY ${TABLE}.${FIELDS.EXPENSE_DATE} DESC
  `;

  try {
    const rows = await db.all(query, [startDate, endDate]);
    return rows.map(row => ({
      ...row,
      is_verified: Boolean(row.is_verified),
      amount: getAmount(row, FIELDS.AMOUNT)
    }));
  } catch (error) {
    console.error('Error in getByDateRange expense:', error.message);
    throw error;
  }
}

/**
 * Create a new expense record
 * @param {Object} data - Expense data
 * @returns {Promise<Object>} - Created expense record
 */
export async function create(data) {
  const {
    amount,
    expenseCategoryId,
    description,
    vendorName,
    vendorContact,
    paymentMethodId,
    transactionId,
    expenseDate,
    receiptNumber,
    notes,
    isVerified = false,
    createdBy,
    updatedBy
  } = data;

  // Convert amount to cents for storage
  const amountCents = toCents(amount);

  const query = `
    INSERT INTO ${TABLE} (
      ${FIELDS.AMOUNT},
      ${FIELDS.EXPENSE_CATEGORY_ID},
      ${FIELDS.DESCRIPTION},
      ${FIELDS.VENDOR_NAME},
      ${FIELDS.VENDOR_CONTACT},
      ${FIELDS.PAYMENT_METHOD_ID},
      ${FIELDS.TRANSACTION_ID},
      ${FIELDS.EXPENSE_DATE},
      ${FIELDS.RECEIPT_NUMBER},
      ${FIELDS.NOTES},
      ${FIELDS.IS_VERIFIED},
      ${FIELDS.CREATED_BY},
      ${FIELDS.UPDATED_BY}
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    amountCents,
    expenseCategoryId,
    description,
    vendorName,
    vendorContact,
    paymentMethodId,
    transactionId,
    expenseDate,
    receiptNumber,
    notes,
    isVerified ? 1 : 0,
    createdBy,
    updatedBy
  ];

  try {
    const result = await db.run(query, params);
    return await getById(result.lastID);
  } catch (error) {
    console.error('Error in create expense:', error.message);
    throw error;
  }
}

/**
 * Update an expense record
 * @param {number} id - Expense record ID
 * @param {Object} data - Updated expense data
 * @returns {Promise<Object>} - Updated expense record
 */
export async function update(id, data) {
  const {
    amount,
    expenseCategoryId,
    description,
    vendorName,
    vendorContact,
    paymentMethodId,
    transactionId,
    expenseDate,
    receiptNumber,
    notes,
    isVerified,
    updatedBy
  } = data;

  const updates = [];
  const params = [];

  if (amount !== undefined) {
    updates.push(`${FIELDS.AMOUNT} = ?`);
    updates.push(`${FIELDS.AMOUNT} = ?`);
    params.push(amount);
    params.push(toCents(amount));
  }
  if (expenseCategoryId !== undefined) {
    updates.push(`${FIELDS.EXPENSE_CATEGORY_ID} = ?`);
    params.push(expenseCategoryId);
  }
  if (description !== undefined) {
    updates.push(`${FIELDS.DESCRIPTION} = ?`);
    params.push(description);
  }
  if (vendorName !== undefined) {
    updates.push(`${FIELDS.VENDOR_NAME} = ?`);
    params.push(vendorName);
  }
  if (vendorContact !== undefined) {
    updates.push(`${FIELDS.VENDOR_CONTACT} = ?`);
    params.push(vendorContact);
  }
  if (paymentMethodId !== undefined) {
    updates.push(`${FIELDS.PAYMENT_METHOD_ID} = ?`);
    params.push(paymentMethodId);
  }
  if (transactionId !== undefined) {
    updates.push(`${FIELDS.TRANSACTION_ID} = ?`);
    params.push(transactionId);
  }
  if (expenseDate !== undefined) {
    updates.push(`${FIELDS.EXPENSE_DATE} = ?`);
    params.push(expenseDate);
  }
  if (receiptNumber !== undefined) {
    updates.push(`${FIELDS.RECEIPT_NUMBER} = ?`);
    params.push(receiptNumber);
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
    console.error('Error in update expense:', error.message);
    throw error;
  }
}

/**
 * Delete an expense record
 * @param {number} id - Expense record ID
 * @returns {Promise<Object>} - Deleted expense record
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
    console.error('Error in deleteById expense:', error.message);
    throw error;
  }
}

/**
 * Get total count of expense records
 * @param {Object} options - Filter options (same as getAll)
 * @returns {Promise<number>} - Total count
 */
export async function count(options = {}) {
  const {
    categoryId,
    receiptNumber,
    vendorName,
    startDate,
    endDate,
    isVerified
  } = options;

  let whereClause = '';
  const params = [];

  if (categoryId !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.EXPENSE_CATEGORY_ID} = ?`;
    params.push(categoryId);
  }

  if (receiptNumber) {
    whereClause += ` AND ${TABLE}.${FIELDS.RECEIPT_NUMBER} LIKE ?`;
    params.push(`%${receiptNumber}%`);
  }

  if (vendorName) {
    whereClause += ` AND ${TABLE}.${FIELDS.VENDOR_NAME} LIKE ?`;
    params.push(`%${vendorName}%`);
  }

  if (startDate) {
    whereClause += ` AND ${TABLE}.${FIELDS.EXPENSE_DATE} >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ` AND ${TABLE}.${FIELDS.EXPENSE_DATE} <= ?`;
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
    console.error('Error in count expense:', error.message);
    throw error;
  }
}

/**
 * Get expense statistics (total, count by category, etc.)
 * @returns {Promise<Object>} - Statistics object
 */
export async function getStatistics() {
  try {
    // Total expenses - use COALESCE to prefer cents column, fall back to decimal
    const totalQuery = `SELECT COALESCE(SUM(${FIELDS.AMOUNT}), SUM(${FIELDS.AMOUNT} * 100)) as totalAmountCents, COUNT(*) as totalCount FROM ${TABLE}`;
    const totalResult = await db.get(totalQuery);

    // Expenses by category
    const byCategoryQuery = `
      SELECT 
        ${EXPENSE_CATEGORIES_TABLE}.id,
        ${EXPENSE_CATEGORIES_TABLE}.name as category_name,
        COALESCE(SUM(${TABLE}.${FIELDS.AMOUNT}), SUM(${TABLE}.${FIELDS.AMOUNT} * 100)) as 
        COUNT(${TABLE}.${FIELDS.ID}) as count
      FROM ${EXPENSE_CATEGORIES_TABLE}
      LEFT JOIN ${TABLE} ON ${TABLE}.${FIELDS.EXPENSE_CATEGORY_ID} = ${EXPENSE_CATEGORIES_TABLE}.id
      GROUP BY ${EXPENSE_CATEGORIES_TABLE}.id, ${EXPENSE_CATEGORIES_TABLE}.name
    `;
    const byCategoryResult = await db.all(byCategoryQuery);

    // Monthly expenses for current year
    const currentYear = new Date().getFullYear();
    const monthlyQuery = `
      SELECT 
        strftime('%Y-%m', ${FIELDS.EXPENSE_DATE}) as month,
        COALESCE(SUM(${FIELDS.AMOUNT}), SUM(${FIELDS.AMOUNT} * 100)) as 
        COUNT(*) as count
      FROM ${TABLE}
      WHERE strftime('%Y', ${FIELDS.EXPENSE_DATE}) = ?
      GROUP BY strftime('%Y-%m', ${FIELDS.EXPENSE_DATE})
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
    console.error('Error in getStatistics expense:', error.message);
    throw error;
  }
}

/**
 * Search expense records by receipt number, vendor name, or description
 * @param {string} searchTerm - Search term
 * @param {Object} options - Additional filter options
 * @returns {Promise<Array>} - Array of matching expense records
 */
export async function search(searchTerm, options = {}) {
  const { limit = 100, offset = 0 } = options;

  const query = `
    SELECT ${TABLE}.*, 
           ${EXPENSE_CATEGORIES_TABLE}.name as category_name,
           ${PAYMENT_METHODS_TABLE}.name as payment_method_name
    FROM ${TABLE}
    LEFT JOIN ${EXPENSE_CATEGORIES_TABLE} ON ${TABLE}.${FIELDS.EXPENSE_CATEGORY_ID} = ${EXPENSE_CATEGORIES_TABLE}.id
    LEFT JOIN ${PAYMENT_METHODS_TABLE} ON ${TABLE}.${FIELDS.PAYMENT_METHOD_ID} = ${PAYMENT_METHODS_TABLE}.id
    WHERE ${TABLE}.${FIELDS.RECEIPT_NUMBER} LIKE ?
       OR ${TABLE}.${FIELDS.VENDOR_NAME} LIKE ?
       OR ${TABLE}.${FIELDS.DESCRIPTION} LIKE ?
       OR ${EXPENSE_CATEGORIES_TABLE}.name LIKE ?
    ORDER BY ${TABLE}.${FIELDS.EXPENSE_DATE} DESC
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
    console.error('Error in search expense:', error.message);
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

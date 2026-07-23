import db from '../config/database.js';

/**
 * Transaction Model
 * Data access layer for transactions table
 * 
 * Represents financial transactions with:
 * - Receipt number
 * - Transaction type
 * - Amount
 * - Student reference (for student-related transactions)
 * - Payment method
 * - Date and time
 * - Audit fields
 */

// Table name
const TABLE = 'transactions';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  RECEIPT_NUMBER: 'receipt_number',
  TRANSACTION_TYPE: 'transaction_type',
  AMOUNT: 'amount',
  CATEGORY_ID: 'category_id',
  INCOME_CATEGORY_ID: 'income_category_id',
  EXPENSE_CATEGORY_ID: 'expense_category_id',
  STUDENT_ID: 'student_id',
  DESCRIPTION: 'description',
  PAYMENT_METHOD_ID: 'payment_method_id',
  TRANSACTION_DATE: 'transaction_date',
  TRANSACTION_TIME: 'transaction_time',
  REFERENCE: 'reference',
  NOTES: 'notes',
  IS_VERIFIED: 'is_verified',
  VERIFIED_BY: 'verified_by',
  VERIFIED_AT: 'verified_at',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by'
};

// Valid transaction types
const VALID_TYPES = ['income', 'expense', 'school_fee', 'lunch_fee', 'student_charge', 'director_withdrawal'];

/**
 * Get all transactions with optional filtering
 * @param {Object} options - Filter options
 * @param {string} options.receiptNumber - Filter by receipt number
 * @param {string} options.transactionType - Filter by transaction type
 * @param {number} options.studentId - Filter by student ID
 * @param {string} options.startDate - Filter by start date
 * @param {string} options.endDate - Filter by end date
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Array} - Array of transaction objects
 */
export const getAllTransactions = (options = {}) => {
  const {
    receiptNumber,
    transactionType,
    studentId,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
    orderBy = 'transaction_date',
    orderDir = 'DESC'
  } = options;

  let query = `SELECT * FROM ${TABLE}`;
  const params = [];
  const conditions = [];

  if (receiptNumber) {
    conditions.push(`receipt_number = ?`);
    params.push(receiptNumber);
  }

  if (transactionType) {
    conditions.push(`transaction_type = ?`);
    params.push(transactionType);
  }

  if (studentId) {
    conditions.push(`student_id = ?`);
    params.push(studentId);
  }

  if (startDate) {
    conditions.push(`transaction_date >= ?`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`transaction_date <= ?`);
    params.push(endDate);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

/**
 * Get transaction count
 * @param {Object} options - Filter options
 * @returns {number} - Count of transactions
 */
export const getTransactionCount = (options = {}) => {
  const { receiptNumber, transactionType, studentId, startDate, endDate } = options;
  
  let query = `SELECT COUNT(*) as count FROM ${TABLE}`;
  const params = [];
  const conditions = [];

  if (receiptNumber) {
    conditions.push(`receipt_number = ?`);
    params.push(receiptNumber);
  }

  if (transactionType) {
    conditions.push(`transaction_type = ?`);
    params.push(transactionType);
  }

  if (studentId) {
    conditions.push(`student_id = ?`);
    params.push(studentId);
  }

  if (startDate) {
    conditions.push(`transaction_date >= ?`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`transaction_date <= ?`);
    params.push(endDate);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const result = db.prepare(query).get(...params);
  return result?.count || 0;
};

/**
 * Get a single transaction by ID
 * @param {number} id - Transaction ID
 * @returns {Object|null} - Transaction object or null
 */
export const getTransactionById = (id) => {
  const stmt = db.prepare(`SELECT * FROM ${TABLE} WHERE id = ?`);
  return stmt.get(id) || null;
};

/**
 * Get a transaction by receipt number
 * @param {string} receiptNumber - Receipt number
 * @returns {Object|null} - Transaction object or null
 */
export const getTransactionByReceiptNumber = (receiptNumber) => {
  const stmt = db.prepare(`SELECT * FROM ${TABLE} WHERE receipt_number = ?`);
  return stmt.get(receiptNumber) || null;
};

/**
 * Create a new transaction
 * @param {Object} data - Transaction data
 * @returns {Object} - Created transaction
 */
export const createTransaction = (data) => {
  const {
    receiptNumber,
    transactionType,
    amount,
    categoryId,
    incomeCategoryId,
    expenseCategoryId,
    studentId,
    description,
    paymentMethodId,
    transactionDate,
    transactionTime,
    reference,
    notes,
    isVerified,
    verifiedBy,
    verifiedAt,
    createdBy,
    updatedBy
  } = data;

  const stmt = db.prepare(`
    INSERT INTO ${TABLE} 
    (receipt_number, transaction_type, amount, category_id, income_category_id, 
     expense_category_id, student_id, description, payment_method_id, 
     transaction_date, transaction_time, reference, notes, is_verified, 
     verified_by, verified_at, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    receiptNumber,
    transactionType,
    amount,
    categoryId,
    incomeCategoryId,
    expenseCategoryId,
    studentId,
    description,
    paymentMethodId,
    transactionDate,
    transactionTime,
    reference,
    notes,
    isVerified || 0,
    verifiedBy,
    verifiedAt,
    createdBy,
    updatedBy
  );

  return getTransactionById(result.lastInsertRowid);
};

/**
 * Update a transaction
 * @param {number} id - Transaction ID
 * @param {Object} data - Updated data
 * @returns {Object|null} - Updated transaction
 */
export const updateTransaction = (id, data) => {
  const existing = getTransactionById(id);
  if (!existing) {
    return null;
  }

  const {
    receiptNumber,
    transactionType,
    amount,
    categoryId,
    incomeCategoryId,
    expenseCategoryId,
    studentId,
    description,
    paymentMethodId,
    transactionDate,
    transactionTime,
    reference,
    notes,
    isVerified,
    verifiedBy,
    verifiedAt,
    updatedBy
  } = data;

  const stmt = db.prepare(`
    UPDATE ${TABLE} 
    SET receipt_number = ?, transaction_type = ?, amount = ?, category_id = ?, 
        income_category_id = ?, expense_category_id = ?, student_id = ?, 
        description = ?, payment_method_id = ?, transaction_date = ?, 
        transaction_time = ?, reference = ?, notes = ?, is_verified = ?, 
        verified_by = ?, verified_at = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    receiptNumber || existing.receipt_number,
    transactionType || existing.transaction_type,
    amount || existing.amount,
    categoryId || existing.category_id,
    incomeCategoryId || existing.income_category_id,
    expenseCategoryId || existing.expense_category_id,
    studentId || existing.student_id,
    description || existing.description,
    paymentMethodId || existing.payment_method_id,
    transactionDate || existing.transaction_date,
    transactionTime || existing.transaction_time,
    reference || existing.reference,
    notes || existing.notes,
    isVerified !== undefined ? isVerified : existing.is_verified,
    verifiedBy || existing.verified_by,
    verifiedAt || existing.verified_at,
    updatedBy,
    id
  );

  return getTransactionById(id);
};

/**
 * Delete a transaction
 * @param {number} id - Transaction ID
 * @returns {boolean} - True if deleted
 */
export const deleteTransaction = (id) => {
  const existing = getTransactionById(id);
  if (!existing) {
    return false;
  }

  const stmt = db.prepare(`DELETE FROM ${TABLE} WHERE id = ?`);
  stmt.run(id);
  return true;
};

/**
 * Get transactions by student
 * @param {number} studentId - Student ID
 * @returns {Array} - Array of transactions for the student
 */
export const getTransactionsByStudent = (studentId) => {
  const stmt = db.prepare(`
    SELECT * FROM ${TABLE} 
    WHERE student_id = ? 
    ORDER BY transaction_date DESC, transaction_time DESC
  `);
  return stmt.all(studentId);
};

/**
 * Get transactions by date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Array} - Array of transactions in date range
 */
export const getTransactionsByDateRange = (startDate, endDate) => {
  const stmt = db.prepare(`
    SELECT * FROM ${TABLE} 
    WHERE transaction_date BETWEEN ? AND ? 
    ORDER BY transaction_date, transaction_time
  `);
  return stmt.all(startDate, endDate);
};

export default {
  getAllTransactions,
  getTransactionCount,
  getTransactionById,
  getTransactionByReceiptNumber,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByStudent,
  getTransactionsByDateRange
};

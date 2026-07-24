import db from '../config/database.js';

/**
 * Lunch Payment Model
 * Data access layer for lunch_payments table
 * 
 * Represents lunch fee payments with:
 * - Student reference
 * - Transaction reference (for receipt tracking)
 * - Amount and payment date
 * - Payment type (daily, weekly, monthly)
 * - Date range (start_date, end_date)
 * - Audit fields (created_by, updated_by, timestamps)
 */

// Table name
const TABLE = 'lunch_payments';

// Related tables
const TRANSACTIONS_TABLE = 'transactions';
const STUDENTS_TABLE = 'students';
const PAYMENT_METHODS_TABLE = 'payment_methods';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  STUDENT_ID: 'student_id',
  TRANSACTION_ID: 'transaction_id',
  AMOUNT: 'amount',
  PAYMENT_DATE: 'payment_date',
  PAYMENT_TYPE: 'payment_type',
  START_DATE: 'start_date',
  END_DATE: 'end_date',
  NOTES: 'notes',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by'
};

// Valid payment type values
const VALID_PAYMENT_TYPES = ['daily', 'weekly', 'monthly'];

/**
 * Get all lunch payments with optional filtering
 * @param {Object} options - Filter options
 * @param {number} options.studentId - Filter by student ID
 * @param {string} options.paymentType - Filter by payment type (daily, weekly, monthly)
 * @param {string} options.startDate - Filter by start date (>=)
 * @param {string} options.endDate - Filter by end date (<=)
 * @param {string} options.search - Search term for student name or admission number
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Array} - Array of lunch payment objects with student and transaction details
 */
export const getAllLunchPayments = (options = {}) => {
  const {
    studentId,
    paymentType,
    startDate,
    endDate,
    search,
    limit = 100,
    offset = 0,
    orderBy = 'lp.payment_date',
    orderDir = 'DESC'
  } = options;

  let query = `
    SELECT 
      lp.*,
      s.admission_number,
      s.first_name,
      s.last_name,
      s.class_id,
      c.name as class_name,
      t.receipt_number,
      t.amount as transaction_amount,
      t.payment_method_id,
      pm.name as payment_method,
      t.transaction_date,
      t.notes as transaction_notes
    FROM ${TABLE} lp
    LEFT JOIN ${STUDENTS_TABLE} s ON lp.student_id = s.id
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN ${TRANSACTIONS_TABLE} t ON lp.transaction_id = t.id
    LEFT JOIN ${PAYMENT_METHODS_TABLE} pm ON t.payment_method_id = pm.id
  `;
  
  const params = [];
  const conditions = [];

  if (studentId) {
    conditions.push(`lp.student_id = ?`);
    params.push(studentId);
  }

  if (paymentType) {
    conditions.push(`lp.payment_type = ?`);
    params.push(paymentType);
  }

  if (startDate) {
    conditions.push(`lp.start_date >= ?`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`lp.end_date <= ?`);
    params.push(endDate);
  }

  if (search) {
    conditions.push(`(s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)`);
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  // Add ordering and pagination
  query += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

/**
 * Get total count of lunch payments matching filter criteria
 * @param {Object} options - Filter options (same as getAllLunchPayments)
 * @returns {number} - Total count
 */
export const getLunchPaymentCount = (options = {}) => {
  const { studentId, paymentType, startDate, endDate, search } = options;
  
  let query = `SELECT COUNT(*) as count FROM ${TABLE} lp LEFT JOIN ${STUDENTS_TABLE} s ON lp.student_id = s.id`;
  const params = [];

  const conditions = [];
  
  if (studentId) {
    conditions.push(`lp.student_id = ?`);
    params.push(studentId);
  }

  if (paymentType) {
    conditions.push(`lp.payment_type = ?`);
    params.push(paymentType);
  }

  if (startDate) {
    conditions.push(`lp.start_date >= ?`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`lp.end_date <= ?`);
    params.push(endDate);
  }

  if (search) {
    conditions.push(`(s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)`);
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const result = db.prepare(query).get(...params);
  return result?.count || 0;
};

/**
 * Get a single lunch payment by ID
 * @param {number} id - Lunch payment ID
 * @returns {Object|null} - Lunch payment object or null if not found
 */
export const getLunchPaymentById = (id) => {
  const query = `
    SELECT 
      lp.*,
      s.admission_number,
      s.first_name,
      s.last_name,
      s.class_id,
      c.name as class_name,
      t.receipt_number,
      t.amount as transaction_amount,
      t.payment_method_id,
      pm.name as payment_method
    FROM ${TABLE} lp
    LEFT JOIN ${STUDENTS_TABLE} s ON lp.student_id = s.id
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN ${TRANSACTIONS_TABLE} t ON lp.transaction_id = t.id
    LEFT JOIN ${PAYMENT_METHODS_TABLE} pm ON t.payment_method_id = pm.id
    WHERE lp.id = ?
  `;
  return db.prepare(query).get(id) || null;
};

/**
 * Get lunch payments by student ID
 * @param {number} studentId - Student ID
 * @returns {Array} - Array of lunch payment objects for the student
 */
export const getLunchPaymentsByStudentId = (studentId) => {
  const query = `
    SELECT 
      lp.*,
      t.receipt_number,
      t.amount as transaction_amount,
      t.payment_method_id,
      pm.name as payment_method
    FROM ${TABLE} lp
    LEFT JOIN ${TRANSACTIONS_TABLE} t ON lp.transaction_id = t.id
    LEFT JOIN ${PAYMENT_METHODS_TABLE} pm ON t.payment_method_id = pm.id
    WHERE lp.student_id = ?
    ORDER BY lp.payment_date DESC
  `;
  return db.prepare(query).all(studentId);
};

/**
 * Get lunch payments by date range
 * @param {string} startDate - Start date (inclusive)
 * @param {string} endDate - End date (inclusive)
 * @returns {Array} - Array of lunch payment objects in date range
 */
export const getLunchPaymentsByDateRange = (startDate, endDate) => {
  const query = `
    SELECT 
      lp.*,
      s.admission_number,
      s.first_name,
      s.last_name
    FROM ${TABLE} lp
    LEFT JOIN ${STUDENTS_TABLE} s ON lp.student_id = s.id
    WHERE lp.payment_date BETWEEN ? AND ?
    ORDER BY lp.payment_date DESC
  `;
  return db.prepare(query).all(startDate, endDate);
};

/**
 * Create a new lunch payment
 * @param {Object} lunchPayment - Lunch payment data
 * @param {number} lunchPayment.student_id - Student ID
 * @param {number} lunchPayment.transaction_id - Transaction ID
 * @param {number} lunchPayment.amount - Payment amount
 * @param {string} lunchPayment.payment_date - Payment date (YYYY-MM-DD)
 * @param {string} lunchPayment.payment_type - Payment type (daily, weekly, monthly)
 * @param {string} lunchPayment.start_date - Start date for the payment period
 * @param {string} lunchPayment.end_date - End date for the payment period
 * @param {string} lunchPayment.notes - Additional notes
 * @param {number} lunchPayment.created_by - User ID who created the record
 * @returns {Object} - Created lunch payment object with ID
 */
export const createLunchPayment = (lunchPayment) => {
  const {
    student_id,
    transaction_id,
    amount,
    payment_date,
    payment_type = 'daily',
    start_date,
    end_date,
    notes,
    created_by
  } = lunchPayment;

  const query = `
    INSERT INTO ${TABLE} (
      student_id, transaction_id, amount, payment_date, payment_type,
      start_date, end_date, notes, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const stmt = db.prepare(query);
  const result = stmt.run(
    student_id,
    transaction_id,
    amount,
    payment_date,
    payment_type,
    start_date,
    end_date,
    notes,
    created_by,
    created_by
  );

  return { ...lunchPayment, id: result.lastInsertRowid };
};

/**
 * Update an existing lunch payment
 * @param {number} id - Lunch payment ID
 * @param {Object} updates - Fields to update
 * @param {number} updates.student_id - Student ID
 * @param {number} updates.transaction_id - Transaction ID
 * @param {number} updates.amount - Payment amount
 * @param {string} updates.payment_date - Payment date (YYYY-MM-DD)
 * @param {string} updates.payment_type - Payment type (daily, weekly, monthly)
 * @param {string} updates.start_date - Start date for the payment period
 * @param {string} updates.end_date - End date for the payment period
 * @param {string} updates.notes - Additional notes
 * @param {number} updates.updated_by - User ID who updated the record
 * @returns {Object|null} - Updated lunch payment object or null if not found
 */
export const updateLunchPayment = (id, updates) => {
  const existing = getLunchPaymentById(id);
  if (!existing) {
    return null;
  }

  const {
    student_id,
    transaction_id,
    amount,
    payment_date,
    payment_type,
    start_date,
    end_date,
    notes,
    updated_by
  } = updates;

  const query = `
    UPDATE ${TABLE} SET
      student_id = COALESCE(?, student_id),
      transaction_id = COALESCE(?, transaction_id),
      amount = COALESCE(?, amount),
      payment_date = COALESCE(?, payment_date),
      payment_type = COALESCE(?, payment_type),
      start_date = COALESCE(?, start_date),
      end_date = COALESCE(?, end_date),
      notes = COALESCE(?, notes),
      updated_by = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const stmt = db.prepare(query);
  stmt.run(
    student_id,
    transaction_id,
    amount,
    payment_date,
    payment_type,
    start_date,
    end_date,
    notes,
    updated_by,
    id
  );

  return { ...existing, ...updates, id };
};

/**
 * Delete a lunch payment
 * @param {number} id - Lunch payment ID
 * @returns {boolean} - True if deleted, false if not found
 */
export const deleteLunchPayment = (id) => {
  const existing = getLunchPaymentById(id);
  if (!existing) {
    return false;
  }

  const query = `DELETE FROM ${TABLE} WHERE id = ?`;
  const stmt = db.prepare(query);
  stmt.run(id);
  
  return true;
};

/**
 * Get lunch payments statistics
 * @returns {Object} - Statistics object with counts and totals
 */
export const getLunchPaymentStatistics = () => {
  const query = `
    SELECT 
      COUNT(*) as total_payments,
      SUM(amount) as total_amount,
      COUNT(CASE WHEN payment_type = 'daily' THEN 1 END) as daily_count,
      COUNT(CASE WHEN payment_type = 'weekly' THEN 1 END) as weekly_count,
      COUNT(CASE WHEN payment_type = 'monthly' THEN 1 END) as monthly_count,
      SUM(CASE WHEN payment_type = 'daily' THEN amount ELSE 0 END) as daily_total,
      SUM(CASE WHEN payment_type = 'weekly' THEN amount ELSE 0 END) as weekly_total,
      SUM(CASE WHEN payment_type = 'monthly' THEN amount ELSE 0 END) as monthly_total
    FROM ${TABLE}
  `;
  
  return db.prepare(query).get() || {
    total_payments: 0,
    total_amount: 0,
    daily_count: 0,
    weekly_count: 0,
    monthly_count: 0,
    daily_total: 0,
    weekly_total: 0,
    monthly_total: 0
  };
};

/**
 * Get lunch payments summary for a specific date
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Object} - Summary for the date
 */
export const getLunchPaymentSummaryByDate = (date) => {
  const query = `
    SELECT 
      COUNT(*) as payment_count,
      SUM(amount) as total_amount,
      COUNT(CASE WHEN payment_type = 'daily' THEN 1 END) as daily_count,
      COUNT(CASE WHEN payment_type = 'weekly' THEN 1 END) as weekly_count,
      COUNT(CASE WHEN payment_type = 'monthly' THEN 1 END) as monthly_count
    FROM ${TABLE}
    WHERE payment_date = ?
  `;
  
  return db.prepare(query).get(date) || {
    payment_count: 0,
    total_amount: 0,
    daily_count: 0,
    weekly_count: 0,
    monthly_count: 0
  };
};

export default {
  getAllLunchPayments,
  getLunchPaymentCount,
  getLunchPaymentById,
  getLunchPaymentsByStudentId,
  getLunchPaymentsByDateRange,
  createLunchPayment,
  updateLunchPayment,
  deleteLunchPayment,
  getLunchPaymentStatistics,
  getLunchPaymentSummaryByDate,
  VALID_PAYMENT_TYPES,
  FIELDS,
  TABLE
};

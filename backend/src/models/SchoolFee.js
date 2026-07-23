import db from '../config/database.js';

/**
 * School Fee Model
 * Data access layer for school_fee_payments table
 * 
 * Represents school fee payments with:
 * - Student reference
 * - Transaction reference (for receipt tracking)
 * - Amount and payment date
 * - Academic year and term
 * - Audit fields (created_by, updated_by, timestamps)
 */

// Table name
const TABLE = 'school_fee_payments';

// Related tables
const TRANSACTIONS_TABLE = 'transactions';
const STUDENTS_TABLE = 'students';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  STUDENT_ID: 'student_id',
  TRANSACTION_ID: 'transaction_id',
  AMOUNT: 'amount',
  PAYMENT_DATE: 'payment_date',
  ACADEMIC_YEAR: 'academic_year',
  TERM: 'term',
  NOTES: 'notes',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by'
};

// Valid term values
const VALID_TERMS = ['Term 1', 'Term 2', 'Term 3'];

/**
 * Get all school fee payments with optional filtering
 * @param {Object} options - Filter options
 * @param {number} options.studentId - Filter by student ID
 * @param {string} options.academicYear - Filter by academic year
 * @param {string} options.term - Filter by term
 * @param {string} options.search - Search term for student name or admission number
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Array} - Array of school fee payment objects with student and transaction details
 */
export const getAllSchoolFeePayments = (options = {}) => {
  const {
    studentId,
    academicYear,
    term,
    search,
    limit = 100,
    offset = 0,
    orderBy = 'sfp.payment_date',
    orderDir = 'DESC'
  } = options;

  let query = `
    SELECT 
      sfp.*,
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
    FROM ${TABLE} sfp
    LEFT JOIN ${STUDENTS_TABLE} s ON sfp.student_id = s.id
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN ${TRANSACTIONS_TABLE} t ON sfp.transaction_id = t.id
    LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
  `;
  
  const params = [];
  const conditions = [];

  if (studentId) {
    conditions.push(`sfp.student_id = ?`);
    params.push(studentId);
  }

  if (academicYear) {
    conditions.push(`sfp.academic_year = ?`);
    params.push(academicYear);
  }

  if (term) {
    conditions.push(`sfp.term = ?`);
    params.push(term);
  }

  if (search) {
    conditions.push(`(s.admission_number LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ?)`);
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
 * Get total count of school fee payments matching filter criteria
 * @param {Object} options - Filter options (same as getAllSchoolFeePayments)
 * @returns {number} - Total count
 */
export const getSchoolFeePaymentCount = (options = {}) => {
  const { studentId, academicYear, term, search } = options;
  
  let query = `
    SELECT COUNT(*) as count 
    FROM ${TABLE} sfp
    LEFT JOIN ${STUDENTS_TABLE} s ON sfp.student_id = s.id
  `;
  
  const params = [];
  const conditions = [];

  if (studentId) {
    conditions.push(`sfp.student_id = ?`);
    params.push(studentId);
  }

  if (academicYear) {
    conditions.push(`sfp.academic_year = ?`);
    params.push(academicYear);
  }

  if (term) {
    conditions.push(`sfp.term = ?`);
    params.push(term);
  }

  if (search) {
    conditions.push(`(s.admission_number LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ?)`);
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
 * Get a single school fee payment by ID
 * @param {number} id - School fee payment ID
 * @returns {Object|null} - School fee payment object with student and transaction details
 */
export const getSchoolFeePaymentById = (id) => {
  const query = `
    SELECT 
      sfp.*,
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
    FROM ${TABLE} sfp
    LEFT JOIN ${STUDENTS_TABLE} s ON sfp.student_id = s.id
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN ${TRANSACTIONS_TABLE} t ON sfp.transaction_id = t.id
    LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
    WHERE sfp.id = ?
  `;
  return db.prepare(query).get(id) || null;
};

/**
 * Get school fee payments by student ID
 * @param {number} studentId - Student ID
 * @returns {Array} - Array of school fee payments for the student
 */
export const getSchoolFeePaymentsByStudent = (studentId) => {
  const query = `
    SELECT 
      sfp.*,
      t.receipt_number,
      t.amount as transaction_amount,
      t.payment_method_id,
      pm.name as payment_method,
      t.transaction_date
    FROM ${TABLE} sfp
    LEFT JOIN ${TRANSACTIONS_TABLE} t ON sfp.transaction_id = t.id
    LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
    WHERE sfp.student_id = ?
    ORDER BY sfp.payment_date DESC
  `;
  return db.prepare(query).all(studentId);
};

/**
 * Get a student's current school fee balance
 * @param {number} studentId - Student ID
 * @returns {Object} - Balance information
 */
export const getStudentSchoolFeeBalance = (studentId) => {
  // Get total paid
  const paidStmt = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total_paid 
    FROM ${TABLE} 
    WHERE student_id = ?
  `);
  const totalPaid = paidStmt.get(studentId).total_paid || 0;

  // For now, return simple balance info
  // In a real implementation, this would calculate based on expected fees
  return {
    student_id: studentId,
    total_paid: parseFloat(totalPaid),
    // These would be calculated from fee structure in a full implementation
    expected_fees: 0,
    balance: parseFloat(totalPaid) * -1 // Negative means credit (overpaid)
  };
};

/**
 * Get all students in arrears (have not paid full fees)
 * @param {string} academicYear - Academic year to check
 * @param {string} term - Term to check
 * @returns {Array} - Array of students in arrears with their balances
 */
export const getStudentsInArrears = (academicYear, term) => {
  // This is a simplified implementation
  // In a full implementation, this would compare payments against expected fees
  const query = `
    SELECT 
      s.id,
      s.admission_number,
      s.first_name,
      s.last_name,
      s.class_id,
      c.name as class_name,
      COALESCE(SUM(sfp.amount), 0) as total_paid,
      0 as expected_fees, -- Would be from fee structure
      0 as balance -- Would be calculated
    FROM ${STUDENTS_TABLE} s
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN ${TABLE} sfp ON s.id = sfp.student_id
    WHERE s.status = 'Active'
  `;
  
  const params = [];
  const conditions = [];

  if (academicYear) {
    conditions.push(`sfp.academic_year = ?`);
    params.push(academicYear);
  }

  if (term) {
    conditions.push(`sfp.term = ?`);
    params.push(term);
  }

  if (conditions.length > 0) {
    query += ` AND ${conditions.join(' AND ')}`;
  }

  query += ` GROUP BY s.id, s.admission_number, s.first_name, s.last_name, s.class_id, c.name`;

  return db.prepare(query).all(...params);
};

/**
 * Create a new school fee payment
 * @param {Object} data - School fee payment data
 * @param {number} data.studentId - Student ID
 * @param {number} data.transactionId - Transaction ID
 * @param {number} data.amount - Amount paid
 * @param {string} data.paymentDate - Payment date (YYYY-MM-DD)
 * @param {string} data.academicYear - Academic year
 * @param {string} data.term - Term
 * @param {string} data.notes - Notes
 * @param {number} data.createdBy - User ID who created the record
 * @returns {Object} - Created school fee payment
 */
export const createSchoolFeePayment = (data) => {
  const {
    studentId,
    transactionId,
    amount,
    paymentDate,
    academicYear,
    term,
    notes,
    createdBy
  } = data;

  const stmt = db.prepare(`
    INSERT INTO ${TABLE} 
    (student_id, transaction_id, amount, payment_date, academic_year, term, notes, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    studentId,
    transactionId,
    amount,
    paymentDate,
    academicYear,
    term,
    notes,
    createdBy,
    createdBy
  );

  return getSchoolFeePaymentById(result.lastInsertRowid);
};

/**
 * Update a school fee payment
 * @param {number} id - School fee payment ID
 * @param {Object} data - Updated data
 * @param {number} data.studentId - Student ID
 * @param {number} data.transactionId - Transaction ID
 * @param {number} data.amount - Amount paid
 * @param {string} data.paymentDate - Payment date (YYYY-MM-DD)
 * @param {string} data.academicYear - Academic year
 * @param {string} data.term - Term
 * @param {string} data.notes - Notes
 * @param {number} data.updatedBy - User ID who updated the record
 * @returns {Object|null} - Updated school fee payment
 */
export const updateSchoolFeePayment = (id, data) => {
  const {
    studentId,
    transactionId,
    amount,
    paymentDate,
    academicYear,
    term,
    notes,
    updatedBy
  } = data;

  const existing = getSchoolFeePaymentById(id);
  if (!existing) {
    return null;
  }

  const stmt = db.prepare(`
    UPDATE ${TABLE} 
    SET student_id = ?, transaction_id = ?, amount = ?, payment_date = ?, 
        academic_year = ?, term = ?, notes = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    studentId || existing.student_id,
    transactionId || existing.transaction_id,
    amount || existing.amount,
    paymentDate || existing.payment_date,
    academicYear || existing.academic_year,
    term || existing.term,
    notes || existing.notes,
    updatedBy,
    id
  );

  return getSchoolFeePaymentById(id);
};

/**
 * Delete a school fee payment
 * @param {number} id - School fee payment ID
 * @returns {boolean} - True if deleted, false if not found
 */
export const deleteSchoolFeePayment = (id) => {
  const existing = getSchoolFeePaymentById(id);
  if (!existing) {
    return false;
  }

  const stmt = db.prepare(`DELETE FROM ${TABLE} WHERE id = ?`);
  stmt.run(id);
  return true;
};

/**
 * Get school fee statistics
 * @param {string} academicYear - Academic year to filter by
 * @param {string} term - Term to filter by
 * @returns {Object} - Statistics object
 */
export const getSchoolFeeStatistics = (academicYear, term) => {
  let query = `
    SELECT 
      COUNT(*) as total_payments,
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(DISTINCT student_id) as unique_students
    FROM ${TABLE}
  `;
  
  const params = [];
  const conditions = [];

  if (academicYear) {
    conditions.push(`academic_year = ?`);
    params.push(academicYear);
  }

  if (term) {
    conditions.push(`term = ?`);
    params.push(term);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const result = db.prepare(query).get(...params);

  return {
    total_payments: result.total_payments || 0,
    total_amount: parseFloat(result.total_amount) || 0,
    unique_students: result.unique_students || 0
  };
};

/**
 * Get summary for dashboard
 * @returns {Object} - Summary data for dashboard
 */
export const getSchoolFeeSummary = () => {
  // Get today's payments
  const today = new Date().toISOString().split('T')[0];
  const todayPayments = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
    FROM ${TABLE} 
    WHERE payment_date = ?
  `).get(today);

  // Get this month's payments
  const thisMonth = today.substring(0, 7);
  const monthPayments = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
    FROM ${TABLE} 
    WHERE payment_date LIKE ?
  `).get(`${thisMonth}%`);

  // Get total
  const total = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
    FROM ${TABLE}
  `).get();

  return {
    today: {
      count: todayPayments.count || 0,
      total: parseFloat(todayPayments.total) || 0
    },
    this_month: {
      count: monthPayments.count || 0,
      total: parseFloat(monthPayments.total) || 0
    },
    total: {
      count: total.count || 0,
      total: parseFloat(total.total) || 0
    }
  };
};

export default {
  getAllSchoolFeePayments,
  getSchoolFeePaymentCount,
  getSchoolFeePaymentById,
  getSchoolFeePaymentsByStudent,
  getStudentSchoolFeeBalance,
  getStudentsInArrears,
  createSchoolFeePayment,
  updateSchoolFeePayment,
  deleteSchoolFeePayment,
  getSchoolFeeStatistics,
  getSchoolFeeSummary
};

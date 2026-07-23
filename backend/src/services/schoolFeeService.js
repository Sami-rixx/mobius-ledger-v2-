import * as SchoolFeeModel from '../models/SchoolFee.js';
import * as TransactionModel from '../models/Transaction.js';
import * as StudentModel from '../models/Student.js';
import db from '../config/database.js';
import { generateReceiptNumber } from '../utils/receiptGenerator.js';

/**
 * School Fee Service
 * Business logic layer for school fee management
 * 
 * Handles:
 * - Business rule validation
 * - Data transformation
 * - Complex queries
 * - Transaction management
 * - Receipt generation
 * - Balance calculations
 */

/**
 * Get paginated list of school fee payments
 * @param {Object} options - Filter and pagination options
 * @param {number} options.studentId - Filter by student ID
 * @param {string} options.academicYear - Filter by academic year
 * @param {string} options.term - Filter by term
 * @param {string} options.search - Search term for student
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction
 * @returns {Object} - Paginated result with school fee payments and metadata
 */
export const getPaginatedSchoolFeePayments = (options = {}) => {
  const {
    studentId,
    academicYear,
    term,
    search,
    page = 1,
    pageSize = 20,
    orderBy = 'sfp.payment_date',
    orderDir = 'DESC'
  } = options;

  const offset = (page - 1) * pageSize;

  // Get school fee payments
  const payments = SchoolFeeModel.getAllSchoolFeePayments({
    studentId,
    academicYear,
    term,
    search,
    limit: pageSize,
    offset,
    orderBy,
    orderDir
  });

  // Get total count
  const total = SchoolFeeModel.getSchoolFeePaymentCount({
    studentId,
    academicYear,
    term,
    search
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    data: payments,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? page + 1 : null,
      previousPage: hasPreviousPage ? page - 1 : null
    }
  };
};

/**
 * Get all school fee payments (no pagination)
 * @param {Object} options - Filter options
 * @returns {Array} - Array of school fee payments
 */
export const getAllSchoolFeePayments = (options = {}) => {
  return SchoolFeeModel.getAllSchoolFeePayments(options);
};

/**
 * Get a single school fee payment by ID with enhanced data
 * @param {number} id - School fee payment ID
 * @returns {Object|null} - School fee payment with computed fields
 */
export const getSchoolFeePaymentById = (id) => {
  const payment = SchoolFeeModel.getSchoolFeePaymentById(id);
  
  if (!payment) {
    return null;
  }

  // Add computed fields
  return {
    ...payment,
    amount: parseFloat(payment.amount),
    transaction_amount: payment.transaction_amount ? parseFloat(payment.transaction_amount) : 0,
    is_verified: Boolean(payment.is_verified)
  };
};

/**
 * Get school fee payments by student ID
 * @param {number} studentId - Student ID
 * @returns {Array} - Array of school fee payments for the student
 */
export const getSchoolFeePaymentsByStudent = (studentId) => {
  return SchoolFeeModel.getSchoolFeePaymentsByStudent(studentId);
};

/**
 * Get a student's current school fee balance
 * @param {number} studentId - Student ID
 * @returns {Object} - Balance information
 */
export const getStudentSchoolFeeBalance = (studentId) => {
  return SchoolFeeModel.getStudentSchoolFeeBalance(studentId);
};

/**
 * Get all students in arrears
 * @param {string} academicYear - Academic year to check
 * @param {string} term - Term to check
 * @returns {Array} - Array of students in arrears
 */
export const getStudentsInArrears = (academicYear, term) => {
  return SchoolFeeModel.getStudentsInArrears(academicYear, term);
};

/**
 * Get school fee statistics
 * @param {string} academicYear - Academic year to filter by
 * @param {string} term - Term to filter by
 * @returns {Object} - Statistics object
 */
export const getSchoolFeeStatistics = (academicYear, term) => {
  return SchoolFeeModel.getSchoolFeeStatistics(academicYear, term);
};

/**
 * Get summary for dashboard
 * @returns {Object} - Summary data for dashboard
 */
export const getSchoolFeeSummary = () => {
  return SchoolFeeModel.getSchoolFeeSummary();
};

/**
 * Create a new school fee payment with transaction
 * This is the main method for recording school fee payments
 * It creates both the transaction and the school fee payment record
 * 
 * @param {Object} data - School fee payment data
 * @param {number} data.studentId - Student ID
 * @param {number} data.amount - Amount paid
 * @param {string} data.paymentDate - Payment date (YYYY-MM-DD)
 * @param {string} data.academicYear - Academic year
 * @param {string} data.term - Term
 * @param {number} data.paymentMethodId - Payment method ID
 * @param {string} data.description - Description
 * @param {string} data.notes - Notes
 * @param {number} data.createdBy - User ID who created the record
 * @returns {Object} - Created school fee payment with transaction
 */
export const createSchoolFeePaymentWithTransaction = (data) => {
  const {
    studentId,
    amount,
    paymentDate,
    academicYear,
    term,
    paymentMethodId,
    description,
    notes,
    createdBy
  } = data;

  // Validate required fields
  if (!studentId || !amount || !paymentDate || !academicYear || !term) {
    throw new Error('Missing required fields: studentId, amount, paymentDate, academicYear, term');
  }

  // Validate student exists
  const student = StudentModel.getStudentById(studentId);
  if (!student) {
    throw new Error(`Student with ID ${studentId} not found`);
  }

  // Validate amount
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new Error('Amount must be a positive number');
  }

  // Generate receipt number
  const receiptNumber = generateReceiptNumber();

  // Create transaction in a transaction (atomic operation)
  const transaction = db.transaction(() => {
    // Create the transaction record
    const txStmt = db.prepare(`
      INSERT INTO transactions 
      (receipt_number, transaction_type, amount, student_id, description, 
       payment_method_id, transaction_date, notes, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const txResult = txStmt.run(
      receiptNumber,
      'school_fee',
      amountNum.toFixed(2),
      studentId,
      description || `School fee payment for ${student.admission_number}`,
      paymentMethodId,
      paymentDate,
      notes || '',
      createdBy,
      createdBy
    );

    const transactionId = txResult.lastInsertRowid;

    // Create the school fee payment record
    const sfpStmt = db.prepare(`
      INSERT INTO school_fee_payments 
      (student_id, transaction_id, amount, payment_date, academic_year, term, notes, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    sfpStmt.run(
      studentId,
      transactionId,
      amountNum.toFixed(2),
      paymentDate,
      academicYear,
      term,
      notes || '',
      createdBy,
      createdBy
    );

    return { transactionId, receiptNumber };
  })();

  // Return the created school fee payment
  const payment = SchoolFeeModel.getSchoolFeePaymentById(transaction.school_fee_id);
  return {
    ...payment,
    receipt_number: transaction.receiptNumber,
    transaction_id: transaction.transactionId
  };
};

/**
 * Create a school fee payment (assumes transaction already exists)
 * @param {Object} data - School fee payment data
 * @returns {Object} - Created school fee payment
 */
export const createSchoolFeePayment = (data) => {
  return SchoolFeeModel.createSchoolFeePayment(data);
};

/**
 * Update a school fee payment
 * @param {number} id - School fee payment ID
 * @param {Object} data - Updated data
 * @returns {Object|null} - Updated school fee payment
 */
export const updateSchoolFeePayment = (id, data) => {
  return SchoolFeeModel.updateSchoolFeePayment(id, data);
};

/**
 * Delete a school fee payment
 * @param {number} id - School fee payment ID
 * @returns {boolean} - True if deleted, false if not found
 */
export const deleteSchoolFeePayment = (id) => {
  return SchoolFeeModel.deleteSchoolFeePayment(id);
};

/**
 * Check if a student has any school fee payments
 * @param {number} studentId - Student ID
 * @returns {boolean} - True if student has payments
 */
export const hasSchoolFeePayments = (studentId) => {
  const count = db.prepare(`
    SELECT COUNT(*) as count FROM school_fee_payments WHERE student_id = ?
  `).get(studentId).count || 0;
  return count > 0;
};

/**
 * Get school fee payments by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array} - Array of school fee payments in date range
 */
export const getSchoolFeePaymentsByDateRange = (startDate, endDate) => {
  return SchoolFeeModel.getAllSchoolFeePayments({
    search: '',
    startDate,
    endDate
  });
};

/**
 * Get recent school fee payments
 * @param {number} limit - Number of recent payments to get
 * @returns {Array} - Array of recent school fee payments
 */
export const getRecentSchoolFeePayments = (limit = 10) => {
  return SchoolFeeModel.getAllSchoolFeePayments({
    limit,
    orderBy: 'sfp.payment_date',
    orderDir: 'DESC'
  });
};

export default {
  getPaginatedSchoolFeePayments,
  getAllSchoolFeePayments,
  getSchoolFeePaymentById,
  getSchoolFeePaymentsByStudent,
  getStudentSchoolFeeBalance,
  getStudentsInArrears,
  getSchoolFeeStatistics,
  getSchoolFeeSummary,
  createSchoolFeePaymentWithTransaction,
  createSchoolFeePayment,
  updateSchoolFeePayment,
  deleteSchoolFeePayment,
  hasSchoolFeePayments,
  getSchoolFeePaymentsByDateRange,
  getRecentSchoolFeePayments
};

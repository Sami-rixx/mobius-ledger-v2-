import * as LunchPaymentModel from '../models/LunchPayment.js';
import * as LunchAttendanceModel from '../models/LunchAttendance.js';
import * as StudentModel from '../models/Student.js';
import * as TransactionModel from '../models/Transaction.js';
import db from '../config/database.js';
import { generateReceiptNumber } from '../utils/receiptGenerator.js';

/**
 * Lunch Service
 * Business logic layer for lunch management
 * 
 * Handles:
 * - Business rule validation
 * - Data transformation
 * - Complex queries
 * - Transaction management
 * - Receipt generation
 * - Lunch attendance tracking
 * - Arrears calculation
 */

/**
 * Get paginated list of lunch payments
 * @param {Object} options - Filter and pagination options
 * @param {number} options.studentId - Filter by student ID
 * @param {string} options.paymentType - Filter by payment type (daily, weekly, monthly)
 * @param {string} options.startDate - Filter by start date
 * @param {string} options.endDate - Filter by end date
 * @param {string} options.search - Search term for student
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction
 * @returns {Object} - Paginated result with lunch payments and metadata
 */
export const getPaginatedLunchPayments = (options = {}) => {
  const {
    studentId,
    paymentType,
    startDate,
    endDate,
    search,
    page = 1,
    pageSize = 20,
    orderBy = 'lp.payment_date',
    orderDir = 'DESC'
  } = options;

  const offset = (page - 1) * pageSize;

  // Get lunch payments
  const payments = LunchPaymentModel.getAllLunchPayments({
    studentId,
    paymentType,
    startDate,
    endDate,
    search,
    limit: pageSize,
    offset,
    orderBy,
    orderDir
  });

  // Get total count
  const total = LunchPaymentModel.getLunchPaymentCount({
    studentId,
    paymentType,
    startDate,
    endDate,
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
 * Get all lunch payments (no pagination)
 * @param {Object} options - Filter options
 * @returns {Array} - Array of lunch payments
 */
export const getAllLunchPayments = (options = {}) => {
  return LunchPaymentModel.getAllLunchPayments(options);
};

/**
 * Get a single lunch payment by ID with enhanced data
 * @param {number} id - Lunch payment ID
 * @returns {Object|null} - Lunch payment with computed fields
 */
export const getLunchPaymentById = (id) => {
  const payment = LunchPaymentModel.getLunchPaymentById(id);
  if (!payment) {
    return null;
  }

  // Add computed fields
  return {
    ...payment,
    // Calculate days covered by this payment
    days_covered: calculateDaysCovered(payment),
    // Get attendance records for this payment
    attendance_records: LunchAttendanceModel.getLunchAttendanceByStudentId(
      payment.student_id,
      payment.start_date,
      payment.end_date
    )
  };
};

/**
 * Get lunch payments by student ID
 * @param {number} studentId - Student ID
 * @returns {Array} - Array of lunch payments for the student
 */
export const getLunchPaymentsByStudentId = (studentId) => {
  return LunchPaymentModel.getLunchPaymentsByStudentId(studentId);
};

/**
 * Get lunch payments by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array} - Array of lunch payments in date range
 */
export const getLunchPaymentsByDateRange = (startDate, endDate) => {
  return LunchPaymentModel.getLunchPaymentsByDateRange(startDate, endDate);
};

/**
 * Create a new lunch payment with transaction
 * @param {Object} paymentData - Lunch payment data
 * @param {number} paymentData.student_id - Student ID
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.payment_date - Payment date (YYYY-MM-DD)
 * @param {string} paymentData.payment_type - Payment type (daily, weekly, monthly)
 * @param {string} paymentData.start_date - Start date for the payment period
 * @param {string} paymentData.end_date - End date for the payment period
 * @param {string} paymentData.notes - Additional notes
 * @param {number} paymentData.payment_method_id - Payment method ID
 * @param {number} paymentData.created_by - User ID who created the record
 * @returns {Object} - Created lunch payment with transaction
 */
export const createLunchPaymentWithTransaction = (paymentData) => {
  const {
    student_id,
    amount,
    payment_date,
    payment_type = 'daily',
    start_date,
    end_date,
    notes,
    payment_method_id,
    created_by
  } = paymentData;

  // Validate student exists
  const student = StudentModel.getStudentById(student_id);
  if (!student) {
    throw new Error(`Student with ID ${student_id} not found`);
  }

  // Generate receipt number
  const receipt_number = generateReceiptNumber();

  // Create transaction
  const transaction = TransactionModel.createTransaction({
    receipt_number,
    transaction_type: 'lunch_fee',
    amount,
    transaction_date: payment_date,
    payment_method_id,
    student_id,
    description: `Lunch payment - ${payment_type}`,
    notes: notes || `Lunch payment for ${student.first_name} ${student.last_name}`,
    created_by
  });

  // Create lunch payment
  const lunchPayment = LunchPaymentModel.createLunchPayment({
    student_id,
    transaction_id: transaction.id,
    amount,
    payment_date,
    payment_type,
    start_date,
    end_date,
    notes,
    created_by
  });

  // Create attendance records for the payment period
  if (start_date && end_date && payment_type !== 'daily') {
    createAttendanceRecordsForPayment(lunchPayment.id, student_id, start_date, end_date, created_by);
  } else if (payment_type === 'daily' && start_date) {
    // For daily payments, create attendance for the specific date
    LunchAttendanceModel.createLunchAttendance({
      student_id,
      date: start_date,
      status: 'paid',
      payment_id: lunchPayment.id,
      notes: `Paid via ${receipt_number}`,
      created_by
    });
  }

  return {
    ...lunchPayment,
    transaction,
    receipt_number
  };
};

/**
 * Create attendance records for a payment period
 * @param {number} paymentId - Payment ID
 * @param {number} studentId - Student ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {number} createdBy - User ID who created the records
 */
const createAttendanceRecordsForPayment = (paymentId, studentId, startDate, endDate, createdBy) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];

  // Generate all dates in the range
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      dates.push(new Date(d));
    }
  }

  // Create attendance records for each date
  dates.forEach(date => {
    const dateStr = date.toISOString().split('T')[0];
    LunchAttendanceModel.createLunchAttendance({
      student_id: studentId,
      date: dateStr,
      status: 'paid',
      payment_id: paymentId,
      notes: `Paid via payment #${paymentId}`,
      created_by: createdBy
    });
  });
};

/**
 * Update an existing lunch payment
 * @param {number} id - Lunch payment ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} - Updated lunch payment or null if not found
 */
export const updateLunchPayment = (id, updates) => {
  const existing = LunchPaymentModel.getLunchPaymentById(id);
  if (!existing) {
    return null;
  }

  return LunchPaymentModel.updateLunchPayment(id, updates);
};

/**
 * Delete a lunch payment
 * @param {number} id - Lunch payment ID
 * @returns {boolean} - True if deleted, false if not found
 */
export const deleteLunchPayment = (id) => {
  const existing = LunchPaymentModel.getLunchPaymentById(id);
  if (!existing) {
    return false;
  }

  // Delete related attendance records
  const attendanceRecords = LunchAttendanceModel.getLunchAttendanceByStudentId(
    existing.student_id,
    existing.start_date,
    existing.end_date
  );
  
  attendanceRecords.forEach(record => {
    if (record.payment_id === id) {
      LunchAttendanceModel.deleteLunchAttendance(record.id);
    }
  });

  return LunchPaymentModel.deleteLunchPayment(id);
};

/**
 * Get lunch payment statistics
 * @returns {Object} - Statistics object
 */
export const getLunchPaymentStatistics = () => {
  return LunchPaymentModel.getLunchPaymentStatistics();
};

/**
 * Get lunch payment summary for a specific date
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Object} - Summary for the date
 */
export const getLunchPaymentSummaryByDate = (date) => {
  return LunchPaymentModel.getLunchPaymentSummaryByDate(date);
};

// ============================================
// Lunch Attendance Services
// ============================================

/**
 * Get paginated list of lunch attendance records
 * @param {Object} options - Filter and pagination options
 * @param {number} options.studentId - Filter by student ID
 * @param {string} options.date - Filter by specific date
 * @param {string} options.startDate - Filter by start date
 * @param {string} options.endDate - Filter by end date
 * @param {string} options.status - Filter by status (paid, unpaid, absent)
 * @param {string} options.search - Search term for student
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction
 * @returns {Object} - Paginated result with lunch attendance records and metadata
 */
export const getPaginatedLunchAttendance = (options = {}) => {
  const {
    studentId,
    date,
    startDate,
    endDate,
    status,
    search,
    page = 1,
    pageSize = 20,
    orderBy = 'la.date',
    orderDir = 'DESC'
  } = options;

  const offset = (page - 1) * pageSize;

  // Get lunch attendance records
  const records = LunchAttendanceModel.getAllLunchAttendance({
    studentId,
    date,
    startDate,
    endDate,
    status,
    search,
    limit: pageSize,
    offset,
    orderBy,
    orderDir
  });

  // Get total count
  const total = LunchAttendanceModel.getLunchAttendanceCount({
    studentId,
    date,
    startDate,
    endDate,
    status,
    search
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    data: records,
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
 * Get all lunch attendance records (no pagination)
 * @param {Object} options - Filter options
 * @returns {Array} - Array of lunch attendance records
 */
export const getAllLunchAttendance = (options = {}) => {
  return LunchAttendanceModel.getAllLunchAttendance(options);
};

/**
 * Get a single lunch attendance record by ID
 * @param {number} id - Lunch attendance ID
 * @returns {Object|null} - Lunch attendance record
 */
export const getLunchAttendanceById = (id) => {
  return LunchAttendanceModel.getLunchAttendanceById(id);
};

/**
 * Get lunch attendance by student ID and date
 * @param {number} studentId - Student ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Object|null} - Lunch attendance record
 */
export const getLunchAttendanceByStudentAndDate = (studentId, date) => {
  return LunchAttendanceModel.getLunchAttendanceByStudentAndDate(studentId, date);
};

/**
 * Get lunch attendance for a specific date
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Array} - Array of lunch attendance records for the date
 */
export const getLunchAttendanceByDate = (date) => {
  return LunchAttendanceModel.getLunchAttendanceByDate(date);
};

/**
 * Get lunch attendance for a student
 * @param {number} studentId - Student ID
 * @param {string} startDate - Optional start date filter
 * @param {string} endDate - Optional end date filter
 * @returns {Array} - Array of lunch attendance records for the student
 */
export const getLunchAttendanceByStudentId = (studentId, startDate = null, endDate = null) => {
  return LunchAttendanceModel.getLunchAttendanceByStudentId(studentId, startDate, endDate);
};

/**
 * Create a new lunch attendance record
 * @param {Object} attendance - Lunch attendance data
 * @returns {Object} - Created lunch attendance record
 */
export const createLunchAttendance = (attendance) => {
  return LunchAttendanceModel.createLunchAttendance(attendance);
};

/**
 * Update an existing lunch attendance record
 * @param {number} id - Lunch attendance ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} - Updated lunch attendance record or null if not found
 */
export const updateLunchAttendance = (id, updates) => {
  return LunchAttendanceModel.updateLunchAttendance(id, updates);
};

/**
 * Delete a lunch attendance record
 * @param {number} id - Lunch attendance ID
 * @returns {boolean} - True if deleted, false if not found
 */
export const deleteLunchAttendance = (id) => {
  return LunchAttendanceModel.deleteLunchAttendance(id);
};

/**
 * Get lunch attendance statistics
 * @returns {Object} - Statistics object
 */
export const getLunchAttendanceStatistics = () => {
  return LunchAttendanceModel.getLunchAttendanceStatistics();
};

/**
 * Get lunch attendance summary for a specific date
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Object} - Summary for the date
 */
export const getLunchAttendanceSummaryByDate = (date) => {
  return LunchAttendanceModel.getLunchAttendanceSummaryByDate(date);
};

/**
 * Get students with unpaid lunch attendance (arrears)
 * @param {string} startDate - Optional start date filter
 * @param {string} endDate - Optional end date filter
 * @returns {Array} - Array of students with unpaid lunch attendance
 */
export const getLunchArrears = (startDate = null, endDate = null) => {
  return LunchAttendanceModel.getUnpaidLunchAttendance(startDate, endDate);
};

/**
 * Record lunch attendance for multiple students on a specific date
 * @param {string} date - Date (YYYY-MM-DD)
 * @param {Array<number>} studentIds - Array of student IDs
 * @param {string} status - Status (paid, unpaid, absent)
 * @param {number} createdBy - User ID who created the records
 * @returns {Array} - Array of created attendance records
 */
export const recordBulkLunchAttendance = (date, studentIds, status = 'paid', createdBy) => {
  const records = [];
  
  studentIds.forEach(studentId => {
    const record = LunchAttendanceModel.createLunchAttendance({
      student_id: studentId,
      date,
      status,
      created_by: createdBy
    });
    records.push(record);
  });

  return records;
};

/**
 * Mark lunch attendance as paid for a student
 * @param {number} studentId - Student ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @param {number} paymentId - Payment ID to link
 * @param {number} updatedBy - User ID who updated the record
 * @returns {Object|null} - Updated attendance record
 */
export const markLunchAttendanceAsPaid = (studentId, date, paymentId, updatedBy) => {
  const existing = LunchAttendanceModel.getLunchAttendanceByStudentAndDate(studentId, date);
  
  if (!existing) {
    // Create new record if it doesn't exist
    return LunchAttendanceModel.createLunchAttendance({
      student_id: studentId,
      date,
      status: 'paid',
      payment_id: paymentId,
      created_by: updatedBy
    });
  }

  return LunchAttendanceModel.updateLunchAttendance(existing.id, {
    status: 'paid',
    payment_id: paymentId,
    updated_by: updatedBy
  });
};

/**
 * Calculate days covered by a lunch payment
 * @param {Object} payment - Lunch payment object
 * @returns {number} - Number of days covered
 */
const calculateDaysCovered = (payment) => {
  if (payment.payment_type === 'daily') {
    return 1;
  }

  if (payment.start_date && payment.end_date) {
    const start = new Date(payment.start_date);
    const end = new Date(payment.end_date);
    const timeDiff = end.getTime() - start.getTime();
    const dayDiff = timeDiff / (1000 * 3600 * 24);
    
    // Count weekdays only (Monday to Friday)
    let weekdayCount = 0;
    for (let i = 0; i <= dayDiff; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const day = date.getDay();
      if (day !== 0 && day !== 6) { // Not Sunday (0) or Saturday (6)
        weekdayCount++;
      }
    }
    
    return weekdayCount;
  }

  return 0;
};

export default {
  // Lunch Payment Services
  getPaginatedLunchPayments,
  getAllLunchPayments,
  getLunchPaymentById,
  getLunchPaymentsByStudentId,
  getLunchPaymentsByDateRange,
  createLunchPaymentWithTransaction,
  updateLunchPayment,
  deleteLunchPayment,
  getLunchPaymentStatistics,
  getLunchPaymentSummaryByDate,
  
  // Lunch Attendance Services
  getPaginatedLunchAttendance,
  getAllLunchAttendance,
  getLunchAttendanceById,
  getLunchAttendanceByStudentAndDate,
  getLunchAttendanceByDate,
  getLunchAttendanceByStudentId,
  createLunchAttendance,
  updateLunchAttendance,
  deleteLunchAttendance,
  getLunchAttendanceStatistics,
  getLunchAttendanceSummaryByDate,
  getLunchArrears,
  recordBulkLunchAttendance,
  markLunchAttendanceAsPaid
};

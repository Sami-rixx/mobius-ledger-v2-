/**
 * Lunch Service
 * API client for lunch management operations
 * Centralizes all lunch-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for lunch API endpoints
 */
const BASE_URL = '/lunch';

// ============================================
// Lunch Payment API Calls
// ============================================

/**
 * Get paginated list of lunch payments
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {number} params.studentId - Filter by student ID
 * @param {string} params.paymentType - Filter by payment type (daily, weekly, monthly)
 * @param {string} params.startDate - Filter by start date
 * @param {string} params.endDate - Filter by end date
 * @param {string} params.search - Search term for student
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction (ASC or DESC)
 * @returns {Promise<Object>} - Paginated result with lunch payments and metadata
 */
export const getLunchPayments = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.studentId !== undefined) queryParams.append('studentId', params.studentId);
  if (params.paymentType) queryParams.append('paymentType', params.paymentType);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.search) queryParams.append('search', params.search);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/payments${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get all lunch payments without pagination
 * @param {Object} params - Query parameters
 * @param {number} params.studentId - Filter by student ID
 * @param {string} params.paymentType - Filter by payment type
 * @param {string} params.startDate - Filter by start date
 * @param {string} params.endDate - Filter by end date
 * @param {string} params.search - Search term
 * @returns {Promise<Object>} - All matching lunch payments
 */
export const getAllLunchPayments = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.studentId !== undefined) queryParams.append('studentId', params.studentId);
  if (params.paymentType) queryParams.append('paymentType', params.paymentType);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/payments/all${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get a single lunch payment by ID
 * @param {number} id - Lunch payment ID
 * @returns {Promise<Object>} - Lunch payment object
 */
export const getLunchPaymentById = async (id) => {
  return api.get(`${BASE_URL}/payments/${id}`);
};

/**
 * Get lunch payments by student ID
 * @param {number} studentId - Student ID
 * @returns {Promise<Object>} - Lunch payments for the student
 */
export const getLunchPaymentsByStudentId = async (studentId) => {
  return api.get(`${BASE_URL}/payments/student/${studentId}`);
};

/**
 * Get lunch payments by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Lunch payments in date range
 */
export const getLunchPaymentsByDateRange = async (startDate, endDate) => {
  return api.get(`${BASE_URL}/payments/date-range?startDate=${startDate}&endDate=${endDate}`);
};

/**
 * Get lunch payment statistics
 * @returns {Promise<Object>} - Lunch payment statistics
 */
export const getLunchPaymentStatistics = async () => {
  return api.get(`${BASE_URL}/payments/statistics`);
};

/**
 * Get lunch payment summary for a specific date
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Summary for the date
 */
export const getLunchPaymentSummaryByDate = async (date) => {
  return api.get(`${BASE_URL}/payments/summary/${date}`);
};

/**
 * Create a new lunch payment
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
 * @returns {Promise<Object>} - Created lunch payment
 */
export const createLunchPayment = async (paymentData) => {
  return api.post(`${BASE_URL}/payments`, paymentData);
};

/**
 * Update an existing lunch payment
 * @param {number} id - Lunch payment ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated lunch payment
 */
export const updateLunchPayment = async (id, updates) => {
  return api.put(`${BASE_URL}/payments/${id}`, updates);
};

/**
 * Delete a lunch payment
 * @param {number} id - Lunch payment ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteLunchPayment = async (id) => {
  return api.delete(`${BASE_URL}/payments/${id}`);
};

// ============================================
// Lunch Attendance API Calls
// ============================================

/**
 * Get paginated list of lunch attendance records
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {number} params.studentId - Filter by student ID
 * @param {string} params.date - Filter by specific date
 * @param {string} params.startDate - Filter by start date
 * @param {string} params.endDate - Filter by end date
 * @param {string} params.status - Filter by status (paid, unpaid, absent)
 * @param {string} params.search - Search term for student
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction (ASC or DESC)
 * @returns {Promise<Object>} - Paginated result with lunch attendance records and metadata
 */
export const getLunchAttendance = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.studentId !== undefined) queryParams.append('studentId', params.studentId);
  if (params.date) queryParams.append('date', params.date);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.status) queryParams.append('status', params.status);
  if (params.search) queryParams.append('search', params.search);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/attendance${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get all lunch attendance records without pagination
 * @param {Object} params - Query parameters
 * @param {number} params.studentId - Filter by student ID
 * @param {string} params.date - Filter by specific date
 * @param {string} params.startDate - Filter by start date
 * @param {string} params.endDate - Filter by end date
 * @param {string} params.status - Filter by status
 * @param {string} params.search - Search term
 * @returns {Promise<Object>} - All matching lunch attendance records
 */
export const getAllLunchAttendance = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.studentId !== undefined) queryParams.append('studentId', params.studentId);
  if (params.date) queryParams.append('date', params.date);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.status) queryParams.append('status', params.status);
  if (params.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/attendance/all${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get a single lunch attendance record by ID
 * @param {number} id - Lunch attendance ID
 * @returns {Promise<Object>} - Lunch attendance record
 */
export const getLunchAttendanceById = async (id) => {
  return api.get(`${BASE_URL}/attendance/${id}`);
};

/**
 * Get lunch attendance for a specific date
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Lunch attendance records for the date
 */
export const getLunchAttendanceByDate = async (date) => {
  return api.get(`${BASE_URL}/attendance/date/${date}`);
};

/**
 * Get lunch attendance for a student
 * @param {number} studentId - Student ID
 * @param {string} startDate - Optional start date filter
 * @param {string} endDate - Optional end date filter
 * @returns {Promise<Object>} - Lunch attendance records for the student
 */
export const getLunchAttendanceByStudentId = async (studentId, startDate = null, endDate = null) => {
  let url = `${BASE_URL}/attendance/student/${studentId}`;
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  } else if (startDate) {
    url += `?startDate=${startDate}`;
  } else if (endDate) {
    url += `?endDate=${endDate}`;
  }
  return api.get(url);
};

/**
 * Get lunch attendance statistics
 * @returns {Promise<Object>} - Lunch attendance statistics
 */
export const getLunchAttendanceStatistics = async () => {
  return api.get(`${BASE_URL}/attendance/statistics`);
};

/**
 * Get lunch attendance summary for a specific date
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Summary for the date
 */
export const getLunchAttendanceSummaryByDate = async (date) => {
  return api.get(`${BASE_URL}/attendance/summary/${date}`);
};

/**
 * Get students with unpaid lunch attendance (arrears)
 * @param {string} startDate - Optional start date filter
 * @param {string} endDate - Optional end date filter
 * @returns {Promise<Object>} - Students with unpaid lunch attendance
 */
export const getLunchArrears = async (startDate = null, endDate = null) => {
  let url = `${BASE_URL}/attendance/arrears`;
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  } else if (startDate) {
    url += `?startDate=${startDate}`;
  } else if (endDate) {
    url += `?endDate=${endDate}`;
  }
  return api.get(url);
};

/**
 * Create a new lunch attendance record
 * @param {Object} attendanceData - Lunch attendance data
 * @param {number} attendanceData.student_id - Student ID
 * @param {string} attendanceData.date - Date (YYYY-MM-DD)
 * @param {string} attendanceData.status - Status (paid, unpaid, absent)
 * @param {number} attendanceData.payment_id - Payment ID to link
 * @param {string} attendanceData.notes - Additional notes
 * @param {number} attendanceData.created_by - User ID who created the record
 * @returns {Promise<Object>} - Created lunch attendance record
 */
export const createLunchAttendance = async (attendanceData) => {
  return api.post(`${BASE_URL}/attendance`, attendanceData);
};

/**
 * Update an existing lunch attendance record
 * @param {number} id - Lunch attendance ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated lunch attendance record
 */
export const updateLunchAttendance = async (id, updates) => {
  return api.put(`${BASE_URL}/attendance/${id}`, updates);
};

/**
 * Delete a lunch attendance record
 * @param {number} id - Lunch attendance ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteLunchAttendance = async (id) => {
  return api.delete(`${BASE_URL}/attendance/${id}`);
};

/**
 * Record lunch attendance for multiple students on a specific date
 * @param {string} date - Date (YYYY-MM-DD)
 * @param {Array<number>} studentIds - Array of student IDs
 * @param {string} status - Status (paid, unpaid, absent)
 * @param {number} createdBy - User ID who created the records
 * @returns {Promise<Object>} - Created attendance records
 */
export const recordBulkLunchAttendance = async (date, studentIds, status = 'paid', createdBy) => {
  return api.post(`${BASE_URL}/attendance/bulk`, { date, studentIds, status, created_by: createdBy });
};

/**
 * Mark lunch attendance as paid for a student
 * @param {number} studentId - Student ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @param {number} paymentId - Payment ID to link
 * @param {number} updatedBy - User ID who updated the record
 * @returns {Promise<Object>} - Updated attendance record
 */
export const markLunchAttendanceAsPaid = async (studentId, date, paymentId, updatedBy) => {
  return api.post(`${BASE_URL}/attendance/mark-paid`, { student_id: studentId, date, payment_id: paymentId, updated_by: updatedBy });
};

export default {
  // Lunch Payment API
  getLunchPayments,
  getAllLunchPayments,
  getLunchPaymentById,
  getLunchPaymentsByStudentId,
  getLunchPaymentsByDateRange,
  getLunchPaymentStatistics,
  getLunchPaymentSummaryByDate,
  createLunchPayment,
  updateLunchPayment,
  deleteLunchPayment,
  
  // Lunch Attendance API
  getLunchAttendance,
  getAllLunchAttendance,
  getLunchAttendanceById,
  getLunchAttendanceByDate,
  getLunchAttendanceByStudentId,
  getLunchAttendanceStatistics,
  getLunchAttendanceSummaryByDate,
  getLunchArrears,
  createLunchAttendance,
  updateLunchAttendance,
  deleteLunchAttendance,
  recordBulkLunchAttendance,
  markLunchAttendanceAsPaid
};

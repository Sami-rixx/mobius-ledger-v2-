/**
 * School Fee Service
 * API client for school fee management operations
 * Centralizes all school fee-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for school fee API endpoints
 */
const BASE_URL = '/school-fees';

/**
 * Get paginated list of school fee payments
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {number} params.studentId - Filter by student ID
 * @param {string} params.academicYear - Filter by academic year
 * @param {string} params.term - Filter by term (Term 1, Term 2, Term 3)
 * @param {string} params.search - Search term for student
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction (ASC or DESC)
 * @returns {Promise<Object>} - Paginated result with school fee payments and metadata
 */
export const getSchoolFeePayments = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.studentId !== undefined) queryParams.append('studentId', params.studentId);
  if (params.academicYear) queryParams.append('academicYear', params.academicYear);
  if (params.term) queryParams.append('term', params.term);
  if (params.search) queryParams.append('search', params.search);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get all school fee payments without pagination
 * @param {Object} params - Query parameters
 * @param {number} params.studentId - Filter by student ID
 * @param {string} params.academicYear - Filter by academic year
 * @param {string} params.term - Filter by term
 * @param {string} params.search - Search term
 * @returns {Promise<Object>} - All matching school fee payments
 */
export const getAllSchoolFeePayments = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.studentId !== undefined) queryParams.append('studentId', params.studentId);
  if (params.academicYear) queryParams.append('academicYear', params.academicYear);
  if (params.term) queryParams.append('term', params.term);
  if (params.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/all${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get a single school fee payment by ID
 * @param {number} id - School fee payment ID
 * @returns {Promise<Object>} - School fee payment object
 */
export const getSchoolFeePaymentById = async (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Get school fee payments by student ID
 * @param {number} studentId - Student ID
 * @returns {Promise<Object>} - School fee payments for the student
 */
export const getSchoolFeePaymentsByStudent = async (studentId) => {
  return api.get(`${BASE_URL}/student/${studentId}`);
};

/**
 * Get a student's current school fee balance
 * @param {number} studentId - Student ID
 * @returns {Promise<Object>} - Balance information
 */
export const getStudentSchoolFeeBalance = async (studentId) => {
  return api.get(`${BASE_URL}/balance/${studentId}`);
};

/**
 * Get all students in arrears
 * @param {Object} params - Query parameters
 * @param {string} params.academicYear - Filter by academic year
 * @param {string} params.term - Filter by term
 * @returns {Promise<Object>} - Students in arrears
 */
export const getStudentsInArrears = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.academicYear) queryParams.append('academicYear', params.academicYear);
  if (params.term) queryParams.append('term', params.term);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/arrears${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get school fee statistics
 * @param {Object} params - Query parameters
 * @param {string} params.academicYear - Filter by academic year
 * @param {string} params.term - Filter by term
 * @returns {Promise<Object>} - School fee statistics
 */
export const getSchoolFeeStatistics = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.academicYear) queryParams.append('academicYear', params.academicYear);
  if (params.term) queryParams.append('term', params.term);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/statistics${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get school fee summary for dashboard
 * @returns {Promise<Object>} - Summary data for dashboard
 */
export const getSchoolFeeSummary = async () => {
  return api.get(`${BASE_URL}/summary`);
};

/**
 * Create a new school fee payment
 * @param {Object} paymentData - School fee payment data
 * @param {number} paymentData.studentId - Student ID (required)
 * @param {number} paymentData.amount - Amount paid (required)
 * @param {string} paymentData.paymentDate - Payment date (YYYY-MM-DD) (required)
 * @param {string} paymentData.academicYear - Academic year (required)
 * @param {string} paymentData.term - Term (Term 1, Term 2, Term 3) (required)
 * @param {number} paymentData.paymentMethodId - Payment method ID
 * @param {string} paymentData.description - Description
 * @param {string} paymentData.notes - Notes
 * @param {number} paymentData.createdBy - User ID who created the record
 * @returns {Promise<Object>} - Created school fee payment
 */
export const createSchoolFeePayment = async (paymentData) => {
  return api.post(BASE_URL, paymentData);
};

/**
 * Update a school fee payment
 * @param {number} id - School fee payment ID
 * @param {Object} paymentData - School fee payment data to update
 * @param {number} paymentData.studentId - Student ID
 * @param {number} paymentData.transactionId - Transaction ID
 * @param {number} paymentData.amount - Amount paid
 * @param {string} paymentData.paymentDate - Payment date (YYYY-MM-DD)
 * @param {string} paymentData.academicYear - Academic year
 * @param {string} paymentData.term - Term
 * @param {string} paymentData.notes - Notes
 * @param {number} paymentData.updatedBy - User ID who updated the record
 * @returns {Promise<Object>} - Updated school fee payment
 */
export const updateSchoolFeePayment = async (id, paymentData) => {
  return api.put(`${BASE_URL}/${id}`, paymentData);
};

/**
 * Delete a school fee payment
 * @param {number} id - School fee payment ID
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteSchoolFeePayment = async (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

// Export all functions
export default {
  getSchoolFeePayments,
  getAllSchoolFeePayments,
  getSchoolFeePaymentById,
  getSchoolFeePaymentsByStudent,
  getStudentSchoolFeeBalance,
  getStudentsInArrears,
  getSchoolFeeStatistics,
  getSchoolFeeSummary,
  createSchoolFeePayment,
  updateSchoolFeePayment,
  deleteSchoolFeePayment
};

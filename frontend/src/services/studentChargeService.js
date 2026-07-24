/**
 * Student Charge Service
 * API client for student charge management operations
 * Centralizes all student charge-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for student charge API endpoints
 */
const BASE_URL = '/charges';

/**
 * Get paginated list of student charges
 * @param {Object} params - Query parameters
 * @param {string} params.name - Filter by charge name
 * @param {string} params.chargeType - Filter by charge type (individual, all, class, grade, custom)
 * @param {number} params.classId - Filter by class ID
 * @param {boolean} params.isActive - Filter by active status
 * @param {string} params.search - Search term for name or description
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction (ASC/DESC)
 * @returns {Promise<Object>} - Paginated result with charges and metadata
 */
export const getStudentCharges = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.name !== undefined) queryParams.append('name', params.name);
  if (params.chargeType !== undefined) queryParams.append('chargeType', params.chargeType);
  if (params.classId !== undefined) queryParams.append('classId', params.classId);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  if (params.search) queryParams.append('search', params.search);
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;

  return api.get(url);
};

/**
 * Get all student charges without pagination
 * @param {Object} params - Query parameters (same as getStudentCharges)
 * @returns {Promise<Array>} - Array of all student charges
 */
export const getAllStudentCharges = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.name !== undefined) queryParams.append('name', params.name);
  if (params.chargeType !== undefined) queryParams.append('chargeType', params.chargeType);
  if (params.classId !== undefined) queryParams.append('classId', params.classId);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  if (params.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/all${queryString ? `?${queryString}` : ''}`;

  return api.get(url);
};

/**
 * Get a single student charge by ID
 * @param {number} id - Student charge ID
 * @returns {Promise<Object>} - Student charge object with assignments
 */
export const getStudentChargeById = async (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Get student charges by class ID
 * @param {number} classId - Class ID
 * @param {Object} params - Additional query parameters
 * @param {boolean} params.isActive - Filter by active status (default: true)
 * @returns {Promise<Array>} - Array of charges for the class
 */
export const getStudentChargesByClass = async (classId, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/class/${classId}${queryString ? `?${queryString}` : ''}`;
  return api.get(url);
};

/**
 * Get active student charges
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - Array of active student charges
 */
export const getActiveStudentCharges = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.name) queryParams.append('name', params.name);
  if (params.chargeType) queryParams.append('chargeType', params.chargeType);
  if (params.classId) queryParams.append('classId', params.classId);
  if (params.search) queryParams.append('search', params.search);
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/active${queryString ? `?${queryString}` : ''}`;
  return api.get(url);
};

/**
 * Get student charge statistics
 * @returns {Promise<Object>} - Statistics object
 */
export const getStudentChargeStatistics = async () => {
  return api.get(`${BASE_URL}/statistics`);
};

/**
 * Create a new student charge
 * @param {Object} chargeData - Student charge data
 * @param {string} chargeData.name - Charge name (required)
 * @param {string} chargeData.description - Description
 * @param {number} chargeData.amount - Amount (required, > 0)
 * @param {string} chargeData.chargeType - Charge type (individual, all, class, grade, custom)
 * @param {number} chargeData.classId - Class ID (for class-wide charges)
 * @param {string} chargeData.dueDate - Due date (YYYY-MM-DD)
 * @param {boolean} chargeData.isActive - Is active (default: true)
 * @returns {Promise<Object>} - Created student charge
 */
export const createStudentCharge = async (chargeData) => {
  return api.post(BASE_URL, chargeData);
};

/**
 * Update a student charge
 * @param {number} id - Student charge ID
 * @param {Object} chargeData - Updated charge data
 * @returns {Promise<Object>} - Updated student charge
 */
export const updateStudentCharge = async (id, chargeData) => {
  return api.put(`${BASE_URL}/${id}`, chargeData);
};

/**
 * Delete a student charge
 * @param {number} id - Student charge ID
 * @returns {Promise<Object>} - Success message
 */
export const deleteStudentCharge = async (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

/**
 * Force delete a student charge and all its assignments
 * @param {number} id - Student charge ID
 * @returns {Promise<Object>} - Success message
 */
export const forceDeleteStudentCharge = async (id) => {
  return api.delete(`${BASE_URL}/${id}/force`);
};

/**
 * Assign a charge to specific students
 * @param {number} chargeId - Charge ID
 * @param {Object} assignmentData - Assignment data
 * @param {Array<number>} assignmentData.studentIds - Array of student IDs (required)
 * @param {number} assignmentData.amount - Amount (optional, defaults to charge amount)
 * @param {string} assignmentData.notes - Notes (optional)
 * @returns {Promise<Object>} - Created assignments
 */
export const assignChargeToStudents = async (chargeId, assignmentData) => {
  return api.post(`${BASE_URL}/${chargeId}/assign`, assignmentData);
};

/**
 * Get charges for a specific student
 * @param {number} studentId - Student ID
 * @returns {Promise<Array>} - Array of charges assigned to the student
 */
export const getChargesForStudent = async (studentId) => {
  return api.get(`${BASE_URL}/student/${studentId}`);
};

/**
 * Get unpaid charges for a specific student
 * @param {number} studentId - Student ID
 * @returns {Promise<Array>} - Array of unpaid charges for the student
 */
export const getUnpaidChargesForStudent = async (studentId) => {
  return api.get(`${BASE_URL}/student/${studentId}/unpaid`);
};

/**
 * Get the total outstanding charge amount for a student
 * @param {number} studentId - Student ID
 * @returns {Promise<Object>} - Object with outstandingAmount
 */
export const getStudentOutstandingChargeAmount = async (studentId) => {
  return api.get(`${BASE_URL}/student/${studentId}/outstanding`);
};

// ============================================
// Student Charge Assignment Service Functions
// ============================================

/**
 * Base URL for student charge assignment API endpoints
 */
const ASSIGNMENTS_BASE_URL = '/charges/assignments';

/**
 * Get paginated list of student charge assignments
 * @param {Object} params - Query parameters
 * @param {number} params.chargeId - Filter by charge ID
 * @param {number} params.studentId - Filter by student ID
 * @param {boolean} params.paid - Filter by payment status
 * @param {number} params.classId - Filter by student's class
 * @param {string} params.search - Search term
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction (ASC/DESC)
 * @returns {Promise<Object>} - Paginated result with assignments and metadata
 */
export const getStudentChargeAssignments = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.chargeId !== undefined) queryParams.append('chargeId', params.chargeId);
  if (params.studentId !== undefined) queryParams.append('studentId', params.studentId);
  if (params.paid !== undefined) queryParams.append('paid', params.paid);
  if (params.classId !== undefined) queryParams.append('classId', params.classId);
  if (params.search) queryParams.append('search', params.search);
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${ASSIGNMENTS_BASE_URL}${queryString ? `?${queryString}` : ''}`;

  return api.get(url);
};

/**
 * Get all student charge assignments without pagination
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} - Array of all assignments
 */
export const getAllStudentChargeAssignments = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.chargeId !== undefined) queryParams.append('chargeId', params.chargeId);
  if (params.studentId !== undefined) queryParams.append('studentId', params.studentId);
  if (params.paid !== undefined) queryParams.append('paid', params.paid);
  if (params.classId !== undefined) queryParams.append('classId', params.classId);
  if (params.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const url = `${ASSIGNMENTS_BASE_URL}/all${queryString ? `?${queryString}` : ''}`;

  return api.get(url);
};

/**
 * Get a single assignment by ID
 * @param {number} id - Assignment ID
 * @returns {Promise<Object>} - Assignment object with charge details
 */
export const getStudentChargeAssignmentById = async (id) => {
  return api.get(`${ASSIGNMENTS_BASE_URL}/${id}`);
};

/**
 * Get assignments by charge ID
 * @param {number} chargeId - Charge ID
 * @param {Object} params - Additional query parameters
 * @param {boolean} params.paid - Filter by payment status
 * @returns {Promise<Array>} - Array of assignments for the charge
 */
export const getStudentChargeAssignmentsByCharge = async (chargeId, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.paid !== undefined) queryParams.append('paid', params.paid);
  const queryString = queryParams.toString();
  const url = `${ASSIGNMENTS_BASE_URL}/charge/${chargeId}${queryString ? `?${queryString}` : ''}`;
  return api.get(url);
};

/**
 * Get assignments by student ID
 * @param {number} studentId - Student ID
 * @param {Object} params - Additional query parameters
 * @param {boolean} params.paid - Filter by payment status
 * @returns {Promise<Array>} - Array of assignments for the student
 */
export const getStudentChargeAssignmentsByStudent = async (studentId, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.paid !== undefined) queryParams.append('paid', params.paid);
  const queryString = queryParams.toString();
  const url = `${ASSIGNMENTS_BASE_URL}/student/${studentId}${queryString ? `?${queryString}` : ''}`;
  return api.get(url);
};

/**
 * Get unpaid assignments for a student
 * @param {number} studentId - Student ID
 * @returns {Promise<Array>} - Array of unpaid assignments
 */
export const getUnpaidStudentChargeAssignmentsByStudent = async (studentId) => {
  return api.get(`${ASSIGNMENTS_BASE_URL}/student/${studentId}/unpaid`);
};

/**
 * Get unpaid assignments by charge ID
 * @param {number} chargeId - Charge ID
 * @returns {Promise<Array>} - Array of unpaid assignments
 */
export const getUnpaidStudentChargeAssignmentsByCharge = async (chargeId) => {
  return api.get(`${ASSIGNMENTS_BASE_URL}/charge/${chargeId}/unpaid`);
};

/**
 * Create a new student charge assignment
 * @param {Object} assignmentData - Assignment data
 * @param {number} assignmentData.chargeId - Charge ID (required)
 * @param {number} assignmentData.studentId - Student ID (required)
 * @param {number} assignmentData.amount - Amount (optional, defaults to charge amount)
 * @param {string} assignmentData.notes - Notes (optional)
 * @returns {Promise<Object>} - Created assignment
 */
export const createStudentChargeAssignment = async (assignmentData) => {
  return api.post(ASSIGNMENTS_BASE_URL, assignmentData);
};

/**
 * Create multiple student charge assignments
 * @param {Array<Object>} assignments - Array of assignment data objects
 * @returns {Promise<Array>} - Array of created assignments
 */
export const createMultipleStudentChargeAssignments = async (assignments) => {
  return api.post(`${ASSIGNMENTS_BASE_URL}/bulk`, { assignments });
};

/**
 * Update a student charge assignment
 * @param {number} id - Assignment ID
 * @param {Object} assignmentData - Updated assignment data
 * @returns {Promise<Object>} - Updated assignment
 */
export const updateStudentChargeAssignment = async (id, assignmentData) => {
  return api.put(`${ASSIGNMENTS_BASE_URL}/${id}`, assignmentData);
};

/**
 * Mark an assignment as paid
 * @param {number} id - Assignment ID
 * @param {Object} paymentData - Payment data
 * @param {number} paymentData.amount - Amount paid (optional)
 * @param {string} paymentData.paymentMethod - Payment method (optional)
 * @param {number} paymentData.paymentMethodId - Payment method ID (optional)
 * @param {string} paymentData.reference - Payment reference (optional)
 * @param {string} paymentData.notes - Payment notes (optional)
 * @returns {Promise<Object>} - Updated assignment with transaction and receipt
 */
export const markAssignmentAsPaid = async (id, paymentData = {}) => {
  return api.post(`${ASSIGNMENTS_BASE_URL}/${id}/pay`, paymentData);
};

/**
 * Mark an assignment as unpaid
 * @param {number} id - Assignment ID
 * @returns {Promise<Object>} - Updated assignment
 */
export const markAssignmentAsUnpaid = async (id) => {
  return api.post(`${ASSIGNMENTS_BASE_URL}/${id}/unpay`);
};

/**
 * Delete a student charge assignment
 * @param {number} id - Assignment ID
 * @returns {Promise<Object>} - Success message
 */
export const deleteStudentChargeAssignment = async (id) => {
  return api.delete(`${ASSIGNMENTS_BASE_URL}/${id}`);
};

/**
 * Delete all assignments for a charge
 * @param {number} chargeId - Charge ID
 * @returns {Promise<Object>} - Success message with deleted count
 */
export const deleteStudentChargeAssignmentsByCharge = async (chargeId) => {
  return api.delete(`${ASSIGNMENTS_BASE_URL}/charge/${chargeId}`);
};

/**
 * Get assignment statistics
 * @param {Object} params - Query parameters
 * @param {number} params.chargeId - Filter by charge ID
 * @returns {Promise<Object>} - Statistics object
 */
export const getStudentChargeAssignmentStatistics = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.chargeId !== undefined) queryParams.append('chargeId', params.chargeId);
  const queryString = queryParams.toString();
  const url = `${ASSIGNMENTS_BASE_URL}/statistics${queryString ? `?${queryString}` : ''}`;
  return api.get(url);
};

/**
 * Check if a student has been assigned a specific charge
 * @param {number} chargeId - Charge ID
 * @param {number} studentId - Student ID
 * @returns {Promise<Object>} - Object with isAssigned boolean
 */
export const isStudentAssignedToCharge = async (chargeId, studentId) => {
  return api.get(`${ASSIGNMENTS_BASE_URL}/check?chargeId=${chargeId}&studentId=${studentId}`);
};

/**
 * Get the total outstanding charge amount for a student
 * @param {number} studentId - Student ID
 * @returns {Promise<Object>} - Object with outstandingAmount
 */
export const getStudentOutstandingAmount = async (studentId) => {
  return api.get(`${ASSIGNMENTS_BASE_URL}/student/${studentId}/outstanding`);
};

/**
 * Get summary of all outstanding student charges
 * @returns {Promise<Object>} - Summary object with totals
 */
export const getOutstandingChargesSummary = async () => {
  return api.get(`${ASSIGNMENTS_BASE_URL}/outstanding/summary`);
};

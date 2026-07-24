/**
 * Student Charge Service
 * API client for student charge management operations
 * Centralizes all student charge-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for student charge API endpoints
 */
const BASE_URL = '/student-charges';

// ============================================
// Student Charge API Calls
// ============================================

/**
 * Get paginated list of student charges
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {string} params.name - Filter by charge name
 * @param {string} params.chargeType - Filter by charge type
 * @param {number} params.classId - Filter by class ID
 * @param {boolean} params.isActive - Filter by active status
 * @param {string} params.search - Search term
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - Paginated result with student charges and metadata
 */
export const getStudentCharges = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.name) queryParams.append('name', params.name);
  if (params.chargeType) queryParams.append('chargeType', params.chargeType);
  if (params.classId !== undefined) queryParams.append('classId', params.classId);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  if (params.search) queryParams.append('search', params.search);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get all student charges without pagination
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - All matching student charges
 */
export const getAllStudentCharges = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.name) queryParams.append('name', params.name);
  if (params.chargeType) queryParams.append('chargeType', params.chargeType);
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
 * @returns {Promise<Object>} - Student charge object
 */
export const getStudentChargeById = async (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Get student charges by class ID
 * @param {number} classId - Class ID
 * @returns {Promise<Object>} - Student charges for the class
 */
export const getStudentChargesByClassId = async (classId) => {
  return api.get(`${BASE_URL}/class/${classId}`);
};

/**
 * Get active student charges
 * @returns {Promise<Object>} - Active student charges
 */
export const getActiveStudentCharges = async () => {
  return api.get(`${BASE_URL}/active`);
};

/**
 * Get upcoming student charges
 * @param {number} days - Number of days to look ahead
 * @returns {Promise<Object>} - Upcoming student charges
 */
export const getUpcomingStudentCharges = async (days = 7) => {
  return api.get(`${BASE_URL}/upcoming?days=${days}`);
};

/**
 * Get overdue student charges
 * @returns {Promise<Object>} - Overdue student charges
 */
export const getOverdueStudentCharges = async () => {
  return api.get(`${BASE_URL}/overdue`);
};

/**
 * Get student charge statistics
 * @returns {Promise<Object>} - Student charge statistics
 */
export const getStudentChargeStatistics = async () => {
  return api.get(`${BASE_URL}/statistics`);
};

/**
 * Create a new student charge
 * @param {Object} chargeData - Student charge data
 * @returns {Promise<Object>} - Created student charge
 */
export const createStudentCharge = async (chargeData) => {
  return api.post(`${BASE_URL}`, chargeData);
};

/**
 * Create a student charge and assign it to students
 * @param {Object} data - Request data
 * @param {Object} data.charge - Student charge data
 * @param {Array<number>} data.studentIds - Array of student IDs
 * @param {number} data.createdBy - User ID who created the record
 * @returns {Promise<Object>} - Created charge with assignments
 */
export const createStudentChargeWithAssignments = async (data) => {
  return api.post(`${BASE_URL}/with-assignments`, data);
};

/**
 * Update an existing student charge
 * @param {number} id - Student charge ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated student charge
 */
export const updateStudentCharge = async (id, updates) => {
  return api.put(`${BASE_URL}/${id}`, updates);
};

/**
 * Delete a student charge
 * @param {number} id - Student charge ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteStudentCharge = async (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

// ============================================
// Student Charge Assignment API Calls
// ============================================

/**
 * Get paginated list of student charge assignments
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {number} params.chargeId - Filter by charge ID
 * @param {number} params.studentId - Filter by student ID
 * @param {number} params.classId - Filter by class ID
 * @param {string} params.search - Search term
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - Paginated result with assignments and metadata
 */
export const getStudentChargeAssignments = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.chargeId !== undefined) queryParams.append('chargeId', params.chargeId);
  if (params.studentId !== undefined) queryParams.append('studentId', params.studentId);
  if (params.classId !== undefined) queryParams.append('classId', params.classId);
  if (params.search) queryParams.append('search', params.search);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/assignments${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get all student charge assignments without pagination
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - All matching student charge assignments
 */
export const getAllStudentChargeAssignments = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.chargeId !== undefined) queryParams.append('chargeId', params.chargeId);
  if (params.studentId !== undefined) queryParams.append('studentId', params.studentId);
  if (params.classId !== undefined) queryParams.append('classId', params.classId);
  if (params.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/assignments/all${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get a single student charge assignment by ID
 * @param {number} id - Student charge assignment ID
 * @returns {Promise<Object>} - Student charge assignment
 */
export const getStudentChargeAssignmentById = async (id) => {
  return api.get(`${BASE_URL}/assignments/${id}`);
};

/**
 * Get student charge assignments by charge ID
 * @param {number} chargeId - Charge ID
 * @returns {Promise<Object>} - Assignments for the charge
 */
export const getStudentChargeAssignmentsByChargeId = async (chargeId) => {
  return api.get(`${BASE_URL}/assignments/charge/${chargeId}`);
};

/**
 * Get student charge assignments by student ID
 * @param {number} studentId - Student ID
 * @returns {Promise<Object>} - Assignments for the student
 */
export const getStudentChargeAssignmentsByStudentId = async (studentId) => {
  return api.get(`${BASE_URL}/assignments/student/${studentId}`);
};

/**
 * Get student charge assignments by class ID
 * @param {number} classId - Class ID
 * @returns {Promise<Object>} - Assignments for the class
 */
export const getStudentChargeAssignmentsByClassId = async (classId) => {
  return api.get(`${BASE_URL}/assignments/class/${classId}`);
};

/**
 * Get unpaid student charge assignments
 * @returns {Promise<Object>} - Unpaid assignments
 */
export const getUnpaidStudentChargeAssignments = async () => {
  return api.get(`${BASE_URL}/assignments/unpaid`);
};

/**
 * Get student charge assignment statistics
 * @returns {Promise<Object>} - Assignment statistics
 */
export const getStudentChargeAssignmentStatistics = async () => {
  return api.get(`${BASE_URL}/assignments/statistics`);
};

/**
 * Check if a student has been assigned a specific charge
 * @param {number} chargeId - Charge ID
 * @param {number} studentId - Student ID
 * @returns {Promise<Object>} - Result with isAssigned boolean
 */
export const isStudentAssignedToCharge = async (chargeId, studentId) => {
  return api.get(`${BASE_URL}/assignments/check/${chargeId}/${studentId}`);
};

/**
 * Create a new student charge assignment
 * @param {Object} assignment - Assignment data
 * @returns {Promise<Object>} - Created assignment
 */
export const createStudentChargeAssignment = async (assignment) => {
  return api.post(`${BASE_URL}/assignments`, assignment);
};

/**
 * Create multiple student charge assignments at once
 * @param {Array<Object>} assignments - Array of assignment objects
 * @returns {Promise<Object>} - Created assignments
 */
export const createBulkStudentChargeAssignments = async (assignments) => {
  return api.post(`${BASE_URL}/assignments/bulk`, { assignments });
};

/**
 * Assign a charge to all students in a class
 * @param {number} chargeId - Charge ID
 * @param {number} classId - Class ID
 * @param {number} createdBy - User ID who created the assignments
 * @returns {Promise<Object>} - Created assignments
 */
export const assignChargeToClass = async (chargeId, classId, createdBy) => {
  return api.post(`${BASE_URL}/assignments/assign-to-class`, { chargeId, classId, createdBy });
};

/**
 * Assign a charge to all students in the school
 * @param {number} chargeId - Charge ID
 * @param {number} createdBy - User ID who created the assignments
 * @returns {Promise<Object>} - Created assignments
 */
export const assignChargeToAllStudents = async (chargeId, createdBy) => {
  return api.post(`${BASE_URL}/assignments/assign-to-all`, { chargeId, createdBy });
};

/**
 * Update an existing student charge assignment
 * @param {number} id - Assignment ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated assignment
 */
export const updateStudentChargeAssignment = async (id, updates) => {
  return api.put(`${BASE_URL}/assignments/${id}`, updates);
};

/**
 * Delete a student charge assignment
 * @param {number} id - Assignment ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteStudentChargeAssignment = async (id) => {
  return api.delete(`${BASE_URL}/assignments/${id}`);
};

// ============================================
// Payment API Calls
// ============================================

/**
 * Record a payment for a student charge assignment
 * @param {number} id - Assignment ID
 * @param {Object} paymentData - Payment data
 * @param {number} paymentData.amount - Payment amount
 * @param {string} paymentData.paymentDate - Payment date (YYYY-MM-DD)
 * @param {number} paymentData.paymentMethodId - Payment method ID
 * @param {number} paymentData.createdBy - User ID who created the record
 * @returns {Promise<Object>} - Payment result
 */
export const recordStudentChargePayment = async (id, paymentData) => {
  return api.post(`${BASE_URL}/assignments/${id}/pay`, paymentData);
};

// ============================================
// Summary API Calls
// ============================================

/**
 * Get student charge summary for a student
 * @param {number} studentId - Student ID
 * @returns {Promise<Object>} - Charge summary for the student
 */
export const getStudentChargeSummary = async (studentId) => {
  return api.get(`${BASE_URL}/summary/${studentId}`);
};

export default {
  // Student Charge API
  getStudentCharges,
  getAllStudentCharges,
  getStudentChargeById,
  getStudentChargesByClassId,
  getActiveStudentCharges,
  getUpcomingStudentCharges,
  getOverdueStudentCharges,
  getStudentChargeStatistics,
  createStudentCharge,
  createStudentChargeWithAssignments,
  updateStudentCharge,
  deleteStudentCharge,
  
  // Student Charge Assignment API
  getStudentChargeAssignments,
  getAllStudentChargeAssignments,
  getStudentChargeAssignmentById,
  getStudentChargeAssignmentsByChargeId,
  getStudentChargeAssignmentsByStudentId,
  getStudentChargeAssignmentsByClassId,
  getUnpaidStudentChargeAssignments,
  getStudentChargeAssignmentStatistics,
  isStudentAssignedToCharge,
  createStudentChargeAssignment,
  createBulkStudentChargeAssignments,
  assignChargeToClass,
  assignChargeToAllStudents,
  updateStudentChargeAssignment,
  deleteStudentChargeAssignment,
  
  // Payment API
  recordStudentChargePayment,
  
  // Summary API
  getStudentChargeSummary
};

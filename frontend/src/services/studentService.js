/**
 * Student Service
 * API client for student management operations
 * Centralizes all student-related API calls
 */

import { api } from './api.js';

/**
 * Base URL for student API endpoints
 */
const BASE_URL = '/students';

/**
 * Get paginated list of students
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.pageSize - Items per page
 * @param {string} params.search - Search term
 * @param {number} params.classId - Filter by class ID
 * @param {string} params.status - Filter by status
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - Paginated result with students and metadata
 */
export const getStudents = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.search) queryParams.append('search', params.search);
  if (params.classId) queryParams.append('classId', params.classId);
  if (params.status) queryParams.append('status', params.status);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);

  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  return api.get(url);
};

/**
 * Get all students without pagination
 * @returns {Promise<Array>} - Array of all students
 */
export const getAllStudents = async () => {
  return api.get(`${BASE_URL}/all`);
};

/**
 * Get a single student by ID
 * @param {number} id - Student ID
 * @returns {Promise<Object>} - Student object
 */
export const getStudentById = async (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

/**
 * Get a student by admission number
 * @param {string} admissionNumber - Admission number
 * @returns {Promise<Object>} - Student object
 */
export const getStudentByAdmissionNumber = async (admissionNumber) => {
  return api.get(`${BASE_URL}/admission/${admissionNumber}`);
};

/**
 * Create a new student
 * @param {Object} studentData - Student data
 * @returns {Promise<Object>} - Created student
 */
export const createStudent = async (studentData) => {
  return api.post(BASE_URL, studentData);
};

/**
 * Update a student (full update)
 * @param {number} id - Student ID
 * @param {Object} studentData - Complete student data
 * @returns {Promise<Object>} - Updated student
 */
export const updateStudent = async (id, studentData) => {
  return api.put(`${BASE_URL}/${id}`, studentData);
};

/**
 * Partially update a student
 * @param {number} id - Student ID
 * @param {Object} studentData - Partial student data
 * @returns {Promise<Object>} - Updated student
 */
export const patchStudent = async (id, studentData) => {
  return api.patch(`${BASE_URL}/${id}`, studentData);
};

/**
 * Delete a student
 * @param {number} id - Student ID
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteStudent = async (id) => {
  return api.delete(`${BASE_URL}/${id}`);
};

/**
 * Get students by class
 * @param {number} classId - Class ID
 * @returns {Promise<Array>} - Students in the class
 */
export const getStudentsByClass = async (classId) => {
  return api.get(`${BASE_URL}/class/${classId}`);
};

/**
 * Search students
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Matching students
 */
export const searchStudents = async (query) => {
  return api.get(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
};

/**
 * Get student statistics
 * @returns {Promise<Object>} - Student statistics
 */
export const getStudentStatistics = async () => {
  return api.get(`${BASE_URL}/statistics`);
};

/**
 * Get student summary for dashboard
 * @returns {Promise<Object>} - Summary data
 */
export const getStudentSummary = async () => {
  return api.get(`${BASE_URL}/summary`);
};

/**
 * Check if admission number is available
 * @param {string} admissionNumber - Admission number to check
 * @returns {Promise<Object>} - Availability status
 */
export const checkAdmissionNumber = async (admissionNumber) => {
  return api.get(`${BASE_URL}/check-admission/${admissionNumber}`);
};

/**
 * Get students in arrears
 * @returns {Promise<Array>} - Students with negative balances
 */
export const getStudentsInArrears = async () => {
  const allStudents = await getAllStudents();
  return allStudents.filter(s => (s.balance || 0) < 0);
};

/**
 * Get students by status
 * @param {string} status - Status filter (Active, Inactive, Graduated, Transferred)
 * @returns {Promise<Array>} - Students with matching status
 */
export const getStudentsByStatus = async (status) => {
  return api.get(`${BASE_URL}/all?status=${status}`);
};

// Export all functions
export default {
  getStudents,
  getAllStudents,
  getStudentById,
  getStudentByAdmissionNumber,
  createStudent,
  updateStudent,
  patchStudent,
  deleteStudent,
  getStudentsByClass,
  searchStudents,
  getStudentStatistics,
  getStudentSummary,
  checkAdmissionNumber,
  getStudentsInArrears,
  getStudentsByStatus
};

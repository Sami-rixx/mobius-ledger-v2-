import * as StudentModel from '../models/Student.js';
import db from '../config/database.js';

/**
 * Student Service
 * Business logic layer for student management
 * 
 * Handles:
 * - Business rule validation
 * - Data transformation
 * - Complex queries
 * - Transaction management
 * - Audit trail (future)
 */

/**
 * Get paginated list of students
 * @param {Object} options - Filter and pagination options
 * @param {string} options.search - Search term
 * @param {number} options.classId - Filter by class
 * @param {string} options.status - Filter by status
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction
 * @returns {Object} - Paginated result with students and metadata
 */
export const getPaginatedStudents = (options = {}) => {
  const {
    search,
    classId,
    status,
    page = 1,
    pageSize = 20,
    orderBy = 'last_name, first_name',
    orderDir = 'ASC'
  } = options;

  const offset = (page - 1) * pageSize;

  // Get students
  const students = StudentModel.getAllStudents({
    search,
    classId,
    status,
    limit: pageSize,
    offset,
    orderBy,
    orderDir
  });

  // Get total count
  const total = StudentModel.getStudentCount({ search, classId, status });

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    data: students,
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
 * Get all students (no pagination)
 * @param {Object} options - Filter options
 * @returns {Array} - Array of students
 */
export const getAllStudents = (options = {}) => {
  return StudentModel.getAllStudents(options);
};

/**
 * Get a single student by ID with enhanced data
 * @param {number} id - Student ID
 * @returns {Object|null} - Student with additional computed fields
 */
export const getStudentById = (id) => {
  const student = StudentModel.getStudentById(id);
  
  if (!student) {
    return null;
  }

  // Add computed fields
  return {
    ...student,
    full_name: `${student.first_name} ${student.last_name}`.trim(),
    display_name: `${student.last_name}, ${student.first_name}`
  };
};

/**
 * Get a student by admission number
 * @param {string} admissionNumber - Admission number
 * @returns {Object|null} - Student object
 */
export const getStudentByAdmissionNumber = (admissionNumber) => {
  return StudentModel.getStudentByAdmissionNumber(admissionNumber);
};

/**
 * Create a new student
 * @param {Object} studentData - Student data
 * @param {number} createdBy - User ID creating the record
 * @returns {Object} - Created student
 * @throws {Error} - If validation fails
 */
export const createStudent = (studentData, createdBy = null) => {
  // Normalize data
  const normalizedData = {
    ...studentData,
    admission_number: studentData.admission_number?.trim()?.toUpperCase(),
    first_name: studentData.first_name?.trim(),
    last_name: studentData.last_name?.trim(),
    parent_name: studentData.parent_name?.trim(),
    parent_phone: studentData.parent_phone?.trim(),
    parent_email: studentData.parent_email?.trim()?.toLowerCase(),
    address: studentData.address?.trim(),
    gender: studentData.gender?.charAt(0).toUpperCase() + studentData.gender?.slice(1).toLowerCase(),
    status: studentData.status?.charAt(0).toUpperCase() + studentData.status?.slice(1).toLowerCase()
  };

  // Validate phone number format (Kenyan)
  if (normalizedData.parent_phone) {
    const phoneRegex = /^(\+254|0)[1-9]\d{8,9}$/;
    if (!phoneRegex.test(normalizedData.parent_phone.replace(/\s/g, ''))) {
      throw new Error(`Invalid phone number format: ${normalizedData.parent_phone}`);
    }
  }

  // Validate email format
  if (normalizedData.parent_email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedData.parent_email)) {
      throw new Error(`Invalid email format: ${normalizedData.parent_email}`);
    }
  }

  // Validate date of birth (if provided)
  if (normalizedData.date_of_birth) {
    const dob = new Date(normalizedData.date_of_birth);
    if (isNaN(dob.getTime())) {
      throw new Error(`Invalid date of birth: ${normalizedData.date_of_birth}`);
    }
    
    // Check if date is in the future
    if (dob > new Date()) {
      throw new Error('Date of birth cannot be in the future');
    }
  }

  // Validate class exists
  if (normalizedData.class_id) {
    const classCheck = db.prepare('SELECT id FROM classes WHERE id = ?').get(normalizedData.class_id);
    if (!classCheck) {
      throw new Error(`Class with ID ${normalizedData.class_id} does not exist`);
    }
  }

  return StudentModel.createStudent(normalizedData, createdBy);
};

/**
 * Update a student
 * @param {number} id - Student ID
 * @param {Object} studentData - Student data to update
 * @param {number} updatedBy - User ID updating the record
 * @returns {Object} - Updated student
 * @throws {Error} - If validation fails
 */
export const updateStudent = (id, studentData, updatedBy = null) => {
  // Check if student exists
  const existing = StudentModel.getStudentById(id);
  if (!existing) {
    throw new Error(`Student not found with ID: ${id}`);
  }

  // Normalize data
  const normalizedData = {
    ...studentData,
    first_name: studentData.first_name?.trim(),
    last_name: studentData.last_name?.trim(),
    parent_name: studentData.parent_name?.trim(),
    parent_phone: studentData.parent_phone?.trim(),
    parent_email: studentData.parent_email?.trim()?.toLowerCase(),
    address: studentData.address?.trim(),
    gender: studentData.gender?.charAt(0).toUpperCase() + studentData.gender?.slice(1).toLowerCase(),
    status: studentData.status?.charAt(0).toUpperCase() + studentData.status?.slice(1).toLowerCase()
  };

  // Validate phone number format (Kenyan)
  if (normalizedData.parent_phone) {
    const phoneRegex = /^(\+254|0)[1-9]\d{8,9}$/;
    if (!phoneRegex.test(normalizedData.parent_phone.replace(/\s/g, ''))) {
      throw new Error(`Invalid phone number format: ${normalizedData.parent_phone}`);
    }
  }

  // Validate email format
  if (normalizedData.parent_email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedData.parent_email)) {
      throw new Error(`Invalid email format: ${normalizedData.parent_email}`);
    }
  }

  // Validate date of birth (if provided)
  if (normalizedData.date_of_birth) {
    const dob = new Date(normalizedData.date_of_birth);
    if (isNaN(dob.getTime())) {
      throw new Error(`Invalid date of birth: ${normalizedData.date_of_birth}`);
    }
    
    // Check if date is in the future
    if (dob > new Date()) {
      throw new Error('Date of birth cannot be in the future');
    }
  }

  // Validate class exists (if provided)
  if (normalizedData.class_id !== undefined) {
    const classCheck = db.prepare('SELECT id FROM classes WHERE id = ?').get(normalizedData.class_id);
    if (!classCheck) {
      throw new Error(`Class with ID ${normalizedData.class_id} does not exist`);
    }
  }

  return StudentModel.updateStudent(id, normalizedData, updatedBy);
};

/**
 * Delete a student
 * @param {number} id - Student ID
 * @param {number} deletedBy - User ID deleting the record
 * @returns {boolean} - True if deleted
 * @throws {Error} - If student has associated records
 */
export const deleteStudent = (id, deletedBy = null) => {
  return StudentModel.deleteStudent(id, deletedBy);
};

/**
 * Get students by class
 * @param {number} classId - Class ID
 * @returns {Array} - Students in the class
 */
export const getStudentsByClass = (classId) => {
  return StudentModel.getStudentsByClass(classId);
};

/**
 * Search students
 * @param {string} searchTerm - Search term
 * @returns {Array} - Matching students
 */
export const searchStudents = (searchTerm) => {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return [];
  }
  return StudentModel.searchStudents(searchTerm.trim());
};

/**
 * Get student statistics
 * @returns {Object} - Student statistics
 */
export const getStudentStatistics = () => {
  const total = StudentModel.getStudentCount();
  const active = StudentModel.getActiveStudentCount();

  // Get count by class
  const byClass = db.prepare(`
    SELECT c.id, c.name, COUNT(s.id) as count 
    FROM classes c 
    LEFT JOIN students s ON c.id = s.class_id AND s.status = 'Active'
    GROUP BY c.id, c.name
    ORDER BY c.name
  `).all();

  // Get count by status
  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count 
    FROM students 
    GROUP BY status
    ORDER BY status
  `).all();

  // Get count by gender
  const byGender = db.prepare(`
    SELECT gender, COUNT(*) as count 
    FROM students 
    WHERE gender IS NOT NULL
    GROUP BY gender
    ORDER BY gender
  `).all();

  return {
    total,
    active,
    inactive: total - active,
    byClass,
    byStatus,
    byGender
  };
};

/**
 * Get students with their current balances
 * @returns {Array} - Students with balance information
 */
export const getStudentsWithBalances = () => {
  return StudentModel.getStudentsWithBalances();
};

/**
 * Get students in arrears (with negative balances)
 * @returns {Array} - Students with arrears
 */
export const getStudentsInArrears = () => {
  const students = StudentModel.getStudentsWithBalances();
  return students.filter(s => (s.balance || 0) < 0);
};

/**
 * Get students by status
 * @param {string} status - Status filter
 * @returns {Array} - Students with matching status
 */
export const getStudentsByStatus = (status) => {
  return StudentModel.getAllStudents({ status });
};

/**
 * Check if admission number is available
 * @param {string} admissionNumber - Admission number to check
 * @param {number} [excludeId] - Student ID to exclude from check (for updates)
 * @returns {boolean} - True if available
 */
export const isAdmissionNumberAvailable = (admissionNumber, excludeId = null) => {
  const normalized = admissionNumber?.trim()?.toUpperCase();
  
  if (!normalized) {
    return false;
  }

  const existing = db.prepare(`
    SELECT id FROM students WHERE admission_number = ? AND id != ?
  `).get(normalized, excludeId || 0);

  return !existing;
};

/**
 * Get student summary for dashboard
 * @returns {Object} - Summary data for dashboard
 */
export const getStudentSummary = () => {
  const stats = getStudentStatistics();
  const inArrears = getStudentsInArrears();

  return {
    totalStudents: stats.total,
    activeStudents: stats.active,
    studentsInArrears: inArrears.length,
    arrearsAmount: inArrears.reduce((sum, s) => sum + Math.abs(s.balance || 0), 0),
    byClass: stats.byClass,
    byStatus: stats.byStatus
  };
};

// Export all service functions
export default {
  getPaginatedStudents,
  getAllStudents,
  getStudentById,
  getStudentByAdmissionNumber,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByClass,
  searchStudents,
  getStudentStatistics,
  getStudentsWithBalances,
  getStudentsInArrears,
  getStudentsByStatus,
  isAdmissionNumberAvailable,
  getStudentSummary
};

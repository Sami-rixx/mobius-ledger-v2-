import db from '../config/database.js';

/**
 * Student Model
 * Data access layer for students table
 * 
 * Represents a student in the school with:
 * - Personal information (name, gender, date of birth)
 * - Contact information (parent details)
 * - Academic information (class, admission number, status)
 * - Audit fields (created_by, updated_by, timestamps)
 */

// Table name
const TABLE = 'students';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  ADMISSION_NUMBER: 'admission_number',
  FIRST_NAME: 'first_name',
  LAST_NAME: 'last_name',
  GENDER: 'gender',
  DATE_OF_BIRTH: 'date_of_birth',
  CLASS_ID: 'class_id',
  PARENT_NAME: 'parent_name',
  PARENT_PHONE: 'parent_phone',
  PARENT_EMAIL: 'parent_email',
  ADDRESS: 'address',
  STATUS: 'status',
  NOTES: 'notes',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by'
};

// Valid status values
const VALID_STATUSES = ['Active', 'Inactive', 'Graduated', 'Transferred'];

// Valid gender values
const VALID_GENDERS = ['Male', 'Female', 'Other'];

/**
 * Get all students with optional filtering
 * @param {Object} options - Filter options
 * @param {string} options.search - Search term for name or admission number
 * @param {number} options.classId - Filter by class ID
 * @param {string} options.status - Filter by status
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Array} - Array of student objects
 */
export const getAllStudents = (options = {}) => {
  const {
    search,
    classId,
    status,
    limit = 100,
    offset = 0,
    orderBy = 'last_name, first_name',
    orderDir = 'ASC'
  } = options;

  let query = `SELECT s.*, c.name as class_name FROM ${TABLE} s LEFT JOIN classes c ON s.class_id = c.id`;
  const params = [];

  // Build WHERE clause
  const conditions = [];
  
  if (search) {
    conditions.push(`(s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)`);
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  if (classId) {
    conditions.push(`s.class_id = ?`);
    params.push(classId);
  }

  if (status) {
    conditions.push(`s.status = ?`);
    params.push(status);
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
 * Get total count of students matching filter criteria
 * @param {Object} options - Filter options (same as getAllStudents)
 * @returns {number} - Total count
 */
export const getStudentCount = (options = {}) => {
  const { search, classId, status } = options;
  
  let query = `SELECT COUNT(*) as count FROM ${TABLE} s`;
  const params = [];

  const conditions = [];
  
  if (search) {
    conditions.push(`(s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)`);
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  if (classId) {
    conditions.push(`s.class_id = ?`);
    params.push(classId);
  }

  if (status) {
    conditions.push(`s.status = ?`);
    params.push(status);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const result = db.prepare(query).get(...params);
  return result?.count || 0;
};

/**
 * Get a single student by ID
 * @param {number} id - Student ID
 * @returns {Object|null} - Student object or null if not found
 */
export const getStudentById = (id) => {
  const query = `SELECT s.*, c.name as class_name FROM ${TABLE} s LEFT JOIN classes c ON s.class_id = c.id WHERE s.id = ?`;
  return db.prepare(query).get(id) || null;
};

/**
 * Get a student by admission number
 * @param {string} admissionNumber - Student admission number
 * @returns {Object|null} - Student object or null if not found
 */
export const getStudentByAdmissionNumber = (admissionNumber) => {
  const query = `SELECT s.*, c.name as class_name FROM ${TABLE} s LEFT JOIN classes c ON s.class_id = c.id WHERE s.admission_number = ?`;
  return db.prepare(query).get(admissionNumber) || null;
};

/**
 * Create a new student
 * @param {Object} studentData - Student data
 * @param {number} createdBy - ID of user creating the record
 * @returns {Object} - Created student with ID
 * @throws {Error} - If validation fails or admission number already exists
 */
export const createStudent = (studentData, createdBy = null) => {
  // Validate required fields
  const requiredFields = ['admission_number', 'first_name', 'last_name', 'parent_name', 'parent_phone'];
  for (const field of requiredFields) {
    if (!studentData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate admission number uniqueness
  const existing = getStudentByAdmissionNumber(studentData.admission_number);
  if (existing) {
    throw new Error(`Admission number already exists: ${studentData.admission_number}`);
  }

  // Validate gender
  if (studentData.gender && !VALID_GENDERS.includes(studentData.gender)) {
    throw new Error(`Invalid gender. Must be one of: ${VALID_GENDERS.join(', ')}`);
  }

  // Validate status
  if (studentData.status && !VALID_STATUSES.includes(studentData.status)) {
    throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // Set defaults
  const now = new Date().toISOString();
  const data = {
    ...studentData,
    status: studentData.status || 'Active',
    created_at: now,
    updated_at: now,
    created_by: createdBy,
    updated_by: createdBy
  };

  // Build insert query
  const fields = [];
  const placeholders = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      fields.push(key);
      placeholders.push('?');
      values.push(value);
    }
  }

  const query = `INSERT INTO ${TABLE} (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
  const stmt = db.prepare(query);
  const result = stmt.run(...values);

  // Return the created student
  return getStudentById(result.lastInsertRowid);
};

/**
 * Update a student
 * @param {number} id - Student ID
 * @param {Object} studentData - Student data to update
 * @param {number} updatedBy - ID of user updating the record
 * @returns {Object} - Updated student
 * @throws {Error} - If student not found or validation fails
 */
export const updateStudent = (id, studentData, updatedBy = null) => {
  // Check if student exists
  const existing = getStudentById(id);
  if (!existing) {
    throw new Error(`Student not found with ID: ${id}`);
  }

  // Validate required fields
  const requiredFields = ['first_name', 'last_name', 'parent_name', 'parent_phone'];
  for (const field of requiredFields) {
    if (studentData[field] === undefined && !existing[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate admission number uniqueness (if being updated)
  if (studentData.admission_number && studentData.admission_number !== existing.admission_number) {
    const existingByAdmission = getStudentByAdmissionNumber(studentData.admission_number);
    if (existingByAdmission) {
      throw new Error(`Admission number already exists: ${studentData.admission_number}`);
    }
  }

  // Validate gender
  if (studentData.gender && !VALID_GENDERS.includes(studentData.gender)) {
    throw new Error(`Invalid gender. Must be one of: ${VALID_GENDERS.join(', ')}`);
  }

  // Validate status
  if (studentData.status && !VALID_STATUSES.includes(studentData.status)) {
    throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // Build update query
  const updates = [];
  const values = [];

  for (const [key, value] of Object.entries(studentData)) {
    if (value !== undefined && value !== null) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  }

  // Always update updated_at and updated_by
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  updates.push('updated_by = ?');
  values.push(updatedBy);

  values.push(id); // WHERE clause parameter

  const query = `UPDATE ${TABLE} SET ${updates.join(', ')} WHERE id = ?`;
  db.prepare(query).run(...values);

  // Return the updated student
  return getStudentById(id);
};

/**
 * Delete a student
 * @param {number} id - Student ID
 * @param {number} deletedBy - ID of user deleting the record
 * @returns {boolean} - True if deleted, false if not found
 * @throws {Error} - If student has associated transactions
 */
export const deleteStudent = (id, deletedBy = null) => {
  // Check if student exists
  const existing = getStudentById(id);
  if (!existing) {
    return false;
  }

  // Check for associated transactions (prevent deletion if financial records exist)
  const transactionCheck = db.prepare(`
    SELECT COUNT(*) as count FROM transactions WHERE student_id = ?
  `).get(id);

  if (transactionCheck?.count > 0) {
    throw new Error(`Cannot delete student with existing transactions. Student ID: ${id}`);
  }

  // Check for associated school fee payments
  const feePaymentCheck = db.prepare(`
    SELECT COUNT(*) as count FROM school_fee_payments WHERE student_id = ?
  `).get(id);

  if (feePaymentCheck?.count > 0) {
    throw new Error(`Cannot delete student with existing school fee payments. Student ID: ${id}`);
  }

  // Check for associated lunch payments
  const lunchPaymentCheck = db.prepare(`
    SELECT COUNT(*) as count FROM lunch_payments WHERE student_id = ?
  `).get(id);

  if (lunchPaymentCheck?.count > 0) {
    throw new Error(`Cannot delete student with existing lunch payments. Student ID: ${id}`);
  }

  // Check for associated student charge assignments
  const chargeCheck = db.prepare(`
    SELECT COUNT(*) as count FROM student_charge_assignments WHERE student_id = ?
  `).get(id);

  if (chargeCheck?.count > 0) {
    throw new Error(`Cannot delete student with existing charge assignments. Student ID: ${id}`);
  }

  // Delete the student
  const query = `DELETE FROM ${TABLE} WHERE id = ?`;
  const result = db.prepare(query).run(id);

  return result.changes > 0;
};

/**
 * Get students by class
 * @param {number} classId - Class ID
 * @returns {Array} - Array of students in the class
 */
export const getStudentsByClass = (classId) => {
  const query = `SELECT s.*, c.name as class_name FROM ${TABLE} s LEFT JOIN classes c ON s.class_id = c.id WHERE s.class_id = ? ORDER BY s.last_name, s.first_name`;
  return db.prepare(query).all(classId);
};

/**
 * Search students by name
 * @param {string} searchTerm - Search term
 * @returns {Array} - Array of matching students
 */
export const searchStudents = (searchTerm) => {
  const query = `SELECT s.*, c.name as class_name FROM ${TABLE} s LEFT JOIN classes c ON s.class_id = c.id WHERE s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ? ORDER BY s.last_name, s.first_name LIMIT 50`;
  const searchParam = `%${searchTerm}%`;
  return db.prepare(query).all(searchParam, searchParam, searchParam);
};

/**
 * Get active students count
 * @returns {number} - Count of active students
 */
export const getActiveStudentCount = () => {
  const result = db.prepare(`SELECT COUNT(*) as count FROM ${TABLE} WHERE status = 'Active'`).get();
  return result?.count || 0;
};

/**
 * Get students with balances (for fee tracking)
 * Uses the vw_student_balances view if available
 * @returns {Array} - Students with their current balances
 */
export const getStudentsWithBalances = () => {
  try {
    // Try using the view first
    const result = db.prepare(`SELECT * FROM vw_student_balances ORDER BY balance DESC`).all();
    if (result && result.length > 0) {
      return result;
    }
  } catch (error) {
    // View might not exist, fall back to manual calculation
  }

  // Manual calculation fallback
  const query = `
    SELECT 
      s.id,
      s.admission_number,
      s.first_name,
      s.last_name,
      s.class_id,
      c.name as class_name,
      COALESCE(SUM(CASE WHEN t.transaction_type = 'school_fee' THEN t.amount ELSE 0 END), 0) as total_paid,
      0 as total_charges,
      0 as balance
    FROM ${TABLE} s
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN transactions t ON s.id = t.student_id AND t.transaction_type = 'school_fee'
    GROUP BY s.id, s.admission_number, s.first_name, s.last_name, s.class_id, c.name
    ORDER BY s.last_name, s.first_name
  `;
  return db.prepare(query).all();
};

// Export constants for external use
export { TABLE, FIELDS, VALID_STATUSES, VALID_GENDERS };

// Export all functions as default
export default {
  getAllStudents,
  getStudentCount,
  getStudentById,
  getStudentByAdmissionNumber,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByClass,
  searchStudents,
  getActiveStudentCount,
  getStudentsWithBalances
};

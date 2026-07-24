import db from '../config/database.js';

/**
 * Student Charge Assignment Model
 * Data access layer for student_charge_assignments table
 * 
 * Represents the assignment of student charges to individual students with:
 * - Charge reference
 * - Student reference
 * - Amount (can be different from charge amount)
 * - Assignment timestamp
 * - Notes
 */

// Table name
const TABLE = 'student_charge_assignments';

// Related tables
const STUDENT_CHARGES_TABLE = 'student_charges';
const STUDENTS_TABLE = 'students';
const CLASSES_TABLE = 'classes';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  CHARGE_ID: 'charge_id',
  STUDENT_ID: 'student_id',
  AMOUNT: 'amount',
  ASSIGNED_AT: 'assigned_at',
  NOTES: 'notes'
};

/**
 * Get all student charge assignments with optional filtering
 * @param {Object} options - Filter options
 * @param {number} options.chargeId - Filter by charge ID
 * @param {number} options.studentId - Filter by student ID
 * @param {number} options.classId - Filter by class ID (via student)
 * @param {string} options.search - Search term for student or charge name
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Array} - Array of student charge assignment objects with charge and student details
 */
export const getAllStudentChargeAssignments = (options = {}) => {
  const {
    chargeId,
    studentId,
    classId,
    search,
    limit = 100,
    offset = 0,
    orderBy = 'sca.assigned_at',
    orderDir = 'DESC'
  } = options;

  let query = `
    SELECT 
      sca.*,
      sc.name as charge_name,
      sc.description as charge_description,
      sc.amount as charge_amount,
      sc.charge_type,
      sc.due_date as charge_due_date,
      s.admission_number,
      s.first_name,
      s.last_name,
      s.class_id,
      c.name as class_name
    FROM ${TABLE} sca
    LEFT JOIN ${STUDENT_CHARGES_TABLE} sc ON sca.charge_id = sc.id
    LEFT JOIN ${STUDENTS_TABLE} s ON sca.student_id = s.id
    LEFT JOIN ${CLASSES_TABLE} c ON s.class_id = c.id
  `;
  
  const params = [];
  const conditions = [];

  if (chargeId) {
    conditions.push(`sca.charge_id = ?`);
    params.push(chargeId);
  }

  if (studentId) {
    conditions.push(`sca.student_id = ?`);
    params.push(studentId);
  }

  if (classId) {
    conditions.push(`s.class_id = ?`);
    params.push(classId);
  }

  if (search) {
    conditions.push(`(sc.name LIKE ? OR sc.description LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)`);
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
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
 * Get total count of student charge assignments matching filter criteria
 * @param {Object} options - Filter options (same as getAllStudentChargeAssignments)
 * @returns {number} - Total count
 */
export const getStudentChargeAssignmentCount = (options = {}) => {
  const { chargeId, studentId, classId, search } = options;
  
  let query = `SELECT COUNT(*) as count FROM ${TABLE} sca LEFT JOIN ${STUDENT_CHARGES_TABLE} sc ON sca.charge_id = sc.id LEFT JOIN ${STUDENTS_TABLE} s ON sca.student_id = s.id LEFT JOIN ${CLASSES_TABLE} c ON s.class_id = c.id`;
  const params = [];

  const conditions = [];
  
  if (chargeId) {
    conditions.push(`sca.charge_id = ?`);
    params.push(chargeId);
  }

  if (studentId) {
    conditions.push(`sca.student_id = ?`);
    params.push(studentId);
  }

  if (classId) {
    conditions.push(`s.class_id = ?`);
    params.push(classId);
  }

  if (search) {
    conditions.push(`(sc.name LIKE ? OR sc.description LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)`);
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const result = db.prepare(query).get(...params);
  return result?.count || 0;
};

/**
 * Get a single student charge assignment by ID
 * @param {number} id - Student charge assignment ID
 * @returns {Object|null} - Student charge assignment object or null if not found
 */
export const getStudentChargeAssignmentById = (id) => {
  const query = `
    SELECT 
      sca.*,
      sc.name as charge_name,
      sc.description as charge_description,
      sc.amount as charge_amount,
      sc.charge_type,
      sc.due_date as charge_due_date,
      s.admission_number,
      s.first_name,
      s.last_name,
      s.class_id,
      c.name as class_name
    FROM ${TABLE} sca
    LEFT JOIN ${STUDENT_CHARGES_TABLE} sc ON sca.charge_id = sc.id
    LEFT JOIN ${STUDENTS_TABLE} s ON sca.student_id = s.id
    LEFT JOIN ${CLASSES_TABLE} c ON s.class_id = c.id
    WHERE sca.id = ?
  `;
  return db.prepare(query).get(id) || null;
};

/**
 * Get student charge assignments by charge ID
 * @param {number} chargeId - Charge ID
 * @returns {Array} - Array of student charge assignment objects for the charge
 */
export const getStudentChargeAssignmentsByChargeId = (chargeId) => {
  const query = `
    SELECT 
      sca.*,
      s.admission_number,
      s.first_name,
      s.last_name,
      s.class_id,
      c.name as class_name
    FROM ${TABLE} sca
    LEFT JOIN ${STUDENTS_TABLE} s ON sca.student_id = s.id
    LEFT JOIN ${CLASSES_TABLE} c ON s.class_id = c.id
    WHERE sca.charge_id = ?
    ORDER BY s.last_name, s.first_name
  `;
  return db.prepare(query).all(chargeId);
};

/**
 * Get student charge assignments by student ID
 * @param {number} studentId - Student ID
 * @returns {Array} - Array of student charge assignment objects for the student
 */
export const getStudentChargeAssignmentsByStudentId = (studentId) => {
  const query = `
    SELECT 
      sca.*,
      sc.name as charge_name,
      sc.description as charge_description,
      sc.amount as charge_amount,
      sc.charge_type,
      sc.due_date as charge_due_date
    FROM ${TABLE} sca
    LEFT JOIN ${STUDENT_CHARGES_TABLE} sc ON sca.charge_id = sc.id
    WHERE sca.student_id = ?
    ORDER BY sca.assigned_at DESC
  `;
  return db.prepare(query).all(studentId);
};

/**
 * Get student charge assignments by class ID
 * @param {number} classId - Class ID
 * @returns {Array} - Array of student charge assignment objects for students in the class
 */
export const getStudentChargeAssignmentsByClassId = (classId) => {
  const query = `
    SELECT 
      sca.*,
      sc.name as charge_name,
      sc.description as charge_description,
      sc.amount as charge_amount,
      s.admission_number,
      s.first_name,
      s.last_name
    FROM ${TABLE} sca
    LEFT JOIN ${STUDENT_CHARGES_TABLE} sc ON sca.charge_id = sc.id
    LEFT JOIN ${STUDENTS_TABLE} s ON sca.student_id = s.id
    WHERE s.class_id = ?
    ORDER BY sc.name, s.last_name, s.first_name
  `;
  return db.prepare(query).all(classId);
};

/**
 * Get unpaid student charge assignments
 * @returns {Array} - Array of unpaid student charge assignment objects
 */
export const getUnpaidStudentChargeAssignments = () => {
  const query = `
    SELECT 
      sca.*,
      sc.name as charge_name,
      sc.due_date as charge_due_date,
      s.admission_number,
      s.first_name,
      s.last_name,
      s.class_id,
      c.name as class_name
    FROM ${TABLE} sca
    LEFT JOIN ${STUDENT_CHARGES_TABLE} sc ON sca.charge_id = sc.id
    LEFT JOIN ${STUDENTS_TABLE} s ON sca.student_id = s.id
    LEFT JOIN ${CLASSES_TABLE} c ON s.class_id = c.id
    WHERE sca.id NOT IN (
      SELECT DISTINCT sca2.id FROM student_charge_assignments sca2
      JOIN transactions t ON sca2.id = t.reference
      WHERE t.transaction_type = 'student_charge'
    )
    ORDER BY sc.due_date, s.last_name, s.first_name
  `;
  return db.prepare(query).all();
};

/**
 * Create a new student charge assignment
 * @param {Object} assignment - Student charge assignment data
 * @param {number} assignment.charge_id - Charge ID
 * @param {number} assignment.student_id - Student ID
 * @param {number} assignment.amount - Assignment amount (can differ from charge amount)
 * @param {string} assignment.notes - Additional notes
 * @returns {Object} - Created student charge assignment object with ID
 */
export const createStudentChargeAssignment = (assignment) => {
  const {
    charge_id,
    student_id,
    amount,
    notes
  } = assignment;

  const query = `
    INSERT INTO ${TABLE} (
      charge_id, student_id, amount, notes
    ) VALUES (?, ?, ?, ?)
  `;
  
  const stmt = db.prepare(query);
  const result = stmt.run(
    charge_id,
    student_id,
    amount,
    notes
  );

  return { ...assignment, id: result.lastInsertRowid };
};

/**
 * Create multiple student charge assignments at once
 * @param {Array<Object>} assignments - Array of assignment objects
 * @returns {Array<Object>} - Array of created assignment objects
 */
export const createBulkStudentChargeAssignments = (assignments) => {
  const results = [];
  
  const stmt = db.prepare(`
    INSERT INTO ${TABLE} (charge_id, student_id, amount, notes)
    VALUES (?, ?, ?, ?)
  `);
  
  for (const assignment of assignments) {
    const result = stmt.run(
      assignment.charge_id,
      assignment.student_id,
      assignment.amount,
      assignment.notes
    );
    results.push({ ...assignment, id: result.lastInsertRowid });
  }
  
  return results;
};

/**
 * Update an existing student charge assignment
 * @param {number} id - Student charge assignment ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} - Updated student charge assignment object or null if not found
 */
export const updateStudentChargeAssignment = (id, updates) => {
  const existing = getStudentChargeAssignmentById(id);
  if (!existing) {
    return null;
  }

  const {
    charge_id,
    student_id,
    amount,
    notes
  } = updates;

  const query = `
    UPDATE ${TABLE} SET
      charge_id = COALESCE(?, charge_id),
      student_id = COALESCE(?, student_id),
      amount = COALESCE(?, amount),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `;

  const stmt = db.prepare(query);
  stmt.run(
    charge_id,
    student_id,
    amount,
    notes,
    id
  );

  return { ...existing, ...updates, id };
};

/**
 * Delete a student charge assignment
 * @param {number} id - Student charge assignment ID
 * @returns {boolean} - True if deleted, false if not found
 */
export const deleteStudentChargeAssignment = (id) => {
  const existing = getStudentChargeAssignmentById(id);
  if (!existing) {
    return false;
  }

  const query = `DELETE FROM ${TABLE} WHERE id = ?`;
  const stmt = db.prepare(query);
  stmt.run(id);
  
  return true;
};

/**
 * Delete all assignments for a specific charge
 * @param {number} chargeId - Charge ID
 * @returns {number} - Number of assignments deleted
 */
export const deleteStudentChargeAssignmentsByChargeId = (chargeId) => {
  const query = `DELETE FROM ${TABLE} WHERE charge_id = ?`;
  const stmt = db.prepare(query);
  const result = stmt.run(chargeId);
  return result.changes || 0;
};

/**
 * Get student charge assignment statistics
 * @returns {Object} - Statistics object
 */
export const getStudentChargeAssignmentStatistics = () => {
  const query = `
    SELECT 
      COUNT(*) as total_assignments,
      COUNT(DISTINCT charge_id) as unique_charges,
      COUNT(DISTINCT student_id) as unique_students,
      SUM(amount) as total_amount,
      AVG(amount) as average_amount
    FROM ${TABLE}
  `;
  
  return db.prepare(query).get() || {
    total_assignments: 0,
    unique_charges: 0,
    unique_students: 0,
    total_amount: 0,
    average_amount: 0
  };
};

/**
 * Check if a student has been assigned a specific charge
 * @param {number} chargeId - Charge ID
 * @param {number} studentId - Student ID
 * @returns {boolean} - True if assigned, false otherwise
 */
export const isStudentAssignedToCharge = (chargeId, studentId) => {
  const query = `
    SELECT COUNT(*) as count FROM ${TABLE}
    WHERE charge_id = ? AND student_id = ?
  `;
  const result = db.prepare(query).get(chargeId, studentId);
  return result?.count > 0;
};

/**
 * Get the total amount assigned to a student for a specific charge
 * @param {number} chargeId - Charge ID
 * @param {number} studentId - Student ID
 * @returns {number} - Total amount assigned
 */
export const getStudentChargeAssignmentAmount = (chargeId, studentId) => {
  const query = `
    SELECT amount FROM ${TABLE}
    WHERE charge_id = ? AND student_id = ?
  `;
  const result = db.prepare(query).get(chargeId, studentId);
  return result?.amount || 0;
};

export default {
  getAllStudentChargeAssignments,
  getStudentChargeAssignmentCount,
  getStudentChargeAssignmentById,
  getStudentChargeAssignmentsByChargeId,
  getStudentChargeAssignmentsByStudentId,
  getStudentChargeAssignmentsByClassId,
  getUnpaidStudentChargeAssignments,
  createStudentChargeAssignment,
  createBulkStudentChargeAssignments,
  updateStudentChargeAssignment,
  deleteStudentChargeAssignment,
  deleteStudentChargeAssignmentsByChargeId,
  getStudentChargeAssignmentStatistics,
  isStudentAssignedToCharge,
  getStudentChargeAssignmentAmount,
  FIELDS,
  TABLE
};

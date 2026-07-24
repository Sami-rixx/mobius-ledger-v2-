import db from '../config/database.js';

/**
 * Lunch Attendance Model
 * Data access layer for lunch_attendance table
 * 
 * Represents lunch attendance records with:
 * - Student reference
 * - Date of attendance
 * - Status (paid, unpaid, absent)
 * - Payment reference (links to lunch_payments)
 * - Audit fields (created_by, updated_by, timestamps)
 */

// Table name
const TABLE = 'lunch_attendance';

// Related tables
const STUDENTS_TABLE = 'students';
const LUNCH_PAYMENTS_TABLE = 'lunch_payments';
const CLASSES_TABLE = 'classes';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  STUDENT_ID: 'student_id',
  DATE: 'date',
  STATUS: 'status',
  PAYMENT_ID: 'payment_id',
  NOTES: 'notes',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by'
};

// Valid status values
const VALID_STATUSES = ['paid', 'unpaid', 'absent'];

/**
 * Get all lunch attendance records with optional filtering
 * @param {Object} options - Filter options
 * @param {number} options.studentId - Filter by student ID
 * @param {string} options.date - Filter by specific date
 * @param {string} options.startDate - Filter by start date (>=)
 * @param {string} options.endDate - Filter by end date (<=)
 * @param {string} options.status - Filter by status (paid, unpaid, absent)
 * @param {string} options.search - Search term for student name or admission number
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Array} - Array of lunch attendance objects with student details
 */
export const getAllLunchAttendance = (options = {}) => {
  const {
    studentId,
    date,
    startDate,
    endDate,
    status,
    search,
    limit = 100,
    offset = 0,
    orderBy = 'la.date',
    orderDir = 'DESC'
  } = options;

  let query = `
    SELECT 
      la.*,
      s.admission_number,
      s.first_name,
      s.last_name,
      s.class_id,
      c.name as class_name,
      lp.amount as payment_amount,
      lp.payment_type,
      lp.start_date as payment_start_date,
      lp.end_date as payment_end_date
    FROM ${TABLE} la
    LEFT JOIN ${STUDENTS_TABLE} s ON la.student_id = s.id
    LEFT JOIN ${CLASSES_TABLE} c ON s.class_id = c.id
    LEFT JOIN ${LUNCH_PAYMENTS_TABLE} lp ON la.payment_id = lp.id
  `;
  
  const params = [];
  const conditions = [];

  if (studentId) {
    conditions.push(`la.student_id = ?`);
    params.push(studentId);
  }

  if (date) {
    conditions.push(`la.date = ?`);
    params.push(date);
  }

  if (startDate) {
    conditions.push(`la.date >= ?`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`la.date <= ?`);
    params.push(endDate);
  }

  if (status) {
    conditions.push(`la.status = ?`);
    params.push(status);
  }

  if (search) {
    conditions.push(`(s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)`);
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
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
 * Get total count of lunch attendance records matching filter criteria
 * @param {Object} options - Filter options (same as getAllLunchAttendance)
 * @returns {number} - Total count
 */
export const getLunchAttendanceCount = (options = {}) => {
  const { studentId, date, startDate, endDate, status, search } = options;
  
  let query = `SELECT COUNT(*) as count FROM ${TABLE} la LEFT JOIN ${STUDENTS_TABLE} s ON la.student_id = s.id`;
  const params = [];

  const conditions = [];
  
  if (studentId) {
    conditions.push(`la.student_id = ?`);
    params.push(studentId);
  }

  if (date) {
    conditions.push(`la.date = ?`);
    params.push(date);
  }

  if (startDate) {
    conditions.push(`la.date >= ?`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`la.date <= ?`);
    params.push(endDate);
  }

  if (status) {
    conditions.push(`la.status = ?`);
    params.push(status);
  }

  if (search) {
    conditions.push(`(s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)`);
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const result = db.prepare(query).get(...params);
  return result?.count || 0;
};

/**
 * Get a single lunch attendance record by ID
 * @param {number} id - Lunch attendance ID
 * @returns {Object|null} - Lunch attendance object or null if not found
 */
export const getLunchAttendanceById = (id) => {
  const query = `
    SELECT 
      la.*,
      s.admission_number,
      s.first_name,
      s.last_name,
      s.class_id,
      c.name as class_name
    FROM ${TABLE} la
    LEFT JOIN ${STUDENTS_TABLE} s ON la.student_id = s.id
    LEFT JOIN ${CLASSES_TABLE} c ON s.class_id = c.id
    WHERE la.id = ?
  `;
  return db.prepare(query).get(id) || null;
};

/**
 * Get lunch attendance by student ID and date
 * @param {number} studentId - Student ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Object|null} - Lunch attendance object or null if not found
 */
export const getLunchAttendanceByStudentAndDate = (studentId, date) => {
  const query = `
    SELECT 
      la.*,
      s.admission_number,
      s.first_name,
      s.last_name
    FROM ${TABLE} la
    LEFT JOIN ${STUDENTS_TABLE} s ON la.student_id = s.id
    WHERE la.student_id = ? AND la.date = ?
  `;
  return db.prepare(query).get(studentId, date) || null;
};

/**
 * Get lunch attendance for a specific date
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Array} - Array of lunch attendance objects for the date
 */
export const getLunchAttendanceByDate = (date) => {
  const query = `
    SELECT 
      la.*,
      s.admission_number,
      s.first_name,
      s.last_name,
      s.class_id,
      c.name as class_name
    FROM ${TABLE} la
    LEFT JOIN ${STUDENTS_TABLE} s ON la.student_id = s.id
    LEFT JOIN ${CLASSES_TABLE} c ON s.class_id = c.id
    WHERE la.date = ?
    ORDER BY s.class_id, s.last_name, s.first_name
  `;
  return db.prepare(query).all(date);
};

/**
 * Get lunch attendance for a student
 * @param {number} studentId - Student ID
 * @param {string} startDate - Optional start date filter
 * @param {string} endDate - Optional end date filter
 * @returns {Array} - Array of lunch attendance objects for the student
 */
export const getLunchAttendanceByStudentId = (studentId, startDate = null, endDate = null) => {
  let query = `
    SELECT 
      la.*,
      lp.amount as payment_amount,
      lp.payment_type
    FROM ${TABLE} la
    LEFT JOIN ${LUNCH_PAYMENTS_TABLE} lp ON la.payment_id = lp.id
    WHERE la.student_id = ?
    ORDER BY la.date DESC
  `;
  
  const params = [studentId];
  
  if (startDate && endDate) {
    query = query.replace('ORDER BY la.date DESC', 'AND la.date BETWEEN ? AND ? ORDER BY la.date DESC');
    params.push(startDate, endDate);
  } else if (startDate) {
    query = query.replace('ORDER BY la.date DESC', 'AND la.date >= ? ORDER BY la.date DESC');
    params.push(startDate);
  } else if (endDate) {
    query = query.replace('ORDER BY la.date DESC', 'AND la.date <= ? ORDER BY la.date DESC');
    params.push(endDate);
  }

  return db.prepare(query).all(...params);
};

/**
 * Create a new lunch attendance record
 * @param {Object} attendance - Lunch attendance data
 * @param {number} attendance.student_id - Student ID
 * @param {string} attendance.date - Date (YYYY-MM-DD)
 * @param {string} attendance.status - Status (paid, unpaid, absent)
 * @param {number} attendance.payment_id - Payment ID (optional)
 * @param {string} attendance.notes - Additional notes
 * @param {number} attendance.created_by - User ID who created the record
 * @returns {Object} - Created lunch attendance object with ID
 */
export const createLunchAttendance = (attendance) => {
  const {
    student_id,
    date,
    status = 'paid',
    payment_id,
    notes,
    created_by
  } = attendance;

  const query = `
    INSERT INTO ${TABLE} (
      student_id, date, status, payment_id, notes, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const stmt = db.prepare(query);
  const result = stmt.run(
    student_id,
    date,
    status,
    payment_id,
    notes,
    created_by,
    created_by
  );

  return { ...attendance, id: result.lastInsertRowid };
};

/**
 * Update an existing lunch attendance record
 * @param {number} id - Lunch attendance ID
 * @param {Object} updates - Fields to update
 * @param {number} updates.student_id - Student ID
 * @param {string} updates.date - Date (YYYY-MM-DD)
 * @param {string} updates.status - Status (paid, unpaid, absent)
 * @param {number} updates.payment_id - Payment ID
 * @param {string} updates.notes - Additional notes
 * @param {number} updates.updated_by - User ID who updated the record
 * @returns {Object|null} - Updated lunch attendance object or null if not found
 */
export const updateLunchAttendance = (id, updates) => {
  const existing = getLunchAttendanceById(id);
  if (!existing) {
    return null;
  }

  const {
    student_id,
    date,
    status,
    payment_id,
    notes,
    updated_by
  } = updates;

  const query = `
    UPDATE ${TABLE} SET
      student_id = COALESCE(?, student_id),
      date = COALESCE(?, date),
      status = COALESCE(?, status),
      payment_id = COALESCE(?, payment_id),
      notes = COALESCE(?, notes),
      updated_by = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const stmt = db.prepare(query);
  stmt.run(
    student_id,
    date,
    status,
    payment_id,
    notes,
    updated_by,
    id
  );

  return { ...existing, ...updates, id };
};

/**
 * Delete a lunch attendance record
 * @param {number} id - Lunch attendance ID
 * @returns {boolean} - True if deleted, false if not found
 */
export const deleteLunchAttendance = (id) => {
  const existing = getLunchAttendanceById(id);
  if (!existing) {
    return false;
  }

  const query = `DELETE FROM ${TABLE} WHERE id = ?`;
  const stmt = db.prepare(query);
  stmt.run(id);
  
  return true;
};

/**
 * Get lunch attendance statistics
 * @returns {Object} - Statistics object with counts by status
 */
export const getLunchAttendanceStatistics = () => {
  const query = `
    SELECT 
      COUNT(*) as total_records,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
      COUNT(CASE WHEN status = 'unpaid' THEN 1 END) as unpaid_count,
      COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count
    FROM ${TABLE}
  `;
  
  return db.prepare(query).get() || {
    total_records: 0,
    paid_count: 0,
    unpaid_count: 0,
    absent_count: 0
  };
};

/**
 * Get lunch attendance summary for a specific date
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Object} - Summary for the date
 */
export const getLunchAttendanceSummaryByDate = (date) => {
  const query = `
    SELECT 
      COUNT(*) as total_students,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
      COUNT(CASE WHEN status = 'unpaid' THEN 1 END) as unpaid_count,
      COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count
    FROM ${TABLE}
    WHERE date = ?
  `;
  
  return db.prepare(query).get(date) || {
    total_students: 0,
    paid_count: 0,
    unpaid_count: 0,
    absent_count: 0
  };
};

/**
 * Get students who have unpaid lunch attendance
 * @param {string} startDate - Optional start date filter
 * @param {string} endDate - Optional end date filter
 * @returns {Array} - Array of students with unpaid lunch attendance
 */
export const getUnpaidLunchAttendance = (startDate = null, endDate = null) => {
  let query = `
    SELECT DISTINCT
      s.id,
      s.admission_number,
      s.first_name,
      s.last_name,
      s.class_id,
      c.name as class_name,
      COUNT(CASE WHEN la.status = 'unpaid' THEN 1 END) as unpaid_days
    FROM ${STUDENTS_TABLE} s
    LEFT JOIN ${CLASSES_TABLE} c ON s.class_id = c.id
    LEFT JOIN ${TABLE} la ON s.id = la.student_id
    WHERE la.status = 'unpaid'
    GROUP BY s.id, s.admission_number, s.first_name, s.last_name, s.class_id, c.name
    ORDER BY unpaid_days DESC, s.class_id, s.last_name, s.first_name
  `;
  
  const params = [];
  
  if (startDate && endDate) {
    query = query.replace('WHERE la.status = \'unpaid\'', 'WHERE la.status = \'unpaid\' AND la.date BETWEEN ? AND ?');
    params.push(startDate, endDate);
  } else if (startDate) {
    query = query.replace('WHERE la.status = \'unpaid\'', 'WHERE la.status = \'unpaid\' AND la.date >= ?');
    params.push(startDate);
  } else if (endDate) {
    query = query.replace('WHERE la.status = \'unpaid\'', 'WHERE la.status = \'unpaid\' AND la.date <= ?');
    params.push(endDate);
  }

  return db.prepare(query).all(...params);
};

export default {
  getAllLunchAttendance,
  getLunchAttendanceCount,
  getLunchAttendanceById,
  getLunchAttendanceByStudentAndDate,
  getLunchAttendanceByDate,
  getLunchAttendanceByStudentId,
  createLunchAttendance,
  updateLunchAttendance,
  deleteLunchAttendance,
  getLunchAttendanceStatistics,
  getLunchAttendanceSummaryByDate,
  getUnpaidLunchAttendance,
  VALID_STATUSES,
  FIELDS,
  TABLE
};

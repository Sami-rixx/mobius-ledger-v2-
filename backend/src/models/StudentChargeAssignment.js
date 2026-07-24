import db from '../config/database.js';

/**
 * Student Charge Assignment Model
 * Data access layer for student_charge_assignments table
 * 
 * Represents the assignment of a student charge to a specific student.
 * Tracks which students have been assigned which charges and their payment status.
 * 
 * Fields:
 * - id: Primary key
 * - charge_id: Reference to the student charge
 * - student_id: Reference to the student
 * - amount: Amount assigned to this student (may differ from base charge amount)
 * - assigned_at: When the assignment was created
 * - paid: Whether the charge has been paid
 * - paid_at: When the charge was paid
 * - payment_transaction_id: Reference to the transaction that paid this charge
 * - notes: Additional notes
 */

// Table name
const TABLE = 'student_charge_assignments';

// Related tables
const STUDENT_CHARGES_TABLE = 'student_charges';
const STUDENTS_TABLE = 'students';
const CLASSES_TABLE = 'classes';
const TRANSACTIONS_TABLE = 'transactions';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  CHARGE_ID: 'charge_id',
  STUDENT_ID: 'student_id',
  AMOUNT: 'amount',
  ASSIGNED_AT: 'assigned_at',
  PAID: 'paid',
  PAID_AT: 'paid_at',
  PAYMENT_TRANSACTION_ID: 'payment_transaction_id',
  NOTES: 'notes'
};

/**
 * Get all student charge assignments with optional filtering
 * @param {Object} options - Filter options
 * @param {number} options.chargeId - Filter by charge ID
 * @param {number} options.studentId - Filter by student ID
 * @param {boolean} options.paid - Filter by payment status
 * @param {number} options.classId - Filter by student's class
 * @param {string} options.search - Search term for student name or charge name
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Array} - Array of assignment objects with student and charge details
 */
export const getAllStudentChargeAssignments = (options = {}) => {
  const {
    chargeId,
    studentId,
    paid,
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
      sc.due_date,
      s.id as student_id,
      s.admission_number,
      s.first_name,
      s.last_name,
      s.class_id,
      c.name as class_name,
      t.receipt_number,
      t.amount as transaction_amount,
      t.transaction_date as payment_date
    FROM ${TABLE} sca
    JOIN ${STUDENT_CHARGES_TABLE} sc ON sca.charge_id = sc.id
    JOIN ${STUDENTS_TABLE} s ON sca.student_id = s.id
    LEFT JOIN ${CLASSES_TABLE} c ON s.class_id = c.id
    LEFT JOIN ${TRANSACTIONS_TABLE} t ON sca.payment_transaction_id = t.id
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

  if (paid !== undefined) {
    conditions.push(`sca.paid = ?`);
    params.push(paid ? 1 : 0);
  }

  if (classId) {
    conditions.push(`s.class_id = ?`);
    params.push(classId);
  }

  if (search) {
    conditions.push(`(sc.name LIKE ? OR sc.description LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += `
    ORDER BY ${orderBy} ${orderDir}
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

/**
 * Get a single assignment by ID
 * @param {number} id - Assignment ID
 * @returns {Object|null} - Assignment object or null
 */
export const getStudentChargeAssignmentById = (id) => {
  const query = `
    SELECT 
      sca.*,
      sc.name as charge_name,
      sc.description as charge_description,
      sc.amount as charge_amount,
      sc.charge_type,
      sc.due_date,
      s.id as student_id,
      s.admission_number,
      s.first_name,
      s.last_name,
      s.class_id,
      c.name as class_name,
      t.receipt_number,
      t.amount as transaction_amount,
      t.transaction_date as payment_date
    FROM ${TABLE} sca
    JOIN ${STUDENT_CHARGES_TABLE} sc ON sca.charge_id = sc.id
    JOIN ${STUDENTS_TABLE} s ON sca.student_id = s.id
    LEFT JOIN ${CLASSES_TABLE} c ON s.class_id = c.id
    LEFT JOIN ${TRANSACTIONS_TABLE} t ON sca.payment_transaction_id = t.id
    WHERE sca.id = ?
  `;

  const stmt = db.prepare(query);
  return stmt.get(id) || null;
};

/**
 * Get assignments by charge ID
 * @param {number} chargeId - Charge ID
 * @param {Object} options - Additional filter options
 * @returns {Array} - Array of assignment objects
 */
export const getStudentChargeAssignmentsByCharge = (chargeId, options = {}) => {
  return getAllStudentChargeAssignments({ ...options, chargeId });
};

/**
 * Get assignments by student ID
 * @param {number} studentId - Student ID
 * @param {Object} options - Additional filter options
 * @returns {Array} - Array of assignment objects
 */
export const getStudentChargeAssignmentsByStudent = (studentId, options = {}) => {
  return getAllStudentChargeAssignments({ ...options, studentId });
};

/**
 * Get unpaid assignments for a student
 * @param {number} studentId - Student ID
 * @returns {Array} - Array of unpaid assignment objects
 */
export const getUnpaidStudentChargeAssignmentsByStudent = (studentId) => {
  return getAllStudentChargeAssignments({ studentId, paid: false });
};

/**
 * Get unpaid assignments by charge ID
 * @param {number} chargeId - Charge ID
 * @returns {Array} - Array of unpaid assignment objects
 */
export const getUnpaidStudentChargeAssignmentsByCharge = (chargeId) => {
  return getAllStudentChargeAssignments({ chargeId, paid: false });
};

/**
 * Create a new student charge assignment
 * @param {Object} assignmentData - Assignment data
 * @param {number} assignmentData.chargeId - Charge ID
 * @param {number} assignmentData.studentId - Student ID
 * @param {number} assignmentData.amount - Amount (defaults to charge amount)
 * @param {string} assignmentData.notes - Notes
 * @returns {Object} - Created assignment object
 */
export const createStudentChargeAssignment = (assignmentData) => {
  const {
    chargeId,
    studentId,
    amount,
    notes
  } = assignmentData;

  // Validate required fields
  if (!chargeId) {
    throw new Error('chargeId is required');
  }
  if (!studentId) {
    throw new Error('studentId is required');
  }

  // Get charge amount if not provided
  let finalAmount = amount;
  if (finalAmount === undefined) {
    const charge = db.prepare(`SELECT amount FROM ${STUDENT_CHARGES_TABLE} WHERE id = ?`).get(chargeId);
    if (!charge) {
      throw new Error(`Charge with ID ${chargeId} not found`);
    }
    finalAmount = charge.amount;
  }

  const query = `
    INSERT INTO ${TABLE} 
      (charge_id, student_id, amount, notes)
    VALUES (?, ?, ?, ?)
  `;

  const stmt = db.prepare(query);
  const result = stmt.run(chargeId, studentId, finalAmount, notes || null);

  return getStudentChargeAssignmentById(result.lastInsertRowid);
};

/**
 * Create multiple student charge assignments at once
 * @param {Array} assignments - Array of assignment data objects
 * @returns {Array} - Array of created assignment objects
 */
export const createMultipleStudentChargeAssignments = (assignments) => {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    throw new Error('Assignments must be a non-empty array');
  }

  const transaction = db.transaction(() => {
    const created = [];
    
    for (const assignmentData of assignments) {
      const createdAssignment = createStudentChargeAssignment(assignmentData);
      created.push(createdAssignment);
    }
    
    return created;
  });

  try {
    return transaction();
  } catch (error) {
    throw new Error(`Failed to create multiple assignments: ${error.message}`);
  }
};

/**
 * Update a student charge assignment
 * @param {number} id - Assignment ID
 * @param {Object} assignmentData - Updated assignment data
 * @returns {Object} - Updated assignment object
 */
export const updateStudentChargeAssignment = (id, assignmentData) => {
  const {
    amount,
    paid,
    paidAt,
    paymentTransactionId,
    notes
  } = assignmentData;

  const updates = [];
  const params = [];

  if (amount !== undefined) {
    updates.push(`amount = ?`);
    params.push(amount);
  }
  if (paid !== undefined) {
    updates.push(`paid = ?`);
    params.push(paid ? 1 : 0);
  }
  if (paidAt !== undefined) {
    updates.push(`paid_at = ?`);
    params.push(paidAt || null);
  }
  if (paymentTransactionId !== undefined) {
    updates.push(`payment_transaction_id = ?`);
    params.push(paymentTransactionId || null);
  }
  if (notes !== undefined) {
    updates.push(`notes = ?`);
    params.push(notes || null);
  }

  if (updates.length === 0) {
    return getStudentChargeAssignmentById(id);
  }

  params.push(id);

  const query = `
    UPDATE ${TABLE} 
    SET ${updates.join(', ')}
    WHERE id = ?
  `;

  const stmt = db.prepare(query);
  stmt.run(...params);

  return getStudentChargeAssignmentById(id);
};

/**
 * Mark an assignment as paid
 * @param {number} id - Assignment ID
 * @param {number} transactionId - Transaction ID that paid this charge
 * @param {string} paidAt - Payment timestamp (defaults to now)
 * @returns {Object} - Updated assignment object
 */
export const markAssignmentAsPaid = (id, transactionId, paidAt = null) => {
  return updateStudentChargeAssignment(id, {
    paid: true,
    paidAt: paidAt || new Date().toISOString(),
    paymentTransactionId: transactionId
  });
};

/**
 * Mark an assignment as unpaid
 * @param {number} id - Assignment ID
 * @returns {Object} - Updated assignment object
 */
export const markAssignmentAsUnpaid = (id) => {
  return updateStudentChargeAssignment(id, {
    paid: false,
    paidAt: null,
    paymentTransactionId: null
  });
};

/**
 * Delete a student charge assignment
 * @param {number} id - Assignment ID
 * @returns {boolean} - True if deleted, false if not found
 */
export const deleteStudentChargeAssignment = (id) => {
  // Check if assignment exists and is not paid
  const assignment = getStudentChargeAssignmentById(id);
  if (!assignment) {
    return false;
  }

  if (assignment.paid) {
    throw new Error('Cannot delete a paid assignment. Create a credit note instead.');
  }

  const query = `DELETE FROM ${TABLE} WHERE id = ?`;
  const stmt = db.prepare(query);
  const result = stmt.run(id);

  return result.changes > 0;
};

/**
 * Delete all assignments for a charge
 * @param {number} chargeId - Charge ID
 * @returns {number} - Number of assignments deleted
 */
export const deleteStudentChargeAssignmentsByCharge = (chargeId) => {
  // Check for paid assignments
  const paidAssignments = db.prepare(
    `SELECT COUNT(*) as count FROM ${TABLE} WHERE charge_id = ? AND paid = 1`
  ).get(chargeId);

  if (paidAssignments && paidAssignments.count > 0) {
    throw new Error('Cannot delete assignments for a charge with paid assignments. Create credit notes instead.');
  }

  const query = `DELETE FROM ${TABLE} WHERE charge_id = ?`;
  const stmt = db.prepare(query);
  const result = stmt.run(chargeId);

  return result.changes;
};

/**
 * Get the count of student charge assignments
 * @param {Object} options - Filter options (same as getAllStudentChargeAssignments)
 * @returns {number} - Total count
 */
export const getStudentChargeAssignmentCount = (options = {}) => {
  const {
    chargeId,
    studentId,
    paid,
    classId,
    search
  } = options;

  let query = `
    SELECT COUNT(*) as count 
    FROM ${TABLE} sca
    JOIN ${STUDENT_CHARGES_TABLE} sc ON sca.charge_id = sc.id
    JOIN ${STUDENTS_TABLE} s ON sca.student_id = s.id
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

  if (paid !== undefined) {
    conditions.push(`sca.paid = ?`);
    params.push(paid ? 1 : 0);
  }

  if (classId) {
    conditions.push(`s.class_id = ?`);
    params.push(classId);
  }

  if (search) {
    conditions.push(`(sc.name LIKE ? OR sc.description LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const stmt = db.prepare(query);
  const result = stmt.get(...params);
  return result ? result.count : 0;
};

/**
 * Get statistics for student charge assignments
 * @param {number} chargeId - Optional charge ID to filter by
 * @returns {Object} - Statistics object
 */
export const getStudentChargeAssignmentStatistics = (chargeId = null) => {
  let query = `
    SELECT 
      COUNT(*) as total_assignments,
      COUNT(CASE WHEN paid = 1 THEN 1 END) as paid_count,
      COUNT(CASE WHEN paid = 0 THEN 1 END) as unpaid_count,
      SUM(amount) as total_amount,
      SUM(CASE WHEN paid = 1 THEN amount ELSE 0 END) as total_paid,
      SUM(CASE WHEN paid = 0 THEN amount ELSE 0 END) as total_outstanding
    FROM ${TABLE}
  `;

  const params = [];
  if (chargeId) {
    query += ` WHERE charge_id = ?`;
    params.push(chargeId);
  }

  const stmt = db.prepare(query);
  const result = stmt.get(...params);

  return result || {
    total_assignments: 0,
    paid_count: 0,
    unpaid_count: 0,
    total_amount: 0,
    total_paid: 0,
    total_outstanding: 0
  };
};

/**
 * Check if a student has been assigned a specific charge
 * @param {number} chargeId - Charge ID
 * @param {number} studentId - Student ID
 * @returns {boolean} - True if assigned
 */
export const isStudentAssignedToCharge = (chargeId, studentId) => {
  const query = `
    SELECT COUNT(*) as count 
    FROM ${TABLE} 
    WHERE charge_id = ? AND student_id = ?
  `;

  const stmt = db.prepare(query);
  const result = stmt.get(chargeId, studentId);
  return result && result.count > 0;
};

/**
 * Get the total amount a student owes for unpaid charges
 * @param {number} studentId - Student ID
 * @returns {number} - Total outstanding amount
 */
export const getStudentOutstandingChargeAmount = (studentId) => {
  const query = `
    SELECT SUM(sca.amount) as total_outstanding
    FROM ${TABLE} sca
    JOIN ${STUDENT_CHARGES_TABLE} sc ON sca.charge_id = sc.id
    WHERE sca.student_id = ? AND sca.paid = 0 AND sc.is_active = 1
  `;

  const stmt = db.prepare(query);
  const result = stmt.get(studentId);
  return result ? (result.total_outstanding || 0) : 0;
};

// Export field constants
export { FIELDS, TABLE };

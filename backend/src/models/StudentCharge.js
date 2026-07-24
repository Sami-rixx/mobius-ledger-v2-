import db from '../config/database.js';

/**
 * Student Charge Model
 * Data access layer for student_charges table
 * 
 * Represents custom charges (swimming, trips, sports, etc.) that can be assigned
 * to individual students, entire classes, grades, or custom groups.
 * 
 * Fields:
 * - id: Primary key
 * - name: Charge name (e.g., "Swimming Lessons", "School Trip")
 * - description: Detailed description of the charge
 * - amount: Base amount for the charge
 * - charge_type: 'individual', 'all', 'class', 'grade', 'custom'
 * - class_id: For class-wide charges, the target class
 * - is_active: Whether the charge is currently active
 * - due_date: When the charge is due
 * - created_at: Creation timestamp
 * - updated_at: Last update timestamp
 * - created_by: User who created the charge
 * - updated_by: User who last updated the charge
 */

// Table name
const TABLE = 'student_charges';

// Related tables
const STUDENTS_TABLE = 'students';
const CLASSES_TABLE = 'classes';
const ASSIGNMENTS_TABLE = 'student_charge_assignments';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  NAME: 'name',
  DESCRIPTION: 'description',
  AMOUNT: 'amount',
  CHARGE_TYPE: 'charge_type',
  CLASS_ID: 'class_id',
  IS_ACTIVE: 'is_active',
  DUE_DATE: 'due_date',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by'
};

// Valid charge types
const VALID_CHARGE_TYPES = ['individual', 'all', 'class', 'grade', 'custom'];

/**
 * Get all student charges with optional filtering
 * @param {Object} options - Filter options
 * @param {string} options.name - Filter by charge name (partial match)
 * @param {string} options.chargeType - Filter by charge type
 * @param {number} options.classId - Filter by class ID
 * @param {boolean} options.isActive - Filter by active status
 * @param {string} options.search - Search term for name or description
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Array} - Array of student charge objects
 */
export const getAllStudentCharges = (options = {}) => {
  const {
    name,
    chargeType,
    classId,
    isActive,
    search,
    limit = 100,
    offset = 0,
    orderBy = 'sc.created_at',
    orderDir = 'DESC'
  } = options;

  let query = `
    SELECT 
      sc.*,
      c.name as class_name,
      COUNT(sca.id) as assignment_count,
      SUM(CASE WHEN sca.paid = 1 THEN sca.amount ELSE 0 END) as total_paid,
      SUM(sca.amount) as total_assigned
    FROM ${TABLE} sc
    LEFT JOIN ${CLASSES_TABLE} c ON sc.class_id = c.id
    LEFT JOIN ${ASSIGNMENTS_TABLE} sca ON sc.id = sca.charge_id
  `;

  const params = [];
  const conditions = [];

  if (name) {
    conditions.push(`sc.name LIKE ?`);
    params.push(`%${name}%`);
  }

  if (chargeType) {
    conditions.push(`sc.charge_type = ?`);
    params.push(chargeType);
  }

  if (classId) {
    conditions.push(`sc.class_id = ?`);
    params.push(classId);
  }

  if (isActive !== undefined) {
    conditions.push(`sc.is_active = ?`);
    params.push(isActive ? 1 : 0);
  }

  if (search) {
    conditions.push(`(sc.name LIKE ? OR sc.description LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += `
    GROUP BY sc.id
    ORDER BY ${orderBy} ${orderDir}
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

/**
 * Get a single student charge by ID
 * @param {number} id - Student charge ID
 * @returns {Object|null} - Student charge object or null
 */
export const getStudentChargeById = (id) => {
  const query = `
    SELECT 
      sc.*,
      c.name as class_name,
      COUNT(sca.id) as assignment_count,
      SUM(CASE WHEN sca.paid = 1 THEN sca.amount ELSE 0 END) as total_paid,
      SUM(sca.amount) as total_assigned
    FROM ${TABLE} sc
    LEFT JOIN ${CLASSES_TABLE} c ON sc.class_id = c.id
    LEFT JOIN ${ASSIGNMENTS_TABLE} sca ON sc.id = sca.charge_id
    WHERE sc.id = ?
    GROUP BY sc.id
  `;

  const stmt = db.prepare(query);
  return stmt.get(id) || null;
};

/**
 * Get student charges by class ID
 * @param {number} classId - Class ID
 * @param {Object} options - Additional filter options
 * @returns {Array} - Array of student charge objects
 */
export const getStudentChargesByClass = (classId, options = {}) => {
  const { isActive = true } = options;

  const query = `
    SELECT 
      sc.*,
      c.name as class_name,
      COUNT(sca.id) as assignment_count,
      SUM(CASE WHEN sca.paid = 1 THEN sca.amount ELSE 0 END) as total_paid,
      SUM(sca.amount) as total_assigned
    FROM ${TABLE} sc
    LEFT JOIN ${CLASSES_TABLE} c ON sc.class_id = c.id
    LEFT JOIN ${ASSIGNMENTS_TABLE} sca ON sc.id = sca.charge_id
    WHERE sc.class_id = ? AND sc.is_active = ?
    GROUP BY sc.id
    ORDER BY sc.created_at DESC
  `;

  const stmt = db.prepare(query);
  return stmt.all(classId, isActive ? 1 : 0);
};

/**
 * Get active student charges
 * @param {Object} options - Filter options
 * @returns {Array} - Array of active student charge objects
 */
export const getActiveStudentCharges = (options = {}) => {
  return getAllStudentCharges({ ...options, isActive: true });
};

/**
 * Create a new student charge
 * @param {Object} chargeData - Student charge data
 * @param {string} chargeData.name - Charge name
 * @param {string} chargeData.description - Description
 * @param {number} chargeData.amount - Amount
 * @param {string} chargeData.chargeType - Charge type
 * @param {number} chargeData.classId - Class ID (for class-wide charges)
 * @param {string} chargeData.dueDate - Due date
 * @param {number} chargeData.createdBy - User ID who created the charge
 * @returns {Object} - Created student charge object
 */
export const createStudentCharge = (chargeData) => {
  const {
    name,
    description,
    amount,
    chargeType = 'individual',
    classId,
    dueDate,
    createdBy
  } = chargeData;

  // Validate charge type
  if (!VALID_CHARGE_TYPES.includes(chargeType)) {
    throw new Error(`Invalid charge type: ${chargeType}. Must be one of: ${VALID_CHARGE_TYPES.join(', ')}`);
  }

  const query = `
    INSERT INTO ${TABLE} 
      (name, description, amount, charge_type, class_id, due_date, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const stmt = db.prepare(query);
  const result = stmt.run(
    name,
    description,
    amount,
    chargeType,
    classId || null,
    dueDate || null,
    createdBy,
    createdBy
  );

  return getStudentChargeById(result.lastInsertRowid);
};

/**
 * Update a student charge
 * @param {number} id - Student charge ID
 * @param {Object} chargeData - Updated student charge data
 * @param {number} updatedBy - User ID who updated the charge
 * @returns {Object} - Updated student charge object
 */
export const updateStudentCharge = (id, chargeData, updatedBy) => {
  const {
    name,
    description,
    amount,
    chargeType,
    classId,
    isActive,
    dueDate
  } = chargeData;

  // Validate charge type if provided
  if (chargeType && !VALID_CHARGE_TYPES.includes(chargeType)) {
    throw new Error(`Invalid charge type: ${chargeType}. Must be one of: ${VALID_CHARGE_TYPES.join(', ')}`);
  }

  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push(`name = ?`);
    params.push(name);
  }
  if (description !== undefined) {
    updates.push(`description = ?`);
    params.push(description);
  }
  if (amount !== undefined) {
    updates.push(`amount = ?`);
    params.push(amount);
  }
  if (chargeType !== undefined) {
    updates.push(`charge_type = ?`);
    params.push(chargeType);
  }
  if (classId !== undefined) {
    updates.push(`class_id = ?`);
    params.push(classId || null);
  }
  if (isActive !== undefined) {
    updates.push(`is_active = ?`);
    params.push(isActive ? 1 : 0);
  }
  if (dueDate !== undefined) {
    updates.push(`due_date = ?`);
    params.push(dueDate || null);
  }

  if (updates.length === 0) {
    return getStudentChargeById(id);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  updates.push(`updated_by = ?`);
  params.push(updatedBy);
  params.push(id);

  const query = `
    UPDATE ${TABLE} 
    SET ${updates.join(', ')}
    WHERE id = ?
  `;

  const stmt = db.prepare(query);
  stmt.run(...params);

  return getStudentChargeById(id);
};

/**
 * Delete a student charge
 * @param {number} id - Student charge ID
 * @returns {boolean} - True if deleted, false if not found
 */
export const deleteStudentCharge = (id) => {
  // Check if charge exists and has no assignments
  const charge = getStudentChargeById(id);
  if (!charge) {
    return false;
  }

  // Check for existing assignments
  const assignmentCount = getStudentChargeAssignmentCount(id);
  if (assignmentCount > 0) {
    throw new Error('Cannot delete charge with existing assignments. Delete assignments first.');
  }

  const query = `DELETE FROM ${TABLE} WHERE id = ?`;
  const stmt = db.prepare(query);
  const result = stmt.run(id);

  return result.changes > 0;
};

/**
 * Get the count of student charge assignments for a charge
 * @param {number} chargeId - Student charge ID
 * @returns {number} - Count of assignments
 */
export const getStudentChargeAssignmentCount = (chargeId) => {
  const query = `SELECT COUNT(*) as count FROM ${ASSIGNMENTS_TABLE} WHERE charge_id = ?`;
  const stmt = db.prepare(query);
  const result = stmt.get(chargeId);
  return result ? result.count : 0;
};

/**
 * Get the total count of student charges
 * @param {Object} options - Filter options (same as getAllStudentCharges)
 * @returns {number} - Total count
 */
export const getStudentChargeCount = (options = {}) => {
  const {
    name,
    chargeType,
    classId,
    isActive,
    search
  } = options;

  let query = `SELECT COUNT(*) as count FROM ${TABLE} sc`;
  const params = [];
  const conditions = [];

  if (name) {
    conditions.push(`sc.name LIKE ?`);
    params.push(`%${name}%`);
  }

  if (chargeType) {
    conditions.push(`sc.charge_type = ?`);
    params.push(chargeType);
  }

  if (classId) {
    conditions.push(`sc.class_id = ?`);
    params.push(classId);
  }

  if (isActive !== undefined) {
    conditions.push(`sc.is_active = ?`);
    params.push(isActive ? 1 : 0);
  }

  if (search) {
    conditions.push(`(sc.name LIKE ? OR sc.description LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const stmt = db.prepare(query);
  const result = stmt.get(...params);
  return result ? result.count : 0;
};

/**
 * Get statistics for student charges
 * @returns {Object} - Statistics object
 */
export const getStudentChargeStatistics = () => {
  const query = `
    SELECT 
      COUNT(*) as total_charges,
      COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_charges,
      COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_charges,
      SUM(amount) as total_amount,
      AVG(amount) as average_amount,
      COUNT(CASE WHEN charge_type = 'individual' THEN 1 END) as individual_charges,
      COUNT(CASE WHEN charge_type = 'class' THEN 1 END) as class_charges,
      COUNT(CASE WHEN charge_type = 'all' THEN 1 END) as all_students_charges,
      COUNT(CASE WHEN charge_type = 'grade' THEN 1 END) as grade_charges,
      COUNT(CASE WHEN charge_type = 'custom' THEN 1 END) as custom_charges
    FROM ${TABLE}
  `;

  const stmt = db.prepare(query);
  return stmt.get() || {
    total_charges: 0,
    active_charges: 0,
    inactive_charges: 0,
    total_amount: 0,
    average_amount: 0,
    individual_charges: 0,
    class_charges: 0,
    all_students_charges: 0,
    grade_charges: 0,
    custom_charges: 0
  };
};

// Export field constants
export { FIELDS, VALID_CHARGE_TYPES, TABLE };

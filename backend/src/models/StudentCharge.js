import db from '../config/database.js';

/**
 * Student Charge Model
 * Data access layer for student_charges table
 * 
 * Represents custom charges (swimming, trips, sports, etc.) with:
 * - Charge name and description
 * - Amount
 * - Charge type (individual, all, class, grade, custom)
 * - Optional class association
 * - Due date
 * - Audit fields (created_by, updated_by, timestamps)
 */

// Table name
const TABLE = 'student_charges';

// Related tables
const CLASSES_TABLE = 'classes';
const STUDENTS_TABLE = 'students';

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

// Valid charge type values
const VALID_CHARGE_TYPES = ['individual', 'all', 'class', 'grade', 'custom'];

/**
 * Get all student charges with optional filtering
 * @param {Object} options - Filter options
 * @param {string} options.name - Filter by charge name
 * @param {string} options.chargeType - Filter by charge type
 * @param {number} options.classId - Filter by class ID
 * @param {boolean} options.isActive - Filter by active status
 * @param {string} options.search - Search term for name or description
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Array} - Array of student charge objects with class details
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
      c.description as class_description
    FROM ${TABLE} sc
    LEFT JOIN ${CLASSES_TABLE} c ON sc.class_id = c.id
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
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam);
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
 * Get total count of student charges matching filter criteria
 * @param {Object} options - Filter options (same as getAllStudentCharges)
 * @returns {number} - Total count
 */
export const getStudentChargeCount = (options = {}) => {
  const { name, chargeType, classId, isActive, search } = options;
  
  let query = `SELECT COUNT(*) as count FROM ${TABLE} sc LEFT JOIN ${CLASSES_TABLE} c ON sc.class_id = c.id`;
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
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const result = db.prepare(query).get(...params);
  return result?.count || 0;
};

/**
 * Get a single student charge by ID
 * @param {number} id - Student charge ID
 * @returns {Object|null} - Student charge object or null if not found
 */
export const getStudentChargeById = (id) => {
  const query = `
    SELECT 
      sc.*,
      c.name as class_name,
      c.description as class_description
    FROM ${TABLE} sc
    LEFT JOIN ${CLASSES_TABLE} c ON sc.class_id = c.id
    WHERE sc.id = ?
  `;
  return db.prepare(query).get(id) || null;
};

/**
 * Get student charges by class ID
 * @param {number} classId - Class ID
 * @returns {Array} - Array of student charge objects for the class
 */
export const getStudentChargesByClassId = (classId) => {
  const query = `
    SELECT 
      sc.*,
      c.name as class_name
    FROM ${TABLE} sc
    LEFT JOIN ${CLASSES_TABLE} c ON sc.class_id = c.id
    WHERE sc.class_id = ? OR sc.charge_type = 'all'
    ORDER BY sc.name
  `;
  return db.prepare(query).all(classId);
};

/**
 * Get active student charges
 * @returns {Array} - Array of active student charge objects
 */
export const getActiveStudentCharges = () => {
  const query = `
    SELECT 
      sc.*,
      c.name as class_name
    FROM ${TABLE} sc
    LEFT JOIN ${CLASSES_TABLE} c ON sc.class_id = c.id
    WHERE sc.is_active = 1
    ORDER BY sc.name
  `;
  return db.prepare(query).all();
};

/**
 * Get student charges with upcoming due dates
 * @param {number} days - Number of days to look ahead
 * @returns {Array} - Array of student charges due within the specified days
 */
export const getUpcomingStudentCharges = (days = 7) => {
  const query = `
    SELECT 
      sc.*,
      c.name as class_name
    FROM ${TABLE} sc
    LEFT JOIN ${CLASSES_TABLE} c ON sc.class_id = c.id
    WHERE sc.is_active = 1
    AND sc.due_date IS NOT NULL
    AND sc.due_date BETWEEN date('now') AND date('now', ?)
    ORDER BY sc.due_date
  `;
  return db.prepare(query).all(`+${days} days`);
};

/**
 * Get overdue student charges
 * @returns {Array} - Array of overdue student charge objects
 */
export const getOverdueStudentCharges = () => {
  const query = `
    SELECT 
      sc.*,
      c.name as class_name
    FROM ${TABLE} sc
    LEFT JOIN ${CLASSES_TABLE} c ON sc.class_id = c.id
    WHERE sc.is_active = 1
    AND sc.due_date IS NOT NULL
    AND sc.due_date < date('now')
    ORDER BY sc.due_date
  `;
  return db.prepare(query).all();
};

/**
 * Create a new student charge
 * @param {Object} charge - Student charge data
 * @param {string} charge.name - Charge name
 * @param {string} charge.description - Charge description
 * @param {number} charge.amount - Charge amount
 * @param {string} charge.charge_type - Charge type (individual, all, class, grade, custom)
 * @param {number} charge.class_id - Class ID (optional, for class-specific charges)
 * @param {boolean} charge.is_active - Whether the charge is active
 * @param {string} charge.due_date - Due date (YYYY-MM-DD)
 * @param {number} charge.created_by - User ID who created the record
 * @returns {Object} - Created student charge object with ID
 */
export const createStudentCharge = (charge) => {
  const {
    name,
    description,
    amount,
    charge_type = 'individual',
    class_id,
    is_active = true,
    due_date,
    created_by
  } = charge;

  const query = `
    INSERT INTO ${TABLE} (
      name, description, amount, charge_type, class_id, is_active, due_date, created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const stmt = db.prepare(query);
  const result = stmt.run(
    name,
    description,
    amount,
    charge_type,
    class_id,
    is_active ? 1 : 0,
    due_date,
    created_by,
    created_by
  );

  return { ...charge, id: result.lastInsertRowid };
};

/**
 * Update an existing student charge
 * @param {number} id - Student charge ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} - Updated student charge object or null if not found
 */
export const updateStudentCharge = (id, updates) => {
  const existing = getStudentChargeById(id);
  if (!existing) {
    return null;
  }

  const {
    name,
    description,
    amount,
    charge_type,
    class_id,
    is_active,
    due_date,
    updated_by
  } = updates;

  const query = `
    UPDATE ${TABLE} SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      amount = COALESCE(?, amount),
      charge_type = COALESCE(?, charge_type),
      class_id = COALESCE(?, class_id),
      is_active = COALESCE(?, is_active),
      due_date = COALESCE(?, due_date),
      updated_by = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const stmt = db.prepare(query);
  stmt.run(
    name,
    description,
    amount,
    charge_type,
    class_id,
    is_active !== undefined ? (is_active ? 1 : 0) : undefined,
    due_date,
    updated_by,
    id
  );

  return { ...existing, ...updates, id };
};

/**
 * Delete a student charge
 * @param {number} id - Student charge ID
 * @returns {boolean} - True if deleted, false if not found
 */
export const deleteStudentCharge = (id) => {
  const existing = getStudentChargeById(id);
  if (!existing) {
    return false;
  }

  const query = `DELETE FROM ${TABLE} WHERE id = ?`;
  const stmt = db.prepare(query);
  stmt.run(id);
  
  return true;
};

/**
 * Get student charge statistics
 * @returns {Object} - Statistics object with counts and totals
 */
export const getStudentChargeStatistics = () => {
  const query = `
    SELECT 
      COUNT(*) as total_charges,
      COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_charges,
      COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_charges,
      SUM(amount) as total_amount,
      AVG(amount) as average_amount,
      COUNT(CASE WHEN charge_type = 'individual' THEN 1 END) as individual_count,
      COUNT(CASE WHEN charge_type = 'all' THEN 1 END) as all_count,
      COUNT(CASE WHEN charge_type = 'class' THEN 1 END) as class_count,
      COUNT(CASE WHEN charge_type = 'grade' THEN 1 END) as grade_count,
      COUNT(CASE WHEN charge_type = 'custom' THEN 1 END) as custom_count
    FROM ${TABLE}
  `;
  
  return db.prepare(query).get() || {
    total_charges: 0,
    active_charges: 0,
    inactive_charges: 0,
    total_amount: 0,
    average_amount: 0,
    individual_count: 0,
    all_count: 0,
    class_count: 0,
    grade_count: 0,
    custom_count: 0
  };
};

export default {
  getAllStudentCharges,
  getStudentChargeCount,
  getStudentChargeById,
  getStudentChargesByClassId,
  getActiveStudentCharges,
  getUpcomingStudentCharges,
  getOverdueStudentCharges,
  createStudentCharge,
  updateStudentCharge,
  deleteStudentCharge,
  getStudentChargeStatistics,
  VALID_CHARGE_TYPES,
  FIELDS,
  TABLE
};

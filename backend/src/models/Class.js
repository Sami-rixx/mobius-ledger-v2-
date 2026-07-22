import db from '../config/database.js';

/**
 * Class Model
 * Data access layer for classes table
 * 
 * Represents a school class/grade with:
 * - Name and description
 * - Active/inactive status
 * - Audit fields (created_by, updated_by, timestamps)
 */

// Table name
const TABLE = 'classes';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  NAME: 'name',
  DESCRIPTION: 'description',
  IS_ACTIVE: 'is_active',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by'
};

/**
 * Get all classes with optional filtering
 * @param {Object} options - Filter options
 * @param {string} options.search - Search term for name or description
 * @param {boolean} options.isActive - Filter by active status
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Array} - Array of class objects
 */
export const getAllClasses = (options = {}) => {
  const {
    search,
    isActive,
    limit = 100,
    offset = 0,
    orderBy = 'name',
    orderDir = 'ASC'
  } = options;

  let query = `SELECT * FROM ${TABLE}`;
  const params = [];

  // Build WHERE clause
  const conditions = [];
  
  if (search) {
    conditions.push(`(name LIKE ? OR description LIKE ?)`);
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam);
  }

  if (isActive !== undefined) {
    conditions.push(`is_active = ?`);
    params.push(isActive ? 1 : 0);
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
 * Get a single class by ID
 * @param {number} id - Class ID
 * @returns {Object|null} - Class object or null if not found
 */
export const getClassById = (id) => {
  const stmt = db.prepare(`SELECT * FROM ${TABLE} WHERE id = ?`);
  return stmt.get(id) || null;
};

/**
 * Get a class by name
 * @param {string} name - Class name
 * @returns {Object|null} - Class object or null if not found
 */
export const getClassByName = (name) => {
  const stmt = db.prepare(`SELECT * FROM ${TABLE} WHERE name = ?`);
  return stmt.get(name) || null;
};

/**
 * Get the count of classes
 * @param {Object} options - Filter options (same as getAllClasses)
 * @returns {number} - Count of classes
 */
export const getClassCount = (options = {}) => {
  const { search, isActive } = options;

  let query = `SELECT COUNT(*) as count FROM ${TABLE}`;
  const params = [];

  // Build WHERE clause
  const conditions = [];
  
  if (search) {
    conditions.push(`(name LIKE ? OR description LIKE ?)`);
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam);
  }

  if (isActive !== undefined) {
    conditions.push(`is_active = ?`);
    params.push(isActive ? 1 : 0);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const stmt = db.prepare(query);
  const result = stmt.get(...params);
  return result.count;
};

/**
 * Create a new class
 * @param {Object} classData - Class data
 * @param {number} createdBy - User ID creating the record
 * @returns {Object} - Created class
 * @throws {Error} - If class with same name already exists
 */
export const createClass = (classData, createdBy = null) => {
  // Check if class with same name already exists
  const existing = getClassByName(classData.name);
  if (existing) {
    throw new Error(`Class with name '${classData.name}' already exists`);
  }

  const stmt = db.prepare(`
    INSERT INTO ${TABLE} (name, description, is_active, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    classData.name,
    classData.description || null,
    classData.is_active !== undefined ? classData.is_active : true,
    createdBy,
    createdBy
  );

  return getClassById(result.lastInsertRowid);
};

/**
 * Update a class
 * @param {number} id - Class ID
 * @param {Object} classData - Class data to update
 * @param {number} updatedBy - User ID updating the record
 * @returns {Object|null} - Updated class or null if not found
 * @throws {Error} - If class with same name already exists (different ID)
 */
export const updateClass = (id, classData, updatedBy = null) => {
  // Check if class exists
  const existing = getClassById(id);
  if (!existing) {
    return null;
  }

  // Check if another class with same name exists
  if (classData.name && classData.name !== existing.name) {
    const nameConflict = getClassByName(classData.name);
    if (nameConflict && nameConflict.id !== id) {
      throw new Error(`Class with name '${classData.name}' already exists`);
    }
  }

  const stmt = db.prepare(`
    UPDATE ${TABLE} 
    SET name = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
    WHERE id = ?
  `);
  
  stmt.run(
    classData.name || existing.name,
    classData.description !== undefined ? classData.description : existing.description,
    classData.is_active !== undefined ? classData.is_active : existing.is_active,
    updatedBy,
    id
  );

  return getClassById(id);
};

/**
 * Delete a class
 * @param {number} id - Class ID
 * @param {number} deletedBy - User ID deleting the record
 * @returns {boolean} - True if deleted, false if not found
 * @throws {Error} - If class has associated students
 */
export const deleteClass = (id, deletedBy = null) => {
  // Check if class has associated students
  const studentCheck = db.prepare('SELECT COUNT(*) as count FROM students WHERE class_id = ?').get(id);
  if (studentCheck.count > 0) {
    throw new Error(`Cannot delete class with ID ${id}: ${studentCheck.count} student(s) are assigned to this class`);
  }

  const stmt = db.prepare(`DELETE FROM ${TABLE} WHERE id = ?`);
  const result = stmt.run(id);
  
  return result.changes > 0;
};

/**
 * Get paginated list of classes
 * @param {Object} options - Pagination and filter options
 * @returns {Object} - Paginated result with classes and metadata
 */
export const getPaginatedClasses = (options = {}) => {
  const {
    search,
    isActive,
    page = 1,
    pageSize = 20,
    orderBy = 'name',
    orderDir = 'ASC'
  } = options;

  const offset = (page - 1) * pageSize;

  // Get classes
  const classes = getAllClasses({
    search,
    isActive,
    limit: pageSize,
    offset,
    orderBy,
    orderDir
  });

  // Get total count
  const total = getClassCount({ search, isActive });

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    data: classes,
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
 * Search classes
 * @param {string} searchTerm - Search term
 * @returns {Array} - Matching classes
 */
export const searchClasses = (searchTerm) => {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return [];
  }
  return getAllClasses({ search: searchTerm.trim() });
};

/**
 * Get active classes only
 * @returns {Array} - Active classes
 */
export const getActiveClasses = () => {
  return getAllClasses({ isActive: true });
};

/**
 * Get classes with student counts
 * @returns {Array} - Classes with student count
 */
export const getClassesWithStudentCounts = () => {
  const stmt = db.prepare(`
    SELECT c.*, COUNT(s.id) as student_count 
    FROM ${TABLE} c 
    LEFT JOIN students s ON c.id = s.class_id
    GROUP BY c.id, c.name, c.description, c.is_active, c.created_at, c.updated_at, c.created_by, c.updated_by
    ORDER BY c.name
  `);
  return stmt.all();
};

// Export all model functions
export default {
  getAllClasses,
  getClassById,
  getClassByName,
  getClassCount,
  createClass,
  updateClass,
  deleteClass,
  getPaginatedClasses,
  searchClasses,
  getActiveClasses,
  getClassesWithStudentCounts
};

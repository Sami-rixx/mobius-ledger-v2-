import db from '../config/database.js';

/**
 * Income Category Model
 * Data access layer for income_categories table
 * 
 * Represents categories for organizing income sources with:
 * - Name and description
 * - Active/inactive status
 * - System flag for built-in categories
 * - Audit fields (created_by, updated_by, timestamps)
 */

// Table name
const TABLE = 'income_categories';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  NAME: 'name',
  DESCRIPTION: 'description',
  IS_ACTIVE: 'is_active',
  IS_SYSTEM: 'is_system',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by'
};

/**
 * Get all income categories with optional filtering
 * @param {Object} options - Filter options
 * @param {string} options.search - Search term for name or description
 * @param {boolean} options.isActive - Filter by active status
 * @param {boolean} options.isSystem - Filter by system status
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Array} - Array of income category objects
 */
export const getAllIncomeCategories = (options = {}) => {
  const {
    search,
    isActive,
    isSystem,
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

  if (isSystem !== undefined) {
    conditions.push(`is_system = ?`);
    params.push(isSystem ? 1 : 0);
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
 * Get a single income category by ID
 * @param {number} id - Income category ID
 * @returns {Object|null} - Income category object or null if not found
 */
export const getIncomeCategoryById = (id) => {
  const stmt = db.prepare(`SELECT * FROM ${TABLE} WHERE id = ?`);
  return stmt.get(id) || null;
};

/**
 * Get an income category by name
 * @param {string} name - Income category name
 * @returns {Object|null} - Income category object or null if not found
 */
export const getIncomeCategoryByName = (name) => {
  const stmt = db.prepare(`SELECT * FROM ${TABLE} WHERE name = ?`);
  return stmt.get(name) || null;
};

/**
 * Get active income categories
 * @param {Object} options - Filter options (same as getAllIncomeCategories)
 * @returns {Array} - Array of active income category objects
 */
export const getActiveIncomeCategories = (options = {}) => {
  return getAllIncomeCategories({ ...options, isActive: true });
};

/**
 * Get system income categories
 * @returns {Array} - Array of system income category objects
 */
export const getSystemIncomeCategories = () => {
  return getAllIncomeCategories({ isSystem: true, isActive: true });
};

/**
 * Create a new income category
 * @param {Object} categoryData - Income category data
 * @param {string} categoryData.name - Category name
 * @param {string} categoryData.description - Description
 * @param {boolean} categoryData.isActive - Active status (default: true)
 * @param {boolean} categoryData.isSystem - System flag (default: false)
 * @param {number} categoryData.createdBy - User ID who created the category
 * @returns {Object} - Created income category object
 */
export const createIncomeCategory = (categoryData) => {
  const {
    name,
    description,
    isActive = true,
    isSystem = false,
    createdBy
  } = categoryData;

  // Check if category with same name already exists
  const existing = getIncomeCategoryByName(name);
  if (existing) {
    throw new Error(`Income category with name '${name}' already exists`);
  }

  const query = `
    INSERT INTO ${TABLE} 
      (name, description, is_active, is_system, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const stmt = db.prepare(query);
  const result = stmt.run(
    name,
    description || null,
    isActive ? 1 : 0,
    isSystem ? 1 : 0,
    createdBy,
    createdBy
  );

  return getIncomeCategoryById(result.lastInsertRowid);
};

/**
 * Update an income category
 * @param {number} id - Income category ID
 * @param {Object} categoryData - Updated income category data
 * @param {number} updatedBy - User ID who updated the category
 * @returns {Object} - Updated income category object
 */
export const updateIncomeCategory = (id, categoryData, updatedBy) => {
  const {
    name,
    description,
    isActive,
    isSystem
  } = categoryData;

  // Check if category exists
  const existing = getIncomeCategoryById(id);
  if (!existing) {
    throw new Error(`Income category with ID ${id} not found`);
  }

  // Check if name is being changed to an existing name
  if (name && name !== existing.name) {
    const existingWithName = getIncomeCategoryByName(name);
    if (existingWithName) {
      throw new Error(`Income category with name '${name}' already exists`);
    }
  }

  // Cannot modify system categories
  if (existing.is_system === 1 && isSystem !== true) {
    throw new Error('Cannot modify system income categories');
  }

  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push(`name = ?`);
    params.push(name);
  }
  if (description !== undefined) {
    updates.push(`description = ?`);
    params.push(description || null);
  }
  if (isActive !== undefined) {
    updates.push(`is_active = ?`);
    params.push(isActive ? 1 : 0);
  }
  if (isSystem !== undefined) {
    updates.push(`is_system = ?`);
    params.push(isSystem ? 1 : 0);
  }

  if (updates.length === 0) {
    return getIncomeCategoryById(id);
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

  return getIncomeCategoryById(id);
};

/**
 * Delete an income category
 * @param {number} id - Income category ID
 * @param {number} deletedBy - User ID who deleted the category
 * @returns {boolean} - True if deleted, false if not found
 */
export const deleteIncomeCategory = (id, deletedBy) => {
  // Check if category exists
  const existing = getIncomeCategoryById(id);
  if (!existing) {
    return false;
  }

  // Cannot delete system categories
  if (existing.is_system === 1) {
    throw new Error('Cannot delete system income categories');
  }

  // Check if category is referenced by any income records
  const incomeCount = getIncomeCountByCategory(id);
  if (incomeCount > 0) {
    throw new Error('Cannot delete income category with existing income records. Reassign or delete income records first.');
  }

  const query = `DELETE FROM ${TABLE} WHERE id = ?`;
  const stmt = db.prepare(query);
  const result = stmt.run(id);

  return result.changes > 0;
};

/**
 * Get the count of income records for a category
 * @param {number} categoryId - Income category ID
 * @returns {number} - Count of income records
 */
export const getIncomeCountByCategory = (categoryId) => {
  const query = `SELECT COUNT(*) as count FROM income WHERE category_id = ?`;
  const stmt = db.prepare(query);
  const result = stmt.get(categoryId);
  return result ? result.count : 0;
};

/**
 * Get the total count of income categories
 * @param {Object} options - Filter options (same as getAllIncomeCategories)
 * @returns {number} - Total count
 */
export const getIncomeCategoryCount = (options = {}) => {
  const {
    search,
    isActive,
    isSystem
  } = options;

  let query = `SELECT COUNT(*) as count FROM ${TABLE}`;
  const params = [];
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

  if (isSystem !== undefined) {
    conditions.push(`is_system = ?`);
    params.push(isSystem ? 1 : 0);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const stmt = db.prepare(query);
  const result = stmt.get(...params);
  return result ? result.count : 0;
};

// Export field constants
export { FIELDS, TABLE };

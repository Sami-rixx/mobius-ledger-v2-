import db from '../config/database.js';

/**
 * Expense Category Model
 * Data access layer for expense_categories table
 * 
 * Represents hierarchical expense categories with:
 * - Category name and description
 * - Parent category reference (for hierarchy)
 * - Active status
 * - System flag (for predefined categories)
 * - Kitchen flag (for kitchen-specific categories)
 * - Audit fields (created_by, updated_by, timestamps)
 */

// Table name
const TABLE = 'expense_categories';

// Related tables
const USERS_TABLE = 'users';
const EXPENSES_TABLE = 'expenses';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  NAME: 'name',
  PARENT_ID: 'parent_id',
  DESCRIPTION: 'description',
  IS_ACTIVE: 'is_active',
  IS_SYSTEM: 'is_system',
  IS_KITCHEN: 'is_kitchen',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by'
};

/**
 * Get all expense categories with optional filtering
 * @param {Object} options - Filter options
 * @param {boolean} options.isActive - Filter by active status
 * @param {boolean} options.isSystem - Filter by system status
 * @param {boolean} options.isKitchen - Filter by kitchen status
 * @param {number} options.parentId - Filter by parent category ID
 * @param {string} options.search - Search term for name or description
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDirection - ASC or DESC
 * @returns {Array} - Array of expense categories
 */
export function getAll(options = {}) {
  const {
    isActive,
    isSystem,
    isKitchen,
    parentId,
    search,
    limit = 100,
    offset = 0,
    orderBy = FIELDS.NAME,
    orderDirection = 'ASC'
  } = options;

  let whereClause = '';
  const params = [];

  if (isActive !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.IS_ACTIVE} = ?`;
    params.push(isActive ? 1 : 0);
  }

  if (isSystem !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.IS_SYSTEM} = ?`;
    params.push(isSystem ? 1 : 0);
  }

  if (isKitchen !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.IS_KITCHEN} = ?`;
    params.push(isKitchen ? 1 : 0);
  }

  if (parentId !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.PARENT_ID} = ?`;
    params.push(parentId);
  }

  if (search) {
    whereClause += ` AND (${TABLE}.${FIELDS.NAME} LIKE ? OR ${TABLE}.${FIELDS.DESCRIPTION} LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }

  // Validate orderBy to prevent SQL injection
  const validOrderFields = [
    FIELDS.ID,
    FIELDS.NAME,
    FIELDS.PARENT_ID,
    FIELDS.IS_ACTIVE,
    FIELDS.IS_SYSTEM,
    FIELDS.IS_KITCHEN,
    FIELDS.CREATED_AT
  ];
  const orderField = validOrderFields.includes(orderBy) ? orderBy : FIELDS.NAME;
  const validDirection = orderDirection === 'ASC' ? 'ASC' : 'DESC';

  const query = `
    SELECT ${TABLE}.*
    FROM ${TABLE}
    WHERE 1=1 ${whereClause}
    ORDER BY ${TABLE}.${orderField} ${validDirection}
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);

  try {
    const rows = db.prepare(query).all(...params);
    return rows.map(row => ({
      ...row,
      is_active: Boolean(row.is_active),
      is_system: Boolean(row.is_system),
      is_kitchen: Boolean(row.is_kitchen)
    }));
  } catch (error) {
    console.error('Error in getAll expense categories:', error.message);
    throw error;
  }
}

/**
 * Get all active expense categories
 * @returns {Array} - Array of active expense categories
 */
export function getAllActive() {
  const query = `
    SELECT *
    FROM ${TABLE}
    WHERE ${FIELDS.IS_ACTIVE} = 1
    ORDER BY ${FIELDS.NAME} ASC
  `;

  try {
    const rows = db.prepare(query).all();
    return rows.map(row => ({
      ...row,
      is_active: Boolean(row.is_active),
      is_system: Boolean(row.is_system),
      is_kitchen: Boolean(row.is_kitchen)
    }));
  } catch (error) {
    console.error('Error in getAllActive expense categories:', error.message);
    throw error;
  }
}

/**
 * Get all kitchen expense categories
 * @returns {Array} - Array of kitchen expense categories
 */
export function getAllKitchen() {
  const query = `
    SELECT *
    FROM ${TABLE}
    WHERE ${FIELDS.IS_KITCHEN} = 1
      AND ${FIELDS.IS_ACTIVE} = 1
    ORDER BY ${FIELDS.NAME} ASC
  `;

  try {
    const rows = db.prepare(query).all();
    return rows.map(row => ({
      ...row,
      is_active: Boolean(row.is_active),
      is_system: Boolean(row.is_system),
      is_kitchen: Boolean(row.is_kitchen)
    }));
  } catch (error) {
    console.error('Error in getAllKitchen expense categories:', error.message);
    throw error;
  }
}

/**
 * Get all root categories (no parent)
 * @param {Object} options - Filter options
 * @returns {Array} - Array of root categories
 */
export function getRootCategories(options = {}) {
  const { isActive = true } = options;

  let whereClause = ` WHERE ${TABLE}.${FIELDS.PARENT_ID} IS NULL`;
  const params = [];

  if (isActive !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.IS_ACTIVE} = ?`;
    params.push(isActive ? 1 : 0);
  }

  const query = `
    SELECT *
    FROM ${TABLE}
    ${whereClause}
    ORDER BY ${FIELDS.NAME} ASC
  `;

  try {
    const rows = db.prepare(query).all(...params);
    return rows.map(row => ({
      ...row,
      is_active: Boolean(row.is_active),
      is_system: Boolean(row.is_system),
      is_kitchen: Boolean(row.is_kitchen)
    }));
  } catch (error) {
    console.error('Error in getRootCategories expense categories:', error.message);
    throw error;
  }
}

/**
 * Get child categories for a parent
 * @param {number} parentId - Parent category ID
 * @returns {Array} - Array of child categories
 */
export function getChildren(parentId) {
  const query = `
    SELECT *
    FROM ${TABLE}
    WHERE ${FIELDS.PARENT_ID} = ?
    ORDER BY ${FIELDS.NAME} ASC
  `;

  try {
    const rows = db.prepare(query).all(parentId);
    return rows.map(row => ({
      ...row,
      is_active: Boolean(row.is_active),
      is_system: Boolean(row.is_system),
      is_kitchen: Boolean(row.is_kitchen)
    }));
  } catch (error) {
    console.error('Error in getChildren expense categories:', error.message);
    throw error;
  }
}

/**
 * Get expense category by ID
 * @param {number} id - Expense category ID
 * @returns {Object|null} - Expense category or null
 */
export function getById(id) {
  const query = `SELECT * FROM ${TABLE} WHERE ${FIELDS.ID} = ?`;

  try {
    const row = db.prepare(query).get(id);
    if (row) {
      return {
        ...row,
        is_active: Boolean(row.is_active),
        is_system: Boolean(row.is_system),
        is_kitchen: Boolean(row.is_kitchen)
      };
    }
    return null;
  } catch (error) {
    console.error('Error in getById expense category:', error.message);
    throw error;
  }
}

/**
 * Get expense category by name
 * @param {string} name - Category name
 * @returns {Object|null} - Expense category or null
 */
export function getByName(name) {
  const query = `SELECT * FROM ${TABLE} WHERE ${FIELDS.NAME} = ?`;

  try {
    const row = db.prepare(query).get(name);
    if (row) {
      return {
        ...row,
        is_active: Boolean(row.is_active),
        is_system: Boolean(row.is_system),
        is_kitchen: Boolean(row.is_kitchen)
      };
    }
    return null;
  } catch (error) {
    console.error('Error in getByName expense category:', error.message);
    throw error;
  }
}

/**
 * Create a new expense category
 * @param {Object} data - Expense category data
 * @returns {Object} - Created expense category
 */
export function create(data) {
  const {
    name,
    parentId,
    description,
    isActive = true,
    isSystem = false,
    isKitchen = false,
    createdBy,
    updatedBy
  } = data;

  const query = `
    INSERT INTO ${TABLE} (
      ${FIELDS.NAME},
      ${FIELDS.PARENT_ID},
      ${FIELDS.DESCRIPTION},
      ${FIELDS.IS_ACTIVE},
      ${FIELDS.IS_SYSTEM},
      ${FIELDS.IS_KITCHEN},
      ${FIELDS.CREATED_BY},
      ${FIELDS.UPDATED_BY}
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    name,
    parentId,
    description,
    isActive ? 1 : 0,
    isSystem ? 1 : 0,
    isKitchen ? 1 : 0,
    createdBy,
    updatedBy
  ];

  try {
    const result = db.prepare(query).run(...params);
    return getById(result.lastInsertRowid);
  } catch (error) {
    console.error('Error in create expense category:', error.message);
    throw error;
  }
}

/**
 * Update an expense category
 * @param {number} id - Expense category ID
 * @param {Object} data - Updated expense category data
 * @returns {Object} - Updated expense category
 */
export function update(id, data) {
  const {
    name,
    parentId,
    description,
    isActive,
    isSystem,
    isKitchen,
    updatedBy
  } = data;

  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push(`${FIELDS.NAME} = ?`);
    params.push(name);
  }
  if (parentId !== undefined) {
    updates.push(`${FIELDS.PARENT_ID} = ?`);
    params.push(parentId);
  }
  if (description !== undefined) {
    updates.push(`${FIELDS.DESCRIPTION} = ?`);
    params.push(description);
  }
  if (isActive !== undefined) {
    updates.push(`${FIELDS.IS_ACTIVE} = ?`);
    params.push(isActive ? 1 : 0);
  }
  if (isSystem !== undefined) {
    updates.push(`${FIELDS.IS_SYSTEM} = ?`);
    params.push(isSystem ? 1 : 0);
  }
  if (isKitchen !== undefined) {
    updates.push(`${FIELDS.IS_KITCHEN} = ?`);
    params.push(isKitchen ? 1 : 0);
  }
  if (updatedBy !== undefined) {
    updates.push(`${FIELDS.UPDATED_BY} = ?`);
    params.push(updatedBy);
  }

  if (updates.length === 0) {
    return getById(id);
  }

  updates.push(`${FIELDS.UPDATED_AT} = CURRENT_TIMESTAMP`);
  params.push(id);

  const query = `
    UPDATE ${TABLE} 
    SET ${updates.join(', ')}
    WHERE ${FIELDS.ID} = ?
  `;

  try {
    db.prepare(query).run(...params);
    return getById(id);
  } catch (error) {
    console.error('Error in update expense category:', error.message);
    throw error;
  }
}

/**
 * Delete an expense category
 * @param {number} id - Expense category ID
 * @returns {Object} - Deleted expense category
 */
export function deleteById(id) {
  const query = `DELETE FROM ${TABLE} WHERE ${FIELDS.ID} = ?`;

  try {
    const row = getById(id);
    if (!row) {
      return null;
    }
    db.prepare(query).run(id);
    return row;
  } catch (error) {
    console.error('Error in deleteById expense category:', error.message);
    throw error;
  }
}

/**
 * Get total count of expense categories
 * @param {Object} options - Filter options (same as getAll)
 * @returns {number} - Total count
 */
export function count(options = {}) {
  const { isActive, isSystem, isKitchen, parentId, search } = options;

  let whereClause = '';
  const params = [];

  if (isActive !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.IS_ACTIVE} = ?`;
    params.push(isActive ? 1 : 0);
  }

  if (isSystem !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.IS_SYSTEM} = ?`;
    params.push(isSystem ? 1 : 0);
  }

  if (isKitchen !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.IS_KITCHEN} = ?`;
    params.push(isKitchen ? 1 : 0);
  }

  if (parentId !== undefined) {
    whereClause += ` AND ${TABLE}.${FIELDS.PARENT_ID} = ?`;
    params.push(parentId);
  }

  if (search) {
    whereClause += ` AND (${TABLE}.${FIELDS.NAME} LIKE ? OR ${TABLE}.${FIELDS.DESCRIPTION} LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }

  const query = `SELECT COUNT(*) as count FROM ${TABLE} WHERE 1=1 ${whereClause}`;

  try {
    const result = db.prepare(query).get(...params);
    return result.count;
  } catch (error) {
    console.error('Error in count expense categories:', error.message);
    throw error;
  }
}

/**
 * Check if a category name already exists
 * @param {string} name - Category name to check
 * @param {number} excludeId - Optional ID to exclude from check (for updates)
 * @returns {boolean} - True if name exists
 */
export function nameExists(name, excludeId = null) {
  let query = `SELECT COUNT(*) as count FROM ${TABLE} WHERE ${FIELDS.NAME} = ?`;
  const params = [name];

  if (excludeId !== null) {
    query += ` AND ${FIELDS.ID} != ?`;
    params.push(excludeId);
  }

  try {
    const result = db.prepare(query).get(...params);
    return result.count > 0;
  } catch (error) {
    console.error('Error in nameExists expense category:', error.message);
    throw error;
  }
}

/**
 * Get hierarchical category tree
 * @returns {Array} - Array of categories with nested children
 */
export function getTree() {
  try {
    // Get all active categories
    const categories = getAll({ isActive: true, limit: 1000 });
    
    // Build parent-child relationships
    const categoryMap = new Map();
    const rootCategories = [];
    
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });
    
    // Organize into tree
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id);
      if (cat.parent_id === null || cat.parent_id === undefined) {
        rootCategories.push(category);
      } else {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children.push(category);
        }
      }
    });
    
    return rootCategories;
  } catch (error) {
    console.error('Error in getTree expense categories:', error.message);
    throw error;
  }
}

/**
 * Get expense categories with usage count (how many expenses use each category)
 * @returns {Array} - Array of categories with usage count
 */
export function getWithUsageCount() {
  const query = `
    SELECT 
      ${TABLE}.*,
      COALESCE(usage.count, 0) as usage_count
    FROM ${TABLE}
    LEFT JOIN (
      SELECT expense_category_id, COUNT(*) as count
      FROM ${EXPENSES_TABLE}
      GROUP BY expense_category_id
    ) as usage ON ${TABLE}.${FIELDS.ID} = usage.expense_category_id
    ORDER BY ${TABLE}.${FIELDS.NAME} ASC
  `;

  try {
    const rows = db.prepare(query).all();
    return rows.map(row => ({
      ...row,
      is_active: Boolean(row.is_active),
      is_system: Boolean(row.is_system),
      is_kitchen: Boolean(row.is_kitchen),
      usageCount: row.usage_count
    }));
  } catch (error) {
    console.error('Error in getWithUsageCount expense categories:', error.message);
    throw error;
  }
}

// Export all functions as the default export
export default {
  getAll,
  getAllActive,
  getAllKitchen,
  getRootCategories,
  getChildren,
  getById,
  getByName,
  create,
  update,
  deleteById,
  count,
  nameExists,
  getTree,
  getWithUsageCount,
  TABLE,
  FIELDS
};

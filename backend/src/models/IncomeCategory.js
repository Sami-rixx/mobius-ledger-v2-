import db from '../config/database.js';

/**
 * Income Category Model
 * Data access layer for income_categories table
 * 
 * Represents income categories with:
 * - Category name and description
 * - Active status
 * - System flag (for predefined categories)
 * - Audit fields (created_by, updated_by, timestamps)
 */

// Table name
const TABLE = 'income_categories';

// Related tables
const USERS_TABLE = 'users';

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
 * @param {boolean} options.isActive - Filter by active status
 * @param {boolean} options.isSystem - Filter by system status
 * @param {string} options.search - Search term for name or description
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDirection - ASC or DESC
 * @returns {Promise<Array>} - Array of income categories
 */
export async function getAll(options = {}) {
  const {
    isActive,
    isSystem,
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

  if (search) {
    whereClause += ` AND (${TABLE}.${FIELDS.NAME} LIKE ? OR ${TABLE}.${FIELDS.DESCRIPTION} LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }

  // Validate orderBy to prevent SQL injection
  const validOrderFields = [
    FIELDS.ID,
    FIELDS.NAME,
    FIELDS.IS_ACTIVE,
    FIELDS.IS_SYSTEM,
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
    const rows = await db.all(query, params);
    return rows.map(row => ({
      ...row,
      is_active: Boolean(row.is_active),
      is_system: Boolean(row.is_system)
    }));
  } catch (error) {
    console.error('Error in getAll income categories:', error.message);
    throw error;
  }
}

/**
 * Get all active income categories
 * @returns {Promise<Array>} - Array of active income categories
 */
export async function getAllActive() {
  const query = `
    SELECT *
    FROM ${TABLE}
    WHERE ${FIELDS.IS_ACTIVE} = 1
    ORDER BY ${FIELDS.NAME} ASC
  `;

  try {
    const rows = await db.all(query);
    return rows.map(row => ({
      ...row,
      is_active: Boolean(row.is_active),
      is_system: Boolean(row.is_system)
    }));
  } catch (error) {
    console.error('Error in getAllActive income categories:', error.message);
    throw error;
  }
}

/**
 * Get income category by ID
 * @param {number} id - Income category ID
 * @returns {Promise<Object|null>} - Income category or null
 */
export async function getById(id) {
  const query = `SELECT * FROM ${TABLE} WHERE ${FIELDS.ID} = ?`;

  try {
    const row = await db.get(query, [id]);
    if (row) {
      return {
        ...row,
        is_active: Boolean(row.is_active),
        is_system: Boolean(row.is_system)
      };
    }
    return null;
  } catch (error) {
    console.error('Error in getById income category:', error.message);
    throw error;
  }
}

/**
 * Get income category by name
 * @param {string} name - Category name
 * @returns {Promise<Object|null>} - Income category or null
 */
export async function getByName(name) {
  const query = `SELECT * FROM ${TABLE} WHERE ${FIELDS.NAME} = ?`;

  try {
    const row = await db.get(query, [name]);
    if (row) {
      return {
        ...row,
        is_active: Boolean(row.is_active),
        is_system: Boolean(row.is_system)
      };
    }
    return null;
  } catch (error) {
    console.error('Error in getByName income category:', error.message);
    throw error;
  }
}

/**
 * Create a new income category
 * @param {Object} data - Income category data
 * @returns {Promise<Object>} - Created income category
 */
export async function create(data) {
  const {
    name,
    description,
    isActive = true,
    isSystem = false,
    createdBy,
    updatedBy
  } = data;

  const query = `
    INSERT INTO ${TABLE} (
      ${FIELDS.NAME},
      ${FIELDS.DESCRIPTION},
      ${FIELDS.IS_ACTIVE},
      ${FIELDS.IS_SYSTEM},
      ${FIELDS.CREATED_BY},
      ${FIELDS.UPDATED_BY}
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  const params = [
    name,
    description,
    isActive ? 1 : 0,
    isSystem ? 1 : 0,
    createdBy,
    updatedBy
  ];

  try {
    const result = await db.run(query, params);
    return await getById(result.lastID);
  } catch (error) {
    console.error('Error in create income category:', error.message);
    throw error;
  }
}

/**
 * Update an income category
 * @param {number} id - Income category ID
 * @param {Object} data - Updated income category data
 * @returns {Promise<Object>} - Updated income category
 */
export async function update(id, data) {
  const {
    name,
    description,
    isActive,
    isSystem,
    updatedBy
  } = data;

  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push(`${FIELDS.NAME} = ?`);
    params.push(name);
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
  if (updatedBy !== undefined) {
    updates.push(`${FIELDS.UPDATED_BY} = ?`);
    params.push(updatedBy);
  }

  if (updates.length === 0) {
    return await getById(id);
  }

  updates.push(`${FIELDS.UPDATED_AT} = CURRENT_TIMESTAMP`);
  params.push(id);

  const query = `
    UPDATE ${TABLE} 
    SET ${updates.join(', ')}
    WHERE ${FIELDS.ID} = ?
  `;

  try {
    await db.run(query, params);
    return await getById(id);
  } catch (error) {
    console.error('Error in update income category:', error.message);
    throw error;
  }
}

/**
 * Delete an income category
 * @param {number} id - Income category ID
 * @returns {Promise<Object>} - Deleted income category
 */
export async function deleteById(id) {
  const query = `DELETE FROM ${TABLE} WHERE ${FIELDS.ID} = ?`;

  try {
    const row = await getById(id);
    if (!row) {
      return null;
    }
    await db.run(query, [id]);
    return row;
  } catch (error) {
    console.error('Error in deleteById income category:', error.message);
    throw error;
  }
}

/**
 * Get total count of income categories
 * @param {Object} options - Filter options (same as getAll)
 * @returns {Promise<number>} - Total count
 */
export async function count(options = {}) {
  const { isActive, isSystem, search } = options;

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

  if (search) {
    whereClause += ` AND (${TABLE}.${FIELDS.NAME} LIKE ? OR ${TABLE}.${FIELDS.DESCRIPTION} LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }

  const query = `SELECT COUNT(*) as count FROM ${TABLE} WHERE 1=1 ${whereClause}`;

  try {
    const result = await db.get(query, params);
    return result.count;
  } catch (error) {
    console.error('Error in count income categories:', error.message);
    throw error;
  }
}

/**
 * Check if a category name already exists
 * @param {string} name - Category name to check
 * @param {number} excludeId - Optional ID to exclude from check (for updates)
 * @returns {Promise<boolean>} - True if name exists
 */
export async function nameExists(name, excludeId = null) {
  let query = `SELECT COUNT(*) as count FROM ${TABLE} WHERE ${FIELDS.NAME} = ?`;
  const params = [name];

  if (excludeId !== null) {
    query += ` AND ${FIELDS.ID} != ?`;
    params.push(excludeId);
  }

  try {
    const result = await db.get(query, params);
    return result.count > 0;
  } catch (error) {
    console.error('Error in nameExists income category:', error.message);
    throw error;
  }
}

/**
 * Get income categories with usage count (how many income records use each category)
 * @returns {Promise<Array>} - Array of categories with usage count
 */
export async function getWithUsageCount() {
  const query = `
    SELECT 
      ${TABLE}.*,
      COALESCE(usage.count, 0) as usage_count
    FROM ${TABLE}
    LEFT JOIN (
      SELECT income_category_id, COUNT(*) as count
      FROM income
      GROUP BY income_category_id
    ) as usage ON ${TABLE}.${FIELDS.ID} = usage.income_category_id
    ORDER BY ${TABLE}.${FIELDS.NAME} ASC
  `;

  try {
    const rows = await db.all(query);
    return rows.map(row => ({
      ...row,
      is_active: Boolean(row.is_active),
      is_system: Boolean(row.is_system),
      usageCount: row.usage_count
    }));
  } catch (error) {
    console.error('Error in getWithUsageCount income categories:', error.message);
    throw error;
  }
}

// Export all functions as the default export
export default {
  getAll,
  getAllActive,
  getById,
  getByName,
  create,
  update,
  deleteById,
  count,
  nameExists,
  getWithUsageCount,
  TABLE,
  FIELDS
};

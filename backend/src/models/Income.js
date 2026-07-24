import db from '../config/database.js';

/**
 * Income Model
 * Data access layer for income table
 * 
 * Represents income records with:
 * - Transaction reference (for receipt tracking)
 * - Category reference
 * - Amount and date
 * - Payer information
 * - Description and reference
 * - Audit fields (created_by, updated_by, timestamps)
 */

// Table name
const TABLE = 'income';

// Related tables
const TRANSACTIONS_TABLE = 'transactions';
const CATEGORIES_TABLE = 'income_categories';
const PAYMENT_METHODS_TABLE = 'payment_methods';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  TRANSACTION_ID: 'transaction_id',
  CATEGORY_ID: 'category_id',
  AMOUNT: 'amount',
  INCOME_DATE: 'income_date',
  DESCRIPTION: 'description',
  PAYER_NAME: 'payer_name',
  PAYER_PHONE: 'payer_phone',
  REFERENCE: 'reference',
  NOTES: 'notes',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by'
};

/**
 * Get all income records with optional filtering
 * @param {Object} options - Filter options
 * @param {number} options.categoryId - Filter by category ID
 * @param {string} options.incomeDate - Filter by income date
 * @param {string} options.dateFrom - Filter by start date (inclusive)
 * @param {string} options.dateTo - Filter by end date (inclusive)
 * @param {string} options.search - Search term for description, payer name, or reference
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Array} - Array of income objects with category and transaction details
 */
export const getAllIncome = (options = {}) => {
  const {
    categoryId,
    incomeDate,
    dateFrom,
    dateTo,
    search,
    limit = 100,
    offset = 0,
    orderBy = 'i.income_date',
    orderDir = 'DESC'
  } = options;

  let query = `
    SELECT 
      i.*,
      ic.name as category_name,
      ic.description as category_description,
      t.receipt_number,
      t.transaction_type,
      t.payment_method_id,
      pm.name as payment_method,
      t.transaction_date,
      t.notes as transaction_notes
    FROM ${TABLE} i
    LEFT JOIN ${CATEGORIES_TABLE} ic ON i.category_id = ic.id
    LEFT JOIN ${TRANSACTIONS_TABLE} t ON i.transaction_id = t.id
    LEFT JOIN ${PAYMENT_METHODS_TABLE} pm ON t.payment_method_id = pm.id
  `;
  
  const params = [];
  const conditions = [];

  if (categoryId) {
    conditions.push(`i.category_id = ?`);
    params.push(categoryId);
  }

  if (incomeDate) {
    conditions.push(`i.income_date = ?`);
    params.push(incomeDate);
  }

  if (dateFrom) {
    conditions.push(`i.income_date >= ?`);
    params.push(dateFrom);
  }

  if (dateTo) {
    conditions.push(`i.income_date <= ?`);
    params.push(dateTo);
  }

  if (search) {
    conditions.push(`(i.description LIKE ? OR i.payer_name LIKE ? OR i.reference LIKE ?)`);
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  // Add ordering and pagination
  query += `
    ORDER BY ${orderBy} ${orderDir}
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

/**
 * Get a single income record by ID
 * @param {number} id - Income ID
 * @returns {Object|null} - Income object with category and transaction details, or null
 */
export const getIncomeById = (id) => {
  const query = `
    SELECT 
      i.*,
      ic.name as category_name,
      ic.description as category_description,
      t.receipt_number,
      t.transaction_type,
      t.payment_method_id,
      pm.name as payment_method,
      t.transaction_date,
      t.notes as transaction_notes
    FROM ${TABLE} i
    LEFT JOIN ${CATEGORIES_TABLE} ic ON i.category_id = ic.id
    LEFT JOIN ${TRANSACTIONS_TABLE} t ON i.transaction_id = t.id
    LEFT JOIN ${PAYMENT_METHODS_TABLE} pm ON t.payment_method_id = pm.id
    WHERE i.id = ?
  `;

  const stmt = db.prepare(query);
  return stmt.get(id) || null;
};

/**
 * Get income records by category
 * @param {number} categoryId - Category ID
 * @param {Object} options - Additional filter options
 * @returns {Array} - Array of income objects
 */
export const getIncomeByCategory = (categoryId, options = {}) => {
  return getAllIncome({ ...options, categoryId });
};

/**
 * Get income records by date
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {Object} options - Additional filter options
 * @returns {Array} - Array of income objects
 */
export const getIncomeByDate = (date, options = {}) => {
  return getAllIncome({ ...options, incomeDate: date });
};

/**
 * Get income records by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {Object} options - Additional filter options
 * @returns {Array} - Array of income objects
 */
export const getIncomeByDateRange = (startDate, endDate, options = {}) => {
  return getAllIncome({ ...options, dateFrom: startDate, dateTo: endDate });
};

/**
 * Get today's income
 * @param {Object} options - Filter options
 * @returns {Array} - Array of today's income objects
 */
export const getTodaysIncome = (options = {}) => {
  const today = new Date().toISOString().split('T')[0];
  return getAllIncome({ ...options, incomeDate: today });
};

/**
 * Get income for current month
 * @param {Object} options - Filter options
 * @returns {Array} - Array of current month's income objects
 */
export const getCurrentMonthIncome = (options = {}) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-31`;
  return getAllIncome({ ...options, dateFrom: startDate, dateTo: endDate });
};

/**
 * Create a new income record
 * @param {Object} incomeData - Income data
 * @param {number} incomeData.transactionId - Transaction ID (required)
 * @param {number} incomeData.categoryId - Category ID (required)
 * @param {number} incomeData.amount - Amount (required)
 * @param {string} incomeData.incomeDate - Income date (YYYY-MM-DD, required)
 * @param {string} incomeData.description - Description
 * @param {string} incomeData.payerName - Payer name
 * @param {string} incomeData.payerPhone - Payer phone
 * @param {string} incomeData.reference - Reference number
 * @param {string} incomeData.notes - Additional notes
 * @param {number} incomeData.createdBy - User ID who created the record
 * @returns {Object} - Created income object
 */
export const createIncome = (incomeData) => {
  const {
    transactionId,
    categoryId,
    amount,
    incomeDate,
    description,
    payerName,
    payerPhone,
    reference,
    notes,
    createdBy
  } = incomeData;

  // Validate required fields
  if (!transactionId) {
    throw new Error('Transaction ID is required');
  }
  if (!categoryId) {
    throw new Error('Category ID is required');
  }
  if (!amount || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  if (!incomeDate) {
    throw new Error('Income date is required');
  }

  const query = `
    INSERT INTO ${TABLE} 
      (transaction_id, category_id, amount, income_date, description, payer_name, payer_phone, reference, notes, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const stmt = db.prepare(query);
  const result = stmt.run(
    transactionId,
    categoryId,
    amount,
    incomeDate,
    description || null,
    payerName || null,
    payerPhone || null,
    reference || null,
    notes || null,
    createdBy,
    createdBy
  );

  return getIncomeById(result.lastInsertRowid);
};

/**
 * Update an income record
 * @param {number} id - Income ID
 * @param {Object} incomeData - Updated income data
 * @param {number} updatedBy - User ID who updated the record
 * @returns {Object} - Updated income object
 */
export const updateIncome = (id, incomeData, updatedBy) => {
  const {
    transactionId,
    categoryId,
    amount,
    incomeDate,
    description,
    payerName,
    payerPhone,
    reference,
    notes
  } = incomeData;

  // Check if income exists
  const existing = getIncomeById(id);
  if (!existing) {
    throw new Error(`Income record with ID ${id} not found`);
  }

  // Validate amount if provided
  if (amount !== undefined && (amount <= 0)) {
    throw new Error('Amount must be a positive number');
  }

  const updates = [];
  const params = [];

  if (transactionId !== undefined) {
    updates.push(`transaction_id = ?`);
    params.push(transactionId);
  }
  if (categoryId !== undefined) {
    updates.push(`category_id = ?`);
    params.push(categoryId);
  }
  if (amount !== undefined) {
    updates.push(`amount = ?`);
    params.push(amount);
  }
  if (incomeDate !== undefined) {
    updates.push(`income_date = ?`);
    params.push(incomeDate);
  }
  if (description !== undefined) {
    updates.push(`description = ?`);
    params.push(description || null);
  }
  if (payerName !== undefined) {
    updates.push(`payer_name = ?`);
    params.push(payerName || null);
  }
  if (payerPhone !== undefined) {
    updates.push(`payer_phone = ?`);
    params.push(payerPhone || null);
  }
  if (reference !== undefined) {
    updates.push(`reference = ?`);
    params.push(reference || null);
  }
  if (notes !== undefined) {
    updates.push(`notes = ?`);
    params.push(notes || null);
  }

  if (updates.length === 0) {
    return getIncomeById(id);
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

  return getIncomeById(id);
};

/**
 * Delete an income record
 * @param {number} id - Income ID
 * @returns {boolean} - True if deleted, false if not found
 */
export const deleteIncome = (id) => {
  // Check if income exists
  const existing = getIncomeById(id);
  if (!existing) {
    return false;
  }

  const query = `DELETE FROM ${TABLE} WHERE id = ?`;
  const stmt = db.prepare(query);
  const result = stmt.run(id);

  return result.changes > 0;
};

/**
 * Get the total count of income records
 * @param {Object} options - Filter options (same as getAllIncome)
 * @returns {number} - Total count
 */
export const getIncomeCount = (options = {}) => {
  const {
    categoryId,
    incomeDate,
    dateFrom,
    dateTo,
    search
  } = options;

  let query = `SELECT COUNT(*) as count FROM ${TABLE} i`;
  const params = [];
  const conditions = [];

  if (categoryId) {
    conditions.push(`i.category_id = ?`);
    params.push(categoryId);
  }

  if (incomeDate) {
    conditions.push(`i.income_date = ?`);
    params.push(incomeDate);
  }

  if (dateFrom) {
    conditions.push(`i.income_date >= ?`);
    params.push(dateFrom);
  }

  if (dateTo) {
    conditions.push(`i.income_date <= ?`);
    params.push(dateTo);
  }

  if (search) {
    conditions.push(`(i.description LIKE ? OR i.payer_name LIKE ? OR i.reference LIKE ?)`);
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const stmt = db.prepare(query);
  const result = stmt.get(...params);
  return result ? result.count : 0;
};

/**
 * Get total income amount for a given filter
 * @param {Object} options - Filter options (same as getAllIncome)
 * @returns {number} - Total income amount
 */
export const getTotalIncomeAmount = (options = {}) => {
  const {
    categoryId,
    incomeDate,
    dateFrom,
    dateTo
  } = options;

  let query = `SELECT COALESCE(SUM(amount), 0) as total FROM ${TABLE} i`;
  const params = [];
  const conditions = [];

  if (categoryId) {
    conditions.push(`i.category_id = ?`);
    params.push(categoryId);
  }

  if (incomeDate) {
    conditions.push(`i.income_date = ?`);
    params.push(incomeDate);
  }

  if (dateFrom) {
    conditions.push(`i.income_date >= ?`);
    params.push(dateFrom);
  }

  if (dateTo) {
    conditions.push(`i.income_date <= ?`);
    params.push(dateTo);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const stmt = db.prepare(query);
  const result = stmt.get(...params);
  return result ? parseFloat(result.total) : 0;
};

/**
 * Get income statistics
 * @param {Object} options - Filter options
 * @returns {Object} - Statistics object
 */
export const getIncomeStatistics = (options = {}) => {
  const {
    categoryId,
    dateFrom,
    dateTo
  } = options;

  let whereClause = '';
  const params = [];
  const conditions = [];

  if (categoryId) {
    conditions.push(`i.category_id = ?`);
    params.push(categoryId);
  }

  if (dateFrom) {
    conditions.push(`i.income_date >= ?`);
    params.push(dateFrom);
  }

  if (dateTo) {
    conditions.push(`i.income_date <= ?`);
    params.push(dateTo);
  }

  if (conditions.length > 0) {
    whereClause = ` WHERE ${conditions.join(' AND ')}`;
  }

  const query = `
    SELECT 
      COUNT(*) as total_records,
      COALESCE(SUM(amount), 0) as total_amount,
      AVG(amount) as average_amount,
      MIN(amount) as minimum_amount,
      MAX(amount) as maximum_amount
    FROM ${TABLE} i
    ${whereClause}
  `;

  const stmt = db.prepare(query);
  return stmt.get(...params) || {
    total_records: 0,
    total_amount: 0,
    average_amount: 0,
    minimum_amount: 0,
    maximum_amount: 0
  };
};

/**
 * Get income by category with totals
 * @param {Object} options - Filter options
 * @returns {Array} - Array of category summaries with totals
 */
export const getIncomeByCategorySummary = (options = {}) => {
  const {
    dateFrom,
    dateTo
  } = options;

  let whereClause = '';
  const params = [];
  const conditions = [];

  if (dateFrom) {
    conditions.push(`i.income_date >= ?`);
    params.push(dateFrom);
  }

  if (dateTo) {
    conditions.push(`i.income_date <= ?`);
    params.push(dateTo);
  }

  if (conditions.length > 0) {
    whereClause = ` WHERE ${conditions.join(' AND ')}`;
  }

  const query = `
    SELECT 
      ic.id as category_id,
      ic.name as category_name,
      ic.description as category_description,
      COUNT(i.id) as record_count,
      COALESCE(SUM(i.amount), 0) as total_amount
    FROM ${CATEGORIES_TABLE} ic
    LEFT JOIN ${TABLE} i ON ic.id = i.category_id
    ${whereClause}
    GROUP BY ic.id, ic.name, ic.description
    ORDER BY total_amount DESC, ic.name ASC
  `;

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

// Export field constants
export { FIELDS, TABLE };

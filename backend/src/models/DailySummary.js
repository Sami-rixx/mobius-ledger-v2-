import db from '../config/database.js';
import { toCents, fromCents, getAmount } from '../utils/money.js';

/**
 * DailySummary Model
 * Data access layer for daily financial summaries
 * 
 * Stores pre-computed daily summaries for:
 * - Total income
 * - Total expenses
 * - Net flow (income - expenses)
 * - Transaction count
 * - Date
 * 
 * This table is populated by a daily cron job or trigger
 */

// Table name
const TABLE = 'daily_summaries';

// Related tables
const INCOME_TABLE = 'income';
const EXPENSES_TABLE = 'expenses';
const TRANSACTIONS_TABLE = 'transactions';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  DATE: 'summary_date',
  TOTAL_INCOME: 'total_income',
  TOTAL_INCOME_CENTS: 'total_income_cents',
  INCOME_COUNT: 'income_count',
  TOTAL_EXPENSES: 'total_expenses',
  TOTAL_EXPENSES_CENTS: 'total_expenses_cents',
  EXPENSE_COUNT: 'expense_count',
  NET_FLOW: 'net_flow',
  NET_FLOW_CENTS: 'net_flow_cents',
  TRANSACTION_COUNT: 'transaction_count',
  CREATED_AT: 'created_at'
};

/**
 * Get all daily summaries with optional filtering
 * @param {Object} options - Filter options
 * @param {string} options.startDate - Filter by start date (inclusive)
 * @param {string} options.endDate - Filter by end date (inclusive)
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDirection - ASC or DESC
 * @returns {Promise<Array>} - Array of daily summary records
 */
export async function getAll(options = {}) {
  const {
    startDate,
    endDate,
    limit = 1000,
    offset = 0,
    orderBy = FIELDS.DATE,
    orderDirection = 'DESC'
  } = options;

  // Validate order direction
  const validOrderDirections = ['ASC', 'DESC'];
  if (!validOrderDirections.includes(orderDirection.toUpperCase())) {
    throw new Error(`Invalid orderDirection. Must be one of: ${validOrderDirections.join(', ')}`);
  }

  // Validate order by field
  const validOrderByFields = Object.values(FIELDS);
  if (orderBy && !validOrderByFields.includes(orderBy)) {
    throw new Error(`Invalid orderBy field. Must be one of: ${validOrderByFields.join(', ')}`);
  }

  let query = `SELECT * FROM ${TABLE}`;
  const params = [];

  // Build WHERE clause
  const whereClauses = [];
  
  if (startDate) {
    whereClauses.push(`${FIELDS.DATE} >= ?`);
    params.push(startDate);
  }
  
  if (endDate) {
    whereClauses.push(`${FIELDS.DATE} <= ?`);
    params.push(endDate);
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  // Add ordering
  const orderByField = validOrderByFields.includes(orderBy) ? orderBy : FIELDS.DATE;
  query += ` ORDER BY ${orderByField} ${orderDirection}`;

  // Add pagination
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const stmt = db.prepare(query);
  const rows = stmt.all(...params);
  return rows.map(row => ({
    ...row,
    total_income: getAmount(row, FIELDS.TOTAL_INCOME, FIELDS.TOTAL_INCOME_CENTS),
    total_expenses: getAmount(row, FIELDS.TOTAL_EXPENSES, FIELDS.TOTAL_EXPENSES_CENTS),
    net_flow: getAmount(row, FIELDS.NET_FLOW, FIELDS.NET_FLOW_CENTS)
  }));
}

/**
 * Get a daily summary by date
 * @param {string} date - Summary date (YYYY-MM-DD)
 * @returns {Promise<Object|undefined>} - Daily summary record or undefined
 */
export async function getByDate(date) {
  if (!date) {
    throw new Error('Date is required');
  }

  const stmt = db.prepare(`
    SELECT * FROM ${TABLE} 
    WHERE ${FIELDS.DATE} = ?
    LIMIT 1
  `);
  
  const row = stmt.get(date);
  if (!row) return undefined;
  return {
    ...row,
    total_income: getAmount(row, FIELDS.TOTAL_INCOME, FIELDS.TOTAL_INCOME_CENTS),
    total_expenses: getAmount(row, FIELDS.TOTAL_EXPENSES, FIELDS.TOTAL_EXPENSES_CENTS),
    net_flow: getAmount(row, FIELDS.NET_FLOW, FIELDS.NET_FLOW_CENTS)
  };
}

/**
 * Get daily summary by ID
 * @param {number} id - Summary record ID
 * @returns {Promise<Object|undefined>} - Daily summary record or undefined
 */
export async function getById(id) {
  if (!id) {
    throw new Error('ID is required');
  }

  const stmt = db.prepare(`SELECT * FROM ${TABLE} WHERE ${FIELDS.ID} = ?`);
  const row = stmt.get(id);
  if (!row) return undefined;
  return {
    ...row,
    total_income: getAmount(row, FIELDS.TOTAL_INCOME, FIELDS.TOTAL_INCOME_CENTS),
    total_expenses: getAmount(row, FIELDS.TOTAL_EXPENSES, FIELDS.TOTAL_EXPENSES_CENTS),
    net_flow: getAmount(row, FIELDS.NET_FLOW, FIELDS.NET_FLOW_CENTS)
  };
}

/**
 * Get the most recent daily summary
 * @returns {Promise<Object|undefined>} - Most recent daily summary or undefined
 */
export async function getLatest() {
  const stmt = db.prepare(`
    SELECT * FROM ${TABLE} 
    ORDER BY ${FIELDS.DATE} DESC 
    LIMIT 1
  `);
  
  const row = stmt.get();
  if (!row) return undefined;
  return {
    ...row,
    total_income: getAmount(row, FIELDS.TOTAL_INCOME, FIELDS.TOTAL_INCOME_CENTS),
    total_expenses: getAmount(row, FIELDS.TOTAL_EXPENSES, FIELDS.TOTAL_EXPENSES_CENTS),
    net_flow: getAmount(row, FIELDS.NET_FLOW, FIELDS.NET_FLOW_CENTS)
  };
}

/**
 * Get daily summaries for a specific date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of daily summaries in the date range
 */
export async function getByDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    throw new Error('Start date and end date are required');
  }

  const stmt = db.prepare(`
    SELECT * FROM ${TABLE} 
    WHERE ${FIELDS.DATE} BETWEEN ? AND ?
    ORDER BY ${FIELDS.DATE} ASC
  `);
  
  const rows = stmt.all(startDate, endDate);
  return rows.map(row => ({
    ...row,
    total_income: getAmount(row, FIELDS.TOTAL_INCOME, FIELDS.TOTAL_INCOME_CENTS),
    total_expenses: getAmount(row, FIELDS.TOTAL_EXPENSES, FIELDS.TOTAL_EXPENSES_CENTS),
    net_flow: getAmount(row, FIELDS.NET_FLOW, FIELDS.NET_FLOW_CENTS)
  }));
}

/**
 * Get daily summaries for a specific month
 * @param {string} year - Year (YYYY)
 * @param {string} month - Month (MM, 1-12)
 * @returns {Promise<Array>} - Array of daily summaries for the month
 */
export async function getByMonth(year, month) {
  if (!year || !month) {
    throw new Error('Year and month are required');
  }

  // Format: YYYY-MM
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  
  // Get last day of month
  const endDate = new Date(year, parseInt(month), 0).toISOString().split('T')[0];

  const stmt = db.prepare(`
    SELECT * FROM ${TABLE} 
    WHERE ${FIELDS.DATE} BETWEEN ? AND ?
    ORDER BY ${FIELDS.DATE} ASC
  `);
  
  const rows = stmt.all(startDate, endDate);
  return rows.map(row => ({
    ...row,
    total_income: getAmount(row, FIELDS.TOTAL_INCOME, FIELDS.TOTAL_INCOME_CENTS),
    total_expenses: getAmount(row, FIELDS.TOTAL_EXPENSES, FIELDS.TOTAL_EXPENSES_CENTS),
    net_flow: getAmount(row, FIELDS.NET_FLOW, FIELDS.NET_FLOW_CENTS)
  }));
}

/**
 * Get daily summaries for a specific week
 * @param {string} startDate - Start of week (YYYY-MM-DD, typically Monday)
 * @returns {Promise<Array>} - Array of daily summaries for the week
 */
export async function getByWeek(startDate) {
  if (!startDate) {
    throw new Error('Start date is required');
  }

  // Calculate end date (6 days after start)
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const endDate = end.toISOString().split('T')[0];

  const stmt = db.prepare(`
    SELECT * FROM ${TABLE} 
    WHERE ${FIELDS.DATE} BETWEEN ? AND ?
    ORDER BY ${FIELDS.DATE} ASC
  `);
  
  const rows = stmt.all(startDate, endDate);
  return rows.map(row => ({
    ...row,
    total_income: getAmount(row, FIELDS.TOTAL_INCOME, FIELDS.TOTAL_INCOME_CENTS),
    total_expenses: getAmount(row, FIELDS.TOTAL_EXPENSES, FIELDS.TOTAL_EXPENSES_CENTS),
    net_flow: getAmount(row, FIELDS.NET_FLOW, FIELDS.NET_FLOW_CENTS)
  }));
}

/**
 * Create a new daily summary record
 * @param {Object} data - Daily summary data
 * @param {string} data.summary_date - Summary date (YYYY-MM-DD)
 * @param {number} data.total_income - Total income for the day
 * @param {number} data.income_count - Number of income records
 * @param {number} data.total_expenses - Total expenses for the day
 * @param {number} data.expense_count - Number of expense records
 * @param {number} data.net_flow - Net flow (income - expenses)
 * @param {number} data.transaction_count - Total transaction count
 * @returns {Promise<Object>} - Created daily summary record with ID
 */
export async function create(data) {
  const requiredFields = [
    FIELDS.DATE,
    FIELDS.TOTAL_INCOME,
    FIELDS.INCOME_COUNT,
    FIELDS.TOTAL_EXPENSES,
    FIELDS.EXPENSE_COUNT,
    FIELDS.NET_FLOW,
    FIELDS.TRANSACTION_COUNT
  ];

  // Validate required fields
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Field '${field}' is required`);
    }
  }

  // Validate numeric fields
  const numericFields = [
    FIELDS.TOTAL_INCOME,
    FIELDS.INCOME_COUNT,
    FIELDS.TOTAL_EXPENSES,
    FIELDS.EXPENSE_COUNT,
    FIELDS.NET_FLOW,
    FIELDS.TRANSACTION_COUNT
  ];

  for (const field of numericFields) {
    if (isNaN(parseFloat(data[field]))) {
      throw new Error(`Field '${field}' must be a number`);
    }
  }

  // Convert to cents
  const totalIncomeCents = toCents(data[FIELDS.TOTAL_INCOME]);
  const totalExpensesCents = toCents(data[FIELDS.TOTAL_EXPENSES]);
  const netFlowCents = toCents(data[FIELDS.NET_FLOW]);

  const stmt = db.prepare(`
    INSERT INTO ${TABLE} (
      ${FIELDS.DATE}, ${FIELDS.TOTAL_INCOME}, ${FIELDS.TOTAL_INCOME_CENTS}, ${FIELDS.INCOME_COUNT},
      ${FIELDS.TOTAL_EXPENSES}, ${FIELDS.TOTAL_EXPENSES_CENTS}, ${FIELDS.EXPENSE_COUNT}, ${FIELDS.NET_FLOW}, ${FIELDS.NET_FLOW_CENTS},
      ${FIELDS.TRANSACTION_COUNT}
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    data[FIELDS.DATE],
    data[FIELDS.TOTAL_INCOME],
    totalIncomeCents,
    data[FIELDS.INCOME_COUNT],
    data[FIELDS.TOTAL_EXPENSES],
    totalExpensesCents,
    data[FIELDS.EXPENSE_COUNT],
    data[FIELDS.NET_FLOW],
    netFlowCents,
    data[FIELDS.TRANSACTION_COUNT]
  );
  
  return { 
    ...data,
    id: result.lastInsertRowid,
    total_income: getAmount(data, FIELDS.TOTAL_INCOME, FIELDS.TOTAL_INCOME_CENTS),
    total_expenses: getAmount(data, FIELDS.TOTAL_EXPENSES, FIELDS.TOTAL_EXPENSES_CENTS),
    net_flow: getAmount(data, FIELDS.NET_FLOW, FIELDS.NET_FLOW_CENTS)
  };
}

/**
 * Update a daily summary record
 * @param {number} id - Record ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated daily summary record
 */
export async function update(id, updates) {
  if (!id) {
    throw new Error('ID is required');
  }

  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('No updates provided');
  }

  // Validate numeric fields if present
  const numericFields = [
    FIELDS.TOTAL_INCOME,
    FIELDS.INCOME_COUNT,
    FIELDS.TOTAL_EXPENSES,
    FIELDS.EXPENSE_COUNT,
    FIELDS.NET_FLOW,
    FIELDS.TRANSACTION_COUNT
  ];

  for (const field of numericFields) {
    if (updates[field] !== undefined && isNaN(parseFloat(updates[field]))) {
      throw new Error(`Field '${field}' must be a number`);
    }
  }

  // Build update query
  const setClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && FIELDS[key]) {
      setClauses.push(`${FIELDS[key]} = ?`);
      params.push(value);
      
      // Also update the cents column if this is a monetary field
      if (key === 'TOTAL_INCOME' || key === 'total_income') {
        setClauses.push(`${FIELDS.TOTAL_INCOME_CENTS} = ?`);
        params.push(toCents(value));
      } else if (key === 'TOTAL_EXPENSES' || key === 'total_expenses') {
        setClauses.push(`${FIELDS.TOTAL_EXPENSES_CENTS} = ?`);
        params.push(toCents(value));
      } else if (key === 'NET_FLOW' || key === 'net_flow') {
        setClauses.push(`${FIELDS.NET_FLOW_CENTS} = ?`);
        params.push(toCents(value));
      }
    }
  }

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  params.push(id);

  const query = `
    UPDATE ${TABLE} 
    SET ${setClauses.join(', ')}
    WHERE ${FIELDS.ID} = ?
  `;

  const stmt = db.prepare(query);
  stmt.run(...params);
  
  // Return the updated record
  return getById(id);
}

/**
 * Delete a daily summary record
 * @param {number} id - Record ID
 * @returns {Promise<boolean>} - True if deleted, false otherwise
 */
export async function deleteRecord(id) {
  if (!id) {
    throw new Error('ID is required');
  }

  const stmt = db.prepare(`DELETE FROM ${TABLE} WHERE ${FIELDS.ID} = ?`);
  const result = stmt.run(id);
  
  return result.changes > 0;
}

/**
 * Get statistics for daily summaries
 * @param {Object} options - Filter options
 * @param {string} options.startDate - Filter by start date
 * @param {string} options.endDate - Filter by end date
 * @returns {Promise<Object>} - Summary statistics
 */
export async function getStatistics(options = {}) {
  const { startDate, endDate } = options;

  let whereClause = '';
  const params = [];

  if (startDate && endDate) {
    whereClause = `WHERE ${FIELDS.DATE} BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  } else if (startDate) {
    whereClause = `WHERE ${FIELDS.DATE} >= ?`;
    params.push(startDate);
  } else if (endDate) {
    whereClause = `WHERE ${FIELDS.DATE} <= ?`;
    params.push(endDate);
  }

  const query = `
    SELECT 
      COUNT(*) as total_days,
      COALESCE(SUM(${FIELDS.TOTAL_INCOME_CENTS}), SUM(${FIELDS.TOTAL_INCOME} * 100)) as total_income_cents,
      SUM(${FIELDS.INCOME_COUNT}) as total_income_records,
      COALESCE(SUM(${FIELDS.TOTAL_EXPENSES_CENTS}), SUM(${FIELDS.TOTAL_EXPENSES} * 100)) as total_expenses_cents,
      SUM(${FIELDS.EXPENSE_COUNT}) as total_expense_records,
      COALESCE(SUM(${FIELDS.NET_FLOW_CENTS}), SUM(${FIELDS.NET_FLOW} * 100)) as net_flow_cents,
      SUM(${FIELDS.TRANSACTION_COUNT}) as total_transactions,
      COALESCE(AVG(${FIELDS.TOTAL_INCOME_CENTS}), AVG(${FIELDS.TOTAL_INCOME} * 100)) as avg_daily_income_cents,
      COALESCE(AVG(${FIELDS.TOTAL_EXPENSES_CENTS}), AVG(${FIELDS.TOTAL_EXPENSES} * 100)) as avg_daily_expenses_cents,
      COALESCE(AVG(${FIELDS.NET_FLOW_CENTS}), AVG(${FIELDS.NET_FLOW} * 100)) as avg_daily_net_flow_cents
    FROM ${TABLE}
    ${whereClause}
  `;

  const stmt = db.prepare(query);
  const row = stmt.get(...params);
  if (!row) {
    return {
      total_days: 0,
      total_income: 0,
      total_income_records: 0,
      total_expenses: 0,
      total_expense_records: 0,
      net_flow: 0,
      total_transactions: 0,
      avg_daily_income: 0,
      avg_daily_expenses: 0,
      avg_daily_net_flow: 0
    };
  }
  return {
    ...row,
    total_income: parseFloat(fromCents(row.total_income_cents || 0)),
    total_expenses: parseFloat(fromCents(row.total_expenses_cents || 0)),
    net_flow: parseFloat(fromCents(row.net_flow_cents || 0)),
    avg_daily_income: parseFloat(fromCents(row.avg_daily_income_cents || 0)),
    avg_daily_expenses: parseFloat(fromCents(row.avg_daily_expenses_cents || 0)),
    avg_daily_net_flow: parseFloat(fromCents(row.avg_daily_net_flow_cents || 0))
  };
}

/**
 * Generate daily summary for a specific date
 * This method computes the summary from raw income and expense data
 * @param {string} date - Date to generate summary for (YYYY-MM-DD)
 * @returns {Promise<Object>} - Generated daily summary data
 */
export async function generateForDate(date) {
  if (!date) {
    throw new Error('Date is required');
  }

  // Get income data for the date - use COALESCE to prefer cents
  const incomeStmt = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount_cents), SUM(amount * 100)) as total_cents 
    FROM ${INCOME_TABLE} 
    WHERE income_date = ?
  `);
  
  const income = incomeStmt.get(date);

  // Get expense data for the date - use COALESCE to prefer cents
  const expenseStmt = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount_cents), SUM(amount * 100)) as total_cents 
    FROM ${EXPENSES_TABLE} 
    WHERE expense_date = ?
  `);
  
  const expenses = expenseStmt.get(date);

  // Get transaction count
  const transactionStmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM ${TRANSACTIONS_TABLE} 
    WHERE transaction_date = ?
  `);
  
  const transactions = transactionStmt.get(date);

  const netFlow = parseFloat(fromCents(income.total_cents || 0)) - parseFloat(fromCents(expenses.total_cents || 0));

  return {
    [FIELDS.DATE]: date,
    [FIELDS.TOTAL_INCOME]: parseFloat(fromCents(income.total_cents || 0)),
    [FIELDS.INCOME_COUNT]: income.count,
    [FIELDS.TOTAL_EXPENSES]: parseFloat(fromCents(expenses.total_cents || 0)),
    [FIELDS.EXPENSE_COUNT]: expenses.count,
    [FIELDS.NET_FLOW]: netFlow,
    [FIELDS.TRANSACTION_COUNT]: transactions.count
  };
}

/**
 * Generate and save daily summary for a date
 * If a summary already exists for the date, it will be updated
 * @param {string} date - Date to generate and save (YYYY-MM-DD)
 * @returns {Promise<Object>} - Saved daily summary record
 */
export async function generateAndSave(date) {
  const summaryData = await generateForDate(date);
  
  // Check if summary already exists for this date
  const existing = await getByDate(date);
  
  if (existing) {
    return update(existing.id, summaryData);
  } else {
    return create(summaryData);
  }
}

// Export all functions
export default {
  getAll,
  getByDate,
  getById,
  getLatest,
  getByDateRange,
  getByMonth,
  getByWeek,
  create,
  update,
  delete: deleteRecord,
  getStatistics,
  generateForDate,
  generateAndSave
};

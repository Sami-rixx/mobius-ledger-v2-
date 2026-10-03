import db from '../config/database.js';

/**
 * DailyLedger Model
 * Data access layer for daily ledger records
 * 
 * Tracks daily financial activities including:
 * - Opening balance
 * - Total income for the day
 * - Total expenses for the day
 * - Closing balance
 * - Net movement
 * - Transaction count
 * 
 * This table is automatically updated by triggers on transaction changes
 * and can also be manually updated for adjustments
 */

// Table name
const TABLE = 'daily_ledger';

// Related tables
const TRANSACTIONS_TABLE = 'transactions';
const INCOME_TABLE = 'income';
const EXPENSES_TABLE = 'expenses';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  DATE: 'date',
  OPENING_BALANCE: 'opening_balance',
  TOTAL_INCOME: 'total_income',
  TOTAL_EXPENSES: 'total_expenses',
  CLOSING_BALANCE: 'closing_balance',
  NET_MOVEMENT: 'net_movement',
  TRANSACTION_COUNT: 'transaction_count',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
};

/**
 * Get daily ledger record by ID
 * @param {number} id - Ledger record ID
 * @returns {Promise<Object|null>} - Single ledger record or null if not found
 */
export async function getById(id) {
  const row = await db.prepare(`SELECT * FROM ${TABLE} WHERE ${FIELDS.ID} = ?`).get([id]);
  return row || null;
}

/**
 * Get daily ledger record by date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object|null>} - Single ledger record or null if not found
 */
export async function getByDate(date) {
  const row = await db.prepare(`SELECT * FROM ${TABLE} WHERE ${FIELDS.DATE} = ?`).get([date]);
  return row || null;
}

/**
 * Get all daily ledger records with optional filtering
 * @param {Object} options - Filter options
 * @param {string} options.startDate - Filter by start date (inclusive)
 * @param {string} options.endDate - Filter by end date (inclusive)
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDirection - ASC or DESC
 * @returns {Promise<Array>} - Array of daily ledger records
 */
export async function getAll(options = {}) {
  const {
    startDate,
    endDate,
    limit = 100,
    offset = 0,
    orderBy = FIELDS.DATE,
    orderDirection = 'DESC'
  } = options;

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

  // Validate orderBy to prevent SQL injection
  const validOrderFields = Object.values(FIELDS);
  const safeOrderBy = validOrderFields.includes(orderBy) ? orderBy : FIELDS.DATE;
  const safeOrderDirection = orderDirection === 'ASC' || orderDirection === 'DESC' ? orderDirection : 'DESC';

  const rows = await db.prepare(`SELECT * FROM ${TABLE} ${whereClause} ORDER BY ${safeOrderBy} ${safeOrderDirection} LIMIT ? OFFSET ?`).all([...params, limit, offset]);
  return rows;
}

/**
 * Get daily ledger records for a specific month
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<Array>} - Array of daily ledger records for the month
 */
export async function getByMonth(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  
  return getAll({ startDate, endDate, orderBy: FIELDS.DATE, orderDirection: 'ASC' });
}

/**
 * Get the most recent daily ledger records
 * @param {number} limit - Number of recent records to return
 * @returns {Promise<Array>} - Array of recent daily ledger records
 */
export async function getRecent(limit = 10) {
  return getAll({ limit, orderBy: FIELDS.DATE, orderDirection: 'DESC' });
}

/**
 * Get today's daily ledger record
 * @returns {Promise<Object|null>} - Today's ledger record or null if not found
 */
export async function getToday() {
  const today = new Date().toISOString().split('T')[0];
  return getByDate(today);
}

/**
 * Get yesterday's daily ledger record
 * @returns {Promise<Object|null>} - Yesterday's ledger record or null if not found
 */
export async function getYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  return getByDate(dateStr);
}

/**
 * Count total daily ledger records
 * @param {Object} options - Filter options (same as getAll)
 * @returns {Promise<number>} - Total count of records
 */
export async function count(options = {}) {
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

  const result = await db.prepare(`SELECT COUNT(*) as count FROM ${TABLE} ${whereClause}`).get(params);
  return result.count || 0;
}

/**
 * Create a new daily ledger record
 * @param {Object} data - Ledger data
 * @param {string} data.date - Date in YYYY-MM-DD format
 * @param {number} data.opening_balance - Opening balance for the day
 * @param {number} data.total_income - Total income for the day
 * @param {number} data.total_expenses - Total expenses for the day
 * @param {number} data.closing_balance - Closing balance for the day
 * @param {number} data.net_movement - Net movement (income - expenses)
 * @param {number} data.transaction_count - Number of transactions
 * @returns {Promise<Object>} - Created ledger record
 */
export async function create(data) {
  const {
    date,
    opening_balance = 0,
    total_income = 0,
    total_expenses = 0,
    closing_balance = 0,
    net_movement = 0,
    transaction_count = 0
  } = data;

  // Calculate net movement if not provided
  const calculatedNetMovement = net_movement || (total_income - total_expenses);
  
  // Calculate closing balance if not provided
  const calculatedClosingBalance = closing_balance || (opening_balance + calculatedNetMovement);

  const result = await db.prepare(`INSERT INTO ${TABLE} (${FIELDS.DATE}, ${FIELDS.OPENING_BALANCE}, ${FIELDS.TOTAL_INCOME}, ${FIELDS.TOTAL_EXPENSES}, ${FIELDS.CLOSING_BALANCE}, ${FIELDS.NET_MOVEMENT}, ${FIELDS.TRANSACTION_COUNT}) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`).run([
      date,
      opening_balance,
      total_income,
      total_expenses,
      calculatedClosingBalance,
      calculatedNetMovement,
      transaction_count
    ]);

  return getById(result.lastInsertRowid);
}

/**
 * Update an existing daily ledger record
 * @param {number} id - Ledger record ID
 * @param {Object} data - Ledger data to update
 * @returns {Promise<Object|null>} - Updated ledger record or null if not found
 */
export async function update(id, data) {
  const existing = await getById(id);
  if (!existing) return null;

  const {
    date = existing.date,
    opening_balance = existing.opening_balance,
    total_income = existing.total_income,
    total_expenses = existing.total_expenses,
    closing_balance = existing.closing_balance,
    net_movement = existing.net_movement,
    transaction_count = existing.transaction_count
  } = data;

  // Calculate net movement if income or expenses changed
  const calculatedNetMovement = net_movement || (total_income - total_expenses);
  
  // Calculate closing balance if opening balance or net movement changed
  const calculatedClosingBalance = closing_balance || (opening_balance + calculatedNetMovement);

  await db.prepare(`UPDATE ${TABLE} SET 
     ${FIELDS.DATE} = ?,
     ${FIELDS.OPENING_BALANCE} = ?,
     ${FIELDS.TOTAL_INCOME} = ?,
     ${FIELDS.TOTAL_EXPENSES} = ?,
     ${FIELDS.CLOSING_BALANCE} = ?,
     ${FIELDS.NET_MOVEMENT} = ?,
     ${FIELDS.TRANSACTION_COUNT} = ?,
     ${FIELDS.UPDATED_AT} = CURRENT_TIMESTAMP
     WHERE ${FIELDS.ID} = ?`).run([
      date,
      opening_balance,
      total_income,
      total_expenses,
      calculatedClosingBalance,
      calculatedNetMovement,
      transaction_count,
      id
    ]);

  return getById(id);
}

/**
 * Delete a daily ledger record
 * Note: This should be used with caution as it removes financial history
 * @param {number} id - Ledger record ID
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
export async function deleteById(id) {
  const result = await db.prepare(`DELETE FROM ${TABLE} WHERE ${FIELDS.ID} = ?`).run([id]);
  return result.changes > 0;
}

/**
 * Get daily ledger statistics for a date range
 * @param {Object} options - Filter options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @returns {Promise<Object>} - Statistics object
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

  const stats = await db.prepare(`SELECT 
     COUNT(*) as total_days,
     COALESCE(SUM(${FIELDS.TOTAL_INCOME}), 0) as total_income,
     COALESCE(SUM(${FIELDS.TOTAL_EXPENSES}), 0) as total_expenses,
     COALESCE(SUM(${FIELDS.NET_MOVEMENT}), 0) as net_movement,
     COALESCE(SUM(${FIELDS.TRANSACTION_COUNT}), 0) as total_transactions,
     COALESCE(AVG(${FIELDS.TRANSACTION_COUNT}), 0) as avg_transactions_per_day,
     MIN(${FIELDS.DATE}) as first_date,
     MAX(${FIELDS.DATE}) as last_date
     FROM ${TABLE} ${whereClause}`).get(params);

  return stats || {
    total_days: 0,
    total_income: 0,
    total_expenses: 0,
    net_movement: 0,
    total_transactions: 0,
    avg_transactions_per_day: 0,
    first_date: null,
    last_date: null
  };
}

/**
 * Get daily ledger records with missing data (gaps in date sequence)
 * @param {Object} options - Filter options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @returns {Promise<Array>} - Array of missing dates
 */
export async function getMissingDates(options = {}) {
  const { startDate, endDate } = options;
  
  if (!startDate || !endDate) {
    // Default to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return getMissingDates({ 
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  }

  // Get all dates in the range that are missing from the ledger
  const rows = await db.prepare(`WITH date_series AS (
      SELECT date(${FIELDS.DATE}, '+' || (n || ' days') || '') as date_value
      FROM (
        SELECT 0 as n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
      )
      CROSS JOIN (
        SELECT ${FIELDS.DATE} FROM ${TABLE} WHERE ${FIELDS.DATE} BETWEEN ? AND ? LIMIT 1
      )
      WHERE date_value BETWEEN ? AND ?
    )
    SELECT date_value as missing_date
    FROM date_series
    WHERE date_value NOT IN (SELECT ${FIELDS.DATE} FROM ${TABLE} WHERE ${FIELDS.DATE} BETWEEN ? AND ?)
    ORDER BY date_value`).all([startDate, endDate, startDate, endDate, startDate, endDate]);

  return rows.map(row => row.missing_date);
}

/**
 * Generate daily ledger for a specific date by aggregating transactions
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} - Generated ledger data
 */
export async function generateForDate(date) {
  // Get existing ledger for this date
  const existing = await getByDate(date);
  if (existing) {
    return existing;
  }

  // Get previous day's ledger for opening balance
  const previousDay = new Date(date);
  previousDay.setDate(previousDay.getDate() - 1);
  const previousDate = previousDay.toISOString().split('T')[0];
  const previousLedger = await getByDate(previousDate);
  
  const openingBalance = previousLedger ? previousLedger.closing_balance : 0;

  // Get transactions for the date
  // NOTE: this is an aggregate query (no GROUP BY) so it always returns a
  // single row - it must be fetched with .get(), not .all(). It must also
  // filter on the real `transaction_type` column/values (lowercase, as
  // enforced by the CHECK constraint on transactions.transaction_type), not
  // a non-existent `type` column, and must classify income-like vs
  // expense-like transaction types the same way the trg_transaction_insert
  // trigger does (income, school_fee, lunch_fee, student_charge vs expense,
  // director_withdrawal).
  const transactions = await db.prepare(`SELECT 
     COALESCE(SUM(CASE WHEN transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN amount ELSE 0 END), 0) as total_income,
     COALESCE(SUM(CASE WHEN transaction_type IN ('expense', 'director_withdrawal') THEN amount ELSE 0 END), 0) as total_expenses,
     COUNT(*) as transaction_count
     FROM ${TRANSACTIONS_TABLE} 
     WHERE transaction_date = ?`).get([date]);

  const totalIncome = parseFloat(transactions.total_income) || 0;
  const totalExpenses = parseFloat(transactions.total_expenses) || 0;
  const transactionCount = transactions.transaction_count || 0;
  const netMovement = totalIncome - totalExpenses;
  const closingBalance = openingBalance + netMovement;

  return {
    date,
    opening_balance: openingBalance,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    closing_balance: closingBalance,
    net_movement: netMovement,
    transaction_count: transactionCount
  };
}

/**
 * Generate daily ledger for a date range
 * @param {Object} options - Options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {boolean} options.force - Force regeneration even if records exist
 * @returns {Promise<Array>} - Array of generated ledger records
 */
export async function generateForDateRange(options = {}) {
  const { startDate, endDate, force = false } = options;
  
  if (!startDate || !endDate) {
    // Default to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return generateForDateRange({
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      force
    });
  }

  // Get all dates in the range
  const dateList = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    dateList.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const results = [];
  
  for (const date of dateList) {
    const existing = await getByDate(date);
    
    if (existing && !force) {
      results.push(existing);
    } else {
      const generated = await generateForDate(date);
      if (force) {
        // Update or create the record
        if (existing) {
          await update(existing.id, generated);
        } else {
          await create(generated);
        }
      }
      results.push(generated);
    }
  }

  return results;
}

// Export constants
export { TABLE, FIELDS };

// Export model name for consistency
export const MODEL_NAME = 'DailyLedger';

// Default export so `backend/src/models/index.js` can do
// `export { default as DailyLedger, ... } from './DailyLedger.js'`. This
// file previously only had named exports, which would crash the backend on
// startup (see StudentCharge.js comment for the full explanation).
export default {
  TABLE,
  FIELDS,
  MODEL_NAME,
  getById,
  getByDate,
  getAll,
  getByMonth,
  getRecent,
  getToday,
  getYesterday,
  count,
  create,
  update,
  deleteById,
  getStatistics,
  getMissingDates,
  generateForDate,
  generateForDateRange
};

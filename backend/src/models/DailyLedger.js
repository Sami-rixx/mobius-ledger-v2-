import db from '../config/database.js';
import { toCents, fromCents, getAmount } from '../utils/money.js';

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
  OPENING_BALANCE_CENTS: 'opening_balance_cents',
  TOTAL_INCOME: 'total_income',
  TOTAL_INCOME_CENTS: 'total_income_cents',
  TOTAL_EXPENSES: 'total_expenses',
  TOTAL_EXPENSES_CENTS: 'total_expenses_cents',
  CLOSING_BALANCE: 'closing_balance',
  CLOSING_BALANCE_CENTS: 'closing_balance_cents',
  NET_MOVEMENT: 'net_movement',
  NET_MOVEMENT_CENTS: 'net_movement_cents',
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
  const row = await db.get(
    `SELECT * FROM ${TABLE} WHERE ${FIELDS.ID} = ?`,
    [id]
  );
  if (!row) return null;
  return {
    ...row,
    opening_balance: getAmount(row, FIELDS.OPENING_BALANCE, FIELDS.OPENING_BALANCE_CENTS),
    total_income: getAmount(row, FIELDS.TOTAL_INCOME, FIELDS.TOTAL_INCOME_CENTS),
    total_expenses: getAmount(row, FIELDS.TOTAL_EXPENSES, FIELDS.TOTAL_EXPENSES_CENTS),
    closing_balance: getAmount(row, FIELDS.CLOSING_BALANCE, FIELDS.CLOSING_BALANCE_CENTS),
    net_movement: getAmount(row, FIELDS.NET_MOVEMENT, FIELDS.NET_MOVEMENT_CENTS)
  };
}

/**
 * Get daily ledger record by date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object|null>} - Single ledger record or null if not found
 */
export async function getByDate(date) {
  const row = await db.get(
    `SELECT * FROM ${TABLE} WHERE ${FIELDS.DATE} = ?`,
    [date]
  );
  if (!row) return null;
  return {
    ...row,
    opening_balance: getAmount(row, FIELDS.OPENING_BALANCE, FIELDS.OPENING_BALANCE_CENTS),
    total_income: getAmount(row, FIELDS.TOTAL_INCOME, FIELDS.TOTAL_INCOME_CENTS),
    total_expenses: getAmount(row, FIELDS.TOTAL_EXPENSES, FIELDS.TOTAL_EXPENSES_CENTS),
    closing_balance: getAmount(row, FIELDS.CLOSING_BALANCE, FIELDS.CLOSING_BALANCE_CENTS),
    net_movement: getAmount(row, FIELDS.NET_MOVEMENT, FIELDS.NET_MOVEMENT_CENTS)
  };
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

  const rows = await db.all(
    `SELECT * FROM ${TABLE} ${whereClause} ORDER BY ${safeOrderBy} ${safeOrderDirection} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return rows.map(row => ({
    ...row,
    opening_balance: getAmount(row, FIELDS.OPENING_BALANCE, FIELDS.OPENING_BALANCE_CENTS),
    total_income: getAmount(row, FIELDS.TOTAL_INCOME, FIELDS.TOTAL_INCOME_CENTS),
    total_expenses: getAmount(row, FIELDS.TOTAL_EXPENSES, FIELDS.TOTAL_EXPENSES_CENTS),
    closing_balance: getAmount(row, FIELDS.CLOSING_BALANCE, FIELDS.CLOSING_BALANCE_CENTS),
    net_movement: getAmount(row, FIELDS.NET_MOVEMENT, FIELDS.NET_MOVEMENT_CENTS)
  }));
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

  const result = await db.get(
    `SELECT COUNT(*) as count FROM ${TABLE} ${whereClause}`,
    params
  );
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

  // Convert to cents
  const openingBalanceCents = toCents(opening_balance);
  const totalIncomeCents = toCents(total_income);
  const totalExpensesCents = toCents(total_expenses);
  const closingBalanceCents = toCents(calculatedClosingBalance);
  const netMovementCents = toCents(calculatedNetMovement);

  const result = await db.run(
    `INSERT INTO ${TABLE} (${FIELDS.DATE}, ${FIELDS.OPENING_BALANCE}, ${FIELDS.OPENING_BALANCE_CENTS}, ${FIELDS.TOTAL_INCOME}, ${FIELDS.TOTAL_INCOME_CENTS}, ${FIELDS.TOTAL_EXPENSES}, ${FIELDS.TOTAL_EXPENSES_CENTS}, ${FIELDS.CLOSING_BALANCE}, ${FIELDS.CLOSING_BALANCE_CENTS}, ${FIELDS.NET_MOVEMENT}, ${FIELDS.NET_MOVEMENT_CENTS}, ${FIELDS.TRANSACTION_COUNT}) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      date,
      opening_balance,
      openingBalanceCents,
      total_income,
      totalIncomeCents,
      total_expenses,
      totalExpensesCents,
      calculatedClosingBalance,
      closingBalanceCents,
      calculatedNetMovement,
      netMovementCents,
      transaction_count
    ]
  );

  return getById(result.lastID);
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

  // Convert to cents
  const openingBalanceCents = toCents(opening_balance);
  const totalIncomeCents = toCents(total_income);
  const totalExpensesCents = toCents(total_expenses);
  const closingBalanceCents = toCents(calculatedClosingBalance);
  const netMovementCents = toCents(calculatedNetMovement);

  await db.run(
    `UPDATE ${TABLE} SET 
     ${FIELDS.DATE} = ?,
     ${FIELDS.OPENING_BALANCE} = ?,
     ${FIELDS.OPENING_BALANCE_CENTS} = ?,
     ${FIELDS.TOTAL_INCOME} = ?,
     ${FIELDS.TOTAL_INCOME_CENTS} = ?,
     ${FIELDS.TOTAL_EXPENSES} = ?,
     ${FIELDS.TOTAL_EXPENSES_CENTS} = ?,
     ${FIELDS.CLOSING_BALANCE} = ?,
     ${FIELDS.CLOSING_BALANCE_CENTS} = ?,
     ${FIELDS.NET_MOVEMENT} = ?,
     ${FIELDS.NET_MOVEMENT_CENTS} = ?,
     ${FIELDS.TRANSACTION_COUNT} = ?,
     ${FIELDS.UPDATED_AT} = CURRENT_TIMESTAMP
     WHERE ${FIELDS.ID} = ?`,
    [
      date,
      opening_balance,
      openingBalanceCents,
      total_income,
      totalIncomeCents,
      total_expenses,
      totalExpensesCents,
      calculatedClosingBalance,
      closingBalanceCents,
      calculatedNetMovement,
      netMovementCents,
      transaction_count,
      id
    ]
  );

  return getById(id);
}

/**
 * Delete a daily ledger record
 * Note: This should be used with caution as it removes financial history
 * @param {number} id - Ledger record ID
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
export async function deleteById(id) {
  const result = await db.run(
    `DELETE FROM ${TABLE} WHERE ${FIELDS.ID} = ?`,
    [id]
  );
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

  const stats = await db.get(
    `SELECT 
     COUNT(*) as total_days,
     COALESCE(SUM(${FIELDS.TOTAL_INCOME_CENTS}), SUM(${FIELDS.TOTAL_INCOME} * 100)) as total_income_cents,
     COALESCE(SUM(${FIELDS.TOTAL_EXPENSES_CENTS}), SUM(${FIELDS.TOTAL_EXPENSES} * 100)) as total_expenses_cents,
     COALESCE(SUM(${FIELDS.NET_MOVEMENT_CENTS}), SUM(${FIELDS.NET_MOVEMENT} * 100)) as net_movement_cents,
     COALESCE(SUM(${FIELDS.TRANSACTION_COUNT}), 0) as total_transactions,
     COALESCE(AVG(${FIELDS.TRANSACTION_COUNT}), 0) as avg_transactions_per_day,
     MIN(${FIELDS.DATE}) as first_date,
     MAX(${FIELDS.DATE}) as last_date
     FROM ${TABLE} ${whereClause}`,
    params
  );

  if (!stats) {
    return {
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
  
  return {
    ...stats,
    total_income: parseFloat(fromCents(stats.total_income_cents || 0)),
    total_expenses: parseFloat(fromCents(stats.total_expenses_cents || 0)),
    net_movement: parseFloat(fromCents(stats.net_movement_cents || 0))
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
  const rows = await db.all(
    `WITH date_series AS (
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
    ORDER BY date_value`,
    [startDate, endDate, startDate, endDate, startDate, endDate]
  );

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

  // Get transactions for the date - use COALESCE to prefer cents columns
  const transactions = await db.all(
    `SELECT 
     COALESCE(SUM(CASE WHEN transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN amount_cents ELSE 0 END), 
              SUM(CASE WHEN transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN amount * 100 ELSE 0 END)) as total_income_cents,
     COALESCE(SUM(CASE WHEN transaction_type IN ('expense', 'director_withdrawal') THEN amount_cents ELSE 0 END), 
              SUM(CASE WHEN transaction_type IN ('expense', 'director_withdrawal') THEN amount * 100 ELSE 0 END)) as total_expenses_cents,
     COUNT(*) as transaction_count
     FROM ${TRANSACTIONS_TABLE} 
     WHERE transaction_date = ?`,
    [date]
  );

  const totalIncome = parseFloat(fromCents(transactions.total_income_cents || 0));
  const totalExpenses = parseFloat(fromCents(transactions.total_expenses_cents || 0));
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

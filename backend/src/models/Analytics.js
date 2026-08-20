import db from '../config/database.js';

/**
 * Analytics Model
 * Data access layer for analytics and statistical data
 * 
 * Provides pre-computed and computed analytics:
 * - Income and expense trends
 * - Category breakdowns
 * - Net cash flow analysis
 * - Top income sources and expenses
 * - Student balance analytics
 */

// Table names
const INCOME_TABLE = 'income';
const EXPENSES_TABLE = 'expenses';
const INCOME_CATEGORIES_TABLE = 'income_categories';
const EXPENSE_CATEGORIES_TABLE = 'expense_categories';
const STUDENTS_TABLE = 'students';
const STUDENT_CHARGES_TABLE = 'student_charges';
const TRANSACTIONS_TABLE = 'transactions';
const USERS_TABLE = 'users';

// Field name mappings
const INCOME_FIELDS = {
  ID: 'id',
  AMOUNT: 'amount',
  CATEGORY_ID: 'income_category_id',
  DATE: 'income_date',
  PAYER: 'payer_name',
  PAYMENT_METHOD: 'payment_method',
  IS_VERIFIED: 'is_verified'
};

const EXPENSE_FIELDS = {
  ID: 'id',
  AMOUNT: 'amount',
  CATEGORY_ID: 'expense_category_id',
  DATE: 'expense_date',
  VENDOR: 'vendor_name',
  IS_VERIFIED: 'is_verified'
};

/**
 * Get income vs expense comparison for a date range
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date (YYYY-MM-DD)
 * @param {string} options.endDate - End date (YYYY-MM-DD)
 * @param {string} options.groupBy - Group by: 'day', 'week', 'month', 'year'
 * @returns {Promise<Array>} - Array of comparison data
 */
export async function getIncomeVsExpense(options = {}) {
  const { startDate, endDate, groupBy = 'month' } = options;

  if (!startDate || !endDate) {
    throw new Error('Start date and end date are required');
  }

  // Validate groupBy
  const validGroupBy = ['day', 'week', 'month', 'year'];
  if (!validGroupBy.includes(groupBy)) {
    throw new Error(`Invalid groupBy. Must be one of: ${validGroupBy.join(', ')}`);
  }

  // Build date truncation based on groupBy
  let dateTrunc = '';
  switch (groupBy) {
    case 'day':
      dateTrunc = "strftime('%Y-%m-%d', income_date) as period";
      break;
    case 'week':
      dateTrunc = "strftime('%Y-%W', income_date) as period";
      break;
    case 'month':
      dateTrunc = "strftime('%Y-%m', income_date) as period";
      break;
    case 'year':
      dateTrunc = "strftime('%Y', income_date) as period";
      break;
  }

  // Query for income and expense data
  const query = `
    SELECT 
      ${dateTrunc},
      SUM(CASE WHEN source = 'income' THEN amount ELSE 0 END) as total_income,
      COUNT(CASE WHEN source = 'income' THEN 1 END) as income_count,
      SUM(CASE WHEN source = 'expense' THEN amount ELSE 0 END) as total_expenses,
      COUNT(CASE WHEN source = 'expense' THEN 1 END) as expense_count,
      SUM(CASE WHEN source = 'income' THEN amount ELSE -amount END) as net_flow
    FROM (
      SELECT 
        income_date,
        amount,
        'income' as source
      FROM ${INCOME_TABLE}
      WHERE income_date BETWEEN ? AND ?
      
      UNION ALL
      
      SELECT 
        expense_date as income_date,
        amount,
        'expense' as source
      FROM ${EXPENSES_TABLE}
      WHERE expense_date BETWEEN ? AND ?
    )
    GROUP BY period
    ORDER BY period
  `;

  const stmt = db.prepare(query);
  return stmt.all(startDate, endDate, startDate, endDate);
}

/**
 * Get income statistics by category
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {number} options.limit - Limit results
 * @returns {Promise<Array>} - Array of category statistics
 */
export async function getIncomeByCategory(options = {}) {
  const { startDate, endDate, limit = 100 } = options;

  let query = `
    SELECT 
      ic.id as category_id,
      ic.name as category_name,
      COUNT(i.id) as count,
      COALESCE(SUM(i.amount), 0) as total_amount,
      AVG(i.amount) as avg_amount,
      MIN(i.amount) as min_amount,
      MAX(i.amount) as max_amount
    FROM ${INCOME_CATEGORIES_TABLE} ic
    LEFT JOIN ${INCOME_TABLE} i ON ic.id = i.income_category_id
  `;

  const params = [];

  if (startDate && endDate) {
    query += ` AND i.income_date BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  } else if (startDate) {
    query += ` AND i.income_date >= ?`;
    params.push(startDate);
  } else if (endDate) {
    query += ` AND i.income_date <= ?`;
    params.push(endDate);
  }

  query += `
    GROUP BY ic.id, ic.name
    ORDER BY total_amount DESC
    LIMIT ?
  `;
  params.push(limit);

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

/**
 * Get expense statistics by category
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {number} options.limit - Limit results
 * @returns {Promise<Array>} - Array of category statistics
 */
export async function getExpensesByCategory(options = {}) {
  const { startDate, endDate, limit = 100 } = options;

  let query = `
    SELECT 
      ec.id as category_id,
      ec.name as category_name,
      ec.is_kitchen,
      COUNT(e.id) as count,
      COALESCE(SUM(e.amount), 0) as total_amount,
      AVG(e.amount) as avg_amount,
      MIN(e.amount) as min_amount,
      MAX(e.amount) as max_amount
    FROM ${EXPENSE_CATEGORIES_TABLE} ec
    LEFT JOIN ${EXPENSES_TABLE} e ON ec.id = e.expense_category_id
  `;

  const params = [];

  if (startDate && endDate) {
    query += ` AND e.expense_date BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  } else if (startDate) {
    query += ` AND e.expense_date >= ?`;
    params.push(startDate);
  } else if (endDate) {
    query += ` AND e.expense_date <= ?`;
    params.push(endDate);
  }

  query += `
    GROUP BY ec.id, ec.name, ec.is_kitchen
    ORDER BY total_amount DESC
    LIMIT ?
  `;
  params.push(limit);

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

/**
 * Get top income sources
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {number} options.limit - Limit results
 * @returns {Promise<Array>} - Array of top income sources
 */
export async function getTopIncomeSources(options = {}) {
  const { startDate, endDate, limit = 10 } = options;

  let query = `
    SELECT 
      payer_name as source,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total_amount,
      AVG(amount) as avg_amount
    FROM ${INCOME_TABLE}
  `;

  const params = [];

  if (startDate && endDate) {
    query += ` WHERE income_date BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  } else if (startDate) {
    query += ` WHERE income_date >= ?`;
    params.push(startDate);
  } else if (endDate) {
    query += ` WHERE income_date <= ?`;
    params.push(endDate);
  }

  query += `
    GROUP BY payer_name
    ORDER BY total_amount DESC
    LIMIT ?
  `;
  params.push(limit);

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

/**
 * Get top expenses (by vendor)
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {number} options.limit - Limit results
 * @returns {Promise<Array>} - Array of top expenses
 */
export async function getTopExpenses(options = {}) {
  const { startDate, endDate, limit = 10 } = options;

  let query = `
    SELECT 
      vendor_name as vendor,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total_amount,
      AVG(amount) as avg_amount
    FROM ${EXPENSES_TABLE}
  `;

  const params = [];

  if (startDate && endDate) {
    query += ` WHERE expense_date BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  } else if (startDate) {
    query += ` WHERE expense_date >= ?`;
    params.push(startDate);
  } else if (endDate) {
    query += ` WHERE expense_date <= ?`;
    params.push(endDate);
  }

  query += `
    GROUP BY vendor_name
    ORDER BY total_amount DESC
    LIMIT ?
  `;
  params.push(limit);

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

/**
 * Get overall statistics
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @returns {Promise<Object>} - Overall statistics
 */
export async function getOverallStatistics(options = {}) {
  const { startDate, endDate } = options;

  let incomeWhere = '';
  let expenseWhere = '';
  const params = [];

  if (startDate && endDate) {
    incomeWhere = 'WHERE income_date BETWEEN ? AND ?';
    expenseWhere = 'WHERE expense_date BETWEEN ? AND ?';
    params.push(startDate, endDate, startDate, endDate);
  } else if (startDate) {
    incomeWhere = 'WHERE income_date >= ?';
    expenseWhere = 'WHERE expense_date >= ?';
    params.push(startDate, startDate);
  } else if (endDate) {
    incomeWhere = 'WHERE income_date <= ?';
    expenseWhere = 'WHERE expense_date <= ?';
    params.push(endDate, endDate);
  }

  // Get income stats
  const incomeQuery = `
    SELECT 
      COUNT(*) as total_records,
      COALESCE(SUM(amount), 0) as total_amount,
      AVG(amount) as avg_amount,
      MIN(amount) as min_amount,
      MAX(amount) as max_amount
    FROM ${INCOME_TABLE}
    ${incomeWhere}
  `;

  // Get expense stats
  const expenseQuery = `
    SELECT 
      COUNT(*) as total_records,
      COALESCE(SUM(amount), 0) as total_amount,
      AVG(amount) as avg_amount,
      MIN(amount) as min_amount,
      MAX(amount) as max_amount
    FROM ${EXPENSES_TABLE}
    ${expenseWhere}
  `;

  const incomeStmt = db.prepare(incomeQuery);
  const expenseStmt = db.prepare(expenseQuery);

  const [incomeStats, expenseStats] = [
    incomeStmt.get(...params.slice(0, params.length / 2)),
    expenseStmt.get(...params.slice(params.length / 2))
  ];

  const netFlow = (incomeStats?.total_amount || 0) - (expenseStats?.total_amount || 0);

  return {
    income: incomeStats || { total_records: 0, total_amount: 0, avg_amount: 0, min_amount: 0, max_amount: 0 },
    expenses: expenseStats || { total_records: 0, total_amount: 0, avg_amount: 0, min_amount: 0, max_amount: 0 },
    net_flow: netFlow,
    total_records: (incomeStats?.total_records || 0) + (expenseStats?.total_records || 0),
    total_amount: (incomeStats?.total_amount || 0) + (expenseStats?.total_amount || 0)
  };
}

/**
 * Get income trends over time
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {string} options.interval - Interval: 'day', 'week', 'month'
 * @returns {Promise<Array>} - Array of trend data points
 */
export async function getIncomeTrends(options = {}) {
  const { startDate, endDate, interval = 'month' } = options;

  if (!startDate || !endDate) {
    throw new Error('Start date and end date are required');
  }

  const validIntervals = ['day', 'week', 'month'];
  if (!validIntervals.includes(interval)) {
    throw new Error(`Invalid interval. Must be one of: ${validIntervals.join(', ')}`);
  }

  // Build date formatting based on interval
  let dateFormat = '';
  switch (interval) {
    case 'day':
      dateFormat = "strftime('%Y-%m-%d', income_date) as period";
      break;
    case 'week':
      dateFormat = "strftime('%Y-%W', income_date) as period";
      break;
    case 'month':
      dateFormat = "strftime('%Y-%m', income_date) as period";
      break;
  }

  const query = `
    SELECT 
      ${dateFormat},
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total_amount,
      AVG(amount) as avg_amount
    FROM ${INCOME_TABLE}
    WHERE income_date BETWEEN ? AND ?
    GROUP BY period
    ORDER BY period
  `;

  const stmt = db.prepare(query);
  return stmt.all(startDate, endDate);
}

/**
 * Get expense trends over time
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {string} options.interval - Interval: 'day', 'week', 'month'
 * @returns {Promise<Array>} - Array of trend data points
 */
export async function getExpenseTrends(options = {}) {
  const { startDate, endDate, interval = 'month' } = options;

  if (!startDate || !endDate) {
    throw new Error('Start date and end date are required');
  }

  const validIntervals = ['day', 'week', 'month'];
  if (!validIntervals.includes(interval)) {
    throw new Error(`Invalid interval. Must be one of: ${validIntervals.join(', ')}`);
  }

  // Build date formatting based on interval
  let dateFormat = '';
  switch (interval) {
    case 'day':
      dateFormat = "strftime('%Y-%m-%d', expense_date) as period";
      break;
    case 'week':
      dateFormat = "strftime('%Y-%W', expense_date) as period";
      break;
    case 'month':
      dateFormat = "strftime('%Y-%m', expense_date) as period";
      break;
  }

  const query = `
    SELECT 
      ${dateFormat},
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total_amount,
      AVG(amount) as avg_amount
    FROM ${EXPENSES_TABLE}
    WHERE expense_date BETWEEN ? AND ?
    GROUP BY period
    ORDER BY period
  `;

  const stmt = db.prepare(query);
  return stmt.all(startDate, endDate);
}

/**
 * Get net cash flow trends over time
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {string} options.interval - Interval: 'day', 'week', 'month'
 * @returns {Promise<Array>} - Array of trend data points
 */
export async function getNetFlowTrends(options = {}) {
  const { startDate, endDate, interval = 'month' } = options;

  if (!startDate || !endDate) {
    throw new Error('Start date and end date are required');
  }

  const validIntervals = ['day', 'week', 'month'];
  if (!validIntervals.includes(interval)) {
    throw new Error(`Invalid interval. Must be one of: ${validIntervals.join(', ')}`);
  }

  // Build date formatting based on interval
  let dateFormat = '';
  switch (interval) {
    case 'day':
      dateFormat = "strftime('%Y-%m-%d', date) as period";
      break;
    case 'week':
      dateFormat = "strftime('%Y-%W', date) as period";
      break;
    case 'month':
      dateFormat = "strftime('%Y-%m', date) as period";
      break;
  }

  const query = `
    SELECT 
      ${dateFormat},
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
      SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_flow,
      COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
      COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count
    FROM (
      SELECT 
        income_date as date,
        amount,
        'income' as type
      FROM ${INCOME_TABLE}
      WHERE income_date BETWEEN ? AND ?
      
      UNION ALL
      
      SELECT 
        expense_date as date,
        amount,
        'expense' as type
      FROM ${EXPENSES_TABLE}
      WHERE expense_date BETWEEN ? AND ?
    )
    GROUP BY period
    ORDER BY period
  `;

  const stmt = db.prepare(query);
  return stmt.all(startDate, endDate, startDate, endDate);
}

/**
 * Get analytics dashboard data
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @returns {Promise<Object>} - Dashboard data
 */
export async function getDashboardData(options = {}) {
  const { startDate, endDate } = options;

  // Get overall stats
  const overallStats = await getOverallStatistics({ startDate, endDate });

  // Get income by category
  const incomeByCategory = await getIncomeByCategory({ startDate, endDate, limit: 5 });

  // Get expenses by category
  const expensesByCategory = await getExpensesByCategory({ startDate, endDate, limit: 5 });

  // Get top income sources
  const topIncomeSources = await getTopIncomeSources({ startDate, endDate, limit: 5 });

  // Get top expenses
  const topExpenses = await getTopExpenses({ startDate, endDate, limit: 5 });

  // Get net flow trends (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const netFlowTrends = await getNetFlowTrends({
    startDate: startDate || thirtyDaysAgo.toISOString().split('T')[0],
    endDate: endDate || new Date().toISOString().split('T')[0],
    interval: 'day'
  });

  return {
    overall: overallStats,
    incomeByCategory,
    expensesByCategory,
    topIncomeSources,
    topExpenses,
    netFlowTrends
  };
}

// Export all functions
export default {
  getIncomeVsExpense,
  getIncomeByCategory,
  getExpensesByCategory,
  getTopIncomeSources,
  getTopExpenses,
  getOverallStatistics,
  getIncomeTrends,
  getExpenseTrends,
  getNetFlowTrends,
  getDashboardData
};

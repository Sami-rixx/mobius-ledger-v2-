import db from '../config/database.js';

/**
 * Dashboard Model
 * Data access layer for dashboard summaries and aggregations
 *
 * Provides:
 * - Financial summary calculations
 * - Student statistics
 * - Income and expense summaries
 * - School fees overview
 * - Lunch management summary
 */

// Table names
const INCOME_TABLE = 'income';
const EXPENSES_TABLE = 'expenses';
const STUDENTS_TABLE = 'students';
const CLASSES_TABLE = 'classes';
const SCHOOL_FEES_TABLE = 'school_fees';
const LUNCH_PAYMENTS_TABLE = 'lunch_payments';
const STUDENT_CHARGES_TABLE = 'student_charges';
const TRANSACTIONS_TABLE = 'transactions';
const DIRECTOR_WITHDRAWALS_TABLE = 'director_withdrawals';

// Field mappings
const INCOME_FIELDS = {
  ID: 'id',
  AMOUNT: 'amount',
  DATE: 'income_date',
  CATEGORY_ID: 'income_category_id',
  IS_VERIFIED: 'is_verified'
};

const EXPENSE_FIELDS = {
  ID: 'id',
  AMOUNT: 'amount',
  DATE: 'expense_date',
  CATEGORY_ID: 'expense_category_id',
  IS_VERIFIED: 'is_verified'
};

const SCHOOL_FEES_FIELDS = {
  ID: 'id',
  STUDENT_ID: 'student_id',
  AMOUNT: 'amount',
  PAID: 'amount_paid',
  BALANCE: 'balance',
  DATE: 'payment_date',
  IS_PAID: 'is_paid'
};

const STUDENT_FIELDS = {
  ID: 'id',
  ADMISSION_NUMBER: 'admission_number',
  FIRST_NAME: 'first_name',
  LAST_NAME: 'last_name',
  CLASS_ID: 'class_id',
  STATUS: 'status',
  IS_ACTIVE: 'is_active'
};

/**
 * Get financial summary statistics
 * @returns {Promise<Object>} - Summary statistics
 */
export async function getFinancialSummary() {
  try {
    // Get total income
    const totalIncomeResult = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM ${INCOME_TABLE} WHERE is_verified = 1
    `).get();
    
    // Get total expenses
    const totalExpensesResult = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM ${EXPENSES_TABLE} WHERE is_verified = 1
    `).get();
    
    // Get current month income
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const currentMonthIncomeResult = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM ${INCOME_TABLE} 
      WHERE strftime('%Y-%m', income_date) = ? AND is_verified = 1
    `).get(currentMonth);
    
    // Get current month expenses
    const currentMonthExpensesResult = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM ${EXPENSES_TABLE} 
      WHERE strftime('%Y-%m', expense_date) = ? AND is_verified = 1
    `).get(currentMonth);
    
    // Get net balance
    const netBalance = (totalIncomeResult.total || 0) - (totalExpensesResult.total || 0);
    const currentMonthNet = (currentMonthIncomeResult.total || 0) - (currentMonthExpensesResult.total || 0);
    
    return {
      totalIncome: totalIncomeResult.total || 0,
      totalExpenses: totalExpensesResult.total || 0,
      netBalance,
      currentMonthIncome: currentMonthIncomeResult.total || 0,
      currentMonthExpenses: currentMonthExpensesResult.total || 0,
      currentMonthNet
    };
  } catch (error) {
    console.error('Error getting financial summary:', error);
    throw error;
  }
}

/**
 * Get student statistics
 * @returns {Promise<Object>} - Student statistics
 */
export async function getStudentStatistics() {
  try {
    // Total students
    const totalStudentsResult = await db.prepare(`
      SELECT COUNT(*) as count FROM ${STUDENTS_TABLE} WHERE is_active = 1
    `).get();
    
    // Students by class
    const studentsByClassResult = await db.prepare(`
      SELECT 
        c.name as class_name,
        COUNT(s.id) as student_count
      FROM ${CLASSES_TABLE} c
      LEFT JOIN ${STUDENTS_TABLE} s ON c.id = s.class_id AND s.is_active = 1
      GROUP BY c.id, c.name
      ORDER BY c.name
    `).all();
    
    // Active vs inactive
    const activeStudentsResult = await db.prepare(`
      SELECT 
        is_active,
        COUNT(*) as count
      FROM ${STUDENTS_TABLE}
      GROUP BY is_active
    `).all();
    
    const activeCount = activeStudentsResult.find(r => r.is_active === 1)?.count || 0;
    const inactiveCount = activeStudentsResult.find(r => r.is_active === 0)?.count || 0;
    
    return {
      totalStudents: totalStudentsResult.count || 0,
      activeStudents: activeCount,
      inactiveStudents: inactiveCount,
      studentsByClass: studentsByClassResult
    };
  } catch (error) {
    console.error('Error getting student statistics:', error);
    throw error;
  }
}

/**
 * Get school fees summary
 * @returns {Promise<Object>} - School fees summary
 */
export async function getSchoolFeesSummary() {
  try {
    // Total fees paid
    const totalPaidResult = await db.prepare(`
      SELECT COALESCE(SUM(amount_paid), 0) as total FROM ${SCHOOL_FEES_TABLE}
    `).get();
    
    // Total fees outstanding
    const totalOutstandingResult = await db.prepare(`
      SELECT COALESCE(SUM(balance), 0) as total FROM ${SCHOOL_FEES_TABLE} WHERE balance > 0
    `).get();
    
    // Students in arrears
    const arrearsCountResult = await db.prepare(`
      SELECT COUNT(DISTINCT student_id) as count 
      FROM ${SCHOOL_FEES_TABLE} 
      WHERE balance > 0
    `).get();
    
    // Recent fee payments
    const recentPaymentsResult = await db.prepare(`
      SELECT * FROM ${SCHOOL_FEES_TABLE}
      ORDER BY payment_date DESC
      LIMIT 5
    `).all();
    
    return {
      totalPaid: totalPaidResult.total || 0,
      totalOutstanding: totalOutstandingResult.total || 0,
      studentsInArrears: arrearsCountResult.count || 0,
      recentPayments: recentPaymentsResult
    };
  } catch (error) {
    console.error('Error getting school fees summary:', error);
    throw error;
  }
}

/**
 * Get recent transactions
 * @param {number} limit - Number of transactions to return
 * @returns {Promise<Array>} - Recent transactions
 */
export async function getRecentTransactions(limit = 10) {
  try {
    const result = await db.prepare(`
      SELECT * FROM ${TRANSACTIONS_TABLE}
      ORDER BY transaction_date DESC, created_at DESC
      LIMIT ?
    `).all(limit);
    return result;
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    throw error;
  }
}

/**
 * Get income vs expense over time
 * @param {Object} options - Query options
 * @param {string} options.period - Period: 'day', 'week', 'month'
 * @param {number} options.limit - Number of periods to return
 * @returns {Promise<Object>} - Income vs expense over time
 */
export async function getIncomeVsExpenseOverTime(options = {}) {
  const { period = 'month', limit = 12 } = options;
  
  try {
    let dateFormat;
    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%W';
        break;
      case 'month':
      default:
        dateFormat = '%Y-%m';
        break;
    }
    
    // Get income over time
    const incomeQuery = `
      SELECT 
        strftime('${dateFormat}', income_date) as period,
        COALESCE(SUM(amount), 0) as income
      FROM ${INCOME_TABLE}
      WHERE is_verified = 1
      GROUP BY period
      ORDER BY period DESC
      LIMIT ?
    `;
    const incomeResult = await db.prepare(incomeQuery).all(limit);
    
    // Get expenses over time
    const expenseQuery = `
      SELECT 
        strftime('${dateFormat}', expense_date) as period,
        COALESCE(SUM(amount), 0) as expense
      FROM ${EXPENSES_TABLE}
      WHERE is_verified = 1
      GROUP BY period
      ORDER BY period DESC
      LIMIT ?
    `;
    const expenseResult = await db.prepare(expenseQuery).all(limit);
    
    // Merge data
    const periods = [];
    const incomeMap = new Map(incomeResult.map(r => [r.period, r.income]));
    const expenseMap = new Map(expenseResult.map(r => [r.period, r.expense]));
    
    // Get all unique periods from both datasets
    const allPeriods = new Set([...incomeResult.map(r => r.period), ...expenseResult.map(r => r.period)]);
    const sortedPeriods = Array.from(allPeriods).sort().reverse().slice(0, limit);
    
    sortedPeriods.forEach(period => {
      periods.push({
        period,
        income: incomeMap.get(period) || 0,
        expense: expenseMap.get(period) || 0,
        net: (incomeMap.get(period) || 0) - (expenseMap.get(period) || 0)
      });
    });
    
    return { periods };
  } catch (error) {
    console.error('Error getting income vs expense over time:', error);
    throw error;
  }
}

/**
 * Get category breakdown for income
 * @returns {Promise<Array>} - Income by category
 */
export async function getIncomeByCategory() {
  try {
    const result = await db.prepare(`
      SELECT 
        ic.name as category_name,
        COALESCE(SUM(i.amount), 0) as total_amount,
        COUNT(i.id) as transaction_count
      FROM ${INCOME_TABLE} i
      JOIN income_categories ic ON i.income_category_id = ic.id
      WHERE i.is_verified = 1
      GROUP BY ic.id, ic.name
      ORDER BY total_amount DESC
    `).all();
    return result;
  } catch (error) {
    console.error('Error getting income by category:', error);
    throw error;
  }
}

/**
 * Get category breakdown for expenses
 * @returns {Promise<Array>} - Expenses by category
 */
export async function getExpensesByCategory() {
  try {
    const result = await db.prepare(`
      SELECT 
        ec.name as category_name,
        COALESCE(SUM(e.amount), 0) as total_amount,
        COUNT(e.id) as transaction_count
      FROM ${EXPENSES_TABLE} e
      JOIN expense_categories ec ON e.expense_category_id = ec.id
      WHERE e.is_verified = 1
      GROUP BY ec.id, ec.name
      ORDER BY total_amount DESC
    `).all();
    return result;
  } catch (error) {
    console.error('Error getting expenses by category:', error);
    throw error;
  }
}

/**
 * Get quick stats for dashboard cards
 * @returns {Promise<Object>} - Quick statistics
 */
export async function getQuickStats() {
  try {
    const [
      totalStudentsResult,
      totalIncomeResult,
      totalExpensesResult,
      totalWithdrawalsResult,
      recentTransactionsResult
    ] = await Promise.all([
      db.prepare(`SELECT COUNT(*) as count FROM ${STUDENTS_TABLE} WHERE is_active = 1`).get(),
      db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM ${INCOME_TABLE} WHERE is_verified = 1`).get(),
      db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM ${EXPENSES_TABLE} WHERE is_verified = 1`).get(),
      db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM ${DIRECTOR_WITHDRAWALS_TABLE}`).get(),
      db.prepare(`SELECT COUNT(*) as count FROM ${TRANSACTIONS_TABLE}`).get()
    ]);
    
    const netBalance = (totalIncomeResult.total || 0) - (totalExpensesResult.total || 0);
    
    return {
      totalStudents: totalStudentsResult.count || 0,
      totalIncome: totalIncomeResult.total || 0,
      totalExpenses: totalExpensesResult.total || 0,
      netBalance,
      totalWithdrawals: totalWithdrawalsResult.total || 0,
      totalTransactions: recentTransactionsResult.count || 0
    };
  } catch (error) {
    console.error('Error getting quick stats:', error);
    throw error;
  }
}

// Export constants for use in other modules
export const DASHBOARD_CONSTANTS = {
  INCOME_TABLE,
  EXPENSES_TABLE,
  STUDENTS_TABLE,
  CLASSES_TABLE,
  SCHOOL_FEES_TABLE,
  LUNCH_PAYMENTS_TABLE,
  STUDENT_CHARGES_TABLE,
  TRANSACTIONS_TABLE,
  DIRECTOR_WITHDRAWALS_TABLE
};

export default {
  getFinancialSummary,
  getStudentStatistics,
  getSchoolFeesSummary,
  getRecentTransactions,
  getIncomeVsExpenseOverTime,
  getIncomeByCategory,
  getExpensesByCategory,
  getQuickStats
};

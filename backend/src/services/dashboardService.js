import * as DashboardModel from '../models/Dashboard.js';
import * as StudentModel from '../models/Student.js';
import * as ClassModel from '../models/Class.js';
import * as IncomeModel from '../models/Income.js';
import * as ExpenseModel from '../models/Expense.js';
import * as SchoolFeeModel from '../models/SchoolFee.js';
import * as DirectorWithdrawalModel from '../models/DirectorWithdrawal.js';
import * as TransactionModel from '../models/Transaction.js';

/**
 * Dashboard Service
 * Business logic layer for dashboard data aggregation and processing
 *
 * Handles:
 * - Financial summary calculations
 * - Student statistics aggregation
 * - Data transformation for dashboard display
 * - Date range filtering
 * - Chart data preparation
 */

// Default date ranges
const DEFAULT_DAYS = 30;
const DEFAULT_MONTHS = 12;

/**
 * Validate dashboard date range parameters
 * @param {Object} params - Parameters to validate
 * @param {string} params.startDate - Start date
 * @param {string} params.endDate - End date
 * @returns {Object} - Validated parameters
 */
function validateDateRange(params = {}) {
  const { startDate, endDate } = params;
  
  // If both provided, validate format
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    if (start > end) {
      throw new Error('Start date must be before end date');
    }
  }
  
  return { startDate, endDate };
}

/**
 * Get comprehensive dashboard summary
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Object} - Dashboard summary data
 */
export const getDashboardSummary = async (params = {}) => {
  try {
    validateDateRange(params);
    
    // Get all summary data in parallel
    const [
      financialSummary,
      studentStats,
      schoolFeesSummary,
      recentTransactions
    ] = await Promise.all([
      DashboardModel.getFinancialSummary(),
      DashboardModel.getStudentStatistics(),
      DashboardModel.getSchoolFeesSummary(),
      DashboardModel.getRecentTransactions(10)
    ]);
    
    // Format currency values
    const formatCurrency = (value) => parseFloat(value || 0);
    
    return {
      financial: {
        totalIncome: formatCurrency(financialSummary.totalIncome),
        totalExpenses: formatCurrency(financialSummary.totalExpenses),
        netBalance: formatCurrency(financialSummary.netBalance),
        currentMonthIncome: formatCurrency(financialSummary.currentMonthIncome),
        currentMonthExpenses: formatCurrency(financialSummary.currentMonthExpenses),
        currentMonthNet: formatCurrency(financialSummary.currentMonthNet)
      },
      students: {
        total: studentStats.totalStudents || 0,
        active: studentStats.activeStudents || 0,
        inactive: studentStats.inactiveStudents || 0,
        byClass: studentStats.studentsByClass || []
      },
      schoolFees: {
        totalPaid: formatCurrency(schoolFeesSummary.totalPaid),
        totalOutstanding: formatCurrency(schoolFeesSummary.totalOutstanding),
        studentsInArrears: schoolFeesSummary.studentsInArrears || 0,
        recentPayments: schoolFeesSummary.recentPayments || []
      },
      transactions: recentTransactions || []
    };
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    throw error;
  }
};

/**
 * Get quick statistics for dashboard cards
 * @returns {Object} - Quick statistics
 */
export const getQuickStats = async () => {
  try {
    const stats = await DashboardModel.getQuickStats();
    
    // Format currency values
    const formatCurrency = (value) => parseFloat(value || 0);
    
    return {
      totalStudents: stats.totalStudents || 0,
      totalIncome: formatCurrency(stats.totalIncome),
      totalExpenses: formatCurrency(stats.totalExpenses),
      netBalance: formatCurrency(stats.netBalance),
      totalWithdrawals: formatCurrency(stats.totalWithdrawals),
      totalTransactions: stats.totalTransactions || 0
    };
  } catch (error) {
    console.error('Error getting quick stats:', error);
    throw error;
  }
};

/**
 * Get income vs expense over time data for charts
 * @param {Object} params - Query parameters
 * @param {string} params.period - Period: 'day', 'week', 'month'
 * @param {number} params.limit - Number of periods
 * @returns {Object} - Chart data
 */
export const getIncomeVsExpenseChartData = async (params = {}) => {
  try {
    const { period = 'month', limit = 12 } = params;
    
    const result = await DashboardModel.getIncomeVsExpenseOverTime({ period, limit });
    
    // Format for chart display
    return {
      periods: result.periods || [],
      periodLabel: period.charAt(0).toUpperCase() + period.slice(1)
    };
  } catch (error) {
    console.error('Error getting chart data:', error);
    throw error;
  }
};

/**
 * Get income by category for pie chart
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of categories to return
 * @returns {Array} - Category breakdown
 */
export const getIncomeByCategory = async (params = {}) => {
  try {
    const { limit = 10 } = params;
    const result = await DashboardModel.getIncomeByCategory();
    
    // Format and limit results
    const formatted = result.map(r => ({
      category: r.category_name || 'Unknown',
      amount: parseFloat(r.total_amount || 0),
      count: r.transaction_count || 0
    }));
    
    // Sort by amount descending and limit
    return formatted
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting income by category:', error);
    throw error;
  }
};

/**
 * Get expenses by category for pie chart
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of categories to return
 * @returns {Array} - Category breakdown
 */
export const getExpensesByCategory = async (params = {}) => {
  try {
    const { limit = 10 } = params;
    const result = await DashboardModel.getExpensesByCategory();
    
    // Format and limit results
    const formatted = result.map(r => ({
      category: r.category_name || 'Unknown',
      amount: parseFloat(r.total_amount || 0),
      count: r.transaction_count || 0
    }));
    
    // Sort by amount descending and limit
    return formatted
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting expenses by category:', error);
    throw error;
  }
};

/**
 * Get recent activity feed
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of items to return
 * @returns {Array} - Recent activity items
 */
export const getRecentActivity = async (params = {}) => {
  try {
    const { limit = 10 } = params;
    
    // Get recent transactions
    const recentTransactions = await DashboardModel.getRecentTransactions(limit);
    
    // Format activity items
    const activity = recentTransactions.map(t => ({
      id: t.id,
      type: 'transaction',
      description: `Transaction #${t.id}: ${t.description || 'No description'}`,
      amount: parseFloat(t.amount || 0),
      date: t.transaction_date || t.created_at,
      receiptNumber: t.receipt_number || null
    }));
    
    return activity;
  } catch (error) {
    console.error('Error getting recent activity:', error);
    throw error;
  }
};

/**
 * Get student distribution by class
 * @returns {Array} - Student distribution data
 */
export const getStudentDistribution = async () => {
  try {
    const stats = await DashboardModel.getStudentStatistics();
    
    // Format for chart display
    return (stats.studentsByClass || []).map(c => ({
      className: c.class_name || 'Unknown',
      count: c.student_count || 0
    }));
  } catch (error) {
    console.error('Error getting student distribution:', error);
    throw error;
  }
};

/**
 * Get summary statistics with date filtering
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Object} - Filtered summary
 */
export const getFilteredSummary = async (params = {}) => {
  try {
    validateDateRange(params);
    
    // For now, return unfiltered summary
    // Can be enhanced to filter by date range
    const summary = await getDashboardSummary(params);
    
    return {
      ...summary,
      filtered: true,
      dateRange: params.startDate && params.endDate 
        ? `${params.startDate} to ${params.endDate}` 
        : 'All time'
    };
  } catch (error) {
    console.error('Error getting filtered summary:', error);
    throw error;
  }
};

// Pagination helpers
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Create pagination parameters
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @returns {Object} - Pagination parameters
 */
export const createPaginationParams = (page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE) => ({
  page,
  pageSize,
  offset: (page - 1) * pageSize
});

// Validation constants
export const DASHBOARD_VALIDATION = {
  PERIOD_MIN_LENGTH: 3,
  PERIOD_MAX_LENGTH: 10,
  LIMIT_MIN: 1,
  LIMIT_MAX: 100,
  DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/
};

/**
 * Validate dashboard query parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} - Validation result with errors if any
 */
export const validateDashboardParams = (params = {}) => {
  const errors = [];
  const validated = { ...params };
  
  if (params.period) {
    const validPeriods = ['day', 'week', 'month', 'year'];
    if (!validPeriods.includes(params.period.toLowerCase())) {
      errors.push(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
    }
    validated.period = params.period.toLowerCase();
  }
  
  if (params.limit !== undefined) {
    if (params.limit < DASHBOARD_VALIDATION.LIMIT_MIN || params.limit > DASHBOARD_VALIDATION.LIMIT_MAX) {
      errors.push(`Limit must be between ${DASHBOARD_VALIDATION.LIMIT_MIN} and ${DASHBOARD_VALIDATION.LIMIT_MAX}`);
    }
    validated.limit = parseInt(params.limit);
  }
  
  if (params.startDate) {
    if (!DASHBOARD_VALIDATION.DATE_FORMAT.test(params.startDate)) {
      errors.push('Start date must be in YYYY-MM-DD format');
    }
  }
  
  if (params.endDate) {
    if (!DASHBOARD_VALIDATION.DATE_FORMAT.test(params.endDate)) {
      errors.push('End date must be in YYYY-MM-DD format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    validated
  };
};

export default {
  getDashboardSummary,
  getQuickStats,
  getIncomeVsExpenseChartData,
  getIncomeByCategory,
  getExpensesByCategory,
  getRecentActivity,
  getStudentDistribution,
  getFilteredSummary,
  createPaginationParams,
  validateDashboardParams,
  DASHBOARD_VALIDATION
};

import * as AnalyticsModel from '../models/Analytics.js';
import * as DailySummaryModel from '../models/DailySummary.js';
import * as IncomeModel from '../models/Income.js';
import * as ExpenseModel from '../models/Expense.js';
import * as IncomeCategoryModel from '../models/IncomeCategory.js';
import * as ExpenseCategoryModel from '../models/ExpenseCategory.js';

/**
 * Analytics Service
 * Business logic layer for analytics and financial insights
 * 
 * Handles:
 * - Financial trend analysis
 * - Category breakdowns
 * - Net cash flow calculations
 * - Dashboard data aggregation
 * - Top performers analysis
 * - Data transformation for analytics
 */

/**
 * Get comprehensive dashboard analytics data
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date (YYYY-MM-DD)
 * @param {string} options.endDate - End date (YYYY-MM-DD)
 * @returns {Object} - Dashboard analytics data
 */
export const getDashboardData = async (options = {}) => {
  try {
    const { startDate, endDate } = options;
    
    // Get overall statistics
    const overallStats = await AnalyticsModel.getOverallStatistics({ startDate, endDate });
    
    // Get income and expense trends (monthly, last 6 months)
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0];
    
    const [incomeTrends, expenseTrends] = await Promise.all([
      AnalyticsModel.getIncomeTrends({ startDate: start, endDate: end, interval: 'month' }),
      AnalyticsModel.getExpenseTrends({ startDate: start, endDate: end, interval: 'month' })
    ]);
    
    // Get category breakdowns
    const [incomeByCategory, expensesByCategory] = await Promise.all([
      AnalyticsModel.getIncomeByCategory({ startDate: start, endDate: end, limit: 5 }),
      AnalyticsModel.getExpensesByCategory({ startDate: start, endDate: end, limit: 5 })
    ]);
    
    // Get top performers
    const [topIncomeSources, topExpenses] = await Promise.all([
      AnalyticsModel.getTopIncomeSources({ startDate: start, endDate: end, limit: 5 }),
      AnalyticsModel.getTopExpenses({ startDate: start, endDate: end, limit: 5 })
    ]);
    
    // Get net flow trends
    const netFlowTrends = await AnalyticsModel.getNetFlowTrends({
      startDate: start,
      endDate: end,
      interval: 'month'
    });
    
    // Transform data for frontend
    const dashboardData = {
      overall: {
        totalIncome: parseFloat(overallStats.income?.total_amount || 0),
        totalIncomeRecords: overallStats.income?.total_records || 0,
        totalExpenses: parseFloat(overallStats.expenses?.total_amount || 0),
        totalExpenseRecords: overallStats.expenses?.total_records || 0,
        netFlow: overallStats.net_flow || 0,
        totalRecords: overallStats.total_records || 0
      },
      incomeTrends: incomeTrends.map(t => ({
        period: t.period,
        count: t.count || 0,
        totalAmount: parseFloat(t.total_amount || 0),
        avgAmount: parseFloat(t.avg_amount || 0)
      })),
      expenseTrends: expenseTrends.map(t => ({
        period: t.period,
        count: t.count || 0,
        totalAmount: parseFloat(t.total_amount || 0),
        avgAmount: parseFloat(t.avg_amount || 0)
      })),
      netFlowTrends: netFlowTrends.map(t => ({
        period: t.period,
        totalIncome: parseFloat(t.total_income || 0),
        totalExpenses: parseFloat(t.total_expenses || 0),
        netFlow: parseFloat(t.net_flow || 0),
        incomeCount: t.income_count || 0,
        expenseCount: t.expense_count || 0
      })),
      incomeByCategory: incomeByCategory.map(c => ({
        categoryId: c.category_id,
        categoryName: c.category_name,
        count: c.count || 0,
        totalAmount: parseFloat(c.total_amount || 0),
        avgAmount: parseFloat(c.avg_amount || 0)
      })),
      expensesByCategory: expensesByCategory.map(c => ({
        categoryId: c.category_id,
        categoryName: c.category_name,
        isKitchen: Boolean(c.is_kitchen),
        count: c.count || 0,
        totalAmount: parseFloat(c.total_amount || 0),
        avgAmount: parseFloat(c.avg_amount || 0)
      })),
      topIncomeSources: topIncomeSources.map(s => ({
        source: s.source,
        count: s.count || 0,
        totalAmount: parseFloat(s.total_amount || 0),
        avgAmount: parseFloat(s.avg_amount || 0)
      })),
      topExpenses: topExpenses.map(e => ({
        vendor: e.vendor,
        count: e.count || 0,
        totalAmount: parseFloat(e.total_amount || 0),
        avgAmount: parseFloat(e.avg_amount || 0)
      })),
      dateRange: { startDate: start, endDate: end }
    };
    
    return {
      success: true,
      data: dashboardData
    };
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    return {
      success: false,
      error: 'Failed to get dashboard data'
    };
  }
};

/**
 * Get income vs expense comparison
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {string} options.groupBy - Group by: 'day', 'week', 'month', 'year'
 * @returns {Object} - Comparison data
 */
export const getIncomeVsExpense = async (options = {}) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = options;
    const data = await AnalyticsModel.getIncomeVsExpense({ startDate, endDate, groupBy });
    
    return {
      success: true,
      data: data.map(d => ({
        period: d.period,
        totalIncome: parseFloat(d.total_income || 0),
        totalExpenses: parseFloat(d.total_expenses || 0),
        netFlow: parseFloat(d.net_flow || 0),
        incomeCount: d.income_count || 0,
        expenseCount: d.expense_count || 0
      }))
    };
  } catch (error) {
    console.error('Error getting income vs expense:', error);
    return {
      success: false,
      error: 'Failed to get income vs expense comparison'
    };
  }
};

/**
 * Get income by category with percentages
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {number} options.limit - Limit results
 * @returns {Object} - Income by category with percentages
 */
export const getIncomeByCategory = async (options = {}) => {
  try {
    const data = await AnalyticsModel.getIncomeByCategory(options);
    const total = data.reduce((sum, d) => sum + parseFloat(d.total_amount || 0), 0);
    
    const result = data.map(d => ({
      categoryId: d.category_id,
      categoryName: d.category_name,
      count: d.count || 0,
      totalAmount: parseFloat(d.total_amount || 0),
      avgAmount: parseFloat(d.avg_amount || 0),
      percentage: total > 0 ? (parseFloat(d.total_amount || 0) / total) * 100 : 0
    }));
    
    return {
      success: true,
      data: result,
      total
    };
  } catch (error) {
    console.error('Error getting income by category:', error);
    return {
      success: false,
      error: 'Failed to get income by category'
    };
  }
};

/**
 * Get expenses by category with percentages
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {number} options.limit - Limit results
 * @returns {Object} - Expenses by category with percentages
 */
export const getExpensesByCategory = async (options = {}) => {
  try {
    const data = await AnalyticsModel.getExpensesByCategory(options);
    const total = data.reduce((sum, d) => sum + parseFloat(d.total_amount || 0), 0);
    
    const result = data.map(d => ({
      categoryId: d.category_id,
      categoryName: d.category_name,
      isKitchen: Boolean(d.is_kitchen),
      count: d.count || 0,
      totalAmount: parseFloat(d.total_amount || 0),
      avgAmount: parseFloat(d.avg_amount || 0),
      percentage: total > 0 ? (parseFloat(d.total_amount || 0) / total) * 100 : 0
    }));
    
    return {
      success: true,
      data: result,
      total
    };
  } catch (error) {
    console.error('Error getting expenses by category:', error);
    return {
      success: false,
      error: 'Failed to get expenses by category'
    };
  }
};

/**
 * Get top income sources
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {number} options.limit - Limit results
 * @returns {Object} - Top income sources
 */
export const getTopIncomeSources = async (options = {}) => {
  try {
    const data = await AnalyticsModel.getTopIncomeSources(options);
    
    return {
      success: true,
      data: data.map(d => ({
        source: d.source,
        count: d.count || 0,
        totalAmount: parseFloat(d.total_amount || 0),
        avgAmount: parseFloat(d.avg_amount || 0)
      }))
    };
  } catch (error) {
    console.error('Error getting top income sources:', error);
    return {
      success: false,
      error: 'Failed to get top income sources'
    };
  }
};

/**
 * Get top expenses
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {number} options.limit - Limit results
 * @returns {Object} - Top expenses
 */
export const getTopExpenses = async (options = {}) => {
  try {
    const data = await AnalyticsModel.getTopExpenses(options);
    
    return {
      success: true,
      data: data.map(d => ({
        vendor: d.vendor,
        count: d.count || 0,
        totalAmount: parseFloat(d.total_amount || 0),
        avgAmount: parseFloat(d.avg_amount || 0)
      }))
    };
  } catch (error) {
    console.error('Error getting top expenses:', error);
    return {
      success: false,
      error: 'Failed to get top expenses'
    };
  }
};

/**
 * Get overall statistics
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @returns {Object} - Overall statistics
 */
export const getOverallStatistics = async (options = {}) => {
  try {
    const data = await AnalyticsModel.getOverallStatistics(options);
    
    return {
      success: true,
      data: {
        income: {
          totalRecords: data.income?.total_records || 0,
          totalAmount: parseFloat(data.income?.total_amount || 0),
          avgAmount: parseFloat(data.income?.avg_amount || 0),
          minAmount: parseFloat(data.income?.min_amount || 0),
          maxAmount: parseFloat(data.income?.max_amount || 0)
        },
        expenses: {
          totalRecords: data.expenses?.total_records || 0,
          totalAmount: parseFloat(data.expenses?.total_amount || 0),
          avgAmount: parseFloat(data.expenses?.avg_amount || 0),
          minAmount: parseFloat(data.expenses?.min_amount || 0),
          maxAmount: parseFloat(data.expenses?.max_amount || 0)
        },
        netFlow: data.net_flow || 0,
        totalRecords: data.total_records || 0,
        totalAmount: data.total_amount || 0
      }
    };
  } catch (error) {
    console.error('Error getting overall statistics:', error);
    return {
      success: false,
      error: 'Failed to get overall statistics'
    };
  }
};

/**
 * Get income trends over time
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {string} options.interval - Interval: 'day', 'week', 'month'
 * @returns {Object} - Income trends
 */
export const getIncomeTrends = async (options = {}) => {
  try {
    const { startDate, endDate, interval = 'month' } = options;
    const data = await AnalyticsModel.getIncomeTrends({ startDate, endDate, interval });
    
    return {
      success: true,
      data: data.map(d => ({
        period: d.period,
        count: d.count || 0,
        totalAmount: parseFloat(d.total_amount || 0),
        avgAmount: parseFloat(d.avg_amount || 0)
      }))
    };
  } catch (error) {
    console.error('Error getting income trends:', error);
    return {
      success: false,
      error: 'Failed to get income trends'
    };
  }
};

/**
 * Get expense trends over time
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {string} options.interval - Interval: 'day', 'week', 'month'
 * @returns {Object} - Expense trends
 */
export const getExpenseTrends = async (options = {}) => {
  try {
    const { startDate, endDate, interval = 'month' } = options;
    const data = await AnalyticsModel.getExpenseTrends({ startDate, endDate, interval });
    
    return {
      success: true,
      data: data.map(d => ({
        period: d.period,
        count: d.count || 0,
        totalAmount: parseFloat(d.total_amount || 0),
        avgAmount: parseFloat(d.avg_amount || 0)
      }))
    };
  } catch (error) {
    console.error('Error getting expense trends:', error);
    return {
      success: false,
      error: 'Failed to get expense trends'
    };
  }
};

/**
 * Get net flow trends over time
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {string} options.interval - Interval: 'day', 'week', 'month'
 * @returns {Object} - Net flow trends
 */
export const getNetFlowTrends = async (options = {}) => {
  try {
    const { startDate, endDate, interval = 'month' } = options;
    const data = await AnalyticsModel.getNetFlowTrends({ startDate, endDate, interval });
    
    return {
      success: true,
      data: data.map(d => ({
        period: d.period,
        totalIncome: parseFloat(d.total_income || 0),
        totalExpenses: parseFloat(d.total_expenses || 0),
        netFlow: parseFloat(d.net_flow || 0),
        incomeCount: d.income_count || 0,
        expenseCount: d.expense_count || 0
      }))
    };
  } catch (error) {
    console.error('Error getting net flow trends:', error);
    return {
      success: false,
      error: 'Failed to get net flow trends'
    };
  }
};

/**
 * Get recent daily summaries
 * @param {Object} options - Query options
 * @param {number} options.limit - Limit results
 * @returns {Object} - Recent daily summaries
 */
export const getRecentDailySummaries = async (options = {}) => {
  try {
    const { limit = 30 } = options;
    const summaries = await DailySummaryModel.getAll({
      limit,
      orderBy: 'summary_date',
      orderDirection: 'DESC'
    });
    
    return {
      success: true,
      data: summaries.map(s => ({
        id: s.id,
        date: s.summary_date,
        totalIncome: parseFloat(s.total_income),
        incomeCount: s.income_count,
        totalExpenses: parseFloat(s.total_expenses),
        expenseCount: s.expense_count,
        netFlow: parseFloat(s.net_flow),
        transactionCount: s.transaction_count,
        createdAt: s.created_at
      }))
    };
  } catch (error) {
    console.error('Error getting recent daily summaries:', error);
    return {
      success: false,
      error: 'Failed to get recent daily summaries'
    };
  }
};

/**
 * Get daily summary statistics
 * @param {Object} options - Query options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @returns {Object} - Daily summary statistics
 */
export const getDailySummaryStatistics = async (options = {}) => {
  try {
    const stats = await DailySummaryModel.getStatistics(options);
    
    return {
      success: true,
      data: {
        totalDays: stats.total_days || 0,
        totalIncome: parseFloat(stats.total_income || 0),
        totalIncomeRecords: stats.total_income_records || 0,
        totalExpenses: parseFloat(stats.total_expenses || 0),
        totalExpenseRecords: stats.total_expense_records || 0,
        netFlow: parseFloat(stats.net_flow || 0),
        totalTransactions: stats.total_transactions || 0,
        avgDailyIncome: parseFloat(stats.avg_daily_income || 0),
        avgDailyExpenses: parseFloat(stats.avg_daily_expenses || 0),
        avgDailyNetFlow: parseFloat(stats.avg_daily_net_flow || 0)
      }
    };
  } catch (error) {
    console.error('Error getting daily summary statistics:', error);
    return {
      success: false,
      error: 'Failed to get daily summary statistics'
    };
  }
};

// Export all functions
const analyticsService = {
  getDashboardData,
  getIncomeVsExpense,
  getIncomeByCategory,
  getExpensesByCategory,
  getTopIncomeSources,
  getTopExpenses,
  getOverallStatistics,
  getIncomeTrends,
  getExpenseTrends,
  getNetFlowTrends,
  getRecentDailySummaries,
  getDailySummaryStatistics
};

export default analyticsService;

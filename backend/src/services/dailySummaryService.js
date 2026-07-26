import * as DailySummaryModel from '../models/DailySummary.js';
import * as IncomeModel from '../models/Income.js';
import * as ExpenseModel from '../models/Expense.js';
import * as TransactionModel from '../models/Transaction.js';
import db from '../config/database.js';

/**
 * Daily Summary Service
 * Business logic layer for daily financial summary management
 * 
 * Handles:
 * - Daily summary generation
 * - Summary data aggregation
 * - Date range summaries
 * - Weekly and monthly summaries
 * - Automatic summary generation
 */

/**
 * Get paginated list of daily summaries
 * @param {Object} options - Filter and pagination options
 * @param {string} options.startDate - Filter by start date
 * @param {string} options.endDate - Filter by end date
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction
 * @returns {Object} - Paginated result with daily summaries
 */
export const getPaginatedDailySummaries = async (options = {}) => {
  const {
    startDate,
    endDate,
    page = 1,
    pageSize = 20,
    orderBy = 'summary_date',
    orderDir = 'DESC'
  } = options;

  const offset = (page - 1) * pageSize;

  const filterOptions = {
    startDate,
    endDate,
    limit: pageSize,
    offset,
    orderBy,
    orderDirection: orderDir
  };

  const summaries = await DailySummaryModel.getAll(filterOptions);
  const allSummaries = await DailySummaryModel.getAll({ startDate, endDate });
  const total = allSummaries.length;
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    success: true,
    data: summaries.map(s => ({
      ...s,
      total_income: parseFloat(s.total_income),
      total_expenses: parseFloat(s.total_expenses),
      net_flow: parseFloat(s.net_flow)
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? page + 1 : null,
      previousPage: hasPreviousPage ? page - 1 : null
    }
  };
};

/**
 * Get all daily summaries without pagination
 * @param {Object} options - Filter options
 * @returns {Object} - All matching daily summaries
 */
export const getAllDailySummaries = async (options = {}) => {
  const summaries = await DailySummaryModel.getAll(options);
  return {
    success: true,
    data: summaries.map(s => ({
      ...s,
      total_income: parseFloat(s.total_income),
      total_expenses: parseFloat(s.total_expenses),
      net_flow: parseFloat(s.net_flow)
    }))
  };
};

/**
 * Get a daily summary by date
 * @param {string} date - Summary date (YYYY-MM-DD)
 * @returns {Object} - Daily summary record or error
 */
export const getDailySummaryByDate = async (date) => {
  const summary = await DailySummaryModel.getByDate(date);
  
  if (!summary) {
    return {
      success: false,
      error: 'Daily summary not found for the specified date'
    };
  }

  return {
    success: true,
    data: {
      ...summary,
      total_income: parseFloat(summary.total_income),
      total_expenses: parseFloat(summary.total_expenses),
      net_flow: parseFloat(summary.net_flow)
    }
  };
};

/**
 * Get a daily summary by ID
 * @param {number} id - Summary record ID
 * @returns {Object} - Daily summary record or error
 */
export const getDailySummaryById = async (id) => {
  const summary = await DailySummaryModel.getById(id);
  
  if (!summary) {
    return {
      success: false,
      error: 'Daily summary not found'
    };
  }

  return {
    success: true,
    data: {
      ...summary,
      total_income: parseFloat(summary.total_income),
      total_expenses: parseFloat(summary.total_expenses),
      net_flow: parseFloat(summary.net_flow)
    }
  };
};

/**
 * Get the most recent daily summary
 * @returns {Object} - Most recent daily summary or error
 */
export const getLatestDailySummary = async () => {
  const summary = await DailySummaryModel.getLatest();
  
  if (!summary) {
    return {
      success: false,
      error: 'No daily summaries found'
    };
  }

  return {
    success: true,
    data: {
      ...summary,
      total_income: parseFloat(summary.total_income),
      total_expenses: parseFloat(summary.total_expenses),
      net_flow: parseFloat(summary.net_flow)
    }
  };
};

/**
 * Get daily summaries for a date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object} - Daily summaries in the date range
 */
export const getDailySummariesByDateRange = async (startDate, endDate) => {
  if (!startDate || !endDate) {
    return {
      success: false,
      error: 'Start date and end date are required'
    };
  }

  try {
    const summaries = await DailySummaryModel.getByDateRange(startDate, endDate);
    
    return {
      success: true,
      data: summaries.map(s => ({
        ...s,
        total_income: parseFloat(s.total_income),
        total_expenses: parseFloat(s.total_expenses),
        net_flow: parseFloat(s.net_flow)
      }))
    };
  } catch (error) {
    console.error('Error getting daily summaries by date range:', error);
    return {
      success: false,
      error: 'Failed to get daily summaries by date range'
    };
  }
};

/**
 * Get daily summaries for a specific month
 * @param {string} year - Year (YYYY)
 * @param {string} month - Month (MM, 1-12)
 * @returns {Object} - Daily summaries for the month
 */
export const getDailySummariesByMonth = async (year, month) => {
  if (!year || !month) {
    return {
      success: false,
      error: 'Year and month are required'
    };
  }

  try {
    const summaries = await DailySummaryModel.getByMonth(year, month);
    
    return {
      success: true,
      data: summaries.map(s => ({
        ...s,
        total_income: parseFloat(s.total_income),
        total_expenses: parseFloat(s.total_expenses),
        net_flow: parseFloat(s.net_flow)
      }))
    };
  } catch (error) {
    console.error('Error getting daily summaries by month:', error);
    return {
      success: false,
      error: 'Failed to get daily summaries by month'
    };
  }
};

/**
 * Get daily summaries for a specific week
 * @param {string} startDate - Start of week (YYYY-MM-DD, typically Monday)
 * @returns {Object} - Daily summaries for the week
 */
export const getDailySummariesByWeek = async (startDate) => {
  if (!startDate) {
    return {
      success: false,
      error: 'Start date is required'
    };
  }

  try {
    const summaries = await DailySummaryModel.getByWeek(startDate);
    
    return {
      success: true,
      data: summaries.map(s => ({
        ...s,
        total_income: parseFloat(s.total_income),
        total_expenses: parseFloat(s.total_expenses),
        net_flow: parseFloat(s.net_flow)
      }))
    };
  } catch (error) {
    console.error('Error getting daily summaries by week:', error);
    return {
      success: false,
      error: 'Failed to get daily summaries by week'
    };
  }
};

/**
 * Generate and save daily summary for a specific date
 * @param {string} date - Date to generate summary for (YYYY-MM-DD)
 * @returns {Object} - Generated and saved daily summary
 */
export const generateAndSaveDailySummary = async (date) => {
  if (!date) {
    return {
      success: false,
      error: 'Date is required'
    };
  }

  try {
    const summary = await DailySummaryModel.generateAndSave(date);
    
    return {
      success: true,
      message: 'Daily summary generated and saved successfully',
      data: {
        ...summary,
        total_income: parseFloat(summary.total_income),
        total_expenses: parseFloat(summary.total_expenses),
        net_flow: parseFloat(summary.net_flow)
      }
    };
  } catch (error) {
    console.error('Error generating and saving daily summary:', error);
    return {
      success: false,
      error: 'Failed to generate and save daily summary'
    };
  }
};

/**
 * Generate daily summary data for a date (without saving)
 * @param {string} date - Date to generate summary for (YYYY-MM-DD)
 * @returns {Object} - Generated daily summary data
 */
export const generateDailySummary = async (date) => {
  if (!date) {
    return {
      success: false,
      error: 'Date is required'
    };
  }

  try {
    const summary = await DailySummaryModel.generateForDate(date);
    
    return {
      success: true,
      data: {
        ...summary,
        total_income: parseFloat(summary.total_income),
        total_expenses: parseFloat(summary.total_expenses),
        net_flow: parseFloat(summary.net_flow)
      }
    };
  } catch (error) {
    console.error('Error generating daily summary:', error);
    return {
      success: false,
      error: 'Failed to generate daily summary'
    };
  }
};

/**
 * Create a daily summary record directly
 * @param {Object} data - Daily summary data
 * @returns {Object} - Created daily summary
 */
export const createDailySummary = async (data) => {
  const {
    summary_date,
    total_income,
    income_count,
    total_expenses,
    expense_count,
    net_flow,
    transaction_count
  } = data;

  // Validate required fields
  if (!summary_date || total_income === undefined || total_expenses === undefined) {
    return {
      success: false,
      error: 'Required fields: summary_date, total_income, total_expenses'
    };
  }

  // Validate numeric fields
  if (isNaN(parseFloat(total_income)) || isNaN(parseFloat(total_expenses))) {
    return {
      success: false,
      error: 'total_income and total_expenses must be numbers'
    };
  }

  try {
    const summary = await DailySummaryModel.create({
      summary_date,
      total_income: parseFloat(total_income),
      income_count: income_count || 0,
      total_expenses: parseFloat(total_expenses),
      expense_count: expense_count || 0,
      net_flow: net_flow || (parseFloat(total_income) - parseFloat(total_expenses)),
      transaction_count: transaction_count || 0
    });

    return {
      success: true,
      message: 'Daily summary created successfully',
      data: {
        ...summary,
        total_income: parseFloat(summary.total_income),
        total_expenses: parseFloat(summary.total_expenses),
        net_flow: parseFloat(summary.net_flow)
      }
    };
  } catch (error) {
    console.error('Error creating daily summary:', error);
    return {
      success: false,
      error: error.message || 'Failed to create daily summary'
    };
  }
};

/**
 * Update a daily summary record
 * @param {number} id - Summary record ID
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated daily summary
 */
export const updateDailySummary = async (id, updates) => {
  const existing = await DailySummaryModel.getById(id);
  
  if (!existing) {
    return {
      success: false,
      error: 'Daily summary not found'
    };
  }

  // Validate numeric fields if present
  if (updates.total_income !== undefined && isNaN(parseFloat(updates.total_income))) {
    return {
      success: false,
      error: 'total_income must be a number'
    };
  }

  if (updates.total_expenses !== undefined && isNaN(parseFloat(updates.total_expenses))) {
    return {
      success: false,
      error: 'total_expenses must be a number'
    };
  }

  try {
    const updated = await DailySummaryModel.update(id, updates);
    
    return {
      success: true,
      message: 'Daily summary updated successfully',
      data: {
        ...updated,
        total_income: parseFloat(updated.total_income),
        total_expenses: parseFloat(updated.total_expenses),
        net_flow: parseFloat(updated.net_flow)
      }
    };
  } catch (error) {
    console.error('Error updating daily summary:', error);
    return {
      success: false,
      error: 'Failed to update daily summary'
    };
  }
};

/**
 * Delete a daily summary record
 * @param {number} id - Summary record ID
 * @returns {Object} - Success status
 */
export const deleteDailySummary = async (id) => {
  const existing = await DailySummaryModel.getById(id);
  
  if (!existing) {
    return {
      success: false,
      error: 'Daily summary not found'
    };
  }

  try {
    await DailySummaryModel.deleteRecord(id);
    
    return {
      success: true,
      message: 'Daily summary deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting daily summary:', error);
    return {
      success: false,
      error: 'Failed to delete daily summary'
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

/**
 * Generate daily summaries for a date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object} - Generated daily summaries
 */
export const generateDailySummariesForRange = async (startDate, endDate) => {
  if (!startDate || !endDate) {
    return {
      success: false,
      error: 'Start date and end date are required'
    };
  }

  try {
    // Get existing summaries for the range
    const existingSummaries = await DailySummaryModel.getByDateRange(startDate, endDate);
    const existingDates = new Set(existingSummaries.map(s => s.summary_date));
    
    // Generate summaries for dates that don't exist
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!existingDates.has(dateStr)) {
        dates.push(dateStr);
      }
    }
    
    // Generate summaries for missing dates
    const generatedSummaries = [];
    for (const date of dates) {
      try {
        const summary = await DailySummaryModel.generateAndSave(date);
        generatedSummaries.push(summary);
      } catch (error) {
        console.error(`Error generating summary for ${date}:`, error);
      }
    }
    
    // Get all summaries for the range
    const allSummaries = await DailySummaryModel.getByDateRange(startDate, endDate);
    
    return {
      success: true,
      message: `Generated ${generatedSummaries.length} new daily summaries`,
      data: allSummaries.map(s => ({
        ...s,
        total_income: parseFloat(s.total_income),
        total_expenses: parseFloat(s.total_expenses),
        net_flow: parseFloat(s.net_flow)
      }))
    };
  } catch (error) {
    console.error('Error generating daily summaries for range:', error);
    return {
      success: false,
      error: 'Failed to generate daily summaries for range'
    };
  }
};

/**
 * Get weekly summary (aggregate of daily summaries for a week)
 * @param {string} startDate - Start of week (YYYY-MM-DD)
 * @returns {Object} - Weekly summary
 */
export const getWeeklySummary = async (startDate) => {
  if (!startDate) {
    return {
      success: false,
      error: 'Start date is required'
    };
  }

  try {
    const summaries = await DailySummaryModel.getByWeek(startDate);
    
    if (summaries.length === 0) {
      return {
        success: false,
        error: 'No daily summaries found for the specified week'
      };
    }
    
    const totalIncome = summaries.reduce((sum, s) => sum + parseFloat(s.total_income || 0), 0);
    const totalExpenses = summaries.reduce((sum, s) => sum + parseFloat(s.total_expenses || 0), 0);
    const netFlow = totalIncome - totalExpenses;
    const totalTransactions = summaries.reduce((sum, s) => sum + (s.transaction_count || 0), 0);
    const avgDailyIncome = totalIncome / summaries.length;
    const avgDailyExpenses = totalExpenses / summaries.length;
    
    return {
      success: true,
      data: {
        startDate,
        endDate: summaries[summaries.length - 1].summary_date,
        totalDays: summaries.length,
        totalIncome,
        totalExpenses,
        netFlow,
        totalTransactions,
        avgDailyIncome,
        avgDailyExpenses,
        dailySummaries: summaries.map(s => ({
          ...s,
          total_income: parseFloat(s.total_income),
          total_expenses: parseFloat(s.total_expenses),
          net_flow: parseFloat(s.net_flow)
        }))
      }
    };
  } catch (error) {
    console.error('Error getting weekly summary:', error);
    return {
      success: false,
      error: 'Failed to get weekly summary'
    };
  }
};

/**
 * Get monthly summary (aggregate of daily summaries for a month)
 * @param {string} year - Year (YYYY)
 * @param {string} month - Month (MM, 1-12)
 * @returns {Object} - Monthly summary
 */
export const getMonthlySummary = async (year, month) => {
  if (!year || !month) {
    return {
      success: false,
      error: 'Year and month are required'
    };
  }

  try {
    const summaries = await DailySummaryModel.getByMonth(year, month);
    
    if (summaries.length === 0) {
      return {
        success: false,
        error: 'No daily summaries found for the specified month'
      };
    }
    
    const totalIncome = summaries.reduce((sum, s) => sum + parseFloat(s.total_income || 0), 0);
    const totalExpenses = summaries.reduce((sum, s) => sum + parseFloat(s.total_expenses || 0), 0);
    const netFlow = totalIncome - totalExpenses;
    const totalTransactions = summaries.reduce((sum, s) => sum + (s.transaction_count || 0), 0);
    const avgDailyIncome = totalIncome / summaries.length;
    const avgDailyExpenses = totalExpenses / summaries.length;
    
    return {
      success: true,
      data: {
        year,
        month,
        totalDays: summaries.length,
        totalIncome,
        totalExpenses,
        netFlow,
        totalTransactions,
        avgDailyIncome,
        avgDailyExpenses,
        dailySummaries: summaries.map(s => ({
          ...s,
          total_income: parseFloat(s.total_income),
          total_expenses: parseFloat(s.total_expenses),
          net_flow: parseFloat(s.net_flow)
        }))
      }
    };
  } catch (error) {
    console.error('Error getting monthly summary:', error);
    return {
      success: false,
      error: 'Failed to get monthly summary'
    };
  }
};

// Export all functions
const dailySummaryService = {
  getPaginatedDailySummaries,
  getAllDailySummaries,
  getDailySummaryByDate,
  getDailySummaryById,
  getLatestDailySummary,
  getDailySummariesByDateRange,
  getDailySummariesByMonth,
  getDailySummariesByWeek,
  generateAndSaveDailySummary,
  generateDailySummary,
  createDailySummary,
  updateDailySummary,
  deleteDailySummary,
  getDailySummaryStatistics,
  generateDailySummariesForRange,
  getWeeklySummary,
  getMonthlySummary
};

export default dailySummaryService;

import * as ReportModel from '../models/Report.js';
import * as DailySummaryModel from '../models/DailySummary.js';
import * as AnalyticsModel from '../models/Analytics.js';
import * as IncomeModel from '../models/Income.js';
import * as ExpenseModel from '../models/Expense.js';
import db from '../config/database.js';

/**
 * Report Service
 * Business logic layer for report generation and management
 * 
 * Handles:
 * - Report generation with business logic
 * - Report caching and retrieval
 * - Data aggregation for reports
 * - Custom report generation
 * - Report export preparation
 */

/**
 * Get paginated list of reports
 * @param {Object} options - Filter and pagination options
 * @param {string} options.reportType - Filter by report type
 * @param {string} options.title - Filter by title
 * @param {number} options.generatedBy - Filter by user ID
 * @param {string} options.startDate - Filter by start date
 * @param {string} options.endDate - Filter by end date
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.pageSize - Items per page
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction
 * @returns {Object} - Paginated result with reports
 */
export const getPaginatedReports = async (options = {}) => {
  const {
    reportType,
    title,
    generatedBy,
    startDate,
    endDate,
    page = 1,
    pageSize = 20,
    orderBy = 'created_at',
    orderDir = 'DESC'
  } = options;

  const offset = (page - 1) * pageSize;

  const filterOptions = {
    reportType,
    title,
    generatedBy,
    startDate,
    endDate,
    limit: pageSize,
    offset,
    orderBy,
    orderDirection: orderDir
  };

  const reports = await ReportModel.getAll(filterOptions);
  const total = await ReportModel.getAll({ reportType, title, generatedBy, startDate, endDate });

  const totalPages = Math.ceil(total.length / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    success: true,
    data: reports.map(r => ({
      ...r,
      report_data: r.report_data ? JSON.parse(r.report_data) : null,
      parameters: r.parameters ? JSON.parse(r.parameters) : null
    })),
    pagination: {
      page,
      pageSize,
      total: total.length,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? page + 1 : null,
      previousPage: hasPreviousPage ? page - 1 : null
    }
  };
};

/**
 * Get all reports without pagination
 * @param {Object} options - Filter options
 * @returns {Object} - All matching reports
 */
export const getAllReports = async (options = {}) => {
  const reports = await ReportModel.getAll(options);
  return {
    success: true,
    data: reports.map(r => ({
      ...r,
      report_data: r.report_data ? JSON.parse(r.report_data) : null,
      parameters: r.parameters ? JSON.parse(r.parameters) : null
    }))
  };
};

/**
 * Get a single report by ID
 * @param {number} id - Report ID
 * @returns {Object} - Report record or error
 */
export const getReportById = async (id) => {
  const report = await ReportModel.getById(id);
  
  if (!report) {
    return {
      success: false,
      error: 'Report not found'
    };
  }

  return {
    success: true,
    data: {
      ...report,
      report_data: report.report_data ? JSON.parse(report.report_data) : null,
      parameters: report.parameters ? JSON.parse(report.parameters) : null
    }
  };
};

/**
 * Get reports by type
 * @param {string} reportType - Report type
 * @param {Object} options - Pagination options
 * @returns {Object} - Paginated reports of the specified type
 */
export const getReportsByType = async (reportType, options = {}) => {
  const { page = 1, pageSize = 20 } = options;
  const offset = (page - 1) * pageSize;

  const reports = await ReportModel.getByType(reportType, { limit: pageSize, offset });
  const allReports = await ReportModel.getByType(reportType, {});
  const total = allReports.length;
  const totalPages = Math.ceil(total / pageSize);

  return {
    success: true,
    data: reports.map(r => ({
      ...r,
      report_data: r.report_data ? JSON.parse(r.report_data) : null,
      parameters: r.parameters ? JSON.parse(r.parameters) : null
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    }
  };
};

/**
 * Get the latest report of a specific type
 * @param {string} reportType - Report type
 * @returns {Object} - Latest report or error
 */
export const getLatestReportByType = async (reportType) => {
  const report = await ReportModel.getLatestByType(reportType);
  
  if (!report) {
    return {
      success: false,
      error: 'No report found for the specified type'
    };
  }

  return {
    success: true,
    data: {
      ...report,
      report_data: report.report_data ? JSON.parse(report.report_data) : null,
      parameters: report.parameters ? JSON.parse(report.parameters) : null
    }
  };
};

/**
 * Generate a daily summary report
 * @param {Object} options - Generation options
 * @param {string} options.date - Specific date (YYYY-MM-DD) or null for today
 * @param {number} options.generatedBy - User ID
 * @returns {Object} - Generated report
 */
export const generateDailySummaryReport = async (options = {}) => {
  const { date, generatedBy } = options;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    // Get or generate daily summary for the date
    let summary = await DailySummaryModel.getByDate(targetDate);
    
    if (!summary) {
      // Generate summary from raw data
      summary = await DailySummaryModel.generateForDate(targetDate);
    }

    // Prepare report data
    const reportData = {
      date: summary.summary_date,
      totalIncome: parseFloat(summary.total_income),
      incomeCount: summary.income_count,
      totalExpenses: parseFloat(summary.total_expenses),
      expenseCount: summary.expense_count,
      netFlow: parseFloat(summary.net_flow),
      transactionCount: summary.transaction_count
    };

    // Save report
    const report = await ReportModel.create({
      report_type: 'daily_summary',
      title: `Daily Summary Report - ${targetDate}`,
      description: `Financial summary for ${targetDate}`,
      parameters: JSON.stringify({ date: targetDate }),
      report_data: JSON.stringify(reportData),
      generated_by: generatedBy
    });

    return {
      success: true,
      message: 'Daily summary report generated successfully',
      data: {
        ...report,
        report_data: reportData
      }
    };
  } catch (error) {
    console.error('Error generating daily summary report:', error);
    return {
      success: false,
      error: 'Failed to generate daily summary report'
    };
  }
};

/**
 * Generate a date range summary report
 * @param {Object} options - Generation options
 * @param {string} options.startDate - Start date (YYYY-MM-DD)
 * @param {string} options.endDate - End date (YYYY-MM-DD)
 * @param {number} options.generatedBy - User ID
 * @returns {Object} - Generated report
 */
export const generateDateRangeReport = async (options = {}) => {
  const { startDate, endDate, generatedBy } = options;

  if (!startDate || !endDate) {
    return {
      success: false,
      error: 'Start date and end date are required'
    };
  }

  try {
    // Get daily summaries for the date range
    const summaries = await DailySummaryModel.getByDateRange(startDate, endDate);
    
    // Calculate aggregates
    const totalIncome = summaries.reduce((sum, s) => sum + parseFloat(s.total_income || 0), 0);
    const totalExpenses = summaries.reduce((sum, s) => sum + parseFloat(s.total_expenses || 0), 0);
    const netFlow = totalIncome - totalExpenses;
    const totalTransactions = summaries.reduce((sum, s) => sum + (s.transaction_count || 0), 0);
    const totalDays = summaries.length;

    const reportData = {
      startDate,
      endDate,
      totalDays,
      totalIncome,
      totalExpenses,
      netFlow,
      totalTransactions,
      avgDailyIncome: totalDays > 0 ? totalIncome / totalDays : 0,
      avgDailyExpenses: totalDays > 0 ? totalExpenses / totalDays : 0,
      summaries: summaries.map(s => ({
        date: s.summary_date,
        totalIncome: parseFloat(s.total_income),
        totalExpenses: parseFloat(s.total_expenses),
        netFlow: parseFloat(s.net_flow),
        transactionCount: s.transaction_count
      }))
    };

    // Save report
    const report = await ReportModel.create({
      report_type: 'custom',
      title: `Date Range Report - ${startDate} to ${endDate}`,
      description: `Financial summary from ${startDate} to ${endDate}`,
      parameters: JSON.stringify({ startDate, endDate }),
      report_data: JSON.stringify(reportData),
      generated_by: generatedBy
    });

    return {
      success: true,
      message: 'Date range report generated successfully',
      data: {
        ...report,
        report_data: reportData
      }
    };
  } catch (error) {
    console.error('Error generating date range report:', error);
    return {
      success: false,
      error: 'Failed to generate date range report'
    };
  }
};

/**
 * Generate an income vs expense comparison report
 * @param {Object} options - Generation options
 * @param {string} options.startDate - Start date
 * @param {string} options.endDate - End date
 * @param {number} options.generatedBy - User ID
 * @returns {Object} - Generated report
 */
export const generateIncomeVsExpenseReport = async (options = {}) => {
  const { startDate, endDate, generatedBy } = options;

  try {
    const comparisonData = await AnalyticsModel.getIncomeVsExpense({ startDate, endDate });
    
    const reportData = {
      startDate,
      endDate,
      periods: comparisonData.map(p => ({
        period: p.period,
        totalIncome: parseFloat(p.total_income || 0),
        totalExpenses: parseFloat(p.total_expenses || 0),
        netFlow: parseFloat(p.net_flow || 0),
        incomeCount: p.income_count || 0,
        expenseCount: p.expense_count || 0
      }))
    };

    const report = await ReportModel.create({
      report_type: 'income_vs_expense',
      title: `Income vs Expense Report - ${startDate} to ${endDate}`,
      description: `Income vs expense comparison from ${startDate} to ${endDate}`,
      parameters: JSON.stringify({ startDate, endDate }),
      report_data: JSON.stringify(reportData),
      generated_by: generatedBy
    });

    return {
      success: true,
      message: 'Income vs expense report generated successfully',
      data: {
        ...report,
        report_data: reportData
      }
    };
  } catch (error) {
    console.error('Error generating income vs expense report:', error);
    return {
      success: false,
      error: 'Failed to generate income vs expense report'
    };
  }
};

/**
 * Generate a category summary report
 * @param {Object} options - Generation options
 * @param {number} options.generatedBy - User ID
 * @returns {Object} - Generated report
 */
export const generateCategorySummaryReport = async (options = {}) => {
  const { generatedBy } = options;

  try {
    const [incomeByCategory, expensesByCategory] = await Promise.all([
      AnalyticsModel.getIncomeByCategory({}),
      AnalyticsModel.getExpensesByCategory({})
    ]);

    const reportData = {
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
      }))
    };

    const report = await ReportModel.create({
      report_type: 'category_summary',
      title: 'Category Summary Report',
      description: 'Summary of income and expenses by category',
      parameters: JSON.stringify({}),
      report_data: JSON.stringify(reportData),
      generated_by: generatedBy
    });

    return {
      success: true,
      message: 'Category summary report generated successfully',
      data: {
        ...report,
        report_data: reportData
      }
    };
  } catch (error) {
    console.error('Error generating category summary report:', error);
    return {
      success: false,
      error: 'Failed to generate category summary report'
    };
  }
};

/**
 * Create a report record directly
 * @param {Object} data - Report data
 * @returns {Object} - Created report
 */
export const createReport = async (data) => {
  const {
    reportType,
    title,
    description,
    parameters,
    reportData,
    filePath,
    generatedBy
  } = data;

  // Validate required fields
  if (!reportType || !title || !generatedBy) {
    return {
      success: false,
      error: 'Required fields: reportType, title, generatedBy'
    };
  }

  try {
    const report = await ReportModel.create({
      report_type: reportType,
      title,
      description,
      parameters: JSON.stringify(parameters || {}),
      report_data: JSON.stringify(reportData || {}),
      file_path: filePath,
      generated_by: generatedBy
    });

    return {
      success: true,
      message: 'Report created successfully',
      data: {
        ...report,
        report_data: reportData || {},
        parameters: parameters || {}
      }
    };
  } catch (error) {
    console.error('Error creating report:', error);
    return {
      success: false,
      error: error.message || 'Failed to create report'
    };
  }
};

/**
 * Update a report record
 * @param {number} id - Report ID
 * @param {Object} updates - Fields to update
 * @returns {Object} - Updated report
 */
export const updateReport = async (id, updates) => {
  const existing = await ReportModel.getById(id);
  
  if (!existing) {
    return {
      success: false,
      error: 'Report not found'
    };
  }

  try {
    const updated = await ReportModel.update(id, updates);
    
    return {
      success: true,
      message: 'Report updated successfully',
      data: {
        ...updated,
        report_data: updated.report_data ? JSON.parse(updated.report_data) : null,
        parameters: updated.parameters ? JSON.parse(updated.parameters) : null
      }
    };
  } catch (error) {
    console.error('Error updating report:', error);
    return {
      success: false,
      error: 'Failed to update report'
    };
  }
};

/**
 * Delete a report record
 * @param {number} id - Report ID
 * @returns {Object} - Success status
 */
export const deleteReport = async (id) => {
  const existing = await ReportModel.getById(id);
  
  if (!existing) {
    return {
      success: false,
      error: 'Report not found'
    };
  }

  try {
    await ReportModel.deleteRecord(id);
    
    return {
      success: true,
      message: 'Report deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting report:', error);
    return {
      success: false,
      error: 'Failed to delete report'
    };
  }
};

/**
 * Get report statistics
 * @returns {Object} - Report statistics
 */
export const getReportStatistics = async () => {
  try {
    const stats = await ReportModel.getStatistics();
    const countByType = await ReportModel.getCountByType();
    
    return {
      success: true,
      data: {
        ...stats,
        byType: countByType
      }
    };
  } catch (error) {
    console.error('Error getting report statistics:', error);
    return {
      success: false,
      error: 'Failed to get report statistics'
    };
  }
};

/**
 * Search reports
 * @param {string} query - Search query
 * @param {number} limit - Limit results
 * @returns {Object} - Search results
 */
export const searchReports = async (query, limit = 50) => {
  try {
    const results = await ReportModel.search(query, limit);
    
    return {
      success: true,
      data: results.map(r => ({
        ...r,
        report_data: r.report_data ? JSON.parse(r.report_data) : null,
        parameters: r.parameters ? JSON.parse(r.parameters) : null
      }))
    };
  } catch (error) {
    console.error('Error searching reports:', error);
    return {
      success: false,
      error: 'Failed to search reports'
    };
  }
};

// Export all functions
const reportService = {
  getPaginatedReports,
  getAllReports,
  getReportById,
  getReportsByType,
  getLatestReportByType,
  generateDailySummaryReport,
  generateDateRangeReport,
  generateIncomeVsExpenseReport,
  generateCategorySummaryReport,
  createReport,
  updateReport,
  deleteReport,
  getReportStatistics,
  searchReports
};

export default reportService;

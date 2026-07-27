import * as dashboardService from '../services/dashboardService.js';

/**
 * Dashboard Controller
 * Route handlers for dashboard API endpoints
 *
 * Handles:
 * - HTTP request/response cycle
 * - Request validation
 * - Error handling
 * - Response formatting
 */

/**
 * Get dashboard summary
 * GET /api/dashboard
 *
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 *
 * Response: 200 OK with dashboard summary data
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await dashboardService.getDashboardSummary({ startDate, endDate });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get quick statistics
 * GET /api/dashboard/summary
 *
 * Response: 200 OK with quick statistics
 */
export const getQuickStats = async (req, res, next) => {
  try {
    const result = await dashboardService.getQuickStats();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get income vs expense chart data
 * GET /api/dashboard/charts/income-expense
 *
 * Query Parameters:
 * - period: Period type (day, week, month, year) - default: month
 * - limit: Number of periods - default: 12
 *
 * Response: 200 OK with chart data
 */
export const getIncomeVsExpenseChart = async (req, res, next) => {
  try {
    const { period = 'month', limit = 12 } = req.query;
    
    // Validate parameters
    const validPeriods = ['day', 'week', 'month', 'year'];
    if (period && !validPeriods.includes(period.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid period. Must be one of: ${validPeriods.join(', ')}`
      });
    }
    
    // Validate limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be a number between 1 and 100'
      });
    }
    
    const result = await dashboardService.getIncomeVsExpenseChartData({
      period: period.toLowerCase(),
      limit: limitNum
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get income by category
 * GET /api/dashboard/charts/income-by-category
 *
 * Query Parameters:
 * - limit: Number of categories - default: 10
 *
 * Response: 200 OK with income category breakdown
 */
export const getIncomeByCategory = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // Validate limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be a number between 1 and 50'
      });
    }
    
    const result = await dashboardService.getIncomeByCategory({ limit: limitNum });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get expenses by category
 * GET /api/dashboard/charts/expenses-by-category
 *
 * Query Parameters:
 * - limit: Number of categories - default: 10
 *
 * Response: 200 OK with expense category breakdown
 */
export const getExpensesByCategory = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // Validate limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be a number between 1 and 50'
      });
    }
    
    const result = await dashboardService.getExpensesByCategory({ limit: limitNum });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get recent activity
 * GET /api/dashboard/recent-activity
 *
 * Query Parameters:
 * - limit: Number of items - default: 10
 *
 * Response: 200 OK with recent activity items
 */
export const getRecentActivity = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // Validate limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be a number between 1 and 50'
      });
    }
    
    const result = await dashboardService.getRecentActivity({ limit: limitNum });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get student distribution by class
 * GET /api/dashboard/students/distribution
 *
 * Response: 200 OK with student distribution data
 */
export const getStudentDistribution = async (req, res, next) => {
  try {
    const result = await dashboardService.getStudentDistribution();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get filtered summary with date range
 * GET /api/dashboard/filtered
 *
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 *
 * Response: 200 OK with filtered summary
 */
export const getFilteredSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !dateRegex.test(startDate)) {
      return res.status(400).json({
        success: false,
        error: 'Start date must be in YYYY-MM-DD format'
      });
    }
    
    if (endDate && !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        error: 'End date must be in YYYY-MM-DD format'
      });
    }
    
    // Validate date order
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        return res.status(400).json({
          success: false,
          error: 'Start date must be before end date'
        });
      }
    }
    
    const result = await dashboardService.getFilteredSummary({ startDate, endDate });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  getDashboardSummary,
  getQuickStats,
  getIncomeVsExpenseChart,
  getIncomeByCategory,
  getExpensesByCategory,
  getRecentActivity,
  getStudentDistribution,
  getFilteredSummary
};

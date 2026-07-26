import * as analyticsService from '../services/analyticsService.js';

/**
 * Analytics Controller
 * Route handlers for analytics API endpoints
 * 
 * Handles:
 * - HTTP request/response cycle
 * - Request validation
 * - Error handling
 * - Response formatting
 */

/**
 * Get comprehensive dashboard analytics data
 * GET /api/analytics/dashboard
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 * 
 * Response: 200 OK with dashboard analytics data
 */
export const getDashboardData = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await analyticsService.getDashboardData({ startDate, endDate });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get income vs expense comparison
 * GET /api/analytics/income-vs-expense
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 * - groupBy: Group by (day, week, month, year, default: month)
 * 
 * Response: 200 OK with comparison data
 */
export const getIncomeVsExpense = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    const validGroupBy = ['day', 'week', 'month', 'year'];
    if (groupBy && !validGroupBy.includes(groupBy)) {
      return res.status(400).json({
        success: false,
        error: `Invalid groupBy. Must be one of: ${validGroupBy.join(', ')}`
      });
    }
    
    const result = await analyticsService.getIncomeVsExpense({
      startDate,
      endDate,
      groupBy
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get income by category with percentages
 * GET /api/analytics/income-by-category
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 * - limit: Limit results (default: 100)
 * 
 * Response: 200 OK with income by category data
 */
export const getIncomeByCategory = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    const limitNum = parseInt(limit, 10) || 100;
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit. Must be between 1 and 100.'
      });
    }
    
    const result = await analyticsService.getIncomeByCategory({
      startDate,
      endDate,
      limit: limitNum
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get expenses by category with percentages
 * GET /api/analytics/expenses-by-category
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 * - limit: Limit results (default: 100)
 * 
 * Response: 200 OK with expenses by category data
 */
export const getExpensesByCategory = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    const limitNum = parseInt(limit, 10) || 100;
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit. Must be between 1 and 100.'
      });
    }
    
    const result = await analyticsService.getExpensesByCategory({
      startDate,
      endDate,
      limit: limitNum
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get top income sources
 * GET /api/analytics/top-income-sources
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 * - limit: Limit results (default: 10)
 * 
 * Response: 200 OK with top income sources
 */
export const getTopIncomeSources = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    const limitNum = parseInt(limit, 10) || 10;
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit. Must be between 1 and 100.'
      });
    }
    
    const result = await analyticsService.getTopIncomeSources({
      startDate,
      endDate,
      limit: limitNum
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get top expenses
 * GET /api/analytics/top-expenses
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 * - limit: Limit results (default: 10)
 * 
 * Response: 200 OK with top expenses
 */
export const getTopExpenses = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    const limitNum = parseInt(limit, 10) || 10;
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit. Must be between 1 and 100.'
      });
    }
    
    const result = await analyticsService.getTopExpenses({
      startDate,
      endDate,
      limit: limitNum
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get overall statistics
 * GET /api/analytics/statistics
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 * 
 * Response: 200 OK with overall statistics
 */
export const getOverallStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await analyticsService.getOverallStatistics({ startDate, endDate });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get income trends over time
 * GET /api/analytics/income-trends
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 * - interval: Interval (day, week, month, default: month)
 * 
 * Response: 200 OK with income trends data
 */
export const getIncomeTrends = async (req, res, next) => {
  try {
    const { startDate, endDate, interval = 'month' } = req.query;
    
    const validIntervals = ['day', 'week', 'month'];
    if (interval && !validIntervals.includes(interval)) {
      return res.status(400).json({
        success: false,
        error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}`
      });
    }
    
    const result = await analyticsService.getIncomeTrends({
      startDate,
      endDate,
      interval
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get expense trends over time
 * GET /api/analytics/expense-trends
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 * - interval: Interval (day, week, month, default: month)
 * 
 * Response: 200 OK with expense trends data
 */
export const getExpenseTrends = async (req, res, next) => {
  try {
    const { startDate, endDate, interval = 'month' } = req.query;
    
    const validIntervals = ['day', 'week', 'month'];
    if (interval && !validIntervals.includes(interval)) {
      return res.status(400).json({
        success: false,
        error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}`
      });
    }
    
    const result = await analyticsService.getExpenseTrends({
      startDate,
      endDate,
      interval
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get net flow trends over time
 * GET /api/analytics/net-flow
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 * - interval: Interval (day, week, month, default: month)
 * 
 * Response: 200 OK with net flow trends data
 */
export const getNetFlowTrends = async (req, res, next) => {
  try {
    const { startDate, endDate, interval = 'month' } = req.query;
    
    const validIntervals = ['day', 'week', 'month'];
    if (interval && !validIntervals.includes(interval)) {
      return res.status(400).json({
        success: false,
        error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}`
      });
    }
    
    const result = await analyticsService.getNetFlowTrends({
      startDate,
      endDate,
      interval
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get recent daily summaries
 * GET /api/analytics/daily-summaries
 * 
 * Query Parameters:
 * - limit: Limit results (default: 30)
 * 
 * Response: 200 OK with recent daily summaries
 */
export const getRecentDailySummaries = async (req, res, next) => {
  try {
    const { limit = 30 } = req.query;
    
    const limitNum = parseInt(limit, 10) || 30;
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit. Must be between 1 and 100.'
      });
    }
    
    const result = await analyticsService.getRecentDailySummaries({ limit: limitNum });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get daily summary statistics
 * GET /api/analytics/summary-statistics
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 * 
 * Response: 200 OK with daily summary statistics
 */
export const getDailySummaryStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const result = await analyticsService.getDailySummaryStatistics({ startDate, endDate });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export all controller functions
const analyticsController = {
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

export default analyticsController;

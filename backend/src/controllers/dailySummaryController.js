import * as dailySummaryService from '../services/dailySummaryService.js';

/**
 * Daily Summary Controller
 * Route handlers for daily summary API endpoints
 * 
 * Handles:
 * - HTTP request/response cycle
 * - Request validation
 * - Error handling
 * - Response formatting
 */

/**
 * Get paginated list of daily summaries
 * GET /api/daily-summaries
 * 
 * Query Parameters:
 * - startDate: Filter by start date (YYYY-MM-DD)
 * - endDate: Filter by end date (YYYY-MM-DD)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - orderBy: Field to order by (default: summary_date)
 * - orderDir: Order direction (ASC/DESC, default: DESC)
 * 
 * Response: 200 OK with paginated daily summaries list
 */
export const getDailySummaries = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
      orderBy = 'summary_date',
      orderDir = 'DESC'
    } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 20;

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page number. Must be a positive integer.'
      });
    }

    if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page size. Must be between 1 and 100.'
      });
    }

    const result = await dailySummaryService.getPaginatedDailySummaries({
      startDate,
      endDate,
      page: pageNum,
      pageSize: pageSizeNum,
      orderBy,
      orderDir
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all daily summaries (no pagination)
 * GET /api/daily-summaries/all
 * 
 * Query Parameters:
 * - startDate: Filter by start date
 * - endDate: Filter by end date
 * 
 * Response: 200 OK with all matching daily summaries
 */
export const getAllDailySummaries = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const result = await dailySummaryService.getAllDailySummaries({ startDate, endDate });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get a daily summary by date
 * GET /api/daily-summaries/date/:date
 * 
 * Response: 200 OK with daily summary or 404 if not found
 */
export const getDailySummaryByDate = async (req, res, next) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required.'
      });
    }

    const result = await dailySummaryService.getDailySummaryByDate(date);

    if (!result.success) {
      return res.status(404).json(result);
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
 * Get a daily summary by ID
 * GET /api/daily-summaries/:id
 * 
 * Response: 200 OK with daily summary or 404 if not found
 */
export const getDailySummaryById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid daily summary ID. Must be a number.'
      });
    }

    const result = await dailySummaryService.getDailySummaryById(id);

    if (!result.success) {
      return res.status(404).json(result);
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
 * Get the most recent daily summary
 * GET /api/daily-summaries/latest
 * 
 * Response: 200 OK with most recent daily summary or 404 if not found
 */
export const getLatestDailySummary = async (req, res, next) => {
  try {
    const result = await dailySummaryService.getLatestDailySummary();

    if (!result.success) {
      return res.status(404).json(result);
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
 * Get daily summaries by date range
 * GET /api/daily-summaries/range
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD, required)
 * - endDate: End date (YYYY-MM-DD, required)
 * 
 * Response: 200 OK with daily summaries in the date range
 */
export const getDailySummariesByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required.'
      });
    }

    const result = await dailySummaryService.getDailySummariesByDateRange(startDate, endDate);

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
 * Get daily summaries by month
 * GET /api/daily-summaries/month/:year/:month
 * 
 * Response: 200 OK with daily summaries for the month
 */
export const getDailySummariesByMonth = async (req, res, next) => {
  try {
    const { year, month } = req.params;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Year and month are required.'
      });
    }

    const result = await dailySummaryService.getDailySummariesByMonth(year, month);

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
 * Get daily summaries by week
 * GET /api/daily-summaries/week/:startDate
 * 
 * Response: 200 OK with daily summaries for the week
 */
export const getDailySummariesByWeek = async (req, res, next) => {
  try {
    const { startDate } = req.params;

    if (!startDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date is required.'
      });
    }

    const result = await dailySummaryService.getDailySummariesByWeek(startDate);

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
 * Generate and save daily summary for a specific date
 * POST /api/daily-summaries/generate/:date
 * 
 * Response: 201 Created with generated daily summary
 */
export const generateAndSaveDailySummary = async (req, res, next) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required.'
      });
    }

    const result = await dailySummaryService.generateAndSaveDailySummary(date);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Generate daily summary data for a date (without saving)
 * GET /api/daily-summaries/generate/:date
 * 
 * Response: 200 OK with generated daily summary data
 */
export const generateDailySummary = async (req, res, next) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required.'
      });
    }

    const result = await dailySummaryService.generateDailySummary(date);

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
 * Create a daily summary record directly
 * POST /api/daily-summaries
 * 
 * Request Body:
 * - summary_date: Summary date (YYYY-MM-DD, required)
 * - total_income: Total income for the day (required)
 * - income_count: Number of income records
 * - total_expenses: Total expenses for the day (required)
 * - expense_count: Number of expense records
 * - net_flow: Net flow (income - expenses)
 * - transaction_count: Total transaction count
 * 
 * Response: 201 Created with created daily summary
 */
export const createDailySummary = async (req, res, next) => {
  try {
    const result = await dailySummaryService.createDailySummary(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update a daily summary record
 * PUT /api/daily-summaries/:id
 * 
 * Request Body:
 * - Any fields to update
 * 
 * Response: 200 OK with updated daily summary or 404 if not found
 */
export const updateDailySummary = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid daily summary ID. Must be a number.'
      });
    }

    const result = await dailySummaryService.updateDailySummary(id, req.body);

    if (!result.success) {
      return res.status(404).json(result);
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
 * Delete a daily summary record
 * DELETE /api/daily-summaries/:id
 * 
 * Response: 200 OK with success status or 404 if not found
 */
export const deleteDailySummary = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid daily summary ID. Must be a number.'
      });
    }

    const result = await dailySummaryService.deleteDailySummary(id);

    if (!result.success) {
      return res.status(404).json(result);
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
 * GET /api/daily-summaries/statistics
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

    const result = await dailySummaryService.getDailySummaryStatistics({ startDate, endDate });

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
 * Generate daily summaries for a date range
 * POST /api/daily-summaries/generate-range
 * 
 * Request Body:
 * - startDate: Start date (YYYY-MM-DD, required)
 * - endDate: End date (YYYY-MM-DD, required)
 * 
 * Response: 201 Created with generated daily summaries
 */
export const generateDailySummariesForRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required.'
      });
    }

    const result = await dailySummaryService.generateDailySummariesForRange(startDate, endDate);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get weekly summary (aggregate of daily summaries)
 * GET /api/daily-summaries/weekly/:startDate
 * 
 * Response: 200 OK with weekly summary or 404 if not found
 */
export const getWeeklySummary = async (req, res, next) => {
  try {
    const { startDate } = req.params;

    if (!startDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date is required.'
      });
    }

    const result = await dailySummaryService.getWeeklySummary(startDate);

    if (!result.success) {
      return res.status(404).json(result);
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
 * Get monthly summary (aggregate of daily summaries)
 * GET /api/daily-summaries/monthly/:year/:month
 * 
 * Response: 200 OK with monthly summary or 404 if not found
 */
export const getMonthlySummary = async (req, res, next) => {
  try {
    const { year, month } = req.params;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Year and month are required.'
      });
    }

    const result = await dailySummaryService.getMonthlySummary(year, month);

    if (!result.success) {
      return res.status(404).json(result);
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
const dailySummaryController = {
  getDailySummaries,
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

export default dailySummaryController;

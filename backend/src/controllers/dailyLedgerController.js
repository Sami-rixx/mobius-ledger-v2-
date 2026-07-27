import {
  getPaginatedDailyLedgers,
  getDailyLedgerById,
  getDailyLedgerByDate,
  getTodayLedger,
  getYesterdayLedger,
  getRecentLedgers,
  getMonthlyLedgers,
  getDailyLedgerStatistics,
  createDailyLedger,
  updateDailyLedger,
  deleteDailyLedger,
  getMissingLedgerDates,
  generateLedgerForDate,
  generateLedgerForDateRange,
  fillMissingLedgerDates,
  getLedgerSummary
} from '../services/dailyLedgerService.js';

/**
 * DailyLedger Controller
 * HTTP request handlers for daily ledger API endpoints
 * 
 * Handles:
 * - RESTful CRUD operations
 * - Request validation
 * - Error handling
 * - Response formatting
 */

/**
 * Format error response
 * @param {Error} error - Error object
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Error response object
 */
function formatErrorResponse(error, statusCode = 400) {
  return {
    success: false,
    error: error.message || 'An error occurred',
    statusCode
  };
}

/**
 * Format success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @returns {Object} - Success response object
 */
function formatSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    data,
    message
  };
}

/**
 * List daily ledger records with pagination and filtering
 * GET /api/daily-ledger
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function listDailyLedgers(req, res) {
  try {
    const {
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
      orderBy = 'date',
      orderDirection = 'DESC'
    } = req.query;

    const result = await getPaginatedDailyLedgers({
      startDate,
      endDate,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      orderBy,
      orderDirection
    });

    res.json(formatSuccessResponse(result));
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(formatErrorResponse(error, statusCode));
  }
}

/**
 * Count total daily ledger records
 * GET /api/daily-ledger/count
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function countDailyLedgers(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const countResult = await getDailyLedgerStatistics({ startDate, endDate });
    
    res.json(formatSuccessResponse({ count: countResult.total_days || 0 }));
  } catch (error) {
    res.status(400).json(formatErrorResponse(error));
  }
}

/**
 * Get daily ledger by ID
 * GET /api/daily-ledger/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getDailyLedgerByIdHandler(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json(formatErrorResponse(new Error('Invalid ledger ID')));
    }

    const ledger = await getDailyLedgerById(id);
    res.json(formatSuccessResponse(ledger));
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(formatErrorResponse(error, statusCode));
  }
}

/**
 * Get daily ledger by date
 * GET /api/daily-ledger/date/:date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getDailyLedgerByDateHandler(req, res) {
  try {
    const date = req.params.date;
    const ledger = await getDailyLedgerByDate(date);
    res.json(formatSuccessResponse(ledger));
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(formatErrorResponse(error, statusCode));
  }
}

/**
 * Get today's daily ledger
 * GET /api/daily-ledger/today
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getTodayLedgerHandler(req, res) {
  try {
    const ledger = await getTodayLedger();
    if (!ledger) {
      return res.status(404).json(formatErrorResponse(new Error('No ledger found for today')));
    }
    res.json(formatSuccessResponse(ledger));
  } catch (error) {
    res.status(400).json(formatErrorResponse(error));
  }
}

/**
 * Get yesterday's daily ledger
 * GET /api/daily-ledger/yesterday
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getYesterdayLedgerHandler(req, res) {
  try {
    const ledger = await getYesterdayLedger();
    if (!ledger) {
      return res.status(404).json(formatErrorResponse(new Error('No ledger found for yesterday')));
    }
    res.json(formatSuccessResponse(ledger));
  } catch (error) {
    res.status(400).json(formatErrorResponse(error));
  }
}

/**
 * Get recent daily ledger records
 * GET /api/daily-ledger/recent
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getRecentLedgersHandler(req, res) {
  try {
    const { limit = 10 } = req.query;
    const ledgers = await getRecentLedgers(parseInt(limit));
    res.json(formatSuccessResponse(ledgers));
  } catch (error) {
    res.status(400).json(formatErrorResponse(error));
  }
}

/**
 * Get daily ledgers for a specific month
 * GET /api/daily-ledger/month/:year/:month
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getMonthlyLedgersHandler(req, res) {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    
    if (isNaN(year) || isNaN(month)) {
      return res.status(400).json(formatErrorResponse(new Error('Invalid year or month')));
    }

    const ledgers = await getMonthlyLedgers(year, month);
    res.json(formatSuccessResponse(ledgers));
  } catch (error) {
    res.status(400).json(formatErrorResponse(error));
  }
}

/**
 * Get daily ledger statistics
 * GET /api/daily-ledger/statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getDailyLedgerStatisticsHandler(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const stats = await getDailyLedgerStatistics({ startDate, endDate });
    res.json(formatSuccessResponse(stats));
  } catch (error) {
    res.status(400).json(formatErrorResponse(error));
  }
}

/**
 * Create a new daily ledger record
 * POST /api/daily-ledger
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function createDailyLedgerHandler(req, res) {
  try {
    const data = req.body;
    
    // Validate required fields
    if (!data.date) {
      return res.status(400).json(formatErrorResponse(new Error('date is required')));
    }

    const ledger = await createDailyLedger(data);
    res.status(201).json(formatSuccessResponse(ledger, 'Daily ledger created successfully'));
  } catch (error) {
    const statusCode = error.message.includes('already exists') ? 409 : 400;
    res.status(statusCode).json(formatErrorResponse(error, statusCode));
  }
}

/**
 * Update an existing daily ledger record
 * PUT /api/daily-ledger/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function updateDailyLedgerHandler(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json(formatErrorResponse(new Error('Invalid ledger ID')));
    }

    const data = req.body;
    const ledger = await updateDailyLedger(id, data);
    res.json(formatSuccessResponse(ledger, 'Daily ledger updated successfully'));
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('already exists') ? 409 : 400;
    res.status(statusCode).json(formatErrorResponse(error, statusCode));
  }
}

/**
 * Delete a daily ledger record
 * DELETE /api/daily-ledger/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function deleteDailyLedgerHandler(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json(formatErrorResponse(new Error('Invalid ledger ID')));
    }

    const result = await deleteDailyLedger(id);
    res.json(formatSuccessResponse(result));
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(formatErrorResponse(error, statusCode));
  }
}

/**
 * Get missing dates in the ledger sequence
 * GET /api/daily-ledger/missing-dates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getMissingLedgerDatesHandler(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const missingDates = await getMissingLedgerDates({ startDate, endDate });
    res.json(formatSuccessResponse({ missingDates, count: missingDates.length }));
  } catch (error) {
    res.status(400).json(formatErrorResponse(error));
  }
}

/**
 * Generate ledger for a specific date
 * POST /api/daily-ledger/generate/:date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function generateLedgerForDateHandler(req, res) {
  try {
    const date = req.params.date;
    const generated = await generateLedgerForDate(date);
    res.json(formatSuccessResponse(generated));
  } catch (error) {
    res.status(400).json(formatErrorResponse(error));
  }
}

/**
 * Generate ledger for a date range
 * POST /api/daily-ledger/generate
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function generateLedgerForDateRangeHandler(req, res) {
  try {
    const { startDate, endDate, force = false } = req.body || req.query;
    const generated = await generateLedgerForDateRange({ startDate, endDate, force: force === 'true' });
    res.json(formatSuccessResponse(generated));
  } catch (error) {
    res.status(400).json(formatErrorResponse(error));
  }
}

/**
 * Fill missing ledger dates
 * POST /api/daily-ledger/fill-missing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function fillMissingLedgerDatesHandler(req, res) {
  try {
    const { startDate, endDate } = req.body || req.query;
    const result = await fillMissingLedgerDates({ startDate, endDate });
    res.json(formatSuccessResponse(result));
  } catch (error) {
    res.status(400).json(formatErrorResponse(error));
  }
}

/**
 * Get ledger summary
 * GET /api/daily-ledger/summary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getLedgerSummaryHandler(req, res) {
  try {
    const { days = 30 } = req.query;
    const summary = await getLedgerSummary({ days: parseInt(days) });
    res.json(formatSuccessResponse(summary));
  } catch (error) {
    res.status(400).json(formatErrorResponse(error));
  }
}

// Export all handlers for routing
export default {
  listDailyLedgers,
  countDailyLedgers,
  getDailyLedgerByIdHandler,
  getDailyLedgerByDateHandler,
  getTodayLedgerHandler,
  getYesterdayLedgerHandler,
  getRecentLedgersHandler,
  getMonthlyLedgersHandler,
  getDailyLedgerStatisticsHandler,
  createDailyLedgerHandler,
  updateDailyLedgerHandler,
  deleteDailyLedgerHandler,
  getMissingLedgerDatesHandler,
  generateLedgerForDateHandler,
  generateLedgerForDateRangeHandler,
  fillMissingLedgerDatesHandler,
  getLedgerSummaryHandler
};

import * as reportService from '../services/reportService.js';

/**
 * Report Controller
 * Route handlers for report API endpoints
 * 
 * Handles:
 * - HTTP request/response cycle
 * - Request validation
 * - Error handling
 * - Response formatting
 */

/**
 * Get paginated list of reports
 * GET /api/reports
 * 
 * Query Parameters:
 * - reportType: Filter by report type
 * - title: Filter by title
 * - generatedBy: Filter by user ID
 * - startDate: Filter by start date (YYYY-MM-DD)
 * - endDate: Filter by end date (YYYY-MM-DD)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - orderBy: Field to order by (default: created_at)
 * - orderDir: Order direction (ASC/DESC, default: DESC)
 * 
 * Response: 200 OK with paginated reports list
 */
export const getReports = async (req, res, next) => {
  try {
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

    // Validate numeric parameters
    if (generatedBy && isNaN(parseInt(generatedBy, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid generatedBy. Must be a number.'
      });
    }

    const result = await reportService.getPaginatedReports({
      reportType,
      title,
      generatedBy: generatedBy ? parseInt(generatedBy, 10) : undefined,
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
 * Get all reports (no pagination)
 * GET /api/reports/all
 * 
 * Query Parameters:
 * - reportType: Filter by report type
 * - title: Filter by title
 * - generatedBy: Filter by user ID
 * - startDate: Filter by start date
 * - endDate: Filter by end date
 * 
 * Response: 200 OK with all matching reports
 */
export const getAllReports = async (req, res, next) => {
  try {
    const {
      reportType,
      title,
      generatedBy,
      startDate,
      endDate
    } = req.query;

    const result = await reportService.getAllReports({
      reportType,
      title,
      generatedBy: generatedBy ? parseInt(generatedBy, 10) : undefined,
      startDate,
      endDate
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
 * Get a single report by ID
 * GET /api/reports/:id
 * 
 * Response: 200 OK with report or 404 if not found
 */
export const getReportById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report ID. Must be a number.'
      });
    }

    const result = await reportService.getReportById(id);

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
 * Get reports by type
 * GET /api/reports/type/:reportType
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * 
 * Response: 200 OK with paginated reports of the specified type
 */
export const getReportsByType = async (req, res, next) => {
  try {
    const { reportType } = req.params;
    const { page = 1, pageSize = 20 } = req.query;

    if (!reportType) {
      return res.status(400).json({
        success: false,
        error: 'Report type is required.'
      });
    }

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

    const result = await reportService.getReportsByType(reportType, {
      page: pageNum,
      pageSize: pageSizeNum
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
 * Get the latest report of a specific type
 * GET /api/reports/latest/:reportType
 * 
 * Response: 200 OK with latest report or 404 if not found
 */
export const getLatestReportByType = async (req, res, next) => {
  try {
    const { reportType } = req.params;

    if (!reportType) {
      return res.status(400).json({
        success: false,
        error: 'Report type is required.'
      });
    }

    const result = await reportService.getLatestReportByType(reportType);

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
 * Generate a daily summary report
 * POST /api/reports/daily
 * 
 * Request Body:
 * - date: Specific date (YYYY-MM-DD), defaults to today
 * - generatedBy: User ID (required)
 * 
 * Response: 201 Created with generated report
 */
export const generateDailySummaryReport = async (req, res, next) => {
  try {
    const { date, generatedBy } = req.body;

    if (!generatedBy) {
      return res.status(400).json({
        success: false,
        error: 'generatedBy is required.'
      });
    }

    if (generatedBy && isNaN(parseInt(generatedBy, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid generatedBy. Must be a number.'
      });
    }

    const result = await reportService.generateDailySummaryReport({
      date,
      generatedBy: parseInt(generatedBy, 10)
    });

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
 * Generate a date range summary report
 * POST /api/reports/range
 * 
 * Request Body:
 * - startDate: Start date (YYYY-MM-DD, required)
 * - endDate: End date (YYYY-MM-DD, required)
 * - generatedBy: User ID (required)
 * 
 * Response: 201 Created with generated report
 */
export const generateDateRangeReport = async (req, res, next) => {
  try {
    const { startDate, endDate, generatedBy } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required.'
      });
    }

    if (!generatedBy) {
      return res.status(400).json({
        success: false,
        error: 'generatedBy is required.'
      });
    }

    if (generatedBy && isNaN(parseInt(generatedBy, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid generatedBy. Must be a number.'
      });
    }

    const result = await reportService.generateDateRangeReport({
      startDate,
      endDate,
      generatedBy: parseInt(generatedBy, 10)
    });

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
 * Generate an income vs expense comparison report
 * POST /api/reports/income-expense
 * 
 * Request Body:
 * - startDate: Start date (YYYY-MM-DD, optional)
 * - endDate: End date (YYYY-MM-DD, optional)
 * - generatedBy: User ID (required)
 * 
 * Response: 201 Created with generated report
 */
export const generateIncomeVsExpenseReport = async (req, res, next) => {
  try {
    const { startDate, endDate, generatedBy } = req.body;

    if (!generatedBy) {
      return res.status(400).json({
        success: false,
        error: 'generatedBy is required.'
      });
    }

    if (generatedBy && isNaN(parseInt(generatedBy, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid generatedBy. Must be a number.'
      });
    }

    const result = await reportService.generateIncomeVsExpenseReport({
      startDate,
      endDate,
      generatedBy: parseInt(generatedBy, 10)
    });

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
 * Generate a category summary report
 * POST /api/reports/category-summary
 * 
 * Request Body:
 * - generatedBy: User ID (required)
 * 
 * Response: 201 Created with generated report
 */
export const generateCategorySummaryReport = async (req, res, next) => {
  try {
    const { generatedBy } = req.body;

    if (!generatedBy) {
      return res.status(400).json({
        success: false,
        error: 'generatedBy is required.'
      });
    }

    if (generatedBy && isNaN(parseInt(generatedBy, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid generatedBy. Must be a number.'
      });
    }

    const result = await reportService.generateCategorySummaryReport({
      generatedBy: parseInt(generatedBy, 10)
    });

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
 * Create a report record directly
 * POST /api/reports
 * 
 * Request Body:
 * - reportType: Report type (required)
 * - title: Report title (required)
 * - description: Report description
 * - parameters: Report generation parameters (JSON)
 * - reportData: Generated report data (JSON)
 * - filePath: Optional file path for exported reports
 * - generatedBy: User ID (required)
 * 
 * Response: 201 Created with created report
 */
export const createReport = async (req, res, next) => {
  try {
    const {
      reportType,
      title,
      description,
      parameters,
      reportData,
      filePath,
      generatedBy
    } = req.body;

    if (!reportType || !title || !generatedBy) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: reportType, title, generatedBy'
      });
    }

    if (generatedBy && isNaN(parseInt(generatedBy, 10))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid generatedBy. Must be a number.'
      });
    }

    const result = await reportService.createReport({
      reportType,
      title,
      description,
      parameters,
      reportData,
      filePath,
      generatedBy: parseInt(generatedBy, 10)
    });

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
 * Update a report record
 * PUT /api/reports/:id
 * 
 * Request Body:
 * - Any fields to update (reportType, title, description, parameters, reportData, filePath)
 * 
 * Response: 200 OK with updated report or 404 if not found
 */
export const updateReport = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report ID. Must be a number.'
      });
    }

    const result = await reportService.updateReport(id, req.body);

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
 * Delete a report record
 * DELETE /api/reports/:id
 * 
 * Response: 200 OK with success status or 404 if not found
 */
export const deleteReport = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid report ID. Must be a number.'
      });
    }

    const result = await reportService.deleteReport(id);

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
 * Get report statistics
 * GET /api/reports/statistics
 * 
 * Response: 200 OK with report statistics
 */
export const getReportStatistics = async (req, res, next) => {
  try {
    const result = await reportService.getReportStatistics();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Search reports
 * GET /api/reports/search
 * 
 * Query Parameters:
 * - q: Search query (required)
 * - limit: Limit results (default: 50)
 * 
 * Response: 200 OK with search results
 */
export const searchReports = async (req, res, next) => {
  try {
    const { q, limit = 50 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required.'
      });
    }

    const limitNum = parseInt(limit, 10) || 50;

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit. Must be between 1 and 100.'
      });
    }

    const result = await reportService.searchReports(q, limitNum);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export all controller functions
const reportController = {
  getReports,
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

export default reportController;

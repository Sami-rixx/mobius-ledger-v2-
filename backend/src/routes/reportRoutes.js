import { Router } from 'express';
import * as ReportController from '../controllers/reportController.js';

/**
 * Report Routes
 * API endpoints for report management and generation
 * 
 * Base Path: /api/reports
 */

const router = Router();

// GET /api/reports - Get paginated list of reports
router.get('/', ReportController.getReports);

// GET /api/reports/all - Get all reports without pagination
router.get('/all', ReportController.getAllReports);

// GET /api/reports/:id - Get a single report by ID
router.get('/:id', ReportController.getReportById);

// GET /api/reports/type/:reportType - Get reports by type (paginated)
router.get('/type/:reportType', ReportController.getReportsByType);

// GET /api/reports/latest/:reportType - Get the latest report of a specific type
router.get('/latest/:reportType', ReportController.getLatestReportByType);

// GET /api/reports/statistics - Get report statistics
router.get('/statistics', ReportController.getReportStatistics);

// GET /api/reports/search - Search reports
router.get('/search', ReportController.searchReports);

// POST /api/reports/daily - Generate a daily summary report
router.post('/daily', ReportController.generateDailySummaryReport);

// POST /api/reports/range - Generate a date range summary report
router.post('/range', ReportController.generateDateRangeReport);

// POST /api/reports/income-expense - Generate an income vs expense comparison report
router.post('/income-expense', ReportController.generateIncomeVsExpenseReport);

// POST /api/reports/category-summary - Generate a category summary report
router.post('/category-summary', ReportController.generateCategorySummaryReport);

// POST /api/reports - Create a report record directly
router.post('/', ReportController.createReport);

// PUT /api/reports/:id - Update a report record
router.put('/:id', ReportController.updateReport);

// DELETE /api/reports/:id - Delete a report record
router.delete('/:id', ReportController.deleteReport);

/**
 * Report Routes Summary:
 *
 * GET    /api/reports                    - List reports (paginated)
 * GET    /api/reports/all                - List all reports
 * GET    /api/reports/:id                - Get report by ID
 * GET    /api/reports/type/:reportType   - Get reports by type
 * GET    /api/reports/latest/:reportType - Get latest report by type
 * GET    /api/reports/statistics          - Get report statistics
 * GET    /api/reports/search             - Search reports
 * POST   /api/reports/daily              - Generate daily summary report
 * POST   /api/reports/range              - Generate date range report
 * POST   /api/reports/income-expense     - Generate income vs expense report
 * POST   /api/reports/category-summary   - Generate category summary report
 * POST   /api/reports                    - Create report directly
 * PUT    /api/reports/:id                - Update report
 * DELETE /api/reports/:id                - Delete report
 */

export default router;

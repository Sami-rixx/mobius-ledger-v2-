import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import * as ReportController from '../controllers/reportController.js';

/**
 * Report Routes
 * API endpoints for report management and generation
 * 
 * Base Path: /api/reports
 */

const router = Router();

// GET /api/reports - Get paginated list of reports
router.get('/', requirePermission('reports.read'), ReportController.getReports);

// GET /api/reports/all - Get all reports without pagination
router.get('/all', requirePermission('reports.read'), ReportController.getAllReports);

// GET /api/reports/:id - Get a single report by ID
router.get('/:id', requirePermission('reports.read'), ReportController.getReportById);

// GET /api/reports/type/:reportType - Get reports by type (paginated)
router.get('/type/:reportType', requirePermission('reports.read'), ReportController.getReportsByType);

// GET /api/reports/latest/:reportType - Get the latest report of a specific type
router.get('/latest/:reportType', requirePermission('reports.read'), ReportController.getLatestReportByType);

// GET /api/reports/statistics - Get report statistics
router.get('/statistics', requirePermission('reports.read'), ReportController.getReportStatistics);

// GET /api/reports/search - Search reports
router.get('/search', requirePermission('reports.read'), ReportController.searchReports);

// POST /api/reports/daily - Generate a daily summary report
router.post('/daily', requirePermission('reports.read'), ReportController.generateDailySummaryReport);

// POST /api/reports/range - Generate a date range summary report
router.post('/range', requirePermission('reports.read'), ReportController.generateDateRangeReport);

// POST /api/reports/income-expense - Generate an income vs expense comparison report
router.post('/income-expense', requirePermission('reports.read'), ReportController.generateIncomeVsExpenseReport);

// POST /api/reports/category-summary - Generate a category summary report
router.post('/category-summary', requirePermission('reports.read'), ReportController.generateCategorySummaryReport);

// POST /api/reports - Create a report record directly
router.post('/', requirePermission('reports.export'), ReportController.createReport);

// PUT /api/reports/:id - Update a report record
router.put('/:id', requirePermission('reports.export'), ReportController.updateReport);

// DELETE /api/reports/:id - Delete a report record
router.delete('/:id', requirePermission('reports.export'), ReportController.deleteReport);

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

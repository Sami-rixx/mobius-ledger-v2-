import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import * as DailySummaryController from '../controllers/dailySummaryController.js';

/**
 * Daily Summary Routes
 * API endpoints for daily financial summary management
 * 
 * Base Path: /api/daily-summaries
 */

const router = Router();

// GET /api/daily-summaries - Get paginated list of daily summaries
router.get('/', requirePermission('reports.read'), DailySummaryController.getDailySummaries);

// GET /api/daily-summaries/all - Get all daily summaries without pagination
router.get('/all', requirePermission('reports.read'), DailySummaryController.getAllDailySummaries);

// GET /api/daily-summaries/date/:date - Get a daily summary by date
router.get('/date/:date', requirePermission('reports.read'), DailySummaryController.getDailySummaryByDate);

// GET /api/daily-summaries/:id - Get a daily summary by ID
router.get('/:id', requirePermission('reports.read'), DailySummaryController.getDailySummaryById);

// GET /api/daily-summaries/latest - Get the most recent daily summary
router.get('/latest', requirePermission('reports.read'), DailySummaryController.getLatestDailySummary);

// GET /api/daily-summaries/range - Get daily summaries by date range
router.get('/range', requirePermission('reports.read'), DailySummaryController.getDailySummariesByDateRange);

// GET /api/daily-summaries/month/:year/:month - Get daily summaries by month
router.get('/month/:year/:month', requirePermission('reports.read'), DailySummaryController.getDailySummariesByMonth);

// GET /api/daily-summaries/week/:startDate - Get daily summaries by week
router.get('/week/:startDate', requirePermission('reports.read'), DailySummaryController.getDailySummariesByWeek);

// GET /api/daily-summaries/generate/:date - Generate daily summary for a date (GET)
router.get('/generate/:date', requirePermission('reports.read'), DailySummaryController.generateDailySummary);

// GET /api/daily-summaries/statistics - Get daily summary statistics
router.get('/statistics', requirePermission('reports.read'), DailySummaryController.getDailySummaryStatistics);

// GET /api/daily-summaries/weekly/:startDate - Get weekly summary
router.get('/weekly/:startDate', requirePermission('reports.read'), DailySummaryController.getWeeklySummary);

// GET /api/daily-summaries/monthly/:year/:month - Get monthly summary
router.get('/monthly/:year/:month', requirePermission('reports.read'), DailySummaryController.getMonthlySummary);

// POST /api/daily-summaries/generate/:date - Generate and save daily summary for a date
router.post('/generate/:date', requirePermission('transactions.update'), DailySummaryController.generateAndSaveDailySummary);

// POST /api/daily-summaries/generate-range - Generate daily summaries for a date range
router.post('/generate-range', requirePermission('transactions.update'), DailySummaryController.generateDailySummariesForRange);

// POST /api/daily-summaries - Create a daily summary record directly
router.post('/', requirePermission('transactions.update'), DailySummaryController.createDailySummary);

// PUT /api/daily-summaries/:id - Update a daily summary record
router.put('/:id', requirePermission('transactions.update'), DailySummaryController.updateDailySummary);

// DELETE /api/daily-summaries/:id - Delete a daily summary record
router.delete('/:id', requirePermission('transactions.update'), DailySummaryController.deleteDailySummary);

/**
 * Daily Summary Routes Summary:
 *
 * GET    /api/daily-summaries                   - List daily summaries (paginated)
 * GET    /api/daily-summaries/all               - List all daily summaries
 * GET    /api/daily-summaries/date/:date        - Get by date
 * GET    /api/daily-summaries/:id               - Get by ID
 * GET    /api/daily-summaries/latest            - Get latest summary
 * GET    /api/daily-summaries/range             - Get by date range
 * GET    /api/daily-summaries/month/:year/:month - Get by month
 * GET    /api/daily-summaries/week/:startDate    - Get by week
 * GET    /api/daily-summaries/generate/:date     - Generate summary for date
 * GET    /api/daily-summaries/statistics         - Get statistics
 * GET    /api/daily-summaries/weekly/:startDate - Get weekly summary
 * GET    /api/daily-summaries/monthly/:year/:month - Get monthly summary
 * POST   /api/daily-summaries/generate/:date     - Generate and save summary
 * POST   /api/daily-summaries/generate-range     - Generate summaries for range
 * POST   /api/daily-summaries                   - Create daily summary
 * PUT    /api/daily-summaries/:id               - Update daily summary
 * DELETE /api/daily-summaries/:id               - Delete daily summary
 */

export default router;

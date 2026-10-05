import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import * as DailyLedgerController from '../controllers/dailyLedgerController.js';

/**
 * Daily Ledger Routes
 * API endpoints for daily ledger operations
 *
 * Base Path: /api/daily-ledger
 */

const router = Router();

// GET /api/daily-ledger - List daily ledger records with pagination
router.get('/', requirePermission('ledger.read'), DailyLedgerController.listDailyLedgers);

// GET /api/daily-ledger/count - Count total daily ledger records
router.get('/count', requirePermission('ledger.read'), DailyLedgerController.countDailyLedgers);

// GET /api/daily-ledger/:id - Get daily ledger by ID
router.get('/:id', requirePermission('ledger.read'), DailyLedgerController.getDailyLedgerByIdHandler);

// GET /api/daily-ledger/date/:date - Get daily ledger by date
router.get('/date/:date', requirePermission('ledger.read'), DailyLedgerController.getDailyLedgerByDateHandler);

// GET /api/daily-ledger/today - Get today's daily ledger
router.get('/today', requirePermission('ledger.read'), DailyLedgerController.getTodayLedgerHandler);

// GET /api/daily-ledger/yesterday - Get yesterday's daily ledger
router.get('/yesterday', requirePermission('ledger.read'), DailyLedgerController.getYesterdayLedgerHandler);

// GET /api/daily-ledger/recent - Get recent daily ledger records
router.get('/recent', requirePermission('ledger.read'), DailyLedgerController.getRecentLedgersHandler);

// GET /api/daily-ledger/month/:year/:month - Get daily ledgers for a specific month
router.get('/month/:year/:month', requirePermission('ledger.read'), DailyLedgerController.getMonthlyLedgersHandler);

// GET /api/daily-ledger/statistics - Get daily ledger statistics
router.get('/statistics', requirePermission('ledger.read'), DailyLedgerController.getDailyLedgerStatisticsHandler);

// POST /api/daily-ledger - Create a new daily ledger record
router.post('/', requirePermission('ledger.manage'), DailyLedgerController.createDailyLedgerHandler);

// PUT /api/daily-ledger/:id - Update an existing daily ledger record
router.put('/:id', requirePermission('ledger.manage'), DailyLedgerController.updateDailyLedgerHandler);

// DELETE /api/daily-ledger/:id - Delete a daily ledger record
router.delete('/:id', requirePermission('ledger.manage'), DailyLedgerController.deleteDailyLedgerHandler);

// GET /api/daily-ledger/missing-dates - Get missing dates in the ledger sequence
router.get('/missing-dates', requirePermission('ledger.read'), DailyLedgerController.getMissingLedgerDatesHandler);

// POST /api/daily-ledger/generate/:date - Generate ledger for a specific date
router.post('/generate/:date', requirePermission('ledger.manage'), DailyLedgerController.generateLedgerForDateHandler);

// POST /api/daily-ledger/generate - Generate ledger for a date range
router.post('/generate', requirePermission('ledger.manage'), DailyLedgerController.generateLedgerForDateRangeHandler);

// POST /api/daily-ledger/fill-missing - Fill missing ledger dates
router.post('/fill-missing', requirePermission('ledger.manage'), DailyLedgerController.fillMissingLedgerDatesHandler);

// GET /api/daily-ledger/summary - Get ledger summary
router.get('/summary', requirePermission('ledger.read'), DailyLedgerController.getLedgerSummaryHandler);

/**
 * Daily Ledger Routes Summary:
 * 
 * GET / - List daily ledger records with pagination (supports startDate, endDate, page, pageSize, orderBy, orderDirection)
 * GET /count - Count total daily ledger records (supports startDate, endDate)
 * GET /:id - Get daily ledger by ID
 * GET /date/:date - Get daily ledger by date
 * GET /today - Get today's daily ledger
 * GET /yesterday - Get yesterday's daily ledger
 * GET /recent - Get recent daily ledger records (supports limit)
 * GET /month/:year/:month - Get daily ledgers for a specific month
 * GET /statistics - Get daily ledger statistics (supports startDate, endDate)
 * POST / - Create a new daily ledger record
 * PUT /:id - Update an existing daily ledger record
 * DELETE /:id - Delete a daily ledger record
 * GET /missing-dates - Get missing dates in the ledger sequence (supports startDate, endDate)
 * POST /generate/:date - Generate ledger for a specific date
 * POST /generate - Generate ledger for a date range (supports startDate, endDate, force)
 * POST /fill-missing - Fill missing ledger dates (supports startDate, endDate)
 * GET /summary - Get ledger summary (supports days)
 */

export default router;

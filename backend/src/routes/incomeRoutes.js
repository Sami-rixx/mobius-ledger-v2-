import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import { requireIdempotencyKey } from '../middleware/idempotency.js';
import * as IncomeController from '../controllers/incomeController.js';

/**
 * Income Routes
 * API endpoints for income management
 * 
 * Base Path: /api/income
 */

const router = Router();

// GET /api/income - Get paginated list of income records
router.get('/', requirePermission('income.read'), IncomeController.getIncome);

// GET /api/income/all - Get all income records without pagination
router.get('/all', requirePermission('income.read'), IncomeController.getAllIncome);

// GET /api/income/:id - Get a single income record by ID
router.get('/:id', requirePermission('income.read'), IncomeController.getIncomeById);

// GET /api/income/receipt/:receiptNumber - Get income by receipt number
router.get('/receipt/:receiptNumber', requirePermission('income.read'), IncomeController.getIncomeByReceiptNumber);

// GET /api/income/category/:categoryId - Get income by category
router.get('/category/:categoryId', requirePermission('income.read'), IncomeController.getIncomeByCategory);

// GET /api/income/date-range - Get income by date range
router.get('/date-range', requirePermission('income.read'), IncomeController.getIncomeByDateRange);

// GET /api/income/statistics - Get income statistics
router.get('/statistics', requirePermission('income.read'), IncomeController.getIncomeStatistics);

// POST /api/income - Create a new income record
// Idempotency-Key required (owner decision 8, P0): this is a money-moving
// POST, so a safe retry must never create a duplicate income record.
router.post('/', requirePermission('income.create'), requireIdempotencyKey, IncomeController.createIncome);

// PUT /api/income/:id - Update an income record
router.put('/:id', requirePermission('income.update'), IncomeController.updateIncome);

// DELETE /api/income/:id - Delete an income record
router.delete('/:id', requirePermission('income.delete'), IncomeController.deleteIncome);

// POST /api/income/:id/verify - Mark income as verified
router.post('/:id/verify', requirePermission('income.update'), IncomeController.verifyIncome);

/**
 * Income Routes Summary:
 * 
 * GET    /api/income                    - List income (paginated)
 * GET    /api/income/all                - List all income
 * GET    /api/income/:id                - Get income by ID
 * GET    /api/income/receipt/:receiptNumber - Get by receipt number
 * GET    /api/income/category/:categoryId - Get by category
 * GET    /api/income/date-range          - Get by date range
 * GET    /api/income/statistics          - Get statistics
 * POST   /api/income                    - Create income
 * PUT    /api/income/:id                - Update income
 * DELETE /api/income/:id                - Delete income
 * POST   /api/income/:id/verify         - Verify income
 */

export default router;

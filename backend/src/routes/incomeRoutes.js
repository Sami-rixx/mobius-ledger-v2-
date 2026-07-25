import { Router } from 'express';
import * as IncomeController from '../controllers/incomeController.js';

/**
 * Income Routes
 * API endpoints for income management
 * 
 * Base Path: /api/income
 */

const router = Router();

// GET /api/income - Get paginated list of income records
router.get('/', IncomeController.getIncome);

// GET /api/income/all - Get all income records without pagination
router.get('/all', IncomeController.getAllIncome);

// GET /api/income/:id - Get a single income record by ID
router.get('/:id', IncomeController.getIncomeById);

// GET /api/income/receipt/:receiptNumber - Get income by receipt number
router.get('/receipt/:receiptNumber', IncomeController.getIncomeByReceiptNumber);

// GET /api/income/category/:categoryId - Get income by category
router.get('/category/:categoryId', IncomeController.getIncomeByCategory);

// GET /api/income/date-range - Get income by date range
router.get('/date-range', IncomeController.getIncomeByDateRange);

// GET /api/income/statistics - Get income statistics
router.get('/statistics', IncomeController.getIncomeStatistics);

// POST /api/income - Create a new income record
router.post('/', IncomeController.createIncome);

// PUT /api/income/:id - Update an income record
router.put('/:id', IncomeController.updateIncome);

// DELETE /api/income/:id - Delete an income record
router.delete('/:id', IncomeController.deleteIncome);

// POST /api/income/:id/verify - Mark income as verified
router.post('/:id/verify', IncomeController.verifyIncome);

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

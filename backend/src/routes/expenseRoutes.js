import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import { requireIdempotencyKey } from '../middleware/idempotency.js';
import * as ExpenseController from '../controllers/expenseController.js';

/**
 * Expense Routes
 * API endpoints for expense management
 * 
 * Base Path: /api/expenses
 */

const router = Router();

// GET /api/expenses - Get paginated list of expense records
router.get('/', requirePermission('expenses.read'), ExpenseController.getExpenses);

// GET /api/expenses/all - Get all expense records without pagination
router.get('/all', requirePermission('expenses.read'), ExpenseController.getAllExpenses);

// GET /api/expenses/:id - Get a single expense record by ID
router.get('/:id', requirePermission('expenses.read'), ExpenseController.getExpenseById);

// GET /api/expenses/receipt/:receiptNumber - Get expense by receipt number
router.get('/receipt/:receiptNumber', requirePermission('expenses.read'), ExpenseController.getExpenseByReceiptNumber);

// GET /api/expenses/category/:categoryId - Get expenses by category
router.get('/category/:categoryId', requirePermission('expenses.read'), ExpenseController.getExpensesByCategory);

// GET /api/expenses/date-range - Get expenses by date range
router.get('/date-range', requirePermission('expenses.read'), ExpenseController.getExpensesByDateRange);

// GET /api/expenses/statistics - Get expense statistics
router.get('/statistics', requirePermission('expenses.read'), ExpenseController.getExpenseStatistics);

// GET /api/expenses/search - Search expenses
router.get('/search', requirePermission('expenses.read'), ExpenseController.searchExpenses);

// POST /api/expenses - Create a new expense record
// Idempotency-Key required (owner decision 8, P0): this is a money-moving
// POST, so a safe retry must never create a duplicate expense record.
router.post('/', requirePermission('expenses.create'), requireIdempotencyKey, ExpenseController.createExpense);

// PUT /api/expenses/:id - Update an expense record
router.put('/:id', requirePermission('expenses.update'), ExpenseController.updateExpense);

// DELETE /api/expenses/:id - Delete an expense record
router.delete('/:id', requirePermission('expenses.delete'), ExpenseController.deleteExpense);

// POST /api/expenses/:id/verify - Mark expense as verified
router.post('/:id/verify', requirePermission('expenses.update'), ExpenseController.verifyExpense);

/**
 * Expense Routes Summary:
 * 
 * GET    /api/expenses                    - List expenses (paginated)
 * GET    /api/expenses/all                - List all expenses
 * GET    /api/expenses/:id                - Get expense by ID
 * GET    /api/expenses/receipt/:receiptNumber - Get by receipt number
 * GET    /api/expenses/category/:categoryId - Get by category
 * GET    /api/expenses/date-range          - Get by date range
 * GET    /api/expenses/statistics          - Get statistics
 * GET    /api/expenses/search              - Search expenses
 * POST   /api/expenses                    - Create expense
 * PUT    /api/expenses/:id                - Update expense
 * DELETE /api/expenses/:id                - Delete expense
 * POST   /api/expenses/:id/verify         - Verify expense
 */

export default router;

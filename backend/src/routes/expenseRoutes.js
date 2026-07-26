import { Router } from 'express';
import * as ExpenseController from '../controllers/expenseController.js';

/**
 * Expense Routes
 * API endpoints for expense management
 * 
 * Base Path: /api/expenses
 */

const router = Router();

// GET /api/expenses - Get paginated list of expense records
router.get('/', ExpenseController.getExpenses);

// GET /api/expenses/all - Get all expense records without pagination
router.get('/all', ExpenseController.getAllExpenses);

// GET /api/expenses/:id - Get a single expense record by ID
router.get('/:id', ExpenseController.getExpenseById);

// GET /api/expenses/receipt/:receiptNumber - Get expense by receipt number
router.get('/receipt/:receiptNumber', ExpenseController.getExpenseByReceiptNumber);

// GET /api/expenses/category/:categoryId - Get expenses by category
router.get('/category/:categoryId', ExpenseController.getExpensesByCategory);

// GET /api/expenses/date-range - Get expenses by date range
router.get('/date-range', ExpenseController.getExpensesByDateRange);

// GET /api/expenses/statistics - Get expense statistics
router.get('/statistics', ExpenseController.getExpenseStatistics);

// GET /api/expenses/search - Search expenses
router.get('/search', ExpenseController.searchExpenses);

// POST /api/expenses - Create a new expense record
router.post('/', ExpenseController.createExpense);

// PUT /api/expenses/:id - Update an expense record
router.put('/:id', ExpenseController.updateExpense);

// DELETE /api/expenses/:id - Delete an expense record
router.delete('/:id', ExpenseController.deleteExpense);

// POST /api/expenses/:id/verify - Mark expense as verified
router.post('/:id/verify', ExpenseController.verifyExpense);

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

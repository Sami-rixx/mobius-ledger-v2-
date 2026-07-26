import { Router } from 'express';
import * as ExpenseCategoryController from '../controllers/expenseCategoryController.js';

/**
 * Expense Category Routes
 * API endpoints for expense category management
 * 
 * Base Path: /api/expense-categories
 */

const router = Router();

// GET /api/expense-categories - Get paginated list of expense categories
router.get('/', ExpenseCategoryController.getExpenseCategories);

// GET /api/expense-categories/all - Get all expense categories without pagination
router.get('/all', ExpenseCategoryController.getAllExpenseCategories);

// GET /api/expense-categories/active - Get all active expense categories
router.get('/active', ExpenseCategoryController.getActiveExpenseCategories);

// GET /api/expense-categories/kitchen - Get all kitchen expense categories
router.get('/kitchen', ExpenseCategoryController.getKitchenExpenseCategories);

// GET /api/expense-categories/root - Get root expense categories (no parent)
router.get('/root', ExpenseCategoryController.getRootExpenseCategories);

// GET /api/expense-categories/parent/:parentId - Get child categories for a parent
router.get('/parent/:parentId', ExpenseCategoryController.getChildExpenseCategories);

// GET /api/expense-categories/tree - Get hierarchical category tree
router.get('/tree', ExpenseCategoryController.getExpenseCategoryTree);

// GET /api/expense-categories/:id - Get a single expense category by ID
router.get('/:id', ExpenseCategoryController.getExpenseCategoryById);

// GET /api/expense-categories/name/:name - Get expense category by name
router.get('/name/:name', ExpenseCategoryController.getExpenseCategoryByName);

// GET /api/expense-categories/usage - Get categories with usage count
router.get('/usage', ExpenseCategoryController.getExpenseCategoriesWithUsage);

// GET /api/expense-categories/count - Get count of expense categories
router.get('/count', ExpenseCategoryController.getExpenseCategoryCount);

// GET /api/expense-categories/check-name/:name - Check if category name exists
router.get('/check-name/:name', ExpenseCategoryController.checkExpenseCategoryNameExists);

// POST /api/expense-categories - Create a new expense category
router.post('/', ExpenseCategoryController.createExpenseCategory);

// PUT /api/expense-categories/:id - Update an expense category
router.put('/:id', ExpenseCategoryController.updateExpenseCategory);

// DELETE /api/expense-categories/:id - Delete an expense category
router.delete('/:id', ExpenseCategoryController.deleteExpenseCategory);

/**
 * Expense Category Routes Summary:
 * 
 * GET    /api/expense-categories                    - List categories (paginated)
 * GET    /api/expense-categories/all                - List all categories
 * GET    /api/expense-categories/active             - List active categories
 * GET    /api/expense-categories/kitchen            - List kitchen categories
 * GET    /api/expense-categories/root                - List root categories
 * GET    /api/expense-categories/parent/:parentId    - Get child categories
 * GET    /api/expense-categories/tree                - Get category tree
 * GET    /api/expense-categories/:id                - Get category by ID
 * GET    /api/expense-categories/name/:name          - Get by name
 * GET    /api/expense-categories/usage               - Get with usage count
 * GET    /api/expense-categories/count               - Get count
 * GET    /api/expense-categories/check-name/:name   - Check name exists
 * POST   /api/expense-categories                    - Create category
 * PUT    /api/expense-categories/:id                - Update category
 * DELETE /api/expense-categories/:id                - Delete category
 */

export default router;

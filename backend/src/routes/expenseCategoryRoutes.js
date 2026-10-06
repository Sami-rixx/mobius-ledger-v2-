import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import * as ExpenseCategoryController from '../controllers/expenseCategoryController.js';

/**
 * Expense Category Routes
 * API endpoints for expense category management
 * 
 * Base Path: /api/expense-categories
 */

const router = Router();

// GET /api/expense-categories - Get paginated list of expense categories
router.get('/', requirePermission('expenses.read'), ExpenseCategoryController.getExpenseCategories);

// GET /api/expense-categories/all - Get all expense categories without pagination
router.get('/all', requirePermission('expenses.read'), ExpenseCategoryController.getAllExpenseCategories);

// GET /api/expense-categories/active - Get all active expense categories
router.get('/active', requirePermission('expenses.read'), ExpenseCategoryController.getActiveExpenseCategories);

// GET /api/expense-categories/kitchen - Get all kitchen expense categories
router.get('/kitchen', requirePermission('expenses.read'), ExpenseCategoryController.getKitchenExpenseCategories);

// GET /api/expense-categories/root - Get root expense categories (no parent)
router.get('/root', requirePermission('expenses.read'), ExpenseCategoryController.getRootExpenseCategories);

// GET /api/expense-categories/parent/:parentId - Get child categories for a parent
router.get('/parent/:parentId', requirePermission('expenses.read'), ExpenseCategoryController.getChildExpenseCategories);

// GET /api/expense-categories/tree - Get hierarchical category tree
router.get('/tree', requirePermission('expenses.read'), ExpenseCategoryController.getExpenseCategoryTree);

// GET /api/expense-categories/:id - Get a single expense category by ID
router.get('/:id', requirePermission('expenses.read'), ExpenseCategoryController.getExpenseCategoryById);

// GET /api/expense-categories/name/:name - Get expense category by name
router.get('/name/:name', requirePermission('expenses.read'), ExpenseCategoryController.getExpenseCategoryByName);

// GET /api/expense-categories/usage - Get categories with usage count
router.get('/usage', requirePermission('expenses.read'), ExpenseCategoryController.getExpenseCategoriesWithUsage);

// GET /api/expense-categories/count - Get count of expense categories
router.get('/count', requirePermission('expenses.read'), ExpenseCategoryController.getExpenseCategoryCount);

// GET /api/expense-categories/check-name/:name - Check if category name exists
router.get('/check-name/:name', requirePermission('expenses.read'), ExpenseCategoryController.checkExpenseCategoryNameExists);

// POST /api/expense-categories - Create a new expense category
router.post('/', requirePermission('expenses.update'), ExpenseCategoryController.createExpenseCategory);

// PUT /api/expense-categories/:id - Update an expense category
router.put('/:id', requirePermission('expenses.update'), ExpenseCategoryController.updateExpenseCategory);

// DELETE /api/expense-categories/:id - Delete an expense category
router.delete('/:id', requirePermission('expenses.update'), ExpenseCategoryController.deleteExpenseCategory);

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

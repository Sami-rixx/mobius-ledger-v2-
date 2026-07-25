import { Router } from 'express';
import * as IncomeCategoryController from '../controllers/incomeCategoryController.js';

/**
 * Income Category Routes
 * API endpoints for income category management
 * 
 * Base Path: /api/income-categories
 */

const router = Router();

// GET /api/income-categories - Get paginated list of income categories
router.get('/', IncomeCategoryController.getIncomeCategories);

// GET /api/income-categories/all - Get all income categories without pagination
router.get('/all', IncomeCategoryController.getAllIncomeCategories);

// GET /api/income-categories/active - Get all active income categories
router.get('/active', IncomeCategoryController.getActiveIncomeCategories);

// GET /api/income-categories/:id - Get a single income category by ID
router.get('/:id', IncomeCategoryController.getIncomeCategoryById);

// GET /api/income-categories/name/:name - Get income category by name
router.get('/name/:name', IncomeCategoryController.getIncomeCategoryByName);

// GET /api/income-categories/usage - Get categories with usage count
router.get('/usage', IncomeCategoryController.getIncomeCategoriesWithUsage);

// GET /api/income-categories/count - Get count of income categories
router.get('/count', IncomeCategoryController.getIncomeCategoryCount);

// POST /api/income-categories - Create a new income category
router.post('/', IncomeCategoryController.createIncomeCategory);

// PUT /api/income-categories/:id - Update an income category
router.put('/:id', IncomeCategoryController.updateIncomeCategory);

// DELETE /api/income-categories/:id - Delete an income category
router.delete('/:id', IncomeCategoryController.deleteIncomeCategory);

/**
 * Income Category Routes Summary:
 * 
 * GET    /api/income-categories                    - List categories (paginated)
 * GET    /api/income-categories/all                - List all categories
 * GET    /api/income-categories/active             - List active categories
 * GET    /api/income-categories/:id                - Get category by ID
 * GET    /api/income-categories/name/:name        - Get by name
 * GET    /api/income-categories/usage              - Get with usage count
 * GET    /api/income-categories/count              - Get count
 * POST   /api/income-categories                    - Create category
 * PUT    /api/income-categories/:id                - Update category
 * DELETE /api/income-categories/:id                - Delete category
 */

export default router;

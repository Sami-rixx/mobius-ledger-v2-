import { Router } from 'express';
import * as DashboardController from '../controllers/dashboardController.js';

/**
 * Dashboard Routes
 * API endpoints for dashboard data and visualizations
 *
 * Base Path: /api/dashboard
 */

const router = Router();

// GET /api/dashboard - Get comprehensive dashboard summary
router.get('/', DashboardController.getDashboardSummary);

// GET /api/dashboard/summary - Get quick statistics for dashboard cards
router.get('/summary', DashboardController.getQuickStats);

// GET /api/dashboard/charts/income-expense - Get income vs expense chart data
router.get('/charts/income-expense', DashboardController.getIncomeVsExpenseChart);

// GET /api/dashboard/charts/income-by-category - Get income by category for pie chart
router.get('/charts/income-by-category', DashboardController.getIncomeByCategory);

// GET /api/dashboard/charts/expenses-by-category - Get expenses by category for pie chart
router.get('/charts/expenses-by-category', DashboardController.getExpensesByCategory);

// GET /api/dashboard/recent-activity - Get recent activity feed
router.get('/recent-activity', DashboardController.getRecentActivity);

// GET /api/dashboard/students/distribution - Get student distribution by class
router.get('/students/distribution', DashboardController.getStudentDistribution);

// GET /api/dashboard/filtered - Get filtered summary with date range
router.get('/filtered', DashboardController.getFilteredSummary);

/**
 * Dashboard Routes Summary:
 * 
 * GET /					- Get comprehensive dashboard summary
 * GET /summary				- Get quick statistics for dashboard cards
 * GET /charts/income-expense	- Get income vs expense chart data (supports period, limit)
 * GET /charts/income-by-category	- Get income by category for pie chart (supports limit)
 * GET /charts/expenses-by-category - Get expenses by category for pie chart (supports limit)
 * GET /recent-activity		- Get recent activity feed (supports limit)
 * GET /students/distribution	- Get student distribution by class
 * GET /filtered				- Get filtered summary with date range (supports startDate, endDate)
 */

export default router;

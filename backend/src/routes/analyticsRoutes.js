import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import * as AnalyticsController from '../controllers/analyticsController.js';

/**
 * Analytics Routes
 * API endpoints for financial analytics and insights
 * 
 * Base Path: /api/analytics
 */

const router = Router();

// GET /api/analytics/dashboard - Get comprehensive dashboard analytics data
router.get('/dashboard', requirePermission('analytics.read'), AnalyticsController.getDashboardData);

// GET /api/analytics/income-vs-expense - Get income vs expense comparison
router.get('/income-vs-expense', requirePermission('analytics.read'), AnalyticsController.getIncomeVsExpense);

// GET /api/analytics/income-by-category - Get income by category with percentages
router.get('/income-by-category', requirePermission('analytics.read'), AnalyticsController.getIncomeByCategory);

// GET /api/analytics/expenses-by-category - Get expenses by category with percentages
router.get('/expenses-by-category', requirePermission('analytics.read'), AnalyticsController.getExpensesByCategory);

// GET /api/analytics/top-income-sources - Get top income sources
router.get('/top-income-sources', requirePermission('analytics.read'), AnalyticsController.getTopIncomeSources);

// GET /api/analytics/top-expenses - Get top expenses
router.get('/top-expenses', requirePermission('analytics.read'), AnalyticsController.getTopExpenses);

// GET /api/analytics/statistics - Get overall statistics
router.get('/statistics', requirePermission('analytics.read'), AnalyticsController.getOverallStatistics);

// GET /api/analytics/income-trends - Get income trends over time
router.get('/income-trends', requirePermission('analytics.read'), AnalyticsController.getIncomeTrends);

// GET /api/analytics/expense-trends - Get expense trends over time
router.get('/expense-trends', requirePermission('analytics.read'), AnalyticsController.getExpenseTrends);

// GET /api/analytics/net-flow - Get net flow trends over time
router.get('/net-flow', requirePermission('analytics.read'), AnalyticsController.getNetFlowTrends);

// GET /api/analytics/daily-summaries - Get recent daily summaries
router.get('/daily-summaries', requirePermission('analytics.read'), AnalyticsController.getRecentDailySummaries);

// GET /api/analytics/summary-statistics - Get daily summary statistics
router.get('/summary-statistics', requirePermission('analytics.read'), AnalyticsController.getDailySummaryStatistics);

/**
 * Analytics Routes Summary:
 *
 * GET    /api/analytics/dashboard            - Get dashboard data
 * GET    /api/analytics/income-vs-expense   - Get income vs expense comparison
 * GET    /api/analytics/income-by-category   - Get income by category
 * GET    /api/analytics/expenses-by-category - Get expenses by category
 * GET    /api/analytics/top-income-sources   - Get top income sources
 * GET    /api/analytics/top-expenses          - Get top expenses
 * GET    /api/analytics/statistics           - Get overall statistics
 * GET    /api/analytics/income-trends        - Get income trends
 * GET    /api/analytics/expense-trends       - Get expense trends
 * GET    /api/analytics/net-flow             - Get net flow trends
 * GET    /api/analytics/daily-summaries      - Get recent daily summaries
 * GET    /api/analytics/summary-statistics   - Get daily summary statistics
 */

export default router;

import { Router } from 'express';
import * as AnalyticsController from '../controllers/analyticsController.js';

/**
 * Analytics Routes
 * API endpoints for financial analytics and insights
 * 
 * Base Path: /api/analytics
 */

const router = Router();

// GET /api/analytics/dashboard - Get comprehensive dashboard analytics data
router.get('/dashboard', AnalyticsController.getDashboardData);

// GET /api/analytics/income-vs-expense - Get income vs expense comparison
router.get('/income-vs-expense', AnalyticsController.getIncomeVsExpense);

// GET /api/analytics/income-by-category - Get income by category with percentages
router.get('/income-by-category', AnalyticsController.getIncomeByCategory);

// GET /api/analytics/expenses-by-category - Get expenses by category with percentages
router.get('/expenses-by-category', AnalyticsController.getExpensesByCategory);

// GET /api/analytics/top-income-sources - Get top income sources
router.get('/top-income-sources', AnalyticsController.getTopIncomeSources);

// GET /api/analytics/top-expenses - Get top expenses
router.get('/top-expenses', AnalyticsController.getTopExpenses);

// GET /api/analytics/statistics - Get overall statistics
router.get('/statistics', AnalyticsController.getOverallStatistics);

// GET /api/analytics/income-trends - Get income trends over time
router.get('/income-trends', AnalyticsController.getIncomeTrends);

// GET /api/analytics/expense-trends - Get expense trends over time
router.get('/expense-trends', AnalyticsController.getExpenseTrends);

// GET /api/analytics/net-flow - Get net flow trends over time
router.get('/net-flow', AnalyticsController.getNetFlowTrends);

// GET /api/analytics/daily-summaries - Get recent daily summaries
router.get('/daily-summaries', AnalyticsController.getRecentDailySummaries);

// GET /api/analytics/summary-statistics - Get daily summary statistics
router.get('/summary-statistics', AnalyticsController.getDailySummaryStatistics);

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

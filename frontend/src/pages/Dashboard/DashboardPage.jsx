/**
 * DashboardPage Component
 * Main dashboard page with financial overview, summary statistics, and visualizations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DashboardSummaryCards,
  DashboardChart,
  DashboardQuickActions,
  DashboardRecentActivity,
  Spinner,
  Alert
} from '@/components';
import {
  getDashboardSummary,
  getQuickStats,
  getIncomeVsExpenseChart,
  getIncomeByCategory,
  getExpensesByCategory,
  getRecentActivity
} from '@/services/dashboardService';
import './DashboardPage.scss';

/**
 * DashboardPage Component
 * Main dashboard with comprehensive financial overview
 */
function DashboardPage() {
  const navigate = useNavigate();
  
  // State for dashboard data
  const [summary, setSummary] = useState(null);
  const [quickStats, setQuickStats] = useState(null);
  const [incomeVsExpense, setIncomeVsExpense] = useState(null);
  const [incomeByCategory, setIncomeByCategory] = useState(null);
  const [expensesByCategory, setExpensesByCategory] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  
  // Loading states
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  
  // Error states
  const [error, setError] = useState(null);
  
  // Date range state
  const [dateRange, setDateRange] = useState('month');
  
  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      setLoadingSummary(true);
      setLoadingCharts(true);
      setLoadingActivity(true);
      
      // Fetch all data in parallel
      const [summaryRes, statsRes, incomeExpRes, incomeCatRes, expenseCatRes, activityRes] = await Promise.all([
        getDashboardSummary({ startDate: getStartDate(dateRange) }),
        getQuickStats(),
        getIncomeVsExpenseChart({ period: dateRange, limit: 12 }),
        getIncomeByCategory({ limit: 10 }),
        getExpensesByCategory({ limit: 10 }),
        getRecentActivity({ limit: 10 })
      ]);
      
      setSummary(summaryRes.data || null);
      setQuickStats(statsRes.data || null);
      setIncomeVsExpense(incomeExpRes.data || null);
      setIncomeByCategory(incomeCatRes.data || null);
      setExpensesByCategory(expenseCatRes.data || null);
      setRecentActivity(activityRes.data || []);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoadingSummary(false);
      setLoadingCharts(false);
      setLoadingActivity(false);
    }
  }, [dateRange]);
  
  // Get start date based on date range
  const getStartDate = (range) => {
    const now = new Date();
    switch (range) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
      case 'quarter':
        return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().split('T')[0];
      case 'year':
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
  };
  
  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  // Date range change handler
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };
  
  // View all activity handler
  const handleViewAllActivity = useCallback(() => {
    navigate('/transactions');
  }, [navigate]);
  
  // Prepare chart data
  const prepareIncomeExpenseChart = () => {
    if (!incomeVsExpense) return { data: [], labels: [] };
    
    return {
      data: [incomeVsExpense.incomeData || [], incomeVsExpense.expenseData || []],
      labels: incomeVsExpense.periods || []
    };
  };
  
  const prepareIncomeByCategoryChart = () => {
    if (!incomeByCategory) return { data: [], labels: [] };
    
    return {
      data: incomeByCategory.amounts || [],
      labels: incomeByCategory.categories || [],
      colors: ['#28a745', '#20c997', '#17a2b8', '#0d6efd', '#6610f2', '#fd7e14']
    };
  };
  
  const prepareExpensesByCategoryChart = () => {
    if (!expensesByCategory) return { data: [], labels: [] };
    
    return {
      data: expensesByCategory.amounts || [],
      labels: expensesByCategory.categories || [],
      colors: ['#dc3545', '#fd7e14', '#ffc107', '#6f42c1', '#e83e8c']
    };
  };
  
  // Render loading state
  if (loadingSummary) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-page__header">
          <h1 className="dashboard-page__title">
            <i className="fa fa-tachometer-alt" /> Dashboard
          </h1>
        </div>
        <div className="dashboard-page__content">
          <Spinner />
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-page__header">
          <h1 className="dashboard-page__title">
            <i className="fa fa-tachometer-alt" /> Dashboard
          </h1>
        </div>
        <div className="dashboard-page__content">
          <Alert type="error">
            {error}
            <button className="btn btn-sm btn-outline-light mt-2" onClick={handleRefresh}>
              <i className="fa fa-sync-alt" /> Retry
            </button>
          </Alert>
        </div>
      </div>
    );
  }
  
  // Prepare chart data
  const incomeExpenseChart = prepareIncomeExpenseChart();
  const incomeCategoryChart = prepareIncomeByCategoryChart();
  const expenseCategoryChart = prepareExpensesByCategoryChart();
  
  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <h1 className="dashboard-page__title">
          <i className="fa fa-tachometer-alt" /> Dashboard
        </h1>
        <div className="dashboard-page__header-actions">
          <div className="dashboard-page__date-range">
            <select 
              value={dateRange} 
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="form-select form-select-sm"
              disabled={loadingCharts}
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          <button 
            className="btn btn-sm btn-outline-secondary" 
            onClick={handleRefresh}
            disabled={loadingSummary || loadingCharts || loadingActivity}
          >
            <i className="fa fa-sync-alt" /> Refresh
          </button>
        </div>
      </div>
      
      <div className="dashboard-page__content">
        {/* Error messages for specific sections */}
        {error && (
          <Alert type="warning" className="mb-3">
            {error}
          </Alert>
        )}
        
        {/* Summary Cards Section */}
        <section className="dashboard-page__section mb-4">
          <DashboardSummaryCards 
            stats={quickStats || summary} 
            loading={loadingSummary} 
            onRefresh={handleRefresh}
          />
        </section>
        
        {/* Charts Row */}
        <section className="dashboard-page__charts-row">
          <div className="dashboard-page__chart">
            <DashboardChart
              title="Income vs Expenses"
              type="bar"
              data={incomeExpenseChart.data[0]}
              labels={incomeExpenseChart.labels}
              loading={loadingCharts}
              options={{ color: '#28a745' }}
            />
          </div>
          
          <div className="dashboard-page__chart">
            <DashboardChart
              title="Income by Category"
              type="pie"
              data={incomeCategoryChart.data}
              labels={incomeCategoryChart.labels}
              loading={loadingCharts}
              options={{ colors: incomeCategoryChart.colors }}
            />
          </div>
        </section>
        
        <section className="dashboard-page__charts-row">
          <div className="dashboard-page__chart">
            <DashboardChart
              title="Expenses by Category"
              type="doughnut"
              data={expenseCategoryChart.data}
              labels={expenseCategoryChart.labels}
              loading={loadingCharts}
              options={{ colors: expenseCategoryChart.colors }}
            />
          </div>
        </section>
        
        {/* Quick Actions Section */}
        <section className="dashboard-page__section mb-4">
          <DashboardQuickActions />
        </section>
        
        {/* Recent Activity Section */}
        <section className="dashboard-page__section">
          <DashboardRecentActivity 
            activity={recentActivity || []} 
            loading={loadingActivity}
            onViewAll={handleViewAllActivity}
          />
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;

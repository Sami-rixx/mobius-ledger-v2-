import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  getDashboardData,
  getIncomeVsExpense,
  getIncomeByCategory,
  getExpensesByCategory,
  getTopIncomeSources,
  getTopExpenses,
  getOverallStatistics
} from '../services/analyticsService.js';
import { Button, Card } from './index.js';

/**
 * AnalyticsDashboard Component
 * Displays comprehensive financial analytics dashboard
 * 
 * @param {Object} props - Component props
 * @param {string} props.startDate - Start date for analytics (YYYY-MM-DD)
 * @param {string} props.endDate - End date for analytics (YYYY-MM-DD)
 * @param {boolean} props.autoRefresh - Whether to auto-refresh data
 * @param {number} props.refreshInterval - Auto-refresh interval in seconds
 */
function AnalyticsDashboard({ startDate, endDate, autoRefresh = false, refreshInterval = 300 }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');

  // Calculate date range based on time range
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case 'today':
        start.setDate(start.getDate());
        break;
      default:
        start.setMonth(start.getMonth() - 1);
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dateRange = getDateRange();
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      
      const data = await getDashboardData(params);
      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    fetchDashboardData();
    
    let refreshTimer;
    if (autoRefresh) {
      refreshTimer = setInterval(fetchDashboardData, refreshInterval * 1000);
    }
    
    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, [timeRange, autoRefresh, refreshInterval]);

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'KES 0.00';
    return `KES ${parseFloat(amount).toFixed(2)}`;
  };

  // Format percentage
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return '0%';
    return `${(parseFloat(value) * 100).toFixed(2)}%`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get time range display
  const getTimeRangeDisplay = () => {
    const dateRange = getDateRange();
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    
    if (start.toISOString().split('T')[0] === end.toISOString().split('T')[0]) {
      return formatDate(dateRange.startDate);
    }
    return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
  };

  // Render loading state
  if (loading && !dashboardData) {
    return (
      <div className="analytics-dashboard loading">
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  // Render error state
  if (error && !dashboardData) {
    return (
      <div className="analytics-dashboard error">
        <p>{error}</p>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    );
  }

  // Render dashboard
  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h2>Financial Analytics Dashboard</h2>
        <div className="time-range-selector">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="form-select"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last 12 Months</option>
          </select>
        </div>
        <Button variant="outline" onClick={fetchDashboardData}>
          Refresh
        </Button>
      </div>

      <div className="dashboard-date-range">
        <span className="badge badge-info">{getTimeRangeDisplay()}</span>
      </div>

      {/* Overall Statistics Card */}
      {dashboardData?.overall && (
        <Card title="Overall Statistics" className="dashboard-card">
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">Total Income</div>
              <div className="stat-value income">
                {formatCurrency(dashboardData.overall.income?.total_amount || 0)}
              </div>
              <div className="stat-count">
                {dashboardData.overall.income?.total_records || 0} records
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value expense">
                {formatCurrency(dashboardData.overall.expenses?.total_amount || 0)}
              </div>
              <div className="stat-count">
                {dashboardData.overall.expenses?.total_records || 0} records
              </div>
            </div>

            <div className="stat-box net-flow">
              <div className="stat-label">Net Flow</div>
              <div className={`stat-value ${dashboardData.overall.net_flow >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(dashboardData.overall.net_flow || 0)}
              </div>
              <div className="stat-count">
                {dashboardData.overall.total_records || 0} total records
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-label">Total Amount</div>
              <div className="stat-value">
                {formatCurrency(dashboardData.overall.total_amount || 0)}
              </div>
              <div className="stat-count">Combined</div>
            </div>
          </div>
        </Card>
      )}

      {/* Income vs Expense Comparison */}
      {dashboardData?.incomeByCategory && dashboardData.incomeByCategory.length > 0 && (
        <Card title="Income by Category" className="dashboard-card">
          <div className="category-list">
            {dashboardData.incomeByCategory.slice(0, 5).map((category, index) => (
              <div key={category.category_id || index} className="category-item">
                <div className="category-info">
                  <span className="category-name">{category.category_name}</span>
                  <span className="category-amount">{formatCurrency(category.total_amount || 0)}</span>
                </div>
                <div className="category-bar">
                  <div 
                    className="category-bar-fill" 
                    style={{
                      width: `${Math.min((category.total_amount / (dashboardData.overall.income?.total_amount || 1)) * 100, 100)}%`
                    }}
                  />
                </div>
                <div className="category-details">
                  <span>{category.count || 0} transactions</span>
                  <span>Avg: {formatCurrency(category.avg_amount || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Expenses by Category */}
      {dashboardData?.expensesByCategory && dashboardData.expensesByCategory.length > 0 && (
        <Card title="Expenses by Category" className="dashboard-card">
          <div className="category-list">
            {dashboardData.expensesByCategory.slice(0, 5).map((category, index) => (
              <div key={category.category_id || index} className="category-item">
                <div className="category-info">
                  <span className="category-name">{category.category_name}</span>
                  <span className="category-amount expense">{formatCurrency(category.total_amount || 0)}</span>
                </div>
                <div className="category-bar">
                  <div 
                    className="category-bar-fill expense" 
                    style={{
                      width: `${Math.min((category.total_amount / (dashboardData.overall.expenses?.total_amount || 1)) * 100, 100)}%`
                    }}
                  />
                </div>
                <div className="category-details">
                  <span>{category.count || 0} transactions</span>
                  {category.is_kitchen && <span className="badge badge-warning">Kitchen</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Income Sources */}
      {dashboardData?.topIncomeSources && dashboardData.topIncomeSources.length > 0 && (
        <Card title="Top Income Sources" className="dashboard-card">
          <div className="top-list">
            {dashboardData.topIncomeSources.slice(0, 5).map((source, index) => (
              <div key={source.source || index} className="top-item">
                <span className="rank">#{index + 1}</span>
                <span className="name">{source.source}</span>
                <span className="amount">{formatCurrency(source.total_amount || 0)}</span>
                <span className="count">{source.count || 0} payments</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Expenses */}
      {dashboardData?.topExpenses && dashboardData.topExpenses.length > 0 && (
        <Card title="Top Expenses" className="dashboard-card">
          <div className="top-list">
            {dashboardData.topExpenses.slice(0, 5).map((expense, index) => (
              <div key={expense.vendor || index} className="top-item">
                <span className="rank">#{index + 1}</span>
                <span className="name">{expense.vendor}</span>
                <span className="amount expense">{formatCurrency(expense.total_amount || 0)}</span>
                <span className="count">{expense.count || 0} payments</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Net Flow Trends */}
      {dashboardData?.netFlowTrends && dashboardData.netFlowTrends.length > 0 && (
        <Card title="Net Flow Trends" className="dashboard-card">
          <div className="trends-container">
            <div className="trend-points">
              {dashboardData.netFlowTrends.map((trend, index) => (
                <div key={trend.period || index} className="trend-point">
                  <div className="trend-period">{trend.period}</div>
                  <div className="trend-values">
                    <span className="trend-income">
                      Income: {formatCurrency(trend.total_income || 0)}
                    </span>
                    <span className="trend-expense">
                      Expense: {formatCurrency(trend.total_expenses || 0)}
                    </span>
                    <span className={`trend-net ${trend.net_flow >= 0 ? 'positive' : 'negative'}`}>
                      Net: {formatCurrency(trend.net_flow || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

AnalyticsDashboard.propTypes = {
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  autoRefresh: PropTypes.bool,
  refreshInterval: PropTypes.number
};

export default AnalyticsDashboard;

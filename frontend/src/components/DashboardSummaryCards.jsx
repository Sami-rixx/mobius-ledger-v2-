/**
 * DashboardSummaryCards Component
 * Grid of summary cards for the dashboard
 */

import React from 'react';
import PropTypes from 'prop-types';
import DashboardCard from './DashboardCard.jsx';
import { formatCurrency } from '../services/dashboardService.js';
import './DashboardSummaryCards.scss';

/**
 * DashboardSummaryCards Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.stats - Quick statistics from API
 * @param {boolean} props.loading - Whether data is loading
 * @param {Function} props.onRefresh - Refresh handler
 */
function DashboardSummaryCards({ stats, loading = false, onRefresh }) {
  // Default stats structure
  const defaultStats = {
    totalStudents: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    totalWithdrawals: 0,
    totalTransactions: 0
  };

  const data = stats || defaultStats;

  // Calculate net balance class
  const getNetBalanceColor = () => {
    if (data.netBalance > 0) return 'success';
    if (data.netBalance < 0) return 'danger';
    return 'warning';
  };

  // Calculate trend indicators (placeholder - would come from API in real implementation)
  const getTrendData = (key) => {
    // This is a placeholder for trend data
    // In a real implementation, this would come from the API
    const trends = {
      totalStudents: { trend: 'up', value: '+12%' },
      totalIncome: { trend: 'up', value: '+15%' },
      totalExpenses: { trend: 'down', value: '-5%' },
      netBalance: { trend: data.netBalance >= 0 ? 'up' : 'down', value: data.netBalance >= 0 ? '+10%' : '-8%' }
    };
    return trends[key] || { trend: null, value: null };
  };

  return (
    <div className="dashboard-summary-cards">
      <div className="dashboard-summary-cards__grid">
        {/* Total Students */}
        <DashboardCard
          title="Total Students"
          value={data.totalStudents}
          label="Active Students"
          icon="fa fa-users"
          color="info"
          loading={loading}
          trend={getTrendData('totalStudents').trend}
          trendValue={getTrendData('totalStudents').value}
        />

        {/* Total Income */}
        <DashboardCard
          title="Total Income"
          value={data.totalIncome}
          label="Verified Income"
          icon="fa fa-arrow-down"
          color="success"
          loading={loading}
          trend={getTrendData('totalIncome').trend}
          trendValue={getTrendData('totalIncome').value}
        />

        {/* Total Expenses */}
        <DashboardCard
          title="Total Expenses"
          value={data.totalExpenses}
          label="Verified Expenses"
          icon="fa fa-arrow-up"
          color="danger"
          loading={loading}
          trend={getTrendData('totalExpenses').trend}
          trendValue={getTrendData('totalExpenses').value}
        />

        {/* Net Balance */}
        <DashboardCard
          title="Net Balance"
          value={data.netBalance}
          label="Income - Expenses"
          icon="fa fa-balance-scale"
          color={getNetBalanceColor()}
          loading={loading}
          trend={getTrendData('netBalance').trend}
          trendValue={getTrendData('netBalance').value}
        />

        {/* Total Withdrawals */}
        <DashboardCard
          title="Total Withdrawals"
          value={data.totalWithdrawals}
          label="Director Withdrawals"
          icon="fa fa-hand-holding-usd"
          color="warning"
          loading={loading}
        />

        {/* Total Transactions */}
        <DashboardCard
          title="Total Transactions"
          value={data.totalTransactions}
          label="All Transactions"
          icon="fa fa-exchange-alt"
          color="secondary"
          loading={loading}
        />
      </div>

      {onRefresh && (
        <div className="dashboard-summary-cards__refresh">
          <button 
            className="btn btn-sm btn-outline-secondary" 
            onClick={onRefresh}
            disabled={loading}
          >
            <i className="fa fa-sync-alt" /> Refresh
          </button>
        </div>
      )}
    </div>
  );
}

DashboardSummaryCards.propTypes = {
  stats: PropTypes.shape({
    totalStudents: PropTypes.number,
    totalIncome: PropTypes.number,
    totalExpenses: PropTypes.number,
    netBalance: PropTypes.number,
    totalWithdrawals: PropTypes.number,
    totalTransactions: PropTypes.number
  }),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func
};

export default DashboardSummaryCards;

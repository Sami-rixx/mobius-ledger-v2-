/**
 * DashboardRecentActivity Component
 * Displays a feed of recent financial activity
 */

import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency, formatNumber, calculatePercentage } from '../services/dashboardService.js';
import './DashboardRecentActivity.scss';

/**
 * DashboardRecentActivity Component
 * 
 * @param {Object} props - Component props
 * @param {Array} props.activity - Array of activity items
 * @param {boolean} props.loading - Whether data is loading
 * @param {number} props.limit - Maximum number of items to display
 * @param {Function} props.onViewAll - View all handler
 */
function DashboardRecentActivity({ activity = [], loading = false, limit = 10, onViewAll }) {
  // Sort activity by date (newest first)
  const sortedActivity = [...activity].sort((a, b) => {
    const dateA = new Date(a.date || a.created_at || 0);
    const dateB = new Date(b.date || b.created_at || 0);
    return dateB - dateA;
  });

  // Limit displayed items
  const displayedActivity = sortedActivity.slice(0, limit);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('en-KE', { weekday: 'short' });
    } else if (diffInDays < 30) {
      return `${Math.floor(diffInDays / 7)} weeks ago`;
    }
    
    return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
  };

  // Get activity type icon
  const getActivityIcon = (type) => {
    const icons = {
      transaction: 'fa fa-exchange-alt',
      income: 'fa fa-arrow-down',
      expense: 'fa fa-arrow-up',
      fee: 'fa fa-graduation-cap',
      withdrawal: 'fa fa-hand-holding-usd',
      charge: 'fa fa-plus-circle',
      payment: 'fa fa-check-circle',
      default: 'fa fa-circle'
    };
    return icons[type] || icons.default;
  };

  // Get activity type color
  const getActivityColor = (type) => {
    const colors = {
      transaction: '#6c757d',
      income: '#28a745',
      expense: '#dc3545',
      fee: '#007bff',
      withdrawal: '#ffc107',
      charge: '#17a2b8',
      payment: '#28a745',
      default: '#6c757d'
    };
    return colors[type] || colors.default;
  };

  // Get activity type label
  const getActivityLabel = (type) => {
    const labels = {
      transaction: 'Transaction',
      income: 'Income',
      expense: 'Expense',
      fee: 'School Fee',
      withdrawal: 'Withdrawal',
      charge: 'Charge',
      payment: 'Payment',
      default: 'Activity'
    };
    return labels[type] || labels.default;
  };

  return (
    <div className="dashboard-recent-activity">
      <div className="dashboard-recent-activity__header">
        <h3 className="dashboard-recent-activity__title">Recent Activity</h3>
        {onViewAll && (
          <button 
            className="btn btn-sm btn-outline-primary"
            onClick={onViewAll}
          >
            View All
          </button>
        )}
      </div>
      
      <div className="dashboard-recent-activity__content">
        {loading ? (
          <div className="dashboard-recent-activity__loading">
            <i className="fa fa-spinner fa-spin" /> Loading activity...
          </div>
        ) : displayedActivity.length === 0 ? (
          <div className="dashboard-recent-activity__empty">
            <i className="fa fa-inbox" /> No recent activity
          </div>
        ) : (
          <ul className="dashboard-recent-activity__list">
            {displayedActivity.map((item, index) => (
              <li key={item.id || index} className="dashboard-recent-activity__item">
                <div className="dashboard-recent-activity__icon-container">
                  <i 
                    className={`dashboard-recent-activity__icon ${getActivityIcon(item.type)}`}
                    style={{ color: getActivityColor(item.type) }}
                    aria-hidden="true"
                  />
                </div>
                
                <div className="dashboard-recent-activity__details">
                  <div className="dashboard-recent-activity__description">
                    {item.description || getActivityLabel(item.type)}
                  </div>
                  
                  {item.receiptNumber && (
                    <div className="dashboard-recent-activity__receipt">
                      Receipt: {item.receiptNumber}
                    </div>
                  )}
                  
                  <div className="dashboard-recent-activity__meta">
                    {item.amount !== undefined && (
                      <span className="dashboard-recent-activity__amount">
                        {formatCurrency(item.amount)}
                      </span>
                    )}
                    <span className="dashboard-recent-activity__date">
                      {formatDate(item.date || item.created_at)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

DashboardRecentActivity.propTypes = {
  activity: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    description: PropTypes.string,
    amount: PropTypes.number,
    date: PropTypes.string,
    created_at: PropTypes.string,
    receiptNumber: PropTypes.string
  })),
  loading: PropTypes.bool,
  limit: PropTypes.number,
  onViewAll: PropTypes.func
};

export default DashboardRecentActivity;

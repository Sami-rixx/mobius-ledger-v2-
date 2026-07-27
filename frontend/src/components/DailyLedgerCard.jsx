/**
 * DailyLedgerCard Component
 * Card component for displaying daily ledger information
 */

import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency, formatDate } from '../services/dailyLedgerService.js';
import './DailyLedgerCard.scss';

/**
 * DailyLedgerCard Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.ledger - Daily ledger data
 * @param {number} props.ledger.id - Ledger record ID
 * @param {string} props.ledger.date - Ledger date
 * @param {number} props.ledger.opening_balance - Opening balance
 * @param {number} props.ledger.total_income - Total income
 * @param {number} props.ledger.total_expenses - Total expenses
 * @param {number} props.ledger.closing_balance - Closing balance
 * @param {number} props.ledger.net_movement - Net movement
 * @param {number} props.ledger.transaction_count - Transaction count
 * @param {boolean} props.loading - Whether to show loading state
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 */
function DailyLedgerCard({
  ledger,
  loading = false,
  onClick,
  className = ''
}) {
  // Check if ledger is provided
  if (!ledger && !loading) {
    return (
      <div className={`daily-ledger-card daily-ledger-card--empty ${className}`}>
        <div className="daily-ledger-card__content">
          <p className="daily-ledger-card__empty-text">No ledger data available</p>
        </div>
      </div>
    );
  }

  // Determine card color based on net movement
  const getCardColor = () => {
    if (loading) return 'loading';
    if (ledger.net_movement > 0) return 'success';
    if (ledger.net_movement < 0) return 'danger';
    return 'primary';
  };

  const cardColor = getCardColor();

  // Format date display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '--';
    
    // Check if it's today, yesterday, or this week
    const today = new Date();
    const ledgerDate = new Date(dateString);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = formatDate(today);
    const yesterdayStr = formatDate(yesterday);
    const ledgerDateStr = formatDate(ledgerDate);
    
    if (ledgerDateStr === todayStr) return 'Today';
    if (ledgerDateStr === yesterdayStr) return 'Yesterday';
    
    // Check if within last 7 days
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (ledgerDate >= weekAgo && ledgerDate < today) {
      const daysAgo = Math.floor((today - ledgerDate) / (1000 * 60 * 60 * 24));
      return `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
    }
    
    // For older dates, show formatted date
    return formatDate(dateString);
  };

  // Get movement indicator
  const getMovementIndicator = () => {
    if (loading) return null;
    if (ledger.net_movement > 0) {
      return (
        <span className="daily-ledger-card__movement daily-ledger-card__movement--positive">
          <i className="fa fa-arrow-up" aria-hidden="true" />
          +{formatCurrency(ledger.net_movement)}
        </span>
      );
    }
    if (ledger.net_movement < 0) {
      return (
        <span className="daily-ledger-card__movement daily-ledger-card__movement--negative">
          <i className="fa fa-arrow-down" aria-hidden="true" />
          {formatCurrency(ledger.net_movement)}
        </span>
      );
    }
    return (
      <span className="daily-ledger-card__movement daily-ledger-card__movement--neutral">
        No movement
      </span>
    );
  };

  return (
    <div 
      className={`daily-ledger-card daily-ledger-card--${cardColor} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="daily-ledger-card__header">
        <div className="daily-ledger-card__date">
          {loading ? (
            <i className="fa fa-spinner fa-spin daily-ledger-card__loading-indicator" />
          ) : (
            <>{formatDateDisplay(ledger.date)}</>
          )}
        </div>
        <div className="daily-ledger-card__transactions">
          {loading ? (
            <span>--</span>
          ) : (
            <>
              <i className="fa fa-exchange-alt" aria-hidden="true" />
              {ledger.transaction_count || 0} transactions
            </>
          )}
        </div>
      </div>
      
      <div className="daily-ledger-card__content">
        <div className="daily-ledger-card__balance daily-ledger-card__balance--closing">
          <span className="daily-ledger-card__balance-label">Closing Balance</span>
          <span className="daily-ledger-card__balance-value">
            {loading ? (
              <i className="fa fa-spinner fa-spin" />
            ) : (
              formatCurrency(ledger.closing_balance)
            )}
          </span>
        </div>
        
        <div className="daily-ledger-card__details">
          <div className="daily-ledger-card__detail">
            <span className="daily-ledger-card__detail-label">Opening:</span>
            <span className="daily-ledger-card__detail-value">
              {loading ? '--' : formatCurrency(ledger.opening_balance)}
            </span>
          </div>
          <div className="daily-ledger-card__detail">
            <span className="daily-ledger-card__detail-label">Income:</span>
            <span className="daily-ledger-card__detail-value daily-ledger-card__detail-value--income">
              {loading ? '--' : `+${formatCurrency(ledger.total_income)}`}
            </span>
          </div>
          <div className="daily-ledger-card__detail">
            <span className="daily-ledger-card__detail-label">Expenses:</span>
            <span className="daily-ledger-card__detail-value daily-ledger-card__detail-value--expense">
              {loading ? '--' : `-${formatCurrency(ledger.total_expenses)}`}
            </span>
          </div>
        </div>
        
        {getMovementIndicator()}
      </div>
    </div>
  );
}

DailyLedgerCard.propTypes = {
  ledger: PropTypes.shape({
    id: PropTypes.number,
    date: PropTypes.string,
    opening_balance: PropTypes.number,
    total_income: PropTypes.number,
    total_expenses: PropTypes.number,
    closing_balance: PropTypes.number,
    net_movement: PropTypes.number,
    transaction_count: PropTypes.number
  }),
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default DailyLedgerCard;

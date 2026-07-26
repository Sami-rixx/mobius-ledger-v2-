import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from './index.js';

/**
 * DailySummaryCard Component
 * Displays daily summary information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.summary - Daily summary data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 */
function DailySummaryCard({ summary, showActions = true, onEdit, onDelete, onView }) {
  if (!summary) {
    return null;
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'KES 0.00';
    const num = parseFloat(amount);
    return `KES ${num.toFixed(2)}`;
  };

  // Calculate net flow percentage
  const calculateNetFlowPercentage = () => {
    const income = parseFloat(summary.total_income) || 0;
    const expenses = parseFloat(summary.total_expenses) || 0;
    if (income === 0) return 0;
    return ((income - expenses) / income) * 100;
  };

  // Get net flow status
  const getNetFlowStatus = () => {
    const netFlow = parseFloat(summary.net_flow) || 0;
    if (netFlow > 0) return 'positive';
    if (netFlow < 0) return 'negative';
    return 'neutral';
  };

  // Get net flow status text
  const getNetFlowStatusText = () => {
    const netFlow = parseFloat(summary.net_flow) || 0;
    if (netFlow > 0) return 'Profit';
    if (netFlow < 0) return 'Loss';
    return 'Balanced';
  };

  const netFlowPercentage = calculateNetFlowPercentage();
  const netFlowStatus = getNetFlowStatus();
  const netFlowStatusText = getNetFlowStatusText();

  return (
    <Card
      title={`Daily Summary - ${formatDate(summary.summary_date)}`}
      subtitle={`Net Flow: ${formatCurrency(summary.net_flow)} (${netFlowStatusText})`}
      className={`daily-summary-card daily-summary-card--${netFlowStatus}`}
    >
      <div className="daily-summary-info">
        <div className="daily-summary-stats">
          <div className="stat-item">
            <div className="stat-label">Total Income</div>
            <div className="stat-value income">{formatCurrency(summary.total_income)}</div>
            <div className="stat-count">{summary.income_count || 0} transactions</div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Total Expenses</div>
            <div className="stat-value expense">{formatCurrency(summary.total_expenses)}</div>
            <div className="stat-count">{summary.expense_count || 0} transactions</div>
          </div>

          <div className="stat-item net-flow">
            <div className="stat-label">Net Flow</div>
            <div className={`stat-value ${netFlowStatus}`}>
              {formatCurrency(summary.net_flow)}
            </div>
            <div className={`stat-percentage ${netFlowStatus}`}>
              {netFlowPercentage > 0 ? '+' : ''}{netFlowPercentage.toFixed(2)}%
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-label">Total Transactions</div>
            <div className="stat-value">{summary.transaction_count || 0}</div>
            <div className="stat-count">
              {summary.income_count + summary.expense_count || 0} records
            </div>
          </div>
        </div>

        <div className="daily-summary-additional">
          <div className="additional-row">
            <span className="additional-label">ID:</span>
            <span className="additional-value">{summary.id}</span>
          </div>
          <div className="additional-row">
            <span className="additional-label">Created:</span>
            <span className="additional-value">{formatDate(summary.created_at)}</span>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="daily-summary-actions">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(summary)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(summary)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => onDelete(summary)}>
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

DailySummaryCard.propTypes = {
  summary: PropTypes.object.isRequired,
  showActions: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func
};

export default DailySummaryCard;

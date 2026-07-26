import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from './index.js';

/**
 * IncomeCard Component
 * Displays income record information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.income - Income data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 */
function IncomeCard({ income, showActions = true, onEdit, onDelete, onView }) {
  if (!income) {
    return null;
  }

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'KES 0.00';
    return `KES ${parseFloat(amount).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge class
  const getStatusClass = (isVerified) => {
    return isVerified ? 'success' : 'warning';
  };

  // Get status text
  const getStatusText = (isVerified) => {
    return isVerified ? 'Verified' : 'Pending';
  };

  return (
    <Card
      title={income.source || 'Unknown Source'}
      subtitle={`${formatCurrency(income.amount)} - ${formatDate(income.date)}`}
      className="income-card"
    >
      <div className="income-info">
        <div className="income-detail">
          {income.category_name && (
            <div className="detail-row">
              <span className="detail-label">Category:</span>
              <span className="detail-value">{income.category_name}</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Receipt #:</span>
            <span className="detail-value">{income.receipt_number || 'N/A'}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Payment Method:</span>
            <span className="detail-value">{income.payment_method || 'N/A'}</span>
          </div>

          {income.reference && (
            <div className="detail-row">
              <span className="detail-label">Reference:</span>
              <span className="detail-value">{income.reference}</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`detail-value badge badge-${getStatusClass(income.is_verified)}`}>
              {getStatusText(income.is_verified)}
            </span>
          </div>

          {income.created_at && (
            <div className="detail-row">
              <span className="detail-label">Created:</span>
              <span className="detail-value">{formatDate(income.created_at)}</span>
            </div>
          )}
        </div>

        {income.description && (
          <div className="income-description">
            <p>{income.description}</p>
          </div>
        )}
      </div>

      {showActions && (
        <div className="income-actions">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(income)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(income)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => onDelete(income)}>
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

IncomeCard.propTypes = {
  income: PropTypes.object.isRequired,
  showActions: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func
};

export default IncomeCard;

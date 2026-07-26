import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from './index.js';

/**
 * ExpenseCard Component
 * Displays expense record information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.expense - Expense data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 */
function ExpenseCard({ expense, showActions = true, onEdit, onDelete, onView }) {
  if (!expense) {
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
      title={expense.vendor_name || 'Unknown Vendor'}
      subtitle={`${formatCurrency(expense.amount)} - ${formatDate(expense.expense_date)}`}
      className="expense-card"
    >
      <div className="expense-info">
        <div className="expense-detail">
          {expense.category_name && (
            <div className="detail-row">
              <span className="detail-label">Category:</span>
              <span className="detail-value">{expense.category_name}</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Receipt #:</span>
            <span className="detail-value">{expense.receipt_number || 'N/A'}</span>
          </div>

          {expense.vendor_contact && (
            <div className="detail-row">
              <span className="detail-label">Vendor Contact:</span>
              <span className="detail-value">{expense.vendor_contact}</span>
            </div>
          )}

          {expense.payment_method_name && (
            <div className="detail-row">
              <span className="detail-label">Payment Method:</span>
              <span className="detail-value">{expense.payment_method_name || 'N/A'}</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`detail-value badge badge-${getStatusClass(expense.is_verified)}`}>
              {getStatusText(expense.is_verified)}
            </span>
          </div>

          {expense.transaction_id && (
            <div className="detail-row">
              <span className="detail-label">Transaction #:</span>
              <span className="detail-value">{expense.transaction_id}</span>
            </div>
          )}

          {expense.created_at && (
            <div className="detail-row">
              <span className="detail-label">Created:</span>
              <span className="detail-value">{formatDate(expense.created_at)}</span>
            </div>
          )}
        </div>

        {expense.description && (
          <div className="expense-description">
            <p>{expense.description}</p>
          </div>
        )}

        {expense.notes && (
          <div className="expense-notes">
            <p><strong>Notes:</strong> {expense.notes}</p>
          </div>
        )}
      </div>

      {showActions && (
        <div className="expense-actions">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(expense)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(expense)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => onDelete(expense)}>
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

ExpenseCard.propTypes = {
  expense: PropTypes.object.isRequired,
  showActions: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func
};

export default ExpenseCard;

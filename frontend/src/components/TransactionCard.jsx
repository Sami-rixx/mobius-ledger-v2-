import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from './index.js';
import { getTransactionTypeLabel, getTransactionTypeColor } from '../services/transactionService.js';

/**
 * TransactionCard Component
 * Displays transaction information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.transaction - Transaction data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 */
function TransactionCard({
  transaction,
  showActions = true,
  onEdit,
  onDelete,
  onView
}) {
  if (!transaction) {
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

  // Get type label and color
  const typeLabel = getTransactionTypeLabel(transaction.transaction_type);
  const typeColor = getTransactionTypeColor(transaction.transaction_type);

  return (
    <Card
      title={typeLabel || 'Transaction'}
      subtitle={`${formatCurrency(transaction.amount)} - ${formatDate(transaction.transaction_date)}`}
      className="transaction-card"
    >
      <div className="transaction-info">
        <div className="transaction-detail">
          {transaction.receipt_number && (
            <div className="detail-row">
              <span className="detail-label">Receipt #:</span>
              <span className="detail-value">{transaction.receipt_number}</span>
            </div>
          )}

          {transaction.student_id && (
            <div className="detail-row">
              <span className="detail-label">Student ID:</span>
              <span className="detail-value">{transaction.student_id}</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Type:</span>
            <span className={`detail-value badge ${typeColor}`}>
              {typeLabel}
            </span>
          </div>

          {transaction.description && (
            <div className="detail-row">
              <span className="detail-label">Description:</span>
              <span className="detail-value">{transaction.description}</span>
            </div>
          )}

          {transaction.reference && (
            <div className="detail-row">
              <span className="detail-label">Reference:</span>
              <span className="detail-value">{transaction.reference}</span>
            </div>
          )}

          {transaction.payment_method_id && (
            <div className="detail-row">
              <span className="detail-label">Payment Method:</span>
              <span className="detail-value">ID: {transaction.payment_method_id}</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Time:</span>
            <span className="detail-value">{transaction.transaction_time || 'N/A'}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`detail-value badge badge-${transaction.is_verified ? 'success' : 'warning'}`}>
              {transaction.is_verified ? 'Verified' : 'Pending'}
            </span>
          </div>

          {transaction.created_at && (
            <div className="detail-row">
              <span className="detail-label">Created:</span>
              <span className="detail-value">{formatDate(transaction.created_at)}</span>
            </div>
          )}
        </div>

        {transaction.notes && (
          <div className="transaction-notes">
            <p>{transaction.notes}</p>
          </div>
        )}
      </div>

      {showActions && (
        <div className="transaction-actions">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(transaction)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(transaction)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => onDelete(transaction)}>
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

TransactionCard.propTypes = {
  transaction: PropTypes.object.isRequired,
  showActions: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func
};

export default TransactionCard;

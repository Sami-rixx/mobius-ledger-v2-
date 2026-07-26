import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from './index.js';
import { WITHDRAWAL_STATUS } from '../services/directorWithdrawalService.js';

/**
 * Director Withdrawal Card Component
 * Displays director withdrawal information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.withdrawal - Director withdrawal data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {Function} props.onApprove - Approve handler
 * @param {Function} props.onReject - Reject handler
 * @param {Function} props.onComplete - Complete handler
 * @param {Function} props.onCancel - Cancel handler
 */
function DirectorWithdrawalCard({
  withdrawal,
  showActions = true,
  onEdit,
  onDelete,
  onView,
  onApprove,
  onReject,
  onComplete,
  onCancel
}) {
  if (!withdrawal) {
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

  // Get status badge class based on withdrawal status
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case WITHDRAWAL_STATUS.PENDING:
        return 'warning';
      case WITHDRAWAL_STATUS.APPROVED:
        return 'primary';
      case WITHDRAWAL_STATUS.REJECTED:
        return 'danger';
      case WITHDRAWAL_STATUS.COMPLETED:
        return 'success';
      case WITHDRAWAL_STATUS.CANCELLED:
        return 'secondary';
      default:
        return 'info';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Check if withdrawal is pending (can be approved/rejected/cancelled)
  const isPending = withdrawal.status === WITHDRAWAL_STATUS.PENDING || withdrawal.is_pending;
  
  // Check if withdrawal is approved (can be completed/cancelled)
  const isApproved = withdrawal.status === WITHDRAWAL_STATUS.APPROVED || withdrawal.is_approved;
  
  // Check if withdrawal is completed (cannot be modified)
  const isCompleted = withdrawal.status === WITHDRAWAL_STATUS.COMPLETED || withdrawal.is_completed;

  return (
    <Card
      title={withdrawal.purpose || 'Untitled Withdrawal'}
      subtitle={`${formatCurrency(withdrawal.amount)} - ${formatDate(withdrawal.withdrawal_date)}`}
      className="director-withdrawal-card"
    >
      <div className="withdrawal-info">
        <div className="withdrawal-detail">
          {withdrawal.label && (
            <div className="detail-row">
              <span className="detail-label">Label:</span>
              <span className="detail-value">{withdrawal.label}</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Recipient:</span>
            <span className="detail-value">{withdrawal.recipient_name || 'N/A'}</span>
          </div>

          {withdrawal.recipient_contact && (
            <div className="detail-row">
              <span className="detail-label">Contact:</span>
              <span className="detail-value">{withdrawal.recipient_contact}</span>
            </div>
          )}

          {withdrawal.payment_method_name && (
            <div className="detail-row">
              <span className="detail-label">Payment Method:</span>
              <span className="detail-value">{withdrawal.payment_method_name}</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`detail-value badge badge-${getStatusClass(withdrawal.status)}`}>
              {getStatusText(withdrawal.status)}
            </span>
          </div>

          {withdrawal.approved_at && (
            <div className="detail-row">
              <span className="detail-label">Approved:</span>
              <span className="detail-value">{formatDate(withdrawal.approved_at)}</span>
            </div>
          )}

          {withdrawal.rejected_at && (
            <div className="detail-row">
              <span className="detail-label">Rejected:</span>
              <span className="detail-value">{formatDate(withdrawal.rejected_at)}</span>
            </div>
          )}

          {withdrawal.rejection_reason && (
            <div className="detail-row">
              <span className="detail-label">Reason:</span>
              <span className="detail-value text-danger">{withdrawal.rejection_reason}</span>
            </div>
          )}

          {withdrawal.notes && (
            <div className="detail-row">
              <span className="detail-label">Notes:</span>
              <span className="detail-value">{withdrawal.notes}</span>
            </div>
          )}
        </div>

        {withdrawal.description && (
          <div className="withdrawal-description mt-2">
            <p>{withdrawal.description}</p>
          </div>
        )}

        {showActions && (
          <div className="withdrawal-actions mt-3">
            {onView && (
              <Button
                variant="info"
                size="sm"
                onClick={() => onView(withdrawal)}
                className="me-2"
              >
                View
              </Button>
            )}

            {onEdit && !isCompleted && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onEdit(withdrawal)}
                className="me-2"
              >
                Edit
              </Button>
            )}

            {onApprove && isPending && (
              <Button
                variant="success"
                size="sm"
                onClick={() => onApprove(withdrawal)}
                className="me-2"
              >
                Approve
              </Button>
            )}

            {onReject && isPending && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onReject(withdrawal)}
                className="me-2"
              >
                Reject
              </Button>
            )}

            {onComplete && isApproved && (
              <Button
                variant="success"
                size="sm"
                onClick={() => onComplete(withdrawal)}
                className="me-2"
              >
                Mark Complete
              </Button>
            )}

            {onCancel && !isCompleted && (
              <Button
                variant="warning"
                size="sm"
                onClick={() => onCancel(withdrawal)}
                className="me-2"
              >
                Cancel
              </Button>
            )}

            {onDelete && isPending && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(withdrawal)}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

DirectorWithdrawalCard.propTypes = {
  withdrawal: PropTypes.object,
  showActions: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  onComplete: PropTypes.func,
  onCancel: PropTypes.func
};

export default DirectorWithdrawalCard;

import React from 'react';
import PropTypes from 'prop-types';
import { Button } from './index.js';
import { WITHDRAWAL_STATUS } from '../services/directorWithdrawalService.js';

/**
 * Director Withdrawal Table Component
 * Displays director withdrawals in a table format
 * 
 * @param {Object} props - Component props
 * @param {Array} props.withdrawals - Array of withdrawal objects
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {Function} props.onApprove - Approve handler
 * @param {Function} props.onReject - Reject handler
 * @param {Function} props.onComplete - Complete handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.showActions - Whether to show action buttons
 */
function DirectorWithdrawalTable({
  withdrawals = [],
  onEdit,
  onDelete,
  onView,
  onApprove,
  onReject,
  onComplete,
  onCancel,
  showActions = true
}) {
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
  const getStatusClass = (status) => {
    if (!status) return 'badge-info';
    
    switch (status.toLowerCase()) {
      case WITHDRAWAL_STATUS.PENDING:
        return 'badge-warning';
      case WITHDRAWAL_STATUS.APPROVED:
        return 'badge-primary';
      case WITHDRAWAL_STATUS.REJECTED:
        return 'badge-danger';
      case WITHDRAWAL_STATUS.COMPLETED:
        return 'badge-success';
      case WITHDRAWAL_STATUS.CANCELLED:
        return 'badge-secondary';
      default:
        return 'badge-info';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Check if withdrawal can be modified
  const canModify = (withdrawal) => {
    const isCompleted = withdrawal.status === WITHDRAWAL_STATUS.COMPLETED || withdrawal.is_completed;
    return !isCompleted;
  };

  // Check if withdrawal is pending
  const isPending = (withdrawal) => {
    return withdrawal.status === WITHDRAWAL_STATUS.PENDING || withdrawal.is_pending;
  };

  // Check if withdrawal is approved
  const isApproved = (withdrawal) => {
    return withdrawal.status === WITHDRAWAL_STATUS.APPROVED || withdrawal.is_approved;
  };

  if (!withdrawals || withdrawals.length === 0) {
    return (
      <div className="director-withdrawal-table">
        <p className="text-muted text-center">No director withdrawals found.</p>
      </div>
    );
  }

  return (
    <div className="director-withdrawal-table table-responsive">
      <table className="table table-striped table-hover">
        <thead className="table-header">
          <tr>
            <th>ID</th>
            <th>Purpose</th>
            <th>Amount</th>
            <th>Recipient</th>
            <th>Date</th>
            <th>Label</th>
            <th>Status</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {withdrawals.map(withdrawal => (
            <tr key={withdrawal.id} className="withdrawal-row">
              <td>{withdrawal.id}</td>
              <td className="purpose-cell">{withdrawal.purpose || 'N/A'}</td>
              <td className="amount-cell text-end">{formatCurrency(withdrawal.amount)}</td>
              <td>{withdrawal.recipient_name || withdrawal.recipientName || 'N/A'}</td>
              <td>{formatDate(withdrawal.withdrawal_date)}</td>
              <td>{withdrawal.label || 'N/A'}</td>
              <td>
                <span className={`status-badge ${getStatusClass(withdrawal.status)}`}>
                  {getStatusText(withdrawal.status)}
                </span>
              </td>
              {showActions && (
                <td className="actions-cell">
                  <div className="action-buttons">
                    {onView && (
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => onView(withdrawal)}
                        className="me-1"
                        title="View"
                      >
                        <i className="bi bi-eye" />
                      </Button>
                    )}
                    
                    {onEdit && canModify(withdrawal) && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onEdit(withdrawal)}
                        className="me-1"
                        title="Edit"
                      >
                        <i className="bi bi-pencil" />
                      </Button>
                    )}

                    {onApprove && isPending(withdrawal) && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => onApprove(withdrawal)}
                        className="me-1"
                        title="Approve"
                      >
                        <i className="bi bi-check-circle" />
                      </Button>
                    )}

                    {onReject && isPending(withdrawal) && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onReject(withdrawal)}
                        className="me-1"
                        title="Reject"
                      >
                        <i className="bi bi-x-circle" />
                      </Button>
                    )}

                    {onComplete && isApproved(withdrawal) && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => onComplete(withdrawal)}
                        className="me-1"
                        title="Complete"
                      >
                        <i className="bi bi-check2-square" />
                      </Button>
                    )}

                    {onCancel && canModify(withdrawal) && !isPending(withdrawal) && (
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => onCancel(withdrawal)}
                        className="me-1"
                        title="Cancel"
                      >
                        <i className="bi bi-ban" />
                      </Button>
                    )}

                    {onDelete && isPending(withdrawal) && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(withdrawal)}
                        title="Delete"
                      >
                        <i className="bi bi-trash" />
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

DirectorWithdrawalTable.propTypes = {
  withdrawals: PropTypes.arrayOf(PropTypes.object),
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  onComplete: PropTypes.func,
  onCancel: PropTypes.func,
  showActions: PropTypes.bool
};

export default DirectorWithdrawalTable;

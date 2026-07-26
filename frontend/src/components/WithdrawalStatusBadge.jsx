import React from 'react';
import PropTypes from 'prop-types';
import { WITHDRAWAL_STATUS } from '../services/directorWithdrawalService.js';

/**
 * Withdrawal Status Badge Component
 * Displays a withdrawal status as a styled badge
 * 
 * @param {Object} props - Component props
 * @param {string} props.status - Withdrawal status
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showText - Whether to show status text
 */
function WithdrawalStatusBadge({ status, className = '', showText = true }) {
  // Get badge class based on status
  const getBadgeClass = () => {
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
  const getStatusText = () => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <span className={`withdrawal-status-badge ${getBadgeClass()} ${className}`}>
      {showText && getStatusText()}
    </span>
  );
}

WithdrawalStatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  className: PropTypes.string,
  showText: PropTypes.bool
};

export default WithdrawalStatusBadge;

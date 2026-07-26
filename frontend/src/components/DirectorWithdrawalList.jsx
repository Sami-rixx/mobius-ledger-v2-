import React from 'react';
import PropTypes from 'prop-types';
import DirectorWithdrawalCard from './DirectorWithdrawalCard.jsx';
import { Pagination } from './index.js';

/**
 * Director Withdrawal List Component
 * Displays a list of director withdrawals as cards
 * 
 * @param {Object} props - Component props
 * @param {Array} props.withdrawals - Array of withdrawal objects
 * @param {Object} props.pagination - Pagination information
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {Function} props.onApprove - Approve handler
 * @param {Function} props.onReject - Reject handler
 * @param {Function} props.onComplete - Complete handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {Function} props.onPageChange - Page change handler
 * @param {boolean} props.showActions - Whether to show action buttons
 */
function DirectorWithdrawalList({
  withdrawals = [],
  pagination,
  onEdit,
  onDelete,
  onView,
  onApprove,
  onReject,
  onComplete,
  onCancel,
  onPageChange,
  showActions = true
}) {
  if (!withdrawals || withdrawals.length === 0) {
    return (
      <div className="director-withdrawal-list">
        <p className="text-muted text-center">No director withdrawals found.</p>
      </div>
    );
  }

  return (
    <div className="director-withdrawal-list">
      <div className="withdrawal-cards">
        {withdrawals.map(withdrawal => (
          <DirectorWithdrawalCard
            key={withdrawal.id}
            withdrawal={withdrawal}
            showActions={showActions}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            onApprove={onApprove}
            onReject={onReject}
            onComplete={onComplete}
            onCancel={onCancel}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
          hasPreviousPage={pagination.hasPreviousPage}
          hasNextPage={pagination.hasNextPage}
        />
      )}
    </div>
  );
}

DirectorWithdrawalList.propTypes = {
  withdrawals: PropTypes.arrayOf(PropTypes.object),
  pagination: PropTypes.object,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  onComplete: PropTypes.func,
  onCancel: PropTypes.func,
  onPageChange: PropTypes.func,
  showActions: PropTypes.bool
};

export default DirectorWithdrawalList;

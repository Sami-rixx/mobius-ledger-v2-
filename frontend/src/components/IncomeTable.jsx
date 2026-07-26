import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from './index.js';

/**
 * IncomeTable Component
 * Displays a list of income records in a table format with mobile responsiveness
 * 
 * @param {Object} props - Component props
 * @param {Array} props.incomeRecords - Array of income record objects
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {Function} props.onPageChange - Page change handler
 * @param {Object} props.pagination - Pagination metadata
 */
function IncomeTable({
  incomeRecords,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onPageChange,
  pagination
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
  const getStatusClass = (isVerified) => {
    return isVerified ? 'success' : 'warning';
  };

  // Get status text
  const getStatusText = (isVerified) => {
    return isVerified ? 'Verified' : 'Pending';
  };

  // Table columns
  const columns = [
    {
      key: 'receipt_number',
      header: 'Receipt #',
      width: '120px',
      render: (row) => row.receipt_number || 'N/A'
    },
    {
      key: 'date',
      header: 'Date',
      width: '100px',
      render: (row) => formatDate(row.date)
    },
    {
      key: 'source',
      header: 'Source',
      width: '150px',
      render: (row) => row.source || 'N/A'
    },
    {
      key: 'category',
      header: 'Category',
      width: '150px',
      render: (row) => row.category_name || row.category_id || 'N/A'
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '120px',
      render: (row) => formatCurrency(row.amount)
    },
    {
      key: 'payment_method',
      header: 'Payment Method',
      width: '120px',
      render: (row) => row.payment_method || 'N/A'
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (row) => {
        const isVerified = row.is_verified !== undefined ? row.is_verified : false;
        return (
          <span className={`badge badge-${getStatusClass(isVerified)}`}>
            {getStatusText(isVerified)}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '150px',
      render: (row) => (
        <div className="action-buttons">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(row)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(row)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => onDelete(row)}>
              Delete
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="income-table">
      <Table
        columns={columns}
        data={incomeRecords || []}
        emptyMessage={loading ? 'Loading income records...' : 'No income records found'}
      />

      {pagination && onPageChange && (
        <div className="pagination-controls">
          <div className="pagination-info">
            Showing {pagination.page} of {pagination.totalPages} pages ({pagination.total} records)
          </div>
          <div className="pagination-buttons">
            <Button
              variant="secondary"
              size="sm"
              disabled={!pagination.hasPreviousPage || loading}
              onClick={() => onPageChange(pagination.previousPage)}
            >
              Previous
            </Button>
            <span className="page-indicator">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={!pagination.hasNextPage || loading}
              onClick={() => onPageChange(pagination.nextPage)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

IncomeTable.propTypes = {
  incomeRecords: PropTypes.array,
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onPageChange: PropTypes.func,
  pagination: PropTypes.object
};

export default IncomeTable;

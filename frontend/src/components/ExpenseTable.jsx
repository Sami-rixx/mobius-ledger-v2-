import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from './index.js';

/**
 * ExpenseTable Component
 * Displays a list of expense records in a table format with mobile responsiveness
 * 
 * @param {Object} props - Component props
 * @param {Array} props.expenses - Array of expense record objects
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {Function} props.onPageChange - Page change handler
 * @param {Object} props.pagination - Pagination metadata
 */
function ExpenseTable({
  expenses,
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
      key: 'expense_date',
      header: 'Date',
      width: '100px',
      render: (row) => formatDate(row.expense_date)
    },
    {
      key: 'vendor_name',
      header: 'Vendor',
      width: '150px',
      render: (row) => row.vendor_name || 'N/A'
    },
    {
      key: 'category',
      header: 'Category',
      width: '150px',
      render: (row) => row.category_name || row.expense_category_id || 'N/A'
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '120px',
      render: (row) => formatCurrency(row.amount)
    },
    {
      key: 'description',
      header: 'Description',
      width: '200px',
      render: (row) => row.description || 'N/A'
    },
    {
      key: 'vendor_contact',
      header: 'Contact',
      width: '120px',
      render: (row) => row.vendor_contact || 'N/A'
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
    <div className="expense-table">
      <Table
        columns={columns}
        data={expenses || []}
        emptyMessage={loading ? 'Loading expense records...' : 'No expense records found'}
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

ExpenseTable.propTypes = {
  expenses: PropTypes.array,
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onPageChange: PropTypes.func,
  pagination: PropTypes.object
};

export default ExpenseTable;

import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from './index.js';
import { getTransactionTypeLabel, getTransactionTypeColor } from '../services/transactionService.js';

/**
 * TransactionTable Component
 * Displays a list of transactions in a table format with mobile responsiveness
 * 
 * @param {Object} props - Component props
 * @param {Array} props.transactions - Array of transaction objects
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {Function} props.onPageChange - Page change handler
 * @param {Object} props.pagination - Pagination metadata
 */
function TransactionTable({
  transactions,
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

  // Get type label and color
  const getTypeInfo = (type) => {
    const label = getTransactionTypeLabel(type);
    const color = getTransactionTypeColor(type);
    return { label, color };
  };

  // Table columns
  const columns = [
    {
      key: 'receipt_number',
      header: 'Receipt #',
      width: '140px',
      render: (row) => row.receipt_number || 'N/A'
    },
    {
      key: 'transaction_date',
      header: 'Date',
      width: '110px',
      render: (row) => formatDate(row.transaction_date)
    },
    {
      key: 'transaction_type',
      header: 'Type',
      width: '140px',
      render: (row) => {
        const { label, color } = getTypeInfo(row.transaction_type);
        return <span className={`badge ${color}`}>{label}</span>;
      }
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '120px',
      render: (row) => formatCurrency(row.amount)
    },
    {
      key: 'student_id',
      header: 'Student ID',
      width: '100px',
      render: (row) => row.student_id || 'N/A'
    },
    {
      key: 'description',
      header: 'Description',
      width: '200px',
      render: (row) => row.description || 'N/A'
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (row) => {
        const isVerified = row.is_verified !== undefined ? row.is_verified : false;
        return (
          <span className={`badge badge-${isVerified ? 'success' : 'warning'}`}>
            {isVerified ? 'Verified' : 'Pending'}
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
    <div className="transaction-table">
      <Table
        columns={columns}
        data={transactions || []}
        emptyMessage={loading ? 'Loading transactions...' : 'No transactions found'}
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
              onClick={() => onPageChange(pagination.page - 1)}
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
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

TransactionTable.propTypes = {
  transactions: PropTypes.array,
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onPageChange: PropTypes.func,
  pagination: PropTypes.object
};

export default TransactionTable;

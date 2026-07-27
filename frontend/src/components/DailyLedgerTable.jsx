/**
 * DailyLedgerTable Component
 * Displays a list of daily ledger records in a table format with mobile responsiveness
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Table } from './index.js';
import { formatCurrency, formatDate } from '../services/dailyLedgerService.js';
import './DailyLedgerTable.scss';

/**
 * DailyLedgerTable Component
 * 
 * @param {Object} props - Component props
 * @param {Array} props.ledgers - Array of daily ledger objects
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onEdit - Edit handler (id) => void
 * @param {Function} props.onDelete - Delete handler (id) => void
 * @param {Function} props.onView - View handler (id) => void
 * @param {Function} props.onPageChange - Page change handler (page) => void
 * @param {Object} props.pagination - Pagination metadata
 */
function DailyLedgerTable({
  ledgers,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onPageChange,
  pagination
}) {
  // Get movement color class
  const getMovementColor = (netMovement) => {
    if (netMovement > 0) return 'daily-ledger-table__movement--positive';
    if (netMovement < 0) return 'daily-ledger-table__movement--negative';
    return 'daily-ledger-table__movement--neutral';
  };

  // Format date for display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date for sorting (YYYY-MM-DD)
  const formatSortDate = (dateString) => {
    if (!dateString) return '';
    return formatDate(new Date(dateString));
  };

  // Table columns
  const columns = [
    {
      key: 'date',
      header: 'Date',
      width: '140px',
      sortable: true,
      sortValue: (row) => formatSortDate(row.date),
      render: (row) => formatDateDisplay(row.date)
    },
    {
      key: 'opening_balance',
      header: 'Opening Balance',
      width: '140px',
      sortable: true,
      sortValue: (row) => row.opening_balance || 0,
      render: (row) => formatCurrency(row.opening_balance)
    },
    {
      key: 'total_income',
      header: 'Income',
      width: '120px',
      sortable: true,
      sortValue: (row) => row.total_income || 0,
      render: (row) => (
        <span className="daily-ledger-table__income">
          +{formatCurrency(row.total_income)}
        </span>
      )
    },
    {
      key: 'total_expenses',
      header: 'Expenses',
      width: '120px',
      sortable: true,
      sortValue: (row) => row.total_expenses || 0,
      render: (row) => (
        <span className="daily-ledger-table__expense">
          -{formatCurrency(row.total_expenses)}
        </span>
      )
    },
    {
      key: 'closing_balance',
      header: 'Closing Balance',
      width: '140px',
      sortable: true,
      sortValue: (row) => row.closing_balance || 0,
      render: (row) => (
        <strong className="daily-ledger-table__closing-balance">
          {formatCurrency(row.closing_balance)}
        </strong>
      )
    },
    {
      key: 'net_movement',
      header: 'Net Movement',
      width: '120px',
      sortable: true,
      sortValue: (row) => row.net_movement || 0,
      render: (row) => (
        <span className={`daily-ledger-table__movement ${getMovementColor(row.net_movement)}`}>
          {row.net_movement >= 0 ? '+' : ''}{formatCurrency(row.net_movement)}
        </span>
      )
    },
    {
      key: 'transaction_count',
      header: 'Transactions',
      width: '100px',
      sortable: true,
      sortValue: (row) => row.transaction_count || 0,
      render: (row) => (
        <span className="daily-ledger-table__transaction-count">
          <i className="fa fa-exchange-alt" aria-hidden="true" />
          {row.transaction_count || 0}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (row) => (
        <div className="daily-ledger-table__actions">
          {onView && (
            <button 
              className="btn btn-sm btn-info daily-ledger-table__action-btn"
              onClick={() => onView(row.id)}
              title="View"
            >
              <i className="fa fa-eye" aria-hidden="true" />
            </button>
          )}
          {onEdit && (
            <button 
              className="btn btn-sm btn-warning daily-ledger-table__action-btn"
              onClick={() => onEdit(row.id)}
              title="Edit"
            >
              <i className="fa fa-edit" aria-hidden="true" />
            </button>
          )}
          {onDelete && (
            <button 
              className="btn btn-sm btn-danger daily-ledger-table__action-btn"
              onClick={() => onDelete(row.id)}
              title="Delete"
            >
              <i className="fa fa-trash" aria-hidden="true" />
            </button>
          )}
        </div>
      )
    }
  ];

  // Mobile card render
  const mobileCardRender = (row) => (
    <div className="daily-ledger-table__mobile-card" key={row.id}>
      <div className="daily-ledger-table__mobile-header">
        <span className="daily-ledger-table__mobile-date">{formatDateDisplay(row.date)}</span>
        <span className="daily-ledger-table__mobile-transactions">
          <i className="fa fa-exchange-alt" aria-hidden="true" />
          {row.transaction_count || 0} transactions
        </span>
      </div>
      
      <div className="daily-ledger-table__mobile-body">
        <div className="daily-ledger-table__mobile-row">
          <span className="daily-ledger-table__mobile-label">Opening:</span>
          <span className="daily-ledger-table__mobile-value">{formatCurrency(row.opening_balance)}</span>
        </div>
        <div className="daily-ledger-table__mobile-row">
          <span className="daily-ledger-table__mobile-label">Income:</span>
          <span className="daily-ledger-table__mobile-value daily-ledger-table__mobile-value--income">
            +{formatCurrency(row.total_income)}
          </span>
        </div>
        <div className="daily-ledger-table__mobile-row">
          <span className="daily-ledger-table__mobile-label">Expenses:</span>
          <span className="daily-ledger-table__mobile-value daily-ledger-table__mobile-value--expense">
            -{formatCurrency(row.total_expenses)}
          </span>
        </div>
        <div className="daily-ledger-table__mobile-row daily-ledger-table__mobile-row--highlight">
          <span className="daily-ledger-table__mobile-label">Closing:</span>
          <span className="daily-ledger-table__mobile-value">
            {formatCurrency(row.closing_balance)}
          </span>
        </div>
        <div className="daily-ledger-table__mobile-row">
          <span className="daily-ledger-table__mobile-label">Net Movement:</span>
          <span className={`daily-ledger-table__mobile-value ${getMovementColor(row.net_movement)}`}>
            {row.net_movement >= 0 ? '+' : ''}{formatCurrency(row.net_movement)}
          </span>
        </div>
      </div>

      {(onView || onEdit || onDelete) && (
        <div className="daily-ledger-table__mobile-actions">
          {onView && (
            <button 
              className="btn btn-sm btn-info"
              onClick={() => onView(row.id)}
            >
              View
            </button>
          )}
          {onEdit && (
            <button 
              className="btn btn-sm btn-warning"
              onClick={() => onEdit(row.id)}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button 
              className="btn btn-sm btn-danger"
              onClick={() => onDelete(row.id)}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="daily-ledger-table">
      <Table
        data={ledgers}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={onPageChange}
        mobileCardRender={mobileCardRender}
        emptyMessage="No daily ledger records found"
        tableClassName="daily-ledger-table__table"
        mobileClassName="daily-ledger-table__mobile"
      />
    </div>
  );
}

DailyLedgerTable.propTypes = {
  ledgers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      date: PropTypes.string,
      opening_balance: PropTypes.number,
      total_income: PropTypes.number,
      total_expenses: PropTypes.number,
      closing_balance: PropTypes.number,
      net_movement: PropTypes.number,
      transaction_count: PropTypes.number
    })
  ),
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onPageChange: PropTypes.func,
  pagination: PropTypes.shape({
    page: PropTypes.number,
    pageSize: PropTypes.number,
    total: PropTypes.number,
    totalPages: PropTypes.number
  })
};

export default DailyLedgerTable;

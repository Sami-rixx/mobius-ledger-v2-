import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from './index.js';
import { formatDate } from '../utils/formatters.js';

/**
 * LunchAttendanceTable Component
 * Table component for listing lunch attendance records
 * 
 * @param {Object} props - Component props
 * @param {Array} props.attendanceRecords - Array of lunch attendance objects
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {boolean} props.loading - Loading state
 */
function LunchAttendanceTable({ attendanceRecords, onEdit, onDelete, onView, loading = false }) {
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'badge badge-success';
      case 'unpaid':
        return 'badge badge-warning';
      case 'absent':
        return 'badge badge-secondary';
      default:
        return 'badge badge-info';
    }
  };

  // Define table columns
  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      render: (record) => record.id
    },
    {
      key: 'student',
      header: 'Student',
      sortable: true,
      render: (record) => (
        <div className="table-cell-student">
          <div className="student-name">{record.first_name} {record.last_name}</div>
          <div className="student-admission">{record.admission_number}</div>
        </div>
      )
    },
    {
      key: 'class',
      header: 'Class',
      sortable: true,
      render: (record) => record.class_name || 'N/A'
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (record) => formatDate(record.date)
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (record) => (
        <span className={getStatusBadgeClass(record.status)}>
          {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'N/A'}
        </span>
      )
    },
    {
      key: 'paymentType',
      header: 'Payment Type',
      sortable: true,
      render: (record) => record.payment_type ? record.payment_type.charAt(0).toUpperCase() + record.payment_type.slice(1) : 'N/A'
    },
    {
      key: 'paymentAmount',
      header: 'Amount',
      sortable: true,
      render: (record) => record.payment_amount || 'N/A',
      className: 'table-cell-right'
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (record) => (
        <div className="table-cell-actions">
          {onView && (
            <Button 
              variant="outline" 
              size="small" 
              onClick={() => onView(record)} 
              className="table-action-button"
            >
              View
            </Button>
          )}
          {onEdit && (
            <Button 
              variant="outline" 
              size="small" 
              onClick={() => onEdit(record)} 
              className="table-action-button"
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="danger" 
              size="small" 
              onClick={() => onDelete(record)} 
              className="table-action-button"
            >
              Delete
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      data={attendanceRecords}
      keyExtractor={(record) => record.id}
      loading={loading}
      emptyMessage="No lunch attendance records found"
      className="lunch-attendance-table"
    />
  );
}

LunchAttendanceTable.propTypes = {
  attendanceRecords: PropTypes.array.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  loading: PropTypes.bool
};

export default LunchAttendanceTable;

import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from './index.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

/**
 * StudentChargeAssignmentTable Component
 * Table component for listing student charge assignments
 * 
 * @param {Object} props - Component props
 * @param {Array} props.assignments - Array of assignment objects
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {boolean} props.loading - Loading state
 */
function StudentChargeAssignmentTable({ assignments, onEdit, onDelete, onView, loading = false }) {
  // Get payment status
  const getPaymentStatus = (assignment) => {
    if (assignment.notes && assignment.notes.toLowerCase().includes('paid')) {
      return 'Paid';
    }
    if (assignment.transaction_id || assignment.transactionId) {
      return 'Paid';
    }
    return 'Unpaid';
  };

  // Get status badge class
  const getStatusBadgeClass = (assignment) => {
    const status = getPaymentStatus(assignment);
    return status === 'Paid' ? 'badge badge-success' : 'badge badge-warning';
  };

  // Define table columns
  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      render: (assignment) => assignment.id
    },
    {
      key: 'charge',
      header: 'Charge',
      sortable: true,
      render: (assignment) => assignment.charge_name || 'N/A'
    },
    {
      key: 'student',
      header: 'Student',
      sortable: true,
      render: (assignment) => (
        <div className="table-cell-student">
          <div className="student-name">{assignment.first_name} {assignment.last_name}</div>
          <div className="student-admission">{assignment.admission_number}</div>
        </div>
      )
    },
    {
      key: 'class',
      header: 'Class',
      sortable: true,
      render: (assignment) => assignment.class_name || 'N/A'
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (assignment) => formatCurrency(assignment.amount),
      className: 'table-cell-right'
    },
    {
      key: 'assignedAt',
      header: 'Assigned At',
      sortable: true,
      render: (assignment) => formatDate(assignment.assigned_at)
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (assignment) => assignment.charge_due_date ? formatDate(assignment.charge_due_date) : 'N/A'
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (assignment) => (
        <span className={getStatusBadgeClass(assignment)}>
          {getPaymentStatus(assignment)}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (assignment) => (
        <div className="table-cell-actions">
          {onView && (
            <Button 
              variant="outline" 
              size="small" 
              onClick={() => onView(assignment)} 
              className="table-action-button"
            >
              View
            </Button>
          )}
          {onEdit && (
            <Button 
              variant="outline" 
              size="small" 
              onClick={() => onEdit(assignment)} 
              className="table-action-button"
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="danger" 
              size="small" 
              onClick={() => onDelete(assignment)} 
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
      data={assignments}
      keyExtractor={(assignment) => assignment.id}
      loading={loading}
      emptyMessage="No student charge assignments found"
      className="student-charge-assignment-table"
    />
  );
}

StudentChargeAssignmentTable.propTypes = {
  assignments: PropTypes.array.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  loading: PropTypes.bool
};

export default StudentChargeAssignmentTable;

import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from './index.js';

/**
 * StudentChargeAssignmentTable Component
 * Displays a list of student charge assignments in a table format
 * 
 * @param {Object} props - Component props
 * @param {Array} props.assignments - Array of assignment objects
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onMarkPaid - Mark as paid handler
 * @param {Function} props.onMarkUnpaid - Mark as unpaid handler
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {Function} props.onPageChange - Page change handler
 * @param {Object} props.pagination - Pagination metadata
 */
function StudentChargeAssignmentTable({
  assignments,
  loading = false,
  onMarkPaid,
  onMarkUnpaid,
  onEdit,
  onDelete,
  onView,
  onPageChange,
  pagination
}) {
  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'KES 0.00';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get payment status badge
  const getPaymentStatusBadge = (paid, paidAt) => {
    if (paid) {
      return (
        <span className="badge badge-success" title={paidAt ? `Paid on ${formatDateTime(paidAt)}` : 'Paid'}>
          Paid
        </span>
      );
    }
    return <span className="badge badge-warning">Unpaid</span>;
  };

  // Table columns
  const columns = [
    {
      key: 'id',
      header: 'ID',
      width: '60px',
      render: (row) => row.id || 'N/A'
    },
    {
      key: 'student',
      header: 'Student',
      width: '200px',
      render: (row) => {
        const studentName = row.student_name || 
          (row.student && `${row.student.last_name || ''}, ${row.student.first_name || ''}`.trim()) ||
          `${row.last_name || ''}, ${row.first_name || ''}`.trim() ||
          'N/A';
        return (
          <div>
            <div className="student-name">{studentName}</div>
            <div className="student-admission">Admission: {row.admission_number || 'N/A'}</div>
          </div>
        );
      }
    },
    {
      key: 'class',
      header: 'Class',
      width: '100px',
      render: (row) => row.class_name || (row.student && row.student.class_name) || 'N/A'
    },
    {
      key: 'charge',
      header: 'Charge',
      width: '150px',
      render: (row) => row.charge_name || (row.charge && row.charge.name) || 'N/A'
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '120px',
      render: (row) => formatCurrency(row.amount),
      align: 'right'
    },
    {
      key: 'assignedAt',
      header: 'Assigned',
      width: '100px',
      render: (row) => formatDate(row.assigned_at || row.assignedAt)
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      width: '100px',
      render: (row) => formatDate(row.due_date || row.charge?.due_date || row.charge?.dueDate)
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      width: '100px',
      render: (row) => getPaymentStatusBadge(row.paid, row.paid_at || row.paidAt)
    },
    {
      key: 'paidAt',
      header: 'Paid On',
      width: '120px',
      render: (row) => formatDateTime(row.paid_at || row.paidAt)
    },
    {
      key: 'receiptNumber',
      header: 'Receipt #',
      width: '120px',
      render: (row) => row.receipt_number || (row.transaction && row.transaction.receipt_number) || 'N/A'
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '200px',
      render: (row) => (
        <div className="action-buttons">
          {onView && (
            <Button variant="info" size="sm" onClick={() => onView(row)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(row)}>
              Edit
            </Button>
          )}
          {!row.paid && onMarkPaid && (
            <Button variant="success" size="sm" onClick={() => onMarkPaid(row)}>
              Mark Paid
            </Button>
          )}
          {row.paid && onMarkUnpaid && (
            <Button variant="warning" size="sm" onClick={() => onMarkUnpaid(row)}>
              Mark Unpaid
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
    <Table
      columns={columns}
      data={assignments || []}
      loading={loading}
      pagination={pagination}
      onPageChange={onPageChange}
      keyExtractor={(row) => row.id}
      emptyMessage={loading ? 'Loading assignments...' : 'No assignments found'}
      className="student-charge-assignment-table"
    />
  );
}

StudentChargeAssignmentTable.propTypes = {
  assignments: PropTypes.array,
  loading: PropTypes.bool,
  onMarkPaid: PropTypes.func,
  onMarkUnpaid: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onPageChange: PropTypes.func,
  pagination: PropTypes.object
};

export default StudentChargeAssignmentTable;

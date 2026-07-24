import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from './index.js';

/**
 * StudentChargeTable Component
 * Displays a list of student charges in a table format with mobile responsiveness
 * 
 * @param {Object} props - Component props
 * @param {Array} props.charges - Array of student charge objects
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {Function} props.onAssign - Assign to students handler
 * @param {Function} props.onPageChange - Page change handler
 * @param {Object} props.pagination - Pagination metadata
 */
function StudentChargeTable({
  charges,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onAssign,
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

  // Get charge type label
  const getChargeTypeLabel = (type) => {
    const types = {
      individual: 'Individual',
      all: 'All Students',
      class: 'Entire Class',
      grade: 'Grade Level',
      custom: 'Custom Group'
    };
    return types[type] || type || 'N/A';
  };

  // Get status badge variant
  const getStatusVariant = (isActive) => {
    return isActive ? 'success' : 'warning';
  };

  // Get status label
  const getStatusLabel = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
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
      key: 'name',
      header: 'Charge Name',
      width: '200px',
      render: (row) => row.name || 'N/A'
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '120px',
      render: (row) => formatCurrency(row.amount),
      align: 'right'
    },
    {
      key: 'chargeType',
      header: 'Type',
      width: '120px',
      render: (row) => getChargeTypeLabel(row.charge_type || row.chargeType)
    },
    {
      key: 'class',
      header: 'Class',
      width: '100px',
      render: (row) => row.class_name || 'N/A'
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      width: '100px',
      render: (row) => formatDate(row.due_date || row.dueDate)
    },
    {
      key: 'assignmentCount',
      header: 'Assigned',
      width: '80px',
      render: (row) => row.assignment_count || 0,
      align: 'center'
    },
    {
      key: 'totalAssigned',
      header: 'Total Assigned',
      width: '120px',
      render: (row) => formatCurrency(row.total_assigned || row.totalAssigned || 0),
      align: 'right'
    },
    {
      key: 'totalPaid',
      header: 'Total Paid',
      width: '120px',
      render: (row) => formatCurrency(row.total_paid || row.totalPaid || 0),
      align: 'right'
    },
    {
      key: 'status',
      header: 'Status',
      width: '80px',
      render: (row) => {
        const isActive = row.is_active !== false;
        return (
          <span className={`badge badge-${getStatusVariant(isActive)}`}>
            {getStatusLabel(isActive)}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '180px',
      render: (row) => (
        <div className="action-buttons">
          {onView && (
            <Button variant="info" size="sm" onClick={() => onView(row)}>
              View
            </Button>
          )}
          {onAssign && (
            <Button variant="primary" size="sm" onClick={() => onAssign(row)}>
              Assign
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
    <Table
      columns={columns}
      data={charges || []}
      loading={loading}
      pagination={pagination}
      onPageChange={onPageChange}
      keyExtractor={(row) => row.id}
      emptyMessage={loading ? 'Loading charges...' : 'No student charges found'}
      className="student-charge-table"
    />
  );
}

StudentChargeTable.propTypes = {
  charges: PropTypes.array,
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onAssign: PropTypes.func,
  onPageChange: PropTypes.func,
  pagination: PropTypes.object
};

export default StudentChargeTable;

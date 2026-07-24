import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from './index.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

/**
 * StudentChargeTable Component
 * Table component for listing student charges
 * 
 * @param {Object} props - Component props
 * @param {Array} props.charges - Array of student charge objects
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {boolean} props.loading - Loading state
 */
function StudentChargeTable({ charges, onEdit, onDelete, onView, loading = false }) {
  // Get charge type display name
  const getChargeTypeDisplay = (type) => {
    if (!type) return 'N/A';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get status badge class
  const getStatusBadgeClass = (isActive) => {
    return isActive ? 'badge badge-success' : 'badge badge-secondary';
  };

  // Define table columns
  const columns = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      render: (charge) => charge.id
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (charge) => charge.name
    },
    {
      key: 'chargeType',
      header: 'Type',
      sortable: true,
      render: (charge) => getChargeTypeDisplay(charge.charge_type || charge.chargeType)
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (charge) => formatCurrency(charge.amount),
      className: 'table-cell-right'
    },
    {
      key: 'class',
      header: 'Class',
      sortable: true,
      render: (charge) => charge.class_name || 'All'
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (charge) => charge.due_date ? formatDate(charge.due_date) : 'N/A'
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (charge) => (
        <span className={getStatusBadgeClass(charge.is_active !== undefined ? charge.is_active : true)}>
          {charge.is_active !== undefined ? (charge.is_active ? 'Active' : 'Inactive') : 'Active'}
        </span>
      )
    },
    {
      key: 'assignedCount',
      header: 'Assigned',
      sortable: true,
      render: (charge) => charge.assigned_student_count || 0,
      className: 'table-cell-right'
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (charge) => (
        <div className="table-cell-actions">
          {onView && (
            <Button 
              variant="outline" 
              size="small" 
              onClick={() => onView(charge)} 
              className="table-action-button"
            >
              View
            </Button>
          )}
          {onEdit && (
            <Button 
              variant="outline" 
              size="small" 
              onClick={() => onEdit(charge)} 
              className="table-action-button"
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="danger" 
              size="small" 
              onClick={() => onDelete(charge)} 
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
      data={charges}
      keyExtractor={(charge) => charge.id}
      loading={loading}
      emptyMessage="No student charges found"
      className="student-charge-table"
    />
  );
}

StudentChargeTable.propTypes = {
  charges: PropTypes.array.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  loading: PropTypes.bool
};

export default StudentChargeTable;

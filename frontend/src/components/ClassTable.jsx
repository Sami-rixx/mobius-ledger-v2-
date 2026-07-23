import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from './index.js';

/**
 * ClassTable Component
 * Displays a list of classes in a table format with mobile responsiveness
 * 
 * @param {Object} props - Component props
 * @param {Array} props.classes - Array of class objects
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {Function} props.onPageChange - Page change handler
 * @param {Object} props.pagination - Pagination metadata
 */
function ClassTable({
  classes,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onPageChange,
  pagination
}) {
  // Format student count display
  const formatStudentCount = (count) => {
    if (count === undefined || count === null) return 'N/A';
    return count === 1 ? '1 student' : `${count} students`;
  };

  // Table columns
  const columns = [
    {
      key: 'name',
      header: 'Class Name',
      width: '200px',
      render: (row) => row.name || 'N/A'
    },
    {
      key: 'description',
      header: 'Description',
      width: '250px',
      render: (row) => row.description || 'No description'
    },
    {
      key: 'student_count',
      header: 'Students',
      width: '100px',
      render: (row) => formatStudentCount(row.student_count)
    },
    {
      key: 'is_active',
      header: 'Status',
      width: '100px',
      render: (row) => {
        const isActive = row.is_active !== undefined ? row.is_active : true;
        return (
          <span className={`badge badge-${isActive ? 'success' : 'warning'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      }
    },
    {
      key: 'created_at',
      header: 'Created',
      width: '120px',
      render: (row) => {
        if (!row.created_at) return 'N/A';
        return new Date(row.created_at).toLocaleDateString();
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
    <div className="class-table">
      <Table
        columns={columns}
        data={classes || []}
        emptyMessage={loading ? 'Loading classes...' : 'No classes found'}
      />

      {pagination && onPageChange && (
        <div className="pagination-controls">
          <div className="pagination-info">
            Showing {pagination.page} of {pagination.totalPages} pages ({pagination.total} classes)
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

ClassTable.propTypes = {
  classes: PropTypes.array,
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onPageChange: PropTypes.func,
  pagination: PropTypes.object
};

export default ClassTable;

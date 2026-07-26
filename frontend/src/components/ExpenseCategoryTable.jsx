import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from './index.js';

/**
 * ExpenseCategoryTable Component
 * Displays a list of expense category records in a table format with hierarchical display
 * 
 * @param {Object} props - Component props
 * @param {Array} props.categories - Array of category objects
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {Function} props.onPageChange - Page change handler
 * @param {Object} props.pagination - Pagination metadata
 */
function ExpenseCategoryTable({
  categories,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onPageChange,
  pagination
}) {
  // Get status badges for a category
  const getStatusBadges = (category) => {
    const badges = [];
    
    if (category.is_active) {
      badges.push(<span key="active" className="badge badge-success">Active</span>);
    } else {
      badges.push(<span key="inactive" className="badge badge-secondary">Inactive</span>);
    }
    
    if (category.is_system) {
      badges.push(<span key="system" className="badge badge-info">System</span>);
    }
    
    if (category.is_kitchen) {
      badges.push(<span key="kitchen" className="badge badge-warning">Kitchen</span>);
    }
    
    return badges;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get parent display
  const getParentDisplay = (category) => {
    if (!category.parent_id) return 'Root';
    if (category.parent_name) return category.parent_name;
    return `Category #${category.parent_id}`;
  };

  // Table columns
  const columns = [
    {
      key: 'id',
      header: 'ID',
      width: '60px',
      render: (row) => row.id
    },
    {
      key: 'name',
      header: 'Name',
      width: '200px',
      render: (row) => row.name || 'N/A'
    },
    {
      key: 'parent',
      header: 'Parent',
      width: '150px',
      render: (row) => getParentDisplay(row)
    },
    {
      key: 'description',
      header: 'Description',
      width: '250px',
      render: (row) => row.description || 'N/A'
    },
    {
      key: 'expense_count',
      header: 'Expenses',
      width: '80px',
      render: (row) => row.expense_count !== undefined ? row.expense_count : '0'
    },
    {
      key: 'status',
      header: 'Status',
      width: '150px',
      render: (row) => (
        <div className="badge-container">
          {getStatusBadges(row)}
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      width: '100px',
      render: (row) => formatDate(row.created_at)
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
          {onDelete && !row.is_system && (
            <Button variant="danger" size="sm" onClick={() => onDelete(row)}>
              Delete
            </Button>
          )}
          {onDelete && row.is_system && (
            <Button variant="danger" size="sm" disabled title="Cannot delete system category">
              Delete
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="expense-category-table">
      <Table
        columns={columns}
        data={categories || []}
        emptyMessage={loading ? 'Loading categories...' : 'No expense categories found'}
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

ExpenseCategoryTable.propTypes = {
  categories: PropTypes.array,
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onPageChange: PropTypes.func,
  pagination: PropTypes.object
};

export default ExpenseCategoryTable;

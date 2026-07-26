import React from 'react';
import PropTypes from 'prop-types';
import { Table, Button } from './index.js';

/**
 * IncomeCategoryTable Component
 * Displays a list of income categories in a table format with mobile responsiveness
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
function IncomeCategoryTable({
  categories,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onPageChange,
  pagination
}) {
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge class
  const getStatusClass = (isActive) => {
    return isActive ? 'success' : 'warning';
  };

  // Get status text
  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  // Display color swatch
  const displayColorSwatch = (color) => {
    const displayColor = color || '#8B4513';
    return (
      <span 
        className="color-swatch" 
        style={{ backgroundColor: displayColor }}
        title={displayColor}
      >
        &nbsp;
      </span>
    );
  };

  // Table columns
  const columns = [
    {
      key: 'name',
      header: 'Category Name',
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
      key: 'color',
      header: 'Color',
      width: '80px',
      render: (row) => displayColorSwatch(row.color)
    },
    {
      key: 'icon',
      header: 'Icon',
      width: '100px',
      render: (row) => row.icon || 'N/A'
    },
    {
      key: 'is_active',
      header: 'Status',
      width: '100px',
      render: (row) => {
        const isActive = row.is_active !== undefined ? row.is_active : true;
        return (
          <span className={`badge badge-${getStatusClass(isActive)}`}>
            {getStatusText(isActive)}
          </span>
        );
      }
    },
    {
      key: 'usage_count',
      header: 'Income Records',
      width: '100px',
      render: (row) => row.usage_count !== undefined ? row.usage_count : '0'
    },
    {
      key: 'created_at',
      header: 'Created',
      width: '120px',
      render: (row) => {
        if (!row.created_at) return 'N/A';
        return formatDate(row.created_at);
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
    <div className="income-category-table">
      <Table
        columns={columns}
        data={categories || []}
        emptyMessage={loading ? 'Loading categories...' : 'No categories found'}
      />

      {pagination && onPageChange && (
        <div className="pagination-controls">
          <div className="pagination-info">
            Showing {pagination.page} of {pagination.totalPages} pages ({pagination.total} categories)
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

IncomeCategoryTable.propTypes = {
  categories: PropTypes.array,
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onPageChange: PropTypes.func,
  pagination: PropTypes.object
};

export default IncomeCategoryTable;

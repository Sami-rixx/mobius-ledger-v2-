import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PermissionCard, Pagination, Spinner, Alert } from './index.js';
import { getPermissions, deletePermission } from '../services/permissionService.js';

/**
 * PermissionList Component
 * Displays a list of permissions with loading, error, and empty states
 * 
 * @param {Object} props - Component props
 * @param {string} props.module - Filter by module
 * @param {string} props.search - Search term
 * @param {boolean} props.isActive - Filter by active status
 * @param {number} props.pageSize - Items per page
 * @param {boolean} props.showPagination - Whether to show pagination
 * @param {Function} props.onPermissionClick - Permission click handler
 */
function PermissionList({
  module,
  search,
  isActive,
  pageSize = 10,
  showPagination = true,
  onPermissionClick
}) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch permissions
  const fetchPermissions = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        pageSize,
        module,
        search,
        isActive
      };
      
      const result = await getPermissions(params);
      setPermissions(result.data || []);
      setPagination(result.pagination || null);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message || 'Failed to load permissions');
      setPermissions([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPermissions(1);
  }, [module, search, isActive, pageSize]);

  // Handle page change
  const handlePageChange = (page) => {
    fetchPermissions(page);
  };

  // Handle delete
  const handleDelete = async (permission) => {
    try {
      if (window.confirm(`Are you sure you want to delete permission "${permission.name}"? This action cannot be undone.`)) {
        await deletePermission(permission.id);
        fetchPermissions(currentPage);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete permission');
    }
  };

  // Handle click
  const handlePermissionClick = (permission) => {
    if (onPermissionClick) {
      onPermissionClick(permission);
    }
  };

  // Render loading state
  if (loading) {
    return <Spinner text="Loading permissions..." />;
  }

  // Render error state
  if (error) {
    return <Alert type="error" message={error} onClose={() => setError(null)} />;
  }

  // Render empty state
  if (permissions.length === 0) {
    return (
      <Alert type="info" message="No permissions found" />
    );
  }

  // Render list
  return (
    <div className="permission-list">
      <div className="permission-list__grid">
        {permissions.map((permission) => (
          <div key={permission.id} className="permission-list__item">
            <PermissionCard
              permission={permission}
              showActions={true}
              onView={handlePermissionClick}
              onEdit={handlePermissionClick}
              onDelete={handleDelete}
            />
          </div>
        ))}
      </div>
      
      {showPagination && pagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages || 1}
          totalItems={pagination.total || 0}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

PermissionList.propTypes = {
  module: PropTypes.string,
  search: PropTypes.string,
  isActive: PropTypes.bool,
  pageSize: PropTypes.number,
  showPagination: PropTypes.bool,
  onPermissionClick: PropTypes.func
};

export default PermissionList;

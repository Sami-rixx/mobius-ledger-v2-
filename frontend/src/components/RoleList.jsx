import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { RoleCard, Pagination, Spinner, Alert } from './index.js';
import { getRoles, deleteRole } from '../services/roleService.js';

/**
 * RoleList Component
 * Displays a list of roles with loading, error, and empty states
 * 
 * @param {Object} props - Component props
 * @param {string} props.search - Search term
 * @param {boolean} props.isDefault - Filter by default status
 * @param {boolean} props.isActive - Filter by active status
 * @param {number} props.pageSize - Items per page
 * @param {boolean} props.showPagination - Whether to show pagination
 * @param {Function} props.onRoleClick - Role click handler
 */
function RoleList({
  search,
  isDefault,
  isActive,
  pageSize = 10,
  showPagination = true,
  onRoleClick
}) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch roles
  const fetchRoles = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        pageSize,
        search,
        isDefault,
        isActive
      };
      
      const result = await getRoles(params);
      setRoles(result.data || []);
      setPagination(result.pagination || null);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message || 'Failed to load roles');
      setRoles([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchRoles(1);
  }, [search, isDefault, isActive, pageSize]);

  // Handle page change
  const handlePageChange = (page) => {
    fetchRoles(page);
  };

  // Handle delete
  const handleDelete = async (role) => {
    try {
      if (window.confirm(`Are you sure you want to delete role "${role.name}"? This action cannot be undone.`)) {
        await deleteRole(role.id);
        fetchRoles(currentPage);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete role');
    }
  };

  // Handle click
  const handleRoleClick = (role) => {
    if (onRoleClick) {
      onRoleClick(role);
    }
  };

  // Render loading state
  if (loading) {
    return <Spinner text="Loading roles..." />;
  }

  // Render error state
  if (error) {
    return <Alert type="error" message={error} onClose={() => setError(null)} />;
  }

  // Render empty state
  if (roles.length === 0) {
    return (
      <Alert type="info" message="No roles found" />
    );
  }

  // Render list
  return (
    <div className="role-list">
      <div className="role-list__grid">
        {roles.map((role) => (
          <div key={role.id} className="role-list__item">
            <RoleCard
              role={role}
              showActions={true}
              onView={handleRoleClick}
              onEdit={handleRoleClick}
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

RoleList.propTypes = {
  search: PropTypes.string,
  isDefault: PropTypes.bool,
  isActive: PropTypes.bool,
  pageSize: PropTypes.number,
  showPagination: PropTypes.bool,
  onRoleClick: PropTypes.func
};

export default RoleList;

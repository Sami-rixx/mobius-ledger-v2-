import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { RolePermissionCard, Pagination, Spinner, Alert } from './index.js';
import { getRolePermissions, removePermissionFromRole } from '../services/rolePermissionService.js';
import { getRoleById } from '../services/roleService.js';
import { getPermissionById } from '../services/permissionService.js';

/**
 * RolePermissionList Component
 * Displays a list of role-permission assignments with loading, error, and empty states
 * 
 * @param {Object} props - Component props
 * @param {number} props.roleId - Filter by role ID
 * @param {number} props.permissionId - Filter by permission ID
 * @param {number} props.pageSize - Items per page
 * @param {boolean} props.showPagination - Whether to show pagination
 * @param {boolean} props.loadDetails - Whether to load role and permission details
 * @param {Function} props.onRolePermissionClick - Role-permission click handler
 */
function RolePermissionList({
  roleId,
  permissionId,
  pageSize = 10,
  showPagination = true,
  loadDetails = true,
  onRolePermissionClick
}) {
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rolesMap, setRolesMap] = useState({});
  const [permissionsMap, setPermissionsMap] = useState({});

  // Load role and permission details
  const loadDetailsData = async (rolePermissionsList) => {
    if (!loadDetails || rolePermissionsList.length === 0) {
      return {};
    }

    const uniqueRoleIds = [...new Set(rolePermissionsList.map(rp => rp.role_id))];
    const uniquePermissionIds = [...new Set(rolePermissionsList.map(rp => rp.permission_id))];

    try {
      const rolesPromises = uniqueRoleIds.map(id => getRoleById(id).catch(() => null));
      const permissionsPromises = uniquePermissionIds.map(id => getPermissionById(id).catch(() => null));

      const roles = (await Promise.all(rolesPromises)).filter(Boolean);
      const permissions = (await Promise.all(permissionsPromises)).filter(Boolean);

      const rolesMap = {};
      roles.forEach(role => {
        rolesMap[role.id] = role;
      });

      const permissionsMap = {};
      permissions.forEach(permission => {
        permissionsMap[permission.id] = permission;
      });

      return { rolesMap, permissionsMap };
    } catch (err) {
      console.error('Error loading details:', err);
      return { rolesMap: {}, permissionsMap: {} };
    }
  };

  // Fetch role-permissions
  const fetchRolePermissions = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        pageSize,
        roleId,
        permissionId
      };
      
      const result = await getRolePermissions(params);
      const rolePermissionsList = result.data || [];
      setRolePermissions(rolePermissionsList);
      setPagination(result.pagination || null);
      setCurrentPage(page);

      // Load details if requested
      if (loadDetails) {
        const { rolesMap, permissionsMap } = await loadDetailsData(rolePermissionsList);
        setRolesMap(rolesMap);
        setPermissionsMap(permissionsMap);
      }
    } catch (err) {
      setError(err.message || 'Failed to load role-permissions');
      setRolePermissions([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchRolePermissions(1);
  }, [roleId, permissionId, pageSize, loadDetails]);

  // Handle page change
  const handlePageChange = (page) => {
    fetchRolePermissions(page);
  };

  // Handle remove
  const handleRemove = async (rolePermission) => {
    try {
      if (window.confirm(`Are you sure you want to remove permission #${rolePermission.permission_id} from role #${rolePermission.role_id}?`)) {
        await removePermissionFromRole(rolePermission.role_id, rolePermission.permission_id);
        fetchRolePermissions(currentPage);
      }
    } catch (err) {
      setError(err.message || 'Failed to remove role-permission');
    }
  };

  // Handle click
  const handleRolePermissionClick = (rolePermission) => {
    if (onRolePermissionClick) {
      onRolePermissionClick(rolePermission);
    }
  };

  // Render loading state
  if (loading) {
    return <Spinner text="Loading role-permission assignments..." />;
  }

  // Render error state
  if (error) {
    return <Alert type="error" message={error} onClose={() => setError(null)} />;
  }

  // Render empty state
  if (rolePermissions.length === 0) {
    return (
      <Alert type="info" message="No role-permission assignments found" />
    );
  }

  // Render list
  return (
    <div className="role-permission-list">
      <div className="role-permission-list__grid">
        {rolePermissions.map((rolePermission) => (
          <div key={rolePermission.id} className="role-permission-list__item">
            <RolePermissionCard
              rolePermission={rolePermission}
              role={rolesMap[rolePermission.role_id]}
              permission={permissionsMap[rolePermission.permission_id]}
              showActions={true}
              onView={handleRolePermissionClick}
              onRemove={handleRemove}
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

RolePermissionList.propTypes = {
  roleId: PropTypes.number,
  permissionId: PropTypes.number,
  pageSize: PropTypes.number,
  showPagination: PropTypes.bool,
  loadDetails: PropTypes.bool,
  onRolePermissionClick: PropTypes.func
};

export default RolePermissionList;

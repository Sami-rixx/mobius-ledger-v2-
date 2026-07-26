import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { UserRoleCard, Pagination, Spinner, Alert } from './index.js';
import { getUserRoles, removeRoleFromUser } from '../services/userRoleService.js';
import { getUserById } from '../services/userService.js';
import { getRoleById } from '../services/roleService.js';

/**
 * UserRoleList Component
 * Displays a list of user-role assignments with loading, error, and empty states
 * 
 * @param {Object} props - Component props
 * @param {number} props.userId - Filter by user ID
 * @param {number} props.roleId - Filter by role ID
 * @param {number} props.pageSize - Items per page
 * @param {boolean} props.showPagination - Whether to show pagination
 * @param {boolean} props.loadDetails - Whether to load user and role details
 * @param {Function} props.onUserRoleClick - User-role click handler
 */
function UserRoleList({
  userId,
  roleId,
  pageSize = 10,
  showPagination = true,
  loadDetails = true,
  onUserRoleClick
}) {
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersMap, setUsersMap] = useState({});
  const [rolesMap, setRolesMap] = useState({});

  // Load user and role details
  const loadDetailsData = async (userRolesList) => {
    if (!loadDetails || userRolesList.length === 0) {
      return {};
    }

    const uniqueUserIds = [...new Set(userRolesList.map(ur => ur.user_id))];
    const uniqueRoleIds = [...new Set(userRolesList.map(ur => ur.role_id))];

    try {
      const usersPromises = uniqueUserIds.map(id => getUserById(id).catch(() => null));
      const rolesPromises = uniqueRoleIds.map(id => getRoleById(id).catch(() => null));

      const users = (await Promise.all(usersPromises)).filter(Boolean);
      const roles = (await Promise.all(rolesPromises)).filter(Boolean);

      const usersMap = {};
      users.forEach(user => {
        usersMap[user.id] = user;
      });

      const rolesMap = {};
      roles.forEach(role => {
        rolesMap[role.id] = role;
      });

      return { usersMap, rolesMap };
    } catch (err) {
      console.error('Error loading details:', err);
      return { usersMap: {}, rolesMap: {} };
    }
  };

  // Fetch user-roles
  const fetchUserRoles = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        pageSize,
        userId,
        roleId
      };
      
      const result = await getUserRoles(params);
      const userRolesList = result.data || [];
      setUserRoles(userRolesList);
      setPagination(result.pagination || null);
      setCurrentPage(page);

      // Load details if requested
      if (loadDetails) {
        const { usersMap, rolesMap } = await loadDetailsData(userRolesList);
        setUsersMap(usersMap);
        setRolesMap(rolesMap);
      }
    } catch (err) {
      setError(err.message || 'Failed to load user-roles');
      setUserRoles([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUserRoles(1);
  }, [userId, roleId, pageSize, loadDetails]);

  // Handle page change
  const handlePageChange = (page) => {
    fetchUserRoles(page);
  };

  // Handle remove
  const handleRemove = async (userRole) => {
    try {
      if (window.confirm(`Are you sure you want to remove role #${userRole.role_id} from user #${userRole.user_id}?`)) {
        await removeRoleFromUser(userRole.user_id, userRole.role_id);
        fetchUserRoles(currentPage);
      }
    } catch (err) {
      setError(err.message || 'Failed to remove user-role');
    }
  };

  // Handle click
  const handleUserRoleClick = (userRole) => {
    if (onUserRoleClick) {
      onUserRoleClick(userRole);
    }
  };

  // Render loading state
  if (loading) {
    return <Spinner text="Loading user-role assignments..." />;
  }

  // Render error state
  if (error) {
    return <Alert type="error" message={error} onClose={() => setError(null)} />;
  }

  // Render empty state
  if (userRoles.length === 0) {
    return (
      <Alert type="info" message="No user-role assignments found" />
    );
  }

  // Render list
  return (
    <div className="user-role-list">
      <div className="user-role-list__grid">
        {userRoles.map((userRole) => (
          <div key={userRole.id} className="user-role-list__item">
            <UserRoleCard
              userRole={userRole}
              user={usersMap[userRole.user_id]}
              role={rolesMap[userRole.role_id]}
              showActions={true}
              onView={handleUserRoleClick}
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

UserRoleList.propTypes = {
  userId: PropTypes.number,
  roleId: PropTypes.number,
  pageSize: PropTypes.number,
  showPagination: PropTypes.bool,
  loadDetails: PropTypes.bool,
  onUserRoleClick: PropTypes.func
};

export default UserRoleList;

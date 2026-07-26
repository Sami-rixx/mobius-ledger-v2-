import React from 'react';
import PropTypes from 'prop-types';
import { Card, Badge, Button } from './index.js';

/**
 * UserRoleCard Component
 * Displays user-role assignment information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.userRole - User-role assignment data
 * @param {Object} props.user - User data (optional)
 * @param {Object} props.role - Role data (optional)
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onRemove - Remove handler
 * @param {Function} props.onView - View handler
 */
function UserRoleCard({
  userRole,
  user,
  role,
  showActions = true,
  onRemove,
  onView
}) {
  if (!userRole) {
    return null;
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Get user display name
  const getUserDisplay = () => {
    if (user) {
      return user.full_name || `User #${user.id}`;
    }
    return `User #${userRole.user_id}`;
  };

  // Get role display name
  const getRoleDisplay = () => {
    if (role) {
      return role.name || `Role #${role.id}`;
    }
    return `Role #${userRole.role_id}`;
  };

  return (
    <Card
      title={`Assignment #${userRole.id}`}
      subtitle={`${getUserDisplay()} - ${getRoleDisplay()}`}
      className="user-role-card"
    >
      <div className="user-role-card__content">
        {/* User ID */}
        <div className="user-role-card__item">
          <span className="user-role-card__label">User ID:</span>
          <span className="user-role-card__value">#{userRole.user_id}</span>
        </div>

        {/* Role ID */}
        <div className="user-role-card__item">
          <span className="user-role-card__label">Role ID:</span>
          <span className="user-role-card__value">#{userRole.role_id}</span>
        </div>

        {/* User Details */}
        {user && (
          <>
            <div className="user-role-card__item">
              <span className="user-role-card__label">Username:</span>
              <span className="user-role-card__value">{user.username || 'N/A'}</span>
            </div>
            <div className="user-role-card__item">
              <span className="user-role-card__label">User Role:</span>
              <span className="user-role-card__value">{user.role || 'N/A'}</span>
            </div>
          </>
        )}

        {/* Role Details */}
        {role && (
          <>
            <div className="user-role-card__item">
              <span className="user-role-card__label">Role Name:</span>
              <span className="user-role-card__value">{role.name}</span>
            </div>
            <div className="user-role-card__item">
              <span className="user-role-card__label">Role Description:</span>
              <span className="user-role-card__value">{role.description || 'N/A'}</span>
            </div>
            {role.is_default && (
              <div className="user-role-card__item">
                <span className="user-role-card__label">Status:</span>
                <span className="user-role-card__value"><Badge type="primary">Default Role</Badge></span>
              </div>
            )}
          </>
        )}

        {/* Created At */}
        <div className="user-role-card__item">
          <span className="user-role-card__label">Assigned:</span>
          <span className="user-role-card__value">{formatDate(userRole.created_at)}</span>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="user-role-card__actions">
            {onView && (
              <Button size="small" variant="info" onClick={() => onView(userRole)}>
                View
              </Button>
            )}
            {onRemove && (
              <Button size="small" variant="danger" onClick={() => onRemove(userRole)}>
                Remove
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

UserRoleCard.propTypes = {
  userRole: PropTypes.shape({
    id: PropTypes.number.isRequired,
    user_id: PropTypes.number.isRequired,
    role_id: PropTypes.number.isRequired,
    created_at: PropTypes.string
  }).isRequired,
  user: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
    full_name: PropTypes.string,
    role: PropTypes.string
  }),
  role: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    description: PropTypes.string,
    is_default: PropTypes.oneOfType([PropTypes.number, PropTypes.bool])
  }),
  showActions: PropTypes.bool,
  onRemove: PropTypes.func,
  onView: PropTypes.func
};

export default UserRoleCard;

import React from 'react';
import PropTypes from 'prop-types';
import { Card, Badge, Button } from './index.js';

/**
 * RolePermissionCard Component
 * Displays role-permission assignment information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.rolePermission - Role-permission assignment data
 * @param {Object} props.role - Role data (optional)
 * @param {Object} props.permission - Permission data (optional)
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onRemove - Remove handler
 * @param {Function} props.onView - View handler
 */
function RolePermissionCard({
  rolePermission,
  role,
  permission,
  showActions = true,
  onRemove,
  onView
}) {
  if (!rolePermission) {
    return null;
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Get role display name
  const getRoleDisplay = () => {
    if (role) {
      return role.name || `Role #${role.id}`;
    }
    return `Role #${rolePermission.role_id}`;
  };

  // Get permission display name
  const getPermissionDisplay = () => {
    if (permission) {
      return `${permission.name} (${permission.module})` || `Permission #${permission.id}`;
    }
    return `Permission #${rolePermission.permission_id}`;
  };

  return (
    <Card
      title={`Assignment #${rolePermission.id}`}
      subtitle={`${getRoleDisplay()} - ${getPermissionDisplay()}`}
      className="role-permission-card"
    >
      <div className="role-permission-card__content">
        {/* Role ID */}
        <div className="role-permission-card__item">
          <span className="role-permission-card__label">Role ID:</span>
          <span className="role-permission-card__value">#{rolePermission.role_id}</span>
        </div>

        {/* Permission ID */}
        <div className="role-permission-card__item">
          <span className="role-permission-card__label">Permission ID:</span>
          <span className="role-permission-card__value">#{rolePermission.permission_id}</span>
        </div>

        {/* Role Details */}
        {role && (
          <>
            <div className="role-permission-card__item">
              <span className="role-permission-card__label">Role Name:</span>
              <span className="role-permission-card__value">{role.name}</span>
            </div>
            {role.description && (
              <div className="role-permission-card__item">
                <span className="role-permission-card__label">Role Description:</span>
                <span className="role-permission-card__value">{role.description}</span>
              </div>
            )}
            {role.is_default && (
              <div className="role-permission-card__item">
                <span className="role-permission-card__label">Status:</span>
                <span className="role-permission-card__value"><Badge type="primary">Default Role</Badge></span>
              </div>
            )}
          </>
        )}

        {/* Permission Details */}
        {permission && (
          <>
            <div className="role-permission-card__item">
              <span className="role-permission-card__label">Permission Name:</span>
              <span className="role-permission-card__value">{permission.name}</span>
            </div>
            <div className="role-permission-card__item">
              <span className="role-permission-card__label">Module:</span>
              <span className="role-permission-card__value">{permission.module}</span>
            </div>
            {permission.description && (
              <div className="role-permission-card__item">
                <span className="role-permission-card__label">Description:</span>
                <span className="role-permission-card__value">{permission.description}</span>
              </div>
            )}
            <div className="role-permission-card__item">
              <span className="role-permission-card__label">Permission Status:</span>
              <span className="role-permission-card__value">
                {permission.is_active === 1 || permission.is_active === true ? (
                  <Badge type="success">Active</Badge>
                ) : (
                  <Badge type="danger">Inactive</Badge>
                )}
              </span>
            </div>
          </>
        )}

        {/* Created At */}
        <div className="role-permission-card__item">
          <span className="role-permission-card__label">Assigned:</span>
          <span className="role-permission-card__value">{formatDate(rolePermission.created_at)}</span>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="role-permission-card__actions">
            {onView && (
              <Button size="small" variant="info" onClick={() => onView(rolePermission)}>
                View
              </Button>
            )}
            {onRemove && (
              <Button size="small" variant="danger" onClick={() => onRemove(rolePermission)}>
                Remove
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

RolePermissionCard.propTypes = {
  rolePermission: PropTypes.shape({
    id: PropTypes.number.isRequired,
    role_id: PropTypes.number.isRequired,
    permission_id: PropTypes.number.isRequired,
    created_at: PropTypes.string
  }).isRequired,
  role: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    description: PropTypes.string,
    is_default: PropTypes.oneOfType([PropTypes.number, PropTypes.bool])
  }),
  permission: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    description: PropTypes.string,
    module: PropTypes.string,
    is_active: PropTypes.oneOfType([PropTypes.number, PropTypes.bool])
  }),
  showActions: PropTypes.bool,
  onRemove: PropTypes.func,
  onView: PropTypes.func
};

export default RolePermissionCard;

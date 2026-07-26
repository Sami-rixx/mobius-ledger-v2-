import React from 'react';
import PropTypes from 'prop-types';
import { Card, Badge, Button } from './index.js';

/**
 * PermissionCard Component
 * Displays permission information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.permission - Permission data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 */
function PermissionCard({
  permission,
  showActions = true,
  onEdit,
  onDelete,
  onView
}) {
  if (!permission) {
    return null;
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Truncate long text
  const truncate = (text, maxLength = 100) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  // Get status badge
  const getStatusBadge = () => {
    if (permission.is_active === 1 || permission.is_active === true) {
      return <Badge type="success">Active</Badge>;
    }
    return <Badge type="danger">Inactive</Badge>;
  };

  return (
    <Card
      title={`Permission: ${permission.name}`}
      subtitle={`Module: ${permission.module}`}
      className="permission-card"
    >
      <div className="permission-card__content">
        {/* Status */}
        <div className="permission-card__item">
          <span className="permission-card__label">Status:</span>
          <span className="permission-card__value">{getStatusBadge()}</span>
        </div>

        {/* ID */}
        <div className="permission-card__item">
          <span className="permission-card__label">ID:</span>
          <span className="permission-card__value">#{permission.id}</span>
        </div>

        {/* Description */}
        <div className="permission-card__item">
          <span className="permission-card__label">Description:</span>
          <span className="permission-card__value">{truncate(permission.description)}</span>
        </div>

        {/* Module */}
        <div className="permission-card__item">
          <span className="permission-card__label">Module:</span>
          <span className="permission-card__value">{permission.module}</span>
        </div>

        {/* Created At */}
        <div className="permission-card__item">
          <span className="permission-card__label">Created:</span>
          <span className="permission-card__value">{formatDate(permission.created_at)}</span>
        </div>

        {/* Updated At */}
        <div className="permission-card__item">
          <span className="permission-card__label">Updated:</span>
          <span className="permission-card__value">{formatDate(permission.updated_at)}</span>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="permission-card__actions">
            {onView && (
              <Button size="small" variant="info" onClick={() => onView(permission)}>
                View
              </Button>
            )}
            {onEdit && (
              <Button size="small" variant="primary" onClick={() => onEdit(permission)}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button size="small" variant="danger" onClick={() => onDelete(permission)}>
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

PermissionCard.propTypes = {
  permission: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    module: PropTypes.string.isRequired,
    is_active: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]).isRequired,
    created_at: PropTypes.string,
    updated_at: PropTypes.string
  }).isRequired,
  showActions: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func
};

export default PermissionCard;

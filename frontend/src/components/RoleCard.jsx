import React from 'react';
import PropTypes from 'prop-types';
import { Card, Badge, Button } from './index.js';

/**
 * RoleCard Component
 * Displays role information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.role - Role data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 */
function RoleCard({
  role,
  showActions = true,
  onEdit,
  onDelete,
  onView
}) {
  if (!role) {
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
    if (role.is_active === 1 || role.is_active === true) {
      return <Badge type="success">Active</Badge>;
    }
    return <Badge type="danger">Inactive</Badge>;
  };

  // Get default badge
  const getDefaultBadge = () => {
    if (role.is_default === 1 || role.is_default === true) {
      return <Badge type="primary">Default</Badge>;
    }
    return null;
  };

  return (
    <Card
      title={`Role: ${role.name}`}
      subtitle={truncate(role.description)}
      className="role-card"
    >
      <div className="role-card__content">
        {/* Status and Default */}
        <div className="role-card__item">
          <span className="role-card__label">Status:</span>
          <span className="role-card__value">
            {getStatusBadge()}
            {getDefaultBadge() && <span style={{ marginLeft: '8px' }}>{getDefaultBadge()}</span>}
          </span>
        </div>

        {/* ID */}
        <div className="role-card__item">
          <span className="role-card__label">ID:</span>
          <span className="role-card__value">#{role.id}</span>
        </div>

        {/* Description */}
        {role.description && (
          <div className="role-card__item">
            <span className="role-card__label">Description:</span>
            <span className="role-card__value">{truncate(role.description, 200)}</span>
          </div>
        )}

        {/* Created At */}
        <div className="role-card__item">
          <span className="role-card__label">Created:</span>
          <span className="role-card__value">{formatDate(role.created_at)}</span>
        </div>

        {/* Updated At */}
        <div className="role-card__item">
          <span className="role-card__label">Updated:</span>
          <span className="role-card__value">{formatDate(role.updated_at)}</span>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="role-card__actions">
            {onView && (
              <Button size="small" variant="info" onClick={() => onView(role)}>
                View
              </Button>
            )}
            {onEdit && (
              <Button size="small" variant="primary" onClick={() => onEdit(role)}>
                Edit
              </Button>
            )}
            {onDelete && !role.is_default && (
              <Button size="small" variant="danger" onClick={() => onDelete(role)}>
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

RoleCard.propTypes = {
  role: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    is_default: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
    is_active: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]).isRequired,
    created_at: PropTypes.string,
    updated_at: PropTypes.string
  }).isRequired,
  showActions: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func
};

export default RoleCard;

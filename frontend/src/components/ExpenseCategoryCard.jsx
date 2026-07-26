import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from './index.js';

/**
 * ExpenseCategoryCard Component
 * Displays expense category information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.category - Category data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 */
function ExpenseCategoryCard({ category, showActions = true, onEdit, onDelete, onView }) {
  if (!category) {
    return null;
  }

  // Get status badges
  const getStatusBadges = () => {
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

  // Get parent name
  const getParentName = () => {
    if (!category.parent_id) return 'Root Category';
    return `Child of Category #${category.parent_id}`;
  };

  return (
    <Card
      title={category.name || 'Unknown Category'}
      subtitle={getParentName()}
      className="expense-category-card"
    >
      <div className="category-info">
        <div className="category-detail">
          {/* Status Badges */}
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className="detail-value">
              {getStatusBadges()}
            </span>
          </div>

          {/* Category ID */}
          <div className="detail-row">
            <span className="detail-label">ID:</span>
            <span className="detail-value">#{category.id}</span>
          </div>

          {category.parent_name && (
            <div className="detail-row">
              <span className="detail-label">Parent:</span>
              <span className="detail-value">{category.parent_name}</span>
            </div>
          )}

          {category.expense_count !== undefined && (
            <div className="detail-row">
              <span className="detail-label">Expenses:</span>
              <span className="detail-value">{category.expense_count}</span>
            </div>
          )}

          {category.created_at && (
            <div className="detail-row">
              <span className="detail-label">Created:</span>
              <span className="detail-value">{new Date(category.created_at).toLocaleDateString()}</span>
            </div>
          )}

          {category.updated_at && (
            <div className="detail-row">
              <span className="detail-label">Updated:</span>
              <span className="detail-value">{new Date(category.updated_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {category.description && (
          <div className="category-description">
            <p>{category.description}</p>
          </div>
        )}
      </div>

      {showActions && (
        <div className="category-actions">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(category)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(category)}>
              Edit
            </Button>
          )}
          {onDelete && !category.is_system && (
            <Button variant="danger" size="sm" onClick={() => onDelete(category)}>
              Delete
            </Button>
          )}
          {onDelete && category.is_system && (
            <Button variant="danger" size="sm" disabled title="Cannot delete system category">
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

ExpenseCategoryCard.propTypes = {
  category: PropTypes.object.isRequired,
  showActions: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func
};

export default ExpenseCategoryCard;

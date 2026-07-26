import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from './index.js';

/**
 * IncomeCategoryCard Component
 * Displays income category information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.category - Category data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 */
function IncomeCategoryCard({ category, showActions = true, onEdit, onDelete, onView }) {
  if (!category) {
    return null;
  }

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
  const displayColor = (color) => {
    return color || '#8B4513';
  };

  return (
    <Card
      title={category.name || 'Unnamed Category'}
      subtitle={category.description || 'No description'}
      className="income-category-card"
    >
      <div className="income-category-info">
        <div className="income-category-detail">
          {category.color && (
            <div className="detail-row">
              <span className="detail-label">Color:</span>
              <span className="detail-value">
                <span 
                  className="color-swatch" 
                  style={{ backgroundColor: displayColor(category.color) }}
                >
                  {displayColor(category.color)}
                </span>
              </span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`detail-value badge badge-${getStatusClass(category.is_active)}`}>
              {getStatusText(category.is_active)}
            </span>
          </div>

          {category.icon && (
            <div className="detail-row">
              <span className="detail-label">Icon:</span>
              <span className="detail-value">{category.icon}</span>
            </div>
          )}

          {category.usage_count !== undefined && (
            <div className="detail-row">
              <span className="detail-label">Income Records:</span>
              <span className="detail-value">{category.usage_count}</span>
            </div>
          )}

          {category.created_at && (
            <div className="detail-row">
              <span className="detail-label">Created:</span>
              <span className="detail-value">{formatDate(category.created_at)}</span>
            </div>
          )}

          {category.updated_at && category.updated_at !== category.created_at && (
            <div className="detail-row">
              <span className="detail-label">Updated:</span>
              <span className="detail-value">{formatDate(category.updated_at)}</span>
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="income-category-actions">
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
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => onDelete(category)}>
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

IncomeCategoryCard.propTypes = {
  category: PropTypes.object.isRequired,
  showActions: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func
};

export default IncomeCategoryCard;

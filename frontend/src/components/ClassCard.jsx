import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from './index.js';

/**
 * ClassCard Component
 * Displays class information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.classData - Class data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 */
function ClassCard({ classData, showActions = true, onEdit, onDelete, onView }) {
  if (!classData) {
    return null;
  }

  // Format student count display
  const formatStudentCount = (count) => {
    if (count === undefined || count === null) return 'N/A';
    return count === 1 ? '1 student' : `${count} students`;
  };

  return (
    <Card
      title={classData.name}
      subtitle={classData.description || 'No description'}
      className="class-card"
    >
      <div className="class-info">
        <div className="class-detail">
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`detail-value badge badge-${classData.is_active ? 'success' : 'warning'}`}>
              {classData.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Students:</span>
            <span className="detail-value">{formatStudentCount(classData.student_count)}</span>
          </div>

          {classData.created_at && (
            <div className="detail-row">
              <span className="detail-label">Created:</span>
              <span className="detail-value">{new Date(classData.created_at).toLocaleDateString()}</span>
            </div>
          )}

          {classData.updated_at && classData.updated_at !== classData.created_at && (
            <div className="detail-row">
              <span className="detail-label">Updated:</span>
              <span className="detail-value">{new Date(classData.updated_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="class-actions">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(classData)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(classData)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => onDelete(classData)}>
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

ClassCard.propTypes = {
  classData: PropTypes.object.isRequired,
  showActions: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func
};

export default ClassCard;

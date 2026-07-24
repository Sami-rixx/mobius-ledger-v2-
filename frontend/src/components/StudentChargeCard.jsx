import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from './index.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

/**
 * StudentChargeCard Component
 * Card component for displaying student charge information
 * 
 * @param {Object} props - Component props
 * @param {Object} props.charge - Student charge data
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {boolean} props.compact - Compact display mode
 */
function StudentChargeCard({ charge, onEdit, onDelete, compact = false }) {
  if (!charge) {
    return <Card title="No Charge Data" className="charge-card">
      <p>No student charge information available</p>
    </Card>;
  }

  // Get charge type display name
  const getChargeTypeDisplay = (type) => {
    if (!type) return 'N/A';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get status badge class
  const getStatusBadgeClass = (isActive) => {
    return isActive ? 'badge badge-success' : 'badge badge-secondary';
  };

  return (
    <Card 
      title={`Student Charge #${charge.id || 'N/A'}`} 
      className={`charge-card ${compact ? 'charge-card-compact' : ''}`}
    >
      <div className="charge-card-content">
        {/* Charge Information */}
        <div className="charge-info-section">
          <h4>Charge Information</h4>
          <div className="charge-info-grid">
            <div className="charge-info-item">
              <span className="charge-info-label">Name:</span>
              <span className="charge-info-value">{charge.name}</span>
            </div>
            <div className="charge-info-item">
              <span className="charge-info-label">Type:</span>
              <span className="charge-info-value">{getChargeTypeDisplay(charge.charge_type || charge.chargeType)}</span>
            </div>
            <div className="charge-info-item">
              <span className="charge-info-label">Amount:</span>
              <span className="charge-info-value charge-amount">{formatCurrency(charge.amount)}</span>
            </div>
            <div className="charge-info-item">
              <span className="charge-info-label">Status:</span>
              <span className={`charge-info-value ${getStatusBadgeClass(charge.is_active !== undefined ? charge.is_active : true)}`}>
                {charge.is_active !== undefined ? (charge.is_active ? 'Active' : 'Inactive') : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Class Information (for class-specific charges) */}
        {(charge.charge_type === 'class' || charge.class_id) && (
          <div className="charge-info-section">
            <h4>Class Information</h4>
            <div className="charge-info-grid">
              <div className="charge-info-item">
                <span className="charge-info-label">Class:</span>
                <span className="charge-info-value">{charge.class_name || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Due Date */}
        {charge.due_date && (
          <div className="charge-info-section">
            <h4>Due Date</h4>
            <div className="charge-info-grid">
              <div className="charge-info-item">
                <span className="charge-info-label">Due Date:</span>
                <span className="charge-info-value">{formatDate(charge.due_date)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Information */}
        {charge.assigned_student_count !== undefined && (
          <div className="charge-info-section">
            <h4>Assignments</h4>
            <div className="charge-info-grid">
              <div className="charge-info-item">
                <span className="charge-info-label">Assigned Students:</span>
                <span className="charge-info-value">{charge.assigned_student_count}</span>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {charge.description && (
          <div className="charge-info-section">
            <h4>Description</h4>
            <p className="charge-description">{charge.description}</p>
          </div>
        )}

        {/* Notes */}
        {charge.notes && (
          <div className="charge-info-section">
            <h4>Notes</h4>
            <p className="charge-notes">{charge.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!compact && (onEdit || onDelete) && (
          <div className="charge-card-actions">
            {onEdit && (
              <Button 
                variant="outline" 
                onClick={() => onEdit(charge)} 
                className="charge-action-button"
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="danger" 
                onClick={() => onDelete(charge)} 
                className="charge-action-button"
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

StudentChargeCard.propTypes = {
  charge: PropTypes.object,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  compact: PropTypes.bool
};

export default StudentChargeCard;

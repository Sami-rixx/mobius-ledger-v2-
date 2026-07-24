import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from './index.js';

/**
 * StudentChargeCard Component
 * Displays student charge information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.charge - Student charge data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 * @param {Function} props.onAssign - Assign to students handler
 */
function StudentChargeCard({ charge, showActions = true, onEdit, onDelete, onView, onAssign }) {
  if (!charge) {
    return null;
  }

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'KES 0.00';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get charge type label
  const getChargeTypeLabel = (type) => {
    const types = {
      individual: 'Individual',
      all: 'All Students',
      class: 'Entire Class',
      grade: 'Grade Level',
      custom: 'Custom Group'
    };
    return types[type] || type || 'N/A';
  };

  // Get status badge variant
  const getStatusVariant = (isActive) => {
    return isActive ? 'success' : 'warning';
  };

  // Get status label
  const getStatusLabel = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  // Calculate progress
  const assignmentCount = charge.assignment_count || 0;
  const totalAssigned = charge.total_assigned || 0;
  const totalPaid = charge.total_paid || 0;
  const outstanding = totalAssigned - totalPaid;

  return (
    <Card
      title={charge.name || 'N/A'}
      subtitle={`Charge #${charge.id || 'N/A'} | ${formatCurrency(charge.amount)}`}
      className="student-charge-card"
    >
      <div className="student-charge-info">
        {/* Charge Details */}
        <div className="info-section">
          <h4>Charge Details</h4>
          
          <div className="detail-row">
            <span className="detail-label">Description:</span>
            <span className="detail-value">{charge.description || 'N/A'}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Type:</span>
            <span className="detail-value">{getChargeTypeLabel(charge.charge_type || charge.chargeType)}</span>
          </div>
          
          {charge.class_id && (
            <div className="detail-row">
              <span className="detail-label">Class:</span>
              <span className="detail-value">{charge.class_name || 'N/A'}</span>
            </div>
          )}
          
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`detail-value badge badge-${getStatusVariant(charge.is_active !== false)}`}>
              {getStatusLabel(charge.is_active !== false)}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Due Date:</span>
            <span className="detail-value">{formatDate(charge.due_date || charge.dueDate)}</span>
          </div>
        </div>

        {/* Assignment Statistics */}
        <div className="info-section">
          <h4>Assignment Statistics</h4>
          
          <div className="detail-row">
            <span className="detail-label">Students Assigned:</span>
            <span className="detail-value">{assignmentCount}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Total Assigned Amount:</span>
            <span className="detail-value amount">{formatCurrency(totalAssigned)}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Total Paid:</span>
            <span className="detail-value amount paid">{formatCurrency(totalPaid)}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Outstanding:</span>
            <span className="detail-value amount outstanding">{formatCurrency(outstanding)}</span>
          </div>
        </div>

        {/* Notes */}
        {charge.notes && (
          <div className="info-section">
            <h4>Notes</h4>
            <div className="detail-row">
              <span className="detail-value">{charge.notes}</span>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="info-section metadata">
          <div className="detail-row">
            <span className="detail-label">Created:</span>
            <span className="detail-value">{formatDate(charge.created_at || charge.createdAt)}</span>
          </div>
          {charge.updated_at && (
            <div className="detail-row">
              <span className="detail-label">Updated:</span>
              <span className="detail-value">{formatDate(charge.updated_at || charge.updatedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="card-actions">
          {onView && (
            <Button variant="info" size="sm" onClick={() => onView(charge)}>
              View
            </Button>
          )}
          {onAssign && (
            <Button variant="primary" size="sm" onClick={() => onAssign(charge)}>
              Assign to Students
            </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(charge)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => onDelete(charge)}>
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

StudentChargeCard.propTypes = {
  charge: PropTypes.object.isRequired,
  showActions: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  onAssign: PropTypes.func
};

export default StudentChargeCard;

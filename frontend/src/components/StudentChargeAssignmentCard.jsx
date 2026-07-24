import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from './index.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

/**
 * StudentChargeAssignmentCard Component
 * Card component for displaying student charge assignment information
 * 
 * @param {Object} props - Component props
 * @param {Object} props.assignment - Assignment data
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {boolean} props.compact - Compact display mode
 */
function StudentChargeAssignmentCard({ assignment, onEdit, onDelete, compact = false }) {
  if (!assignment) {
    return <Card title="No Assignment Data" className="assignment-card">
      <p>No student charge assignment information available</p>
    </Card>;
  }

  // Get payment status
  const getPaymentStatus = () => {
    // Check if there's a payment reference or if notes indicate payment
    if (assignment.notes && assignment.notes.toLowerCase().includes('paid')) {
      return 'Paid';
    }
    if (assignment.transaction_id || assignment.transactionId) {
      return 'Paid';
    }
    return 'Unpaid';
  };

  // Get status badge class
  const getStatusBadgeClass = () => {
    const status = getPaymentStatus();
    return status === 'Paid' ? 'badge badge-success' : 'badge badge-warning';
  };

  return (
    <Card 
      title={`Assignment #${assignment.id || 'N/A'}`} 
      className={`assignment-card ${compact ? 'assignment-card-compact' : ''}`}
    >
      <div className="assignment-card-content">
        {/* Charge Information */}
        <div className="assignment-info-section">
          <h4>Charge Information</h4>
          <div className="assignment-info-grid">
            <div className="assignment-info-item">
              <span className="assignment-info-label">Charge Name:</span>
              <span className="assignment-info-value">{assignment.charge_name || 'N/A'}</span>
            </div>
            <div className="assignment-info-item">
              <span className="assignment-info-label">Charge Amount:</span>
              <span className="assignment-info-value">{formatCurrency(assignment.charge_amount)}</span>
            </div>
            <div className="assignment-info-item">
              <span className="assignment-info-label">Assignment Amount:</span>
              <span className="assignment-info-value">{formatCurrency(assignment.amount)}</span>
            </div>
            <div className="assignment-info-item">
              <span className="assignment-info-label">Charge Type:</span>
              <span className="assignment-info-value">{assignment.charge_type ? assignment.charge_type.charAt(0).toUpperCase() + assignment.charge_type.slice(1) : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="assignment-info-section">
          <h4>Student Information</h4>
          <div className="assignment-info-grid">
            <div className="assignment-info-item">
              <span className="assignment-info-label">Name:</span>
              <span className="assignment-info-value">{assignment.first_name} {assignment.last_name}</span>
            </div>
            <div className="assignment-info-item">
              <span className="assignment-info-label">Admission #:</span>
              <span className="assignment-info-value">{assignment.admission_number}</span>
            </div>
            <div className="assignment-info-item">
              <span className="assignment-info-label">Class:</span>
              <span className="assignment-info-value">{assignment.class_name || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Assignment Information */}
        <div className="assignment-info-section">
          <h4>Assignment Information</h4>
          <div className="assignment-info-grid">
            <div className="assignment-info-item">
              <span className="assignment-info-label">Assigned At:</span>
              <span className="assignment-info-value">{formatDate(assignment.assigned_at)}</span>
            </div>
            <div className="assignment-info-item">
              <span className="assignment-info-label">Payment Status:</span>
              <span className={`assignment-info-value ${getStatusBadgeClass()}`}>
                {getPaymentStatus()}
              </span>
            </div>
            {assignment.charge_due_date && (
              <div className="assignment-info-item">
                <span className="assignment-info-label">Due Date:</span>
                <span className="assignment-info-value">{formatDate(assignment.charge_due_date)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {assignment.notes && (
          <div className="assignment-info-section">
            <h4>Notes</h4>
            <p className="assignment-notes">{assignment.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!compact && (onEdit || onDelete) && (
          <div className="assignment-card-actions">
            {onEdit && (
              <Button 
                variant="outline" 
                onClick={() => onEdit(assignment)} 
                className="assignment-action-button"
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="danger" 
                onClick={() => onDelete(assignment)} 
                className="assignment-action-button"
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

StudentChargeAssignmentCard.propTypes = {
  assignment: PropTypes.object,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  compact: PropTypes.bool
};

export default StudentChargeAssignmentCard;

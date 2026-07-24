import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from './index.js';
import { formatDate } from '../utils/formatters.js';

/**
 * LunchAttendanceCard Component
 * Card component for displaying lunch attendance information
 * 
 * @param {Object} props - Component props
 * @param {Object} props.attendance - Lunch attendance data
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {boolean} props.compact - Compact display mode
 */
function LunchAttendanceCard({ attendance, onEdit, onDelete, compact = false }) {
  if (!attendance) {
    return <Card title="No Attendance Data" className="attendance-card">
      <p>No lunch attendance information available</p>
    </Card>;
  }

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'badge badge-success';
      case 'unpaid':
        return 'badge badge-warning';
      case 'absent':
        return 'badge badge-secondary';
      default:
        return 'badge badge-info';
    }
  };

  return (
    <Card 
      title={`Lunch Attendance #${attendance.id || 'N/A'}`} 
      className={`attendance-card ${compact ? 'attendance-card-compact' : ''}`}
    >
      <div className="attendance-card-content">
        {/* Student Information */}
        <div className="attendance-info-section">
          <h4>Student Information</h4>
          <div className="attendance-info-grid">
            <div className="attendance-info-item">
              <span className="attendance-info-label">Name:</span>
              <span className="attendance-info-value">
                {attendance.first_name} {attendance.last_name}
              </span>
            </div>
            <div className="attendance-info-item">
              <span className="attendance-info-label">Admission #:</span>
              <span className="attendance-info-value">{attendance.admission_number}</span>
            </div>
            <div className="attendance-info-item">
              <span className="attendance-info-label">Class:</span>
              <span className="attendance-info-value">{attendance.class_name || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Attendance Information */}
        <div className="attendance-info-section">
          <h4>Attendance Information</h4>
          <div className="attendance-info-grid">
            <div className="attendance-info-item">
              <span className="attendance-info-label">Date:</span>
              <span className="attendance-info-value">{formatDate(attendance.date)}</span>
            </div>
            <div className="attendance-info-item">
              <span className="attendance-info-label">Status:</span>
              <span className={`attendance-info-value ${getStatusBadgeClass(attendance.status)}`}>
                {attendance.status ? attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1) : 'N/A'}
              </span>
            </div>
            {attendance.payment_amount && (
              <div className="attendance-info-item">
                <span className="attendance-info-label">Payment Amount:</span>
                <span className="attendance-info-value">{attendance.payment_amount}</span>
              </div>
            )}
            {attendance.payment_type && (
              <div className="attendance-info-item">
                <span className="attendance-info-label">Payment Type:</span>
                <span className="attendance-info-value">
                  {attendance.payment_type.charAt(0).toUpperCase() + attendance.payment_type.slice(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {attendance.notes && (
          <div className="attendance-info-section">
            <h4>Notes</h4>
            <p className="attendance-notes">{attendance.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!compact && (onEdit || onDelete) && (
          <div className="attendance-card-actions">
            {onEdit && (
              <Button 
                variant="outline" 
                onClick={() => onEdit(attendance)} 
                className="attendance-action-button"
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="danger" 
                onClick={() => onDelete(attendance)} 
                className="attendance-action-button"
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

LunchAttendanceCard.propTypes = {
  attendance: PropTypes.object,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  compact: PropTypes.bool
};

export default LunchAttendanceCard;

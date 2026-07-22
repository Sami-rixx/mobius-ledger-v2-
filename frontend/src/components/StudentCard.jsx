import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from './index.js';

/**
 * StudentCard Component
 * Displays student information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.student - Student data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 */
function StudentCard({ student, showActions = true, onEdit, onDelete, onView }) {
  if (!student) {
    return null;
  }

  // Format phone number for display
  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    // Remove spaces and format
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.startsWith('+254')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return `+254${cleaned.substring(1)}`;
    }
    return phone;
  };

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(student.date_of_birth);

  return (
    <Card
      title={`${student.last_name}, ${student.first_name}`}
      subtitle={`Admission: ${student.admission_number} | ${student.class_name || 'No Class'}`}
      className="student-card"
    >
      <div className="student-info">
        <div className="student-detail">
          <div className="detail-row">
            <span className="detail-label">Gender:</span>
            <span className="detail-value">{student.gender || 'N/A'}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Age:</span>
            <span className="detail-value">{age || 'N/A'}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`detail-value badge badge-${student.status === 'Active' ? 'success' : student.status === 'Graduated' ? 'info' : 'warning'}`}>
              {student.status || 'N/A'}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Parent:</span>
            <span className="detail-value">{student.parent_name || 'N/A'}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Phone:</span>
            <span className="detail-value">{formatPhone(student.parent_phone)}</span>
          </div>
          
          {student.parent_email && (
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{student.parent_email}</span>
            </div>
          )}
          
          {student.address && (
            <div className="detail-row">
              <span className="detail-label">Address:</span>
              <span className="detail-value">{student.address}</span>
            </div>
          )}
          
          {student.notes && (
            <div className="detail-row">
              <span className="detail-label">Notes:</span>
              <span className="detail-value">{student.notes}</span>
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="student-actions">
          {onView && (
            <Button variant="outline" size="sm" onClick={() => onView(student)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(student)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" size="sm" onClick={() => onDelete(student)}>
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

StudentCard.propTypes = {
  student: PropTypes.object.isRequired,
  showActions: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func
};

export default StudentCard;

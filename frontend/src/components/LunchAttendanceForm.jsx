import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card } from './index.js';
import { getAllStudents } from '../services/studentService.js';

/**
 * LunchAttendanceForm Component
 * Reusable form for creating and editing lunch attendance records
 * 
 * @param {Object} props - Component props
 * @param {Object} props.attendance - Lunch attendance data to edit (null for new record)
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 */
function LunchAttendanceForm({ attendance, onSubmit, onCancel, loading = false }) {
  // Form state
  const [formData, setFormData] = useState({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'paid',
    paymentId: '',
    notes: ''
  });

  // Validation and state
  const [errors, setErrors] = useState({});
  const [students, setStudents] = useState([]);
  const [lunchPayments, setLunchPayments] = useState([]);

  // Valid status values
  const validStatuses = ['paid', 'unpaid', 'absent'];

  // Load students
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await getAllStudents();
        setStudents(response.data || response);
      } catch (error) {
        console.error('Failed to load students:', error);
      }
    };
    loadStudents();
  }, []);

  // Initialize form with attendance data
  useEffect(() => {
    if (attendance) {
      setFormData({
        studentId: attendance.student_id || attendance.studentId || '',
        date: attendance.date || new Date().toISOString().split('T')[0],
        status: attendance.status || 'paid',
        paymentId: attendance.payment_id || attendance.paymentId || '',
        notes: attendance.notes || ''
      });
    }
  }, [attendance]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};
    
    if (!formData.studentId) {
      newErrors.studentId = 'Student is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.status) {
      newErrors.status = 'Status is required';
    } else if (!validStatuses.includes(formData.status)) {
      newErrors.status = `Status must be one of: ${validStatuses.join(', ')}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      student_id: parseInt(formData.studentId, 10),
      payment_id: formData.paymentId ? parseInt(formData.paymentId, 10) : null,
      created_by: 1 // Default to system user for now
    };

    onSubmit(submitData);
  };

  // Find student name by ID
  const getStudentName = (studentId) => {
    if (!studentId) return '';
    const student = students.find(s => s.id === parseInt(studentId, 10));
    return student ? `${student.first_name} ${student.last_name} (${student.admission_number})` : '';
  };

  return (
    <Card title={attendance ? 'Edit Lunch Attendance' : 'Create Lunch Attendance'} className="form-card">
      <form onSubmit={handleSubmit} className="form">
        {/* Student Selection */}
        <div className="form-group">
          <label htmlFor="studentId">Student *</label>
          <select
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            className={`form-select ${errors.studentId ? 'form-input-error' : ''}`}
            disabled={loading}
          >
            <option value="">Select a student</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name} ({student.admission_number})
              </option>
            ))}
          </select>
          {errors.studentId && <span className="form-error">{errors.studentId}</span>}
        </div>

        {/* Date */}
        <div className="form-group">
          <label htmlFor="date">Date *</label>
          <Input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={errors.date ? 'form-input-error' : ''}
            disabled={loading}
          />
          {errors.date && <span className="form-error">{errors.date}</span>}
        </div>

        {/* Status */}
        <div className="form-group">
          <label htmlFor="status">Status *</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`form-select ${errors.status ? 'form-input-error' : ''}`}
            disabled={loading}
          >
            {validStatuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          {errors.status && <span className="form-error">{errors.status}</span>}
        </div>

        {/* Payment ID (optional) */}
        <div className="form-group">
          <label htmlFor="paymentId">Payment ID (Optional)</label>
          <Input
            type="number"
            id="paymentId"
            name="paymentId"
            value={formData.paymentId}
            onChange={handleChange}
            placeholder="Enter payment ID"
            className="form-input"
            disabled={loading}
          />
          <p className="form-hint">Link to an existing lunch payment</p>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Enter additional notes"
            disabled={loading}
            rows={3}
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="form-button"
          >
            {loading ? 'Saving...' : (attendance ? 'Update Attendance' : 'Create Attendance')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="form-button"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

LunchAttendanceForm.propTypes = {
  attendance: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default LunchAttendanceForm;

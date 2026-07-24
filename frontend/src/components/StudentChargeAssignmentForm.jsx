import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card } from './index.js';
import { getAllStudents } from '../services/studentService.js';
import { getAllStudentCharges } from '../services/studentChargeService.js';

/**
 * StudentChargeAssignmentForm Component
 * Reusable form for creating and editing student charge assignments
 * 
 * @param {Object} props - Component props
 * @param {Object} props.assignment - Assignment data to edit (null for new assignment)
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 */
function StudentChargeAssignmentForm({ assignment, onSubmit, onCancel, loading = false }) {
  // Form state
  const [formData, setFormData] = useState({
    chargeId: '',
    studentId: '',
    amount: '',
    notes: ''
  });

  // Validation and state
  const [errors, setErrors] = useState({});
  const [students, setStudents] = useState([]);
  const [charges, setCharges] = useState([]);

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

  // Load charges
  useEffect(() => {
    const loadCharges = async () => {
      try {
        const response = await getAllStudentCharges();
        setCharges(response.data || response);
      } catch (error) {
        console.error('Failed to load charges:', error);
      }
    };
    loadCharges();
  }, []);

  // Initialize form with assignment data
  useEffect(() => {
    if (assignment) {
      setFormData({
        chargeId: assignment.charge_id || assignment.chargeId || '',
        studentId: assignment.student_id || assignment.studentId || '',
        amount: assignment.amount || '',
        notes: assignment.notes || ''
      });
    }
  }, [assignment]);

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
    
    if (!formData.chargeId) {
      newErrors.chargeId = 'Charge is required';
    }
    
    if (!formData.studentId) {
      newErrors.studentId = 'Student is required';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
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
      charge_id: parseInt(formData.chargeId, 10),
      student_id: parseInt(formData.studentId, 10),
      amount: parseFloat(formData.amount)
    };

    onSubmit(submitData);
  };

  // Get student name by ID
  const getStudentName = (studentId) => {
    if (!studentId) return '';
    const student = students.find(s => s.id === parseInt(studentId, 10));
    return student ? `${student.first_name} ${student.last_name} (${student.admission_number})` : '';
  };

  // Get charge name by ID
  const getChargeName = (chargeId) => {
    if (!chargeId) return '';
    const charge = charges.find(c => c.id === parseInt(chargeId, 10));
    return charge ? `${charge.name} (${charge.amount})` : '';
  };

  return (
    <Card title={assignment ? 'Edit Assignment' : 'Create Assignment'} className="form-card">
      <form onSubmit={handleSubmit} className="form">
        {/* Charge Selection */}
        <div className="form-group">
          <label htmlFor="chargeId">Charge *</label>
          <select
            id="chargeId"
            name="chargeId"
            value={formData.chargeId}
            onChange={handleChange}
            className={`form-select ${errors.chargeId ? 'form-input-error' : ''}`}
            disabled={loading}
          >
            <option value="">Select a charge</option>
            {charges.map(charge => (
              <option key={charge.id} value={charge.id}>
                {charge.name} - {charge.amount}
              </option>
            ))}
          </select>
          {errors.chargeId && <span className="form-error">{errors.chargeId}</span>}
        </div>

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

        {/* Amount */}
        <div className="form-group">
          <label htmlFor="amount">Amount (KES) *</label>
          <Input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter amount"
            step="0.01"
            min="0"
            className={errors.amount ? 'form-input-error' : ''}
            disabled={loading}
          />
          {errors.amount && <span className="form-error">{errors.amount}</span>}
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
            {loading ? 'Saving...' : (assignment ? 'Update Assignment' : 'Create Assignment')}
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

StudentChargeAssignmentForm.propTypes = {
  assignment: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default StudentChargeAssignmentForm;

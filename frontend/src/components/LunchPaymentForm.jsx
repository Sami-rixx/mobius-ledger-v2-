import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card } from './index.js';
import { getAllStudents } from '../services/studentService.js';

/**
 * LunchPaymentForm Component
 * Reusable form for creating and editing lunch payments
 * 
 * @param {Object} props - Component props
 * @param {Object} props.payment - Lunch payment data to edit (null for new payment)
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 */
function LunchPaymentForm({ payment, onSubmit, onCancel, loading = false }) {
  // Form state
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentType: 'daily',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    paymentMethodId: '',
    notes: ''
  });

  // Validation and state
  const [errors, setErrors] = useState({});
  const [students, setStudents] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, name: 'Cash' },
    { id: 2, name: 'M-Pesa' },
    { id: 3, name: 'Bank Transfer' },
    { id: 4, name: 'Cheque' },
    { id: 5, name: 'Other' }
  ]);

  // Valid payment types
  const validPaymentTypes = ['daily', 'weekly', 'monthly'];

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

  // Initialize form with payment data
  useEffect(() => {
    if (payment) {
      setFormData({
        studentId: payment.student_id || payment.studentId || '',
        amount: payment.amount || '',
        paymentDate: payment.payment_date || payment.paymentDate || new Date().toISOString().split('T')[0],
        paymentType: payment.payment_type || payment.paymentType || 'daily',
        startDate: payment.start_date || payment.startDate || new Date().toISOString().split('T')[0],
        endDate: payment.end_date || payment.endDate || new Date().toISOString().split('T')[0],
        paymentMethodId: payment.payment_method_id || payment.paymentMethodId || '',
        notes: payment.notes || ''
      });
    }
  }, [payment]);

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
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }
    
    if (!formData.paymentType) {
      newErrors.paymentType = 'Payment type is required';
    } else if (!validPaymentTypes.includes(formData.paymentType)) {
      newErrors.paymentType = `Payment type must be one of: ${validPaymentTypes.join(', ')}`;
    }
    
    if (formData.paymentType === 'weekly' || formData.paymentType === 'monthly') {
      if (!formData.startDate) {
        newErrors.startDate = 'Start date is required for weekly/monthly payments';
      }
      if (!formData.endDate) {
        newErrors.endDate = 'End date is required for weekly/monthly payments';
      }
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
      amount: parseFloat(formData.amount),
      payment_method_id: formData.paymentMethodId ? parseInt(formData.paymentMethodId, 10) : null,
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
    <Card title={payment ? 'Edit Lunch Payment' : 'Create Lunch Payment'} className="form-card">
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

        {/* Payment Date */}
        <div className="form-group">
          <label htmlFor="paymentDate">Payment Date *</label>
          <Input
            type="date"
            id="paymentDate"
            name="paymentDate"
            value={formData.paymentDate}
            onChange={handleChange}
            className={errors.paymentDate ? 'form-input-error' : ''}
            disabled={loading}
          />
          {errors.paymentDate && <span className="form-error">{errors.paymentDate}</span>}
        </div>

        {/* Payment Type */}
        <div className="form-group">
          <label htmlFor="paymentType">Payment Type *</label>
          <select
            id="paymentType"
            name="paymentType"
            value={formData.paymentType}
            onChange={handleChange}
            className={`form-select ${errors.paymentType ? 'form-input-error' : ''}`}
            disabled={loading}
          >
            {validPaymentTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          {errors.paymentType && <span className="form-error">{errors.paymentType}</span>}
        </div>

        {/* Start Date (for weekly/monthly) */}
        {(formData.paymentType === 'weekly' || formData.paymentType === 'monthly') && (
          <div className="form-group">
            <label htmlFor="startDate">Start Date *</label>
            <Input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={errors.startDate ? 'form-input-error' : ''}
              disabled={loading}
            />
            {errors.startDate && <span className="form-error">{errors.startDate}</span>}
          </div>
        )}

        {/* End Date (for weekly/monthly) */}
        {(formData.paymentType === 'weekly' || formData.paymentType === 'monthly') && (
          <div className="form-group">
            <label htmlFor="endDate">End Date *</label>
            <Input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className={errors.endDate ? 'form-input-error' : ''}
              disabled={loading}
            />
            {errors.endDate && <span className="form-error">{errors.endDate}</span>}
          </div>
        )}

        {/* Payment Method */}
        <div className="form-group">
          <label htmlFor="paymentMethodId">Payment Method</label>
          <select
            id="paymentMethodId"
            name="paymentMethodId"
            value={formData.paymentMethodId}
            onChange={handleChange}
            className="form-select"
            disabled={loading}
          >
            <option value="">Select payment method</option>
            {paymentMethods.map(method => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
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
            {loading ? 'Saving...' : (payment ? 'Update Payment' : 'Create Payment')}
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

LunchPaymentForm.propTypes = {
  payment: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default LunchPaymentForm;

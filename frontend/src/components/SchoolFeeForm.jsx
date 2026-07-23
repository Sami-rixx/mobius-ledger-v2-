import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card } from './index.js';
import { getAllStudents } from '../services/studentService.js';
import { getClassesWithStudentCounts } from '../services/classService.js';

/**
 * SchoolFeeForm Component
 * Reusable form for creating and editing school fee payments
 * 
 * @param {Object} props - Component props
 * @param {Object} props.payment - School fee payment data to edit (null for new payment)
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 */
function SchoolFeeForm({ payment, onSubmit, onCancel, loading = false }) {
  // Form state
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    academicYear: new Date().getFullYear().toString(),
    term: 'Term 1',
    paymentMethodId: '',
    description: '',
    notes: ''
  });

  // Validation and state
  const [errors, setErrors] = useState({});
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, name: 'Cash' },
    { id: 2, name: 'M-Pesa' },
    { id: 3, name: 'Bank Transfer' },
    { id: 4, name: 'Cheque' },
    { id: 5, name: 'Other' }
  ]);

  // Valid terms
  const validTerms = ['Term 1', 'Term 2', 'Term 3'];

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

  // Load classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await getClassesWithStudentCounts();
        setClasses(response.data || response);
      } catch (error) {
        console.error('Failed to load classes:', error);
      }
    };
    loadClasses();
  }, []);

  // Initialize form with payment data
  useEffect(() => {
    if (payment) {
      setFormData({
        studentId: payment.student_id || payment.studentId || '',
        amount: payment.amount || '',
        paymentDate: payment.payment_date || payment.paymentDate || new Date().toISOString().split('T')[0],
        academicYear: payment.academic_year || payment.academicYear || new Date().getFullYear().toString(),
        term: payment.term || 'Term 1',
        paymentMethodId: payment.payment_method_id || payment.paymentMethodId || '',
        description: payment.description || '',
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
    } else {
      const amountNum = parseFloat(formData.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      }
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }

    if (!formData.academicYear) {
      newErrors.academicYear = 'Academic year is required';
    }

    if (!formData.term) {
      newErrors.term = 'Term is required';
    } else if (!validTerms.includes(formData.term)) {
      newErrors.term = `Term must be one of: ${validTerms.join(', ')}`;
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be 200 characters or less';
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes must be 500 characters or less';
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
      studentId: parseInt(formData.studentId, 10),
      amount: parseFloat(formData.amount),
      paymentDate: formData.paymentDate,
      academicYear: formData.academicYear,
      term: formData.term,
      paymentMethodId: formData.paymentMethodId ? parseInt(formData.paymentMethodId, 10) : undefined,
      description: formData.description || undefined,
      notes: formData.notes || undefined
    };

    onSubmit(submitData);
  };

  // Get student name by ID
  const getStudentName = (id) => {
    if (!id) return 'Select Student';
    const student = students.find(s => s.id === parseInt(id, 10));
    return student ? `${student.last_name || ''}, ${student.first_name || ''}`.trim() : 'Unknown';
  };

  // Get payment method name by ID
  const getPaymentMethodName = (id) => {
    if (!id) return 'Select Method';
    const method = paymentMethods.find(m => m.id === parseInt(id, 10));
    return method ? method.name : 'Unknown';
  };

  return (
    <Card title={payment ? 'Edit School Fee Payment' : 'Record School Fee Payment'} className="school-fee-form">
      <form onSubmit={handleSubmit}>
        {/* Student Selection */}
        <div className="form-group">
          <label htmlFor="studentId">Student *</label>
          <select
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            className={`form-control ${errors.studentId ? 'is-invalid' : ''}`}
            disabled={loading}
          >
            <option value="">Select Student</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.last_name}, {student.first_name} ({student.admission_number})
              </option>
            ))}
          </select>
          {errors.studentId && <div className="invalid-feedback">{errors.studentId}</div>}
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
            min="0.01"
            className={errors.amount ? 'is-invalid' : ''}
            disabled={loading}
          />
          {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
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
            className={errors.paymentDate ? 'is-invalid' : ''}
            disabled={loading}
          />
          {errors.paymentDate && <div className="invalid-feedback">{errors.paymentDate}</div>}
        </div>

        {/* Academic Year */}
        <div className="form-group">
          <label htmlFor="academicYear">Academic Year *</label>
          <Input
            type="text"
            id="academicYear"
            name="academicYear"
            value={formData.academicYear}
            onChange={handleChange}
            placeholder="e.g., 2026"
            className={errors.academicYear ? 'is-invalid' : ''}
            disabled={loading}
          />
          {errors.academicYear && <div className="invalid-feedback">{errors.academicYear}</div>}
        </div>

        {/* Term */}
        <div className="form-group">
          <label htmlFor="term">Term *</label>
          <select
            id="term"
            name="term"
            value={formData.term}
            onChange={handleChange}
            className={`form-control ${errors.term ? 'is-invalid' : ''}`}
            disabled={loading}
          >
            {validTerms.map(term => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
          {errors.term && <div className="invalid-feedback">{errors.term}</div>}
        </div>

        {/* Payment Method */}
        <div className="form-group">
          <label htmlFor="paymentMethodId">Payment Method</label>
          <select
            id="paymentMethodId"
            name="paymentMethodId"
            value={formData.paymentMethodId}
            onChange={handleChange}
            className="form-control"
            disabled={loading}
          >
            <option value="">Select Payment Method</option>
            {paymentMethods.map(method => (
              <option key={method.id} value={method.id}>{method.name}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <Input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional description"
            className={errors.description ? 'is-invalid' : ''}
            disabled={loading}
          />
          {errors.description && <div className="invalid-feedback">{errors.description}</div>}
        </div>

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Optional notes"
            className={`form-control ${errors.notes ? 'is-invalid' : ''}`}
            rows="3"
            disabled={loading}
          />
          {errors.notes && <div className="invalid-feedback">{errors.notes}</div>}
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : payment ? 'Update Payment' : 'Record Payment'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

SchoolFeeForm.propTypes = {
  payment: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default SchoolFeeForm;

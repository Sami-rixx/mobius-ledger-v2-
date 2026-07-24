import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card } from './index.js';
import { getAllClasses } from '../services/classService.js';

/**
 * StudentChargeForm Component
 * Reusable form for creating and editing student charges
 * 
 * @param {Object} props - Component props
 * @param {Object} props.charge - Student charge data to edit (null for new charge)
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 */
function StudentChargeForm({ charge, onSubmit, onCancel, loading = false }) {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    charge_type: 'individual',
    class_id: '',
    is_active: true,
    due_date: '',
    notes: ''
  });

  // Validation and state
  const [errors, setErrors] = useState({});
  const [classes, setClasses] = useState([]);

  // Valid charge types
  const chargeTypes = [
    { value: 'individual', label: 'Individual (assign to specific students)' },
    { value: 'all', label: 'All Students' },
    { value: 'class', label: 'Entire Class' },
    { value: 'grade', label: 'Grade Level' },
    { value: 'custom', label: 'Custom Group' }
  ];

  // Load classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await getAllClasses();
        setClasses(response.data || response);
      } catch (error) {
        console.error('Failed to load classes:', error);
      }
    };
    loadClasses();
  }, []);

  // Initialize form with charge data
  useEffect(() => {
    if (charge) {
      setFormData({
        name: charge.name || '',
        description: charge.description || '',
        amount: charge.amount || '',
        charge_type: charge.charge_type || charge.chargeType || 'individual',
        class_id: charge.class_id || charge.classId || '',
        is_active: charge.is_active !== undefined ? charge.is_active : true,
        due_date: charge.due_date || charge.dueDate || '',
        notes: charge.notes || ''
      });
    }
  }, [charge]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Charge name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Charge name must be 100 characters or less';
    }

    if (formData.amount !== '' && formData.amount !== '0') {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount < 0) {
        newErrors.amount = 'Amount must be a positive number';
      } else if (amount > 1000000) {
        newErrors.amount = 'Amount must be less than KES 1,000,000';
      }
    }

    if (formData.charge_type === 'class' && !formData.class_id) {
      newErrors.class_id = 'Class is required when charge type is "Entire Class"';
    }

    if (formData.due_date && new Date(formData.due_date) < new Date()) {
      newErrors.due_date = 'Due date cannot be in the past';
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
      // Convert amount to number
      amount: formData.amount === '' ? 0 : parseFloat(formData.amount),
      // Convert boolean
      is_active: Boolean(formData.is_active),
      // Convert charge_type to snake_case for backend
      charge_type: formData.charge_type
    };

    // Remove empty strings for optional fields
    if (submitData.description === '') delete submitData.description;
    if (submitData.notes === '') delete submitData.notes;
    if (submitData.due_date === '') delete submitData.due_date;
    if (submitData.class_id === '') delete submitData.class_id;

    onSubmit(submitData);
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') return 'KES 0.00';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card className="student-charge-form">
      <Card.Title>{charge ? 'Edit Student Charge' : 'Create New Student Charge'}</Card.Title>
      
      <form onSubmit={handleSubmit} className="form">
        {/* Name */}
        <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
          <label htmlFor="name">Charge Name *</label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Swimming Lessons, School Trip, Sports Fee"
            disabled={loading}
            maxLength={100}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <Input
            type="textarea"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Detailed description of the charge"
            disabled={loading}
            rows={3}
            maxLength={500}
          />
          <span className="hint">{formData.description.length}/500 characters</span>
        </div>

        {/* Amount */}
        <div className={`form-group ${errors.amount ? 'has-error' : ''}`}>
          <label htmlFor="amount">Amount (KES) *</label>
          <Input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            disabled={loading}
            min={0}
            step={0.01}
          />
          {errors.amount && <span className="error-message">{errors.amount}</span>}
          {formData.amount && !errors.amount && (
            <span className="hint">{formatCurrency(parseFloat(formData.amount) || 0)}</span>
          )}
        </div>

        {/* Charge Type */}
        <div className="form-group">
          <label htmlFor="charge_type">Charge Type *</label>
          <select
            id="charge_type"
            name="charge_type"
            value={formData.charge_type}
            onChange={handleChange}
            disabled={loading}
            className="form-select"
          >
            {chargeTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <span className="hint">Select how this charge will be assigned</span>
        </div>

        {/* Class (shown only for class type) */}
        {formData.charge_type === 'class' && (
          <div className={`form-group ${errors.class_id ? 'has-error' : ''}`}>
            <label htmlFor="class_id">Class *</label>
            <select
              id="class_id"
              name="class_id"
              value={formData.class_id}
              onChange={handleChange}
              disabled={loading}
              className="form-select"
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {errors.class_id && <span className="error-message">{errors.class_id}</span>}
          </div>
        )}

        {/* Active Status */}
        <div className="form-group form-check">
          <Input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            disabled={loading}
            label="Active Charge"
          />
          <span className="hint">Inactive charges will not appear in new assignments</span>
        </div>

        {/* Due Date */}
        <div className={`form-group ${errors.due_date ? 'has-error' : ''}`}>
          <label htmlFor="due_date">Due Date</label>
          <Input
            type="date"
            id="due_date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            disabled={loading}
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.due_date && <span className="error-message">{errors.due_date}</span>}
        </div>

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <Input
            type="textarea"
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional notes about this charge"
            disabled={loading}
            rows={2}
            maxLength={200}
          />
          <span className="hint">{formData.notes.length}/200 characters</span>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : charge ? 'Update Charge' : 'Create Charge'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

StudentChargeForm.propTypes = {
  charge: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default StudentChargeForm;

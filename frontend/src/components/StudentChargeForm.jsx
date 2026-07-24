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
    chargeType: 'individual',
    classId: '',
    isActive: true,
    dueDate: '',
    notes: ''
  });

  // Validation and state
  const [errors, setErrors] = useState({});
  const [classes, setClasses] = useState([]);

  // Valid charge types
  const validChargeTypes = ['individual', 'all', 'class', 'grade', 'custom'];

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
        chargeType: charge.charge_type || charge.chargeType || 'individual',
        classId: charge.class_id || charge.classId || '',
        isActive: charge.is_active !== undefined ? charge.is_active : true,
        dueDate: charge.due_date || charge.dueDate || '',
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
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!formData.chargeType) {
      newErrors.chargeType = 'Charge type is required';
    } else if (!validChargeTypes.includes(formData.chargeType)) {
      newErrors.chargeType = `Charge type must be one of: ${validChargeTypes.join(', ')}`;
    }
    
    // If charge type is 'class', class is required
    if (formData.chargeType === 'class' && !formData.classId) {
      newErrors.classId = 'Class is required for class-specific charges';
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
      amount: parseFloat(formData.amount),
      class_id: formData.classId ? parseInt(formData.classId, 10) : null,
      charge_type: formData.chargeType,
      is_active: formData.isActive,
      due_date: formData.dueDate || null,
      created_by: 1 // Default to system user for now
    };

    onSubmit(submitData);
  };

  // Get class name by ID
  const getClassName = (classId) => {
    if (!classId) return '';
    const cls = classes.find(c => c.id === parseInt(classId, 10));
    return cls ? cls.name : '';
  };

  return (
    <Card title={charge ? 'Edit Student Charge' : 'Create Student Charge'} className="form-card">
      <form onSubmit={handleSubmit} className="form">
        {/* Name */}
        <div className="form-group">
          <label htmlFor="name">Charge Name *</label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter charge name (e.g., Swimming Lessons, School Trip)"
            className={errors.name ? 'form-input-error' : ''}
            disabled={loading}
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Enter charge description"
            disabled={loading}
            rows={3}
          />
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

        {/* Charge Type */}
        <div className="form-group">
          <label htmlFor="chargeType">Charge Type *</label>
          <select
            id="chargeType"
            name="chargeType"
            value={formData.chargeType}
            onChange={handleChange}
            className={`form-select ${errors.chargeType ? 'form-input-error' : ''}`}
            disabled={loading}
          >
            {validChargeTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          {errors.chargeType && <span className="form-error">{errors.chargeType}</span>}
        </div>

        {/* Class (shown only for class-specific charges) */}
        {formData.chargeType === 'class' && (
          <div className="form-group">
            <label htmlFor="classId">Class *</label>
            <select
              id="classId"
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              className={`form-select ${errors.classId ? 'form-input-error' : ''}`}
              disabled={loading}
            >
              <option value="">Select a class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {errors.classId && <span className="form-error">{errors.classId}</span>}
          </div>
        )}

        {/* Due Date */}
        <div className="form-group">
          <label htmlFor="dueDate">Due Date (Optional)</label>
          <Input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="form-input"
            disabled={loading}
          />
        </div>

        {/* Active Status */}
        <div className="form-group form-group-checkbox">
          <label>
            <Input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              disabled={loading}
            />
            <span className="checkbox-label">Active</span>
          </label>
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
            {loading ? 'Saving...' : (charge ? 'Update Charge' : 'Create Charge')}
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

StudentChargeForm.propTypes = {
  charge: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default StudentChargeForm;

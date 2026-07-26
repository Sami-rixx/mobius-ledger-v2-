import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card } from './index.js';

/**
 * Director Withdrawal Form Component
 * Form for creating and editing director withdrawals
 * 
 * @param {Object} props - Component props
 * @param {Object} props.withdrawal - Director withdrawal data for editing (optional)
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Whether form is loading
 */
function DirectorWithdrawalForm({ withdrawal, onSubmit, onCancel, loading = false }) {
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    label: '',
    purpose: '',
    description: '',
    recipientName: '',
    recipientContact: '',
    paymentMethodId: '',
    withdrawalDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Load existing withdrawal data for editing
  useEffect(() => {
    if (withdrawal) {
      setFormData({
        amount: withdrawal.amount ? parseFloat(withdrawal.amount).toFixed(2) : '',
        label: withdrawal.label || '',
        purpose: withdrawal.purpose || '',
        description: withdrawal.description || '',
        recipientName: withdrawal.recipient_name || withdrawal.recipientName || '',
        recipientContact: withdrawal.recipient_contact || withdrawal.recipientContact || '',
        paymentMethodId: withdrawal.payment_method_id || '',
        withdrawalDate: withdrawal.withdrawal_date || new Date().toISOString().split('T')[0],
        notes: withdrawal.notes || ''
      });
    }
  }, [withdrawal]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || '' : value
    }));
  };

  // Validate form data
  const validate = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0';
    }

    if (!formData.purpose || formData.purpose.trim() === '') {
      newErrors.purpose = 'Purpose is required';
    }

    if (!formData.recipientName || formData.recipientName.trim() === '') {
      newErrors.recipientName = 'Recipient name is required';
    }

    // Purpose max length
    if (formData.purpose && formData.purpose.length > 200) {
      newErrors.purpose = 'Purpose must be at most 200 characters';
    }

    // Label max length
    if (formData.label && formData.label.length > 100) {
      newErrors.label = 'Label must be at most 100 characters';
    }

    // Description max length
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be at most 1000 characters';
    }

    // Recipient name max length
    if (formData.recipientName && formData.recipientName.length > 200) {
      newErrors.recipientName = 'Recipient name must be at most 200 characters';
    }

    // Recipient contact max length
    if (formData.recipientContact && formData.recipientContact.length > 100) {
      newErrors.recipientContact = 'Recipient contact must be at most 100 characters';
    }

    // Notes max length
    if (formData.notes && formData.notes.length > 2000) {
      newErrors.notes = 'Notes must be at most 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      const submissionData = {
        ...formData,
        // Convert amount to number
        amount: parseFloat(formData.amount)
      };
      
      // Clean up empty string values
      Object.keys(submissionData).forEach(key => {
        if (submissionData[key] === '') {
          delete submissionData[key];
        }
      });

      onSubmit(submissionData);
    }
  };

  // Format currency for display
  const formatCurrency = (value) => {
    if (!value) return 'KES 0.00';
    const num = parseFloat(value);
    return isNaN(num) ? 'KES 0.00' : `KES ${num.toFixed(2)}`;
  };

  return (
    <Card title={withdrawal ? 'Edit Director Withdrawal' : 'Create New Director Withdrawal'}
          className="director-withdrawal-form">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Amount */}
          <div className="form-group">
            <label htmlFor="amount">Amount *</label>
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
            />
            {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
          </div>

          {/* Label */}
          <div className="form-group">
            <label htmlFor="label">Label (Optional)</label>
            <Input
              type="text"
              id="label"
              name="label"
              value={formData.label}
              onChange={handleChange}
              placeholder="e.g., Salary, Bonus, Expense"
              maxLength={100}
              className={errors.label ? 'is-invalid' : ''}
            />
            {errors.label && <div className="invalid-feedback">{errors.label}</div>}
          </div>

          {/* Purpose */}
          <div className="form-group">
            <label htmlFor="purpose">Purpose *</label>
            <Input
              type="text"
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Enter purpose of withdrawal"
              maxLength={200}
              className={errors.purpose ? 'is-invalid' : ''}
            />
            {errors.purpose && <div className="invalid-feedback">{errors.purpose}</div>}
          </div>

          {/* Recipient Name */}
          <div className="form-group">
            <label htmlFor="recipientName">Recipient Name *</label>
            <Input
              type="text"
              id="recipientName"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              placeholder="Enter recipient name"
              maxLength={200}
              className={errors.recipientName ? 'is-invalid' : ''}
            />
            {errors.recipientName && <div className="invalid-feedback">{errors.recipientName}</div>}
          </div>

          {/* Recipient Contact */}
          <div className="form-group">
            <label htmlFor="recipientContact">Recipient Contact (Optional)</label>
            <Input
              type="tel"
              id="recipientContact"
              name="recipientContact"
              value={formData.recipientContact}
              onChange={handleChange}
              placeholder="Enter recipient contact"
              maxLength={100}
              className={errors.recipientContact ? 'is-invalid' : ''}
            />
            {errors.recipientContact && <div className="invalid-feedback">{errors.recipientContact}</div>}
          </div>

          {/* Payment Method ID */}
          <div className="form-group">
            <label htmlFor="paymentMethodId">Payment Method ID (Optional)</label>
            <Input
              type="number"
              id="paymentMethodId"
              name="paymentMethodId"
              value={formData.paymentMethodId}
              onChange={handleChange}
              placeholder="Enter payment method ID"
            />
          </div>

          {/* Withdrawal Date */}
          <div className="form-group">
            <label htmlFor="withdrawalDate">Withdrawal Date</label>
            <Input
              type="date"
              id="withdrawalDate"
              name="withdrawalDate"
              value={formData.withdrawalDate}
              onChange={handleChange}
            />
          </div>

          {/* Description */}
          <div className="form-group full-width">
            <label htmlFor="description">Description (Optional)</label>
            <Input
              type="textarea"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter detailed description"
              maxLength={1000}
              rows={3}
              className={errors.description ? 'is-invalid' : ''}
            />
            {errors.description && <div className="invalid-feedback">{errors.description}</div>}
          </div>

          {/* Notes */}
          <div className="form-group full-width">
            <label htmlFor="notes">Notes (Optional)</label>
            <Input
              type="textarea"
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Enter additional notes"
              maxLength={2000}
              rows={3}
              className={errors.notes ? 'is-invalid' : ''}
            />
            {errors.notes && <div className="invalid-feedback">{errors.notes}</div>}
          </div>

          {/* Form Actions */}
          <div className="form-actions full-width">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : withdrawal ? 'Update Withdrawal' : 'Create Withdrawal'}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="ms-2"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Amount Preview */}
        {formData.amount && (
          <div className="amount-preview mt-3">
            <p className="text-muted">Amount: {formatCurrency(formData.amount)}</p>
          </div>
        )}
      </form>
    </Card>
  );
}

DirectorWithdrawalForm.propTypes = {
  withdrawal: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  loading: PropTypes.bool
};

export default DirectorWithdrawalForm;

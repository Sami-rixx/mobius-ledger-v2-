import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card } from './index.js';
import { getAllIncomeCategories } from '../services/incomeCategoryService.js';

/**
 * IncomeForm Component
 * Reusable form for creating and editing income records
 * 
 * @param {Object} props - Component props
 * @param {Object} props.income - Income data to edit (null for new income)
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 */
function IncomeForm({ income, onSubmit, onCancel, loading = false }) {
  // Form state
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    source: '',
    description: '',
    receipt_number: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    reference: '',
    is_verified: false
  });

  // Validation and data state
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Load categories for dropdown
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const result = await getAllIncomeCategories();
        setCategories(result.data || result || []);
      } catch (error) {
        console.error('Failed to load income categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Initialize form with income data
  useEffect(() => {
    if (income) {
      setFormData({
        category_id: income.category_id || '',
        amount: income.amount || '',
        source: income.source || '',
        description: income.description || '',
        receipt_number: income.receipt_number || '',
        date: income.date ? new Date(income.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        payment_method: income.payment_method || 'Cash',
        reference: income.reference || '',
        is_verified: income.is_verified !== undefined ? income.is_verified : false
      });
    }
  }, [income]);

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

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (!formData.source?.trim()) {
      newErrors.source = 'Source is required';
    } else if (formData.source.length > 200) {
      newErrors.source = 'Source must be 200 characters or less';
    }

    if (formData.description?.trim() && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    if (formData.receipt_number?.trim() && formData.receipt_number.length > 50) {
      newErrors.receipt_number = 'Receipt number must be 50 characters or less';
    }

    if (formData.reference?.trim() && formData.reference.length > 100) {
      newErrors.reference = 'Reference must be 100 characters or less';
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

    // Format data for submission
    const submitData = {
      ...formData,
      category_id: parseInt(formData.category_id),
      amount: parseFloat(formData.amount),
      is_verified: formData.is_verified
    };

    onSubmit(submitData);
  };

  // Get category name by ID
  const getCategoryName = (id) => {
    const category = categories.find(c => c.id === parseInt(id));
    return category ? category.name : id;
  };

  return (
    <Card title={income ? 'Edit Income Record' : 'Add New Income Record'}>
      <form onSubmit={handleSubmit} className="income-form">
        <div className="form-grid">
          <div className="form-column">
            <div className="form-group">
              <label htmlFor="category_id">Category *</label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className={errors.category_id ? 'input-error' : ''}
                disabled={loading || isLoadingCategories}
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="input-error-message">{errors.category_id}</p>}
            </div>

            <Input
              name="amount"
              label="Amount *"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              error={errors.amount}
              required
              placeholder="0.00"
              step="0.01"
              min="0"
              disabled={loading}
            />

            <Input
              name="source"
              label="Source *"
              value={formData.source}
              onChange={handleChange}
              error={errors.source}
              required
              placeholder="e.g., School Fees, Donation, Fundraising"
              disabled={loading}
            />

            <Input
              name="receipt_number"
              label="Receipt Number"
              value={formData.receipt_number}
              onChange={handleChange}
              error={errors.receipt_number}
              placeholder="e.g., ML-2026-000001"
              disabled={loading}
            />
          </div>

          <div className="form-column">
            <Input
              name="date"
              label="Date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              disabled={loading}
            />

            <div className="form-group">
              <label htmlFor="payment_method">Payment Method</label>
              <select
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className={errors.payment_method ? 'input-error' : ''}
                disabled={loading}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Other">Other</option>
              </select>
              {errors.payment_method && <p className="input-error-message">{errors.payment_method}</p>}
            </div>

            <Input
              name="reference"
              label="Reference"
              value={formData.reference}
              onChange={handleChange}
              error={errors.reference}
              placeholder="e.g., Bank reference, transaction ID"
              disabled={loading}
            />

            <div className="form-group">
              <label htmlFor="is_verified">Verified</label>
              <select
                id="is_verified"
                name="is_verified"
                value={formData.is_verified}
                onChange={handleChange}
                className={errors.is_verified ? 'input-error' : ''}
                disabled={loading}
              >
                <option value={true}>Yes</option>
                <option value={false}>No</option>
              </select>
              {errors.is_verified && <p className="input-error-message">{errors.is_verified}</p>}
            </div>
          </div>
        </div>

        <div className="form-group full-width">
          <Input
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleChange}
            error={errors.description}
            placeholder="Additional details about this income"
            disabled={loading}
            type="textarea"
            rows={3}
          />
        </div>

        <div className="form-actions">
          <Button type="submit" variant="primary" disabled={loading || isLoadingCategories}>
            {loading ? 'Saving...' : income ? 'Update Income' : 'Add Income'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

IncomeForm.propTypes = {
  income: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default IncomeForm;

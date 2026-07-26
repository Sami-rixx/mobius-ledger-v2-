import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card } from './index.js';
import { getAllExpenseCategories } from '../services/expenseCategoryService.js';

/**
 * ExpenseForm Component
 * Reusable form for creating and editing expense records
 * 
 * @param {Object} props - Component props
 * @param {Object} props.expense - Expense data to edit (null for new expense)
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 */
function ExpenseForm({ expense, onSubmit, onCancel, loading = false }) {
  // Form state
  const [formData, setFormData] = useState({
    expense_category_id: '',
    amount: '',
    description: '',
    vendor_name: '',
    vendor_contact: '',
    payment_method_id: '',
    transaction_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    receipt_number: '',
    notes: '',
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
        const result = await getAllExpenseCategories();
        setCategories(result.data || result || []);
      } catch (error) {
        console.error('Failed to load expense categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Initialize form with expense data
  useEffect(() => {
    if (expense) {
      setFormData({
        expense_category_id: expense.expense_category_id || '',
        amount: expense.amount || '',
        description: expense.description || '',
        vendor_name: expense.vendor_name || '',
        vendor_contact: expense.vendor_contact || '',
        payment_method_id: expense.payment_method_id || '',
        transaction_id: expense.transaction_id || '',
        expense_date: expense.expense_date ? new Date(expense.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        receipt_number: expense.receipt_number || '',
        notes: expense.notes || '',
        is_verified: expense.is_verified !== undefined ? expense.is_verified : false
      });
    }
  }, [expense]);

  // Validate form data
  const validate = () => {
    const newErrors = {};
    
    if (!formData.expense_category_id) {
      newErrors.expense_category_id = 'Category is required';
    }
    
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    if (!formData.vendor_name) {
      newErrors.vendor_name = 'Vendor name is required';
    }
    
    if (!formData.expense_date) {
      newErrors.expense_date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      // Convert amount to number
      amount: parseFloat(formData.amount),
      // Convert empty strings to null for optional fields
      description: formData.description || null,
      vendor_contact: formData.vendor_contact || null,
      payment_method_id: formData.payment_method_id || null,
      transaction_id: formData.transaction_id || null,
      notes: formData.notes || null
    };

    onSubmit(submitData);
  };

  // Get category name for display
  const getCategoryName = (categoryId) => {
    if (!categoryId) return '';
    const category = categories.find(c => c.id === parseInt(categoryId));
    return category ? category.name : `Category ${categoryId}`;
  };

  return (
    <Card title={expense ? 'Edit Expense' : 'Create New Expense'}>
      <form onSubmit={handleSubmit} className="expense-form">
        {/* Category Selection */}
        <div className="form-group">
          <label htmlFor="expense_category_id">
            Category *
          </label>
          <select
            id="expense_category_id"
            name="expense_category_id"
            value={formData.expense_category_id}
            onChange={handleChange}
            disabled={isLoadingCategories || loading}
            className={`form-control ${errors.expense_category_id ? 'is-invalid' : ''}`}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.expense_category_id && (
            <div className="invalid-feedback">{errors.expense_category_id}</div>
          )}
        </div>

        {/* Amount */}
        <div className="form-group">
          <label htmlFor="amount">
            Amount (KES) *
          </label>
          <Input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            disabled={loading}
            placeholder="Enter amount"
            step="0.01"
            min="0"
            className={errors.amount ? 'is-invalid' : ''}
          />
          {errors.amount && (
            <div className="invalid-feedback">{errors.amount}</div>
          )}
        </div>

        {/* Vendor Name */}
        <div className="form-group">
          <label htmlFor="vendor_name">
            Vendor Name *
          </label>
          <Input
            type="text"
            id="vendor_name"
            name="vendor_name"
            value={formData.vendor_name}
            onChange={handleChange}
            disabled={loading}
            placeholder="Enter vendor name"
            className={errors.vendor_name ? 'is-invalid' : ''}
          />
          {errors.vendor_name && (
            <div className="invalid-feedback">{errors.vendor_name}</div>
          )}
        </div>

        {/* Vendor Contact */}
        <div className="form-group">
          <label htmlFor="vendor_contact">
            Vendor Contact
          </label>
          <Input
            type="text"
            id="vendor_contact"
            name="vendor_contact"
            value={formData.vendor_contact}
            onChange={handleChange}
            disabled={loading}
            placeholder="Enter vendor contact (phone/email)"
          />
        </div>

        {/* Expense Date */}
        <div className="form-group">
          <label htmlFor="expense_date">
            Date *
          </label>
          <Input
            type="date"
            id="expense_date"
            name="expense_date"
            value={formData.expense_date}
            onChange={handleChange}
            disabled={loading}
            className={errors.expense_date ? 'is-invalid' : ''}
          />
          {errors.expense_date && (
            <div className="invalid-feedback">{errors.expense_date}</div>
          )}
        </div>

        {/* Receipt Number */}
        <div className="form-group">
          <label htmlFor="receipt_number">
            Receipt Number
          </label>
          <Input
            type="text"
            id="receipt_number"
            name="receipt_number"
            value={formData.receipt_number}
            onChange={handleChange}
            disabled={loading}
            placeholder="Enter receipt number"
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
            placeholder="Enter expense description"
            rows={3}
            className="form-control"
          />
        </div>

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            disabled={loading}
            placeholder="Additional notes"
            rows={2}
            className="form-control"
          />
        </div>

        {/* Verification Status */}
        <div className="form-group form-check">
          <Input
            type="checkbox"
            id="is_verified"
            name="is_verified"
            checked={formData.is_verified}
            onChange={handleChange}
            disabled={loading}
            className="form-check-input"
          />
          <label htmlFor="is_verified" className="form-check-label">
            Verified
          </label>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (expense ? 'Update Expense' : 'Create Expense')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

ExpenseForm.propTypes = {
  expense: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default ExpenseForm;

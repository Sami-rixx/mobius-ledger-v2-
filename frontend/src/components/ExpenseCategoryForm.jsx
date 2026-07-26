import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card } from './index.js';
import { getAllExpenseCategories } from '../services/expenseCategoryService.js';

/**
 * ExpenseCategoryForm Component
 * Reusable form for creating and editing expense category records
 * 
 * @param {Object} props - Component props
 * @param {Object} props.category - Category data to edit (null for new category)
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 */
function ExpenseCategoryForm({ category, onSubmit, onCancel, loading = false }) {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    description: '',
    is_active: true,
    is_system: false,
    is_kitchen: false
  });

  // Validation and data state
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Load categories for parent dropdown (exclude current category)
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

  // Initialize form with category data
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        parent_id: category.parent_id || '',
        description: category.description || '',
        is_active: category.is_active !== undefined ? category.is_active : true,
        is_system: category.is_system !== undefined ? category.is_system : false,
        is_kitchen: category.is_kitchen !== undefined ? category.is_kitchen : false
      });
    }
  }, [category]);

  // Validate form data
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Category name is required';
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
      // Convert empty string to null for parent_id (no parent)
      parent_id: formData.parent_id === '' ? null : parseInt(formData.parent_id)
    };

    onSubmit(submitData);
  };

  // Get parent category name for display
  const getParentName = (parentId) => {
    if (!parentId) return 'None (Root Category)';
    const parentCategory = categories.find(c => c.id === parseInt(parentId));
    return parentCategory ? parentCategory.name : `Category ${parentId}`;
  };

  return (
    <Card title={category ? 'Edit Expense Category' : 'Create New Expense Category'}>
      <form onSubmit={handleSubmit} className="expense-category-form">
        {/* Category Name */}
        <div className="form-group">
          <label htmlFor="name">
            Category Name *
          </label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            placeholder="Enter category name"
            className={errors.name ? 'is-invalid' : ''}
          />
          {errors.name && (
            <div className="invalid-feedback">{errors.name}</div>
          )}
        </div>

        {/* Parent Category */}
        <div className="form-group">
          <label htmlFor="parent_id">
            Parent Category
          </label>
          <select
            id="parent_id"
            name="parent_id"
            value={formData.parent_id}
            onChange={handleChange}
            disabled={isLoadingCategories || loading}
            className="form-control"
          >
            <option value="">None (Root Category)</option>
            {categories
              .filter(c => c.id !== category?.id) // Exclude current category
              .map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
          <small className="form-text text-muted">
            Leave blank to create a root-level category
          </small>
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
            placeholder="Enter category description"
            rows={3}
            className="form-control"
          />
        </div>

        {/* Active Status */}
        <div className="form-group form-check">
          <Input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            disabled={loading}
            className="form-check-input"
          />
          <label htmlFor="is_active" className="form-check-label">
            Active
          </label>
          <small className="form-text text-muted">
            Inactive categories won't appear in dropdowns
          </small>
        </div>

        {/* System Category */}
        <div className="form-group form-check">
          <Input
            type="checkbox"
            id="is_system"
            name="is_system"
            checked={formData.is_system}
            onChange={handleChange}
            disabled={loading}
            className="form-check-input"
          />
          <label htmlFor="is_system" className="form-check-label">
            System Category
          </label>
          <small className="form-text text-muted">
            System categories cannot be deleted
          </small>
        </div>

        {/* Kitchen Category */}
        <div className="form-group form-check">
          <Input
            type="checkbox"
            id="is_kitchen"
            name="is_kitchen"
            checked={formData.is_kitchen}
            onChange={handleChange}
            disabled={loading}
            className="form-check-input"
          />
          <label htmlFor="is_kitchen" className="form-check-label">
            Kitchen Category
          </label>
          <small className="form-text text-muted">
            Mark as kitchen-related expense
          </small>
        </div>

        {/* Current Parent Info (for edit mode) */}
        {category && category.parent_id && (
          <div className="form-group">
            <label>Current Parent</label>
            <div className="form-control-static">
              {getParentName(category.parent_id)}
            </div>
          </div>
        )}

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
            {loading ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

ExpenseCategoryForm.propTypes = {
  category: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default ExpenseCategoryForm;

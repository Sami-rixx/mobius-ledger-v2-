import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card } from './index.js';

/**
 * IncomeCategoryForm Component
 * Reusable form for creating and editing income categories
 * 
 * @param {Object} props - Component props
 * @param {Object} props.category - Category data to edit (null for new category)
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 */
function IncomeCategoryForm({ category, onSubmit, onCancel, loading = false }) {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    color: '#8B4513',
    icon: ''
  });

  // Validation state
  const [errors, setErrors] = useState({});

  // Initialize form with category data
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        is_active: category.is_active !== undefined ? category.is_active : true,
        color: category.color || '#8B4513',
        icon: category.icon || ''
      });
    }
  }, [category]);

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

    if (!formData.name?.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Category name must be 100 characters or less';
    }

    if (formData.description?.trim() && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    if (formData.color?.trim() && !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      newErrors.color = 'Color must be a valid hex code (e.g., #8B4513)';
    }

    if (formData.icon?.trim() && formData.icon.length > 50) {
      newErrors.icon = 'Icon must be 50 characters or less';
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
      is_active: formData.is_active
    };

    onSubmit(submitData);
  };

  return (
    <Card title={category ? 'Edit Income Category' : 'Add New Income Category'}>
      <form onSubmit={handleSubmit} className="income-category-form">
        <div className="form-grid">
          <div className="form-column">
            <Input
              name="name"
              label="Category Name *"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
              placeholder="e.g., School Fees, Donations, Fundraising"
              disabled={loading}
            />

            <Input
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
              placeholder="Describe the purpose of this category"
              disabled={loading}
              type="textarea"
              rows={3}
            />

            <Input
              name="icon"
              label="Icon (Optional)"
              value={formData.icon}
              onChange={handleChange}
              error={errors.icon}
              placeholder="e.g., money, school, gift"
              disabled={loading}
            />
          </div>

          <div className="form-column">
            <div className="form-group">
              <label htmlFor="is_active">Status</label>
              <select
                id="is_active"
                name="is_active"
                value={formData.is_active}
                onChange={handleChange}
                className={errors.is_active ? 'input-error' : ''}
                disabled={loading}
              >
                <option value={true}>Active</option>
                <option value={false}>Inactive</option>
              </select>
              {errors.is_active && <p className="input-error-message">{errors.is_active}</p>}
            </div>

            <Input
              name="color"
              label="Color"
              type="color"
              value={formData.color}
              onChange={handleChange}
              error={errors.color}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-actions">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : category ? 'Update Category' : 'Add Category'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

IncomeCategoryForm.propTypes = {
  category: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default IncomeCategoryForm;

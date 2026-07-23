import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card } from './index.js';
import { checkClassName } from '../services/classService.js';

/**
 * ClassForm Component
 * Reusable form for creating and editing classes
 * 
 * @param {Object} props - Component props
 * @param {Object} props.classData - Class data to edit (null for new class)
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 */
function ClassForm({ classData, onSubmit, onCancel, loading = false }) {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  // Validation and availability state
  const [errors, setErrors] = useState({});
  const [isNameAvailable, setIsNameAvailable] = useState(true);
  const [isCheckingName, setIsCheckingName] = useState(false);

  // Initialize form with class data
  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || '',
        description: classData.description || '',
        is_active: classData.is_active !== undefined ? classData.is_active : true
      });
    }
  }, [classData]);

  // Check class name availability
  useEffect(() => {
    const name = formData.name?.trim();
    if (!name || name === classData?.name) {
      setIsNameAvailable(true);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      if (name.length >= 2) {
        setIsCheckingName(true);
        try {
          const result = await checkClassName(name, classData?.id);
          setIsNameAvailable(result.available !== false);
        } catch (error) {
          setIsNameAvailable(true);
        } finally {
          setIsCheckingName(false);
        }
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [formData.name, classData?.id, classData?.name]);

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
      newErrors.name = 'Class name is required';
    } else if (!isNameAvailable && formData.name !== classData?.name) {
      newErrors.name = 'Class name is already taken';
    }

    if (formData.name?.trim() && formData.name.length > 100) {
      newErrors.name = 'Class name must be 100 characters or less';
    }

    if (formData.description?.trim() && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
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

    onSubmit(formData);
  };

  return (
    <Card title={classData ? 'Edit Class' : 'Add New Class'}>
      <form onSubmit={handleSubmit} className="class-form">
        <div className="form-grid">
          <div className="form-column">
            <Input
              name="name"
              label="Class Name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
              placeholder="e.g., Grade 1, Form 2, Class A"
              disabled={loading}
            />

            <Input
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
              placeholder="Optional description of the class"
              disabled={loading}
            />

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
          </div>
        </div>

        <div className="form-actions">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : classData ? 'Update Class' : 'Add Class'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

ClassForm.propTypes = {
  classData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default ClassForm;

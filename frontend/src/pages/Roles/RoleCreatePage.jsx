import React, { useState, useCallback } from 'react';
import { Card, Button, Alert, Input, Spinner } from '../../../components/index.js';
import { createRole } from '../../../services/roleService.js';
import { useNavigate } from 'react-router-dom';

/**
 * RoleCreatePage Component
 * Page for creating a new role
 */
function RoleCreatePage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    is_default: false
  });

  // Handle input change
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  // Handle form submit
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate form data
      if (!formData.name.trim()) {
        setError('Role name is required');
        setIsSubmitting(false);
        return;
      }

      const result = await createRole(formData);
      
      if (result.success || result.data) {
        setSuccess('Role created successfully!');
        
        // Navigate to the detail page after a short delay
        setTimeout(() => {
          navigate(`/roles/${result.data.id}`);
        }, 1000);
      } else {
        setError(result.error || 'Failed to create role');
      }
    } catch (err) {
      setError(err.message || 'Failed to create role');
      console.error('Error creating role:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, navigate]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate('/roles');
  }, [navigate]);

  return (
    <div className="page role-create-page">
      <div className="page__header">
        <h1>Create New Role</h1>
        <p className="page__description">
          Create a new role for role-based access control
        </p>
      </div>

      <div className="page__content">
        {/* Success Message */}
        {success && (
          <Alert type="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Form Card */}
        <Card title="Role Details" className="role-create-card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Name */}
              <div className="form-group">
                <label htmlFor="name">Role Name *</label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., administrator"
                  required
                />
                <span className="form-hint">Unique identifier for the role</span>
              </div>

              {/* Description */}
              <div className="form-group full-width">
                <label htmlFor="description">Description</label>
                <Input
                  id="description"
                  name="description"
                  type="textarea"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detailed description of what this role allows"
                  rows={3}
                />
                <span className="form-hint">Optional description of the role</span>
              </div>

              {/* Active Status */}
              <div className="form-group">
                <label>
                  <Input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <span style={{ marginLeft: '8px' }}>Active</span>
                </label>
                <span className="form-hint">Whether this role is active and can be assigned</span>
              </div>

              {/* Default Role */}
              <div className="form-group">
                <label>
                  <Input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleInputChange}
                  />
                  <span style={{ marginLeft: '8px' }}>Default Role</span>
                </label>
                <span className="form-hint">Whether new users are automatically assigned this role</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Role'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="submitting-overlay">
            <Spinner />
          </div>
        )}
      </div>
    </div>
  );
}

export default RoleCreatePage;

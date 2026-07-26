import React, { useState, useCallback } from 'react';
import { Card, Button, Alert, Input, Spinner } from '../../../components/index.js';
import { createPermission } from '../../../services/permissionService.js';
import { useNavigate } from 'react-router-dom';

/**
 * PermissionCreatePage Component
 * Page for creating a new permission
 */
function PermissionCreatePage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    module: '',
    is_active: true
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
        setError('Permission name is required');
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.module.trim()) {
        setError('Module is required');
        setIsSubmitting(false);
        return;
      }

      const result = await createPermission(formData);
      
      if (result.success || result.data) {
        setSuccess('Permission created successfully!');
        
        // Navigate to the detail page after a short delay
        setTimeout(() => {
          navigate(`/permissions/${result.data.id}`);
        }, 1000);
      } else {
        setError(result.error || 'Failed to create permission');
      }
    } catch (err) {
      setError(err.message || 'Failed to create permission');
      console.error('Error creating permission:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, navigate]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate('/permissions');
  }, [navigate]);

  return (
    <div className="page permission-create-page">
      <div className="page__header">
        <h1>Create New Permission</h1>
        <p className="page__description">
          Create a new permission for role-based access control
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
        <Card title="Permission Details" className="permission-create-card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Name */}
              <div className="form-group">
                <label htmlFor="name">Permission Name *</label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., create_student"
                  required
                />
                <span className="form-hint">Unique identifier for the permission</span>
              </div>

              {/* Module */}
              <div className="form-group">
                <label htmlFor="module">Module *</label>
                <Input
                  id="module"
                  name="module"
                  type="text"
                  value={formData.module}
                  onChange={handleInputChange}
                  placeholder="e.g., students, users, reports"
                  required
                />
                <span className="form-hint">Functional area this permission belongs to</span>
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
                  placeholder="Detailed description of what this permission allows"
                  rows={3}
                />
                <span className="form-hint">Optional description of the permission</span>
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
                <span className="form-hint">Whether this permission is active and can be assigned</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Permission'}
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

export default PermissionCreatePage;

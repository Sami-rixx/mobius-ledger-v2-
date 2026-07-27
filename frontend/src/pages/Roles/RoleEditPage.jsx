import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert, Input, Spinner } from '@/components';
import { getRoleById, updateRole } from '@/services/roleService';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * RoleEditPage Component
 * Page for editing an existing role
 */
function RoleEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    description: '',
    is_active: true,
    is_default: false
  });

  // Load role data
  const loadRole = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getRoleById(Number(id));
      if (result.data) {
        setFormData({
          id: result.data.id,
          name: result.data.name || '',
          description: result.data.description || '',
          is_active: result.data.is_active === 1 || result.data.is_active === true,
          is_default: result.data.is_default === 1 || result.data.is_default === true
        });
      } else {
        setError('Role not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load role');
      console.error('Error loading role:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    loadRole();
  }, [loadRole]);

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

      const result = await updateRole(formData.id, {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active ? 1 : 0,
        is_default: formData.is_default ? 1 : 0
      });
      
      if (result.success || result.data) {
        setSuccess('Role updated successfully!');
        
        // Navigate to the detail page after a short delay
        setTimeout(() => {
          navigate(`/roles/${formData.id}`);
        }, 1000);
      } else {
        setError(result.error || 'Failed to update role');
      }
    } catch (err) {
      setError(err.message || 'Failed to update role');
      console.error('Error updating role:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, navigate]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate(`/roles/${formData.id}`);
  }, [formData.id, navigate]);

  // Render loading state
  if (loading) {
    return (
      <div className="page role-edit-page">
        <div className="page__header">
          <h1>Edit Role</h1>
        </div>
        <Spinner text="Loading role..." />
      </div>
    );
  }

  // Render error state
  if (error && !formData.id) {
    return (
      <div className="page role-edit-page">
        <div className="page__header">
          <h1>Edit Role</h1>
        </div>
        <Alert type="error" message={error} onClose={() => navigate('/roles')} />
      </div>
    );
  }

  return (
    <div className="page role-edit-page">
      <div className="page__header">
        <h1>Edit Role</h1>
        <p className="page__description">
          Edit role #{formData.id} - {formData.name}
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
        <Card title="Role Details" className="role-edit-card">
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
                {isSubmitting ? 'Updating...' : 'Update Role'}
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

export default RoleEditPage;

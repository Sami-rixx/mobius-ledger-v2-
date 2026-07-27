import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert, Input, Spinner } from '@/components';
import { getPermissionById, updatePermission } from '@/services/permissionService';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * PermissionEditPage Component
 * Page for editing an existing permission
 */
function PermissionEditPage() {
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
    module: '',
    is_active: true
  });

  // Load permission data
  const loadPermission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getPermissionById(Number(id));
      if (result.data) {
        setFormData({
          id: result.data.id,
          name: result.data.name || '',
          description: result.data.description || '',
          module: result.data.module || '',
          is_active: result.data.is_active === 1 || result.data.is_active === true
        });
      } else {
        setError('Permission not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load permission');
      console.error('Error loading permission:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    loadPermission();
  }, [loadPermission]);

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

      const result = await updatePermission(formData.id, {
        name: formData.name,
        description: formData.description,
        module: formData.module,
        is_active: formData.is_active ? 1 : 0
      });
      
      if (result.success || result.data) {
        setSuccess('Permission updated successfully!');
        
        // Navigate to the detail page after a short delay
        setTimeout(() => {
          navigate(`/permissions/${formData.id}`);
        }, 1000);
      } else {
        setError(result.error || 'Failed to update permission');
      }
    } catch (err) {
      setError(err.message || 'Failed to update permission');
      console.error('Error updating permission:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, navigate]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate(`/permissions/${formData.id}`);
  }, [formData.id, navigate]);

  // Render loading state
  if (loading) {
    return (
      <div className="page permission-edit-page">
        <div className="page__header">
          <h1>Edit Permission</h1>
        </div>
        <Spinner text="Loading permission..." />
      </div>
    );
  }

  // Render error state
  if (error && !formData.id) {
    return (
      <div className="page permission-edit-page">
        <div className="page__header">
          <h1>Edit Permission</h1>
        </div>
        <Alert type="error" message={error} onClose={() => navigate('/permissions')} />
      </div>
    );
  }

  return (
    <div className="page permission-edit-page">
      <div className="page__header">
        <h1>Edit Permission</h1>
        <p className="page__description">
          Edit permission #{formData.id} - {formData.name}
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
        <Card title="Permission Details" className="permission-edit-card">
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
                {isSubmitting ? 'Updating...' : 'Update Permission'}
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

export default PermissionEditPage;

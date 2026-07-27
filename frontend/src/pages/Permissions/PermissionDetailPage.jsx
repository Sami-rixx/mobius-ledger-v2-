import React, { useState, useEffect, useCallback } from 'react';
import { PermissionCard, Button, Alert, Spinner } from '@/components';
import { getPermissionById, deletePermission } from '@/services/permissionService';
import { getRolesWithPermissionCount } from '@/services/roleService';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * PermissionDetailPage Component
 * Page for viewing permission details with management actions
 */
function PermissionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [permission, setPermission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rolesCount, setRolesCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load permission data
  const loadPermission = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [permissionResult, rolesResult] = await Promise.all([
        getPermissionById(Number(id)),
        getRolesWithPermissionCount()
      ]);
      
      if (permissionResult.data) {
        setPermission(permissionResult.data);
        
        // Find this permission in the roles count
        const thisPermissionRoles = rolesResult.data?.find(p => p.permission_id === Number(id));
        if (thisPermissionRoles) {
          setRolesCount(thisPermissionRoles.role_count || 0);
        }
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

  // Handle edit
  const handleEdit = useCallback(() => {
    navigate(`/permissions/${permission.id}/edit`);
  }, [permission, navigate]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!window.confirm(`Are you sure you want to delete permission "${permission.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await deletePermission(permission.id);
      navigate('/permissions');
    } catch (err) {
      setError(err.message || 'Failed to delete permission');
    } finally {
      setIsDeleting(false);
    }
  }, [permission, navigate]);

  // Handle back
  const handleBack = useCallback(() => {
    navigate('/permissions');
  }, [navigate]);

  // Render loading state
  if (loading) {
    return (
      <div className="page permission-detail-page">
        <div className="page__header">
          <h1>Permission Details</h1>
        </div>
        <Spinner text="Loading permission..." />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="page permission-detail-page">
        <div className="page__header">
          <h1>Permission Details</h1>
        </div>
        <Alert type="error" message={error} onClose={() => navigate('/permissions')} />
      </div>
    );
  }

  // Render
  return (
    <div className="page permission-detail-page">
      <div className="page__header">
        <h1>Permission Details</h1>
        <p className="page__description">
          View and manage permission #{permission.id}
        </p>
      </div>

      <div className="page__content">
        {/* Error Message */}
        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        {/* Permission Card */}
        <div className="permission-detail-card">
          <PermissionCard
            permission={permission}
            showActions={false}
          />
        </div>

        {/* Statistics */}
        <div className="page__stats">
          <div className="stat-card">
            <div className="stat-card__value">{rolesCount}</div>
            <div className="stat-card__label">Roles with this permission</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <Button variant="primary" onClick={handleEdit}>
            Edit Permission
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Permission'}
          </Button>
          <Button variant="secondary" onClick={handleBack}>
            Back to List
          </Button>
        </div>

        {/* Loading Overlay */}
        {isDeleting && (
          <div className="submitting-overlay">
            <Spinner />
          </div>
        )}
      </div>
    </div>
  );
}

export default PermissionDetailPage;

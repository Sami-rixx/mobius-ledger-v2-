import React, { useState, useEffect, useCallback } from 'react';
import { RoleCard, Button, Alert, Spinner } from '@/components';
import { getRoleById, deleteRole } from '@/services/roleService';
import { getUserCountForRole } from '@/services/userRoleService';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * RoleDetailPage Component
 * Page for viewing role details with management actions
 */
function RoleDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usersCount, setUsersCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load role data
  const loadRole = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const roleResult = await getRoleById(Number(id));
      
      if (roleResult.data) {
        setRole(roleResult.data);
        
        // Get user count for this role
        try {
          const countResult = await getUserCountForRole(roleResult.data.id);
          setUsersCount(countResult.data?.count || countResult.data || 0);
        } catch (countErr) {
          console.warn('Could not load user count for role:', countErr);
          setUsersCount(0);
        }
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

  // Handle edit
  const handleEdit = useCallback(() => {
    navigate(`/roles/${role.id}/edit`);
  }, [role, navigate]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!window.confirm(`Are you sure you want to delete role "${role.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteRole(role.id);
      navigate('/roles');
    } catch (err) {
      setError(err.message || 'Failed to delete role');
    } finally {
      setIsDeleting(false);
    }
  }, [role, navigate]);

  // Handle back
  const handleBack = useCallback(() => {
    navigate('/roles');
  }, [navigate]);

  // Render loading state
  if (loading) {
    return (
      <div className="page role-detail-page">
        <div className="page__header">
          <h1>Role Details</h1>
        </div>
        <Spinner text="Loading role..." />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="page role-detail-page">
        <div className="page__header">
          <h1>Role Details</h1>
        </div>
        <Alert type="error" message={error} onClose={() => navigate('/roles')} />
      </div>
    );
  }

  // Render
  return (
    <div className="page role-detail-page">
      <div className="page__header">
        <h1>Role Details</h1>
        <p className="page__description">
          View and manage role #{role.id}
        </p>
      </div>

      <div className="page__content">
        {/* Error Message */}
        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        {/* Role Card */}
        <div className="role-detail-card">
          <RoleCard
            role={role}
            showActions={false}
          />
        </div>

        {/* Statistics */}
        <div className="page__stats">
          <div className="stat-card">
            <div className="stat-card__value">{usersCount}</div>
            <div className="stat-card__label">Users with this role</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <Button variant="primary" onClick={handleEdit}>
            Edit Role
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting || role.is_default}>
            {isDeleting ? 'Deleting...' : 'Delete Role'}
          </Button>
          {role.is_default && (
            <span className="form-hint" style={{ marginLeft: '12px', color: '#666' }}>
              (Cannot delete default role)
            </span>
          )}
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

export default RoleDetailPage;

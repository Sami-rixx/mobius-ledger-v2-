import React, { useState, useEffect, useCallback } from 'react';
import { RoleList, Button, Alert, Spinner } from '@/components';
import { getRoles, getRoleStats } from '@/services/roleService';
import { useNavigate } from 'react-router-dom';

/**
 * RoleListPage Component
 * Displays a paginated list of roles with filtering and management capabilities
 */
function RoleListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [filters, setFilters] = useState({});
  const [actionMessage, setActionMessage] = useState(null);

  // Load statistics
  const loadMetaData = useCallback(async () => {
    try {
      const statsResult = await getRoleStats();
      setStatistics(statsResult.data || null);
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  }, []);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await loadMetaData();
      } catch (err) {
        setError(err.message || 'Failed to load role data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [loadMetaData]);

  // Handle create role
  const handleCreateRole = useCallback(() => {
    navigate('/roles/create');
  }, [navigate]);

  // Handle role click
  const handleRoleClick = useCallback((role) => {
    navigate(`/roles/${role.id}`);
  }, [navigate]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadMetaData();
  }, [loadMetaData]);

  // Clear action message
  const clearActionMessage = useCallback(() => {
    setActionMessage(null);
  }, []);

  // Render
  return (
    <div className="page role-list-page">
      <div className="page__header">
        <h1>Roles Management</h1>
        <p className="page__description">
          View, create, edit, and delete roles for role-based access control.
        </p>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <Alert type="success" message={actionMessage} onClose={clearActionMessage} />
      )}

      {/* Error Message */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {/* Statistics */}
      {statistics && (
        <div className="page__stats">
          <div className="stat-card">
            <div className="stat-card__value">{statistics.total || 0}</div>
            <div className="stat-card__label">Total Roles</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{statistics.active || 0}</div>
            <div className="stat-card__label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{statistics.inactive || 0}</div>
            <div className="stat-card__label">Inactive</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{statistics.default || 0}</div>
            <div className="stat-card__label">Default Roles</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="page__actions">
        <Button variant="primary" onClick={handleCreateRole}>
          Create Role
        </Button>
        <Button variant="secondary" onClick={handleRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Loading State */}
      {loading && !statistics ? (
        <Spinner text="Loading roles..." />
      ) : (
        /* Role List */
        <RoleList
          search={filters.search}
          isDefault={filters.isDefault}
          isActive={filters.isActive}
          pageSize={20}
          showPagination={true}
          onRoleClick={handleRoleClick}
        />
      )}
    </div>
  );
}

export default RoleListPage;

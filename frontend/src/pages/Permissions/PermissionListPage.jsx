import React, { useState, useEffect, useCallback } from 'react';
import { PermissionList, Button, Alert, Spinner } from '@/components';
import { getPermissions, getPermissionStats, getPermissionModules } from '@/services/permissionService';
import { useNavigate } from 'react-router-dom';

/**
 * PermissionListPage Component
 * Displays a paginated list of permissions with filtering and management capabilities
 */
function PermissionListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [modules, setModules] = useState([]);
  const [filters, setFilters] = useState({});
  const [actionMessage, setActionMessage] = useState(null);

  // Load statistics and modules
  const loadMetaData = useCallback(async () => {
    try {
      const [statsResult, modulesResult] = await Promise.all([
        getPermissionStats(),
        getPermissionModules()
      ]);
      setStatistics(statsResult.data || null);
      setModules(modulesResult.data || []);
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
        setError(err.message || 'Failed to load permission data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [loadMetaData]);

  // Handle create permission
  const handleCreatePermission = useCallback(() => {
    navigate('/permissions/create');
  }, [navigate]);

  // Handle permission click
  const handlePermissionClick = useCallback((permission) => {
    navigate(`/permissions/${permission.id}`);
  }, [navigate]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    // The list component handles its own refresh
    loadMetaData();
  }, [loadMetaData]);

  // Clear action message
  const clearActionMessage = useCallback(() => {
    setActionMessage(null);
  }, []);

  // Render
  return (
    <div className="page permission-list-page">
      <div className="page__header">
        <h1>Permissions Management</h1>
        <p className="page__description">
          View, create, edit, and delete permissions for role-based access control.
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
            <div className="stat-card__label">Total Permissions</div>
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
            <div className="stat-card__value">{modules.length}</div>
            <div className="stat-card__label">Modules</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="page__actions">
        <Button variant="primary" onClick={handleCreatePermission}>
          Create Permission
        </Button>
        <Button variant="secondary" onClick={handleRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Loading State */}
      {loading && !statistics ? (
        <Spinner text="Loading permissions..." />
      ) : (
        /* Permission List */
        <PermissionList
          module={filters.module}
          search={filters.search}
          isActive={filters.isActive}
          pageSize={20}
          showPagination={true}
          onPermissionClick={handlePermissionClick}
        />
      )}
    </div>
  );
}

export default PermissionListPage;

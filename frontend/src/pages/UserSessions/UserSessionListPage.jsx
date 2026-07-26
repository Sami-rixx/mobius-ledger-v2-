import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert, Spinner, UserSessionTable, UserSessionFilter } from '../../../components/index.js';
import { getSessions, getSessionStats, deactivateSession, deleteSession, extendSession } from '../../../services/index.js';
import { useNavigate } from 'react-router-dom';

/**
 * UserSessionListPage Component
 * Displays a paginated list of user sessions with filtering and management capabilities
 */
function UserSessionListPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load sessions
  const loadSessions = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        pageSize: 20,
        ...filters
      };
      
      // Remove undefined/empty values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });
      
      const result = await getSessions(params);
      setSessions(result.data || []);
      setPagination(result.pagination || null);
      
      // Load statistics
      const statsResult = await getSessionStats();
      setStatistics(statsResult.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load user sessions');
      console.error('Error loading user sessions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    loadSessions(1);
  }, [loadSessions]);

  // Apply filters with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(filters).some(key => filters[key] !== undefined && filters[key] !== '')) {
        loadSessions(1);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filters, loadSessions]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    loadSessions(page);
  }, [loadSessions]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadSessions(pagination?.page || 1);
  }, [loadSessions, pagination?.page]);

  // Handle deactivate
  const handleDeactivate = async (session) => {
    try {
      if (!window.confirm(`Are you sure you want to deactivate session #${session.id}?`)) {
        return;
      }
      
      await deactivateSession(session.id);
      setActionMessage('Session deactivated successfully');
      loadSessions(pagination?.page || 1);
      
      // Clear message after 3 seconds
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to deactivate session');
    }
  };

  // Handle extend
  const handleExtend = async (session) => {
    try {
      await extendSession(session.id, 24);
      setActionMessage('Session extended by 24 hours');
      loadSessions(pagination?.page || 1);
      
      // Clear message after 3 seconds
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to extend session');
    }
  };

  // Handle delete
  const handleDelete = async (session) => {
    if (!window.confirm(`Are you sure you want to delete session #${session.id}? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteSession(session.id);
      setActionMessage('Session deleted successfully');
      // Reload the list
      loadSessions(pagination?.page || 1);
      
      // Clear message after 3 seconds
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete session');
    } finally {
      setDeleting(false);
    }
  };

  // Handle view
  const handleView = useCallback((session) => {
    navigate(`/user-sessions/${session.id}`);
  }, [navigate]);

  // Handle create new session
  const handleCreate = useCallback(() => {
    navigate('/user-sessions/create');
  }, [navigate]);

  return (
    <div className="page user-session-list-page">
      <header className="page-header">
        <h1>User Sessions</h1>
        <p>Manage and monitor user authentication sessions</p>
      </header>

      <main className="page-content">
        {/* Action Message */}
        {actionMessage && (
          <Alert type="success" onClose={() => setActionMessage(null)}>
            {actionMessage}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Statistics Card */}
        {statistics && (
          <Card title="Session Statistics" className="statistics-card">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Sessions:</span>
                <span className="stat-value">{statistics.total}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Active:</span>
                <span className="stat-value stat-value-success">{statistics.active}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Inactive:</span>
                <span className="stat-value stat-value-danger">{statistics.inactive}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Active %:</span>
                <span className="stat-value">{statistics.activePercentage}%</span>
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <Card className="actions-card">
          <div className="actions-bar">
            <Button variant="primary" onClick={handleCreate} disabled={loading || refreshing}>
              Create New Session
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={loading || refreshing}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </Card>

        {/* Filter */}
        <Card title="Filters" className="filter-card">
          <UserSessionFilter
            userId={filters.userId}
            isActive={filters.isActive}
            ipAddress={filters.ipAddress}
            search={filters.search}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </Card>

        {/* Loading State */}
        {loading && !refreshing && (
          <div className="loading-state">
            <Spinner />
          </div>
        )}

        {/* Sessions Table */}
        {!loading && (
          <Card title={`User Sessions (${sessions.length})`} className="data-card">
            <UserSessionTable
              sessions={sessions}
              showActions={true}
              onDeactivate={handleDeactivate}
              onExtend={handleExtend}
              onDelete={handleDelete}
              onView={handleView}
            />
          </Card>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Card className="pagination-card">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </Card>
        )}
      </main>
    </div>
  );
}

export default UserSessionListPage;

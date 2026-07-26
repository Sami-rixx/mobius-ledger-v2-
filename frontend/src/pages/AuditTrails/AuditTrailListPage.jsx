import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, AuditTrailTable, AuditTrailFilter, AuditTrailCard } from '../../../components/index.js';
import { getAuditTrails, deleteAuditTrail } from '../../../services/index.js';
import { useNavigate } from 'react-router-dom';

/**
 * AuditTrailListPage Component
 * Displays a paginated list of audit trail entries with search and filter capabilities
 */
function AuditTrailListPage() {
  const navigate = useNavigate();
  const [auditTrails, setAuditTrails] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load audit trails
  const loadAuditTrails = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        pageSize: 20,
        ...filters
      };
      
      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });
      
      const result = await getAuditTrails(params);
      setAuditTrails(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load audit trails');
      console.error('Error loading audit trails:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    loadAuditTrails(1);
  }, [loadAuditTrails]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    loadAuditTrails(page);
  }, [loadAuditTrails]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Handle search
  const handleSearch = useCallback(() => {
    loadAuditTrails(1);
  }, [loadAuditTrails]);

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    setFilters({});
    loadAuditTrails(1);
  }, [loadAuditTrails]);

  // Apply filters with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(filters).some(key => filters[key])) {
        loadAuditTrails(1);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filters, loadAuditTrails]);

  // Handle delete
  const handleDelete = async (auditTrail) => {
    if (!window.confirm(`Are you sure you want to delete audit trail entry #${auditTrail.id}? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAuditTrail(auditTrail.id);
      // Reload the list
      loadAuditTrails(pagination?.page || 1);
    } catch (err) {
      setError(err.message || 'Failed to delete audit trail entry');
    } finally {
      setDeleting(false);
    }
  };

  // Handle view details
  const handleViewDetails = useCallback((auditTrail) => {
    navigate(`/audit-trail/${auditTrail.id}`);
  }, [navigate]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadAuditTrails(pagination?.page || 1);
  }, [loadAuditTrails, pagination?.page]);

  return (
    <div className="page audit-trail-list-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Audit Trail</h1>
          <p className="page-subtitle">Track all changes to financial data</p>
        </div>
        <div className="page-actions">
          <Button onClick={handleRefresh} disabled={loading || deleting} variant="outline">
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="error-card" variant="danger">
          <p>{error}</p>
          <Button onClick={handleRefresh} size="sm">
            Retry
          </Button>
        </Card>
      )}

      {/* Filter Controls */}
      <Card className="filter-card">
        <AuditTrailFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          disabled={loading || deleting}
          showTableFilter={true}
        />
      </Card>

      {/* Results Count */}
      {pagination && !loading && (
        <p className="results-info">
          Showing {auditTrails.length} of {pagination.total} audit trail entries
        </p>
      )}

      {/* Audit Trail Table */}
      <AuditTrailTable
        auditTrails={auditTrails}
        pagination={pagination}
        onPageChange={handlePageChange}
        loading={loading}
        compact={false}
      />

      {/* Empty State */}
      {!loading && auditTrails.length === 0 && !error && (
        <Card className="empty-state">
          <p>No audit trail entries found</p>
          {Object.keys(filters).length > 0 && (
            <Button onClick={handleResetFilters} size="sm" variant="outline">
              Clear Filters
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}

export default AuditTrailListPage;

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AuditTrailCard, AuditTrailTable, AuditTrailFilter, LoadingSpinner } from './index.js';
import { getAuditTrails, getAuditTrailCount } from '../services/auditTrailService.js';

/**
 * AuditTrailList Component
 * Displays a list of audit trail entries with filtering and pagination
 * 
 * @param {Object} props - Component props
 * @param {string} props.tableName - Filter by specific table name
 * @param {number} props.recordId - Filter by specific record ID
 * @param {number} props.userId - Filter by specific user ID
 * @param {boolean} props.compact - Whether to use compact card layout
 * @param {number} props.pageSize - Number of items per page
 * @param {Function} props.onAuditTrailClick - Click handler for audit trail entry
 */
function AuditTrailList({
  tableName,
  recordId,
  userId,
  compact = false,
  pageSize = 20,
  onAuditTrailClick
}) {
  const [auditTrails, setAuditTrails] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    tableName: tableName || '',
    recordId: recordId || '',
    userId: userId || '',
    startDate: '',
    endDate: '',
    search: ''
  });

  // Build query parameters from filters
  const buildQueryParams = useCallback(() => {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };

    if (filters.action) params.action = filters.action;
    if (filters.tableName) params.tableName = filters.tableName;
    if (filters.recordId) params.recordId = parseInt(filters.recordId);
    if (filters.userId) params.userId = parseInt(filters.userId);
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.search) params.search = filters.search;

    return params;
  }, [filters, pagination.page, pagination.pageSize]);

  // Fetch audit trails
  const fetchAuditTrails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = buildQueryParams();
      const result = await getAuditTrails(params);
      
      setAuditTrails(result.data || []);
      setPagination(result.pagination || {
        page: 1,
        pageSize: pagination.pageSize,
        total: 0,
        totalPages: 0
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch audit trails');
      console.error('Error fetching audit trails:', err);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, pagination.pageSize]);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  }, []);

  // Fetch data when component mounts or dependencies change
  useEffect(() => {
    fetchAuditTrails();
  }, [fetchAuditTrails]);

  // Handle audit trail click
  const handleClick = useCallback((auditTrail) => {
    if (onAuditTrailClick) {
      onAuditTrailClick(auditTrail);
    }
  }, [onAuditTrailClick]);

  // Render content based on view mode
  const renderContent = () => {
    if (loading && auditTrails.length === 0) {
      return <LoadingSpinner message="Loading audit trails..." />;
    }

    if (error) {
      return (
        <div className="audit-trail-error">
          <p>Error: {error}</p>
          <button onClick={fetchAuditTrails} className="btn btn-retry">
            Retry
          </button>
        </div>
      );
    }

    if (compact) {
      return (
        <div className="audit-trail-list compact">
          {auditTrails.map(auditTrail => (
            <AuditTrailCard
              key={auditTrail.id}
              auditTrail={auditTrail}
              compact
              onClick={() => handleClick(auditTrail)}
            />
          ))}
        </div>
      );
    }

    return (
      <AuditTrailTable
        auditTrails={auditTrails}
        pagination={pagination}
        onPageChange={handlePageChange}
        loading={loading}
      />
    );
  };

  return (
    <div className="audit-trail-list-container">
      {/* Filter Controls */}
      {!compact && (
        <div className="audit-trail-filters">
          <AuditTrailFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            disabled={loading}
          />
        </div>
      )}

      {/* Results Count */}
      {!compact && pagination.total > 0 && (
        <div className="results-count">
          Found {pagination.total} audit trail entries
        </div>
      )}

      {/* Content */}
      {renderContent()}
    </div>
  );
}

AuditTrailList.propTypes = {
  tableName: PropTypes.string,
  recordId: PropTypes.number,
  userId: PropTypes.number,
  compact: PropTypes.bool,
  pageSize: PropTypes.number,
  onAuditTrailClick: PropTypes.func
};

export default AuditTrailList;

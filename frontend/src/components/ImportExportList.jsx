/**
 * ImportExportList Component
 * List component for displaying import/export operations with filtering and pagination
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import ImportExportCard from './ImportExportCard.jsx';
import ImportExportFilter from './ImportExportFilter.jsx';
import { Spinner } from './Spinner.jsx';
import { getImportExportLogs, getImportExportLogCount } from '../services/importExportService.js';
import './ImportExportList.scss';

/**
 * ImportExportList Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.filter - Initial filter values
 * @param {Function} props.onItemClick - Item click handler
 * @param {Function} props.onRefresh - Refresh handler
 * @param {number} props.limit - Items per page
 * @param {string} props.className - Additional CSS classes
 */
function ImportExportList({
  filter = {},
  onItemClick,
  onRefresh,
  limit = 10,
  className = ''
}) {
  // State management
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [appliedFilter, setAppliedFilter] = useState(filter);

  // Fetch operations
  const fetchOperations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate offset
      const offset = (currentPage - 1) * limit;

      // Build query parameters
      const params = {
        page: currentPage,
        limit,
        ...appliedFilter
      };

      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === null || params[key] === '') {
          delete params[key];
        }
      });

      // Fetch operations and count in parallel
      const [logsResponse, countResponse] = await Promise.all([
        getImportExportLogs(params),
        getImportExportLogCount(appliedFilter)
      ]);

      setOperations(logsResponse.data.data || []);
      setTotal(countResponse.data.count || 0);
    } catch (err) {
      console.error('Error fetching import/export operations:', err);
      setError(err.message || 'Failed to fetch import/export operations');
      setOperations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, appliedFilter]);

  // Initial load and refresh
  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setAppliedFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchOperations();
    if (onRefresh) onRefresh();
  };

  // Calculate total pages
  const totalPages = Math.ceil(total / limit) || 1;

  // Render empty state
  if (!loading && operations.length === 0 && total === 0) {
    return (
      <div className={`import-export-list import-export-list--empty ${className}`}>
        <div className="import-export-list__empty">
          <h3 className="import-export-list__empty-title">No Import/Export Operations Found</h3>
          <p className="import-export-list__empty-message">
            {error || 'There are no import or export operations recorded yet.'}
          </p>
          <button 
            className="import-export-list__refresh-btn" 
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`import-export-list ${className}`}>
      {/* Header with filter */}
      <div className="import-export-list__header">
        <div className="import-export-list__header-left">
          <h2 className="import-export-list__title">Import/Export Operations</h2>
          <span className="import-export-list__count">
            Total: {total} operations
          </span>
        </div>
        <div className="import-export-list__header-right">
          <button 
            className="import-export-list__refresh-btn" 
            onClick={handleRefresh}
            disabled={loading}
            aria-label="Refresh operations"
          >
            {loading ? <Spinner size="small" /> : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filter controls */}
      <ImportExportFilter 
        filter={appliedFilter} 
        onChange={handleFilterChange}
        disabled={loading}
      />

      {/* Loading state */}
      {loading && operations.length === 0 ? (
        <div className="import-export-list__loading">
          <Spinner size="large" />
          <p>Loading import/export operations...</p>
        </div>
      ) : null}

      {/* Error state */}
      {error && (
        <div className="import-export-list__error">
          <p className="import-export-list__error-message">{error}</p>
          <button 
            className="import-export-list__retry-btn" 
            onClick={fetchOperations}
          >
            Retry
          </button>
        </div>
      )}

      {/* Operations list */}
      <div className="import-export-list__items">
        {operations.map((operation) => (
          <ImportExportCard
            key={operation.id || operation.created_at}
            operation={operation}
            onClick={onItemClick}
          />
        ))}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="import-export-list__pagination">
          <div className="import-export-list__pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          <div className="import-export-list__pagination-controls">
            <button
              className="import-export-list__page-btn"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
              aria-label="Previous page"
            >
              ← Previous
            </button>
            <span className="import-export-list__page-indicator">
              {currentPage}
            </span>
            <button
              className="import-export-list__page-btn"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loading}
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

ImportExportList.propTypes = {
  filter: PropTypes.object,
  onItemClick: PropTypes.func,
  onRefresh: PropTypes.func,
  limit: PropTypes.number,
  className: PropTypes.string
};

export default ImportExportList;

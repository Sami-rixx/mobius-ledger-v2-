/**
 * DailyLedgerList Component
 * List component for displaying daily ledger records with filtering and data fetching
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import DailyLedgerCard from './DailyLedgerCard.jsx';
import DailyLedgerFilter from './DailyLedgerFilter.jsx';
import { 
  getDailyLedgers, 
  getDailyLedgerStatistics,
  formatCurrency 
} from '../services/dailyLedgerService.js';
import { Pagination, LoadingSpinner } from './index.js';
import './DailyLedgerList.scss';

/**
 * DailyLedgerList Component
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onEdit - Edit handler (id) => void
 * @param {Function} props.onView - View handler (id) => void
 * @param {Function} props.onCreate - Create handler
 * @param {boolean} props.showFilter - Whether to show filter controls
 * @param {number} props.limit - Number of items to display (default: 10)
 */
function DailyLedgerList({
  onEdit,
  onView,
  onCreate,
  showFilter = true,
  limit = 10
}) {
  // State
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: limit,
    total: 0,
    totalPages: 0
  });
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [statistics, setStatistics] = useState(null);

  // Fetch ledgers
  const fetchLedgers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filter
      };
      
      const response = await getDailyLedgers(params);
      
      if (response && response.data) {
        setLedgers(response.data);
        setPagination({
          ...pagination,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch daily ledgers:', err);
      setError('Failed to load daily ledger data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filter]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await getDailyLedgerStatistics(filter);
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  }, [filter]);

  // Initial load and refetch on filter/param changes
  useEffect(() => {
    fetchLedgers();
    fetchStatistics();
  }, [fetchLedgers, fetchStatistics]);

  // Handle page change
  const handlePageChange = (page) => {
    setPagination({ ...pagination, page });
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    // Reset to page 1 when filter changes
    setPagination({ ...pagination, page: 1 });
  };

  // Refresh data
  const handleRefresh = () => {
    fetchLedgers();
    fetchStatistics();
  };

  // Render statistics
  const renderStatistics = () => {
    if (!statistics) return null;
    
    return (
      <div className="daily-ledger-list__statistics">
        <div className="daily-ledger-list__stat">
          <span className="daily-ledger-list__stat-label">Total Days:</span>
          <span className="daily-ledger-list__stat-value">{statistics.total_days || 0}</span>
        </div>
        <div className="daily-ledger-list__stat">
          <span className="daily-ledger-list__stat-label">Total Income:</span>
          <span className="daily-ledger-list__stat-value daily-ledger-list__stat-value--income">
            {formatCurrency(statistics.total_income || 0)}
          </span>
        </div>
        <div className="daily-ledger-list__stat">
          <span className="daily-ledger-list__stat-label">Total Expenses:</span>
          <span className="daily-ledger-list__stat-value daily-ledger-list__stat-value--expense">
            {formatCurrency(statistics.total_expenses || 0)}
          </span>
        </div>
        <div className="daily-ledger-list__stat daily-ledger-list__stat--highlight">
          <span className="daily-ledger-list__stat-label">Net Balance:</span>
          <span className="daily-ledger-list__stat-value">
            {formatCurrency(statistics.net_balance || 0)}
          </span>
        </div>
      </div>
    );
  };

  // Render error state
  if (error && !loading) {
    return (
      <div className="daily-ledger-list daily-ledger-list--error">
        <div className="daily-ledger-list__error">
          <i className="fa fa-exclamation-triangle" aria-hidden="true" />
          <p>{error}</p>
          <button className="btn btn-primary" onClick={handleRefresh}>
            <i className="fa fa-sync-alt" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-ledger-list">
      {/* Header with filter and actions */}
      <div className="daily-ledger-list__header">
        <div className="daily-ledger-list__header-left">
          <h2 className="daily-ledger-list__title">
            <i className="fa fa-book" aria-hidden="true" />
            Daily Ledger
          </h2>
        </div>
        
        <div className="daily-ledger-list__header-right">
          {onCreate && (
            <button className="btn btn-primary" onClick={onCreate}>
              <i className="fa fa-plus" aria-hidden="true" />
              Add Entry
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleRefresh}>
            <i className="fa fa-sync-alt" aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
      {showFilter && renderStatistics()}

      {/* Filter */}
      {showFilter && (
        <div className="daily-ledger-list__filter-section">
          <DailyLedgerFilter 
            filter={filter} 
            onFilterChange={handleFilterChange}
          />
        </div>
      )}

      {/* List */}
      <div className="daily-ledger-list__grid">
        {loading && pagination.page === 1 ? (
          <div className="daily-ledger-list__loading">
            <LoadingSpinner />
            <p>Loading daily ledger data...</p>
          </div>
        ) : ledgers.length === 0 ? (
          <div className="daily-ledger-list__empty">
            <i className="fa fa-book" aria-hidden="true" />
            <p>No daily ledger records found</p>
            {filter.startDate || filter.endDate ? (
              <p className="daily-ledger-list__empty-hint">
                Try adjusting your date filters
              </p>
            ) : (
              <p className="daily-ledger-list__empty-hint">
                No entries have been recorded yet
              </p>
            )}
          </div>
        ) : (
          ledgers.map((ledger) => (
            <DailyLedgerCard
              key={ledger.id}
              ledger={ledger}
              onClick={onView ? () => onView(ledger.id) : undefined}
            />
          ))
        )}
        
        {loading && pagination.page > 1 && (
          <div className="daily-ledger-list__loading-more">
            <LoadingSpinner size="sm" />
            <p>Loading more...</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="daily-ledger-list__pagination">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}

DailyLedgerList.propTypes = {
  onEdit: PropTypes.func,
  onView: PropTypes.func,
  onCreate: PropTypes.func,
  showFilter: PropTypes.bool,
  limit: PropTypes.number
};

export default DailyLedgerList;

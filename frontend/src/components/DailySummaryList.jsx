import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getDailySummaries } from '../services/dailySummaryService.js';
import { DailySummaryCard, Button } from './index.js';

/**
 * DailySummaryList Component
 * Displays a list of daily summaries with filtering and pagination
 * 
 * @param {Object} props - Component props
 * @param {string} props.startDate - Filter by start date (YYYY-MM-DD)
 * @param {string} props.endDate - Filter by end date (YYYY-MM-DD)
 * @param {number} props.limit - Maximum number of summaries to display
 * @param {boolean} props.showPagination - Whether to show pagination controls
 * @param {Function} props.onSummaryClick - Click handler for a summary
 */
function DailySummaryList({ startDate, endDate, limit = 10, showPagination = true, onSummaryClick }) {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch daily summaries
  const fetchSummaries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        pageSize: limit,
        startDate,
        endDate
      };
      
      const response = await getDailySummaries(params);
      
      setSummaries(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.totalCount || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch daily summaries');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSummaries();
  }, [page, startDate, endDate, limit]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setPage(1);
    fetchSummaries();
  };

  // Handle summary click
  const handleSummaryClick = (summary) => {
    if (onSummaryClick) {
      onSummaryClick(summary);
    }
  };

  // Calculate date range display
  const getDateRangeDisplay = () => {
    if (!startDate && !endDate) return 'All dates';
    if (startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    }
    if (startDate) return `From ${new Date(startDate).toLocaleDateString()}`;
    if (endDate) return `Until ${new Date(endDate).toLocaleDateString()}`;
    return '';
  };

  // Render loading state
  if (loading && page === 1) {
    return (
      <div className="daily-summary-list loading">
        <p>Loading daily summaries...</p>
      </div>
    );
  }

  // Render error state
  if (error && summaries.length === 0) {
    return (
      <div className="daily-summary-list error">
        <p>{error}</p>
        <Button onClick={handleRefresh}>Retry</Button>
      </div>
    );
  }

  // Render empty state
  if (summaries.length === 0) {
    return (
      <div className="daily-summary-list empty">
        <p>No daily summaries found for the selected period</p>
        <Button onClick={handleRefresh}>Refresh</Button>
      </div>
    );
  }

  // Render summaries list
  return (
    <div className="daily-summary-list">
      <div className="daily-summary-list-header">
        <h3>Daily Summaries</h3>
        {getDateRangeDisplay() && (
          <span className="date-range-badge badge badge-info">
            {getDateRangeDisplay()}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      <div className="daily-summary-count">
        {totalCount} summari{totalCount !== 1 ? 'es' : 'y'} found
      </div>

      <div className="daily-summary-grid">
        {summaries.map((summary) => (
          <div 
            key={summary.id} 
            className="daily-summary-grid-item"
            onClick={() => handleSummaryClick(summary)}
          >
            <DailySummaryCard 
              summary={summary} 
              showActions={false}
            />
          </div>
        ))}
      </div>

      {showPagination && totalPages > 1 && (
        <div className="pagination">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page <= 1} 
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page >= totalPages} 
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

DailySummaryList.propTypes = {
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  limit: PropTypes.number,
  showPagination: PropTypes.bool,
  onSummaryClick: PropTypes.func
};

export default DailySummaryList;

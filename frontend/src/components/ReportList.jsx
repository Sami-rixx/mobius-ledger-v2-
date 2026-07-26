import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getReports } from '../services/reportService.js';
import { ReportCard, Button, Table } from './index.js';

/**
 * ReportList Component
 * Displays a list of reports with filtering and pagination
 * 
 * @param {Object} props - Component props
 * @param {string} props.reportType - Filter by report type
 * @param {number} props.limit - Maximum number of reports to display
 * @param {boolean} props.showPagination - Whether to show pagination controls
 * @param {Function} props.onReportClick - Click handler for a report
 */
function ReportList({ reportType, limit = 10, showPagination = true, onReportClick }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        pageSize: limit,
        reportType
      };
      
      const response = await getReports(params);
      
      setReports(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.totalCount || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchReports();
  }, [page, reportType, limit]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setPage(1);
    fetchReports();
  };

  // Handle report click
  const handleReportClick = (report) => {
    if (onReportClick) {
      onReportClick(report);
    }
  };

  // Render loading state
  if (loading && page === 1) {
    return (
      <div className="report-list loading">
        <p>Loading reports...</p>
      </div>
    );
  }

  // Render error state
  if (error && reports.length === 0) {
    return (
      <div className="report-list error">
        <p>{error}</p>
        <Button onClick={handleRefresh}>Retry</Button>
      </div>
    );
  }

  // Render empty state
  if (reports.length === 0) {
    return (
      <div className="report-list empty">
        <p>No reports found</p>
        <Button onClick={handleRefresh}>Refresh</Button>
      </div>
    );
  }

  // Render reports list
  return (
    <div className="report-list">
      <div className="report-list-header">
        <h3>Reports</h3>
        {reportType && <span className="badge badge-info">{reportType}</span>}
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      <div className="report-count">
        {totalCount} report{totalCount !== 1 ? 's' : ''} found
      </div>

      <div className="report-grid">
        {reports.map((report) => (
          <div 
            key={report.id} 
            className="report-grid-item"
            onClick={() => handleReportClick(report)}
          >
            <ReportCard 
              report={report} 
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

ReportList.propTypes = {
  reportType: PropTypes.string,
  limit: PropTypes.number,
  showPagination: PropTypes.bool,
  onReportClick: PropTypes.func
};

export default ReportList;

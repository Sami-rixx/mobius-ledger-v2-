import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, ReportList } from '../../components/index.js';
import { useNavigate } from 'react-router-dom';
import { getReports, generateDailySummaryReport } from '../../services/index.js';

/**
 * ReportListPage Component
 * Displays a paginated list of reports with search and filter capabilities
 */
function ReportListPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [reportTypeFilter, setReportTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Report types for filter
  const reportTypes = [
    { value: '', label: 'All Types' },
    { value: 'daily_summary', label: 'Daily Summary' },
    { value: 'monthly_summary', label: 'Monthly Summary' },
    { value: 'yearly_summary', label: 'Yearly Summary' },
    { value: 'income_expense', label: 'Income vs Expense' },
    { value: 'category_summary', label: 'Category Summary' },
    { value: 'student_balances', label: 'Student Balances' }
  ];

  // Load reports
  const loadReports = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        pageSize: 20,
        search: searchQuery || undefined,
        reportType: reportTypeFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };
      
      const result = await getReports(params);
      setReports(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, reportTypeFilter, startDate, endDate]);

  // Initial load
  useEffect(() => {
    loadReports(1);
  }, [loadReports]);

  // Handle page change
  const handlePageChange = (page) => {
    loadReports(page);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadReports(1);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case 'reportType':
        setReportTypeFilter(value);
        break;
      case 'startDate':
        setStartDate(value);
        break;
      case 'endDate':
        setEndDate(value);
        break;
      default:
        break;
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    loadReports(pagination?.page || 1);
  };

  // Handle report click
  const handleReportClick = (report) => {
    navigate(`/reports/${report.id}`);
  };

  // Handle generate daily summary
  const handleGenerateDailySummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await generateDailySummaryReport({ date: today });
      // Refresh the list
      loadReports(1);
    } catch (err) {
      setError(err.message || 'Failed to generate daily summary');
    }
  };

  // Handle create new report
  const handleCreateReport = () => {
    // For now, redirect to reports list
    // In future, this could open a report generation modal
    navigate('/reports');
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="page report-list-page">
      <header className="page-header">
        <h1>Reports</h1>
        <p>View and manage all financial reports</p>
      </header>

      <main className="page-main">
        {/* Filter Bar */}
        <Card title="Filter Reports" className="filter-card">
          <form onSubmit={handleSearch} className="filter-form">
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="searchQuery">Search:</label>
                <input
                  type="text"
                  id="searchQuery"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or description"
                  className="form-input"
                />
              </div>

              <div className="filter-group">
                <label htmlFor="reportType">Report Type:</label>
                <select
                  id="reportType"
                  name="reportType"
                  value={reportTypeFilter}
                  onChange={handleFilterChange}
                  className="form-select"
                >
                  {reportTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="startDate">Start Date:</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={startDate}
                  onChange={handleFilterChange}
                  className="form-input"
                />
              </div>

              <div className="filter-group">
                <label htmlFor="endDate">End Date:</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={endDate}
                  onChange={handleFilterChange}
                  className="form-input"
                />
              </div>
            </div>

            <div className="filter-actions">
              <Button type="submit" variant="primary">
                Search
              </Button>
              <Button type="button" variant="outline" onClick={handleRefresh}>
                Reset
              </Button>
            </div>
          </form>
        </Card>

        {/* Action Buttons */}
        <Card title="Actions" className="actions-card">
          <div className="action-buttons">
            <Button variant="primary" onClick={handleGenerateDailySummary}>
              Generate Daily Summary
            </Button>
            <Button variant="outline" onClick={() => handleSearch({ preventDefault: () => {} })}>
              Refresh List
            </Button>
          </div>
        </Card>

        {/* Reports List */}
        <ReportList
          reportType={reportTypeFilter || undefined}
          limit={20}
          showPagination={true}
          onReportClick={handleReportClick}
        />

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <Card title="Pagination" className="pagination-card">
            <div className="pagination-controls">
              <Button
                variant="outline"
                disabled={!pagination.hasPreviousPage}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} reports)
              </span>
              <Button
                variant="outline"
                disabled={!pagination.hasNextPage}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading && reports.length === 0 && (
          <div className="loading-overlay">
            <p>Loading reports...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <Button onClick={handleRefresh}>Retry</Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default ReportListPage;

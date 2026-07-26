import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, DailySummaryList } from '../../components/index.js';
import { useNavigate } from 'react-router-dom';
import { getDailySummaries, generateAndSaveDailySummary } from '../../services/index.js';

/**
 * DailySummaryListPage Component
 * Displays a paginated list of daily summaries with filtering and date range selection
 */
function DailySummaryListPage() {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick date range presets
  const datePresets = [
    { value: 'today', label: 'Today', start: () => new Date().toISOString().split('T')[0], end: () => new Date().toISOString().split('T')[0] },
    { value: 'yesterday', label: 'Yesterday', start: () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; }, end: () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; } },
    { value: 'week', label: 'Last 7 Days', start: () => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]; }, end: () => new Date().toISOString().split('T')[0] },
    { value: 'month', label: 'Last 30 Days', start: () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; }, end: () => new Date().toISOString().split('T')[0] },
    { value: 'quarter', label: 'Last 3 Months', start: () => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split('T')[0]; }, end: () => new Date().toISOString().split('T')[0] }
  ];

  // Load summaries
  const loadSummaries = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        pageSize: 20,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };
      
      const result = await getDailySummaries(params);
      setSummaries(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load daily summaries');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Initial load
  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    setStartDate(thirtyDaysAgoStr);
    setEndDate(today);
  }, []);

  // Reload when dates change
  useEffect(() => {
    if (startDate && endDate) {
      loadSummaries(1);
    }
  }, [startDate, endDate, loadSummaries]);

  // Handle page change
  const handlePageChange = (page) => {
    loadSummaries(page);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadSummaries(pagination?.page || 1);
  };

  // Handle summary click
  const handleSummaryClick = (summary) => {
    navigate(`/daily-summaries/${summary.id}`);
  };

  // Handle preset selection
  const handlePresetSelect = (presetValue) => {
    const preset = datePresets.find(p => p.value === presetValue);
    if (preset) {
      setStartDate(preset.start());
      setEndDate(preset.end());
    }
  };

  // Handle generate today's summary
  const handleGenerateTodaySummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await generateAndSaveDailySummary(today);
      // Refresh the list
      loadSummaries(1);
    } catch (err) {
      setError(err.message || 'Failed to generate daily summary');
    }
  };

  // Handle generate range summaries
  const handleGenerateRangeSummaries = async () => {
    if (!startDate || !endDate) {
      setError('Please select a date range first');
      return;
    }
    
    try {
      // This would call a backend endpoint to generate summaries for the range
      // For now, just refresh the list
      loadSummaries(1);
    } catch (err) {
      setError(err.message || 'Failed to generate summaries for range');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="page daily-summary-list-page">
      <header className="page-header">
        <h1>Daily Summaries</h1>
        <p>View and manage daily financial summaries</p>
      </header>

      <main className="page-main">
        {/* Date Range Selection */}
        <Card title="Date Range" className="date-range-card">
          <div className="date-range-selector">
            <div className="preset-buttons">
              {datePresets.map((preset) => (
                <Button
                  key={preset.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <div className="custom-date-range">
              <div className="date-group">
                <label htmlFor="startDate">Start Date:</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="date-group">
                <label htmlFor="endDate">End Date:</label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="date-range-actions">
              <Button variant="primary" onClick={handleRefresh}>
                Apply Date Range
              </Button>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <Card title="Actions" className="actions-card">
          <div className="action-buttons">
            <Button variant="primary" onClick={handleGenerateTodaySummary}>
              Generate Today's Summary
            </Button>
            <Button variant="outline" onClick={handleGenerateRangeSummaries}>
              Generate Summaries for Range
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              Refresh List
            </Button>
          </div>
        </Card>

        {/* Daily Summaries List */}
        <DailySummaryList
          startDate={startDate || undefined}
          endDate={endDate || undefined}
          limit={20}
          showPagination={true}
          onSummaryClick={handleSummaryClick}
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
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} summaries)
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
        {loading && summaries.length === 0 && (
          <div className="loading-overlay">
            <p>Loading daily summaries...</p>
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

export default DailySummaryListPage;

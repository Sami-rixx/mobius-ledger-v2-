import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, LunchAttendanceTable } from '../../components/index.js';
import { useNavigate } from 'react-router-dom';
import { getLunchAttendance, deleteLunchAttendance } from '../../services/lunchService.js';

/**
 * LunchAttendanceListPage Component
 * Displays a paginated list of lunch attendance records with search and filter capabilities
 */
function LunchAttendanceListPage() {
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Valid status values
  const validStatuses = ['paid', 'unpaid', 'absent'];

  // Load lunch attendance records
  const loadAttendance = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        pageSize: 20,
        search: searchQuery || undefined,
        studentId: studentFilter ? parseInt(studentFilter, 10) : undefined,
        date: dateFilter || undefined,
        status: statusFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined
      };

      const result = await getLunchAttendance(params);
      setAttendanceRecords(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load lunch attendance records');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, studentFilter, dateFilter, statusFilter, startDateFilter, endDateFilter]);

  // Initial load
  useEffect(() => {
    loadAttendance(1);
  }, [loadAttendance]);

  // Check for navigation state message
  useEffect(() => {
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  // Handle page change
  const handlePageChange = (page) => {
    loadAttendance(page);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadAttendance(1);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'studentFilter') {
      setStudentFilter(value);
    } else if (name === 'dateFilter') {
      setDateFilter(value);
    } else if (name === 'statusFilter') {
      setStatusFilter(value);
    } else if (name === 'startDateFilter') {
      setStartDateFilter(value);
    } else if (name === 'endDateFilter') {
      setEndDateFilter(value);
    }
  };

  // Handle search query change
  const handleSearchQueryChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle create
  const handleCreate = () => {
    navigate('/lunch/attendance/create');
  };

  // Handle edit
  const handleEdit = (record) => {
    navigate(`/lunch/attendance/edit/${record.id}`);
  };

  // Handle view
  const handleView = (record) => {
    navigate(`/lunch/attendance/${record.id}`);
  };

  // Handle delete
  const handleDelete = async (record) => {
    if (window.confirm(`Are you sure you want to delete lunch attendance record #${record.id}?`)) {
      try {
        await deleteLunchAttendance(record.id);
        setMessage('Lunch attendance record deleted successfully!');
        loadAttendance(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to delete lunch attendance record');
      }
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setStudentFilter('');
    setDateFilter('');
    setStatusFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    loadAttendance(1);
  };

  return (
    <div className="page lunch-attendance-list-page">
      <header className="page-header">
        <h1>Lunch Attendance</h1>
        <p>Manage and track lunch attendance records</p>
      </header>

      {/* Message display */}
      {message && (
        <Card className="message-card message-success">
          {message}
        </Card>
      )}

      {/* Error display */}
      {error && (
        <Card className="message-card message-error">
          {error}
        </Card>
      )}

      {/* Action bar */}
      <Card className="action-bar">
        <div className="action-bar-content">
          <Button
            variant="primary"
            onClick={handleCreate}
            className="action-button"
          >
            + Create Lunch Attendance
          </Button>
        </div>
      </Card>

      {/* Search and filter */}
      <Card className="search-filter-card">
        <form onSubmit={handleSearch} className="search-filter-form">
          <div className="search-filter-grid">
            <div className="search-filter-group">
              <label htmlFor="searchQuery">Search</label>
              <input
                type="text"
                id="searchQuery"
                value={searchQuery}
                onChange={handleSearchQueryChange}
                placeholder="Search by student name or admission number"
                className="form-input"
              />
            </div>
            
            <div className="search-filter-group">
              <label htmlFor="statusFilter">Status</label>
              <select
                id="statusFilter"
                name="statusFilter"
                value={statusFilter}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Statuses</option>
                {validStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-filter-group">
              <label htmlFor="dateFilter">Date</label>
              <input
                type="date"
                id="dateFilter"
                name="dateFilter"
                value={dateFilter}
                onChange={handleFilterChange}
                className="form-input"
              />
            </div>

            <div className="search-filter-group">
              <label htmlFor="startDateFilter">Start Date</label>
              <input
                type="date"
                id="startDateFilter"
                name="startDateFilter"
                value={startDateFilter}
                onChange={handleFilterChange}
                className="form-input"
              />
            </div>

            <div className="search-filter-group">
              <label htmlFor="endDateFilter">End Date</label>
              <input
                type="date"
                id="endDateFilter"
                name="endDateFilter"
                value={endDateFilter}
                onChange={handleFilterChange}
                className="form-input"
              />
            </div>

            <div className="search-filter-group search-filter-actions">
              <Button type="submit" variant="primary" className="filter-button">
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="filter-button"
              >
                Clear
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Attendance table */}
      <Card className="data-table-card">
        <LunchAttendanceTable
          attendanceRecords={attendanceRecords}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          loading={loading}
        />
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Card className="pagination-card">
          <div className="pagination-controls">
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage}
              className="pagination-button"
            >
              Previous
            </Button>
            <span className="pagination-info">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="pagination-button"
            >
              Next
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default LunchAttendanceListPage;

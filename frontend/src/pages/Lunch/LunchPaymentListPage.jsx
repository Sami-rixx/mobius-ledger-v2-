import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, LunchPaymentTable } from '../../components/index.js';
import { useNavigate } from 'react-router-dom';
import { getLunchPayments, deleteLunchPayment } from '../../services/lunchService.js';

/**
 * LunchPaymentListPage Component
 * Displays a paginated list of lunch payments with search and filter capabilities
 */
function LunchPaymentListPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Valid payment types
  const validPaymentTypes = ['daily', 'weekly', 'monthly'];

  // Load lunch payments
  const loadPayments = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        pageSize: 20,
        search: searchQuery || undefined,
        paymentType: paymentTypeFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined
      };

      const result = await getLunchPayments(params);
      setPayments(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load lunch payments');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, paymentTypeFilter, startDateFilter, endDateFilter]);

  // Initial load
  useEffect(() => {
    loadPayments(1);
  }, [loadPayments]);

  // Check for navigation state message
  useEffect(() => {
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  // Handle page change
  const handlePageChange = (page) => {
    loadPayments(page);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadPayments(1);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'paymentTypeFilter') {
      setPaymentTypeFilter(value);
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
    navigate('/lunch/payments/create');
  };

  // Handle edit
  const handleEdit = (payment) => {
    navigate(`/lunch/payments/edit/${payment.id}`);
  };

  // Handle view
  const handleView = (payment) => {
    navigate(`/lunch/payments/${payment.id}`);
  };

  // Handle delete
  const handleDelete = async (payment) => {
    if (window.confirm(`Are you sure you want to delete lunch payment #${payment.id}?`)) {
      try {
        await deleteLunchPayment(payment.id);
        setMessage('Lunch payment deleted successfully!');
        loadPayments(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to delete lunch payment');
      }
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setPaymentTypeFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    loadPayments(1);
  };

  return (
    <div className="page lunch-payment-list-page">
      <header className="page-header">
        <h1>Lunch Payments</h1>
        <p>Manage and track lunch fee payments</p>
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
            + Create Lunch Payment
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
              <label htmlFor="paymentTypeFilter">Payment Type</label>
              <select
                id="paymentTypeFilter"
                name="paymentTypeFilter"
                value={paymentTypeFilter}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Types</option>
                {validPaymentTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
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

      {/* Payments table */}
      <Card className="data-table-card">
        <LunchPaymentTable
          payments={payments}
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

export default LunchPaymentListPage;

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, SchoolFeeTable } from '../../components/index.js';
import { useNavigate } from 'react-router-dom';
import { getSchoolFeePayments, deleteSchoolFeePayment } from '../../services/schoolFeeService.js';

/**
 * SchoolFeeListPage Component
 * Displays a paginated list of school fee payments with search and filter capabilities
 */
function SchoolFeeListPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Valid terms
  const validTerms = ['Term 1', 'Term 2', 'Term 3'];

  // Load school fee payments
  const loadPayments = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        pageSize: 20,
        search: searchQuery || undefined,
        academicYear: academicYearFilter || undefined,
        term: termFilter || undefined
      };

      const result = await getSchoolFeePayments(params);
      setPayments(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load school fee payments');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, academicYearFilter, termFilter]);

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
    if (name === 'academicYearFilter') {
      setAcademicYearFilter(value);
    } else if (name === 'termFilter') {
      setTermFilter(value);
    }
  };

  // Handle search query change
  const handleSearchQueryChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle edit
  const handleEdit = (id) => {
    navigate(`/school-fees/edit/${id}`);
  };

  // Handle view
  const handleView = (id) => {
    navigate(`/school-fees/${id}`);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this school fee payment?')) {
      try {
        await deleteSchoolFeePayment(id);
        setMessage('School fee payment deleted successfully!');
        loadPayments(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to delete school fee payment');
      }
    }
  };

  // Handle create new
  const handleCreateNew = () => {
    navigate('/school-fees/create');
  };

  // Get current academic years for filter
  const getAcademicYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }
    return years;
  };

  return (
    <div className="page school-fee-list-page">
      <header className="header">
        <h1>School Fee Payments</h1>
        <p>Manage and track school fee payments</p>
      </header>

      <main className="main-content">
        {/* Message display */}
        {message && (
          <Card className="success-card">
            <p className="text-success">{message}</p>
          </Card>
        )}

        {/* Error display */}
        {error && (
          <Card className="error-card">
            <p className="text-error">{error}</p>
          </Card>
        )}

        {/* Action bar */}
        <Card className="action-bar">
          <div className="action-bar-content">
            <Button
              variant="primary"
              onClick={handleCreateNew}
              className="create-button"
            >
              + Record Payment
            </Button>
          </div>
        </Card>

        {/* Search and filter card */}
        <Card className="search-filter-card">
          <form onSubmit={handleSearch} className="search-filter-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="searchQuery">Search Students</label>
                <input
                  type="text"
                  id="searchQuery"
                  name="searchQuery"
                  value={searchQuery}
                  onChange={handleSearchQueryChange}
                  placeholder="Search by student name or admission number"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="academicYearFilter">Academic Year</label>
                <select
                  id="academicYearFilter"
                  name="academicYearFilter"
                  value={academicYearFilter}
                  onChange={handleFilterChange}
                  className="form-input"
                >
                  <option value="">All Years</option>
                  {getAcademicYearOptions().map((year) => (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="termFilter">Term</label>
                <select
                  id="termFilter"
                  name="termFilter"
                  value={termFilter}
                  onChange={handleFilterChange}
                  className="form-input"
                >
                  <option value="">All Terms</option>
                  {validTerms.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group form-actions">
                <Button type="submit" variant="primary" className="search-button">
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setAcademicYearFilter('');
                    setTermFilter('');
                  }}
                  className="reset-button"
                >
                  Reset
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Payments table */}
        <Card className="data-card">
          <div className="card-header">
            <h2>School Fee Payments</h2>
            <span className="item-count">{pagination ? pagination.total : 0} total payments</span>
          </div>

          {loading ? (
            <div className="loading-state">
              <p>Loading school fee payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="empty-state">
              <p>No school fee payments found.</p>
              <Button variant="primary" onClick={handleCreateNew}>
                Record First Payment
              </Button>
            </div>
          ) : (
            <SchoolFeeTable
              payments={payments}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onPageChange={handlePageChange}
              pagination={pagination}
            />
          )}
        </Card>
      </main>
    </div>
  );
}

export default SchoolFeeListPage;

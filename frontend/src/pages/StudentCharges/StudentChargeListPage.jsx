import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, StudentChargeTable } from '../../components/index.js';
import { useNavigate } from 'react-router-dom';
import { getStudentCharges, deleteStudentCharge } from '../../services/studentChargeService.js';

/**
 * StudentChargeListPage Component
 * Displays a paginated list of student charges with search and filter capabilities
 */
function StudentChargeListPage() {
  const navigate = useNavigate();
  const [charges, setCharges] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chargeTypeFilter, setChargeTypeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Valid charge types
  const validChargeTypes = ['individual', 'all', 'class', 'grade', 'custom'];

  // Load student charges
  const loadCharges = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        pageSize: 20,
        search: searchQuery || undefined,
        chargeType: chargeTypeFilter || undefined,
        classId: classFilter ? parseInt(classFilter, 10) : undefined,
        isActive: isActiveFilter === '' ? undefined : isActiveFilter === 'true'
      };

      const result = await getStudentCharges(params);
      setCharges(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load student charges');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, chargeTypeFilter, classFilter, isActiveFilter]);

  // Initial load
  useEffect(() => {
    loadCharges(1);
  }, [loadCharges]);

  // Check for navigation state message
  useEffect(() => {
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  // Handle page change
  const handlePageChange = (page) => {
    loadCharges(page);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadCharges(1);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'chargeTypeFilter') {
      setChargeTypeFilter(value);
    } else if (name === 'classFilter') {
      setClassFilter(value);
    } else if (name === 'isActiveFilter') {
      setIsActiveFilter(value);
    }
  };

  // Handle search query change
  const handleSearchQueryChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle create
  const handleCreate = () => {
    navigate('/student-charges/create');
  };

  // Handle edit
  const handleEdit = (charge) => {
    navigate(`/student-charges/edit/${charge.id}`);
  };

  // Handle view
  const handleView = (charge) => {
    navigate(`/student-charges/${charge.id}`);
  };

  // Handle delete
  const handleDelete = async (charge) => {
    if (window.confirm(`Are you sure you want to delete student charge #${charge.id}? This will also delete all assignments for this charge.`)) {
      try {
        await deleteStudentCharge(charge.id);
        setMessage('Student charge deleted successfully!');
        loadCharges(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to delete student charge');
      }
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setChargeTypeFilter('');
    setClassFilter('');
    setIsActiveFilter('');
    loadCharges(1);
  };

  return (
    <div className="page student-charge-list-page">
      <header className="page-header">
        <h1>Student Charges</h1>
        <p>Manage custom charges for students (swimming, trips, sports, etc.)</p>
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
            + Create Student Charge
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
                placeholder="Search by name or description"
                className="form-input"
              />
            </div>
            
            <div className="search-filter-group">
              <label htmlFor="chargeTypeFilter">Charge Type</label>
              <select
                id="chargeTypeFilter"
                name="chargeTypeFilter"
                value={chargeTypeFilter}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Types</option>
                {validChargeTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-filter-group">
              <label htmlFor="classFilter">Class</label>
              <input
                type="number"
                id="classFilter"
                name="classFilter"
                value={classFilter}
                onChange={handleFilterChange}
                placeholder="Class ID"
                className="form-input"
              />
            </div>

            <div className="search-filter-group">
              <label htmlFor="isActiveFilter">Status</label>
              <select
                id="isActiveFilter"
                name="isActiveFilter"
                value={isActiveFilter}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
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

      {/* Charges table */}
      <Card className="data-table-card">
        <StudentChargeTable
          charges={charges}
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

export default StudentChargeListPage;

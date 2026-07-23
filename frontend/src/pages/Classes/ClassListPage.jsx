import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, ClassTable } from '../../components/index.js';
import { useNavigate } from 'react-router-dom';
import {
  getClasses,
  deleteClass,
  getClassesWithStudentCounts
} from '../../services/classService.js';

/**
 * ClassListPage Component
 * Displays a paginated list of classes with search and filter capabilities
 */
function ClassListPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load classes
  const loadClasses = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        pageSize: 20,
        search: searchQuery || undefined,
        isActive: isActiveFilter === '' ? undefined : isActiveFilter === 'true'
      };

      const result = await getClasses(params);
      setClasses(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, isActiveFilter]);

  // Initial load
  useEffect(() => {
    loadClasses(1);
  }, [loadClasses]);

  // Handle page change
  const handlePageChange = (page) => {
    loadClasses(page);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadClasses(1);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'isActiveFilter') {
      setIsActiveFilter(value);
    }
  };

  // Handle delete
  const handleDelete = async (classItem) => {
    if (window.confirm(`Are you sure you want to delete class "${classItem.name}"? This will not delete students in this class.`)) {
      try {
        await deleteClass(classItem.id);
        // Refresh the list
        loadClasses(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to delete class');
      }
    }
  };

  // Handle edit
  const handleEdit = (classItem) => {
    navigate(`/classes/edit/${classItem.id}`);
  };

  // Handle view
  const handleView = (classItem) => {
    navigate(`/classes/${classItem.id}`);
  };

  // Handle create
  const handleCreate = () => {
    navigate('/classes/create');
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setIsActiveFilter('');
    loadClasses(1);
  };

  return (
    <div className="page class-list-page">
      <header className="header">
        <h1>Class Management</h1>
        <p>Manage school classes and grades</p>
      </header>

      <main className="main-content">
        <Card title="Classes">
          {/* Search and Filter Bar */}
          <div className="filter-bar">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search by class name or description..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
              <Button type="submit" variant="primary">
                Search
              </Button>
            </form>

            <div className="filter-controls">
              <select
                name="isActiveFilter"
                value={isActiveFilter}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <p className="text-error">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="page-actions">
            <Button variant="primary" onClick={handleCreate}>
              + Add New Class
            </Button>
          </div>

          {/* Class Table */}
          <ClassTable
            classes={classes}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onPageChange={handlePageChange}
            pagination={pagination}
          />
        </Card>
      </main>
    </div>
  );
}

export default ClassListPage;

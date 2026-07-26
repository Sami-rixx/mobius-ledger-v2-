import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, IncomeCategoryTable } from '../../components/index.js';
import { getIncomeCategories, deleteIncomeCategory } from '../../services/index.js';
import { useNavigate } from 'react-router-dom';

/**
 * IncomeCategoryListPage Component
 * Displays a paginated list of income categories
 */
function IncomeCategoryListPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load categories
  const loadCategories = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        pageSize: 20,
        search: searchQuery || undefined,
        isActive: isActiveFilter === '' ? undefined : isActiveFilter === 'true'
      };

      const result = await getIncomeCategories(params);
      setCategories(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, isActiveFilter]);

  // Initial load
  useEffect(() => {
    loadCategories(1);
  }, [loadCategories]);

  // Handle page change
  const handlePageChange = (page) => {
    loadCategories(page);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadCategories(1);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'isActiveFilter') {
      setIsActiveFilter(value);
    }
  };

  // Handle delete
  const handleDelete = async (category) => {
    if (window.confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      try {
        await deleteIncomeCategory(category.id);
        // Refresh the list
        loadCategories(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to delete category');
      }
    }
  };

  // Handle edit
  const handleEdit = (category) => {
    navigate(`/income-categories/edit/${category.id}`);
  };

  // Handle view
  const handleView = (category) => {
    navigate(`/income-categories/${category.id}`);
  };

  // Handle create
  const handleCreate = () => {
    navigate('/income-categories/create');
  };

  // Handle back to income
  const handleBackToIncome = () => {
    navigate('/income');
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setIsActiveFilter('');
    loadCategories(1);
  };

  return (
    <div className="page income-category-list-page">
      <header className="page-header">
        <h1>Income Categories</h1>
        <p>Manage income category classifications</p>
      </header>

      {/* Actions */}
      <Card className="actions-card">
        <div className="actions-header">
          <Button variant="primary" onClick={handleCreate}>
            Add New Category
          </Button>
          <Button variant="secondary" onClick={handleBackToIncome}>
            Back to Income
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <Card className="filters-card">
        <form onSubmit={handleSearch} className="filters-form">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="searchQuery">Search</label>
              <input
                type="text"
                id="searchQuery"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by name or description..."
              />
            </div>
            <div className="filter-group">
              <label htmlFor="isActiveFilter">Status</label>
              <select
                id="isActiveFilter"
                name="isActiveFilter"
                value={isActiveFilter}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <Button type="submit" variant="primary">
              Apply Filters
            </Button>
            <Button type="button" variant="secondary" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </form>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="error-card">
          <p className="error-message">{error}</p>
        </Card>
      )}

      {/* Categories Table */}
      <IncomeCategoryTable
        categories={categories}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onPageChange={handlePageChange}
        pagination={pagination}
      />
    </div>
  );
}

export default IncomeCategoryListPage;

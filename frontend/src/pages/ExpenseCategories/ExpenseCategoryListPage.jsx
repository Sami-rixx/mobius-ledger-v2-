import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, ExpenseCategoryTable } from '../../components/index.js';
import { useApi } from '../../hooks/index.js';
import { getExpenseCategories, deleteExpenseCategory, getKitchenExpenseCategories } from '../../services/index.js';
import { useNavigate } from 'react-router-dom';

/**
 * ExpenseCategoryListPage Component
 * Displays a paginated list of expense category records with search and filter capabilities
 */
function ExpenseCategoryListPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [isKitchenFilter, setIsKitchenFilter] = useState('');
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
        isActive: isActiveFilter !== '' ? (isActiveFilter === 'true') : undefined,
        isKitchen: isKitchenFilter !== '' ? (isKitchenFilter === 'true') : undefined
      };

      const result = await getExpenseCategories(params);
      setCategories(result.categories || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load expense categories');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, isActiveFilter, isKitchenFilter]);

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
    if (name === 'isActive') {
      setIsActiveFilter(value);
    } else if (name === 'isKitchen') {
      setIsKitchenFilter(value);
    }
  };

  // Handle delete
  const handleDelete = async (category) => {
    if (window.confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      try {
        await deleteExpenseCategory(category.id);
        // Refresh the list
        loadCategories(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to delete category');
      }
    }
  };

  // Handle create new category
  const handleCreate = () => {
    navigate('/expense-categories/create');
  };

  // Handle edit
  const handleEdit = (category) => {
    navigate(`/expense-categories/edit/${category.id}`);
  };

  // Handle view
  const handleView = (category) => {
    navigate(`/expense-categories/${category.id}`);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setIsActiveFilter('');
    setIsKitchenFilter('');
    loadCategories(1);
  };

  return (
    <div className="page expense-category-list-page">
      <div className="page-header">
        <h1>Expense Categories</h1>
        <p className="page-subtitle">Manage expense categories with hierarchical organization</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger">
          {error}
          <button className="close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Filter and Search Panel */}
      <Card title="Search & Filter Categories">
        <form onSubmit={handleSearch} className="filter-form">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="searchQuery">Search</label>
              <input
                type="text"
                id="searchQuery"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or description..."
                className="form-control"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="isActive">Status</label>
              <select
                id="isActive"
                name="isActive"
                value={isActiveFilter}
                onChange={handleFilterChange}
                className="form-control"
              >
                <option value="">All Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="isKitchen">Type</label>
              <select
                id="isKitchen"
                name="isKitchen"
                value={isKitchenFilter}
                onChange={handleFilterChange}
                className="form-control"
              >
                <option value="">All Types</option>
                <option value="true">Kitchen Only</option>
                <option value="false">Non-Kitchen Only</option>
              </select>
            </div>

            <div className="filter-actions">
              <Button type="submit" variant="primary">
                Apply Filters
              </Button>
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Category Table */}
      <Card>
        <div className="card-header">
          <h3>Expense Categories</h3>
          <div className="card-actions">
            <Button variant="primary" onClick={handleCreate}>
              + Add Category
            </Button>
          </div>
        </div>
        
        <ExpenseCategoryTable
          categories={categories}
          loading={loading}
          pagination={pagination}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onPageChange={handlePageChange}
        />
      </Card>
    </div>
  );
}

export default ExpenseCategoryListPage;

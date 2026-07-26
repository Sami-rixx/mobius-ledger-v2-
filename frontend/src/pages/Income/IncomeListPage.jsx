import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, IncomeTable } from '../../components/index.js';
import { useApi } from '../../hooks/index.js';
import { getIncome, deleteIncome, getAllIncomeCategories } from '../../services/index.js';
import { useNavigate } from 'react-router-dom';

/**
 * IncomeListPage Component
 * Displays a paginated list of income records with search and filter capabilities
 */
function IncomeListPage() {
  const navigate = useNavigate();
  const [incomeRecords, setIncomeRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  // Load categories for filter
  const { data: categoriesData } = useApi(async () => {
    const result = await getAllIncomeCategories();
    return result.data || result || [];
  });

  // Load income records
  const loadIncomeRecords = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        pageSize: 20,
        search: searchQuery || undefined,
        categoryId: categoryFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };

      const result = await getIncome(params);
      setIncomeRecords(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load income records');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, startDate, endDate]);

  // Load categories
  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData || []);
    }
  }, [categoriesData]);

  // Initial load
  useEffect(() => {
    loadIncomeRecords(1);
  }, [loadIncomeRecords]);

  // Handle page change
  const handlePageChange = (page) => {
    loadIncomeRecords(page);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadIncomeRecords(1);
  };

  // Handle filter change
  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
  };

  // Handle date filter change
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    if (name === 'startDate') {
      setStartDate(value);
    } else if (name === 'endDate') {
      setEndDate(value);
    }
  };

  // Handle delete
  const handleDelete = async (income) => {
    if (window.confirm(`Are you sure you want to delete income record ${income.receipt_number || income.id}?`)) {
      try {
        await deleteIncome(income.id);
        // Refresh the list
        loadIncomeRecords(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to delete income record');
      }
    }
  };

  // Handle edit
  const handleEdit = (income) => {
    navigate(`/income/edit/${income.id}`);
  };

  // Handle view
  const handleView = (income) => {
    navigate(`/income/${income.id}`);
  };

  // Handle create
  const handleCreate = () => {
    navigate('/income/create');
  };

  // Handle create category
  const handleCreateCategory = () => {
    navigate('/income-categories/create');
  };

  // Handle view categories
  const handleViewCategories = () => {
    navigate('/income-categories');
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setStartDate('');
    setEndDate('');
    loadIncomeRecords(1);
  };

  // Format currency for summary
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'KES 0.00';
    return `KES ${parseFloat(amount).toFixed(2)}`;
  };

  // Calculate total from current records
  const calculateTotal = () => {
    return incomeRecords.reduce((sum, record) => {
      return sum + (parseFloat(record.amount) || 0);
    }, 0);
  };

  return (
    <div className="page income-list-page">
      <header className="page-header">
        <h1>Income Records</h1>
        <p>Manage all income transactions</p>
      </header>

      {/* Summary Cards */}
      <div className="summary-cards">
        <Card className="summary-card">
          <h3>Total Income (Current Page)</h3>
          <p className="summary-value">{formatCurrency(calculateTotal())}</p>
        </Card>
        <Card className="summary-card">
          <h3>Total Records</h3>
          <p className="summary-value">{pagination?.total || incomeRecords.length}</p>
        </Card>
      </div>

      {/* Actions */}
      <Card className="actions-card">
        <div className="actions-header">
          <Button variant="primary" onClick={handleCreate}>
            Record New Income
          </Button>
          <Button variant="secondary" onClick={handleViewCategories}>
            Manage Categories
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
                placeholder="Search by source, receipt number..."
              />
            </div>
            <div className="filter-group">
              <label htmlFor="categoryFilter">Category</label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={handleCategoryChange}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={startDate}
                onChange={handleDateChange}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={endDate}
                onChange={handleDateChange}
              />
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

      {/* Income Table */}
      <IncomeTable
        incomeRecords={incomeRecords}
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

export default IncomeListPage;

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, ExpenseTable } from '../../components/index.js';
import { useApi } from '../../hooks/index.js';
import { getExpenses, deleteExpense, getAllExpenseCategories } from '../../services/index.js';
import { useNavigate } from 'react-router-dom';

/**
 * ExpenseListPage Component
 * Displays a paginated list of expense records with search and filter capabilities
 */
function ExpenseListPage() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  // Load categories for filter
  const { data: categoriesData } = useApi(async () => {
    const result = await getAllExpenseCategories();
    return result.data || result || [];
  });

  // Load expense records
  const loadExpenses = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        pageSize: 20,
        search: searchQuery || undefined,
        categoryId: categoryFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        minAmount: minAmount || undefined,
        maxAmount: maxAmount || undefined
      };

      const result = await getExpenses(params);
      setExpenses(result.expenses || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load expense records');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, startDate, endDate, minAmount, maxAmount]);

  // Load categories
  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData || []);
    }
  }, [categoriesData]);

  // Initial load
  useEffect(() => {
    loadExpenses(1);
  }, [loadExpenses]);

  // Handle page change
  const handlePageChange = (page) => {
    loadExpenses(page);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadExpenses(1);
  };

  // Handle filter change
  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
  };

  // Handle amount filter change
  const handleAmountChange = (e) => {
    const { name, value } = e.target;
    if (name === 'minAmount') {
      setMinAmount(value);
    } else if (name === 'maxAmount') {
      setMaxAmount(value);
    }
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
  const handleDelete = async (expense) => {
    if (window.confirm(`Are you sure you want to delete expense record ${expense.receipt_number || expense.id}?`)) {
      try {
        await deleteExpense(expense.id);
        // Refresh the list
        loadExpenses(pagination?.page || 1);
      } catch (err) {
        setError(err.message || 'Failed to delete expense record');
      }
    }
  };

  // Handle create new expense
  const handleCreate = () => {
    navigate('/expenses/create');
  };

  // Handle edit
  const handleEdit = (expense) => {
    navigate(`/expenses/edit/${expense.id}`);
  };

  // Handle view
  const handleView = (expense) => {
    navigate(`/expenses/${expense.id}`);
  };

  // Clear filters
  const clearFilters = () => {
    setCategoryFilter('');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    loadExpenses(1);
  };

  return (
    <div className="page expense-list-page">
      <div className="page-header">
        <h1>Expense Records</h1>
        <p className="page-subtitle">Manage and track all school expenses</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger">
          {error}
          <button className="close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Filter and Search Panel */}
      <Card title="Search & Filter Expenses">
        <form onSubmit={handleSearch} className="filter-form">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="searchQuery">Search</label>
              <input
                type="text"
                id="searchQuery"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by vendor, receipt, description..."
                className="form-control"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="categoryFilter">Category</label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={handleCategoryChange}
                className="form-control"
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
                className="form-control"
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
                className="form-control"
              />
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="minAmount">Min Amount (KES)</label>
              <input
                type="number"
                id="minAmount"
                name="minAmount"
                value={minAmount}
                onChange={handleAmountChange}
                step="0.01"
                min="0"
                className="form-control"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="maxAmount">Max Amount (KES)</label>
              <input
                type="number"
                id="maxAmount"
                name="maxAmount"
                value={maxAmount}
                onChange={handleAmountChange}
                step="0.01"
                min="0"
                className="form-control"
              />
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

      {/* Expense Table */}
      <Card>
        <div className="card-header">
          <h3>Expense Records</h3>
          <div className="card-actions">
            <Button variant="primary" onClick={handleCreate}>
              + Add Expense
            </Button>
          </div>
        </div>
        
        <ExpenseTable
          expenses={expenses}
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

export default ExpenseListPage;

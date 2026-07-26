import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, TransactionTable, TransactionFilter } from '../../../components/index.js';
import { useApi } from '../../../hooks/index.js';
import { getTransactions, deleteTransaction } from '../../../services/index.js';
import { useNavigate } from 'react-router-dom';

/**
 * TransactionListPage Component
 * Displays a paginated list of transactions with search and filter capabilities
 */
function TransactionListPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load transactions
  const loadTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        pageSize: 20,
        ...filters
      };
      
      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });

      const result = await getTransactions(params);
      setTransactions(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    loadTransactions(1);
  }, [loadTransactions]);

  // Handle page change
  const handlePageChange = (page) => {
    loadTransactions(page);
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle search
  const handleSearch = () => {
    loadTransactions(1);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({});
    loadTransactions(1);
  };

  // Handle delete
  const handleDelete = async (transaction) => {
    if (!window.confirm(`Are you sure you want to delete transaction ${transaction.receipt_number || transaction.id}?`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteTransaction(transaction.id);
      // Refresh the list
      loadTransactions(pagination?.page || 1);
    } catch (err) {
      setError(err.message || 'Failed to delete transaction');
    } finally {
      setDeleting(false);
    }
  };

  // Navigate to create page
  const navigateToCreate = () => {
    navigate('/transactions/create');
  };

  // Navigate to edit page
  const navigateToEdit = (transaction) => {
    navigate(`/transactions/edit/${transaction.id}`);
  };

  // Navigate to detail page
  const navigateToDetail = (transaction) => {
    navigate(`/transactions/${transaction.id}`);
  };

  return (
    <div className="transaction-list-page">
      <div className="page-header">
        <h1>Transactions</h1>
        <Button variant="primary" onClick={navigateToCreate} disabled={loading || deleting}>
          Create Transaction
        </Button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <Card>
        <TransactionFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onReset={handleResetFilters}
        />
      </Card>

      <TransactionTable
        transactions={transactions}
        loading={loading || deleting}
        onView={navigateToDetail}
        onEdit={navigateToEdit}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
        pagination={pagination}
      />
    </div>
  );
}

export default TransactionListPage;

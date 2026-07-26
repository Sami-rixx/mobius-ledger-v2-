import React, { useState, useEffect, useCallback } from 'react';
import { Card, ExpenseForm } from '../../components/index.js';
import { useNavigate, useParams } from 'react-router-dom';
import { getExpenseById, updateExpense } from '../../services/index.js';

/**
 * ExpenseEditPage Component
 * Form for editing an existing expense record
 */
function ExpenseEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load expense data
  useEffect(() => {
    const loadExpense = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getExpenseById(id);
        setExpense(result.data || result);
      } catch (err) {
        setError(err.message || 'Failed to load expense data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadExpense();
    }
  }, [id]);

  // Handle form submission
  const handleSubmit = useCallback(async (expenseData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateExpense(id, expenseData);
      
      if (result && result.id) {
        // Navigate to the detail page
        navigate(`/expenses/${result.id}`);
      } else {
        // If no ID in response, navigate to list
        navigate('/expenses');
      }
    } catch (err) {
      setError(err.message || 'Failed to update expense');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Handle cancel
  const handleCancel = () => {
    if (expense) {
      navigate(`/expenses/${expense.id}`);
    } else {
      navigate('/expenses');
    }
  };

  // Show loading state
  if (loading && !expense) {
    return (
      <div className="page expense-edit-page">
        <div className="page-header">
          <h1>Edit Expense</h1>
        </div>
        <div className="page-content">
          <p>Loading expense data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !expense) {
    return (
      <div className="page expense-edit-page">
        <div className="page-header">
          <h1>Edit Expense</h1>
        </div>
        <div className="alert alert-danger">
          {error}
          <button className="close" onClick={() => navigate('/expenses')}>×</button>
        </div>
      </div>
    );
  }

  // Show edit form
  return (
    <div className="page expense-edit-page">
      <div className="page-header">
        <h1>Edit Expense #{id}</h1>
        <p className="page-subtitle">Update expense record information</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger">
          {error}
          <button className="close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Edit Form */}
      <div className="page-content">
        <ExpenseForm
          expense={expense}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default ExpenseEditPage;

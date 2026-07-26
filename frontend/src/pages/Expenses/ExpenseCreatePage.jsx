import React, { useState, useCallback } from 'react';
import { Card, Button, ExpenseForm } from '../../components/index.js';
import { useNavigate } from 'react-router-dom';
import { createExpense } from '../../services/index.js';

/**
 * ExpenseCreatePage Component
 * Form for creating a new expense record
 */
function ExpenseCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = useCallback(async (expenseData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await createExpense(expenseData);
      
      if (result && result.id) {
        // Navigate to the detail page or list page
        navigate(`/expenses/${result.id}`);
      } else {
        // If no ID in response, navigate to list
        navigate('/expenses');
      }
    } catch (err) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Handle cancel
  const handleCancel = () => {
    navigate('/expenses');
  };

  return (
    <div className="page expense-create-page">
      <div className="page-header">
        <h1>Create New Expense</h1>
        <p className="page-subtitle">Add a new expense record to the system</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger">
          {error}
          <button className="close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Create Form */}
      <div className="page-content">
        <ExpenseForm
          expense={null}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default ExpenseCreatePage;

import React, { useState, useCallback } from 'react';
import { Card, ExpenseCategoryForm } from '../../components/index.js';
import { useNavigate } from 'react-router-dom';
import { createExpenseCategory } from '../../services/index.js';

/**
 * ExpenseCategoryCreatePage Component
 * Form for creating a new expense category record
 */
function ExpenseCategoryCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = useCallback(async (categoryData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await createExpenseCategory(categoryData);
      
      if (result && result.id) {
        // Navigate to the detail page or list page
        navigate(`/expense-categories/${result.id}`);
      } else {
        // If no ID in response, navigate to list
        navigate('/expense-categories');
      }
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Handle cancel
  const handleCancel = () => {
    navigate('/expense-categories');
  };

  return (
    <div className="page expense-category-create-page">
      <div className="page-header">
        <h1>Create New Expense Category</h1>
        <p className="page-subtitle">Add a new expense category to the system</p>
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
        <ExpenseCategoryForm
          category={null}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default ExpenseCategoryCreatePage;

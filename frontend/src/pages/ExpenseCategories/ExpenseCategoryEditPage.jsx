import React, { useState, useEffect, useCallback } from 'react';
import { ExpenseCategoryForm } from '../../components/index.js';
import { useNavigate, useParams } from 'react-router-dom';
import { getExpenseCategoryById, updateExpenseCategory } from '../../services/index.js';

/**
 * ExpenseCategoryEditPage Component
 * Form for editing an existing expense category record
 */
function ExpenseCategoryEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load category data
  useEffect(() => {
    const loadCategory = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getExpenseCategoryById(id);
        setCategory(result.data || result);
      } catch (err) {
        setError(err.message || 'Failed to load category data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCategory();
    }
  }, [id]);

  // Handle form submission
  const handleSubmit = useCallback(async (categoryData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateExpenseCategory(id, categoryData);
      
      if (result && result.id) {
        // Navigate to the detail page
        navigate(`/expense-categories/${result.id}`);
      } else {
        // If no ID in response, navigate to list
        navigate('/expense-categories');
      }
    } catch (err) {
      setError(err.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Handle cancel
  const handleCancel = () => {
    if (category) {
      navigate(`/expense-categories/${category.id}`);
    } else {
      navigate('/expense-categories');
    }
  };

  // Show loading state
  if (loading && !category) {
    return (
      <div className="page expense-category-edit-page">
        <div className="page-header">
          <h1>Edit Expense Category</h1>
        </div>
        <div className="page-content">
          <p>Loading category data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !category) {
    return (
      <div className="page expense-category-edit-page">
        <div className="page-header">
          <h1>Edit Expense Category</h1>
        </div>
        <div className="alert alert-danger">
          {error}
          <button className="close" onClick={() => navigate('/expense-categories')}>×</button>
        </div>
      </div>
    );
  }

  // Show edit form
  return (
    <div className="page expense-category-edit-page">
      <div className="page-header">
        <h1>Edit Expense Category #{id}</h1>
        <p className="page-subtitle">Update category information</p>
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
        <ExpenseCategoryForm
          category={category}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default ExpenseCategoryEditPage;

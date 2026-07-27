import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, ExpenseCategoryCard, ExpenseTable } from '@/components';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getExpenseCategoryById, 
  deleteExpenseCategory
} from '@/services/expenseCategoryService';
import { getExpensesByCategory } from '@/services/expenseService';

/**
 * ExpenseCategoryDetailPage Component
 * Displays detailed information for a single expense category with related expenses
 */
function ExpenseCategoryDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load category data and related expenses
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load category
        const categoryResult = await getExpenseCategoryById(id);
        setCategory(categoryResult.data || categoryResult);

        // Load expenses for this category
        const expensesResult = await getExpensesByCategory(id);
        setExpenses(expensesResult.data || expensesResult || []);
      } catch (err) {
        setError(err.message || 'Failed to load category data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  // Handle edit
  const handleEdit = () => {
    navigate(`/expense-categories/edit/${id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete category "${category?.name || id}"?`)) {
      try {
        await deleteExpenseCategory(id);
        navigate('/expense-categories');
      } catch (err) {
        setError(err.message || 'Failed to delete category');
      }
    }
  };

  // Handle back to list
  const handleBack = () => {
    navigate('/expense-categories');
  };

  // Show loading state
  if (loading && !category) {
    return (
      <div className="page expense-category-detail-page">
        <div className="page-header">
          <h1>Category Details</h1>
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
      <div className="page expense-category-detail-page">
        <div className="page-header">
          <h1>Category Details</h1>
        </div>
        <div className="alert alert-danger">
          {error}
          <button className="close" onClick={() => navigate('/expense-categories')}>×</button>
        </div>
      </div>
    );
  }

  // Show category details
  return (
    <div className="page expense-category-detail-page">
      <div className="page-header">
        <h1>Expense Category Details</h1>
        <p className="page-subtitle">View category information and related expenses</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger">
          {error}
          <button className="close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Category Detail Card */}
      <div className="page-content">
        <Card>
          <div className="card-header">
            <h3>Category Information</h3>
            <div className="card-actions">
              <Button variant="outline" onClick={handleBack}>
                Back to List
              </Button>
              <Button variant="secondary" onClick={handleEdit}>
                Edit
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={category?.is_system}>
                Delete
              </Button>
            </div>
          </div>
          
          <ExpenseCategoryCard
            category={category}
            showActions={false}
          />
        </Card>

        {/* Related Expenses Section */}
        {expenses.length > 0 && (
          <Card title={`Expenses in "${category?.name}" (${expenses.length})`}>
            <ExpenseTable
              expenses={expenses}
              loading={false}
              showActions={false}
            />
          </Card>
        )}

        {/* No Expenses Message */}
        {expenses.length === 0 && category && (
          <Card>
            <p className="text-muted">
              No expenses found for this category.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default ExpenseCategoryDetailPage;

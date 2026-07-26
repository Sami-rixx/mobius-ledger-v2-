import React, { useState, useEffect } from 'react';
import { Card, Button, ExpenseCard } from '../../components/index.js';
import { useNavigate, useParams } from 'react-router-dom';
import { getExpenseById, deleteExpense } from '../../services/index.js';

/**
 * ExpenseDetailPage Component
 * Displays detailed information for a single expense record
 */
function ExpenseDetailPage() {
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

  // Handle edit
  const handleEdit = () => {
    navigate(`/expenses/edit/${id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete expense record ${expense.receipt_number || id}?`)) {
      try {
        await deleteExpense(id);
        navigate('/expenses');
      } catch (err) {
        setError(err.message || 'Failed to delete expense');
      }
    }
  };

  // Handle back to list
  const handleBack = () => {
    navigate('/expenses');
  };

  // Show loading state
  if (loading && !expense) {
    return (
      <div className="page expense-detail-page">
        <div className="page-header">
          <h1>Expense Details</h1>
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
      <div className="page expense-detail-page">
        <div className="page-header">
          <h1>Expense Details</h1>
        </div>
        <div className="alert alert-danger">
          {error}
          <button className="close" onClick={() => navigate('/expenses')}>×</button>
        </div>
      </div>
    );
  }

  // Show expense details
  return (
    <div className="page expense-detail-page">
      <div className="page-header">
        <h1>Expense Details</h1>
        <p className="page-subtitle">View expense record information</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger">
          {error}
          <button className="close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Detail Card */}
      <div className="page-content">
        <Card>
          <div className="card-header">
            <h3>Expense Record #{expense?.id}</h3>
            <div className="card-actions">
              <Button variant="outline" onClick={handleBack}>
                Back to List
              </Button>
              <Button variant="secondary" onClick={handleEdit}>
                Edit
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
          
          <ExpenseCard
            expense={expense}
            showActions={false}
          />
        </Card>
      </div>
    </div>
  );
}

export default ExpenseDetailPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, IncomeCategoryCard } from '../../components/index.js';
import { getIncomeCategoryById, deleteIncomeCategory } from '../../services/index.js';
import { getIncomeByCategory } from '../../services/incomeService.js';

/**
 * IncomeCategoryDetailPage Component
 * Displays detailed information about a single income category
 */
function IncomeCategoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [incomeRecords, setIncomeRecords] = useState([]);
  const [incomeLoading, setIncomeLoading] = useState(false);

  // Load category
  useEffect(() => {
    const loadCategory = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getIncomeCategoryById(id);
        setCategory(result.data || result);
        
        // Load income records for this category
        if (result.data?.id || result?.id) {
          setIncomeLoading(true);
          const categoryId = result.data?.id || result?.id;
          const incomeResult = await getIncomeByCategory(categoryId);
          setIncomeRecords(incomeResult.data || incomeResult || []);
          setIncomeLoading(false);
        }
      } catch (err) {
        setError(err.message || 'Failed to load category');
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [id]);

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      try {
        await deleteIncomeCategory(category.id);
        navigate('/income-categories');
      } catch (err) {
        setError(err.message || 'Failed to delete category');
      }
    }
  };

  // Handle edit
  const handleEdit = () => {
    navigate(`/income-categories/edit/${category.id}`);
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'KES 0.00';
    return `KES ${parseFloat(amount).toFixed(2)}`;
  };

  // Calculate total income for this category
  const calculateCategoryTotal = () => {
    return incomeRecords.reduce((sum, record) => {
      return sum + (parseFloat(record.amount) || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="page income-category-detail-page">
        <Card className="loading-card">
          <p>Loading...</p>
        </Card>
      </div>
    );
  }

  if (error && !category) {
    return (
      <div className="page income-category-detail-page">
        <Card className="error-card">
          <p className="error-message">{error}</p>
          <Button variant="primary" onClick={() => navigate('/income-categories')}>
            Back to Categories List
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page income-category-detail-page">
      <header className="page-header">
        <h1>Income Category Details</h1>
        <p>Category: {category?.name || 'N/A'}</p>
      </header>

      {/* Category Card */}
      <IncomeCategoryCard
        category={{ ...category, usage_count: incomeRecords.length }}
        showActions={false}
      />

      {/* Summary */}
      <Card title="Category Summary" className="summary-card">
        <div className="category-summary">
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Total Income Records:</span>
              <span className="summary-value">{incomeRecords.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Amount:</span>
              <span className="summary-value">{formatCurrency(calculateCategoryTotal())}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Income Records */}
      {incomeRecords.length > 0 && (
        <Card title="Recent Income Records in This Category" className="income-records-card">
          <div className="recent-income-list">
            {incomeRecords.slice(0, 10).map(record => (
              <div key={record.id} className="recent-income-item">
                <div className="recent-income-info">
                  <span className="recent-income-date">
                    {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className="recent-income-source">{record.source || 'N/A'}</span>
                  <span className="recent-income-amount">{formatCurrency(record.amount)}</span>
                  <span className="recent-income-receipt">{record.receipt_number || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <Card className="actions-card">
        <div className="page-actions">
          <Button variant="secondary" onClick={handleEdit}>
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="outline" onClick={() => navigate('/income-categories')}>
            Back to List
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default IncomeCategoryDetailPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, IncomeCard } from '../../components/index.js';
import { getIncomeById, deleteIncome } from '../../services/index.js';

/**
 * IncomeDetailPage Component
 * Displays detailed information about a single income record
 */
function IncomeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [income, setIncome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load income record
  useEffect(() => {
    const loadIncome = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getIncomeById(id);
        setIncome(result.data || result);
      } catch (err) {
        setError(err.message || 'Failed to load income record');
      } finally {
        setLoading(false);
      }
    };

    loadIncome();
  }, [id]);

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete income record ${income.receipt_number || income.id}?`)) {
      try {
        await deleteIncome(income.id);
        navigate('/income');
      } catch (err) {
        setError(err.message || 'Failed to delete income record');
      }
    }
  };

  // Handle edit
  const handleEdit = () => {
    navigate(`/income/edit/${income.id}`);
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'KES 0.00';
    return `KES ${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="page income-detail-page">
        <Card className="loading-card">
          <p>Loading...</p>
        </Card>
      </div>
    );
  }

  if (error && !income) {
    return (
      <div className="page income-detail-page">
        <Card className="error-card">
          <p className="error-message">{error}</p>
          <Button variant="primary" onClick={() => navigate('/income')}>
            Back to Income List
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page income-detail-page">
      <header className="page-header">
        <h1>Income Record Details</h1>
        <p>Receipt: {income?.receipt_number || 'N/A'}</p>
      </header>

      {/* Income Card */}
      <IncomeCard
        income={income}
        showActions={false}
      />

      {/* Additional Details */}
      <Card title="Additional Information" className="detail-card">
        <div className="additional-details">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">ID:</span>
              <span className="detail-value">{income?.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Category ID:</span>
              <span className="detail-value">{income?.category_id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Amount:</span>
              <span className="detail-value">{formatCurrency(income?.amount)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{income?.date ? new Date(income.date).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Source:</span>
              <span className="detail-value">{income?.source || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Payment Method:</span>
              <span className="detail-value">{income?.payment_method || 'N/A'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <Card className="actions-card">
        <div className="page-actions">
          <Button variant="secondary" onClick={handleEdit}>
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="outline" onClick={() => navigate('/income')}>
            Back to List
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default IncomeDetailPage;

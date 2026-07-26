import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, DailySummaryCard } from '../../components/index.js';
import { getDailySummaryById, deleteDailySummary, updateDailySummary } from '../../services/index.js';

/**
 * DailySummaryDetailPage Component
 * Displays detailed information about a single daily summary
 */
function DailySummaryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Load summary
  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getDailySummaryById(id);
      setSummary(result);
      setEditData(result);
    } catch (err) {
      setError(err.message || 'Failed to load daily summary');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadSummary();
  }, [id]);

  // Handle edit
  const handleEdit = () => {
    setEditing(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditing(false);
    setEditData(summary);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  // Handle save
  const handleSave = async () => {
    try {
      await updateDailySummary(id, editData);
      setEditing(false);
      loadSummary();
    } catch (err) {
      setError(err.message || 'Failed to update daily summary');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete daily summary #${id} for ${summary?.summary_date || ''}?`)) {
      try {
        await deleteDailySummary(id);
        navigate('/daily-summaries');
      } catch (err) {
        setError(err.message || 'Failed to delete daily summary');
      }
    }
  };

  // Handle go back
  const handleGoBack = () => {
    navigate('/daily-summaries');
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'KES 0.00';
    return `KES ${parseFloat(amount).toFixed(2)}`;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="page daily-summary-detail-page">
        <p>Loading daily summary details...</p>
      </div>
    );
  }

  // Render error state
  if (error && !summary) {
    return (
      <div className="page daily-summary-detail-page">
        <p>{error}</p>
        <Button onClick={loadSummary}>Retry</Button>
        <Button onClick={handleGoBack}>Back to Daily Summaries</Button>
      </div>
    );
  }

  // Render not found state
  if (!summary) {
    return (
      <div className="page daily-summary-detail-page">
        <p>Daily summary not found</p>
        <Button onClick={handleGoBack}>Back to Daily Summaries</Button>
      </div>
    );
  }

  // Render edit mode
  if (editing) {
    return (
      <div className="page daily-summary-detail-page">
        <header className="page-header">
          <h1>Edit Daily Summary: {formatDate(summary.summary_date)}</h1>
        </header>

        <main className="page-main">
          <Card title="Edit Daily Summary" className="edit-card">
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label htmlFor="summary_date">Date:</label>
                <input
                  type="date"
                  id="summary_date"
                  name="summary_date"
                  value={editData.summary_date || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="total_income">Total Income:</label>
                <input
                  type="number"
                  id="total_income"
                  name="total_income"
                  value={editData.total_income || 0}
                  onChange={handleInputChange}
                  step="0.01"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="total_expenses">Total Expenses:</label>
                <input
                  type="number"
                  id="total_expenses"
                  name="total_expenses"
                  value={editData.total_expenses || 0}
                  onChange={handleInputChange}
                  step="0.01"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="income_count">Income Count:</label>
                <input
                  type="number"
                  id="income_count"
                  name="income_count"
                  value={editData.income_count || 0}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="expense_count">Expense Count:</label>
                <input
                  type="number"
                  id="expense_count"
                  name="expense_count"
                  value={editData.expense_count || 0}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="net_flow">Net Flow:</label>
                <input
                  type="number"
                  id="net_flow"
                  name="net_flow"
                  value={editData.net_flow || 0}
                  onChange={handleInputChange}
                  step="0.01"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="transaction_count">Transaction Count:</label>
                <input
                  type="number"
                  id="transaction_count"
                  name="transaction_count"
                  value={editData.transaction_count || 0}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-actions">
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </main>
      </div>
    );
  }

  // Render view mode
  return (
    <div className="page daily-summary-detail-page">
      <header className="page-header">
        <h1>Daily Summary: {formatDate(summary.summary_date)}</h1>
        <p>Detailed information about this daily financial summary</p>
      </header>

      <main className="page-main">
        {/* Daily Summary Card */}
        <DailySummaryCard
          summary={summary}
          showActions={true}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={() => {}}
        />

        {/* Additional Details */}
        <Card title="Additional Details" className="additional-details-card">
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Summary ID:</span>
              <span className="detail-value">{summary.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{formatDate(summary.summary_date)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Created:</span>
              <span className="detail-value">{formatDate(summary.created_at)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Income:</span>
              <span className="detail-value">{formatCurrency(summary.total_income)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Expenses:</span>
              <span className="detail-value">{formatCurrency(summary.total_expenses)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Net Flow:</span>
              <span className={`detail-value ${summary.net_flow >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(summary.net_flow)}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Income Transactions:</span>
              <span className="detail-value">{summary.income_count || 0}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Expense Transactions:</span>
              <span className="detail-value">{summary.expense_count || 0}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Transactions:</span>
              <span className="detail-value">{summary.transaction_count || 0}</span>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <Card title="Actions" className="actions-card">
          <div className="action-buttons">
            <Button variant="primary" onClick={handleEdit}>
              Edit Summary
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Summary
            </Button>
            <Button variant="outline" onClick={handleGoBack}>
              Back to Daily Summaries
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default DailySummaryDetailPage;

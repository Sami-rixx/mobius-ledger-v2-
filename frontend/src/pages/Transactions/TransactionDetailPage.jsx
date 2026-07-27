import React, { useState, useEffect } from 'react';
import { Button, TransactionCard } from '@/components';
import { getTransactionById, deleteTransaction } from '@/services';
import { useNavigate, useParams } from 'react-router-dom';
import { getTransactionTypeLabel, formatTransaction } from '@/services/transactionService';

/**
 * TransactionDetailPage Component
 * Page for viewing transaction details with full workflow
 */
function TransactionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load transaction data
  useEffect(() => {
    const loadTransaction = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);

      try {
        const result = await getTransactionById(parseInt(id));
        if (result.success) {
          setTransaction(result.data);
        } else {
          setError(result.error || 'Failed to load transaction');
        }
      } catch (err) {
        setError(err.message || 'Failed to load transaction');
      } finally {
        setLoading(false);
      }
    };

    loadTransaction();
  }, [id]);

  // Handle delete
  const handleDelete = async () => {
    if (!id || !window.confirm(`Are you sure you want to delete transaction ${transaction?.receipt_number || id}?`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteTransaction(parseInt(id));
      navigate('/transactions');
    } catch (err) {
      setError(err.message || 'Failed to delete transaction');
    } finally {
      setDeleting(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    navigate(`/transactions/edit/${id}`);
  };

  // Handle back
  const handleBack = () => {
    navigate('/transactions');
  };

  if (loading && !transaction) {
    return (
      <div className="transaction-detail-page">
        <div className="page-header">
          <h1>Transaction Details</h1>
        </div>
        <p>Loading transaction data...</p>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="transaction-detail-page">
        <div className="page-header">
          <h1>Transaction Details</h1>
        </div>
        <div className="alert alert-error">
          {error}
          <div className="error-actions">
            <Button variant="primary" onClick={handleBack}>
              Back to List
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-detail-page">
      <div className="page-header">
        <h1>Transaction Details</h1>
        <div className="page-actions">
          <Button variant="secondary" onClick={handleBack} disabled={deleting}>
            Back
          </Button>
          <Button variant="primary" onClick={handleEdit} disabled={deleting}>
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {transaction && (
        <div className="transaction-detail-content">
          <TransactionCard
            transaction={transaction}
            showActions={false}
          />

          {/* Additional details display */}
          <div className="transaction-detail-section">
            <h2>Transaction Information</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{getTransactionTypeLabel(transaction.transaction_type)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Amount:</span>
                <span className="detail-value">KES {parseFloat(transaction.amount || 0).toFixed(2)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{transaction.transaction_date || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Time:</span>
                <span className="detail-value">{transaction.transaction_time || 'N/A'}</span>
              </div>
              {transaction.student_id && (
                <div className="detail-item">
                  <span className="detail-label">Student ID:</span>
                  <span className="detail-value">{transaction.student_id}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Receipt #:</span>
                <span className="detail-value">{transaction.receipt_number || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className={`detail-value badge badge-${transaction.is_verified ? 'success' : 'warning'}`}>
                  {transaction.is_verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              {transaction.reference && (
                <div className="detail-item">
                  <span className="detail-label">Reference:</span>
                  <span className="detail-value">{transaction.reference}</span>
                </div>
              )}
            </div>
          </div>

          {transaction.description && (
            <div className="transaction-detail-section">
              <h2>Description</h2>
              <p>{transaction.description}</p>
            </div>
          )}

          {transaction.notes && (
            <div className="transaction-detail-section">
              <h2>Notes</h2>
              <p>{transaction.notes}</p>
            </div>
          )}

          <div className="transaction-detail-section">
            <h2>Metadata</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Created:</span>
                <span className="detail-value">{transaction.created_at || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Updated:</span>
                <span className="detail-value">{transaction.updated_at || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionDetailPage;

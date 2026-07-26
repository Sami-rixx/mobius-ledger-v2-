import React, { useState, useEffect } from 'react';
import { Button, TransactionForm } from '../../../components/index.js';
import { getTransactionById, updateTransaction } from '../../../services/index.js';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * TransactionEditPage Component
 * Page for editing an existing transaction
 */
function TransactionEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  // Handle form submission
  const handleSubmit = async (formData) => {
    if (!id) return;
    
    setSubmitting(true);
    setError(null);

    try {
      // Prepare data for API
      const transactionData = {
        transactionType: formData.transactionType,
        amount: formData.amount,
        receiptNumber: formData.receiptNumber,
        studentId: formData.studentId,
        transactionDate: formData.transactionDate,
        transactionTime: formData.transactionTime,
        paymentMethodId: formData.paymentMethodId,
        incomeCategoryId: formData.incomeCategoryId,
        expenseCategoryId: formData.expenseCategoryId,
        categoryId: formData.categoryId,
        description: formData.description,
        reference: formData.reference,
        notes: formData.notes,
        isVerified: formData.isVerified
      };

      const result = await updateTransaction(parseInt(id), transactionData);
      
      if (result.success) {
        // Navigate back to detail page
        navigate(`/transactions/${id}`);
      } else {
        setError(result.error || 'Failed to update transaction');
      }
    } catch (err) {
      setError(err.message || 'Failed to update transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (id) {
      navigate(`/transactions/${id}`);
    } else {
      navigate('/transactions');
    }
  };

  if (loading && !transaction) {
    return (
      <div className="transaction-edit-page">
        <div className="page-header">
          <h1>Edit Transaction</h1>
        </div>
        <p>Loading transaction data...</p>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="transaction-edit-page">
        <div className="page-header">
          <h1>Edit Transaction</h1>
        </div>
        <div className="alert alert-error">
          {error}
          <div className="error-actions">
            <Button variant="primary" onClick={handleCancel}>
              Back to List
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-edit-page">
      <div className="page-header">
        <h1>Edit Transaction #{id}</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <TransactionForm
        transaction={transaction}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={submitting}
      />
    </div>
  );
}

export default TransactionEditPage;

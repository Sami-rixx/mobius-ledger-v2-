import React, { useState } from 'react';
import { Button, TransactionForm } from '../../../components/index.js';
import { createTransaction } from '../../../services/index.js';
import { useNavigate } from 'react-router-dom';

/**
 * TransactionCreatePage Component
 * Page for creating a new transaction
 */
function TransactionCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
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

      const result = await createTransaction(transactionData);
      
      if (result.success) {
        // Navigate to detail page or list page
        navigate(`/transactions/${result.data.id}`);
      } else {
        setError(result.error || 'Failed to create transaction');
      }
    } catch (err) {
      setError(err.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/transactions');
  };

  return (
    <div className="transaction-create-page">
      <div className="page-header">
        <h1>Create Transaction</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <TransactionForm
        transaction={null}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}

export default TransactionCreatePage;

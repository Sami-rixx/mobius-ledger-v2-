import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, DirectorWithdrawalForm } from '../../components/index.js';
import { createWithdrawal } from '../../services/index.js';

/**
 * WithdrawalCreatePage Component
 * Page for creating a new director withdrawal
 */
function WithdrawalCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await createWithdrawal(formData);
      
      if (result.success) {
        // Navigate to the detail page or list page
        navigate(`/withdrawals/${result.data.id}`);
      } else {
        setError(result.error || 'Failed to create withdrawal');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating the withdrawal');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/withdrawals');
  };

  return (
    <div className="page withdrawal-create-page">
      <div className="page-header">
        <h1>Create New Director Withdrawal</h1>
        <p className="text-muted">Create a new withdrawal request for approval</p>
      </div>

      {/* Error message */}
      {error && (
        <Card className="mb-3">
          <div className="alert alert-danger">
            {error}
            <button type="button" className="btn-close float-end" onClick={() => setError(null)} />
          </div>
        </Card>
      )}

      {/* Withdrawal Form */}
      <DirectorWithdrawalForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />

      {/* Success message (handled by navigation) */}
    </div>
  );
}

export default WithdrawalCreatePage;

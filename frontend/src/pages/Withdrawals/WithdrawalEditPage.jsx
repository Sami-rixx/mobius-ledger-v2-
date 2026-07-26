import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, DirectorWithdrawalForm } from '../../components/index.js';
import { getWithdrawalById, updateWithdrawal } from '../../services/index.js';

/**
 * WithdrawalEditPage Component
 * Page for editing an existing director withdrawal
 */
function WithdrawalEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [withdrawal, setWithdrawal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load withdrawal data
  useEffect(() => {
    const loadWithdrawal = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getWithdrawalById(id);
        
        if (result.success) {
          setWithdrawal(result.data);
        } else {
          setError(result.error || 'Failed to load withdrawal');
          navigate('/withdrawals');
        }
      } catch (err) {
        setError(err.message || 'Failed to load withdrawal');
        navigate('/withdrawals');
      } finally {
        setLoading(false);
      }
    };

    loadWithdrawal();
  }, [id, navigate]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError(null);

    try {
      const result = await updateWithdrawal(id, formData);
      
      if (result.success) {
        // Navigate back to the detail page
        navigate(`/withdrawals/${id}`);
      } else {
        setError(result.error || 'Failed to update withdrawal');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating the withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/withdrawals/${id}`);
  };

  if (loading) {
    return (
      <div className="page withdrawal-edit-page">
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading withdrawal data...</p>
        </div>
      </div>
    );
  }

  if (error && !withdrawal) {
    return (
      <div className="page withdrawal-edit-page">
        <Card>
          <div className="alert alert-danger">
            {error}
            <Button
              variant="primary"
              onClick={() => navigate('/withdrawals')}
              className="ms-3"
            >
              Back to Withdrawals
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page withdrawal-edit-page">
      <div className="page-header">
        <h1>Edit Director Withdrawal #{withdrawal?.id}</h1>
        <p className="text-muted">
          Edit withdrawal for {withdrawal?.purpose} - 
          Current status: <strong>{withdrawal?.status || 'Unknown'}</strong>
        </p>
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
      {withdrawal && (
        <DirectorWithdrawalForm
          withdrawal={withdrawal}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
        />
      )}
    </div>
  );
}

export default WithdrawalEditPage;

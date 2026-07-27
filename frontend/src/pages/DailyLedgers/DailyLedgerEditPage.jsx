import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DailyLedgerForm, Card, LoadingSpinner } from '../../../components/index.js';
import { getDailyLedgerById, updateDailyLedger } from '../../../services/index.js';

/**
 * DailyLedgerEditPage Component
 * Form for editing an existing daily ledger record
 */
function DailyLedgerEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load ledger data
  useEffect(() => {
    const loadLedger = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);

      try {
        const result = await getDailyLedgerById(parseInt(id));
        if (result && result.data) {
          setLedger(result.data);
        } else {
          setError('Failed to load daily ledger data');
          navigate('/daily-ledgers');
        }
      } catch (err) {
        setError(err.message || 'Failed to load daily ledger data');
        navigate('/daily-ledgers');
      } finally {
        setLoading(false);
      }
    };

    loadLedger();
  }, [id, navigate]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    if (!id) return;

    setSubmitting(true);
    setError(null);

    try {
      await updateDailyLedger(parseInt(id), formData);
      // Redirect to detail page after successful update
      navigate(`/daily-ledgers/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to update daily ledger record');
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/daily-ledgers/${id}`);
  };

  if (loading) {
    return (
      <div className="page daily-ledger-edit-page">
        <div className="page-header">
          <h1>Edit Daily Ledger</h1>
        </div>
        <LoadingSpinner />
        <p>Loading daily ledger data...</p>
      </div>
    );
  }

  if (error && !ledger) {
    return (
      <div className="page daily-ledger-edit-page">
        <div className="page-header">
          <h1>Edit Daily Ledger</h1>
        </div>
        <Card className="error-card">
          <p className="error-message">{error}</p>
        </Card>
        <button className="btn btn-secondary" onClick={() => navigate('/daily-ledgers')}>
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="page daily-ledger-edit-page">
      <div className="page-header">
        <h1>Edit Daily Ledger</h1>
        <p>Update daily ledger record #{id}</p>
      </div>

      {error && (
        <Card className="error-card">
          <p className="error-message">{error}</p>
        </Card>
      )}

      {ledger && (
        <DailyLedgerForm
          ledger={ledger}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
        />
      )}
    </div>
  );
}

export default DailyLedgerEditPage;

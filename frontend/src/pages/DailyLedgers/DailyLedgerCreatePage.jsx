import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DailyLedgerForm, Card } from '@/components';
import { createDailyLedger } from '@/services';

/**
 * DailyLedgerCreatePage Component
 * Form for creating a new daily ledger record
 */
function DailyLedgerCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      await createDailyLedger(formData);
      // Redirect to list page after successful creation
      navigate('/daily-ledgers');
    } catch (err) {
      setError(err.message || 'Failed to create daily ledger record');
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/daily-ledgers');
  };

  return (
    <div className="page daily-ledger-create-page">
      <div className="page-header">
        <h1>Create Daily Ledger Entry</h1>
        <p>Add a new daily ledger record to the system</p>
      </div>

      {error && (
        <Card className="error-card">
          <p className="error-message">{error}</p>
        </Card>
      )}

      <DailyLedgerForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}

export default DailyLedgerCreatePage;

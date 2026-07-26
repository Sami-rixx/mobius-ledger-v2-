import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IncomeForm, Card } from '../../components/index.js';
import { createIncome } from '../../services/index.js';

/**
 * IncomeCreatePage Component
 * Form for creating a new income record
 */
function IncomeCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      await createIncome(formData);
      // Redirect to list page after successful creation
      navigate('/income');
    } catch (err) {
      setError(err.message || 'Failed to create income record');
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/income');
  };

  return (
    <div className="page income-create-page">
      <header className="page-header">
        <h1>Record New Income</h1>
        <p>Add a new income transaction to the system</p>
      </header>

      {error && (
        <Card className="error-card">
          <p className="error-message">{error}</p>
        </Card>
      )}

      <IncomeForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}

export default IncomeCreatePage;

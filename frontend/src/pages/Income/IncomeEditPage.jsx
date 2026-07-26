import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IncomeForm, Card } from '../../components/index.js';
import { getIncomeById, updateIncome } from '../../services/index.js';

/**
 * IncomeEditPage Component
 * Form for editing an existing income record
 */
function IncomeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [income, setIncome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

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

  // Handle form submission
  const handleSubmit = async (formData) => {
    setFormLoading(true);
    setError(null);

    try {
      await updateIncome(id, formData);
      // Redirect to detail page after successful update
      navigate(`/income/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to update income record');
      setFormLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/income/${id}`);
  };

  if (loading) {
    return (
      <div className="page income-edit-page">
        <Card className="loading-card">
          <p>Loading...</p>
        </Card>
      </div>
    );
  }

  if (error && !income) {
    return (
      <div className="page income-edit-page">
        <Card className="error-card">
          <p className="error-message">{error}</p>
          <button onClick={() => navigate('/income')}>Back to Income List</button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page income-edit-page">
      <header className="page-header">
        <h1>Edit Income Record</h1>
        <p>Update income transaction #{income?.receipt_number || id}</p>
      </header>

      {error && (
        <Card className="error-card">
          <p className="error-message">{error}</p>
        </Card>
      )}

      <IncomeForm
        income={income}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={formLoading}
      />
    </div>
  );
}

export default IncomeEditPage;

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LunchPaymentForm } from '../../components/index.js';
import { createLunchPayment } from '../../services/lunchService.js';

/**
 * LunchPaymentCreatePage Component
 * Page for creating a new lunch payment
 */
function LunchPaymentCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = useCallback(async (formData) => {
    setLoading(true);
    setError(null);

    try {
      await createLunchPayment(formData);
      navigate('/lunch/payments', { state: { message: 'Lunch payment created successfully!' } });
    } catch (err) {
      setError(err.message || 'Failed to create lunch payment');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Handle cancel
  const handleCancel = () => {
    navigate('/lunch/payments');
  };

  return (
    <div className="page lunch-payment-create-page">
      <header className="page-header">
        <h1>Create Lunch Payment</h1>
        <p>Record a new lunch fee payment</p>
      </header>

      {/* Error display */}
      {error && (
        <div className="message-card message-error">
          {error}
        </div>
      )}

      {/* Lunch payment form */}
      <LunchPaymentForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}

export default LunchPaymentCreatePage;

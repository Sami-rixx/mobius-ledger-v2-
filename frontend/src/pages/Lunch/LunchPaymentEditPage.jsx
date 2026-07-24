import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LunchPaymentForm } from '../../components/index.js';
import { getLunchPaymentById, updateLunchPayment } from '../../services/lunchService.js';

/**
 * LunchPaymentEditPage Component
 * Page for editing an existing lunch payment
 */
function LunchPaymentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load lunch payment data
  useEffect(() => {
    const loadPayment = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getLunchPaymentById(id);
        setPayment(result.data || result);
      } catch (err) {
        setError(err.message || 'Failed to load lunch payment');
      } finally {
        setLoading(false);
      }
    };

    loadPayment();
  }, [id]);

  // Handle form submission
  const handleSubmit = useCallback(async (formData) => {
    setFormLoading(true);
    setError(null);

    try {
      await updateLunchPayment(id, formData);
      navigate('/lunch/payments', { state: { message: 'Lunch payment updated successfully!' } });
    } catch (err) {
      setError(err.message || 'Failed to update lunch payment');
    } finally {
      setFormLoading(false);
    }
  }, [id, navigate]);

  // Handle cancel
  const handleCancel = () => {
    navigate('/lunch/payments');
  };

  if (loading) {
    return (
      <div className="page lunch-payment-edit-page">
        <header className="page-header">
          <h1>Edit Lunch Payment</h1>
          <p>Loading payment data...</p>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page lunch-payment-edit-page">
        <header className="page-header">
          <h1>Edit Lunch Payment</h1>
        </header>
        <div className="message-card message-error">
          {error}
          <div className="error-actions">
            <button onClick={handleCancel} className="button outline">
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page lunch-payment-edit-page">
      <header className="page-header">
        <h1>Edit Lunch Payment</h1>
        <p>Update lunch payment #{id}</p>
      </header>

      {/* Lunch payment form */}
      <LunchPaymentForm
        payment={payment}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={formLoading}
      />
    </div>
  );
}

export default LunchPaymentEditPage;

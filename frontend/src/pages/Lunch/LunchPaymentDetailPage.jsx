import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, LunchPaymentCard } from '../../components/index.js';
import { getLunchPaymentById, deleteLunchPayment } from '../../services/lunchService.js';

/**
 * LunchPaymentDetailPage Component
 * Page for viewing lunch payment details
 */
function LunchPaymentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

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

  // Check for navigation state message
  useEffect(() => {
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  // Handle edit
  const handleEdit = () => {
    navigate(`/lunch/payments/edit/${id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete lunch payment #${id}?`)) {
      try {
        await deleteLunchPayment(id);
        setMessage('Lunch payment deleted successfully!');
        setTimeout(() => navigate('/lunch/payments'), 2000);
      } catch (err) {
        setError(err.message || 'Failed to delete lunch payment');
      }
    }
  };

  // Handle back
  const handleBack = () => {
    navigate('/lunch/payments');
  };

  if (loading) {
    return (
      <div className="page lunch-payment-detail-page">
        <header className="page-header">
          <h1>Lunch Payment Details</h1>
          <p>Loading payment data...</p>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page lunch-payment-detail-page">
        <header className="page-header">
          <h1>Lunch Payment Details</h1>
        </header>
        <Card className="message-card message-error">
          {error}
          <div className="error-actions">
            <Button onClick={handleBack} variant="outline">
              Back to List
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page lunch-payment-detail-page">
      <header className="page-header">
        <h1>Lunch Payment Details</h1>
        <p>View lunch payment #{id}</p>
      </header>

      {/* Message display */}
      {message && (
        <Card className="message-card message-success">
          {message}
        </Card>
      )}

      {/* Payment card */}
      <LunchPaymentCard
        payment={payment}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Back button */}
      <Card className="action-bar">
        <Button variant="outline" onClick={handleBack}>
          Back to List
        </Button>
      </Card>
    </div>
  );
}

export default LunchPaymentDetailPage;

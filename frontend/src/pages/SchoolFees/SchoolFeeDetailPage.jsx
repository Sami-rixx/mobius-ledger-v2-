import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, SchoolFeeCard } from '../../components/index.js';
import { getSchoolFeePaymentById, deleteSchoolFeePayment } from '../../services/schoolFeeService.js';

/**
 * SchoolFeeDetailPage Component
 * Page for viewing detailed school fee payment information
 */
function SchoolFeeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load payment data
  useEffect(() => {
    const loadPayment = async () => {
      try {
        const data = await getSchoolFeePaymentById(parseInt(id));
        setPayment(data);
      } catch (err) {
        setError(err.message || 'Failed to load school fee payment');
      } finally {
        setLoading(false);
      }
    };

    loadPayment();
  }, [id]);

  // Handle edit
  const handleEdit = () => {
    navigate(`/school-fees/edit/${id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this school fee payment?')) {
      try {
        await deleteSchoolFeePayment(parseInt(id));
        navigate('/school-fees', { state: { message: 'School fee payment deleted successfully!' } });
      } catch (err) {
        setError(err.message || 'Failed to delete school fee payment');
      }
    }
  };

  // Handle back
  const handleBack = () => {
    navigate('/school-fees');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="page school-fee-detail-page">
        <header className="header">
          <h1>School Fee Payment Details</h1>
          <p>Loading payment data...</p>
        </header>
        <main className="main-content">
          <Card>
            <p>Loading...</p>
          </Card>
        </main>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="page school-fee-detail-page">
        <header className="header">
          <h1>School Fee Payment Details</h1>
          <p>View school fee payment information</p>
        </header>
        <main className="main-content">
          <Card className="error-card">
            <p className="text-error">{error}</p>
            <Button variant="outline" onClick={handleBack}>
              Back to List
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="page school-fee-detail-page">
      <header className="header">
        <h1>School Fee Payment Details</h1>
        <p>View detailed information for this payment</p>
      </header>

      <main className="main-content">
        {/* Payment card */}
        <SchoolFeeCard
          payment={payment}
          showActions={true}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={null}
        />

        {/* Action buttons card */}
        <Card className="action-card">
          <div className="action-buttons">
            <Button
              variant="primary"
              onClick={handleEdit}
              className="action-button"
            >
              Edit Payment
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              className="action-button"
            >
              Delete Payment
            </Button>
            <Button
              variant="outline"
              onClick={handleBack}
              className="action-button"
            >
              Back to List
            </Button>
          </div>
        </Card>

        {/* Additional information */}
        {payment && (
          <Card className="info-card">
            <h2>Payment Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Payment ID:</span>
                <span className="info-value">{payment.id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Transaction ID:</span>
                <span className="info-value">{payment.transactionId || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Receipt Number:</span>
                <span className="info-value badge badge-primary">{payment.receiptNumber || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Created:</span>
                <span className="info-value">{new Date(payment.createdAt).toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Updated:</span>
                <span className="info-value">{new Date(payment.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

export default SchoolFeeDetailPage;

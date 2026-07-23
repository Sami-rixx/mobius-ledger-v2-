import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SchoolFeeForm, Card } from '../../components/index.js';
import { getSchoolFeePaymentById, updateSchoolFeePayment } from '../../services/schoolFeeService.js';

/**
 * SchoolFeeEditPage Component
 * Page for editing an existing school fee payment
 */
function SchoolFeeEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

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

  // Handle form submission
  const handleSubmit = async (formData) => {
    setFormLoading(true);
    setError(null);

    try {
      // Transform form data for API
      const paymentData = {
        studentId: parseInt(formData.studentId),
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        academicYear: formData.academicYear,
        term: formData.term,
        paymentMethodId: parseInt(formData.paymentMethodId) || 1,
        description: formData.description || null,
        notes: formData.notes || null
      };

      await updateSchoolFeePayment(parseInt(id), paymentData);
      navigate('/school-fees', { state: { message: 'School fee payment updated successfully!' } });
    } catch (err) {
      setError(err.message || 'Failed to update school fee payment');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/school-fees');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="page school-fee-edit-page">
        <header className="header">
          <h1>Edit School Fee Payment</h1>
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
      <div className="page school-fee-edit-page">
        <header className="header">
          <h1>Edit School Fee Payment</h1>
          <p>Edit school fee payment record</p>
        </header>
        <main className="main-content">
          <Card className="error-card">
            <p className="text-error">{error}</p>
            <Button variant="outline" onClick={handleCancel}>
              Back to List
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="page school-fee-edit-page">
      <header className="header">
        <h1>Edit School Fee Payment</h1>
        <p>Update an existing school fee payment record</p>
      </header>

      <main className="main-content">
        {error && (
          <Card className="error-card">
            <p className="text-error">{error}</p>
          </Card>
        )}

        <SchoolFeeForm
          payment={payment}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={formLoading}
        />
      </main>
    </div>
  );
}

export default SchoolFeeEditPage;

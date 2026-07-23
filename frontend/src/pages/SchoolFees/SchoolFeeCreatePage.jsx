import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SchoolFeeForm, Card } from '../../components/index.js';
import { createSchoolFeePayment } from '../../services/schoolFeeService.js';

/**
 * SchoolFeeCreatePage Component
 * Page for recording a new school fee payment
 */
function SchoolFeeCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
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

      await createSchoolFeePayment(paymentData);
      navigate('/school-fees', { state: { message: 'School fee payment recorded successfully!' } });
    } catch (err) {
      setError(err.message || 'Failed to record school fee payment');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/school-fees');
  };

  return (
    <div className="page school-fee-create-page">
      <header className="header">
        <h1>Record School Fee Payment</h1>
        <p>Add a new school fee payment for a student</p>
      </header>

      <main className="main-content">
        {error && (
          <Card className="error-card">
            <p className="text-error">{error}</p>
          </Card>
        )}

        <SchoolFeeForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </main>
    </div>
  );
}

export default SchoolFeeCreatePage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentChargeForm, Card } from '../../components/index.js';
import { createStudentCharge } from '../../services/studentChargeService.js';

/**
 * StudentChargeCreatePage Component
 * Page for creating a new student charge
 */
function StudentChargeCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      await createStudentCharge(formData);
      navigate('/student-charges', { state: { message: 'Charge created successfully!' } });
    } catch (err) {
      setError(err.message || 'Failed to create charge');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/student-charges');
  };

  return (
    <div className="page student-charge-create-page">
      <header className="header">
        <h1>Add New Charge</h1>
        <p>Create a new student charge (e.g., swimming lessons, school trip, sports fee)</p>
      </header>

      <main className="main-content">
        {error && (
          <Card className="error-card">
            <p className="text-error">{error}</p>
          </Card>
        )}

        <StudentChargeForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </main>
    </div>
  );
}

export default StudentChargeCreatePage;

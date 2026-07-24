import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentChargeForm } from '../../components/index.js';
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
  const handleSubmit = useCallback(async (formData) => {
    setLoading(true);
    setError(null);

    try {
      await createStudentCharge(formData);
      navigate('/student-charges', { state: { message: 'Student charge created successfully!' } });
    } catch (err) {
      setError(err.message || 'Failed to create student charge');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Handle cancel
  const handleCancel = () => {
    navigate('/student-charges');
  };

  return (
    <div className="page student-charge-create-page">
      <header className="page-header">
        <h1>Create Student Charge</h1>
        <p>Create a new custom charge for students</p>
      </header>

      {/* Error display */}
      {error && (
        <div className="message-card message-error">
          {error}
        </div>
      )}

      {/* Student charge form */}
      <StudentChargeForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}

export default StudentChargeCreatePage;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StudentChargeForm } from '../../components/index.js';
import { getStudentChargeById, updateStudentCharge } from '../../services/studentChargeService.js';

/**
 * StudentChargeEditPage Component
 * Page for editing an existing student charge
 */
function StudentChargeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [charge, setCharge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load student charge data
  useEffect(() => {
    const loadCharge = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getStudentChargeById(id);
        setCharge(result.data || result);
      } catch (err) {
        setError(err.message || 'Failed to load student charge');
      } finally {
        setLoading(false);
      }
    };

    loadCharge();
  }, [id]);

  // Handle form submission
  const handleSubmit = useCallback(async (formData) => {
    setFormLoading(true);
    setError(null);

    try {
      await updateStudentCharge(id, formData);
      navigate('/student-charges', { state: { message: 'Student charge updated successfully!' } });
    } catch (err) {
      setError(err.message || 'Failed to update student charge');
    } finally {
      setFormLoading(false);
    }
  }, [id, navigate]);

  // Handle cancel
  const handleCancel = () => {
    navigate('/student-charges');
  };

  if (loading) {
    return (
      <div className="page student-charge-edit-page">
        <header className="page-header">
          <h1>Edit Student Charge</h1>
          <p>Loading charge data...</p>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page student-charge-edit-page">
        <header className="page-header">
          <h1>Edit Student Charge</h1>
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
    <div className="page student-charge-edit-page">
      <header className="page-header">
        <h1>Edit Student Charge</h1>
        <p>Update student charge #{id}</p>
      </header>

      {/* Student charge form */}
      <StudentChargeForm
        charge={charge}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={formLoading}
      />
    </div>
  );
}

export default StudentChargeEditPage;

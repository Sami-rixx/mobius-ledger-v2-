import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StudentChargeAssignmentForm } from '../../components/index.js';
import { createStudentChargeAssignment } from '../../services/studentChargeService.js';

/**
 * StudentChargeAssignmentCreatePage Component
 * Page for creating a new student charge assignment
 */
function StudentChargeAssignmentCreatePage() {
  const { chargeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = useCallback(async (formData) => {
    setLoading(true);
    setError(null);

    try {
      // Ensure the chargeId from the URL is used
      const submissionData = {
        ...formData,
        charge_id: parseInt(chargeId, 10)
      };
      
      await createStudentChargeAssignment(submissionData);
      navigate(`/student-charges/${chargeId}/assignments`, { 
        state: { message: 'Assignment created successfully!' } 
      });
    } catch (err) {
      setError(err.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  }, [chargeId, navigate]);

  // Handle cancel
  const handleCancel = () => {
    navigate(`/student-charges/${chargeId}/assignments`);
  };

  return (
    <div className="page student-charge-assignment-create-page">
      <header className="page-header">
        <h1>Create Assignment</h1>
        <p>Assign charge #{chargeId} to a student</p>
      </header>

      {/* Error display */}
      {error && (
        <div className="message-card message-error">
          {error}
        </div>
      )}

      {/* Assignment form */}
      <StudentChargeAssignmentForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}

export default StudentChargeAssignmentCreatePage;

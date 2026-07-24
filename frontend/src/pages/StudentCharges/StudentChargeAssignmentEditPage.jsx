import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StudentChargeAssignmentForm } from '../../components/index.js';
import { 
  getStudentChargeAssignmentById, 
  updateStudentChargeAssignment 
} from '../../services/studentChargeService.js';

/**
 * StudentChargeAssignmentEditPage Component
 * Page for editing an existing student charge assignment
 */
function StudentChargeAssignmentEditPage() {
  const { chargeId, id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load assignment data
  useEffect(() => {
    const loadAssignment = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getStudentChargeAssignmentById(id);
        setAssignment(result.data || result);
      } catch (err) {
        setError(err.message || 'Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };

    loadAssignment();
  }, [id]);

  // Handle form submission
  const handleSubmit = useCallback(async (formData) => {
    setFormLoading(true);
    setError(null);

    try {
      await updateStudentChargeAssignment(id, formData);
      navigate(`/student-charges/${chargeId}/assignments`, { 
        state: { message: 'Assignment updated successfully!' } 
      });
    } catch (err) {
      setError(err.message || 'Failed to update assignment');
    } finally {
      setFormLoading(false);
    }
  }, [id, chargeId, navigate]);

  // Handle cancel
  const handleCancel = () => {
    navigate(`/student-charges/${chargeId}/assignments`);
  };

  if (loading) {
    return (
      <div className="page student-charge-assignment-edit-page">
        <header className="page-header">
          <h1>Edit Assignment</h1>
          <p>Loading assignment data...</p>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page student-charge-assignment-edit-page">
        <header className="page-header">
          <h1>Edit Assignment</h1>
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
    <div className="page student-charge-assignment-edit-page">
      <header className="page-header">
        <h1>Edit Assignment</h1>
        <p>Update assignment #{id} for charge #{chargeId}</p>
      </header>

      {/* Assignment form */}
      <StudentChargeAssignmentForm
        assignment={assignment}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={formLoading}
      />
    </div>
  );
}

export default StudentChargeAssignmentEditPage;

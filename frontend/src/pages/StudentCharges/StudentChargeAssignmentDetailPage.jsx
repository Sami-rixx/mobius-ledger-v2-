import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, StudentChargeAssignmentCard } from '../../components/index.js';
import { 
  getStudentChargeAssignmentById, 
  deleteStudentChargeAssignment 
} from '../../services/studentChargeService.js';

/**
 * StudentChargeAssignmentDetailPage Component
 * Page for viewing student charge assignment details
 */
function StudentChargeAssignmentDetailPage() {
  const { chargeId, id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

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

  // Check for navigation state message
  useEffect(() => {
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  // Handle edit
  const handleEdit = () => {
    navigate(`/student-charges/${chargeId}/assignments/edit/${id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete assignment #${id}?`)) {
      try {
        await deleteStudentChargeAssignment(id);
        setMessage('Assignment deleted successfully!');
        setTimeout(() => navigate(`/student-charges/${chargeId}/assignments`), 2000);
      } catch (err) {
        setError(err.message || 'Failed to delete assignment');
      }
    }
  };

  // Handle back
  const handleBack = () => {
    navigate(`/student-charges/${chargeId}/assignments`);
  };

  if (loading) {
    return (
      <div className="page student-charge-assignment-detail-page">
        <header className="page-header">
          <h1>Assignment Details</h1>
          <p>Loading assignment data...</p>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page student-charge-assignment-detail-page">
        <header className="page-header">
          <h1>Assignment Details</h1>
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
    <div className="page student-charge-assignment-detail-page">
      <header className="page-header">
        <h1>Assignment Details</h1>
        <p>View assignment #{id} for charge #{chargeId}</p>
      </header>

      {/* Message display */}
      {message && (
        <Card className="message-card message-success">
          {message}
        </Card>
      )}

      {/* Assignment card */}
      <StudentChargeAssignmentCard
        assignment={assignment}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Back button */}
      <Card className="action-bar">
        <Button variant="outline" onClick={handleBack}>
          Back to Assignments
        </Button>
      </Card>
    </div>
  );
}

export default StudentChargeAssignmentDetailPage;

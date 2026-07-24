import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, StudentChargeAssignmentTable } from '../../components/index.js';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getStudentChargeAssignmentsByChargeId, 
  deleteStudentChargeAssignment 
} from '../../services/studentChargeService.js';

/**
 * StudentChargeAssignmentListPage Component
 * Displays a list of assignments for a specific student charge
 */
function StudentChargeAssignmentListPage() {
  const { chargeId } = useParams();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [charge, setCharge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Load assignments and charge data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load assignments for this charge
      const assignmentsResult = await getStudentChargeAssignmentsByChargeId(chargeId);
      setAssignments(assignmentsResult.data || assignmentsResult || []);
      
      // Note: Charge details are included in the assignments response
      // If not, we would need to fetch the charge separately
    } catch (err) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [chargeId]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check for navigation state message
  useEffect(() => {
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  // Handle create
  const handleCreate = () => {
    navigate(`/student-charges/${chargeId}/assignments/create`);
  };

  // Handle edit
  const handleEdit = (assignment) => {
    navigate(`/student-charges/${chargeId}/assignments/edit/${assignment.id}`);
  };

  // Handle view
  const handleView = (assignment) => {
    navigate(`/student-charges/${chargeId}/assignments/${assignment.id}`);
  };

  // Handle delete
  const handleDelete = async (assignment) => {
    if (window.confirm(`Are you sure you want to delete assignment #${assignment.id}?`)) {
      try {
        await deleteStudentChargeAssignment(assignment.id);
        setMessage('Assignment deleted successfully!');
        loadData();
      } catch (err) {
        setError(err.message || 'Failed to delete assignment');
      }
    }
  };

  // Handle back
  const handleBack = () => {
    navigate(`/student-charges/${chargeId}`);
  };

  if (loading) {
    return (
      <div className="page student-charge-assignment-list-page">
        <header className="page-header">
          <h1>Charge Assignments</h1>
          <p>Loading assignments...</p>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page student-charge-assignment-list-page">
        <header className="page-header">
          <h1>Charge Assignments</h1>
        </header>
        <Card className="message-card message-error">
          {error}
          <div className="error-actions">
            <Button onClick={handleBack} variant="outline">
              Back to Charge
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page student-charge-assignment-list-page">
      <header className="page-header">
        <h1>Charge Assignments</h1>
        <p>Assignments for charge #{chargeId}</p>
      </header>

      {/* Message display */}
      {message && (
        <Card className="message-card message-success">
          {message}
        </Card>
      )}

      {/* Action bar */}
      <Card className="action-bar">
        <div className="action-bar-content">
          <Button
            variant="primary"
            onClick={handleCreate}
            className="action-button"
          >
            + Create Assignment
          </Button>
          <Button
            variant="outline"
            onClick={handleBack}
            className="action-button"
          >
            Back to Charge
          </Button>
        </div>
      </Card>

      {/* Assignments table */}
      <Card className="data-table-card">
        <StudentChargeAssignmentTable
          assignments={assignments}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          loading={loading}
        />
      </Card>
    </div>
  );
}

export default StudentChargeAssignmentListPage;

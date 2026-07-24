import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, StudentChargeCard } from '../../components/index.js';
import { getStudentChargeById, deleteStudentCharge } from '../../services/studentChargeService.js';

/**
 * StudentChargeDetailPage Component
 * Page for viewing student charge details
 */
function StudentChargeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [charge, setCharge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

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

  // Check for navigation state message
  useEffect(() => {
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  // Handle edit
  const handleEdit = () => {
    navigate(`/student-charges/edit/${id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete student charge #${id}? This will also delete all assignments for this charge.`)) {
      try {
        await deleteStudentCharge(id);
        setMessage('Student charge deleted successfully!');
        setTimeout(() => navigate('/student-charges'), 2000);
      } catch (err) {
        setError(err.message || 'Failed to delete student charge');
      }
    }
  };

  // Handle back
  const handleBack = () => {
    navigate('/student-charges');
  };

  // Handle view assignments
  const handleViewAssignments = () => {
    navigate(`/student-charges/${id}/assignments`);
  };

  if (loading) {
    return (
      <div className="page student-charge-detail-page">
        <header className="page-header">
          <h1>Student Charge Details</h1>
          <p>Loading charge data...</p>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page student-charge-detail-page">
        <header className="page-header">
          <h1>Student Charge Details</h1>
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
    <div className="page student-charge-detail-page">
      <header className="page-header">
        <h1>Student Charge Details</h1>
        <p>View student charge #{id}</p>
      </header>

      {/* Message display */}
      {message && (
        <Card className="message-card message-success">
          {message}
        </Card>
      )}

      {/* Charge card */}
      <StudentChargeCard
        charge={charge}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Assignment button */}
      {charge && (
        <Card className="action-bar">
          <Button
            variant="primary"
            onClick={handleViewAssignments}
            className="action-button"
          >
            View Assignments ({charge.assigned_student_count || 0})
          </Button>
          <Button
            variant="outline"
            onClick={handleBack}
            className="action-button"
          >
            Back to List
          </Button>
        </Card>
      )}
    </div>
  );
}

export default StudentChargeDetailPage;

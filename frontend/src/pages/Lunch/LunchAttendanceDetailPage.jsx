import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, LunchAttendanceCard } from '../../components/index.js';
import { getLunchAttendanceById, deleteLunchAttendance } from '../../services/lunchService.js';

/**
 * LunchAttendanceDetailPage Component
 * Page for viewing lunch attendance details
 */
function LunchAttendanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Load lunch attendance data
  useEffect(() => {
    const loadAttendance = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getLunchAttendanceById(id);
        setAttendance(result.data || result);
      } catch (err) {
        setError(err.message || 'Failed to load lunch attendance record');
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, [id]);

  // Check for navigation state message
  useEffect(() => {
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  // Handle edit
  const handleEdit = () => {
    navigate(`/lunch/attendance/edit/${id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete lunch attendance record #${id}?`)) {
      try {
        await deleteLunchAttendance(id);
        setMessage('Lunch attendance record deleted successfully!');
        setTimeout(() => navigate('/lunch/attendance'), 2000);
      } catch (err) {
        setError(err.message || 'Failed to delete lunch attendance record');
      }
    }
  };

  // Handle back
  const handleBack = () => {
    navigate('/lunch/attendance');
  };

  if (loading) {
    return (
      <div className="page lunch-attendance-detail-page">
        <header className="page-header">
          <h1>Lunch Attendance Details</h1>
          <p>Loading attendance data...</p>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page lunch-attendance-detail-page">
        <header className="page-header">
          <h1>Lunch Attendance Details</h1>
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
    <div className="page lunch-attendance-detail-page">
      <header className="page-header">
        <h1>Lunch Attendance Details</h1>
        <p>View lunch attendance record #{id}</p>
      </header>

      {/* Message display */}
      {message && (
        <Card className="message-card message-success">
          {message}
        </Card>
      )}

      {/* Attendance card */}
      <LunchAttendanceCard
        attendance={attendance}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Back button */}
      <Card className="action-bar">
        <Button variant="outline" onClick={handleBack}>
          Back to List
        </Button>
      </Card>
    </div>
  );
}

export default LunchAttendanceDetailPage;

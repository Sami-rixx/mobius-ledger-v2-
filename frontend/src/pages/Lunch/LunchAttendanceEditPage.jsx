import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LunchAttendanceForm } from '../../components/index.js';
import { getLunchAttendanceById, updateLunchAttendance } from '../../services/lunchService.js';

/**
 * LunchAttendanceEditPage Component
 * Page for editing an existing lunch attendance record
 */
function LunchAttendanceEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Handle form submission
  const handleSubmit = useCallback(async (formData) => {
    setFormLoading(true);
    setError(null);

    try {
      await updateLunchAttendance(id, formData);
      navigate('/lunch/attendance', { state: { message: 'Lunch attendance record updated successfully!' } });
    } catch (err) {
      setError(err.message || 'Failed to update lunch attendance record');
    } finally {
      setFormLoading(false);
    }
  }, [id, navigate]);

  // Handle cancel
  const handleCancel = () => {
    navigate('/lunch/attendance');
  };

  if (loading) {
    return (
      <div className="page lunch-attendance-edit-page">
        <header className="page-header">
          <h1>Edit Lunch Attendance</h1>
          <p>Loading attendance data...</p>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page lunch-attendance-edit-page">
        <header className="page-header">
          <h1>Edit Lunch Attendance</h1>
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
    <div className="page lunch-attendance-edit-page">
      <header className="page-header">
        <h1>Edit Lunch Attendance</h1>
        <p>Update lunch attendance record #{id}</p>
      </header>

      {/* Lunch attendance form */}
      <LunchAttendanceForm
        attendance={attendance}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={formLoading}
      />
    </div>
  );
}

export default LunchAttendanceEditPage;

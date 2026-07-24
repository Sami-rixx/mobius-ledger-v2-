import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LunchAttendanceForm } from '../../components/index.js';
import { createLunchAttendance } from '../../services/lunchService.js';

/**
 * LunchAttendanceCreatePage Component
 * Page for creating a new lunch attendance record
 */
function LunchAttendanceCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = useCallback(async (formData) => {
    setLoading(true);
    setError(null);

    try {
      await createLunchAttendance(formData);
      navigate('/lunch/attendance', { state: { message: 'Lunch attendance record created successfully!' } });
    } catch (err) {
      setError(err.message || 'Failed to create lunch attendance record');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Handle cancel
  const handleCancel = () => {
    navigate('/lunch/attendance');
  };

  return (
    <div className="page lunch-attendance-create-page">
      <header className="page-header">
        <h1>Create Lunch Attendance</h1>
        <p>Record a new lunch attendance</p>
      </header>

      {/* Error display */}
      {error && (
        <div className="message-card message-error">
          {error}
        </div>
      )}

      {/* Lunch attendance form */}
      <LunchAttendanceForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}

export default LunchAttendanceCreatePage;

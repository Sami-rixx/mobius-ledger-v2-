import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert, UserSessionForm, Spinner } from '../../../components/index.js';
import { getSessionById, updateSession } from '../../../services/index.js';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * UserSessionEditPage Component
 * Page for editing an existing user session
 */
function UserSessionEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load session data
  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getSessionById(parseInt(id));
      
      if (result.success) {
        setSession(result.data);
      } else {
        setError(result.error || 'Session not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load session');
      console.error('Error loading session:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Handle form submit
  const handleSubmit = useCallback(async (formData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateSession(parseInt(id), formData);
      
      if (result.success) {
        setSuccess('User session updated successfully!');
        
        // Reload the session data and navigate to detail page after a short delay
        setTimeout(() => {
          navigate(`/user-sessions/${id}`);
        }, 1000);
      } else {
        setError(result.error || 'Failed to update user session');
      }
    } catch (err) {
      setError(err.message || 'Failed to update user session');
      console.error('Error updating user session:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [id, navigate]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate(`/user-sessions/${id}`);
  }, [id, navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="page user-session-edit-page">
        <header className="page-header">
          <h1>Edit User Session</h1>
          <p>Loading session data...</p>
        </header>
        <main className="page-content">
          <Spinner />
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page user-session-edit-page">
        <header className="page-header">
          <h1>Edit User Session</h1>
        </header>
        <main className="page-content">
          <Alert type="error" onClose={() => navigate('/user-sessions')}>
            {error}
          </Alert>
          <Button variant="outline" onClick={() => navigate('/user-sessions')}>
            Back to Sessions
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="page user-session-edit-page">
      <header className="page-header">
        <h1>Edit User Session #{session?.id}</h1>
        <p>Update session information</p>
      </header>

      <main className="page-content">
        {/* Success Message */}
        {success && (
          <Alert type="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Form */}
        {session && (
          <UserSessionForm
            session={session}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="submitting-overlay">
            <Spinner />
            <p>Updating session...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default UserSessionEditPage;

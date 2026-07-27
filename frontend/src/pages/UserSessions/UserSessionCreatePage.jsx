import React, { useState, useCallback } from 'react';
import { Card, Button, Alert, UserSessionForm, Spinner } from '@/components';
import { createSession } from '@/services';
import { useNavigate } from 'react-router-dom';

/**
 * UserSessionCreatePage Component
 * Page for creating a new user session
 */
function UserSessionCreatePage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submit
  const handleSubmit = useCallback(async (formData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createSession(formData);
      
      if (result.success) {
        setSuccess('User session created successfully!');
        
        // Navigate to the detail page after a short delay
        setTimeout(() => {
          navigate(`/user-sessions/${result.data.id}`);
        }, 1000);
      } else {
        setError(result.error || 'Failed to create user session');
      }
    } catch (err) {
      setError(err.message || 'Failed to create user session');
      console.error('Error creating user session:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [navigate]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    navigate('/user-sessions');
  }, [navigate]);

  return (
    <div className="page user-session-create-page">
      <header className="page-header">
        <h1>Create New User Session</h1>
        <p>Create a new authentication session for a user</p>
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
        <UserSessionForm
          session={null}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="submitting-overlay">
            <Spinner />
            <p>Creating session...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default UserSessionCreatePage;

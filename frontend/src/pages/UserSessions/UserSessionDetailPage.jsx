import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert, Spinner, UserSessionCard } from '@/components';
import { getSessionById, deactivateSession } from '@/services';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * UserSessionDetailPage Component
 * Page for viewing user session details with edit and delete options
 */
function UserSessionDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

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

  // Handle deactivate
  const handleDeactivate = useCallback(async () => {
    if (!window.confirm(`Are you sure you want to deactivate session #${id}?`)) {
      return;
    }

    setIsDeactivating(true);
    try {
      const result = await deactivateSession(parseInt(id));
      
      if (result.success) {
        setSuccess('Session deactivated successfully');
        // Reload the session to show updated status
        await loadSession();
      } else {
        setError(result.error || 'Failed to deactivate session');
      }
    } catch (err) {
      setError(err.message || 'Failed to deactivate session');
      console.error('Error deactivating session:', err);
    } finally {
      setIsDeactivating(false);
    }
  }, [id, loadSession]);

  // NOTE: sessions can no longer be extended, edited or individually
  // deleted — the server-side API only supports revocation (deactivate).

  // Handle back
  const handleBack = useCallback(() => {
    navigate('/user-sessions');
  }, [navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="page user-session-detail-page">
        <header className="page-header">
          <h1>Session Details</h1>
          <p>Loading session information...</p>
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
      <div className="page user-session-detail-page">
        <header className="page-header">
          <h1>Session Details</h1>
        </header>
        <main className="page-content">
          <Alert type="error" onClose={() => navigate('/user-sessions')}>
            {error}
          </Alert>
          <Button variant="outline" onClick={handleBack}>
            Back to Sessions
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="page user-session-detail-page">
      <header className="page-header">
        <h1>Session Details</h1>
        <p>View and manage session #<strong>{session?.id}</strong></p>
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

        {/* Session Card */}
        {session && (
          <UserSessionCard
            session={session}
            showActions={false}
          />
        )}

        {/* Actions Card */}
        <Card title="Actions" className="actions-card">
          <div className="detail-actions">
            <Button variant="outline" onClick={handleBack}>
              Back to List
            </Button>

            {session?.is_active === 1 && (
              <Button 
                variant="warning" 
                onClick={handleDeactivate} 
                disabled={isDeactivating}
              >
                {isDeactivating ? 'Deactivating...' : 'Deactivate Session'}
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}

export default UserSessionDetailPage;

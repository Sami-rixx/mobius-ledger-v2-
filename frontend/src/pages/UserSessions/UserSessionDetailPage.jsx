import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert, Spinner, UserSessionCard } from '@/components';
import { getSessionById, deactivateSession, deleteSession, extendSession } from '@/services';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
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

  // Handle extend
  const handleExtend = useCallback(async () => {
    setIsExtending(true);
    try {
      const result = await extendSession(parseInt(id), 24);
      
      if (result.success) {
        setSuccess('Session extended by 24 hours');
        // Reload the session to show updated expiration
        await loadSession();
      } else {
        setError(result.error || 'Failed to extend session');
      }
    } catch (err) {
      setError(err.message || 'Failed to extend session');
      console.error('Error extending session:', err);
    } finally {
      setIsExtending(false);
    }
  }, [id, loadSession]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!window.confirm(`Are you sure you want to delete session #${id}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteSession(parseInt(id));
      
      if (result.success) {
        setSuccess('Session deleted successfully');
        // Navigate back to list after a short delay
        setTimeout(() => {
          navigate('/user-sessions');
        }, 1000);
      } else {
        setError(result.error || 'Failed to delete session');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete session');
      console.error('Error deleting session:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [id, navigate]);

  // Handle edit
  const handleEdit = useCallback(() => {
    navigate(`/user-sessions/edit/${id}`);
  }, [id, navigate]);

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
            
            <Button variant="primary" onClick={handleEdit}>
              Edit Session
            </Button>
            
            {session?.is_active === 1 && (
              <>
                <Button 
                  variant="primary" 
                  onClick={handleExtend} 
                  disabled={isExtending}
                >
                  {isExtending ? 'Extending...' : 'Extend by 24 Hours'}
                </Button>
                
                <Button 
                  variant="warning" 
                  onClick={handleDeactivate} 
                  disabled={isDeactivating}
                >
                  {isDeactivating ? 'Deactivating...' : 'Deactivate Session'}
                </Button>
              </>
            )}
            
            <Button 
              variant="danger" 
              onClick={handleDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Session'}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default UserSessionDetailPage;

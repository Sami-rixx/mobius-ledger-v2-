import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, AuditTrailCard, LoadingSpinner } from '../../../components/index.js';
import { getAuditTrailById, getAuditTrailsByRecord, deleteAuditTrail, getAuditActionLabel } from '../../../services/index.js';

/**
 * AuditTrailDetailPage Component
 * Displays detailed information for a single audit trail entry
 */
function AuditTrailDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auditTrail, setAuditTrail] = useState(null);
  const [relatedAuditTrails, setRelatedAuditTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load audit trail details
  const loadAuditTrail = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAuditTrailById(parseInt(id));
      
      if (result.success && result.data) {
        setAuditTrail(result.data);
        
        // Load related audit trails for the same record
        if (result.data.table_name && result.data.record_id) {
          const relatedResult = await getAuditTrailsByRecord(
            result.data.table_name,
            result.data.record_id
          );
          if (relatedResult.success && relatedResult.data) {
            // Filter out the current entry
            setRelatedAuditTrails(
              relatedResult.data.filter(at => at.id !== result.data.id) || []
            );
          }
        }
      } else {
        setError('Audit trail entry not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load audit trail details');
      console.error('Error loading audit trail:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    loadAuditTrail();
  }, [loadAuditTrail]);

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this audit trail entry? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAuditTrail(auditTrail.id);
      navigate('/audit-trail');
    } catch (err) {
      setError(err.message || 'Failed to delete audit trail entry');
    } finally {
      setDeleting(false);
    }
  };

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate('/audit-trail');
  }, [navigate]);

  // Get action description
  const getActionDescription = (action, tableName, recordId) => {
    const actionLabel = getAuditActionLabel(action);
    return `${actionLabel} operation on ${tableName} record #${recordId}`;
  };

  if (loading) {
    return (
      <div className="page audit-trail-detail-page">
        <LoadingSpinner message="Loading audit trail details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page audit-trail-detail-page">
        <Card className="error-card" variant="danger">
          <h2>Error</h2>
          <p>{error}</p>
          <Button onClick={loadAuditTrail} size="sm">
            Retry
          </Button>
          <Button onClick={() => navigate('/audit-trail')} size="sm" variant="outline">
            Back to List
          </Button>
        </Card>
      </div>
    );
  }

  if (!auditTrail) {
    return (
      <div className="page audit-trail-detail-page">
        <Card className="not-found-card">
          <h2>Audit Trail Entry Not Found</h2>
          <p>The requested audit trail entry does not exist.</p>
          <Button onClick={() => navigate('/audit-trail')} size="sm">
            Back to List
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page audit-trail-detail-page">
      <div className="page-header">
        <div className="page-title">
          <Link to="/audit-trail" className="back-link">
            &larr; Back to Audit Trail
          </Link>
          <h1>Audit Trail Entry #{auditTrail.id}</h1>
          <p className="page-subtitle">
            {getActionDescription(auditTrail.action, auditTrail.table_name, auditTrail.record_id)}
          </p>
        </div>
        <div className="page-actions">
          <Button onClick={handleBack} variant="outline">
            Back
          </Button>
          <Button onClick={loadAuditTrail} disabled={loading || deleting} variant="outline">
            Refresh
          </Button>
          <Button onClick={handleDelete} disabled={deleting} variant="danger">
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Main Audit Trail Card */}
      <div className="detail-main">
        <AuditTrailCard
          auditTrail={auditTrail}
          showDetails={true}
          compact={false}
        />
      </div>

      {/* Related Audit Trails */}
      {relatedAuditTrails.length > 0 && (
        <div className="related-audit-trails">
          <Card className="related-card">
            <h3>Related Audit Trails for {auditTrail.table_name} Record #{auditTrail.record_id}</h3>
            <div className="related-list">
              {relatedAuditTrails.map(related => (
                <AuditTrailCard
                  key={related.id}
                  auditTrail={related}
                  compact={true}
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Summary Section */}
      <div className="detail-summary">
        <Card className="summary-card">
          <h3>Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Action:</span>
              <span className="summary-value">{getAuditActionLabel(auditTrail.action)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Table:</span>
              <span className="summary-value">{auditTrail.table_name}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Record ID:</span>
              <span className="summary-value">#{auditTrail.record_id}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">User:</span>
              <span className="summary-value">
                {auditTrail.user_id ? `User #${auditTrail.user_id}` : 'System'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">IP Address:</span>
              <span className="summary-value">{auditTrail.ip_address || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Timestamp:</span>
              <span className="summary-value">
                {new Date(auditTrail.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AuditTrailDetailPage;

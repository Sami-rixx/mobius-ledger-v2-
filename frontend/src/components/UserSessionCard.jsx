import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Badge } from './index.js';

/**
 * UserSessionCard Component
 * Displays user session information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.session - Session data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onDeactivate - Deactivate handler
 * @param {Function} props.onExtend - Extend handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 */
function UserSessionCard({
  session,
  showActions = true,
  onDeactivate,
  onExtend,
  onDelete,
  onView
}) {
  if (!session) {
    return null;
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Calculate time until expiration
  const getTimeUntilExpiration = (expiresAt) => {
    if (!expiresAt) return null;
    
    const expires = new Date(expiresAt);
    const now = new Date();
    const diff = expires - now;
    
    if (diff <= 0) {
      return 'Expired';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  // Truncate long text
  const truncate = (text, maxLength = 50) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  // Get status badge
  const getStatusBadge = () => {
    if (session.is_active === 1) {
      const timeLeft = getTimeUntilExpiration(session.expires_at);
      if (timeLeft === 'Expired') {
        return <Badge type="warning">Expired</Badge>;
      }
      return <Badge type="success">Active ({timeLeft})</Badge>;
    }
    return <Badge type="danger">Inactive</Badge>;
  };

  return (
    <Card
      title={`Session #${session.id}`}
      subtitle={`User #${session.user_id} - ${truncate(session.ip_address)}`}
      className="user-session-card"
    >
      <div className="user-session-info">
        <div className="session-detail">
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className="detail-value">{getStatusBadge()}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Token:</span>
            <span className="detail-value token-value">{truncate(session.session_token, 30)}</span>
          </div>

          {session.ip_address && (
            <div className="detail-row">
              <span className="detail-label">IP Address:</span>
              <span className="detail-value">{session.ip_address}</span>
            </div>
          )}

          {session.user_agent && (
            <div className="detail-row">
              <span className="detail-label">User Agent:</span>
              <span className="detail-value user-agent">{truncate(session.user_agent, 60)}</span>
            </div>
          )}

          <div className="detail-row">
            <span className="detail-label">Created:</span>
            <span className="detail-value">{formatDate(session.created_at)}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Expires:</span>
            <span className="detail-value">{formatDate(session.expires_at)}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Last Updated:</span>
            <span className="detail-value">{formatDate(session.updated_at)}</span>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="session-actions">
          {onView && (
            <Button size="small" variant="info" onClick={() => onView(session)}>
              View
            </Button>
          )}
          
          {session.is_active === 1 && onExtend && (
            <Button size="small" variant="primary" onClick={() => onExtend(session)}>
              Extend
            </Button>
          )}
          
          {session.is_active === 1 && onDeactivate && (
            <Button size="small" variant="warning" onClick={() => onDeactivate(session)}>
              Deactivate
            </Button>
          )}
          
          {onDelete && (
            <Button size="small" variant="danger" onClick={() => onDelete(session)}>
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

UserSessionCard.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.number,
    user_id: PropTypes.number,
    session_token: PropTypes.string,
    ip_address: PropTypes.string,
    user_agent: PropTypes.string,
    expires_at: PropTypes.string,
    is_active: PropTypes.number,
    created_at: PropTypes.string,
    updated_at: PropTypes.string
  }),
  showActions: PropTypes.bool,
  onDeactivate: PropTypes.func,
  onExtend: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func
};

export default UserSessionCard;

import React from 'react';
import PropTypes from 'prop-types';
import { Card, Badge } from './index.js';
import { getAuditActionLabel, getAuditActionColor, formatAuditTrail } from '../services/auditTrailService.js';

/**
 * AuditTrailCard Component
 * Displays audit trail entry information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.auditTrail - Audit trail entry data
 * @param {boolean} props.showDetails - Whether to show full details
 * @param {boolean} props.compact - Whether to use compact layout
 */
function AuditTrailCard({ auditTrail, showDetails = true, compact = false }) {
  if (!auditTrail) {
    return null;
  }

  // Format the audit trail data
  const formatted = formatAuditTrail(auditTrail);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Get user display
  const getUserDisplay = () => {
    if (formatted.user_id) {
      return `User #${formatted.user_id}`;
    }
    if (formatted.ipAddress) {
      return formatted.ipAddress;
    }
    return 'System';
  };

  if (compact) {
    return (
      <Card className="audit-trail-card compact" noPadding>
        <div className="audit-trail-compact">
          <div className="compact-header">
            <Badge type={getAuditActionColor(formatted.action)}>
              {getAuditActionLabel(formatted.action)}
            </Badge>
            <span className="compact-date">{formatDate(formatted.created_at)}</span>
          </div>
          <div className="compact-body">
            <strong>{formatted.table_name}</strong> - Record #{formatted.record_id}
          </div>
          <div className="compact-user">{getUserDisplay()}</div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={`${getAuditActionLabel(formatted.action)}: ${formatted.table_name}`}
      subtitle={formatDate(formatted.created_at)}
      className="audit-trail-card"
    >
      <div className="audit-trail-info">
        {/* Action Badge */}
        <div className="audit-trail-badge">
          <Badge type={getAuditActionColor(formatted.action)}>
            {getAuditActionLabel(formatted.action)}
          </Badge>
        </div>

        {/* Basic Information */}
        <div className="audit-trail-section">
          <div className="detail-row">
            <span className="detail-label">Table:</span>
            <span className="detail-value">{formatted.table_name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Record ID:</span>
            <span className="detail-value">#{formatted.record_id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">User:</span>
            <span className="detail-value">{getUserDisplay()}</span>
          </div>
          {formatted.ipAddress && (
            <div className="detail-row">
              <span className="detail-label">IP:</span>
              <span className="detail-value">{formatted.ipAddress}</span>
            </div>
          )}
        </div>

        {/* Changes Display */}
        {showDetails && (formatted.oldValues || formatted.newValues) && (
          <div className="audit-trail-section changes">
            <h4>Changes</h4>
            <div className="changes-container">
              {formatted.oldValues && (
                <div className="change-section old-values">
                  <h5>Previous Values</h5>
                  <pre className="values-json">{JSON.stringify(formatted.oldValues, null, 2)}</pre>
                </div>
              )}
              {formatted.newValues && (
                <div className="change-section new-values">
                  <h5>New Values</h5>
                  <pre className="values-json">{JSON.stringify(formatted.newValues, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

AuditTrailCard.propTypes = {
  auditTrail: PropTypes.object,
  showDetails: PropTypes.bool,
  compact: PropTypes.bool
};

export default AuditTrailCard;

import React from 'react';
import PropTypes from 'prop-types';
import Card from './Card.jsx';
import Button from './Button.jsx';
import Badge from './Badge.jsx';
import {
  getNotificationTypeLabel,
  getNotificationTypeColor,
  getNotificationPriorityLabel,
  getNotificationPriorityColor,
  formatNotification
} from '../services/notificationService.js';

/**
 * NotificationCard Component
 * Displays notification information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.notification - Notification data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onMarkAsRead - Mark as read handler
 * @param {Function} props.onDelete - Delete handler
 * @param {boolean} props.compact - Whether to use compact layout
 */
function NotificationCard({
  notification,
  showActions = true,
  onMarkAsRead,
  onDelete,
  compact = false
}) {
  if (!notification) {
    return null;
  }

  // Format the notification data
  const formatted = formatNotification(notification);

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
    return 'System';
  };

  if (compact) {
    return (
      <Card className="notification-card compact" noPadding>
        <div className="notification-compact">
          <div className="compact-header">
            <Badge type={getNotificationTypeColor(formatted.type)}>
              {getNotificationTypeLabel(formatted.type)}
            </Badge>
            <Badge type={getNotificationPriorityColor(formatted.priority)}>
              {getNotificationPriorityLabel(formatted.priority)}
            </Badge>
            <span className="compact-date">{formatDate(formatted.created_at)}</span>
          </div>
          <div className="compact-body">
            <strong>{formatted.title}</strong>
            <p>{formatted.message}</p>
          </div>
          <div className="compact-user">{getUserDisplay()}</div>
          {!formatted.isRead && (
            <div className="compact-unread-indicator" />
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={formatted.title}
      subtitle={`${getNotificationTypeLabel(formatted.type)} - ${formatDate(formatted.created_at)}`}
      className={`notification-card ${!formatted.isRead ? 'unread' : 'read'}`}
    >
      <div className="notification-info">
        {/* Type and Priority Badges */}
        <div className="notification-badges">
          <Badge type={getNotificationTypeColor(formatted.type)}>
            {getNotificationTypeLabel(formatted.type)}
          </Badge>
          <Badge type={getNotificationPriorityColor(formatted.priority)}>
            {getNotificationPriorityLabel(formatted.priority)}
          </Badge>
          {!formatted.isRead && (
            <Badge type="warning">Unread</Badge>
          )}
          {!formatted.isActive && (
            <Badge type="secondary">Inactive</Badge>
          )}
        </div>

        {/* Message */}
        <div className="notification-message">
          {formatted.message}
        </div>

        {/* Metadata */}
        <div className="notification-meta">
          <div className="meta-row">
            <span className="meta-label">User:</span>
            <span className="meta-value">{getUserDisplay()}</span>
          </div>
          {formatted.related_table && (
            <div className="meta-row">
              <span className="meta-label">Related:</span>
              <span className="meta-value">
                {formatted.related_table} #{formatted.related_id}
              </span>
            </div>
          )}
          {formatted.scheduled_at && (
            <div className="meta-row">
              <span className="meta-label">Scheduled:</span>
              <span className="meta-value">{formatDate(formatted.scheduled_at)}</span>
            </div>
          )}
          {formatted.sent_at && (
            <div className="meta-row">
              <span className="meta-label">Sent:</span>
              <span className="meta-value">{formatDate(formatted.sent_at)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="notification-actions">
            {!formatted.isRead && onMarkAsRead && (
              <Button
                size="small"
                variant="primary"
                onClick={() => onMarkAsRead(formatted.id)}
              >
                Mark as Read
              </Button>
            )}
            {onDelete && (
              <Button
                size="small"
                variant="danger"
                onClick={() => onDelete(formatted.id)}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

NotificationCard.propTypes = {
  notification: PropTypes.object,
  showActions: PropTypes.bool,
  onMarkAsRead: PropTypes.func,
  onDelete: PropTypes.func,
  compact: PropTypes.bool
};

export default NotificationCard;

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import NotificationCard from './NotificationCard.jsx';
import Pagination from './Pagination.jsx';
import Spinner from './Spinner.jsx';
import Alert from './Alert.jsx';
import { getNotifications } from '../services/notificationService.js';

/**
 * NotificationList Component
 * Displays a paginated list of notifications
 * 
 * @param {Object} props - Component props
 * @param {number} props.userId - Filter by user ID (optional)
 * @param {string} props.type - Filter by notification type (optional)
 * @param {string} props.priority - Filter by priority (optional)
 * @param {boolean} props.showUserNotifications - Show only user-specific notifications
 * @param {boolean} props.showSystemNotifications - Show only system notifications
 * @param {boolean} props.showUnreadOnly - Show only unread notifications
 * @param {boolean} props.compact - Use compact card layout
 * @param {Function} props.onNotificationClick - Click handler for notifications
 * @param {Function} props.onMarkAsRead - Mark as read handler
 * @param {Function} props.onDelete - Delete handler
 */
function NotificationList({
  userId,
  type,
  priority,
  showUserNotifications = false,
  showSystemNotifications = false,
  showUnreadOnly = false,
  compact = false,
  onNotificationClick,
  onMarkAsRead,
  onDelete
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });

  // Fetch notifications
  const fetchNotifications = async (page = 1, pageSize = 20) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        pageSize,
        userId: showUserNotifications ? userId : undefined,
        type,
        priority
      };

      // For system notifications, userId should be null
      if (showSystemNotifications) {
        params.userId = null;
      }

      // For unread only, filter by isRead = false
      if (showUnreadOnly) {
        params.isRead = false;
      }

      const result = await getNotifications(params);
      
      setNotifications(result.data || []);
      setPagination(result.pagination || {
        page,
        pageSize,
        total: 0,
        totalPages: 0
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch notifications');
      setNotifications([]);
      setPagination({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when filters change
  useEffect(() => {
    fetchNotifications(1, pagination.pageSize);
  }, [userId, type, priority, showUserNotifications, showSystemNotifications, showUnreadOnly]);

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchNotifications(newPage, pagination.pageSize);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    fetchNotifications(1, newPageSize);
  };

  // Refresh notifications
  const refresh = () => {
    fetchNotifications(pagination.page, pagination.pageSize);
  };

  // Handle notification click
  const handleClick = (notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  if (loading && pagination.page === 1) {
    return (
      <div className="notification-list loading">
        <Spinner />
        <p>Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notification-list error">
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="notification-list empty">
        <Alert type="info">
          No notifications found
        </Alert>
      </div>
    );
  }

  return (
    <div className="notification-list">
      <div className="notification-grid">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className="notification-item"
            onClick={() => handleClick(notification)}
          >
            <NotificationCard
              notification={notification}
              compact={compact}
              showActions={!!onMarkAsRead || !!onDelete}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="notification-pagination">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}

      <div className="notification-list-meta">
        <span>
          Showing {notifications.length} of {pagination.total} notifications
        </span>
        <button onClick={refresh} className="refresh-button">
          Refresh
        </button>
      </div>
    </div>
  );
}

NotificationList.propTypes = {
  userId: PropTypes.number,
  type: PropTypes.string,
  priority: PropTypes.string,
  showUserNotifications: PropTypes.bool,
  showSystemNotifications: PropTypes.bool,
  showUnreadOnly: PropTypes.bool,
  compact: PropTypes.bool,
  onNotificationClick: PropTypes.func,
  onMarkAsRead: PropTypes.func,
  onDelete: PropTypes.func
};

export default NotificationList;

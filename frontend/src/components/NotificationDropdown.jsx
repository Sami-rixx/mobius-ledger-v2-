import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from './Button.jsx';
import Badge from './Badge.jsx';
import NotificationCard from './NotificationCard.jsx';
import { getActiveNotificationsByUser, markAsRead, getUnreadCount } from '../services/notificationService.js';

/**
 * NotificationDropdown Component
 * A dropdown notification menu that shows recent notifications
 * 
 * @param {Object} props - Component props
 * @param {number} props.userId - User ID to fetch notifications for
 * @param {number} props.limit - Maximum number of notifications to show
 * @param {boolean} props.showBadge - Whether to show the unread badge
 * @param {string} props.badgePosition - Position of badge ('top-right', 'inline')
 */
function NotificationDropdown({
  userId,
  limit = 5,
  showBadge = true,
  badgePosition = 'top-right'
}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications and unread count
  const fetchData = async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch active notifications
      const activeResult = await getActiveNotificationsByUser(userId, limit);
      setNotifications(activeResult.data || []);

      // Fetch unread count
      const countResult = await getUnreadCount(userId);
      setUnreadCount(countResult.count || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [userId, limit]);

  // Periodic refresh (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, limit]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle mark as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      // Refresh the data
      fetchData();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    // This would need a service function - for now, just refresh
    fetchData();
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchData();
    }
  };

  // Get notification count display
  const getCountDisplay = () => {
    if (unreadCount === 0 && !showBadge) return null;
    return unreadCount > 99 ? '99+' : unreadCount;
  };

  const countDisplay = getCountDisplay();

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <Button
        variant="secondary"
        className="notification-toggle"
        onClick={toggleDropdown}
        aria-label="Toggle notifications"
        aria-expanded={isOpen}
      >
        <span className="notification-icon">🔔</span>
        {countDisplay && (
          <Badge type="danger" className="notification-dropdown-badge">
            {countDisplay}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="notification-dropdown-menu">
          <div className="notification-dropdown-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button
                className="mark-all-read"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <div className="notification-dropdown-loading">
              <p>Loading...</p>
            </div>
          ) : error ? (
            <div className="notification-dropdown-error">
              <p>{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-dropdown-empty">
              <p>No new notifications</p>
            </div>
          ) : (
            <div className="notification-dropdown-list">
              {notifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  compact={true}
                  showActions={false}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                />
              ))}
            </div>
          )}

          {notifications.length > 0 && (
            <div className="notification-dropdown-footer">
              <Button
                variant="text"
                size="small"
                className="view-all-button"
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

NotificationDropdown.propTypes = {
  userId: PropTypes.number,
  limit: PropTypes.number,
  showBadge: PropTypes.bool,
  badgePosition: PropTypes.oneOf(['top-right', 'inline'])
};

export default NotificationDropdown;

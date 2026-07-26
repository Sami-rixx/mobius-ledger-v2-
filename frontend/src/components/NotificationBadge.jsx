import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Badge from './Badge.jsx';
import { getUnreadCount } from '../services/notificationService.js';

/**
 * NotificationBadge Component
 * Displays a badge with the unread notification count for a user
 * 
 * @param {Object} props - Component props
 * @param {number} props.userId - User ID to check for unread notifications
 * @param {boolean} props.showZero - Whether to show badge when count is 0
 * @param {string} props.className - Additional CSS class name
 * @param {Function} props.onCountChange - Callback when count changes
 */
function NotificationBadge({
  userId,
  showZero = false,
  className = '',
  onCountChange
}) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!userId) {
      setCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await getUnreadCount(userId);
      const unreadCount = result.count || 0;
      
      setCount(unreadCount);
      
      if (onCountChange) {
        onCountChange(unreadCount);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch unread count');
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [userId]);

  // Periodic refresh (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  // Manually refresh
  const refresh = () => {
    fetchUnreadCount();
  };

  if (loading) {
    return (
      <Badge type="secondary" className={`notification-badge ${className}`}>
        ...
      </Badge>
    );
  }

  if (error) {
    console.error('NotificationBadge error:', error);
    return (
      <Badge type="danger" className={`notification-badge ${className}`}>
        !
      </Badge>
    );
  }

  if (count === 0 && !showZero) {
    return null;
  }

  return (
    <Badge
      type="primary"
      className={`notification-badge ${className} ${count > 0 ? 'has-notifications' : ''}`}
      onClick={refresh}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
}

NotificationBadge.propTypes = {
  userId: PropTypes.number,
  showZero: PropTypes.bool,
  className: PropTypes.string,
  onCountChange: PropTypes.func
};

export default NotificationBadge;

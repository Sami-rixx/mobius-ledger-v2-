import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, NotificationList, Alert, LoadingSpinner } from '../../../components/index.js';
import { getNotifications, deleteNotification, markAsRead, getNotificationStatistics } from '../../../services/index.js';
import { useNavigate } from 'react-router-dom';

/**
 * NotificationListPage Component
 * Displays a paginated list of notifications with filtering and management capabilities
 */
function NotificationListPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Load notifications
  const loadNotifications = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        pageSize: 20,
        ...filters
      };
      
      // Remove undefined/empty values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });
      
      const result = await getNotifications(params);
      setNotifications(result.data || []);
      setPagination(result.pagination || null);
      
      // Load statistics
      const statsResult = await getNotificationStatistics();
      setStatistics(statsResult.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    loadNotifications(1);
  }, [loadNotifications]);

  // Apply filters with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(filters).some(key => filters[key] !== undefined && filters[key] !== '')) {
        loadNotifications(1);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filters, loadNotifications]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    loadNotifications(page);
  }, [loadNotifications]);

  // Handle mark as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setActionMessage('Notification marked as read');
      // Refresh the list
      loadNotifications(pagination?.page || 1);
      // Clear message after 3 seconds
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to mark notification as read');
    }
  };

  // Handle delete
  const handleDelete = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteNotification(notificationId);
      setActionMessage('Notification deleted successfully');
      // Reload the list
      loadNotifications(pagination?.page || 1);
      // Clear message after 3 seconds
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete notification');
    } finally {
      setDeleting(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({});
    loadNotifications(1);
  };

  // Navigate to create page
  const handleCreate = () => {
    navigate('/notifications/create');
  };

  // Navigate to detail page
  const handleNotificationClick = (notification) => {
    navigate(`/notifications/${notification.id}`);
  };

  if (loading && !notifications.length) {
    return <LoadingSpinner message="Loading notifications..." />;
  }

  return (
    <div className="page notification-list-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Notifications</h1>
          <p>Manage system and user notifications</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" onClick={handleCreate}>
            Create Notification
          </Button>
        </div>
      </div>

      {actionMessage && (
        <Alert
          type="success"
          message={actionMessage}
          duration={3000}
        />
      )}

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Filters */}
      <Card className="filter-card">
        <h3>Filters</h3>
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="type">Type:</label>
            <select
              id="type"
              name="type"
              value={filters.type || ''}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              <option value="INFO">Information</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="SUCCESS">Success</option>
              <option value="REMINDER">Reminder</option>
              <option value="ALERT">Alert</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="priority">Priority:</label>
            <select
              id="priority"
              name="priority"
              value={filters.priority || ''}
              onChange={handleFilterChange}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="isRead">Status:</label>
            <select
              id="isRead"
              name="isRead"
              value={filters.isRead || ''}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value={false}>Unread</option>
              <option value={true}>Read</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="isActive">Active:</label>
            <select
              id="isActive"
              name="isActive"
              value={filters.isActive || ''}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value={true}>Active</option>
              <option value={false}>Inactive</option>
            </select>
          </div>
          
          <Button variant="secondary" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </div>
      </Card>

      {/* Statistics */}
      {statistics && (
        <Card className="statistics-card">
          <h3>Statistics</h3>
          <div className="notification-stats">
            <div className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{statistics.total || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Unread:</span>
              <span className="stat-value">{statistics.unread || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Read:</span>
              <span className="stat-value">{statistics.read || 0}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Notification List */}
      <NotificationList
        userId={null}
        type={filters.type}
        priority={filters.priority}
        isRead={filters.isRead}
        isActive={filters.isActive}
        compact={false}
        onNotificationClick={handleNotificationClick}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
      />

      {/* Pagination is handled inside NotificationList */}
    </div>
  );
}

export default NotificationListPage;

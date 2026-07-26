import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, LoadingSpinner, NotificationCard } from '../../../components/index.js';
import { getNotificationById, deleteNotification, markAsRead, updateNotification } from '../../../services/index.js';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * NotificationDetailPage Component
 * Displays detailed information about a single notification
 */
function NotificationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Load notification
  useEffect(() => {
    const loadNotification = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getNotificationById(parseInt(id, 10));
        
        if (result.success) {
          setNotification(result.data);
          setEditData(result.data);
        } else {
          setError(result.error || 'Failed to load notification');
        }
      } catch (err) {
        setError(err.message || 'Failed to load notification');
        console.error('Error loading notification:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNotification();
  }, [id]);

  // Handle mark as read
  const handleMarkAsRead = async () => {
    if (!notification) return;

    try {
      await markAsRead(notification.id);
      setActionMessage('Notification marked as read');
      // Refresh the notification
      const result = await getNotificationById(notification.id);
      setNotification(result.data);
      setEditData(result.data);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to mark notification as read');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!notification || !window.confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteNotification(notification.id);
      setActionMessage('Notification deleted successfully');
      setTimeout(() => {
        navigate('/notifications');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to delete notification');
    }
  };

  // Handle edit
  const handleEdit = () => {
    setEditing(true);
    setError(null);
  };

  // Handle edit field change
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle save
  const handleSave = async () => {
    if (!editData || !editData.id) return;

    try {
      const result = await updateNotification(editData.id, editData);
      
      if (result.success) {
        setNotification(result.data);
        setEditing(false);
        setActionMessage('Notification updated successfully');
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        setError(result.error || 'Failed to update notification');
      }
    } catch (err) {
      setError(err.message || 'Failed to update notification');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditing(false);
    setEditData(notification);
  };

  // Handle back
  const handleBack = () => {
    navigate('/notifications');
  };

  if (loading) {
    return <LoadingSpinner message="Loading notification details..." />;
  }

  if (error) {
    return (
      <div className="page notification-detail-page">
        <Alert
          type="error"
          message={error}
          onClose={() => navigate('/notifications')}
        />
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="page notification-detail-page">
        <Alert
          type="error"
          message="Notification not found"
        />
        <Button variant="primary" onClick={handleBack}>
          Back to Notifications
        </Button>
      </div>
    );
  }

  return (
    <div className="page notification-detail-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Notification Details</h1>
          <p>View and manage notification #{notification.id}</p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" onClick={handleBack}>
            Back to List
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

      {editing ? (
        // Edit Mode
        <Card className="notification-edit-card">
          <h3>Edit Notification</h3>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="notification-edit-form">
            <div className="form-group">
              <label htmlFor="editTitle">Title</label>
              <input
                type="text"
                id="editTitle"
                name="title"
                value={editData.title || ''}
                onChange={handleEditChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="editMessage">Message</label>
              <textarea
                id="editMessage"
                name="message"
                value={editData.message || ''}
                onChange={handleEditChange}
                className="form-textarea"
                rows={5}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="editType">Type</label>
                <select
                  id="editType"
                  name="type"
                  value={editData.type || 'INFO'}
                  onChange={handleEditChange}
                  className="form-select"
                >
                  <option value="INFO">Information</option>
                  <option value="WARNING">Warning</option>
                  <option value="ERROR">Error</option>
                  <option value="SUCCESS">Success</option>
                  <option value="REMINDER">Reminder</option>
                  <option value="ALERT">Alert</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="editPriority">Priority</label>
                <select
                  id="editPriority"
                  name="priority"
                  value={editData.priority || 'MEDIUM'}
                  onChange={handleEditChange}
                  className="form-select"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isRead"
                    checked={!!editData.is_read}
                    onChange={handleEditChange}
                  />
                  <span>Mark as Read</span>
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={!!editData.is_active}
                    onChange={handleEditChange}
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <Button type="button" variant="primary" onClick={handleSave}>
                Save Changes
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        // View Mode
        <>
          {/* Notification Card */}
          <NotificationCard
            notification={notification}
            showActions={false}
            compact={false}
          />

          {/* Additional Details Card */}
          <Card className="notification-details-card">
            <h3>Details</h3>
            <div className="notification-details">
              <div className="detail-row">
                <span className="detail-label">Notification ID:</span>
                <span className="detail-value">#{notification.id}</span>
              </div>
              
              {notification.user_id !== null && notification.user_id !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">Recipient:</span>
                  <span className="detail-value">User #{notification.user_id}</span>
                </div>
              )}
              
              {notification.related_table && (
                <div className="detail-row">
                  <span className="detail-label">Related Table:</span>
                  <span className="detail-value">{notification.related_table}</span>
                </div>
              )}
              
              {notification.related_id && (
                <div className="detail-row">
                  <span className="detail-label">Related Record:</span>
                  <span className="detail-value">#{notification.related_id}</span>
                </div>
              )}
              
              <div className="detail-row">
                <span className="detail-label">Created:</span>
                <span className="detail-value">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>
              
              {notification.sent_at && (
                <div className="detail-row">
                  <span className="detail-label">Sent:</span>
                  <span className="detail-value">
                    {new Date(notification.sent_at).toLocaleString()}
                  </span>
                </div>
              )}
              
              {notification.scheduled_at && (
                <div className="detail-row">
                  <span className="detail-label">Scheduled:</span>
                  <span className="detail-value">
                    {new Date(notification.scheduled_at).toLocaleString()}
                  </span>
                </div>
              )}
              
              <div className="detail-row">
                <span className="detail-label">Read Status:</span>
                <span className="detail-value">
                  {notification.is_read ? 'Read' : 'Unread'}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Active Status:</span>
                <span className="detail-value">
                  {notification.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <Card className="notification-actions-card">
            <h3>Actions</h3>
            <div className="notification-actions">
              {!notification.is_read && (
                <Button
                  variant="primary"
                  onClick={handleMarkAsRead}
                >
                  Mark as Read
                </Button>
              )}
              
              <Button
                variant="secondary"
                onClick={handleEdit}
              >
                Edit Notification
              </Button>
              
              <Button
                variant="danger"
                onClick={handleDelete}
              >
                Delete Notification
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export default NotificationDetailPage;

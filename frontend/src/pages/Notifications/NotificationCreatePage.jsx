import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, LoadingSpinner } from '../../../components/index.js';
import { createNotification, getNotificationTypes, getNotificationPriorities, NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../../../services/index.js';
import { useNavigate } from 'react-router-dom';

/**
 * NotificationCreatePage Component
 * Form for creating a new notification
 */
function NotificationCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'INFO',
    priority: 'MEDIUM',
    userId: null,
    relatedTable: '',
    relatedId: null,
    scheduledAt: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [users, setUsers] = useState([]);

  // Load users for user-specific notifications
  useEffect(() => {
    // For now, we'll use a simple list of user IDs
    // In a real implementation, this would fetch from an API
    setUsers([
      { id: 1, username: 'Admin', full_name: 'Admin User' },
      { id: 2, username: 'User1', full_name: 'Regular User' },
      { id: 3, username: 'User2', full_name: 'Another User' }
    ]);
  }, []);

  // Handle form field change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(null);
  };

  // Handle user selection
  const handleUserChange = (e) => {
    const userId = parseInt(e.target.value, 10);
    setFormData(prev => ({
      ...prev,
      userId: isNaN(userId) ? null : userId
    }));
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!formData.message.trim()) {
      setError('Message is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Prepare notification data
      const notificationData = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
        userId: formData.userId || undefined,
        relatedTable: formData.relatedTable || undefined,
        relatedId: formData.relatedId || undefined,
        scheduledAt: formData.scheduledAt || undefined,
        isActive: formData.isActive
      };

      // Remove undefined values
      Object.keys(notificationData).forEach(key => {
        if (notificationData[key] === undefined || notificationData[key] === null || notificationData[key] === '') {
          delete notificationData[key];
        }
      });

      const result = await createNotification(notificationData);
      
      if (result.success) {
        setSuccess(true);
        // Reset form after successful creation
        setFormData({
          title: '',
          message: '',
          type: 'INFO',
          priority: 'MEDIUM',
          userId: null,
          relatedTable: '',
          relatedId: null,
          scheduledAt: '',
          isActive: true
        });
        
        // Navigate to detail page after 2 seconds
        setTimeout(() => {
          navigate(`/notifications/${result.data.id}`);
        }, 2000);
      } else {
        setError(result.error || 'Failed to create notification');
      }
    } catch (err) {
      setError(err.message || 'Failed to create notification');
      console.error('Error creating notification:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/notifications');
  };

  if (loading) {
    return <LoadingSpinner message="Creating notification..." />;
  }

  return (
    <div className="page notification-create-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Create Notification</h1>
          <p>Create a new system or user notification</p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>

      {success && (
        <Alert
          type="success"
          message="Notification created successfully!"
          duration={2000}
        />
      )}

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <Card className="notification-form-card">
        <form onSubmit={handleSubmit} className="notification-form">
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter notification title"
              required
              className="form-input"
            />
            <span className="form-hint">The title displayed in the notification</span>
          </div>

          {/* Message */}
          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Enter notification message"
              required
              className="form-textarea"
              rows={5}
            />
            <span className="form-hint">The message content of the notification</span>
          </div>

          <div className="form-row">
            {/* Type */}
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
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

            {/* Priority */}
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
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
            {/* User */}
            <div className="form-group">
              <label htmlFor="userId">Recipient (Optional)</label>
              <select
                id="userId"
                name="userId"
                value={formData.userId || ''}
                onChange={handleUserChange}
                className="form-select"
              >
                <option value="">All Users (System Notification)</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.username})
                  </option>
                ))}
              </select>
              <span className="form-hint">Select a user for user-specific notification, or leave blank for system-wide notification</span>
            </div>
          </div>

          <div className="form-row">
            {/* Related Table */}
            <div className="form-group">
              <label htmlFor="relatedTable">Related Table (Optional)</label>
              <input
                type="text"
                id="relatedTable"
                name="relatedTable"
                value={formData.relatedTable}
                onChange={handleChange}
                placeholder="e.g., students, income, expenses"
                className="form-input"
              />
              <span className="form-hint">The table this notification relates to</span>
            </div>

            {/* Related ID */}
            <div className="form-group">
              <label htmlFor="relatedId">Related ID (Optional)</label>
              <input
                type="number"
                id="relatedId"
                name="relatedId"
                value={formData.relatedId || ''}
                onChange={handleChange}
                placeholder="Record ID"
                className="form-input"
              />
              <span className="form-hint">The ID of the related record</span>
            </div>
          </div>

          <div className="form-row">
            {/* Scheduled At */}
            <div className="form-group">
              <label htmlFor="scheduledAt">Schedule (Optional)</label>
              <input
                type="datetime-local"
                id="scheduledAt"
                name="scheduledAt"
                value={formData.scheduledAt}
                onChange={handleChange}
                className="form-input"
              />
              <span className="form-hint">When the notification should be sent</span>
            </div>

            {/* Active */}
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <span>Active</span>
              </label>
              <span className="form-hint">Whether the notification is active</span>
            </div>
          </div>

          <div className="form-actions">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Notification'}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default NotificationCreatePage;

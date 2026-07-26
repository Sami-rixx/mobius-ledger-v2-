import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card } from './index.js';

/**
 * UserSessionForm Component
 * Form for creating or editing user sessions
 * 
 * @param {Object} props - Component props
 * @param {Object} props.session - Session data to edit (null for new session)
 * @param {number} props.currentUserId - Current user ID (for auto-filling)
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 */
function UserSessionForm({
  session,
  currentUserId,
  onSubmit,
  onCancel
}) {
  // Form state
  const [formData, setFormData] = useState({
    userId: currentUserId || session?.user_id || '',
    sessionToken: session?.session_token || '',
    ipAddress: session?.ip_address || '',
    userAgent: session?.user_agent || '',
    expiresAt: session?.expires_at ? new Date(session.expires_at).toISOString().slice(0, 16) : ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when session prop changes
  useEffect(() => {
    if (session) {
      setFormData({
        userId: session.user_id || '',
        sessionToken: session.session_token || '',
        ipAddress: session.ip_address || '',
        userAgent: session.user_agent || '',
        expiresAt: session.expires_at ? new Date(session.expires_at).toISOString().slice(0, 16) : ''
      });
    }
  }, [session]);

  // Validate form
  const validate = () => {
    const newErrors = {};
    
    if (!formData.userId || isNaN(parseInt(formData.userId))) {
      newErrors.userId = 'User ID is required and must be a number';
    }
    
    if (!formData.sessionToken || formData.sessionToken.trim() === '') {
      newErrors.sessionToken = 'Session token is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submitData = {
        userId: parseInt(formData.userId),
        sessionToken: formData.sessionToken.trim(),
        ipAddress: formData.ipAddress.trim() || null,
        userAgent: formData.userAgent.trim() || null,
        expiresAt: formData.expiresAt || null
      };
      
      await onSubmit(submitData);
    } catch (err) {
      // Error is handled by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate a random session token
  const generateSessionToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({
      ...prev,
      sessionToken: token
    }));
  };

  // Set expiration to 24 hours from now
  const setDefaultExpiration = () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setFormData(prev => ({
      ...prev,
      expiresAt: tomorrow.toISOString().slice(0, 16)
    }));
  };

  return (
    <Card
      title={session ? `Edit Session #${session.id}` : 'Create New Session'}
      className="user-session-form"
    >
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="userId">User ID *</label>
            <Input
              id="userId"
              name="userId"
              type="number"
              value={formData.userId}
              onChange={handleChange}
              error={errors.userId}
              disabled={!!currentUserId}
              required
            />
            {errors.userId && <span className="error-message">{errors.userId}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="sessionToken">Session Token *</label>
            <div className="input-with-button">
              <Input
                id="sessionToken"
                name="sessionToken"
                type="text"
                value={formData.sessionToken}
                onChange={handleChange}
                error={errors.sessionToken}
                required
              />
              <Button type="button" size="small" variant="secondary" onClick={generateSessionToken}>
                Generate
              </Button>
            </div>
            {errors.sessionToken && <span className="error-message">{errors.sessionToken}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="ipAddress">IP Address</label>
            <Input
              id="ipAddress"
              name="ipAddress"
              type="text"
              value={formData.ipAddress}
              onChange={handleChange}
              placeholder="e.g., 192.168.1.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="userAgent">User Agent</label>
            <Input
              id="userAgent"
              name="userAgent"
              type="text"
              value={formData.userAgent}
              onChange={handleChange}
              placeholder="e.g., Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="expiresAt">Expiration Date/Time</label>
            <div className="input-with-button">
              <Input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={handleChange}
              />
              <Button type="button" size="small" variant="secondary" onClick={setDefaultExpiration}>
                Set 24h
              </Button>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : session ? 'Update Session' : 'Create Session'}
          </Button>
          
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

UserSessionForm.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.number,
    user_id: PropTypes.number,
    session_token: PropTypes.string,
    ip_address: PropTypes.string,
    user_agent: PropTypes.string,
    expires_at: PropTypes.string
  }),
  currentUserId: PropTypes.number,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func
};

export default UserSessionForm;

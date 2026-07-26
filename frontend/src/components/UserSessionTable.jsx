import React from 'react';
import PropTypes from 'prop-types';
import { Table, Badge, Button } from './index.js';

/**
 * UserSessionTable Component
 * Displays user sessions in a table format with actions
 * 
 * @param {Object} props - Component props
 * @param {Array} props.sessions - Array of session data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onDeactivate - Deactivate handler
 * @param {Function} props.onExtend - Extend handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onView - View handler
 */
function UserSessionTable({
  sessions = [],
  showActions = true,
  onDeactivate,
  onExtend,
  onDelete,
  onView
}) {
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Truncate long text
  const truncate = (text, maxLength = 30) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  // Get status badge
  const getStatusBadge = (session) => {
    if (session.is_active === 1) {
      const expires = new Date(session.expires_at);
      const now = new Date();
      const diff = expires - now;
      
      if (diff <= 0) {
        return <Badge type="warning">Expired</Badge>;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      return <Badge type="success">Active ({hours}h)</Badge>;
    }
    return <Badge type="danger">Inactive</Badge>;
  };

  // Columns definition
  const columns = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'user_id', header: 'User ID', sortable: true },
    { key: 'status', header: 'Status', sortable: false },
    { key: 'token', header: 'Session Token', sortable: false },
    { key: 'ip_address', header: 'IP Address', sortable: true },
    { key: 'user_agent', header: 'User Agent', sortable: false },
    { key: 'created_at', header: 'Created At', sortable: true },
    { key: 'expires_at', header: 'Expires At', sortable: true },
    { key: 'actions', header: 'Actions', sortable: false }
  ];

  // Render cell based on column key
  const renderCell = (session, column) => {
    switch (column.key) {
      case 'id':
        return session.id;
      case 'user_id':
        return session.user_id;
      case 'status':
        return getStatusBadge(session);
      case 'token':
        return truncate(session.session_token, 25);
      case 'ip_address':
        return session.ip_address || 'N/A';
      case 'user_agent':
        return truncate(session.user_agent, 40);
      case 'created_at':
        return formatDate(session.created_at);
      case 'expires_at':
        return formatDate(session.expires_at);
      case 'actions':
        return showActions && (
          <div className="table-actions">
            {onView && (
              <Button size="tiny" variant="info" onClick={() => onView(session)}>
                View
              </Button>
            )}
            {session.is_active === 1 && onExtend && (
              <Button size="tiny" variant="primary" onClick={() => onExtend(session)}>
                Extend
              </Button>
            )}
            {session.is_active === 1 && onDeactivate && (
              <Button size="tiny" variant="warning" onClick={() => onDeactivate(session)}>
                Deactivate
              </Button>
            )}
            {onDelete && (
              <Button size="tiny" variant="danger" onClick={() => onDelete(session)}>
                Delete
              </Button>
            )}
          </div>
        );
      default:
        return session[column.key];
    }
  };

  return (
    <Table
      columns={columns}
      data={sessions}
      renderCell={renderCell}
      keyExtractor={(session) => session.id}
      className="user-session-table"
      emptyMessage="No user sessions found"
    />
  );
}

UserSessionTable.propTypes = {
  sessions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      user_id: PropTypes.number,
      session_token: PropTypes.string,
      ip_address: PropTypes.string,
      user_agent: PropTypes.string,
      expires_at: PropTypes.string,
      is_active: PropTypes.number,
      created_at: PropTypes.string,
      updated_at: PropTypes.string
    })
  ),
  showActions: PropTypes.bool,
  onDeactivate: PropTypes.func,
  onExtend: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func
};

export default UserSessionTable;

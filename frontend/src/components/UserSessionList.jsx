import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { UserSessionCard, Pagination, Spinner, Alert } from './index.js';
import { getSessions, deactivateSession, deleteSession, extendSession } from '../services/userSessionService.js';

/**
 * UserSessionList Component
 * Displays a list of user sessions with loading, error, and empty states
 * 
 * @param {Object} props - Component props
 * @param {number} props.userId - Filter by user ID
 * @param {boolean} props.isActive - Filter by active status
 * @param {string} props.ipAddress - Filter by IP address
 * @param {string} props.search - Search term
 * @param {number} props.pageSize - Items per page
 * @param {boolean} props.showPagination - Whether to show pagination
 * @param {Function} props.onSessionClick - Session click handler
 */
function UserSessionList({
  userId,
  isActive,
  ipAddress,
  search,
  pageSize = 10,
  showPagination = true,
  onSessionClick
}) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch sessions
  const fetchSessions = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        pageSize,
        userId,
        isActive,
        ipAddress,
        search
      };
      
      const result = await getSessions(params);
      setSessions(result.data || []);
      setPagination(result.pagination || null);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message || 'Failed to load sessions');
      setSessions([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSessions(1);
  }, [userId, isActive, ipAddress, search, pageSize]);

  // Handle page change
  const handlePageChange = (page) => {
    fetchSessions(page);
  };

  // Handle deactivate
  const handleDeactivate = async (session) => {
    try {
      await deactivateSession(session.id);
      fetchSessions(currentPage);
    } catch (err) {
      setError(err.message || 'Failed to deactivate session');
    }
  };

  // Handle extend
  const handleExtend = async (session) => {
    try {
      await extendSession(session.id, 24);
      fetchSessions(currentPage);
    } catch (err) {
      setError(err.message || 'Failed to extend session');
    }
  };

  // Handle delete
  const handleDelete = async (session) => {
    try {
      if (window.confirm(`Are you sure you want to delete session #${session.id}?`)) {
        await deleteSession(session.id);
        fetchSessions(currentPage);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete session');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="user-session-list">
        <Spinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="user-session-list">
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </div>
    );
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="user-session-list">
        <Alert type="info">
          No user sessions found
        </Alert>
      </div>
    );
  }

  return (
    <div className="user-session-list">
      <div className="session-grid">
        {sessions.map((session) => (
          <UserSessionCard
            key={session.id}
            session={session}
            showActions={true}
            onDeactivate={handleDeactivate}
            onExtend={handleExtend}
            onDelete={handleDelete}
            onView={onSessionClick}
          />
        ))}
      </div>

      {showPagination && pagination && pagination.totalPages > 1 && (
        <div className="list-pagination">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}

UserSessionList.propTypes = {
  userId: PropTypes.number,
  isActive: PropTypes.bool,
  ipAddress: PropTypes.string,
  search: PropTypes.string,
  pageSize: PropTypes.number,
  showPagination: PropTypes.bool,
  onSessionClick: PropTypes.func
};

export default UserSessionList;

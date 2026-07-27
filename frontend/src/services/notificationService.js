/**
 * Notification Service
 * API client for notification endpoints
 * 
 * Provides:
 * - CRUD operations for notifications
 * - Pagination support
 * - Filtering by type, priority, user, read status, etc.
 * - User-specific notifications
 * - System notifications
 * - Statistics
 * - Mark as read/unread
 */

import { api } from './api.js';

// Base URL for notification endpoints
const BASE_URL = '/api/notifications';

// Notification types
export const NOTIFICATION_TYPES = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
  REMINDER: 'REMINDER',
  ALERT: 'ALERT'
};

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Get paginated list of notifications
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @param {string} params.type - Filter by notification type
 * @param {string} params.priority - Filter by priority
 * @param {number} params.userId - Filter by user ID
 * @param {boolean} params.isRead - Filter by read status
 * @param {boolean} params.isActive - Filter by active status
 * @param {string} params.relatedTable - Filter by related table
 * @param {number} params.relatedId - Filter by related record ID
 * @param {string} params.search - Search term
 * @param {string} params.orderBy - Field to order by
 * @param {string} params.orderDir - Order direction
 * @returns {Promise<Object>} - API response with data and pagination
 */
export const getNotifications = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize);
  if (params.type) queryParams.append('type', params.type);
  if (params.priority) queryParams.append('priority', params.priority);
  if (params.userId !== undefined) queryParams.append('userId', params.userId);
  if (params.isRead !== undefined) queryParams.append('isRead', params.isRead);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  if (params.relatedTable) queryParams.append('relatedTable', params.relatedTable);
  if (params.relatedId !== undefined) queryParams.append('relatedId', params.relatedId);
  if (params.search) queryParams.append('search', params.search);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.orderDir) queryParams.append('orderDir', params.orderDir);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get notification count
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - API response with count
 */
export const getNotificationCount = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.type) queryParams.append('type', params.type);
  if (params.priority) queryParams.append('priority', params.priority);
  if (params.userId !== undefined) queryParams.append('userId', params.userId);
  if (params.isRead !== undefined) queryParams.append('isRead', params.isRead);
  if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
  if (params.relatedTable) queryParams.append('relatedTable', params.relatedTable);
  if (params.relatedId !== undefined) queryParams.append('relatedId', params.relatedId);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/count${queryString ? `?${queryString}` : ''}`;
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching notification count:', error);
    throw error;
  }
};

/**
 * Get a single notification by ID
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} - API response with notification data
 */
export const getNotificationById = async (id) => {
  if (!id) {
    throw new Error('Notification ID is required');
  }
  
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notification by ID:', error);
    throw error;
  }
};

/**
 * Create a new notification
 * @param {Object} data - Notification data
 * @param {string} data.title - Notification title
 * @param {string} data.message - Notification message
 * @param {string} data.type - Notification type (INFO, WARNING, ERROR, SUCCESS, REMINDER, ALERT)
 * @param {string} data.priority - Notification priority (LOW, MEDIUM, HIGH, CRITICAL)
 * @param {number} data.userId - User ID for user-specific notifications
 * @param {boolean} data.isRead - Read status
 * @param {boolean} data.isActive - Active status
 * @param {string} data.relatedTable - Related table name
 * @param {number} data.relatedId - Related record ID
 * @returns {Promise<Object>} - API response with created notification
 */
export const createNotification = async (data) => {
  if (!data) {
    throw new Error('Notification data is required');
  }
  
  try {
    const response = await api.post(BASE_URL, data);
    return response.data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Update a notification
 * @param {number} id - Notification ID
 * @param {Object} data - Notification data to update
 * @returns {Promise<Object>} - API response with updated notification
 */
export const updateNotification = async (id, data) => {
  if (!id) {
    throw new Error('Notification ID is required');
  }
  if (!data) {
    throw new Error('Update data is required');
  }
  
  try {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating notification:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} - API response with success status
 */
export const deleteNotification = async (id) => {
  if (!id) {
    throw new Error('Notification ID is required');
  }
  
  try {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {number} id - Notification ID
 * @returns {Promise<Object>} - API response with updated notification
 */
export const markAsRead = async (id) => {
  if (!id) {
    throw new Error('Notification ID is required');
  }
  
  try {
    const response = await api.post(`${BASE_URL}/${id}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications for a user as read
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - API response with count of marked notifications
 */
export const markAllAsRead = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    const response = await api.post(`${BASE_URL}/mark-all-read`, { userId });
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Get unread count for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - API response with unread count
 */
export const getUnreadCount = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    const response = await api.get(`${BASE_URL}/unread-count/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

/**
 * Get active notifications for a user
 * @param {number} userId - User ID
 * @param {number} limit - Maximum number of notifications to return
 * @returns {Promise<Object>} - API response with active notifications
 */
export const getActiveNotificationsByUser = async (userId, limit = DEFAULT_PAGE_SIZE) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  try {
    const response = await api.get(`${BASE_URL}/user/${userId}/active?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching active notifications by user:', error);
    throw error;
  }
};

/**
 * Search notifications
 * @param {Object} params - Search parameters
 * @param {string} params.keyword - Search keyword
 * @param {number} params.limit - Maximum number of results
 * @returns {Promise<Object>} - API response with search results and pagination
 */
export const searchNotifications = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.keyword) queryParams.append('keyword', params.keyword);
  if (params.limit) queryParams.append('limit', params.limit);
  
  const queryString = queryParams.toString();
  const url = `${BASE_URL}/search${queryString ? `?${queryString}` : ''}`;
  
  if (!params.keyword) {
    throw new Error('Search keyword is required');
  }
  
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error searching notifications:', error);
    throw error;
  }
};

/**
 * Create a system notification
 * @param {Object} data - Notification data
 * @param {string} data.title - Notification title
 * @param {string} data.message - Notification message
 * @param {string} data.type - Notification type
 * @param {string} data.priority - Notification priority
 * @returns {Promise<Object>} - API response with created notification
 */
export const createSystemNotification = async (data) => {
  if (!data) {
    throw new Error('Notification data is required');
  }
  
  try {
    const response = await api.post(`${BASE_URL}/system`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating system notification:', error);
    throw error;
  }
};

/**
 * Create a user-specific notification
 * @param {Object} data - Notification data
 * @param {number} data.userId - User ID
 * @param {string} data.title - Notification title
 * @param {string} data.message - Notification message
 * @param {string} data.type - Notification type
 * @param {string} data.priority - Notification priority
 * @returns {Promise<Object>} - API response with created notification
 */
export const createUserNotification = async (data) => {
  if (!data) {
    throw new Error('Notification data is required');
  }
  if (!data.userId) {
    throw new Error('User ID is required for user notification');
  }
  
  try {
    const response = await api.post(`${BASE_URL}/user`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating user notification:', error);
    throw error;
  }
};

/**
 * Get notification statistics
 * @returns {Promise<Object>} - API response with notification statistics
 */
export const getNotificationStatistics = async () => {
  try {
    const response = await api.get(`${BASE_URL}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notification statistics:', error);
    throw error;
  }
};

/**
 * Get notification types
 * @returns {Promise<Object>} - API response with notification types
 */
export const getNotificationTypes = async () => {
  try {
    const response = await api.get(`${BASE_URL}/types`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notification types:', error);
    throw error;
  }
};

/**
 * Get notification priorities
 * @returns {Promise<Object>} - API response with notification priorities
 */
export const getNotificationPriorities = async () => {
  try {
    const response = await api.get(`${BASE_URL}/priorities`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notification priorities:', error);
    throw error;
  }
};

/**
 * Get label for notification type
 * @param {string} type - Notification type
 * @returns {string} - Display label
 */
export const getNotificationTypeLabel = (type) => {
  const labels = {
    INFO: 'Information',
    WARNING: 'Warning',
    ERROR: 'Error',
    SUCCESS: 'Success',
    REMINDER: 'Reminder',
    ALERT: 'Alert'
  };
  return labels[type] || type;
};

/**
 * Get color for notification type
 * @param {string} type - Notification type
 * @returns {string} - CSS color class
 */
export const getNotificationTypeColor = (type) => {
  const colors = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'danger',
    SUCCESS: 'success',
    REMINDER: 'primary',
    ALERT: 'danger'
  };
  return colors[type] || 'secondary';
};

/**
 * Get label for notification priority
 * @param {string} priority - Notification priority
 * @returns {string} - Display label
 */
export const getNotificationPriorityLabel = (priority) => {
  const labels = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical'
  };
  return labels[priority] || priority;
};

/**
 * Get color for notification priority
 * @param {string} priority - Notification priority
 * @returns {string} - CSS color class
 */
export const getNotificationPriorityColor = (priority) => {
  const colors = {
    LOW: 'secondary',
    MEDIUM: 'primary',
    HIGH: 'warning',
    CRITICAL: 'danger'
  };
  return colors[priority] || 'secondary';
};

/**
 * Format notification for display
 * @param {Object} notification - Notification object
 * @returns {Object} - Formatted notification object
 */
export const formatNotification = (notification) => {
  if (!notification) return null;
  
  return {
    ...notification,
    typeLabel: getNotificationTypeLabel(notification.type),
    typeColor: getNotificationTypeColor(notification.type),
    priorityLabel: getNotificationPriorityLabel(notification.priority),
    priorityColor: getNotificationPriorityColor(notification.priority),
    isRead: Boolean(notification.is_read),
    isActive: Boolean(notification.is_active)
  };
};

/**
 * Filter notifications by type
 * @param {Array} notifications - Array of notifications
 * @param {string} type - Notification type to filter by
 * @returns {Array} - Filtered notifications
 */
export const filterNotificationsByType = (notifications, type) => {
  if (!notifications || notifications.length === 0) return [];
  return notifications.filter(n => n.type === type);
};

/**
 * Filter notifications by priority
 * @param {Array} notifications - Array of notifications
 * @param {string} priority - Priority to filter by
 * @returns {Array} - Filtered notifications
 */
export const filterNotificationsByPriority = (notifications, priority) => {
  if (!notifications || notifications.length === 0) return [];
  return notifications.filter(n => n.priority === priority);
};

/**
 * Sort notifications by date (newest first)
 * @param {Array} notifications - Array of notifications
 * @returns {Array} - Sorted notifications
 */
export const sortNotificationsByDate = (notifications) => {
  if (!notifications || notifications.length === 0) return [];
  return [...notifications].sort((a, b) => {
    const dateA = new Date(a.created_at || a.sent_at || 0);
    const dateB = new Date(b.created_at || b.sent_at || 0);
    return dateB - dateA;
  });
};

export default {
  getNotifications,
  getNotificationCount,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getActiveNotificationsByUser,
  searchNotifications,
  createSystemNotification,
  createUserNotification,
  getNotificationStatistics,
  getNotificationTypes,
  getNotificationPriorities,
  getNotificationTypeLabel,
  getNotificationTypeColor,
  getNotificationPriorityLabel,
  getNotificationPriorityColor,
  formatNotification,
  filterNotificationsByType,
  filterNotificationsByPriority,
  sortNotificationsByDate,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES
};

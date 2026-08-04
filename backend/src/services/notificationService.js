/**
 * Notification Service
 * Business logic layer for notification operations
 * 
 * Handles:
 * - Notification validation
 * - Business rule enforcement
 * - Data transformation
 * - Pagination
 * - Advanced filtering and search
 * - User-specific notification management
 */

import {
  getAllNotifications as getAllNotificationsModel,
  getUnreadCount as getUnreadCountModel,
  getNotificationById as getNotificationByIdModel,
  createNotification as createNotificationModel,
  updateNotification as updateNotificationModel,
  deleteNotification as deleteNotificationModel,
  markAsRead as markAsReadModel,
  markAllAsRead as markAllAsReadModel,
  getNotificationsCount as getNotificationsCountModel,
  searchNotifications as searchNotificationsModel,
  getActiveNotificationsByUser as getActiveNotificationsByUserModel,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES
} from '../models/Notification.js';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Validate notification data
 * @param {Object} data - Notification data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateNotification = (data, isUpdate = false) => {
  const errors = [];

  // Required fields for create; optional for update
  if (!isUpdate || data.title !== undefined) {
    if (!data.title || data.title.trim() === '') {
      errors.push('Title is required');
    } else if (data.title.length > 255) {
      errors.push('Title must be 255 characters or less');
    }
  }

  if (!isUpdate || data.message !== undefined) {
    if (!data.message || data.message.trim() === '') {
      errors.push('Message is required');
    }
  }

  // Validate type
  if (data.type && !Object.values(NOTIFICATION_TYPES).includes(data.type)) {
    errors.push(`Invalid type. Must be one of: ${Object.values(NOTIFICATION_TYPES).join(', ')}`);
  }

  // Validate priority
  if (data.priority && !Object.values(NOTIFICATION_PRIORITIES).includes(data.priority)) {
    errors.push(`Invalid priority. Must be one of: ${Object.values(NOTIFICATION_PRIORITIES).join(', ')}`);
  }

  // Validate user_id if provided
  if (data.userId !== undefined && data.userId !== null) {
    if (isNaN(parseInt(data.userId)) || data.userId < 0) {
      errors.push('User ID must be a valid positive number or null');
    }
  }

  // Validate related_id if provided
  if (data.relatedId !== undefined && data.relatedId !== null) {
    if (isNaN(parseInt(data.relatedId)) || data.relatedId < 0) {
      errors.push('Related ID must be a valid positive number or null');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get paginated notifications with optional filtering
 * @param {Object} options - Filter and pagination options
 * @param {number} options.page - Page number
 * @param {number} options.pageSize - Items per page
 * @param {string} options.type - Filter by notification type
 * @param {string} options.priority - Filter by priority
 * @param {number} options.userId - Filter by user ID
 * @param {boolean} options.isRead - Filter by read status
 * @param {boolean} options.isActive - Filter by active status
 * @param {string} options.relatedTable - Filter by related table
 * @param {number} options.relatedId - Filter by related record ID
 * @param {string} options.search - Search term
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction
 * @returns {Object} - Paginated result with data and pagination info
 */
export const getPaginatedNotifications = (options = {}) => {
  const {
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    type,
    priority,
    userId,
    isRead,
    isActive,
    relatedTable,
    relatedId,
    search,
    orderBy,
    orderDir
  } = options;

  const offset = (page - 1) * pageSize;

  // Build filter options for model
  const filterOptions = {
    type,
    priority,
    userId,
    isRead,
    isActive,
    relatedTable,
    relatedId,
    limit: pageSize,
    offset,
    orderBy,
    orderDir
  };

  // Get notifications
  let notifications;
  if (search) {
    notifications = searchNotificationsModel(search, pageSize);
  } else {
    notifications = getAllNotificationsModel(filterOptions);
  }

  // Get total count
  const countFilterOptions = {
    type,
    priority,
    userId,
    isRead,
    isActive,
    relatedTable,
    relatedId
  };
  const total = getNotificationsCountModel(countFilterOptions);

  // Calculate pagination info
  const totalPages = Math.ceil(total / pageSize);

  return {
    data: notifications,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

/**
 * Get notification by ID
 * @param {number} id - Notification ID
 * @returns {Object|null} - Notification object or null
 */
export const getNotification = (id) => {
  if (isNaN(parseInt(id)) || id < 1) {
    throw new Error('Invalid notification ID');
  }
  return getNotificationByIdModel(id);
};

/**
 * Create a new notification
 * @param {Object} notificationData - Notification data
 * @returns {Object} - Created notification object
 */
export const createNotification = (notificationData) => {
  // Validate data
  const validation = validateNotification(notificationData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Set defaults
  const dataWithDefaults = {
    type: NOTIFICATION_TYPES.INFO,
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
    ...notificationData
  };

  return createNotificationModel(dataWithDefaults);
};

/**
 * Update a notification
 * @param {number} id - Notification ID
 * @param {Object} updateData - Data to update
 * @returns {Object|null} - Updated notification object or null
 */
export const updateNotification = (id, updateData) => {
  // Validate ID
  if (isNaN(parseInt(id)) || id < 1) {
    throw new Error('Invalid notification ID');
  }

  // Validate update data
  const validation = validateNotification(updateData, true);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  return updateNotificationModel(id, updateData);
};

/**
 * Delete a notification
 * @param {number} id - Notification ID
 * @returns {boolean} - True if deleted successfully
 */
export const deleteNotification = (id) => {
  // Validate ID
  if (isNaN(parseInt(id)) || id < 1) {
    throw new Error('Invalid notification ID');
  }

  return deleteNotificationModel(id);
};

/**
 * Mark notification as read
 * @param {number} id - Notification ID
 * @returns {Object|null} - Updated notification object or null
 */
export const markAsRead = (id) => {
  // Validate ID
  if (isNaN(parseInt(id)) || id < 1) {
    throw new Error('Invalid notification ID');
  }

  return markAsReadModel(id);
};

/**
 * Mark all notifications for a user as read
 * @param {number} userId - User ID
 * @returns {number} - Number of notifications marked as read
 */
export const markAllAsRead = (userId) => {
  // Validate user ID
  if (isNaN(parseInt(userId)) || userId < 1) {
    throw new Error('Invalid user ID');
  }

  return markAllAsReadModel(userId);
};

/**
 * Get unread notifications count for a user
 * @param {number} userId - User ID
 * @returns {number} - Count of unread notifications
 */
export const getUnreadCount = (userId) => {
  // Validate user ID
  if (isNaN(parseInt(userId)) || userId < 1) {
    throw new Error('Invalid user ID');
  }

  return getUnreadCountModel(userId);
};

/**
 * Get notifications count with optional filtering
 * @param {Object} options - Filter options
 * @returns {number} - Total count of notifications
 */
export const getNotificationsCount = (options = {}) => {
  return getNotificationsCountModel(options);
};

/**
 * Search notifications by keyword
 * @param {string} keyword - Search keyword
 * @param {number} limit - Limit results
 * @returns {Object} - Paginated result with data and pagination info
 */
export const searchNotifications = (keyword, limit = DEFAULT_PAGE_SIZE) => {
  if (!keyword || keyword.trim() === '') {
    throw new Error('Search keyword is required');
  }

  const notifications = searchNotificationsModel(keyword, limit);
  return {
    data: notifications,
    pagination: {
      page: 1,
      pageSize: limit,
      total: notifications.length,
      totalPages: 1
    }
  };
};

/**
 * Get active notifications for a user
 * @param {number} userId - User ID
 * @param {number} limit - Limit results
 * @returns {Array} - Array of active notifications
 */
export const getActiveNotificationsByUser = (userId, limit = DEFAULT_PAGE_SIZE) => {
  // Validate user ID
  if (isNaN(parseInt(userId)) || userId < 1) {
    throw new Error('Invalid user ID');
  }

  return getActiveNotificationsByUserModel(userId, limit);
};

/**
 * Create a system notification (for system-generated alerts)
 * @param {Object} options - Notification options
 * @param {string} options.title - Title
 * @param {string} options.message - Message
 * @param {string} options.type - Type (defaults to INFO)
 * @param {string} options.priority - Priority (defaults to MEDIUM)
 * @param {number} options.relatedId - Related record ID
 * @param {string} options.relatedTable - Related table name
 * @returns {Object} - Created notification object
 */
export const createSystemNotification = (options) => {
  const { title, message, type, priority, relatedId, relatedTable } = options;

  return createNotification({
    title,
    message,
    type: type || NOTIFICATION_TYPES.INFO,
    priority: priority || NOTIFICATION_PRIORITIES.MEDIUM,
    userId: null, // System notifications are for all users
    relatedTable,
    relatedId
  });
};

/**
 * Create a user-specific notification
 * @param {Object} options - Notification options
 * @param {number} options.userId - Target user ID
 * @param {string} options.title - Title
 * @param {string} options.message - Message
 * @param {string} options.type - Type
 * @param {string} options.priority - Priority
 * @param {number} options.relatedId - Related record ID
 * @param {string} options.relatedTable - Related table name
 * @returns {Object} - Created notification object
 */
export const createUserNotification = (options) => {
  const { userId, title, message, type, priority, relatedId, relatedTable } = options;

  if (!userId) {
    throw new Error('User ID is required for user-specific notifications');
  }

  return createNotification({
    title,
    message,
    type: type || NOTIFICATION_TYPES.INFO,
    priority: priority || NOTIFICATION_PRIORITIES.MEDIUM,
    userId,
    relatedTable,
    relatedId
  });
};

/**
 * Get notification statistics
 * @returns {Object} - Statistics object
 */
export const getNotificationStatistics = () => {
  const allNotifications = getAllNotificationsModel();
  const unreadCount = allNotifications.filter(n => n.is_read === 0).length;
  const readCount = allNotifications.filter(n => n.is_read === 1).length;

  // Count by type
  const byType = {};
  Object.values(NOTIFICATION_TYPES).forEach(type => {
    byType[type] = allNotifications.filter(n => n.type === type).length;
  });

  // Count by priority
  const byPriority = {};
  Object.values(NOTIFICATION_PRIORITIES).forEach(priority => {
    byPriority[priority] = allNotifications.filter(n => n.priority === priority).length;
  });

  return {
    total: allNotifications.length,
    unread: unreadCount,
    read: readCount,
    byType,
    byPriority
  };
};

// Export constants
export {
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES
};

// Export all service functions
export default {
  validateNotification,
  getPaginatedNotifications,
  getNotification,
  createNotification,
  updateNotification,
  deleteNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getNotificationsCount,
  searchNotifications,
  getActiveNotificationsByUser,
  createSystemNotification,
  createUserNotification,
  getNotificationStatistics
};

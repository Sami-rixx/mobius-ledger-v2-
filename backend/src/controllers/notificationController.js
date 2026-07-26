/**
 * Notification Controller
 * HTTP request handlers for notification endpoints
 * 
 * Handles:
 * - RESTful CRUD operations
 * - Request/response handling
 * - Error handling
 * - Status codes
 */

import {
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
  getNotificationStatistics,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES
} from '../services/notificationService.js';

// Default pagination
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

/**
 * List notifications with pagination and filtering
 * GET /api/notifications
 */
export const listNotifications = (req, res) => {
  try {
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
    } = req.query;

    const options = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      type,
      priority,
      userId: userId ? parseInt(userId) : undefined,
      isRead: isRead ? JSON.parse(isRead) : undefined,
      isActive: isActive ? JSON.parse(isActive) : undefined,
      relatedTable,
      relatedId: relatedId ? parseInt(relatedId) : undefined,
      search,
      orderBy,
      orderDir
    };

    const result = getPaginatedNotifications(options);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get notification count
 * GET /api/notifications/count
 */
export const countNotifications = (req, res) => {
  try {
    const {
      type,
      priority,
      userId,
      isRead,
      isActive,
      relatedTable,
      relatedId
    } = req.query;

    const options = {
      type,
      priority,
      userId: userId ? parseInt(userId) : undefined,
      isRead: isRead ? JSON.parse(isRead) : undefined,
      isActive: isActive ? JSON.parse(isActive) : undefined,
      relatedTable,
      relatedId: relatedId ? parseInt(relatedId) : undefined
    };

    const count = getNotificationsCount(options);
    res.json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get notification by ID
 * GET /api/notifications/:id
 */
export const getSingleNotification = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const notification = getNotification(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a new notification
 * POST /api/notifications
 */
export const createNotificationHandler = (req, res) => {
  try {
    const notificationData = req.body;
    const notification = createNotification(notificationData);

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update a notification
 * PUT /api/notifications/:id
 */
export const updateNotificationHandler = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updateData = req.body;
    const notification = updateNotification(id, updateData);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification,
      message: 'Notification updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
export const deleteNotificationHandler = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = deleteNotification(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Mark notification as read
 * POST /api/notifications/:id/read
 */
export const markAsReadHandler = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const notification = markAsRead(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Mark all notifications for a user as read
 * POST /api/notifications/mark-all-read
 */
export const markAllAsReadHandler = (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const count = markAllAsRead(parseInt(userId));

    res.json({
      success: true,
      count,
      message: `${count} notifications marked as read`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get unread count for a user
 * GET /api/notifications/unread-count/:userId
 */
export const getUnreadCountHandler = (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const count = getUnreadCount(userId);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get active notifications for a user
 * GET /api/notifications/user/:userId/active
 */
export const getActiveByUserHandler = (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { limit = DEFAULT_PAGE_SIZE } = req.query;
    const notifications = getActiveNotificationsByUser(userId, parseInt(limit));

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Search notifications
 * GET /api/notifications/search
 */
export const searchNotificationsHandler = (req, res) => {
  try {
    const { keyword, limit = DEFAULT_PAGE_SIZE } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Search keyword is required'
      });
    }

    const result = searchNotifications(keyword, parseInt(limit));

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a system notification
 * POST /api/notifications/system
 */
export const createSystemNotificationHandler = (req, res) => {
  try {
    const notificationData = req.body;
    const notification = createSystemNotification(notificationData);

    res.status(201).json({
      success: true,
      data: notification,
      message: 'System notification created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create a user-specific notification
 * POST /api/notifications/user
 */
export const createUserNotificationHandler = (req, res) => {
  try {
    const notificationData = req.body;
    const notification = createUserNotification(notificationData);

    res.status(201).json({
      success: true,
      data: notification,
      message: 'User notification created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get notification statistics
 * GET /api/notifications/stats
 */
export const getStatisticsHandler = (req, res) => {
  try {
    const stats = getNotificationStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get notification types
 * GET /api/notifications/types
 */
export const getTypesHandler = (req, res) => {
  try {
    res.json({
      success: true,
      data: NOTIFICATION_TYPES
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get notification priorities
 * GET /api/notifications/priorities
 */
export const getPrioritiesHandler = (req, res) => {
  try {
    res.json({
      success: true,
      data: NOTIFICATION_PRIORITIES
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Export all controller functions
export default {
  listNotifications,
  countNotifications,
  getSingleNotification,
  createNotificationHandler,
  updateNotificationHandler,
  deleteNotificationHandler,
  markAsReadHandler,
  markAllAsReadHandler,
  getUnreadCountHandler,
  getActiveByUserHandler,
  searchNotificationsHandler,
  createSystemNotificationHandler,
  createUserNotificationHandler,
  getStatisticsHandler,
  getTypesHandler,
  getPrioritiesHandler
};

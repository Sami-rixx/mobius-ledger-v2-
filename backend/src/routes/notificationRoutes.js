/**
 * Notification Routes
 * RESTful API endpoint definitions for notification operations
 * 
 * Endpoints:
 * - GET /api/notifications - List notifications with pagination and filtering
 * - GET /api/notifications/count - Get notification count
 * - GET /api/notifications/:id - Get a single notification by ID
 * - POST /api/notifications - Create a new notification
 * - PUT /api/notifications/:id - Update a notification
 * - DELETE /api/notifications/:id - Delete a notification
 * - POST /api/notifications/:id/read - Mark notification as read
 * - POST /api/notifications/mark-all-read - Mark all notifications for a user as read
 * - GET /api/notifications/unread-count/:userId - Get unread count for a user
 * - GET /api/notifications/user/:userId/active - Get active notifications for a user
 * - GET /api/notifications/search - Search notifications
 * - POST /api/notifications/system - Create a system notification
 * - POST /api/notifications/user - Create a user-specific notification
 * - GET /api/notifications/stats - Get notification statistics
 * - GET /api/notifications/types - Get notification types
 * - GET /api/notifications/priorities - Get notification priorities
 */

import { Router } from 'express';
import {
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
} from '../controllers/notificationController.js';

const router = Router();

// GET /api/notifications - List notifications with pagination and filtering
router.get('/', listNotifications);

// GET /api/notifications/count - Get notification count
router.get('/count', countNotifications);

// GET /api/notifications/:id - Get a single notification by ID
router.get('/:id', getSingleNotification);

// POST /api/notifications - Create a new notification
router.post('/', createNotificationHandler);

// PUT /api/notifications/:id - Update a notification
router.put('/:id', updateNotificationHandler);

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', deleteNotificationHandler);

// POST /api/notifications/:id/read - Mark notification as read
router.post('/:id/read', markAsReadHandler);

// POST /api/notifications/mark-all-read - Mark all notifications for a user as read
router.post('/mark-all-read', markAllAsReadHandler);

// GET /api/notifications/unread-count/:userId - Get unread count for a user
router.get('/unread-count/:userId', getUnreadCountHandler);

// GET /api/notifications/user/:userId/active - Get active notifications for a user
router.get('/user/:userId/active', getActiveByUserHandler);

// GET /api/notifications/search - Search notifications
router.get('/search', searchNotificationsHandler);

// POST /api/notifications/system - Create a system notification
router.post('/system', createSystemNotificationHandler);

// POST /api/notifications/user - Create a user-specific notification
router.post('/user', createUserNotificationHandler);

// GET /api/notifications/stats - Get notification statistics
router.get('/stats', getStatisticsHandler);

// GET /api/notifications/types - Get notification types
router.get('/types', getTypesHandler);

// GET /api/notifications/priorities - Get notification priorities
router.get('/priorities', getPrioritiesHandler);

export default router;

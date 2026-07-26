import db from '../config/database.js';

/**
 * Notification Model
 * Data access layer for notifications table
 * 
 * Manages system notifications for:
 * - User alerts and reminders
 * - System messages and warnings
 * - Financial thresholds and notifications
 * - Scheduled notifications
 */

// Table name
const TABLE = 'notifications';

// Field names for consistency
const FIELDS = {
  ID: 'id',
  TITLE: 'title',
  MESSAGE: 'message',
  TYPE: 'type',
  PRIORITY: 'priority',
  USER_ID: 'user_id',
  IS_READ: 'is_read',
  IS_ACTIVE: 'is_active',
  RELATED_TABLE: 'related_table',
  RELATED_ID: 'related_id',
  SCHEDULED_AT: 'scheduled_at',
  SENT_AT: 'sent_at',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at'
};

// Notification types
const NOTIFICATION_TYPES = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
  REMINDER: 'REMINDER',
  ALERT: 'ALERT'
};

// Notification priorities
const NOTIFICATION_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Get all notifications with optional filtering
 * @param {Object} options - Filter options
 * @param {string} options.type - Filter by notification type
 * @param {string} options.priority - Filter by priority
 * @param {number} options.userId - Filter by user ID
 * @param {boolean} options.isRead - Filter by read status
 * @param {boolean} options.isActive - Filter by active status
 * @param {string} options.relatedTable - Filter by related table
 * @param {number} options.relatedId - Filter by related record ID
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.orderBy - Field to order by
 * @param {string} options.orderDir - Order direction (ASC/DESC)
 * @returns {Array} - Array of notification objects
 */
export const getAllNotifications = (options = {}) => {
  const {
    type,
    priority,
    userId,
    isRead,
    isActive,
    relatedTable,
    relatedId,
    limit = 100,
    offset = 0,
    orderBy = FIELDS.CREATED_AT,
    orderDir = 'DESC'
  } = options;

  let query = `SELECT * FROM ${TABLE}`;
  const params = [];
  const conditions = [];

  if (type) {
    conditions.push(`type = ?`);
    params.push(type);
  }

  if (priority) {
    conditions.push(`priority = ?`);
    params.push(priority);
  }

  if (userId) {
    conditions.push(`user_id = ?`);
    params.push(userId);
  }

  if (isRead !== undefined) {
    conditions.push(`is_read = ?`);
    params.push(isRead ? 1 : 0);
  }

  if (isActive !== undefined) {
    conditions.push(`is_active = ?`);
    params.push(isActive ? 1 : 0);
  }

  if (relatedTable) {
    conditions.push(`related_table = ?`);
    params.push(relatedTable);
  }

  if (relatedId) {
    conditions.push(`related_id = ?`);
    params.push(relatedId);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  try {
    const stmt = db.prepare(query);
    const result = stmt.all(...params);
    return result;
  } catch (error) {
    console.error('Error in getAllNotifications:', error.message);
    throw error;
  }
};

/**
 * Get unread notifications count for a user
 * @param {number} userId - User ID
 * @returns {number} - Count of unread notifications
 */
export const getUnreadCount = (userId) => {
  const query = `SELECT COUNT(*) as count FROM ${TABLE} WHERE user_id = ? AND is_read = 0 AND is_active = 1`;
  try {
    const stmt = db.prepare(query);
    const result = stmt.get(userId);
    return result.count || 0;
  } catch (error) {
    console.error('Error in getUnreadCount:', error.message);
    throw error;
  }
};

/**
 * Get notification by ID
 * @param {number} id - Notification ID
 * @returns {Object|null} - Notification object or null
 */
export const getNotificationById = (id) => {
  const query = `SELECT * FROM ${TABLE} WHERE id = ?`;
  try {
    const stmt = db.prepare(query);
    const result = stmt.get(id);
    return result || null;
  } catch (error) {
    console.error('Error in getNotificationById:', error.message);
    throw error;
  }
};

/**
 * Create a new notification
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} notificationData.type - Notification type (INFO, WARNING, ERROR, etc.)
 * @param {string} notificationData.priority - Priority level (LOW, MEDIUM, HIGH, CRITICAL)
 * @param {number} notificationData.userId - Target user ID (null for all users)
 * @param {string} notificationData.relatedTable - Related table name
 * @param {number} notificationData.relatedId - Related record ID
 * @param {string} notificationData.scheduledAt - Scheduled time (optional)
 * @returns {Object} - Created notification object
 */
export const createNotification = (notificationData) => {
  const {
    title,
    message,
    type = NOTIFICATION_TYPES.INFO,
    priority = NOTIFICATION_PRIORITIES.MEDIUM,
    userId = null,
    relatedTable = null,
    relatedId = null,
    scheduledAt = null
  } = notificationData;

  const query = `
    INSERT INTO ${TABLE} (title, message, type, priority, user_id, related_table, related_id, scheduled_at, is_read, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;

  try {
    const stmt = db.prepare(query);
    const result = stmt.run(
      title,
      message,
      type,
      priority,
      userId,
      relatedTable,
      relatedId,
      scheduledAt
    );

    // Fetch and return the created notification
    return getNotificationById(result.lastInsertRowid);
  } catch (error) {
    console.error('Error in createNotification:', error.message);
    throw error;
  }
};

/**
 * Update a notification
 * @param {number} id - Notification ID
 * @param {Object} updateData - Data to update
 * @returns {Object|null} - Updated notification object or null
 */
export const updateNotification = (id, updateData) => {
  const { title, message, type, priority, userId, isRead, isActive, relatedTable, relatedId, scheduledAt } = updateData;

  const fields = [];
  const values = [];

  if (title !== undefined) {
    fields.push(`title = ?`);
    values.push(title);
  }
  if (message !== undefined) {
    fields.push(`message = ?`);
    values.push(message);
  }
  if (type !== undefined) {
    fields.push(`type = ?`);
    values.push(type);
  }
  if (priority !== undefined) {
    fields.push(`priority = ?`);
    values.push(priority);
  }
  if (userId !== undefined) {
    fields.push(`user_id = ?`);
    values.push(userId);
  }
  if (isRead !== undefined) {
    fields.push(`is_read = ?`);
    values.push(isRead ? 1 : 0);
  }
  if (isActive !== undefined) {
    fields.push(`is_active = ?`);
    values.push(isActive ? 1 : 0);
  }
  if (relatedTable !== undefined) {
    fields.push(`related_table = ?`);
    values.push(relatedTable);
  }
  if (relatedId !== undefined) {
    fields.push(`related_id = ?`);
    values.push(relatedId);
  }
  if (scheduledAt !== undefined) {
    fields.push(`scheduled_at = ?`);
    values.push(scheduledAt);
  }

  if (fields.length === 0) {
    return getNotificationById(id);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = ?`;

  try {
    const stmt = db.prepare(query);
    stmt.run(...values);
    return getNotificationById(id);
  } catch (error) {
    console.error('Error in updateNotification:', error.message);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {number} id - Notification ID
 * @returns {boolean} - True if deleted successfully
 */
export const deleteNotification = (id) => {
  const query = `DELETE FROM ${TABLE} WHERE id = ?`;
  try {
    const stmt = db.prepare(query);
    const result = stmt.run(id);
    return result.changes > 0;
  } catch (error) {
    console.error('Error in deleteNotification:', error.message);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {number} id - Notification ID
 * @returns {Object|null} - Updated notification object or null
 */
export const markAsRead = (id) => {
  return updateNotification(id, { isRead: true });
};

/**
 * Mark all notifications for a user as read
 * @param {number} userId - User ID
 * @returns {number} - Number of notifications marked as read
 */
export const markAllAsRead = (userId) => {
  const query = `UPDATE ${TABLE} SET is_read = 1 WHERE user_id = ?`;
  try {
    const stmt = db.prepare(query);
    const result = stmt.run(userId);
    return result.changes;
  } catch (error) {
    console.error('Error in markAllAsRead:', error.message);
    throw error;
  }
};

/**
 * Get notifications count
 * @param {Object} options - Filter options (same as getAllNotifications)
 * @returns {number} - Total count of notifications
 */
export const getNotificationsCount = (options = {}) => {
  const {
    type,
    priority,
    userId,
    isRead,
    isActive,
    relatedTable,
    relatedId
  } = options;

  let query = `SELECT COUNT(*) as count FROM ${TABLE}`;
  const params = [];
  const conditions = [];

  if (type) {
    conditions.push(`type = ?`);
    params.push(type);
  }

  if (priority) {
    conditions.push(`priority = ?`);
    params.push(priority);
  }

  if (userId) {
    conditions.push(`user_id = ?`);
    params.push(userId);
  }

  if (isRead !== undefined) {
    conditions.push(`is_read = ?`);
    params.push(isRead ? 1 : 0);
  }

  if (isActive !== undefined) {
    conditions.push(`is_active = ?`);
    params.push(isActive ? 1 : 0);
  }

  if (relatedTable) {
    conditions.push(`related_table = ?`);
    params.push(relatedTable);
  }

  if (relatedId) {
    conditions.push(`related_id = ?`);
    params.push(relatedId);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  try {
    const stmt = db.prepare(query);
    const result = stmt.get(...params);
    return result.count || 0;
  } catch (error) {
    console.error('Error in getNotificationsCount:', error.message);
    throw error;
  }
};

/**
 * Search notifications by keyword in title or message
 * @param {string} keyword - Search keyword
 * @param {number} limit - Limit results
 * @returns {Array} - Array of matching notifications
 */
export const searchNotifications = (keyword, limit = 50) => {
  const query = `
    SELECT * FROM ${TABLE} 
    WHERE (title LIKE ? OR message LIKE ?) 
    AND is_active = 1 
    ORDER BY created_at DESC 
    LIMIT ?
  `;
  const searchPattern = `%${keyword}%`;

  try {
    const stmt = db.prepare(query);
    return stmt.all(searchPattern, searchPattern, limit);
  } catch (error) {
    console.error('Error in searchNotifications:', error.message);
    throw error;
  }
};

/**
 * Get active notifications for a user
 * @param {number} userId - User ID
 * @param {number} limit - Limit results
 * @returns {Array} - Array of active notifications
 */
export const getActiveNotificationsByUser = (userId, limit = 50) => {
  const query = `
    SELECT * FROM ${TABLE} 
    WHERE user_id = ? AND is_active = 1 
    ORDER BY priority DESC, created_at DESC 
    LIMIT ?
  `;

  try {
    const stmt = db.prepare(query);
    return stmt.all(userId, limit);
  } catch (error) {
    console.error('Error in getActiveNotificationsByUser:', error.message);
    throw error;
  }
};

// Export constants
export {
  TABLE as NOTIFICATIONS_TABLE,
  FIELDS as NOTIFICATION_FIELDS,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES
};

// Export all functions
export default {
  getAllNotifications,
  getUnreadCount,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  markAsRead,
  markAllAsRead,
  getNotificationsCount,
  searchNotifications,
  getActiveNotificationsByUser
};

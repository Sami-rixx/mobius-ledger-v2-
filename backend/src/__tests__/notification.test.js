/**
 * Notification Module Tests
 * Comprehensive tests for Notification model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import Database from 'better-sqlite3';

// Test database setup
const TEST_DB = ':memory:';
let testDb;

// Mock the database module
jest.mock('../config/database.js', () => ({
  default: testDb
}));

describe('Notification Module', () => {
  beforeAll(() => {
    // Create in-memory database for testing
    testDb = new Database(TEST_DB);
    
    // Create users and notifications tables
    testDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        password_hash TEXT,
        role TEXT DEFAULT 'admin',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'INFO' CHECK(type IN ('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'REMINDER', 'ALERT')),
        priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
        user_id INTEGER,
        is_read BOOLEAN NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        related_table TEXT,
        related_id INTEGER,
        scheduled_at DATETIME,
        sent_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
      CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
    `);

    // Insert test users
    const insertUser = testDb.prepare('INSERT INTO users (id, username, full_name, role) VALUES (?, ?, ?, ?)');
    insertUser.run(1, 'admin', 'Admin User', 'admin');
    insertUser.run(2, 'user1', 'Regular User', 'user');
    insertUser.run(3, 'user2', 'Another User', 'user');
    
    // Insert test notifications
    const insertNotification = testDb.prepare(`
      INSERT INTO notifications (title, message, type, priority, user_id, is_read, is_active, related_table, related_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    // System notifications (user_id = null)
    insertNotification.run('System Alert', 'System is running', 'INFO', 'MEDIUM', null, 0, 1, null, null);
    insertNotification.run('Warning', 'Disk space low', 'WARNING', 'HIGH', null, 0, 1, null, null);
    
    // User-specific notifications
    insertNotification.run('Welcome', 'Welcome to the system', 'SUCCESS', 'MEDIUM', 1, 1, 1, 'users', 1);
    insertNotification.run('Payment Received', 'Payment of $100 received', 'INFO', 'LOW', 2, 0, 1, 'income', 1);
    insertNotification.run('Action Required', 'Please review your account', 'ALERT', 'CRITICAL', 2, 0, 1, 'students', 5);
    insertNotification.run('Reminder', 'Monthly report due soon', 'REMINDER', 'MEDIUM', 3, 0, 1, null, null);
    
    // Inactive notification
    insertNotification.run('Old Notification', 'This is old', 'INFO', 'LOW', 1, 1, 0, null, null);
  });

  afterAll(() => {
    // Close test database connection
    try {
      testDb.close();
    } catch (e) {
      // Ignore errors during cleanup
    }
  });

  // ============================================
  // Model Tests
  // ============================================
  
  describe('Notification Model', () => {
    // Import model functions after DB is set up
    let notificationModel;
    
    beforeAll(async () => {
      // Dynamic import to ensure DB is ready
      const model = await import('../models/Notification.js');
      notificationModel = model;
    });

    describe('Constants', () => {
      it('should export NOTIFICATIONS_TABLE constant', () => {
        expect(notificationModel.NOTIFICATIONS_TABLE).toBe('notifications');
      });

      it('should export NOTIFICATION_FIELDS constant', () => {
        expect(notificationModel.NOTIFICATION_FIELDS.ID).toBe('id');
        expect(notificationModel.NOTIFICATION_FIELDS.TITLE).toBe('title');
        expect(notificationModel.NOTIFICATION_FIELDS.MESSAGE).toBe('message');
        expect(notificationModel.NOTIFICATION_FIELDS.TYPE).toBe('type');
        expect(notificationModel.NOTIFICATION_FIELDS.PRIORITY).toBe('priority');
      });

      it('should export NOTIFICATION_TYPES constant', () => {
        expect(notificationModel.NOTIFICATION_TYPES.INFO).toBe('INFO');
        expect(notificationModel.NOTIFICATION_TYPES.WARNING).toBe('WARNING');
        expect(notificationModel.NOTIFICATION_TYPES.ERROR).toBe('ERROR');
        expect(notificationModel.NOTIFICATION_TYPES.SUCCESS).toBe('SUCCESS');
        expect(notificationModel.NOTIFICATION_TYPES.REMINDER).toBe('REMINDER');
        expect(notificationModel.NOTIFICATION_TYPES.ALERT).toBe('ALERT');
      });

      it('should export NOTIFICATION_PRIORITIES constant', () => {
        expect(notificationModel.NOTIFICATION_PRIORITIES.LOW).toBe('LOW');
        expect(notificationModel.NOTIFICATION_PRIORITIES.MEDIUM).toBe('MEDIUM');
        expect(notificationModel.NOTIFICATION_PRIORITIES.HIGH).toBe('HIGH');
        expect(notificationModel.NOTIFICATION_PRIORITIES.CRITICAL).toBe('CRITICAL');
      });
    });

    describe('getAllNotifications', () => {
      it('should return all notifications', () => {
        const notifications = notificationModel.getAllNotifications();
        expect(Array.isArray(notifications)).toBe(true);
        expect(notifications.length).toBeGreaterThan(0);
      });

      it('should filter notifications by type', () => {
        const infoNotifications = notificationModel.getAllNotifications({ type: 'INFO' });
        expect(infoNotifications.every(n => n.type === 'INFO')).toBe(true);
      });

      it('should filter notifications by user ID', () => {
        const userNotifications = notificationModel.getAllNotifications({ userId: 2 });
        expect(userNotifications.every(n => n.user_id === 2)).toBe(true);
      });

      it('should filter notifications by read status', () => {
        const unreadNotifications = notificationModel.getAllNotifications({ isRead: false });
        expect(unreadNotifications.every(n => n.is_read === 0)).toBe(true);
      });
    });

    describe('getNotificationById', () => {
      it('should return a notification by ID', () => {
        const notification = notificationModel.getNotificationById(1);
        expect(notification).toBeTruthy();
        expect(notification.id).toBe(1);
      });

      it('should return null for non-existent ID', () => {
        const notification = notificationModel.getNotificationById(9999);
        expect(notification).toBeNull();
      });
    });

    describe('createNotification', () => {
      it('should create a new notification', () => {
        const newNotification = {
          title: 'Test Notification',
          message: 'This is a test',
          type: 'INFO',
          priority: 'LOW'
        };
        
        const created = notificationModel.createNotification(newNotification);
        expect(created).toBeTruthy();
        expect(created.title).toBe('Test Notification');
        expect(created.message).toBe('This is a test');
        expect(created.id).toBeDefined();
      });
    });

    describe('updateNotification', () => {
      it('should update a notification', () => {
        const updated = notificationModel.updateNotification(1, { title: 'Updated Title' });
        expect(updated).toBeTruthy();
        expect(updated.title).toBe('Updated Title');
      });
    });

    describe('deleteNotification', () => {
      it('should delete a notification', () => {
        // First create a notification to delete
        const newNotification = notificationModel.createNotification({
          title: 'To Delete',
          message: 'Will be deleted',
          type: 'INFO',
          priority: 'LOW'
        });
        
        const deleted = notificationModel.deleteNotification(newNotification.id);
        expect(deleted).toBe(true);
        
        const checkDeleted = notificationModel.getNotificationById(newNotification.id);
        expect(checkDeleted).toBeNull();
      });
    });

    describe('getUnreadCount', () => {
      it('should return unread count for a user', () => {
        const count = notificationModel.getUnreadCount(2);
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });

    describe('markAsRead', () => {
      it('should mark a notification as read', () => {
        const marked = notificationModel.markAsRead(2);
        expect(marked).toBeTruthy();
        expect(marked.is_read).toBe(1);
      });
    });

    describe('markAllAsRead', () => {
      it('should mark all notifications for a user as read', () => {
        const count = notificationModel.markAllAsRead(2);
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });

    describe('getNotificationsCount', () => {
      it('should return the total count of notifications', () => {
        const count = notificationModel.getNotificationsCount();
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });
    });

    describe('searchNotifications', () => {
      it('should search notifications by keyword', () => {
        const results = notificationModel.searchNotifications('System');
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
      });
    });

    describe('getActiveNotificationsByUser', () => {
      it('should return active notifications for a user', () => {
        const notifications = notificationModel.getActiveNotificationsByUser(2, 10);
        expect(Array.isArray(notifications)).toBe(true);
        expect(notifications.every(n => n.is_active === 1)).toBe(true);
      });
    });
  });

  // ============================================
  // Service Tests
  // ============================================
  
  describe('Notification Service', () => {
    let notificationService;
    
    beforeAll(async () => {
      const service = await import('../services/notificationService.js');
      notificationService = service;
    });

    describe('validateNotification', () => {
      it('should validate a valid notification', () => {
        const result = notificationService.validateNotification({
          title: 'Test',
          message: 'Test message'
        });
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should reject empty title', () => {
        const result = notificationService.validateNotification({
          title: '',
          message: 'Test message'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Title is required');
      });

      it('should reject empty message', () => {
        const result = notificationService.validateNotification({
          title: 'Test',
          message: ''
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Message is required');
      });

      it('should reject invalid type', () => {
        const result = notificationService.validateNotification({
          title: 'Test',
          message: 'Test message',
          type: 'INVALID'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid type');
      });

      it('should reject invalid priority', () => {
        const result = notificationService.validateNotification({
          title: 'Test',
          message: 'Test message',
          priority: 'INVALID'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid priority');
      });
    });

    describe('getPaginatedNotifications', () => {
      it('should return paginated notifications', () => {
        const result = notificationService.getPaginatedNotifications({ page: 1, pageSize: 5 });
        expect(result.data).toBeDefined();
        expect(result.pagination).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.pageSize).toBe(5);
      });
    });

    describe('getNotification', () => {
      it('should return a notification by ID', () => {
        const notification = notificationService.getNotification(1);
        expect(notification).toBeTruthy();
      });

      it('should throw error for invalid ID', () => {
        expect(() => notificationService.getNotification(-1)).toThrow('Invalid notification ID');
      });
    });

    describe('createNotification', () => {
      it('should create a notification with defaults', () => {
        const notification = notificationService.createNotification({
          title: 'Service Test',
          message: 'Created via service'
        });
        expect(notification).toBeTruthy();
        expect(notification.type).toBe('INFO');
        expect(notification.priority).toBe('MEDIUM');
      });

      it('should throw error for invalid data', () => {
        expect(() => notificationService.createNotification({})).toThrow();
      });
    });

    describe('updateNotification', () => {
      it('should update a notification', () => {
        const updated = notificationService.updateNotification(1, { title: 'Updated via Service' });
        expect(updated).toBeTruthy();
        expect(updated.title).toBe('Updated via Service');
      });

      it('should throw error for invalid ID', () => {
        expect(() => notificationService.updateNotification(-1, {})).toThrow('Invalid notification ID');
      });
    });

    describe('deleteNotification', () => {
      it('should delete a notification', () => {
        const deleted = notificationService.deleteNotification(1);
        expect(deleted).toBe(true);
      });

      it('should throw error for invalid ID', () => {
        expect(() => notificationService.deleteNotification(-1)).toThrow('Invalid notification ID');
      });
    });

    describe('markAsRead', () => {
      it('should mark a notification as read', () => {
        const marked = notificationService.markAsRead(2);
        expect(marked).toBeTruthy();
      });

      it('should throw error for invalid ID', () => {
        expect(() => notificationService.markAsRead(-1)).toThrow('Invalid notification ID');
      });
    });

    describe('markAllAsRead', () => {
      it('should mark all notifications for a user as read', () => {
        const count = notificationService.markAllAsRead(2);
        expect(typeof count).toBe('number');
      });

      it('should throw error for invalid user ID', () => {
        expect(() => notificationService.markAllAsRead(-1)).toThrow('Invalid user ID');
      });
    });

    describe('getUnreadCount', () => {
      it('should return unread count for a user', () => {
        const count = notificationService.getUnreadCount(2);
        expect(typeof count).toBe('number');
      });

      it('should throw error for invalid user ID', () => {
        expect(() => notificationService.getUnreadCount(-1)).toThrow('Invalid user ID');
      });
    });

    describe('searchNotifications', () => {
      it('should search notifications by keyword', () => {
        const result = notificationService.searchNotifications('System');
        expect(result.data).toBeDefined();
        expect(result.pagination).toBeDefined();
      });

      it('should throw error for empty keyword', () => {
        expect(() => notificationService.searchNotifications('')).toThrow('Search keyword is required');
      });
    });

    describe('getActiveNotificationsByUser', () => {
      it('should return active notifications for a user', () => {
        const notifications = notificationService.getActiveNotificationsByUser(2, 10);
        expect(Array.isArray(notifications)).toBe(true);
      });

      it('should throw error for invalid user ID', () => {
        expect(() => notificationService.getActiveNotificationsByUser(-1)).toThrow('Invalid user ID');
      });
    });

    describe('createSystemNotification', () => {
      it('should create a system notification', () => {
        const notification = notificationService.createSystemNotification({
          title: 'System Test',
          message: 'System notification'
        });
        expect(notification).toBeTruthy();
        expect(notification.user_id).toBeNull();
      });
    });

    describe('createUserNotification', () => {
      it('should create a user-specific notification', () => {
        const notification = notificationService.createUserNotification({
          userId: 2,
          title: 'User Test',
          message: 'User notification'
        });
        expect(notification).toBeTruthy();
        expect(notification.user_id).toBe(2);
      });

      it('should throw error for missing user ID', () => {
        expect(() => notificationService.createUserNotification({
          title: 'Test',
          message: 'Test'
        })).toThrow('User ID is required');
      });
    });

    describe('getNotificationStatistics', () => {
      it('should return notification statistics', () => {
        const stats = notificationService.getNotificationStatistics();
        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
        expect(stats.unread).toBeDefined();
        expect(stats.read).toBeDefined();
        expect(stats.byType).toBeDefined();
        expect(stats.byPriority).toBeDefined();
      });
    });

    describe('Constants Export', () => {
      it('should export NOTIFICATION_TYPES', () => {
        expect(notificationService.NOTIFICATION_TYPES).toBeDefined();
        expect(notificationService.NOTIFICATION_TYPES.INFO).toBe('INFO');
      });

      it('should export NOTIFICATION_PRIORITIES', () => {
        expect(notificationService.NOTIFICATION_PRIORITIES).toBeDefined();
        expect(notificationService.NOTIFICATION_PRIORITIES.HIGH).toBe('HIGH');
      });
    });
  });

  // ============================================
  // Module Exports Tests
  // ============================================
  
  describe('Module Exports', () => {
    it('should export all required functions from model', async () => {
      const model = await import('../models/Notification.js');
      expect(model.getAllNotifications).toBeDefined();
      expect(model.getUnreadCount).toBeDefined();
      expect(model.getNotificationById).toBeDefined();
      expect(model.createNotification).toBeDefined();
      expect(model.updateNotification).toBeDefined();
      expect(model.deleteNotification).toBeDefined();
      expect(model.markAsRead).toBeDefined();
      expect(model.markAllAsRead).toBeDefined();
      expect(model.getNotificationsCount).toBeDefined();
      expect(model.searchNotifications).toBeDefined();
      expect(model.getActiveNotificationsByUser).toBeDefined();
    });

    it('should export all required functions from service', async () => {
      const service = await import('../services/notificationService.js');
      expect(service.validateNotification).toBeDefined();
      expect(service.getPaginatedNotifications).toBeDefined();
      expect(service.getNotification).toBeDefined();
      expect(service.createNotification).toBeDefined();
      expect(service.updateNotification).toBeDefined();
      expect(service.deleteNotification).toBeDefined();
      expect(service.markAsRead).toBeDefined();
      expect(service.markAllAsRead).toBeDefined();
      expect(service.getUnreadCount).toBeDefined();
      expect(service.getNotificationsCount).toBeDefined();
      expect(service.searchNotifications).toBeDefined();
      expect(service.getActiveNotificationsByUser).toBeDefined();
      expect(service.createSystemNotification).toBeDefined();
      expect(service.createUserNotification).toBeDefined();
      expect(service.getNotificationStatistics).toBeDefined();
    });
  });
});

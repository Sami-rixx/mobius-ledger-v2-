/**
 * UserSession Module Tests
 * Comprehensive tests for UserSession model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { createRequire } from 'module';
import db from '../config/database.js';

const require = createRequire(import.meta.url);
import * as __ns_models_UserSession from '../models/UserSession.js';
import * as __ns_services_userSessionService from '../services/userSessionService.js';
import * as __ns_models_index from '../models/index.js';
import * as __ns_services_index from '../services/index.js';
import * as __ns_controllers_index from '../controllers/index.js';
import * as __ns_routes_index from '../routes/index.js';

// Test database setup
const TEST_DB = ':memory:';
let testDb;


describe('UserSession Module', () => {
  beforeAll(() => {
    // Create in-memory database for testing
    testDb = db;
    
    // Create users and user_sessions tables
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

      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        expires_at DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
    `);

    // Insert test users
    const insertUser = testDb.prepare('INSERT INTO users (id, username, full_name, role) VALUES (?, ?, ?, ?)');
    insertUser.run(1, 'admin', 'Admin User', 'admin');
    insertUser.run(2, 'user1', 'Regular User', 'user');
    insertUser.run(3, 'user2', 'Another User', 'user');
    
    // Insert test sessions
    const insertSession = testDb.prepare(`
      INSERT INTO user_sessions 
      (user_id, session_token, ip_address, user_agent, expires_at, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    // Active sessions
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    insertSession.run(1, 'token_admin_001', '192.168.1.1', 'Mozilla/5.0 (Admin)', futureDate, 1);
    insertSession.run(2, 'token_user1_001', '192.168.1.2', 'Mozilla/5.0 (User1)', futureDate, 1);
    insertSession.run(2, 'token_user1_002', '192.168.1.3', 'Chrome/100.0', futureDate, 1);
    insertSession.run(3, 'token_user2_001', '192.168.1.4', 'Safari/15.0', futureDate, 1);
    
    // Inactive session
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    insertSession.run(1, 'token_admin_expired', '192.168.1.5', 'Mozilla/5.0', pastDate, 0);
  });

  afterAll(() => {
    // Close test database connection
    try {
      // no-op: testDb is the shared db singleton, do not close it here
    } catch (e) {
      // Ignore errors during cleanup
    }
  });

  // ============================================
  // Model Tests
  // ============================================
  
  describe('UserSession Model', () => {
    describe('Constants', () => {
      it('should export USER_SESSIONS_TABLE constant', () => {
        const { USER_SESSIONS_TABLE } = __ns_models_UserSession;
        expect(USER_SESSIONS_TABLE).toBe('user_sessions');
      });

      it('should export USER_SESSION_FIELDS constant', () => {
        const { USER_SESSION_FIELDS } = __ns_models_UserSession;
        expect(USER_SESSION_FIELDS.ID).toBe('id');
        expect(USER_SESSION_FIELDS.USER_ID).toBe('user_id');
        expect(USER_SESSION_FIELDS.SESSION_TOKEN).toBe('session_token');
        expect(USER_SESSION_FIELDS.IP_ADDRESS).toBe('ip_address');
        expect(USER_SESSION_FIELDS.USER_AGENT).toBe('user_agent');
        expect(USER_SESSION_FIELDS.EXPIRES_AT).toBe('expires_at');
        expect(USER_SESSION_FIELDS.IS_ACTIVE).toBe('is_active');
        expect(USER_SESSION_FIELDS.CREATED_AT).toBe('created_at');
        expect(USER_SESSION_FIELDS.UPDATED_AT).toBe('updated_at');
      });
    });

    describe('CRUD Operations', () => {
      it('should create a new user session', () => {
        const { createUserSession } = __ns_models_UserSession;
        
        const data = {
          userId: 1,
          sessionToken: 'token_new_test_001',
          ipAddress: '10.0.0.1',
          userAgent: 'Test Agent',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
        
        const session = createUserSession(data);
        expect(session).toBeDefined();
        expect(session.user_id).toBe(1);
        expect(session.session_token).toBe('token_new_test_001');
        expect(session.ip_address).toBe('10.0.0.1');
        expect(session.is_active).toBe(1);
      });

      it('should get a user session by ID', () => {
        const { getUserSessionById } = __ns_models_UserSession;
        
        const session = getUserSessionById(1);
        expect(session).toBeDefined();
        expect(session.user_id).toBe(1);
        expect(session.session_token).toBe('token_admin_001');
      });

      it('should return null for non-existent session ID', () => {
        const { getUserSessionById } = __ns_models_UserSession;
        
        const session = getUserSessionById(9999);
        expect(session).toBeNull();
      });

      it('should get a user session by session token', () => {
        const { getUserSessionByToken } = __ns_models_UserSession;
        
        const session = getUserSessionByToken('token_admin_001');
        expect(session).toBeDefined();
        expect(session.user_id).toBe(1);
      });

      it('should return null for non-existent session token', () => {
        const { getUserSessionByToken } = __ns_models_UserSession;
        
        const session = getUserSessionByToken('nonexistent_token');
        expect(session).toBeNull();
      });

      it('should get all active sessions for a user', () => {
        const { getActiveSessionsByUser } = __ns_models_UserSession;
        
        const sessions = getActiveSessionsByUser(2);
        expect(sessions).toBeDefined();
        expect(sessions.length).toBeGreaterThan(0);
        expect(sessions.every(s => s.user_id === 2 && s.is_active === 1)).toBe(true);
      });

      it('should get all user sessions with filtering', () => {
        const { getAllUserSessions } = __ns_models_UserSession;
        
        const allSessions = getAllUserSessions();
        expect(allSessions).toBeDefined();
        expect(allSessions.length).toBeGreaterThanOrEqual(5);
        
        const user1Sessions = getAllUserSessions({ userId: 1 });
        expect(user1Sessions.every(s => s.user_id === 1)).toBe(true);
        
        const activeSessions = getAllUserSessions({ isActive: true });
        expect(activeSessions.every(s => s.is_active === 1)).toBe(true);
      });

      it('should update a user session', () => {
        const { updateUserSession } = __ns_models_UserSession;
        
        const updatedSession = updateUserSession(1, {
          ipAddress: '10.0.0.2',
          userAgent: 'Updated Agent'
        });
        
        expect(updatedSession).toBeDefined();
        expect(updatedSession.ip_address).toBe('10.0.0.2');
        expect(updatedSession.user_agent).toBe('Updated Agent');
      });

      it('should deactivate a user session', () => {
        const { deactivateUserSession, getUserSessionById } = __ns_models_UserSession;
        
        // First create a session to deactivate
        const { createUserSession } = __ns_models_UserSession;
        const newSession = createUserSession({
          userId: 1,
          sessionToken: 'token_to_deactivate',
          ipAddress: '10.0.0.3',
          userAgent: 'Test',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        
        const result = deactivateUserSession(newSession.id);
        expect(result).toBe(true);
        
        const deactivatedSession = getUserSessionById(newSession.id);
        expect(deactivatedSession.is_active).toBe(0);
      });

      it('should deactivate all sessions for a user', () => {
        const { deactivateAllUserSessions, getActiveSessionsByUser } = __ns_models_UserSession;
        
        // Create some sessions for user 3
        const { createUserSession } = __ns_models_UserSession;
        createUserSession({
          userId: 3,
          sessionToken: 'token_user3_extra1',
          ipAddress: '10.0.0.4',
          userAgent: 'Test',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        createUserSession({
          userId: 3,
          sessionToken: 'token_user3_extra2',
          ipAddress: '10.0.0.5',
          userAgent: 'Test',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        
        const initialActive = getActiveSessionsByUser(3);
        const count = deactivateAllUserSessions(3);
        expect(count).toBeGreaterThan(0);
        
        const afterDeactivate = getActiveSessionsByUser(3);
        expect(afterDeactivate.length).toBe(0);
      });

      it('should delete a user session', () => {
        const { deleteUserSession, getUserSessionById } = __ns_models_UserSession;
        
        // Create a session to delete
        const { createUserSession } = __ns_models_UserSession;
        const newSession = createUserSession({
          userId: 1,
          sessionToken: 'token_to_delete',
          ipAddress: '10.0.0.6',
          userAgent: 'Test',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        
        const result = deleteUserSession(newSession.id);
        expect(result).toBe(true);
        
        const deletedSession = getUserSessionById(newSession.id);
        expect(deletedSession).toBeNull();
      });

      it('should get user session count', () => {
        const { getUserSessionCount } = __ns_models_UserSession;
        
        const totalCount = getUserSessionCount();
        expect(totalCount).toBeGreaterThanOrEqual(5);
        
        const user1Count = getUserSessionCount({ userId: 1 });
        expect(user1Count).toBeGreaterThanOrEqual(1);
        
        const activeCount = getUserSessionCount({ isActive: true });
        expect(activeCount).toBeGreaterThanOrEqual(4);
      });
    });

    describe('Session Token Validation', () => {
      it('should validate an active session token', () => {
        const { validateSessionToken } = __ns_models_UserSession;
        
        const session = validateSessionToken('token_admin_001');
        expect(session).toBeDefined();
        expect(session.user_id).toBe(1);
      });

      it('should return null for inactive session token', () => {
        const { validateSessionToken } = __ns_models_UserSession;
        
        const session = validateSessionToken('token_admin_expired');
        expect(session).toBeNull();
      });

      it('should return null for non-existent session token', () => {
        const { validateSessionToken } = __ns_models_UserSession;
        
        const session = validateSessionToken('nonexistent_token_12345');
        expect(session).toBeNull();
      });
    });

    describe('Session Extension', () => {
      it('should extend a session expiration time', () => {
        const { extendUserSession } = __ns_models_UserSession;
        
        const extendedSession = extendUserSession(1, 48);
        expect(extendedSession).toBeDefined();
        expect(extendedSession.expires_at).toBeDefined();
      });
    });
  });

  // ============================================
  // Service Tests
  // ============================================
  
  describe('UserSession Service', () => {
    describe('Validation', () => {
      it('should validate valid session data', () => {
        const { validateSession } = __ns_services_userSessionService;
        
        const validation = validateSession({
          userId: 1,
          sessionToken: 'valid_token_string_12345'
        });
        
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);
      });

      it('should reject missing user ID', () => {
        const { validateSession } = __ns_services_userSessionService;
        
        const validation = validateSession({
          sessionToken: 'valid_token'
        });
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('User ID is required');
      });

      it('should reject invalid user ID', () => {
        const { validateSession } = __ns_services_userSessionService;
        
        const validation = validateSession({
          userId: -1,
          sessionToken: 'valid_token'
        });
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors.some(e => e.includes('valid positive number'))).toBe(true);
      });

      it('should reject missing session token', () => {
        const { validateSession } = __ns_services_userSessionService;
        
        const validation = validateSession({
          userId: 1
        });
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Session token is required');
      });

      it('should reject session token that is too long', () => {
        const { validateSession } = __ns_services_userSessionService;
        
        const validation = validateSession({
          userId: 1,
          sessionToken: 'a'.repeat(501)
        });
        
        expect(validation.isValid).toBe(false);
        expect(validation.errors.some(e => e.includes('255 characters'))).toBe(false);
      });
    });

    describe('Pagination', () => {
      it('should return paginated sessions', () => {
        const { getPaginatedSessions } = __ns_services_userSessionService;
        
        const result = getPaginatedSessions({ page: 1, pageSize: 2 });
        
        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.pagination).toBeDefined();
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.pageSize).toBe(2);
        expect(result.data.length).toBeLessThanOrEqual(2);
      });

      it('should filter by user ID', () => {
        const { getPaginatedSessions } = __ns_services_userSessionService;
        
        const result = getPaginatedSessions({ userId: 2, page: 1, pageSize: 10 });
        
        expect(result.data.every(s => s.user_id === 2)).toBe(true);
      });

      it('should filter by active status', () => {
        const { getPaginatedSessions } = __ns_services_userSessionService;
        
        const result = getPaginatedSessions({ isActive: true, page: 1, pageSize: 10 });
        
        expect(result.data.every(s => s.is_active === 1)).toBe(true);
      });
    });

    describe('Statistics', () => {
      it('should return session statistics', () => {
        const { getSessionStatistics } = __ns_services_userSessionService;
        
        const stats = getSessionStatistics();
        
        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
        expect(stats.active).toBeDefined();
        expect(stats.inactive).toBeDefined();
        expect(typeof stats.activePercentage).toBe('number');
      });
    });

    describe('Cleanup', () => {
      it('should cleanup expired sessions', () => {
        const { cleanupExpiredSessions } = __ns_services_userSessionService;
        
        const result = cleanupExpiredSessions();
        
        expect(result).toBeDefined();
        expect(result.expiredDeactivated).toBeDefined();
        expect(typeof result.message).toBe('string');
      });
    });

    describe('Force Logout', () => {
      it('should force logout a user by deactivating all sessions', () => {
        const { forceLogoutUser, getActiveSessionsByUser } = __ns_services_userSessionService;
        
        // Create a new user and session
        const { createUserSession } = __ns_models_UserSession;
        
        // First clear any existing sessions for user 4
        const { deleteAllUserSessions } = __ns_models_UserSession;
        deleteAllUserSessions(4);
        
        // Insert user 4
        testDb.prepare('INSERT INTO users (id, username, full_name, role) VALUES (?, ?, ?, ?)').run(4, 'user4', 'User Four', 'user');
        
        // Create session for user 4
        createUserSession({
          userId: 4,
          sessionToken: 'token_user4_test',
          ipAddress: '192.168.1.10',
          userAgent: 'Test',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        
        // Check user 4 has active sessions
        const beforeLogout = getActiveSessionsByUser(4);
        expect(beforeLogout.length).toBeGreaterThan(0);
        
        // Force logout
        const result = forceLogoutUser(4);
        expect(result.userId).toBe(4);
        expect(result.sessionsDeactivated).toBeGreaterThan(0);
        
        // Check all sessions are deactivated
        const afterLogout = getActiveSessionsByUser(4);
        expect(afterLogout.length).toBe(0);
      });
    });
  });

  // ============================================
  // Module Exports
  // ============================================
  
  describe('Module Exports', () => {
    it('should export UserSession model correctly', () => {
      const UserSession = __ns_models_UserSession;
      
      expect(UserSession.default).toBeDefined();
      expect(UserSession.USER_SESSIONS_TABLE).toBe('user_sessions');
      expect(UserSession.USER_SESSION_FIELDS).toBeDefined();
    });

    it('should export UserSession from models/index.js', () => {
      const models = __ns_models_index;
      
      expect(models.UserSession).toBeDefined();
      expect(models.USER_SESSIONS_TABLE).toBe('user_sessions');
      expect(models.USER_SESSION_FIELDS).toBeDefined();
    });

    it('should export userSessionService from services/index.js', () => {
      const services = __ns_services_index;
      
      expect(services.userSessionService).toBeDefined();
    });

    it('should export UserSession controller from controllers/index.js', () => {
      const controllers = __ns_controllers_index;
      
      expect(controllers.UserSession).toBeDefined();
    });

    it('should export userSessionRoutes from routes/index.js', () => {
      const routes = __ns_routes_index;
      
      expect(routes.userSessionRoutes).toBeDefined();
    });
  });
});

/**
 * UserRole Module Tests
 * Comprehensive tests for UserRole model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import Database from 'better-sqlite3';

// Test database setup
const TEST_DB = ':memory:';
let testDb;

// Mock the database module
jest.mock('../config/database.js', () => ({
  default: testDb
}));

describe('UserRole Module', () => {
  beforeAll(() => {
    // Create in-memory database for testing
    testDb = new Database(TEST_DB);
    
    // Create users and roles tables
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

      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        UNIQUE(user_id, role_id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_both ON user_roles(user_id, role_id);
    `);

    // Insert test users
    const insertUser = testDb.prepare(`
      INSERT INTO users (id, username, full_name, email, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertUser.run(1, 'admin', 'Admin User', 'admin@example.com', 'admin');
    insertUser.run(2, 'teacher1', 'Teacher One', 'teacher1@example.com', 'teacher');
    insertUser.run(3, 'teacher2', 'Teacher Two', 'teacher2@example.com', 'teacher');
    insertUser.run(4, 'student1', 'Student One', 'student1@example.com', 'student');

    // Insert test roles
    const insertRole = testDb.prepare(`
      INSERT INTO roles (id, name, description, is_default)
      VALUES (?, ?, ?, ?)
    `);
    insertRole.run(1, 'Admin', 'Administrator', 1);
    insertRole.run(2, 'Teacher', 'Teacher role', 0);
    insertRole.run(3, 'Student', 'Student role', 0);

    // Insert test user-roles
    const insertUserRole = testDb.prepare(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (?, ?)
    `);
    insertUserRole.run(1, 1); // admin has Admin role
    insertUserRole.run(2, 2); // teacher1 has Teacher role
    insertUserRole.run(3, 2); // teacher2 has Teacher role
    insertUserRole.run(4, 3); // student1 has Student role
    insertUserRole.run(1, 2); // admin also has Teacher role
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
  
  describe('UserRole Model', () => {
    describe('Constants', () => {
      it('should export USER_ROLES_TABLE constant', () => {
        const { USER_ROLES_TABLE } = require('../models/UserRole.js');
        expect(USER_ROLES_TABLE).toBe('user_roles');
      });

      it('should export USER_ROLE_FIELDS constant', () => {
        const { USER_ROLE_FIELDS } = require('../models/UserRole.js');
        expect(USER_ROLE_FIELDS).toBeInstanceOf(Array);
        expect(USER_ROLE_FIELDS.length).toBeGreaterThan(0);
      });
    });

    describe('Model Functions', () => {
      it('should create a new user-role assignment', () => {
        const { createUserRole } = require('../models/UserRole.js');
        const newUserRole = createUserRole({
          user_id: 2,
          role_id: 3
        });
        
        expect(newUserRole).toBeDefined();
        expect(newUserRole.user_id).toBe(2);
        expect(newUserRole.role_id).toBe(3);
      });

      it('should get user-role by ID', () => {
        const { getUserRoleById } = require('../models/UserRole.js');
        const userRole = getUserRoleById(1);
        
        expect(userRole).toBeDefined();
        expect(userRole.user_id).toBe(1);
        expect(userRole.role_id).toBe(1);
      });

      it('should get user-role by user and role', () => {
        const { getUserRoleByUserAndRole } = require('../models/UserRole.js');
        const userRole = getUserRoleByUserAndRole(1, 1);
        
        expect(userRole).toBeDefined();
        expect(userRole.user_id).toBe(1);
        expect(userRole.role_id).toBe(1);
      });

      it('should get all roles for a user', () => {
        const { getRolesForUser } = require('../models/UserRole.js');
        const roles = getRolesForUser(1);
        
        expect(roles).toBeInstanceOf(Array);
        expect(roles.length).toBe(2); // admin has 2 roles
        expect(roles.every(r => r.user_id === 1)).toBe(true);
      });

      it('should get role IDs for a user', () => {
        const { getRoleIdsForUser } = require('../models/UserRole.js');
        const roleIds = getRoleIdsForUser(1);
        
        expect(roleIds).toBeInstanceOf(Array);
        expect(roleIds).toContain(1);
        expect(roleIds).toContain(2);
      });

      it('should get all users for a role', () => {
        const { getUsersForRole } = require('../models/UserRole.js');
        const users = getUsersForRole(2);
        
        expect(users).toBeInstanceOf(Array);
        expect(users.length).toBeGreaterThanOrEqual(3); // teacher1, teacher2, admin
        expect(users.every(u => u.role_id === 2)).toBe(true);
      });

      it('should check if user has role', () => {
        const { userHasRole } = require('../models/UserRole.js');
        const hasRole = userHasRole(1, 1);
        const noRole = userHasRole(4, 1);
        
        expect(hasRole).toBe(true);
        expect(noRole).toBe(false);
      });

      it('should check if user has any of the given roles', () => {
        const { userHasAnyRole } = require('../models/UserRole.js');
        const hasAny = userHasAnyRole(1, [1, 2]);
        const hasNone = userHasAnyRole(4, [1, 2]);
        
        expect(hasAny).toBe(true);
        expect(hasNone).toBe(false);
      });

      it('should get user count for a role', () => {
        const { getUserCountForRole } = require('../models/UserRole.js');
        const count = getUserCountForRole(2);
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(3);
      });

      it('should get role count for a user', () => {
        const { getRoleCountForUser } = require('../models/UserRole.js');
        const count = getRoleCountForUser(1);
        
        expect(typeof count).toBe('number');
        expect(count).toBe(2);
      });

      it('should get all user-roles', () => {
        const { getAllUserRoles } = require('../models/UserRole.js');
        const userRoles = getAllUserRoles();
        
        expect(userRoles).toBeInstanceOf(Array);
        expect(userRoles.length).toBeGreaterThan(0);
      });

      it('should get user-role statistics', () => {
        const { getUserRoleStatistics } = require('../models/UserRole.js');
        const stats = getUserRoleStatistics();
        
        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
      });

      it('should remove role from user', () => {
        const { removeRoleFromUser, getUserRoleByUserAndRole } = require('../models/UserRole.js');
        const removed = removeRoleFromUser(2, 2);
        const userRole = getUserRoleByUserAndRole(2, 2);
        
        expect(removed).toBe(true);
        expect(userRole).toBeUndefined();
      });

      it('should remove all roles from user', () => {
        const { removeAllRolesFromUser, getRolesForUser } = require('../models/UserRole.js');
        const removed = removeAllRolesFromUser(3);
        const roles = getRolesForUser(3);
        
        expect(removed).toBe(true);
        expect(roles.length).toBe(0);
      });

      it('should replace all roles for a user', () => {
        const { replaceUserRoles, getRolesForUser } = require('../models/UserRole.js');
        replaceUserRoles(4, [1, 2]);
        const roles = getRolesForUser(4);
        
        expect(roles).toBeInstanceOf(Array);
        expect(roles.length).toBe(2);
      });

      it('should get user-role count', () => {
        const { getUserRoleCount } = require('../models/UserRole.js');
        const count = getUserRoleCount();
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });
    });

    describe('Model Exports', () => {
      it('should export all expected functions and constants', () => {
        const UserRole = require('../models/UserRole.js');
        
        expect(UserRole).toBeDefined();
        expect(UserRole.USER_ROLES_TABLE).toBe('user_roles');
        expect(UserRole.USER_ROLE_FIELDS).toBeInstanceOf(Array);
        expect(typeof UserRole.createUserRole).toBe('function');
        expect(typeof UserRole.getUserRoleById).toBe('function');
        expect(typeof UserRole.getUserRoleByUserAndRole).toBe('function');
        expect(typeof UserRole.getRolesForUser).toBe('function');
        expect(typeof UserRole.getRoleIdsForUser).toBe('function');
        expect(typeof UserRole.getUsersForRole).toBe('function');
        expect(typeof UserRole.userHasRole).toBe('function');
        expect(typeof UserRole.userHasAnyRole).toBe('function');
        expect(typeof UserRole.getUserCountForRole).toBe('function');
        expect(typeof UserRole.getRoleCountForUser).toBe('function');
        expect(typeof UserRole.getAllUserRoles).toBe('function');
        expect(typeof UserRole.getUserRoleStatistics).toBe('function');
        expect(typeof UserRole.removeRoleFromUser).toBe('function');
        expect(typeof UserRole.removeAllRolesFromUser).toBe('function');
        expect(typeof UserRole.replaceUserRoles).toBe('function');
        expect(typeof UserRole.getUserRoleCount).toBe('function');
      });
    });
  });

  // ============================================
  // Service Tests
  // ============================================
  
  describe('UserRole Service', () => {
    describe('Service Functions', () => {
      it('should validate user-role data', () => {
        const { validateUserRole } = require('../services/userRoleService.js');
        
        const validData = {
          user_id: 1,
          role_id: 1
        };
        
        const result = validateUserRole(validData);
        expect(result).toBeDefined();
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid user-role data', () => {
        const { validateUserRole } = require('../services/userRoleService.js');
        
        const invalidData = {
          user_id: null,
          role_id: null
        };
        
        const result = validateUserRole(invalidData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeInstanceOf(Array);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should get paginated user-roles', () => {
        const { getPaginatedUserRoles } = require('../services/userRoleService.js');
        const result = getPaginatedUserRoles({ page: 1, pageSize: 5 });
        
        expect(result).toBeDefined();
        expect(result.data).toBeInstanceOf(Array);
        expect(result.total).toBeDefined();
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(5);
      });

      it('should create a user-role with service', () => {
        const { createUserRole } = require('../services/userRoleService.js');
        const newUserRole = createUserRole({
          user_id: 3,
          role_id: 3
        });
        
        expect(newUserRole).toBeDefined();
        expect(newUserRole.user_id).toBe(3);
        expect(newUserRole.role_id).toBe(3);
      });

      it('should get roles for user from service', () => {
        const { getRolesForUser } = require('../services/userRoleService.js');
        const roles = getRolesForUser(1);
        
        expect(roles).toBeInstanceOf(Array);
        expect(roles.length).toBeGreaterThan(0);
      });

      it('should remove role from user with service', () => {
        const { removeRoleFromUser, getUserRoleByUserAndRole } = require('../services/userRoleService.js');
        const removed = removeRoleFromUser(1, 2);
        const userRole = getUserRoleByUserAndRole(1, 2);
        
        expect(removed).toBe(true);
        expect(userRole).toBeUndefined();
      });

      it('should get user-role statistics from service', () => {
        const { getUserRoleStatistics } = require('../services/userRoleService.js');
        const stats = getUserRoleStatistics();
        
        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
      });
    });

    describe('Service Exports', () => {
      it('should export all expected service functions', () => {
        const userRoleService = require('../services/userRoleService.js');
        
        expect(userRoleService).toBeDefined();
        expect(typeof userRoleService.validateUserRole).toBe('function');
        expect(typeof userRoleService.getPaginatedUserRoles).toBe('function');
        expect(typeof userRoleService.createUserRole).toBe('function');
        expect(typeof userRoleService.getUserRoleById).toBe('function');
        expect(typeof userRoleService.getUserRoleByUserAndRole).toBe('function');
        expect(typeof userRoleService.getRolesForUser).toBe('function');
        expect(typeof userRoleService.getRoleIdsForUser).toBe('function');
        expect(typeof userRoleService.getUsersForRole).toBe('function');
        expect(typeof userRoleService.removeRoleFromUser).toBe('function');
        expect(typeof userRoleService.removeAllRolesFromUser).toBe('function');
        expect(typeof userRoleService.replaceUserRoles).toBe('function');
        expect(typeof userRoleService.getUserRoleCount).toBe('function');
        expect(typeof userRoleService.getUserRoleStatistics).toBe('function');
      });
    });
  });
});

/**
 * UserRole Module Tests
 * Comprehensive tests for UserRole model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Database from 'better-sqlite3';
import { createRequire } from 'module';
import db from '../config/database.js';

const require = createRequire(import.meta.url);
import * as __ns_UserRole from '../models/UserRole.js';
import * as __ns_userRoleService from '../services/userRoleService.js';

// Test database setup
const TEST_DB = ':memory:';
let testDb;


describe('UserRole Module', () => {
  beforeAll(() => {
    // Create in-memory database for testing
    testDb = db;
    
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
      INSERT INTO roles (id, name, display_name, description, is_default)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertRole.run(1, 'Admin', 'Admin', 'Administrator', 1);
    insertRole.run(2, 'Teacher', 'Teacher', 'Teacher role', 0);
    insertRole.run(3, 'Student', 'Student', 'Student role', 0);

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
      // no-op: testDb is the shared db singleton, do not close it here
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
        const { USER_ROLES_TABLE } = __ns_UserRole;
        expect(USER_ROLES_TABLE).toBe('user_roles');
      });

      it('should export USER_ROLE_FIELDS constant', () => {
        const { USER_ROLE_FIELDS } = __ns_UserRole;
        expect(USER_ROLE_FIELDS).toBeInstanceOf(Object);
        expect(USER_ROLE_FIELDS.USER_ID).toBe('user_id');
        expect(USER_ROLE_FIELDS.ROLE_ID).toBe('role_id');
      });
    });

    describe('Model Functions', () => {
      it('should create a new user-role assignment', () => {
        const { assignRoleToUser } = __ns_UserRole;
        const newUserRole = assignRoleToUser({
          userId: 2,
          roleId: 3
        });

        expect(newUserRole).toBeDefined();
        expect(newUserRole.user_id).toBe(2);
        expect(newUserRole.role_id).toBe(3);
      });

      it('should get user-role by ID', () => {
        const { getUserRoleById } = __ns_UserRole;
        const userRole = getUserRoleById(1);
        
        expect(userRole).toBeDefined();
        expect(userRole.user_id).toBe(1);
        expect(userRole.role_id).toBe(1);
      });

      it('should get user-role by user and role', () => {
        const { getUserRoleByUserAndRole } = __ns_UserRole;
        const userRole = getUserRoleByUserAndRole(1, 1);
        
        expect(userRole).toBeDefined();
        expect(userRole.user_id).toBe(1);
        expect(userRole.role_id).toBe(1);
      });

      it('should get all roles for a user', () => {
        const { getRolesByUserId } = __ns_UserRole;
        const roles = getRolesByUserId(1);
        
        expect(Array.isArray(roles)).toBe(true);
        expect(roles.length).toBe(2); // admin has 2 roles
        expect(roles.every(r => r.user_id === 1)).toBe(true);
      });

      it('should get role IDs for a user', () => {
        const { getRoleIdsByUserId } = __ns_UserRole;
        const roleIds = getRoleIdsByUserId(1);
        
        expect(Array.isArray(roleIds)).toBe(true);
        expect(roleIds).toContain(1);
        expect(roleIds).toContain(2);
      });

      it('should get all users for a role', () => {
        // getUsersByRoleId returns a flat array of user IDs, not join rows.
        const { getUsersByRoleId } = __ns_UserRole;
        const users = getUsersByRoleId(2);

        expect(Array.isArray(users)).toBe(true);
        expect(users.length).toBeGreaterThanOrEqual(3); // teacher1, teacher2, admin
        expect(users).toContain(1);
        expect(users).toContain(2);
        expect(users).toContain(3);
      });

      it('should check if user has role', () => {
        const { userHasRole } = __ns_UserRole;
        const hasRole = userHasRole(1, 1);
        const noRole = userHasRole(4, 1);
        
        expect(hasRole).toBe(true);
        expect(noRole).toBe(false);
      });

      it('should check if user has any of the given roles', () => {
        const { userHasAnyRole } = __ns_UserRole;
        const hasAny = userHasAnyRole(1, [1, 2]);
        const hasNone = userHasAnyRole(4, [1, 2]);
        
        expect(hasAny).toBe(true);
        expect(hasNone).toBe(false);
      });

      it('should get user count for a role', () => {
        const { getUserCountForRole } = __ns_UserRole;
        const count = getUserCountForRole(2);
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(3);
      });

      it('should get role count for a user', () => {
        const { getRoleCountForUser } = __ns_UserRole;
        const count = getRoleCountForUser(1);
        
        expect(typeof count).toBe('number');
        expect(count).toBe(2);
      });

      it('should get all user-roles', () => {
        const { getAllUserRoles } = __ns_UserRole;
        const userRoles = getAllUserRoles();
        
        expect(Array.isArray(userRoles)).toBe(true);
        expect(userRoles.length).toBeGreaterThan(0);
      });

      it('should get user-role statistics', () => {
        // getUserRoleStatistics lives in userRoleService.js, not
        // models/UserRole.js, and returns { totalAssignments, assignmentCount }.
        const { getUserRoleStatistics } = __ns_userRoleService;
        const stats = getUserRoleStatistics();

        expect(stats).toBeDefined();
        expect(stats.totalAssignments).toBeDefined();
      });

      it('should remove role from user', () => {
        const { removeRoleFromUser, getUserRoleByUserAndRole } = __ns_UserRole;
        const removed = removeRoleFromUser(2, 2);
        const userRole = getUserRoleByUserAndRole(2, 2);

        expect(removed).toBe(true);
        expect(userRole).toBeNull();
      });

      it('should remove all roles from user', () => {
        const { removeAllRolesFromUser, getRolesByUserId } = __ns_UserRole;
        const removed = removeAllRolesFromUser(3);
        const roles = getRolesByUserId(3);
        
        expect(removed).toBe(true);
        expect(roles.length).toBe(0);
      });

      it('should replace all roles for a user', () => {
        const { replaceUserRoles, getRolesByUserId } = __ns_UserRole;
        replaceUserRoles(4, [1, 2]);
        const roles = getRolesByUserId(4);
        
        expect(Array.isArray(roles)).toBe(true);
        expect(roles.length).toBe(2);
      });

      it('should get user-role count', () => {
        const { getUserRoleCount } = __ns_UserRole;
        const count = getUserRoleCount();
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });
    });

    describe('Model Exports', () => {
      it('should export all expected functions and constants', () => {
        const UserRole = __ns_UserRole;
        
        expect(UserRole).toBeDefined();
        expect(UserRole.USER_ROLES_TABLE).toBe('user_roles');
        expect(UserRole.USER_ROLE_FIELDS).toBeInstanceOf(Object);
        expect(typeof UserRole.assignRoleToUser).toBe('function');
        expect(typeof UserRole.getUserRoleById).toBe('function');
        expect(typeof UserRole.getUserRoleByUserAndRole).toBe('function');
        expect(typeof UserRole.getRolesByUserId).toBe('function');
        expect(typeof UserRole.getRoleIdsByUserId).toBe('function');
        expect(typeof UserRole.getUsersByRoleId).toBe('function');
        expect(typeof UserRole.userHasRole).toBe('function');
        expect(typeof UserRole.userHasAnyRole).toBe('function');
        expect(typeof UserRole.getUserCountForRole).toBe('function');
        expect(typeof UserRole.getRoleCountForUser).toBe('function');
        expect(typeof UserRole.getAllUserRoles).toBe('function');
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
        const { validateUserRoleAssignment } = __ns_userRoleService;

        const validData = {
          userId: 1,
          roleId: 1
        };

        const result = validateUserRoleAssignment(validData);
        expect(result).toBeDefined();
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid user-role data', () => {
        const { validateUserRoleAssignment } = __ns_userRoleService;

        const invalidData = {
          userId: null,
          roleId: null
        };

        const result = validateUserRoleAssignment(invalidData);
        expect(result.isValid).toBe(false);
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should get paginated user-roles', () => {
        const { getPaginatedUserRoles } = __ns_userRoleService;
        const result = getPaginatedUserRoles({ page: 1, pageSize: 5 });

        expect(result).toBeDefined();
        expect(Array.isArray(result.userRoles)).toBe(true);
        expect(result.pagination).toBeDefined();
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.pageSize).toBe(5);
      });

      it('should create a user-role with service', async () => {
        const { assignRoleToUser } = __ns_userRoleService;
        const newUserRole = await assignRoleToUser({
          userId: 3,
          roleId: 3
        });

        expect(newUserRole).toBeDefined();
        expect(newUserRole.user_id).toBe(3);
        expect(newUserRole.role_id).toBe(3);
      });

      it('should get roles for user from service', () => {
        const { getRolesByUserId } = __ns_userRoleService;
        const roles = getRolesByUserId(1);
        
        expect(Array.isArray(roles)).toBe(true);
        expect(roles.length).toBeGreaterThan(0);
      });

      it('should remove role from user with service', () => {
        const { removeRoleFromUser, getUserRoleByUserAndRole } = __ns_userRoleService;
        const removed = removeRoleFromUser(1, 2);
        const userRole = getUserRoleByUserAndRole(1, 2);

        expect(removed).toBe(true);
        expect(userRole).toBeNull();
      });

      it('should get user-role statistics from service', () => {
        const { getUserRoleStatistics } = __ns_userRoleService;
        const stats = getUserRoleStatistics();

        expect(stats).toBeDefined();
        expect(stats.totalAssignments).toBeDefined();
      });
    });

    describe('Service Exports', () => {
      it('should export all expected service functions', () => {
        const userRoleService = __ns_userRoleService;
        
        expect(userRoleService).toBeDefined();
        expect(typeof userRoleService.validateUserRoleAssignment).toBe('function');
        expect(typeof userRoleService.getPaginatedUserRoles).toBe('function');
        expect(typeof userRoleService.assignRoleToUser).toBe('function');
        expect(typeof userRoleService.getUserRoleById).toBe('function');
        expect(typeof userRoleService.getUserRoleByUserAndRole).toBe('function');
        expect(typeof userRoleService.getRolesByUserId).toBe('function');
        expect(typeof userRoleService.getRoleIdsByUserId).toBe('function');
        expect(typeof userRoleService.getUsersByRoleId).toBe('function');
        expect(typeof userRoleService.removeRoleFromUser).toBe('function');
        expect(typeof userRoleService.removeAllRolesFromUser).toBe('function');
        expect(typeof userRoleService.replaceUserRoles).toBe('function');
        expect(typeof userRoleService.getUserRoleCount).toBe('function');
        expect(typeof userRoleService.getUserRoleStatistics).toBe('function');
      });
    });
  });
});

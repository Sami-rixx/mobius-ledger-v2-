/**
 * RolePermission Module Tests
 * Comprehensive tests for RolePermission model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import Database from 'better-sqlite3';
import RolePermission from '../models/RolePermission.js';
import rolePermissionService from '../services/rolePermissionService.js';

// Test database setup - must be at top level for ESM mocking to work
const TEST_DB = ':memory:';
const testDb = new Database(TEST_DB);

// Mock the database module at top level so all dynamic imports get the mock
jest.mock('../config/database.js', () => ({
  default: testDb
}));

describe('RolePermission Module', () => {
  beforeAll(() => {
    
    // Create permissions and roles tables
    testDb.exec(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        module TEXT NOT NULL,
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

      CREATE TABLE IF NOT EXISTS role_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        UNIQUE(role_id, permission_id)
      );

      CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
      CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
      CREATE INDEX IF NOT EXISTS idx_role_permissions_both ON role_permissions(role_id, permission_id);
    `);

    // Insert test permissions
    const insertPermission = testDb.prepare(`
      INSERT INTO permissions (id, name, description, module)
      VALUES (?, ?, ?, ?)
    `);
    insertPermission.run(1, 'create_student', 'Create new student', 'students');
    insertPermission.run(2, 'read_student', 'View student details', 'students');
    insertPermission.run(3, 'update_student', 'Update student information', 'students');
    insertPermission.run(4, 'delete_student', 'Delete student record', 'students');
    insertPermission.run(5, 'view_reports', 'View financial reports', 'reports');
    insertPermission.run(6, 'manage_classes', 'Manage class information', 'classes');

    // Insert test roles
    const insertRole = testDb.prepare(`
      INSERT INTO roles (id, name, description)
      VALUES (?, ?, ?)
    `);
    insertRole.run(1, 'Admin', 'Administrator with full access');
    insertRole.run(2, 'Teacher', 'Teacher role with limited access');
    insertRole.run(3, 'Student', 'Student role with read-only access');

    // Insert test role-permissions
    const insertRolePermission = testDb.prepare(`
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (?, ?)
    `);
    // Admin has all permissions
    insertRolePermission.run(1, 1);
    insertRolePermission.run(1, 2);
    insertRolePermission.run(1, 3);
    insertRolePermission.run(1, 4);
    insertRolePermission.run(1, 5);
    insertRolePermission.run(1, 6);
    // Teacher has student CRUD and view reports
    insertRolePermission.run(2, 1);
    insertRolePermission.run(2, 2);
    insertRolePermission.run(2, 3);
    insertRolePermission.run(2, 5);
    // Student has only read access
    insertRolePermission.run(3, 2);
    insertRolePermission.run(3, 5);
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
  
  describe('RolePermission Model', () => {
    describe('Constants', () => {
      it('should export ROLE_PERMISSIONS_TABLE constant', () => {
        expect(RolePermission.ROLE_PERMISSIONS_TABLE).toBe('role_permissions');
      });

      it('should export ROLE_PERMISSION_FIELDS constant', () => {
        expect(RolePermission.ROLE_PERMISSION_FIELDS).toBeInstanceOf(Array);
        expect(RolePermission.ROLE_PERMISSION_FIELDS.length).toBeGreaterThan(0);
      });
    });

    describe('Model Functions', () => {
      it('should create a new role-permission assignment', () => {
        const newRolePermission = RolePermission.createRolePermission({
          role_id: 2,
          permission_id: 6
        });
        
        expect(newRolePermission).toBeDefined();
        expect(newRolePermission.role_id).toBe(2);
        expect(newRolePermission.permission_id).toBe(6);
      });

      it('should get role-permission by ID', () => {
        const rolePermission = RolePermission.getRolePermissionById(1);
        
        expect(rolePermission).toBeDefined();
        expect(rolePermission.role_id).toBe(1);
        expect(rolePermission.permission_id).toBe(1);
      });

      it('should get role-permission by role and permission', () => {
        const rolePermission = RolePermission.getRolePermissionByRoleAndPermission(1, 1);
        
        expect(rolePermission).toBeDefined();
        expect(rolePermission.role_id).toBe(1);
        expect(rolePermission.permission_id).toBe(1);
      });

      it('should get all permissions for a role', () => {
        const permissions = RolePermission.getPermissionsForRole(1);
        
        expect(permissions).toBeInstanceOf(Array);
        expect(permissions.length).toBe(6); // Admin has all 6 permissions
        expect(permissions.every(p => p.role_id === 1)).toBe(true);
      });

      it('should get permission IDs for a role', () => {
        const permissionIds = RolePermission.getPermissionIdsForRole(1);
        
        expect(permissionIds).toBeInstanceOf(Array);
        expect(permissionIds.length).toBe(6);
        expect(permissionIds).toContain(1);
        expect(permissionIds).toContain(2);
      });

      it('should get all roles for a permission', () => {
        const roles = RolePermission.getRolesForPermission(2);
        
        expect(roles).toBeInstanceOf(Array);
        expect(roles.length).toBeGreaterThanOrEqual(3); // All roles have read_student
        expect(roles.every(r => r.permission_id === 2)).toBe(true);
      });

      it('should check if role has permission', () => {
        const hasPermission = RolePermission.roleHasPermission(1, 1);
        const noPermission = RolePermission.roleHasPermission(3, 1);
        
        expect(hasPermission).toBe(true);
        expect(noPermission).toBe(false);
      });

      it('should check if role has any of the given permissions', () => {
        const hasAny = RolePermission.roleHasAnyPermission(2, [1, 2, 3]);
        const hasNone = RolePermission.roleHasAnyPermission(3, [1, 3, 4, 6]);
        
        expect(hasAny).toBe(true);
        expect(hasNone).toBe(false);
      });

      it('should get permission count for a role', () => {
        const count = RolePermission.getPermissionCountForRole(1);
        
        expect(typeof count).toBe('number');
        expect(count).toBe(6);
      });

      it('should get role count for a permission', () => {
        const count = RolePermission.getRoleCountForPermission(2);
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(3);
      });

      it('should get all role-permissions', () => {
        const rolePermissions = RolePermission.getAllRolePermissions();
        
        expect(rolePermissions).toBeInstanceOf(Array);
        expect(rolePermissions.length).toBeGreaterThan(0);
      });

      it('should get role-permission statistics', () => {
        const stats = RolePermission.getRolePermissionStatistics();
        
        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
      });

      it('should remove permission from role', () => {
        const removed = RolePermission.removePermissionFromRole(2, 5);
        const rolePermission = RolePermission.getRolePermissionByRoleAndPermission(2, 5);
        
        expect(removed).toBe(true);
        expect(rolePermission).toBeUndefined();
      });

      it('should remove all permissions from role', () => {
        const removed = RolePermission.removeAllPermissionsFromRole(3);
        const permissions = RolePermission.getPermissionsForRole(3);
        
        expect(removed).toBe(true);
        expect(permissions.length).toBe(0);
      });

      it('should replace all permissions for a role', () => {
        RolePermission.replaceRolePermissions(3, [1, 2, 3]);
        const permissions = RolePermission.getPermissionsForRole(3);
        
        expect(permissions).toBeInstanceOf(Array);
        expect(permissions.length).toBe(3);
      });

      it('should get role-permission count', () => {
        const count = RolePermission.getRolePermissionCount();
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });
    });

    describe('Model Exports', () => {
      it('should export all expected functions and constants', () => {
        expect(RolePermission).toBeDefined();
        expect(RolePermission.ROLE_PERMISSIONS_TABLE).toBe('role_permissions');
        expect(RolePermission.ROLE_PERMISSION_FIELDS).toBeInstanceOf(Array);
        expect(typeof RolePermission.createRolePermission).toBe('function');
        expect(typeof RolePermission.getRolePermissionById).toBe('function');
        expect(typeof RolePermission.getRolePermissionByRoleAndPermission).toBe('function');
        expect(typeof RolePermission.getPermissionsForRole).toBe('function');
        expect(typeof RolePermission.getPermissionIdsForRole).toBe('function');
        expect(typeof RolePermission.getRolesForPermission).toBe('function');
        expect(typeof RolePermission.roleHasPermission).toBe('function');
        expect(typeof RolePermission.roleHasAnyPermission).toBe('function');
        expect(typeof RolePermission.getPermissionCountForRole).toBe('function');
        expect(typeof RolePermission.getRoleCountForPermission).toBe('function');
        expect(typeof RolePermission.getAllRolePermissions).toBe('function');
        expect(typeof RolePermission.getRolePermissionStatistics).toBe('function');
        expect(typeof RolePermission.removePermissionFromRole).toBe('function');
        expect(typeof RolePermission.removeAllPermissionsFromRole).toBe('function');
        expect(typeof RolePermission.replaceRolePermissions).toBe('function');
        expect(typeof RolePermission.getRolePermissionCount).toBe('function');
      });
    });
  });

  // ============================================
  // Service Tests
  // ============================================
  
  describe('RolePermission Service', () => {
    describe('Service Functions', () => {
      it('should validate role-permission data', () => {
        const result = rolePermissionService.validateRolePermission({
          role_id: 1,
          permission_id: 1
        });
        expect(result).toBeDefined();
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid role-permission data', () => {
        const result = rolePermissionService.validateRolePermission({
          role_id: null,
          permission_id: null
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeInstanceOf(Array);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should get paginated role-permissions', () => {
        const result = rolePermissionService.getPaginatedRolePermissions({ page: 1, pageSize: 5 });
        
        expect(result).toBeDefined();
        expect(result.data).toBeInstanceOf(Array);
        expect(result.total).toBeDefined();
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(5);
      });

      it('should create a role-permission with service', () => {
        const newRolePermission = rolePermissionService.createRolePermission({
          role_id: 3,
          permission_id: 6
        });
        
        expect(newRolePermission).toBeDefined();
        expect(newRolePermission.role_id).toBe(3);
        expect(newRolePermission.permission_id).toBe(6);
      });

      it('should get permissions for role from service', () => {
        const permissions = rolePermissionService.getPermissionsForRole(1);
        
        expect(permissions).toBeInstanceOf(Array);
        expect(permissions.length).toBeGreaterThan(0);
      });

      it('should remove permission from role with service', () => {
        const removed = rolePermissionService.removePermissionFromRole(1, 6);
        const rolePermission = rolePermissionService.getRolePermissionByRoleAndPermission(1, 6);
        
        expect(removed).toBe(true);
        expect(rolePermission).toBeUndefined();
      });

      it('should get role-permission statistics from service', () => {
        const stats = rolePermissionService.getRolePermissionStatistics();
        
        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
      });

      it('should check if role has permission via service', () => {
        const hasPermission = rolePermissionService.roleHasPermission(1, 2);
        const noPermission = rolePermissionService.roleHasPermission(3, 4);
        
        expect(hasPermission).toBe(true);
        expect(noPermission).toBe(false);
      });
    });

    describe('Service Exports', () => {
      it('should export all expected service functions', () => {
        expect(rolePermissionService).toBeDefined();
        expect(typeof rolePermissionService.validateRolePermission).toBe('function');
        expect(typeof rolePermissionService.getPaginatedRolePermissions).toBe('function');
        expect(typeof rolePermissionService.createRolePermission).toBe('function');
        expect(typeof rolePermissionService.getRolePermissionById).toBe('function');
        expect(typeof rolePermissionService.getRolePermissionByRoleAndPermission).toBe('function');
        expect(typeof rolePermissionService.getPermissionsForRole).toBe('function');
        expect(typeof rolePermissionService.getPermissionIdsForRole).toBe('function');
        expect(typeof rolePermissionService.getRolesForPermission).toBe('function');
        expect(typeof rolePermissionService.removePermissionFromRole).toBe('function');
        expect(typeof rolePermissionService.removeAllPermissionsFromRole).toBe('function');
        expect(typeof rolePermissionService.replaceRolePermissions).toBe('function');
        expect(typeof rolePermissionService.getRolePermissionCount).toBe('function');
        expect(typeof rolePermissionService.getRolePermissionStatistics).toBe('function');
      });
    });
  });
});

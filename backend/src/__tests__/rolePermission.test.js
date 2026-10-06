/**
 * RolePermission Module Tests
 * Comprehensive tests for RolePermission model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Database from 'better-sqlite3';
import { createRequire } from 'module';
import db from '../config/database.js';

const require = createRequire(import.meta.url);
import * as __ns_RolePermission from '../models/RolePermission.js';
import * as __ns_rolePermissionService from '../services/rolePermissionService.js';

// Test database setup
const TEST_DB = ':memory:';
let testDb;


describe('RolePermission Module', () => {
  beforeAll(() => {
    // Create in-memory database for testing
    testDb = db;
    
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


    // The shared singleton db is pre-seeded with the production RBAC
    // catalog (db/rbacSeed.js). These suites assert against their own
    // fixed fixtures, so start from empty RBAC tables.
    testDb.exec(`
      DELETE FROM role_permissions;
      DELETE FROM user_roles;
      DELETE FROM permissions;
      DELETE FROM roles;
      DELETE FROM sqlite_sequence WHERE name IN ('permissions','roles','role_permissions','user_roles');
    `);

    // Insert test permissions
    const insertPermission = testDb.prepare(`
      INSERT INTO permissions (id, name, display_name, description, module)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertPermission.run(1, 'create_student', 'Create Student', 'Create new student', 'students');
    insertPermission.run(2, 'read_student', 'Read Student', 'View student details', 'students');
    insertPermission.run(3, 'update_student', 'Update Student', 'Update student information', 'students');
    insertPermission.run(4, 'delete_student', 'Delete Student', 'Delete student record', 'students');
    insertPermission.run(5, 'view_reports', 'View Reports', 'View financial reports', 'reports');
    insertPermission.run(6, 'manage_classes', 'Manage Classes', 'Manage class information', 'classes');

    // Insert test roles
    const insertRole = testDb.prepare(`
      INSERT INTO roles (id, name, display_name, description)
      VALUES (?, ?, ?, ?)
    `);
    insertRole.run(1, 'Admin', 'Admin', 'Administrator with full access');
    insertRole.run(2, 'Teacher', 'Teacher', 'Teacher role with limited access');
    insertRole.run(3, 'Student', 'Student', 'Student role with read-only access');

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
      // no-op: testDb is the shared db singleton, do not close it here
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
        const { ROLE_PERMISSIONS_TABLE } = __ns_RolePermission;
        expect(ROLE_PERMISSIONS_TABLE).toBe('role_permissions');
      });

      it('should export ROLE_PERMISSION_FIELDS constant', () => {
        const { ROLE_PERMISSION_FIELDS } = __ns_RolePermission;
        expect(ROLE_PERMISSION_FIELDS).toBeInstanceOf(Object);
        expect(ROLE_PERMISSION_FIELDS.ROLE_ID).toBe('role_id');
        expect(ROLE_PERMISSION_FIELDS.PERMISSION_ID).toBe('permission_id');
      });
    });

    describe('Model Functions', () => {
      it('should create a new role-permission assignment', () => {
        // createRolePermission never existed on the model; the actual
        // function is assignPermissionToRole, taking camelCase roleId/permissionId
        const { assignPermissionToRole } = __ns_RolePermission;
        const newRolePermission = assignPermissionToRole({
          roleId: 2,
          permissionId: 6
        });

        expect(newRolePermission).toBeDefined();
        expect(newRolePermission.role_id).toBe(2);
        expect(newRolePermission.permission_id).toBe(6);
      });

      it('should get role-permission by ID', () => {
        const { getRolePermissionById } = __ns_RolePermission;
        const rolePermission = getRolePermissionById(1);
        
        expect(rolePermission).toBeDefined();
        expect(rolePermission.role_id).toBe(1);
        expect(rolePermission.permission_id).toBe(1);
      });

      it('should get role-permission by role and permission', () => {
        const { getRolePermissionByRoleAndPermission } = __ns_RolePermission;
        const rolePermission = getRolePermissionByRoleAndPermission(1, 1);
        
        expect(rolePermission).toBeDefined();
        expect(rolePermission.role_id).toBe(1);
        expect(rolePermission.permission_id).toBe(1);
      });

      it('should get all permissions for a role', () => {
        // getPermissionsForRole never existed; the real function is getPermissionsByRoleId
        const { getPermissionsByRoleId } = __ns_RolePermission;
        const permissions = getPermissionsByRoleId(1);

        expect(Array.isArray(permissions)).toBe(true);
        expect(permissions.length).toBe(6); // Admin has all 6 permissions
        expect(permissions.every(p => p.role_id === 1)).toBe(true);
      });

      it('should get permission IDs for a role', () => {
        // getPermissionIdsForRole never existed; the real function is getPermissionIdsByRoleId
        const { getPermissionIdsByRoleId } = __ns_RolePermission;
        const permissionIds = getPermissionIdsByRoleId(1);

        expect(Array.isArray(permissionIds)).toBe(true);
        expect(permissionIds.length).toBe(6);
        expect(permissionIds).toContain(1);
        expect(permissionIds).toContain(2);
      });

      it('should get all roles for a permission', () => {
        // getRolesForPermission never existed; the real function is
        // getRolesByPermissionId, and it returns a plain array of role IDs,
        // not an array of role-permission row objects.
        const { getRolesByPermissionId } = __ns_RolePermission;
        const roleIds = getRolesByPermissionId(2);

        expect(Array.isArray(roleIds)).toBe(true);
        expect(roleIds.length).toBeGreaterThanOrEqual(3); // All roles have read_student
        expect(roleIds.every(id => typeof id === 'number')).toBe(true);
        expect(roleIds).toContain(1);
        expect(roleIds).toContain(2);
        expect(roleIds).toContain(3);
      });

      it('should check if role has permission', () => {
        const { roleHasPermission } = __ns_RolePermission;
        const hasPermission = roleHasPermission(1, 1);
        const noPermission = roleHasPermission(3, 1);
        
        expect(hasPermission).toBe(true);
        expect(noPermission).toBe(false);
      });

      it('should check if role has any of the given permissions', () => {
        const { roleHasAnyPermission } = __ns_RolePermission;
        const hasAny = roleHasAnyPermission(2, [1, 2, 3]);
        const hasNone = roleHasAnyPermission(3, [1, 3, 4, 6]);
        
        expect(hasAny).toBe(true);
        expect(hasNone).toBe(false);
      });

      it('should get permission count for a role', () => {
        const { getPermissionCountForRole } = __ns_RolePermission;
        const count = getPermissionCountForRole(1);
        
        expect(typeof count).toBe('number');
        expect(count).toBe(6);
      });

      it('should get role count for a permission', () => {
        const { getRoleCountForPermission } = __ns_RolePermission;
        const count = getRoleCountForPermission(2);
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(3);
      });

      it('should get all role-permissions', () => {
        const { getAllRolePermissions } = __ns_RolePermission;
        const rolePermissions = getAllRolePermissions();
        
        expect(Array.isArray(rolePermissions)).toBe(true);
        expect(rolePermissions.length).toBeGreaterThan(0);
      });

      it('should get role-permission statistics', () => {
        // getRolePermissionStatistics lives in rolePermissionService.js, not
        // models/RolePermission.js, and returns { totalAssignments,
        // assignmentCount } rather than a generic { total } shape.
        const { getRolePermissionStatistics } = __ns_rolePermissionService;
        const stats = getRolePermissionStatistics();

        expect(stats).toBeDefined();
        expect(stats.totalAssignments).toBeDefined();
      });

      it('should remove permission from role', () => {
        const { removePermissionFromRole, getRolePermissionByRoleAndPermission } = __ns_RolePermission;
        const removed = removePermissionFromRole(2, 5);
        const rolePermission = getRolePermissionByRoleAndPermission(2, 5);

        expect(removed).toBe(true);
        expect(rolePermission).toBeNull();
      });

      it('should remove all permissions from role', () => {
        const { removeAllPermissionsFromRole, getPermissionsByRoleId } = __ns_RolePermission;
        const removed = removeAllPermissionsFromRole(3);
        const permissions = getPermissionsByRoleId(3);

        expect(removed).toBe(true);
        expect(permissions.length).toBe(0);
      });

      it('should replace all permissions for a role', () => {
        const { replaceRolePermissions, getPermissionsByRoleId } = __ns_RolePermission;
        replaceRolePermissions(3, [1, 2, 3]);
        const permissions = getPermissionsByRoleId(3);

        expect(Array.isArray(permissions)).toBe(true);
        expect(permissions.length).toBe(3);
      });

      it('should get role-permission count', () => {
        const { getRolePermissionCount } = __ns_RolePermission;
        const count = getRolePermissionCount();
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });
    });

    describe('Model Exports', () => {
      it('should export all expected functions and constants', () => {
        const RolePermission = __ns_RolePermission;
        
        expect(RolePermission).toBeDefined();
        expect(RolePermission.ROLE_PERMISSIONS_TABLE).toBe('role_permissions');
        expect(RolePermission.ROLE_PERMISSION_FIELDS).toBeInstanceOf(Object);
        expect(typeof RolePermission.assignPermissionToRole).toBe('function');
        expect(typeof RolePermission.getRolePermissionById).toBe('function');
        expect(typeof RolePermission.getRolePermissionByRoleAndPermission).toBe('function');
        expect(typeof RolePermission.getPermissionsByRoleId).toBe('function');
        expect(typeof RolePermission.getPermissionIdsByRoleId).toBe('function');
        expect(typeof RolePermission.getRolesByPermissionId).toBe('function');
        expect(typeof RolePermission.roleHasPermission).toBe('function');
        expect(typeof RolePermission.roleHasAnyPermission).toBe('function');
        expect(typeof RolePermission.getPermissionCountForRole).toBe('function');
        expect(typeof RolePermission.getRoleCountForPermission).toBe('function');
        expect(typeof RolePermission.getAllRolePermissions).toBe('function');
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
        // The real function is validateRolePermissionAssignment and it checks
        // camelCase data.roleId/data.permissionId, not role_id/permission_id.
        const { validateRolePermissionAssignment } = __ns_rolePermissionService;

        const validData = {
          roleId: 1,
          permissionId: 1
        };

        const result = validateRolePermissionAssignment(validData);
        expect(result).toBeDefined();
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid role-permission data', () => {
        const { validateRolePermissionAssignment } = __ns_rolePermissionService;

        const invalidData = {
          roleId: null,
          permissionId: null
        };

        const result = validateRolePermissionAssignment(invalidData);
        expect(result.isValid).toBe(false);
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should get paginated role-permissions', () => {
        const { getPaginatedRolePermissions } = __ns_rolePermissionService;
        const result = getPaginatedRolePermissions({ page: 1, pageSize: 5 });

        expect(result).toBeDefined();
        expect(Array.isArray(result.rolePermissions)).toBe(true);
        expect(result.pagination).toBeDefined();
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.pageSize).toBe(5);
      });

      it('should create a role-permission with service', async () => {
        // The real function is assignPermissionToRole (async, validates role
        // and permission exist first) and expects camelCase roleId/permissionId.
        const { assignPermissionToRole } = __ns_rolePermissionService;
        const newRolePermission = await assignPermissionToRole({
          roleId: 3,
          permissionId: 6
        });

        expect(newRolePermission).toBeDefined();
        expect(newRolePermission.role_id).toBe(3);
        expect(newRolePermission.permission_id).toBe(6);
      });

      it('should get permissions for role from service', () => {
        const { getPermissionsByRoleId } = __ns_rolePermissionService;
        const permissions = getPermissionsByRoleId(1);

        expect(Array.isArray(permissions)).toBe(true);
        expect(permissions.length).toBeGreaterThan(0);
      });

      it('should remove permission from role with service', () => {
        const { removePermissionFromRole, getRolePermissionByRoleAndPermission } = __ns_rolePermissionService;
        const removed = removePermissionFromRole(1, 6);
        const rolePermission = getRolePermissionByRoleAndPermission(1, 6);

        expect(removed).toBe(true);
        expect(rolePermission).toBeNull();
      });

      it('should get role-permission statistics from service', () => {
        const { getRolePermissionStatistics } = __ns_rolePermissionService;
        const stats = getRolePermissionStatistics();

        expect(stats).toBeDefined();
        expect(stats.totalAssignments).toBeDefined();
      });

      it('should check if role has permission via service', () => {
        const { roleHasPermission } = __ns_rolePermissionService;
        const hasPermission = roleHasPermission(1, 2);
        const noPermission = roleHasPermission(3, 4);
        
        expect(hasPermission).toBe(true);
        expect(noPermission).toBe(false);
      });
    });

    describe('Service Exports', () => {
      it('should export all expected service functions', () => {
        const rolePermissionService = __ns_rolePermissionService;
        
        expect(rolePermissionService).toBeDefined();
        expect(typeof rolePermissionService.validateRolePermissionAssignment).toBe('function');
        expect(typeof rolePermissionService.getPaginatedRolePermissions).toBe('function');
        expect(typeof rolePermissionService.assignPermissionToRole).toBe('function');
        expect(typeof rolePermissionService.getRolePermissionById).toBe('function');
        expect(typeof rolePermissionService.getRolePermissionByRoleAndPermission).toBe('function');
        expect(typeof rolePermissionService.getPermissionsByRoleId).toBe('function');
        expect(typeof rolePermissionService.getPermissionIdsByRoleId).toBe('function');
        expect(typeof rolePermissionService.getRolesByPermissionId).toBe('function');
        expect(typeof rolePermissionService.removePermissionFromRole).toBe('function');
        expect(typeof rolePermissionService.removeAllPermissionsFromRole).toBe('function');
        expect(typeof rolePermissionService.replaceRolePermissions).toBe('function');
        expect(typeof rolePermissionService.getRolePermissionCount).toBe('function');
        expect(typeof rolePermissionService.getRolePermissionStatistics).toBe('function');
      });
    });
  });
});

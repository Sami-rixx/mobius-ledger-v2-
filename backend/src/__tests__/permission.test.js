/**
 * Permission Module Tests
 * Comprehensive tests for Permission model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import Database from 'better-sqlite3';
import Permission from '../models/Permission.js';
import permissionService from '../services/permissionService.js';

// Test database setup - must be at top level for ESM mocking to work
const TEST_DB = ':memory:';
const testDb = new Database(TEST_DB);

// Mock the database module at top level so all dynamic imports get the mock
jest.mock('../config/database.js', () => ({
  default: testDb
}));

describe('Permission Module', () => {
  beforeAll(() => {
    
    // Create users table (required for foreign key references)
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

      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        module TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
      CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
      CREATE INDEX IF NOT EXISTS idx_permissions_is_active ON permissions(is_active);
    `);

    // Insert test permissions
    const insertPermission = testDb.prepare(`
      INSERT INTO permissions (name, description, module, is_active)
      VALUES (?, ?, ?, ?)
    `);
    
    insertPermission.run('create_student', 'Create new student', 'students', 1);
    insertPermission.run('read_student', 'View student details', 'students', 1);
    insertPermission.run('update_student', 'Update student information', 'students', 1);
    insertPermission.run('delete_student', 'Delete student record', 'students', 0);
    insertPermission.run('view_reports', 'View financial reports', 'reports', 1);
    insertPermission.run('manage_users', 'Manage user accounts', 'users', 1);
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
  
  describe('Permission Model', () => {
    describe('Constants', () => {
      it('should export PERMISSIONS_TABLE constant', () => {
        expect(Permission.PERMISSIONS_TABLE).toBe('permissions');
      });

      it('should export PERMISSION_FIELDS constant', () => {
        expect(Permission.PERMISSION_FIELDS).toBeInstanceOf(Array);
        expect(Permission.PERMISSION_FIELDS.length).toBeGreaterThan(0);
      });

      it('should export PERMISSION_MODULES constant', () => {
        expect(Permission.PERMISSION_MODULES).toBeInstanceOf(Array);
        expect(Permission.PERMISSION_MODULES).toContain('students');
        expect(Permission.PERMISSION_MODULES).toContain('users');
      });
    });

    describe('Model Functions', () => {
      it('should create a new permission', () => {
        const newPermission = Permission.createPermission({
          name: 'test_permission',
          description: 'Test permission',
          module: 'test_module',
          is_active: 1
        });
        
        expect(newPermission).toBeDefined();
        expect(newPermission.name).toBe('test_permission');
        expect(newPermission.module).toBe('test_module');
      });

      it('should get permission by ID', () => {
        const permission = Permission.getPermissionById(1);
        
        expect(permission).toBeDefined();
        expect(permission.name).toBe('create_student');
      });

      it('should get permission by name', () => {
        const permission = Permission.getPermissionByName('read_student');
        
        expect(permission).toBeDefined();
        expect(permission.name).toBe('read_student');
      });

      it('should get all permissions', () => {
        const permissions = Permission.getAllPermissions();
        
        expect(permissions).toBeInstanceOf(Array);
        expect(permissions.length).toBeGreaterThanOrEqual(6);
      });

      it('should get permissions by module', () => {
        const permissions = Permission.getPermissionsByModule('students');
        
        expect(permissions).toBeInstanceOf(Array);
        expect(permissions.every(p => p.module === 'students')).toBe(true);
      });

      it('should check if permission exists', () => {
        const exists = Permission.permissionExists('create_student');
        const notExists = Permission.permissionExists('nonexistent_permission');
        
        expect(exists).toBe(true);
        expect(notExists).toBe(false);
      });

      it('should update a permission', () => {
        const updated = Permission.updatePermission(3, {
          description: 'Updated description',
          is_active: 0
        });
        
        expect(updated).toBeDefined();
        expect(updated.description).toBe('Updated description');
        expect(updated.is_active).toBe(0);
      });

      it('should delete a permission', () => {
        const permissionId = 6;
        const deleted = Permission.deletePermission(permissionId);
        const deletedPermission = Permission.getPermissionById(permissionId);
        
        expect(deleted).toBe(true);
        expect(deletedPermission).toBeUndefined();
      });

      it('should get permission count', () => {
        const count = Permission.getPermissionCount();
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });

      it('should search permissions', () => {
        const results = Permission.searchPermissions('student');
        
        expect(results).toBeInstanceOf(Array);
        expect(results.every(p => p.name.includes('student') || p.description.includes('student'))).toBe(true);
      });

      it('should get permission statistics', () => {
        const stats = Permission.getPermissionStatistics();
        
        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
      });

      it('should get permission count by module', () => {
        const count = Permission.getPermissionCountByModule('students');
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(3);
      });

      it('should get all permission modules', () => {
        const modules = Permission.getAllPermissionModules();
        
        expect(modules).toBeInstanceOf(Array);
        expect(modules).toContain('students');
      });
    });

    describe('Model Exports', () => {
      it('should export all expected functions and constants', () => {
        expect(Permission).toBeDefined();
        expect(Permission.PERMISSIONS_TABLE).toBe('permissions');
        expect(Permission.PERMISSION_FIELDS).toBeInstanceOf(Array);
        expect(Permission.PERMISSION_MODULES).toBeInstanceOf(Array);
        expect(typeof Permission.createPermission).toBe('function');
        expect(typeof Permission.getPermissionById).toBe('function');
        expect(typeof Permission.getPermissionByName).toBe('function');
        expect(typeof Permission.getAllPermissions).toBe('function');
        expect(typeof Permission.getPermissionsByModule).toBe('function');
        expect(typeof Permission.permissionExists).toBe('function');
        expect(typeof Permission.updatePermission).toBe('function');
        expect(typeof Permission.deletePermission).toBe('function');
        expect(typeof Permission.getPermissionCount).toBe('function');
        expect(typeof Permission.searchPermissions).toBe('function');
        expect(typeof Permission.getPermissionStatistics).toBe('function');
        expect(typeof Permission.getPermissionCountByModule).toBe('function');
        expect(typeof Permission.getAllPermissionModules).toBe('function');
      });
    });
  });

  // ============================================
  // Service Tests
  // ============================================
  
  describe('Permission Service', () => {
    describe('Service Functions', () => {
      it('should validate permission data', () => {
        const result = permissionService.validatePermission({
          name: 'valid_permission',
          description: 'Valid description',
          module: 'test'
        });
        expect(result).toBeDefined();
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid permission data', () => {
        const result = permissionService.validatePermission({
          name: '',
          description: '',
          module: ''
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeInstanceOf(Array);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should get paginated permissions', () => {
        const result = permissionService.getPaginatedPermissions({ page: 1, pageSize: 5 });
        
        expect(result).toBeDefined();
        expect(result.data).toBeInstanceOf(Array);
        expect(result.total).toBeDefined();
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(5);
      });

      it('should create a permission with service', () => {
        const newPermission = permissionService.createPermission({
          name: 'service_test_permission',
          description: 'Service test',
          module: 'service_test'
        });
        
        expect(newPermission).toBeDefined();
        expect(newPermission.name).toBe('service_test_permission');
      });

      it('should update a permission with service', () => {
        const updated = permissionService.updatePermission(1, {
          description: 'Updated by service'
        });
        
        expect(updated).toBeDefined();
        expect(updated.description).toBe('Updated by service');
      });

      it('should delete a permission with service', () => {
        const permissionId = 2;
        const deleted = permissionService.deletePermission(permissionId);
        const deletedPermission = permissionService.getPermissionById(permissionId);
        
        expect(deleted).toBe(true);
        expect(deletedPermission).toBeUndefined();
      });

      it('should get permission statistics from service', () => {
        const stats = permissionService.getPermissionStatistics();
        
        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
      });
    });

    describe('Service Exports', () => {
      it('should export all expected service functions', () => {
        expect(permissionService).toBeDefined();
        expect(typeof permissionService.validatePermission).toBe('function');
        expect(typeof permissionService.getPaginatedPermissions).toBe('function');
        expect(typeof permissionService.createPermission).toBe('function');
        expect(typeof permissionService.getPermissionById).toBe('function');
        expect(typeof permissionService.getPermissionByName).toBe('function');
        expect(typeof permissionService.getAllPermissions).toBe('function');
        expect(typeof permissionService.updatePermission).toBe('function');
        expect(typeof permissionService.deletePermission).toBe('function');
        expect(typeof permissionService.getPermissionCount).toBe('function');
        expect(typeof permissionService.getPermissionStatistics).toBe('function');
      });
    });
  });
});

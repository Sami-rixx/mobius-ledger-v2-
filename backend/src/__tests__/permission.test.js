/**
 * Permission Module Tests
 * Comprehensive tests for Permission model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Database from 'better-sqlite3';

// Test database setup
const TEST_DB = ':memory:';
let testDb;

// Mock the database module
jest.mock('../config/database.js', () => ({
  default: testDb
}));

describe('Permission Module', () => {
  beforeAll(() => {
    // Create in-memory database for testing
    testDb = new Database(TEST_DB);
    
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
        const { PERMISSIONS_TABLE } = require('../models/Permission.js');
        expect(PERMISSIONS_TABLE).toBe('permissions');
      });

      it('should export PERMISSION_FIELDS constant', () => {
        const { PERMISSION_FIELDS } = require('../models/Permission.js');
        expect(PERMISSION_FIELDS).toBeInstanceOf(Array);
        expect(PERMISSION_FIELDS.length).toBeGreaterThan(0);
      });

      it('should export PERMISSION_MODULES constant', () => {
        const { PERMISSION_MODULES } = require('../models/Permission.js');
        expect(PERMISSION_MODULES).toBeInstanceOf(Array);
        expect(PERMISSION_MODULES).toContain('students');
        expect(PERMISSION_MODULES).toContain('users');
      });
    });

    describe('Model Functions', () => {
      it('should create a new permission', () => {
        const { createPermission } = require('../models/Permission.js');
        const newPermission = createPermission({
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
        const { getPermissionById } = require('../models/Permission.js');
        const permission = getPermissionById(1);
        
        expect(permission).toBeDefined();
        expect(permission.name).toBe('create_student');
      });

      it('should get permission by name', () => {
        const { getPermissionByName } = require('../models/Permission.js');
        const permission = getPermissionByName('read_student');
        
        expect(permission).toBeDefined();
        expect(permission.name).toBe('read_student');
      });

      it('should get all permissions', () => {
        const { getAllPermissions } = require('../models/Permission.js');
        const permissions = getAllPermissions();
        
        expect(permissions).toBeInstanceOf(Array);
        expect(permissions.length).toBeGreaterThanOrEqual(6);
      });

      it('should get permissions by module', () => {
        const { getPermissionsByModule } = require('../models/Permission.js');
        const permissions = getPermissionsByModule('students');
        
        expect(permissions).toBeInstanceOf(Array);
        expect(permissions.every(p => p.module === 'students')).toBe(true);
      });

      it('should check if permission exists', () => {
        const { permissionExists } = require('../models/Permission.js');
        const exists = permissionExists('create_student');
        const notExists = permissionExists('nonexistent_permission');
        
        expect(exists).toBe(true);
        expect(notExists).toBe(false);
      });

      it('should update a permission', () => {
        const { updatePermission } = require('../models/Permission.js');
        const updated = updatePermission(3, {
          description: 'Updated description',
          is_active: 0
        });
        
        expect(updated).toBeDefined();
        expect(updated.description).toBe('Updated description');
        expect(updated.is_active).toBe(0);
      });

      it('should delete a permission', () => {
        const { deletePermission, getPermissionById } = require('../models/Permission.js');
        const permissionId = 6;
        const deleted = deletePermission(permissionId);
        const deletedPermission = getPermissionById(permissionId);
        
        expect(deleted).toBe(true);
        expect(deletedPermission).toBeUndefined();
      });

      it('should get permission count', () => {
        const { getPermissionCount } = require('../models/Permission.js');
        const count = getPermissionCount();
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });

      it('should search permissions', () => {
        const { searchPermissions } = require('../models/Permission.js');
        const results = searchPermissions('student');
        
        expect(results).toBeInstanceOf(Array);
        expect(results.every(p => p.name.includes('student') || p.description.includes('student'))).toBe(true);
      });

      it('should get permission statistics', () => {
        const { getPermissionStatistics } = require('../models/Permission.js');
        const stats = getPermissionStatistics();
        
        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
      });

      it('should get permission count by module', () => {
        const { getPermissionCountByModule } = require('../models/Permission.js');
        const count = getPermissionCountByModule('students');
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(3);
      });

      it('should get all permission modules', () => {
        const { getAllPermissionModules } = require('../models/Permission.js');
        const modules = getAllPermissionModules();
        
        expect(modules).toBeInstanceOf(Array);
        expect(modules).toContain('students');
      });
    });

    describe('Model Exports', () => {
      it('should export all expected functions and constants', () => {
        const Permission = require('../models/Permission.js');
        
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
        const { validatePermission } = require('../services/permissionService.js');
        
        const validData = {
          name: 'valid_permission',
          description: 'Valid description',
          module: 'test'
        };
        
        const result = validatePermission(validData);
        expect(result).toBeDefined();
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid permission data', () => {
        const { validatePermission } = require('../services/permissionService.js');
        
        const invalidData = {
          name: '',
          description: '',
          module: ''
        };
        
        const result = validatePermission(invalidData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeInstanceOf(Array);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should get paginated permissions', () => {
        const { getPaginatedPermissions } = require('../services/permissionService.js');
        const result = getPaginatedPermissions({ page: 1, pageSize: 5 });
        
        expect(result).toBeDefined();
        expect(result.data).toBeInstanceOf(Array);
        expect(result.total).toBeDefined();
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(5);
      });

      it('should create a permission with service', () => {
        const { createPermission } = require('../services/permissionService.js');
        const newPermission = createPermission({
          name: 'service_test_permission',
          description: 'Service test',
          module: 'service_test'
        });
        
        expect(newPermission).toBeDefined();
        expect(newPermission.name).toBe('service_test_permission');
      });

      it('should update a permission with service', () => {
        const { updatePermission } = require('../services/permissionService.js');
        const updated = updatePermission(1, {
          description: 'Updated by service'
        });
        
        expect(updated).toBeDefined();
        expect(updated.description).toBe('Updated by service');
      });

      it('should delete a permission with service', () => {
        const { deletePermission, getPermissionById } = require('../services/permissionService.js');
        const permissionId = 2;
        const deleted = deletePermission(permissionId);
        const deletedPermission = getPermissionById(permissionId);
        
        expect(deleted).toBe(true);
        expect(deletedPermission).toBeUndefined();
      });

      it('should get permission statistics from service', () => {
        const { getPermissionStatistics } = require('../services/permissionService.js');
        const stats = getPermissionStatistics();
        
        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
      });
    });

    describe('Service Exports', () => {
      it('should export all expected service functions', () => {
        const permissionService = require('../services/permissionService.js');
        
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

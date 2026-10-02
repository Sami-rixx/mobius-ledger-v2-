/**
 * Permission Module Tests
 * Comprehensive tests for Permission model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Database from 'better-sqlite3';
import { createRequire } from 'module';
import db from '../config/database.js';

const require = createRequire(import.meta.url);
import * as __ns_Permission from '../models/Permission.js';
import * as __ns_permissionService from '../services/permissionService.js';

// Test database setup
const TEST_DB = ':memory:';
let testDb;


describe('Permission Module', () => {
  beforeAll(() => {
    // Create in-memory database for testing
    testDb = db;
    
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
      INSERT INTO permissions (name, display_name, description, module, is_active)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertPermission.run('create_student', 'Create Student', 'Create new student', 'students', 1);
    insertPermission.run('read_student', 'Read Student', 'View student details', 'students', 1);
    insertPermission.run('update_student', 'Update Student', 'Update student information', 'students', 1);
    insertPermission.run('delete_student', 'Delete Student', 'Delete student record', 'students', 0);
    insertPermission.run('view_reports', 'View Reports', 'View financial reports', 'reports', 1);
    insertPermission.run('manage_users', 'Manage Users', 'Manage user accounts', 'users', 1);
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
  
  describe('Permission Model', () => {
    describe('Constants', () => {
      it('should export PERMISSIONS_TABLE constant', () => {
        const { PERMISSIONS_TABLE } = __ns_Permission;
        expect(PERMISSIONS_TABLE).toBe('permissions');
      });

      it('should export PERMISSION_FIELDS constant', () => {
        const { PERMISSION_FIELDS } = __ns_Permission;
        expect(PERMISSION_FIELDS).toBeInstanceOf(Object);
        expect(PERMISSION_FIELDS.NAME).toBe('name');
        expect(PERMISSION_FIELDS.DISPLAY_NAME).toBe('display_name');
      });

      it('should export PERMISSION_MODULES constant', () => {
        // PERMISSION_MODULES is a name->value constant map, not an array
        const { PERMISSION_MODULES } = __ns_Permission;
        expect(PERMISSION_MODULES).toBeInstanceOf(Object);
        expect(PERMISSION_MODULES.STUDENTS).toBe('students');
        expect(PERMISSION_MODULES.USERS).toBe('users');
      });
    });

    describe('Model Functions', () => {
      it('should create a new permission', () => {
        const { createPermission } = __ns_Permission;
        const newPermission = createPermission({
          name: 'test_permission',
          displayName: 'Test Permission',
          description: 'Test permission',
          module: 'test_module',
          isActive: true
        });
        
        expect(newPermission).toBeDefined();
        expect(newPermission.name).toBe('test_permission');
        expect(newPermission.module).toBe('test_module');
      });

      it('should get permission by ID', () => {
        const { getPermissionById } = __ns_Permission;
        const permission = getPermissionById(1);
        
        expect(permission).toBeDefined();
        expect(permission.name).toBe('create_student');
      });

      it('should get permission by name', () => {
        const { getPermissionByName } = __ns_Permission;
        const permission = getPermissionByName('read_student');
        
        expect(permission).toBeDefined();
        expect(permission.name).toBe('read_student');
      });

      it('should get all permissions', () => {
        const { getAllPermissions } = __ns_Permission;
        const permissions = getAllPermissions();
        
        expect(Array.isArray(permissions)).toBe(true);
        expect(permissions.length).toBeGreaterThanOrEqual(6);
      });

      it('should get permissions by module', () => {
        const { getPermissionsByModule } = __ns_Permission;
        const permissions = getPermissionsByModule('students');
        
        expect(Array.isArray(permissions)).toBe(true);
        expect(permissions.every(p => p.module === 'students')).toBe(true);
      });

      it('should check if permission exists', () => {
        const { permissionExists } = __ns_Permission;
        const exists = permissionExists('create_student');
        const notExists = permissionExists('nonexistent_permission');
        
        expect(exists).toBe(true);
        expect(notExists).toBe(false);
      });

      it('should update a permission', () => {
        const { updatePermission } = __ns_Permission;
        const updated = updatePermission(3, {
          description: 'Updated description',
          isActive: false
        });
        
        expect(updated).toBeDefined();
        expect(updated.description).toBe('Updated description');
        expect(updated.is_active).toBe(0);
      });

      it('should delete a permission', () => {
        const { deletePermission, getPermissionById } = __ns_Permission;
        const permissionId = 6;
        const deleted = deletePermission(permissionId);
        const deletedPermission = getPermissionById(permissionId);

        expect(deleted).toBe(true);
        expect(deletedPermission).toBeNull();
      });

      it('should get permission count', () => {
        const { getPermissionCount } = __ns_Permission;
        const count = getPermissionCount();
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });

      it('should search permissions', () => {
        const { searchPermissions } = __ns_Permission;
        const results = searchPermissions('student');

        expect(Array.isArray(results)).toBe(true);
        expect(results.every(p =>
          /student/i.test(p.name) || /student/i.test(p.display_name) || /student/i.test(p.description || '')
        )).toBe(true);
      });

      it('should get permission statistics', () => {
        // getPermissionStatistics lives in permissionService.js, not models/Permission.js
        const { getPermissionStatistics } = __ns_permissionService;
        const stats = getPermissionStatistics();

        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
      });

      it('should get permission count by module', () => {
        // Model function returns an array of { module, count } rows, not a
        // single number for one module (there's no module-filter parameter).
        const { getPermissionCountByModule } = __ns_Permission;
        const counts = getPermissionCountByModule();

        expect(Array.isArray(counts)).toBe(true);
        const studentsRow = counts.find(c => c.module === 'students');
        expect(studentsRow).toBeDefined();
        expect(studentsRow.count).toBeGreaterThanOrEqual(3);
      });

      it('should get all permission modules', () => {
        // getAllPermissionModules does not exist; the equivalent is
        // permissionService.getPermissionModules(), returning the
        // PERMISSION_MODULES constant map.
        const { getPermissionModules } = __ns_permissionService;
        const modules = getPermissionModules();

        expect(modules).toBeInstanceOf(Object);
        expect(modules.STUDENTS).toBe('students');
      });
    });

    describe('Model Exports', () => {
      it('should export all expected functions and constants', () => {
        const Permission = __ns_Permission;
        
        expect(Permission).toBeDefined();
        expect(Permission.PERMISSIONS_TABLE).toBe('permissions');
        expect(Permission.PERMISSION_FIELDS).toBeInstanceOf(Object);
        expect(Permission.PERMISSION_MODULES).toBeInstanceOf(Object);
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
        expect(typeof Permission.getPermissionCountByModule).toBe('function');
      });
    });
  });

  // ============================================
  // Service Tests
  // ============================================
  
  describe('Permission Service', () => {
    describe('Service Functions', () => {
      it('should validate permission data', () => {
        const { validatePermission } = __ns_permissionService;
        
        const validData = {
          name: 'valid_permission',
          displayName: 'Valid Permission',
          description: 'Valid description',
          module: 'test'
        };
        
        const result = validatePermission(validData);
        expect(result).toBeDefined();
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid permission data', () => {
        const { validatePermission } = __ns_permissionService;
        
        const invalidData = {
          name: '',
          description: '',
          module: ''
        };
        
        const result = validatePermission(invalidData);
        expect(result.isValid).toBe(false);
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should get paginated permissions', () => {
        const { getPaginatedPermissions } = __ns_permissionService;
        const result = getPaginatedPermissions({ page: 1, pageSize: 5 });

        expect(result).toBeDefined();
        expect(Array.isArray(result.permissions)).toBe(true);
        expect(result.pagination).toBeDefined();
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.pageSize).toBe(5);
      });

      it('should create a permission with service', async () => {
        const { createPermission } = __ns_permissionService;
        const newPermission = await createPermission({
          name: 'service_test_permission',
          displayName: 'Service Test Permission',
          description: 'Service test',
          module: 'service_test'
        });

        expect(newPermission).toBeDefined();
        expect(newPermission.name).toBe('service_test_permission');
      });

      it('should update a permission with service', async () => {
        const { updatePermission } = __ns_permissionService;
        const updated = await updatePermission(1, {
          description: 'Updated by service'
        });

        expect(updated).toBeDefined();
        expect(updated.description).toBe('Updated by service');
      });

      it('should delete a permission with service', () => {
        const { deletePermission, getPermissionById } = __ns_permissionService;
        const permissionId = 2;
        const deleted = deletePermission(permissionId);
        const deletedPermission = getPermissionById(permissionId);

        expect(deleted).toBe(true);
        expect(deletedPermission).toBeNull();
      });

      it('should get permission statistics from service', () => {
        const { getPermissionStatistics } = __ns_permissionService;
        const stats = getPermissionStatistics();
        
        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
      });
    });

    describe('Service Exports', () => {
      it('should export all expected service functions', () => {
        const permissionService = __ns_permissionService;
        
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

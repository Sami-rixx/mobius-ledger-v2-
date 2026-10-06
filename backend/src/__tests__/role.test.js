/**
 * Role Module Tests
 * Comprehensive tests for Role model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Database from 'better-sqlite3';
import { createRequire } from 'module';
import db from '../config/database.js';

const require = createRequire(import.meta.url);
import * as __ns_Role from '../models/Role.js';
import * as __ns_roleService from '../services/roleService.js';

// Test database setup
const TEST_DB = ':memory:';
let testDb;


describe('Role Module', () => {
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

      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
      CREATE INDEX IF NOT EXISTS idx_roles_is_default ON roles(is_default);
      CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
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

    // Insert test roles
    const insertRole = testDb.prepare(`
      INSERT INTO roles (name, display_name, description, is_default, is_active)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertRole.run('Admin', 'Admin', 'Administrator with full access', 1, 1);
    insertRole.run('Teacher', 'Teacher', 'Teacher role with limited access', 0, 1);
    insertRole.run('Student', 'Student', 'Student role with read-only access', 0, 1);
    insertRole.run('Accountant', 'Accountant', 'Accountant role for financial operations', 0, 1);
    insertRole.run('Inactive Role', 'Inactive Role', 'Inactive test role', 0, 0);
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
  
  describe('Role Model', () => {
    describe('Constants', () => {
      it('should export ROLES_TABLE constant', () => {
        const { ROLES_TABLE } = __ns_Role;
        expect(ROLES_TABLE).toBe('roles');
      });

      it('should export ROLE_FIELDS constant', () => {
        const { ROLE_FIELDS } = __ns_Role;
        expect(ROLE_FIELDS).toBeInstanceOf(Object);
        expect(ROLE_FIELDS.NAME).toBe('name');
        expect(ROLE_FIELDS.DISPLAY_NAME).toBe('display_name');
      });

      it('should export DEFAULT_ROLES constant', () => {
        const { DEFAULT_ROLES } = __ns_Role;
        expect(DEFAULT_ROLES).toBeInstanceOf(Object);
        expect(DEFAULT_ROLES.ADMIN).toBe('admin');
      });
    });

    describe('Model Functions', () => {
      it('should create a new role', () => {
        const { createRole } = __ns_Role;
        const newRole = createRole({
          name: 'Test Role',
          displayName: 'Test Role',
          description: 'Test role for testing',
          isDefault: false,
          isActive: true
        });
        
        expect(newRole).toBeDefined();
        expect(newRole.name).toBe('Test Role');
        expect(newRole.description).toBe('Test role for testing');
      });

      it('should get role by ID', () => {
        const { getRoleById } = __ns_Role;
        const role = getRoleById(1);
        
        expect(role).toBeDefined();
        expect(role.name).toBe('Admin');
      });

      it('should get role by name', () => {
        const { getRoleByName } = __ns_Role;
        const role = getRoleByName('Teacher');
        
        expect(role).toBeDefined();
        expect(role.name).toBe('Teacher');
      });

      it('should get all roles', () => {
        const { getAllRoles } = __ns_Role;
        const roles = getAllRoles();
        
        expect(Array.isArray(roles)).toBe(true);
        expect(roles.length).toBeGreaterThanOrEqual(5);
      });

      it('should get default role', () => {
        const { getDefaultRole } = __ns_Role;
        const role = getDefaultRole();
        
        expect(role).toBeDefined();
        expect(role.is_default).toBe(1);
      });

      it('should check if role exists', () => {
        const { roleExists } = __ns_Role;
        const exists = roleExists('Admin');
        const notExists = roleExists('Nonexistent Role');
        
        expect(exists).toBe(true);
        expect(notExists).toBe(false);
      });

      it('should get roles with permission count', () => {
        // Note: the model only exposes getRolesWithPermissionCount (counts rows
        // in role_permissions). A getRolesWithUserCount function does not exist
        // anywhere in Role.js/roleService.js - this test originally referenced
        // a function that was never implemented.
        const { getRolesWithPermissionCount } = __ns_Role;
        const roles = getRolesWithPermissionCount();

        expect(Array.isArray(roles)).toBe(true);
        expect(roles.every(r => r.permission_count !== undefined)).toBe(true);
      });

      it('should update a role', () => {
        const { updateRole } = __ns_Role;
        const updated = updateRole(3, {
          description: 'Updated Student role',
          isActive: false
        });

        expect(updated).toBeDefined();
        expect(updated.description).toBe('Updated Student role');
        expect(updated.is_active).toBe(0);
      });

      it('should delete a role', () => {
        const { deleteRole, getRoleById } = __ns_Role;
        const roleId = 5;
        const deleted = deleteRole(roleId);
        const deletedRole = getRoleById(roleId);

        expect(deleted).toBe(true);
        expect(deletedRole).toBeNull();
      });

      it('should get role count', () => {
        const { getRoleCount } = __ns_Role;
        const count = getRoleCount();
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });

      it('should search roles', () => {
        const { searchRoles } = __ns_Role;
        const results = searchRoles('Role');
        
        expect(Array.isArray(results)).toBe(true);
        // searchRoles matches name OR display_name OR description via a
        // case-insensitive SQL LIKE, so the assertion must mirror that
        // (the original case-sensitive .includes('Role') check against only
        // name/description rejected legitimate matches, e.g. display_name-only
        // hits, or names/descriptions containing lowercase "role").
        expect(results.every(r =>
          /role/i.test(r.name) || /role/i.test(r.display_name) || /role/i.test(r.description || '')
        )).toBe(true);
      });

      it('should get role statistics', () => {
        // getRoleStatistics lives in roleService.js, not models/Role.js
        const { getRoleStatistics } = __ns_roleService;
        const stats = getRoleStatistics();

        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
      });

      it('should get all default role names', () => {
        // getDefaultRoleNames lives in roleService.js and returns the
        // DEFAULT_ROLES constant map (name -> lowercase identifier), not
        // an array of display names.
        const { getDefaultRoleNames } = __ns_roleService;
        const names = getDefaultRoleNames();

        expect(names).toBeInstanceOf(Object);
        expect(names.ADMIN).toBe('admin');
      });
    });

    describe('Model Exports', () => {
      it('should export all expected functions and constants', () => {
        const Role = __ns_Role;
        
        expect(Role).toBeDefined();
        expect(Role.ROLES_TABLE).toBe('roles');
        expect(Role.ROLE_FIELDS).toBeInstanceOf(Object);
        expect(Role.DEFAULT_ROLES).toBeInstanceOf(Object);
        expect(typeof Role.createRole).toBe('function');
        expect(typeof Role.getRoleById).toBe('function');
        expect(typeof Role.getRoleByName).toBe('function');
        expect(typeof Role.getAllRoles).toBe('function');
        expect(typeof Role.getDefaultRole).toBe('function');
        expect(typeof Role.roleExists).toBe('function');
        // getRolesWithUserCount never existed on the model; the real function
        // is getRolesWithPermissionCount. getRoleStatistics/getDefaultRoleNames
        // live in roleService.js, not models/Role.js - see the Role Service tests.
        expect(typeof Role.getRolesWithPermissionCount).toBe('function');
        expect(typeof Role.updateRole).toBe('function');
        expect(typeof Role.deleteRole).toBe('function');
        expect(typeof Role.getRoleCount).toBe('function');
        expect(typeof Role.searchRoles).toBe('function');
        expect(typeof Role.setDefaultRole).toBe('function');
      });
    });
  });

  // ============================================
  // Service Tests
  // ============================================
  
  describe('Role Service', () => {
    describe('Service Functions', () => {
      it('should validate role data', () => {
        const { validateRole } = __ns_roleService;
        
        const validData = {
          name: 'valid_role',
          displayName: 'Valid Role',
          description: 'Valid description',
          isDefault: false,
          isActive: true
        };
        
        const result = validateRole(validData);
        expect(result).toBeDefined();
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid role data', () => {
        const { validateRole } = __ns_roleService;
        
        const invalidData = {
          name: '',
          description: '',
          isDefault: null,
          isActive: null
        };
        
        const result = validateRole(invalidData);
        expect(result.isValid).toBe(false);
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should get paginated roles', () => {
        const { getPaginatedRoles } = __ns_roleService;
        const result = getPaginatedRoles({ page: 1, pageSize: 5 });

        expect(result).toBeDefined();
        expect(Array.isArray(result.roles)).toBe(true);
        expect(result.pagination).toBeDefined();
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.pageSize).toBe(5);
      });

      it('should create a role with service', async () => {
        const { createRole } = __ns_roleService;
        const newRole = await createRole({
          name: 'service_test_role',
          displayName: 'Service Test Role',
          description: 'Service test role',
          isDefault: false,
          isActive: true
        });

        expect(newRole).toBeDefined();
        expect(newRole.name).toBe('service_test_role');
      });

      it('should update a role with service', async () => {
        const { updateRole } = __ns_roleService;
        const updated = await updateRole(2, {
          description: 'Updated by service'
        });

        expect(updated).toBeDefined();
        expect(updated.description).toBe('Updated by service');
      });

      it('should delete a role with service', () => {
        const { deleteRole, getRoleById } = __ns_roleService;
        const roleId = 4;
        const deleted = deleteRole(roleId);
        const deletedRole = getRoleById(roleId);

        expect(deleted).toBe(true);
        expect(deletedRole).toBeNull();
      });

      it('should get role statistics from service', () => {
        const { getRoleStatistics } = __ns_roleService;
        const stats = getRoleStatistics();
        
        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
      });

      it('should set a role as default', () => {
        const { setDefaultRole, getDefaultRole } = __ns_roleService;
        setDefaultRole(2);
        const defaultRole = getDefaultRole();
        
        expect(defaultRole).toBeDefined();
        expect(defaultRole.id).toBe(2);
        // Reset to original default
        setDefaultRole(1);
      });
    });

    describe('Service Exports', () => {
      it('should export all expected service functions', () => {
        const roleService = __ns_roleService;
        
        expect(roleService).toBeDefined();
        expect(typeof roleService.validateRole).toBe('function');
        expect(typeof roleService.getPaginatedRoles).toBe('function');
        expect(typeof roleService.createRole).toBe('function');
        expect(typeof roleService.getRoleById).toBe('function');
        expect(typeof roleService.getRoleByName).toBe('function');
        expect(typeof roleService.getAllRoles).toBe('function');
        expect(typeof roleService.getDefaultRole).toBe('function');
        expect(typeof roleService.updateRole).toBe('function');
        expect(typeof roleService.deleteRole).toBe('function');
        expect(typeof roleService.getRoleCount).toBe('function');
        expect(typeof roleService.getRoleStatistics).toBe('function');
        expect(typeof roleService.setDefaultRole).toBe('function');
      });
    });
  });
});

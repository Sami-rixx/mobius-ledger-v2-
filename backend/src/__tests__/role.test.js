/**
 * Role Module Tests
 * Comprehensive tests for Role model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import Database from 'better-sqlite3';
import Role from '../models/Role.js';
import roleService from '../services/roleService.js';

// Test database setup
const TEST_DB = ':memory:';
let testDb;

// Mock the database module
jest.mock('../config/database.js', () => ({
  default: testDb
}));

describe('Role Module', () => {
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

    // Insert test roles
    const insertRole = testDb.prepare(`
      INSERT INTO roles (name, description, is_default, is_active)
      VALUES (?, ?, ?, ?)
    `);
    
    insertRole.run('Admin', 'Administrator with full access', 1, 1);
    insertRole.run('Teacher', 'Teacher role with limited access', 0, 1);
    insertRole.run('Student', 'Student role with read-only access', 0, 1);
    insertRole.run('Accountant', 'Accountant role for financial operations', 0, 1);
    insertRole.run('Inactive Role', 'Inactive test role', 0, 0);
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
  
  describe('Role Model', () => {
    describe('Constants', () => {
      it('should export ROLES_TABLE constant', () => {
        expect(Role.ROLES_TABLE).toBe('roles');
      });

      it('should export ROLE_FIELDS constant', () => {
        expect(Role.ROLE_FIELDS).toBeInstanceOf(Array);
        expect(Role.ROLE_FIELDS.length).toBeGreaterThan(0);
      });

      it('should export DEFAULT_ROLES constant', () => {
        expect(Role.DEFAULT_ROLES).toBeInstanceOf(Array);
        expect(Role.DEFAULT_ROLES).toContain('Admin');
      });
    });

    describe('Model Functions', () => {
      it('should create a new role', () => {
        const newRole = Role.createRole({
          name: 'Test Role',
          description: 'Test role for testing',
          is_default: 0,
          is_active: 1
        });
        
        expect(newRole).toBeDefined();
        expect(newRole.name).toBe('Test Role');
        expect(newRole.description).toBe('Test role for testing');
      });

      it('should get role by ID', () => {
        const role = Role.getRoleById(1);
        
        expect(role).toBeDefined();
        expect(role.name).toBe('Admin');
      });

      it('should get role by name', () => {
        const role = Role.getRoleByName('Teacher');
        
        expect(role).toBeDefined();
        expect(role.name).toBe('Teacher');
      });

      it('should get all roles', () => {
        const roles = Role.getAllRoles();
        
        expect(roles).toBeInstanceOf(Array);
        expect(roles.length).toBeGreaterThanOrEqual(5);
      });

      it('should get default role', () => {
        const role = Role.getDefaultRole();
        
        expect(role).toBeDefined();
        expect(role.is_default).toBe(1);
      });

      it('should check if role exists', () => {
        const exists = Role.roleExists('Admin');
        const notExists = Role.roleExists('Nonexistent Role');
        
        expect(exists).toBe(true);
        expect(notExists).toBe(false);
      });

      it('should get roles with user count', () => {
        const roles = Role.getRolesWithUserCount();
        
        expect(roles).toBeInstanceOf(Array);
        expect(roles.every(r => r.user_count !== undefined)).toBe(true);
      });

      it('should update a role', () => {
        const updated = Role.updateRole(3, {
          description: 'Updated Student role',
          is_active: 0
        });
        
        expect(updated).toBeDefined();
        expect(updated.description).toBe('Updated Student role');
        expect(updated.is_active).toBe(0);
      });

      it('should delete a role', () => {
        const roleId = 5;
        const deleted = Role.deleteRole(roleId);
        const deletedRole = Role.getRoleById(roleId);
        
        expect(deleted).toBe(true);
        expect(deletedRole).toBeUndefined();
      });

      it('should get role count', () => {
        const count = Role.getRoleCount();
        
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });

      it('should search roles', () => {
        const results = Role.searchRoles('Role');
        
        expect(results).toBeInstanceOf(Array);
        expect(results.every(r => r.name.includes('Role') || r.description.includes('Role'))).toBe(true);
      });

      it('should get role statistics', () => {
        const stats = Role.getRoleStatistics();
        
        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
      });

      it('should get all default role names', () => {
        const names = Role.getDefaultRoleNames();
        
        expect(names).toBeInstanceOf(Array);
        expect(names).toContain('Admin');
      });
    });

    describe('Model Exports', () => {
      it('should export all expected functions and constants', () => {
        expect(Role).toBeDefined();
        expect(Role.ROLES_TABLE).toBe('roles');
        expect(Role.ROLE_FIELDS).toBeInstanceOf(Array);
        expect(Role.DEFAULT_ROLES).toBeInstanceOf(Array);
        expect(typeof Role.createRole).toBe('function');
        expect(typeof Role.getRoleById).toBe('function');
        expect(typeof Role.getRoleByName).toBe('function');
        expect(typeof Role.getAllRoles).toBe('function');
        expect(typeof Role.getDefaultRole).toBe('function');
        expect(typeof Role.roleExists).toBe('function');
        expect(typeof Role.getRolesWithUserCount).toBe('function');
        expect(typeof Role.updateRole).toBe('function');
        expect(typeof Role.deleteRole).toBe('function');
        expect(typeof Role.getRoleCount).toBe('function');
        expect(typeof Role.searchRoles).toBe('function');
        expect(typeof Role.getRoleStatistics).toBe('function');
        expect(typeof Role.getDefaultRoleNames).toBe('function');
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
        const result = roleService.validateRole({
          name: 'Valid Role',
          description: 'Valid description',
          is_default: 0,
          is_active: 1
        });
        expect(result).toBeDefined();
        expect(result.isValid).toBe(true);
      });

      it('should reject invalid role data', () => {
        const result = roleService.validateRole({
          name: '',
          description: '',
          is_default: null,
          is_active: null
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeInstanceOf(Array);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should get paginated roles', () => {
        const result = roleService.getPaginatedRoles({ page: 1, pageSize: 5 });
        
        expect(result).toBeDefined();
        expect(result.data).toBeInstanceOf(Array);
        expect(result.total).toBeDefined();
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(5);
      });

      it('should create a role with service', () => {
        const newRole = roleService.createRole({
          name: 'Service Test Role',
          description: 'Service test role',
          is_default: 0,
          is_active: 1
        });
        
        expect(newRole).toBeDefined();
        expect(newRole.name).toBe('Service Test Role');
      });

      it('should update a role with service', () => {
        const updated = roleService.updateRole(2, {
          description: 'Updated by service'
        });
        
        expect(updated).toBeDefined();
        expect(updated.description).toBe('Updated by service');
      });

      it('should delete a role with service', () => {
        const roleId = 4;
        const deleted = roleService.deleteRole(roleId);
        const deletedRole = roleService.getRoleById(roleId);
        
        expect(deleted).toBe(true);
        expect(deletedRole).toBeUndefined();
      });

      it('should get role statistics from service', () => {
        const stats = roleService.getRoleStatistics();
        
        expect(stats).toBeDefined();
        expect(stats.total).toBeDefined();
      });

      it('should set a role as default', () => {
        roleService.setDefaultRole(2);
        const defaultRole = roleService.getDefaultRole();
        
        expect(defaultRole).toBeDefined();
        expect(defaultRole.id).toBe(2);
        // Reset to original default
        roleService.setDefaultRole(1);
      });
    });

    describe('Service Exports', () => {
      it('should export all expected service functions', () => {
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

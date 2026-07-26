/**
 * Audit Trail Module Tests
 * Comprehensive tests for AuditTrail model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  getAllAuditTrails,
  getAuditTrailCount,
  getAuditTrailById,
  getAuditTrailByRecord,
  getAuditTrailByTable,
  getRecentAuditTrails,
  createAuditTrail,
  deleteAuditTrail,
  getAuditTrailStatistics
} from '../models/AuditTrail.js';

import {
  validateAuditTrail,
  getPaginatedAuditTrails,
  getAuditTrail,
  getAuditTrailsByRecord,
  getAuditTrailsByTable,
  getRecentAuditTrails as getRecentAuditTrailsService,
  createAuditTrailRecord,
  deleteAuditTrailRecord,
  searchAuditTrails,
  getAuditTrailStats,
  getAuditTrailCountByFilter,
  logFinancialAction
} from '../services/auditTrailService.js';

import Database from 'better-sqlite3';

// Test database setup
const TEST_DB = ':memory:';
let testDb;

describe('Audit Trail Module', () => {
  beforeAll(() => {
    // Create in-memory database for testing
    testDb = new Database(TEST_DB);
    
    // Create audit_trail and users tables
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

      CREATE TABLE IF NOT EXISTS audit_trail (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        old_values TEXT,
        new_values TEXT,
        user_id INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_audit_trail_table_name ON audit_trail(table_name);
      CREATE INDEX IF NOT EXISTS idx_audit_trail_record_id ON audit_trail(record_id);
      CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail(action);
      CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at);
    `);

    // Insert test users
    const insertUser = testDb.prepare('INSERT INTO users (id, username, full_name, role) VALUES (?, ?, ?, ?)');
    insertUser.run(1, 'admin', 'Admin User', 'admin');
    insertUser.run(2, 'user1', 'Regular User', 'user');
    
    // Insert test audit trail entries
    const insertAudit = testDb.prepare(`
      INSERT INTO audit_trail (action, table_name, record_id, old_values, new_values, user_id, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertAudit.run('CREATE', 'students', 1, null, JSON.stringify({ name: 'John Doe' }), 1, '192.168.1.1', 'Mozilla/5.0');
    insertAudit.run('UPDATE', 'students', 1, JSON.stringify({ name: 'John Doe' }), JSON.stringify({ name: 'Jane Doe' }), 1, '192.168.1.1', 'Mozilla/5.0');
    insertAudit.run('DELETE', 'students', 2, JSON.stringify({ name: 'Test Student' }), null, 2, '192.168.1.2', 'Chrome/100.0');
  });

  afterAll(() => {
    // Close test database connection
    try {
      testDb.close();
    } catch (e) {
      // Ignore errors during cleanup
    }
  });

  // Test AuditTrail model functions
  describe('AuditTrail Model Functions', () => {
    it('should export getAllAuditTrails function', () => {
      expect(typeof getAllAuditTrails).toBe('function');
    });

    it('should export getAuditTrailCount function', () => {
      expect(typeof getAuditTrailCount).toBe('function');
    });

    it('should export getAuditTrailById function', () => {
      expect(typeof getAuditTrailById).toBe('function');
    });

    it('should export getAuditTrailByRecord function', () => {
      expect(typeof getAuditTrailByRecord).toBe('function');
    });

    it('should export getAuditTrailByTable function', () => {
      expect(typeof getAuditTrailByTable).toBe('function');
    });

    it('should export getRecentAuditTrails function', () => {
      expect(typeof getRecentAuditTrails).toBe('function');
    });

    it('should export createAuditTrail function', () => {
      expect(typeof createAuditTrail).toBe('function');
    });

    it('should export deleteAuditTrail function', () => {
      expect(typeof deleteAuditTrail).toBe('function');
    });

    it('should export getAuditTrailStatistics function', () => {
      expect(typeof getAuditTrailStatistics).toBe('function');
    });
  });

  // Test AuditTrail service functions
  describe('AuditTrail Service Functions', () => {
    it('should export validateAuditTrail function', () => {
      expect(typeof validateAuditTrail).toBe('function');
    });

    it('should export getPaginatedAuditTrails function', () => {
      expect(typeof getPaginatedAuditTrails).toBe('function');
    });

    it('should export getAuditTrail function', () => {
      expect(typeof getAuditTrail).toBe('function');
    });

    it('should export createAuditTrailRecord function', () => {
      expect(typeof createAuditTrailRecord).toBe('function');
    });

    it('should export deleteAuditTrailRecord function', () => {
      expect(typeof deleteAuditTrailRecord).toBe('function');
    });

    it('should export searchAuditTrails function', () => {
      expect(typeof searchAuditTrails).toBe('function');
    });

    it('should export getAuditTrailStats function', () => {
      expect(typeof getAuditTrailStats).toBe('function');
    });

    it('should export getAuditTrailCountByFilter function', () => {
      expect(typeof getAuditTrailCountByFilter).toBe('function');
    });

    it('should export logFinancialAction function', () => {
      expect(typeof logFinancialAction).toBe('function');
    });
  });

  // Test validation
  describe('Service Validation', () => {
    it('should validate valid audit trail data', () => {
      const validData = {
        action: 'CREATE',
        tableName: 'students',
        recordId: 1
      };
      const result = validateAuditTrail(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid action', () => {
      const invalidData = {
        action: 'INVALID',
        tableName: 'students',
        recordId: 1
      };
      const result = validateAuditTrail(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid action. Must be one of: CREATE, UPDATE, DELETE');
    });

    it('should reject missing action', () => {
      const invalidData = {
        tableName: 'students',
        recordId: 1
      };
      const result = validateAuditTrail(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Action is required');
    });

    it('should reject missing table name', () => {
      const invalidData = {
        action: 'CREATE',
        recordId: 1
      };
      const result = validateAuditTrail(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Table name is required');
    });

    it('should reject missing record ID', () => {
      const invalidData = {
        action: 'CREATE',
        tableName: 'students'
      };
      const result = validateAuditTrail(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Record ID is required');
    });

    it('should reject invalid record ID', () => {
      const invalidData = {
        action: 'CREATE',
        tableName: 'students',
        recordId: 'invalid'
      };
      const result = validateAuditTrail(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Record ID must be a valid number');
    });
  });

  // Test pagination
  describe('Service Pagination', () => {
    it('should return pagination info with default values', () => {
      const result = getPaginatedAuditTrails({});
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toHaveProperty('page');
      expect(result.pagination).toHaveProperty('pageSize');
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('totalPages');
    });
  });

  // Test statistics
  describe('Service Statistics', () => {
    it('should return statistics object with correct structure', () => {
      const stats = getAuditTrailStats({});
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byAction');
      expect(stats).toHaveProperty('byTable');
    });
  });

  // Test count
  describe('Service Count', () => {
    it('should return a number', () => {
      const count = getAuditTrailCountByFilter({});
      expect(typeof count).toBe('number');
    });
  });

  // Test logFinancialAction
  describe('Service Financial Action Logging', () => {
    it('should log valid financial action', () => {
      const result = logFinancialAction(
        'CREATE',
        'students',
        100,
        null,
        { name: 'New Student' },
        { userId: 1, ipAddress: '192.168.1.1', userAgent: 'Test' }
      );
      expect(result).toHaveProperty('success');
      // Should succeed even if it returns a warning
      expect(result.success).toBe(true);
    });

    it('should reject invalid action in logFinancialAction', () => {
      const result = logFinancialAction(
        'INVALID',
        'students',
        100,
        null,
        { name: 'New Student' }
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid action');
    });
  });
});

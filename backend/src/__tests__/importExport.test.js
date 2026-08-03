/**
 * Import/Export Module Tests
 * Comprehensive tests for ImportExport model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import ImportExport from '../models/ImportExport.js';
import importExportService from '../services/importExportService.js';

// Test database setup
const TEST_DB = ':memory:';
let testDb;

// Mock the database module
jest.mock('../config/database.js', () => ({
  default: testDb
}));

describe('ImportExport Module', () => {
  beforeAll(() => {
    // Create in-memory database for testing
    testDb = new Database(TEST_DB);
    
    // Create users and import_export_log tables
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

      CREATE TABLE IF NOT EXISTS import_export_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        action TEXT NOT NULL,
        table_name TEXT,
        file_name TEXT,
        record_count INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT,
        user_id INTEGER,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_number TEXT UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        transaction_type TEXT NOT NULL,
        description TEXT,
        related_id INTEGER,
        related_table TEXT,
        transaction_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admission_number TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS school_fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        payment_date DATE,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (student_id) REFERENCES students(id)
      );
    `);

    // Insert test data
    const insertUser = testDb.prepare('INSERT INTO users (username, full_name, role) VALUES (?, ?, ?)');
    const user1 = insertUser.run('testuser', 'Test User', 'admin');
    const user2 = insertUser.run('staffuser', 'Staff User', 'staff');

    const insertTransaction = testDb.prepare(`
      INSERT INTO transactions (receipt_number, amount, transaction_type, description, transaction_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertTransaction.run('ML-2026-000001', 500000, 'income', 'School fees payment', '2026-01-15', user1.lastInsertRowid);
    insertTransaction.run('ML-2026-000002', 200000, 'expense', 'Stationery purchase', '2026-01-16', user1.lastInsertRowid);
    insertTransaction.run('ML-2026-000003', 300000, 'income', 'Lunch fees', '2026-01-17', user2.lastInsertRowid);

    const insertStudent = testDb.prepare('INSERT INTO students (admission_number, first_name, last_name) VALUES (?, ?, ?)');
    insertStudent.run('STU-001', 'John', 'Doe');
    insertStudent.run('STU-002', 'Jane', 'Smith');

    const insertSchoolFee = testDb.prepare('INSERT INTO school_fees (student_id, amount, payment_date, status) VALUES (?, ?, ?, ?)');
    insertSchoolFee.run(1, 500000, '2026-01-15', 'paid');
    insertSchoolFee.run(2, 500000, '2026-01-16', 'pending');
  });

  afterAll(() => {
    if (testDb) {
      testDb.close();
    }
    // Clean up any test files
    const exportDir = path.join(process.cwd(), 'exports');
    const backupDir = path.join(process.cwd(), 'backups');
    try {
      if (fs.existsSync(exportDir)) {
        fs.rmSync(exportDir, { recursive: true, force: true });
      }
      if (fs.existsSync(backupDir)) {
        fs.rmSync(backupDir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    // Clear the import_export_log table before each test
    testDb.prepare('DELETE FROM import_export_log').run();
  });

  // Test ImportExport Model
  describe('ImportExport Model', () => {

    describe('Constants', () => {
      it('should have IMPORT_EXPORT_TYPES constant', () => {
        expect(ImportExport.IMPORT_EXPORT_TYPES).toBeDefined();
        expect(ImportExport.IMPORT_EXPORT_TYPES).toHaveProperty('EXPORT');
        expect(ImportExport.IMPORT_EXPORT_TYPES).toHaveProperty('IMPORT');
      });

      it('should have IMPORT_EXPORT_ACTIONS constant', () => {
        expect(ImportExport.IMPORT_EXPORT_ACTIONS).toBeDefined();
        expect(ImportExport.IMPORT_EXPORT_ACTIONS).toHaveProperty('DATABASE_EXPORT');
        expect(ImportExport.IMPORT_EXPORT_ACTIONS).toHaveProperty('DATABASE_IMPORT');
      });

      it('should have IMPORT_EXPORT_STATUS constant', () => {
        expect(ImportExport.IMPORT_EXPORT_STATUS).toBeDefined();
        expect(ImportExport.IMPORT_EXPORT_STATUS).toHaveProperty('PENDING');
        expect(ImportExport.IMPORT_EXPORT_STATUS).toHaveProperty('COMPLETED');
      });
    });

    describe('createLog', () => {
      it('should create a new import/export log', () => {
        const log = ImportExport.createLog({
          type: 'export',
          action: 'database_export',
          table_name: 'transactions',
          file_name: 'export_20260115.sql',
          record_count: 10,
          status: 'completed',
          user_id: 1
        });

        expect(log).toBeDefined();
        expect(log.type).toBe('export');
        expect(log.action).toBe('database_export');
        expect(log.table_name).toBe('transactions');
        expect(log.file_name).toBe('export_20260115.sql');
        expect(log.record_count).toBe(10);
        expect(log.status).toBe('completed');
        expect(log.user_id).toBe(1);
      });

      it('should create a log with default status', () => {
        const log = ImportExport.createLog({
          type: 'import',
          action: 'csv_import',
          table_name: 'students',
          file_name: 'students.csv',
          record_count: 50,
          user_id: 1
        });

        expect(log.status).toBe('pending');
      });
    });

    describe('getLogById', () => {
      it('should retrieve a log by ID', () => {
        const created = ImportExport.createLog({
          type: 'export',
          action: 'csv_export',
          file_name: 'test.csv',
          user_id: 1
        });

        const log = ImportExport.getLogById(created.id);
        expect(log).toBeDefined();
        expect(log.id).toBe(created.id);
        expect(log.type).toBe('export');
      });

      it('should return null for non-existent log', () => {
        const log = ImportExport.getLogById(99999);
        expect(log).toBeNull();
      });
    });

    describe('getAllLogs', () => {
      it('should retrieve all logs', () => {
        ImportExport.createLog({ type: 'export', action: 'database_export', user_id: 1 });
        ImportExport.createLog({ type: 'import', action: 'csv_import', user_id: 1 });
        ImportExport.createLog({ type: 'export', action: 'backup', user_id: 2 });

        const logs = ImportExport.getAllLogs();
        expect(logs).toBeDefined();
        expect(logs.length).toBeGreaterThanOrEqual(3);
      });

      it('should filter logs by type', () => {
        ImportExport.createLog({ type: 'export', action: 'database_export', user_id: 1 });
        ImportExport.createLog({ type: 'import', action: 'csv_import', user_id: 1 });

        const exportLogs = ImportExport.getAllLogs({ type: 'export' });
        expect(exportLogs).toBeDefined();
        expect(exportLogs.every(log => log.type === 'export')).toBe(true);
      });
    });

    describe('countLogs', () => {
      it('should count all logs', () => {
        ImportExport.createLog({ type: 'export', action: 'database_export', user_id: 1 });
        ImportExport.createLog({ type: 'import', action: 'csv_import', user_id: 1 });

        const count = ImportExport.countLogs();
        expect(count).toBeGreaterThanOrEqual(2);
      });

      it('should count logs with filter', () => {
        ImportExport.createLog({ type: 'export', action: 'database_export', user_id: 1 });
        ImportExport.createLog({ type: 'import', action: 'csv_import', user_id: 1 });

        const exportCount = ImportExport.countLogs({ type: 'export' });
        expect(exportCount).toBeGreaterThanOrEqual(1);
      });
    });

    describe('getStatistics', () => {
      it('should return statistics for import/export operations', () => {
        ImportExport.createLog({ type: 'export', action: 'database_export', status: 'completed', record_count: 100, user_id: 1 });
        ImportExport.createLog({ type: 'export', action: 'csv_export', status: 'completed', record_count: 50, user_id: 1 });
        ImportExport.createLog({ type: 'import', action: 'csv_import', status: 'failed', record_count: 0, user_id: 2 });

        const stats = ImportExport.getStatistics();
        expect(stats).toBeDefined();
        expect(stats).toHaveProperty('total');
        expect(stats).toHaveProperty('byType');
        expect(stats).toHaveProperty('byAction');
        expect(stats).toHaveProperty('byStatus');
      });
    });

    describe('getSupportedTables', () => {
      it('should return array of supported tables', () => {
        const tables = ImportExport.getSupportedTables();
        expect(tables).toBeDefined();
        expect(Array.isArray(tables)).toBe(true);
        expect(tables.length).toBeGreaterThan(0);
        expect(tables).toContain('users');
        expect(tables).toContain('transactions');
      });
    });

    describe('formatFileSize', () => {
      it('should format file size in bytes', () => {
        const size1 = ImportExport.formatFileSize(100);
        const size2 = ImportExport.formatFileSize(1024);
        const size3 = ImportExport.formatFileSize(1024 * 1024);
        const size4 = ImportExport.formatFileSize(1024 * 1024 * 1024);

        expect(size1).toContain('B');
        expect(size2).toContain('KB');
        expect(size3).toContain('MB');
        expect(size4).toContain('GB');
      });
    });

    describe('parseCSVLine', () => {
      it('should parse CSV line correctly', () => {
        const line = 'John,Doe,25,john@example.com';
        const parsed = ImportExport.parseCSVLine(line);
        expect(parsed).toEqual(['John', 'Doe', '25', 'john@example.com']);
      });

      it('should handle empty line', () => {
        const line = '';
        const parsed = ImportExport.parseCSVLine(line);
        expect(parsed).toEqual(['']);
      });
    });
  });

  // Test ImportExport Service
  describe('ImportExport Service', () => {

    describe('validateParams', () => {
      it('should validate valid params', () => {
        const params = { tableName: 'users', page: 1, limit: 10 };
        const result = importExportService.validateParams(params);
        expect(result).toBeDefined();
        expect(result.valid).toBe(true);
      });

      it('should detect invalid table name', () => {
        const params = { tableName: 'nonexistent', page: 1, limit: 10 };
        const result = importExportService.validateParams(params);
        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });

    describe('createPaginationParams', () => {
      it('should create pagination params with defaults', () => {
        const params = importExportService.createPaginationParams({});
        expect(params).toBeDefined();
        expect(params.page).toBe(1);
        expect(params.limit).toBe(10);
      });

      it('should use provided page and limit', () => {
        const params = importExportService.createPaginationParams({ page: 2, limit: 20 });
        expect(params.page).toBe(2);
        expect(params.limit).toBe(20);
      });
    });

    describe('getPaginatedLogs', () => {
      it('should return paginated logs', () => {
        ImportExport.createLog({ type: 'export', action: 'database_export', user_id: 1 });
        ImportExport.createLog({ type: 'import', action: 'csv_import', user_id: 1 });

        const result = importExportService.getPaginatedLogs({ page: 1, limit: 10 });
        expect(result).toBeDefined();
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('pagination');
        expect(Array.isArray(result.data)).toBe(true);
      });
    });

    describe('getLogById', () => {
      it('should retrieve log by ID', () => {
        const created = ImportExport.createLog({ type: 'export', action: 'database_export', user_id: 1 });

        const log = importExportService.getLogById(created.id);
        expect(log).toBeDefined();
        expect(log.id).toBe(created.id);
      });
    });

    describe('getStatistics', () => {
      it('should return import/export statistics', () => {
        const stats = importExportService.getStatistics();
        expect(stats).toBeDefined();
        expect(stats).toHaveProperty('total');
        expect(stats).toHaveProperty('byType');
        expect(stats).toHaveProperty('byAction');
      });
    });

    describe('getSupportedTables', () => {
      it('should return supported tables', () => {
        const tables = importExportService.getSupportedTables();
        expect(tables).toBeDefined();
        expect(Array.isArray(tables)).toBe(true);
        expect(tables.length).toBeGreaterThan(0);
      });
    });

    describe('formatFileSize', () => {
      it('should format file size correctly', () => {
        const size = importExportService.formatFileSize(1024);
        expect(size).toContain('KB');
      });
    });
  });

  // Test Module Exports
  describe('Module Exports', () => {
    it('should export ImportExport model', () => {
      expect(ImportExport).toBeDefined();
      expect(typeof ImportExport.createLog).toBe('function');
      expect(typeof ImportExport.getLogById).toBe('function');
      expect(typeof ImportExport.getAllLogs).toBe('function');
      expect(typeof ImportExport.countLogs).toBe('function');
      expect(typeof ImportExport.getStatistics).toBe('function');
      expect(typeof ImportExport.getSupportedTables).toBe('function');
    });

    it('should export importExportService', () => {
      expect(importExportService).toBeDefined();
      expect(typeof importExportService.validateParams).toBe('function');
      expect(typeof importExportService.getPaginatedLogs).toBe('function');
      expect(typeof importExportService.getLogById).toBe('function');
      expect(typeof importExportService.getStatistics).toBe('function');
    });

    it('should export importExportController', async () => {
      const importExportController = await import('../controllers/importExportController.js');
      expect(importExportController).toBeDefined();
      expect(typeof importExportController.listLogs).toBe('function');
      expect(typeof importExportController.countLogs).toBe('function');
      expect(typeof importExportController.getLogById).toBe('function');
      expect(typeof importExportController.getStatistics).toBe('function');
      expect(typeof importExportController.exportDatabase).toBe('function');
      expect(typeof importExportController.importDatabase).toBe('function');
      expect(typeof importExportController.exportToCSV).toBe('function');
      expect(typeof importExportController.importFromCSV).toBe('function');
      expect(typeof importExportController.createBackup).toBe('function');
      expect(typeof importExportController.restoreBackup).toBe('function');
      expect(typeof importExportController.listBackups).toBe('function');
      expect(typeof importExportController.listExports).toBe('function');
      expect(typeof importExportController.deleteBackup).toBe('function');
      expect(typeof importExportController.deleteExport).toBe('function');
      expect(typeof importExportController.getSupportedTables).toBe('function');
    });

    it('should export importExportRoutes', async () => {
      const importExportRoutes = await import('../routes/importExportRoutes.js');
      expect(importExportRoutes).toBeDefined();
      expect(importExportRoutes.default).toBeDefined();
    });
  });
});

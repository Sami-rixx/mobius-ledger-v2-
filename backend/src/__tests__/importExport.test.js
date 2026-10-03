/**
 * Import/Export Module Tests
 * Comprehensive tests for ImportExport model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import db from '../config/database.js';
import path from 'path';
import fs from 'fs';
import __ImportExport, { IMPORT_EXPORT_STATUS, EXPORT_TYPES, IMPORT_TYPES } from '../models/ImportExport.js';
import __importExportService from '../services/importExportService.js';
import __importExportController from '../controllers/importExportController.js';
import __importExportRoutes from '../routes/importExportRoutes.js';

// Test database setup
const TEST_DB = ':memory:';
let testDb;


describe('ImportExport Module', () => {
  beforeAll(() => {
    // Create in-memory database for testing
    testDb = db;
    
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
        amount DECIMAL(10, 2) NOT NULL,
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
        amount DECIMAL(10, 2) NOT NULL,
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
    insertTransaction.run('ML-2026-000001', 5000.00, 'income', 'School fees payment', '2026-01-15', user1.lastInsertRowid);
    insertTransaction.run('ML-2026-000002', 2000.00, 'expense', 'Stationery purchase', '2026-01-16', user1.lastInsertRowid);
    insertTransaction.run('ML-2026-000003', 3000.00, 'income', 'Lunch fees', '2026-01-17', user2.lastInsertRowid);

    // testDb is the shared db singleton, so this stub CREATE TABLE IF NOT
    // EXISTS is a no-op against the real schema.sql students table, which
    // requires parent_name/parent_phone NOT NULL - must supply them here.
    const insertStudent = testDb.prepare('INSERT INTO students (admission_number, first_name, last_name, parent_name, parent_phone) VALUES (?, ?, ?, ?, ?)');
    insertStudent.run('STU-001', 'John', 'Doe', 'John Doe Sr.', '0700000001');
    insertStudent.run('STU-002', 'Jane', 'Smith', 'Jane Smith Sr.', '0700000002');

    const insertSchoolFee = testDb.prepare('INSERT INTO school_fees (student_id, amount, payment_date, status) VALUES (?, ?, ?, ?)');
    insertSchoolFee.run(1, 5000.00, '2026-01-15', 'paid');
    insertSchoolFee.run(2, 5000.00, '2026-01-16', 'pending');
  });

  afterAll(() => {
    if (testDb) {
      // no-op: testDb is the shared db singleton, do not close it here
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
    const ImportExport = __ImportExport;

    describe('Constants', () => {
      it('should have EXPORT_TYPES constant', () => {
        // The model has no combined IMPORT_EXPORT_TYPES constant - EXPORT_TYPES
        // and IMPORT_TYPES are separate objects, both { DATABASE, CSV, BACKUP }.
        expect(ImportExport.EXPORT_TYPES).toBeDefined();
        expect(ImportExport.EXPORT_TYPES).toHaveProperty('DATABASE');
        expect(ImportExport.EXPORT_TYPES).toHaveProperty('CSV');
      });

      it('should have IMPORT_TYPES constant', () => {
        expect(ImportExport.IMPORT_TYPES).toBeDefined();
        expect(ImportExport.IMPORT_TYPES).toHaveProperty('DATABASE');
        expect(ImportExport.IMPORT_TYPES).toHaveProperty('CSV');
      });

      it('should have IMPORT_EXPORT_STATUS constant', () => {
        expect(ImportExport.IMPORT_EXPORT_STATUS).toBeDefined();
        expect(ImportExport.IMPORT_EXPORT_STATUS).toHaveProperty('PENDING');
        expect(ImportExport.IMPORT_EXPORT_STATUS).toHaveProperty('COMPLETED');
      });
    });

    describe('createLog', () => {
      it('should create a new import/export log', async () => {
        // createLog takes camelCase keys (tableName/fileName/recordCount/
        // userId, not table_name/file_name/record_count/user_id), and its
        // return value echoes back the literal input data (plus id and a
        // resolved status) rather than the persisted DB row.
        const log = await ImportExport.createLog({
          type: 'export',
          action: 'database_export',
          tableName: 'transactions',
          fileName: 'export_20260115.sql',
          recordCount: 10,
          status: 'completed',
          userId: 1
        });

        expect(log).toBeDefined();
        expect(log.type).toBe('export');
        expect(log.action).toBe('database_export');
        expect(log.tableName).toBe('transactions');
        expect(log.fileName).toBe('export_20260115.sql');
        expect(log.recordCount).toBe(10);
        expect(log.status).toBe('completed');
        expect(log.userId).toBe(1);
      });

      it('should create a log with default status', async () => {
        // When status is omitted, createLog resolves it to
        // IMPORT_EXPORT_STATUS.PENDING ('pending') rather than relying on
        // the DB column default (which previously caused a NOT NULL
        // constraint violation since the INSERT always supplies a status
        // value positionally, even when undefined).
        const log = await ImportExport.createLog({
          type: 'import',
          action: 'csv_import',
          tableName: 'students',
          fileName: 'students.csv',
          recordCount: 50,
          userId: 1
        });

        expect(log.status).toBe('pending');
      });
    });

    describe('getLogById', () => {
      it('should retrieve a log by ID', async () => {
        const created = await ImportExport.createLog({
          type: 'export',
          action: 'csv_export',
          fileName: 'test.csv',
          status: 'completed',
          userId: 1
        });

        // getLogById returns the actual persisted DB row (snake_case
        // columns), not the camelCase object createLog() returns.
        const log = await ImportExport.getLogById(created.id);
        expect(log).toBeDefined();
        expect(log.id).toBe(created.id);
        expect(log.type).toBe('export');
      });

      it('should return null for non-existent log', async () => {
        // getLogById normalizes better-sqlite3's raw `undefined` (no row
        // matched) to null, matching the convention used by every other
        // *ById model lookup in this codebase (e.g. Role.getRoleById).
        const log = await ImportExport.getLogById(99999);
        expect(log).toBeNull();
      });
    });

    describe('getAllLogs', () => {
      it('should retrieve all logs', async () => {
        await ImportExport.createLog({ type: 'export', action: 'database_export', status: 'completed', userId: 1 });
        await ImportExport.createLog({ type: 'import', action: 'csv_import', status: 'completed', userId: 1 });
        await ImportExport.createLog({ type: 'export', action: 'backup', status: 'completed', userId: 2 });

        const logs = await ImportExport.getAllLogs();
        expect(logs).toBeDefined();
        expect(logs.length).toBeGreaterThanOrEqual(3);
      });

      it('should filter logs by type', async () => {
        await ImportExport.createLog({ type: 'export', action: 'database_export', status: 'completed', userId: 1 });
        await ImportExport.createLog({ type: 'import', action: 'csv_import', status: 'completed', userId: 1 });

        const exportLogs = await ImportExport.getAllLogs({ type: 'export' });
        expect(exportLogs).toBeDefined();
        expect(exportLogs.every(log => log.type === 'export')).toBe(true);
      });
    });

    describe('countLogs', () => {
      it('should count all logs', async () => {
        await ImportExport.createLog({ type: 'export', action: 'database_export', status: 'completed', userId: 1 });
        await ImportExport.createLog({ type: 'import', action: 'csv_import', status: 'completed', userId: 1 });

        const count = await ImportExport.countLogs();
        expect(count).toBeGreaterThanOrEqual(2);
      });

      it('should count logs with filter', async () => {
        await ImportExport.createLog({ type: 'export', action: 'database_export', status: 'completed', userId: 1 });
        await ImportExport.createLog({ type: 'import', action: 'csv_import', status: 'completed', userId: 1 });

        const exportCount = await ImportExport.countLogs({ type: 'export' });
        expect(exportCount).toBeGreaterThanOrEqual(1);
      });
    });

    describe('getStatistics', () => {
      it('should return statistics for import/export operations', async () => {
        // The model's real statistics shape uses snake_case aggregate keys
        // (total_operations/by_type/by_action), not total/byType/byAction/
        // byStatus as this test originally assumed.
        await ImportExport.createLog({ type: 'export', action: 'database_export', status: 'completed', recordCount: 100, userId: 1 });
        await ImportExport.createLog({ type: 'export', action: 'csv_export', status: 'completed', recordCount: 50, userId: 1 });
        await ImportExport.createLog({ type: 'import', action: 'csv_import', status: 'failed', recordCount: 0, userId: 2 });

        const stats = await ImportExport.getStatistics();
        expect(stats).toBeDefined();
        expect(stats).toHaveProperty('total_operations');
        expect(stats).toHaveProperty('by_type');
        expect(stats).toHaveProperty('by_action');
        expect(stats.total_operations).toBeGreaterThanOrEqual(3);
      });
    });

    describe('getSupportedTables', () => {
      it('should return array of supported tables', () => {
        const tables = ImportExport.getSupportedTables();
        expect(tables).toBeDefined();
        expect(Array.isArray(tables)).toBe(true);
        expect(tables.length).toBeGreaterThan(0);
        // 'users' is intentionally not part of SUPPORTED_TABLES - only
        // student/financial data tables are exportable via this feature.
        expect(tables).toContain('students');
        expect(tables).toContain('transactions');
      });
    });

    describe('formatFileSize', () => {
      it('should format file size in bytes', () => {
        const size1 = ImportExport.formatFileSize(100);
        const size2 = ImportExport.formatFileSize(1024);
        const size3 = ImportExport.formatFileSize(1024 * 1024);
        const size4 = ImportExport.formatFileSize(1024 * 1024 * 1024);

        // Sub-1KB sizes are formatted as e.g. "100 bytes" (lowercase, full
        // word), not an abbreviated "B" suffix.
        expect(size1).toContain('bytes');
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
    const importExportService = __importExportService;

    describe('validateParams', () => {
      it('should validate valid params', () => {
        // 'users' is not in SUPPORTED_TABLES - use a real supported table
        // name so this exercises the "valid" path.
        const params = { tableName: 'students', page: 1, limit: 10 };
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
        // The real shape is { page, pageSize, offset } - there is no
        // "limit" field, and the default pageSize is 20, not 10.
        const params = importExportService.createPaginationParams({});
        expect(params).toBeDefined();
        expect(params.page).toBe(1);
        expect(params.pageSize).toBe(20);
      });

      it('should use provided page and pageSize', () => {
        const params = importExportService.createPaginationParams({ page: 2, pageSize: 20 });
        expect(params.page).toBe(2);
        expect(params.pageSize).toBe(20);
      });
    });

    describe('getPaginatedLogs', () => {
      it('should return paginated logs', async () => {
        await __ImportExport.createLog({ type: 'export', action: 'database_export', status: 'completed', userId: 1 });
        await __ImportExport.createLog({ type: 'import', action: 'csv_import', status: 'completed', userId: 1 });

        const result = await importExportService.getPaginatedLogs({ page: 1, pageSize: 10 });
        expect(result).toBeDefined();
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('pagination');
        expect(Array.isArray(result.data)).toBe(true);
      });
    });

    describe('getLogById', () => {
      it('should retrieve log by ID', async () => {
        const created = await __ImportExport.createLog({ type: 'export', action: 'database_export', status: 'completed', userId: 1 });

        const log = await importExportService.getLogById(created.id);
        expect(log).toBeDefined();
        expect(log.id).toBe(created.id);
      });

      it('should return null for an invalid ID', async () => {
        const log = await importExportService.getLogById('not-a-number');
        expect(log).toBeNull();
      });
    });

    describe('getStatistics', () => {
      it('should return import/export statistics', async () => {
        const stats = await importExportService.getStatistics();
        expect(stats).toBeDefined();
        expect(stats).toHaveProperty('total_operations');
        expect(stats).toHaveProperty('by_type');
        expect(stats).toHaveProperty('by_action');
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
      const ImportExport = __ImportExport;
      expect(ImportExport).toBeDefined();
      expect(typeof ImportExport.createLog).toBe('function');
      expect(typeof ImportExport.getLogById).toBe('function');
      expect(typeof ImportExport.getAllLogs).toBe('function');
      expect(typeof ImportExport.countLogs).toBe('function');
      expect(typeof ImportExport.getStatistics).toBe('function');
      expect(typeof ImportExport.getSupportedTables).toBe('function');
    });

    it('should export importExportService', () => {
      const importExportService = __importExportService;
      expect(importExportService).toBeDefined();
      expect(typeof importExportService.validateParams).toBe('function');
      expect(typeof importExportService.getPaginatedLogs).toBe('function');
      expect(typeof importExportService.getLogById).toBe('function');
      expect(typeof importExportService.getStatistics).toBe('function');
    });

    it('should export importExportController', () => {
      const importExportController = __importExportController;
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

    it('should export importExportRoutes', () => {
      const importExportRoutes = __importExportRoutes;
      expect(importExportRoutes).toBeDefined();
    });
  });
});

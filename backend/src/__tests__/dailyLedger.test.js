/**
 * Daily Ledger Module Tests
 * Comprehensive tests for DailyLedger model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import Database from 'better-sqlite3';

// Test database setup - must be at top level for ESM mocking to work
const TEST_DB = ':memory:';
const testDb = new Database(TEST_DB);

// Mock the database module at top level so all dynamic imports get the mock
jest.mock('../config/database.js', () => ({
  default: testDb
}));

describe('DailyLedger Module', () => {
  beforeAll(() => {
    
    // Create users, transactions, and daily_ledger tables
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

      CREATE TABLE IF NOT EXISTS daily_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL UNIQUE,
        opening_balance INTEGER NOT NULL DEFAULT 0,
        total_income INTEGER NOT NULL DEFAULT 0,
        total_expenses INTEGER NOT NULL DEFAULT 0,
        closing_balance INTEGER NOT NULL DEFAULT 0,
        net_movement INTEGER NOT NULL DEFAULT 0,
        transaction_count INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_daily_ledger_date ON daily_ledger(date);
      CREATE INDEX IF NOT EXISTS idx_daily_ledger_closing_balance ON daily_ledger(closing_balance);
    `);

    // Insert test users
    const insertUser = testDb.prepare('INSERT INTO users (id, username, full_name, role) VALUES (?, ?, ?, ?)');
    insertUser.run(1, 'admin', 'Admin User', 'admin');
    insertUser.run(2, 'user1', 'Regular User', 'user');
    
    // Insert test transactions for multiple dates
    const insertTransaction = testDb.prepare(`
      INSERT INTO transactions (id, receipt_number, amount, transaction_type, transaction_date, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    // Transactions for 2026-07-01
    insertTransaction.run(1, 'TRX-001', 100000, 'income', '2026-07-01', 'School fees payment');
    insertTransaction.run(2, 'TRX-002', 20000, 'expense', '2026-07-01', 'Salaries');
    insertTransaction.run(3, 'TRX-003', 50000, 'income', '2026-07-01', 'Donation');
    
    // Transactions for 2026-07-02
    insertTransaction.run(4, 'TRX-004', 150000, 'income', '2026-07-02', 'School fees');
    insertTransaction.run(5, 'TRX-005', 30000, 'expense', '2026-07-02', 'Supplies');
    
    // Transactions for 2026-07-03
    insertTransaction.run(6, 'TRX-006', 80000, 'income', '2026-07-03', 'Lunch payment');
    insertTransaction.run(7, 'TRX-007', 15000, 'expense', '2026-07-03', 'Utilities');
    
    // Insert initial daily ledger records
    const insertLedger = testDb.prepare(`
      INSERT INTO daily_ledger (date, opening_balance, total_income, total_expenses, closing_balance, net_movement, transaction_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertLedger.run('2026-07-01', 0, 150000, 20000, 130000, 130000, 3);
    insertLedger.run('2026-07-02', 130000, 150000, 30000, 250000, 120000, 2);
    insertLedger.run('2026-07-03', 250000, 80000, 15000, 315000, 65000, 2);
    insertLedger.run('2026-07-05', 315000, 200000, 50000, 465000, 150000, 3);
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
  
  describe('DailyLedger Model', () => {
    // Import model functions after DB is set up
    let dailyLedgerModel;
    
    beforeAll(async () => {
      // Dynamic import to ensure DB is ready
      const model = await import('../models/DailyLedger.js');
      dailyLedgerModel = model;
    });

    describe('Constants', () => {
      it('should export DAILY_LEDGER_TABLE constant', () => {
        expect(dailyLedgerModel.DAILY_LEDGER_TABLE).toBe('daily_ledger');
      });

      it('should export DAILY_LEDGER_FIELDS constant', () => {
        expect(dailyLedgerModel.DAILY_LEDGER_FIELDS.ID).toBe('id');
        expect(dailyLedgerModel.DAILY_LEDGER_FIELDS.DATE).toBe('date');
        expect(dailyLedgerModel.DAILY_LEDGER_FIELDS.OPENING_BALANCE).toBe('opening_balance');
        expect(dailyLedgerModel.DAILY_LEDGER_FIELDS.TOTAL_INCOME).toBe('total_income');
        expect(dailyLedgerModel.DAILY_LEDGER_FIELDS.TOTAL_EXPENSES).toBe('total_expenses');
        expect(dailyLedgerModel.DAILY_LEDGER_FIELDS.CLOSING_BALANCE).toBe('closing_balance');
        expect(dailyLedgerModel.DAILY_LEDGER_FIELDS.NET_MOVEMENT).toBe('net_movement');
        expect(dailyLedgerModel.DAILY_LEDGER_FIELDS.TRANSACTION_COUNT).toBe('transaction_count');
      });
    });

    describe('getById', () => {
      it('should return a daily ledger by ID', () => {
        const ledger = dailyLedgerModel.getById(1);
        expect(ledger).toBeTruthy();
        expect(ledger.id).toBe(1);
        expect(ledger.date).toBe('2026-07-01');
      });

      it('should return null for non-existent ID', () => {
        const ledger = dailyLedgerModel.getById(9999);
        expect(ledger).toBeNull();
      });
    });

    describe('getByDate', () => {
      it('should return a daily ledger by date', () => {
        const ledger = dailyLedgerModel.getByDate('2026-07-01');
        expect(ledger).toBeTruthy();
        expect(ledger.date).toBe('2026-07-01');
      });

      it('should return null for non-existent date', () => {
        const ledger = dailyLedgerModel.getByDate('2026-01-01');
        expect(ledger).toBeNull();
      });
    });

    describe('getAll', () => {
      it('should return all daily ledgers', () => {
        const ledgers = dailyLedgerModel.getAll();
        expect(Array.isArray(ledgers)).toBe(true);
        expect(ledgers.length).toBeGreaterThan(0);
      });

      it('should filter ledgers by date range', () => {
        const ledgers = dailyLedgerModel.getAll({ startDate: '2026-07-01', endDate: '2026-07-02' });
        expect(ledgers.length).toBe(2);
        expect(ledgers.every(l => l.date >= '2026-07-01' && l.date <= '2026-07-02')).toBe(true);
      });
    });

    describe('getToday', () => {
      it('should return ledger for current date or null', () => {
        // This will return null since we don't have today's date in test data
        const ledger = dailyLedgerModel.getToday();
        // Just verify it doesn't throw an error
        expect(ledger === null || ledger.date).toBeTruthy();
      });
    });

    describe('getYesterday', () => {
      it('should return ledger for yesterday or null', () => {
        const ledger = dailyLedgerModel.getYesterday();
        expect(ledger === null || ledger.date).toBeTruthy();
      });
    });

    describe('getRecent', () => {
      it('should return recent ledgers with limit', () => {
        const ledgers = dailyLedgerModel.getRecent(2);
        expect(Array.isArray(ledgers)).toBe(true);
        expect(ledgers.length).toBeLessThanOrEqual(2);
      });
    });

    describe('getByMonth', () => {
      it('should return ledgers for a specific month', () => {
        const ledgers = dailyLedgerModel.getByMonth(2026, 7);
        expect(Array.isArray(ledgers)).toBe(true);
        expect(ledgers.every(l => l.date.startsWith('2026-07'))).toBe(true);
      });
    });

    describe('count', () => {
      it('should return the count of all ledgers', () => {
        const count = dailyLedgerModel.count();
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });

      it('should count ledgers by date range', () => {
        const count = dailyLedgerModel.count({ startDate: '2026-07-01', endDate: '2026-07-02' });
        expect(count).toBe(2);
      });
    });

    describe('getStatistics', () => {
      it('should return statistics for ledger data', () => {
        const stats = dailyLedgerModel.getStatistics();
        expect(stats).toBeTruthy();
        expect(stats.total_days).toBeDefined();
        expect(stats.total_income).toBeDefined();
        expect(stats.total_expenses).toBeDefined();
      });
    });

    describe('getMissingDates', () => {
      it('should return missing dates in a date range', () => {
        // We have ledgers for 2026-07-01, 02, 03, 05 but missing 04
        const missing = dailyLedgerModel.getMissingDates({ startDate: '2026-07-01', endDate: '2026-07-05' });
        expect(Array.isArray(missing)).toBe(true);
        expect(missing).toContain('2026-07-04');
      });
    });

    describe('create', () => {
      it('should create a new daily ledger record', () => {
        const newLedger = {
          date: '2026-07-04',
          opening_balance: 315000,
          total_income: 100000,
          total_expenses: 20000,
          closing_balance: 395000,
          net_movement: 80000,
          transaction_count: 2
        };
        
        const created = dailyLedgerModel.create(newLedger);
        expect(created).toBeTruthy();
        expect(created.date).toBe('2026-07-04');
        expect(created.id).toBeDefined();
      });

      it('should prevent duplicate dates', () => {
        const duplicateLedger = {
          date: '2026-07-01',
          opening_balance: 0,
          total_income: 0,
          total_expenses: 0,
          closing_balance: 0,
          net_movement: 0,
          transaction_count: 0
        };
        
        expect(() => dailyLedgerModel.create(duplicateLedger)).toThrow();
      });
    });

    describe('update', () => {
      it('should update an existing daily ledger record', () => {
        const updated = dailyLedgerModel.update(1, { total_income: 200000 });
        expect(updated).toBeTruthy();
        expect(updated.total_income).toBe(200000);
      });
    });

    describe('deleteById', () => {
      it('should delete a daily ledger record by ID', () => {
        // First create a new record to delete
        const newLedger = dailyLedgerModel.create({
          date: '2026-07-10',
          opening_balance: 0,
          total_income: 0,
          total_expenses: 0,
          closing_balance: 0,
          net_movement: 0,
          transaction_count: 0
        });
        
        const id = newLedger.id;
        const deleted = dailyLedgerModel.deleteById(id);
        expect(deleted).toBeTruthy();
        
        // Verify it's deleted
        const result = dailyLedgerModel.getById(id);
        expect(result).toBeNull();
      });
    });

    describe('generateForDate', () => {
      it('should generate ledger for a specific date from transactions', () => {
        // We have transactions for 2026-07-04 but no ledger yet
        const generated = dailyLedgerModel.generateForDate('2026-07-04');
        expect(generated).toBeTruthy();
        expect(generated.date).toBe('2026-07-04');
      });
    });

    describe('generateForDateRange', () => {
      it('should generate ledger for a date range', () => {
        const generated = dailyLedgerModel.generateForDateRange({ startDate: '2026-07-01', endDate: '2026-07-03' });
        expect(Array.isArray(generated)).toBe(true);
        expect(generated.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================
  // Service Tests
  // ============================================
  
  describe('DailyLedger Service', () => {
    let dailyLedgerService;
    
    beforeAll(async () => {
      const service = await import('../services/dailyLedgerService.js');
      dailyLedgerService = service;
    });

    describe('Validation', () => {
      it('should validate valid ledger data', () => {
        const validData = {
          date: '2026-07-15',
          opening_balance: 100000,
          total_income: 50000,
          total_expenses: 20000,
          closing_balance: 130000,
          net_movement: 30000,
          transaction_count: 2
        };
        
        const isValid = dailyLedgerService.validateDailyLedgerData(validData);
        expect(isValid).toBe(true);
      });

      it('should reject invalid date format', () => {
        const invalidData = {
          date: 'invalid-date',
          opening_balance: 100000,
          total_income: 50000,
          total_expenses: 20000,
          closing_balance: 130000,
          net_movement: 30000,
          transaction_count: 2
        };
        
        expect(() => dailyLedgerService.validateDailyLedgerData(invalidData)).toThrow();
      });

      it('should reject negative amounts', () => {
        const invalidData = {
          date: '2026-07-15',
          opening_balance: -100000,
          total_income: 50000,
          total_expenses: 20000,
          closing_balance: 130000,
          net_movement: 30000,
          transaction_count: 2
        };
        
        expect(() => dailyLedgerService.validateDailyLedgerData(invalidData)).toThrow();
      });
    });

    describe('createPaginationParams', () => {
      it('should create pagination params with defaults', () => {
        const params = dailyLedgerService.createPaginationParams({});
        expect(params.page).toBe(1);
        expect(params.pageSize).toBe(20);
      });

      it('should create pagination params with custom values', () => {
        const params = dailyLedgerService.createPaginationParams({ page: 2, pageSize: 10 });
        expect(params.page).toBe(2);
        expect(params.pageSize).toBe(10);
      });
    });

    describe('getPaginatedDailyLedgers', () => {
      it('should return paginated ledgers', () => {
        const result = dailyLedgerService.getPaginatedDailyLedgers({ page: 1, pageSize: 2 });
        expect(result).toBeTruthy();
        expect(result.data).toBeDefined();
        expect(result.pagination).toBeDefined();
      });
    });

    describe('getDailyLedgerById', () => {
      it('should return a ledger by ID', () => {
        const ledger = dailyLedgerService.getDailyLedgerById(1);
        expect(ledger).toBeTruthy();
        expect(ledger.id).toBe(1);
      });
    });

    describe('getTodayLedger', () => {
      it('should return today ledger or null', () => {
        const ledger = dailyLedgerService.getTodayLedger();
        // Won't throw error
        expect(ledger === null || ledger.date).toBeTruthy();
      });
    });

    describe('getYesterdayLedger', () => {
      it('should return yesterday ledger or null', () => {
        const ledger = dailyLedgerService.getYesterdayLedger();
        expect(ledger === null || ledger.date).toBeTruthy();
      });
    });

    describe('getRecentLedgers', () => {
      it('should return recent ledgers', () => {
        const ledgers = dailyLedgerService.getRecentLedgers(3);
        expect(Array.isArray(ledgers)).toBe(true);
      });
    });

    describe('getMonthlyLedgers', () => {
      it('should return ledgers for a month', () => {
        const ledgers = dailyLedgerService.getMonthlyLedgers(2026, 7);
        expect(Array.isArray(ledgers)).toBe(true);
      });
    });

    describe('getDailyLedgerStatistics', () => {
      it('should return statistics', () => {
        const stats = dailyLedgerService.getDailyLedgerStatistics();
        expect(stats).toBeTruthy();
        expect(stats.total_days).toBeDefined();
      });
    });

    describe('createDailyLedger', () => {
      it('should create a new ledger', () => {
        const ledger = dailyLedgerService.createDailyLedger({
          date: '2026-07-20',
          opening_balance: 500000,
          total_income: 100000,
          total_expenses: 50000
        });
        expect(ledger).toBeTruthy();
        expect(ledger.date).toBe('2026-07-20');
      });
    });

    describe('updateDailyLedger', () => {
      it('should update an existing ledger', () => {
        const updated = dailyLedgerService.updateDailyLedger(2, { total_income: 200000 });
        expect(updated).toBeTruthy();
        expect(updated.total_income).toBe(200000);
      });
    });

    describe('deleteDailyLedger', () => {
      it('should delete a ledger', async () => {
        // Create a ledger first
        const newLedger = await dailyLedgerService.createDailyLedger({
          date: '2026-07-25',
          opening_balance: 0,
          total_income: 0,
          total_expenses: 0
        });
        
        const deleted = await dailyLedgerService.deleteDailyLedger(newLedger.id);
        expect(deleted).toBeTruthy();
      });
    });

    describe('getMissingLedgerDates', () => {
      it('should return missing dates', () => {
        const missing = dailyLedgerService.getMissingLedgerDates({ startDate: '2026-07-01', endDate: '2026-07-05' });
        expect(Array.isArray(missing.missingDates)).toBe(true);
      });
    });

    describe('getLedgerSummary', () => {
      it('should return ledger summary', () => {
        const summary = dailyLedgerService.getLedgerSummary({ days: 7 });
        expect(summary).toBeTruthy();
      });
    });
  });

  // ============================================
  // Module Exports Tests
  // ============================================
  
  describe('DailyLedger Module Exports', () => {
    it('should export DailyLedger model', async () => {
      const model = await import('../models/DailyLedger.js');
      expect(model).toBeDefined();
      expect(model.default).toBeDefined();
    });

    it('should export dailyLedgerService', async () => {
      const service = await import('../services/dailyLedgerService.js');
      expect(service).toBeDefined();
      expect(service.default).toBeDefined();
    });

    it('should export DailyLedger controller', async () => {
      const controller = await import('../controllers/dailyLedgerController.js');
      expect(controller).toBeDefined();
      expect(controller.default).toBeDefined();
    });

    it('should export dailyLedgerRoutes', async () => {
      const routes = await import('../routes/dailyLedgerRoutes.js');
      expect(routes).toBeDefined();
      expect(routes.default).toBeDefined();
    });
  });
});

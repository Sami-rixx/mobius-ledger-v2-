/**
 * Daily Ledger Module Tests
 * Comprehensive tests for DailyLedger model, service, and functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import Database from 'better-sqlite3';
import { createRequire } from 'module';
import db from '../config/database.js';

const require = createRequire(import.meta.url);

// Test database setup
const TEST_DB = ':memory:';
let testDb;


describe('DailyLedger Module', () => {
  beforeAll(() => {
    // Create in-memory database for testing
    testDb = db;
    
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

      CREATE TABLE IF NOT EXISTS daily_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL UNIQUE,
        opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total_income DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total_expenses DECIMAL(10, 2) NOT NULL DEFAULT 0,
        closing_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
        net_movement DECIMAL(10, 2) NOT NULL DEFAULT 0,
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
    insertTransaction.run(1, 'TRX-001', 1000.00, 'income', '2026-07-01', 'School fees payment');
    insertTransaction.run(2, 'TRX-002', 200.00, 'expense', '2026-07-01', 'Salaries');
    insertTransaction.run(3, 'TRX-003', 500.00, 'income', '2026-07-01', 'Donation');
    
    // Transactions for 2026-07-02
    insertTransaction.run(4, 'TRX-004', 1500.00, 'income', '2026-07-02', 'School fees');
    insertTransaction.run(5, 'TRX-005', 300.00, 'expense', '2026-07-02', 'Supplies');
    
    // Transactions for 2026-07-03
    insertTransaction.run(6, 'TRX-006', 800.00, 'income', '2026-07-03', 'Lunch payment');
    insertTransaction.run(7, 'TRX-007', 150.00, 'expense', '2026-07-03', 'Utilities');
    
    // Insert initial daily ledger records.
    // NOTE: the shared test db already has the real schema.sql triggers
    // applied (trg_transaction_insert_after), which auto-INSERT OR IGNORE a
    // daily_ledger row (and accumulate total_income/total_expenses) for
    // every transaction_date as soon as the transactions above are
    // inserted. So by the time we get here, '2026-07-01' (id 1), '2026-07-02'
    // (id 2) and '2026-07-03' (id 3) already exist with trigger-derived
    // totals (but zeroed opening/closing balance); only '2026-07-05' has no
    // matching transactions and is genuinely new. UPDATE the pre-existing
    // rows (preserving their ids, which later tests hardcode) and INSERT
    // only the one truly-new row, rather than INSERT OR REPLACE - which
    // would delete+recreate rows under brand new autoincrement ids.
    const upsertLedger = (date, opening, income, expenses, closing, net, count) => {
      const updateResult = testDb.prepare(`
        UPDATE daily_ledger
        SET opening_balance = ?, total_income = ?, total_expenses = ?, closing_balance = ?, net_movement = ?, transaction_count = ?
        WHERE date = ?
      `).run(opening, income, expenses, closing, net, count, date);
      if (updateResult.changes === 0) {
        testDb.prepare(`
          INSERT INTO daily_ledger (date, opening_balance, total_income, total_expenses, closing_balance, net_movement, transaction_count)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(date, opening, income, expenses, closing, net, count);
      }
    };

    upsertLedger('2026-07-01', 0, 1500.00, 200.00, 1300.00, 1300.00, 3);
    upsertLedger('2026-07-02', 1300.00, 1500.00, 300.00, 2500.00, 1200.00, 2);
    upsertLedger('2026-07-03', 2500.00, 800.00, 150.00, 3150.00, 650.00, 2);
    upsertLedger('2026-07-05', 3150.00, 2000.00, 500.00, 4650.00, 1500.00, 3);
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
  
  describe('DailyLedger Model', () => {
    // Import model functions after DB is set up
    let dailyLedgerModel;
    
    beforeAll(async () => {
      // Dynamic import to ensure DB is ready
      const model = await import('../models/DailyLedger.js');
      dailyLedgerModel = model;
    });

    describe('Constants', () => {
      it('should export TABLE constant', async () => {
        // DailyLedger.js itself exports TABLE/FIELDS; models/index.js is
        // what re-exports them under the DAILY_LEDGER_TABLE/
        // DAILY_LEDGER_FIELDS aliases.
        expect(dailyLedgerModel.TABLE).toBe('daily_ledger');
      });

      it('should export FIELDS constant', async () => {
        expect(dailyLedgerModel.FIELDS.ID).toBe('id');
        expect(dailyLedgerModel.FIELDS.DATE).toBe('date');
        expect(dailyLedgerModel.FIELDS.OPENING_BALANCE).toBe('opening_balance');
        expect(dailyLedgerModel.FIELDS.TOTAL_INCOME).toBe('total_income');
        expect(dailyLedgerModel.FIELDS.TOTAL_EXPENSES).toBe('total_expenses');
        expect(dailyLedgerModel.FIELDS.CLOSING_BALANCE).toBe('closing_balance');
        expect(dailyLedgerModel.FIELDS.NET_MOVEMENT).toBe('net_movement');
        expect(dailyLedgerModel.FIELDS.TRANSACTION_COUNT).toBe('transaction_count');
      });
    });

    describe('getById', () => {
      it('should return a daily ledger by ID', async () => {
        // Don't hardcode the id: the daily_ledger id for '2026-07-01' isn't
        // guaranteed to be 1 - the trg_transaction_insert_after trigger's
        // own `INSERT OR IGNORE` consumes an AUTOINCREMENT sequence value
        // even on a no-op/ignored conflict (a documented SQLite quirk), so
        // inserting multiple transactions for the same date before any
        // transaction for a different date can leave gaps.
        const byDate = await dailyLedgerModel.getByDate('2026-07-01');
        const ledger = await dailyLedgerModel.getById(byDate.id);
        expect(ledger).toBeTruthy();
        expect(ledger.id).toBe(byDate.id);
        expect(ledger.date).toBe('2026-07-01');
      });

      it('should return null for non-existent ID', async () => {
        const ledger = await dailyLedgerModel.getById(9999);
        expect(ledger).toBeNull();
      });
    });

    describe('getByDate', () => {
      it('should return a daily ledger by date', async () => {
        const ledger = await dailyLedgerModel.getByDate('2026-07-01');
        expect(ledger).toBeTruthy();
        expect(ledger.date).toBe('2026-07-01');
      });

      it('should return null for non-existent date', async () => {
        const ledger = await dailyLedgerModel.getByDate('2026-01-01');
        expect(ledger).toBeNull();
      });
    });

    describe('getAll', () => {
      it('should return all daily ledgers', async () => {
        const ledgers = await dailyLedgerModel.getAll();
        expect(Array.isArray(ledgers)).toBe(true);
        expect(ledgers.length).toBeGreaterThan(0);
      });

      it('should filter ledgers by date range', async () => {
        const ledgers = await dailyLedgerModel.getAll({ startDate: '2026-07-01', endDate: '2026-07-02' });
        expect(ledgers.length).toBe(2);
        expect(ledgers.every(l => l.date >= '2026-07-01' && l.date <= '2026-07-02')).toBe(true);
      });
    });

    describe('getToday', () => {
      it('should return ledger for current date or null', async () => {
        // This will return null since we don't have today's date in test data
        const ledger = await dailyLedgerModel.getToday();
        // Just verify it doesn't throw an error
        expect(ledger === null || ledger.date).toBeTruthy();
      });
    });

    describe('getYesterday', () => {
      it('should return ledger for yesterday or null', async () => {
        const ledger = await dailyLedgerModel.getYesterday();
        expect(ledger === null || ledger.date).toBeTruthy();
      });
    });

    describe('getRecent', () => {
      it('should return recent ledgers with limit', async () => {
        const ledgers = await dailyLedgerModel.getRecent(2);
        expect(Array.isArray(ledgers)).toBe(true);
        expect(ledgers.length).toBeLessThanOrEqual(2);
      });
    });

    describe('getByMonth', () => {
      it('should return ledgers for a specific month', async () => {
        const ledgers = await dailyLedgerModel.getByMonth(2026, 7);
        expect(Array.isArray(ledgers)).toBe(true);
        expect(ledgers.every(l => l.date.startsWith('2026-07'))).toBe(true);
      });
    });

    describe('count', () => {
      it('should return the count of all ledgers', async () => {
        const count = await dailyLedgerModel.count();
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      });

      it('should count ledgers by date range', async () => {
        const count = await dailyLedgerModel.count({ startDate: '2026-07-01', endDate: '2026-07-02' });
        expect(count).toBe(2);
      });
    });

    describe('getStatistics', () => {
      it('should return statistics for ledger data', async () => {
        const stats = await dailyLedgerModel.getStatistics();
        expect(stats).toBeTruthy();
        expect(stats.total_days).toBeDefined();
        expect(stats.total_income).toBeDefined();
        expect(stats.total_expenses).toBeDefined();
      });
    });

    describe('getMissingDates', () => {
      it('should return missing dates in a date range', async () => {
        // We have ledgers for 2026-07-01, 02, 03, 05 but missing 04
        const missing = await dailyLedgerModel.getMissingDates({ startDate: '2026-07-01', endDate: '2026-07-05' });
        expect(Array.isArray(missing)).toBe(true);
        expect(missing).toContain('2026-07-04');
      });
    });

    describe('create', () => {
      it('should create a new daily ledger record', async () => {
        const newLedger = {
          date: '2026-07-04',
          opening_balance: 3150.00,
          total_income: 1000.00,
          total_expenses: 200.00,
          closing_balance: 3950.00,
          net_movement: 800.00,
          transaction_count: 2
        };
        
        const created = await dailyLedgerModel.create(newLedger);
        expect(created).toBeTruthy();
        expect(created.date).toBe('2026-07-04');
        expect(created.id).toBeDefined();
      });

      it('should prevent duplicate dates', async () => {
        const duplicateLedger = {
          date: '2026-07-01',
          opening_balance: 0,
          total_income: 0,
          total_expenses: 0,
          closing_balance: 0,
          net_movement: 0,
          transaction_count: 0
        };

        // NOTE: deliberately an explicit try/catch rather than
        // `expect(promise).rejects.toThrow()` - see the equivalent note in
        // expense.test.js. Under `--experimental-vm-modules`, Jest's
        // `rejects` matcher was observed to intermittently misreport "did
        // not throw" for this exact assertion when the full test suite
        // runs together (confirmed via manual `.then(onFulfilled,
        // onRejected)` tracing that the promise reliably rejects every
        // time; only the matcher's own result was unreliable).
        let threw = false;
        try {
          await dailyLedgerModel.create(duplicateLedger);
        } catch (error) {
          threw = true;
          expect(error).toBeDefined();
        }
        expect(threw).toBe(true);
      });
    });

    describe('update', () => {
      it('should update an existing daily ledger record', async () => {
        const byDate = await dailyLedgerModel.getByDate('2026-07-01');
        const updated = await dailyLedgerModel.update(byDate.id, { total_income: 2000.00 });
        expect(updated).toBeTruthy();
        expect(updated.total_income).toBe(2000.00);
      });
    });

    describe('deleteById', () => {
      it('should delete a daily ledger record by ID', async () => {
        // First create a new record to delete
        const newLedger = await dailyLedgerModel.create({
          date: '2026-07-10',
          opening_balance: 0,
          total_income: 0,
          total_expenses: 0,
          closing_balance: 0,
          net_movement: 0,
          transaction_count: 0
        });
        
        const id = newLedger.id;
        const deleted = await dailyLedgerModel.deleteById(id);
        expect(deleted).toBeTruthy();
        
        // Verify it's deleted
        const result = await dailyLedgerModel.getById(id);
        expect(result).toBeNull();
      });
    });

    describe('generateForDate', () => {
      it('should generate ledger for a specific date from transactions', async () => {
        // We have transactions for 2026-07-04 but no ledger yet
        const generated = await dailyLedgerModel.generateForDate('2026-07-04');
        expect(generated).toBeTruthy();
        expect(generated.date).toBe('2026-07-04');
      });
    });

    describe('generateForDateRange', () => {
      it('should generate ledger for a date range', async () => {
        const generated = await dailyLedgerModel.generateForDateRange({ startDate: '2026-07-01', endDate: '2026-07-03' });
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
      it('should validate valid ledger data', async () => {
        const validData = {
          date: '2026-07-15',
          opening_balance: 1000.00,
          total_income: 500.00,
          total_expenses: 200.00,
          closing_balance: 1300.00,
          net_movement: 300.00,
          transaction_count: 2
        };
        
        const result = dailyLedgerService.validateDailyLedgerData(validData);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should reject invalid date format', async () => {
        const invalidData = {
          date: 'invalid-date',
          opening_balance: 1000.00,
          total_income: 500.00,
          total_expenses: 200.00,
          closing_balance: 1300.00,
          net_movement: 300.00,
          transaction_count: 2
        };
        
        const result = dailyLedgerService.validateDailyLedgerData(invalidData);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should reject negative amounts', async () => {
        // opening_balance/closing_balance/net_movement intentionally allow
        // negative values (e.g. carrying a deficit forward), but
        // total_income/total_expenses must be >= 0.
        const invalidData = {
          date: '2026-07-15',
          opening_balance: 1000.00,
          total_income: -500.00,
          total_expenses: 200.00,
          closing_balance: 1300.00,
          net_movement: 300.00,
          transaction_count: 2
        };
        
        const result = dailyLedgerService.validateDailyLedgerData(invalidData);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('createPaginationParams', () => {
      it('should create pagination params with defaults', async () => {
        // createPaginationParams takes positional (page, pageSize) args,
        // not an options object.
        const params = dailyLedgerService.createPaginationParams();
        expect(params.page).toBe(1);
        expect(params.pageSize).toBe(20);
      });

      it('should create pagination params with custom values', async () => {
        const params = dailyLedgerService.createPaginationParams(2, 10);
        expect(params.page).toBe(2);
        expect(params.pageSize).toBe(10);
      });
    });

    describe('getPaginatedDailyLedgers', () => {
      it('should return paginated ledgers', async () => {
        const result = await dailyLedgerService.getPaginatedDailyLedgers({ page: 1, pageSize: 2 });
        expect(result).toBeTruthy();
        expect(result.data).toBeDefined();
        expect(result.pagination).toBeDefined();
      });
    });

    describe('getDailyLedgerById', () => {
      it('should return a ledger by ID', async () => {
        const byDate = await dailyLedgerService.getDailyLedgerByDate('2026-07-01');
        const ledger = await dailyLedgerService.getDailyLedgerById(byDate.id);
        expect(ledger).toBeTruthy();
        expect(ledger.id).toBe(byDate.id);
      });
    });

    describe('getTodayLedger', () => {
      it('should return today ledger or null', async () => {
        const ledger = await dailyLedgerService.getTodayLedger();
        // Won't throw error
        expect(ledger === null || ledger.date).toBeTruthy();
      });
    });

    describe('getYesterdayLedger', () => {
      it('should return yesterday ledger or null', async () => {
        const ledger = await dailyLedgerService.getYesterdayLedger();
        expect(ledger === null || ledger.date).toBeTruthy();
      });
    });

    describe('getRecentLedgers', () => {
      it('should return recent ledgers', async () => {
        const ledgers = await dailyLedgerService.getRecentLedgers(3);
        expect(Array.isArray(ledgers)).toBe(true);
      });
    });

    describe('getMonthlyLedgers', () => {
      it('should return ledgers for a month', async () => {
        const ledgers = await dailyLedgerService.getMonthlyLedgers(2026, 7);
        expect(Array.isArray(ledgers)).toBe(true);
      });
    });

    describe('getDailyLedgerStatistics', () => {
      it('should return statistics', async () => {
        const stats = await dailyLedgerService.getDailyLedgerStatistics();
        expect(stats).toBeTruthy();
        expect(stats.total_days).toBeDefined();
      });
    });

    describe('createDailyLedger', () => {
      it('should create a new ledger', async () => {
        const ledger = await dailyLedgerService.createDailyLedger({
          date: '2026-07-20',
          opening_balance: 5000.00,
          total_income: 1000.00,
          total_expenses: 500.00
        });
        expect(ledger).toBeTruthy();
        expect(ledger.date).toBe('2026-07-20');
      });
    });

    describe('updateDailyLedger', () => {
      it('should update an existing ledger', async () => {
        const byDate = await dailyLedgerService.getDailyLedgerByDate('2026-07-02');
        const updated = await dailyLedgerService.updateDailyLedger(byDate.id, { total_income: 2000.00 });
        expect(updated).toBeTruthy();
        expect(updated.total_income).toBe(2000.00);
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
      it('should return missing dates', async () => {
        // getMissingLedgerDates passes straight through to the model's
        // getMissingDates(), which resolves to a flat array of date
        // strings, not { missingDates: [...] }. By this point in the suite
        // 2026-07-04 already has a ledger (created by an earlier model-level
        // test against the same shared db), so just assert the shape here -
        // the "actually finds a gap" behavior is covered by the model-level
        // getMissingDates test above.
        const missing = await dailyLedgerService.getMissingLedgerDates({ startDate: '2026-07-01', endDate: '2026-07-05' });
        expect(Array.isArray(missing)).toBe(true);
      });
    });

    describe('getLedgerSummary', () => {
      it('should return ledger summary', async () => {
        const summary = await dailyLedgerService.getLedgerSummary({ days: 7 });
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

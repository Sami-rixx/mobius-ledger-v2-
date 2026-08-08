import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test database path
const TEST_DB_PATH = path.resolve(__dirname, 'test_mobius_ledger.db');

// Import the Dashboard module functions
// Note: We need to use a mock database for testing
import * as DashboardModel from '../models/Dashboard.js';
import * as DashboardService from '../services/dashboardService.js';

/**
 * Dashboard Module Tests
 * Tests for Dashboard model, service, and validation functions
 */

describe('Dashboard Module', () => {
  let db;

  beforeAll(() => {
    // Create test database
    db = new Database(TEST_DB_PATH);
    db.pragma('foreign_keys = ON');

    // Create minimal schema for testing
    db.exec(`
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

      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admission_number TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        class_id INTEGER,
        date_of_birth DATE,
        gender TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        status TEXT DEFAULT 'active',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id)
      );

      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        grade_level TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS income_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        is_system BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS expense_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        is_system BOOLEAN DEFAULT 0,
        is_kitchen BOOLEAN DEFAULT 0,
        parent_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER,
        FOREIGN KEY (parent_id) REFERENCES expense_categories(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS income (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_number TEXT UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        income_category_id INTEGER NOT NULL,
        income_date DATE NOT NULL,
        payer_name TEXT NOT NULL,
        payer_type TEXT DEFAULT 'student',
        payment_method TEXT NOT NULL,
        description TEXT,
        is_verified BOOLEAN DEFAULT 1,
        verified_by INTEGER,
        verified_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER,
        FOREIGN KEY (income_category_id) REFERENCES income_categories(id),
        FOREIGN KEY (verified_by) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_number TEXT UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        expense_category_id INTEGER NOT NULL,
        expense_date DATE NOT NULL,
        vendor_name TEXT NOT NULL,
        description TEXT,
        payment_method TEXT NOT NULL,
        is_verified BOOLEAN DEFAULT 1,
        verified_by INTEGER,
        verified_at DATETIME,
        is_kitchen BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER,
        FOREIGN KEY (expense_category_id) REFERENCES expense_categories(id),
        FOREIGN KEY (verified_by) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS school_fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        amount_paid INTEGER DEFAULT 0,
        balance INTEGER DEFAULT 0,
        payment_date DATE NOT NULL,
        academic_year TEXT NOT NULL,
        term TEXT NOT NULL,
        is_paid BOOLEAN DEFAULT 0,
        receipt_number TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
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

      CREATE TABLE IF NOT EXISTS director_withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount INTEGER NOT NULL,
        recipient_name TEXT NOT NULL,
        label TEXT,
        description TEXT,
        status TEXT DEFAULT 'pending',
        withdrawal_date DATE NOT NULL,
        approved_by INTEGER,
        approved_at DATETIME,
        completed_at DATETIME,
        receipt_number TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (approved_by) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );
    `);

    // Insert test data
    db.exec(`
      INSERT OR IGNORE INTO users (id, username, full_name) VALUES 
        (1, 'admin', 'Administrator'),
        (2, 'user1', 'User One');

      INSERT OR IGNORE INTO classes (id, name, grade_level) VALUES 
        (1, 'Grade 1', '1'),
        (2, 'Grade 2', '2');

      INSERT OR IGNORE INTO students (id, admission_number, first_name, last_name, class_id) VALUES 
        (1, 'STU001', 'John', 'Doe', 1),
        (2, 'STU002', 'Jane', 'Smith', 1),
        (3, 'STU003', 'Bob', 'Johnson', 2);

      INSERT OR IGNORE INTO income_categories (id, name) VALUES 
        (1, 'School Fees'),
        (2, 'Donations');

      INSERT OR IGNORE INTO expense_categories (id, name) VALUES 
        (1, 'Salaries'),
        (2, 'Supplies');

      INSERT OR IGNORE INTO income (id, receipt_number, amount, income_category_id, income_date, payer_name, payment_method) VALUES 
        (1, 'INC-001', 100000, 1, '2026-07-01', 'John Doe', 'Cash'),
        (2, 'INC-002', 150000, 1, '2026-07-02', 'Jane Smith', 'Bank Transfer'),
        (3, 'INC-003', 50000, 2, '2026-07-03', 'Donor One', 'Cash');

      INSERT OR IGNORE INTO expenses (id, receipt_number, amount, expense_category_id, expense_date, vendor_name, payment_method) VALUES 
        (1, 'EXP-001', 20000, 1, '2026-07-01', 'Vendor One', 'Bank Transfer'),
        (2, 'EXP-002', 30000, 2, '2026-07-02', 'Vendor Two', 'Cash');

      INSERT OR IGNORE INTO school_fees (id, student_id, amount, amount_paid, balance, payment_date, academic_year, term) VALUES 
        (1, 1, 100000, 50000, 50000, '2026-07-01', '2025-2026', 'Term 1'),
        (2, 2, 150000, 150000, 0, '2026-07-02', '2025-2026', 'Term 1');

      INSERT OR IGNORE INTO transactions (id, receipt_number, amount, transaction_type, transaction_date) VALUES 
        (1, 'TRX-001', 100000, 'income', '2026-07-01'),
        (2, 'TRX-002', 20000, 'expense', '2026-07-01');

      INSERT OR IGNORE INTO director_withdrawals (id, amount, recipient_name, status, withdrawal_date) VALUES 
        (1, 50000, 'Director One', 'completed', '2026-07-01');
    `);
  });

  afterAll(() => {
    // Close database connection
    if (db) {
      db.close();
    }
  });

  // Test Dashboard Constants
  describe('Dashboard Constants', () => {
    it('should export DASHBOARD_CONSTANTS', () => {
      expect(DashboardModel.DASHBOARD_CONSTANTS).toBeDefined();
      expect(DashboardModel.DASHBOARD_CONSTANTS.INCOME_TABLE).toBe('income');
      expect(DashboardModel.DASHBOARD_CONSTANTS.EXPENSES_TABLE).toBe('expenses');
    });

    it('should have all required table constants', () => {
      const requiredTables = [
        'INCOME_TABLE',
        'EXPENSES_TABLE',
        'STUDENTS_TABLE',
        'CLASSES_TABLE',
        'SCHOOL_FEES_TABLE',
        'TRANSACTIONS_TABLE',
        'DIRECTOR_WITHDRAWALS_TABLE'
      ];
      
      requiredTables.forEach(table => {
        expect(DashboardModel.DASHBOARD_CONSTANTS[table]).toBeDefined();
      });
    });
  });

  // Test Dashboard Service Validation
  describe('Dashboard Service Validation', () => {
    it('should export validation constants', () => {
      expect(DashboardService.DASHBOARD_VALIDATION).toBeDefined();
      expect(DashboardService.DASHBOARD_VALIDATION.PERIOD_MIN_LENGTH).toBe(3);
      expect(DashboardService.DASHBOARD_VALIDATION.LIMIT_MIN).toBe(1);
      expect(DashboardService.DASHBOARD_VALIDATION.LIMIT_MAX).toBe(100);
    });

    it('should validate dashboard parameters with valid data', () => {
      const result = DashboardService.validateDashboardParams({
        period: 'month',
        limit: 12
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.validated.period).toBe('month');
      expect(result.validated.limit).toBe(12);
    });

    it('should reject invalid period', () => {
      const result = DashboardService.validateDashboardParams({
        period: 'invalid'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid period. Must be one of: day, week, month, year');
    });

    it('should reject limit below minimum', () => {
      const result = DashboardService.validateDashboardParams({
        limit: 0
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Limit must be between 1 and 100');
    });

    it('should reject limit above maximum', () => {
      const result = DashboardService.validateDashboardParams({
        limit: 101
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Limit must be between 1 and 100');
    });

    it('should accept all valid periods', () => {
      const validPeriods = ['day', 'week', 'month', 'year'];
      
      validPeriods.forEach(period => {
        const result = DashboardService.validateDashboardParams({ period });
        expect(result.isValid).toBe(true);
      });
    });
  });

  // Test Dashboard Service Pagination
  describe('Dashboard Service Pagination', () => {
    it('should create pagination parameters', () => {
      const params = DashboardService.createPaginationParams(2, 25);
      
      expect(params.page).toBe(2);
      expect(params.pageSize).toBe(25);
      expect(params.offset).toBe(25);
    });

    it('should create default pagination parameters', () => {
      const params = DashboardService.createPaginationParams();
      
      expect(params.page).toBe(1);
      expect(params.pageSize).toBe(20);
      expect(params.offset).toBe(0);
    });
  });

  // Test Dashboard Model Exports
  describe('Dashboard Model Exports', () => {
    it('should export all dashboard model functions', () => {
      const expectedFunctions = [
        'getFinancialSummary',
        'getStudentStatistics',
        'getSchoolFeesSummary',
        'getRecentTransactions',
        'getIncomeVsExpenseOverTime',
        'getIncomeByCategory',
        'getExpensesByCategory',
        'getQuickStats'
      ];
      
      expectedFunctions.forEach(func => {
        expect(typeof DashboardModel[func]).toBe('function');
      });
    });
  });

  // Test Dashboard Service Exports
  describe('Dashboard Service Exports', () => {
    it('should export all dashboard service functions', () => {
      const expectedFunctions = [
        'getDashboardSummary',
        'getQuickStats',
        'getIncomeVsExpenseChartData',
        'getIncomeByCategory',
        'getExpensesByCategory',
        'getRecentActivity',
        'getStudentDistribution',
        'getFilteredSummary',
        'createPaginationParams',
        'validateDashboardParams'
      ];
      
      expectedFunctions.forEach(func => {
        expect(typeof DashboardService[func]).toBe('function');
      });
    });
  });
});

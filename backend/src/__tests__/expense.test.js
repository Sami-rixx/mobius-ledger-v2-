import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test database path
const TEST_DB_PATH = path.resolve(__dirname, 'test_mobius_ledger.db');

// Import Expense model and service - we'll use the actual implementation
// This requires setting the database path before importing
process.env.DATABASE_PATH = TEST_DB_PATH;

// Import after setting env
import Expense from '../models/Expense.js';
import ExpenseCategory from '../models/ExpenseCategory.js';
import * as ExpenseService from '../services/expenseService.js';

describe('Expense Management - Backend Tests', () => {
  let db;

  beforeAll(() => {
    // Create test database
    db = new Database(TEST_DB_PATH);
    db.pragma('foreign_keys = ON');

    // Create minimal schema for testing
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

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

      CREATE TABLE IF NOT EXISTS payment_methods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

      CREATE TABLE IF NOT EXISTS expense_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER,
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        is_system BOOLEAN DEFAULT 0,
        is_kitchen BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER,
        FOREIGN KEY (parent_id) REFERENCES expense_categories(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount INTEGER NOT NULL,
        expense_category_id INTEGER NOT NULL,
        description TEXT,
        vendor_name TEXT NOT NULL,
        vendor_contact TEXT,
        payment_method_id INTEGER,
        transaction_id INTEGER,
        expense_date DATE NOT NULL,
        receipt_number TEXT,
        notes TEXT,
        is_verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER,
        FOREIGN KEY (expense_category_id) REFERENCES expense_categories(id),
        FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
        FOREIGN KEY (transaction_id) REFERENCES transactions(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(name);
      CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON expense_categories(parent_id);
      CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(is_active);
      CREATE INDEX IF NOT EXISTS idx_expense_categories_kitchen ON expense_categories(is_kitchen);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(expense_category_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
      CREATE INDEX IF NOT EXISTS idx_expenses_receipt ON expenses(receipt_number);
      CREATE INDEX IF NOT EXISTS idx_expenses_verified ON expenses(is_verified);
    `);

    // Insert test data
    const testUser = db.prepare('INSERT INTO users (username, full_name, role) VALUES (?, ?, ?)').run('testuser', 'Test User', 'admin');
    const userId = testUser.lastInsertRowid;

    const paymentMethod = db.prepare('INSERT INTO payment_methods (name) VALUES (?)').run('Cash');
    const paymentMethodId = paymentMethod.lastInsertRowid;

    const category = db.prepare('INSERT INTO expense_categories (name, description, created_by) VALUES (?, ?, ?)').run('Food', 'Food expenses', userId);
    const categoryId = category.lastInsertRowid;

    // Insert some test expenses
    db.prepare(`
      INSERT INTO expenses (amount, expense_category_id, description, vendor_name, vendor_contact, payment_method_id, expense_date, receipt_number, notes, is_verified, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(10000, categoryId, 'Test expense 1', 'Vendor 1', '123-456', paymentMethodId, '2026-01-01', 'REC-001', 'Test note', 0, userId);

    db.prepare(`
      INSERT INTO expenses (amount, expense_category_id, description, vendor_name, vendor_contact, payment_method_id, expense_date, receipt_number, notes, is_verified, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(20000, categoryId, 'Test expense 2', 'Vendor 2', '987-654', paymentMethodId, '2026-01-02', 'REC-002', 'Test note 2', 1, userId);
  });

  afterAll(() => {
    // Close database connection
    if (db) {
      db.close();
    }
    // Clean up test database
    try {
      Database(TEST_DB_PATH).close();
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('Expense Model', () => {
    it('should create a new expense', () => {
      const newExpense = {
        amount: 15000,
        expense_category_id: 1,
        description: 'Test model expense',
        vendor_name: 'Test Vendor',
        vendor_contact: '555-1234',
        payment_method_id: 1,
        expense_date: '2026-07-26',
        receipt_number: 'REC-003',
        notes: 'Test notes',
        is_verified: 0,
        created_by: 1
      };

      const result = Expense.create(newExpense);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.amount).toBe(15000);
      expect(result.description).toBe('Test model expense');
    });

    it('should get an expense by ID', () => {
      const expense = Expense.getById(1);
      expect(expense).toBeDefined();
      expect(expense.amount).toBe(10000);
    });

    it('should get all expenses', () => {
      const expenses = Expense.getAll();
      expect(expenses.length).toBeGreaterThan(0);
    });

    it('should update an expense', () => {
      const updated = Expense.update(1, { description: 'Updated description', amount: 15000 });
      expect(updated).toBeDefined();
      expect(updated.description).toBe('Updated description');
    });

    it('should delete an expense', () => {
      // First create one to delete
      const newExpense = Expense.create({
        amount: 5000,
        expense_category_id: 1,
        description: 'To be deleted',
        vendor_name: 'Test Vendor',
        expense_date: '2026-07-26',
        receipt_number: 'REC-DELETE',
        created_by: 1
      });

      const deleted = Expense.delete(newExpense.id);
      expect(deleted).toBe(true);

      const check = Expense.getById(newExpense.id);
      expect(check).toBeUndefined();
    });
  });

  describe('ExpenseCategory Model', () => {
    it('should create a new expense category', () => {
      const newCategory = {
        name: 'Utilities',
        description: 'Utility bills',
        is_active: 1,
        is_system: 0,
        is_kitchen: 0,
        created_by: 1
      };

      const result = ExpenseCategory.create(newCategory);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Utilities');
    });

    it('should get a category by ID', () => {
      const category = ExpenseCategory.getById(1);
      expect(category).toBeDefined();
      expect(category.name).toBe('Food');
    });

    it('should get all categories', () => {
      const categories = ExpenseCategory.getAll();
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should get active categories', () => {
      const active = ExpenseCategory.getActive();
      expect(active.length).toBeGreaterThan(0);
    });

    it('should get kitchen categories', () => {
      const kitchen = ExpenseCategory.getKitchen();
      expect(Array.isArray(kitchen)).toBe(true);
    });

    it('should get hierarchical tree', () => {
      const tree = ExpenseCategory.getTree();
      expect(Array.isArray(tree)).toBe(true);
    });
  });

  describe('Expense Service', () => {
    it('should get paginated expenses', () => {
      const result = ExpenseService.getExpenses({ page: 1, limit: 10 });
      expect(result).toBeDefined();
      expect(result.expenses).toBeDefined();
      expect(Array.isArray(result.expenses)).toBe(true);
    });

    it('should get all expenses without pagination', () => {
      const all = ExpenseService.getAllExpenses();
      expect(all).toBeDefined();
      expect(Array.isArray(all)).toBe(true);
    });

    it('should get expenses by category', () => {
      const expenses = ExpenseService.getExpensesByCategory(1);
      expect(expenses).toBeDefined();
      expect(Array.isArray(expenses)).toBe(true);
    });

    it('should get expense by receipt number', () => {
      const expense = ExpenseService.getExpenseByReceiptNumber('REC-001');
      expect(expense).toBeDefined();
    });

    it('should search expenses', () => {
      const results = ExpenseService.searchExpenses({ query: 'Test' });
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should get expense statistics', () => {
      const stats = ExpenseService.getExpenseStatistics();
      expect(stats).toBeDefined();
      expect(stats.total).toBeDefined();
    });

    it('should verify an expense', () => {
      const updated = ExpenseService.verifyExpense(1, 1);
      expect(updated).toBeDefined();
    });

    it('should create an expense via service', () => {
      const newExpense = {
        amount: 25000,
        expense_category_id: 1,
        description: 'Service test expense',
        vendor_name: 'Service Vendor',
        expense_date: '2026-07-26',
        receipt_number: 'REC-SERVICE-001',
        created_by: 1
      };

      const created = ExpenseService.createExpense(newExpense);
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
    });

    it('should update an expense via service', () => {
      const updated = ExpenseService.updateExpense(1, {
        description: 'Updated via service',
        amount: 17500
      });
      expect(updated).toBeDefined();
    });

    it('should delete an expense via service', () => {
      // Create one to delete
      const newExpense = ExpenseService.createExpense({
        amount: 9999,
        expense_category_id: 1,
        description: 'To be deleted via service',
        vendor_name: 'Delete Vendor',
        expense_date: '2026-07-26',
        receipt_number: 'REC-DELETE-SERVICE',
        created_by: 1
      });

      const deleted = ExpenseService.deleteExpense(newExpense.id);
      expect(deleted).toBe(true);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle missing required fields', () => {
      expect(() => {
        Expense.create({});
      }).toThrow();
    });

    it('should handle invalid expense category', () => {
      expect(() => {
        Expense.create({
          amount: 10000,
          expense_category_id: 99999, // Non-existent
          description: 'Test',
          vendor_name: 'Test',
          expense_date: '2026-07-26'
        });
      }).toThrow();
    });

    it('should return empty array for non-existent category', () => {
      const expenses = ExpenseService.getExpensesByCategory(99999);
      expect(expenses).toEqual([]);
    });

    it('should return null for non-existent expense', () => {
      const expense = ExpenseService.getExpenseById(99999);
      expect(expense).toBeUndefined();
    });
  });
});

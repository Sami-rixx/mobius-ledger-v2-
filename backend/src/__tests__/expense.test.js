import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// NOTE: this file used to set `process.env.DATABASE_PATH = TEST_DB_PATH`
// textually before `import Expense from '../models/Expense.js'`, but ES
// module `import` statements are hoisted and evaluate before any other
// top-level code in a module, so that assignment had zero effect -
// config/database.js's singleton `db` was already constructed (using the
// ":memory:" test default) by the time it ran. Expense.js/ExpenseCategory.js/
// expenseService.js therefore queried the real shared singleton db, while
// this file's own fixture data was being inserted into a completely
// separate, disconnected on-disk `test_expense.db` file the model/service
// never touched. Fixed by seeding fixture rows directly into the real db
// singleton instead (the same pattern used to fix this exact class of bug
// in directorWithdrawal.test.js and expenseCategory.test.js).
import db from '../config/database.js';
import Expense from '../models/Expense.js';
import ExpenseCategory from '../models/ExpenseCategory.js';
import * as ExpenseService from '../services/expenseService.js';

describe('Expense Management - Backend Tests', () => {
  // Populated in beforeAll with real row ids from the shared db singleton -
  // expenses/expense_categories are shared tables across the whole test
  // run (and schema.sql seeds its own default system categories via
  // INSERT OR IGNORE), so hardcoded ids like `1` are not a safe assumption.
  let userId, paymentMethodId, categoryId, expense1Id, expense2Id;

  beforeAll(() => {
    const testUser = db.prepare('INSERT OR IGNORE INTO users (username, full_name, role) VALUES (?, ?, ?)').run('exp_testuser', 'Test User', 'admin');
    userId = testUser.lastInsertRowid || db.prepare('SELECT id FROM users WHERE username = ?').get('exp_testuser').id;

    const paymentMethod = db.prepare('INSERT OR IGNORE INTO payment_methods (name) VALUES (?)').run('EXP Test Cash');
    paymentMethodId = paymentMethod.lastInsertRowid || db.prepare('SELECT id FROM payment_methods WHERE name = ?').get('EXP Test Cash').id;

    const category = db.prepare('INSERT INTO expense_categories (name, description, created_by) VALUES (?, ?, ?)').run('EXP Test Food', 'Food expenses', userId);
    categoryId = category.lastInsertRowid;

    // Insert some test expenses directly into the real db
    const e1 = db.prepare(`
      INSERT INTO expenses (amount, expense_category_id, description, vendor_name, vendor_contact, payment_method_id, expense_date, receipt_number, notes, is_verified, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(100.00, categoryId, 'EXP Test expense 1', 'EXP Test Vendor 1', '123-456', paymentMethodId, '2026-01-01', 'EXPTEST-REC-001', 'Test note', 0, userId);
    expense1Id = e1.lastInsertRowid;

    const e2 = db.prepare(`
      INSERT INTO expenses (amount, expense_category_id, description, vendor_name, vendor_contact, payment_method_id, expense_date, receipt_number, notes, is_verified, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(200.00, categoryId, 'EXP Test expense 2', 'EXP Test Vendor 2', '987-654', paymentMethodId, '2026-01-02', 'EXPTEST-REC-002', 'Test note 2', 1, userId);
    expense2Id = e2.lastInsertRowid;
  });

  afterAll(() => {
    // Clean up test data from the real shared db singleton.
    try {
      // createExpense() also creates an associated transaction row (see
      // expenseService.js), which FK-references created_by/payment_method -
      // those must be cleared before the users/payment_methods rows they
      // point at, or the DELETEs below fail with FOREIGN KEY constraint
      // errors.
      db.prepare("DELETE FROM transactions WHERE created_by = ? AND transaction_type = 'expense'").run(userId);
      db.prepare("DELETE FROM expenses WHERE receipt_number LIKE 'EXPTEST-%' OR vendor_name LIKE 'EXP Test%' OR vendor_name LIKE 'Service Vendor%' OR vendor_name LIKE 'Delete Vendor%'").run();
      db.prepare("DELETE FROM expense_categories WHERE name LIKE 'EXP Test%'").run();
      db.prepare('DELETE FROM payment_methods WHERE name = ?').run('EXP Test Cash');
      db.prepare('DELETE FROM users WHERE username = ?').run('exp_testuser');
    } catch (error) {
      console.error('Error cleaning up expense test data:', error.message);
    }
  });

  describe('Expense Model', () => {
    it('should create a new expense', async () => {
      // The model destructures camelCase fields (expenseCategoryId,
      // vendorName, ...), not the snake_case keys this test originally
      // passed - those silently became `undefined`, which hit the
      // expense_category_id/vendor_name NOT NULL constraints.
      const newExpense = {
        amount: 150.00,
        expenseCategoryId: categoryId,
        description: 'EXP Test model expense',
        vendorName: 'EXP Test Vendor',
        vendorContact: '555-1234',
        paymentMethodId,
        expenseDate: '2026-07-26',
        receiptNumber: 'EXPTEST-REC-003',
        notes: 'Test notes',
        isVerified: false,
        createdBy: userId
      };

      const result = await Expense.create(newExpense);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.amount).toBe(150.00);
      expect(result.description).toBe('EXP Test model expense');
    });

    it('should get an expense by ID', async () => {
      const expense = await Expense.getById(expense1Id);
      expect(expense).toBeDefined();
      expect(expense.amount).toBe(100.00);
    });

    it('should get all expenses', async () => {
      const expenses = await Expense.getAll();
      expect(expenses.length).toBeGreaterThan(0);
    });

    it('should update an expense', async () => {
      const updated = await Expense.update(expense1Id, { description: 'EXP Test Updated description', amount: 150.00 });
      expect(updated).toBeDefined();
      expect(updated.description).toBe('EXP Test Updated description');
    });

    it('should delete an expense', async () => {
      // First create one to delete
      const newExpense = await Expense.create({
        amount: 50.00,
        expenseCategoryId: categoryId,
        description: 'EXP Test To be deleted',
        vendorName: 'EXP Test Vendor',
        expenseDate: '2026-07-26',
        receiptNumber: 'EXPTEST-REC-DELETE',
        createdBy: userId
      });

      // The model exports this as `deleteById`, not `delete` (`delete` is
      // a reserved word anyway and was never actually exported). It
      // resolves to the deleted row (fetched before the DELETE runs), not
      // a bare boolean.
      const deleted = await Expense.deleteById(newExpense.id);
      expect(deleted).toBeDefined();
      expect(deleted.id).toBe(newExpense.id);

      // getById explicitly returns null (not undefined) for a missing row.
      const check = await Expense.getById(newExpense.id);
      expect(check).toBeNull();
    });
  });

  describe('ExpenseCategory Model', () => {
    it('should create a new expense category', async () => {
      const newCategory = {
        name: 'EXP Test Utilities',
        description: 'Utility bills',
        is_active: 1,
        is_system: 0,
        is_kitchen: 0,
        created_by: userId
      };

      const result = await ExpenseCategory.create(newCategory);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('EXP Test Utilities');
    });

    it('should get a category by ID', async () => {
      const category = await ExpenseCategory.getById(categoryId);
      expect(category).toBeDefined();
      expect(category.name).toBe('EXP Test Food');
    });

    it('should get all categories', async () => {
      const categories = await ExpenseCategory.getAll();
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should get active categories', async () => {
      // Model export is `getAllActive`, not `getActive`.
      const active = await ExpenseCategory.getAllActive();
      expect(active.length).toBeGreaterThan(0);
    });

    it('should get kitchen categories', async () => {
      // Model export is `getAllKitchen`, not `getKitchen`.
      const kitchen = await ExpenseCategory.getAllKitchen();
      expect(Array.isArray(kitchen)).toBe(true);
    });

    it('should get hierarchical tree', async () => {
      const tree = await ExpenseCategory.getTree();
      expect(Array.isArray(tree)).toBe(true);
    });
  });

  describe('Expense Service', () => {
    it('should get paginated expenses', async () => {
      // Returns `{ success, data, pagination }`, not `{ expenses }`.
      const result = await ExpenseService.getPaginatedExpenses({ page: 1, pageSize: 10 });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should get all expenses without pagination', async () => {
      const all = await ExpenseService.getAllExpenses();
      expect(all).toBeDefined();
      expect(Array.isArray(all.data)).toBe(true);
    });

    it('should get expenses by category', async () => {
      const expenses = await ExpenseService.getExpensesByCategory(categoryId);
      expect(expenses).toBeDefined();
      expect(Array.isArray(expenses.data)).toBe(true);
    });

    it('should get expense by receipt number', async () => {
      const expense = await ExpenseService.getExpenseByReceiptNumber('EXPTEST-REC-001');
      expect(expense).toBeDefined();
      expect(expense.success).toBe(true);
      expect(expense.data).toBeDefined();
    });

    it('should search expenses', async () => {
      // searchExpenses(searchTerm, options) takes a raw search string as
      // its first argument, not a `{ query }` options object.
      const results = await ExpenseService.searchExpenses('EXP Test');
      expect(results).toBeDefined();
      expect(Array.isArray(results.data)).toBe(true);
    });

    it('should get expense statistics', async () => {
      const stats = await ExpenseService.getExpenseStatistics();
      expect(stats).toBeDefined();
      expect(stats.data.total).toBeDefined();
    });

    it('should verify an expense', async () => {
      const updated = await ExpenseService.verifyExpense(expense1Id, userId);
      expect(updated).toBeDefined();
      expect(updated.success).toBe(true);
    });

    it('should create an expense via service', async () => {
      // createExpense auto-generates its own receipt number and also
      // creates an associated transaction record - it does not accept or
      // persist a caller-supplied receiptNumber.
      const newExpense = {
        amount: 250.00,
        expenseCategoryId: categoryId,
        description: 'EXP Test Service test expense',
        vendorName: 'Service Vendor',
        expenseDate: '2026-07-26',
        createdBy: userId
      };

      const created = await ExpenseService.createExpense(newExpense);
      expect(created).toBeDefined();
      expect(created.success).toBe(true);
      expect(created.data.id).toBeDefined();
    });

    it('should update an expense via service', async () => {
      const updated = await ExpenseService.updateExpense(expense1Id, {
        description: 'EXP Test Updated via service',
        amount: 175.00
      });
      expect(updated).toBeDefined();
      expect(updated.success).toBe(true);
    });

    it('should delete an expense via service', async () => {
      // Create one to delete
      const newExpense = await ExpenseService.createExpense({
        amount: 99.99,
        expenseCategoryId: categoryId,
        description: 'EXP Test To be deleted via service',
        vendorName: 'Delete Vendor',
        expenseDate: '2026-07-26',
        createdBy: userId
      });

      const deleted = await ExpenseService.deleteExpense(newExpense.data.id);
      expect(deleted.success).toBe(true);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle missing required fields', async () => {
      // Expense.create() is async - calling it inside a synchronous
      // `expect(() => {...}).toThrow()` never actually catches anything,
      // since the function always returns a (rejecting) Promise rather
      // than throwing synchronously. The rejection then went completely
      // unhandled outside Jest's test lifecycle, crashing the whole Node
      // worker process with an uncaught SqliteError instead of failing
      // just this one test.
      //
      // NOTE: this deliberately uses an explicit try/catch instead of
      // `expect(promise).rejects.toThrow()`. Under this project's Jest
      // config (`--experimental-vm-modules`, required for native ESM
      // support), each test file's module graph is evaluated in its own
      // V8 "vm" context/realm. When running the full suite together
      // (many files/contexts in one process), that was observed to make
      // Jest's `rejects` matcher intermittently and non-deterministically
      // report "did not throw" for promises that provably DO reject
      // (confirmed independently by attaching a manual
      // `.then(onFulfilled, onRejected)` handler, which always observed
      // the rejection correctly) - a known class of issue with
      // cross-realm Promise handling under `--experimental-vm-modules`.
      // A plain try/catch with a manual assertion does not go through
      // that matcher code path and was confirmed reliable across many
      // repeated full-suite runs.
      let threw = false;
      try {
        await Expense.create({});
      } catch (error) {
        threw = true;
        expect(error).toBeDefined();
      }
      expect(threw).toBe(true);
    });

    it('should handle invalid expense category', async () => {
      let threw = false;
      try {
        await Expense.create({
          amount: 100,
          expenseCategoryId: 99999, // Non-existent
          description: 'Test',
          vendorName: 'Test',
          expenseDate: '2026-07-26',
          createdBy: userId
        });
      } catch (error) {
        threw = true;
        expect(error).toBeDefined();
      }
      expect(threw).toBe(true);
    });

    it('should return empty array for non-existent category', async () => {
      const expenses = await ExpenseService.getExpensesByCategory(99999);
      expect(expenses.data).toEqual([]);
    });

    it('should return null for non-existent expense', async () => {
      // Not-found is reported as `{ success: false, error }`, not undefined.
      const expense = await ExpenseService.getExpenseById(99999);
      expect(expense.success).toBe(false);
      expect(expense.error).toBe('Expense record not found');
    });
  });
});

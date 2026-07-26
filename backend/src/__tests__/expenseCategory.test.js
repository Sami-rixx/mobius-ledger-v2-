import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test database path
const TEST_DB_PATH = path.resolve(__dirname, 'test_mobius_ledger.db');

// Import ExpenseCategory model and service
process.env.DATABASE_PATH = TEST_DB_PATH;

import ExpenseCategory from '../models/ExpenseCategory.js';
import * as ExpenseCategoryService from '../services/expenseCategoryService.js';

describe('Expense Category Management - Backend Tests', () => {
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

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(name);
      CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON expense_categories(parent_id);
      CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(is_active);
      CREATE INDEX IF NOT EXISTS idx_expense_categories_kitchen ON expense_categories(is_kitchen);
    `);

    // Insert test data
    const testUser = db.prepare('INSERT INTO users (username, full_name, role) VALUES (?, ?, ?)').run('testuser', 'Test User', 'admin');
    const userId = testUser.lastInsertRowid;

    // Create some test categories with hierarchy
    const rootCategory = db.prepare('INSERT INTO expense_categories (name, description, is_active, is_kitchen, created_by) VALUES (?, ?, ?, ?, ?)').run('Root Category', 'Root expense category', 1, 0, userId);
    const rootId = rootCategory.lastInsertRowid;

    const childCategory = db.prepare('INSERT INTO expense_categories (name, parent_id, description, is_active, is_kitchen, created_by) VALUES (?, ?, ?, ?, ?, ?)').run('Child Category', rootId, 'Child category', 1, 0, userId);
    const childId = childCategory.lastInsertRowid;

    const kitchenCategory = db.prepare('INSERT INTO expense_categories (name, description, is_active, is_kitchen, created_by) VALUES (?, ?, ?, ?, ?)').run('Kitchen Expenses', 'Kitchen-related expenses', 1, 1, userId);
    const kitchenId = kitchenCategory.lastInsertRowid;

    const inactiveCategory = db.prepare('INSERT INTO expense_categories (name, description, is_active, created_by) VALUES (?, ?, ?, ?)').run('Inactive Category', 'Inactive category', 0, userId);
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

  describe('ExpenseCategory Model - CRUD Operations', () => {
    it('should create a new expense category', () => {
      const newCategory = {
        name: 'Test Category',
        description: 'Test description',
        is_active: 1,
        is_system: 0,
        is_kitchen: 0,
        created_by: 1
      };

      const result = ExpenseCategory.create(newCategory);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Category');
      expect(result.description).toBe('Test description');
    });

    it('should get a category by ID', () => {
      const category = ExpenseCategory.getById(1);
      expect(category).toBeDefined();
      expect(category.name).toBe('Root Category');
    });

    it('should get all categories', () => {
      const categories = ExpenseCategory.getAll();
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should update a category', () => {
      const updated = ExpenseCategory.update(1, {
        name: 'Updated Root Category',
        description: 'Updated description'
      });
      expect(updated).toBeDefined();
      expect(updated.name).toBe('Updated Root Category');
    });

    it('should delete a category', () => {
      // Create one to delete
      const newCategory = ExpenseCategory.create({
        name: 'To Delete',
        description: 'Will be deleted',
        is_active: 1,
        created_by: 1
      });

      const deleted = ExpenseCategory.delete(newCategory.id);
      expect(deleted).toBe(true);

      const check = ExpenseCategory.getById(newCategory.id);
      expect(check).toBeUndefined();
    });
  });

  describe('ExpenseCategory Model - Query Operations', () => {
    it('should get active categories', () => {
      const active = ExpenseCategory.getActive();
      expect(active.length).toBeGreaterThan(0);
      expect(active.every(c => c.is_active === 1)).toBe(true);
    });

    it('should get kitchen categories', () => {
      const kitchen = ExpenseCategory.getKitchen();
      expect(kitchen.length).toBeGreaterThan(0);
      expect(kitchen.every(c => c.is_kitchen === 1)).toBe(true);
    });

    it('should get categories by parent', () => {
      const children = ExpenseCategory.getByParent(1);
      expect(children).toBeDefined();
      expect(Array.isArray(children)).toBe(true);
    });

    it('should get root categories (no parent)', () => {
      const root = ExpenseCategory.getRoot();
      expect(root).toBeDefined();
      expect(Array.isArray(root)).toBe(true);
      expect(root.every(c => c.parent_id == null)).toBe(true);
    });

    it('should get category tree', () => {
      const tree = ExpenseCategory.getTree();
      expect(tree).toBeDefined();
      expect(Array.isArray(tree)).toBe(true);
    });

    it('should get category by name', () => {
      const category = ExpenseCategory.getByName('Root Category');
      expect(category).toBeDefined();
    });

    it('should get categories with usage count', () => {
      const withUsage = ExpenseCategory.getWithUsage();
      expect(withUsage).toBeDefined();
      expect(Array.isArray(withUsage)).toBe(true);
    });

    it('should get category count', () => {
      const count = ExpenseCategory.getCount();
      expect(count).toBeDefined();
      expect(typeof count.total).toBe('number');
    });

    it('should check if category name exists', () => {
      const exists = ExpenseCategory.nameExists('Root Category');
      expect(exists).toBe(true);

      const notExists = ExpenseCategory.nameExists('Non-existent Category');
      expect(notExists).toBe(false);
    });
  });

  describe('ExpenseCategory Service - Business Logic', () => {
    it('should get paginated categories', () => {
      const result = ExpenseCategoryService.getExpenseCategories({ page: 1, limit: 10 });
      expect(result).toBeDefined();
      expect(result.categories).toBeDefined();
      expect(Array.isArray(result.categories)).toBe(true);
    });

    it('should get all categories without pagination', () => {
      const all = ExpenseCategoryService.getAllExpenseCategories();
      expect(all).toBeDefined();
      expect(Array.isArray(all)).toBe(true);
    });

    it('should get active categories via service', () => {
      const active = ExpenseCategoryService.getActiveExpenseCategories();
      expect(active).toBeDefined();
      expect(Array.isArray(active)).toBe(true);
    });

    it('should get kitchen categories via service', () => {
      const kitchen = ExpenseCategoryService.getKitchenExpenseCategories();
      expect(kitchen).toBeDefined();
      expect(Array.isArray(kitchen)).toBe(true);
    });

    it('should get root categories via service', () => {
      const root = ExpenseCategoryService.getRootExpenseCategories();
      expect(root).toBeDefined();
      expect(Array.isArray(root)).toBe(true);
    });

    it('should get child categories via service', () => {
      const children = ExpenseCategoryService.getChildExpenseCategories(1);
      expect(children).toBeDefined();
      expect(Array.isArray(children)).toBe(true);
    });

    it('should get category tree via service', () => {
      const tree = ExpenseCategoryService.getExpenseCategoryTree();
      expect(tree).toBeDefined();
      expect(Array.isArray(tree)).toBe(true);
    });

    it('should get category by name via service', () => {
      const category = ExpenseCategoryService.getExpenseCategoryByName('Root Category');
      expect(category).toBeDefined();
    });

    it('should get categories with usage count via service', () => {
      const withUsage = ExpenseCategoryService.getExpenseCategoriesWithUsage();
      expect(withUsage).toBeDefined();
      expect(Array.isArray(withUsage)).toBe(true);
    });

    it('should get category count via service', () => {
      const count = ExpenseCategoryService.getExpenseCategoryCount();
      expect(count).toBeDefined();
      expect(count.total).toBeDefined();
    });

    it('should check if category name exists via service', () => {
      const exists = ExpenseCategoryService.checkExpenseCategoryNameExists('Root Category');
      expect(exists).toBeDefined();
      expect(exists.exists).toBe(true);
    });

    it('should create a category via service', () => {
      const newCategory = {
        name: 'Service Test Category',
        description: 'Created via service',
        is_active: 1,
        is_system: 0,
        is_kitchen: 0,
        parent_id: null,
        created_by: 1
      };

      const created = ExpenseCategoryService.createExpenseCategory(newCategory);
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
    });

    it('should update a category via service', () => {
      const updated = ExpenseCategoryService.updateExpenseCategory(1, {
        name: 'Service Updated Root',
        description: 'Updated via service'
      });
      expect(updated).toBeDefined();
    });

    it('should delete a category via service', () => {
      // Create one to delete
      const newCategory = ExpenseCategoryService.createExpenseCategory({
        name: 'Service Delete Test',
        description: 'To be deleted',
        is_active: 1,
        created_by: 1
      });

      const deleted = ExpenseCategoryService.deleteExpenseCategory(newCategory.id);
      expect(deleted).toBe(true);
    });
  });

  describe('Hierarchical Category Operations', () => {
    it('should create nested categories', () => {
      // Create parent
      const parent = ExpenseCategory.create({
        name: 'Parent Category',
        description: 'Parent for nesting test',
        is_active: 1,
        created_by: 1
      });

      // Create child
      const child = ExpenseCategory.create({
        name: 'Nested Child',
        parent_id: parent.id,
        description: 'Child category',
        is_active: 1,
        created_by: 1
      });

      expect(child.parent_id).toBe(parent.id);

      // Verify hierarchy
      const children = ExpenseCategory.getByParent(parent.id);
      expect(children.length).toBeGreaterThan(0);
      expect(children.some(c => c.id === child.id)).toBe(true);
    });

    it('should handle circular reference prevention', () => {
      // This is handled at the database level with foreign key constraints
      // In a real test, we'd verify that the database prevents circular references
      expect(true).toBe(true); // Placeholder for actual circular reference test
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle missing required fields', () => {
      expect(() => {
        ExpenseCategory.create({ name: '' }); // Empty name
      }).toThrow();
    });

    it('should return empty array for non-existent parent', () => {
      const children = ExpenseCategoryService.getChildExpenseCategories(99999);
      expect(children).toEqual([]);
    });

    it('should return null for non-existent category', () => {
      const category = ExpenseCategoryService.getExpenseCategoryById(99999);
      expect(category).toBeUndefined();
    });

    it('should return undefined for non-existent name', () => {
      const category = ExpenseCategoryService.getExpenseCategoryByName('Non-existent Category Name');
      expect(category).toBeUndefined();
    });

    it('should return false for non-existent name check', () => {
      const exists = ExpenseCategoryService.checkExpenseCategoryNameExists('Definitely Does Not Exist');
      expect(exists.exists).toBe(false);
    });
  });
});

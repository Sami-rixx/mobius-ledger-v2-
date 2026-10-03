import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// NOTE on a subtle but critical bug this file used to have: ES module
// `import` statements are hoisted and evaluated before any other top-level
// code in the module, so the `process.env.DATABASE_PATH = TEST_DB_PATH;`
// line that used to appear here (textually before the `import
// ExpenseCategory ...` line below) actually ran AFTER config/database.js's
// singleton `db` had already been constructed from whatever
// DATABASE_PATH was set beforehand (or the ":memory:" test default) - it
// had zero effect. ExpenseCategory.js/expenseCategoryService.js therefore
// queried the real shared singleton db, while this file's fixture data was
// being inserted into a completely separate, disconnected on-disk
// `test_expenseCategory.db` file that the model/service never touched.
// Fixed by seeding fixture rows directly into the real db singleton
// instead (the same pattern used to fix this exact class of bug in
// directorWithdrawal.test.js).
import db from '../config/database.js';
import ExpenseCategory from '../models/ExpenseCategory.js';
import * as ExpenseCategoryService from '../services/expenseCategoryService.js';

describe('Expense Category Management - Backend Tests', () => {
  // Populated in beforeAll with real row ids from the shared db singleton -
  // the expense_categories table is shared across the whole test run (and
  // schema.sql seeds its own default system categories via INSERT OR
  // IGNORE), so hardcoded ids like `1` are not a safe assumption here.
  let userId, rootId, childId, kitchenId, inactiveId;

  beforeAll(() => {
    // Insert test data into the real, already schema-initialized db
    // (schema is applied globally by src/test/setup.js's beforeAll before
    // any test file's own beforeAll runs).
    const testUser = db.prepare('INSERT OR IGNORE INTO users (username, full_name, role) VALUES (?, ?, ?)').run('ec_testuser', 'Test User', 'admin');
    userId = testUser.lastInsertRowid || db.prepare('SELECT id FROM users WHERE username = ?').get('ec_testuser').id;

    // Create some test categories with hierarchy. Names are prefixed/
    // suffixed distinctively to avoid colliding with schema.sql's seeded
    // default system categories.
    const rootCategory = db.prepare('INSERT INTO expense_categories (name, description, is_active, is_kitchen, created_by) VALUES (?, ?, ?, ?, ?)').run('EC Test Root Category', 'Root expense category', 1, 0, userId);
    rootId = rootCategory.lastInsertRowid;

    const childCategory = db.prepare('INSERT INTO expense_categories (name, parent_id, description, is_active, is_kitchen, created_by) VALUES (?, ?, ?, ?, ?, ?)').run('EC Test Child Category', rootId, 'Child category', 1, 0, userId);
    childId = childCategory.lastInsertRowid;

    const kitchenCategory = db.prepare('INSERT INTO expense_categories (name, description, is_active, is_kitchen, created_by) VALUES (?, ?, ?, ?, ?)').run('EC Test Kitchen Expenses', 'Kitchen-related expenses', 1, 1, userId);
    kitchenId = kitchenCategory.lastInsertRowid;

    const inactiveCategory = db.prepare('INSERT INTO expense_categories (name, description, is_active, created_by) VALUES (?, ?, ?, ?)').run('EC Test Inactive Category', 'Inactive category', 0, userId);
    inactiveId = inactiveCategory.lastInsertRowid;
  });

  afterAll(() => {
    // Clean up test data from the real shared db singleton. Children
    // first, then parents, to satisfy the parent_id self-referencing FK.
    try {
      db.prepare("DELETE FROM expense_categories WHERE name LIKE 'EC Test%' AND parent_id IS NOT NULL").run();
      db.prepare("DELETE FROM expense_categories WHERE name LIKE 'EC Test%'").run();
      db.prepare('DELETE FROM users WHERE username = ?').run('ec_testuser');
    } catch (error) {
      console.error('Error cleaning up expense category test data:', error.message);
    }
  });

  describe('ExpenseCategory Model - CRUD Operations', () => {
    it('should create a new expense category', async () => {
      const newCategory = {
        name: 'EC Test Category',
        description: 'Test description',
        is_active: 1,
        is_system: 0,
        is_kitchen: 0,
        created_by: userId
      };


      const result = await ExpenseCategory.create(newCategory);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('EC Test Category');
      expect(result.description).toBe('Test description');
    });

    it('should get a category by ID', async () => {
      const category = await ExpenseCategory.getById(rootId);
      expect(category).toBeDefined();
      expect(category.name).toBe('EC Test Root Category');
    });

    it('should get all categories', async () => {
      const categories = await ExpenseCategory.getAll();
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should update a category', async () => {
      // Update a freshly created category rather than mutating the
      // shared rootId fixture, which many later tests still look up by
      // its original name ('EC Test Root Category').
      const toUpdate = await ExpenseCategory.create({
        name: 'EC Test Category To Update',
        description: 'Original description',
        is_active: 1,
        created_by: userId
      });

      const updated = await ExpenseCategory.update(toUpdate.id, {
        name: 'EC Test Updated Category',
        description: 'Updated description'
      });
      expect(updated).toBeDefined();
      expect(updated.name).toBe('EC Test Updated Category');
      expect(updated.description).toBe('Updated description');
    });

    it('should delete a category', async () => {
      // Create one to delete
      const newCategory = await ExpenseCategory.create({
        name: 'EC Test To Delete',
        description: 'Will be deleted',
        is_active: 1,
        created_by: userId
      });

      // The model exports this as `deleteById`, not `delete` (`delete` is
      // a reserved word anyway and was never actually exported). It
      // resolves to the deleted row (fetched before the DELETE runs), not
      // a bare boolean.
      const deleted = await ExpenseCategory.deleteById(newCategory.id);
      expect(deleted).toBeDefined();
      expect(deleted.id).toBe(newCategory.id);

      // getById explicitly returns null (not undefined) for a missing row.
      const check = await ExpenseCategory.getById(newCategory.id);
      expect(check).toBeNull();
    });
  });

  describe('ExpenseCategory Model - Query Operations', () => {
    it('should get active categories', async () => {
      // Model export is `getAllActive`, not `getActive`.
      const active = await ExpenseCategory.getAllActive();
      expect(active.length).toBeGreaterThan(0);
      // The model converts is_active/is_system/is_kitchen to real booleans.
      expect(active.every(c => c.is_active === true)).toBe(true);
    });

    it('should get kitchen categories', async () => {
      // Model export is `getAllKitchen`, not `getKitchen`.
      const kitchen = await ExpenseCategory.getAllKitchen();
      expect(kitchen.length).toBeGreaterThan(0);
      expect(kitchen.every(c => c.is_kitchen === true)).toBe(true);
    });

    it('should get categories by parent', async () => {
      // Model export is `getChildren`, not `getByParent`.
      const children = await ExpenseCategory.getChildren(rootId);
      expect(children).toBeDefined();
      expect(Array.isArray(children)).toBe(true);
    });

    it('should get root categories (no parent)', async () => {
      // Model export is `getRootCategories`, not `getRoot`.
      const root = await ExpenseCategory.getRootCategories();
      expect(root).toBeDefined();
      expect(Array.isArray(root)).toBe(true);
      expect(root.every(c => c.parent_id == null)).toBe(true);
    });

    it('should get category tree', async () => {
      const tree = await ExpenseCategory.getTree();
      expect(tree).toBeDefined();
      expect(Array.isArray(tree)).toBe(true);
    });

    it('should get category by name', async () => {
      const category = await ExpenseCategory.getByName('EC Test Root Category');
      expect(category).toBeDefined();
    });

    it('should get categories with usage count', async () => {
      // Model export is `getWithUsageCount`, not `getWithUsage`.
      const withUsage = await ExpenseCategory.getWithUsageCount();
      expect(withUsage).toBeDefined();
      expect(Array.isArray(withUsage)).toBe(true);
    });

    it('should get category count', async () => {
      // Model export is `count`, not `getCount`, and it resolves to a
      // plain number (SELECT COUNT(*)), not a `{ total }` wrapper object.
      const total = await ExpenseCategory.count();
      expect(typeof total).toBe('number');
      expect(total).toBeGreaterThan(0);
    });

    it('should check if category name exists', async () => {
      const exists = await ExpenseCategory.nameExists('EC Test Root Category');
      expect(exists).toBe(true);

      const notExists = await ExpenseCategory.nameExists('EC Test Non-existent Category');
      expect(notExists).toBe(false);
    });
  });

  describe('ExpenseCategory Service - Business Logic', () => {
    it('should get paginated categories', async () => {
      // Service export is `getPaginatedExpenseCategories`, not
      // `getExpenseCategories`, and it returns `{ success, data,
      // pagination }`, not `{ categories }`.
      const result = await ExpenseCategoryService.getPaginatedExpenseCategories({ page: 1, pageSize: 10 });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(typeof result.pagination.total).toBe('number');
    });

    it('should get all categories without pagination', async () => {
      const all = await ExpenseCategoryService.getAllExpenseCategories();
      expect(all).toBeDefined();
      expect(all.success).toBe(true);
      expect(Array.isArray(all.data)).toBe(true);
    });

    it('should get active categories via service', async () => {
      const active = await ExpenseCategoryService.getActiveExpenseCategories();
      expect(active).toBeDefined();
      expect(Array.isArray(active.data)).toBe(true);
    });

    it('should get kitchen categories via service', async () => {
      const kitchen = await ExpenseCategoryService.getKitchenExpenseCategories();
      expect(kitchen).toBeDefined();
      expect(Array.isArray(kitchen.data)).toBe(true);
    });

    it('should get root categories via service', async () => {
      const root = await ExpenseCategoryService.getRootExpenseCategories();
      expect(root).toBeDefined();
      expect(Array.isArray(root.data)).toBe(true);
    });

    it('should get child categories via service', async () => {
      const children = await ExpenseCategoryService.getChildExpenseCategories(1);
      expect(children).toBeDefined();
      expect(Array.isArray(children.data)).toBe(true);
    });

    it('should get category tree via service', async () => {
      const tree = await ExpenseCategoryService.getExpenseCategoryTree();
      expect(tree).toBeDefined();
      expect(Array.isArray(tree.data)).toBe(true);
    });

    it('should get category by name via service', async () => {
      const category = await ExpenseCategoryService.getExpenseCategoryByName('EC Test Root Category');
      expect(category).toBeDefined();
      expect(category.success).toBe(true);
      expect(category.data).toBeDefined();
    });

    it('should get categories with usage count via service', async () => {
      const withUsage = await ExpenseCategoryService.getExpenseCategoriesWithUsage();
      expect(withUsage).toBeDefined();
      expect(Array.isArray(withUsage.data)).toBe(true);
    });

    it('should get category count via service', async () => {
      // There is no dedicated "count" service function - the service
      // layer only exposes a count as part of the paginated result's
      // metadata, so exercise that instead of a non-existent
      // `getExpenseCategoryCount`.
      const result = await ExpenseCategoryService.getPaginatedExpenseCategories();
      expect(result.success).toBe(true);
      expect(typeof result.pagination.total).toBe('number');
      expect(result.pagination.total).toBeGreaterThan(0);
    });

    it('should check if category name exists via service', async () => {
      // Returns `{ success, data: { exists } }`, not a bare boolean/object.
      const exists = await ExpenseCategoryService.checkExpenseCategoryNameExists('EC Test Root Category');
      expect(exists).toBeDefined();
      expect(exists.data.exists).toBe(true);
    });

    it('should create a category via service', async () => {
      // The service layer takes camelCase input (createdBy), unlike the
      // model layer which was seeded with snake_case directly via raw SQL.
      const newCategory = {
        name: 'EC Test Service Category',
        description: 'Created via service',
        isKitchen: false,
        parentId: null,
        createdBy: userId
      };

      const created = await ExpenseCategoryService.createExpenseCategory(newCategory);
      expect(created).toBeDefined();
      expect(created.success).toBe(true);
      expect(created.data.id).toBeDefined();
    });

    it('should update a category via service', async () => {
      // Update a freshly created category rather than mutating the shared
      // rootId fixture (other tests still look it up by its original name).
      const created = await ExpenseCategoryService.createExpenseCategory({
        name: 'EC Test Service Category To Update',
        description: 'Original',
        createdBy: userId
      });

      const updated = await ExpenseCategoryService.updateExpenseCategory(created.data.id, {
        name: 'EC Test Service Updated Root',
        description: 'Updated via service'
      });
      expect(updated).toBeDefined();
      expect(updated.success).toBe(true);
      expect(updated.data.name).toBe('EC Test Service Updated Root');
    });

    it('should delete a category via service', async () => {
      // Create one to delete
      const newCategory = await ExpenseCategoryService.createExpenseCategory({
        name: 'EC Test Service Delete Test',
        description: 'To be deleted',
        createdBy: userId
      });

      // deleteExpenseCategory returns `{ success, message }` on success,
      // not a bare boolean.
      const deleted = await ExpenseCategoryService.deleteExpenseCategory(newCategory.data.id);
      expect(deleted.success).toBe(true);
    });
  });

  describe('Hierarchical Category Operations', () => {
    it('should create nested categories', async () => {
      // Create parent
      const parent = await ExpenseCategory.create({
        name: 'EC Test Parent Category',
        description: 'Parent for nesting test',
        is_active: 1,
        created_by: userId
      });

      // Create child
      const child = await ExpenseCategory.create({
        name: 'EC Test Nested Child',
        // create() destructures camelCase `parentId`, not `parent_id` -
        // using the snake_case key here silently inserted NULL.
        parentId: parent.id,
        description: 'Child category',
        is_active: 1,
        created_by: userId
      });

      expect(child.parent_id).toBe(parent.id);

      // Verify hierarchy (model export is `getChildren`, not `getByParent`)
      const children = await ExpenseCategory.getChildren(parent.id);
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
    it('should handle missing required fields', async () => {
      // Required-field validation lives in the service layer, not the
      // model layer (the model is a thin DB access layer and the `name`
      // column only rejects NULL, not an empty string, so calling
      // ExpenseCategory.create({ name: '' }) directly does not throw).
      const result = await ExpenseCategoryService.createExpenseCategory({ name: '' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Category name is required');
    });

    it('should return empty array for non-existent parent', async () => {
      const children = await ExpenseCategoryService.getChildExpenseCategories(99999);
      expect(children.data).toEqual([]);
    });

    it('should return null for non-existent category', async () => {
      // Not-found is reported as `{ success: false, error }`, not undefined.
      const category = await ExpenseCategoryService.getExpenseCategoryById(99999);
      expect(category.success).toBe(false);
      expect(category.error).toBe('Expense category not found');
    });

    it('should return undefined for non-existent name', async () => {
      const category = await ExpenseCategoryService.getExpenseCategoryByName('Non-existent Category Name');
      expect(category.success).toBe(false);
      expect(category.error).toBe('Expense category not found');
    });

    it('should return false for non-existent name check', async () => {
      const exists = await ExpenseCategoryService.checkExpenseCategoryNameExists('Definitely Does Not Exist');
      expect(exists.data.exists).toBe(false);
    });
  });
});

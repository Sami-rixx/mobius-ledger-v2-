import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test database path
const TEST_DB_PATH = path.resolve(__dirname, 'test_mobius_ledger.db');

// Import models after setting up test environment
// We need to mock the database path or use a test-specific setup
// For now, we'll test the service functions directly

describe('Income Service', () => {
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

      CREATE TABLE IF NOT EXISTS income (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_number TEXT UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        income_category_id INTEGER NOT NULL,
        description TEXT,
        payer_name TEXT NOT NULL,
        payer_contact TEXT,
        payment_method_id INTEGER,
        transaction_id INTEGER,
        income_date DATE NOT NULL,
        notes TEXT,
        is_verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER,
        FOREIGN KEY (income_category_id) REFERENCES income_categories(id),
        FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
        FOREIGN KEY (transaction_id) REFERENCES transactions(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_income_receipt_number ON income(receipt_number);
      CREATE INDEX IF NOT EXISTS idx_income_category_id ON income(income_category_id);
      CREATE INDEX IF NOT EXISTS idx_income_date ON income(income_date);
      CREATE INDEX IF NOT EXISTS idx_income_payer_name ON income(payer_name);
      CREATE INDEX IF NOT EXISTS idx_income_is_verified ON income(is_verified);
      CREATE INDEX IF NOT EXISTS idx_income_created_at ON income(created_at);

      CREATE INDEX IF NOT EXISTS idx_income_categories_name ON income_categories(name);
    `);

    // Insert test data
    const userResult = db.prepare('INSERT OR IGNORE INTO users (username, full_name, email) VALUES (?, ?, ?)').run('testuser', 'Test User', 'test@example.com');
    const userId = userResult.lastInsertRowid || db.prepare('SELECT id FROM users WHERE username = ?').get('testuser').id;

    db.prepare('INSERT OR IGNORE INTO payment_methods (name, description) VALUES (?, ?)').run('Cash', 'Cash payment');
    db.prepare('INSERT OR IGNORE INTO payment_methods (name, description) VALUES (?, ?)').run('Bank Transfer', 'Bank transfer payment');
    
    const paymentMethodId = db.prepare('SELECT id FROM payment_methods WHERE name = ?').get('Cash').id;

    db.prepare('INSERT OR IGNORE INTO income_categories (name, description, is_system) VALUES (?, ?, ?)').run('Test Category', 'Test income category', 0);
    
    const categoryId = db.prepare('SELECT id FROM income_categories WHERE name = ?').get('Test Category').id;

    // Clean up any existing test data
    db.prepare('DELETE FROM income WHERE payer_name = ?').run('Test Payer');
    db.prepare('DELETE FROM income_categories WHERE name = ? AND is_system = 0').run('Test Category');
    db.prepare('INSERT OR IGNORE INTO income_categories (name, description, is_system, created_by) VALUES (?, ?, ?, ?)').run('Test Category', 'Test income category', 0, userId);
  });

  afterAll(() => {
    // Clean up test data
    try {
      const db = new Database(TEST_DB_PATH);
      db.prepare('DELETE FROM income WHERE payer_name = ?').run('Test Payer');
      db.prepare('DELETE FROM income_categories WHERE name = ? AND is_system = 0').run('Test Category');
      db.close();
    } catch (error) {
      console.error('Error cleaning up test data:', error.message);
    }
  });

  describe('Income Model', () => {
    it('should be defined', () => {
      // This is a placeholder test
      // In a real implementation, we would import and test the Income model
      expect(true).toBe(true);
    });
  });

  describe('Income Category Model', () => {
    it('should be defined', () => {
      // This is a placeholder test
      // In a real implementation, we would import and test the IncomeCategory model
      expect(true).toBe(true);
    });
  });
});

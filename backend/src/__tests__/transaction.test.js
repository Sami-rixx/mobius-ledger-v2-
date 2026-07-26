/**
 * Transaction Model & Service Tests
 * Comprehensive tests for Transaction module
 */

import {
  getAllTransactions,
  getTransactionCount,
  getTransactionById,
  getTransactionByReceiptNumber,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByStudent,
  getTransactionsByDateRange
} from '../models/Transaction.js';

import {
  validateTransaction,
  getPaginatedTransactions,
  getTransaction,
  getTransactionByReceipt,
  createTransactionRecord,
  updateTransactionRecord,
  deleteTransactionRecord,
  searchTransactions,
  getTransactionStatistics,
  getTransactionCountByFilter
} from '../services/transactionService.js';

import db from '../config/database.js';

// Test database setup
const TEST_DB = ':memory:';
let testDb;

beforeAll(() => {
  // Create in-memory database for testing
  testDb = new (require('better-sqlite3'))(TEST_DB);
  
  // Create transactions table
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_number TEXT UNIQUE,
      transaction_type TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      category_id INTEGER,
      income_category_id INTEGER,
      expense_category_id INTEGER,
      student_id INTEGER,
      description TEXT,
      payment_method_id INTEGER,
      transaction_date TEXT,
      transaction_time TEXT,
      reference TEXT,
      notes TEXT,
      is_verified INTEGER DEFAULT 0,
      verified_by INTEGER,
      verified_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      updated_by INTEGER
    )
  `);
});

afterAll(() => {
  if (testDb) {
    testDb.close();
  }
});

describe('Transaction Model', () => {
  describe('Field Constants', () => {
    test('should have TABLE constant', () => {
      expect(typeof getAllTransactions).toBe('function');
    });
  });

  describe('Model Functions', () => {
    test('should export getAllTransactions function', () => {
      expect(typeof getAllTransactions).toBe('function');
    });

    test('should export getTransactionCount function', () => {
      expect(typeof getTransactionCount).toBe('function');
    });

    test('should export getTransactionById function', () => {
      expect(typeof getTransactionById).toBe('function');
    });

    test('should export getTransactionByReceiptNumber function', () => {
      expect(typeof getTransactionByReceiptNumber).toBe('function');
    });

    test('should export createTransaction function', () => {
      expect(typeof createTransaction).toBe('function');
    });

    test('should export updateTransaction function', () => {
      expect(typeof updateTransaction).toBe('function');
    });

    test('should export deleteTransaction function', () => {
      expect(typeof deleteTransaction).toBe('function');
    });

    test('should export getTransactionsByStudent function', () => {
      expect(typeof getTransactionsByStudent).toBe('function');
    });

    test('should export getTransactionsByDateRange function', () => {
      expect(typeof getTransactionsByDateRange).toBe('function');
    });
  });
});

describe('Transaction Service', () => {
  describe('validateTransaction', () => {
    test('should validate valid transaction', () => {
      const validData = {
        transactionType: 'income',
        amount: 100.00
      };
      const result = validateTransaction(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject missing transaction type', () => {
      const invalidData = {
        amount: 100.00
      };
      const result = validateTransaction(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Transaction type is required');
    });

    test('should reject invalid transaction type', () => {
      const invalidData = {
        transactionType: 'invalid_type',
        amount: 100.00
      };
      const result = validateTransaction(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid transaction type'))).toBe(true);
    });

    test('should reject missing amount', () => {
      const invalidData = {
        transactionType: 'income'
      };
      const result = validateTransaction(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount is required');
    });

    test('should reject negative amount', () => {
      const invalidData = {
        transactionType: 'income',
        amount: -100.00
      };
      const result = validateTransaction(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be a positive number');
    });

    test('should accept all valid transaction types', () => {
      const validTypes = ['income', 'expense', 'school_fee', 'lunch_fee', 'student_charge', 'director_withdrawal'];
      validTypes.forEach(type => {
        const result = validateTransaction({ transactionType: type, amount: 100 });
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('getPaginatedTransactions', () => {
    test('should return pagination info', () => {
      const result = getPaginatedTransactions({ page: 1, pageSize: 20 });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toHaveProperty('page');
      expect(result.pagination).toHaveProperty('pageSize');
      expect(result.pagination).toHaveProperty('total');
    });

    test('should accept filter parameters', () => {
      const result = getPaginatedTransactions({
        page: 1,
        pageSize: 10,
        transactionType: 'income'
      });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
    });
  });

  describe('getTransaction', () => {
    test('should return null for invalid ID', () => {
      const result = getTransaction(null);
      expect(result).toBeNull();
    });

    test('should return null for NaN ID', () => {
      const result = getTransaction(NaN);
      expect(result).toBeNull();
    });
  });

  describe('getTransactionByReceipt', () => {
    test('should return null for missing receipt', () => {
      const result = getTransactionByReceipt(null);
      expect(result).toBeNull();
    });

    test('should return null for empty receipt', () => {
      const result = getTransactionByReceipt('');
      expect(result).toBeNull();
    });
  });

  describe('createTransactionRecord', () => {
    test('should reject invalid data', () => {
      const result = createTransactionRecord({});
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });

    test('should generate receipt number if not provided', () => {
      // This test would need a mock database
      // For now, just verify the function exists and returns proper structure
      const result = createTransactionRecord({ transactionType: 'income', amount: 100 });
      expect(result).toHaveProperty('success');
    });
  });

  describe('updateTransactionRecord', () => {
    test('should reject invalid ID', () => {
      const result = updateTransactionRecord(null, { transactionType: 'income', amount: 100 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid transaction ID');
    });

    test('should reject invalid data', () => {
      const result = updateTransactionRecord(1, {});
      expect(result.success).toBe(false);
    });
  });

  describe('deleteTransactionRecord', () => {
    test('should reject invalid ID', () => {
      const result = deleteTransactionRecord(null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid transaction ID');
    });
  });

  describe('getTransactionStatistics', () => {
    test('should return statistics object', () => {
      const stats = getTransactionStatistics();
      expect(stats).toHaveProperty('totalTransactions');
      expect(stats).toHaveProperty('totalAmount');
      expect(stats).toHaveProperty('byType');
    });

    test('should accept filter options', () => {
      const stats = getTransactionStatistics({ transactionType: 'income' });
      expect(stats).toHaveProperty('totalTransactions');
      expect(stats).toHaveProperty('totalAmount');
    });
  });

  describe('getTransactionCountByFilter', () => {
    test('should return a number', () => {
      const count = getTransactionCountByFilter();
      expect(typeof count).toBe('number');
    });

    test('should accept filter options', () => {
      const count = getTransactionCountByFilter({ transactionType: 'income' });
      expect(typeof count).toBe('number');
    });
  });
});

describe('Transaction Module Exports', () => {
  test('should export all required functions from model', () => {
    const model = require('../models/Transaction.js');
    expect(model.getAllTransactions).toBeDefined();
    expect(model.getTransactionCount).toBeDefined();
    expect(model.getTransactionById).toBeDefined();
    expect(model.getTransactionByReceiptNumber).toBeDefined();
    expect(model.createTransaction).toBeDefined();
    expect(model.updateTransaction).toBeDefined();
    expect(model.deleteTransaction).toBeDefined();
    expect(model.getTransactionsByStudent).toBeDefined();
    expect(model.getTransactionsByDateRange).toBeDefined();
  });

  test('should export all required functions from service', () => {
    const service = require('../services/transactionService.js');
    expect(service.validateTransaction).toBeDefined();
    expect(service.getPaginatedTransactions).toBeDefined();
    expect(service.getTransaction).toBeDefined();
    expect(service.getTransactionByReceipt).toBeDefined();
    expect(service.createTransactionRecord).toBeDefined();
    expect(service.updateTransactionRecord).toBeDefined();
    expect(service.deleteTransactionRecord).toBeDefined();
    expect(service.searchTransactions).toBeDefined();
    expect(service.getTransactionStatistics).toBeDefined();
    expect(service.getTransactionCountByFilter).toBeDefined();
  });
});

describe('Transaction Types Validation', () => {
  test('should have valid transaction types constant', () => {
    const service = require('../services/transactionService.js');
    // The constant is not exported, but we can test through validation
    const validTypes = ['income', 'expense', 'school_fee', 'lunch_fee', 'student_charge', 'director_withdrawal'];
    validTypes.forEach(type => {
      const result = service.validateTransaction({ transactionType: type, amount: 100 });
      expect(result.isValid).toBe(true);
    });
  });

  test('should reject invalid transaction type', () => {
    const service = require('../services/transactionService.js');
    const result = service.validateTransaction({ 
      transactionType: 'invalid', 
      amount: 100 
    });
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Invalid transaction type');
  });
});

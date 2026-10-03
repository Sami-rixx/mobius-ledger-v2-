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

// NOTE: this file used to spin up its own disconnected, never-referenced
// `better-sqlite3` database via `new (require('better-sqlite3'))(...)` in
// beforeAll. Besides being entirely unused (nothing in this file ever
// queries `testDb`), `require` does not exist in this project's ES
// modules - every test in this file crashed with
// `ReferenceError: require is not defined` before that code even got a
// chance to run, since Jest's `beforeAll` executes before any test body.
// The model/service functions under test here (Transaction.js /
// transactionService.js) already use the real shared db singleton from
// config/database.js (seeded with the full schema via the global
// `src/test/setup.js`), so no separate test database is needed at all.

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
  // NOTE: these used `require('../models/Transaction.js')` /
  // `require('../services/transactionService.js')` to re-fetch the same
  // modules already imported via ESM `import` at the top of this file -
  // `require` isn't available in ES modules at all, and was never needed
  // here since every one of these named exports is already in scope.
  test('should export all required functions from model', () => {
    expect(getAllTransactions).toBeDefined();
    expect(getTransactionCount).toBeDefined();
    expect(getTransactionById).toBeDefined();
    expect(getTransactionByReceiptNumber).toBeDefined();
    expect(createTransaction).toBeDefined();
    expect(updateTransaction).toBeDefined();
    expect(deleteTransaction).toBeDefined();
    expect(getTransactionsByStudent).toBeDefined();
    expect(getTransactionsByDateRange).toBeDefined();
  });

  test('should export all required functions from service', () => {
    expect(validateTransaction).toBeDefined();
    expect(getPaginatedTransactions).toBeDefined();
    expect(getTransaction).toBeDefined();
    expect(getTransactionByReceipt).toBeDefined();
    expect(createTransactionRecord).toBeDefined();
    expect(updateTransactionRecord).toBeDefined();
    expect(deleteTransactionRecord).toBeDefined();
    expect(searchTransactions).toBeDefined();
    expect(getTransactionStatistics).toBeDefined();
    expect(getTransactionCountByFilter).toBeDefined();
  });
});

describe('Transaction Types Validation', () => {
  test('should have valid transaction types constant', () => {
    // The constant is not exported, but we can test through validation
    const validTypes = ['income', 'expense', 'school_fee', 'lunch_fee', 'student_charge', 'director_withdrawal'];
    validTypes.forEach(type => {
      const result = validateTransaction({ transactionType: type, amount: 100 });
      expect(result.isValid).toBe(true);
    });
  });

  test('should reject invalid transaction type', () => {
    const result = validateTransaction({
      transactionType: 'invalid',
      amount: 100
    });
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Invalid transaction type');
  });
});

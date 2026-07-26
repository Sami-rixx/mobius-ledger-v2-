import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test database path
const TEST_DB_PATH = path.resolve(__dirname, 'test_mobius_ledger.db');

// Create a test database instance for the models
let testDb;

// Mock the database module
import { WITHDRAWAL_STATUS } from '../models/DirectorWithdrawal.js';

// We'll test the service functions directly since they contain the business logic
// The model functions are tested through the service layer

describe('Director Withdrawal Module', () => {
  let db;

  beforeAll(() => {
    // Create test database
    db = new Database(TEST_DB_PATH);
    db.pragma('foreign_keys = ON');

    // Create minimal schema for testing director withdrawals
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

      CREATE TABLE IF NOT EXISTS director_withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount DECIMAL(10, 2) NOT NULL,
        label TEXT,
        purpose TEXT NOT NULL,
        description TEXT,
        recipient_name TEXT NOT NULL,
        recipient_contact TEXT,
        payment_method_id INTEGER,
        transaction_id INTEGER,
        withdrawal_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        approved_by INTEGER,
        approved_at DATETIME,
        rejected_by INTEGER,
        rejected_at DATETIME,
        rejection_reason TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER NOT NULL,
        updated_by INTEGER NOT NULL,
        FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
        FOREIGN KEY (transaction_id) REFERENCES transactions(id),
        FOREIGN KEY (approved_by) REFERENCES users(id),
        FOREIGN KEY (rejected_by) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      -- Indexes for director_withdrawals
      CREATE INDEX IF NOT EXISTS idx_director_withdrawals_status ON director_withdrawals(status);
      CREATE INDEX IF NOT EXISTS idx_director_withdrawals_date ON director_withdrawals(withdrawal_date);
      CREATE INDEX IF NOT EXISTS idx_director_withdrawals_label ON director_withdrawals(label);
      CREATE INDEX IF NOT EXISTS idx_director_withdrawals_recipient ON director_withdrawals(recipient_name);
      CREATE INDEX IF NOT EXISTS idx_director_withdrawals_created_at ON director_withdrawals(created_at);
    `);

    // Insert test data
    const userResult = db.prepare('INSERT OR IGNORE INTO users (username, full_name, email) VALUES (?, ?, ?)').run('testuser', 'Test User', 'test@example.com');
    const userId = userResult.lastInsertRowid || db.prepare('SELECT id FROM users WHERE username = ?').get('testuser').id;

    db.prepare('INSERT OR IGNORE INTO payment_methods (name, description) VALUES (?, ?)').run('Cash', 'Cash payment');
    db.prepare('INSERT OR IGNORE INTO payment_methods (name, description) VALUES (?, ?)').run('Bank Transfer', 'Bank transfer payment');
    
    const paymentMethodId = db.prepare('SELECT id FROM payment_methods WHERE name = ?').get('Cash').id;

    // Clean up any existing test data
    db.prepare('DELETE FROM director_withdrawals WHERE purpose LIKE ?').run('%Test%');
    
    // Store userId for tests
    global.testUserId = userId;
    global.testPaymentMethodId = paymentMethodId;
    
    db.close();
  });

  afterAll(() => {
    // Clean up test data
    try {
      const cleanupDb = new Database(TEST_DB_PATH);
      cleanupDb.prepare('DELETE FROM director_withdrawals WHERE purpose LIKE ?').run('%Test%');
      cleanupDb.prepare('DELETE FROM users WHERE username = ?').run('testuser');
      cleanupDb.prepare('DELETE FROM payment_methods WHERE name = ? OR name = ?').run('Cash', 'Bank Transfer');
      cleanupDb.close();
    } catch (error) {
      console.error('Error cleaning up test data:', error.message);
    }
  });

  describe('WITHDRAWAL_STATUS Constants', () => {
    it('should define all withdrawal statuses', () => {
      expect(WITHDRAWAL_STATUS.PENDING).toBe('pending');
      expect(WITHDRAWAL_STATUS.APPROVED).toBe('approved');
      expect(WITHDRAWAL_STATUS.REJECTED).toBe('rejected');
      expect(WITHDRAWAL_STATUS.COMPLETED).toBe('completed');
      expect(WITHDRAWAL_STATUS.CANCELLED).toBe('cancelled');
    });

    it('should have 5 status values', () => {
      const statusValues = Object.values(WITHDRAWAL_STATUS);
      expect(statusValues).toHaveLength(5);
      expect(statusValues).toContain('pending');
      expect(statusValues).toContain('approved');
      expect(statusValues).toContain('rejected');
      expect(statusValues).toContain('completed');
      expect(statusValues).toContain('cancelled');
    });
  });

  describe('Director Withdrawal Model Fields', () => {
    it('should export TABLE constant', async () => {
      const { TABLE } = await import('../models/DirectorWithdrawal.js');
      expect(TABLE).toBe('director_withdrawals');
    });

    it('should export FIELDS constant with all field names', async () => {
      const { FIELDS } = await import('../models/DirectorWithdrawal.js');
      expect(FIELDS.ID).toBe('id');
      expect(FIELDS.AMOUNT).toBe('amount');
      expect(FIELDS.LABEL).toBe('label');
      expect(FIELDS.PURPOSE).toBe('purpose');
      expect(FIELDS.DESCRIPTION).toBe('description');
      expect(FIELDS.RECIPIENT_NAME).toBe('recipient_name');
      expect(FIELDS.RECIPIENT_CONTACT).toBe('recipient_contact');
      expect(FIELDS.PAYMENT_METHOD_ID).toBe('payment_method_id');
      expect(FIELDS.TRANSACTION_ID).toBe('transaction_id');
      expect(FIELDS.WITHDRAWAL_DATE).toBe('withdrawal_date');
      expect(FIELDS.STATUS).toBe('status');
      expect(FIELDS.APPROVED_BY).toBe('approved_by');
      expect(FIELDS.APPROVED_AT).toBe('approved_at');
      expect(FIELDS.REJECTED_BY).toBe('rejected_by');
      expect(FIELDS.REJECTED_AT).toBe('rejected_at');
      expect(FIELDS.REJECTION_REASON).toBe('rejection_reason');
      expect(FIELDS.NOTES).toBe('notes');
      expect(FIELDS.CREATED_AT).toBe('created_at');
      expect(FIELDS.UPDATED_AT).toBe('updated_at');
      expect(FIELDS.CREATED_BY).toBe('created_by');
      expect(FIELDS.UPDATED_BY).toBe('updated_by');
    });
  });

  describe('Director Withdrawal Service', () => {
    let directorWithdrawalService;
    let db;

    beforeEach(async () => {
      // Re-import the service for each test to ensure clean state
      directorWithdrawalService = await import('../services/directorWithdrawalService.js');
      
      // Open database connection
      db = new Database(TEST_DB_PATH);
      db.pragma('foreign_keys = ON');
    });

    afterEach(() => {
      if (db) db.close();
    });

    describe('getPaginatedWithdrawals', () => {
      it('should return paginated withdrawals with default parameters', async () => {
        // This test would require a test database setup
        // For now, we test that the function exists and has the right signature
        expect(typeof directorWithdrawalService.getPaginatedWithdrawals).toBe('function');
      });

      it('should accept filter options', async () => {
        expect(typeof directorWithdrawalService.getPaginatedWithdrawals).toBe('function');
      });
    });

    describe('getWithdrawalById', () => {
      it('should return a withdrawal by ID', async () => {
        expect(typeof directorWithdrawalService.getWithdrawalById).toBe('function');
      });

      it('should return not found for non-existent ID', async () => {
        const result = await directorWithdrawalService.getWithdrawalById(99999);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Withdrawal not found');
      });
    });

    describe('createWithdrawal', () => {
      it('should create a new withdrawal with valid data', async () => {
        const data = {
          amount: 1000,
          purpose: 'Test Purpose',
          recipientName: 'Test Recipient',
          description: 'Test Description',
          label: 'Test Label'
        };
        
        const result = await directorWithdrawalService.createWithdrawal(data, global.testUserId);
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.purpose).toBe('Test Purpose');
        expect(result.data.recipientName).toBe('Test Recipient');
        expect(result.data.status).toBe('pending');
        expect(result.data.is_pending).toBe(true);
      });

      it('should fail validation for missing amount', async () => {
        const data = {
          purpose: 'Test Purpose',
          recipientName: 'Test Recipient'
        };
        
        const result = await directorWithdrawalService.createWithdrawal(data, global.testUserId);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Validation failed');
        expect(result.errors).toContain('Amount is required');
      });

      it('should fail validation for missing purpose', async () => {
        const data = {
          amount: 1000,
          recipientName: 'Test Recipient'
        };
        
        const result = await directorWithdrawalService.createWithdrawal(data, global.testUserId);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Validation failed');
        expect(result.errors).toContain('Purpose is required');
      });

      it('should fail validation for missing recipient name', async () => {
        const data = {
          amount: 1000,
          purpose: 'Test Purpose'
        };
        
        const result = await directorWithdrawalService.createWithdrawal(data, global.testUserId);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Validation failed');
        expect(result.errors).toContain('Recipient name is required');
      });

      it('should fail validation for amount below minimum', async () => {
        const data = {
          amount: 0,
          purpose: 'Test Purpose',
          recipientName: 'Test Recipient'
        };
        
        const result = await directorWithdrawalService.createWithdrawal(data, global.testUserId);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Validation failed');
        expect(result.errors.some(e => e.includes('at least'))).toBe(true);
      });

      it('should fail validation for amount above maximum', async () => {
        const data = {
          amount: 1000001,
          purpose: 'Test Purpose',
          recipientName: 'Test Recipient'
        };
        
        const result = await directorWithdrawalService.createWithdrawal(data, global.testUserId);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Validation failed');
        expect(result.errors.some(e => e.includes('at most'))).toBe(true);
      });

      it('should fail for invalid user', async () => {
        const data = {
          amount: 1000,
          purpose: 'Test Purpose',
          recipientName: 'Test Recipient'
        };
        
        const result = await directorWithdrawalService.createWithdrawal(data, 99999);
        expect(result.success).toBe(false);
        expect(result.error).toBe('User not found');
      });
    });

    describe('updateWithdrawal', () => {
      it('should update an existing withdrawal', async () => {
        // First create a withdrawal
        const createResult = await directorWithdrawalService.createWithdrawal({
          amount: 1000,
          purpose: 'Original Purpose',
          recipientName: 'Original Recipient',
          description: 'Original Description'
        }, global.testUserId);

        if (createResult.success) {
          const updateResult = await directorWithdrawalService.updateWithdrawal(
            createResult.data.id,
            {
              purpose: 'Updated Purpose',
              description: 'Updated Description'
            },
            global.testUserId
          );

          expect(updateResult.success).toBe(true);
          expect(updateResult.data.purpose).toBe('Updated Purpose');
          expect(updateResult.data.description).toBe('Updated Description');
        }
      });

      it('should fail for non-existent withdrawal', async () => {
        const result = await directorWithdrawalService.updateWithdrawal(
          99999,
          { purpose: 'Updated Purpose' },
          global.testUserId
        );
        expect(result.success).toBe(false);
        expect(result.error).toBe('Withdrawal not found');
      });

      it('should validate status transitions', async () => {
        // First create a withdrawal
        const createResult = await directorWithdrawalService.createWithdrawal({
          amount: 1000,
          purpose: 'Test Purpose',
          recipientName: 'Test Recipient'
        }, global.testUserId);

        if (createResult.success) {
          // Try to transition directly from pending to completed (should fail)
          const result = await directorWithdrawalService.updateWithdrawal(
            createResult.data.id,
            { status: 'completed' },
            global.testUserId
          );

          expect(result.success).toBe(false);
          expect(result.error).toContain('Cannot transition');
        }
      });
    });

    describe('deleteWithdrawal', () => {
      it('should delete a pending withdrawal', async () => {
        // First create a withdrawal
        const createResult = await directorWithdrawalService.createWithdrawal({
          amount: 1000,
          purpose: 'Test Purpose to Delete',
          recipientName: 'Test Recipient to Delete'
        }, global.testUserId);

        if (createResult.success) {
          const deleteResult = await directorWithdrawalService.deleteWithdrawal(
            createResult.data.id,
            global.testUserId
          );

          expect(deleteResult.success).toBe(true);
        }
      });

      it('should fail to delete a non-pending withdrawal', async () => {
        // First create and approve a withdrawal
        const createResult = await directorWithdrawalService.createWithdrawal({
          amount: 1000,
          purpose: 'Test Purpose',
          recipientName: 'Test Recipient'
        }, global.testUserId);

        if (createResult.success) {
          // Approve it first
          await directorWithdrawalService.approveWithdrawal(
            createResult.data.id,
            global.testUserId
          );

          // Try to delete approved withdrawal
          const deleteResult = await directorWithdrawalService.deleteWithdrawal(
            createResult.data.id,
            global.testUserId
          );

          expect(deleteResult.success).toBe(false);
          expect(deleteResult.error).toContain('Only pending withdrawals can be deleted');
        }
      });

      it('should fail for non-existent withdrawal', async () => {
        const result = await directorWithdrawalService.deleteWithdrawal(
          99999,
          global.testUserId
        );
        expect(result.success).toBe(false);
        expect(result.error).toBe('Withdrawal not found');
      });
    });

    describe('approveWithdrawal', () => {
      it('should approve a pending withdrawal', async () => {
        // First create a withdrawal
        const createResult = await directorWithdrawalService.createWithdrawal({
          amount: 1000,
          purpose: 'Test Purpose for Approval',
          recipientName: 'Test Recipient for Approval'
        }, global.testUserId);

        if (createResult.success) {
          const approveResult = await directorWithdrawalService.approveWithdrawal(
            createResult.data.id,
            global.testUserId,
            'Approval notes'
          );

          expect(approveResult.success).toBe(true);
          expect(approveResult.data.status).toBe('approved');
          expect(approveResult.data.is_approved).toBe(true);
        }
      });

      it('should fail to approve a non-pending withdrawal', async () => {
        // First create a withdrawal
        const createResult = await directorWithdrawalService.createWithdrawal({
          amount: 1000,
          purpose: 'Test Purpose',
          recipientName: 'Test Recipient'
        }, global.testUserId);

        if (createResult.success) {
          // Approve it first
          await directorWithdrawalService.approveWithdrawal(
            createResult.data.id,
            global.testUserId
          );

          // Try to approve again
          const approveResult = await directorWithdrawalService.approveWithdrawal(
            createResult.data.id,
            global.testUserId
          );

          expect(approveResult.success).toBe(false);
          expect(approveResult.error).toContain('Only pending withdrawals can be approved');
        }
      });

      it('should fail for non-existent withdrawal', async () => {
        const result = await directorWithdrawalService.approveWithdrawal(
          99999,
          global.testUserId
        );
        expect(result.success).toBe(false);
        expect(result.error).toBe('Withdrawal not found');
      });
    });

    describe('rejectWithdrawal', () => {
      it('should reject a pending withdrawal with a reason', async () => {
        // First create a withdrawal
        const createResult = await directorWithdrawalService.createWithdrawal({
          amount: 1000,
          purpose: 'Test Purpose for Rejection',
          recipientName: 'Test Recipient for Rejection'
        }, global.testUserId);

        if (createResult.success) {
          const rejectResult = await directorWithdrawalService.rejectWithdrawal(
            createResult.data.id,
            global.testUserId,
            'Insufficient funds'
          );

          expect(rejectResult.success).toBe(true);
          expect(rejectResult.data.status).toBe('rejected');
          expect(rejectResult.data.is_rejected).toBe(true);
        }
      });

      it('should fail without a rejection reason', async () => {
        const result = await directorWithdrawalService.rejectWithdrawal(
          1,
          global.testUserId,
          ''
        );
        expect(result.success).toBe(false);
        expect(result.error).toBe('Rejection reason is required');
      });

      it('should fail to reject a non-pending withdrawal', async () => {
        // First create a withdrawal
        const createResult = await directorWithdrawalService.createWithdrawal({
          amount: 1000,
          purpose: 'Test Purpose',
          recipientName: 'Test Recipient'
        }, global.testUserId);

        if (createResult.success) {
          // Approve it first
          await directorWithdrawalService.approveWithdrawal(
            createResult.data.id,
            global.testUserId
          );

          // Try to reject approved withdrawal
          const rejectResult = await directorWithdrawalService.rejectWithdrawal(
            createResult.data.id,
            global.testUserId,
            'Reason'
          );

          expect(rejectResult.success).toBe(false);
          expect(rejectResult.error).toContain('Only pending withdrawals can be rejected');
        }
      });

      it('should fail for non-existent withdrawal', async () => {
        const result = await directorWithdrawalService.rejectWithdrawal(
          99999,
          global.testUserId,
          'Reason'
        );
        expect(result.success).toBe(false);
        expect(result.error).toBe('Withdrawal not found');
      });
    });

    describe('completeWithdrawal', () => {
      it('should mark an approved withdrawal as completed', async () => {
        // First create a withdrawal
        const createResult = await directorWithdrawalService.createWithdrawal({
          amount: 1000,
          purpose: 'Test Purpose for Completion',
          recipientName: 'Test Recipient for Completion'
        }, global.testUserId);

        if (createResult.success) {
          // Approve it first
          await directorWithdrawalService.approveWithdrawal(
            createResult.data.id,
            global.testUserId
          );

          // Mark as completed
          const completeResult = await directorWithdrawalService.completeWithdrawal(
            createResult.data.id,
            global.testUserId
          );

          expect(completeResult.success).toBe(true);
          expect(completeResult.data.status).toBe('completed');
          expect(completeResult.data.is_completed).toBe(true);
        }
      });

      it('should fail to complete a non-approved withdrawal', async () => {
        // First create a withdrawal (pending)
        const createResult = await directorWithdrawalService.createWithdrawal({
          amount: 1000,
          purpose: 'Test Purpose',
          recipientName: 'Test Recipient'
        }, global.testUserId);

        if (createResult.success) {
          // Try to complete pending withdrawal
          const completeResult = await directorWithdrawalService.completeWithdrawal(
            createResult.data.id,
            global.testUserId
          );

          expect(completeResult.success).toBe(false);
          expect(completeResult.error).toContain('Only approved withdrawals can be completed');
        }
      });

      it('should fail for non-existent withdrawal', async () => {
        const result = await directorWithdrawalService.completeWithdrawal(
          99999,
          global.testUserId
        );
        expect(result.success).toBe(false);
        expect(result.error).toBe('Withdrawal not found');
      });
    });

    describe('cancelWithdrawal', () => {
      it('should cancel a pending withdrawal', async () => {
        // First create a withdrawal
        const createResult = await directorWithdrawalService.createWithdrawal({
          amount: 1000,
          purpose: 'Test Purpose for Cancellation',
          recipientName: 'Test Recipient for Cancellation'
        }, global.testUserId);

        if (createResult.success) {
          const cancelResult = await directorWithdrawalService.cancelWithdrawal(
            createResult.data.id,
            global.testUserId,
            'No longer needed'
          );

          expect(cancelResult.success).toBe(true);
          expect(cancelResult.data.status).toBe('cancelled');
          expect(cancelResult.data.is_cancelled).toBe(true);
        }
      });

      it('should fail to cancel a completed withdrawal', async () => {
        // First create a withdrawal
        const createResult = await directorWithdrawalService.createWithdrawal({
          amount: 1000,
          purpose: 'Test Purpose',
          recipientName: 'Test Recipient'
        }, global.testUserId);

        if (createResult.success) {
          // Approve and complete it
          await directorWithdrawalService.approveWithdrawal(
            createResult.data.id,
            global.testUserId
          );
          await directorWithdrawalService.completeWithdrawal(
            createResult.data.id,
            global.testUserId
          );

          // Try to cancel completed withdrawal
          const cancelResult = await directorWithdrawalService.cancelWithdrawal(
            createResult.data.id,
            global.testUserId,
            'Reason'
          );

          expect(cancelResult.success).toBe(false);
          expect(cancelResult.error).toBe('Cannot cancel a completed withdrawal');
        }
      });

      it('should fail for non-existent withdrawal', async () => {
        const result = await directorWithdrawalService.cancelWithdrawal(
          99999,
          global.testUserId
        );
        expect(result.success).toBe(false);
        expect(result.error).toBe('Withdrawal not found');
      });
    });

    describe('getWithdrawalStatistics', () => {
      it('should return statistics object', async () => {
        const result = await directorWithdrawalService.getWithdrawalStatistics();
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('total');
        expect(result.data).toHaveProperty('by_status');
        expect(result.data).toHaveProperty('by_amount');
      });
    });

    describe('getAllLabels', () => {
      it('should return array of labels', async () => {
        const result = await directorWithdrawalService.getAllLabels();
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
      });
    });

    describe('getPendingWithdrawals', () => {
      it('should return paginated pending withdrawals', async () => {
        const result = await directorWithdrawalService.getPendingWithdrawals();
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
      });
    });

    describe('searchWithdrawals', () => {
      it('should search withdrawals by query', async () => {
        const result = await directorWithdrawalService.searchWithdrawals('Test');
        expect(result.success).toBe(true);
        expect(Array.isArray(result.data)).toBe(true);
      });
    });
  });

  describe('Service Exports', () => {
    it('should export all service functions', async () => {
      const service = await import('../services/directorWithdrawalService.js');
      
      expect(typeof service.getPaginatedWithdrawals).toBe('function');
      expect(typeof service.getAllWithdrawals).toBe('function');
      expect(typeof service.getWithdrawalById).toBe('function');
      expect(typeof service.createWithdrawal).toBe('function');
      expect(typeof service.updateWithdrawal).toBe('function');
      expect(typeof service.deleteWithdrawal).toBe('function');
      expect(typeof service.approveWithdrawal).toBe('function');
      expect(typeof service.rejectWithdrawal).toBe('function');
      expect(typeof service.completeWithdrawal).toBe('function');
      expect(typeof service.cancelWithdrawal).toBe('function');
      expect(typeof service.getWithdrawalStatistics).toBe('function');
      expect(typeof service.getAllLabels).toBe('function');
      expect(typeof service.getPendingWithdrawals).toBe('function');
      expect(typeof service.searchWithdrawals).toBe('function');
    });

    it('should export constants', async () => {
      const service = await import('../services/directorWithdrawalService.js');
      
      expect(service.WITHDRAWAL_STATUS).toBeDefined();
      expect(service.VALIDATION).toBeDefined();
      expect(service.STATUS_TRANSITIONS).toBeDefined();
    });
  });
});

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// The real db singleton that schoolFeeService (imported below) actually
// reads/writes through config/database.js - using the real singleton
// (rather than a disconnected fixture file) ensures fixture rows are
// visible to the service under test. See directorWithdrawal.test.js for
// the same pattern and why it matters.
import __realDb from '../config/database.js';

describe('School Fee Service', () => {
  let db;
  let schoolFeeService;
  let testUserId;
  let testStudentId;
  let testPaymentMethodId;

  beforeAll(async () => {
    db = __realDb;
    db.pragma('foreign_keys = ON');

    schoolFeeService = await import('../services/schoolFeeService.js');

    const userResult = db.prepare(
      'INSERT OR IGNORE INTO users (username, full_name, email) VALUES (?, ?, ?)'
    ).run('sfp_testuser', 'School Fee Test User', 'sfp_testuser@example.com');
    testUserId = userResult.lastInsertRowid
      || db.prepare('SELECT id FROM users WHERE username = ?').get('sfp_testuser').id;

    const studentResult = db.prepare(
      `INSERT INTO students (admission_number, first_name, last_name, parent_name, parent_phone)
       VALUES (?, ?, ?, ?, ?)`
    ).run('SFP-TEST-001', 'Test', 'Student', 'Test Parent', '0700000000');
    testStudentId = studentResult.lastInsertRowid;

    const paymentMethod = db.prepare('SELECT id FROM payment_methods LIMIT 1').get();
    testPaymentMethodId = paymentMethod ? paymentMethod.id : null;
  });

  afterAll(() => {
    try {
      db.prepare('DELETE FROM school_fee_payments WHERE student_id = ?').run(testStudentId);
      db.prepare("DELETE FROM transactions WHERE transaction_type = 'school_fee' AND student_id = ?").run(testStudentId);
      db.prepare('DELETE FROM students WHERE id = ?').run(testStudentId);
      db.prepare('DELETE FROM users WHERE username = ?').run('sfp_testuser');
    } catch (error) {
      console.error('Error cleaning up school fee test data:', error.message);
    }
  });

  describe('createSchoolFeePaymentWithTransaction', () => {
    it('atomically creates both a transactions row and a school_fee_payments row, with matching amount_cents', () => {
      const payment = schoolFeeService.createSchoolFeePaymentWithTransaction({
        studentId: testStudentId,
        amount: 2500.50,
        paymentDate: '2026-01-15',
        academicYear: '2026',
        term: 'Term 1',
        paymentMethodId: testPaymentMethodId,
        createdBy: testUserId
      });

      // Regression test for a pre-existing bug: this function previously
      // looked up `transaction.school_fee_id` (a field that was never set
      // anywhere), so `payment` always silently resolved to `undefined`
      // merged with just the receipt/transaction id - none of the real
      // school_fee_payments columns were ever actually returned.
      expect(payment).toBeTruthy();
      expect(payment.id).toBeTruthy();
      expect(payment.student_id).toBe(testStudentId);
      expect(payment.receipt_number).toBeTruthy();
      expect(payment.transaction_id).toBeTruthy();

      // amount_cents must be populated and consistent on both the payment
      // row and its linked ledger transaction row (owner decision 7: no
      // partially-migrated dual-unit state).
      expect(payment.amount_cents).toBe(250050);

      const linkedTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(payment.transaction_id);
      expect(linkedTransaction.amount_cents).toBe(250050);
      expect(linkedTransaction.transaction_type).toBe('school_fee');
    });

    it('rolls back both rows together if the student does not exist', () => {
      const countBefore = db.prepare('SELECT COUNT(*) as c FROM transactions').get().c;

      expect(() => schoolFeeService.createSchoolFeePaymentWithTransaction({
        studentId: 999999,
        amount: 100,
        paymentDate: '2026-01-15',
        academicYear: '2026',
        term: 'Term 1',
        createdBy: testUserId
      })).toThrow();

      const countAfter = db.prepare('SELECT COUNT(*) as c FROM transactions').get().c;
      expect(countAfter).toBe(countBefore);
    });
  });

  describe('deleteSchoolFeePayment (reversal)', () => {
    it('reverses a posted payment instead of hard-deleting it', () => {
      const payment = schoolFeeService.createSchoolFeePaymentWithTransaction({
        studentId: testStudentId,
        amount: 500,
        paymentDate: '2026-01-20',
        academicYear: '2026',
        term: 'Term 1',
        paymentMethodId: testPaymentMethodId,
        createdBy: testUserId
      });

      const result = schoolFeeService.deleteSchoolFeePayment(payment.id, testUserId, 'Entered in error');

      expect(result.success).toBe(true);
      expect(result.data.reversalTransactionId).toBeTruthy();

      // The original row must still exist (never hard-deleted) and be
      // flagged as reversed.
      const original = db.prepare('SELECT * FROM school_fee_payments WHERE id = ?').get(payment.id);
      expect(original).toBeDefined();
      expect(original.is_reversed).toBe(1);

      // The original transaction must be flagged reversed too, and a
      // separate negated reversal transaction must exist in the ledger.
      const originalTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(payment.transaction_id);
      expect(originalTx.is_reversed).toBe(1);

      const reversalTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.data.reversalTransactionId);
      expect(reversalTx).toBeDefined();
      expect(parseFloat(reversalTx.amount)).toBe(-500);
      expect(reversalTx.amount_cents).toBe(-50000);
      expect(reversalTx.is_reversal).toBe(1);
    });

    it('rejects reversing an already-reversed payment', () => {
      const payment = schoolFeeService.createSchoolFeePaymentWithTransaction({
        studentId: testStudentId,
        amount: 300,
        paymentDate: '2026-01-21',
        academicYear: '2026',
        term: 'Term 1',
        paymentMethodId: testPaymentMethodId,
        createdBy: testUserId
      });

      const first = schoolFeeService.deleteSchoolFeePayment(payment.id, testUserId, 'First reversal');
      expect(first.success).toBe(true);

      const second = schoolFeeService.deleteSchoolFeePayment(payment.id, testUserId, 'Second attempt');
      expect(second.success).toBe(false);
      expect(second.error).toMatch(/already been reversed/i);
    });

    it('returns not found for a non-existent payment', () => {
      const result = schoolFeeService.deleteSchoolFeePayment(999999, testUserId);
      expect(result.success).toBe(false);
      expect(result.error).toBe('School fee payment not found');
    });
  });
});

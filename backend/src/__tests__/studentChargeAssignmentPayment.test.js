import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Use the real db singleton (see directorWithdrawal.test.js / schoolFee.test.js
// for why: a disconnected `new Database(file)` fixture is invisible to the
// models under test, which always import the real config/database.js
// singleton).
import __realDb from '../config/database.js';

describe('Student Charge Assignment payment lifecycle', () => {
  let db;
  let assignmentService;
  let chargeService;
  let testUserId;
  let testStudentId;
  let testChargeId;

  beforeAll(async () => {
    db = __realDb;
    db.pragma('foreign_keys = ON');

    assignmentService = await import('../services/studentChargeAssignmentService.js');
    chargeService = await import('../services/studentChargeService.js');

    const userResult = db.prepare(
      'INSERT OR IGNORE INTO users (username, full_name, email) VALUES (?, ?, ?)'
    ).run('sca_testuser', 'Charge Assignment Test User', 'sca_testuser@example.com');
    testUserId = userResult.lastInsertRowid
      || db.prepare('SELECT id FROM users WHERE username = ?').get('sca_testuser').id;

    const studentResult = db.prepare(
      `INSERT INTO students (admission_number, first_name, last_name, parent_name, parent_phone)
       VALUES (?, ?, ?, ?, ?)`
    ).run('SCA-TEST-001', 'Charge', 'Student', 'Test Parent', '0700000001');
    testStudentId = studentResult.lastInsertRowid;

    const charge = chargeService.createStudentCharge({
      name: 'Exam Fee (test)',
      amount: 1200,
      chargeType: 'individual'
    }, testUserId);
    testChargeId = charge.id;
  });

  afterAll(() => {
    try {
      db.prepare('DELETE FROM student_charge_assignments WHERE charge_id = ?').run(testChargeId);
      db.prepare('DELETE FROM student_charges WHERE id = ?').run(testChargeId);
      db.prepare("DELETE FROM transactions WHERE transaction_type = 'student_charge' AND student_id = ?").run(testStudentId);
      db.prepare('DELETE FROM students WHERE id = ?').run(testStudentId);
      db.prepare('DELETE FROM users WHERE username = ?').run('sca_testuser');
    } catch (error) {
      console.error('Error cleaning up student charge assignment test data:', error.message);
    }
  });

  it('creates a charge and assignment with matching amount_cents', () => {
    const charge = db.prepare('SELECT * FROM student_charges WHERE id = ?').get(testChargeId);
    expect(charge.amount_cents).toBe(120000);

    const assignment = assignmentService.createStudentChargeAssignment({
      chargeId: testChargeId,
      studentId: testStudentId
    }, testUserId);

    expect(assignment.amount_cents).toBe(120000);
  });

  it('marks an assignment as paid atomically, posting a real ledger transaction', async () => {
    const assignment = db.prepare(
      'SELECT * FROM student_charge_assignments WHERE charge_id = ? AND student_id = ?'
    ).get(testChargeId, testStudentId);

    const result = await assignmentService.markAssignmentAsPaid(
      assignment.id,
      { amount: 1200 },
      testUserId
    );

    expect(result.assignment.paid).toBe(1);
    expect(result.transaction.id).toBeTruthy();

    const postedTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.transaction.id);
    expect(postedTransaction).toBeDefined();
    expect(postedTransaction.transaction_type).toBe('student_charge');
    expect(postedTransaction.amount_cents).toBe(120000);

    // Regression: the "cannot delete a paid assignment" guard previously
    // never actually worked because the `paid` column it checks did not
    // exist anywhere in schema.sql/migrations - updateStudentChargeAssignment
    // writing `paid = ?` would have thrown, and any SELECT * row would never
    // have had a `paid` field at all, so `if (assignment.paid)` was always
    // false. Confirm the guard genuinely rejects deleting a paid assignment.
    expect(() => assignmentService.deleteStudentChargeAssignment(assignment.id, testUserId))
      .toThrow(/cannot delete a paid assignment/i);
  });

  it('reverses a paid assignment atomically instead of silently un-posting it', () => {
    const assignment = db.prepare(
      'SELECT * FROM student_charge_assignments WHERE charge_id = ? AND student_id = ?'
    ).get(testChargeId, testStudentId);
    expect(assignment.paid).toBe(1);

    const originalTransactionId = assignment.payment_transaction_id;
    expect(originalTransactionId).toBeTruthy();

    const result = assignmentService.markAssignmentAsUnpaid(assignment.id, testUserId, 'Paid in error');

    expect(result.assignment.paid).toBe(0);
    expect(result.reversalTransactionId).toBeTruthy();

    // The original payment transaction must still exist (never deleted)
    // and now be flagged reversed, linked to the new reversal transaction.
    const originalTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(originalTransactionId);
    expect(originalTransaction).toBeDefined();
    expect(originalTransaction.is_reversed).toBe(1);

    const reversalTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.reversalTransactionId);
    expect(reversalTransaction).toBeDefined();
    expect(parseFloat(reversalTransaction.amount)).toBe(-1200);
    expect(reversalTransaction.amount_cents).toBe(-120000);
    expect(reversalTransaction.is_reversal).toBe(1);

    // The assignment itself is now unpaid again and can be deleted (it is
    // no longer a posted/paid record).
    expect(() => assignmentService.deleteStudentChargeAssignment(assignment.id, testUserId)).not.toThrow();
  });

  it('rejects reversing an assignment that is not currently paid', () => {
    const freshAssignment = assignmentService.createStudentChargeAssignment({
      chargeId: testChargeId,
      studentId: testStudentId,
      amount: 500
    }, testUserId);

    expect(() => assignmentService.markAssignmentAsUnpaid(freshAssignment.id, testUserId))
      .toThrow(/is not paid/i);
  });
});

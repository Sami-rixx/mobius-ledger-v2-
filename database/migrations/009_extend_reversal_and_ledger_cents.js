import { addColumnIfMissing, tableExists } from '../migrationRunner.js';

/**
 * Two related financial-integrity fixes:
 *
 * 1. Extends the posted-record reversal columns (added in migration 005 for
 *    income/expenses/director_withdrawals/transactions) to the two other
 *    tables that hold posted, ledger-linked financial records but were
 *    missed by that migration: `school_fee_payments` (a school fee payment
 *    is a posted financial record the moment it is created - it always has
 *    a linked `transactions` row) and `student_charge_assignments` (once an
 *    assignment is marked paid, it too has a linked, posted `transactions`
 *    row). Without these columns, the only way to "undo" either of those
 *    records was a hard DELETE / blind unpaid-flag flip that silently left
 *    the original ledger transaction in place - see
 *    schoolFeeService.deleteSchoolFeePayment and
 *    studentChargeAssignmentService.markAssignmentAsUnpaid before this
 *    change.
 *
 *    This also adds `paid` / `paid_at` / `payment_transaction_id` to
 *    `student_charge_assignments` itself. These columns were referenced
 *    throughout models/StudentChargeAssignment.js and
 *    services/studentChargeAssignmentService.js (markAssignmentAsPaid,
 *    markAssignmentAsUnpaid, the "cannot delete a paid assignment" guard)
 *    but were never actually defined anywhere in schema.sql or any prior
 *    migration - so every one of those code paths was dead/broken (an
 *    `UPDATE ... SET paid = ?` against a column that does not exist throws
 *    a SQLite error, and the delete guard's `if (assignment.paid)` check
 *    was always false since the column - and therefore the field - never
 *    existed on a selected row).
 *
 * 2. Rebuilds the daily_ledger insert/delete triggers so the `_cents`
 *    running totals are derived from the transaction's own
 *    `amount_cents` column (now reliably populated by every write path)
 *    instead of recomputing it as `amount * 100` on every single ledger
 *    update. Multiplying the floating-point decimal `amount` by 100 on
 *    every trigger invocation re-introduces exactly the kind of
 *    float-precision drift the amount_cents migration exists to eliminate
 *    (e.g. some decimal amounts do not round-trip exactly through
 *    IEEE-754 multiplication by 100). A COALESCE fallback to the
 *    `amount * 100` computation is kept for the rare historical/legacy
 *    row where amount_cents might still be NULL, so this is a strictly
 *    additive safety improvement, never a regression.
 */
export default {
  id: '009_extend_reversal_and_ledger_cents',
  description: 'Add reversal columns to school_fee_payments/student_charge_assignments; use amount_cents in ledger triggers',
  up(db) {
    const reversalTargets = ['school_fee_payments', 'student_charge_assignments'];
    for (const table of reversalTargets) {
      if (!tableExists(db, table)) continue;
      addColumnIfMissing(db, table, 'is_reversed', 'INTEGER NOT NULL DEFAULT 0');
      addColumnIfMissing(db, table, 'reversed_by', 'INTEGER');
      addColumnIfMissing(db, table, 'reversed_at', 'DATETIME');
      addColumnIfMissing(db, table, 'reversal_reason', 'TEXT');
      addColumnIfMissing(db, table, 'reversal_transaction_id', 'INTEGER');
    }

    if (tableExists(db, 'student_charge_assignments')) {
      addColumnIfMissing(db, 'student_charge_assignments', 'paid', 'INTEGER NOT NULL DEFAULT 0');
      addColumnIfMissing(db, 'student_charge_assignments', 'paid_at', 'DATETIME');
      addColumnIfMissing(db, 'student_charge_assignments', 'payment_transaction_id', 'INTEGER');
    }

    if (!tableExists(db, 'transactions') || !tableExists(db, 'daily_ledger')) {
      return;
    }

    db.exec('DROP TRIGGER IF EXISTS trg_transaction_insert_after');
    db.exec('DROP TRIGGER IF EXISTS trg_transaction_delete_after');

    db.exec(`
      CREATE TRIGGER trg_transaction_insert_after
      AFTER INSERT ON transactions
      FOR EACH ROW
      BEGIN
        INSERT OR IGNORE INTO daily_ledger (date) VALUES (NEW.transaction_date);

        UPDATE daily_ledger
        SET
          total_income = total_income + CASE WHEN NEW.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN NEW.amount ELSE 0 END,
          total_income_cents = total_income_cents + CASE WHEN NEW.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN COALESCE(NEW.amount_cents, CAST(ROUND(NEW.amount * 100) AS INTEGER)) ELSE 0 END,
          total_expenses = total_expenses + CASE WHEN NEW.transaction_type IN ('expense', 'director_withdrawal') THEN NEW.amount ELSE 0 END,
          total_expenses_cents = total_expenses_cents + CASE WHEN NEW.transaction_type IN ('expense', 'director_withdrawal') THEN COALESCE(NEW.amount_cents, CAST(ROUND(NEW.amount * 100) AS INTEGER)) ELSE 0 END,
          net_movement = (total_income + CASE WHEN NEW.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN NEW.amount ELSE 0 END) -
                         (total_expenses + CASE WHEN NEW.transaction_type IN ('expense', 'director_withdrawal') THEN NEW.amount ELSE 0 END),
          net_movement_cents = (total_income_cents + CASE WHEN NEW.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN COALESCE(NEW.amount_cents, CAST(ROUND(NEW.amount * 100) AS INTEGER)) ELSE 0 END) -
                               (total_expenses_cents + CASE WHEN NEW.transaction_type IN ('expense', 'director_withdrawal') THEN COALESCE(NEW.amount_cents, CAST(ROUND(NEW.amount * 100) AS INTEGER)) ELSE 0 END),
          transaction_count = transaction_count + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE date = NEW.transaction_date;
      END;
    `);

    db.exec(`
      CREATE TRIGGER trg_transaction_delete_after
      AFTER DELETE ON transactions
      FOR EACH ROW
      BEGIN
        UPDATE daily_ledger
        SET
          total_income = total_income - CASE WHEN OLD.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN OLD.amount ELSE 0 END,
          total_income_cents = total_income_cents - CASE WHEN OLD.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN COALESCE(OLD.amount_cents, CAST(ROUND(OLD.amount * 100) AS INTEGER)) ELSE 0 END,
          total_expenses = total_expenses - CASE WHEN OLD.transaction_type IN ('expense', 'director_withdrawal') THEN OLD.amount ELSE 0 END,
          total_expenses_cents = total_expenses_cents - CASE WHEN OLD.transaction_type IN ('expense', 'director_withdrawal') THEN COALESCE(OLD.amount_cents, CAST(ROUND(OLD.amount * 100) AS INTEGER)) ELSE 0 END,
          net_movement = (total_income - CASE WHEN OLD.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN OLD.amount ELSE 0 END) -
                         (total_expenses - CASE WHEN OLD.transaction_type IN ('expense', 'director_withdrawal') THEN OLD.amount ELSE 0 END),
          net_movement_cents = (total_income_cents - CASE WHEN OLD.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN COALESCE(OLD.amount_cents, CAST(ROUND(OLD.amount * 100) AS INTEGER)) ELSE 0 END) -
                               (total_expenses_cents - CASE WHEN OLD.transaction_type IN ('expense', 'director_withdrawal') THEN COALESCE(OLD.amount_cents, CAST(ROUND(OLD.amount * 100) AS INTEGER)) ELSE 0 END),
          transaction_count = transaction_count - 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE date = OLD.transaction_date;
      END;
    `);
  }
};

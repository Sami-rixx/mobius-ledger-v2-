import { tableExists, columnExists } from '../migrationRunner.js';

/**
 * Completes the amount_cents migration for historical rows.
 *
 * `amount_cents` existed in schema.sql from early on but was never
 * consistently written by the application's create/update code paths (a
 * half-migrated dual-unit model - see the security architecture
 * specification, section 2 "Money cents"). Application code has been
 * updated (Transaction/Income/Expense/DirectorWithdrawal/SchoolFee/
 * StudentCharge models + services) to always compute and persist
 * `amount_cents = round(amount * 100)` going forward. This migration
 * backfills every historical row where `amount_cents` is NULL or does not
 * match the decimal `amount`, so the whole table is consistent rather than
 * leaving old rows permanently un-migrated.
 */
export default {
  id: '006_amount_cents_backfill',
  description: 'Backfill amount_cents for historical financial rows',
  up(db) {
    const tablesWithAmountCents = [
      'income',
      'expenses',
      'student_charges',
      'student_charge_assignments',
      'transactions',
      'school_fee_payments',
      'lunch_payments',
      'director_withdrawals'
    ];

    for (const table of tablesWithAmountCents) {
      if (!tableExists(db, table) || !columnExists(db, table, 'amount_cents') || !columnExists(db, table, 'amount')) {
        continue;
      }
      db.exec(`
        UPDATE ${table}
        SET amount_cents = CAST(ROUND(amount * 100) AS INTEGER)
        WHERE amount_cents IS NULL OR amount_cents != CAST(ROUND(amount * 100) AS INTEGER)
      `);
    }

    // daily_ledger / daily_summaries already maintain *_cents columns via
    // triggers/service code with NOT NULL DEFAULT 0, but guard anyway in
    // case of pre-trigger historical rows.
    if (tableExists(db, 'daily_ledger')) {
      db.exec(`
        UPDATE daily_ledger SET
          opening_balance_cents = CAST(ROUND(COALESCE(opening_balance, 0) * 100) AS INTEGER),
          total_income_cents = CAST(ROUND(COALESCE(total_income, 0) * 100) AS INTEGER),
          total_expenses_cents = CAST(ROUND(COALESCE(total_expenses, 0) * 100) AS INTEGER),
          closing_balance_cents = CAST(ROUND(COALESCE(closing_balance, 0) * 100) AS INTEGER),
          net_movement_cents = CAST(ROUND(COALESCE(net_movement, 0) * 100) AS INTEGER)
        WHERE opening_balance_cents IS NULL OR total_income_cents IS NULL
           OR total_expenses_cents IS NULL OR closing_balance_cents IS NULL OR net_movement_cents IS NULL;
      `);
    }

    if (tableExists(db, 'daily_summaries')) {
      db.exec(`
        UPDATE daily_summaries SET
          total_income_cents = CAST(ROUND(COALESCE(total_income, 0) * 100) AS INTEGER),
          total_expenses_cents = CAST(ROUND(COALESCE(total_expenses, 0) * 100) AS INTEGER),
          net_flow_cents = CAST(ROUND(COALESCE(net_flow, 0) * 100) AS INTEGER)
        WHERE total_income_cents IS NULL OR total_expenses_cents IS NULL OR net_flow_cents IS NULL;
      `);
    }
  }
};

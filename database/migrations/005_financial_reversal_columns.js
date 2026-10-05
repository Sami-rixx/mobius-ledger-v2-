import { addColumnIfMissing, tableExists } from '../migrationRunner.js';

/**
 * Posted financial records are immutable (owner decision): corrections are
 * performed via a reversal/correction transaction rather than a hard
 * DELETE, which previously destroyed financial history outright (see
 * incomeService.deleteIncome / expenseService.deleteExpense before this
 * change). These columns let a posted income/expense/transaction/
 * withdrawal row be marked as reversed while the original row - and its
 * full audit trail - remains intact.
 */
export default {
  id: '005_financial_reversal_columns',
  description: 'Add reversal/correction tracking columns to financial tables',
  up(db) {
    const targets = ['income', 'expenses', 'director_withdrawals', 'transactions'];
    for (const table of targets) {
      if (!tableExists(db, table)) continue;
      addColumnIfMissing(db, table, 'is_reversed', 'INTEGER NOT NULL DEFAULT 0');
      addColumnIfMissing(db, table, 'reversed_by', 'INTEGER');
      addColumnIfMissing(db, table, 'reversed_at', 'DATETIME');
      addColumnIfMissing(db, table, 'reversal_reason', 'TEXT');
      addColumnIfMissing(db, table, 'reversal_transaction_id', 'INTEGER');
    }

    if (tableExists(db, 'transactions')) {
      addColumnIfMissing(db, 'transactions', 'is_reversal', 'INTEGER NOT NULL DEFAULT 0');
      addColumnIfMissing(db, 'transactions', 'reverses_transaction_id', 'INTEGER');
    }
  }
};

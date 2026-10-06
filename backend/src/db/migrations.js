/**
 * Numbered schema migrations + runner (specification §12).
 *
 * CREATE TABLE IF NOT EXISTS in database/schema.sql only covers brand-new
 * databases. These migrations evolve EXISTING databases safely and are
 * tracked in a schema_migrations table so each runs exactly once per
 * database file. Every migration is written to be safe against both a fresh
 * database (schema.sql just applied) and a production database that
 * predates the security hardening.
 */

/** Expanded audit action taxonomy (specification §7). */
export const AUDIT_ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'REVERSAL',
  'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'PASSWORD_CHANGE',
  'ROLE_ASSIGNED', 'ROLE_REVOKED', 'PERMISSION_CHANGED',
  'WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED', 'WITHDRAWAL_COMPLETED', 'WITHDRAWAL_CANCELLED',
  'EXPORT', 'IMPORT', 'RESTORE', 'BACKUP',
  'AUTHZ_DENIED', 'SESSION_REVOKED'
];

const auditActionList = AUDIT_ACTIONS.map((a) => `'${a}'`).join(', ');

function columnExists(db, table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column);
}

function tableExists(db, table) {
  return !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(table);
}

/**
 * Canonical daily-ledger trigger definitions. Integer cents are computed
 * with CAST(ROUND(...) AS INTEGER) so floating point drift can never leak
 * into the canonical cents columns.
 */
export const LEDGER_TRIGGERS_SQL = `
CREATE TRIGGER IF NOT EXISTS trg_transaction_insert_after
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

CREATE TRIGGER IF NOT EXISTS trg_transaction_delete_after
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
`;

export const MIGRATIONS = [
  {
    id: '001_user_sessions_hardening',
    up(db) {
      // Session tokens must only ever be stored as SHA-256 hashes. Legacy
      // rows contain plaintext tokens, so every pre-existing session is
      // revoked; users simply log in again.
      if (!columnExists(db, 'user_sessions', 'token_hash')) {
        db.exec('ALTER TABLE user_sessions ADD COLUMN token_hash TEXT');
      }
      if (!columnExists(db, 'user_sessions', 'last_activity_at')) {
        db.exec('ALTER TABLE user_sessions ADD COLUMN last_activity_at DATETIME');
      }
      if (!columnExists(db, 'user_sessions', 'absolute_expires_at')) {
        db.exec('ALTER TABLE user_sessions ADD COLUMN absolute_expires_at DATETIME');
      }
      db.exec('UPDATE user_sessions SET is_active = 0');
      db.exec('CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash)');
    }
  },
  {
    id: '002_audit_trail_hardening',
    up(db) {
      // Rebuild audit_trail so the CHECK constraint accepts the expanded
      // security taxonomy, record_id becomes nullable (login failures have
      // no record) and append-only triggers protect it at the database
      // level (specification §7 / owner decision D13 baseline).
      db.exec(`
        CREATE TABLE IF NOT EXISTS audit_trail_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          action TEXT NOT NULL CHECK(action IN (${auditActionList})),
          table_name TEXT NOT NULL,
          record_id INTEGER,
          old_values TEXT,
          new_values TEXT,
          user_id INTEGER,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO audit_trail_new (id, action, table_name, record_id, old_values, new_values, user_id, ip_address, user_agent, created_at)
          SELECT id, action, table_name, record_id, old_values, new_values, user_id, ip_address, user_agent, created_at FROM audit_trail;
        DROP TABLE audit_trail;
        ALTER TABLE audit_trail_new RENAME TO audit_trail;
        CREATE INDEX IF NOT EXISTS idx_audit_trail_table ON audit_trail(table_name);
        CREATE INDEX IF NOT EXISTS idx_audit_trail_record ON audit_trail(record_id);
        CREATE INDEX IF NOT EXISTS idx_audit_trail_user ON audit_trail(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_trail_date ON audit_trail(created_at);
      `);
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS trg_audit_trail_no_update
        BEFORE UPDATE ON audit_trail
        BEGIN
          SELECT RAISE(ABORT, 'audit_trail is append-only');
        END;
        CREATE TRIGGER IF NOT EXISTS trg_audit_trail_no_delete
        BEFORE DELETE ON audit_trail
        BEGIN
          SELECT RAISE(ABORT, 'audit_trail is append-only');
        END;
      `);
    }
  },
  {
    id: '003_amount_cents_backfill',
    up(db) {
      // OWNER DECISION D8: finish the cents migration. Backfill/repair every
      // amount_cents column and replace the daily-ledger triggers with
      // integer-safe versions.
      const moneyTables = [
        'income', 'expenses', 'transactions', 'student_charges',
        'student_charge_assignments', 'school_fee_payments',
        'lunch_payments', 'director_withdrawals'
      ];
      for (const table of moneyTables) {
        if (!tableExists(db, table) || !columnExists(db, table, 'amount_cents')) continue;
        db.exec(`
          UPDATE ${table}
          SET amount_cents = CAST(ROUND(amount * 100) AS INTEGER)
          WHERE amount IS NOT NULL
            AND (amount_cents IS NULL OR amount_cents != CAST(ROUND(amount * 100) AS INTEGER))
        `);
      }
      // Repair derived ledger/summary cents columns from their decimal columns
      db.exec(`
        UPDATE daily_ledger SET
          opening_balance_cents = CAST(ROUND(opening_balance * 100) AS INTEGER),
          total_income_cents = CAST(ROUND(total_income * 100) AS INTEGER),
          total_expenses_cents = CAST(ROUND(total_expenses * 100) AS INTEGER),
          closing_balance_cents = CAST(ROUND(closing_balance * 100) AS INTEGER),
          net_movement_cents = CAST(ROUND(net_movement * 100) AS INTEGER);
        UPDATE daily_summaries SET
          total_income_cents = CAST(ROUND(total_income * 100) AS INTEGER),
          total_expenses_cents = CAST(ROUND(total_expenses * 100) AS INTEGER),
          net_flow_cents = CAST(ROUND(net_flow * 100) AS INTEGER);
      `);
      db.exec(`
        DROP TRIGGER IF EXISTS trg_transaction_insert_after;
        DROP TRIGGER IF EXISTS trg_transaction_delete_after;
      `);
      db.exec(LEDGER_TRIGGERS_SQL);
    }
  },
  {
    id: '004_idempotency_keys',
    up(db) {
      // OWNER DECISION D9: mandatory Idempotency-Key for money-moving POSTs.
      db.exec(`
        CREATE TABLE IF NOT EXISTS idempotency_keys (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          method TEXT NOT NULL,
          path TEXT NOT NULL,
          request_hash TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
          response_status INTEGER,
          response_body TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          UNIQUE(user_id, method, path, key)
        );
        CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at);
      `);
    }
  },
  {
    id: '005_posted_record_reversals',
    up(db) {
      // OWNER DECISION (posted records): corrections happen through
      // reversal/correction records that preserve the original row.
      for (const table of ['income', 'expenses', 'transactions']) {
        if (!columnExists(db, table, 'reversal_of_id')) {
          db.exec(`ALTER TABLE ${table} ADD COLUMN reversal_of_id INTEGER REFERENCES ${table}(id)`);
        }
        if (!columnExists(db, table, 'reversed_by_id')) {
          db.exec(`ALTER TABLE ${table} ADD COLUMN reversed_by_id INTEGER REFERENCES ${table}(id)`);
        }
      }
    }
  },
  {
    id: '006_school_fee_payment_reversals',
    up(db) {
      // School fee payment corrections also happen via reversal records.
      if (!columnExists(db, 'school_fee_payments', 'reversal_of_id')) {
        db.exec('ALTER TABLE school_fee_payments ADD COLUMN reversal_of_id INTEGER REFERENCES school_fee_payments(id)');
      }
      if (!columnExists(db, 'school_fee_payments', 'reversed_by_id')) {
        db.exec('ALTER TABLE school_fee_payments ADD COLUMN reversed_by_id INTEGER REFERENCES school_fee_payments(id)');
      }
    }
  }
];

/**
 * Run all pending migrations against the given better-sqlite3 database.
 * Each migration executes inside a single transaction and is recorded in
 * schema_migrations.
 */
export function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const isApplied = db.prepare('SELECT 1 FROM schema_migrations WHERE id = ?');
  const record = db.prepare('INSERT INTO schema_migrations (id) VALUES (?)');
  const applied = [];

  for (const migration of MIGRATIONS) {
    if (isApplied.get(migration.id)) continue;
    const run = db.transaction(() => {
      migration.up(db);
      record.run(migration.id);
    });
    run();
    applied.push(migration.id);
  }

  return applied;
}

export default { MIGRATIONS, runMigrations, AUDIT_ACTIONS, LEDGER_TRIGGERS_SQL };

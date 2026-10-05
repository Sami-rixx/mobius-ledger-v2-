/**
 * Expands the audit_trail.action taxonomy beyond the original
 * CREATE/UPDATE/DELETE CHECK constraint to cover the full set required by
 * the security architecture specification (LOGIN_SUCCESS, LOGIN_FAILURE,
 * LOGOUT, PASSWORD_CHANGE, ROLE_ASSIGNED, ROLE_REVOKED,
 * PERMISSION_CHANGED, CREATE, UPDATE, REVERSAL, WITHDRAWAL_APPROVED,
 * WITHDRAWAL_REJECTED, EXPORT, IMPORT, RESTORE, AUTHZ_DENIED,
 * SESSION_REVOKED).
 *
 * SQLite cannot ALTER a CHECK constraint in place, so this rebuilds the
 * table (the standard SQLite "12 steps to change a table schema" pattern),
 * preserving every existing row, then re-applies the UPDATE/DELETE
 * immutability triggers and indexes from migration 003.
 */
export default {
  id: '008_audit_taxonomy_expand',
  description: 'Expand audit_trail action taxonomy and rebuild immutability triggers',
  up(db) {
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_trail'").get();
    if (!exists) return;

    db.exec('DROP TRIGGER IF EXISTS trg_audit_trail_block_update');
    db.exec('DROP TRIGGER IF EXISTS trg_audit_trail_block_delete');

    db.exec(`
      CREATE TABLE audit_trail_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL CHECK(action IN (
          'CREATE', 'UPDATE', 'DELETE', 'REVERSAL',
          'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'PASSWORD_CHANGE',
          'ROLE_ASSIGNED', 'ROLE_REVOKED', 'PERMISSION_CHANGED',
          'WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED',
          'EXPORT', 'IMPORT', 'RESTORE', 'AUTHZ_DENIED', 'SESSION_REVOKED'
        )),
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        old_values TEXT,
        new_values TEXT,
        user_id INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.exec(`
      INSERT INTO audit_trail_new (id, action, table_name, record_id, old_values, new_values, user_id, ip_address, user_agent, created_at)
      SELECT id, action, table_name, record_id, old_values, new_values, user_id, ip_address, user_agent, created_at FROM audit_trail;
    `);

    db.exec('DROP TABLE audit_trail');
    db.exec('ALTER TABLE audit_trail_new RENAME TO audit_trail');

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_trail_table ON audit_trail(table_name);
      CREATE INDEX IF NOT EXISTS idx_audit_trail_record ON audit_trail(record_id);
      CREATE INDEX IF NOT EXISTS idx_audit_trail_user ON audit_trail(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_trail_date ON audit_trail(created_at);
    `);

    db.exec(`
      CREATE TRIGGER trg_audit_trail_block_update
      BEFORE UPDATE ON audit_trail
      BEGIN
        SELECT RAISE(ABORT, 'audit_trail records are immutable and cannot be updated');
      END;
    `);

    db.exec(`
      CREATE TRIGGER trg_audit_trail_block_delete
      BEFORE DELETE ON audit_trail
      BEGIN
        SELECT RAISE(ABORT, 'audit_trail records are immutable and cannot be deleted');
      END;
    `);
  }
};

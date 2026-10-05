/**
 * Server-controlled backup registry. Restore operations must never accept
 * an arbitrary client-supplied filesystem path (that was the previous
 * behavior - see importExportController.importDatabase before this
 * change). Instead, backups are created by the server, recorded here with
 * an opaque numeric id and a checksum, and restore only ever accepts that
 * id - never a path.
 */
export default {
  id: '007_backup_registry',
  description: 'Create backups registry table for server-controlled restore',
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        checksum_sha256 TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        restored_at DATETIME,
        restored_by INTEGER,
        is_pre_restore_snapshot INTEGER NOT NULL DEFAULT 0,
        notes TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at);
    `);
  }
};

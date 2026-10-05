import { addColumnIfMissing, tableExists } from '../migrationRunner.js';

/**
 * Adds the columns required for real server-side authentication/session
 * management on top of the pre-existing `users` / `user_sessions` tables
 * (which previously existed only "for future authentication" and were
 * never wired up). Uses ALTER TABLE ... ADD COLUMN guarded by
 * `columnExists` because SQLite has no ADD COLUMN IF NOT EXISTS and this
 * must run safely against an existing, already-populated production
 * database as well as a brand new one.
 */
export default {
  id: '001_security_columns',
  description: 'Add auth/session security columns to users and user_sessions',
  up(db) {
    if (tableExists(db, 'users')) {
      addColumnIfMissing(db, 'users', 'must_change_password', "INTEGER NOT NULL DEFAULT 0");
      addColumnIfMissing(db, 'users', 'failed_login_attempts', "INTEGER NOT NULL DEFAULT 0");
      addColumnIfMissing(db, 'users', 'locked_until', 'DATETIME');
      addColumnIfMissing(db, 'users', 'last_login_at', 'DATETIME');
    }

    if (tableExists(db, 'user_sessions')) {
      // session_token now stores a SHA-256 hash of the raw token (the raw
      // token is only ever sent to the client once, in a secure cookie).
      // Existing rows (if any) were written under the old "store the raw
      // token" model - they can never match a freshly-hashed lookup again,
      // so we proactively deactivate them here. This forces a one-time
      // re-login after upgrade instead of leaving ambiguous/unusable rows
      // around, and avoids any chance of a stale raw token being treated
      // as a valid hash.
      addColumnIfMissing(db, 'user_sessions', 'last_activity_at', 'DATETIME');
      addColumnIfMissing(db, 'user_sessions', 'absolute_expires_at', 'DATETIME');
      addColumnIfMissing(db, 'user_sessions', 'revoked_at', 'DATETIME');
      addColumnIfMissing(db, 'user_sessions', 'revoked_reason', 'TEXT');
      addColumnIfMissing(db, 'user_sessions', 'csrf_token', 'TEXT');
      addColumnIfMissing(db, 'user_sessions', 'token_issued_at', 'DATETIME');

      db.exec(`UPDATE user_sessions SET is_active = 0, revoked_reason = 'security-migration-upgrade' WHERE is_active = 1`);
    }
  }
};

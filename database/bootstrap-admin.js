#!/usr/bin/env node
/**
 * Controlled first-run bootstrap: sets a real Argon2id password hash for
 * the seeded system administrator account (or any account you name),
 * closing the "seeded/system administrative identity must not remain a
 * usable NULL-password account" gap called out in the security
 * architecture specification.
 *
 * Usage:
 *   ADMIN_BOOTSTRAP_PASSWORD='a-strong-passphrase' node database/bootstrap-admin.js [username]
 *
 * Refuses to run if:
 *   - NODE_ENV=production and ADMIN_BOOTSTRAP_PASSWORD is not set via env
 *     (never accepts a password as a bare CLI argument, to avoid it
 *     leaking into shell history / process listings).
 *   - The target user already has a usable (non-null) password hash,
 *     unless --force is passed, to avoid accidentally clobbering a real
 *     admin password with a stray re-run.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import argon2 from 'argon2';
import { runMigrationsAsync } from './migrationRunner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const force = args.includes('--force');
const username = args.find((a) => !a.startsWith('--')) || 'system';

const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

if (!password) {
  console.error('ERROR: Set ADMIN_BOOTSTRAP_PASSWORD in the environment before running this script.');
  console.error('Example: ADMIN_BOOTSTRAP_PASSWORD="change-me-now" node database/bootstrap-admin.js');
  process.exit(1);
}

if (password.length < 12) {
  console.error('ERROR: ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters.');
  process.exit(1);
}

const DB_PATH = process.env.DATABASE_PATH || path.resolve(__dirname, 'mobius_ledger.db');

async function main() {
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
  await runMigrationsAsync(db, { quiet: true });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    console.error(`ERROR: No user found with username "${username}". Run database/setup.js first.`);
    process.exit(1);
  }

  if (user.password_hash && !force) {
    console.error(`ERROR: User "${username}" already has a password set. Re-run with --force to overwrite it.`);
    process.exit(1);
  }

  const hash = await argon2.hash(password, { type: argon2.argon2id });
  db.prepare(`
    UPDATE users
    SET password_hash = ?, must_change_password = 0, failed_login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(hash, user.id);

  console.log(`Password set for user "${username}". They can now log in via POST /api/auth/login.`);
  db.close();
}

main().catch((error) => {
  console.error('Bootstrap failed:', error.message);
  process.exit(1);
});

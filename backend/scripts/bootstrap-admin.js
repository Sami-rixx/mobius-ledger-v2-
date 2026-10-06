#!/usr/bin/env node
/**
 * Bootstrap Admin Account
 *
 * SECURITY (specification §5/§16): the system must never ship with usable
 * NULL-password or default-password accounts. This script is the only
 * supported way to create the first administrator:
 *
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD='...' npm run bootstrap:admin
 *
 * - hashes the password with Argon2id (passwordService)
 * - creates the user (or sets the password of an existing user that has
 *   no password yet), activates it, and assigns the Admin RBAC role
 * - refuses weak passwords and refuses to overwrite an existing
 *   password unless ADMIN_RESET=yes is set explicitly
 * - revokes all existing sessions for the account when resetting
 */
import db, { setupDatabase } from '../src/config/database.js';
import { hashPassword, passwordPolicyViolation } from '../src/services/passwordService.js';
import { recordAuditEvent, AUDIT } from '../src/services/auditService.js';

// Ensure schema/migrations/RBAC catalog exist (works on fresh and existing DBs).
setupDatabase();

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;
const fullName = process.env.ADMIN_FULL_NAME || 'System Administrator';
const email = process.env.ADMIN_EMAIL || null;
const allowReset = process.env.ADMIN_RESET === 'yes';

function fail(msg) {
  console.error(`bootstrap-admin: ${msg}`);
  process.exit(1);
}

if (!username || !/^[a-zA-Z0-9_.-]{3,64}$/.test(username)) {
  fail('ADMIN_USERNAME is required (3-64 chars, alphanumeric/_/./-).');
}
if (!password) {
  fail('ADMIN_PASSWORD is required.');
}
const policyViolation = passwordPolicyViolation(password);
if (policyViolation) {
  fail(`weak ADMIN_PASSWORD: ${policyViolation}`);
}

const adminRole = db.prepare("SELECT id FROM roles WHERE name = 'admin' AND is_active = 1").get();
if (!adminRole) {
  fail("RBAC catalog not seeded: no active 'admin' role found. Start the backend once (or run migrations) first.");
}

const passwordHash = await hashPassword(password);

const existing = db.prepare('SELECT id, password_hash, is_active FROM users WHERE username = ?').get(username);
if (existing && existing.password_hash && !allowReset) {
  fail(`user '${username}' already has a password. Set ADMIN_RESET=yes to rotate it (this revokes all their sessions).`);
}

const result = db.transaction(() => {
  let userId;
  if (existing) {
    db.prepare(`
      UPDATE users SET password_hash = ?, full_name = ?, email = COALESCE(?, email),
             is_active = 1, role = 'admin', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(passwordHash, fullName, email, existing.id);
    userId = existing.id;
    // Password rotation invalidates every existing session.
    db.prepare('UPDATE user_sessions SET is_active = 0 WHERE user_id = ?').run(userId);
  } else {
    const inserted = db.prepare(`
      INSERT INTO users (username, full_name, email, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, 'admin', 1)
    `).run(username, fullName, email, passwordHash);
    userId = inserted.lastInsertRowid;
  }

  db.prepare(`
    INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_by)
    VALUES (?, ?, ?)
  `).run(userId, adminRole.id, userId);

  recordAuditEvent({
    action: existing ? AUDIT.PASSWORD_CHANGE : AUDIT.CREATE,
    tableName: 'users',
    recordId: userId,
    newValues: { username, bootstrap: true },
    userId
  });

  return userId;
})();

console.log(`bootstrap-admin: admin account '${username}' (user id ${result}) is ready.`);
process.exit(0);

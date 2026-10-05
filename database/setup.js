import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { runMigrationsAsync } from './migrationRunner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const DB_PATH = path.resolve(__dirname, 'mobius_ledger.db');

// Schema file path
const SCHEMA_PATH = path.resolve(__dirname, 'schema.sql');

console.log('Setting up Mobius Ledger database...');
console.log(`Database path: ${DB_PATH}`);

try {
  // Read schema SQL
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  
  // Initialize database
  const db = new Database(DB_PATH);
  
  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Execute schema
  db.exec(schemaSql);
  
  console.log('Database schema applied successfully');
  
  // Insert initial system settings if not exists
  const currentYear = new Date().getFullYear();
  const insertSettings = db.prepare(`
    INSERT OR IGNORE INTO system_settings (key, value, description) VALUES 
    ('currency', 'KES', 'Default currency for the application'),
    ('receipt_prefix', 'ML', 'Prefix for receipt numbers'),
    ('receipt_sequence', '0', 'Current receipt sequence number'),
    ('receipt_year', ?, 'Current year for receipt numbers'),
    ('school_name', 'Mobius School', 'Name of the school'),
    ('school_address', '', 'Address of the school'),
    ('school_phone', '', 'Phone number of the school'),
    ('school_email', '', 'Email of the school')
  `);
  
  insertSettings.run(currentYear.toString());
  
  console.log('System settings initialized');
  
  // Apply numbered security/schema migrations (RBAC seed data, auth/session
  // columns, idempotency table, audit immutability triggers, etc.) on top
  // of the baseline schema just applied above. Must run before the admin
  // user insert below so that security columns (must_change_password)
  // already exist.
  await runMigrationsAsync(db);

  // Create a system admin user record for audit purposes. IMPORTANT:
  // password_hash is intentionally left NULL here. A NULL password hash
  // can never authenticate (see backend/src/services/authService.js -
  // login explicitly rejects NULL/empty hashes before any verification
  // step), so this seeded account is a placeholder identity only. Run
  // `node database/bootstrap-admin.js` once after setup to set a real
  // Argon2id password before the application is exposed to any user.
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, full_name, email, role, is_active, must_change_password)
    VALUES ('system', 'System Administrator', 'admin@mobius.school', 'admin', 1, 1)
  `);
  insertUser.run();

  // Make sure the system user also has the normalized Admin role (the RBAC
  // seed migration only backfills roles for users that existed *before* it
  // ran; this user is inserted after, so assign it explicitly here).
  const systemUser = db.prepare('SELECT id FROM users WHERE username = ?').get('system');
  const adminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin');
  if (systemUser && adminRole) {
    db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, datetime(\'now\'))')
      .run(systemUser.id, adminRole.id);
  }

  console.log('System user created (no usable password yet)');
  console.log('Run "node database/bootstrap-admin.js" to set its initial password before go-live.');

  // Get database info
  const tableCount = db.prepare('SELECT COUNT(*) as count FROM sqlite_master WHERE type = ?').get('table').count;
  const rowCount = db.prepare('SELECT SUM(row_count) as count FROM (SELECT COUNT(*) as row_count FROM system_settings UNION ALL SELECT COUNT(*) FROM users)').get().count;
  
  console.log(`Database setup complete: ${tableCount} tables, ${rowCount} initial rows`);
  
  db.close();
  
} catch (error) {
  console.error('Database setup error:', error.message);
  process.exit(1);
}

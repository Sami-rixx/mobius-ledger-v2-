import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations } from '../db/migrations.js';
import { seedRbac } from '../db/rbacSeed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isTestEnv = process.env.NODE_ENV === 'test';

// Database path resolution:
// - DATABASE_PATH env var always wins (used for prod overrides and for giving
//   each Jest worker its own isolated on-disk file when that is preferred).
// - In the "test" environment, default to an isolated in-memory database so
//   that every test file (each of which gets a fresh ES module registry under
//   Jest) starts from a clean, private database. This prevents the shared
//   on-disk database bleeding state between test files/workers.
// - Otherwise, default to the shared on-disk database used by the app.
const DB_PATH = process.env.DATABASE_PATH
  || (isTestEnv ? ':memory:' : path.resolve(__dirname, '../../../database/mobius_ledger.db'));

const SCHEMA_PATH = path.resolve(__dirname, '../../../database/schema.sql');

// Initialize SQLite database
const db = new Database(DB_PATH);

// Performance optimizations
// Enable WAL mode for better concurrent read/write performance.
// WAL is not supported for in-memory databases; better-sqlite3/SQLite simply
// falls back to the "memory" journal mode in that case, so this is safe to
// call unconditionally.
db.pragma('journal_mode = WAL');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Increase cache size for better query performance (default is 2MB)
db.pragma('cache_size = -10000'); // 10MB cache

// Enable synchronous NORMAL for better performance (default is FULL)
db.pragma('synchronous = NORMAL');

// Increase temp store limit
db.pragma('temp_store = MEMORY');

// Enable memory mapping for better performance
db.pragma('mmap_size = 30000000000'); // 30GB mmap size limit

let schemaApplied = false;

/**
 * Apply the full database schema (tables, indexes, triggers, views).
 * Every statement in database/schema.sql is written to be idempotent
 * (CREATE TABLE/INDEX/TRIGGER/VIEW IF NOT EXISTS, INSERT OR IGNORE), so it is
 * safe to run this against an existing populated database as well as a brand
 * new/in-memory one. This removes the previous hard requirement to run
 * `node database/setup.js` manually before the API or test suite could work.
 */
const applySchema = () => {
  if (schemaApplied) return;
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schemaSql);
  // Numbered migrations evolve both fresh and existing databases beyond the
  // idempotent baseline in schema.sql (tracked in schema_migrations).
  runMigrations(db);
  // Idempotent RBAC catalog seeding (roles/permissions/default grants).
  seedRbac(db);
  schemaApplied = true;
};

// Ensure system settings exist for receipt generation
export const setupDatabase = () => {
  try {
    // Ensure the schema (tables/indexes/triggers/views) exists before we try
    // to read/write any rows. This is what previously failed with
    // "no such table: system_settings" whenever the database file/schema had
    // not been bootstrapped by a separate manual step first.
    applySchema();

    // Ensure receipt_year exists (initialized by setup.js)
    const yearRow = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('receipt_year');
    if (!yearRow) {
      const currentYear = new Date().getFullYear();
      db.prepare('INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)')
        .run('receipt_year', currentYear.toString(), 'Current year for receipt numbers');
    }

    // Ensure receipt_sequence exists
    const seqRow = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('receipt_sequence');
    if (!seqRow) {
      db.prepare('INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)')
        .run('receipt_sequence', '0', 'Current receipt sequence number');
    }

    // Ensure receipt_prefix exists
    const prefixRow = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('receipt_prefix');
    if (!prefixRow) {
      db.prepare('INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)')
        .run('receipt_prefix', 'ML', 'Prefix for receipt numbers');
    }

    // Ensure currency exists
    const currencyRow = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('currency');
    if (!currencyRow) {
      db.prepare('INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)')
        .run('currency', 'KES', 'Default currency for the application');
    }

    if (!isTestEnv) {
      console.log('Database connection established and settings verified');
    }
  } catch (error) {
    console.error('Database setup error:', error.message);
    throw error;
  }
};

// Close database connection gracefully
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});

export default db;

/**
 * Numbered migration runner.
 *
 * `database/schema.sql` uses `CREATE TABLE IF NOT EXISTS` / `INSERT OR
 * IGNORE`, which is sufficient for creating brand-new objects but cannot
 * safely evolve a table that already exists in a production database
 * (SQLite has no `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`). This runner
 * adds a proper, ordered, idempotent migration mechanism on top of that
 * baseline schema:
 *
 *  - Each migration lives in database/migrations/NNN_description.js and
 *    exports `{ id, description, up(db) }`.
 *  - Applied migrations are recorded in `schema_migrations` so they never
 *    re-run.
 *  - Each migration runs inside its own transaction; if it throws, nothing
 *    it changed is persisted and the server fails to start (fail closed)
 *    rather than silently booting in a half-migrated state.
 *  - Migrations use `columnExists`/`tableExists` helpers below so they are
 *    safe to reason about even if re-applied to a database that already
 *    has some of the target columns (defense in depth on top of the
 *    schema_migrations bookkeeping).
 *
 * This file is plain CommonJS-compatible ESM with no external
 * dependencies, and only uses better-sqlite3's synchronous API - it must
 * never be made `async` around actual DB calls (better-sqlite3 is
 * synchronous; mixing in promises around it is a common source of race
 * conditions/half-applied state in this codebase).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export function tableExists(db, name) {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(name);
  return !!row;
}

export function columnExists(db, table, column) {
  if (!tableExists(db, table)) return false;
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some((r) => r.name === column);
}

export function addColumnIfMissing(db, table, column, definition) {
  if (!columnExists(db, table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      description TEXT,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function loadMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.js'))
    .sort();
}

/**
 * Run all pending migrations against the given better-sqlite3 database
 * instance. Safe to call on every process start (fresh DB, already
 * up-to-date DB, or a DB that needs only some of the newer migrations).
 * @param {import('better-sqlite3').Database} db
 * @param {{ quiet?: boolean }} [options]
 */
export function runMigrations(db, options = {}) {
  const { quiet = false } = options;
  ensureMigrationsTable(db);

  const applied = new Set(
    db.prepare('SELECT id FROM schema_migrations').all().map((r) => r.id)
  );

  const files = loadMigrationFiles();
  const results = [];

  for (const file of files) {
    const id = file.replace(/\.js$/, '');
    if (applied.has(id)) continue;

    // Dynamic import requires a file:// URL on some platforms.
    const modUrl = `file://${path.join(MIGRATIONS_DIR, file)}`;
    // Using a synchronous require-like pattern is not possible for ESM;
    // callers of runMigrations (config/database.js, database/setup.js)
    // must await runMigrationsAsync once at startup. See below.
    results.push({ id, file, modUrl });
  }

  return results; // caller resolves async import then applies synchronously
}

/**
 * Async wrapper that imports pending migration modules and applies each
 * one's synchronous `up(db)` inside its own transaction. better-sqlite3
 * itself stays fully synchronous - only the one-time dynamic `import()`
 * of migration files is async, which happens once at startup before the
 * HTTP server begins accepting requests.
 * @param {import('better-sqlite3').Database} db
 */
export async function runMigrationsAsync(db, options = {}) {
  const { quiet = false } = options;
  ensureMigrationsTable(db);

  const applied = new Set(
    db.prepare('SELECT id FROM schema_migrations').all().map((r) => r.id)
  );

  const files = loadMigrationFiles();
  const appliedNow = [];

  for (const file of files) {
    const id = file.replace(/\.js$/, '');
    if (applied.has(id)) continue;

    const modUrl = `file://${path.join(MIGRATIONS_DIR, file)}`;
    const mod = await import(modUrl);
    const migration = mod.default || mod;

    const txn = db.transaction(() => {
      migration.up(db);
      db.prepare('INSERT INTO schema_migrations (id, description) VALUES (?, ?)')
        .run(id, migration.description || '');
    });

    txn();
    appliedNow.push(id);
    if (!quiet) {
      // eslint-disable-next-line no-console
      console.log(`[migrations] applied ${id}${migration.description ? ` - ${migration.description}` : ''}`);
    }
  }

  return appliedNow;
}

export default { runMigrations, runMigrationsAsync, tableExists, columnExists, addColumnIfMissing };

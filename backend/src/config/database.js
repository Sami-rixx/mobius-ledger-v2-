import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path (relative to backend/src/config)
const DB_PATH = path.resolve(__dirname, '../../../database/mobius_ledger.db');

// Initialize SQLite database
const db = new Database(DB_PATH);

// Performance optimizations
// Enable WAL mode for better concurrent read/write performance
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

// Ensure system settings exist for receipt generation
export const setupDatabase = () => {
  try {
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

    console.log('Database connection established and settings verified');
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

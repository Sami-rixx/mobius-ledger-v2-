import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path (relative to backend/src/config)
const DB_PATH = path.resolve(__dirname, '../../../database/mobius_ledger.db');

// Initialize SQLite database
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Setup database tables
export const setupDatabase = () => {
  try {
    // System settings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default currency if not exists
    db.prepare(`
      INSERT OR IGNORE INTO system_settings (key, value, description) 
      VALUES ('currency', 'KES', 'Default currency for the application')
    `).run();

    // Insert default receipt prefix if not exists
    db.prepare(`
      INSERT OR IGNORE INTO system_settings (key, value, description) 
      VALUES ('receipt_prefix', 'ML', 'Prefix for receipt numbers')
    `).run();

    // Insert default receipt sequence if not exists
    db.prepare(`
      INSERT OR IGNORE INTO system_settings (key, value, description) 
      VALUES ('receipt_sequence', '0', 'Current receipt sequence number')
    `).run();

    console.log('Database setup completed successfully');
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

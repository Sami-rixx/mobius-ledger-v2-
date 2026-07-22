import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
  
  // Create a system user for audit purposes
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, full_name, email, role, is_active) 
    VALUES ('system', 'System Administrator', 'admin@mobius.school', 'admin', 1)
  `);
  insertUser.run();
  
  console.log('System user created');
  
  // Get database info
  const tableCount = db.prepare('SELECT COUNT(*) as count FROM sqlite_master WHERE type = ?').get('table').count;
  const rowCount = db.prepare('SELECT SUM(row_count) as count FROM (SELECT COUNT(*) as row_count FROM system_settings UNION ALL SELECT COUNT(*) FROM users)').get().count;
  
  console.log(`Database setup complete: ${tableCount} tables, ${rowCount} initial rows`);
  
  db.close();
  
} catch (error) {
  console.error('Database setup error:', error.message);
  process.exit(1);
}

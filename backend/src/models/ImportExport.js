/**
 * ImportExport Model
 * Database model for handling data import and export operations
 */

import db from '../config/database.js';
import fs from 'fs';
import path from 'path';

// Create __dirname equivalent for ESM
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ImportExport Model Constants
const IMPORT_EXPORT_TABLE = 'import_export_log';
export const BACKUP_DIR = path.join(__dirname, '../../backups');
export const EXPORT_DIR = path.join(__dirname, '../../exports');

// Ensure directories exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

// Import/Export status constants
export const IMPORT_EXPORT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Export types
export const EXPORT_TYPES = {
  DATABASE: 'database',
  CSV: 'csv',
  BACKUP: 'backup'
};

// Import types
export const IMPORT_TYPES = {
  DATABASE: 'database',
  CSV: 'csv',
  BACKUP: 'backup'
};

// Supported tables for CSV export/import
export const SUPPORTED_TABLES = [
  'students',
  'classes',
  'school_fees',
  'lunch_payments',
  'income',
  'income_categories',
  'expenses',
  'expense_categories',
  'director_withdrawals',
  'transactions',
  'student_charges',
  'daily_ledger'
];

// Main ImportExport Model
const ImportExport = {

  // Create log entry
  createLog(data) {
    const { type, action, tableName, fileName, recordCount, status, errorMessage, userId } = data;
    const query = `
      INSERT INTO ${IMPORT_EXPORT_TABLE} 
      (type, action, table_name, file_name, record_count, status, error_message, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    const params = [type, action, tableName, fileName, recordCount || 0, status, errorMessage, userId];
    const result = db.prepare(query).run(...params);
    return { id: result.lastInsertRowid, ...data };
  },

  // Get log by ID
  getLogById(id) {
    const query = `SELECT * FROM ${IMPORT_EXPORT_TABLE} WHERE id = ?`;
    return db.prepare(query).get(id);
  },

  // Get all logs
  getAllLogs(options = {}) {
    const { limit = 50, offset = 0, type, action, status, startDate, endDate } = options;
    let query = `SELECT * FROM ${IMPORT_EXPORT_TABLE} WHERE 1=1`;
    const params = [];
    if (type) { query += ' AND type = ?'; params.push(type); }
    if (action) { query += ' AND action = ?'; params.push(action); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (startDate) { query += ' AND created_at >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND created_at <= ?'; params.push(endDate); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    return db.prepare(query).all(...params);
  },

  // Update log status
  updateLogStatus(id, updates) {
    const { status, errorMessage, recordCount } = updates;
    const query = `UPDATE ${IMPORT_EXPORT_TABLE} SET status = ?, error_message = ?, record_count = ?, updated_at = datetime('now') WHERE id = ?`;
    db.prepare(query).run(status, errorMessage, recordCount, id);
    return { id, ...updates };
  },

  // Count logs
  countLogs(options = {}) {
    const { type, action, status, startDate, endDate } = options;
    let query = `SELECT COUNT(*) as count FROM ${IMPORT_EXPORT_TABLE} WHERE 1=1`;
    const params = [];
    if (type) { query += ' AND type = ?'; params.push(type); }
    if (action) { query += ' AND action = ?'; params.push(action); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (startDate) { query += ' AND created_at >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND created_at <= ?'; params.push(endDate); }
    const result = db.prepare(query).get(...params);
    return result.count;
  },

  // Get statistics
  getStatistics() {
    const results = db.prepare(`
      SELECT type, action, status, COUNT(*) as count, SUM(record_count) as total_records
      FROM ${IMPORT_EXPORT_TABLE} GROUP BY type, action, status
    `).all();
    const stats = { total_operations: 0, successful: 0, failed: 0, total_records_imported: 0, total_records_exported: 0, by_type: {}, by_action: {} };
    for (const row of results) {
      stats.total_operations += row.count;
      if (row.status === IMPORT_EXPORT_STATUS.COMPLETED) {
        stats.successful += row.count;
        if (row.action === 'export') stats.total_records_exported += row.total_records || 0;
        else if (row.action === 'import') stats.total_records_imported += row.total_records || 0;
      } else if (row.status === IMPORT_EXPORT_STATUS.FAILED) {
        stats.failed += row.count;
      }
      if (!stats.by_type[row.type]) stats.by_type[row.type] = { count: 0, successful: 0, failed: 0 };
      stats.by_type[row.type].count += row.count;
      if (row.status === IMPORT_EXPORT_STATUS.COMPLETED) stats.by_type[row.type].successful += row.count;
      else if (row.status === IMPORT_EXPORT_STATUS.FAILED) stats.by_type[row.type].failed += row.count;
      if (!stats.by_action[row.action]) stats.by_action[row.action] = { count: 0, successful: 0, failed: 0 };
      stats.by_action[row.action].count += row.count;
      if (row.status === IMPORT_EXPORT_STATUS.COMPLETED) stats.by_action[row.action].successful += row.count;
      else if (row.status === IMPORT_EXPORT_STATUS.FAILED) stats.by_action[row.action].failed += row.count;
    }
    return stats;
  },

  // Export database to SQL
  exportDatabase(filename = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = filename || `backup-${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, backupFilename);
    try {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
      let sql = '';
      const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%'").all();
      for (const row of schema) if (row.sql) sql += row.sql + ';\n\n';
      for (const table of tables) {
        const rows = db.prepare(`SELECT * FROM ${table.name}`).all();
        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          for (const row of rows) {
            const values = columns.map(col => {
              const v = row[col];
              if (v === null) return 'NULL';
              if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
              if (typeof v === 'number') return v;
              if (typeof v === 'boolean') return v ? 1 : 0;
              return `'${JSON.stringify(v)}'`;
            }).join(', ');
            sql += `INSERT INTO ${table.name} (${columns.join(', ')}) VALUES (${values});\n`;
          }
          sql += '\n';
        }
      }
      fs.promises.writeFile(filepath, sql);
      return { success: true, filepath, filename: backupFilename, size: fs.statSync(filepath).size, message: 'Database exported successfully' };
    } catch (error) {
      return { success: false, error: error.message, message: 'Failed to export database' };
    }
  },

  // Import database from SQL
  importDatabase(filepath) {
    try {
      const sql = fs.readFileSync(filepath, 'utf8');
      const statements = sql.split(';').filter(s => s.trim());
      for (let i = 0; i < statements.length; i += 100) {
        const batch = statements.slice(i, i + 100);
        db.exec(batch.join(';') + ';');
      }
      return { success: true, message: 'Database imported successfully' };
    } catch (error) {
      return { success: false, error: error.message, message: 'Failed to import database' };
    }
  },

  // Export table to CSV
  exportToCSV(tableName, filename = null) {
    if (!SUPPORTED_TABLES.includes(tableName)) {
      return { success: false, error: 'Unsupported table', message: `Table ${tableName} not supported` };
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvFilename = filename || `${tableName}-${timestamp}.csv`;
    const filepath = path.join(EXPORT_DIR, csvFilename);
    try {
      const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
      if (rows.length === 0) return { success: true, filepath, filename: csvFilename, recordCount: 0, message: 'No data' };
      const columns = Object.keys(rows[0]);
      let csv = columns.join(',') + '\n';
      for (const row of rows) {
        const values = columns.map(col => {
          const v = row[col];
          if (v === null) return '';
          if (typeof v === 'string' && (v.includes(',') || v.includes('\n') || v.includes('"') || v.includes("'"))) {
            return `"${v.replace(/"/g, '""')}"`;
          }
          return String(v);
        });
        csv += values.join(',') + '\n';
      }
      fs.writeFileSync(filepath, csv);
      return { success: true, filepath, filename: csvFilename, recordCount: rows.length, size: fs.statSync(filepath).size, message: 'CSV exported' };
    } catch (error) {
      return { success: false, error: error.message, message: 'CSV export failed' };
    }
  },

  // Parse CSV line
  parseCSVLine(line) {
    const values = []; let current = ''; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (c === ',' && !inQuotes) { values.push(current); current = ''; }
      else current += c;
    }
    values.push(current); return values;
  },

  // Import from CSV
  importFromCSV(tableName, filepath, userId = null) {
    if (!SUPPORTED_TABLES.includes(tableName)) {
      return { success: false, error: 'Unsupported table', message: `Table ${tableName} not supported` };
    }
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length < 2) return { success: true, message: 'No data', recordCount: 0 };
      const headers = this.parseCSVLine(lines[0]);
      const records = [];
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length === headers.length) {
          const r = {}; for (let j = 0; j < headers.length; j++) r[headers[j]] = values[j];
          records.push(r);
        }
      }
      if (records.length === 0) return { success: true, message: 'No data', recordCount: 0 };
      const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
      const tableCols = tableInfo.map(c => c.name);
      const missing = tableCols.filter(c => !headers.includes(c) && c !== 'id' && !c.endsWith('_at'));
      if (missing.length > 0) return { success: false, error: 'Column mismatch', message: `Missing: ${missing.join(',')}` };
      const log = this.createLog({ type: EXPORT_TYPES.CSV, action: 'import', tableName, fileName: path.basename(filepath), recordCount: records.length, status: IMPORT_EXPORT_STATUS.IN_PROGRESS, userId });
      let inserted = 0;
      for (const record of records) {
        const cols = Object.keys(record);
        const ph = cols.map(() => '?').join(',');
        const vals = cols.map(c => record[c]);
        try { db.prepare(`INSERT INTO ${tableName} (${cols.join(',')}) VALUES (${ph})`).run(...vals); inserted++; } catch (e) { console.error(e.message); }
      }
      this.updateLogStatus(log.id, { status: IMPORT_EXPORT_STATUS.COMPLETED, recordCount: inserted });
      return { success: true, message: 'CSV imported', recordCount: inserted, totalRecords: records.length };
    } catch (error) {
      return { success: false, error: error.message, message: 'CSV import failed' };
    }
  },

  // Create backup
  createBackup(filename = null) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    return this.exportDatabase(filename || `backup-${ts}.sql`);
  },

  // Restore backup
  restoreBackup(filename) {
    const fp = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(fp)) return { success: false, error: 'Not found', message: `Backup ${filename} not found` };
    return this.importDatabase(fp);
  },

  // List backups
  listBackups() {
    try {
      return fs.readdirSync(BACKUP_DIR).map(f => {
        const fp = path.join(BACKUP_DIR, f); const s = fs.statSync(fp);
        return { filename: f, filepath: fp, size: s.size, createdAt: s.mtime, sizeFormatted: this.formatFileSize(s.size) };
      }).sort((a, b) => b.createdAt - a.createdAt);
    } catch { return []; }
  },

  // List exports
  listExports() {
    try {
      return fs.readdirSync(EXPORT_DIR).map(f => {
        const fp = path.join(EXPORT_DIR, f); const s = fs.statSync(fp);
        return { filename: f, filepath: fp, size: s.size, createdAt: s.mtime, sizeFormatted: this.formatFileSize(s.size) };
      }).sort((a, b) => b.createdAt - a.createdAt);
    } catch { return []; }
  },

  // Delete backup
  deleteBackup(filename) {
    const fp = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(fp)) return { success: false, error: 'Not found' };
    try { fs.unlinkSync(fp); return { success: true, message: 'Deleted' }; }
    catch (e) { return { success: false, error: e.message }; }
  },

  // Delete export
  deleteExport(filename) {
    const fp = path.join(EXPORT_DIR, filename);
    if (!fs.existsSync(fp)) return { success: false, error: 'Not found' };
    try { fs.unlinkSync(fp); return { success: true, message: 'Deleted' }; }
    catch (e) { return { success: false, error: e.message }; }
  },

  // Format file size
  formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  },

  // Get supported tables
  getSupportedTables() { return [...SUPPORTED_TABLES]; }
};

// Export the main object
export default ImportExport;

/**
 * ImportExport Model
 * Database model for handling data import and export operations
 */

const db = require('../database/db.js');
const fs = require('fs');
const path = require('path');

// ImportExport Model Constants
const IMPORT_EXPORT_TABLE = 'import_export_log';
const BACKUP_DIR = path.join(__dirname, '../../backups');
const EXPORT_DIR = path.join(__dirname, '../../exports');

// Ensure directories exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

// Import/Export status constants
const IMPORT_EXPORT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Export types
const EXPORT_TYPES = {
  DATABASE: 'database',
  CSV: 'csv',
  BACKUP: 'backup'
};

// Import types
const IMPORT_TYPES = {
  DATABASE: 'database',
  CSV: 'csv',
  BACKUP: 'backup'
};

// Supported tables for CSV export/import
const SUPPORTED_TABLES = [
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
  async createLog(data) {
    const { type, action, tableName, fileName, recordCount, status, errorMessage, userId } = data;
    const query = `
      INSERT INTO ${IMPORT_EXPORT_TABLE} 
      (type, action, table_name, file_name, record_count, status, error_message, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    const params = [type, action, tableName, fileName, recordCount || 0, status, errorMessage, userId];
    const result = await db.run(query, params);
    return { id: result.lastInsertRowid, ...data };
  },

  // Get log by ID
  async getLogById(id) {
    const query = `SELECT * FROM ${IMPORT_EXPORT_TABLE} WHERE id = ?`;
    return await db.get(query, [id]);
  },

  // Get all logs
  async getAllLogs(options = {}) {
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
    return await db.all(query, params);
  },

  // Update log status
  async updateLogStatus(id, updates) {
    const { status, errorMessage, recordCount } = updates;
    const query = `UPDATE ${IMPORT_EXPORT_TABLE} SET status = ?, error_message = ?, record_count = ?, updated_at = datetime('now') WHERE id = ?`;
    await db.run(query, [status, errorMessage, recordCount, id]);
    return { id, ...updates };
  },

  // Count logs
  async countLogs(options = {}) {
    const { type, action, status, startDate, endDate } = options;
    let query = `SELECT COUNT(*) as count FROM ${IMPORT_EXPORT_TABLE} WHERE 1=1`;
    const params = [];
    if (type) { query += ' AND type = ?'; params.push(type); }
    if (action) { query += ' AND action = ?'; params.push(action); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (startDate) { query += ' AND created_at >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND created_at <= ?'; params.push(endDate); }
    const result = await db.get(query, params);
    return result.count;
  },

  // Get statistics
  async getStatistics() {
    const results = await db.all(`
      SELECT type, action, status, COUNT(*) as count, SUM(record_count) as total_records
      FROM ${IMPORT_EXPORT_TABLE} GROUP BY type, action, status
    `);
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
  async exportDatabase(filename = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = filename || `backup-${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, backupFilename);
    try {
      const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      let sql = '';
      const schema = await db.all("SELECT sql FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%'");
      for (const row of schema) if (row.sql) sql += row.sql + ';\n\n';
      for (const table of tables) {
        const rows = await db.all(`SELECT * FROM ${table.name}`);
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
      await fs.promises.writeFile(filepath, sql);
      return { success: true, filepath, filename: backupFilename, size: fs.statSync(filepath).size, message: 'Database exported successfully' };
    } catch (error) {
      return { success: false, error: error.message, message: 'Failed to export database' };
    }
  },

  // Import database from SQL
  async importDatabase(filepath) {
    try {
      const sql = await fs.promises.readFile(filepath, 'utf8');
      const statements = sql.split(';').filter(s => s.trim());
      for (let i = 0; i < statements.length; i += 100) {
        const batch = statements.slice(i, i + 100);
        await db.exec(batch.join(';') + ';');
      }
      return { success: true, message: 'Database imported successfully' };
    } catch (error) {
      return { success: false, error: error.message, message: 'Failed to import database' };
    }
  },

  // Export table to CSV
  async exportToCSV(tableName, filename = null) {
    if (!SUPPORTED_TABLES.includes(tableName)) {
      return { success: false, error: 'Unsupported table', message: `Table ${tableName} not supported` };
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvFilename = filename || `${tableName}-${timestamp}.csv`;
    const filepath = path.join(EXPORT_DIR, csvFilename);
    try {
      const rows = await db.all(`SELECT * FROM ${tableName}`);
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
      await fs.promises.writeFile(filepath, csv);
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
  async importFromCSV(tableName, filepath, userId = null) {
    if (!SUPPORTED_TABLES.includes(tableName)) {
      return { success: false, error: 'Unsupported table', message: `Table ${tableName} not supported` };
    }
    try {
      const content = await fs.promises.readFile(filepath, 'utf8');
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
      const tableInfo = await db.all(`PRAGMA table_info(${tableName})`);
      const tableCols = tableInfo.map(c => c.name);
      const missing = tableCols.filter(c => !headers.includes(c) && c !== 'id' && !c.endsWith('_at'));
      if (missing.length > 0) return { success: false, error: 'Column mismatch', message: `Missing: ${missing.join(',')}` };
      const log = await this.createLog({ type: EXPORT_TYPES.CSV, action: 'import', tableName, fileName: path.basename(filepath), recordCount: records.length, status: IMPORT_EXPORT_STATUS.IN_PROGRESS, userId });
      let inserted = 0;
      for (const record of records) {
        const cols = Object.keys(record);
        const ph = cols.map(() => '?').join(',');
        const vals = cols.map(c => record[c]);
        try { await db.run(`INSERT INTO ${tableName} (${cols.join(',')}) VALUES (${ph})`, vals); inserted++; } catch (e) { console.error(e.message); }
      }
      await this.updateLogStatus(log.id, { status: IMPORT_EXPORT_STATUS.COMPLETED, recordCount: inserted });
      return { success: true, message: 'CSV imported', recordCount: inserted, totalRecords: records.length };
    } catch (error) {
      return { success: false, error: error.message, message: 'CSV import failed' };
    }
  },

  // Create backup
  async createBackup(filename = null) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    return this.exportDatabase(filename || `backup-${ts}.sql`);
  },

  // Restore backup
  async restoreBackup(filename) {
    const fp = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(fp)) return { success: false, error: 'Not found', message: `Backup ${filename} not found` };
    return this.importDatabase(fp);
  },

  // List backups
  async listBackups() {
    try {
      return (await fs.promises.readdir(BACKUP_DIR)).map(f => {
        const fp = path.join(BACKUP_DIR, f); const s = fs.statSync(fp);
        return { filename: f, filepath: fp, size: s.size, createdAt: s.mtime, sizeFormatted: this.formatFileSize(s.size) };
      }).sort((a, b) => b.createdAt - a.createdAt);
    } catch { return []; }
  },

  // List exports
  async listExports() {
    try {
      return (await fs.promises.readdir(EXPORT_DIR)).map(f => {
        const fp = path.join(EXPORT_DIR, f); const s = fs.statSync(fp);
        return { filename: f, filepath: fp, size: s.size, createdAt: s.mtime, sizeFormatted: this.formatFileSize(s.size) };
      }).sort((a, b) => b.createdAt - a.createdAt);
    } catch { return []; }
  },

  // Delete backup
  async deleteBackup(filename) {
    const fp = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(fp)) return { success: false, error: 'Not found' };
    try { await fs.promises.unlink(fp); return { success: true, message: 'Deleted' }; }
    catch (e) { return { success: false, error: e.message }; }
  },

  // Delete export
  async deleteExport(filename) {
    const fp = path.join(EXPORT_DIR, filename);
    if (!fs.existsSync(fp)) return { success: false, error: 'Not found' };
    try { await fs.promises.unlink(fp); return { success: true, message: 'Deleted' }; }
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

// Exports
ImportExport.IMPORT_EXPORT_STATUS = IMPORT_EXPORT_STATUS;
ImportExport.EXPORT_TYPES = EXPORT_TYPES;
ImportExport.IMPORT_TYPES = IMPORT_TYPES;
ImportExport.SUPPORTED_TABLES = SUPPORTED_TABLES;
ImportExport.BACKUP_DIR = BACKUP_DIR;
ImportExport.EXPORT_DIR = EXPORT_DIR;

module.exports = ImportExport;

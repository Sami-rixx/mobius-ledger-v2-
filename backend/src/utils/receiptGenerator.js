import db from '../config/database.js';

/**
 * Generates a unique receipt number in the format ML-YYYY-######
 * Resets sequence at the beginning of each calendar year
 * Guarantees uniqueness by using database transactions
 */
export const generateReceiptNumber = () => {
  const now = new Date();
  const year = now.getFullYear();

  // Ensure receipt_year and receipt_sequence exist in system_settings
  const initializeSettings = db.transaction(() => {
    // Check and initialize receipt_year
    const yearRow = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('receipt_year');
    if (!yearRow) {
      db.prepare('INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)')
        .run('receipt_year', year.toString(), 'Current year for receipt numbers');
    }

    // Check and initialize receipt_sequence
    const seqRow = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('receipt_sequence');
    if (!seqRow) {
      db.prepare('INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)')
        .run('receipt_sequence', '0', 'Current receipt sequence number');
    }
  });
  initializeSettings();

  // Check if we need to reset the sequence for a new year
  const currentYearRow = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('receipt_year');
  const currentYear = parseInt(currentYearRow?.value || year.toString());

  if (currentYear !== year) {
    // Reset sequence for new year
    db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run('0', 'receipt_sequence');
    db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run(year.toString(), 'receipt_year');
  }

  // Get current sequence and increment atomically
  const result = db.transaction(() => {
    const currentSeqRow = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('receipt_sequence');
    let currentSeq = parseInt(currentSeqRow?.value || '0');
    const newSeq = currentSeq + 1;
    
    db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run(newSeq.toString(), 'receipt_sequence');
    
    return newSeq.toString().padStart(6, '0');
  })();

  // Get receipt prefix
  const prefixRow = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('receipt_prefix');
  const prefix = prefixRow?.value || 'ML';

  return `${prefix}-${year}-${result}`;
};

/**
 * Validates a receipt number format
 * Format: PREFIX-YYYY-###### (e.g., ML-2026-000001)
 */
export const validateReceiptNumber = (receiptNumber) => {
  if (!receiptNumber || typeof receiptNumber !== 'string') return false;
  
  const receiptRegex = /^[A-Z]{2,4}-\d{4}-\d{6}$/;
  return receiptRegex.test(receiptNumber);
};

/**
 * Extracts year from receipt number
 */
export const getReceiptYear = (receiptNumber) => {
  if (!validateReceiptNumber(receiptNumber)) return null;
  
  const parts = receiptNumber.split('-');
  if (parts.length !== 3) return null;
  
  return parseInt(parts[1]);
};

/**
 * Extracts sequence number from receipt number
 */
export const getReceiptSequence = (receiptNumber) => {
  if (!validateReceiptNumber(receiptNumber)) return null;
  
  const parts = receiptNumber.split('-');
  if (parts.length !== 3) return null;
  
  return parseInt(parts[2]);
};

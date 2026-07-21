import db from '../config/database.js';

/**
 * Generates a unique receipt number in the format ML-YYYY-######
 * Resets sequence at the beginning of each calendar year
 * Guarantees uniqueness by using database transactions
 */
export const generateReceiptNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Check if we need to reset the sequence for a new year
  const lastYear = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('receipt_year')?.value;
  
  if (parseInt(lastYear) !== year) {
    // Reset sequence for new year
    db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run('0', 'receipt_sequence');
    db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run(year.toString(), 'receipt_year');
  }

  // Get current sequence and increment atomically
  const result = db.transaction(() => {
    const currentSeq = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('receipt_sequence');
    const newSeq = (parseInt(currentSeq.value) + 1).toString().padStart(6, '0');
    db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run(newSeq, 'receipt_sequence');
    return newSeq;
  })();

  // Get receipt prefix
  const prefix = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('receipt_prefix')?.value || 'ML';

  return `${prefix}-${year}-${result}`;
};

/**
 * Validates a receipt number format
 */
export const validateReceiptNumber = (receiptNumber) => {
  const receiptRegex = /^[A-Z]{2,4}-\d{4}-\d{6}$/;
  return receiptRegex.test(receiptNumber);
};

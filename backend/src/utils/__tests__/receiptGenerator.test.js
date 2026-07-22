import { generateReceiptNumber, validateReceiptNumber, getReceiptYear, getReceiptSequence } from '../receiptGenerator.js';
import db from '../../config/database.js';

describe('Receipt Generator', () => {
  beforeAll(() => {
    // Initialize database settings for testing
    db.prepare('INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)')
      .run('receipt_prefix', 'ML', 'Prefix for receipt numbers');
    db.prepare('INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)')
      .run('receipt_sequence', '0', 'Current receipt sequence number');
    db.prepare('INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)')
      .run('receipt_year', new Date().getFullYear().toString(), 'Current year for receipt numbers');
  });

  afterAll(() => {
    // Reset sequence after tests
    db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run('0', 'receipt_sequence');
  });

  describe('generateReceiptNumber', () => {
    it('should generate a receipt number in the correct format', () => {
      const receipt = generateReceiptNumber();
      expect(receipt).toMatch(/^ML-\d{4}-\d{6}$/);
    });

    it('should generate unique receipt numbers', () => {
      const receipt1 = generateReceiptNumber();
      const receipt2 = generateReceiptNumber();
      expect(receipt1).not.toBe(receipt2);
    });

    it('should increment sequence number', () => {
      const receipt1 = generateReceiptNumber();
      const receipt2 = generateReceiptNumber();
      
      const seq1 = getReceiptSequence(receipt1);
      const seq2 = getReceiptSequence(receipt2);
      
      expect(seq2).toBe(seq1 + 1);
    });

    it('should include current year', () => {
      const receipt = generateReceiptNumber();
      const year = getReceiptYear(receipt);
      expect(year).toBe(new Date().getFullYear());
    });
  });

  describe('validateReceiptNumber', () => {
    it('should validate correct format', () => {
      expect(validateReceiptNumber('ML-2026-000001')).toBe(true);
      expect(validateReceiptNumber('ML-2025-123456')).toBe(true);
      expect(validateReceiptNumber('ABC-2026-000001')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(validateReceiptNumber('ML-2026-1')).toBe(false);
      expect(validateReceiptNumber('ML-2026-0000012')).toBe(false);
      expect(validateReceiptNumber('ML-26-000001')).toBe(false);
      expect(validateReceiptNumber('ml-2026-000001')).toBe(false);
      expect(validateReceiptNumber(null)).toBe(false);
      expect(validateReceiptNumber(undefined)).toBe(false);
      expect(validateReceiptNumber(123)).toBe(false);
    });
  });

  describe('getReceiptYear', () => {
    it('should extract year from receipt number', () => {
      expect(getReceiptYear('ML-2026-000001')).toBe(2026);
      expect(getReceiptYear('ML-2025-123456')).toBe(2025);
    });

    it('should return null for invalid format', () => {
      expect(getReceiptYear('invalid')).toBeNull();
      expect(getReceiptYear('ML-26-000001')).toBeNull();
    });
  });

  describe('getReceiptSequence', () => {
    it('should extract sequence from receipt number', () => {
      expect(getReceiptSequence('ML-2026-000001')).toBe(1);
      expect(getReceiptSequence('ML-2026-000010')).toBe(10);
      expect(getReceiptSequence('ML-2026-123456')).toBe(123456);
    });

    it('should return null for invalid format', () => {
      expect(getReceiptSequence('invalid')).toBeNull();
      expect(getReceiptSequence('ML-26-000001')).toBeNull();
    });
  });
});

/**
 * Money utilities for cents-based storage
 * 
 * All monetary values are stored as INTEGER cents (smallest currency unit).
 * This module provides utilities for converting between cents and decimal representation.
 * 
 * Storage pattern:
 * - All monetary data is stored as INTEGER cents
 * - API inputs: Decimal strings are converted to cents via toCents()
 * - API outputs: Cents are converted to decimal via fromCents()
 * 
 * Example usage:
 *   import { toCents, fromCents, formatCurrency } from './utils/money.js';
 *   
 *   // Storing: convert decimal string to cents
 *   const cents = toCents('123.45'); // 12345
 *   
 *   // API responses: convert cents to decimal
 *   const decimal = fromCents(12345); // 123.45
 *   
 *   // Format for display
 *   const display = formatCurrency(12345); // "KES 123.45"
 */

/**
 * Currency symbol - can be configured from system settings
 * Default: KES (Kenyan Shilling)
 */
export const DEFAULT_CURRENCY = 'KES';

/**
 * Convert a decimal amount to cents
 * @param {number|string} amount - Decimal amount (e.g., 123.45 or "123.45")
 * @returns {number} Amount in cents as integer
 */
export function toCents(amount) {
  if (amount === null || amount === undefined) return null;
  
  // If already in cents (integer), return as-is
  if (Number.isInteger(amount)) return amount;
  
  // Convert to number if string
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return null;
  
  // Multiply by 100 and round to nearest integer
  // Using round() to handle any floating point imprecision from input
  return Math.round(num * 100);
}

/**
 * Convert cents to decimal amount
 * @param {number} cents - Amount in cents
 * @returns {number} Decimal amount
 */
export function fromCents(cents) {
  if (cents === null || cents === undefined) return null;
  return cents / 100;
}

/**
 * Get decimal value from row
 * All monetary values are now stored as INTEGER cents, so we simply convert to decimal
 * @param {Object} row - Database row
 * @param {string} fieldName - The field name containing cents (e.g., 'amount', 'total_income')
 * @returns {number} Decimal amount
 */
export function getAmount(row, fieldName) {
  const value = row[fieldName];
  if (value === null || value === undefined) return null;
  return fromCents(value);
}

/**
 * Format cents as currency string
 * @param {number} cents - Amount in cents
 * @param {string} currencySymbol - Optional currency symbol (default: KES)
 * @returns {string} Formatted currency string (e.g., "KES 1,234.50")
 */
export function formatCurrency(cents, currencySymbol = DEFAULT_CURRENCY) {
  if (cents === null || cents === undefined) return '';
  
  // Handle negative values
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  
  // Split into dollars and cents
  const dollars = Math.floor(absCents / 100);
  const centsPart = absCents % 100;
  
  // Format with commas
  const formattedDollars = dollars.toLocaleString('en-US');
  const formattedCents = centsPart.toString().padStart(2, '0');
  
  const sign = isNegative ? '-' : '';
  return `${currencySymbol} ${sign}${formattedDollars}.${formattedCents}`;
}

/**
 * Parse a currency-formatted string to cents
 * Handles formats like "1,234.50", "1234.50", "1234", "KES 1,234.50"
 * @param {string} value - Currency string
 * @returns {number|null} Amount in cents, or null if invalid
 */
export function parseCurrency(value) {
  if (value === null || value === undefined || value === '') return null;
  
  // Remove all non-numeric characters except decimal point and minus sign
  const cleaned = value.replace(/[^\d.-]/g, '');
  
  if (cleaned === '' || cleaned === '.' || cleaned === '-') return null;
  
  const num = parseFloat(cleaned);
  
  if (isNaN(num)) return null;
  
  return toCents(num);
}

/**
 * Validate that a value can be converted to cents
 * @param {*} value - Value to validate
 * @returns {boolean} True if valid monetary value
 */
export function isValidMoney(value) {
  return value !== null && value !== undefined && !isNaN(parseFloat(value));
}

/**
 * Get currency symbol from database or use default
 * @param {import('better-sqlite3').Database} db - Database instance
 * @returns {Promise<string>} Currency symbol
 */
export async function getCurrencySymbol(db) {
  try {
    const result = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('currency');
    return result?.value || DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

export default {
  DEFAULT_CURRENCY,
  toCents,
  fromCents,
  getAmount,
  formatCurrency,
  parseCurrency,
  isValidMoney,
  getCurrencySymbol
};

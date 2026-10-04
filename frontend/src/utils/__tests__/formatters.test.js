import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatReceiptNumber,
  truncate,
  capitalize,
  getInitials,
  formatPhone,
} from '../formatters.js';

describe('formatCurrency', () => {
  it('formats a whole-number amount with two decimal places and the KES symbol', () => {
    const result = formatCurrency(1000);
    // Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' })
    // renders the currency symbol as "Ksh" using Node's bundled ICU data.
    expect(result).toContain('1,000.00');
    expect(result).toMatch(/ksh/i);
  });

  it('formats amounts with cents correctly (no silent rounding of real money values)', () => {
    expect(formatCurrency(1234.5)).toContain('1,234.50');
    expect(formatCurrency(99.99)).toContain('99.99');
  });

  it('formats zero as a valid currency string rather than an empty string', () => {
    // formatCurrency() treats `null`/`undefined` as "no value" (returns ''),
    // but 0 is a legitimate financial amount (e.g. a fully-paid balance)
    // and must still be formatted, not treated as falsy/missing.
    const result = formatCurrency(0);
    expect(result).not.toBe('');
    expect(result).toContain('0.00');
  });

  it('formats negative amounts (e.g. a refund or reversal) with a minus sign', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('500.00');
    expect(result).toMatch(/-/);
  });

  it('parses numeric strings (as commonly come from form inputs) the same as numbers', () => {
    expect(formatCurrency('250.75')).toBe(formatCurrency(250.75));
  });

  it('returns an empty string for null, undefined or non-numeric input instead of "NaN" or throwing', () => {
    expect(formatCurrency(null)).toBe('');
    expect(formatCurrency(undefined)).toBe('');
    expect(formatCurrency('not-a-number')).toBe('');
    expect(formatCurrency('')).toBe('');
  });

  it('rounds to exactly two decimal places regardless of input precision', () => {
    // 10.005 is a classic floating point edge case; just assert the
    // output always has exactly 2 digits after the decimal point rather
    // than asserting the exact rounding direction (which is an
    // Intl/ICU implementation detail, not business logic this file owns).
    const result = formatCurrency(10.005);
    expect(result).toMatch(/\.\d{2}$/);
  });
});

describe('formatDate', () => {
  it('formats an ISO date string using the medium format by default', () => {
    const result = formatDate('2026-03-15');
    expect(result).toContain('2026');
    expect(result).toMatch(/Mar/);
  });

  it('supports the short, long and full format variants', () => {
    expect(formatDate('2026-03-15', 'short')).toMatch(/Mar/);
    expect(formatDate('2026-03-15', 'long')).toMatch(/March/);
    expect(formatDate('2026-03-15', 'full')).toMatch(/2026/);
  });

  it('returns an empty string for a falsy or unparseable date instead of "Invalid Date"', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
    expect(formatDate('not-a-date')).toBe('');
  });

  it('accepts a native Date object as well as a date string', () => {
    const result = formatDate(new Date('2026-07-04T00:00:00Z'));
    expect(result).toContain('2026');
  });
});

describe('formatReceiptNumber', () => {
  it('returns the receipt number unchanged when present', () => {
    expect(formatReceiptNumber('ML-2026-000123')).toBe('ML-2026-000123');
  });

  it('returns an empty string for a missing receipt number', () => {
    expect(formatReceiptNumber(null)).toBe('');
    expect(formatReceiptNumber(undefined)).toBe('');
    expect(formatReceiptNumber('')).toBe('');
  });
});

describe('truncate', () => {
  it('leaves short text untouched', () => {
    expect(truncate('short text', 50)).toBe('short text');
  });

  it('truncates long text and appends an ellipsis', () => {
    const longText = 'a'.repeat(60);
    const result = truncate(longText, 50);
    expect(result).toHaveLength(53); // 50 chars + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it('returns an empty string for falsy input', () => {
    expect(truncate(null)).toBe('');
    expect(truncate('')).toBe('');
  });
});

describe('capitalize', () => {
  it('capitalizes the first letter and lowercases the rest', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('WORLD')).toBe('World');
    expect(capitalize('mIXeD cAsE')).toBe('Mixed case');
  });

  it('returns an empty string for falsy input', () => {
    expect(capitalize(null)).toBe('');
    expect(capitalize('')).toBe('');
  });
});

describe('getInitials', () => {
  it('returns up to two uppercase initials from a full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('jane smith')).toBe('JS');
  });

  it('truncates to two initials for names with more than two parts', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });

  it('returns an empty string for a missing name', () => {
    expect(getInitials(null)).toBe('');
    expect(getInitials('')).toBe('');
  });
});

describe('formatPhone', () => {
  it('formats a 254-prefixed Kenyan number with a leading plus sign', () => {
    expect(formatPhone('254712345678')).toBe('+254 712 345 678');
  });

  it('formats a 0-prefixed local Kenyan number', () => {
    expect(formatPhone('0712345678')).toBe('0 712 345 678');
  });

  it('strips non-digit characters before formatting', () => {
    expect(formatPhone('+254 712 345 678')).toBe('+254 712 345 678');
  });

  it('returns the original value unchanged for formats it does not recognise', () => {
    expect(formatPhone('12345')).toBe('12345');
  });

  it('returns an empty string for a missing phone number', () => {
    expect(formatPhone(null)).toBe('');
    expect(formatPhone('')).toBe('');
  });
});

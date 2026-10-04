import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPhone,
  isPositiveNumber,
  isNonNegativeNumber,
  isRequired,
  isValidLength,
  isValidDate,
  isDateNotInFuture,
  isDateInFuture,
  isValidReceiptNumber,
  isValidAdmissionNumber,
  getValidationError,
} from '../validators.js';

describe('isValidEmail', () => {
  it('accepts well-formed email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('first.last+tag@sub.example.co.ke')).toBe(true);
  });

  it('rejects malformed or missing email addresses', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('missing-domain@')).toBe(false);
    expect(isValidEmail('@missing-local.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('accepts valid Kenyan phone numbers in both local and international format', () => {
    expect(isValidPhone('0712345678')).toBe(true);
    expect(isValidPhone('+254712345678')).toBe(true);
    expect(isValidPhone('0712 345 678')).toBe(true); // whitespace is stripped
  });

  it('rejects numbers that are too short, malformed, or missing', () => {
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('0012345678')).toBe(false); // must start with 0 or +254
    expect(isValidPhone('')).toBe(false);
    expect(isValidPhone(null)).toBe(false);
  });
});

describe('isPositiveNumber (used to validate financial amounts, e.g. expense/income entry)', () => {
  it('accepts positive numbers and numeric strings', () => {
    expect(isPositiveNumber(100)).toBe(true);
    expect(isPositiveNumber(0.01)).toBe(true);
    expect(isPositiveNumber('250.50')).toBe(true);
  });

  it('rejects zero, negative amounts, and non-numeric values', () => {
    expect(isPositiveNumber(0)).toBe(false);
    expect(isPositiveNumber(-50)).toBe(false);
    expect(isPositiveNumber('not-a-number')).toBe(false);
    expect(isPositiveNumber(null)).toBe(false);
    expect(isPositiveNumber(undefined)).toBe(false);
  });
});

describe('isNonNegativeNumber (used for amounts that may legitimately be zero, e.g. a cleared balance)', () => {
  it('accepts zero and positive numbers', () => {
    expect(isNonNegativeNumber(0)).toBe(true);
    expect(isNonNegativeNumber(100)).toBe(true);
    expect(isNonNegativeNumber('0')).toBe(true);
  });

  it('rejects negative amounts and non-numeric values', () => {
    expect(isNonNegativeNumber(-0.01)).toBe(false);
    expect(isNonNegativeNumber(-100)).toBe(false);
    expect(isNonNegativeNumber('abc')).toBe(false);
    expect(isNonNegativeNumber(null)).toBe(false);
  });
});

describe('isRequired', () => {
  it('rejects null, undefined, blank/whitespace-only strings, and empty arrays', () => {
    expect(isRequired(null)).toBe(false);
    expect(isRequired(undefined)).toBe(false);
    expect(isRequired('')).toBe(false);
    expect(isRequired('   ')).toBe(false);
    expect(isRequired([])).toBe(false);
  });

  it('accepts non-empty strings, numbers (including 0 and false), and non-empty arrays', () => {
    expect(isRequired('value')).toBe(true);
    expect(isRequired(0)).toBe(true);
    expect(isRequired(false)).toBe(true);
    expect(isRequired([1])).toBe(true);
  });
});

describe('isValidLength', () => {
  it('enforces a minimum length', () => {
    expect(isValidLength('ab', 3)).toBe(false);
    expect(isValidLength('abc', 3)).toBe(true);
  });

  it('enforces an optional maximum length', () => {
    expect(isValidLength('abcdef', 1, 5)).toBe(false);
    expect(isValidLength('abcde', 1, 5)).toBe(true);
  });

  it('rejects falsy values', () => {
    expect(isValidLength('', 1)).toBe(false);
    expect(isValidLength(null, 1)).toBe(false);
  });
});

describe('date validators', () => {
  it('isValidDate accepts parseable dates and rejects unparseable ones', () => {
    expect(isValidDate('2026-01-15')).toBe(true);
    expect(isValidDate(new Date())).toBe(true);
    expect(isValidDate('not-a-date')).toBe(false);
    expect(isValidDate(null)).toBe(false);
  });

  it('isDateNotInFuture accepts today/past dates and rejects future dates', () => {
    expect(isDateNotInFuture('2020-01-01')).toBe(true);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isDateNotInFuture(tomorrow)).toBe(false);
  });

  it('isDateInFuture accepts future dates and rejects today/past dates', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isDateInFuture(tomorrow)).toBe(true);
    expect(isDateInFuture('2020-01-01')).toBe(false);
  });
});

describe('isValidReceiptNumber', () => {
  it('accepts the documented ML-YYYY-###### receipt number format', () => {
    expect(isValidReceiptNumber('ML-2026-000123')).toBe(true);
  });

  it('rejects numbers that do not match the required format', () => {
    expect(isValidReceiptNumber('ml-2026-000123')).toBe(false); // must be uppercase
    expect(isValidReceiptNumber('ML-26-123')).toBe(false); // wrong digit groupings
    expect(isValidReceiptNumber('')).toBe(false);
    expect(isValidReceiptNumber(null)).toBe(false);
  });
});

describe('isValidAdmissionNumber', () => {
  it('accepts 3-20 character alphanumeric admission numbers', () => {
    expect(isValidAdmissionNumber('ADM001')).toBe(true);
    expect(isValidAdmissionNumber('123')).toBe(true);
  });

  it('rejects numbers that are too short or contain invalid characters', () => {
    expect(isValidAdmissionNumber('AB')).toBe(false); // too short
    expect(isValidAdmissionNumber('ADM-001')).toBe(false); // hyphen not allowed
    expect(isValidAdmissionNumber('')).toBe(false);
    expect(isValidAdmissionNumber(null)).toBe(false);
  });
});

describe('getValidationError', () => {
  it('returns a field-specific message for known validation types', () => {
    expect(getValidationError('Amount', 'positive')).toBe('Amount must be a positive number');
    expect(getValidationError('Email', 'email')).toBe('Email must be a valid email address');
    expect(getValidationError('Name', 'required')).toBe('Name is required');
  });

  it('falls back to a generic message for an unknown validation type', () => {
    expect(getValidationError('Field', 'some_unknown_type')).toBe('Field is invalid');
  });
});

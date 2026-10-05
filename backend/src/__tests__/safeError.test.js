import { safeErrorMessage } from '../utils/safeError.js';

describe('safeErrorMessage', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('returns the real error message outside production (test/dev)', () => {
    process.env.NODE_ENV = 'test';
    const err = new Error('SQLITE_ERROR: no such table: secret_internal_table');
    expect(safeErrorMessage(err)).toBe('SQLITE_ERROR: no such table: secret_internal_table');
  });

  test('never leaks raw error detail in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('SQLITE_ERROR: no such table: secret_internal_table at /var/data/mobius.db');
    const message = safeErrorMessage(err);
    expect(message).not.toContain('SQLITE_ERROR');
    expect(message).not.toContain('/var/data');
    expect(message).not.toContain('secret_internal_table');
  });

  test('allows a custom generic message in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('raw internal detail');
    expect(safeErrorMessage(err, 'Could not process withdrawal')).toBe('Could not process withdrawal');
  });

  test('handles a missing/undefined error object gracefully', () => {
    process.env.NODE_ENV = 'test';
    expect(safeErrorMessage(undefined)).toBe('An unexpected error occurred. Please try again or contact support.');
  });
});

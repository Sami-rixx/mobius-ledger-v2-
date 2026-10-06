/**
 * Money utilities — canonical integer-cents representation.
 *
 * OWNER DECISION D8 (security specification): the amount_cents migration must
 * be finished. Every runtime financial write must store the canonical integer
 * cents value alongside the legacy decimal column, and the two must always
 * satisfy the invariant: amount_cents === Math.round(amount * 100).
 */
import { ValidationError } from '../middleware/errorHandler.js';

/** Maximum supported amount (in currency units) for a single record. */
export const MAX_AMOUNT = 100_000_000; // 100 million

/**
 * Validate a monetary amount: finite number, at most 2 decimal places,
 * within supported range. Returns the normalized Number value.
 * @param {*} value
 * @param {object} [options]
 * @param {boolean} [options.allowNegative=false] negative amounts are only
 *        valid for reversal/correction records created internally.
 * @param {boolean} [options.allowZero=false]
 * @param {string}  [options.field='amount']
 */
export function validateAmount(value, options = {}) {
  const { allowNegative = false, allowZero = false, field = 'amount' } = options;
  const num = typeof value === 'string' ? Number(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    throw new ValidationError(`${field} must be a valid number`);
  }
  if (!allowNegative && num < 0) {
    throw new ValidationError(`${field} must not be negative`);
  }
  if (!allowZero && num === 0) {
    throw new ValidationError(`${field} must not be zero`);
  }
  if (Math.abs(num) > MAX_AMOUNT) {
    throw new ValidationError(`${field} exceeds the maximum supported value`);
  }
  // Reject more than 2 decimal places (sub-cent amounts are not representable)
  const cents = num * 100;
  if (Math.abs(cents - Math.round(cents)) > 1e-6) {
    throw new ValidationError(`${field} must not have more than 2 decimal places`);
  }
  return num;
}

/**
 * Convert a validated decimal amount to integer cents.
 * @param {number|string} amount
 * @returns {number} integer cents
 */
export function toCents(amount, options = {}) {
  const num = validateAmount(amount, options);
  return Math.round(num * 100);
}

/**
 * Convert integer cents back to a decimal amount.
 * @param {number} cents
 * @returns {number}
 */
export function fromCents(cents) {
  if (!Number.isInteger(cents)) {
    throw new ValidationError('cents must be an integer');
  }
  return cents / 100;
}

/**
 * Check the cents invariant for a row: amount_cents === round(amount * 100).
 */
export function centsConsistent(amount, amountCents) {
  if (amountCents === null || amountCents === undefined) return false;
  return Math.round(Number(amount) * 100) === Number(amountCents);
}

export default { MAX_AMOUNT, validateAmount, toCents, fromCents, centsConsistent };

/**
 * Canonical money utilities.
 *
 * MÖBIUS LEDGER v2 historically stored monetary amounts as a DECIMAL
 * `amount` column while an `amount_cents` INTEGER column existed in the
 * schema "for future use" but was never consistently written by the real
 * application code paths (a half-migrated dual-unit model). Per the
 * approved security architecture, `amount_cents` is now the canonical
 * representation and MUST be written on every financial create/update
 * path; `amount` (decimal) is kept in sync for backward compatibility
 * with existing reports/UI that already read it.
 *
 * All helpers here are pure/synchronous (no I/O) so they are safe to call
 * from better-sqlite3's synchronous request path without introducing any
 * async/sync mismatch.
 */

/**
 * Convert a decimal amount (e.g. 150.5) to integer cents (15050).
 * Uses rounding to avoid floating point drift.
 * @param {number|string} amount
 * @returns {number}
 */
export function toCents(amount) {
  if (amount === null || amount === undefined || amount === '') return 0;
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Convert integer cents back to a decimal amount (e.g. 15050 -> 150.5).
 * @param {number} cents
 * @returns {number}
 */
export function fromCents(cents) {
  if (cents === null || cents === undefined) return 0;
  return Math.round(cents) / 100;
}

/**
 * Validate that a decimal amount and its cents representation agree
 * (within floating point rounding tolerance of half a cent).
 * @param {number|string} amount
 * @param {number} cents
 * @returns {boolean}
 */
export function isConsistent(amount, cents) {
  if (cents === null || cents === undefined) return false;
  return toCents(amount) === Math.round(cents);
}

/**
 * Derive the canonical cents value to persist for a given decimal amount,
 * optionally honoring an explicitly supplied cents value if it already
 * matches (defensive: never trust a client-supplied cents value that
 * disagrees with the decimal amount - always recompute from amount).
 * @param {number|string} amount
 * @returns {number}
 */
export function deriveAmountCents(amount) {
  return toCents(amount);
}

export default { toCents, fromCents, isConsistent, deriveAmountCents };

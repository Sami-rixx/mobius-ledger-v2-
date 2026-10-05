import argon2 from 'argon2';

/**
 * Password hashing service - Argon2id (owner-approved, D2).
 *
 * better-sqlite3 is fully synchronous, but argon2 hashing/verification is
 * genuinely CPU-bound async work done entirely in Node (no SQL involved in
 * these two functions) - there is no sync/async DB misuse here, these are
 * simply awaited before any subsequent synchronous DB call is made by the
 * caller.
 */

export const ARGON2ID_OPTIONS = {
  type: argon2.argon2id,
  // argon2id defaults in the `argon2` package are already reasonable
  // (memoryCost ~19MB, timeCost 2, parallelism 1 in some versions); we
  // pin explicit, slightly strengthened parameters so behavior doesn't
  // silently drift across dependency upgrades.
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3,
  parallelism: 1
};

/**
 * Hash a plaintext password with Argon2id.
 * @param {string} password
 * @returns {Promise<string>} encoded hash (includes algorithm/params/salt)
 */
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 1) {
    throw new Error('Password must be a non-empty string');
  }
  return argon2.hash(password, ARGON2ID_OPTIONS);
}

/**
 * Verify a plaintext password against a stored hash.
 *
 * SECURITY: NULL/empty hashes must NEVER be treated as "anything matches"
 * or as an automatic pass/fail shortcut that could be timed differently
 * from a real verification - we explicitly short-circuit to `false` for a
 * missing hash so a placeholder/bootstrap account can never be logged
 * into, regardless of what password is supplied.
 * @param {string|null|undefined} hash
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(hash, password) {
  if (!hash || typeof hash !== 'string') {
    return false;
  }
  if (typeof password !== 'string' || password.length === 0) {
    return false;
  }
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    // argon2.verify throws on a malformed/foreign hash format rather than
    // returning false - treat that the same as "does not match" instead of
    // letting the error escape (which could leak hash-format details).
    return false;
  }
}

/**
 * Minimum password policy for new/changed passwords.
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePasswordPolicy(password) {
  const errors = [];
  if (typeof password !== 'string' || password.length < 10) {
    errors.push('Password must be at least 10 characters long');
  }
  if (password && !/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter');
  if (password && !/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter');
  if (password && !/[0-9]/.test(password)) errors.push('Password must contain a digit');
  return { valid: errors.length === 0, errors };
}

export default { hashPassword, verifyPassword, validatePasswordPolicy, ARGON2ID_OPTIONS };

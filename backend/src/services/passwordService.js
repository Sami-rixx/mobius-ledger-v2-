/**
 * Password hashing service.
 *
 * OWNER DECISION D2: Argon2id. Plaintext passwords are prohibited and NULL
 * password hashes must never permit login (verifyPassword fails closed).
 */
import argon2 from 'argon2';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB (OWASP recommended minimum for argon2id)
  timeCost: 2,
  parallelism: 1
};

export const MIN_PASSWORD_LENGTH = 10;

/**
 * Validate password strength policy. Returns null when acceptable,
 * otherwise a human-readable reason.
 */
export function passwordPolicyViolation(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain both letters and numbers';
  }
  return null;
}

/** Hash a password with Argon2id. */
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password must be a non-empty string');
  }
  return argon2.hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a password against a stored hash. Fails closed: a NULL/empty hash
 * or any verification error returns false — it never throws into a login
 * success path.
 */
export async function verifyPassword(storedHash, password) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  if (typeof password !== 'string' || password.length === 0) return false;
  try {
    return await argon2.verify(storedHash, password);
  } catch {
    return false;
  }
}

export default { hashPassword, verifyPassword, passwordPolicyViolation, MIN_PASSWORD_LENGTH };

/**
 * Sort/order-by allowlist utility.
 *
 * SECURITY: Several models previously interpolated client-supplied
 * `orderBy`/`orderDir` query parameters directly into raw SQL strings
 * (`ORDER BY ${orderBy} ${orderDir}`). Because better-sqlite3 cannot
 * parameterize identifiers (only values), this was a SQL injection /
 * ORDER BY injection vector - a malicious orderBy such as
 * `id; DROP TABLE users; --` or a boolean/time-based blind-injection
 * payload could be interpolated straight into the query.
 *
 * This helper enforces a hard allowlist: callers declare a map of
 * symbolic sort keys -> actual SQL column expressions, and only those
 * symbolic keys may be selected by the client. Anything else falls back
 * to the caller-provided default (safe) order, and `assertValidOrder`
 * can be used by controllers to reject unknown values with 400 instead
 * of silently coercing them.
 */

export const ORDER_DIRECTIONS = ['ASC', 'DESC'];

/**
 * Resolve a safe `ORDER BY` fragment from client input.
 *
 * @param {Object} fieldMap - map of allowed symbolic key -> SQL column expression
 * @param {string} defaultKey - symbolic key to use when input is missing/invalid
 * @param {string} [defaultDir='ASC']
 * @param {string} [orderBy] - client-supplied symbolic sort key
 * @param {string} [orderDir] - client-supplied direction
 * @returns {{ column: string, direction: string, key: string, valid: boolean }}
 */
export function resolveOrder(fieldMap, defaultKey, defaultDir = 'ASC', orderBy, orderDir) {
  const safeDefaultDir = ORDER_DIRECTIONS.includes(String(defaultDir).toUpperCase())
    ? String(defaultDir).toUpperCase()
    : 'ASC';

  let valid = true;
  let key = defaultKey;
  if (orderBy !== undefined && orderBy !== null && orderBy !== '') {
    if (Object.prototype.hasOwnProperty.call(fieldMap, orderBy)) {
      key = orderBy;
    } else {
      valid = false;
    }
  }

  let direction = safeDefaultDir;
  if (orderDir !== undefined && orderDir !== null && orderDir !== '') {
    const upper = String(orderDir).toUpperCase();
    if (ORDER_DIRECTIONS.includes(upper)) {
      direction = upper;
    } else {
      valid = false;
    }
  }

  const column = fieldMap[key] || fieldMap[defaultKey];

  return { column, direction, key: valid ? key : defaultKey, valid };
}

/**
 * Express-style guard: validates orderBy/orderDir against an allowlist and
 * responds with 400 when the client supplied an unrecognized value, rather
 * than silently falling back (fail closed on malformed/malicious input).
 *
 * Returns `null` (and has already sent the response) when invalid, or the
 * resolved `{ column, direction }` when valid/absent.
 */
export function requireValidOrder(res, fieldMap, defaultKey, defaultDir, orderBy, orderDir) {
  const result = resolveOrder(fieldMap, defaultKey, defaultDir, orderBy, orderDir);
  if (!result.valid) {
    res.status(400).json({
      success: false,
      error: 'Invalid sort parameters',
      message: `orderBy must be one of: ${Object.keys(fieldMap).join(', ')}; orderDir must be ASC or DESC`
    });
    return null;
  }
  return result;
}

export default { resolveOrder, requireValidOrder, ORDER_DIRECTIONS };

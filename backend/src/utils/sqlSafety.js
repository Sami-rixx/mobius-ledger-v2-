/**
 * SQL identifier safety utilities.
 *
 * SECURITY REQUIREMENT (specification §9): ORDER BY / orderDir values must be
 * allowlisted. Unknown values must be rejected with a 400 — no user supplied
 * SQL fragment may ever be interpolated into a query.
 */
import { ValidationError } from '../middleware/errorHandler.js';

/** Maximum page size for any paginated listing (specification §9). */
export const MAX_PAGE_SIZE = 100;

/**
 * Validate an ORDER BY column + direction against a hardcoded allowlist.
 *
 * @param {string|undefined} orderBy   requested sort key
 * @param {string|undefined} orderDir  requested direction
 * @param {string[]} allowedFields     hardcoded allowlist of sortable columns
 * @param {string} defaultField        default sort column (must be in allowlist)
 * @param {string} [defaultDir='DESC'] default direction
 * @returns {{ field: string, dir: 'ASC'|'DESC' }}
 * @throws {ValidationError} 400 when an unknown field/direction is requested
 */
export function parseOrder(orderBy, orderDir, allowedFields, defaultField, defaultDir = 'DESC') {
  let field = defaultField;
  if (orderBy !== undefined && orderBy !== null && orderBy !== '') {
    if (!allowedFields.includes(orderBy)) {
      throw new ValidationError(`Invalid orderBy value. Allowed: ${allowedFields.join(', ')}`);
    }
    field = orderBy;
  }

  let dir = defaultDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  if (orderDir !== undefined && orderDir !== null && orderDir !== '') {
    const upper = String(orderDir).toUpperCase();
    if (upper !== 'ASC' && upper !== 'DESC') {
      throw new ValidationError('Invalid orderDir value. Allowed: ASC, DESC');
    }
    dir = upper;
  }

  return { field, dir };
}

/**
 * Parse and clamp pagination parameters.
 * @param {*} page     requested page (1-based)
 * @param {*} pageSize requested page size
 * @param {number} [defaultPageSize=20]
 * @returns {{ page: number, pageSize: number, limit: number, offset: number }}
 */
export function parsePagination(page, pageSize, defaultPageSize = 20) {
  let p = parseInt(page, 10);
  if (!Number.isInteger(p) || p < 1) p = 1;

  let size = parseInt(pageSize, 10);
  if (!Number.isInteger(size) || size < 1) size = defaultPageSize;
  if (size > MAX_PAGE_SIZE) size = MAX_PAGE_SIZE;

  return { page: p, pageSize: size, limit: size, offset: (p - 1) * size };
}

/**
 * Validate that a value is a positive integer id. Returns the number or
 * throws a ValidationError (400).
 */
export function parseId(value, field = 'id') {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    throw new ValidationError(`${field} must be a positive integer`);
  }
  return num;
}

export default { parseOrder, parsePagination, parseId, MAX_PAGE_SIZE };

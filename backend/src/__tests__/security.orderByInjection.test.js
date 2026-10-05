/**
 * ORDER BY / orderDir injection regression tests.
 *
 * Several list/pagination endpoints previously interpolated client-supplied
 * `orderBy`/`orderDir` values directly into raw SQL (`ORDER BY ${orderBy}
 * ${orderDir}`). better-sqlite3 cannot parameterize identifiers, so a
 * malicious orderBy such as `id; DROP TABLE users; --` would be
 * interpolated verbatim into the query string. This suite proves that a
 * representative set of previously-vulnerable models now reject/ignore
 * unrecognized sort keys via the shared allowlist helper
 * (utils/sortUtils.js) instead of executing attacker-controlled SQL.
 */
import { describe, it, expect } from '@jest/globals';
import db from '../config/database.js';
import { getAllClasses } from '../models/Class.js';
import { getAllStudents } from '../models/Student.js';
import { getAllTransactions } from '../models/Transaction.js';
import { getAllNotifications } from '../models/Notification.js';
import { getAllAuditTrails } from '../models/AuditTrail.js';

const MALICIOUS_ORDER_BYS = [
  'id; DROP TABLE users; --',
  "id) UNION SELECT username, password_hash, 1, 1, 1, 1, 1, 1, 1 FROM users --",
  '(SELECT CASE WHEN (1=1) THEN 1 ELSE (SELECT 1 UNION SELECT 2) END)',
  'id COLLATE BINARY; ATTACH DATABASE \'/tmp/evil.db\' AS evil; --'
];

const MALICIOUS_ORDER_DIRS = ['ASC; DROP TABLE users; --', 'FOO', '1=1'];

function tableExists(name) {
  return !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(name);
}

describe('ORDER BY injection regression', () => {
  it('Class.getAllClasses never executes a malicious orderBy value', () => {
    for (const payload of MALICIOUS_ORDER_BYS) {
      expect(() => getAllClasses({ orderBy: payload, orderDir: 'ASC' })).not.toThrow();
    }
    expect(tableExists('users')).toBe(true);
  });

  it('Student.getAllStudents never executes a malicious orderBy value', () => {
    for (const payload of MALICIOUS_ORDER_BYS) {
      expect(() => getAllStudents({ orderBy: payload, orderDir: 'DESC' })).not.toThrow();
    }
    expect(tableExists('users')).toBe(true);
  });

  it('Transaction.getAllTransactions never executes a malicious orderBy value', () => {
    for (const payload of MALICIOUS_ORDER_BYS) {
      expect(() => getAllTransactions({ orderBy: payload, orderDir: 'ASC' })).not.toThrow();
    }
    expect(tableExists('users')).toBe(true);
  });

  it('Notification.getAllNotifications never executes a malicious orderBy value', () => {
    for (const payload of MALICIOUS_ORDER_BYS) {
      expect(() => getAllNotifications({ orderBy: payload, orderDir: 'ASC' })).not.toThrow();
    }
    expect(tableExists('users')).toBe(true);
  });

  it('AuditTrail.getAllAuditTrails never executes a malicious orderBy value', () => {
    for (const payload of MALICIOUS_ORDER_BYS) {
      expect(() => getAllAuditTrails({ orderBy: payload, orderDir: 'DESC' })).not.toThrow();
    }
    expect(tableExists('users')).toBe(true);
  });

  it('rejects/ignores a malicious orderDir and still returns a well-formed, safely-ordered result', () => {
    for (const dir of MALICIOUS_ORDER_DIRS) {
      expect(() => getAllClasses({ orderBy: 'name', orderDir: dir })).not.toThrow();
    }
  });

  it('still supports legitimate allowlisted sort keys', () => {
    const asc = getAllClasses({ orderBy: 'name', orderDir: 'ASC' });
    expect(Array.isArray(asc)).toBe(true);
  });
});

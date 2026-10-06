/**
 * Server-only audit event writer (specification §7).
 *
 * This is THE single internal path for creating audit evidence:
 * - Actors always come from the authenticated server-side identity
 *   (req.user), never from request headers or client-supplied bodies.
 * - There is intentionally NO client-facing API for creating, updating or
 *   deleting audit records; the audit_trail table is additionally protected
 *   by database triggers that reject UPDATE and DELETE.
 * - OWNER DECISION D13: cryptographic hash chaining is deliberately
 *   deferred. Every event is written through this single chokepoint so a
 *   hash-chain/checkpoint layer can later be added here without
 *   architectural rework.
 */
import db from '../config/database.js';
import { AUDIT_ACTIONS } from '../db/migrations.js';

/** Audit action taxonomy constants. */
export const AUDIT = Object.fromEntries(AUDIT_ACTIONS.map((a) => [a, a]));

const serialize = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

/**
 * Record an audit event. Never throws into the caller's main flow —
 * financial operations that are part of a database transaction should use
 * recordAuditEventStrict instead so a failed audit write rolls the
 * operation back.
 */
export function recordAuditEvent(event) {
  try {
    return recordAuditEventStrict(event);
  } catch (error) {
    // Deliberately logged, never rethrown: auditing a login failure must
    // not turn into a 500 for the client.
    console.error('Audit write failed:', error.message);
    return null;
  }
}

/**
 * Record an audit event, throwing on failure. Use inside financial
 * transactions so "no audit row" implies "operation rolled back".
 */
export function recordAuditEventStrict({
  action,
  tableName,
  recordId = null,
  oldValues = null,
  newValues = null,
  userId = null,
  ipAddress = null,
  userAgent = null,
  actor = null
}) {
  if (!AUDIT_ACTIONS.includes(action)) {
    throw new Error(`Unknown audit action: ${action}`);
  }
  const effectiveUserId = actor?.id ?? userId ?? null;
  const result = db.prepare(`
    INSERT INTO audit_trail (action, table_name, record_id, old_values, new_values, user_id, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    action,
    tableName,
    recordId,
    serialize(oldValues),
    serialize(newValues),
    effectiveUserId,
    ipAddress,
    userAgent
  );
  return result.lastInsertRowid;
}

/** Convenience: build actor/request metadata from an Express request. */
export function auditContext(req) {
  return {
    actor: req.user ?? null,
    userId: req.user?.id ?? null,
    ipAddress: req.ip ?? null,
    userAgent: req.get?.('user-agent') ?? null
  };
}

export default { AUDIT, recordAuditEvent, recordAuditEventStrict, auditContext };

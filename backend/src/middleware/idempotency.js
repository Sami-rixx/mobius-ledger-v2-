import crypto from 'crypto';
import db from '../config/database.js';

/**
 * Idempotency-Key enforcement for money-moving POST endpoints (owner
 * decision 8, P0): replaying a request with a previously-used key must
 * return the original outcome rather than performing the side effect
 * again (e.g. a mobile client retrying a payment POST after a dropped
 * response must never double-post the payment).
 *
 * Storage: the `idempotency_keys` table (migration 002). Scoped per
 * (idempotency_key, route, user_id) so two different users - or the same
 * user calling two different endpoints - can never collide on the same
 * key value. `user_id` always comes from the server-trusted `req.user`
 * (never client input), consistent with the rest of the auth model.
 *
 * Usage: mount as the last middleware before the route handler on any
 * POST that creates/mutates a financial record, e.g.
 *   router.post('/', requirePermission('income.create'), requireIdempotencyKey, createIncome);
 */

const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
const MAX_KEY_LENGTH = 200;
// If a request died mid-flight (process crash/restart) before it could
// finalize its idempotency_keys row, don't let that row permanently block
// retries forever - treat anything stuck "in_progress" longer than this as
// abandoned and allow a fresh attempt.
const STALE_IN_PROGRESS_MS = 2 * 60 * 1000;

function hashRequest(req) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ method: req.method, path: req.originalUrl, body: req.body || {} }))
    .digest('hex');
}

function routeIdentifier(req) {
  // req.baseUrl + the matched route path gives a stable identifier
  // ("/api/income" + "/") independent of query strings or path params'
  // concrete values, so distinct logical endpoints never share a key space.
  const routePath = req.route && req.route.path ? req.route.path : req.path;
  return `${req.baseUrl || ''}${routePath}`;
}

function isStale(row) {
  if (row.status !== 'in_progress') return false;
  const createdAtMs = new Date(row.created_at + 'Z').getTime();
  if (Number.isNaN(createdAtMs)) return false;
  return Date.now() - createdAtMs > STALE_IN_PROGRESS_MS;
}

/**
 * requireIdempotencyKey - rejects the request unless a well-formed
 * Idempotency-Key header is present, then either replays a previously
 * completed response, rejects a conflicting reuse of the same key with a
 * different payload, or lets the request proceed and records its outcome.
 */
export function requireIdempotencyKey(req, res, next) {
  const key = req.get(IDEMPOTENCY_KEY_HEADER);

  if (!key || typeof key !== 'string' || !key.trim()) {
    return res.status(400).json({
      success: false,
      error: 'An Idempotency-Key header is required for this operation'
    });
  }
  if (key.length > MAX_KEY_LENGTH) {
    return res.status(400).json({ success: false, error: 'Idempotency-Key is too long' });
  }

  const userId = req.user && req.user.id ? req.user.id : null;
  const route = routeIdentifier(req);
  const requestHash = hashRequest(req);

  const findExisting = () => db.prepare(`
    SELECT * FROM idempotency_keys
    WHERE idempotency_key = ? AND route = ?
      AND ((user_id IS NULL AND ? IS NULL) OR user_id = ?)
  `).get(key, route, userId, userId);

  let existing = findExisting();

  if (existing && isStale(existing)) {
    db.prepare(`
      UPDATE idempotency_keys
      SET status = 'failed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'in_progress'
    `).run(existing.id);
    existing = findExisting();
  }

  if (existing) {
    if (existing.request_hash !== requestHash) {
      return res.status(409).json({
        success: false,
        error: 'This Idempotency-Key was already used with a different request payload'
      });
    }

    if (existing.status === 'completed') {
      res.setHeader('Idempotent-Replay', 'true');
      let body = {};
      try {
        body = existing.response_body ? JSON.parse(existing.response_body) : {};
      } catch {
        body = {};
      }
      return res.status(existing.response_status || 200).json(body);
    }

    if (existing.status === 'in_progress') {
      return res.status(409).json({
        success: false,
        error: 'A request with this Idempotency-Key is still being processed'
      });
    }

    // status === 'failed': the previous attempt did not complete
    // successfully (e.g. validation error) and the client is retrying
    // with the exact same payload - allow it to proceed again, reusing
    // the existing row rather than hitting the UNIQUE constraint.
    db.prepare(`
      UPDATE idempotency_keys
      SET status = 'in_progress', response_status = NULL, response_body = NULL, completed_at = NULL
      WHERE id = ?
    `).run(existing.id);
    req.idempotencyRecordId = existing.id;
  } else {
    try {
      const inserted = db.prepare(`
        INSERT INTO idempotency_keys (idempotency_key, user_id, method, route, request_hash, status)
        VALUES (?, ?, ?, ?, ?, 'in_progress')
      `).run(key, userId, req.method, route, requestHash);
      req.idempotencyRecordId = inserted.lastInsertRowid;
    } catch (err) {
      // A concurrent request already inserted the same key between our
      // SELECT and INSERT - treat it the same as "already in progress".
      if (err && err.code && String(err.code).includes('CONSTRAINT')) {
        return res.status(409).json({
          success: false,
          error: 'A request with this Idempotency-Key is still being processed'
        });
      }
      throw err;
    }
  }

  const recordId = req.idempotencyRecordId;
  const finalize = (status, body) => {
    try {
      db.prepare(`
        UPDATE idempotency_keys
        SET status = ?, response_status = ?, response_body = ?, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, res.statusCode, JSON.stringify(body === undefined ? null : body), recordId);
    } catch (e) {
      // Best-effort bookkeeping only - never let this break the actual
      // response that has already been (or is about to be) sent.
      console.error('Failed to persist idempotency-key outcome:', e.message);
    }
  };

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const succeeded = res.statusCode >= 200 && res.statusCode < 300;
    finalize(succeeded ? 'completed' : 'failed', body);
    return originalJson(body);
  };

  next();
}

export default requireIdempotencyKey;

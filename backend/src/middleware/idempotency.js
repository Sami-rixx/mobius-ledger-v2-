/**
 * Idempotency-Key middleware (OWNER DECISION D9 — P0).
 *
 * Money-moving POST endpoints require an Idempotency-Key header. Replaying
 * the same valid key returns the ORIGINAL stored response and never creates
 * duplicate financial records or side effects. Reusing a key with a
 * different request body is rejected with 409.
 */
import crypto from 'crypto';
import db from '../config/database.js';

const KEY_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

/** Retention window for stored keys (purged lazily). */
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

function hashRequest(req) {
  const canonical = JSON.stringify({ body: req.body ?? null });
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

function purgeExpired() {
  try {
    db.prepare("DELETE FROM idempotency_keys WHERE created_at < datetime('now', ?)")
      .run(`-${Math.floor(RETENTION_MS / 1000)} seconds`);
  } catch {
    /* table may not exist yet during very early boot — ignore */
  }
}

/**
 * Factory: idempotency middleware. When `required` is true (money-moving
 * POSTs), a missing key is a 400. When false, keys are honored when present.
 */
export function idempotency({ required = true } = {}) {
  return (req, res, next) => {
    if (req.method !== 'POST') return next();

    const key = req.get('idempotency-key');
    if (!key) {
      if (!required) return next();
      return res.status(400).json({
        success: false,
        error: true,
        message: 'Idempotency-Key header is required for this operation'
      });
    }

    if (!KEY_PATTERN.test(key)) {
      return res.status(400).json({
        success: false,
        error: true,
        message: 'Idempotency-Key must be 8-128 characters of [A-Za-z0-9_-]'
      });
    }

    if (!req.user?.id) {
      // Idempotency storage is scoped per authenticated user.
      return res.status(401).json({ success: false, error: true, message: 'Authentication required' });
    }

    purgeExpired();

    const requestHash = hashRequest(req);
    const scope = {
      userId: req.user.id,
      method: req.method,
      // baseUrl + path so the same key can be reused across different endpoints
      path: `${req.baseUrl}${req.path}`
    };

    const existing = db.prepare(`
      SELECT * FROM idempotency_keys WHERE user_id = ? AND method = ? AND path = ? AND key = ?
    `).get(scope.userId, scope.method, scope.path, key);

    if (existing) {
      if (existing.request_hash !== requestHash) {
        return res.status(409).json({
          success: false,
          error: true,
          message: 'Idempotency-Key was already used with a different request body'
        });
      }
      if (existing.status === 'completed') {
        res.set('Idempotency-Replayed', 'true');
        res.status(existing.response_status);
        return res.type('application/json').send(existing.response_body);
      }
      // A previous attempt with this key is still in flight (or crashed
      // before completion). Ask the client to retry.
      return res.status(409).json({
        success: false,
        error: true,
        message: 'A request with this Idempotency-Key is already in progress. Retry shortly.'
      });
    }

    try {
      db.prepare(`
        INSERT INTO idempotency_keys (key, user_id, method, path, request_hash, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `).run(key, scope.userId, scope.method, scope.path, requestHash);
    } catch (error) {
      // Lost a race with a concurrent identical request.
      return res.status(409).json({
        success: false,
        error: true,
        message: 'A request with this Idempotency-Key is already in progress. Retry shortly.'
      });
    }

    // Capture the response body so replays can return it verbatim. Only
    // 2xx responses are stored as completed; failures release the key so
    // the client can retry with the same key.
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          db.prepare(`
            UPDATE idempotency_keys
            SET status = 'completed', response_status = ?, response_body = ?, completed_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND method = ? AND path = ? AND key = ?
          `).run(res.statusCode, JSON.stringify(body), scope.userId, scope.method, scope.path, key);
        } else {
          db.prepare(`
            DELETE FROM idempotency_keys WHERE user_id = ? AND method = ? AND path = ? AND key = ? AND status = 'pending'
          `).run(scope.userId, scope.method, scope.path, key);
        }
      } catch (error) {
        console.error('Idempotency bookkeeping failed:', error.message);
      }
      return originalJson(body);
    };

    return next();
  };
}

export default { idempotency };

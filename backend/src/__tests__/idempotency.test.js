import { describe, test, expect, beforeAll } from '@jest/globals';
import crypto from 'crypto';

// Use the real db singleton (see schoolFee.test.js for why) since the
// middleware under test reads/writes through config/database.js directly.
import db from '../config/database.js';
import { requireIdempotencyKey } from '../middleware/idempotency.js';

function makeReq({ key, userId = 1, body = { amount: 100 }, path = '/', route, baseUrl = '/api/test-idempotency' } = {}) {
  const headers = key !== undefined ? { 'idempotency-key': key } : {};
  return {
    method: 'POST',
    originalUrl: `${baseUrl}${path}`,
    baseUrl,
    path,
    route: { path: route !== undefined ? route : path },
    body,
    user: userId !== null ? { id: userId } : undefined,
    get(name) {
      return headers[name.toLowerCase()];
    }
  };
}

function makeRes() {
  const res = {
    statusCode: 200,
    _body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
    setHeader() {}
  };
  return res;
}

describe('requireIdempotencyKey middleware', () => {
  beforeAll(() => {
    // Sanity check that migration 002 actually created the table this
    // middleware depends on.
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='idempotency_keys'").get();
    expect(row).toBeDefined();
  });

  test('rejects a request with no Idempotency-Key header', () => {
    const req = makeReq({ key: undefined });
    const res = makeRes();
    let nextCalled = false;
    requireIdempotencyKey(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res._body.success).toBe(false);
  });

  test('rejects an empty/whitespace Idempotency-Key header', () => {
    const req = makeReq({ key: '   ' });
    const res = makeRes();
    let nextCalled = false;
    requireIdempotencyKey(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
  });

  test('allows the first request through and persists its outcome', () => {
    const key = `idem-first-${Date.now()}`;
    const req = makeReq({ key, path: '/first' });
    const res = makeRes();
    let handlerRuns = 0;

    requireIdempotencyKey(req, res, () => {
      handlerRuns += 1;
      res.status(201).json({ success: true, data: { id: 42 } });
    });

    expect(handlerRuns).toBe(1);
    expect(res.statusCode).toBe(201);
    expect(res._body).toEqual({ success: true, data: { id: 42 } });

    const row = db.prepare(
      'SELECT * FROM idempotency_keys WHERE idempotency_key = ? AND route = ?'
    ).get(key, '/api/test-idempotency/first');
    expect(row).toBeDefined();
    expect(row.status).toBe('completed');
    expect(row.response_status).toBe(201);
  });

  test('replays the stored response on key reuse without re-running the handler (no duplicate side effect)', () => {
    const key = `idem-replay-${Date.now()}`;
    let handlerRuns = 0;

    const run = () => {
      const req = makeReq({ key, path: '/replay' });
      const res = makeRes();
      requireIdempotencyKey(req, res, () => {
        handlerRuns += 1;
        res.status(201).json({ success: true, data: { id: 'created-once' } });
      });
      return res;
    };

    const first = run();
    const second = run();

    // The handler (i.e. the thing that would actually insert a financial
    // record) must only have executed once, even though the middleware
    // was invoked twice with the same key.
    expect(handlerRuns).toBe(1);
    expect(second.statusCode).toBe(first.statusCode);
    expect(second._body).toEqual(first._body);
  });

  test('rejects reusing the same key with a different request payload', () => {
    const key = `idem-conflict-${Date.now()}`;

    const req1 = makeReq({ key, path: '/conflict', body: { amount: 100 } });
    const res1 = makeRes();
    requireIdempotencyKey(req1, res1, () => {
      res1.status(201).json({ success: true });
    });
    expect(res1.statusCode).toBe(201);

    const req2 = makeReq({ key, path: '/conflict', body: { amount: 999 } });
    const res2 = makeRes();
    let nextCalled = false;
    requireIdempotencyKey(req2, res2, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res2.statusCode).toBe(409);
    expect(res2._body.success).toBe(false);
  });

  test('scopes keys per user - two different users may safely reuse the same key value', () => {
    const key = `idem-peruser-${Date.now()}`;
    let runsForUserA = 0;
    let runsForUserB = 0;

    const reqA = makeReq({ key, path: '/peruser', userId: 101 });
    const resA = makeRes();
    requireIdempotencyKey(reqA, resA, () => {
      runsForUserA += 1;
      resA.status(201).json({ success: true, owner: 'A' });
    });

    const reqB = makeReq({ key, path: '/peruser', userId: 202 });
    const resB = makeRes();
    requireIdempotencyKey(reqB, resB, () => {
      runsForUserB += 1;
      resB.status(201).json({ success: true, owner: 'B' });
    });

    expect(runsForUserA).toBe(1);
    expect(runsForUserB).toBe(1);
    expect(resA._body.owner).toBe('A');
    expect(resB._body.owner).toBe('B');
  });

  test('allows a clean retry after a previous attempt with the same key failed', () => {
    const key = `idem-retry-after-failure-${Date.now()}`;
    const body = { amount: 50 };

    const req1 = makeReq({ key, path: '/retry', body });
    const res1 = makeRes();
    requireIdempotencyKey(req1, res1, () => {
      res1.status(400).json({ success: false, error: 'Validation failed' });
    });
    expect(res1.statusCode).toBe(400);

    let secondHandlerRan = false;
    const req2 = makeReq({ key, path: '/retry', body });
    const res2 = makeRes();
    requireIdempotencyKey(req2, res2, () => {
      secondHandlerRan = true;
      res2.status(201).json({ success: true, data: { id: 'created-on-retry' } });
    });

    expect(secondHandlerRan).toBe(true);
    expect(res2.statusCode).toBe(201);
  });

  test('treats a stuck in_progress row older than the staleness window as abandoned and allows retry', () => {
    const key = `idem-stale-${Date.now()}`;
    const route = '/api/test-idempotency/stale';
    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ method: 'POST', path: route, body: { amount: 1 } }))
      .digest('hex');

    db.prepare(`
      INSERT INTO idempotency_keys (idempotency_key, user_id, method, route, request_hash, status, created_at)
      VALUES (?, ?, 'POST', ?, ?, 'in_progress', datetime('now', '-10 minutes'))
    `).run(key, 1, route, requestHash);

    let handlerRan = false;
    const req = makeReq({ key, path: '/stale', body: { amount: 1 } });
    const res = makeRes();
    requireIdempotencyKey(req, res, () => {
      handlerRan = true;
      res.status(201).json({ success: true });
    });

    expect(handlerRan).toBe(true);
    expect(res.statusCode).toBe(201);
  });

  test('rejects a concurrent request while the first is still genuinely in progress', () => {
    const key = `idem-inflight-${Date.now()}`;
    const req1 = makeReq({ key, path: '/inflight' });
    const res1 = makeRes();

    // Don't call res.json() inside the handler - simulates a request that
    // is still being processed (row stays 'in_progress').
    requireIdempotencyKey(req1, res1, () => {});

    const req2 = makeReq({ key, path: '/inflight' });
    const res2 = makeRes();
    let nextCalled = false;
    requireIdempotencyKey(req2, res2, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res2.statusCode).toBe(409);
  });
});

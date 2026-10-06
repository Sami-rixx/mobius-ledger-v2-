/**
 * Security integration tests (specification §18).
 *
 * Exercises the real Express app over HTTP (supertest): authentication
 * perimeter, authorization matrix (allow AND deny), session lifecycle,
 * CSRF, maker-checker, posted-record immutability + reversals,
 * idempotency replay, ORDER BY injection, pagination bounds, audit
 * immutability and error-leakage containment.
 */
import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import db from '../config/database.js';
import { hashPassword } from '../services/passwordService.js';

const CSRF = ['X-Requested-With', 'XMLHttpRequest'];
const PASSWORD = 'S3curely-Long-Passw0rd!';

/** username -> { id, cookie } */
const actors = {};

async function createUserWithRole(username, roleName) {
  const passwordHash = await hashPassword(PASSWORD);
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  let userId;
  if (existing) {
    userId = existing.id;
    db.prepare('UPDATE users SET password_hash = ?, is_active = 1 WHERE id = ?').run(passwordHash, userId);
  } else {
    userId = db.prepare(`
      INSERT INTO users (username, full_name, email, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(username, `Sec ${username}`, `${username}@test.local`, passwordHash, roleName).lastInsertRowid;
  }
  const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName);
  expect(role).toBeDefined();
  db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(userId);
  db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, role.id);
  return userId;
}

async function loginAs(username) {
  const res = await request(app)
    .post('/api/auth/login')
    .set(...CSRF)
    .send({ username, password: PASSWORD });
  expect(res.status).toBe(200);
  const cookie = res.headers['set-cookie'].find((c) => c.startsWith('ml_session='));
  expect(cookie).toBeDefined();
  return cookie.split(';')[0];
}

let incomeCategoryId;
let expenseCategoryId;

beforeAll(async () => {
  for (const [username, role] of [
    ['sec_admin', 'admin'],
    ['sec_director', 'director'],
    ['sec_finance', 'finance_officer'],
    ['sec_clerk', 'clerk'],
    ['sec_auditor', 'auditor'],
    ['sec_viewer', 'viewer'],
    ['sec_disabled', 'viewer']
  ]) {
    actors[username] = { id: await createUserWithRole(username, role) };
  }
  for (const username of Object.keys(actors)) {
    if (username === 'sec_disabled') continue;
    actors[username].cookie = await loginAs(username);
  }

  incomeCategoryId = db.prepare(`
    INSERT INTO income_categories (name, description, created_by, updated_by)
    VALUES ('SEC Income Cat', 'security tests', ?, ?)
  `).run(actors.sec_admin.id, actors.sec_admin.id).lastInsertRowid;
  expenseCategoryId = db.prepare(`
    INSERT INTO expense_categories (name, description, created_by, updated_by)
    VALUES ('SEC Expense Cat', 'security tests', ?, ?)
  `).run(actors.sec_admin.id, actors.sec_admin.id).lastInsertRowid;
});

const incomePayload = () => ({
  incomeCategoryId,
  amount: 123.45,
  payerName: 'Sec Payer',
  incomeDate: '2026-01-15',
  description: 'security test income'
});

describe('Authentication perimeter', () => {
  it('rejects every /api request without a session cookie (401), except public paths', async () => {
    for (const path of ['/api/income', '/api/students', '/api/audit-trail', '/api/users', '/api/import-export/backups']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    }
  });

  it('keeps /api/health public', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('rejects login with wrong password (401, generic message) and audits LOGIN_FAILURE', async () => {
    const before = db.prepare("SELECT COUNT(*) c FROM audit_trail WHERE action = 'LOGIN_FAILURE'").get().c;
    const res = await request(app).post('/api/auth/login').set(...CSRF)
      .send({ username: 'sec_viewer', password: 'wrong-password-123' });
    expect(res.status).toBe(401);
    expect(JSON.stringify(res.body)).not.toMatch(/sqlite|SQL|argon2/i);
    const after = db.prepare("SELECT COUNT(*) c FROM audit_trail WHERE action = 'LOGIN_FAILURE'").get().c;
    expect(after).toBe(before + 1);
  });

  it('rejects login for a user whose account has no password (NULL hash)', async () => {
    db.prepare(`INSERT OR IGNORE INTO users (username, full_name, is_active) VALUES ('sec_nopass', 'No Password', 1)`).run();
    const res = await request(app).post('/api/auth/login').set(...CSRF)
      .send({ username: 'sec_nopass', password: '' });
    expect(res.status).toBe(401);
  });

  it('never returns the session token in a response body', async () => {
    const res = await request(app).post('/api/auth/login').set(...CSRF)
      .send({ username: 'sec_viewer', password: PASSWORD });
    expect(res.status).toBe(200);
    const raw = res.headers['set-cookie'].find((c) => c.startsWith('ml_session=')).split(';')[0].split('=')[1];
    expect(JSON.stringify(res.body)).not.toContain(raw);
    // Cookie flags
    const full = res.headers['set-cookie'].find((c) => c.startsWith('ml_session='));
    expect(full).toMatch(/HttpOnly/i);
    expect(full).toMatch(/SameSite=Lax/i);
    // Token is stored only as a hash, never in plaintext
    const stored = db.prepare('SELECT session_token, token_hash FROM user_sessions ORDER BY id DESC LIMIT 1').get();
    expect(stored.session_token).not.toBe(raw);
    expect(stored.token_hash).not.toBe(raw);
  });

  it('returns 401 for a disabled user even with a previously valid session', async () => {
    actors.sec_disabled.cookie = await loginAs('sec_disabled');
    db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(actors.sec_disabled.id);
    const res = await request(app).get('/api/auth/me').set('Cookie', actors.sec_disabled.cookie);
    expect(res.status).toBe(401);
  });

  it('returns 401 after logout (session revoked server-side)', async () => {
    const cookie = await loginAs('sec_viewer');
    const out = await request(app).post('/api/auth/logout').set(...CSRF).set('Cookie', cookie);
    expect(out.status).toBe(200);
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(res.status).toBe(401);
  });

  it('rejects a forged session token', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Cookie', `ml_session=${'a'.repeat(64)}`);
    expect(res.status).toBe(401);
  });

  it('caps concurrent sessions at 5 per user', async () => {
    const cookies = [];
    for (let i = 0; i < 6; i++) cookies.push(await loginAs('sec_clerk'));
    const active = db.prepare(
      'SELECT COUNT(*) c FROM user_sessions WHERE user_id = ? AND is_active = 1'
    ).get(actors.sec_clerk.id).c;
    expect(active).toBeLessThanOrEqual(5);
    // Oldest cookie must have been revoked
    const res = await request(app).get('/api/auth/me').set('Cookie', cookies[0]);
    expect(res.status).toBe(401);
    // refresh clerk cookie for later tests
    actors.sec_clerk.cookie = cookies[cookies.length - 1];
  });
});

describe('CSRF protection', () => {
  it('rejects state-changing requests without X-Requested-With (403)', async () => {
    const res = await request(app).post('/api/income')
      .set('Cookie', actors.sec_finance.cookie)
      .send(incomePayload());
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/X-Requested-With/);
  });
});

describe('Authorization matrix (route x role)', () => {
  it('viewer: can read income, cannot create (403)', async () => {
    const read = await request(app).get('/api/income').set('Cookie', actors.sec_viewer.cookie);
    expect(read.status).toBe(200);
    const write = await request(app).post('/api/income').set(...CSRF)
      .set('Cookie', actors.sec_viewer.cookie)
      .set('Idempotency-Key', `sec-${Date.now()}-v`) 
      .send(incomePayload());
    expect(write.status).toBe(403);
  });

  it('viewer: cannot read the audit trail (403), auditor can (200)', async () => {
    const viewer = await request(app).get('/api/audit-trail').set('Cookie', actors.sec_viewer.cookie);
    expect(viewer.status).toBe(403);
    const auditor = await request(app).get('/api/audit-trail').set('Cookie', actors.sec_auditor.cookie);
    expect(auditor.status).toBe(200);
  });

  it('clerk: cannot access user management or sessions admin (403)', async () => {
    for (const path of ['/api/users', '/api/user-sessions']) {
      const res = await request(app).get(path).set('Cookie', actors.sec_clerk.cookie);
      expect(res.status).toBe(403);
    }
  });

  it('admin: can list sessions (200) and the listing never exposes tokens', async () => {
    const res = await request(app).get('/api/user-sessions').set('Cookie', actors.sec_admin.cookie);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/session_token|token_hash/);
  });

  it('clerk: cannot export the database or list backups (403)', async () => {
    const res = await request(app).get('/api/import-export/backups').set('Cookie', actors.sec_clerk.cookie);
    expect(res.status).toBe(403);
  });

  it('finance officer: cannot restore the database (403, admin-only)', async () => {
    const res = await request(app).post('/api/import-export/restore').set(...CSRF)
      .set('Cookie', actors.sec_finance.cookie)
      .send({ filename: 'nope.db', confirm: 'nope.db' });
    expect(res.status).toBe(403);
  });

  it('client-supplied x-user-id header does not change the audited actor', async () => {
    const res = await request(app).post('/api/income').set(...CSRF)
      .set('Cookie', actors.sec_finance.cookie)
      .set('Idempotency-Key', `sec-actor-${Date.now()}`)
      .set('x-user-id', String(actors.sec_admin.id))
      .send(incomePayload());
    expect(res.status).toBe(201);
    const audit = db.prepare(
      "SELECT user_id FROM audit_trail WHERE table_name = 'income' AND record_id = ? AND action = 'CREATE'"
    ).get(res.body.data.id);
    expect(audit.user_id).toBe(actors.sec_finance.id);
  });

  it('audit trail API is read-only: POST /api/audit-trail no longer exists', async () => {
    const res = await request(app).post('/api/audit-trail').set(...CSRF)
      .set('Cookie', actors.sec_admin.cookie)
      .send({ action: 'DELETE', tableName: 'income', recordId: 1 });
    expect([404, 405]).toContain(res.status);
  });
});

describe('Idempotency (money-moving POSTs)', () => {
  it('requires an Idempotency-Key on POST /api/income (400 without)', async () => {
    const res = await request(app).post('/api/income').set(...CSRF)
      .set('Cookie', actors.sec_finance.cookie)
      .send(incomePayload());
    expect(res.status).toBe(400);
    expect(res.body.message || res.body.error).toMatch(/Idempotency-Key/i);
  });

  it('replaying the same Idempotency-Key does not create a duplicate record', async () => {
    const key = `sec-replay-${Date.now()}`;
    const first = await request(app).post('/api/income').set(...CSRF)
      .set('Cookie', actors.sec_finance.cookie)
      .set('Idempotency-Key', key)
      .send(incomePayload());
    expect(first.status).toBe(201);

    const countBefore = db.prepare('SELECT COUNT(*) c FROM income').get().c;
    const replay = await request(app).post('/api/income').set(...CSRF)
      .set('Cookie', actors.sec_finance.cookie)
      .set('Idempotency-Key', key)
      .send(incomePayload());
    expect(replay.status).toBe(first.status);
    expect(replay.body.data.id).toBe(first.body.data.id);
    const countAfter = db.prepare('SELECT COUNT(*) c FROM income').get().c;
    expect(countAfter).toBe(countBefore);
  });
});

describe('Financial integrity over HTTP', () => {
  let postedIncomeId;

  it('creating income atomically creates a linked transaction with amount_cents', async () => {
    const res = await request(app).post('/api/income').set(...CSRF)
      .set('Cookie', actors.sec_finance.cookie)
      .set('Idempotency-Key', `sec-fin-${Date.now()}`)
      .send(incomePayload());
    expect(res.status).toBe(201);
    postedIncomeId = res.body.data.id;
    const row = db.prepare('SELECT * FROM income WHERE id = ?').get(postedIncomeId);
    expect(row.transaction_id).toBeTruthy();
    expect(row.amount_cents).toBe(12345);
    const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(row.transaction_id);
    expect(txn.amount_cents).toBe(12345);
  });

  it('refuses to hard-delete posted income (409)', async () => {
    const res = await request(app).delete(`/api/income/${postedIncomeId}`).set(...CSRF)
      .set('Cookie', actors.sec_finance.cookie);
    expect(res.status).toBe(409);
    expect(db.prepare('SELECT id FROM income WHERE id = ?').get(postedIncomeId)).toBeDefined();
  });

  it('refuses to change a posted amount via PUT (409)', async () => {
    const res = await request(app).put(`/api/income/${postedIncomeId}`).set(...CSRF)
      .set('Cookie', actors.sec_finance.cookie)
      .send({ amount: 999.99 });
    expect(res.status).toBe(409);
  });

  it('reversal creates a compensating record and preserves the original', async () => {
    const res = await request(app).post(`/api/income/${postedIncomeId}/reverse`).set(...CSRF)
      .set('Cookie', actors.sec_finance.cookie)
      .send({ reason: 'entered twice' });
    expect(res.status).toBe(201);
    const reversal = res.body.data.reversal;
    expect(parseFloat(reversal.amount)).toBeCloseTo(-123.45);
    const original = db.prepare('SELECT * FROM income WHERE id = ?').get(postedIncomeId);
    expect(original.reversed_by_id).toBe(reversal.id);
    // double reversal rejected
    const again = await request(app).post(`/api/income/${postedIncomeId}/reverse`).set(...CSRF)
      .set('Cookie', actors.sec_finance.cookie)
      .send({ reason: 'again' });
    expect(again.status).toBe(409);
  });

  it('viewer cannot reverse income (403)', async () => {
    const res = await request(app).post(`/api/income/${postedIncomeId}/reverse`).set(...CSRF)
      .set('Cookie', actors.sec_viewer.cookie)
      .send({ reason: 'nope' });
    expect(res.status).toBe(403);
  });
});

describe('Maker-checker over HTTP', () => {
  async function createWithdrawal(cookie) {
    const res = await request(app).post('/api/withdrawals').set(...CSRF)
      .set('Cookie', cookie)
      .set('Idempotency-Key', `sec-wd-${Date.now()}-${Math.floor(Math.random() * 1e9)}`)
      .send({ amount: 500, purpose: 'Sec test withdrawal', recipientName: 'Director X' });
    expect(res.status).toBe(201);
    return res.body.data.id;
  }

  it('creator cannot approve their own withdrawal (403), another director can', async () => {
    const id = await createWithdrawal(actors.sec_director.cookie);
    const self = await request(app).post(`/api/withdrawals/${id}/approve`).set(...CSRF)
      .set('Cookie', actors.sec_director.cookie)
      .send({ notes: 'self approve attempt' });
    expect(self.status).toBe(403);

    const other = await request(app).post(`/api/withdrawals/${id}/approve`).set(...CSRF)
      .set('Cookie', actors.sec_admin.cookie)
      .send({ notes: 'ok' });
    expect(other.status).toBe(200);
    expect(other.body.data.transaction_id).toBeTruthy();
    const audit = db.prepare(
      "SELECT user_id FROM audit_trail WHERE action = 'WITHDRAWAL_APPROVED' AND record_id = ?"
    ).get(id);
    expect(audit.user_id).toBe(actors.sec_admin.id);
  });

  it('clerk cannot approve withdrawals at all (403 by permission)', async () => {
    const id = await createWithdrawal(actors.sec_finance.cookie);
    const res = await request(app).post(`/api/withdrawals/${id}/approve`).set(...CSRF)
      .set('Cookie', actors.sec_clerk.cookie)
      .send({});
    expect(res.status).toBe(403);
  });

  it('status cannot be smuggled through the generic update endpoint', async () => {
    const id = await createWithdrawal(actors.sec_finance.cookie);
    const res = await request(app).put(`/api/withdrawals/${id}`).set(...CSRF)
      .set('Cookie', actors.sec_finance.cookie)
      .send({ status: 'approved' });
    expect([400, 403]).toContain(res.status);
    const row = db.prepare('SELECT status FROM director_withdrawals WHERE id = ?').get(id);
    expect(row.status).toBe('pending');
  });
});

describe('Injection and abuse resistance', () => {
  it('rejects unknown ORDER BY fields with 400 (no silent fallback)', async () => {
    const res = await request(app)
      .get('/api/income?orderBy=amount;DROP TABLE income--')
      .set('Cookie', actors.sec_viewer.cookie);
    expect(res.status).toBe(400);
    expect(db.prepare("SELECT name FROM sqlite_master WHERE name='income'").get()).toBeDefined();
  });

  it('rejects unknown orderDir with 400', async () => {
    const res = await request(app)
      .get(`/api/income?orderDir=${encodeURIComponent('ASC) ; --')}`)
      .set('Cookie', actors.sec_viewer.cookie);
    expect(res.status).toBe(400);
  });

  it('bounds pageSize at 100 (oversized requests rejected)', async () => {
    const over = await request(app)
      .get('/api/income?page=1&pageSize=100000')
      .set('Cookie', actors.sec_viewer.cookie);
    expect(over.status).toBe(400);

    const ok = await request(app)
      .get('/api/income?page=1&pageSize=100')
      .set('Cookie', actors.sec_viewer.cookie);
    expect(ok.status).toBe(200);
    expect((ok.body.data || []).length).toBeLessThanOrEqual(100);
  });

  it('does not leak SQL/SQLite/path details in error responses', async () => {
    const res = await request(app).post('/api/income').set(...CSRF)
      .set('Cookie', actors.sec_finance.cookie)
      .set('Idempotency-Key', `sec-err-${Date.now()}`)
      .send({ incomeCategoryId: 99999999, amount: 10, payerName: 'X', incomeDate: '2026-01-01' });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(res.body)).not.toMatch(/sqlite|SQLITE_|FOREIGN KEY|\.db\b|\/home\//i);
  });
});

describe('Audit trail immutability (SQLite triggers)', () => {
  it('rejects UPDATE on audit_trail rows', () => {
    const row = db.prepare('SELECT id FROM audit_trail ORDER BY id DESC LIMIT 1').get();
    expect(row).toBeDefined();
    expect(() => db.prepare('UPDATE audit_trail SET action = ? WHERE id = ?').run('CREATE', row.id))
      .toThrow(/immutable|audit/i);
  });

  it('rejects DELETE on audit_trail rows', () => {
    const row = db.prepare('SELECT id FROM audit_trail ORDER BY id DESC LIMIT 1').get();
    expect(() => db.prepare('DELETE FROM audit_trail WHERE id = ?').run(row.id))
      .toThrow(/immutable|audit/i);
  });
});

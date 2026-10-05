/**
 * Creates the idempotency_keys table used to make money-moving POST
 * operations safe to retry (mobile/flaky-connectivity clients may submit
 * the same request twice). See backend/src/middleware/idempotency.js.
 */
export default {
  id: '002_idempotency_keys',
  description: 'Create idempotency_keys table for safe POST retries',
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idempotency_key TEXT NOT NULL,
        user_id INTEGER,
        method TEXT NOT NULL,
        route TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'failed')),
        response_status INTEGER,
        response_body TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        UNIQUE(idempotency_key, route, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_idempotency_keys_lookup ON idempotency_keys(idempotency_key, route, user_id);
      CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at);
    `);
  }
};

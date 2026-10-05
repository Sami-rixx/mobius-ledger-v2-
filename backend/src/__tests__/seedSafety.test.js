import { describe, test, expect } from '@jest/globals';
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_SCRIPT = path.resolve(__dirname, '../../../database/seed.js');

/**
 * database/seed.js is a DESTRUCTIVE demo-data script (deletes transactions,
 * students, withdrawals, audit trail entries, etc. before inserting
 * fabricated data). It must refuse to run at all when NODE_ENV=production,
 * regardless of how it's invoked - see the task's "db:seed must never run
 * destructively under NODE_ENV=production" requirement.
 */
describe('database/seed.js production safety guard', () => {
  test('refuses to run (non-zero exit, no DB file touched) when NODE_ENV=production', () => {
    const tmpDbPath = path.join(os.tmpdir(), `mobius-seed-guard-test-${Date.now()}.db`);
    expect(fs.existsSync(tmpDbPath)).toBe(false);

    const result = spawnSync('node', [SEED_SCRIPT], {
      env: { ...process.env, NODE_ENV: 'production', DATABASE_PATH: tmpDbPath },
      encoding: 'utf8'
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/production/i);
    // The production guard must trip before the database is ever opened,
    // so no file should have been created at all.
    expect(fs.existsSync(tmpDbPath)).toBe(false);
  });

  test('does not contain the production guard\'s early-exit logic gated on anything other than NODE_ENV', () => {
    const source = fs.readFileSync(SEED_SCRIPT, 'utf8');
    const guardIndex = source.indexOf("NODE_ENV === 'production'");
    expect(guardIndex).toBeGreaterThan(-1);

    // The guard must appear textually before the database is opened
    // (new Database(...)), so a production run can never reach the
    // destructive DELETE statements below it.
    const dbOpenIndex = source.indexOf('new Database(');
    expect(dbOpenIndex).toBeGreaterThan(guardIndex);
  });
});

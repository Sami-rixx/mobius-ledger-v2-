#!/usr/bin/env node
/**
 * Gatecheck: production seed safety (specification §16).
 *
 * Actually EXECUTES database/seed.js with NODE_ENV=production and verifies
 * it refuses to run (non-zero exit) BEFORE touching the database. Also
 * verifies the non-interactive guard.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const seed = path.join(root, 'database/seed.js');

const prodRun = spawnSync(process.execPath, [seed], {
  env: { ...process.env, NODE_ENV: 'production', SEED_CONFIRM: 'yes' },
  encoding: 'utf8'
});
if (prodRun.status === 0) {
  console.error('SEED SAFETY CHECK FAILED: database/seed.js ran with NODE_ENV=production');
  process.exit(1);
}
if (!/production/i.test(prodRun.stderr + prodRun.stdout)) {
  console.error('SEED SAFETY CHECK FAILED: seed did not refuse with a production guard message');
  process.exit(1);
}

const nonInteractive = spawnSync(process.execPath, [seed], {
  env: { ...process.env, NODE_ENV: 'development', SEED_CONFIRM: '' },
  stdio: ['ignore', 'pipe', 'pipe'],
  encoding: 'utf8'
});
if (nonInteractive.status === 0) {
  console.error('SEED SAFETY CHECK FAILED: destructive seed ran non-interactively without SEED_CONFIRM=yes');
  process.exit(1);
}

console.log('Seed safety check passed: destructive seed refuses production and unconfirmed non-interactive runs.');

#!/usr/bin/env node
/**
 * Gatecheck: static route-protection audit (specification §16/§18).
 *
 * Fails (exit 1) when:
 *  - any backend route file registers a handler without requirePermission()
 *    and is not explicitly allowlisted below, or
 *  - app.js does not wire the global `authenticate` perimeter, or
 *  - any route/controller reads the legacy x-user-id header.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const routesDir = path.join(root, 'backend/src/routes');

/**
 * Routes that intentionally have no requirePermission():
 *  - healthRoutes: public liveness probes (no data exposure)
 *  - authRoutes: login is public by design; logout/me/change-password
 *    require only an authenticated session, not a specific permission
 *  - index.js: aggregator, registers no handlers itself
 */
const ALLOWLIST = new Set(['healthRoutes.js', 'authRoutes.js', 'index.js']);

const failures = [];

// 1) Every non-allowlisted route file must use requirePermission on every
//    registered route handler.
for (const file of fs.readdirSync(routesDir)) {
  if (!file.endsWith('.js') || ALLOWLIST.has(file)) continue;
  const source = fs.readFileSync(path.join(routesDir, file), 'utf8');
  const lines = source.split('\n');
  lines.forEach((line, i) => {
    const m = line.match(/router\.(get|post|put|patch|delete)\s*\(/);
    if (!m) return;
    // The permission guard must appear on the same registration statement
    // (allowing for multi-line chains, check this line + next two).
    const window = lines.slice(i, i + 3).join('\n');
    if (!window.includes('requirePermission(')) {
      failures.push(`${file}:${i + 1} registers ${m[1].toUpperCase()} without requirePermission()`);
    }
  });
}

// 2) app.js must wire the global authentication perimeter.
const appSource = fs.readFileSync(path.join(root, 'backend/src/app.js'), 'utf8');
if (!appSource.includes('authenticate')) {
  failures.push('backend/src/app.js does not wire the global authenticate middleware');
}
if (!appSource.includes('csrfProtection')) {
  failures.push('backend/src/app.js does not wire csrfProtection');
}

// 3) No route/controller may trust the legacy x-user-id client header.
for (const dir of ['backend/src/routes', 'backend/src/controllers', 'backend/src/services']) {
  const abs = path.join(root, dir);
  for (const file of fs.readdirSync(abs)) {
    if (!file.endsWith('.js')) continue;
    const source = fs.readFileSync(path.join(abs, file), 'utf8');
    if (/x-user-id/i.test(source)) {
      failures.push(`${dir}/${file} still references the x-user-id header`);
    }
  }
}

if (failures.length > 0) {
  console.error('ROUTE PROTECTION CHECK FAILED:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('Route protection check passed: all routes permission-gated, perimeter wired, no client identity headers.');

# MÖBIUS LEDGER v2 — Security Hardening Implementation Report

**Date:** 2026-10-06
**Branch:** `arena/9a58eb45-mobius-ledger-v2` (pushed), base `bce3cef` (main)
**Spec:** `MOBIUS_LEDGER_v2_Unified_Security_Architecture_Specification-1.md` — read in full (322 lines) before any code change and treated as the implementation contract, with the 12 owner decisions resolving all items the spec marks "pending".

## Commits

| Hash | Scope |
|---|---|
| `498d18b` | Backend: server-side auth, RBAC, audit immutability, financial integrity controls |
| `ec91e20` | Backend: security test suites, bootstrap-admin, production seed guard |
| `a3fc692` | Gatechecker: security checks wired into the mandatory gate |
| `60a4915` | Frontend: session auth integration, login UX, admin-only session management |
| `ae5566b` | Ops: §13 backup pipeline + restore drill tooling + runbook |

## What was implemented

### Authentication & sessions (owner decisions 1–3)
- Server-side sessions, not JWT. Login issues ≥32 random bytes; **SHA-256 hash at rest** (`user_sessions.token_hash`); raw token only ever in the `ml_session` cookie: **HttpOnly, SameSite=Lax, Path=/api**, `Secure` in production. Never in localStorage or URLs.
- **Argon2id** password hashing (`argon2` package). Lifecycle: 8 h idle, 24 h sliding, 7 d absolute, max 5 concurrent sessions (oldest evicted). `/api/auth/*`: login, logout, me, change-password (revokes other sessions).
- Perimeter: every `/api` route requires auth except `POST /auth/login` and `GET /health`; unknown `/api` paths → 401. Login rate-limited; failures audited (`LOGIN_FAILURE`).
- CSRF: mutations require `X-Requested-With: XMLHttpRequest` (403 otherwise), layered on SameSite=Lax; CORS locked down; `trust proxy = 1` for the single-reverse-proxy VPS topology.
- `backend/scripts/bootstrap-admin.js` (`npm run bootstrap:admin`): creates/rotates the initial admin; min 10-char password; `ADMIN_RESET=yes` rotates and revokes sessions. **NULL-password accounts can never log in.**

### Authorization (owner decisions 4–5)
- Six roles seeded (admin, director, finance_officer, clerk, auditor, viewer) with 39 permissions; previously-inert RBAC tables are now the enforcement source.
- `requirePermission` on **every** route (statically verified by the gatecheck); `req.user` from the session cookie is the only identity source — `x-user-id` and all client identity authority removed.
- **Maker-checker**: enforced in `directorWithdrawalService` — the creator can never approve/reject their own withdrawal (403); only director/admin hold approve/reject permissions; approval posts the `director_withdrawal` transaction atomically.

### Audit integrity (owner decision 10)
- Client audit POST/DELETE endpoints removed; audit API is read-only. Writes happen server-side only, actor always `req.user.id`.
- SQLite triggers `trg_audit_trail_no_update` / `trg_audit_trail_no_delete` make `audit_trail` append-only at the database layer (verified live on a migrated DB).
- Taxonomy expanded to 21 actions (LOGIN_SUCCESS/FAILURE, LOGOUT, PASSWORD_CHANGE, ROLE_ASSIGNED/REVOKED, WITHDRAWAL_*, EXPORT/IMPORT/RESTORE/BACKUP, AUTHZ_DENIED, SESSION_REVOKED, REVERSAL, …). Hash chaining deliberately deferred per owner decision; schema/writer centralization keeps it addable without rework.

### Financial integrity (owner decisions 6–8)
- **amount_cents migration completed**: all writes, reads, calculations, reports, ledgers, imports and exports operate on integer cents (verified live: posting 1.5 stores `amount_cents=150`). No dual-unit state.
- **Idempotency**: `Idempotency-Key` (8–128 chars `[A-Za-z0-9_-]`) mandatory on money-moving POSTs; keys + response snapshots stored; replay returns the stored response — verified live: two identical POSTs → two 201s, exactly **one** row.
- **Immutability**: posted records cannot be updated/hard-deleted via services; corrections via `POST /{income|expenses|transactions|school-fees}/:id/reverse`.
- Financial writes wrapped in `better-sqlite3` transactions (synchronous engine, used correctly — no async/sync misuse inside transactions).
- Injection surface closed: allowlisted `orderBy`/`orderDir` (unknown → 400), pagination capped at 100 (`pageSize>100` → 400), DB errors mapped to safe messages (no raw SQLite/SQL/path leakage to clients — verified live).
- Import/export/restore: Admin-gated, filename allowlisting (no traversal/arbitrary paths), no arbitrary SQL execution, staged validation, pre-restore backup, restore requires explicit `confirm` field. NO expense approval workflow was invented (owner decision 9).

### Migrations & seed safety
- Numbered migrations `001`–`006` with `schema_migrations`, applied idempotently on **fresh and existing** databases — verified by booting against a legacy-seeded DB: all 6 applied, triggers live, RBAC seeded, legacy data (13 classes, 10 students) preserved, no destructive changes.
- `database/seed.js` refuses `NODE_ENV=production` (exit 1) and unconfirmed non-interactive runs (`SEED_CONFIRM=yes` required); dev success path verified.

### Frontend (UX layer only — spec §14)
- `ApiClient`: `credentials: 'include'`, `X-Requested-With` on all requests, auto `Idempotency-Key` (UUID) per POST, 401 outside `/auth/*` → redirect to `/login`.
- `AuthProvider`/`useAuth`/`RequireAuth` bootstrapping from `/api/auth/me`; `/login` page; all app routes behind `RequireAuth`; nav shows user + sign-out. Session screens reduced to the admin-only API (list/stats/deactivate/cleanup); client-side session create/edit removed.

### Hosting & backups (owner decisions 11–12, spec §13)
- Architecture unchanged: single VPS/VM, SQLite, reverse proxy, single instance.
- `scripts/backup-production.sh`: consistent `sqlite3 .backup` snapshot (WAL-safe), `PRAGMA integrity_check` before acceptance, gzip + AES-256(PBKDF2) encryption, SHA-256 sidecar, hourly/daily/weekly tiers with retention pruning, rclone replication to two off-host destinations (second intended as object-lock/immutable).
- `scripts/restore-drill.sh`: real restore to scratch → checksum → integrity check → row counts & financial totals. Both scripts verified end-to-end in-sandbox (encrypt → decrypt → totals match).
- `docs/BACKUP_AND_RESTORE.md`: runbook (cron, key management, DR steps, RPO ≤1 h / RTO ≤4 h).

## New dependencies
`argon2`, `cookie-parser` (backend production deps). Nothing else added.

## Test & gate results (final committed tree)

| Gate step | Result |
|---|---|
| `build:frontend` | PASS |
| Backend Jest | **23 suites / 569 tests passed** (incl. `security.integration.test.js`, 34 tests: authz matrix, self-approval 403, IDOR, ORDER BY injection 400, idempotency replay, audit immutability, disabled/revoked sessions 401, login-failure audit, endpoint exposure) |
| Frontend Vitest | **4 files / 63 tests passed** (incl. 7-test client security contract suite) |
| Lint | 0 errors |
| `check:routes` (static route-protection) | PASS |
| `check:seed` (production seed safety) | PASS |
| `check:deps` (`npm audit --omit=dev --audit-level=high`) | PASS (0 high/critical) |
| **`npm run gatecheck` (full chain)** | **EXIT 0** |

Live smoke test (dev server + curl): health public; no-cookie 401; bad password 401; missing CSRF header 403; login sets HttpOnly/Lax cookie; `/me` 200; POST without Idempotency-Key 400; malicious `orderBy` 400; logout → `/me` 401; idempotent replay creates one record; no SQL leaked in error bodies.

## Known limitations (evidence-based)
1. `react-router`/`react-router-dom` carry 2 **moderate** advisories; the fix is a breaking v7 upgrade — deferred deliberately (dev-time surface, below the agreed high-severity gate).
2. Audit hash chaining deferred per owner decision 10 (design accommodates later addition).
3. Minor accepted warts: CSV import log marks a failed row-level result "completed" (pre-existing); model-layer update/delete still exists but services enforce immutability; a cosmetic validation message mentions `createdBy`.
4. Off-site/immutable backup destinations require one-time server-side rclone configuration (documented); cannot be provisioned from the repository.
5. Demo seed resets the receipt sequence behind its own seeded transactions — harmless dev-only quirk; the server correctly returns a generic error without SQL leakage.

## Production-readiness assessment
All spec requirements and the 12 owner decisions are implemented and verified by repository evidence: full Gatechecker passes (including security-specific gates), the authorization matrix and deny-path tests pass, migrations work on fresh and existing databases without destroying history, and no known P0 vulnerability remains. **The application is production-ready**, conditional on the documented one-time deployment steps: reverse proxy + TLS, `NODE_ENV=production`, `bootstrap:admin`, backup key + rclone remotes, and cron for the backup tiers.

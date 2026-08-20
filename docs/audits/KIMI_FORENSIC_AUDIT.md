# MÖBIUS LEDGER v2 — Independent Forensic Audit Report

**Audit Date:** 2026-08-08  
**Auditor:** Independent Agent  
**Repository:** `https://github.com/Sami-rixx/mobius-ledger-v2-.git`  
**Commit:** HEAD (latest as of audit)  
**Scope:** Full-stack repository — backend, database, CI, tests, models, services, controllers, routes  
**Constraint:** No fixes applied; evidence-driven analysis only.

---

## Executive Summary

The MÖBIUS LEDGER v2 repository is in a **critically compromised state** with multiple intersecting root causes that render the test suite and significant portions of the backend non-functional. The most severe issue is **systematic misuse of the `better-sqlite3` API** across numerous models, where asynchronous patterns (`await db.get/all/run`) are applied to a synchronous library that lacks those methods on the Database object entirely. This is compounded by **ESM/CommonJS module schizophrenia**, **shared mutable database state across tests**, **missing database initialization in the test lifecycle**, and a **half-completed money-to-cents migration** that has left the schema and application code in an inconsistent hybrid state.

**Bottom line:** The backend test suite fails at bootstrap with `SqliteError: no such table: system_settings`. Even if that were resolved, the majority of models would immediately throw `TypeError: db.get is not a function` (or similar) due to the API mismatch. The CI gatecheck cannot pass. Production code paths touched by the affected models are also broken.

---

## Repository Architecture

```
mobius-ledger-v2/
├── backend/
│   ├── package.json          # "type": "module" (ESM)
│   ├── jest.config.js        # ESM Jest config
│   ├── src/
│   │   ├── app.js            # Express app, ESM imports
│   │   ├── config/
│   │   │   └── database.js   # Singleton better-sqlite3 db + setupDatabase()
│   │   ├── test/
│   │   │   └── setup.js      # Jest setup: calls setupDatabase()
│   │   ├── models/           # 25+ model files
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── __tests__/        # 20+ test files
├── database/
│   ├── schema.sql            # Canonical schema (includes _cents columns)
│   ├── setup.js              # Standalone schema initializer (Node ESM)
│   ├── seed.js               # Seed data script
│   └── optimize.sql
├── frontend/                 # React/Vite (out of scope for backend audit)
├── .github/workflows/
│   └── gatecheck.yml         # CI: install → build → test → lint
└── package.json              # Workspace root
```

**Key observation:** The backend declares ESM (`"type": "module"`) but several files and many tests use CommonJS (`require`, `module.exports`). This is not a stylistic issue; it is a runtime-breaking incompatibility under Node ESM.

---

## Baseline Test/CI State

**Test command:** `cd backend && npm test`  
**Result:** **Catastrophic failure at bootstrap.** Every test file fails before executing a single assertion.

**Primary error:**
```
SqliteError: no such table: system_settings
  at setupDatabase (src/config/database.js:37:24)
  at Object.<anonymous> (src/test/setup.js:8:3)
```

**CI state:** The GitHub Actions `gatecheck.yml` runs `npm run gatecheck`, which chains `build:frontend && test:backend && test:frontend && lint:frontend`. The backend test step will fail, aborting the entire gatecheck.

**Secondary error class (evident from static analysis):**  
Once the database initialization issue is resolved, models using `await db.get(...)` / `await db.all(...)` / `await db.run(...)` will throw `TypeError: db.get is not a function` because `better-sqlite3` Database objects do not expose those methods. The synchronous API is `db.prepare(sql).get(...)` / `.all(...)` / `.run(...)`.

---

## Root Cause Matrix

| ID | Root Cause | Severity | Confidence | Evidence Location |
|---|---|---|---|---|
| RC-1 | **better-sqlite3 API mismatch** — `await db.get/all/run` used on Database object; methods do not exist and library is synchronous | Critical | 100% | `src/models/DailyLedger.js`, `Income.js`, `Expense.js`, `ExpenseCategory.js`, `DirectorWithdrawal.js`, `Dashboard.js`, `ImportExport.js`, etc. |
| RC-2 | **Test database not initialized** — `setupDatabase()` queries `system_settings` before schema is applied; Jest setup does not run `database/setup.js` | Critical | 100% | `src/config/database.js:37`, `src/test/setup.js:8` |
| RC-3 | **Shared mutable database singleton** — All tests share one on-disk file (`database/mobius_ledger.db`) with WAL mode; no test isolation | Critical | 100% | `src/config/database.js:12` |
| RC-4 | **ESM/CommonJS duality** — `package.json` declares ESM, but `ImportExport.js`, `importExportService.js`, `importExportController.js` use `require`/`module.exports`; tests use `require()` | Critical | 100% | `src/models/ImportExport.js:6,348`, `src/__tests__/importExport.test.js`, `src/__tests__/permission.test.js`, etc. |
| RC-5 | **Missing database module** — `ImportExport.js` requires `../database/db.js` which does not exist | High | 100% | `src/models/ImportExport.js:6` |
| RC-6 | **Money-to-cents migration incomplete** — Schema has `_cents` columns and triggers compute them, but no application code reads/writes `_cents`; hybrid state | High | 100% | `database/schema.sql` (amount_cents columns), all model files |
| RC-7 | **Jest configuration brittleness** — `transformIgnorePatterns` targets `better-sqlite3` unnecessarily; `--experimental-vm-modules` with mixed CJS/ESM | Medium | 90% | `backend/jest.config.js:20-22` |

---

## Database Audit

### Schema State
- **File:** `database/schema.sql` (36,689 bytes)
- **Tables:** 18+ tables including `system_settings`, `users`, `students`, `transactions`, `income`, `expenses`, `daily_ledger`, `director_withdrawals`, `notifications`, `permissions`, `roles`, etc.
- **Migration status:** `_cents` columns are present in schema for all monetary tables (`income`, `expenses`, `transactions`, `daily_ledger`, `director_withdrawals`, `student_charges`, etc.).
- **Trigger drift:** SQLite triggers (`trg_transaction_insert_after`, `trg_transaction_delete_after`) compute `_cents` columns as `amount * 100`. However, the triggers use `NEW.amount * 100` directly, which is fine for SQLite integer math, but the application does not enforce cents consistency.

### Initialization Chain
1. `database/setup.js` — standalone script that creates `mobius_ledger.db`, runs `schema.sql`, inserts system settings, creates system user. **Not invoked by tests.**
2. `backend/src/config/database.js` — imports `better-sqlite3`, opens `DB_PATH` (resolves to `database/mobius_ledger.db`), applies pragmas, exports singleton `db`.
3. `backend/src/test/setup.js` — Jest `setupFilesAfterEnv` calls `setupDatabase()`, which **assumes schema already exists** and queries `system_settings`.

**Failure point:** If `database/setup.js` has never been run, the DB file may exist as an empty SQLite file or not at all, and `setupDatabase()` crashes immediately.
---

## ESM/CommonJS Audit

| File | Declared Module System | Actual Syntax | Status |
|---|---|---|---|
| `backend/package.json` | ESM (`"type": "module"`) | — | ✅ ESM |
| `backend/src/app.js` | ESM | `import` | ✅ Consistent |
| `backend/src/models/Student.js` | ESM | `import` / `export` | ✅ Consistent |
| `backend/src/models/ImportExport.js` | ESM (inferred) | `require`, `module.exports` | ❌ **Broken** |
| `backend/src/services/importExportService.js` | ESM (inferred) | `module.exports` | ❌ **Broken** |
| `backend/src/controllers/importExportController.js` | ESM (inferred) | `module.exports` | ❌ **Broken** |
| `backend/src/__tests__/importExport.test.js` | ESM (inferred) | `require(...)` | ❌ **Broken** |
| `backend/src/__tests__/permission.test.js` | ESM (inferred) | `require(...)` | ❌ **Broken** |
| `backend/src/__tests__/role.test.js` | ESM (inferred) | `require(...)` | ❌ **Broken** |

**Impact:** Under Node ESM with `--experimental-vm-modules`, `require()` inside test files will throw `ReferenceError: require is not defined in ES module scope` (or similar). The `ImportExport` family of files will fail to load entirely because they use CJS syntax in an ESM package.

---

## Model/Service/Controller Contract Audit

### API Consistency Split
The codebase has **two mutually incompatible database access patterns**:

**Pattern A (Correct):** Synchronous `better-sqlite3` API  
Used by: `Student.js`, `Transaction.js`, `Class.js`, `SchoolFee.js`, etc.
```js
const stmt = db.prepare(query);
return stmt.all(...params); // synchronous
```

**Pattern B (Broken):** Asynchronous pseudo-API that does not exist  
Used by: `Income.js`, `Expense.js`, `ExpenseCategory.js`, `DailyLedger.js`, `DirectorWithdrawal.js`, `Dashboard.js`, `ImportExport.js`, etc.
```js
const rows = await db.all(query, params); // TypeError: db.all is not a function
const row = await db.get(query, [id]);   // TypeError: db.get is not a function
const result = await db.run(query, params); // TypeError: db.run is not a function
```

**Note:** In `Dashboard.js`, there is a hybrid where `await db.prepare(...).all()` is used. `db.prepare()` returns a Statement whose `.all()` method is synchronous, so `await` is harmless but semantically wrong. In `DailyLedger.js`, `Income.js`, etc., the code calls `db.get()` directly on the Database object, which **does not exist at all**.

### Export Contract Inconsistency
- Most models export both named exports and a default object: `export { TABLE, FIELDS }; export default { getAll, ... }`
- `DailyLedger.js` additionally exports `MODEL_NAME`
- `ImportExport.js` uses `module.exports` and mutates the exported object with properties like `ImportExport.IMPORT_EXPORT_STATUS = ...`

---

## Test Isolation Audit

**Finding:** There is **zero test isolation** for the database layer.

- `backend/src/config/database.js` creates a single `Database` instance at module evaluation time pointing to `database/mobius_ledger.db`.
- All test files import this singleton.
- WAL mode is enabled (`journal_mode = WAL`), which means multiple processes can read, but writes are still serialized and state persists across tests.
- No `:memory:` database is used.
- No `beforeEach` transaction rollback strategy.
- No test-specific database teardown.

**Consequence:** Tests are not hermetic. A failing test that inserts data will leave state behind for subsequent tests, causing flaky or cascading failures.

---

## Test Schema Drift

**Finding:** The test runner never initializes the database schema.

- `src/test/setup.js` calls `setupDatabase()`, which queries `system_settings`.
- `setupDatabase()` does **not** execute `schema.sql`.
- There is no call to `database/setup.js` in the Jest lifecycle.
- Therefore, unless a developer manually ran `node database/setup.js` before testing, the `mobius_ledger.db` file either does not exist or is empty, and `setupDatabase()` crashes.

**This is the immediate cause of the `no such table: system_settings` error.**

---

## Money-to-Cents Migration Audit

**Schema state:** Complete — `_cents` columns exist on all monetary tables.  
**Trigger state:** Complete — triggers compute `_cents` from `amount * 100` on insert/delete.  
**Application state:** **Absent** — no model reads from or writes to `_cents` columns.

**Evidence:**
- `scripts/migrate-to-cents.sh` exists and implements Phase 0-2 (schema + data migration).
- Phase 3 (code migration) is explicitly noted as manual and unimplemented.
- All model `INSERT`/`UPDATE` statements reference only `amount`, `opening_balance`, etc., never `amount_cents`, `opening_balance_cents`.
- The application is in a **dangerous hybrid state**: the schema supports cents, but the application ignores them. If Phase 4 (dropping DECIMAL columns) were ever run, the application would break completely.

**Regression risk:** High. Any future developer or script that drops the old DECIMAL columns will silently break every monetary write path in the application.
---

## CI/Jest Audit

**GitHub Actions workflow (`.github/workflows/gatecheck.yml`):**
- Uses `actions/setup-node@v4` with Node 22.
- Runs `npm run install:all` then `npm run gatecheck`.
- `gatecheck` script: `npm run build:frontend && npm run test:backend && npm run test:frontend && npm run lint:frontend`

**Jest config (`backend/jest.config.js`):**
- `testEnvironment: 'node'` ✅
- `setupFilesAfterEnv: ['<rootDir>/src/test/setup.js']` ✅ (but setup is broken)
- `transformIgnorePatterns: ['node_modules/(?!(better-sqlite3)/)']` — **Unnecessary and misleading.** `better-sqlite3` is a native C++ addon; it does not need Babel/transform. This pattern suggests confusion about how the module works.
- `transform: {}` — indicates no transpilation is configured, which is fine for pure Node ESM.

**Test execution:**
- Uses `NODE_OPTIONS='--experimental-vm-modules'` because of ESM.
- Mixed `require()` in tests will fail under this flag.

---

## Static Anti-Pattern Audit

| Anti-Pattern | Count | Locations | Impact |
|---|---|---|---|
| `await db.get/all/run` (direct on Database) | 100+ | `DailyLedger.js`, `Income.js`, `Expense.js`, `ExpenseCategory.js`, `DirectorWithdrawal.js`, `Dashboard.js`, `ImportExport.js`, etc. | **Runtime TypeError** |
| `await db.prepare(...).all()` (on Statement) | ~20 | `Dashboard.js` | Semantically wrong (synchronous), but won't crash |
| `require()` in test files | 162 | `__tests__/importExport.test.js`, `permission.test.js`, `role.test.js`, etc. | **ReferenceError in ESM** |
| `module.exports` | 3 | `ImportExport.js`, `importExportService.js`, `importExportController.js` | **Export mismatch in ESM** |
| `require('../database/db.js')` (missing file) | 1 | `ImportExport.js:6` | **Module not found** |
| Shared singleton DB | 1 | `config/database.js` | Test pollution, race conditions |

---

## Dependency/Module Graph

**Critical broken chain:**
```
ImportExport.js
  └─ requires '../database/db.js'  [MISSING]
  └─ uses 'require()' / 'module.exports'  [CJS in ESM]

importExport.test.js
  └─ requires '../models/ImportExport.js'  [ESM load failure]
  └─ requires '../services/importExportService.js'  [ESM load failure]
  └─ requires '../controllers/importExportController.js'  [ESM load failure]
```

**Database singleton chain:**
```
app.js ──► config/database.js ──► better-sqlite3 Database (singleton)
   ▲
tests/setup.js ──► setupDatabase() ──► queries system_settings  [FAILS if schema missing]
   ▲
All models ──► import db from '../config/database.js' ──► same singleton
```

**Model API split:**
- Sync API branch: `Student.js` → `Transaction.js` → `Class.js` → etc. (functional)
- Async API branch: `Income.js` → `Expense.js` → `DailyLedger.js` → `Dashboard.js` → etc. (broken)

---

## Failure Cascade Map

```
[RC-2] Test DB schema missing
    └─► "no such table: system_settings" at setupDatabase()
        └─► ALL tests fail at beforeAll/setup

[RC-4] ESM/CJS mismatch + [RC-5] Missing db.js
    └─► ImportExport module graph fails to load
        └─► importExport.test.js cannot run

[RC-1] await db.get/all/run on better-sqlite3 Database
    └─► TypeError: db.get is not a function
        └─► ANY code path touching Income, Expense, DailyLedger, DirectorWithdrawal, etc. fails
            └─► Production runtime broken for those modules
            └─► Tests for those modules fail immediately after schema issue is fixed

[RC-3] Shared DB singleton
    └─► Test state leaks between suites
        └─► Flaky failures (cascading symptoms, not root causes)

[RC-6] Money-to-cents incomplete
    └─► Silent data inconsistency risk
        └─► Future schema cleanup (dropping DECIMAL) would break all monetary code
```

---

## Primary Root Causes vs Cascading Symptoms

### Primary Root Causes (must be fixed first)
1. **RC-1:** `better-sqlite3` API misuse (`await db.get/all/run`)
2. **RC-2:** Database schema not initialized in test lifecycle
3. **RC-3:** Shared on-disk database singleton (no test isolation)
4. **RC-4:** ESM/CommonJS module system conflict
5. **RC-5:** `ImportExport.js` requires missing `../database/db.js`

### Cascading Symptoms (will resolve once primaries are fixed)
- `SqliteError: no such table: system_settings` (symptom of RC-2)
- `TypeError: db.get is not a function` (symptom of RC-1)
- `ReferenceError: require is not defined` (symptom of RC-4)
- `Error: Cannot find module '../database/db.js'` (symptom of RC-5)
- Flaky test failures due to data leakage (symptom of RC-3)
- ---

## Repair Priority

### Phase 1: Infrastructure & Module System (Blocking)
**Goal:** Make the codebase load without syntax/runtime errors.

| Priority | Item | Files |
|---|---|---|
| P1 | Convert `ImportExport.js`, `importExportService.js`, `importExportController.js` from CJS to ESM | `src/models/ImportExport.js`, `src/services/importExportService.js`, `src/controllers/importExportController.js` |
| P1 | Fix `ImportExport.js` to import the real database module (`../config/database.js`) instead of missing `../database/db.js` | `src/models/ImportExport.js` |
| P1 | Convert all test files using `require()` to `import` syntax | `src/__tests__/importExport.test.js`, `permission.test.js`, `role.test.js`, etc. |

### Phase 2: Database Layer & Test Isolation (Blocking)
**Goal:** Make tests hermetic and bootstrapped.

| Priority | Item | Files |
|---|---|---|
| P2 | Refactor `config/database.js` to support test-mode `:memory:` or temp-file database | `src/config/database.js` |
| P2 | Update `src/test/setup.js` to run schema initialization before `setupDatabase()` | `src/test/setup.js`, `database/schema.sql` |
| P2 | Ensure `afterAll` closes database connection and cleans up files | `src/test/setup.js` |

### Phase 3: better-sqlite3 API Correction (Blocking)
**Goal:** Eliminate all `await db.get/all/run` calls.

| Priority | Item | Files |
|---|---|---|
| P3 | Rewrite all async db calls in models to use synchronous `db.prepare().get/all/run()` | `src/models/Income.js`, `Expense.js`, `ExpenseCategory.js`, `DailyLedger.js`, `DirectorWithdrawal.js`, `Dashboard.js`, `ImportExport.js`, etc. |
| P3 | Remove unnecessary `async/await` from model functions where database is sync | Same as above |

### Phase 4: Money-to-Cents Completion (High)
**Goal:** Resolve the hybrid migration state.

| Priority | Item | Files |
|---|---|---|
| P4 | Decide strategy: either (a) remove `_cents` columns from schema and abandon migration, or (b) update all models/services to write and read `_cents` exclusively | `database/schema.sql`, all monetary models |
| P4 | Update triggers or remove them if application handles cents | `database/schema.sql` |
| P4 | Update migration scripts to match chosen strategy | `scripts/migrate-to-cents.sh` |

### Phase 5: Verification & Hardening
**Goal:** Ensure no regressions.

| Priority | Item | Files |
|---|---|---|
| P5 | Run full test suite and fix remaining assertion failures | All `src/__tests__/*.test.js` |
| P5 | Verify CI gatecheck passes | `.github/workflows/gatecheck.yml` |
| P5 | Add lint rule to prevent `require`/`module.exports` in ESM package | Add ESLint config |

---

## File-by-File Repair Plan

### `backend/src/config/database.js`
**Problem:** Singleton hardcoded to on-disk file; crashes if schema missing.  
**Repair:** 
- Export a factory function `createDatabase(path)` in addition to the default singleton.
- In test mode (detect via `process.env.NODE_ENV === 'test'`), use `:memory:` or a temp file.
- Keep `setupDatabase()` but make it idempotent (create tables if missing, or document that schema must be applied first).

### `backend/src/test/setup.js`
**Problem:** Calls `setupDatabase()` without ensuring schema exists.  
**Repair:**
- Read and execute `database/schema.sql` against the test database instance before calling `setupDatabase()`.
- Add `afterAll` to close `db` and delete temp database file.

### `backend/src/models/ImportExport.js`
**Problem:** CJS syntax; requires missing `../database/db.js`; uses `await db.get/all/run`.  
**Repair:**
- Convert to ESM: `import db from '../config/database.js'; import fs from 'fs'; import path from 'path';`
- Replace all `await db.get/all/run(query, params)` with `db.prepare(query).get/all/run(params)`.
- Export via `export default ImportExport;` and named exports.

### `backend/src/models/Income.js`
**Problem:** `await db.get/all/run(query, params)` throughout.  
**Repair:** Convert all functions to synchronous `db.prepare(query).get/all/run(...params)`. Remove `async` keywords from model functions.

### `backend/src/models/Expense.js`
**Problem:** Identical to Income.js.  
**Repair:** Same pattern — synchronous API.

### `backend/src/models/ExpenseCategory.js`
**Problem:** `await db.all/get/run`.  
**Repair:** Synchronous conversion.

### `backend/src/models/DailyLedger.js`
**Problem:** `await db.get/all/run` directly on Database object.  
**Repair:** Synchronous conversion. Also fix `generateForDate` which queries `transactions` table with `type = 'INCOME'` / `'EXPENSE'` — the actual column is `transaction_type` with values like `'income'`, `'expense'`.

### `backend/src/models/DirectorWithdrawal.js`
**Problem:** `await db.get/all/run`.  
**Repair:** Synchronous conversion.

### `backend/src/models/Dashboard.js`
**Problem:** `await db.prepare(...).all()` — harmless but semantically wrong.  
**Repair:** Remove `await` from synchronous statement calls.

### `backend/src/__tests__/importExport.test.js`, `permission.test.js`, `role.test.js`
**Problem:** `require()` used in ESM environment.  
**Repair:** Convert all `require()` calls to `import` or `import()` at top of file.

### `database/schema.sql`
**Problem:** Hybrid cents state.  
**Repair:** Either drop `_cents` columns and triggers (abort migration) or commit fully by making `_cents` NOT NULL and removing DECIMAL columns. **Do not leave in hybrid state.**

---

## Verification Plan

### Phase 1 Verification
```bash
cd backend
node -e "import('./src/models/ImportExport.js').then(m => console.log('ImportExport loads:', !!m.default)).catch(e => console.error(e))"
node -e "import('./src/models/Income.js').then(m => console.log('Income loads:', !!m.default)).catch(e => console.error(e))"
```
All modules should load without `require` or `module.exports` errors.

### Phase 2 Verification
```bash
cd backend
NODE_ENV=test npx jest --testNamePattern="should have correct table structure" src/__tests__/dailySummary.test.js
```
Test should reach the first assertion (instead of failing at `beforeAll`).

### Phase 3 Verification
```bash
cd backend
npx jest src/__tests__/income.test.js src/__tests__/expense.test.js src/__tests__/dailyLedger.test.js
```
Tests should execute without `TypeError: db.get is not a function`.

### Phase 4 Verification
- Inspect schema: `sqlite3 database/mobius_ledger.db ".schema income"` should show only one monetary column (either `amount` or `amount_cents`, not both in a confused state).
- Run migration script and verify application still functions.

### Full Gatecheck Verification
```bash
npm run install:all
npm run gatecheck
```
Must exit 0.

---

## Regression Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Fixing `better-sqlite3` API in one model but missing others | High | Tests continue failing | Global search for `await db\.(get\|all\|run)\(` before declaring done |
| Changing to `:memory:` DB breaks integration tests expecting persistence | Medium | False positives | Ensure temp-file strategy is used if tests assert file existence |
| CJS→ESM conversion breaks default/named export consumers | Medium | Import undefined | Audit every import site for named vs default export contract |
| Money-to-cents rollback or completion causes data loss | High | Financial data corruption | Backup database before running migration scripts; add reversible migration |
| `setupDatabase()` behavior change affects production startup | Medium | Production crash | Test `node src/app.js` locally after changes |

---

## Unknowns

1. **Frontend test state:** Not audited. May have independent failures.
2. **Seed data compatibility:** `database/seed.js` was not fully inspected for ESM/CJS or API issues.
3. **Services and controllers:** Only sampled. Full audit of all 25+ controllers/routes was not completed due to scope constraints, but the same API misuse patterns likely propagate.
4. **Native addon build:** `better-sqlite3` requires native compilation. CI uses `ubuntu-latest` with Node 22; prebuilds may or may not be available. If CI lacks build tools, installation fails before tests run.
5. **Previous audit claims:** Without access to prior chat sessions, cannot explicitly contradict a previous audit, but the repository state clearly shows that **no prior fixes were successfully applied or persisted to the codebase** given the severity and obviousness of the `db.get` and `require()` errors.

---

## Final Recommendation

**Do not attempt to run the application in production.** The backend contains multiple categories of runtime-breaking defects:

1. The `better-sqlite3` API is fundamentally misused in the majority of models.
2. The module system is inconsistent, preventing the application from loading in a standards-compliant ESM environment.
3. The test suite is non-functional and provides no safety net.
4. The database schema is in a half-migrated state that risks data integrity.

**Recommended immediate action:**
1. Execute **Phase 1** (module system) and **Phase 2** (test database isolation) in a feature branch.
2. Execute **Phase 3** (API correction) with a global find-replace strategy, verifying each converted model with its corresponding test file.
3. Make a **binary decision** on the money-to-cents migration: either complete it fully or revert the schema changes. Do not leave it half-finished.
4. Only after `npm test` passes locally should the CI gatecheck be re-enabled.

This audit finds the repository in a **pre-release, non-functional state** requiring significant corrective work before it can be considered stable.


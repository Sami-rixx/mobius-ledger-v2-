# MÖBIUS LEDGER v2 — KIMI FORENSIC AUDIT
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
---

## **CHUNK 3 of 5**

```markdown
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

**Critical broken chain:*
---

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

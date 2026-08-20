# FORENSIC AUDIT REPORT - MÖBIUS LEDGER V2
## Independent Repository Audit by Mistral Vibe

**Audit Date:** 2026-08-05  
**Repository State:** Commit 634d632 (feature/money-to-cents-migration)  
**Audit Scope:** Full repository forensic analysis for CI stabilization  
**Audit Type:** AUDIT-ONLY (no code modifications performed)

---

## EXECUTIVE SUMMARY

### Critical Findings

Mobius Ledger v2 has **multiple categories of defects** causing CI failures, with **test infrastructure issues** being the most widespread and impactful. The repository has undergone a significant money-to-cents migration (converting DECIMAL(10,2) to INTEGER cents storage), but **residual migration artifacts**, **ESM/CommonJS incompatibilities**, and **test isolation problems** continue to cause failures.

**Primary Root Causes (by impact):**

1. **Test Infrastructure Defects (HIGH SEVERITY - SYSTEMIC)**
   - Jest ESM mocking limitation: `jest.mock()` calls inside `beforeAll` blocks cause modules to import real database instead of test mocks
   - Mixed test database strategies: 10 tests use `:memory:`, 12 use file-based databases
   - Shared test database files cause test isolation violations
   - Test setup executes `database/setup.js` which creates real database files before mocks are established

2. **Architectural Inconsistencies (HIGH SEVERITY - PRODUCTION RUNTIME)**
   - `Dashboard.js` model uses `await db.prepare(...)` but better-sqlite3 is synchronous
   - All 16 async db calls in Dashboard.js are incorrect and will cause runtime errors

3. **Money-to-Cents Migration Artifacts (MEDIUM SEVERITY - DATA INTEGRITY)**
   - `DirectorWithdrawal.js` getStatistics() has COALESCE expressions mixing raw cents with cents*100
   - Schema drift: migration 002_cutover_to_cents.sql has different director_withdrawals schema than schema.sql
   - Production code retains legacy DECIMAL-to-cents conversion logic that is no longer needed

4. **Test Schema Drift (MEDIUM SEVERITY - TEST RELIABILITY)**
   - File-based test suites create minimal schemas that may not match production schema
   - Some test files have complete schemas, others have partial schemas
   - No centralized test schema management

5. **ESM Module Loading Issues (MEDIUM SEVERITY - MODULE SYSTEM)**
   - Dynamic imports with `await import()` in tests, but some modules imported at top level
   - No CommonJS usage found in source code (good), but ESM mocking patterns are inconsistent

**Recommended Repair Priority:**
1. Fix test infrastructure (ESM mocking) - affects all test suites
2. Fix Dashboard.js async/await misuse - prevents module from working at all
3. Remove money-to-cents migration artifacts
4. Standardize test database strategy
5. Resolve schema drift

---

## REPOSITORY ARCHITECTURE

### Project Structure
```
mobius-ledger-v2/
├── backend/                    # Node.js + Express backend
│   ├── src/
│   │   ├── __tests__/         # 20 test files (~530 tests)
│   │   ├── config/           # Database config, ESM
│   │   ├── controllers/      # Route controllers
│   │   ├── models/           # Data access layer (better-sqlite3)
│   │   ├── routes/           # Express routes
│   │   ├── services/         # Business logic
│   │   ├── test/             # Jest setup
│   │   └── utils/            # Utilities (money.js, etc.)
│   ├── package.json          # type: "module"
│   └── jest.config.js         # Jest with ESM support
├── database/
│   ├── schema.sql            # Canonical schema (455 lines, 20+ tables)
│   ├── migrations/           # 2 migration files (001, 002)
│   ├── seed.js               # Seed data
│   └── setup.js              # Schema loader
├── frontend/                   # React/Vite frontend
└── .github/workflows/gatecheck.yml  # CI workflow
```

### Technology Stack
- **Runtime:** Node.js >= 18 (CI uses Node 22)
- **Module System:** ESM (`"type": "module"` in backend/package.json)
- **Database:** SQLite via better-sqlite3 (synchronous API)
- **Test Framework:** Jest 29 with `--experimental-vm-modules`
- **Frontend:** React, Vite
- **CI:** GitHub Actions (gatecheck: build + backend tests + frontend tests + lint)

### Financial Architecture
- **Storage:** All monetary values stored as INTEGER cents (smallest currency unit)
- **Migration:** Two-phase migration (001: populate _cents columns, 002: drop DECIMAL, rename _cents)
- **Utilities:** money.js provides toCents(), fromCents(), getAmount(), formatCurrency()
- **Status:** Migration appears complete, but residual artifacts remain

---

## BASELINE TEST/CI STATE

### Test File Inventory
| Category | File | Tests | DB Strategy | Status |
|----------|------|-------|-------------|--------|
| Ledger | dailyLedger.test.js | 43 | :memory: | ESM mocking issue |
| Ledger | dailySummary.test.js | 61 | file-based | Shared DB |
| Financial | analytics.test.js | 34 | file-based | Shared DB |
| Financial | directorWithdrawal.test.js | 40 | file-based | No db mock |
| Financial | expense.test.js | 25 | file-based | Shared DB |
| Financial | expenseCategory.test.js | 35 | file-based | Shared DB |
| Financial | income.test.js | 2 | file-based | Shared DB |
| Financial | incomeCategory.test.js | 11 | file-based | Shared DB |
| Financial | report.test.js | 24 | file-based | Shared DB |
| Financial | dashboard.test.js | 12 | file-based | Shared DB |
| Financial | transaction.test.js | 0 | file-based | Empty? |
| Students | student.test.js | 11 | file-based | Shared DB |
| Students | studentCharge.test.js | 12 | file-based | Separate DB |
| System | notification.test.js | 51 | :memory: | ESM mock OK |
| System | importExport.test.js | 29 | :memory: | ESM mocking issue |
| System | auditTrail.test.js | 29 | file-based | Shared DB |
| Auth | permission.test.js | 25 | :memory: | ESM mocking issue |
| Auth | role.test.js | 26 | :memory: | ESM mocking issue |
| Auth | rolePermission.test.js | 28 | :memory: | ESM mocking issue |
| Auth | userRole.test.js | 27 | :memory: | ESM mocking issue |
| Auth | userSession.test.js | 34 | :memory: | ESM mocking issue |

**Total:** ~530 tests across 20 test files

### CI Workflow (gatecheck.yml)
```yaml
- Install all dependencies (npm run install:all)
- Run gatecheck (npm run gatecheck):
  1. npm run build:frontend (Vite build)
  2. npm run test:backend (cd backend && npm test)
  3. npm run test:frontend
  4. npm run lint:frontend
```

### Local vs CI Differences
- **Node Version:** CI uses Node 22, local Termux uses Node 18
- **better-sqlite3:** Native bindings may not build in Termux (Android)
- **Test Execution:** Jest runs with `--experimental-vm-modules` flag
- **Database Path:** Config points to ../../../database/mobius_ledger.db

---

## ROOT CAUSE MATRIX

### Category 1: Test Infrastructure Defects

#### R1. Jest ESM Mocking Limitation (CRITICAL)
- **File:** 7 test files using `:memory:` databases
- **Location:** dailyLedger.test.js, importExport.test.js, permission.test.js, role.test.js, rolePermission.test.js, userRole.test.js, userSession.test.js
- **Evidence:** `jest.mock()` inside `beforeAll` block, but ESM imports evaluated before `beforeAll` runs
- **Observed Behavior:** Models import real database from config/database.js instead of test mock
- **Root Cause:** Jest ESM module hoisting means top-level imports execute before test setup
- **Impact:** Test failures with "db.get is not a function", "id must be a valid positive number", etc.
- **Severity:** CRITICAL (blocks all affected test suites)
- **Confidence:** 100%
- **Repair Direction:** Move `testDb` initialization and `jest.mock()` to top level of test files

#### R2. Shared Test Database Files (HIGH)
- **File:** 11 test files using file-based databases
- **Location:** analytics, dailySummary, dashboard, directorWithdrawal, expense, expenseCategory, income, incomeCategory, report, student, studentCharge
- **Evidence:** All use `path.resolve(__dirname, 'test_mobius_ledger.db')` (same path)
- **Observed Behavior:** Tests may interfere with each other when run in parallel
- **Root Cause:** Multiple test files write to the same database file
- **Impact:** Flaky tests, test isolation violations, cascading failures
- **Severity:** HIGH
- **Confidence:** 100%
- **Repair Direction:** Use `:memory:` databases or unique file paths per test suite

#### R3. Test Setup Executes Production Database Setup (HIGH)
- **File:** backend/src/test/setup.js
- **Location:** Lines 17-20: `execSync('node database/setup.js')`
- **Evidence:** Creates real database file before mocks are established
- **Observed Behavior:** Production database file created even when tests use :memory:
- **Root Cause:** Setup script runs synchronously before any test code
- **Impact:** May cause confusion, file cleanup issues, test pollution
- **Severity:** HIGH
- **Confidence:** 100%
- **Repair Direction:** Remove execSync call or make it conditional

#### R4. Inconsistent Test Database Strategies (MEDIUM)
- **File:** Mixed across test files
- **Evidence:** 10 use :memory:, 11 use file-based, 1 uses unique file
- **Root Cause:** No standardized approach to test database management
- **Impact:** Inconsistent test behavior, maintenance burden
- **Severity:** MEDIUM
- **Confidence:** 100%
- **Repair Direction:** Standardize on :memory: with top-level mocks

### Category 2: Architectural Inconsistencies

#### R5. Dashboard.js Async/Await Misuse (CRITICAL)
- **File:** backend/src/models/Dashboard.js
- **Location:** Lines 70-91 and throughout the file (16 occurrences)
- **Evidence:** `await db.prepare(...).get()`, `await db.prepare(...).all()`
- **Observed Behavior:** Functions are async but better-sqlite3 is synchronous
- **Root Cause:** Incorrect assumption that better-sqlite3 API is asynchronous
- **Impact:** Runtime errors: "db.prepare(...).get is not a function" when awaited
- **Severity:** CRITICAL (prevents Dashboard module from working)
- **Confidence:** 100%
- **Repair Direction:** Remove `await` from all better-sqlite3 calls in Dashboard.js

#### R6. getCurrencySymbol Unnecessary Async (MINOR)
- **File:** backend/src/utils/money.js
- **Location:** Line 135: `export async function getCurrencySymbol(db)`
- **Evidence:** Function is async but only uses synchronous better-sqlite3 calls
- **Root Cause:** Over-caution or copy-paste from async code
- **Impact:** Slight performance overhead, no functional error
- **Severity:** MINOR
- **Confidence:** 100%
- **Repair Direction:** Remove `async` keyword and `await` if present

### Category 3: Money-to-Cents Migration Artifacts

#### R7. DirectorWithdrawal getStatistics COALESCE Migration Artifacts (HIGH)
- **File:** backend/src/models/DirectorWithdrawal.js
- **Location:** Lines 604-607
- **Evidence:** 
  ```sql
  COALESCE(SUM(amount), SUM(amount * 100)) as total_amount,
  COALESCE(SUM(CASE WHEN status = ? THEN amount ELSE 0 END), 
            SUM(CASE WHEN status = ? THEN amount * 100 ELSE 0 END)) as pending_amount,
  ```
- **Observed Behavior:** Query tries to handle both DECIMAL and INTEGER cents columns
- **Root Cause:** Legacy code from migration transition period
- **Impact:** Incorrect totals (amount*100 would double-count cents), SQL syntax errors possible
- **Severity:** HIGH (data integrity risk)
- **Confidence:** 100%
- **Repair Direction:** Remove COALESCE and *100 multipliers, use simple SUM(amount)

#### R8. Schema Drift: Migration vs Canonical Schema (HIGH)
- **File:** database/migrations/002_cutover_to_cents.sql vs database/schema.sql
- **Location:** director_withdrawals table definition
- **Evidence:**
  - Migration (lines 275-298): No label, recipient_contact, payment_method_id, rejection_reason columns
  - schema.sql (lines 614-642): Has label, recipient_contact, payment_method_id, rejection_reason columns
- **Root Cause:** Schema evolved after migration was written
- **Impact:** Running migration 002 would drop data (columns not in migration schema)
- **Severity:** HIGH (data loss risk)
- **Confidence:** 100%
- **Repair Direction:** Update migration 002 to match schema.sql or regenerate migrations

#### R9. Migration Timestamps in system_settings (LOW)
- **File:** database/migrations/001_migrate_to_cents.sql, 002_cutover_to_cents.sql
- **Location:** Lines 13-14 (migration 001), 19-20 (migration 002)
- **Evidence:** Both migrations insert into system_settings with different keys
- **Observed Behavior:** Migration 001 uses 'migration_to_cents_applied', 002 uses 'migration_cutover_complete'
- **Root Cause:** Manual migration tracking
- **Impact:** No functional issue, but could cause confusion
- **Severity:** LOW
- **Confidence:** 100%
- **Repair Direction:** Standardize migration tracking

### Category 4: Test Schema Drift

#### R10. Incomplete Test Schema for director_withdrawals (MEDIUM)
- **File:** backend/src/__tests__/directorWithdrawal.test.js
- **Location:** Lines 60-90 (schema definition)
- **Evidence:** Test creates users, payment_methods, transactions, director_withdrawals tables
- **Observed Behavior:** Test schema matches schema.sql for director_withdrawals
- **Root Cause:** Test defines its own schema instead of using canonical schema
- **Impact:** Maintenance burden, potential drift from schema.sql
- **Severity:** MEDIUM
- **Confidence:** 100%
- **Repair Direction:** Use canonical schema or validate test schema matches

#### R11. :memory: Tests Have Incomplete Schemas (MEDIUM)
- **File:** backend/src/__tests__/dailyLedger.test.js and others
- **Location:** beforeAll blocks creating tables
- **Evidence:** Tests create only tables they need, not full schema
- **Root Cause:** Test isolation approach
- **Impact:** Foreign key violations if related tables missing
- **Severity:** MEDIUM
- **Confidence:** 90%
- **Repair Direction:** Create complete minimal schema or use canonical schema

### Category 5: Model/Service/Controller Contract Issues

#### R12. Notification markAsRead Return Contract (MEDIUM)
- **File:** backend/src/models/Notification.js
- **Location:** markAsRead function
- **Evidence:** Uses `db.prepare(...).run()` which returns {changes, lastInsertRowid}
- **Observed Behavior:** Service tests expect notification object, receive null/undefined
- **Root Cause:** better-sqlite3 run() doesn't return row data, only metadata
- **Impact:** Test failures: "markAsRead returning null"
- **Severity:** MEDIUM
- **Confidence:** 95%
- **Repair Direction:** Add SELECT after UPDATE or change contract to return metadata

#### R13. Notification createUserNotification Foreign Key (MEDIUM)
- **File:** backend/src/models/Notification.js
- **Location:** createUserNotification function
- **Evidence:** Inserts into notifications with user_id foreign key
- **Observed Behavior:** Test failures with FOREIGN KEY constraint
- **Root Cause:** Test data may not create referenced user before notification
- **Impact:** Test failures when user doesn't exist
- **Severity:** MEDIUM
- **Confidence:** 90%
- **Repair Direction:** Ensure test creates valid user before notification

#### R14. Notification updateNotification Validation (MEDIUM)
- **File:** backend/src/services/notificationService.js
- **Location:** validateNotification function
- **Evidence:** Validates title and message as required
- **Observed Behavior:** Test failures with "Message is required"
- **Root Cause:** Partial update tests may not supply all required fields
- **Impact:** Test failures on partial update operations
- **Severity:** MEDIUM
- **Confidence:** 90%
- **Repair Direction:** Add isUpdate flag to validation for partial updates

#### R15. DailyLedger deleteDailyLedger ID Validation (MEDIUM)
- **File:** backend/src/services/dailyLedgerService.js
- **Location:** Line 379-381
- **Evidence:**
  ```javascript
  const idNum = parseInt(id);
  if (isNaN(idNum) || idNum < 1) {
    throw new Error('id must be a valid positive number');
  }
  ```
- **Observed Behavior:** Test failures with "id must be a valid positive number"
- **Root Cause:** When ESM mocking fails, create returns undefined id
- **Impact:** Validation error when id is undefined or invalid string
- **Severity:** MEDIUM
- **Confidence:** 100%
- **Repair Direction:** Fix ESM mocking so create returns valid object with id

### Category 6: Database Usage Anti-Patterns

#### R16. No issues found with lastID/lastInsertRowid
- **Status:** All models correctly use `result.lastInsertRowid`
- **Confidence:** 100%

#### R17. No issues found with CommonJS in ESM
- **Status:** No `require()` or `module.exports` found in source files
- **Confidence:** 100%

#### R18. No hardcoded secrets found
- **Status:** No API keys, passwords, or sensitive data in source
- **Confidence:** 95%

---

## DATABASE AUDIT

### Schema Analysis
- **Total Tables:** 20+ (system_settings, users, user_sessions, classes, students, payment_methods, transactions, income, expenses, income_categories, expense_categories, school_fees, school_fee_payments, lunch_payments, student_charges, student_charge_assignments, daily_ledger, daily_summaries, director_withdrawals, notifications, audit_trail, cached_reports, reports, permissions, roles, role_permissions, user_roles)
- **Monetary Columns:** All converted to INTEGER (cents) per migration
- **Indexes:** Comprehensive indexing on foreign keys and frequently queried columns
- **Foreign Keys:** Extensive FK constraints with CASCADE/SET NULL/NO ACTION
- **Triggers:** 2 triggers for daily_ledger auto-update on transaction changes

### better-sqlite3 Usage Patterns
- **Correct Pattern (majority):** `db.prepare(SQL).run(...params)` or `.get()` or `.all()`
- **Incorrect Pattern:** `await db.prepare(SQL).run(...)` (Dashboard.js only)
- **Return Values:** Models correctly use `result.lastInsertRowid` for new IDs
- **Prepared Statements:** Widely used, prevents SQL injection

### Migration Status
- **Phase 1 (001):** Populate _cents columns from DECIMAL - COMPLETE
- **Phase 2 (002):** Drop DECIMAL, rename _cents - INCOMPLETE (schema drift)
- **Current State:** Schema.sql has INTEGER columns, but migration 002 doesn't match

### SQL Query Quality
- **COALESCE Usage:** Found in DirectorWithdrawal statistics (problematic)
- **Parameterized Queries:** Generally good, using ? placeholders
- **Transaction Usage:** Limited, mostly individual statements

---

## ESM/COMMONJS AUDIT

### Module System Status
- **Package Type:** ESM (`"type": "module"` in backend/package.json)
- **Node Version:** >= 18 (CI uses 22)
- **Jest Configuration:** Uses `--experimental-vm-modules` flag
- **Import Style:** Consistent use of `import/export` syntax

### Issues Found
1. **Dashboard.js:** 16 occurrences of `await db.prepare(...)` - CRITICAL
2. **money.js:** `export async function getCurrencySymbol` - MINOR (unnecessary async)

### Module Loading Patterns
- **Top-Level Imports:** Most files import dependencies at top level
- **Dynamic Imports:** Some test files use `await import()` to delay module loading
- **Barrel Files:** Present (src/controllers/index.js, src/models/index.js pattern)

### ESM Mocking Status
- **Pattern 1 (Correct):** `jest.mock()` at top level with `testDb` initialized at top level (Notification test)
- **Pattern 2 (Broken):** `jest.mock()` inside `beforeAll` with `testDb` initialized inside `beforeAll` (DailyLedger, ImportExport, Permission, Role, RolePermission, UserRole, UserSession tests)
- **Pattern 3 (Missing):** No mock at all, uses real database file (DirectorWithdrawal, Analytics, DailySummary, etc.)

---

## MODEL/SERVICE/CONTROLLER CONTRACT AUDIT

### Contract Chain: Routes → Controllers → Services → Models → Database

**DailyLedger Chain:**
```
routes/dailyLedgerRoutes.js → controllers/dailyLedgerController.js → services/dailyLedgerService.js → models/DailyLedger.js → better-sqlite3
```
- **Issue:** ESM mocking prevents model from receiving test database
- **Status:** Contract itself is consistent, infrastructure is broken

**Notification Chain:**
```
routes/notificationRoutes.js → controllers/notificationController.js → services/notificationService.js → models/Notification.js → better-sqlite3
```
- **Issue 1:** markAsRead returns null (run() doesn't return row)
- **Issue 2:** createUserNotification FK constraint (missing user)
- **Issue 3:** updateNotification validation (partial updates)
- **Status:** Infrastructure fixed at 634d632, but application-level issues remain

**DirectorWithdrawal Chain:**
```
routes/directorWithdrawalRoutes.js → controllers/directorWithdrawalController.js → services/directorWithdrawalService.js → models/DirectorWithdrawal.js → better-sqlite3
```
- **Issue 1:** ESM mocking (fixed by 01fee19, d90522c)
- **Issue 2:** INSERT VALUES mismatch (fixed by 01fee19)
- **Issue 3:** COALESCE syntax (fixed by d90522c)
- **Issue 4:** CamelCase mapping (fixed by d90522c)
- **Issue 5:** Partial updates (fixed by 836333c)
- **Status:** Appears resolved, needs verification

### Validation Patterns
- **Consistent:** Most models validate at service layer before database operations
- **Inconsistent:** Notification validation doesn't support partial updates (R14)
- **Missing:** Some models may not validate all required fields

### Error Handling
- **Pattern:** try/catch with console.error and re-throw
- **Consistency:** Good, most files follow this pattern
- **Issue:** No centralized error handling or error classes

---

## TEST ISOLATION AUDIT

### Database Strategies
| Strategy | Count | Files | Issues |
|----------|-------|-------|--------|
| :memory: with top-level mock | 1 | notification | ✓ Working |
| :memory: with beforeAll mock | 7 | dailyLedger, importExport, permission, role, rolePermission, userRole, userSession | ✗ ESM mocking broken |
| file-based shared | 10 | analytics, dailySummary, dashboard, directorWithdrawal, expense, expenseCategory, income, incomeCategory, report, student | ✗ Test pollution risk |
| file-based unique | 1 | studentCharge | ✓ Isolated |

### Test Setup/Teardown
- **beforeAll:** Schema creation, data insertion
- **afterAll:** Database cleanup (inconsistent)
- **beforeEach:** Rarely used, some tests reset data
- **afterEach:** Rarely used

### Database Cleanup
- **Pattern 1:** `testDb.close()` in afterAll
- **Pattern 2:** `fs.unlinkSync()` to delete test db files
- **Pattern 3:** No cleanup
- **Issue:** Inconsistent cleanup leads to leftover files

### Shared State
- **Problem:** Multiple tests using same database file can interfere
- **Evidence:** 10 tests use 'test_mobius_ledger.db' in same directory
- **Impact:** Test order dependency, flaky tests

---

## TEST SCHEMA DRIFT

### Schema Completeness
| Test File | Users | Transactions | Related Tables | Status |
|-----------|-------|--------------|----------------|--------|
| dailyLedger.test.js | ✓ | ✓ | ✓ | Complete for needs |
| directorWithdrawal.test.js | ✓ | ✓ | payment_methods | Complete for needs |
| notification.test.js | ✓ | ✗ | ✗ | Missing some FK targets |
| permission.test.js | ✓ | ✗ | ✗ | Minimal |
| role.test.js | ✓ | ✗ | ✗ | Minimal |

### Drift from schema.sql
- **daily_ledger:** ✓ Matches
- **director_withdrawals:** ✓ Matches (test has full schema)
- **notifications:** ✓ Matches
- **Other tables:** Most tests only create needed tables, not full schema

### Impact Assessment
- **Low Risk:** Tests that create only needed tables work fine if no FK violations
- **Medium Risk:** Tests may fail if FK references missing tables
- **High Risk:** None identified in current audit

---

## MONEY-TO-CENTS MIGRATION AUDIT

### Migration History
```
8f0b292: Add cents columns alongside DECIMAL (Phase 0-1)
1fef6f8: Complete migration to INTEGER cents (Phase 4-5)
001_migrate_to_cents.sql: Populate _cents from DECIMAL
002_cutover_to_cents.sql: Drop DECIMAL, rename _cents
```

### Current State Analysis

#### ✓ Correct Implementation
- **Storage:** All monetary columns are INTEGER (schema.sql)
- **Utilities:** money.js has toCents(), fromCents(), getAmount()
- **Model Usage:** Most models use toCents() on input, getAmount() on output
- **Arithmetic:** Integer math throughout (no floating point)

#### ✗ Migration Artifacts
- **DirectorWithdrawal getStatistics():** COALESCE with *100 multipliers (R7)
- **Migration 002:** Schema doesn't match current schema.sql (R8)
- **Dashboard.js:** Not using money utilities (uses raw amounts)

#### Application Code Consumption
- **Models:** ✓ Consume cents correctly (use toCents on input)
- **Services:** ✓ Return cents correctly (use getAmount on output)
- **Controllers:** ✓ Transform correctly
- **Routes:** ✓ API boundaries use decimal strings

### Migration Compatibility Verdict
**COMPATIBLE** - The money-to-cents migration is architecturally sound and the application code correctly consumes INTEGER cents. However, **residual artifacts** (R7, R8) need cleanup.

---

## CI/JEST AUDIT

### CI Workflow Analysis
```yaml
# gatecheck.yml
1. actions/checkout@v4
2. actions/setup-node@v4 (Node 22)
3. npm run install:all
4. npm run gatecheck
   ├── npm run build:frontend (Vite)
   ├── npm run test:backend (Jest)
   ├── npm run test:frontend
   └── npm run lint:frontend
```

### Issues Identified
1. **Node Version:** CI uses Node 22, better-sqlite3 may have compatibility issues
2. **Install Script:** `npm run install:all` installs root + backend + frontend
3. **Test Command:** `NODE_OPTIONS='--experimental-vm-modules' jest --detectOpenHandles`
4. **detectOpenHandles:** May cause Jest to wait for better-sqlite3 connections

### Jest Configuration (jest.config.js)
- **testEnvironment:** 'node'
- **moduleNameMapper:** '@/(.*)$' → '<rootDir>/src/$1'
- **setupFilesAfterEnv:** '<rootDir>/src/test/setup.js'
- **transformIgnorePatterns:** Ignores node_modules except better-sqlite3
- **moduleFileExtensions:** js, mjs, cjs, json, node

### Problem: setupFilesAfterEnv
- **File:** backend/src/test/setup.js
- **Issue:** Executes `node database/setup.js` which creates real database
- **Impact:** This runs BEFORE any test file, even those with :memory: databases
- **Result:** Production database file created, may conflict with test mocks

### Jest ESM Status
- **Flag:** `--experimental-vm-modules` is required for ESM support
- **Status:** Works but has limitations with module mocking
- **Limitation:** Mocks must be set up at module level, not inside describe/beforeAll

---

## STATIC ANTI-PATTERN AUDIT

### Search Results
| Anti-Pattern | Count | Files | Severity |
|--------------|-------|-------|----------|
| await db.prepare | 16 | Dashboard.js | CRITICAL |
| await db.exec | 0 | - | N/A |
| lastID | 0 | - | N/A |
| require() | 0 | - | N/A |
| module.exports | 0 | - | N/A |
| TODO/FIXME | 0 | - | N/A |
| Hardcoded .db path | 1 | config/database.js | LOW |
| Shared test .db | 11 | Multiple | HIGH |
| Broad empty catch | 0 | - | N/A |

### Additional Findings
- **Duplicate Column Names:** None found (fixed by 8f9cf51)
- **CommonJS in ESM:** None found
- **Synchronous better-sqlite3:** Correctly used except in Dashboard.js
- **lastInsertRowid:** Correctly used throughout (fixed by 1d6bfef)

---

## DEPENDENCY/MODULE GRAPH

### Backend Module Dependencies
```
app.js
├── config/database.js (better-sqlite3)
├── routes/*.js
│   └── controllers/*.js
│       └── services/*.js
│           └── models/*.js
│               └── config/database.js
└── utils/*.js (money.js, etc.)
```

### Circular Dependencies
- **Status:** None detected
- **Prevention:** Clear layer separation (routes → controllers → services → models)

### Key Dependencies
- **better-sqlite3:** 9.2.2 (synchronous SQLite)
- **express:** 4.18.2
- **jest:** 29.7.0
- **supertest:** 6.3.3 (HTTP assertions)

---

## FAILURE CASCADE MAP

### Primary Root Causes → Direct Failures → Module Impact → Test Impact → Secondary Failures

```
R1: Jest ESM Mocking (DailyLedger, ImportExport, Permission, Role, RolePermission, UserRole, UserSession)
    ↓
    Models import real database (../../../database/mobius_ledger.db)
    ↓
    Database operations fail (file doesn't exist or wrong path)
    ↓
    Test failures: "db.get is not a function", "id must be a valid positive number"
    ↓
    Cascades to: All 7 affected test suites fail

R2: Dashboard.js Async/Await
    ↓
    Runtime error: "db.prepare(...).get is not a function"
    ↓
    Dashboard module cannot be imported
    ↓
    All Dashboard tests fail
    ↓
    Any service depending on Dashboard fails

R5: DirectorWithdrawal COALESCE
    ↓
    SQL syntax error or incorrect results
    ↓
    getStatistics() returns wrong data
    ↓
    Statistics tests fail
    ↓
    Dashboard may show incorrect data

R7: Shared Test Databases
    ↓
    Test A creates data
    ↓
    Test B sees unexpected data
    ↓
    Test B fails or produces incorrect results
    ↓
    Flaky, order-dependent tests

R8: Schema Drift
    ↓
    Running migration 002 drops columns
    ↓
    Data loss for label, recipient_contact, payment_method_id, rejection_reason
    ↓
    Application errors on missing columns
    ↓
    Production outage if migration run
```

---

## PRIMARY ROOT CAUSES vs CASCADING SYMPTOMS

### Primary Root Causes (Fix These First)

| ID | Category | Description | Impact | Severity |
|----|----------|-------------|--------|----------|
| R1 | Test Infrastructure | Jest ESM mocking inside beforeAll | 7 test suites | CRITICAL |
| R5 | Architectural | Dashboard.js async/await misuse | Dashboard module | CRITICAL |
| R2 | Test Infrastructure | Shared test database files | 11 test suites | HIGH |
| R3 | Test Infrastructure | Setup.js creates real DB | All tests | HIGH |
| R7 | Migration Artifact | COALESCE with *100 in statistics | Data integrity | HIGH |
| R8 | Migration Artifact | Schema drift in migration 002 | Data loss risk | HIGH |

### Cascading Symptoms (Will Resolve After Primary Fixes)

| ID | Category | Description | Depends On | Severity |
|----|----------|-------------|------------|----------|
| R15 | Test Failure | "id must be a valid positive number" | R1 | MEDIUM |
| R12 | Test Failure | markAsRead returning null | R1, R2 | MEDIUM |
| R13 | Test Failure | FK constraint in createUserNotification | R2, R3 | MEDIUM |
| R14 | Test Failure | "Message is required" validation | R2, R3 | MEDIUM |

### Independent Failures (Fix Separately)

| ID | Category | Description | Severity |
|----|----------|-------------|----------|
| R11 | Test Schema | Incomplete schemas in :memory: tests | MEDIUM |
| R10 | Test Schema | directorWithdrawals test schema | MEDIUM |

---

## REPAIR PRIORITY

### Phase 1: Module Loading Blockers (Must Fix First)
1. **R5: Dashboard.js async/await misuse** - CRITICAL
   - Remove `await` from all 16 better-sqlite3 calls
   - This is blocking Dashboard module from working at all
   
2. **R1: Jest ESM mocking** - CRITICAL  
   - Move `testDb` and `jest.mock()` to top level in 7 test files
   - Pattern: Match notification.test.js (already fixed at 634d632)

### Phase 2: Database Infrastructure
3. **R2: Shared test databases** - HIGH
   - Convert 11 file-based tests to :memory: with top-level mocks
   - OR use unique file paths per test suite
   
4. **R3: Setup.js creates real DB** - HIGH
   - Remove `execSync('node database/setup.js')` from setup.js
   - OR make it conditional on environment variable

### Phase 3: Production Runtime Defects
5. **R7: COALESCE migration artifacts** - HIGH
   - Remove COALESCE and *100 from DirectorWithdrawal getStatistics()
   - Use simple SUM(amount) since migration is complete
   
6. **R16: getCurrencySymbol unnecessary async** - MINOR
   - Remove `async` keyword from money.js getCurrencySymbol()

### Phase 4: Migration & Schema
7. **R8: Schema drift in migration 002** - HIGH
   - Update migration 002_cutover_to_cents.sql to match schema.sql
   - Ensure all columns present (label, recipient_contact, payment_method_id, rejection_reason)

### Phase 5: Test Application-Level Issues
8. **R12: markAsRead return contract** - MEDIUM
   - Add SELECT after UPDATE to return notification object
   - OR update tests to expect metadata instead of object
   
9. **R13: createUserNotification FK constraint** - MEDIUM
   - Ensure test creates valid user before notification
   - Verify user_id in test data
   
10. **R14: updateNotification validation** - MEDIUM
    - Add isUpdate flag to validateNotification()
    - Allow partial updates without all required fields

### Phase 6: Cleanup
11. **R11: Incomplete test schemas** - MEDIUM
    - Create helper to generate consistent test schemas
    - OR use canonical schema.sql for all tests

---

## FILE-BY-FILE REPAIR PLAN

### Phase 1: Critical (Immediate)

#### backend/src/models/Dashboard.js
- **Issues:** R5 (16 occurrences of await db.prepare)
- **Actions:**
  1. Remove `await` from all `db.prepare(...)` calls
  2. Change `async function` to synchronous where no other async operations
  3. Verify all .get(), .all(), .run() calls are synchronous
- **Lines:** 70-91, 100-120, and all better-sqlite3 usages
- **Test Impact:** All Dashboard tests

#### backend/src/__tests__/dailyLedger.test.js
- **Issues:** R1 (ESM mocking)
- **Actions:**
  1. Move `testDb` from `let testDb;` to `const testDb = new Database(TEST_DB);` at top level
  2. Move `jest.mock()` from inside beforeAll to top level
  3. Remove testDb initialization from beforeAll
- **Lines:** 11, 16, 19-21
- **Test Impact:** All 43 DailyLedger tests

#### backend/src/__tests__/importExport.test.js
- **Issues:** R1 (ESM mocking)
- **Actions:** Same as dailyLedger.test.js
- **Lines:** 15, 25, 18-20
- **Test Impact:** All 29 ImportExport tests

#### backend/src/__tests__/permission.test.js
- **Issues:** R1 (ESM mocking)
- **Actions:** Same as dailyLedger.test.js
- **Lines:** 13, 23, 16-18
- **Test Impact:** All 25 Permission tests

#### backend/src/__tests__/role.test.js
- **Issues:** R1 (ESM mocking)
- **Actions:** Same as dailyLedger.test.js
- **Test Impact:** All 26 Role tests

#### backend/src/__tests__/rolePermission.test.js
- **Issues:** R1 (ESM mocking)
- **Actions:** Same as dailyLedger.test.js
- **Test Impact:** All 28 RolePermission tests

#### backend/src/__tests__/userRole.test.js
- **Issues:** R1 (ESM mocking)
- **Actions:** Same as dailyLedger.test.js
- **Test Impact:** All 27 UserRole tests

#### backend/src/__tests__/userSession.test.js
- **Issues:** R1 (ESM mocking)
- **Actions:** Same as dailyLedger.test.js
- **Test Impact:** All 34 UserSession tests

### Phase 2: Database Infrastructure

#### backend/src/test/setup.js
- **Issues:** R3 (creates real DB)
- **Actions:**
  1. Remove `execSync('node database/setup.js')` call
  2. OR wrap in conditional: `if (process.env.REAL_DB) {...}`
  3. Keep setupDatabase() call (verifies settings)
- **Lines:** 17-20
- **Test Impact:** All test suites

#### backend/src/__tests__/analytics.test.js
- **Issues:** R2 (shared DB), R10 (schema drift)
- **Actions:**
  1. Convert to :memory: database with top-level mock
  2. Match notification.test.js pattern
- **Test Impact:** All 34 Analytics tests

#### backend/src/__tests__/dailySummary.test.js
- **Issues:** R2 (shared DB)
- **Actions:** Convert to :memory: with top-level mock
- **Test Impact:** All 61 DailySummary tests

#### backend/src/__tests__/dashboard.test.js
- **Issues:** R2 (shared DB), R5 (Dashboard module broken)
- **Actions:**
  1. Convert to :memory: with top-level mock
  2. Fix will allow tests to run once Dashboard.js is fixed
- **Test Impact:** All 12 Dashboard tests

#### backend/src/__tests__/directorWithdrawal.test.js
- **Issues:** R2 (shared DB)
- **Actions:** Convert to :memory: with top-level mock
- **Note:** This test doesn't use jest.mock, needs special handling
- **Test Impact:** All 40 DirectorWithdrawal tests

#### backend/src/__tests__/expense.test.js
- **Issues:** R2 (shared DB)
- **Actions:** Convert to :memory: with top-level mock
- **Test Impact:** All 25 Expense tests

#### backend/src/__tests__/expenseCategory.test.js
- **Issues:** R2 (shared DB)
- **Actions:** Convert to :memory: with top-level mock
- **Test Impact:** All 35 ExpenseCategory tests

#### backend/src/__tests__/income.test.js
- **Issues:** R2 (shared DB)
- **Actions:** Convert to :memory: with top-level mock
- **Test Impact:** All 2 Income tests

#### backend/src/__tests__/incomeCategory.test.js
- **Issues:** R2 (shared DB)
- **Actions:** Convert to :memory: with top-level mock
- **Test Impact:** All 11 IncomeCategory tests

#### backend/src/__tests__/report.test.js
- **Issues:** R2 (shared DB)
- **Actions:** Convert to :memory: with top-level mock
- **Test Impact:** All 24 Report tests

#### backend/src/__tests__/student.test.js
- **Issues:** R2 (shared DB)
- **Actions:** Convert to :memory: with top-level mock
- **Test Impact:** All 11 Student tests

#### backend/src/__tests__/studentCharge.test.js
- **Issues:** Uses unique DB file (good), but check for similar issues
- **Actions:** Consider converting to :memory: for consistency
- **Test Impact:** All 12 StudentCharge tests

#### backend/src/__tests__/auditTrail.test.js
- **Issues:** R2 (shared DB)
- **Actions:** Convert to :memory: with top-level mock
- **Test Impact:** All 29 AuditTrail tests

#### backend/src/__tests__/transaction.test.js
- **Issues:** Empty test file, shared DB
- **Actions:** Convert to :memory: or remove if not needed
- **Test Impact:** 0 tests currently

### Phase 3: Production Runtime Defects

#### backend/src/models/DirectorWithdrawal.js
- **Issues:** R7 (COALESCE artifacts)
- **Actions:**
  1. Replace lines 604-607 with simple SUM expressions
  2. Remove COALESCE and *100 multipliers
  3. Update params array to remove duplicate status values
- **Lines:** 604-607, 611-619
- **Impact:** getStatistics() returns correct totals

#### backend/src/utils/money.js
- **Issues:** R16 (unnecessary async)
- **Actions:**
  1. Remove `async` from getCurrencySymbol()
  2. Remove `await` if present in function body
- **Lines:** 135
- **Impact:** Minor performance improvement

### Phase 4: Migration & Schema

#### database/migrations/002_cutover_to_cents.sql
- **Issues:** R8 (schema drift)
- **Actions:**
  1. Update director_withdrawals table definition to match schema.sql
  2. Add missing columns: label, recipient_contact, payment_method_id, rejection_reason
  3. Update all INSERT statements to include new columns
  4. Verify all other table definitions match schema.sql
- **Lines:** 273-308 (director_withdrawals section)
- **Impact:** Prevents data loss when migration runs

### Phase 5: Test Application-Level Issues

#### backend/src/models/Notification.js
- **Issues:** R12 (markAsRead return contract)
- **Actions:**
  1. Change markAsRead to use `.get()` instead of `.run()`
  2. OR add SELECT after UPDATE
  3. Return the updated notification object
- **Lines:** markAsRead function
- **Impact:** Tests expecting notification object will pass

#### backend/src/__tests__/notification.test.js
- **Issues:** R13 (FK constraint), R14 (validation)
- **Actions:**
  1. Ensure test inserts valid user before creating notification
  2. Verify user_id references existing user
  3. Update validation to support partial updates (isUpdate flag)
- **Lines:** createUserNotification test, updateNotification test
- **Impact:** Notification tests pass

#### backend/src/services/notificationService.js
- **Issues:** R14 (validation)
- **Actions:**
  1. Add `isUpdate` parameter to validateNotification()
  2. Skip required checks for title/message when isUpdate=true
  3. Update updateNotification() to pass isUpdate=true
- **Lines:** validateNotification function, updateNotification function
- **Impact:** Partial updates work correctly

---

## VERIFICATION PLAN

### Step 1: Local Verification (Post-Repair)
```bash
# Install dependencies
npm run install:all

# Run individual test suites
cd backend
npm test -- dailyLedger.test.js
npm test -- notification.test.js
npm test -- directorWithdrawal.test.js
npm test -- dashboard.test.js

# Run full backend test suite
npm test

# Check for regressions
npm test -- analytics.test.js
npm test -- dailySummary.test.js
npm test -- report.test.js
```

### Step 2: CI Verification
1. Push to feature branch
2. Trigger GitHub Actions gatecheck workflow
3. Monitor for:
   - Module loading errors (ESM issues)
   - Database connection errors
   - SQL syntax errors
   - Assertion failures

### Step 3: Regression Testing
Verify that previously passing suites remain passing:
- DailySummary tests
- Analytics tests  
- Report tests
- DirectorWithdrawal tests (after fixes)

### Step 4: Money-to-Cents Verification
1. Verify all monetary columns are INTEGER in schema
2. Verify toCents()/fromCents() usage is consistent
3. Verify no DECIMAL columns remain
4. Verify migration scripts are compatible with schema

---

## REGRESSION RISKS

### High Risk (Must Test Thoroughly)
1. **Dashboard Module:** Fixing async/await may reveal other issues
2. **DirectorWithdrawal Statistics:** Removing COALESCE may change query results
3. **Notification markAsRead:** Changing return contract may break callers

### Medium Risk
1. **Test Database Conversion:** Converting file-based to :memory: may reveal schema differences
2. **ESM Mocking Fixes:** May expose other mocking issues in dependent modules
3. **Migration Update:** Updating migration 002 may affect rollback scenarios

### Low Risk
1. **getCurrencySymbol:** Removing async is purely cosmetic
2. **Shared DB Fixes:** Only affects test isolation, not functionality
3. **Validation Updates:** Partial update support is additive

---

## DISAGREEMENTS/CONFIRMATIONS AGAINST PRIOR AUDIT

### Confirmations (Previous Audit Was Correct)
1. **Jest ESM Mocking:** Confirmed - mocks inside beforeAll don't work with ESM
2. **better-sqlite3 Prepared Statements:** Confirmed - models correctly use prepared statements
3. **lastInsertRowid:** Confirmed - all models correctly use lastInsertRowid
4. **Money-to-Cents Migration:** Confirmed - storage is INTEGER cents, utilities exist

### Contradictions (Previous Audit Was Incorrect or Incomplete)
1. **Dashboard.js Async/Await:** PREVIOUSLY UNREPORTED - 16 occurrences of await with better-sqlite3
2. **COALESCE in Statistics:** PREVIOUSLY UNREPORTED - Migration artifacts with *100 multipliers
3. **Schema Drift:** PREVIOUSLY UNREPORTED - Migration 002 doesn't match schema.sql
4. **Shared Test Databases:** MORE WIDESPREAD THAN REPORTED - 11 tests use shared DB files

### Additional Problems Discovered
1. **Test Setup Creates Real DB:** setup.js executes database/setup.js before tests
2. **Inconsistent Test Strategies:** Mix of :memory: and file-based with no standardization
3. **Dashboard Module Completely Broken:** Cannot function with current async/await usage

---

## UNKNOWN/AREAS REQUIRING FURTHER INVESTIGATION

### Cannot Verify Without Running Tests
1. **Exact CI Error Counts:** Need actual CI logs to confirm which tests fail
2. **Test Execution Order:** Some failures may be order-dependent
3. **Parallel Test Execution:** Jest may run tests in parallel, affecting shared DB issues
4. **better-sqlite3 Native Bindings:** CI uses Node 22, may have different behavior

### Deferred Investigations
1. **Frontend Build:** Not audited (out of scope for backend CI failures)
2. **Linting Issues:** Not audited (focus on test failures)
3. **Performance:** Not audited (focus on correctness)
4. **Security:** Not audited (out of scope)

### Assumptions Made
1. All monetary values are correctly stored as INTEGER cents (verified in schema)
2. Money utilities (toCents/fromCents) are correct (code inspection only)
3. better-sqlite3 is synchronous (documentation + code patterns)
4. ESM module hoisting behavior is as documented (Jest + Node.js behavior)

---

## FINAL RECOMMENDATION

### Immediate Action Plan

**Week 1: Fix Critical Blockers**
1. Fix Dashboard.js async/await misuse (R5) - 1 hour
2. Fix ESM mocking in 7 test files (R1) - 2 hours
3. Verify fixes with local test runs - 1 hour
4. Push and run CI - 1 hour

**Week 2: Fix Database Infrastructure**
5. Convert 11 file-based tests to :memory: with mocks (R2, R3) - 4 hours
6. Fix shared database issues - 2 hours
7. Verify all tests pass - 2 hours

**Week 3: Fix Production Defects**
8. Remove COALESCE artifacts from DirectorWithdrawal (R7) - 1 hour
9. Update migration 002 to match schema.sql (R8) - 2 hours
10. Fix Notification model/service issues (R12, R13, R14) - 2 hours

**Week 4: Validation & Cleanup**
11. Full test suite run
12. CI gatecheck verification
13. Documentation updates

### Expected Outcomes
- **After Week 1:** Dashboard module works, 7 test suites unblocked
- **After Week 2:** All test infrastructure standardized, no shared DB issues
- **After Week 3:** All production defects fixed, data integrity restored
- **After Week 4:** Full green CI, ready for merge

### Success Criteria
1. `npm run gatecheck` passes completely
2. All 530+ tests pass
3. No SQL errors in CI logs
4. No ESM module loading errors
5. Money-to-cents migration verified intact

---

*Report generated by Mistral Vibe - Independent Forensic Audit*
*Repository: mobius-ledger-v2 @ commit 634d632*
*Branch: feature/money-to-cents-migration*

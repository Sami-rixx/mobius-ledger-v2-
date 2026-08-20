# MÖBIUS LEDGER v2 — CONSOLIDATED REPAIR SPECIFICATION

**Document Type:** Repair Specification  
**Generated:** 2026-08-15  
**Source Audits:**
- `FORENSIC_AUDIT_VIBE.md` (Commit 26662a4, based on repository state at 634d632)
- `KIMI_FORENSIC_AUDIT.md` (Placeholder, no content beyond heading)

**Current Repository State:** Commit 2052841 (`feature/money-to-cents-migration`)

---

## EXECUTIVE SUMMARY

This document consolidates findings from `FORENSIC_AUDIT_VIBE.md` and verifies them against the current repository state (commit 2052841). Several issues documented in `FORENSIC_AUDIT_VIBE.md` have been resolved by subsequent commits. The remaining issues are prioritized below for immediate action.

**Key Discovery:** The repository has seen active remediation since the forensic audit was conducted. Multiple critical test infrastructure issues (ESM mocking) have been resolved, but core production runtime defects and migration artifacts remain.

---

## VERIFICATION RESULTS

### ✅ CONFIRMED FIXED (No Action Required)

| ID | Issue | Audit Claim | Current Status | Fixing Commit |
|----|-------|-------------|----------------|---------------|
| R1 | Jest ESM Mocking Limitation | 7 test files with mocks inside beforeAll | **RESOLVED** | 2966852, 634d632 |
| R14 | Notification validation for partial updates | validateNotification lacks isUpdate support | **RESOLVED** | d90522c, 01fee19 |
| R12 | markAsRead return contract | Returns null instead of notification object | **RESOLVED** | d90522c |
| R13 | createUserNotification FK constraint | Test FK violations | **RESOLVED** | d90522c |

**Verification:**
- `dailyLedger.test.js`, `importExport.test.js`, `permission.test.js`, `role.test.js`, `rolePermission.test.js`, `userRole.test.js`, `userSession.test.js`: All have `testDb` and `jest.mock()` at top level (lines 1-10)
- `notificationService.js:39`: `validateNotification(data, isUpdate = false)` parameter exists
- `notificationService.js:220`: `validateNotification(updateData, true)` called for updates
- `Notification.js`: `updateNotification` returns object via `getNotificationById(id)`
- `notification.test.js`: Users created before notifications, preventing FK violations

### ⚠️ STILL REQUIRES REPAIR (Action Required)

| Priority | ID | Issue | Severity | Files Affected | Lines |
|----------|----|-------|----------|----------------|-------|
| **P0** | R5 | Dashboard.js async/await misuse | CRITICAL | `backend/src/models/Dashboard.js` | 16 occurrences |
| **P0** | R7 | DirectorWithdrawal COALESCE migration artifacts | HIGH | `backend/src/models/DirectorWithdrawal.js` | 604-607 |
| **P0** | R8 | Schema drift: migration 002 vs schema.sql | HIGH | `database/migrations/002_cutover_to_cents.sql` | 273-308 |
| **P1** | R2 | Shared test database files | HIGH | 10 test files | Various |
| **P1** | R3 | Test setup creates real database | HIGH | `backend/src/test/setup.js` | 17-20 |
| **P2** | R6 | getCurrencySymbol unnecessary async | MINOR | `backend/src/utils/money.js` | 135 |

---

## DETAILED REPAIR SPECIFICATIONS

### P0: CRITICAL PRODUCTION RUNTIME DEFECTS

#### R5: Dashboard.js Async/Await Misuse

**Problem:** `better-sqlite3` is a **synchronous** library, but Dashboard.js uses `await` on all database operations (16 occurrences). This causes runtime errors: `"db.prepare(...).get is not a function"` when the await resolves to undefined.

**Current State:** ❌ **UNFIXED** - All 16 occurrences remain in current code

**Evidence:**
```
$ grep -n "await db.prepare" backend/src/models/Dashboard.js | wc -l
16
```

**Repair:**
1. Remove `await` keyword from all `db.prepare(...).get()`, `.all()`, `.run()` calls
2. Change all `export async function` declarations to synchronous where no other async operations exist
3. Verify all functions remain properly functional

**Files:**
- `backend/src/models/Dashboard.js` (lines 70, 75, 81, 87, 117, 122, 133, 163, 168, 173, 205, 243, 256, 299, 354, 355, 356, 357, 358)

**Test Impact:** Dashboard module cannot be imported until fixed. All 12 dashboard.test.js tests blocked.

**Verification Command:**
```bash
cd backend && node -e "import('./src/models/Dashboard.js')" 2>&1 | grep -i "error"
# Should produce NO errors after fix
```

---

#### R7: DirectorWithdrawal COALESCE Migration Artifacts

**Problem:** `getStatistics()` method contains COALESCE expressions mixing raw cents with `cents * 100` values. This is a legacy artifact from the money-to-cents migration. Since all monetary columns are now INTEGER cents, the COALESCE and `*100` multipliers are incorrect and will produce wrong totals (double-counting).

**Current State:** ❌ **UNFIXED** - COALESCE with *100 still present

**Evidence:**
```sql
-- Lines 604-607
COALESCE(SUM(${FIELDS.AMOUNT}), SUM(${FIELDS.AMOUNT} * 100)) as total_amount,
COALESCE(SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN ${FIELDS.AMOUNT} ELSE 0 END), 
          SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN ${FIELDS.AMOUNT} * 100 ELSE 0 END)) as pending_amount,
COALESCE(SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN ${FIELDS.AMOUNT} ELSE 0 END), 
          SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN ${FIELDS.AMOUNT} * 100 ELSE 0 END)) as approved_amount,
COALESCE(SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN ${FIELDS.AMOUNT} ELSE 0 END), 
          SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN ${FIELDS.AMOUNT} * 100 ELSE 0 END)) as rejected_amount
```

**Repair:**
1. Remove COALESCE wrapper and `*100` multipliers from all SUM expressions
2. Use simple SUM(amount) since migration to cents is complete
3. Update params array to remove duplicate status values (lines 611-619 currently have duplicates)

**Files:**
- `backend/src/models/DirectorWithdrawal.js` (lines 604-607, 611-619)

**Expected Result:**
```sql
SUM(${FIELDS.AMOUNT}) as total_amount,
SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN ${FIELDS.AMOUNT} ELSE 0 END) as pending_amount,
SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN ${FIELDS.AMOUNT} ELSE 0 END) as approved_amount,
SUM(CASE WHEN ${FIELDS.STATUS} = ? THEN ${FIELDS.AMOUNT} ELSE 0 END) as rejected_amount
```

**Data Integrity Risk:** HIGH - Statistics will show incorrect (doubled) values until fixed.

---

#### R8: Schema Drift in Migration 002

**Problem:** Migration `002_cutover_to_cents.sql` has a different schema for `director_withdrawals` table than the canonical `schema.sql`. The migration is missing 4 columns: `label`, `recipient_contact`, `payment_method_id`, `rejection_reason`. Running this migration would cause **data loss**.

**Current State:** ❌ **UNFIXED** - Migration file still has incomplete schema

**Evidence:**

`schema.sql` (canonical):
```sql
CREATE TABLE IF NOT EXISTS director_withdrawals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount INTEGER NOT NULL,
  label TEXT,
  purpose TEXT NOT NULL,
  description TEXT,
  recipient_name TEXT NOT NULL,
  recipient_contact TEXT,
  payment_method_id INTEGER,
  transaction_id INTEGER,
  withdrawal_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by INTEGER,
  approved_at DATETIME,
  rejected_by INTEGER,
  rejected_at DATETIME,
  rejection_reason TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  ... FOREIGN KEYS
);
```

`002_cutover_to_cents.sql` (migration):
```sql
CREATE TABLE director_withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER UNIQUE,
    amount INTEGER NOT NULL,
    withdrawal_date DATE NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    purpose TEXT,
    recipient_name TEXT,
    approved_by INTEGER,
    approved_at DATETIME,
    rejected_by INTEGER,
    rejected_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    ... FOREIGN KEYS
);
```

**Missing Columns:** `label`, `recipient_contact`, `payment_method_id`, `rejection_reason`

**Repair:**
1. Update `database/migrations/002_cutover_to_cents.sql` to match `database/schema.sql` for director_withdrawals
2. Add all missing columns to the CREATE TABLE statement
3. Update the INSERT statement (lines 289-295) to include the new columns
4. Verify all other table definitions in migration 002 match schema.sql

**Files:**
- `database/migrations/002_cutover_to_cents.sql` (lines 273-308)

**Data Loss Risk:** CRITICAL - Running this migration would drop the 4 missing columns and their data.

---

### P1: TEST INFRASTRUCTURE ISSUES

#### R2: Shared Test Database Files

**Problem:** 10 test files use the same shared database file path (`test_mobius_ledger.db`). This causes test isolation violations, flaky tests, and cascading failures when tests run in parallel.

**Current State:** ❌ **UNFIXED** - 10 test files still use shared database

**Evidence:**
```
$ grep -l "test_mobius_ledger.db" backend/src/__tests__/*.test.js
backend/src/__tests__/analytics.test.js
backend/src/__tests__/dailySummary.test.js
backend/src/__tests__/dashboard.test.js
backend/src/__tests__/directorWithdrawal.test.js
backend/src/__tests__/expense.test.js
backend/src/__tests__/expenseCategory.test.js
backend/src/__tests__/income.test.js
backend/src/__tests__/incomeCategory.test.js
backend/src/__tests__/report.test.js
backend/src/__tests__/student.test.js
```

**Repair Options:**
1. **Recommended:** Convert all to `:memory:` databases with top-level mocks (matching notification.test.js pattern)
2. Alternative: Use unique file paths per test suite

**Repair Pattern (Option 1):**
```javascript
// At top level of each test file:
const TEST_DB = ':memory:';
const testDb = new Database(TEST_DB);

// Mock the database module at top level
jest.mock('../config/database.js', () => ({
  default: testDb
}));

// In beforeAll, create schema and seed data
beforeAll(() => {
  testDb.exec(`CREATE TABLE ...`);
  // ... seed data
});

// In afterAll, clean up
afterAll(() => {
  testDb.close();
});
```

**Files Affected:** 10 test files (see evidence above)

**Test Impact:** HIGH - Parallel test execution will have race conditions until fixed.

---

#### R3: Test Setup Creates Real Database

**Problem:** `backend/src/test/setup.js` executes `node database/setup.js` via `execSync` on lines 17-20. This creates a real production database file before any test code runs, even for tests using `:memory:` databases. This causes file pollution and potential conflicts with test mocks.

**Current State:** ❌ **UNFIXED** - execSync call still present

**Evidence:**
```javascript
// backend/src/test/setup.js lines 17-20
const setupScriptPath = path.resolve(__dirname, '../../../database/setup.js');
execSync(`node ${setupScriptPath}`, { 
  cwd: path.dirname(setupScriptPath),
  stdio: 'inherit'
});
```

**Repair:**
1. Remove the `execSync` call entirely (lines 17-20)
2. OR wrap in conditional: `if (process.env.REAL_DB) { ... }`
3. Keep `setupDatabase()` call (line 23) which only verifies settings

**Files:**
- `backend/src/test/setup.js`

**Test Impact:** All test suites - unnecessary production DB file creation.

---

### P2: MINOR ISSUES

#### R6: getCurrencySymbol Unnecessary Async

**Problem:** `getCurrencySymbol()` in money.js is declared as `async` but only uses synchronous better-sqlite3 calls. This adds unnecessary performance overhead.

**Current State:** ❌ **UNFIXED**

**Evidence:**
```javascript
// backend/src/utils/money.js line 135
export async function getCurrencySymbol(db) {
  const result = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('currency_symbol');
  return result ? result.value : 'KES';
}
```

**Repair:**
1. Remove `async` keyword from function declaration
2. Remove any `await` if present in function body (not present in this case)

**Files:**
- `backend/src/utils/money.js` (line 135)

**Impact:** MINOR - Slight performance overhead only.

---

## PRIORITY REPAIR ORDER

| Phase | Items | Estimated Effort | Expected Outcome |
|-------|-------|------------------|-------------------|
| **Phase 1: Runtime Blockers** | R5 (Dashboard.js) | 1 hour | Dashboard module functional |
| **Phase 1: Runtime Blockers** | R7 (DirectorWithdrawal) | 1 hour | Statistics return correct values |
| **Phase 1: Runtime Blockers** | R8 (Migration 002) | 2 hours | Migration safe to run |
| **Phase 2: Test Infrastructure** | R3 (setup.js) | 30 min | No unwanted DB file creation |
| **Phase 2: Test Infrastructure** | R2 (Shared DBs) | 4 hours | All tests isolated |
| **Phase 3: Cleanup** | R6 (money.js) | 15 min | Minor optimization |

---

## DISAGREEMENTS AND RESOLUTIONS

### FORENSIC_AUDIT_VIBE.md vs Current State

| FORENSIC_AUDIT_VIBE.md Claim | Verification Status | Resolution |
|--------------------------------|---------------------|------------|
| R1: 7 test files with ESM mocking broken | **DISAGREE** | Fixed in commits 2966852, 634d632. Mocks now at top level. |
| R2: 11 test files use shared DB | **AGREE** | 10 files still use shared DB (studentCharge.test.js converted to unique file) |
| R5: 16 await db.prepare in Dashboard.js | **AGREE** | Still present, confirmed by grep |
| R7: COALESCE with *100 in DirectorWithdrawal | **AGREE** | Still present at lines 604-607 |
| R8: Schema drift in migration 002 | **AGREE** | Missing 4 columns confirmed |
| R12: markAsRead returns null | **DISAGREE** | Now returns notification object via getNotificationById |
| R13: FK constraint in createUserNotification | **DISAGREE** | Test setup creates users before notifications |
| R14: updateNotification validation | **DISAGREE** | validateNotification now has isUpdate parameter |

### KIMI_FORENSIC_AUDIT.md

**Status:** Empty placeholder file (contains only heading `# MÖBIUS LEDGER v2 — KIMI FORENSIC AUDIT`).

**Resolution:** No claims to verify or dispute. This appears to be a placeholder for a separate audit that was never populated.

---

## UNKNOWN/DEFERRED

The following areas were identified in FORENSIC_AUDIT_VIBE.md as requiring further investigation but are **NOT** blocking issues:

1. **Exact CI Error Counts** - Need actual CI logs for verification
2. **Test Execution Order** - Some failures may be order-dependent
3. **Parallel Test Execution** - Jest may run tests in parallel, affecting shared DB issues (addressed by R2)
4. **better-sqlite3 Native Bindings** - CI uses Node 22, may have different behavior in Termux

---

## SUCCESS CRITERIA

The repair effort is considered complete when ALL of the following are true:

1. ✅ Dashboard module can be imported without runtime errors
2. ✅ `getStatistics()` returns correct, non-doubled monetary values
3. ✅ Migration 002 can be run without data loss
4. ✅ All tests pass in isolation (no shared DB conflicts)
5. ✅ No production database files created during test runs
6. ✅ `npm run gatecheck` passes completely in CI

---

## ASSUMPTIONS

1. All monetary values are correctly stored as INTEGER cents (verified in schema)
2. Money utilities (toCents/fromCents) are correct (code inspection only - not runtime tested)
3. better-sqlite3 API is synchronous (documentation + code patterns confirm)
4. ESM module hoisting behavior is as documented (Jest + Node.js behavior)

---

*Consolidated by Mistral Vibe based on forensic audit verification against commit 2052841*

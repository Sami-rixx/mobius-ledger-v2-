// Jest setup file
// This file is run before each test file

import db, { setupDatabase } from '../config/database.js';

// Initialize database before tests
beforeAll(async () => {
  await setupDatabase();

  // setupDatabase() now also applies the RBAC seed migration (Admin/
  // Director/Finance Officer/Clerk/Auditor/Viewer roles + the full
  // permission matrix - see database/migrations/004_rbac_seed.js), which
  // inserts real rows into roles/permissions/role_permissions. A large
  // number of pre-existing unit tests in this suite construct their own
  // from-scratch fixtures against those exact tables using explicit,
  // low-numbered primary keys (e.g. permission id 1, role id 1), which
  // would collide with the seeded rows.
  //
  // Since every test file gets its own private, isolated in-memory
  // database (a fresh ES module registry under Jest), it's safe to clear
  // the RBAC tables back to empty here for every test file by default.
  // Test files that specifically need the real seeded RBAC data (e.g.
  // authentication/authorization integration tests) re-seed it themselves
  // by importing and invoking the migration's `up(db)` directly - see
  // src/__tests__/auth.test.js and src/__tests__/rbac.test.js.
  try {
    db.exec('DELETE FROM role_permissions; DELETE FROM user_roles; DELETE FROM permissions; DELETE FROM roles;');
    // Also reset the AUTOINCREMENT high-water mark for these tables so
    // pre-existing tests that insert fixtures and then assert on
    // hardcoded, low-numbered primary keys (e.g. permission/role id 1)
    // keep working exactly as they did before RBAC seeding existed.
    db.exec(`DELETE FROM sqlite_sequence WHERE name IN ('roles', 'permissions', 'role_permissions', 'user_roles')`);
  } catch (error) {
    // Tables may not exist in a handful of standalone test files that build
    // a deliberately minimal schema - ignore.
  }
});

// Clean up after tests.
//
// Every test file gets its own fresh ES module registry under Jest, which
// means every file that imports `config/database.js` constructs a brand new
// `better-sqlite3` connection (an in-memory db in the "test" environment).
// Nothing was ever closing that connection, so when the full suite runs
// (23+ files in one process), native SQLite handles from every previously
// finished test file stayed open and accumulated for the lifetime of the
// whole Jest process. Under this sandbox's limited CPU/RAM, that
// accumulation was observed to cause sporadic, non-reproducible-in-isolation
// failures in other, unrelated files later in the run - most visibly
// `expect(...).rejects.toThrow()` assertions intermittently reporting
// "did not throw" for operations that reliably throw/reject when the same
// file is run alone or in a small group (confirmed independently via manual
// `.then(onFulfilled, onRejected)` logging showing the promise does reject
// correctly even when Jest's own matcher misreports the result).
// Closing the connection here, once per test file, keeps at most one
// in-memory database connection alive at a time and removes that
// accumulation.
afterAll(() => {
  try {
    db.close();
  } catch (error) {
    // Already closed, or a file-level test disconnected it itself - ignore.
  }
});

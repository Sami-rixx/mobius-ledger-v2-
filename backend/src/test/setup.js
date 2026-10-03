// Jest setup file
// This file is run before each test file

import db, { setupDatabase } from '../config/database.js';

// Initialize database before tests
beforeAll(() => {
  setupDatabase();
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

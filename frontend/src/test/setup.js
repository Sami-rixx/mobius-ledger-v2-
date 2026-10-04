// Vitest global setup for the frontend test suite.
// Extends Vitest's `expect` with jest-dom's DOM-specific matchers
// (toBeInTheDocument, toHaveTextContent, etc.) used by component tests.
import '@testing-library/jest-dom/vitest';

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// React Testing Library normally registers this cleanup automatically, but
// only when it detects a global `afterEach` (i.e. when the test runner's
// globals are injected onto `globalThis`). This project's vitest config
// deliberately does not enable `test.globals` (test files explicitly
// `import { describe, it, expect, ... } from 'vitest'`, matching the
// backend suite's `@jest/globals` convention), so that auto-detection
// never fires. Without this, every component test's rendered DOM from a
// previous test would stay mounted into the next test, causing
// "found multiple elements" failures as soon as more than one test in a
// file calls `render()`.
afterEach(() => {
  cleanup();
});

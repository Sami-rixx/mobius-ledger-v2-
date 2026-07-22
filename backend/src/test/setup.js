// Jest setup file
// This file is run before each test file

import { setupDatabase } from '../config/database.js';

// Initialize database before tests
beforeAll(() => {
  setupDatabase();
});

// Clean up after tests
afterAll(() => {
  // Close database connection if needed
});

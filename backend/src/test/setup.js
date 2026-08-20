// Jest setup file
// This file is run before each test file

import { setupDatabase } from '../config/database.js';

// Initialize database schema and settings before tests
beforeAll(() => {
  // Verify system settings exist - does not create production database
  setupDatabase();
});

// Clean up after tests
afterAll(() => {
  // Close database connection if needed
});

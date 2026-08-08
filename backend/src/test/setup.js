// Jest setup file
// This file is run before each test file

import { setupDatabase } from '../config/database.js';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database schema and settings before tests
beforeAll(() => {
  // Execute the existing database setup script to ensure schema is loaded
  // This reuses the canonical schema loading logic from database/setup.js
  const setupScriptPath = path.resolve(__dirname, '../../../database/setup.js');
  execSync(`node ${setupScriptPath}`, { 
    cwd: path.dirname(setupScriptPath),
    stdio: 'inherit'
  });
  
  // Now setupDatabase can safely query system_settings
  setupDatabase();
});

// Clean up after tests
afterAll(() => {
  // Close database connection if needed
});

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test database path
const TEST_DB_PATH = path.resolve(__dirname, 'test_mobius_ledger.db');

// We'll test the Student model by importing it and using the test database
// Since the Student model imports database.js which uses a specific path,
// we need to set up the test database first
let db;

describe('Student Model', () => {
  beforeAll(() => {
    // Create test database
    db = new Database(TEST_DB_PATH);
    db.pragma('foreign_keys = ON');

    // Create minimal schema for testing
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        password_hash TEXT,
        role TEXT DEFAULT 'admin',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admission_number TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
        date_of_birth DATE,
        class_id INTEGER,
        parent_name TEXT NOT NULL,
        parent_phone TEXT NOT NULL,
        parent_email TEXT,
        address TEXT,
        status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'Graduated', 'Transferred')),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER,
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_number TEXT UNIQUE,
        transaction_type TEXT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        student_id INTEGER,
        transaction_date DATE NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id)
      );

      CREATE TABLE IF NOT EXISTS school_fee_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        transaction_id INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date DATE NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (transaction_id) REFERENCES transactions(id)
      );

      CREATE INDEX IF NOT EXISTS idx_students_admission ON students(admission_number);
      CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name);
      CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
      CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
    `);

    // Insert system user
    db.prepare('INSERT OR IGNORE INTO users (id, username, full_name, role) VALUES (1, ?, ?, ?)')
      .run('system', 'System Administrator', 'admin');

    // Insert test class
    db.prepare('INSERT OR IGNORE INTO classes (id, name, created_by, updated_by) VALUES (1, ?, ?, ?)')
      .run('Grade 1', 1, 1);
  });

  afterAll(() => {
    // Close and delete test database
    if (db) {
      db.close();
    }
    try {
      const fs = require("node:fs");
      fs.promises.unlink(TEST_DB_PATH);
      fs.promises.unlink(TEST_DB_PATH + '-wal');
      fs.promises.unlink(TEST_DB_PATH + '-shm');
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    // Clear students table before each test
    db.prepare('DELETE FROM students').run();
  });

  describe('Database Schema', () => {
    it('should have created the students table', () => {
      const tableInfo = db.prepare('PRAGMA table_info(students)').all();
      expect(tableInfo.length).toBeGreaterThan(0);
      
      const columnNames = tableInfo.map(col => col.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('admission_number');
      expect(columnNames).toContain('first_name');
      expect(columnNames).toContain('last_name');
    });

    it('should have created indexes on students table', () => {
      const indexes = db.prepare('PRAGMA index_list(students)').all();
      const indexNames = indexes.map(idx => idx.name);
      expect(indexNames).toContain('idx_students_admission');
      expect(indexNames).toContain('idx_students_name');
      expect(indexNames).toContain('idx_students_class');
      expect(indexNames).toContain('idx_students_status');
    });
  });

  describe('Basic CRUD Operations', () => {
    it('should insert a student', () => {
      const insert = db.prepare(`
        INSERT INTO students (admission_number, first_name, last_name, gender, parent_name, parent_phone, class_id, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const info = insert.run('TEST-001', 'John', 'Doe', 'Male', 'Parent', '+254700000000', 1, 1, 1);
      
      expect(info.changes).toBe(1);
      expect(info.lastInsertRowid).toBeGreaterThan(0);
    });

    it('should retrieve a student by ID', () => {
      // Insert a student first
      const insert = db.prepare(`
        INSERT INTO students (admission_number, first_name, last_name, gender, parent_name, parent_phone, class_id, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run('TEST-002', 'Jane', 'Smith', 'Female', 'Parent', '+254700000001', 1, 1, 1);
      
      // Retrieve the student
      const student = db.prepare('SELECT * FROM students WHERE admission_number = ?').get('TEST-002');
      
      expect(student).toBeDefined();
      expect(student.first_name).toBe('Jane');
      expect(student.last_name).toBe('Smith');
      expect(student.admission_number).toBe('TEST-002');
    });

    it('should update a student', () => {
      // Insert a student first
      const insert = db.prepare(`
        INSERT INTO students (admission_number, first_name, last_name, gender, parent_name, parent_phone, class_id, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run('TEST-003', 'Bob', 'Johnson', 'Male', 'Parent', '+254700000002', 1, 1, 1);
      
      // Update the student
      const update = db.prepare('UPDATE students SET first_name = ? WHERE admission_number = ?');
      const info = update.run('Robert', 'TEST-003');
      
      expect(info.changes).toBe(1);
      
      // Verify the update
      const student = db.prepare('SELECT first_name FROM students WHERE admission_number = ?').get('TEST-003');
      expect(student.first_name).toBe('Robert');
    });

    it('should delete a student', () => {
      // Insert a student first
      const insert = db.prepare(`
        INSERT INTO students (admission_number, first_name, last_name, gender, parent_name, parent_phone, class_id, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run('TEST-004', 'Alice', 'Williams', 'Female', 'Parent', '+254700000003', 1, 1, 1);
      
      // Delete the student
      const del = db.prepare('DELETE FROM students WHERE admission_number = ?');
      const info = del.run('TEST-004');
      
      expect(info.changes).toBe(1);
      
      // Verify the deletion
      const student = db.prepare('SELECT * FROM students WHERE admission_number = ?').get('TEST-004');
      expect(student).toBeUndefined();
    });
  });

  describe('Validation', () => {
    it('should enforce unique admission numbers', () => {
      const insert = db.prepare(`
        INSERT INTO students (admission_number, first_name, last_name, gender, parent_name, parent_phone, class_id, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // First insert should succeed
      insert.run('UNIQUE-001', 'Test', 'User', 'Male', 'Parent', '+254700000004', 1, 1, 1);
      
      // Second insert with same admission number should fail
      expect(() => {
        insert.run('UNIQUE-001', 'Test', 'User2', 'Female', 'Parent', '+254700000005', 1, 1, 1);
      }).toThrow();
    });

    it('should enforce valid gender values', () => {
      const insert = db.prepare(`
        INSERT INTO students (admission_number, first_name, last_name, gender, parent_name, parent_phone, class_id, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // Invalid gender should fail
      expect(() => {
        insert.run('GENDER-001', 'Test', 'User', 'Invalid', 'Parent', '+254700000006', 1, 1, 1);
      }).toThrow();
    });

    it('should enforce valid status values', () => {
      const insert = db.prepare(`
        INSERT INTO students (admission_number, first_name, last_name, gender, parent_name, parent_phone, class_id, status, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // Invalid status should fail
      expect(() => {
        insert.run('STATUS-001', 'Test', 'User', 'Male', 'Parent', '+254700000007', 1, 'InvalidStatus', 1, 1);
      }).toThrow();
    });
  });

  describe('Query Operations', () => {
    it('should search students by name', () => {
      // Insert test students
      const insert = db.prepare(`
        INSERT INTO students (admission_number, first_name, last_name, gender, parent_name, parent_phone, class_id, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run('SEARCH-001', 'John', 'Doe', 'Male', 'Parent', '+254700000010', 1, 1, 1);
      insert.run('SEARCH-002', 'Jane', 'Doe', 'Female', 'Parent', '+254700000011', 1, 1, 1);
      insert.run('SEARCH-003', 'Bob', 'Smith', 'Male', 'Parent', '+254700000012', 1, 1, 1);
      
      // Search for students with last name Doe
      const students = db.prepare('SELECT * FROM students WHERE last_name LIKE ?').all('%Doe%');
      
      expect(students.length).toBe(2);
    });

    it('should filter students by class', () => {
      // Insert test class 2
      db.prepare('INSERT OR IGNORE INTO classes (id, name, created_by, updated_by) VALUES (2, ?, ?, ?)')
        .run('Grade 2', 1, 1);
      
      // Insert students in different classes
      const insert = db.prepare(`
        INSERT INTO students (admission_number, first_name, last_name, gender, parent_name, parent_phone, class_id, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run('CLASS-001', 'Alice', 'Grade1', 'Female', 'Parent', '+254700000013', 1, 1, 1);
      insert.run('CLASS-002', 'Bob', 'Grade2', 'Male', 'Parent', '+254700000014', 2, 1, 1);
      
      // Get students in class 1
      const class1Students = db.prepare('SELECT * FROM students WHERE class_id = ?').all(1);
      expect(class1Students.length).toBeGreaterThanOrEqual(1);
      
      // Get students in class 2
      const class2Students = db.prepare('SELECT * FROM students WHERE class_id = ?').all(2);
      expect(class2Students.length).toBeGreaterThanOrEqual(1);
    });
  });
});

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test database path
const TEST_DB_PATH = path.resolve(__dirname, 'test_mobius_ledger.db');

// Import models with test database
let StudentModel;
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

      CREATE TABLE IF NOT EXISTS lunch_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        transaction_id INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date DATE NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (transaction_id) REFERENCES transactions(id)
      );

      CREATE TABLE IF NOT EXISTS student_charge_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        charge_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (charge_id) REFERENCES student_charges(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
      );

      CREATE TABLE IF NOT EXISTS student_charges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL
      );
    `);

    // Insert system user
    db.prepare('INSERT OR IGNORE INTO users (id, username, full_name, role) VALUES (1, ? , ?, ?)')
      .run('system', 'System Administrator', 'admin');

    // Insert test class
    db.prepare('INSERT OR IGNORE INTO classes (id, name, created_by, updated_by) VALUES (1, ?, ?, ?)')
      .run('Grade 1', 1, 1);

    // Import StudentModel with test database
    // We need to mock the database import
    const Module = await import('../models/Student.js');
    StudentModel = Module.default;
  });

  afterAll(() => {
    // Close and delete test database
    if (db) {
      db.close();
    }
    try {
      require('fs').unlinkSync(TEST_DB_PATH);
      require('fs').unlinkSync(TEST_DB_PATH + '-wal');
      require('fs').unlinkSync(TEST_DB_PATH + '-shm');
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    // Clear test data
    db.prepare('DELETE FROM students').run();
    db.prepare('DELETE FROM transactions').run();
    db.prepare('DELETE FROM school_fee_payments').run();
    db.prepare('DELETE FROM lunch_payments').run();
    db.prepare('DELETE FROM student_charge_assignments').run();
  });

  describe('createStudent', () => {
    it('should create a new student', () => {
      const studentData = {
        admission_number: 'ML-2026-001',
        first_name: 'John',
        last_name: 'Doe',
        gender: 'Male',
        parent_name: 'Jane Doe',
        parent_phone: '0712345678',
        class_id: 1
      };

      const student = StudentModel.createStudent(studentData, 1);

      expect(student).toBeDefined();
      expect(student.id).toBeDefined();
      expect(student.admission_number).toBe('ML-2026-001');
      expect(student.first_name).toBe('John');
      expect(student.last_name).toBe('Doe');
      expect(student.parent_name).toBe('Jane Doe');
      expect(student.parent_phone).toBe('0712345678');
      expect(student.class_id).toBe(1);
      expect(student.status).toBe('Active');
    });

    it('should throw error for duplicate admission number', () => {
      const studentData = {
        admission_number: 'ML-2026-002',
        first_name: 'Jane',
        last_name: 'Smith',
        parent_name: 'Bob Smith',
        parent_phone: '0723456789'
      };

      // Create first student
      StudentModel.createStudent(studentData, 1);

      // Try to create duplicate
      expect(() => {
        StudentModel.createStudent(studentData, 1);
      }).toThrow(/Admission number already exists/);
    });

    it('should throw error for missing required fields', () => {
      const studentData = {
        first_name: 'John',
        last_name: 'Doe'
        // Missing admission_number, parent_name, parent_phone
      };

      expect(() => {
        StudentModel.createStudent(studentData, 1);
      }).toThrow(/Missing required field/);
    });

    it('should throw error for invalid gender', () => {
      const studentData = {
        admission_number: 'ML-2026-003',
        first_name: 'John',
        last_name: 'Doe',
        gender: 'Unknown',
        parent_name: 'Jane Doe',
        parent_phone: '0712345678'
      };

      expect(() => {
        StudentModel.createStudent(studentData, 1);
      }).toThrow(/Invalid gender/);
    });
  });

  describe('getStudentById', () => {
    it('should return student by ID', () => {
      const studentData = {
        admission_number: 'ML-2026-004',
        first_name: 'Alice',
        last_name: 'Johnson',
        parent_name: 'Bob Johnson',
        parent_phone: '0734567890'
      };

      const created = StudentModel.createStudent(studentData, 1);
      const student = StudentModel.getStudentById(created.id);

      expect(student).toBeDefined();
      expect(student.id).toBe(created.id);
      expect(student.admission_number).toBe('ML-2026-004');
    });

    it('should return null for non-existent student', () => {
      const student = StudentModel.getStudentById(9999);
      expect(student).toBeNull();
    });
  });

  describe('getStudentByAdmissionNumber', () => {
    it('should return student by admission number', () => {
      const studentData = {
        admission_number: 'ML-2026-005',
        first_name: 'Bob',
        last_name: 'Williams',
        parent_name: 'Alice Williams',
        parent_phone: '0745678901'
      };

      StudentModel.createStudent(studentData, 1);
      const student = StudentModel.getStudentByAdmissionNumber('ML-2026-005');

      expect(student).toBeDefined();
      expect(student.admission_number).toBe('ML-2026-005');
    });

    it('should return null for non-existent admission number', () => {
      const student = StudentModel.getStudentByAdmissionNumber('ML-2026-999');
      expect(student).toBeNull();
    });
  });

  describe('getAllStudents', () => {
    it('should return all students', () => {
      // Create multiple students
      for (let i = 1; i <= 5; i++) {
        StudentModel.createStudent({
          admission_number: `ML-2026-${String(i).padStart(3, '0')}`,
          first_name: `Student${i}`,
          last_name: `Test${i}`,
          parent_name: `Parent${i}`,
          parent_phone: `071234567${i}`
        }, 1);
      }

      const students = StudentModel.getAllStudents();
      expect(students.length).toBe(5);
    });

    it('should filter by search term', () => {
      StudentModel.createStudent({
        admission_number: 'ML-2026-010',
        first_name: 'Search',
        last_name: 'Test',
        parent_name: 'Parent',
        parent_phone: '0712345670'
      }, 1);

      StudentModel.createStudent({
        admission_number: 'ML-2026-011',
        first_name: 'Other',
        last_name: 'Student',
        parent_name: 'Parent',
        parent_phone: '0712345671'
      }, 1);

      const students = StudentModel.getAllStudents({ search: 'Search' });
      expect(students.length).toBe(1);
      expect(students[0].first_name).toBe('Search');
    });

    it('should filter by class', () => {
      // Create student in class 1
      StudentModel.createStudent({
        admission_number: 'ML-2026-020',
        first_name: 'Class1',
        last_name: 'Student',
        parent_name: 'Parent',
        parent_phone: '0712345670',
        class_id: 1
      }, 1);

      // Create student without class
      StudentModel.createStudent({
        admission_number: 'ML-2026-021',
        first_name: 'NoClass',
        last_name: 'Student',
        parent_name: 'Parent',
        parent_phone: '0712345671'
      }, 1);

      const students = StudentModel.getAllStudents({ classId: 1 });
      expect(students.length).toBe(1);
      expect(students[0].first_name).toBe('Class1');
    });
  });

  describe('updateStudent', () => {
    it('should update student information', () => {
      const studentData = {
        admission_number: 'ML-2026-030',
        first_name: 'Original',
        last_name: 'Name',
        parent_name: 'Parent',
        parent_phone: '0712345670'
      };

      const created = StudentModel.createStudent(studentData, 1);
      
      const updated = StudentModel.updateStudent(created.id, {
        first_name: 'Updated',
        last_name: 'Name'
      }, 1);

      expect(updated.first_name).toBe('Updated');
      expect(updated.last_name).toBe('Name');
      expect(updated.admission_number).toBe('ML-2026-030');
    });

    it('should throw error for non-existent student', () => {
      expect(() => {
        StudentModel.updateStudent(9999, { first_name: 'Test' }, 1);
      }).toThrow(/Student not found/);
    });
  });

  describe('deleteStudent', () => {
    it('should delete a student', () => {
      const studentData = {
        admission_number: 'ML-2026-040',
        first_name: 'Delete',
        last_name: 'Me',
        parent_name: 'Parent',
        parent_phone: '0712345670'
      };

      const created = StudentModel.createStudent(studentData, 1);
      const deleted = StudentModel.deleteStudent(created.id, 1);

      expect(deleted).toBe(true);
      expect(StudentModel.getStudentById(created.id)).toBeNull();
    });

    it('should not delete student with transactions', () => {
      const studentData = {
        admission_number: 'ML-2026-041',
        first_name: 'Has',
        last_name: 'Transactions',
        parent_name: 'Parent',
        parent_phone: '0712345670'
      };

      const created = StudentModel.createStudent(studentData, 1);
      
      // Create a transaction for this student
      db.prepare(`
        INSERT INTO transactions (receipt_number, transaction_type, amount, student_id, transaction_date) 
        VALUES (?, ?, ?, ?, ?)
      `).run('ML-2026-000001', 'school_fee', 1000.00, created.id, '2026-01-01');

      expect(() => {
        StudentModel.deleteStudent(created.id, 1);
      }).toThrow(/Cannot delete student with existing transactions/);
    });

    it('should return false for non-existent student', () => {
      const deleted = StudentModel.deleteStudent(9999, 1);
      expect(deleted).toBe(false);
    });
  });

  describe('getStudentsByClass', () => {
    it('should return students in a specific class', () => {
      StudentModel.createStudent({
        admission_number: 'ML-2026-050',
        first_name: 'Class1',
        last_name: 'Student1',
        parent_name: 'Parent',
        parent_phone: '0712345670',
        class_id: 1
      }, 1);

      StudentModel.createStudent({
        admission_number: 'ML-2026-051',
        first_name: 'Class1',
        last_name: 'Student2',
        parent_name: 'Parent',
        parent_phone: '0712345671',
        class_id: 1
      }, 1);

      const students = StudentModel.getStudentsByClass(1);
      expect(students.length).toBe(2);
    });
  });

  describe('searchStudents', () => {
    it('should search students by name', () => {
      StudentModel.createStudent({
        admission_number: 'ML-2026-060',
        first_name: 'Searchable',
        last_name: 'Student',
        parent_name: 'Parent',
        parent_phone: '0712345670'
      }, 1);

      const results = StudentModel.searchStudents('Searchable');
      expect(results.length).toBe(1);
      expect(results[0].first_name).toBe('Searchable');
    });

    it('should search students by admission number', () => {
      StudentModel.createStudent({
        admission_number: 'ML-2026-061',
        first_name: 'John',
        last_name: 'Doe',
        parent_name: 'Parent',
        parent_phone: '0712345670'
      }, 1);

      const results = StudentModel.searchStudents('ML-2026-061');
      expect(results.length).toBe(1);
      expect(results[0].admission_number).toBe('ML-2026-061');
    });
  });

  describe('getStudentCount', () => {
    it('should return total student count', () => {
      StudentModel.createStudent({
        admission_number: 'ML-2026-070',
        first_name: 'Count',
        last_name: 'Test1',
        parent_name: 'Parent',
        parent_phone: '0712345670'
      }, 1);

      StudentModel.createStudent({
        admission_number: 'ML-2026-071',
        first_name: 'Count',
        last_name: 'Test2',
        parent_name: 'Parent',
        parent_phone: '0712345671'
      }, 1);

      const count = StudentModel.getStudentCount();
      expect(count).toBe(2);
    });

    it('should return filtered count', () => {
      StudentModel.createStudent({
        admission_number: 'ML-2026-080',
        first_name: 'Active',
        last_name: 'Student',
        parent_name: 'Parent',
        parent_phone: '0712345670',
        status: 'Active'
      }, 1);

      StudentModel.createStudent({
        admission_number: 'ML-2026-081',
        first_name: 'Inactive',
        last_name: 'Student',
        parent_name: 'Parent',
        parent_phone: '0712345671',
        status: 'Inactive'
      }, 1);

      const activeCount = StudentModel.getStudentCount({ status: 'Active' });
      expect(activeCount).toBe(1);
    });
  });

  describe('getActiveStudentCount', () => {
    it('should return count of active students', () => {
      StudentModel.createStudent({
        admission_number: 'ML-2026-090',
        first_name: 'Active1',
        last_name: 'Student',
        parent_name: 'Parent',
        parent_phone: '0712345670',
        status: 'Active'
      }, 1);

      StudentModel.createStudent({
        admission_number: 'ML-2026-091',
        first_name: 'Active2',
        last_name: 'Student',
        parent_name: 'Parent',
        parent_phone: '0712345671',
        status: 'Active'
      }, 1);

      StudentModel.createStudent({
        admission_number: 'ML-2026-092',
        first_name: 'Inactive',
        last_name: 'Student',
        parent_name: 'Parent',
        parent_phone: '0712345672',
        status: 'Inactive'
      }, 1);

      const count = StudentModel.getActiveStudentCount();
      expect(count).toBe(2);
    });
  });
});

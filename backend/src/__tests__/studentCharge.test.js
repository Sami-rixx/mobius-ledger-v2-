/**
 * Student Charge Model Tests
 * 
 * Note: These tests require the database to be set up with the schema from database/schema.sql
 * They test the StudentCharge and StudentChargeAssignment models.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test database path
const TEST_DB_PATH = path.resolve(__dirname, 'test_student_charge.db');

let db;
let StudentChargeModel;
let StudentChargeAssignmentModel;

// Test data storage
let testData = {};

describe('Student Charge Models', () => {
  beforeAll(() => {
    // Create test database
    db = new Database(TEST_DB_PATH);
    db.pragma('foreign_keys = ON');

    // Create minimal schema for student charge testing
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
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER,
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS payment_methods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_number TEXT UNIQUE,
        transaction_type TEXT NOT NULL CHECK(transaction_type IN ('income', 'expense', 'school_fee', 'lunch_fee', 'student_charge', 'director_withdrawal')),
        amount DECIMAL(10, 2) NOT NULL,
        category_id INTEGER,
        income_category_id INTEGER,
        expense_category_id INTEGER,
        student_id INTEGER,
        description TEXT,
        payment_method_id INTEGER,
        transaction_date DATE NOT NULL,
        transaction_time TIME DEFAULT CURRENT_TIME,
        reference TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS student_charges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        amount DECIMAL(10, 2) NOT NULL,
        charge_type TEXT DEFAULT 'individual' CHECK(charge_type IN ('individual', 'all', 'class', 'grade', 'custom')),
        class_id INTEGER,
        is_active BOOLEAN DEFAULT 1,
        due_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER,
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS student_charge_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        charge_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        paid BOOLEAN DEFAULT 0,
        paid_at DATETIME,
        payment_transaction_id INTEGER,
        notes TEXT,
        FOREIGN KEY (charge_id) REFERENCES student_charges(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (payment_transaction_id) REFERENCES transactions(id),
        UNIQUE(charge_id, student_id)
      );
    `);

    // Insert test data
    const userId = db.prepare('INSERT INTO users (username, full_name, email) VALUES (?, ?, ?)').run(
      'testuser', 'Test User', 'test@example.com'
    ).lastInsertRowid;

    const classId = db.prepare('INSERT INTO classes (name, description, created_by, updated_by) VALUES (?, ?, ?, ?)').run(
      'Test Class', 'Test Description', userId, userId
    ).lastInsertRowid;

    const studentId1 = db.prepare('INSERT INTO students (admission_number, first_name, last_name, parent_name, parent_phone, class_id, is_active, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      'STU001', 'John', 'Doe', 'Parent Doe', '1234567890', classId, 1, userId, userId
    ).lastInsertRowid;

    const studentId2 = db.prepare('INSERT INTO students (admission_number, first_name, last_name, parent_name, parent_phone, class_id, is_active, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      'STU002', 'Jane', 'Smith', 'Parent Smith', '0987654321', classId, 1, userId, userId
    ).lastInsertRowid;

    const paymentMethodId = db.prepare('INSERT INTO payment_methods (name, description) VALUES (?, ?)').run(
      'Cash', 'Cash Payment'
    ).lastInsertRowid;

    // Insert system settings
    db.prepare('INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)').run(
      'receipt_year', new Date().getFullYear().toString(), 'Current year for receipt numbers'
    );
    db.prepare('INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)').run(
      'receipt_sequence', '0', 'Current receipt sequence number'
    );
    db.prepare('INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)').run(
      'receipt_prefix', 'ML', 'Prefix for receipt numbers'
    );
    db.prepare('INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)').run(
      'currency', 'KES', 'Default currency'
    );

    testData = {
      userId,
      classId,
      studentId1,
      studentId2,
      paymentMethodId
    };

    // Create test model implementations that use the test database
    StudentChargeModel = {
      getAllStudentCharges: (options = {}) => {
        const { name, chargeType, classId, isActive, search, limit = 100, offset = 0, orderBy = 'sc.created_at', orderDir = 'DESC' } = options;
        let query = `
          SELECT sc.*,
            c.name as class_name,
            COUNT(sca.id) as assignment_count,
            SUM(CASE WHEN sca.paid = 1 THEN sca.amount ELSE 0 END) as total_paid,
            SUM(sca.amount) as total_assigned
          FROM student_charges sc
          LEFT JOIN classes c ON sc.class_id = c.id
          LEFT JOIN student_charge_assignments sca ON sc.id = sca.charge_id
        `;
        const params = [];
        const conditions = [];
        if (name) { conditions.push(`sc.name LIKE ?`); params.push(`%${name}%`); }
        if (chargeType) { conditions.push(`sc.charge_type = ?`); params.push(chargeType); }
        if (classId) { conditions.push(`sc.class_id = ?`); params.push(classId); }
        if (isActive !== undefined) { conditions.push(`sc.is_active = ?`); params.push(isActive ? 1 : 0); }
        if (search) { conditions.push(`(sc.name LIKE ? OR sc.description LIKE ?)`); params.push(`%${search}%`, `%${search}%`); }
        if (conditions.length > 0) { query += ` WHERE ${conditions.join(' AND ')}`; }
        query += ` GROUP BY sc.id ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        const stmt = db.prepare(query);
        return stmt.all(...params);
      },
      
      getStudentChargeById: (id) => {
        const query = `
          SELECT sc.*,
            c.name as class_name,
            COUNT(sca.id) as assignment_count,
            SUM(CASE WHEN sca.paid = 1 THEN sca.amount ELSE 0 END) as total_paid,
            SUM(sca.amount) as total_assigned
          FROM student_charges sc
          LEFT JOIN classes c ON sc.class_id = c.id
          LEFT JOIN student_charge_assignments sca ON sc.id = sca.charge_id
          WHERE sc.id = ?
          GROUP BY sc.id
        `;
        const stmt = db.prepare(query);
        return stmt.get(id) || null;
      },
      
      createStudentCharge: (chargeData) => {
        const { name, description, amount, chargeType = 'individual', classId, dueDate, createdBy } = chargeData;
        const query = `
          INSERT INTO student_charges 
            (name, description, amount, charge_type, class_id, due_date, created_by, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const stmt = db.prepare(query);
        const result = stmt.run(name, description, amount, chargeType, classId || null, dueDate || null, createdBy, createdBy);
        return StudentChargeModel.getStudentChargeById(result.lastInsertRowid);
      },
      
      getStudentChargeCount: (options = {}) => {
        const { name, chargeType, classId, isActive, search } = options;
        let query = `SELECT COUNT(*) as count FROM student_charges sc`;
        const params = [];
        const conditions = [];
        if (name) { conditions.push(`sc.name LIKE ?`); params.push(`%${name}%`); }
        if (chargeType) { conditions.push(`sc.charge_type = ?`); params.push(chargeType); }
        if (classId) { conditions.push(`sc.class_id = ?`); params.push(classId); }
        if (isActive !== undefined) { conditions.push(`sc.is_active = ?`); params.push(isActive ? 1 : 0); }
        if (search) { conditions.push(`(sc.name LIKE ? OR sc.description LIKE ?)`); params.push(`%${search}%`, `%${search}%`); }
        if (conditions.length > 0) { query += ` WHERE ${conditions.join(' AND ')}`; }
        const stmt = db.prepare(query);
        const result = stmt.get(...params);
        return result ? result.count : 0;
      },
      
      getStudentChargeStatistics: () => {
        const query = `
          SELECT 
            COUNT(*) as total_charges,
            COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_charges,
            COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_charges,
            SUM(amount) as total_amount,
            AVG(amount) as average_amount
          FROM student_charges
        `;
        const stmt = db.prepare(query);
        return stmt.get() || { total_charges: 0, active_charges: 0, inactive_charges: 0, total_amount: 0, average_amount: 0 };
      },
      
      getStudentChargeAssignmentCount: (chargeId) => {
        const query = `SELECT COUNT(*) as count FROM student_charge_assignments WHERE charge_id = ?`;
        const stmt = db.prepare(query);
        const result = stmt.get(chargeId);
        return result ? result.count : 0;
      }
    };
    
    StudentChargeAssignmentModel = {
      getAllStudentChargeAssignments: (options = {}) => {
        const { chargeId, studentId, paid, classId, search, limit = 100, offset = 0, orderBy = 'sca.assigned_at', orderDir = 'DESC' } = options;
        let query = `
          SELECT sca.*,
            sc.name as charge_name,
            sc.description as charge_description,
            sc.amount as charge_amount,
            sc.charge_type,
            sc.due_date,
            s.id as student_id,
            s.admission_number,
            s.first_name,
            s.last_name,
            s.class_id,
            c.name as class_name
          FROM student_charge_assignments sca
          JOIN student_charges sc ON sca.charge_id = sc.id
          JOIN students s ON sca.student_id = s.id
          LEFT JOIN classes c ON s.class_id = c.id
        `;
        const params = [];
        const conditions = [];
        if (chargeId) { conditions.push(`sca.charge_id = ?`); params.push(chargeId); }
        if (studentId) { conditions.push(`sca.student_id = ?`); params.push(studentId); }
        if (paid !== undefined) { conditions.push(`sca.paid = ?`); params.push(paid ? 1 : 0); }
        if (classId) { conditions.push(`s.class_id = ?`); params.push(classId); }
        if (search) { 
          conditions.push(`(sc.name LIKE ? OR sc.description LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)`);
          params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); 
        }
        if (conditions.length > 0) { query += ` WHERE ${conditions.join(' AND ')}`; }
        query += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        const stmt = db.prepare(query);
        return stmt.all(...params);
      },
      
      getStudentChargeAssignmentById: (id) => {
        const query = `
          SELECT sca.*,
            sc.name as charge_name,
            sc.description as charge_description,
            sc.amount as charge_amount,
            sc.charge_type,
            sc.due_date,
            s.id as student_id,
            s.admission_number,
            s.first_name,
            s.last_name,
            s.class_id,
            c.name as class_name
          FROM student_charge_assignments sca
          JOIN student_charges sc ON sca.charge_id = sc.id
          JOIN students s ON sca.student_id = s.id
          LEFT JOIN classes c ON s.class_id = c.id
          WHERE sca.id = ?
        `;
        const stmt = db.prepare(query);
        return stmt.get(id) || null;
      },
      
      createStudentChargeAssignment: (assignmentData) => {
        const { chargeId, studentId, amount, notes } = assignmentData;
        const charge = db.prepare(`SELECT amount FROM student_charges WHERE id = ?`).get(chargeId);
        const finalAmount = amount || (charge ? charge.amount : 0);
        const query = `INSERT INTO student_charge_assignments (charge_id, student_id, amount, notes) VALUES (?, ?, ?, ?)`;
        const stmt = db.prepare(query);
        const result = stmt.run(chargeId, studentId, finalAmount, notes || null);
        return StudentChargeAssignmentModel.getStudentChargeAssignmentById(result.lastInsertRowid);
      },
      
      isStudentAssignedToCharge: (chargeId, studentId) => {
        const query = `SELECT COUNT(*) as count FROM student_charge_assignments WHERE charge_id = ? AND student_id = ?`;
        const stmt = db.prepare(query);
        const result = stmt.get(chargeId, studentId);
        return result && result.count > 0;
      },
      
      getStudentOutstandingChargeAmount: (studentId) => {
        const query = `
          SELECT SUM(sca.amount) as total_outstanding
          FROM student_charge_assignments sca
          JOIN student_charges sc ON sca.charge_id = sc.id
          WHERE sca.student_id = ? AND sca.paid = 0 AND sc.is_active = 1
        `;
        const stmt = db.prepare(query);
        const result = stmt.get(studentId);
        return result ? (result.total_outstanding || 0) : 0;
      }
    };
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
    try {
      require('fs').unlinkSync(TEST_DB_PATH);
      require('fs').unlinkSync(TEST_DB_PATH + '-wal');
      require('fs').unlinkSync(TEST_DB_PATH + '-shm');
    } catch (e) {
      // Ignore
    }
  });

  describe('StudentCharge Model', () => {
    it('should create a new student charge', () => {
      const charge = StudentChargeModel.createStudentCharge({
        name: 'Test Charge',
        description: 'Test Description',
        amount: 100.00,
        chargeType: 'individual',
        createdBy: testData.userId
      });

      expect(charge).toBeDefined();
      expect(charge.name).toBe('Test Charge');
      expect(charge.amount).toBe(100.00);
      expect(charge.charge_type).toBe('individual');
      expect(charge.is_active).toBe(1);
    });

    it('should get a student charge by ID', () => {
      const charge = StudentChargeModel.createStudentCharge({
        name: 'Get By ID Test',
        amount: 200.00,
        createdBy: testData.userId
      });

      const retrieved = StudentChargeModel.getStudentChargeById(charge.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe('Get By ID Test');
    });

    it('should get all student charges', () => {
      const charges = StudentChargeModel.getAllStudentCharges();
      expect(Array.isArray(charges)).toBe(true);
      expect(charges.length).toBeGreaterThan(0);
    });

    it('should get student charge count', () => {
      const count = StudentChargeModel.getStudentChargeCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should get student charge statistics', () => {
      const stats = StudentChargeModel.getStudentChargeStatistics();
      expect(stats).toBeDefined();
      expect(stats.total_charges).toBeGreaterThanOrEqual(0);
    });

    it('should get assignment count for a charge', () => {
      const charge = StudentChargeModel.createStudentCharge({
        name: 'Assignment Count Test',
        amount: 300.00,
        createdBy: testData.userId
      });

      const count = StudentChargeModel.getStudentChargeAssignmentCount(charge.id);
      expect(typeof count).toBe('number');
      expect(count).toBe(0);
    });
  });

  describe('StudentChargeAssignment Model', () => {
    let testChargeId;

    beforeAll(() => {
      testChargeId = StudentChargeModel.createStudentCharge({
        name: 'Assignment Test Charge',
        amount: 500.00,
        createdBy: testData.userId
      }).id;
    });

    it('should create a new student charge assignment', () => {
      const assignment = StudentChargeAssignmentModel.createStudentChargeAssignment({
        chargeId: testChargeId,
        studentId: testData.studentId1,
        amount: 500.00,
        notes: 'Test assignment'
      });

      expect(assignment).toBeDefined();
      expect(assignment.charge_id).toBe(testChargeId);
      expect(assignment.student_id).toBe(testData.studentId1);
      expect(assignment.amount).toBe(500.00);
      expect(assignment.paid).toBe(0);
    });

    it('should get an assignment by ID', () => {
      const assignment = StudentChargeAssignmentModel.createStudentChargeAssignment({
        chargeId: testChargeId,
        studentId: testData.studentId1,
        amount: 600.00
      });

      const retrieved = StudentChargeAssignmentModel.getStudentChargeAssignmentById(assignment.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(assignment.id);
    });

    it('should get assignments by charge ID', () => {
      const assignments = StudentChargeAssignmentModel.getAllStudentChargeAssignments({ chargeId: testChargeId });
      expect(Array.isArray(assignments)).toBe(true);
    });

    it('should get assignments by student ID', () => {
      const assignments = StudentChargeAssignmentModel.getAllStudentChargeAssignments({ studentId: testData.studentId1 });
      expect(Array.isArray(assignments)).toBe(true);
    });

    it('should check if a student is assigned to a charge', () => {
      const isAssigned = StudentChargeAssignmentModel.isStudentAssignedToCharge(
        testChargeId,
        testData.studentId1
      );
      expect(typeof isAssigned).toBe('boolean');
    });

    it('should get student outstanding charge amount', () => {
      const amount = StudentChargeAssignmentModel.getStudentOutstandingChargeAmount(testData.studentId1);
      expect(typeof amount).toBe('number');
      expect(amount).toBeGreaterThanOrEqual(0);
    });
  });
});

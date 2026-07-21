import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const DB_PATH = path.resolve(__dirname, 'mobius_ledger.db');

console.log('Seeding Mobius Ledger database with demo data...');

try {
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  // Clear existing demo data (but keep system data)
  console.log('Clearing existing demo data...');
  db.exec(`
    DELETE FROM lunch_attendance;
    DELETE FROM lunch_payments;
    DELETE FROM school_fee_payments;
    DELETE FROM student_charge_assignments;
    DELETE FROM student_charges;
    DELETE FROM director_withdrawals;
    DELETE FROM transactions;
    DELETE FROM students WHERE admission_number NOT LIKE 'SYS%';
    DELETE FROM classes WHERE name NOT LIKE 'SYS%';
    DELETE FROM daily_ledger;
    DELETE FROM audit_trail;
    DELETE FROM cached_reports;
  `);

  // Reset receipt sequence
  db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run('0', 'receipt_sequence');

  // Get system user ID
  const systemUser = db.prepare('SELECT id FROM users WHERE username = ?').get('system');
  const systemUserId = systemUser?.id || 1;

  // Insert sample classes
  console.log('Inserting sample classes...');
  const classInsert = db.prepare(`
    INSERT INTO classes (name, description, created_by, updated_by) VALUES (?, ?, ?, ?)
  `);
  
  const classes = [
    ['Baby Class', 'Early childhood education', systemUserId, systemUserId],
    ['Pre-Unit', 'Pre-primary education', systemUserId, systemUserId],
    ['Grade 1', 'Primary Grade 1', systemUserId, systemUserId],
    ['Grade 2', 'Primary Grade 2', systemUserId, systemUserId],
    ['Grade 3', 'Primary Grade 3', systemUserId, systemUserId],
    ['Grade 4', 'Primary Grade 4', systemUserId, systemUserId],
    ['Grade 5', 'Primary Grade 5', systemUserId, systemUserId],
    ['Grade 6', 'Primary Grade 6', systemUserId, systemUserId],
    ['Grade 7', 'Junior Secondary Grade 7', systemUserId, systemUserId],
    ['Grade 8', 'Junior Secondary Grade 8', systemUserId, systemUserId],
    ['Grade 9', 'Junior Secondary Grade 9', systemUserId, systemUserId],
    ['Form 1', 'Senior Secondary Form 1', systemUserId, systemUserId],
    ['Form 2', 'Senior Secondary Form 2', systemUserId, systemUserId]
  ];
  
  classes.forEach(cls => classInsert.run(...cls));

  // Get class IDs
  const classIds = {};
  classes.forEach(([name]) => {
    const cls = db.prepare('SELECT id FROM classes WHERE name = ?').get(name);
    classIds[name] = cls?.id;
  });

  // Insert sample students
  console.log('Inserting sample students...');
  const studentInsert = db.prepare(`
    INSERT INTO students (admission_number, first_name, last_name, gender, class_id, parent_name, parent_phone, status, created_by, updated_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const students = [
    ['ML-2026-001', 'John', 'Doe', 'Male', classIds['Grade 1'], 'Jane Doe', '0712345678', 'Active', systemUserId, systemUserId],
    ['ML-2026-002', 'Jane', 'Smith', 'Female', classIds['Grade 2'], 'Robert Smith', '0723456789', 'Active', systemUserId, systemUserId],
    ['ML-2026-003', 'Michael', 'Johnson', 'Male', classIds['Grade 3'], 'Sarah Johnson', '0734567890', 'Active', systemUserId, systemUserId],
    ['ML-2026-004', 'Emily', 'Williams', 'Female', classIds['Grade 4'], 'David Williams', '0745678901', 'Active', systemUserId, systemUserId],
    ['ML-2026-005', 'Daniel', 'Brown', 'Male', classIds['Grade 5'], 'Lisa Brown', '0756789012', 'Active', systemUserId, systemUserId],
    ['ML-2026-006', 'Sarah', 'Davis', 'Female', classIds['Grade 6'], 'James Davis', '0767890123', 'Active', systemUserId, systemUserId],
    ['ML-2026-007', 'David', 'Miller', 'Male', classIds['Grade 7'], 'Patricia Miller', '0778901234', 'Active', systemUserId, systemUserId],
    ['ML-2026-008', 'Jessica', 'Wilson', 'Female', classIds['Grade 8'], 'Thomas Wilson', '0789012345', 'Active', systemUserId, systemUserId],
    ['ML-2026-009', 'Thomas', 'Taylor', 'Male', classIds['Grade 1'], 'Karen Taylor', '0790123456', 'Active', systemUserId, systemUserId],
    ['ML-2026-010', 'Karen', 'Anderson', 'Female', classIds['Grade 2'], 'Richard Anderson', '0701234567', 'Active', systemUserId, systemUserId]
  ];

  students.forEach(student => studentInsert.run(...student));

  // Get student IDs
  const studentIds = {};
  students.forEach(([admissionNumber]) => {
    const student = db.prepare('SELECT id FROM students WHERE admission_number = ?').get(admissionNumber);
    studentIds[admissionNumber] = student?.id;
  });

  // Insert sample school fee payments
  console.log('Inserting sample school fee payments...');
  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekStr = lastWeek.toISOString().split('T')[0];
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().split('T')[0];

  const transactionInsert = db.prepare(`
    INSERT INTO transactions (receipt_number, transaction_type, amount, income_category_id, student_id, description, payment_method_id, transaction_date, created_by, updated_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const schoolFeeCategory = db.prepare('SELECT id FROM income_categories WHERE name = ?').get('School Fees')?.id;
  const lunchCategory = db.prepare('SELECT id FROM income_categories WHERE name = ?').get('Lunch Fees')?.id;
  const cashMethod = db.prepare('SELECT id FROM payment_methods WHERE name = ?').get('Cash')?.id;
  const mpesaMethod = db.prepare('SELECT id FROM payment_methods WHERE name = ?').get('M-Pesa')?.id;

  // Generate receipt numbers sequentially
  let receiptSequence = 0;
  const getNextReceiptNumber = () => {
    receiptSequence++;
    const sequenceStr = receiptSequence.toString().padStart(6, '0');
    return `ML-2026-${sequenceStr}`;
  };

  // School fee payments
  const schoolFeePayments = [
    [getNextReceiptNumber(), 'school_fee', 15000.00, schoolFeeCategory, studentIds['ML-2026-001'], 'Term 1 School Fees', cashMethod, lastMonthStr, systemUserId, systemUserId],
    [getNextReceiptNumber(), 'school_fee', 15000.00, schoolFeeCategory, studentIds['ML-2026-002'], 'Term 1 School Fees', mpesaMethod, lastMonthStr, systemUserId, systemUserId],
    [getNextReceiptNumber(), 'school_fee', 15000.00, schoolFeeCategory, studentIds['ML-2026-003'], 'Term 1 School Fees', cashMethod, lastWeekStr, systemUserId, systemUserId],
    [getNextReceiptNumber(), 'school_fee', 15000.00, schoolFeeCategory, studentIds['ML-2026-004'], 'Term 1 School Fees', mpesaMethod, lastWeekStr, systemUserId, systemUserId],
    [getNextReceiptNumber(), 'school_fee', 15000.00, schoolFeeCategory, studentIds['ML-2026-005'], 'Term 1 School Fees', cashMethod, today, systemUserId, systemUserId],
    [getNextReceiptNumber(), 'school_fee', 7500.00, schoolFeeCategory, studentIds['ML-2026-006'], 'Term 1 School Fees (Partial)', cashMethod, today, systemUserId, systemUserId]
  ];

  schoolFeePayments.forEach(payment => transactionInsert.run(...payment));

  // Lunch payments
  const lunchPayments = [
    [getNextReceiptNumber(), 'lunch_fee', 200.00, lunchCategory, studentIds['ML-2026-001'], 'Daily Lunch', cashMethod, today, systemUserId, systemUserId],
    [getNextReceiptNumber(), 'lunch_fee', 1000.00, lunchCategory, studentIds['ML-2026-002'], 'Weekly Lunch', mpesaMethod, today, systemUserId, systemUserId],
    [getNextReceiptNumber(), 'lunch_fee', 200.00, lunchCategory, studentIds['ML-2026-003'], 'Daily Lunch', cashMethod, today, systemUserId, systemUserId],
    [getNextReceiptNumber(), 'lunch_fee', 200.00, lunchCategory, studentIds['ML-2026-004'], 'Daily Lunch', cashMethod, today, systemUserId, systemUserId],
    [getNextReceiptNumber(), 'lunch_fee', 200.00, lunchCategory, studentIds['ML-2026-005'], 'Daily Lunch', cashMethod, today, systemUserId, systemUserId]
  ];

  lunchPayments.forEach(payment => transactionInsert.run(...payment));

  // Insert sample expenses
  console.log('Inserting sample expenses...');
  const kitchenCategory = db.prepare('SELECT id FROM expense_categories WHERE name = ?').get('Kitchen')?.id;
  const riceCategory = db.prepare('SELECT id FROM expense_categories WHERE name = ?').get('Rice')?.id;
  const oilCategory = db.prepare('SELECT id FROM expense_categories WHERE name = ?').get('Cooking Oil')?.id;
  const academicCategory = db.prepare('SELECT id FROM expense_categories WHERE name = ?').get('Academic')?.id;
  const booksCategory = db.prepare('SELECT id FROM expense_categories WHERE name = ?').get('Books')?.id;
  const operationalCategory = db.prepare('SELECT id FROM expense_categories WHERE name = ?').get('Operational')?.id;
  const electricityCategory = db.prepare('SELECT id FROM expense_categories WHERE name = ?').get('Electricity')?.id;

  const expensePayments = [
    [getNextReceiptNumber(), 'expense', 5000.00, null, null, 'Rice purchase for kitchen', cashMethod, lastMonthStr, systemUserId, systemUserId, riceCategory],
    [getNextReceiptNumber(), 'expense', 3000.00, null, null, 'Cooking oil purchase', cashMethod, lastMonthStr, systemUserId, systemUserId, oilCategory],
    [getNextReceiptNumber(), 'expense', 2000.00, null, null, 'Books for library', cashMethod, lastWeekStr, systemUserId, systemUserId, booksCategory],
    [getNextReceiptNumber(), 'expense', 10000.00, null, null, 'Electricity bill payment', cashMethod, lastWeekStr, systemUserId, systemUserId, electricityCategory],
    [getNextReceiptNumber(), 'expense', 8000.00, null, null, 'Monthly stationery supply', cashMethod, today, systemUserId, systemUserId, academicCategory]
  ];

  // Insert expenses with proper category IDs
  expensePayments.forEach(([receipt, type, amount, incomeCat, student, desc, paymentMethod, date, createdBy, updatedBy, expenseCat]) => {
    transactionInsert.run(receipt, type, amount, incomeCat, student, desc, paymentMethod, date, createdBy, updatedBy, null, null, expenseCat);
  });

  // Insert sample director withdrawals
  console.log('Inserting sample director withdrawals...');
  const withdrawalCategory = db.prepare('SELECT id FROM expense_categories WHERE name = ?').get('Other Expenses')?.id;
  
  const withdrawals = [
    [getNextReceiptNumber(), 'director_withdrawal', 20000.00, null, null, 'Director monthly withdrawal', cashMethod, lastMonthStr, systemUserId, systemUserId, withdrawalCategory]
  ];

  withdrawals.forEach(([receipt, type, amount, incomeCat, student, desc, paymentMethod, date, createdBy, updatedBy, expenseCat]) => {
    transactionInsert.run(receipt, type, amount, incomeCat, student, desc, paymentMethod, date, createdBy, updatedBy, null, null, expenseCat);
  });

  // Insert sample student charges
  console.log('Inserting sample student charges...');
  const chargeInsert = db.prepare(`
    INSERT INTO student_charges (name, description, amount, charge_type, class_id, created_by, updated_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const charges = [
    ['Swimming Lessons', 'Weekly swimming lessons', 500.00, 'class', classIds['Grade 1'], systemUserId, systemUserId],
    ['Educational Trip', 'Annual educational trip to Nairobi', 2000.00, 'all', null, systemUserId, systemUserId],
    ['Sports Day Fee', 'Participation fee for sports day', 300.00, 'all', null, systemUserId, systemUserId]
  ];

  charges.forEach(charge => chargeInsert.run(...charge));

  // Get charge IDs
  const chargeIds = {};
  charges.forEach(([name]) => {
    const charge = db.prepare('SELECT id FROM student_charges WHERE name = ?').get(name);
    chargeIds[name] = charge?.id;
  });

  // Assign charges to students
  console.log('Assigning charges to students...');
  const assignmentInsert = db.prepare(`
    INSERT INTO student_charge_assignments (charge_id, student_id, amount, created_by, updated_by) 
    VALUES (?, ?, ?, ?, ?)
  `);

  // Assign swimming lessons to Grade 1 students
  const grade1Students = students.filter(s => s[3] === classIds['Grade 1']);
  grade1Students.forEach(([admissionNumber]) => {
    assignmentInsert.run(chargeIds['Swimming Lessons'], studentIds[admissionNumber], 500.00, systemUserId, systemUserId);
  });

  // Assign educational trip to all students
  students.forEach(([admissionNumber]) => {
    assignmentInsert.run(chargeIds['Educational Trip'], studentIds[admissionNumber], 2000.00, systemUserId, systemUserId);
  });

  // Assign sports day fee to all students
  students.forEach(([admissionNumber]) => {
    assignmentInsert.run(chargeIds['Sports Day Fee'], studentIds[admissionNumber], 300.00, systemUserId, systemUserId);
  });

  // Update receipt sequence in system settings
  db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run(receiptSequence.toString(), 'receipt_sequence');

  console.log('Demo data seeding complete!');
  console.log(`- ${classes.length} classes created`);
  console.log(`- ${students.length} students created`);
  console.log(`- ${schoolFeePayments.length + lunchPayments.length + expensePayments.length + withdrawals.length} transactions created`);
  console.log(`- ${charges.length} student charges created`);

  db.close();

} catch (error) {
  console.error('Database seeding error:', error.message);
  process.exit(1);
}

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

  // Ensure system user exists
  console.log('Ensuring system user exists...');
  const insertSystemUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, full_name, email, role, is_active) 
    VALUES ('system', 'System Administrator', 'admin@mobius.school', 'admin', 1)
  `);
  insertSystemUser.run();
  
  const systemUser = db.prepare('SELECT id FROM users WHERE username = ?').get('system');
  const systemUserId = systemUser?.id || 1;

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

  // Get category IDs
  const schoolFeesCategory = db.prepare('SELECT id FROM income_categories WHERE name = ?').get('School Fees')?.id || 1;
  const lunchFeesCategory = db.prepare('SELECT id FROM income_categories WHERE name = ?').get('Lunch Fees')?.id || 2;
  const kitchenCategory = db.prepare('SELECT id FROM expense_categories WHERE name = ?').get('Kitchen')?.id || 1;
  const academicCategory = db.prepare('SELECT id FROM expense_categories WHERE name = ?').get('Academic')?.id || 2;
  const operationalCategory = db.prepare('SELECT id FROM expense_categories WHERE name = ?').get('Operational')?.id || 3;
  const cashPaymentMethod = db.prepare('SELECT id FROM payment_methods WHERE name = ?').get('Cash')?.id || 1;
  const mpesaPaymentMethod = db.prepare('SELECT id FROM payment_methods WHERE name = ?').get('M-Pesa')?.id || 2;

  // Insert sample transactions
  console.log('Inserting sample transactions...');
  const transactionInsert = db.prepare(`
    INSERT INTO transactions (receipt_number, transaction_type, amount, category_id, student_id, description, payment_method_id, transaction_date, created_by, updated_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 604800000).toISOString().split('T')[0];

  // Generate receipt numbers manually for seed data
  let receiptCounter = 1;
  const generateSeedReceipt = () => {
    const year = new Date().getFullYear();
    return `ML-${year}-${String(receiptCounter++).padStart(6, '0')}`;
  };

  const transactions = [
    // School fee payments
    [generateSeedReceipt(), 'school_fee', 15000, schoolFeesCategory, studentIds['ML-2026-001'], 'Term 1 School Fees - John Doe', cashPaymentMethod, today, systemUserId, systemUserId],
    [generateSeedReceipt(), 'school_fee', 15000, schoolFeesCategory, studentIds['ML-2026-002'], 'Term 1 School Fees - Jane Smith', mpesaPaymentMethod, today, systemUserId, systemUserId],
    [generateSeedReceipt(), 'school_fee', 15000, schoolFeesCategory, studentIds['ML-2026-003'], 'Term 1 School Fees - Michael Johnson', cashPaymentMethod, yesterday, systemUserId, systemUserId],
    
    // Lunch payments
    [generateSeedReceipt(), 'lunch_fee', 2000, lunchFeesCategory, studentIds['ML-2026-001'], 'January Lunch Fees - John Doe', mpesaPaymentMethod, today, systemUserId, systemUserId],
    [generateSeedReceipt(), 'lunch_fee', 2000, lunchFeesCategory, studentIds['ML-2026-002'], 'January Lunch Fees - Jane Smith', cashPaymentMethod, yesterday, systemUserId, systemUserId],
    
    // Income
    [generateSeedReceipt(), 'income', 5000, schoolFeesCategory, null, 'Donation from Parent', cashPaymentMethod, lastWeek, systemUserId, systemUserId],
    [generateSeedReceipt(), 'income', 3000, lunchFeesCategory, null, 'Book Sales', mpesaPaymentMethod, lastWeek, systemUserId, systemUserId],
    
    // Expenses
    [generateSeedReceipt(), 'expense', 8000, kitchenCategory, null, 'Rice and Beans Purchase', cashPaymentMethod, today, systemUserId, systemUserId],
    [generateSeedReceipt(), 'expense', 3000, academicCategory, null, 'Printing Exam Papers', cashPaymentMethod, yesterday, systemUserId, systemUserId],
    [generateSeedReceipt(), 'expense', 2000, operationalCategory, null, 'Electricity Bill', cashPaymentMethod, lastWeek, systemUserId, systemUserId],
    
    // Director withdrawal
    [generateSeedReceipt(), 'director_withdrawal', 10000, null, null, 'Director Monthly Withdrawal', cashPaymentMethod, today, systemUserId, systemUserId],
  ];

  transactions.forEach(txn => transactionInsert.run(...txn));

  // Insert school fee payments
  console.log('Inserting school fee payments...');
  const feePaymentInsert = db.prepare(`
    INSERT INTO school_fee_payments (student_id, transaction_id, amount, payment_date, academic_year, term, created_by, updated_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const schoolFeeTxns = db.prepare(`
    SELECT id, student_id, amount, transaction_date 
    FROM transactions 
    WHERE transaction_type = 'school_fee' 
    ORDER BY transaction_date DESC
  `).all();

  schoolFeeTxns.forEach((txn, index) => {
    const term = index % 3 === 0 ? 'Term 1' : index % 3 === 1 ? 'Term 2' : 'Term 3';
    feePaymentInsert.run(
      txn.student_id,
      txn.id,
      txn.amount,
      txn.transaction_date,
      '2026',
      term,
      systemUserId,
      systemUserId
    );
  });

  // Insert lunch payments
  console.log('Inserting lunch payments...');
  const lunchPaymentInsert = db.prepare(`
    INSERT INTO lunch_payments (student_id, transaction_id, amount, payment_date, payment_type, start_date, end_date, created_by, updated_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const lunchTxns = db.prepare(`
    SELECT id, student_id, amount, transaction_date 
    FROM transactions 
    WHERE transaction_type = 'lunch_fee' 
    ORDER BY transaction_date DESC
  `).all();

  lunchTxns.forEach((txn, index) => {
    const paymentType = index % 3 === 0 ? 'monthly' : index % 3 === 1 ? 'weekly' : 'daily';
    let startDate = txn.transaction_date;
    let endDate = txn.transaction_date;
    
    if (paymentType === 'monthly') {
      const date = new Date(txn.transaction_date);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (paymentType === 'weekly') {
      const date = new Date(txn.transaction_date);
      endDate = new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    lunchPaymentInsert.run(
      txn.student_id,
      txn.id,
      txn.amount,
      txn.transaction_date,
      paymentType,
      startDate,
      endDate,
      systemUserId,
      systemUserId
    );
  });

  // Insert lunch attendance
  console.log('Inserting lunch attendance...');
  const lunchAttendanceInsert = db.prepare(`
    INSERT INTO lunch_attendance (student_id, date, status, payment_id, created_by, updated_by) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Create lunch attendance for the past 5 days for each student
  const studentList = Object.values(studentIds);
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(Date.now() - i * 86400000);
    dates.push(date.toISOString().split('T')[0]);
  }

  studentList.forEach(studentId => {
    dates.forEach(date => {
      // Randomly mark some as paid, some as unpaid
      const statuses = ['paid', 'paid', 'paid', 'unpaid', 'absent'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Find a payment for this student
      const payment = db.prepare(`
        SELECT id FROM lunch_payments 
        WHERE student_id = ? AND start_date <= ? AND end_date >= ?
        LIMIT 1
      `).get(studentId, date, date);
      
      lunchAttendanceInsert.run(
        studentId,
        date,
        randomStatus,
        payment?.id || null,
        systemUserId,
        systemUserId
      );
    });
  });

  // Insert director withdrawals
  console.log('Inserting director withdrawals...');
  const withdrawalTxn = db.prepare(`
    SELECT id FROM transactions 
    WHERE transaction_type = 'director_withdrawal' 
    LIMIT 1
  `).get();

  if (withdrawalTxn) {
    db.prepare(`
      INSERT INTO director_withdrawals (transaction_id, amount, withdrawal_date, description, approved_by, approved_at, created_by, updated_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      withdrawalTxn.id,
      10000,
      today,
      'Monthly withdrawal',
      systemUserId,
      new Date().toISOString(),
      systemUserId,
      systemUserId
    );
  }

  // Insert sample student charges
  console.log('Inserting sample student charges...');
  const chargeInsert = db.prepare(`
    INSERT INTO student_charges (name, description, amount, charge_type, class_id, due_date, created_by, updated_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const charges = [
    ['Swimming Lessons', 'Weekly swimming classes', 2500, 'class', classIds['Grade 1'], '2026-03-31', systemUserId, systemUserId],
    ['Educational Trip', 'Museum visit', 3500, 'all', null, '2026-04-15', systemUserId, systemUserId],
    ['Sports Day Fee', 'Annual sports day participation', 1500, 'all', null, '2026-05-20', systemUserId, systemUserId],
  ];

  charges.forEach(charge => chargeInsert.run(...charge));

  // Assign charges to students
  console.log('Assigning charges to students...');
  const chargeAssignments = [];
  
  // Swimming for Grade 1 students
  const grade1Students = students.filter(([admissionNumber]) => {
    const student = db.prepare('SELECT class_id FROM students WHERE admission_number = ?').get(admissionNumber);
    return student?.class_id === classIds['Grade 1'];
  });
  
  const swimmingCharge = db.prepare('SELECT id FROM student_charges WHERE name = ?').get('Swimming Lessons')?.id;
  if (swimmingCharge) {
    grade1Students.forEach(([admissionNumber]) => {
      const studentId = studentIds[admissionNumber];
      chargeAssignments.push([swimmingCharge, studentId, 2500, new Date().toISOString(), '']);
    });
  }

  // Educational trip for all students
  const allStudents = Object.values(studentIds);
  const tripCharge = db.prepare('SELECT id FROM student_charges WHERE name = ?').get('Educational Trip')?.id;
  if (tripCharge) {
    allStudents.forEach(studentId => {
      chargeAssignments.push([tripCharge, studentId, 3500, new Date().toISOString(), '']);
    });
  }

  // Sports day for all students
  const sportsCharge = db.prepare('SELECT id FROM student_charges WHERE name = ?').get('Sports Day Fee')?.id;
  if (sportsCharge) {
    allStudents.forEach(studentId => {
      chargeAssignments.push([sportsCharge, studentId, 1500, new Date().toISOString(), '']);
    });
  }

  const assignmentInsert = db.prepare(`
    INSERT INTO student_charge_assignments (charge_id, student_id, amount, assigned_at, notes) 
    VALUES (?, ?, ?, ?, ?)
  `);
  
  chargeAssignments.forEach(assignment => assignmentInsert.run(...assignment));

  // Get counts
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
  const transactionCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
  const classCount = db.prepare('SELECT COUNT(*) as count FROM classes').get().count;

  console.log('\nSeeding completed successfully!');
  console.log(`- Classes: ${classCount}`);
  console.log(`- Students: ${studentCount}`);
  console.log(`- Transactions: ${transactionCount}`);
  console.log(`- Receipt sequence reset to: 0`);
  
  db.close();
  
} catch (error) {
  console.error('Seeding error:', error.message);
  console.error(error.stack);
  process.exit(1);
}

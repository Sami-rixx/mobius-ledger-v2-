-- Mobius Ledger v2 - Database Schema
-- SQLite database schema for financial management system

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================
-- SYSTEM SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- USERS (for future authentication)
-- ============================================
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

-- ============================================
-- CLASSES/GRADES
-- ============================================
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

-- ============================================
-- STUDENTS
-- ============================================
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

-- Student index for faster searches
CREATE INDEX IF NOT EXISTS idx_students_admission ON students(admission_number);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- ============================================
-- INCOME CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS income_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  is_system BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- System income categories (seed data)
INSERT OR IGNORE INTO income_categories (name, description, is_system) VALUES
  ('School Fees', 'Regular school fees payments', 1),
  ('Lunch Fees', 'Daily/weekly/monthly lunch payments', 1),
  ('Donations', 'Voluntary contributions', 1),
  ('Fundraising', 'Fundraising event income', 1),
  ('Registration Fees', 'New student registration fees', 1),
  ('Book Sales', 'Income from book sales', 1),
  ('Uniform Sales', 'Income from uniform sales', 1),
  ('Other Income', 'Miscellaneous income', 1);

-- ============================================
-- EXPENSE CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS expense_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  is_system BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  FOREIGN KEY (parent_id) REFERENCES expense_categories(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- System expense categories (seed data)
-- Kitchen
INSERT OR IGNORE INTO expense_categories (name, description, is_system) VALUES
  ('Kitchen', 'Kitchen and food expenses', 1);

-- Academic
INSERT OR IGNORE INTO expense_categories (name, description, is_system) VALUES
  ('Academic', 'Academic materials and supplies', 1);

-- Operational
INSERT OR IGNORE INTO expense_categories (name, description, is_system) VALUES
  ('Operational', 'Operational expenses', 1);

-- Transportation
INSERT OR IGNORE INTO expense_categories (name, description, is_system) VALUES
  ('Transportation', 'Transport and travel expenses', 1);

-- Other
INSERT OR IGNORE INTO expense_categories (name, description, is_system) VALUES
  ('Other Expenses', 'Miscellaneous expenses', 1);

-- Kitchen subcategories
INSERT OR IGNORE INTO expense_categories (name, parent_id, is_system) VALUES
  ('Rice', (SELECT id FROM expense_categories WHERE name = 'Kitchen'), 1),
  ('Cooking Oil', (SELECT id FROM expense_categories WHERE name = 'Kitchen'), 1),
  ('Cabbages', (SELECT id FROM expense_categories WHERE name = 'Kitchen'), 1),
  ('Tomatoes', (SELECT id FROM expense_categories WHERE name = 'Kitchen'), 1),
  ('Sugar', (SELECT id FROM expense_categories WHERE name = 'Kitchen'), 1),
  ('Beans', (SELECT id FROM expense_categories WHERE name = 'Kitchen'), 1),
  ('Meat', (SELECT id FROM expense_categories WHERE name = 'Kitchen'), 1),
  ('Vegetables', (SELECT id FROM expense_categories WHERE name = 'Kitchen'), 1);

-- Academic subcategories
INSERT OR IGNORE INTO expense_categories (name, parent_id, is_system) VALUES
  ('Books', (SELECT id FROM expense_categories WHERE name = 'Academic'), 1),
  ('Pens', (SELECT id FROM expense_categories WHERE name = 'Academic'), 1),
  ('Printing', (SELECT id FROM expense_categories WHERE name = 'Academic'), 1),
  ('Photocopying', (SELECT id FROM expense_categories WHERE name = 'Academic'), 1),
  ('Examination Materials', (SELECT id FROM expense_categories WHERE name = 'Academic'), 1);

-- Operational subcategories
INSERT OR IGNORE INTO expense_categories (name, parent_id, is_system) VALUES
  ('Fuel', (SELECT id FROM expense_categories WHERE name = 'Operational'), 1),
  ('Internet', (SELECT id FROM expense_categories WHERE name = 'Operational'), 1),
  ('Electricity', (SELECT id FROM expense_categories WHERE name = 'Operational'), 1),
  ('Water', (SELECT id FROM expense_categories WHERE name = 'Operational'), 1),
  ('Maintenance', (SELECT id FROM expense_categories WHERE name = 'Operational'), 1),
  ('Salaries', (SELECT id FROM expense_categories WHERE name = 'Operational'), 1),
  ('Repairs', (SELECT id FROM expense_categories WHERE name = 'Operational'), 1);

-- Transportation subcategories
INSERT OR IGNORE INTO expense_categories (name, parent_id, is_system) VALUES
  ('Bus Hire', (SELECT id FROM expense_categories WHERE name = 'Transportation'), 1),
  ('Fuel', (SELECT id FROM expense_categories WHERE name = 'Transportation'), 1),
  ('Entry Fees', (SELECT id FROM expense_categories WHERE name = 'Transportation'), 1),
  ('Accommodation', (SELECT id FROM expense_categories WHERE name = 'Transportation'), 1),
  ('Meals', (SELECT id FROM expense_categories WHERE name = 'Transportation'), 1);

-- ============================================
-- PAYMENT METHODS
-- ============================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  is_system BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- System payment methods (seed data)
INSERT OR IGNORE INTO payment_methods (name, description, is_system) VALUES
  ('Cash', 'Cash payment', 1),
  ('M-Pesa', 'Mobile money payment', 1),
  ('Bank Transfer', 'Bank transfer payment', 1),
  ('Cheque', 'Cheque payment', 1),
  ('Credit Card', 'Credit card payment', 1),
  ('Other', 'Other payment methods', 1);

-- ============================================
-- STUDENT CHARGES (for special fees)
-- ============================================
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

-- ============================================
-- STUDENT CHARGE ASSIGNMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS student_charge_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  charge_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (charge_id) REFERENCES student_charges(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  UNIQUE(charge_id, student_id)
);

-- ============================================
-- TRANSACTIONS (Core financial records)
-- ============================================
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
  is_verified BOOLEAN DEFAULT 0,
  verified_by INTEGER,
  verified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  FOREIGN KEY (category_id) REFERENCES income_categories(id),
  FOREIGN KEY (income_category_id) REFERENCES income_categories(id),
  FOREIGN KEY (expense_category_id) REFERENCES expense_categories(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
  FOREIGN KEY (verified_by) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Transaction indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_receipt ON transactions(receipt_number);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_student ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

-- ============================================
-- SCHOOL FEE PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS school_fee_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  transaction_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  academic_year TEXT NOT NULL,
  term TEXT CHECK(term IN ('Term 1', 'Term 2', 'Term 3')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- ============================================
-- LUNCH PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS lunch_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  transaction_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_type TEXT DEFAULT 'daily' CHECK(payment_type IN ('daily', 'weekly', 'monthly')),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- ============================================
-- LUNCH ATTENDANCE (Track which students paid for which dates)
-- ============================================
CREATE TABLE IF NOT EXISTS lunch_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  date DATE NOT NULL,
  status TEXT DEFAULT 'paid' CHECK(status IN ('paid', 'unpaid', 'absent')),
  payment_id INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (payment_id) REFERENCES lunch_payments(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  UNIQUE(student_id, date)
);

-- ============================================
-- DIRECTOR WITHDRAWALS
-- ============================================
CREATE TABLE IF NOT EXISTS director_withdrawals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  withdrawal_date DATE NOT NULL,
  description TEXT,
  approved_by INTEGER,
  approved_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- ============================================
-- DAILY LEDGER
-- ============================================
CREATE TABLE IF NOT EXISTS daily_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE UNIQUE NOT NULL,
  opening_balance DECIMAL(10, 2) DEFAULT 0,
  total_income DECIMAL(10, 2) DEFAULT 0,
  total_expenses DECIMAL(10, 2) DEFAULT 0,
  closing_balance DECIMAL(10, 2) DEFAULT 0,
  net_movement DECIMAL(10, 2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AUDIT TRAIL
-- ============================================
CREATE TABLE IF NOT EXISTS audit_trail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL CHECK(action IN ('CREATE', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  old_values TEXT,
  new_values TEXT,
  user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail indexes
CREATE INDEX IF NOT EXISTS idx_audit_trail_table ON audit_trail(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_trail_record ON audit_trail(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_date ON audit_trail(created_at);

-- ============================================
-- REPORTS (Cached report data for performance)
-- ============================================
CREATE TABLE IF NOT EXISTS cached_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_type TEXT NOT NULL,
  report_data TEXT NOT NULL,
  parameters TEXT,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  created_by INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update daily ledger on transaction insert
CREATE TRIGGER IF NOT EXISTS trg_transaction_insert_after
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
  INSERT OR IGNORE INTO daily_ledger (date) VALUES (NEW.transaction_date);
  
  UPDATE daily_ledger
  SET 
    total_income = total_income + CASE WHEN NEW.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN NEW.amount ELSE 0 END,
    total_expenses = total_expenses + CASE WHEN NEW.transaction_type IN ('expense', 'director_withdrawal') THEN NEW.amount ELSE 0 END,
    net_movement = (total_income + CASE WHEN NEW.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN NEW.amount ELSE 0 END) - 
                   (total_expenses + CASE WHEN NEW.transaction_type IN ('expense', 'director_withdrawal') THEN NEW.amount ELSE 0 END),
    transaction_count = transaction_count + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE date = NEW.transaction_date;
END;

-- Trigger to update daily ledger on transaction delete
CREATE TRIGGER IF NOT EXISTS trg_transaction_delete_after
AFTER DELETE ON transactions
FOR EACH ROW
BEGIN
  UPDATE daily_ledger
  SET 
    total_income = total_income - CASE WHEN OLD.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN OLD.amount ELSE 0 END,
    total_expenses = total_expenses - CASE WHEN OLD.transaction_type IN ('expense', 'director_withdrawal') THEN OLD.amount ELSE 0 END,
    net_movement = (total_income - CASE WHEN OLD.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN OLD.amount ELSE 0 END) - 
                   (total_expenses - CASE WHEN OLD.transaction_type IN ('expense', 'director_withdrawal') THEN OLD.amount ELSE 0 END),
    transaction_count = transaction_count - 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE date = OLD.transaction_date;
END;

-- ============================================
-- VIEWS
-- ============================================

-- View for student balances
CREATE VIEW IF NOT EXISTS vw_student_balances AS
SELECT 
  s.id,
  s.admission_number,
  s.first_name,
  s.last_name,
  s.class_id,
  c.name as class_name,
  COALESCE(SUM(CASE WHEN t.transaction_type = 'school_fee' THEN t.amount ELSE 0 END), 0) as total_paid,
  COALESCE(SUM(CASE WHEN sca.charge_id IS NOT NULL THEN sca.amount ELSE 0 END), 0) as total_charges,
  (COALESCE(SUM(CASE WHEN sca.charge_id IS NOT NULL THEN sca.amount ELSE 0 END), 0) - 
   COALESCE(SUM(CASE WHEN t.transaction_type = 'school_fee' THEN t.amount ELSE 0 END), 0)) as balance
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN transactions t ON s.id = t.student_id AND t.transaction_type = 'school_fee'
LEFT JOIN student_charge_assignments sca ON s.id = sca.student_id
GROUP BY s.id, s.admission_number, s.first_name, s.last_name, s.class_id, c.name;

-- View for lunch arrears
CREATE VIEW IF NOT EXISTS vw_lunch_arrears AS
SELECT 
  s.id,
  s.admission_number,
  s.first_name,
  s.last_name,
  s.class_id,
  c.name as class_name,
  COUNT(CASE WHEN la.status = 'unpaid' THEN 1 END) as unpaid_days,
  SUM(CASE WHEN la.status = 'unpaid' THEN lp.amount / 
    CASE 
      WHEN lp.payment_type = 'daily' THEN 1
      WHEN lp.payment_type = 'weekly' THEN 7
      WHEN lp.payment_type = 'monthly' THEN 30
    END 
    ELSE 0 END) as amount_owed
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN lunch_attendance la ON s.id = la.student_id AND la.status = 'unpaid'
LEFT JOIN lunch_payments lp ON la.payment_id = lp.id
GROUP BY s.id, s.admission_number, s.first_name, s.last_name, s.class_id, c.name;

-- View for daily summary
CREATE VIEW IF NOT EXISTS vw_daily_summary AS
SELECT 
  dl.date,
  dl.opening_balance,
  dl.total_income,
  dl.total_expenses,
  dl.closing_balance,
  dl.net_movement,
  dl.transaction_count,
  (SELECT COUNT(*) FROM transactions t WHERE t.transaction_date = dl.date AND t.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge')) as income_count,
  (SELECT COUNT(*) FROM transactions t WHERE t.transaction_date = dl.date AND t.transaction_type IN ('expense', 'director_withdrawal')) as expense_count
FROM daily_ledger dl
ORDER BY dl.date DESC;

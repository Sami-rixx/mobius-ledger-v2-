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
-- USER SESSIONS (for authentication tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for user_sessions table
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

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
-- INCOME
-- ============================================
CREATE TABLE IF NOT EXISTS income (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  income_category_id INTEGER NOT NULL,
  description TEXT,
  payer_name TEXT NOT NULL,
  payer_contact TEXT,
  payment_method_id INTEGER,
  transaction_id INTEGER,
  income_date DATE NOT NULL,
  notes TEXT,
  is_verified BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  FOREIGN KEY (income_category_id) REFERENCES income_categories(id),
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Indexes for income table
CREATE INDEX IF NOT EXISTS idx_income_receipt ON income(receipt_number);
CREATE INDEX IF NOT EXISTS idx_income_category ON income(income_category_id);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(income_date);
CREATE INDEX IF NOT EXISTS idx_income_payer ON income(payer_name);

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
  is_kitchen BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  FOREIGN KEY (parent_id) REFERENCES expense_categories(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Indexes for expense_categories table
CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(name);
CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON expense_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_expense_categories_kitchen ON expense_categories(is_kitchen);

-- ============================================
-- EXPENSES
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount DECIMAL(10, 2) NOT NULL,
  expense_category_id INTEGER NOT NULL,
  description TEXT,
  vendor_name TEXT NOT NULL,
  vendor_contact TEXT,
  payment_method_id INTEGER,
  transaction_id INTEGER,
  expense_date DATE NOT NULL,
  receipt_number TEXT,
  notes TEXT,
  is_verified BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  updated_by INTEGER,
  FOREIGN KEY (expense_category_id) REFERENCES expense_categories(id),
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Indexes for expenses table
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(expense_category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor_name);
CREATE INDEX IF NOT EXISTS idx_expenses_receipt ON expenses(receipt_number);
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount);

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

-- ============================================
-- DIRECTOR WITHDRAWALS TABLE (Milestone 9)
-- ============================================

-- Director withdrawals table: Tracks director/management withdrawals with approval workflow
CREATE TABLE IF NOT EXISTS director_withdrawals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount DECIMAL(10, 2) NOT NULL,
  label TEXT,
  purpose TEXT NOT NULL,
  description TEXT,
  recipient_name TEXT NOT NULL,
  recipient_contact TEXT,
  payment_method_id INTEGER,
  transaction_id INTEGER,
  withdrawal_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by INTEGER,
  approved_at DATETIME,
  rejected_by INTEGER,
  rejected_at DATETIME,
  rejection_reason TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (rejected_by) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Indexes for director_withdrawals table
CREATE INDEX IF NOT EXISTS idx_director_withdrawals_status ON director_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_director_withdrawals_date ON director_withdrawals(withdrawal_date);
CREATE INDEX IF NOT EXISTS idx_director_withdrawals_label ON director_withdrawals(label);
CREATE INDEX IF NOT EXISTS idx_director_withdrawals_recipient ON director_withdrawals(recipient_name);
CREATE INDEX IF NOT EXISTS idx_director_withdrawals_created_at ON director_withdrawals(created_at);

-- ============================================
-- REPORTS & ANALYTICS TABLES (Milestone 8)
-- ============================================

-- Reports table: Stores generated report metadata and data
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  parameters TEXT,
  report_data TEXT,
  file_path TEXT,
  generated_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- Daily summaries table: Pre-computed daily financial summaries
-- This improves performance for reports and analytics
CREATE TABLE IF NOT EXISTS daily_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  summary_date DATE NOT NULL UNIQUE,
  total_income DECIMAL(12, 2) NOT NULL DEFAULT 0,
  income_count INTEGER NOT NULL DEFAULT 0,
  total_expenses DECIMAL(12, 2) NOT NULL DEFAULT 0,
  expense_count INTEGER NOT NULL DEFAULT 0,
  net_flow DECIMAL(12, 2) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for reports table
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_title ON reports(title);

-- Indexes for daily_summaries table
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(summary_date);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_created_at ON daily_summaries(created_at);

-- View for report statistics
CREATE VIEW IF NOT EXISTS vw_report_statistics AS
SELECT 
  report_type,
  COUNT(*) as total_reports,
  MIN(created_at) as first_report_date,
  MAX(created_at) as last_report_date,
  COUNT(DISTINCT generated_by) as unique_users
FROM reports
GROUP BY report_type
ORDER BY total_reports DESC;

-- View for financial overview
CREATE VIEW IF NOT EXISTS vw_financial_overview AS
SELECT 
  'income' as type,
  COUNT(*) as count,
  COALESCE(SUM(amount), 0) as total_amount,
  AVG(amount) as avg_amount,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount
FROM income

UNION ALL

SELECT 
  'expense' as type,
  COUNT(*) as count,
  COALESCE(SUM(amount), 0) as total_amount,
  AVG(amount) as avg_amount,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount
FROM expenses

UNION ALL

SELECT 
  'daily_summary' as type,
  COUNT(*) as count,
  COALESCE(SUM(net_flow), 0) as total_amount,
  AVG(net_flow) as avg_amount,
  MIN(net_flow) as min_amount,
  MAX(net_flow) as max_amount
FROM daily_summaries;

-- ============================================
-- NOTIFICATIONS (Milestone 12)
-- ============================================

-- Notifications table: System notifications for users
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'INFO' CHECK(type IN ('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'REMINDER', 'ALERT')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  user_id INTEGER,
  is_read BOOLEAN NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  related_table TEXT,
  related_id INTEGER,
  scheduled_at DATETIME,
  sent_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_is_active ON notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_related_table ON notifications(related_table);
CREATE INDEX IF NOT EXISTS idx_notifications_related_id ON notifications(related_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- AUTHORIZATION & PERMISSIONS (Milestone 14)
-- ============================================

-- Permissions table: System permissions for role-based access control
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for permissions table
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_is_active ON permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_created_at ON permissions(created_at);

-- Roles table: User roles for access control
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  is_default BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for roles table
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_is_default ON roles(is_default);
CREATE INDEX IF NOT EXISTS idx_roles_created_at ON roles(created_at);

-- User-Role mapping table (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  UNIQUE(user_id, role_id)
);

-- Indexes for user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_at ON user_roles(assigned_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles(assigned_by);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role_unique ON user_roles(user_id, role_id);

-- Role-Permission mapping table (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  UNIQUE(role_id, permission_id)
);

-- Indexes for role_permissions table
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_assigned_at ON role_permissions(assigned_at);
CREATE INDEX IF NOT EXISTS idx_role_permissions_assigned_by ON role_permissions(assigned_by);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_permission_unique ON role_permissions(role_id, permission_id);

-- Import/Export Log table
CREATE TABLE IF NOT EXISTS import_export_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  file_name TEXT,
  record_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  user_id INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for import_export_log table
CREATE INDEX IF NOT EXISTS idx_import_export_log_type ON import_export_log(type);
CREATE INDEX IF NOT EXISTS idx_import_export_log_action ON import_export_log(action);
CREATE INDEX IF NOT EXISTS idx_import_export_log_table_name ON import_export_log(table_name);
CREATE INDEX IF NOT EXISTS idx_import_export_log_status ON import_export_log(status);
CREATE INDEX IF NOT EXISTS idx_import_export_log_user_id ON import_export_log(user_id);
CREATE INDEX IF NOT EXISTS idx_import_export_log_created_at ON import_export_log(created_at);

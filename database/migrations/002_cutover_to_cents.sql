-- Migration: Final cutover from DECIMAL to INTEGER cents
-- This migration removes all DECIMAL monetary columns and renames _cents columns
-- to their original names, completing the migration to integer-based storage.
--
-- IMPORTANT: Run this AFTER migration 001_migrate_to_cents.sql has been applied
-- and all _cents columns are populated.
--
-- This migration:
-- 1. Drops all DECIMAL monetary columns
-- 2. Renames all _cents columns to their base names
-- 3. Recreates triggers with integer arithmetic
-- 4. Updates all monetary data to be stored as INTEGER cents

BEGIN TRANSACTION;

-- ============================================
-- Record migration timestamp
-- ============================================
INSERT OR REPLACE INTO system_settings (key, value, description) 
VALUES ('migration_cutover_complete', datetime('now'), 'Timestamp when cutover to cents-only storage was completed');

-- ============================================
-- 1. Tables with simple amount column
-- ============================================

-- income table
ALTER TABLE income RENAME TO income_backup;

CREATE TABLE income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_number TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL,  -- Was DECIMAL(10,2), now INTEGER cents
    income_category_id INTEGER NOT NULL,
    description TEXT,
    payer_name TEXT NOT NULL,
    payer_contact TEXT,
    payment_method_id INTEGER NOT NULL,
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

INSERT INTO income (
    id, receipt_number, amount, income_category_id, description, payer_name, payer_contact,
    payment_method_id, transaction_id, income_date, notes, is_verified, created_at, updated_at, created_by, updated_by
) SELECT 
    id, receipt_number, amount_cents, income_category_id, description, payer_name, payer_contact,
    payment_method_id, transaction_id, income_date, notes, is_verified, created_at, updated_at, created_by, updated_by
FROM income_backup;

DROP TABLE income_backup;

-- expenses table
ALTER TABLE expenses RENAME TO expenses_backup;

CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_number TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL,  -- Was DECIMAL(10,2), now INTEGER cents
    expense_category_id INTEGER NOT NULL,
    description TEXT,
    payee_name TEXT NOT NULL,
    payee_contact TEXT,
    payment_method_id INTEGER NOT NULL,
    transaction_id INTEGER,
    expense_date DATE NOT NULL,
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

INSERT INTO expenses (
    id, receipt_number, amount, expense_category_id, description, payee_name, payee_contact,
    payment_method_id, transaction_id, expense_date, notes, is_verified, created_at, updated_at, created_by, updated_by
) SELECT 
    id, receipt_number, amount_cents, expense_category_id, description, payee_name, payee_contact,
    payment_method_id, transaction_id, expense_date, notes, is_verified, created_at, updated_at, created_by, updated_by
FROM expenses_backup;

DROP TABLE expenses_backup;

-- student_charges table
ALTER TABLE student_charges RENAME TO student_charges_backup;

CREATE TABLE student_charges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    amount INTEGER NOT NULL,  -- Was DECIMAL(10,2), now INTEGER cents
    charge_type TEXT NOT NULL DEFAULT 'one_time',
    class_id INTEGER,
    due_date DATE,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

INSERT INTO student_charges (
    id, name, description, amount, charge_type, class_id, due_date, is_active, created_at, updated_at, created_by, updated_by
) SELECT 
    id, name, description, amount_cents, charge_type, class_id, due_date, is_active, created_at, updated_at, created_by, updated_by
FROM student_charges_backup;

DROP TABLE student_charges_backup;

-- student_charge_assignments table
ALTER TABLE student_charge_assignments RENAME TO student_charge_assignments_backup;

CREATE TABLE student_charge_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    charge_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,  -- Was DECIMAL(10,2), now INTEGER cents
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    is_paid BOOLEAN DEFAULT 0,
    paid_at DATETIME,
    payment_method_id INTEGER,
    transaction_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    FOREIGN KEY (charge_id) REFERENCES student_charges(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

INSERT INTO student_charge_assignments (
    id, charge_id, student_id, amount, assigned_at, due_date, is_paid, paid_at,
    payment_method_id, transaction_id, notes, created_at, updated_at, created_by, updated_by
) SELECT 
    id, charge_id, student_id, amount_cents, assigned_at, due_date, is_paid, paid_at,
    payment_method_id, transaction_id, notes, created_at, updated_at, created_by, updated_by
FROM student_charge_assignments_backup;

DROP TABLE student_charge_assignments_backup;

-- transactions table
ALTER TABLE transactions RENAME TO transactions_backup;

CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_number TEXT UNIQUE NOT NULL,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('income', 'expense', 'school_fee', 'lunch_fee', 'student_charge', 'director_withdrawal')),
    amount INTEGER NOT NULL,  -- Was DECIMAL(10,2), now INTEGER cents
    category_id INTEGER,
    student_id INTEGER,
    description TEXT,
    payment_method_id INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    reference_number TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    FOREIGN KEY (category_id) REFERENCES income_categories(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

INSERT INTO transactions (
    id, receipt_number, transaction_type, amount, category_id, student_id, description,
    payment_method_id, transaction_date, reference_number, notes, created_at, updated_at, created_by, updated_by
) SELECT 
    id, receipt_number, transaction_type, amount_cents, category_id, student_id, description,
    payment_method_id, transaction_date, reference_number, notes, created_at, updated_at, created_by, updated_by
FROM transactions_backup;

DROP TABLE transactions_backup;

-- school_fee_payments table
ALTER TABLE school_fee_payments RENAME TO school_fee_payments_backup;

CREATE TABLE school_fee_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    transaction_id INTEGER,
    amount INTEGER NOT NULL,  -- Was DECIMAL(10,2), now INTEGER cents
    payment_date DATE NOT NULL,
    academic_year TEXT NOT NULL,
    term TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT 0,
    verified_by INTEGER,
    verified_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

INSERT INTO school_fee_payments (
    id, student_id, transaction_id, amount, payment_date, academic_year, term,
    is_verified, verified_by, verified_at, notes, created_at, updated_at, created_by, updated_by
) SELECT 
    id, student_id, transaction_id, amount_cents, payment_date, academic_year, term,
    is_verified, verified_by, verified_at, notes, created_at, updated_at, created_by, updated_by
FROM school_fee_payments_backup;

DROP TABLE school_fee_payments_backup;

-- lunch_payments table
ALTER TABLE lunch_payments RENAME TO lunch_payments_backup;

CREATE TABLE lunch_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    transaction_id INTEGER,
    amount INTEGER NOT NULL,  -- Was DECIMAL(10,2), now INTEGER cents
    payment_date DATE NOT NULL,
    payment_type TEXT NOT NULL DEFAULT 'daily',
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT 1,
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

INSERT INTO lunch_payments (
    id, student_id, transaction_id, amount, payment_date, payment_type,
    start_date, end_date, is_active, notes, created_at, updated_at, created_by, updated_by
) SELECT 
    id, student_id, transaction_id, amount_cents, payment_date, payment_type,
    start_date, end_date, is_active, notes, created_at, updated_at, created_by, updated_by
FROM lunch_payments_backup;

DROP TABLE lunch_payments_backup;

-- director_withdrawals table
ALTER TABLE director_withdrawals RENAME TO director_withdrawals_backup;

CREATE TABLE director_withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER UNIQUE,
    amount INTEGER NOT NULL,  -- Was DECIMAL(10,2), now INTEGER cents
    withdrawal_date DATE NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    purpose TEXT,
    recipient_name TEXT,
    approved_by INTEGER,
    approved_at DATETIME,
    rejected_by INTEGER,
    rejected_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (rejected_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

INSERT INTO director_withdrawals (
    id, transaction_id, amount, withdrawal_date, description, status, purpose,
    recipient_name, approved_by, approved_at, rejected_by, rejected_at, notes,
    created_at, updated_at, created_by, updated_by
) SELECT 
    id, transaction_id, amount_cents, withdrawal_date, description, status, purpose,
    recipient_name, approved_by, approved_at, rejected_by, rejected_at, notes,
    created_at, updated_at, created_by, updated_by
FROM director_withdrawals_backup;

DROP TABLE director_withdrawals_backup;

-- ============================================
-- 2. daily_ledger table (multiple monetary columns)
-- ============================================
ALTER TABLE daily_ledger RENAME TO daily_ledger_backup;

CREATE TABLE daily_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE UNIQUE NOT NULL,
    opening_balance INTEGER NOT NULL DEFAULT 0,  -- Was DECIMAL(10,2), now INTEGER cents
    total_income INTEGER NOT NULL DEFAULT 0,    -- Was DECIMAL(10,2), now INTEGER cents
    total_expenses INTEGER NOT NULL DEFAULT 0,   -- Was DECIMAL(10,2), now INTEGER cents
    closing_balance INTEGER NOT NULL DEFAULT 0, -- Was DECIMAL(10,2), now INTEGER cents
    net_movement INTEGER NOT NULL DEFAULT 0,    -- Was DECIMAL(10,2), now INTEGER cents
    transaction_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO daily_ledger (
    id, date, opening_balance, total_income, total_expenses, closing_balance,
    net_movement, transaction_count, created_at, updated_at
) SELECT 
    id, date, opening_balance_cents, total_income_cents, total_expenses_cents,
    closing_balance_cents, net_movement_cents, transaction_count, created_at, updated_at
FROM daily_ledger_backup;

DROP TABLE daily_ledger_backup;

-- ============================================
-- 3. daily_summaries table (DECIMAL(12,2) columns)
-- ============================================
ALTER TABLE daily_summaries RENAME TO daily_summaries_backup;

CREATE TABLE daily_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE UNIQUE NOT NULL,
    total_income INTEGER NOT NULL DEFAULT 0,    -- Was DECIMAL(12,2), now INTEGER cents
    income_count INTEGER NOT NULL DEFAULT 0,
    total_expenses INTEGER NOT NULL DEFAULT 0,   -- Was DECIMAL(12,2), now INTEGER cents
    expense_count INTEGER NOT NULL DEFAULT 0,
    net_flow INTEGER NOT NULL DEFAULT 0,         -- Was DECIMAL(12,2), now INTEGER cents
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO daily_summaries (
    id, date, total_income, income_count, total_expenses, expense_count, net_flow, created_at, updated_at
) SELECT 
    id, date, total_income_cents, income_count, total_expenses_cents, expense_count, net_flow_cents, created_at, updated_at
FROM daily_summaries_backup;

DROP TABLE daily_summaries_backup;

-- ============================================
-- 4. Recreate triggers with integer arithmetic
-- ============================================

-- Drop old triggers
DROP TRIGGER IF EXISTS trg_transaction_insert_after;
DROP TRIGGER IF EXISTS trg_transaction_delete_after;
DROP TRIGGER IF EXISTS trg_daily_ledger_update;

-- Trigger to update daily ledger on transaction insert
CREATE TRIGGER trg_transaction_insert_after
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
    closing_balance = (opening_balance + total_income + CASE WHEN NEW.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN NEW.amount ELSE 0 END) - 
                      (total_expenses + CASE WHEN NEW.transaction_type IN ('expense', 'director_withdrawal') THEN NEW.amount ELSE 0 END),
    transaction_count = transaction_count + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE date = NEW.transaction_date;
END;

-- Trigger to update daily ledger on transaction delete
CREATE TRIGGER trg_transaction_delete_after
AFTER DELETE ON transactions
FOR EACH ROW
BEGIN
  UPDATE daily_ledger
  SET 
    total_income = total_income - CASE WHEN OLD.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN OLD.amount ELSE 0 END,
    total_expenses = total_expenses - CASE WHEN OLD.transaction_type IN ('expense', 'director_withdrawal') THEN OLD.amount ELSE 0 END,
    net_movement = (total_income - CASE WHEN OLD.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN OLD.amount ELSE 0 END) - 
                   (total_expenses - CASE WHEN OLD.transaction_type IN ('expense', 'director_withdrawal') THEN OLD.amount ELSE 0 END),
    closing_balance = (opening_balance + total_income - CASE WHEN OLD.transaction_type IN ('income', 'school_fee', 'lunch_fee', 'student_charge') THEN OLD.amount ELSE 0 END) - 
                      (total_expenses - CASE WHEN OLD.transaction_type IN ('expense', 'director_withdrawal') THEN OLD.amount ELSE 0 END),
    transaction_count = transaction_count - 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE date = OLD.transaction_date;
END;

-- ============================================
-- 5. Verification
-- ============================================

-- Verify all tables have been migrated
SELECT 
  'income' as table_name,
  COUNT(*) as row_count,
  COUNT(amount) as amount_count,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount
FROM income
UNION ALL
SELECT 'expenses', COUNT(*), COUNT(amount), MIN(amount), MAX(amount) FROM expenses
UNION ALL
SELECT 'student_charges', COUNT(*), COUNT(amount), MIN(amount), MAX(amount) FROM student_charges
UNION ALL
SELECT 'student_charge_assignments', COUNT(*), COUNT(amount), MIN(amount), MAX(amount) FROM student_charge_assignments
UNION ALL
SELECT 'transactions', COUNT(*), COUNT(amount), MIN(amount), MAX(amount) FROM transactions
UNION ALL
SELECT 'school_fee_payments', COUNT(*), COUNT(amount), MIN(amount), MAX(amount) FROM school_fee_payments
UNION ALL
SELECT 'lunch_payments', COUNT(*), COUNT(amount), MIN(amount), MAX(amount) FROM lunch_payments
UNION ALL
SELECT 'director_withdrawals', COUNT(*), COUNT(amount), MIN(amount), MAX(amount) FROM director_withdrawals
UNION ALL
SELECT 'daily_ledger' as table_name, COUNT(*), COUNT(opening_balance), MIN(opening_balance), MAX(opening_balance) FROM daily_ledger
UNION ALL
SELECT 'daily_summaries' as table_name, COUNT(*), COUNT(total_income), MIN(total_income), MAX(total_income) FROM daily_summaries;

-- Verify no DECIMAL columns remain
SELECT 
  m.name as table_name,
  p.name as column_name,
  p.type as column_type
FROM sqlite_master m
JOIN pragma_table_info(m.name) p ON m.name = p.table_name
WHERE p.type LIKE '%DECIMAL%'
  AND m.type = 'table'
  AND m.name NOT LIKE 'sqlite_%'
  AND m.name NOT LIKE 'android_%';

COMMIT;

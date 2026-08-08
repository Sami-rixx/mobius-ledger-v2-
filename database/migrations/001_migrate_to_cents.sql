-- Migration: Populate _cents columns from DECIMAL columns
-- This migration converts existing DECIMAL(10,2) and DECIMAL(12,2) values to INTEGER cents
-- Run this on existing databases after schema has been updated with _cents columns
--
-- Multiplication strategy: amount * 100
-- Rounding strategy: CAST to INTEGER (truncates, which is correct for cents since DECIMAL(10,2) has max 2 decimal places)
-- NULL handling: Skip NULL values (leave _cents as NULL)
-- Overflow: DECIMAL(10,2) max is 99999999.99 -> 9999999999 cents (fits in INTEGER which is typically 64-bit)

BEGIN TRANSACTION;

-- Migration timestamp
INSERT OR IGNORE INTO system_settings (key, value, description) 
VALUES ('migration_to_cents_applied', datetime('now'), 'Timestamp when cents migration was applied');

-- 1. Income table
UPDATE income 
SET amount_cents = CAST(amount * 100 AS INTEGER) 
WHERE amount_cents IS NULL AND amount IS NOT NULL;

-- 2. Expenses table
UPDATE expenses 
SET amount_cents = CAST(amount * 100 AS INTEGER) 
WHERE amount_cents IS NULL AND amount IS NOT NULL;

-- 3. Student Charges table
UPDATE student_charges 
SET amount_cents = CAST(amount * 100 AS INTEGER) 
WHERE amount_cents IS NULL AND amount IS NOT NULL;

-- 4. Student Charge Assignments table
UPDATE student_charge_assignments 
SET amount_cents = CAST(amount * 100 AS INTEGER) 
WHERE amount_cents IS NULL AND amount IS NOT NULL;

-- 5. Transactions table
UPDATE transactions 
SET amount_cents = CAST(amount * 100 AS INTEGER) 
WHERE amount_cents IS NULL AND amount IS NOT NULL;

-- 6. School Fee Payments table
UPDATE school_fee_payments 
SET amount_cents = CAST(amount * 100 AS INTEGER) 
WHERE amount_cents IS NULL AND amount IS NOT NULL;

-- 7. Lunch Payments table
UPDATE lunch_payments 
SET amount_cents = CAST(amount * 100 AS INTEGER) 
WHERE amount_cents IS NULL AND amount IS NOT NULL;

-- 8. Director Withdrawals table
UPDATE director_withdrawals 
SET amount_cents = CAST(amount * 100 AS INTEGER) 
WHERE amount_cents IS NULL AND amount IS NOT NULL;

-- 9. Daily Ledger table (multiple columns)
UPDATE daily_ledger 
SET 
    opening_balance_cents = CAST(opening_balance * 100 AS INTEGER),
    total_income_cents = CAST(total_income * 100 AS INTEGER),
    total_expenses_cents = CAST(total_expenses * 100 AS INTEGER),
    closing_balance_cents = CAST(closing_balance * 100 AS INTEGER),
    net_movement_cents = CAST(net_movement * 100 AS INTEGER)
WHERE 
    (opening_balance_cents IS NULL AND opening_balance IS NOT NULL) OR
    (total_income_cents IS NULL AND total_income IS NOT NULL) OR
    (total_expenses_cents IS NULL AND total_expenses IS NOT NULL) OR
    (closing_balance_cents IS NULL AND closing_balance IS NOT NULL) OR
    (net_movement_cents IS NULL AND net_movement IS NOT NULL);

-- 10. Daily Summaries table (DECIMAL(12,2))
UPDATE daily_summaries 
SET 
    total_income_cents = CAST(total_income * 100 AS INTEGER),
    total_expenses_cents = CAST(total_expenses * 100 AS INTEGER),
    net_flow_cents = CAST(net_flow * 100 AS INTEGER)
WHERE 
    (total_income_cents IS NULL AND total_income IS NOT NULL) OR
    (total_expenses_cents IS NULL AND total_expenses IS NOT NULL) OR
    (net_flow_cents IS NULL AND net_flow IS NOT NULL);

-- Verification: Count migrated rows
SELECT 
    'income' as table_name, 
    COUNT(*) as migrated_rows 
FROM income WHERE amount_cents IS NOT NULL
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses WHERE amount_cents IS NOT NULL
UNION ALL
SELECT 'student_charges', COUNT(*) FROM student_charges WHERE amount_cents IS NOT NULL
UNION ALL
SELECT 'student_charge_assignments', COUNT(*) FROM student_charge_assignments WHERE amount_cents IS NOT NULL
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions WHERE amount_cents IS NOT NULL
UNION ALL
SELECT 'school_fee_payments', COUNT(*) FROM school_fee_payments WHERE amount_cents IS NOT NULL
UNION ALL
SELECT 'lunch_payments', COUNT(*) FROM lunch_payments WHERE amount_cents IS NOT NULL
UNION ALL
SELECT 'director_withdrawals', COUNT(*) FROM director_withdrawals WHERE amount_cents IS NOT NULL
UNION ALL
SELECT 'daily_ledger', COUNT(*) FROM daily_ledger WHERE opening_balance_cents IS NOT NULL
UNION ALL
SELECT 'daily_summaries', COUNT(*) FROM daily_summaries WHERE total_income_cents IS NOT NULL;

COMMIT;

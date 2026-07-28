-- Mobius Ledger v2 - Database Performance Optimization
-- Run this script to add performance-boosting indexes and optimizations

-- ============================================
-- PERFORMANCE PRAGMAS
-- ============================================
-- These can be run at startup or set in the connection

-- Enable WAL mode for concurrent reads and writes
PRAGMA journal_mode = WAL;

-- Enable foreign keys (should already be on)
PRAGMA foreign_keys = ON;

-- Increase cache size from default 2MB to 10MB
PRAGMA cache_size = -10000;

-- Use MEMORY for temp tables (faster)
PRAGMA temp_store = MEMORY;

-- Enable synchronous NORMAL for better performance (FULL is safer but slower)
PRAGMA synchronous = NORMAL;

-- Enable memory mapping for large databases
PRAGMA mmap_size = 30000000000; -- 30GB

-- Optimize for concurrent access
PRAGMA busy_timeout = 5000; -- 5 seconds
PRAGMA wal_autocheckpoint = 1000; -- Auto-checkpoint every 1000 pages

-- ============================================
-- ANALYZE DATABASE TO UPDATE STATISTICS
-- ============================================
-- This helps SQLite make better query planning decisions
ANALYZE;

-- ============================================
-- RECOMMENDED ADDITIONAL INDEXES
-- ============================================
-- Uncomment and run these if you have performance issues with specific queries

-- For school_fees table (frequently queried by student and status)
-- CREATE INDEX IF NOT EXISTS idx_school_fees_student_status ON school_fees(student_id, payment_status);
-- CREATE INDEX IF NOT EXISTS idx_school_fees_date_status ON school_fees(due_date, payment_status);

-- For transactions table (frequently filtered by date range)
-- CREATE INDEX IF NOT EXISTS idx_transactions_date_amount ON transactions(transaction_date, amount);
-- CREATE INDEX IF NOT EXISTS idx_transactions_type_date ON transactions(transaction_type, transaction_date);

-- For income table (frequently filtered by category and date)
-- CREATE INDEX IF NOT EXISTS idx_income_category_date ON income(category_id, income_date);

-- For expenses table (frequently filtered by category and date)
-- CREATE INDEX IF NOT EXISTS idx_expenses_category_date ON expenses(category_id, expense_date);

-- For daily_ledger table (frequently queried by date)
-- CREATE INDEX IF NOT EXISTS idx_daily_ledger_date ON daily_ledger(ledger_date);

-- ============================================
-- QUERY OPTIMIZATION NOTES
-- ============================================
-- 1. Use EXPLAIN QUERY PLAN to analyze slow queries
-- 2. Consider using partial indexes for queries on specific statuses
-- 3. Use COVERING INDEXES to avoid table lookups
-- 4. Limit result sets with LIMIT and OFFSET for pagination
-- 5. Use appropriate data types (INTEGER vs TEXT)

-- Example partial index for active students:
-- CREATE INDEX IF NOT EXISTS idx_students_active ON students(status) WHERE status = 'Active';

-- Example covering index for student lookups:
-- CREATE INDEX IF NOT EXISTS idx_students_covering ON students(admission_number, first_name, last_name, class_id) WHERE status = 'Active';

-- ============================================
-- MAINTENANCE COMMANDS
-- ============================================
-- Rebuild indexes periodically:
-- REINDEX;

-- Vacuum to reclaim space (run during low-traffic periods):
-- VACUUM;

-- Integrity check:
-- PRAGMA integrity_check;

-- ============================================
-- Notes:
-- ============================================
-- These optimizations are safe for production use
-- WAL mode provides better concurrency than default DELETE mode
-- Cache size should be set based on available RAM
-- Synchronous NORMAL is a good balance between safety and performance
-- Always test performance changes in staging before production

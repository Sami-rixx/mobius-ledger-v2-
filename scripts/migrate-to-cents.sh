#!/bin/bash

# Migrate to Cents Script
# This script performs the migration from DECIMAL(10,2) to INTEGER cents storage
# Phase 0-1: Add _cents columns alongside existing DECIMAL columns
# Phase 2: Migrate existing data from DECIMAL to cents columns
# Phase 3: Update application code to use cents columns
# Phase 4: Remove old DECIMAL columns (optional, after full verification)
#
# Usage: ./migrate-to-cents.sh [database_path] [phase]
#   phase: 0-1 (schema only), 2 (data migration), 3 (code migration), 4 (cleanup)

set -euo pipefail

# Configuration
DEFAULT_DB_PATH="$(dirname "$0")/../database/mobius_ledger.db"
SCHEMA_PATH="$(dirname "$0")/../database/schema.sql"
SEED_PATH="$(dirname "$0")/../database/seed.js"

# Parse arguments
DB_PATH=${1:-$DEFAULT_DB_PATH}
PHASE=${2:-"0-1"}

# Validate database exists
if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database file not found at $DB_PATH"
    exit 1
fi

echo "=== Money to Cents Migration Script ==="
echo "Database: $DB_PATH"
echo "Phase: $PHASE"
echo ""

# Phase 0-1: Schema migration (add _cents columns)
if [[ "$PHASE" == "0-1" || "$PHASE" == "all" ]]; then
    echo "Running Phase 0-1: Adding _cents columns..."
    
    # Check if _cents columns already exist
    CENTS_COLUMNS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM pragma_table_info('income') WHERE name = 'amount_cents';")
    
    if [ "$CENTS_COLUMNS" -eq 0 ]; then
        # Apply schema migration (ALTER TABLE statements)
        echo "Adding _cents columns to all monetary tables..."
        
        # List of tables and their monetary columns to migrate
        # Format: table_name:col1,col2,col3
        declare -A TABLES=(
            ["income"]="amount"
            ["expenses"]="amount"
            ["student_charges"]="amount"
            ["student_charge_assignments"]="amount"
            ["transactions"]="amount"
            ["school_fee_payments"]="amount"
            ["lunch_payments"]="amount"
            ["daily_ledger"]="opening_balance,total_income,total_expenses,closing_balance,net_movement"
            ["director_withdrawals"]="amount"
            ["daily_summaries"]="total_income,total_expenses,net_flow"
        )
        
        for table in "${!TABLES[@]}"; do
            columns="${TABLES[$table]}"
            echo "  Processing table: $table"
            IFS=',' read -ra col_array <<< "$columns"
            for col in "${col_array[@]}"; do
                col_cents="${col}_cents"
                echo "    Adding column: $col_cents"
                sqlite3 "$DB_PATH" "ALTER TABLE $table ADD COLUMN $col_cents INTEGER;"
            done
        done
        
        echo "Phase 0-1: Schema migration complete."
    else
        echo "Phase 0-1: _cents columns already exist. Skipping."
    fi
fi

# Phase 2: Data migration (convert DECIMAL to cents)
if [[ "$PHASE" == "2" || "$PHASE" == "all" ]]; then
    echo "Running Phase 2: Migrating data from DECIMAL to cents..."
    
    # For each table, migrate data
    sqlite3 "$DB_PATH" <<'EOF'
BEGIN TRANSACTION;

-- Migrate income
UPDATE income SET amount_cents = CAST(amount * 100 AS INTEGER) WHERE amount_cents IS NULL;

-- Migrate expenses
UPDATE expenses SET amount_cents = CAST(amount * 100 AS INTEGER) WHERE amount_cents IS NULL;

-- Migrate student_charges
UPDATE student_charges SET amount_cents = CAST(amount * 100 AS INTEGER) WHERE amount_cents IS NULL;

-- Migrate student_charge_assignments
UPDATE student_charge_assignments SET amount_cents = CAST(amount * 100 AS INTEGER) WHERE amount_cents IS NULL;

-- Migrate transactions
UPDATE transactions SET amount_cents = CAST(amount * 100 AS INTEGER) WHERE amount_cents IS NULL;

-- Migrate school_fee_payments
UPDATE school_fee_payments SET amount_cents = CAST(amount * 100 AS INTEGER) WHERE amount_cents IS NULL;

-- Migrate lunch_payments
UPDATE lunch_payments SET amount_cents = CAST(amount * 100 AS INTEGER) WHERE amount_cents IS NULL;

-- Migrate daily_ledger
UPDATE daily_ledger SET 
    opening_balance_cents = CAST(opening_balance * 100 AS INTEGER),
    total_income_cents = CAST(total_income * 100 AS INTEGER),
    total_expenses_cents = CAST(total_expenses * 100 AS INTEGER),
    closing_balance_cents = CAST(closing_balance * 100 AS INTEGER),
    net_movement_cents = CAST(net_movement * 100 AS INTEGER)
WHERE opening_balance_cents IS NULL OR total_income_cents IS NULL;

-- Migrate director_withdrawals
UPDATE director_withdrawals SET amount_cents = CAST(amount * 100 AS INTEGER) WHERE amount_cents IS NULL;

-- Migrate daily_summaries
UPDATE daily_summaries SET 
    total_income_cents = CAST(total_income * 100 AS INTEGER),
    total_expenses_cents = CAST(total_expenses * 100 AS INTEGER),
    net_flow_cents = CAST(net_flow * 100 AS INTEGER)
WHERE total_income_cents IS NULL OR total_expenses_cents IS NULL;

COMMIT;
EOF
    
    echo "Phase 2: Data migration complete."
fi

# Phase 3: Code migration is done manually by updating application files
if [[ "$PHASE" == "3" || "$PHASE" == "all" ]]; then
    echo "Phase 3: Code migration must be done manually."
    echo "Update all models, services, controllers to use _cents columns."
    echo "This phase is not automated."
fi

# Phase 4: Cleanup (remove old DECIMAL columns) - optional
if [[ "$PHASE" == "4" || "$PHASE" == "all" ]]; then
    echo "WARNING: Phase 4 will remove old DECIMAL columns!"
    read -p "This is destructive and cannot be undone. Continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Phase 4: Aborted."
        exit 0
    fi
    
    echo "Running Phase 4: Removing old DECIMAL columns..."
    # This would drop the old columns - left as exercise for manual execution
    echo "Phase 4: Not implemented in this script. Run manual ALTER TABLE DROP COLUMN statements."
fi

echo ""
echo "Migration script completed."

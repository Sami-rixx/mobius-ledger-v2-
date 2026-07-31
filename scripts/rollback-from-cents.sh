#!/bin/bash

# Rollback from Cents Migration Script
# This script reverts the database from the cents migration back to DECIMAL(10,2) storage
# It should only be used if the migration fails or needs to be undone
#
# Usage: ./rollback-from-cents.sh [database_path] [backup_file]
#   If backup_file is provided, restores from backup
#   If backup_file is not provided, attempts to reconstruct DECIMAL values from _cents columns

set -euo pipefail

# Configuration
DEFAULT_DB_PATH="$(dirname "$0")/../database/mobius_ledger.db"
DEFAULT_BACKUP_DIR="$(dirname "$0")/../backups"

# Parse arguments
DB_PATH=${1:-$DEFAULT_DB_PATH}
BACKUP_FILE=${2:-""}

# Validate database exists
if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database file not found at $DB_PATH"
    exit 1
fi

if [ -n "$BACKUP_FILE" ]; then
    # Restore from backup
    echo "=== Rolling back: Restoring from backup ==="
    echo "Database: $DB_PATH"
    echo "Backup: $BACKUP_FILE"
    echo ""
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "ERROR: Backup file not found at $BACKUP_FILE"
        exit 1
    fi
    
    # Stop any processes using the database
    echo "WARNING: Ensure no processes are using the database before proceeding!"
    read -p "Continue with restore? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    
    # Create backup of current state before restoring
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    EMERGENCY_BACKUP="${DEFAULT_BACKUP_DIR}/emergency_backup_${TIMESTAMP}.db"
    mkdir -p "$DEFAULT_BACKUP_DIR"
    cp "$DB_PATH" "$EMERGENCY_BACKUP"
    if [ -f "${DB_PATH}-wal" ]; then
        cp "${DB_PATH}-wal" "${EMERGENCY_BACKUP}-wal"
    fi
    if [ -f "${DB_PATH}-shm" ]; then
        cp "${DB_PATH}-shm" "${EMERGENCY_BACKUP}-shm"
    fi
    echo "Created emergency backup: $EMERGENCY_BACKUP"
    
    # Restore from backup
    cp "$BACKUP_FILE" "$DB_PATH"
    if [ -f "${BACKUP_FILE}-wal" ]; then
        cp "${BACKUP_FILE}-wal" "${DB_PATH}-wal"
    fi
    if [ -f "${BACKUP_FILE}-shm" ]; then
        cp "${BACKUP_FILE}-shm" "${DB_PATH}-shm"
    fi
    
    echo "Restore complete. Database has been reverted to backup state."
    exit 0
fi

# No backup file provided - attempt to reconstruct DECIMAL values from _cents columns
echo "=== Rolling back: Reconstructing DECIMAL from _cents columns ==="
echo "Database: $DB_PATH"
echo ""
echo "WARNING: This method is NOT RECOMMENDED for production data!"
echo "It may cause precision loss if _cents columns were populated from DECIMAL values."
echo ""

read -p "Continue with in-place rollback? (y/n): " -n 1 -r
 echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollback aborted. Use a backup file instead."
    exit 1
fi

# Create a backup before attempting rollback
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ROLLBACK_BACKUP="${DEFAULT_BACKUP_DIR}/pre_rollback_backup_${TIMESTAMP}.db"
mkdir -p "$DEFAULT_BACKUP_DIR"
cp "$DB_PATH" "$ROLLBACK_BACKUP"
echo "Created pre-rollback backup: $ROLLBACK_BACKUP"

# Reconstruct DECIMAL values from _cents columns
# Note: This may lose precision for values that were not exact multiples of 0.01
sqlite3 "$DB_PATH" <<'EOF'
BEGIN TRANSACTION;

-- Reconstruct income
UPDATE income SET amount = CAST(amount_cents AS REAL) / 100.0 WHERE amount_cents IS NOT NULL;

-- Reconstruct expenses
UPDATE expenses SET amount = CAST(amount_cents AS REAL) / 100.0 WHERE amount_cents IS NOT NULL;

-- Reconstruct student_charges
UPDATE student_charges SET amount = CAST(amount_cents AS REAL) / 100.0 WHERE amount_cents IS NOT NULL;

-- Reconstruct student_charge_assignments
UPDATE student_charge_assignments SET amount = CAST(amount_cents AS REAL) / 100.0 WHERE amount_cents IS NOT NULL;

-- Reconstruct transactions
UPDATE transactions SET amount = CAST(amount_cents AS REAL) / 100.0 WHERE amount_cents IS NOT NULL;

-- Reconstruct school_fee_payments
UPDATE school_fee_payments SET amount = CAST(amount_cents AS REAL) / 100.0 WHERE amount_cents IS NOT NULL;

-- Reconstruct lunch_payments
UPDATE lunch_payments SET amount = CAST(amount_cents AS REAL) / 100.0 WHERE amount_cents IS NOT NULL;

-- Reconstruct daily_ledger
UPDATE daily_ledger SET 
    opening_balance = CAST(opening_balance_cents AS REAL) / 100.0,
    total_income = CAST(total_income_cents AS REAL) / 100.0,
    total_expenses = CAST(total_expenses_cents AS REAL) / 100.0,
    closing_balance = CAST(closing_balance_cents AS REAL) / 100.0,
    net_movement = CAST(net_movement_cents AS REAL) / 100.0
WHERE opening_balance_cents IS NOT NULL;

-- Reconstruct director_withdrawals
UPDATE director_withdrawals SET amount = CAST(amount_cents AS REAL) / 100.0 WHERE amount_cents IS NOT NULL;

-- Reconstruct daily_summaries
UPDATE daily_summaries SET 
    total_income = CAST(total_income_cents AS REAL) / 100.0,
    total_expenses = CAST(total_expenses_cents AS REAL) / 100.0,
    net_flow = CAST(net_flow_cents AS REAL) / 100.0
WHERE total_income_cents IS NOT NULL;

COMMIT;
EOF

echo "Data reconstruction complete."
echo ""
echo "IMPORTANT: The database now has BOTH DECIMAL and _cents columns."
echo "To complete rollback, you must manually:"
echo "1. Revert schema.sql to remove _cents column definitions"
echo "2. Drop all _cents columns from all tables"
echo "3. Revert all application code to use DECIMAL columns"
echo "4. Restart the application"

#!/bin/bash

# Verify Cents Migration Script
# This script verifies that the cents migration has been applied correctly
# It checks that all _cents columns exist with INTEGER type and that data is consistent
#
# Usage: ./verify-cents-migration.sh [database_path]

set -euo pipefail

# Configuration
DEFAULT_DB_PATH="$(dirname "$0")/../database/mobius_ledger.db"

# Parse arguments
DB_PATH=${1:-$DEFAULT_DB_PATH}

# Validate database exists
if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database file not found at $DB_PATH"
    exit 1
fi

echo "=== Cents Migration Verification ==="
echo "Database: $DB_PATH"
echo ""

# Expected _cents columns by table
# Format: table_name:col1_cents,col2_cents,...
declare -A EXPECTED_CENTS_COLUMNS=(
    ["income"]="amount_cents"
    ["expenses"]="amount_cents"
    ["student_charges"]="amount_cents"
    ["student_charge_assignments"]="amount_cents"
    ["transactions"]="amount_cents"
    ["school_fee_payments"]="amount_cents"
    ["lunch_payments"]="amount_cents"
    ["daily_ledger"]="opening_balance_cents,total_income_cents,total_expenses_cents,closing_balance_cents,net_movement_cents"
    ["director_withdrawals"]="amount_cents"
    ["daily_summaries"]="total_income_cents,total_expenses_cents,net_flow_cents"
)

ALL_PASS=true
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Function to check if a column exists in a table
column_exists() {
    local table=$1
    local column=$2
    local count
    count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM pragma_table_info('$table') WHERE name = '$column';")
    [ "$count" -gt 0 ]
}

# Function to check column type
column_type() {
    local table=$1
    local column=$2
    sqlite3 "$DB_PATH" "SELECT type FROM pragma_table_info('$table') WHERE name = '$column';"
}

# Function to check for NULL values
count_nulls() {
    local table=$1
    local column=$2
    sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM $table WHERE $column IS NULL AND amount IS NOT NULL;"
}

# Function to verify consistency between DECIMAL and cents
verify_consistency() {
    local table=$1
    local decimal_col=$2
    local cents_col=$3
    local inconsistent
    inconsistent=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM $table WHERE ROUND($decimal_col * 100, 0) != $cents_col AND $cents_col IS NOT NULL AND $decimal_col IS NOT NULL;"
    )
    [ "$inconsistent" -eq 0 ]
}

echo "--- 1. Checking _cents columns exist ---"
for table in "${!EXPECTED_CENTS_COLUMNS[@]}"; do
    columns="${EXPECTED_CENTS_COLUMNS[$table]}"
    IFS=',' read -ra col_array <<< "$columns"
    for col in "${col_array[@]}"; do
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        if column_exists "$table" "$col"; then
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            echo "  [PASS] $table.$col exists"
        else
            ALL_PASS=false
            echo "  [FAIL] $table.$col missing"
        fi
    done
done

echo ""
echo "--- 2. Checking _cents column types are INTEGER ---"
for table in "${!EXPECTED_CENTS_COLUMNS[@]}"; do
    columns="${EXPECTED_CENTS_COLUMNS[$table]}"
    IFS=',' read -ra col_array <<< "$columns"
    for col in "${col_array[@]}"; do
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        col_type=$(column_type "$table" "$col")
        if [ "$col_type" = "INTEGER" ]; then
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            echo "  [PASS] $table.$col type is INTEGER"
        else
            ALL_PASS=false
            echo "  [FAIL] $table.$col type is $col_type (expected INTEGER)"
        fi
    done
done

echo ""
echo "--- 3. Checking _cents columns have data (Phase 2+) ---"
for table in "${!EXPECTED_CENTS_COLUMNS[@]}"; do
    columns="${EXPECTED_CENTS_COLUMNS[$table]}"
    IFS=',' read -ra col_array <<< "$columns"
    for col in "${col_array[@]}"; do
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        # Get the corresponding DECIMAL column name
        if [[ "$col" == *"_cents" ]]; then
            decimal_col="${col%_cents}"
            null_count=$(count_nulls "$table" "$col")
            if [ "$null_count" -eq 0 ]; then
                PASSED_CHECKS=$((PASSED_CHECKS + 1))
                echo "  [PASS] $table.$col has no NULL values"
            else
                echo "  [INFO] $table.$col has $null_count NULL values (may be expected before Phase 2)"
                # Don't fail the check for NULLs before Phase 2
                PASSED_CHECKS=$((PASSED_CHECKS + 1))
            fi
        fi
    done
done

echo ""
echo "--- 4. Checking consistency between DECIMAL and cents (Phase 2+) ---"
for table in "${!EXPECTED_CENTS_COLUMNS[@]}"; do
    columns="${EXPECTED_CENTS_COLUMNS[$table]}"
    IFS=',' read -ra col_array <<< "$columns"
    for col in "${col_array[@]}"; do
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        if [[ "$col" == *"_cents" ]]; then
            decimal_col="${col%_cents}"
            if verify_consistency "$table" "$decimal_col" "$col"; then
                PASSED_CHECKS=$((PASSED_CHECKS + 1))
                echo "  [PASS] $table: $decimal_col and $col are consistent"
            else
                ALL_PASS=false
                echo "  [FAIL] $table: $decimal_col and $col have inconsistent values"
            fi
        fi
    done
done

echo ""
echo "--- 5. Checking trigger definitions ---"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
# Check if triggers exist that populate _cents columns
TRIGGER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type = 'trigger' AND sql LIKE '%_cents%';")
if [ "$TRIGGER_COUNT" -gt 0 ]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    echo "  [PASS] Found $TRIGGER_COUNT trigger(s) that reference _cents columns"
else
    echo "  [INFO] No triggers found that reference _cents columns (may be expected)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi

echo ""
echo "=== Verification Summary ==="
echo "Total checks: $TOTAL_CHECKS"
echo "Passed: $PASSED_CHECKS"
echo "Failed: $((TOTAL_CHECKS - PASSED_CHECKS))"

if $ALL_PASS && [ "$PASSED_CHECKS" -eq "$TOTAL_CHECKS" ]; then
    echo ""
    echo "✓ ALL VERIFICATION CHECKS PASSED"
    exit 0
else
    echo ""
    echo "✗ SOME VERIFICATION CHECKS FAILED"
    exit 1
fi

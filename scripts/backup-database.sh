#!/bin/bash

# Backup Database Script for Money to Cents Migration
# This script creates a backup of the SQLite database before migration
# Usage: ./backup-database.sh [database_path] [backup_directory]

set -euo pipefail

# Configuration
DEFAULT_DB_PATH="$(dirname "$0")/../database/mobius_ledger.db"
DEFAULT_BACKUP_DIR="$(dirname "$0")/../backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Parse arguments
DB_PATH=${1:-$DEFAULT_DB_PATH}
BACKUP_DIR=${2:-$DEFAULT_BACKUP_DIR}
BACKUP_FILE="${BACKUP_DIR}/mobius_ledger_backup_${TIMESTAMP}.db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database file not found at $DB_PATH"
    exit 1
fi

# Check if database is in use
if lsof "$DB_PATH" >/dev/null 2>&1; then
    echo "WARNING: Database file is currently in use. Backup may be inconsistent."
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create backup
echo "Creating backup of $DB_PATH to $BACKUP_FILE..."
cp "$DB_PATH" "$BACKUP_FILE"

# Also backup WAL and SHM files if they exist
if [ -f "${DB_PATH}-wal" ]; then
    cp "${DB_PATH}-wal" "${BACKUP_FILE}-wal"
fi
if [ -f "${DB_PATH}-shm" ]; then
    cp "${DB_PATH}-shm" "${BACKUP_FILE}-shm"
fi

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
    echo "Backup created successfully: $BACKUP_FILE"
    echo "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
    
    # Verify backup integrity
    sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "Backup integrity verified: OK"
    else
        echo "WARNING: Backup integrity check failed"
        exit 1
    fi
else
    echo "ERROR: Backup creation failed"
    exit 1
fi

echo "Backup completed successfully."

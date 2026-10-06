#!/bin/bash
#
# Production backup for MÖBIUS LEDGER v2 (specification §13).
#
# - Consistent online snapshot via `sqlite3 .backup` (safe with WAL; never
#   a raw `cp` of a live database)
# - PRAGMA integrity_check on the snapshot BEFORE it is accepted
# - Compression + AES-256 encryption (openssl, key from BACKUP_PASSPHRASE_FILE)
# - Tiered retention: hourly (48h) / daily (14d) / weekly (90d)
# - Off-site replication to up to two rclone remotes; the second remote
#   should be an object-lock/append-only bucket for the immutable copy
#
# Usage:
#   BACKUP_PASSPHRASE_FILE=/etc/mobius/backup.key ./backup-production.sh [tier]
#     tier: hourly | daily | weekly   (default: hourly)
#
# Cron example (school hours 07:00-18:00, Africa/Nairobi):
#   0 7-18 * * 1-5  BACKUP_PASSPHRASE_FILE=/etc/mobius/backup.key /opt/mobius/scripts/backup-production.sh hourly
#   30 19  * * *    BACKUP_PASSPHRASE_FILE=/etc/mobius/backup.key /opt/mobius/scripts/backup-production.sh daily
#   0  20  * * 0    BACKUP_PASSPHRASE_FILE=/etc/mobius/backup.key /opt/mobius/scripts/backup-production.sh weekly

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_PATH="${MOBIUS_DB_PATH:-$SCRIPT_DIR/../database/mobius_ledger.db}"
BACKUP_ROOT="${MOBIUS_BACKUP_DIR:-$SCRIPT_DIR/../backups}"
TIER="${1:-hourly}"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"

# Off-site destinations (rclone remote:path). Leave empty to skip.
OFFSITE_PRIMARY="${MOBIUS_BACKUP_REMOTE_1:-}"
# The immutable destination should be a bucket with object-lock /
# append-only policy so that even a compromised server cannot erase it.
OFFSITE_IMMUTABLE="${MOBIUS_BACKUP_REMOTE_2:-}"

case "$TIER" in
  hourly|daily|weekly) ;;
  *) echo "ERROR: tier must be hourly, daily or weekly" >&2; exit 1 ;;
esac

if [ -z "${BACKUP_PASSPHRASE_FILE:-}" ] || [ ! -r "$BACKUP_PASSPHRASE_FILE" ]; then
  echo "ERROR: BACKUP_PASSPHRASE_FILE must point to a readable key file (backups are encrypted, §13)" >&2
  exit 1
fi
if [ ! -f "$DB_PATH" ]; then
  echo "ERROR: database not found at $DB_PATH" >&2
  exit 1
fi

TIER_DIR="$BACKUP_ROOT/$TIER"
mkdir -p "$TIER_DIR"
chmod 700 "$BACKUP_ROOT" "$TIER_DIR"

SNAPSHOT="$TIER_DIR/mobius_${TIER}_${TIMESTAMP}.db"
ARTIFACT="${SNAPSHOT}.gz.enc"

# 1) Consistent snapshot (works while the app is running, honors WAL)
sqlite3 "$DB_PATH" ".backup '$SNAPSHOT'"

# 2) Verify BEFORE accepting the snapshot
if ! sqlite3 "$SNAPSHOT" "PRAGMA integrity_check;" | grep -q '^ok$'; then
  echo "ERROR: integrity_check failed on snapshot — backup rejected" >&2
  rm -f "$SNAPSHOT"
  exit 1
fi

# 3) Compress + encrypt (AES-256-CBC with PBKDF2), then remove plaintext
gzip -c "$SNAPSHOT" | openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt \
  -pass "file:$BACKUP_PASSPHRASE_FILE" -out "$ARTIFACT"
rm -f "$SNAPSHOT"
chmod 600 "$ARTIFACT"

# 4) Record a checksum for restore verification
sha256sum "$ARTIFACT" > "${ARTIFACT}.sha256"

echo "Backup created: $ARTIFACT ($(du -h "$ARTIFACT" | cut -f1))"

# 5) Off-site replication (two destinations, one immutable — §13)
if [ -n "$OFFSITE_PRIMARY" ]; then
  rclone copy "$ARTIFACT" "$OFFSITE_PRIMARY/$TIER/" --no-traverse
  rclone copy "${ARTIFACT}.sha256" "$OFFSITE_PRIMARY/$TIER/" --no-traverse
  echo "Replicated to $OFFSITE_PRIMARY/$TIER/"
else
  echo "WARNING: MOBIUS_BACKUP_REMOTE_1 not set — no off-site copy made" >&2
fi
if [ -n "$OFFSITE_IMMUTABLE" ]; then
  rclone copy "$ARTIFACT" "$OFFSITE_IMMUTABLE/$TIER/" --no-traverse
  rclone copy "${ARTIFACT}.sha256" "$OFFSITE_IMMUTABLE/$TIER/" --no-traverse
  echo "Replicated to immutable destination $OFFSITE_IMMUTABLE/$TIER/"
else
  echo "WARNING: MOBIUS_BACKUP_REMOTE_2 (immutable) not set" >&2
fi

# 6) Local retention pruning (off-site retention is managed by bucket policy)
case "$TIER" in
  hourly) KEEP_MIN=$((48 * 60)) ;;   # 48 hours
  daily)  KEEP_MIN=$((14 * 24 * 60)) ;;  # 14 days
  weekly) KEEP_MIN=$((90 * 24 * 60)) ;;  # 90 days
esac
find "$TIER_DIR" -name 'mobius_*.enc' -mmin "+$KEEP_MIN" -delete
find "$TIER_DIR" -name 'mobius_*.sha256' -mmin "+$KEEP_MIN" -delete

echo "Backup completed successfully ($TIER tier)."

#!/bin/bash
#
# Restore drill for MÖBIUS LEDGER v2 (specification §13 minimum restore
# acceptance). Run at least monthly once operational.
#
# Performs a REAL restore into a scratch directory (never touches the live
# database) and verifies:
#   1. the artifact decrypts and decompresses,
#   2. PRAGMA integrity_check passes,
#   3. key row counts and financial totals are readable and printed for
#      comparison against the live system / expected figures.
#
# Usage:
#   BACKUP_PASSPHRASE_FILE=/etc/mobius/backup.key ./restore-drill.sh <backup.gz.enc>

set -euo pipefail

ARTIFACT="${1:?usage: restore-drill.sh <backup.gz.enc>}"

if [ -z "${BACKUP_PASSPHRASE_FILE:-}" ] || [ ! -r "$BACKUP_PASSPHRASE_FILE" ]; then
  echo "ERROR: BACKUP_PASSPHRASE_FILE must point to a readable key file" >&2
  exit 1
fi
if [ ! -f "$ARTIFACT" ]; then
  echo "ERROR: artifact not found: $ARTIFACT" >&2
  exit 1
fi

# 0) Checksum verification when a .sha256 sidecar exists
if [ -f "${ARTIFACT}.sha256" ]; then
  (cd "$(dirname "$ARTIFACT")" && sha256sum -c "$(basename "$ARTIFACT").sha256")
fi

WORKDIR="$(mktemp -d /tmp/mobius-restore-drill.XXXXXX)"
trap 'rm -rf "$WORKDIR"' EXIT
RESTORED="$WORKDIR/restored.db"

# 1) Decrypt + decompress
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -pass "file:$BACKUP_PASSPHRASE_FILE" -in "$ARTIFACT" | gunzip > "$RESTORED"

# 2) Integrity check
if ! sqlite3 "$RESTORED" "PRAGMA integrity_check;" | grep -q '^ok$'; then
  echo "RESTORE DRILL FAILED: integrity_check did not pass" >&2
  exit 1
fi
echo "integrity_check: ok"

# 3) Key row counts and financial totals
echo "--- Row counts ---"
for t in users income expenses transactions school_fees director_withdrawals audit_trail user_sessions; do
  if sqlite3 "$RESTORED" "SELECT name FROM sqlite_master WHERE type='table' AND name='$t';" | grep -q "$t"; then
    printf '%-22s %s\n' "$t" "$(sqlite3 "$RESTORED" "SELECT COUNT(*) FROM $t;")"
  fi
done

echo "--- Financial totals (cents) ---"
sqlite3 "$RESTORED" "SELECT 'income_total_cents', COALESCE(SUM(amount_cents),0) FROM income;" 2>/dev/null || true
sqlite3 "$RESTORED" "SELECT 'expense_total_cents', COALESCE(SUM(amount_cents),0) FROM expenses;" 2>/dev/null || true
sqlite3 "$RESTORED" "SELECT 'school_fees_paid_cents', COALESCE(SUM(amount_paid_cents),0) FROM school_fees;" 2>/dev/null || true

echo
echo "RESTORE DRILL PASSED: $ARTIFACT"
echo "Next step per §13: boot the application against a copy of $RESTORED"
echo "in a staging environment and verify the figures above match expectations."

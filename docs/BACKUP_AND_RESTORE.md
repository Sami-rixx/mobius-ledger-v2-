# Backup & Restore Runbook (Specification §13)

MÖBIUS LEDGER v2 runs as a single instance on a persistent VPS/VM with
SQLite on the local filesystem. This runbook implements the §13 backup
requirements.

## What the tooling does

| Script | Purpose |
|---|---|
| `scripts/backup-production.sh [hourly\|daily\|weekly]` | Consistent online snapshot (`sqlite3 .backup`), integrity check, gzip + AES-256 encryption, SHA-256 checksum, off-site replication, local retention pruning |
| `scripts/restore-drill.sh <artifact>` | Real restore into a scratch dir: checksum → decrypt → `PRAGMA integrity_check` → row counts & financial totals |
| `scripts/backup-database.sh` | Legacy pre-migration helper (plain local copy); superseded for production use by `backup-production.sh` |

## Requirements mapping (§13)

- **Hourly during school hours, daily, weekly retention** — cron schedule below; local retention: hourly 48 h, daily 14 d, weekly 90 d. Off-site retention is enforced by bucket lifecycle policy.
- **Encrypted** — AES-256-CBC with PBKDF2 (200k iterations); key lives in `BACKUP_PASSPHRASE_FILE` (e.g. `/etc/mobius/backup.key`, mode 400, owned by the service user). Keep an off-server copy of this key (password manager / sealed envelope) — without it backups are unrecoverable.
- **At least two off-host destinations** — `MOBIUS_BACKUP_REMOTE_1` and `MOBIUS_BACKUP_REMOTE_2` (rclone remotes, e.g. two different cloud object stores).
- **At least one immutable/append-only copy** — configure `MOBIUS_BACKUP_REMOTE_2` as an object-lock (compliance mode) or append-only bucket; the server's credentials for it must allow `write` but not `delete`/`overwrite`.
- **Monthly restore drill** — run `restore-drill.sh` against the newest artifact, then boot the app against the restored DB in staging and verify totals. Record the drill date and result.
- **RPO ≤ 1 h / RTO ≤ 4 h** — hourly tier bounds RPO during school hours; the drill proves the restore path stays within RTO.

## Setup (once per server)

```bash
# 1. Encryption key
sudo install -d -m 700 /etc/mobius
sudo sh -c 'openssl rand -base64 48 > /etc/mobius/backup.key'
sudo chmod 400 /etc/mobius/backup.key   # and store an off-server copy!

# 2. rclone remotes (one regular, one object-lock/append-only)
rclone config   # create remotes, e.g. "offsite1" and "offsite2-locked"

# 3. Cron (service user crontab; TZ Africa/Nairobi)
0 7-18 * * 1-5  BACKUP_PASSPHRASE_FILE=/etc/mobius/backup.key MOBIUS_BACKUP_REMOTE_1=offsite1:mobius-backups MOBIUS_BACKUP_REMOTE_2=offsite2-locked:mobius-backups /opt/mobius/scripts/backup-production.sh hourly
30 19  * * *    BACKUP_PASSPHRASE_FILE=/etc/mobius/backup.key MOBIUS_BACKUP_REMOTE_1=offsite1:mobius-backups MOBIUS_BACKUP_REMOTE_2=offsite2-locked:mobius-backups /opt/mobius/scripts/backup-production.sh daily
0  20  * * 0    BACKUP_PASSPHRASE_FILE=/etc/mobius/backup.key MOBIUS_BACKUP_REMOTE_1=offsite1:mobius-backups MOBIUS_BACKUP_REMOTE_2=offsite2-locked:mobius-backups /opt/mobius/scripts/backup-production.sh weekly
```

## Restoring for real (disaster recovery)

1. Stop the application service.
2. `BACKUP_PASSPHRASE_FILE=... scripts/restore-drill.sh <artifact>` — confirms the artifact is sound and prints totals.
3. Decrypt to the live path:
   ```bash
   openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
     -pass file:/etc/mobius/backup.key -in <artifact> | gunzip > database/mobius_ledger.db
   ```
4. Remove stale `-wal`/`-shm` files, fix ownership/permissions (600, service user).
5. Start the service; verify login, key row counts and financial totals against the drill output.
6. Record the incident, the artifact used, and the measured RTO.

## Notes

- Backups are taken with SQLite's online backup API, so they are consistent
  even while the application is running (WAL-safe) — never use `cp` on the
  live DB file.
- The in-app backup/restore endpoints (`/api/import-export/*`) are
  Admin-gated operational conveniences; §13 compliance relies on this
  out-of-band encrypted off-site pipeline.

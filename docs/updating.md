# Updating, Backup, and Restore

## Checking the Current Version

```bash
git log -1 --oneline
```

## Updating the Application

The recommended way to update is the automated script:

```bash
./scripts/update-app.sh
```

The script performs these steps in order:

1. **Backup** — runs `backup-db.sh` to dump the database
2. **Pull** — fetches and pulls the latest code from the remote
3. **Rebuild** — stops containers, rebuilds images, and starts them
4. **Verify** — checks that containers are running; if not, automatically
   restores the database from the backup created in step 1

If the update fails and the rollback triggers, you will see a message
indicating the restore. Review the error output, fix the issue, and run the
update script again.

## Backing Up the Encryption Key

The `secret.key` file in the project root encrypts all student PII at rest.
**If this file is lost, encrypted data becomes permanently unreadable.**

Copy it to a secure location alongside your database backups:

```bash
cp secret.key ./backups/secret.key
```

This file does not change between updates, so a single backup is sufficient
unless you perform a fresh install.

## Manual Backup

```bash
./scripts/backup-db.sh [backup-directory]
```

- Default directory: `./backups/`
- Creates a timestamped SQL dump: `ptt_backup_YYYYMMDD_HHMMSS.sql`
- Automatically keeps only the 5 most recent backups

The backup uses `pg_dump` with `--clean --if-exists`, so the resulting file
can be restored onto an existing database.

## Manual Restore

```bash
./scripts/restore-db.sh <backup-file.sql>
```

You will be prompted to confirm before overwriting. To skip the prompt
(e.g., in a script), pass `-y` or `--yes`:

```bash
./scripts/restore-db.sh ./backups/ptt_backup_20260101_120000.sql --yes
```

> **Warning:** Restoring overwrites all current data in the database.

## Post-Update Verification

After any update, verify:

1. All containers are running: `docker compose ps`
2. The application loads at `https://localhost` (or your DOMAIN)
3. Login works with an existing account
4. CSV upload completes without errors
5. Search returns expected records
6. Data export produces a valid CSV file

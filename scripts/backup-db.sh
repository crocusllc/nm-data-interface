#!/bin/bash
# Backup PTT database before updates

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ptt_backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "Creating database backup..."
docker compose exec -T api pg_dump -U postgres -d ptt_db --clean --if-exists > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup created: $BACKUP_FILE"
  # Keep only last 5 backups
  ls -t "$BACKUP_DIR"/ptt_backup_*.sql | tail -n +6 | xargs -r rm
else
  echo "Backup failed!"
  exit 1
fi

#!/bin/bash
# Restore PTT database from backup

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-db.sh <backup_file.sql>"
  echo "Available backups:"
  ls -la ./backups/*.sql 2>/dev/null || echo "No backups found"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "WARNING: This will overwrite all current data!"
read -p "Continue? (y/N) " confirm
if [ "$confirm" != "y" ]; then
  echo "Cancelled."
  exit 0
fi

echo "Restoring database from $BACKUP_FILE..."
docker compose exec -T api psql -U postgres -d ptt_db < "$BACKUP_FILE"

echo "Restore complete."

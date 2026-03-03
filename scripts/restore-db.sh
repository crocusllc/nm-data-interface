#!/bin/bash
# Restore PTT database from backup
#
# Usage: ./restore-db.sh <backup_file.sql> [-y|--yes]
#   -y, --yes    Skip confirmation prompt (for automated use)

BACKUP_FILE=""
SKIP_CONFIRM=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -y|--yes)
      SKIP_CONFIRM=true
      shift
      ;;
    *)
      if [ -z "$BACKUP_FILE" ]; then
        BACKUP_FILE="$1"
      fi
      shift
      ;;
  esac
done

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-db.sh <backup_file.sql> [-y|--yes]"
  echo "  -y, --yes    Skip confirmation prompt (for automated use)"
  echo ""
  echo "Available backups:"
  ls -la ./backups/*.sql 2>/dev/null || echo "No backups found"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

if [ "$SKIP_CONFIRM" = false ]; then
  echo "WARNING: This will overwrite all current data!"
  read -p "Continue? (y/N) " confirm
  if [ "$confirm" != "y" ]; then
    echo "Cancelled."
    exit 0
  fi
fi

echo "Restoring database from $BACKUP_FILE..."
# The backup file includes DROP statements (--clean --if-exists) from pg_dump
# This allows safe restore on existing databases
if docker compose exec -T api psql -U postgres -d ptt_db < "$BACKUP_FILE"; then
  echo "Restore complete."
else
  echo "Restore encountered errors. Please check the output above."
  exit 1
fi

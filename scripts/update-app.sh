#!/bin/bash
# Safely update PTT application while preserving data

set -e

echo "========================================="
echo "PTT Application Update Script"
echo "========================================="

# Step 1: Create backup
echo ""
echo "Step 1: Creating database backup..."
./scripts/backup-db.sh ./backups
BACKUP_FILE=$(ls -t ./backups/ptt_backup_*.sql | head -1)
echo "Backup saved to: $BACKUP_FILE"

# Step 2: Pull latest code
echo ""
echo "Step 2: Pulling latest code..."
git fetch origin
git pull

# Step 3: Rebuild containers (data preserved via volume)
echo ""
echo "Step 3: Rebuilding application..."
docker compose down
docker compose up -d --build

# Step 4: Verify
echo ""
echo "Step 4: Verifying deployment..."
sleep 15  # Wait for services to start
if docker compose ps | grep -q "Up"; then
  echo "✓ Containers are running"
else
  echo "✗ Container startup issue detected"
  echo "Rolling back database from backup..."
  ./scripts/restore-db.sh "$BACKUP_FILE" --yes
  exit 1
fi

echo ""
echo "========================================="
echo "Update complete!"
echo "Backup available at: $BACKUP_FILE"
echo "========================================="

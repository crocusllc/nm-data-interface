#!/bin/bash
# PTT application update - pulls latest and redeploys
set -e

echo "Stopping services..."
docker compose down

echo "Pulling latest code..."
git pull

echo "Rebuilding and deploying..."
./deploy.sh

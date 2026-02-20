#!/bin/bash
# PTT deployment - run from project root
set -e

[ -f .env ] || { echo "ERROR: .env not found. Copy .env.example to .env and configure."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker required."; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "ERROR: Docker Compose required."; exit 1; }

echo "Building and starting services..."
docker compose up -d --build

echo "Waiting for services to become healthy..."
timeout 120 bash -c 'until docker compose ps 2>/dev/null | grep -q "healthy"; do sleep 5; done' || true

docker compose ps
echo "Deployment complete. Access at https://localhost (or your configured DOMAIN)"

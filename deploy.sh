#!/bin/bash
# PTT deployment - run from project root
set -e

[ -f .env ] || { echo "ERROR: .env not found. Copy .env.example to .env and configure."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker required."; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "ERROR: Docker Compose required."; exit 1; }

# Ensure secret.key exists as a regular file before Docker mounts it.
# Docker bind-mounts create directories for non-existent paths, which breaks load_key().
if [ -d "./secret.key" ]; then
    echo "WARNING: secret.key is a directory (broken mount artifact). Removing and regenerating..."
    rm -rf ./secret.key
fi
if [ ! -f "./secret.key" ]; then
    echo "Generating encryption key..."
    python3 -c "import base64, os, sys; sys.stdout.buffer.write(base64.urlsafe_b64encode(os.urandom(32)))" > ./secret.key
    echo "Encryption key generated."
fi

echo "Building and starting services..."
docker compose up -d --build

echo "Waiting for services to become healthy..."
timeout 120 bash -c 'until docker compose ps 2>/dev/null | grep -q "healthy"; do sleep 5; done' || true

docker compose ps
echo "Deployment complete. Access at https://localhost (or your configured DOMAIN)"

# Check if auto-start on boot is configured
if ! systemctl is-enabled ptt-autostart.service &>/dev/null; then
    echo ""
    echo "NOTE: Auto-start on boot is not enabled."
    echo "  To start containers automatically after a server reboot, run:"
    echo "  sudo ./scripts/install-autostart.sh"
fi

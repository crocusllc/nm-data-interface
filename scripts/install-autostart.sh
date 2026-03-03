#!/bin/bash
# Install systemd service for PTT auto-start on boot
# Usage: sudo ./scripts/install-autostart.sh [/path/to/ptt]
set -e

PTT_DIR="${1:-$(cd "$(dirname "$0")/.." && pwd)}"

if [ "$(id -u)" -ne 0 ]; then
    echo "ERROR: Must run as root (use sudo)."
    exit 1
fi

if [ ! -f "$PTT_DIR/docker-compose.yml" ]; then
    echo "ERROR: docker-compose.yml not found in $PTT_DIR"
    exit 1
fi

# Create the service file with the correct WorkingDirectory
sed "s|WorkingDirectory=.*|WorkingDirectory=$PTT_DIR|" \
    "$PTT_DIR/scripts/ptt-autostart.service" > /etc/systemd/system/ptt-autostart.service

systemctl daemon-reload
systemctl enable ptt-autostart.service

echo "Enabled ptt-autostart.service (WorkingDirectory=$PTT_DIR)"
echo "Containers will start automatically on boot."
echo ""
echo "Commands:"
echo "  systemctl status ptt-autostart   # Check status"
echo "  systemctl disable ptt-autostart  # Disable auto-start"

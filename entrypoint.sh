#!/bin/bash
echo "Waiting for config.yaml to be available..."

while [ ! -f /app/config.yaml ]; do
  sleep 1
done

echo "Generating CSV files..."
python3 /tmp/read_config.py --mode csv --config /app/config.yaml --template /tmp/app_template.jinja2 --output /app/app.py
echo "CSV generation complete."

exec "$@"
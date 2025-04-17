#!/bin/bash
echo "Waiting for config.yaml to be available..."

while [ ! -f /app/config.yaml ]; do
  sleep 1
done

if [ ! -s "./secret.key" ]; then
  echo "Generating key..."
  python3 /tmp/read_config.py --mode key --config /app/config.yaml --template /tmp/app_template.jinja2 --output /app/app.py
fi

mv ./secret.key /app/secret.key
echo "Key generation complete."

echo "Generating CSV files..."
python3 /tmp/read_config.py --mode csv --config /app/config.yaml --template /tmp/app_template.jinja2 --output /app/app.py
echo "CSV generation complete."

echo "Generating SQL files..."
python3 /tmp/read_config.py --mode db --config /app/config.yaml --template /tmp/app_template.jinja2 --output /app/app.py
echo "SQL generation complete."

echo "Generating app file..."
python3 /tmp/read_config.py --mode app --config /app/config.yaml --template /tmp/app_template.jinja2 --output /app/app.py
echo "App file generation complete."

# Move scripts
cp /tmp/sql/student_info.sql /scripts/student_info.sql
cp /tmp/sql/clinical_placements.sql /scripts/clinical_placements.sql
cp /tmp/sql/program_info.sql /scripts/program_info.sql
cp /tmp/sql/type_columns.sql /scripts/type_columns.sql

exec "$@"
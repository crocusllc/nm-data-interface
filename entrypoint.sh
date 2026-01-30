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

# Check if database is already initialized
if [ ! -f /var/lib/postgresql/data/PG_VERSION ]; then
  echo "Initializing new PostgreSQL database..."
  
  # Initialize database cluster
  /usr/lib/postgresql/17/bin/initdb -D /var/lib/postgresql/data
  
  # Start PostgreSQL temporarily for setup
  /usr/lib/postgresql/17/bin/pg_ctl -D /var/lib/postgresql/data \
    -o "-p $POSTGRES_PORT" -l /var/lib/postgresql/data/logfile start
  
  # Create database and run DDL scripts
  psql -U $POSTGRES_USER -p $POSTGRES_PORT -d postgres \
    -c "CREATE DATABASE $POSTGRES_DB"
  
  psql -U $POSTGRES_USER -p $POSTGRES_PORT -d $POSTGRES_DB \
    -f /scripts/users_ddl.sql
  psql -U $POSTGRES_USER -p $POSTGRES_PORT -d $POSTGRES_DB \
    -f /scripts/logs_ddl.sql
  psql -U $POSTGRES_USER -p $POSTGRES_PORT -d $POSTGRES_DB \
    -f /scripts/schools_districts.sql
  psql -U $POSTGRES_USER -p $POSTGRES_PORT -d $POSTGRES_DB \
    -f /scripts/student_info.sql
  psql -U $POSTGRES_USER -p $POSTGRES_PORT -d $POSTGRES_DB \
    -f /scripts/clinical_placements.sql
  psql -U $POSTGRES_USER -p $POSTGRES_PORT -d $POSTGRES_DB \
    -f /scripts/program_info.sql
  psql -U $POSTGRES_USER -p $POSTGRES_PORT -d $POSTGRES_DB \
    -f /scripts/type_columns.sql
  
  # Stop temporary PostgreSQL
  /usr/lib/postgresql/17/bin/pg_ctl -D /var/lib/postgresql/data stop
  
  echo "Database initialization complete."
else
  echo "Existing database found. Skipping initialization."
fi

exec "$@"
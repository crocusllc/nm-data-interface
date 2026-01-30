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
  
  # Ensure proper ownership of data directory
  chown -R postgres:postgres /var/lib/postgresql/data
  
  # Initialize database cluster as postgres user
  su - postgres -c "/usr/lib/postgresql/15/bin/initdb -D /var/lib/postgresql/data"
  
  # Start PostgreSQL temporarily for setup
  su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D /var/lib/postgresql/data -o \"-p ${POSTGRES_PORT:-5432}\" -l /var/lib/postgresql/data/logfile start"
  
  # Wait for PostgreSQL to be ready
  echo "Waiting for PostgreSQL to be ready..."
  for i in {1..30}; do
    if su - postgres -c "/usr/lib/postgresql/15/bin/pg_isready -p ${POSTGRES_PORT:-5432}" > /dev/null 2>&1; then
      echo "PostgreSQL is ready."
      break
    fi
    sleep 1
  done
  
  # Create database and run DDL scripts
  su - postgres -c "psql -p ${POSTGRES_PORT:-5432} -d postgres -c \"CREATE DATABASE ${POSTGRES_DB:-ptt_db}\""
  
  su - postgres -c "psql -p ${POSTGRES_PORT:-5432} -d ${POSTGRES_DB:-ptt_db} -f /scripts/users_ddl.sql"
  su - postgres -c "psql -p ${POSTGRES_PORT:-5432} -d ${POSTGRES_DB:-ptt_db} -f /scripts/logs_ddl.sql"
  su - postgres -c "psql -p ${POSTGRES_PORT:-5432} -d ${POSTGRES_DB:-ptt_db} -f /scripts/schools_districts.sql"
  su - postgres -c "psql -p ${POSTGRES_PORT:-5432} -d ${POSTGRES_DB:-ptt_db} -f /scripts/student_info.sql"
  su - postgres -c "psql -p ${POSTGRES_PORT:-5432} -d ${POSTGRES_DB:-ptt_db} -f /scripts/clinical_placements.sql"
  su - postgres -c "psql -p ${POSTGRES_PORT:-5432} -d ${POSTGRES_DB:-ptt_db} -f /scripts/program_info.sql"
  su - postgres -c "psql -p ${POSTGRES_PORT:-5432} -d ${POSTGRES_DB:-ptt_db} -f /scripts/type_columns.sql"
  
  # Stop temporary PostgreSQL
  su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D /var/lib/postgresql/data stop"
  
  echo "Database initialization complete."
else
  echo "Existing database found. Skipping initialization."
fi

exec "$@"
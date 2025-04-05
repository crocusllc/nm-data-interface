# Use a lightweight Python base image
FROM python:3.9-slim

# Define arguments for the database
ARG PG_USER
ARG PG_PWD
ARG PG_DB
ARG PG_PORT

# Install Postgres and supervisor
RUN apt-get update && apt-get install -y \
    postgresql-15 \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY read_config.py /tmp/read_config.py
COPY config.yaml /tmp/config.yaml
COPY app_template.jinja2 /tmp/app_template.jinja2
COPY docker-compose.yml /tmp/docker-compose.yml
COPY supervisord.conf /tmp/supervisord.conf

# Entrypoint setup
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

# Default command (optional, can be overridden by docker-compose)
CMD ["python3", "main.py"]

RUN mkdir /app
RUN mkdir -p /tmp/sql/
RUN mkdir -p /tmp/csv/ 
# Execute commands

RUN cd /tmp && python3 read_config.py --mode app --config config.yaml --template app_template.jinja2 --output app.py
RUN cd /tmp && python3 read_config.py --mode db --config config.yaml --template app_template.jinja2 --output app.py
#RUN cd /tmp && python3 read_config.py --mode csv --config config.yaml --template app_template.jinja2 --output app.py

RUN mv /tmp/app.py /app/app.py

RUN mkdir /scripts/
# Move scripts
RUN cp /tmp/sql/student_info.sql /scripts/student_info.sql
RUN cp /tmp/sql/clinical_placements.sql /scripts/clinical_placements.sql
RUN cp /tmp/sql/program_info.sql /scripts/program_info.sql
RUN cp /tmp/sql/type_columns.sql /scripts/type_columns.sql

# Copy your application code into /app
WORKDIR /app

# Set environment variables for Postgres
ENV POSTGRES_USER=$PG_USER
ENV POSTGRES_PASSWORD=$PG_PWD
ENV POSTGRES_DB=$PG_DB
ENV POSTGRES_PORT=$PG_PORT

# Create Postgres data directory (not declared as a volume)
RUN mkdir -p /var/lib/postgresql/data \
    && chown -R postgres:postgres /var/lib/postgresql

# Copy the supervisor configuration
RUN cp /tmp/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose the Flask port (5000) and Postgres port (5432)
EXPOSE 5000 $PG_PORT

# Switch to the postgres user to initialize the DB
USER $PG_USER

# Initialize the database cluster & create DB
RUN /usr/lib/postgresql/15/bin/initdb -D /var/lib/postgresql/data

# Make sure these .sql files are in the same directory as your Dockerfile

COPY backend/sql/ /scripts/

RUN /usr/lib/postgresql/15/bin/pg_ctl \
    -D /var/lib/postgresql/data \
    -o "-p $PG_PORT" \
    -l /var/lib/postgresql/data/logfile \
    start \ 
&& psql -U $PG_USER -p $PG_PORT -d postgres -c "CREATE DATABASE $PG_DB" \
&& psql -U $PG_USER -p $PG_PORT -d $PG_DB -f /scripts/users_ddl.sql \
&& psql -U $PG_USER -p $PG_PORT -d $PG_DB -f /scripts/logs_ddl.sql \
&& psql -U $PG_USER -p $PG_PORT -d $PG_DB -f /scripts/schools_districts.sql \
&& psql -U $PG_USER -p $PG_PORT -d $PG_DB -f /scripts/clinical_placements.sql \
&& psql -U $PG_USER -p $PG_PORT -d $PG_DB -f /scripts/student_info.sql \
&& psql -U $PG_USER -p $PG_PORT -d $PG_DB -f /scripts/program_info.sql \
&& psql -U $PG_USER -p $PG_PORT -d $PG_DB -f /scripts/type_columns.sql

# Switch back to root so supervisor can manage processes
USER root

# Command to start supervisor (which starts both Postgres and Flask)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]


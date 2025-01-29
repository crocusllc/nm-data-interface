# Use a lightweight Python base image
FROM python:3.9-slim

# Install Postgres and supervisor
RUN apt-get update && apt-get install -y \
    postgresql-15 \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy your application code into /app
WORKDIR /app
COPY app.py /app/

# Set environment variables for Postgres
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=ptt_db
ENV POSTGRES_PORT=5433

# Create Postgres data directory (not declared as a volume)
RUN mkdir -p /var/lib/postgresql/data \
    && chown -R postgres:postgres /var/lib/postgresql

# Copy the supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose the Flask port (5000) and Postgres port (5432)
EXPOSE 5000 5433

# Switch to the postgres user to initialize the DB
USER postgres


# Initialize the database cluster & create DB
RUN /usr/lib/postgresql/15/bin/initdb -D /var/lib/postgresql/data

# Make sure these .sql files are in the same directory as your Dockerfile

COPY backend/sql/ /scripts/

RUN /usr/lib/postgresql/15/bin/pg_ctl \
    -D /var/lib/postgresql/data \
    -o "-p 5433" \
    -l /var/lib/postgresql/data/logfile \
    start \
&& createdb -p 5433 ptt_db \
&& psql -U postgres -p 5433 -d ptt_db -f /scripts/users_ddl.sql \
&& psql -U postgres -p 5433 -d ptt_db -f /scripts/logs_ddl.sql \
#&& psql -U postgres -d ptt_db -f /scripts/student_info.sql \
&& /usr/lib/postgresql/15/bin/pg_ctl \
  -D /var/lib/postgresql/data \
  -o "-p 5433" \
  stop

# Switch back to root so supervisor can manage processes
USER root

# Command to start supervisor (which starts both Postgres and Flask)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]


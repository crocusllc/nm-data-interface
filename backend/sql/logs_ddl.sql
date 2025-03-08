CREATE TABLE logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    file_name TEXT NULL,
    action VARCHAR(50) CHECK (action IN ('uploaded', 'downloaded','created','updated','deleted','rejected')) NOT NULL,
    source_table VARCHAR(50) CHECK (source_table IN ('student_info', 'program_info', 'clinical_placements', 'all')) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT NULL,
    source_id INTEGER NULL,
    total_records INTEGER NOT NULL,
    valid_records INTEGER NOT NULL,
    invalid_records INTEGER NOT NULL
);


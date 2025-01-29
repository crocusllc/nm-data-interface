CREATE TABLE logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(50) CHECK (action IN ('upload', 'download')) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    total_records INTEGER NOT NULL,
    valid_records INTEGER NOT NULL,
    invalid_records INTEGER NOT NULL
);


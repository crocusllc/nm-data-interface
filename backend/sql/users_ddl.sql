CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_email VARCHAR(100) UNIQUE NOT NULL,
    password_expiration_date DATE NOT NULL,
    user_role VARCHAR(20) CHECK (user_role IN ('administrator', 'editor', 'viewer')) NOT NULL,
    new_password BOOLEAN NULL DEFAULT TRUE
);

INSERT INTO users (
    user_id,
    username,
    password_hash,
    user_email,
    password_expiration_date,
    user_role,
    new_password
) VALUES (
   1,
   'admin',
    '$2a$10$HJn5BCRhYWBDi6NCqznwdOtm24BllSJNPPkks378JtX800WkWV142',
    'admin@example.com',
    '2099-12-31',
    'administrator',
    true
);

INSERT INTO users (
   user_id,
    username,
    password_hash,
    user_email,
    password_expiration_date,
    user_role,
    new_password
) VALUES (
   2,
   'editor',
    '$2a$10$HJn5BCRhYWBDi6NCqznwdOtm24BllSJNPPkks378JtX800WkWV142',
    'editor@example.com',
    '2099-12-31',
    'editor',
    true
);

INSERT INTO users (
   user_id,
    username,
    password_hash,
    user_email,
    password_expiration_date,
    user_role,
    new_password
) VALUES (
   3,
   'viewer',
    '$2a$10$HJn5BCRhYWBDi6NCqznwdOtm24BllSJNPPkks378JtX800WkWV142',
    'viewer@example.com',
    '2099-12-31',
    'viewer',
    true
);

CREATE EXTENSION IF NOT EXISTS pgcrypto;
--ALTER TABLE students ENABLE ROW LEVEL SECURITY;
--ALTER TABLE clinical_placements ENABLE ROW LEVEL SECURITY;

-- Policy for students table
--CREATE POLICY student_admin_policy
--  ON students
--  FOR SELECT
--  USING (current_user = 'administrator');

-- Policy for clinical_placements table
--CREATE POLICY placement_admin_policy
--  ON clinical_placements
--  FOR SELECT
--  USING (current_user = 'administrator');

--ALTER TABLE students FORCE ROW LEVEL SECURITY;
--ALTER TABLE clinical_placements FORCE ROW LEVEL SECURITY;


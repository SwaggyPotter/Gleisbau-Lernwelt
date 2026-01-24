CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS registration_keys (
    key text PRIMARY KEY,
    year smallint NOT NULL CHECK (year BETWEEN 1 AND 3),
    created_at timestamptz NOT NULL DEFAULT now(),
    uses integer NOT NULL DEFAULT 0 CHECK (uses >= 0),
    max_uses integer NOT NULL DEFAULT 1 CHECK (max_uses >= 1),
    issued_by text
);

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    email text NOT NULL UNIQUE,
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    year smallint CHECK (year BETWEEN 1 AND 3),
    key_used text REFERENCES registration_keys(key),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_fields (
    id text PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    year smallint NOT NULL CHECK (year BETWEEN 1 AND 3),
    tag text
);

CREATE TABLE IF NOT EXISTS user_progress (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_id text NOT NULL REFERENCES learning_fields(id) ON DELETE CASCADE,
    progress numeric(5, 2) NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
    mistakes integer NOT NULL DEFAULT 0 CHECK (mistakes >= 0),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, field_id)
);

CREATE INDEX IF NOT EXISTS idx_users_year ON users(year);
CREATE INDEX IF NOT EXISTS idx_progress_field ON user_progress(field_id);

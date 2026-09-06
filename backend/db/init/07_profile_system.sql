-- Profil-System: Sessions (Bearer-Token-Login), modul-uebergreifende Statistiken,
-- Errungenschaften-Katalog + Freischaltungen, Nutzer-Einstellungen.
-- Hinweis: Dieses Skript laeuft nur bei einer FRISCHEN Datenbank (Postgres
-- docker-entrypoint fuehrt db/init/*.sql nur beim allerersten Start aus).
-- Auf einer bereits laufenden Datenbank uebernimmt runStartupMigrations() in
-- backend/src/index.ts dieselben CREATE TABLE IF NOT EXISTS-Anweisungen.

CREATE TABLE IF NOT EXISTS sessions (
    token text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS module_stats (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_key text NOT NULL,
    correct integer NOT NULL DEFAULT 0 CHECK (correct >= 0),
    wrong integer NOT NULL DEFAULT 0 CHECK (wrong >= 0),
    streak integer NOT NULL DEFAULT 0 CHECK (streak >= 0),
    best_streak integer NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, module_key)
);

CREATE TABLE IF NOT EXISTS achievements (
    key text PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_key text NOT NULL REFERENCES achievements(key) ON DELETE CASCADE,
    unlocked_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, achievement_key)
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bevorzugtes_lehrjahr smallint CHECK (bevorzugtes_lehrjahr BETWEEN 1 AND 3),
    errungenschaften_hinweise boolean NOT NULL DEFAULT true,
    updated_at timestamptz NOT NULL DEFAULT now()
);

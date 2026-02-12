ALTER TABLE users
ADD COLUMN IF NOT EXISTS deletion_scheduled_at timestamptz;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS deletion_due_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_deletion_due_at ON users(deletion_due_at);

DELETE FROM users
WHERE role <> 'admin'
  AND deletion_due_at IS NOT NULL
  AND deletion_due_at <= now();

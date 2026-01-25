import { createServer } from './server';
import { config } from './config';
import { logger } from './logger';
import { pool } from './db/pool';

const app = createServer();

const runStartupMigrations = async () => {
  try {
    // Ensure registration_keys has full_name column
    await pool.query('ALTER TABLE registration_keys ADD COLUMN IF NOT EXISTS full_name text');
    // Fill missing names with placeholder, then enforce NOT NULL
    await pool.query("UPDATE registration_keys SET full_name = COALESCE(full_name, 'Unbenannt')");
    await pool.query('ALTER TABLE registration_keys ALTER COLUMN full_name SET NOT NULL');

    // Allow users without password for key-based onboarding
    await pool.query('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL');

    // Delete known demo keys and normalise any legacy multi-use keys
    await pool.query("DELETE FROM registration_keys WHERE key IN ('J1-DEMO-001', 'J2-DEMO-002', 'J3-DEMO-003')");
    await pool.query('UPDATE registration_keys SET max_uses = 1 WHERE max_uses > 1');
  } catch (err) {
    logger.warn({ err }, 'Startup migrations/cleanup failed');
  }
};

runStartupMigrations().finally(() => {
  app.listen(config.port, () => {
    logger.info({ port: config.port, env: config.nodeEnv }, 'API listening');
  });
});

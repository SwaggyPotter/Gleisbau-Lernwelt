import { createServer } from './server';
import { config } from './config';
import { logger } from './logger';
import { pool } from './db/pool';

const app = createServer();

const cleanupDemoKeys = async () => {
  try {
    // Delete known demo keys and normalise any legacy multi-use keys
    await pool.query("DELETE FROM registration_keys WHERE key IN ('J1-DEMO-001', 'J2-DEMO-002', 'J3-DEMO-003')");
    await pool.query('UPDATE registration_keys SET max_uses = 1 WHERE max_uses > 1');
  } catch (err) {
    logger.warn({ err }, 'Demo-key cleanup failed');
  }
};

cleanupDemoKeys().finally(() => {
  app.listen(config.port, () => {
    logger.info({ port: config.port, env: config.nodeEnv }, 'API listening');
  });
});

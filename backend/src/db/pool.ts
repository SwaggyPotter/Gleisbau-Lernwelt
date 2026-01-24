import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../logger';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected PostgreSQL client error');
});

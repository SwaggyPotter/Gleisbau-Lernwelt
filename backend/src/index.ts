import { createServer } from './server';
import { config } from './config';
import { logger } from './logger';

const app = createServer();

app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, 'API listening');
});

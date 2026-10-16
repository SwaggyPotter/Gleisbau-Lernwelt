import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { apiRouter } from './routes/api';
import { healthRouter } from './routes/health';
import { config } from './config';
import { logger } from './logger';
import { errorHandler } from './middleware/error-handler';

export const createServer = () => {
  const app = express();
  app.set('trust proxy', 1);

  const corsOrigins = config.corsOrigins.includes('*') ? true : config.corsOrigins;

  app.use(
    pinoHttp({
      logger,
      customAttributeKeys: { reqId: 'requestId' },
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  );
  app.use(compression());
  // /api/photos bringt einen eigenen JSON-Parser mit hoeherem Limit mit (Foto-Upload).
  const jsonParser = express.json({ limit: '1mb' });
  app.use((req, res, next) => (req.path.startsWith('/api/photos') ? next() : jsonParser(req, res, next)));
  app.use(express.urlencoded({ extended: false }));

  app.use(
    rateLimit({
      windowMs: config.rateLimitWindowMs,
      limit: config.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(healthRouter);
  app.use('/api', apiRouter);

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use(errorHandler);

  return app;
};

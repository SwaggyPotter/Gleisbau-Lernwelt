import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  port: z.coerce.number().int().positive().default(3000),
  databaseUrl: z.string().min(1, 'DATABASE_URL is required'),
  databaseSsl: z
    .preprocess(value => {
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    }, z.boolean())
    .default(false),
  corsOrigin: z.string().default('*'),
  rateLimitWindowMs: z.coerce.number().int().positive().default(60000),
  rateLimitMax: z.coerce.number().int().positive().default(120),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

const parsed = configSchema.safeParse({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: process.env.PORT,
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL,
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: process.env.RATE_LIMIT_MAX,
  logLevel: process.env.LOG_LEVEL ?? 'info',
});

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid backend configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const corsOrigins = parsed.data.corsOrigin === '*'
  ? ['*']
  : parsed.data.corsOrigin.split(',').map(origin => origin.trim()).filter(origin => origin.length > 0);

export const config = {
  ...parsed.data,
  corsOrigins,
};

export type AppConfig = typeof config;

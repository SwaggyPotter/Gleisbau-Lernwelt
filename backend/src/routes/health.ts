import { Router } from 'express';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';

export const healthRouter = Router();

healthRouter.get('/health', asyncHandler(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
}));

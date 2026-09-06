import { Router } from 'express';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/auth';

export const achievementsRouter = Router();

achievementsRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT key, title, description, icon FROM achievements ORDER BY key');
  res.json({ achievements: rows });
}));

achievementsRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT achievement_key, unlocked_at FROM user_achievements WHERE user_id = $1 ORDER BY unlocked_at DESC',
    [req.user!.id],
  );
  res.json({ freigeschaltet: rows.map(r => ({ key: r.achievement_key, freigeschaltetAm: r.unlocked_at })) });
}));

import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/auth';

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

const settingsSchema = z.object({
  bevorzugtesLehrjahr: z.number().int().min(1).max(3).nullable().optional(),
  errungenschaftenHinweise: z.boolean().optional(),
});

const DEFAULTS = { bevorzugtes_lehrjahr: null as number | null, errungenschaften_hinweise: true };

settingsRouter.get('/me', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT bevorzugtes_lehrjahr, errungenschaften_hinweise FROM user_settings WHERE user_id = $1',
    [req.user!.id],
  );
  const row = rows[0] ?? DEFAULTS;
  res.json({
    settings: {
      bevorzugtesLehrjahr: row.bevorzugtes_lehrjahr,
      errungenschaftenHinweise: row.errungenschaften_hinweise,
    },
  });
}));

settingsRouter.put('/me', asyncHandler(async (req, res) => {
  const body = settingsSchema.parse(req.body);
  const userId = req.user!.id;

  const { rows: existingRows } = await pool.query(
    'SELECT bevorzugtes_lehrjahr, errungenschaften_hinweise FROM user_settings WHERE user_id = $1',
    [userId],
  );
  const existing = existingRows[0] ?? DEFAULTS;

  const merged = {
    bevorzugtes_lehrjahr: body.bevorzugtesLehrjahr !== undefined ? body.bevorzugtesLehrjahr : existing.bevorzugtes_lehrjahr,
    errungenschaften_hinweise: body.errungenschaftenHinweise !== undefined ? body.errungenschaftenHinweise : existing.errungenschaften_hinweise,
  };

  await pool.query(
    `INSERT INTO user_settings (user_id, bevorzugtes_lehrjahr, errungenschaften_hinweise, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (user_id)
     DO UPDATE SET bevorzugtes_lehrjahr = $2, errungenschaften_hinweise = $3, updated_at = now()`,
    [userId, merged.bevorzugtes_lehrjahr, merged.errungenschaften_hinweise],
  );

  res.json({
    settings: {
      bevorzugtesLehrjahr: merged.bevorzugtes_lehrjahr,
      errungenschaftenHinweise: merged.errungenschaften_hinweise,
    },
  });
}));

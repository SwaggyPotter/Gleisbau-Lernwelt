import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth, requireAdmin } from '../middleware/auth';

/**
 * Status und Sichtbarkeit der App-Kacheln auf der Startseite (2026-11-06).
 * status: 'geprueft' (grüner Haken) | 'ungeprueft' (rotes Kreuz)
 * sichtbarkeit: 'gaeste' (alle inkl. Gäste) | 'azubis' (alle mit Seiten-Login, keine Gäste) | 'versteckt' (nur Admin)
 * Lesen ist offen (Azubis mit reinem Seiten-Login haben kein Konto-Token), Ändern nur für Admins.
 * Fehlt eine Kachel in der Tabelle, gilt der Standard aus dem Frontend (shared/katalog.ts).
 */
export const appsRouter = Router();

appsRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT tile_id, status, sichtbarkeit FROM app_status');
  const apps: Record<string, { status: string; sichtbarkeit: string }> = {};
  for (const r of rows) apps[r.tile_id] = { status: r.status, sichtbarkeit: r.sichtbarkeit };
  res.set('Cache-Control', 'no-store').json({ apps });
}));

const updateSchema = z.object({
  status: z.enum(['geprueft', 'ungeprueft']),
  sichtbarkeit: z.enum(['gaeste', 'azubis', 'versteckt']),
});

appsRouter.put('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).parse(req.params.id);
  const { status, sichtbarkeit } = updateSchema.parse(req.body);
  await pool.query(
    `INSERT INTO app_status (tile_id, status, sichtbarkeit, updated_at, updated_by)
     VALUES ($1, $2, $3, now(), $4)
     ON CONFLICT (tile_id) DO UPDATE SET status = $2, sichtbarkeit = $3, updated_at = now(), updated_by = $4`,
    [id, status, sichtbarkeit, req.user!.id],
  );
  res.json({ id, status, sichtbarkeit });
}));

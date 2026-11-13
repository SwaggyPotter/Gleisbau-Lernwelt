import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth, requireAdmin } from '../middleware/auth';

/**
 * Glossar-Freigaben (Tim, 2026-11-07): Der Admin bestätigt einzelne Begriffe im
 * Fachbegriffe-Glossar („stimmt so“). Gespeichert wird eine Prüfsumme über Begriff,
 * Beschreibung und Quelle – ändert sich der Text später, gilt die Freigabe im Frontend
 * automatisch nicht mehr (Anzeige „geändert seit Prüfung“).
 *
 * Lesen ist offen (Azubis/Gäste haben kein Konto-Token), Ändern nur für Admins.
 */
export const glossarFreigabenRouter = Router();

const begriffId = z.string().regex(/^[a-z0-9-]{1,80}$/);
const freigabeSchema = z.object({ pruefsumme: z.string().regex(/^[a-f0-9]{8,64}$/) });

glossarFreigabenRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT f.begriff_id, f.pruefsumme, f.geprueft_am, u.full_name
       FROM glossar_freigaben f LEFT JOIN users u ON u.id = f.geprueft_von
      ORDER BY f.begriff_id`,
  );
  const freigaben: Record<string, { pruefsumme: string; geprueftAm: string; geprueftVon: string | null }> = {};
  for (const r of rows) freigaben[r.begriff_id] = { pruefsumme: r.pruefsumme, geprueftAm: r.geprueft_am, geprueftVon: r.full_name ?? null };
  res.set('Cache-Control', 'no-store').json({ freigaben });
}));

glossarFreigabenRouter.put('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = begriffId.parse(req.params.id);
  const { pruefsumme } = freigabeSchema.parse(req.body);
  await pool.query(
    `INSERT INTO glossar_freigaben (begriff_id, pruefsumme, geprueft_am, geprueft_von)
     VALUES ($1, $2, now(), $3)
     ON CONFLICT (begriff_id) DO UPDATE SET pruefsumme = $2, geprueft_am = now(), geprueft_von = $3`,
    [id, pruefsumme, req.user!.id],
  );
  res.json({ ok: true });
}));

glossarFreigabenRouter.delete('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = begriffId.parse(req.params.id);
  await pool.query('DELETE FROM glossar_freigaben WHERE begriff_id = $1', [id]);
  res.status(204).send();
}));

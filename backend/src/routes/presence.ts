import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';

/**
 * Online-Anzeige: Jeder offene Browser meldet sich anonym alle ~60 s mit einer zufaelligen
 * Client-ID (kommt aus dem localStorage, ist an keine Person und keine IP gebunden).
 * "Online" = in den letzten 5 Minuten gemeldet. Es werden weder Namen noch IP-Adressen gespeichert.
 */
export const presenceRouter = Router();

const WINDOW_MINUTES = 5;
const pingSchema = z.object({ clientId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/) });

const zaehle = async (): Promise<number> => {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM presence WHERE last_seen > now() - ($1 || ' minutes')::interval`,
    [String(WINDOW_MINUTES)],
  );
  return rows[0].n;
};

presenceRouter.get('/', asyncHandler(async (_req, res) => {
  res.json({ online: await zaehle() });
}));

presenceRouter.post('/', asyncHandler(async (req, res) => {
  const { clientId } = pingSchema.parse(req.body);
  await pool.query(
    `INSERT INTO presence (client_id, last_seen) VALUES ($1, now())
     ON CONFLICT (client_id) DO UPDATE SET last_seen = now()`,
    [clientId],
  );
  // Alte Eintraege gelegentlich wegraeumen, damit die Tabelle klein bleibt.
  if (Math.random() < 0.05) {
    await pool.query("DELETE FROM presence WHERE last_seen < now() - interval '1 day'");
  }
  res.json({ online: await zaehle() });
}));

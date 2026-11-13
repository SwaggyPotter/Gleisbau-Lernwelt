import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { requireAdmin } from '../middleware/auth';
import { httpError } from '../middleware/error-handler';

/**
 * Postfach (Tim, 2026-11-10): persönliche Nachrichten an einzelne Konten (auch Gastkonten).
 * Jeder Angemeldete liest nur sein eigenes Postfach; schreiben darf nur der Admin
 * (an ein Konto oder an alle). Eine Nachricht kann einen App-Link haben, z. B. zum Schotterrechner.
 * In api.ts hinter requireAuth eingehängt.
 */
export const nachrichtenRouter = Router();

const neuSchema = z.object({
  an: z.union([z.literal('alle'), z.string().uuid()]),
  betreff: z.string().trim().min(1).max(120),
  text: z.string().trim().min(1).max(4000),
  // nur App-interne Pfade (kein externer Link), z. B. /zusatz/schotterbett?idee=mustafa
  link: z.string().trim().max(300).regex(/^\/[A-Za-z0-9\-_/?=&%.]*$/).optional().or(z.literal('')),
  linkText: z.string().trim().max(80).optional().or(z.literal('')),
});
const idSchema = z.coerce.number().int().positive();

const zuNachricht = (r: {
  id: number; betreff: string; text: string; link: string | null; link_text: string | null;
  erstellt_am: string; gelesen_am: string | null; absender_name: string | null;
}) => ({
  id: r.id,
  betreff: r.betreff,
  text: r.text,
  link: r.link,
  linkText: r.link_text,
  erstelltAm: r.erstellt_am,
  gelesen: !!r.gelesen_am,
  absender: r.absender_name ?? 'Gleisbau Lernwelt',
});

/** Eigenes Postfach, neueste zuerst */
nachrichtenRouter.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT n.id, n.betreff, n.text, n.link, n.link_text, n.erstellt_am, n.gelesen_am, u.full_name AS absender_name
       FROM nachrichten n LEFT JOIN users u ON u.id = n.absender_id
      WHERE n.empfaenger_id = $1
      ORDER BY n.erstellt_am DESC, n.id DESC
      LIMIT 200`,
    [req.user!.id],
  );
  res.set('Cache-Control', 'no-store').json({ nachrichten: rows.map(zuNachricht) });
}));

/** Nur die Zahl ungelesener Nachrichten + neueste ungelesene (für Symbol und Hinweis) */
nachrichtenRouter.get('/ungelesen', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT n.id, n.betreff FROM nachrichten n
      WHERE n.empfaenger_id = $1 AND n.gelesen_am IS NULL
      ORDER BY n.erstellt_am DESC, n.id DESC`,
    [req.user!.id],
  );
  res.set('Cache-Control', 'no-store').json({ anzahl: rows.length, neueste: rows[0] ? { id: rows[0].id, betreff: rows[0].betreff } : null });
}));

nachrichtenRouter.post('/:id/gelesen', asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  await pool.query(
    'UPDATE nachrichten SET gelesen_am = COALESCE(gelesen_am, now()) WHERE id = $1 AND empfaenger_id = $2',
    [id, req.user!.id],
  );
  res.status(204).send();
}));

nachrichtenRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  await pool.query('DELETE FROM nachrichten WHERE id = $1 AND empfaenger_id = $2', [id, req.user!.id]);
  res.status(204).send();
}));

/* ---------- Admin: Empfänger auswählen und schreiben ---------- */

/** Konten, an die man schreiben kann (Name + ob Gast), ohne E-Mail-Adressen */
nachrichtenRouter.get('/empfaenger', requireAdmin, asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, full_name, role, email LIKE '%@gast.invalid' AS gast
       FROM users
      WHERE deletion_scheduled_at IS NULL
      ORDER BY full_name`,
  );
  res.json({ empfaenger: rows.map(r => ({ id: r.id, name: r.full_name, rolle: r.role, gast: r.gast })) });
}));

nachrichtenRouter.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const d = neuSchema.parse(req.body);
  const link = d.link || null, linkText = d.linkText || null;
  if (d.an === 'alle') {
    const r = await pool.query(
      `INSERT INTO nachrichten (empfaenger_id, absender_id, betreff, text, link, link_text)
       SELECT id, $1, $2, $3, $4, $5 FROM users WHERE deletion_scheduled_at IS NULL AND id <> $1`,
      [req.user!.id, d.betreff, d.text, link, linkText],
    );
    res.status(201).json({ gesendet: r.rowCount ?? 0 });
    return;
  }
  const ziel = await pool.query('SELECT 1 FROM users WHERE id = $1', [d.an]);
  if (!ziel.rowCount) throw httpError(404, 'Empfänger nicht gefunden');
  await pool.query(
    `INSERT INTO nachrichten (empfaenger_id, absender_id, betreff, text, link, link_text)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [d.an, req.user!.id, d.betreff, d.text, link, linkText],
  );
  res.status(201).json({ gesendet: 1 });
}));

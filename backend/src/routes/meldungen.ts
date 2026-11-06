import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';
import rateLimit from 'express-rate-limit';
import { optionalAuth, requireAuth, requireAdmin } from '../middleware/auth';

/**
 * Meldungen zu fehlerhaften Fragen (2026-11-05). Vorher nur im Browser gespeichert und damit
 * für Tim unsichtbar. Jetzt: alle melden ans Backend (mit Konto/Gast namentlich, mit reinem
 * Seiten-Login anonym, seit 2026-11-06), Admins lesen. Anonyme Meldungen sind pro IP begrenzt.
 */
export const meldungenRouter = Router();

const meldungSchema = z.object({
  questionId: z.string().max(200),
  topic: z.string().max(200),
  question: z.string().max(4000),
  reason: z.string().max(200).default('Nutzer-Meldung'),
  comment: z.string().max(2000).optional(),
  /** Vom Browser vergeben – gleiche Meldung wird beim Nachschicken nicht doppelt gespeichert */
  clientId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/).optional(),
  /** Wann gemeldet wurde (bei nachgeschickten Meldungen älter als jetzt) */
  gemeldetAm: z.string().datetime({ offset: true }).optional(),
});

const meldeLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Zu viele Meldungen, bitte später erneut probieren' } });

meldungenRouter.post('/', meldeLimit, optionalAuth, asyncHandler(async (req, res) => {
  const m = meldungSchema.parse(req.body);
  // Zeitpunkt aus dem Browser nur übernehmen, wenn plausibel (nicht in der Zukunft, max. 1 Jahr alt)
  let am = new Date();
  if (m.gemeldetAm) {
    const t = new Date(m.gemeldetAm);
    if (t.getTime() <= Date.now() && t.getTime() > Date.now() - 365 * 864e5) am = t;
  }
  const { rows } = await pool.query(
    `INSERT INTO question_reports (user_id, question_id, topic, question, reason, comment, anonym, client_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (client_id) WHERE client_id IS NOT NULL DO NOTHING RETURNING id`,
    [req.user?.id ?? null, m.questionId, m.topic, m.question, m.reason, m.comment ?? null, !req.user, m.clientId ?? null, am],
  );
  res.status(201).json({ id: rows[0]?.id ?? null, doppelt: !rows[0] });
}));

meldungenRouter.get('/', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT qr.id, qr.question_id, qr.topic, qr.question, qr.reason, qr.comment, qr.created_at, qr.erledigt, qr.anonym, qr.erledigt_am, qr.erledigt_notiz,
            u.full_name AS von, (u.gast_code IS NOT NULL) AS gast
       FROM question_reports qr LEFT JOIN users u ON u.id = qr.user_id
      ORDER BY qr.erledigt, qr.created_at DESC LIMIT 500`,
  );
  res.json({
    meldungen: rows.map(r => ({
      id: Number(r.id), questionId: r.question_id, topic: r.topic, question: r.question, reason: r.reason,
      comment: r.comment, am: r.created_at, erledigt: r.erledigt, erledigtAm: r.erledigt_am, notiz: r.erledigt_notiz, von: r.von ?? (r.anonym ? 'ohne Konto (Seiten-Login)' : 'gelöschtes Konto'), gast: r.gast,
    })),
  });
}));

meldungenRouter.patch('/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const { erledigt, notiz } = z.object({ erledigt: z.boolean(), notiz: z.string().trim().max(1000).optional() }).parse(req.body);
  const { rowCount } = await pool.query(
    `UPDATE question_reports SET erledigt = $2, erledigt_am = CASE WHEN $2 THEN now() ELSE NULL END,
            erledigt_notiz = CASE WHEN $2 THEN COALESCE($3, erledigt_notiz) ELSE erledigt_notiz END
      WHERE id = $1`,
    [id, erledigt, notiz ?? null],
  );
  if (!rowCount) throw httpError(404, 'Meldung nicht gefunden');
  res.status(204).send();
}));

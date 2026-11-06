import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';
import { requireAuth, requireAdmin } from '../middleware/auth';

/**
 * Quizfragen bearbeiten (Tim, 2026-11-06).
 * Die Originalfragen liegen als JSON im Frontend (assets/themenquiz/*.json). Was der Admin
 * auf der Seite „Fragen bearbeiten“ ändert, wird hier als vollständige Frage gespeichert
 * und vom Frontend beim Laden über das Original gelegt. „Original wiederherstellen“ löscht
 * die Zeile wieder.
 *
 * Lesen ist offen (Azubis mit reinem Seiten-Login und Gäste haben kein Konto-Token),
 * Ändern nur für Admins.
 *
 * Bilder: imageKey ist ein Schlüssel aus bildnachweise.json, „foto:F001“ (Tims Fotos in
 * assets/bilder-tim), „app:<key>“ oder „up:<id>“ (in der Bilder-Verwaltung hochgeladenes
 * Foto). Hochgeladene Fotos sind sonst nur für Admins abrufbar – über /quiz-aenderungen/bild/:id
 * gibt es sie nur, wenn sie wirklich in einer Frage verwendet werden.
 */
export const quizAenderungenRouter = Router();

const themaId = z.string().regex(/^[a-z0-9-]{1,40}$/);
const frageId = z.string().regex(/^[A-Za-z0-9_.-]{1,80}$/);

const frageSchema = z.object({
  question: z.string().trim().min(3).max(1000),
  choices: z.array(z.string().trim().min(1).max(400)).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().trim().max(2000).default(''),
  source: z.string().trim().max(300).optional(),
  sourceUrl: z.union([z.string().trim().url().max(500), z.literal('')]).optional(),
  difficulty: z.enum(['einfach', 'mittel', 'schwer', 'profi']).nullable().optional(),
  imageKey: z.string().trim().max(200).nullable().optional(),
}).refine(f => f.correctIndex < f.choices.length, { message: 'Richtige Antwort fehlt', path: ['correctIndex'] });

quizAenderungenRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT topic_id, question_id, daten, geaendert_am FROM quiz_aenderungen ORDER BY topic_id, question_id',
  );
  const aenderungen: Record<string, Record<string, unknown>> = {};
  for (const r of rows) {
    (aenderungen[r.topic_id] ??= {})[r.question_id] = { ...r.daten, geaendertAm: r.geaendert_am };
  }
  // In der Bilder-Verwaltung auf „Entfernen“ gesetzte Bilder verschwinden aus den Quizfragen.
  // image_reviews.image_id -> imageKey: „app:X“ -> „X“, „up:7“ bleibt, Fotos „F001“ -> „foto:F001“
  const { rows: weg } = await pool.query("SELECT image_id FROM image_reviews WHERE decision = 'remove'");
  const entfernteBilder = weg.map(r => {
    const id: string = r.image_id;
    if (id.startsWith('app:')) return id.slice(4);
    if (id.startsWith('up:')) return id;
    return 'foto:' + id;
  });
  res.set('Cache-Control', 'no-store').json({ aenderungen, entfernteBilder });
}));

/** Hochgeladenes Foto öffentlich ausliefern – aber nur, wenn es in einer Quizfrage steckt. */
quizAenderungenRouter.get('/bild/:id', asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const { rows } = await pool.query(
    `SELECT p.full_jpeg AS img FROM photos p
     WHERE p.id = $1 AND EXISTS (SELECT 1 FROM quiz_aenderungen q WHERE q.daten->>'imageKey' = 'up:' || $1::text)`,
    [id],
  );
  if (!rows[0]) throw httpError(404, 'Bild nicht gefunden');
  // app. und api. sind dieselbe Site -> Bild darf auf der App-Seite angezeigt werden (Helmet setzt sonst same-origin)
  res.type('image/jpeg').set({ 'Cache-Control': 'public, max-age=86400', 'Cross-Origin-Resource-Policy': 'same-site' }).send(rows[0].img);
}));

quizAenderungenRouter.put('/:thema/:frage', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const thema = themaId.parse(req.params.thema);
  const frage = frageId.parse(req.params.frage);
  const daten = frageSchema.parse(req.body);
  await pool.query(
    `INSERT INTO quiz_aenderungen (topic_id, question_id, daten, geaendert_am, geaendert_von)
     VALUES ($1, $2, $3, now(), $4)
     ON CONFLICT (topic_id, question_id) DO UPDATE SET daten = $3, geaendert_am = now(), geaendert_von = $4`,
    [thema, frage, JSON.stringify(daten), req.user!.id],
  );
  res.json({ ok: true, daten });
}));

quizAenderungenRouter.delete('/:thema/:frage', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const thema = themaId.parse(req.params.thema);
  const frage = frageId.parse(req.params.frage);
  await pool.query('DELETE FROM quiz_aenderungen WHERE topic_id = $1 AND question_id = $2', [thema, frage]);
  res.status(204).send();
}));

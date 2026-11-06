import { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { randomInt, randomUUID } from 'crypto';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { createSession, resolveSession } from '../sessions';

/**
 * Gastzugang (2026-11-05): Tim legt ein Gast-Passwort an (Standard 7 Tage, mehrere Personen).
 * Wer es auf der Login-Seite zusammen mit seinem Namen eingibt, bekommt ein eigenes
 * Kurzzeitkonto (users.expires_at = Ablauf des Passworts). Damit funktionieren Chat,
 * Statistik-Sync und Meldungen wie bei normalen Konten; nach Ablauf greift resolveSession nicht mehr.
 *
 * Statische Dateien (/assets) prüft Caddy per forward_auth gegen GET /api/gast/pruefen
 * (Cookie glw_gast = Sitzungstoken), aber nur, wenn das normale Seiten-Cookie fehlt.
 */
export const gastRouter = Router();

// Ohne 0/O/1/I/L, damit man das Passwort gut abtippen/diktieren kann
const ZEICHEN = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const neuerCode = () => 'GAST-' + Array.from({ length: 6 }, () => ZEICHEN[randomInt(ZEICHEN.length)]).join('');
const normalisiere = (c: string) => c.trim().toUpperCase().replace(/\s+/g, '');
/** „Dauerhaft“ (Tim, 2026-11-06): als festes Datum weit in der Zukunft, damit Sitzungen/Cookies normal funktionieren. */
const DAUERHAFT = '2099-12-31T23:59:59Z';
const istDauerhaft = (d: Date | string) => new Date(d).getUTCFullYear() >= 2099;

/* ---------- Anmelden mit Gast-Passwort (öffentlich, streng begrenzt) ---------- */
const anmeldeLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Zu viele Versuche, bitte in 15 Minuten erneut probieren' } });
const anmeldenSchema = z.object({
  code: z.string().min(4).max(40),
  name: z.string().trim().min(2, 'Bitte einen Namen angeben').max(40),
});

gastRouter.post('/anmelden', anmeldeLimit, asyncHandler(async (req, res) => {
  const { code, name } = anmeldenSchema.parse(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT code, expires_at, max_uses, uses FROM gast_codes WHERE code = $1 FOR UPDATE',
      [normalisiere(code)],
    );
    const gc = rows[0];
    if (!gc) throw httpError(401, 'Gast-Passwort unbekannt');
    if (new Date(gc.expires_at) <= new Date()) throw httpError(401, 'Dieses Gast-Passwort ist abgelaufen');
    if (gc.uses >= gc.max_uses) throw httpError(409, 'Dieses Gast-Passwort ist schon so oft benutzt wie erlaubt');

    const { rows: userRows } = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, year, key_used, expires_at, gast_code)
       VALUES ($1, $2, NULL, 'user', NULL, NULL, $3, $4)
       RETURNING id, full_name, email, role, year, expires_at`,
      [`${name} (Gast)`, `gast-${randomUUID()}@gast.invalid`, gc.expires_at, gc.code],
    );
    await client.query('UPDATE gast_codes SET uses = uses + 1 WHERE code = $1', [gc.code]);
    await client.query('COMMIT');

    const u = userRows[0];
    const bis = new Date(u.expires_at);
    const token = await createSession(u.id, bis);
    res.status(201).json({
      user: { id: u.id, fullName: u.full_name, email: u.email, role: u.role, year: u.year, gastBis: bis.toISOString() },
      token,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

/* ---------- Prüfung für Caddy (forward_auth) ----------
   Wird in server.ts VOR dem globalen Rate-Limit eingehängt, weil jeder Bild-/Datenabruf
   eines Gastes hier landet. Kurzer Zwischenspeicher, damit nicht jede Datei die DB fragt. */
const pruefCache = new Map<string, { ok: boolean; bis: number }>();
const CACHE_MS = 60_000;
const leseCookie = (header: string | undefined, name: string) => {
  if (!header) return null;
  for (const teil of header.split(';')) {
    const [k, ...v] = teil.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
};
export const gastPruefen: RequestHandler = asyncHandler(async (req, res) => {
  const token = leseCookie(req.headers.cookie, 'glw_gast');
  if (!token || !/^[0-9a-f]{64}$/.test(token)) { res.status(401).send('Bitte in der App anmelden.'); return; }
  const jetzt = Date.now();
  let eintrag = pruefCache.get(token);
  if (!eintrag || eintrag.bis < jetzt) {
    const user = await resolveSession(token);
    eintrag = { ok: !!user, bis: jetzt + CACHE_MS };
    pruefCache.set(token, eintrag);
    if (pruefCache.size > 5000) pruefCache.clear();
  }
  if (eintrag.ok) res.status(204).send();
  else res.status(401).send('Bitte in der App anmelden.');
});

/* ---------- Verwaltung (nur Admin) ---------- */
const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

const erstellenSchema = z.object({
  bezeichnung: z.string().trim().min(1).max(80),
  tage: z.number().int().min(1).max(60).default(7),
  dauerhaft: z.boolean().default(false),
  maxNutzer: z.number().int().min(1).max(500).default(30),
});
// Ändern: Laufzeit (tage ODER dauerhaft) und/oder erlaubte Personenzahl (maxNutzer, seit 2026-11-06)
const aendernSchema = z.object({
  tage: z.number().int().min(1).max(60).optional(),
  dauerhaft: z.literal(true).optional(),
  maxNutzer: z.number().int().min(1).max(500).optional(),
}).refine(b => b.tage !== undefined || b.dauerhaft || b.maxNutzer !== undefined, 'Nichts zu ändern');

adminRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows: codes } = await pool.query(
    'SELECT code, bezeichnung, created_at, expires_at, max_uses, uses FROM gast_codes ORDER BY created_at DESC',
  );
  const { rows: gaeste } = await pool.query(
    `SELECT u.id, u.full_name, u.created_at, u.expires_at, u.gast_code, u.gast_gesperrt,
            COALESCE(SUM(ms.correct), 0)::int AS richtig, COALESCE(SUM(ms.wrong), 0)::int AS falsch,
            MAX(ms.updated_at) AS zuletzt,
            (SELECT count(*)::int FROM question_reports qr WHERE qr.user_id = u.id) AS meldungen,
            (SELECT count(*)::int FROM chat_messages cm WHERE cm.author_id = u.id) AS chat
       FROM users u LEFT JOIN module_stats ms ON ms.user_id = u.id
      WHERE u.gast_code IS NOT NULL
      GROUP BY u.id ORDER BY u.created_at DESC`,
  );
  res.json({
    codes: codes.map(c => ({
      code: c.code, bezeichnung: c.bezeichnung, erstellt: c.created_at, bis: c.expires_at,
      maxNutzer: c.max_uses, genutzt: c.uses, aktiv: new Date(c.expires_at) > new Date(), dauerhaft: istDauerhaft(c.expires_at),
      gaeste: gaeste.filter(g => g.gast_code === c.code).map(g => ({
        id: g.id, name: g.full_name, seit: g.created_at, bis: g.expires_at,
        richtig: g.richtig, falsch: g.falsch, zuletzt: g.zuletzt, meldungen: g.meldungen, chat: g.chat,
        rausgeworfen: !!g.gast_gesperrt,
      })),
    })),
  });
}));

adminRouter.post('/', asyncHandler(async (req, res) => {
  const { bezeichnung, tage, dauerhaft, maxNutzer } = erstellenSchema.parse(req.body);
  for (let versuch = 0; versuch < 5; versuch++) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO gast_codes (code, bezeichnung, expires_at, max_uses, created_by)
         VALUES ($1, $2, CASE WHEN $6::boolean THEN $7::timestamptz ELSE now() + make_interval(days => $3) END, $4, $5)
         RETURNING code, expires_at`,
        [neuerCode(), bezeichnung, tage, maxNutzer, req.user!.id, dauerhaft, DAUERHAFT],
      );
      res.status(201).json({ code: rows[0].code, bis: rows[0].expires_at, dauerhaft: istDauerhaft(rows[0].expires_at) });
      return;
    } catch (err) {
      if ((err as { code?: string }).code !== '23505') throw err;   // Kollision: neuen Code würfeln
    }
  }
  throw httpError(500, 'Gast-Passwort konnte nicht erzeugt werden');
}));

// Ändern: Laufzeit verlängern (alle Gastkonten und Sitzungen ziehen mit) und/oder Personenzahl anpassen
adminRouter.patch('/:code', asyncHandler(async (req, res) => {
  const code = normalisiere(z.string().min(1).parse(req.params.code));
  const body = aendernSchema.parse(req.body);
  const { rows: vorhanden } = await pool.query('SELECT uses FROM gast_codes WHERE code = $1', [code]);
  if (!vorhanden.length) throw httpError(404, 'Gast-Passwort nicht gefunden');

  if (body.maxNutzer !== undefined) {
    if (body.maxNutzer < vorhanden[0].uses) {
      throw httpError(409, `Es sind schon ${vorhanden[0].uses} Personen angemeldet – kleiner geht nicht.`);
    }
    await pool.query('UPDATE gast_codes SET max_uses = $2 WHERE code = $1', [code, body.maxNutzer]);
  }

  if (body.dauerhaft || body.tage !== undefined) {
    const { rows } = body.dauerhaft
      ? await pool.query('UPDATE gast_codes SET expires_at = $2 WHERE code = $1 RETURNING expires_at', [code, DAUERHAFT])
      : await pool.query(
        'UPDATE gast_codes SET expires_at = now() + make_interval(days => $2) WHERE code = $1 RETURNING expires_at',
        [code, body.tage],
      );
    const bis = rows[0].expires_at;
    // rausgeworfene Gäste bleiben draußen
    await pool.query('UPDATE users SET expires_at = $2 WHERE gast_code = $1 AND NOT gast_gesperrt', [code, bis]);
    await pool.query('UPDATE sessions SET expires_at = $2 WHERE user_id IN (SELECT id FROM users WHERE gast_code = $1 AND NOT gast_gesperrt)', [code, bis]);
    pruefCache.clear();
  }

  const { rows } = await pool.query('SELECT expires_at, max_uses FROM gast_codes WHERE code = $1', [code]);
  res.json({ bis: rows[0].expires_at, dauerhaft: istDauerhaft(rows[0].expires_at), maxNutzer: rows[0].max_uses });
}));

// Beenden: Zugang sofort sperren. Konten, Statistik, Chat und Meldungen bleiben zum Nachlesen erhalten.
adminRouter.delete('/:code', asyncHandler(async (req, res) => {
  const code = normalisiere(z.string().min(1).parse(req.params.code));
  const { rowCount } = await pool.query('UPDATE gast_codes SET expires_at = now() WHERE code = $1', [code]);
  if (!rowCount) throw httpError(404, 'Gast-Passwort nicht gefunden');
  await pool.query('UPDATE users SET expires_at = now() WHERE gast_code = $1 AND (expires_at IS NULL OR expires_at > now())', [code]);
  await pool.query('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE gast_code = $1)', [code]);
  pruefCache.clear();
  res.status(204).send();
}));

// Einzelnen Gast rauswerfen (Tim, 2026-11-06): sofort abgemeldet, Konto gesperrt, Platz wird frei.
// Statistik, Chat und Meldungen bleiben erhalten. Mit dem Gast-Passwort kann er sich neu anmelden,
// solange der Zugang läuft – dauerhaft aussperren geht über „Sofort beenden“ bzw. ein neues Passwort.
adminRouter.delete('/:code/gaeste/:id', asyncHandler(async (req, res) => {
  const code = normalisiere(z.string().min(1).parse(req.params.code));
  const id = z.string().uuid().parse(req.params.id);
  const { rowCount } = await pool.query(
    `UPDATE users SET gast_gesperrt = true, expires_at = now()
      WHERE id = $1 AND gast_code = $2 AND NOT gast_gesperrt`,
    [id, code],
  );
  if (!rowCount) throw httpError(404, 'Gast nicht gefunden oder schon rausgeworfen');
  await pool.query('DELETE FROM sessions WHERE user_id = $1', [id]);
  await pool.query('UPDATE gast_codes SET uses = GREATEST(uses - 1, 0) WHERE code = $1', [code]);
  pruefCache.clear();
  res.status(204).send();
}));

gastRouter.use('/codes', adminRouter);

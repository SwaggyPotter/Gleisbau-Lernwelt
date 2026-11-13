import express, { Router } from 'express';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { httpError } from '../middleware/error-handler';

/**
 * Quiz-Show für Vorträge (Tim, 2026-11-11): Ein Laptop zeigt die „Bühne“ über den Beamer,
 * Tim steuert vom Tablet aus („Fernbedienung“, nur Admin). Quizze und Bilder liegen in Postgres,
 * der Ablauf einer laufenden Show (Sitzung) nur im Speicher – sie lebt höchstens 24 h.
 *
 * Ablauf je Frage (schritt): 0 Frage-Nummer · 1 Frage + Bild · 2–5 Antworten A–D ·
 * 6 Spannung („Und die richtige Antwort ist …“) · 7 Auflösung (richtige Antwort grün).
 */
export const quizshowRouter = Router();

// ---------- Datenmodell ----------

const frageSchema = z.object({
  id: z.string().min(1).max(40),
  text: z.string().trim().max(500),
  bild: z.string().regex(/^[a-f0-9]{24}$/).nullable().optional(),
  antworten: z.array(z.string().trim().max(200)).length(4),
  richtig: z.number().int().min(0).max(3),
  final: z.boolean().default(false),
  notiz: z.string().max(1000).optional(),
});
type Frage = z.infer<typeof frageSchema>;

const quizSchema = z.object({
  titel: z.string().trim().min(1).max(120),
  fragen: z.array(frageSchema).max(100),
});

export async function quizshowTabellen(): Promise<void> {
  await pool.query(`CREATE TABLE IF NOT EXISTS quizshow_quiz (
    id serial PRIMARY KEY,
    titel text NOT NULL,
    fragen jsonb NOT NULL DEFAULT '[]',
    geaendert timestamptz NOT NULL DEFAULT now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS quizshow_bild (
    id text PRIMARY KEY,
    jpeg bytea NOT NULL,
    erstellt timestamptz NOT NULL DEFAULT now()
  )`);
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM quizshow_quiz');
  if (rows[0].n === 0) {
    await pool.query('INSERT INTO quizshow_quiz (titel, fragen) VALUES ($1, $2)', ['Kleingeräte im Gleisbau', JSON.stringify(STARTFRAGEN)]);
  }
}

let fid = 0;
const f = (text: string, antworten: string[], richtig: number, final = false, notiz?: string): Frage =>
  ({ id: `start-${++fid}`, text, bild: null, antworten, richtig, final, notiz });

/** Erster Entwurf – Bilder lädt Tim selbst vom Tablet hoch. */
const STARTFRAGEN: Frage[] = [
  f('Wie heißt diese Maschine?', ['Schraubschlager', 'Schlagschrauber', 'Kleineisenverspanner', 'Universalschraubspanner'], 1, false, 'Bild: Schlagschrauber'),
  f('Wofür nimmt man den Schlagschrauber im Gleis typischerweise?', ['Schienen trennen', 'Löcher in Holzschwellen bohren', 'Laschenschrauben lösen und anziehen', 'Schotter verdichten'], 2),
  f('Wie heißt diese Maschine?', ['Schienenbohrmaschine', 'Schwellenfräse', 'Holzschwellenschleifer', 'Schwellenbohrmaschine'], 3, false, 'Bild: Schwellenbohrmaschine'),
  f('Wofür braucht man die Schwellenbohrmaschine?', ['Löcher für die Schwellenschrauben in die Schwelle bohren', 'Löcher in den Schienensteg bohren', 'Schwellen auf Länge kürzen', 'Schotter unter der Schwelle lockern'], 0),
  f('Wie heißt diese Maschine?', ['Schienensäge', 'Schienentrennschleifer', 'Trennschienenschleifer', 'Profilschleifer'], 1, false, 'Bild: Schienentrennschleifer'),
  f('Was gilt beim Arbeiten mit dem Schienentrennschleifer?', ['Schutzhaube abnehmen, dann sieht man besser', 'Eine Scheibe mit kleinem Riss noch aufbrauchen', 'Nur zugelassene, unbeschädigte Trennscheiben und Schutzhaube richtig einstellen', 'Schutzbrille ist unnötig, die Funken fliegen nach unten'], 2),
  f('Wie heißt diese Maschine?', ['Schienenbohrmaschine', 'Laschenfräse', 'Stegstanze', 'Schwellenbohrmaschine'], 0, false, 'Bild: Schienenbohrmaschine'),
  f('Wofür bohrt man Löcher in den Schienensteg?', ['Für die Schwellenschrauben', 'Für die Laschenverbindung', 'Damit Regenwasser abläuft', 'Für die Spurstange'], 1),
  f('Wie heißt diese Maschine?', ['Universalschraubspanner', 'Kleineisenverspanner', 'Universalschraubmaschine', 'Schwellenschraubendreher'], 2, false, 'Bild: Universalschraubmaschine'),
  f('Was macht die Universalschraubmaschine?', ['Sie trennt Schienen', 'Sie dreht die Schrauben der Schienenbefestigung ein und aus', 'Sie bohrt Löcher in den Schienensteg', 'Sie misst die Spurweite'], 1),
  // Zusatzfragen für Gleichstand (Finalrunde)
  f('Welche Maschine bohrt Löcher in den Schienensteg?', ['Schwellenbohrmaschine', 'Schlagschrauber', 'Schienenbohrmaschine', 'Universalschraubmaschine'], 2, true),
  f('Mit welcher Maschine schneidet man eine Schiene durch?', ['Schienentrennschleifer', 'Schienenbohrmaschine', 'Schlagschrauber', 'Schwellenbohrmaschine'], 0, true),
  f('Welche Schutzausrüstung gehört beim Trennschleifen auf jeden Fall dazu?', ['Nur Warnweste', 'Schutzbrille und Gehörschutz', 'Sonnenbrille', 'Keine, wenn man schnell ist'], 1, true),
  f('Wofür steht die Abkürzung PSA?', ['Persönliche Schutzausrüstung', 'Profil-Schienen-Abstand', 'Planmäßige Sicherheitsabnahme', 'Prüfstelle Schienenanlagen'], 0, true),
];

// ---------- Quizze (Admin) ----------

quizshowRouter.get('/quizze', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, titel, jsonb_array_length(fragen) AS anzahl, geaendert FROM quizshow_quiz ORDER BY geaendert DESC`);
  res.json({ quizze: rows });
}));

quizshowRouter.get('/quizze/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const { rows } = await pool.query('SELECT id, titel, fragen, geaendert FROM quizshow_quiz WHERE id = $1', [id]);
  if (!rows[0]) throw httpError(404, 'Quiz nicht gefunden');
  res.json({ quiz: rows[0] });
}));

quizshowRouter.post('/quizze', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const body = quizSchema.parse({ fragen: [], ...req.body });
  const { rows } = await pool.query('INSERT INTO quizshow_quiz (titel, fragen) VALUES ($1, $2) RETURNING id',
    [body.titel, JSON.stringify(body.fragen)]);
  res.status(201).json({ id: rows[0].id });
}));

quizshowRouter.put('/quizze/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const body = quizSchema.parse(req.body);
  const { rowCount } = await pool.query('UPDATE quizshow_quiz SET titel = $2, fragen = $3, geaendert = now() WHERE id = $1',
    [id, body.titel, JSON.stringify(body.fragen)]);
  if (!rowCount) throw httpError(404, 'Quiz nicht gefunden');
  res.json({ ok: true });
}));

quizshowRouter.delete('/quizze/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  await pool.query('DELETE FROM quizshow_quiz WHERE id = $1', [id]);
  res.status(204).send();
}));

// ---------- Bilder ----------

quizshowRouter.post('/bilder', express.json({ limit: '8mb' }), requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { data } = z.object({ data: z.string().min(100) }).parse(req.body);
  const buf = Buffer.from(data.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
  if (!(buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8)) throw httpError(400, 'Nur JPEG-Bilder erlaubt');
  const id = randomBytes(12).toString('hex');
  await pool.query('INSERT INTO quizshow_bild (id, jpeg) VALUES ($1, $2)', [id, buf]);
  res.status(201).json({ id });
}));

quizshowRouter.get('/bilder/:id', asyncHandler(async (req, res) => {
  const id = z.string().regex(/^[a-f0-9]{24}$/).parse(req.params.id);
  const { rows } = await pool.query('SELECT jpeg FROM quizshow_bild WHERE id = $1', [id]);
  if (!rows[0]) throw httpError(404, 'Bild nicht gefunden');
  res.type('image/jpeg').set('Cache-Control', 'public, max-age=31536000, immutable')
    .set('Cross-Origin-Resource-Policy', 'cross-origin').send(rows[0].jpeg);
}));

// ---------- Sitzungen (Bühne ↔ Fernbedienung) ----------

type Phase = 'warten' | 'runde' | 'frage' | 'ende';
interface Sitzung {
  code: string;
  quizId: number | null;
  runde: 'haupt' | 'final';
  phase: Phase;
  index: number;
  schritt: number;
  ton: boolean;
  rev: number;
  zuletzt: number;
  /** Gruppen mit Punkten (Tim, 2026-11-12) – Punkte vergibt Tim am Tablet */
  gruppen: { name: string; punkte: number }[];
  punkteSichtbar: boolean;
  /** leise Hintergrund-Atmosphäre zwischen den Fragen */
  hintergrund: boolean;
  /** Countdown (5/10 s), Ende als Server-Zeit; die Bühne bekommt die Restzeit */
  timer: { id: number; ende: number } | null;
  /** zählt hoch bei „Gewinner anzeigen“ – die Bühne spielt die Siegerehrung dann (erneut) ab */
  siegerNr: number;
}

const standardGruppen = () => [1, 2, 3, 4].map(n => ({ name: `Gruppe ${n}`, punkte: 0 }));

const sitzungen = new Map<string, Sitzung>();
const LEBENSDAUER = 24 * 3600_000;

function aufraeumen(): void {
  const grenze = Date.now() - LEBENSDAUER;
  for (const [k, s] of sitzungen) if (s.zuletzt < grenze) sitzungen.delete(k);
}

function sitzung(code: string): Sitzung {
  const s = sitzungen.get(z.string().regex(/^\d{4}$/).parse(code));
  if (!s) throw httpError(404, 'Code unbekannt – auf der Bühne steht der aktuelle Code');
  s.zuletzt = Date.now();
  return s;
}

async function fragenListe(s: Sitzung): Promise<{ titel: string; alle: Frage[]; liste: Frage[] }> {
  if (!s.quizId) return { titel: '', alle: [], liste: [] };
  const { rows } = await pool.query('SELECT titel, fragen FROM quizshow_quiz WHERE id = $1', [s.quizId]);
  if (!rows[0]) return { titel: '', alle: [], liste: [] };
  const alle = rows[0].fragen as Frage[];
  return { titel: rows[0].titel, alle, liste: alle.filter(x => !!x.final === (s.runde === 'final')) };
}

/** Was die Bühne sehen darf: richtige Antwort erst bei der Auflösung. */
async function buehnenSicht(s: Sitzung) {
  const { titel, liste, alle } = await fragenListe(s);
  const fr = s.phase === 'frage' ? liste[s.index] : undefined;
  return {
    code: s.code, rev: s.rev, phase: s.phase, runde: s.runde, index: s.index, schritt: s.schritt, ton: s.ton,
    gruppen: s.gruppen, punkteSichtbar: s.punkteSichtbar, hintergrund: s.hintergrund, siegerNr: s.siegerNr,
    timer: s.timer && s.timer.ende > Date.now() ? { id: s.timer.id, restMs: s.timer.ende - Date.now() } : null,
    titel, anzahl: liste.length, finalAnzahl: alle.filter(x => x.final).length,
    frage: fr ? {
      text: fr.text, bild: fr.bild ?? null,
      antworten: fr.antworten.map((a, i) => (s.schritt >= 2 + i ? a : null)),
      richtig: s.schritt >= 7 ? fr.richtig : null,
    } : null,
  };
}

quizshowRouter.post('/sitzung', asyncHandler(async (_req, res) => {
  aufraeumen();
  if (sitzungen.size > 200) throw httpError(429, 'Zu viele offene Bühnen');
  let code = '';
  do code = String(1000 + Math.floor(Math.random() * 9000)); while (sitzungen.has(code));
  const s: Sitzung = { code, quizId: null, runde: 'haupt', phase: 'warten', index: 0, schritt: 0, ton: true, rev: 1, zuletzt: Date.now(), gruppen: standardGruppen(), punkteSichtbar: true, hintergrund: true, timer: null, siegerNr: 0 };
  // Gibt es genau ein Quiz, ist es gleich ausgewählt
  const { rows } = await pool.query('SELECT id FROM quizshow_quiz ORDER BY geaendert DESC LIMIT 1');
  if (rows[0]) s.quizId = rows[0].id;
  sitzungen.set(code, s);
  res.status(201).json(await buehnenSicht(s));
}));

/** Bühne fragt hier zweimal pro Sekunde (vom Rate-Limit ausgenommen, siehe server.ts). */
quizshowRouter.get('/sitzung/:code', asyncHandler(async (req, res) => {
  const s = sitzung(req.params.code);
  const rev = Number(req.query['rev']);
  if (rev && rev === s.rev) { res.json({ rev: s.rev, gleich: true }); return; }
  res.set('Cache-Control', 'no-store').json(await buehnenSicht(s));
}));

/** Fernbedienung: alles inkl. richtiger Antwort und Notiz. */
async function steuerSicht(s: Sitzung) {
  const { liste } = await fragenListe(s);
  return { ...(await buehnenSicht(s)), quizId: s.quizId, liste };
}

quizshowRouter.get('/sitzung/:code/steuerung', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store').json(await steuerSicht(sitzung(req.params.code)));
}));

const aktionSchema = z.object({
  aktion: z.enum(['weiter', 'zurueck', 'springen', 'runde', 'quiz', 'ton', 'neustart', 'gruppen', 'punkt', 'punkteAnzeige', 'punkteNull', 'hintergrund', 'timer', 'sieger']),
  sekunden: z.number().int().min(0).max(60).optional(),
  namen: z.array(z.string().trim().max(40)).min(1).max(8).optional(),
  gruppe: z.number().int().min(0).max(7).optional(),
  delta: z.number().int().min(-5).max(5).optional(),
  index: z.number().int().min(0).optional(),
  runde: z.enum(['haupt', 'final']).optional(),
  quizId: z.number().int().positive().optional(),
});

quizshowRouter.post('/sitzung/:code/aktion', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const s = sitzung(req.params.code);
  const a = aktionSchema.parse(req.body);
  const { liste } = await fragenListe(s);
  switch (a.aktion) {
    case 'weiter':
      if (s.phase === 'warten' || s.phase === 'runde') { if (liste.length) { s.phase = 'frage'; s.index = 0; s.schritt = 0; } }
      else if (s.phase === 'frage') {
        if (s.schritt < 7) s.schritt++;
        else if (s.index + 1 < liste.length) { s.index++; s.schritt = 0; }
        else s.phase = 'ende';
      }
      break;
    case 'zurueck':
      if (s.phase === 'ende') { s.phase = 'frage'; s.index = Math.max(0, liste.length - 1); s.schritt = 7; }
      else if (s.phase === 'frage') {
        if (s.schritt > 0) s.schritt--;
        else if (s.index > 0) { s.index--; s.schritt = 7; }
        else s.phase = s.runde === 'final' ? 'runde' : 'warten';
      }
      break;
    case 'springen':
      if (a.index !== undefined && a.index < liste.length) { s.phase = 'frage'; s.index = a.index; s.schritt = 0; }
      break;
    case 'runde':
      s.runde = a.runde ?? 'final';
      s.phase = s.runde === 'final' ? 'runde' : 'warten';
      s.index = 0; s.schritt = 0;
      break;
    case 'quiz':
      if (a.quizId) { s.quizId = a.quizId; s.runde = 'haupt'; s.phase = 'warten'; s.index = 0; s.schritt = 0; }
      break;
    case 'ton':
      s.ton = !s.ton;
      break;
    case 'gruppen':
      // Namen setzen; Anzahl folgt der Liste, vorhandene Punkte bleiben erhalten
      if (a.namen) s.gruppen = a.namen.map((n, i) => ({ name: n || `Gruppe ${i + 1}`, punkte: s.gruppen[i]?.punkte ?? 0 }));
      break;
    case 'punkt':
      if (a.gruppe !== undefined && s.gruppen[a.gruppe]) s.gruppen[a.gruppe].punkte = Math.max(0, s.gruppen[a.gruppe].punkte + (a.delta ?? 1));
      break;
    case 'punkteAnzeige':
      s.punkteSichtbar = !s.punkteSichtbar;
      break;
    case 'punkteNull':
      s.gruppen.forEach(g => (g.punkte = 0));
      break;
    case 'hintergrund':
      s.hintergrund = !s.hintergrund;
      break;
    case 'sieger':
      // Quiz abbrechen und direkt zur Siegerehrung
      s.phase = 'ende';
      s.siegerNr++;
      s.timer = null;
      break;
    case 'timer':
      // 0 Sekunden = Timer abbrechen
      s.timer = a.sekunden ? { id: (s.timer?.id ?? 0) + 1, ende: Date.now() + a.sekunden * 1000 } : null;
      break;
    case 'neustart':
      s.runde = 'haupt'; s.phase = 'warten'; s.index = 0; s.schritt = 0;
      break;
  }
  s.rev++;
  s.zuletzt = Date.now();
  res.json(await steuerSicht(s));
}));

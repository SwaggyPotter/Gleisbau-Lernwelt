import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';

/**
 * Gleisbau Tycoon -- Gemeinschaft (eingehaengt in tycoonRouter, nur angemeldet):
 *  - Wertungen: Wochenwertung (Spieler + Clans) und Saison (Quartal); Punkte = Zuwachs der Einnahmen im Zeitraum.
 *    Preise werden beim ersten Aufruf nach Ende des Zeitraums als Gutschrift verteilt.
 *  - Boerse: Aktien anderer Firmen; Kurs aus Einnahmen, Netz, Gebieten und Aktivitaet.
 *  - Ausschreibungen: alle Spieler mit Strecken im Bundesland bieten gegeneinander (dazu ausgedachte Firmen).
 *  - Trassen: eigene Zuege auf der Strecke eines anderen Spielers fahren lassen, der bekommt Miete je Minute.
 *  - Markt: Gebiete und Zuege an andere Spieler verkaufen.
 * Wie im restlichen Tycoon rechnet der Client das Spiel; Geldbetraege bucht er selbst (nicht manipulationssicher).
 */
export const gemeinschaftRouter = Router();

/** Alle Einnahmen bisher (Strecken, Gebiete, Bahnhoefe, Gueter, Vertraege) aus dem Spielstand. */
const einnahmenSql = (a: string) =>
  `((SELECT COALESCE(sum(COALESCE((l->>'inF')::float, 0) + COALESCE((l->>'inO')::float, 0)), 0)
       FROM jsonb_array_elements(COALESCE(${a}.state->'lines', '[]'::jsonb)) l)
    + COALESCE((${a}.state->>'bezirkSumme')::float, 0) + COALESCE((${a}.state->>'bfSumme')::float, 0)
    + COALESCE((${a}.state->>'gueterSumme')::float, 0) + COALESCE((${a}.state->>'vertragSumme')::float, 0))`;

/* ---------- Wertungen ---------- */
const PERIODEN_SQL = `SELECT to_char(now() AT TIME ZONE 'Europe/Berlin', 'IYYY-"W"IW') AS woche,
  to_char(now() AT TIME ZONE 'Europe/Berlin', 'YYYY-"Q"Q') AS saison,
  (date_trunc('week', now() AT TIME ZONE 'Europe/Berlin') + interval '7 days' - interval '1 second') AT TIME ZONE 'Europe/Berlin' AS woche_ende,
  (date_trunc('quarter', now() AT TIME ZONE 'Europe/Berlin') + interval '3 months' - interval '1 second') AT TIME ZONE 'Europe/Berlin' AS saison_ende`;
/** Preise: Woche Platz 1..3 (Spieler), Siegerclan (jedes Mitglied), Saison Platz 1..10. */
const WOCHE_PREIS = [{ pokale: 3, geld: 5000 }, { pokale: 2, geld: 3000 }, { pokale: 1, geld: 1500 }];
const CLAN_PREIS = [{ pokale: 2, xp: 50 }, { pokale: 1, xp: 25 }];
const SAISON_PREIS = [{ pokale: 10, geld: 25000 }, { pokale: 6, geld: 15000 }, { pokale: 4, geld: 10000 }];
const SAISON_REST = { pokale: 2, geld: 5000, bis: 10 };

let basisZuletzt = '';
/** Ausgangswerte fuer den aktuellen Zeitraum festhalten (neue Spieler steigen mit ihrem aktuellen Stand ein). */
const sichereBasis = async (woche: string, saison: string) => {
  const key = woche + saison + new Date().toISOString().slice(0, 15);
  if (key === basisZuletzt) return;
  basisZuletzt = key;
  for (const p of [woche, saison]) {
    await pool.query(`INSERT INTO tycoon_wertung_basis (periode, user_id, basis) SELECT $1, s.user_id, ${einnahmenSql('s')} FROM tycoon_saves s ON CONFLICT DO NOTHING`, [p]);
  }
};
/** Abgelaufene Zeitraeume auswerten (einmal): Endwert = Ausgangswert im aktuellen Zeitraum derselben Art, sonst der jetzige Stand. */
const vergebePreise = async (woche: string, saison: string) => {
  const alt = await pool.query(
    `SELECT DISTINCT periode FROM tycoon_wertung_basis WHERE periode NOT IN ($1, $2)
       AND periode NOT IN (SELECT periode FROM tycoon_wertung_vergeben)`, [woche, saison]);
  for (const { periode } of alt.rows) {
    const ins = await pool.query('INSERT INTO tycoon_wertung_vergeben (periode) VALUES ($1) ON CONFLICT DO NOTHING RETURNING periode', [periode]);
    if (!ins.rowCount) continue;
    const jetzt = periode.includes('W') ? woche : saison;
    const rang = await pool.query(
      `SELECT b.user_id, m.clan_id, COALESCE(n.basis, ${einnahmenSql('s')}) - b.basis AS punkte
         FROM tycoon_wertung_basis b JOIN tycoon_saves s ON s.user_id = b.user_id
         LEFT JOIN tycoon_wertung_basis n ON n.periode = $2 AND n.user_id = b.user_id
         LEFT JOIN tycoon_clan_mitglieder m ON m.user_id = b.user_id
        WHERE b.periode = $1 ORDER BY punkte DESC`, [periode, jetzt]);
    const spieler = rang.rows.filter((r) => Number(r.punkte) > 0);
    const gut = (user: string, betrag: number, xp: number, pokale: number, text: string) =>
      pool.query('INSERT INTO tycoon_gutschriften (user_id, betrag, xp, pokale, text) VALUES ($1, $2, $3, $4, $5)', [user, betrag, xp, pokale, text]);
    if (periode.includes('W')) {
      for (let i = 0; i < Math.min(3, spieler.length); i++) await gut(spieler[i].user_id, WOCHE_PREIS[i].geld, 0, WOCHE_PREIS[i].pokale, `Wochenwertung ${periode}: Platz ${i + 1}!`);
      const clans = new Map<string, number>();
      spieler.forEach((r) => { if (r.clan_id) clans.set(r.clan_id, (clans.get(r.clan_id) || 0) + Number(r.punkte)); });
      const top = [...clans].sort((a, b) => b[1] - a[1]).slice(0, 2);
      for (let i = 0; i < top.length; i++) {
        const mitglieder = await pool.query('SELECT user_id FROM tycoon_clan_mitglieder WHERE clan_id = $1', [top[i][0]]);
        for (const m of mitglieder.rows) await gut(m.user_id, 0, CLAN_PREIS[i].xp, CLAN_PREIS[i].pokale, `Clan-Wochenwertung ${periode}: euer Clan auf Platz ${i + 1}!`);
      }
    } else {
      for (let i = 0; i < Math.min(SAISON_REST.bis, spieler.length); i++) {
        const p = SAISON_PREIS[i] ?? SAISON_REST;
        await gut(spieler[i].user_id, p.geld, 50, p.pokale, `Saison ${periode} beendet: Platz ${i + 1}!`);
      }
    }
  }
};
/** Fuer /welt: Zeitraeume weiterschalten und Preise verteilen (guenstig, meist nichts zu tun). */
export const wertungTakt = async () => {
  const p = (await pool.query(PERIODEN_SQL)).rows[0];
  await sichereBasis(p.woche, p.saison);
  await vergebePreise(p.woche, p.saison);
};

gemeinschaftRouter.get('/wertung', asyncHandler(async (req, res) => {
  const ich = req.user!.id;
  const p = (await pool.query(PERIODEN_SQL)).rows[0];
  await sichereBasis(p.woche, p.saison);
  await vergebePreise(p.woche, p.saison);
  const liste = async (periode: string) => (await pool.query(
    `SELECT b.user_id, u.full_name, c.kuerzel, c.name AS clan, c.farbe, ${einnahmenSql('s')} - b.basis AS punkte
       FROM tycoon_wertung_basis b JOIN tycoon_saves s ON s.user_id = b.user_id JOIN users u ON u.id = b.user_id
       LEFT JOIN tycoon_clan_mitglieder m ON m.user_id = b.user_id LEFT JOIN tycoon_clans c ON c.id = m.clan_id
      WHERE b.periode = $1 ORDER BY punkte DESC`, [periode])).rows;
  const fmt = (rows: any[]) => rows.slice(0, 20).map((r, i) => ({ platz: i + 1, name: r.full_name, clan: r.kuerzel, punkte: Math.round(Number(r.punkte)), ich: r.user_id === ich }));
  const w = await liste(p.woche), s = await liste(p.saison);
  const clans = new Map<string, { name: string; kuerzel: string; farbe: string; punkte: number; mitglieder: number }>();
  w.forEach((r) => {
    if (!r.clan) return;
    const c = clans.get(r.clan) ?? { name: r.clan, kuerzel: r.kuerzel, farbe: r.farbe, punkte: 0, mitglieder: 0 };
    c.punkte += Math.max(0, Number(r.punkte)); c.mitglieder++; clans.set(r.clan, c);
  });
  const mein = (rows: any[]) => { const i = rows.findIndex((r) => r.user_id === ich); return i < 0 ? null : { platz: i + 1, punkte: Math.round(Number(rows[i].punkte)) }; };
  res.json({
    woche: { key: p.woche, ende: p.woche_ende, spieler: fmt(w), ich: mein(w), clans: [...clans.values()].sort((a, b) => b.punkte - a.punkte).slice(0, 10).map((c) => ({ ...c, punkte: Math.round(c.punkte) })) },
    saison: { key: p.saison, ende: p.saison_ende, spieler: fmt(s), ich: mein(s) },
    preise: { woche: WOCHE_PREIS, clan: CLAN_PREIS, saison: SAISON_PREIS, saisonRest: SAISON_REST },
  });
}));

/* ---------- Boerse ---------- */
/** Kurs je Firma: Grundwert + Einnahmen + Strecken + Gebiete, mal Aktivitaet (wer lange nicht spielt, verliert an Wert). */
const KURS_SQL = `round(((10 + ${einnahmenSql('s')} / 4000 + s.line_count * 1.5
    + (SELECT count(*) FROM tycoon_bezirke b WHERE b.owner = s.user_id))
    * CASE WHEN s.updated_at > now() - interval '1 day' THEN 1 WHEN s.updated_at > now() - interval '3 days' THEN 0.85
           WHEN s.updated_at > now() - interval '7 days' THEN 0.7 ELSE 0.5 END)::numeric, 2)`;
const MAX_STUECK = 500, GEBUEHR = 0.01;

gemeinschaftRouter.get('/boerse', asyncHandler(async (req, res) => {
  const ich = req.user!.id;
  const p = (await pool.query(PERIODEN_SQL)).rows[0];
  const { rows } = await pool.query(
    `SELECT s.user_id, u.full_name, c.kuerzel, ${KURS_SQL} AS kurs, s.updated_at > now() - interval '1 day' AS aktiv,
            ${einnahmenSql('s')} - COALESCE(w.basis, ${einnahmenSql('s')}) AS woche,
            COALESCE(a.stueck, 0) AS stueck, a.einstand
       FROM tycoon_saves s JOIN users u ON u.id = s.user_id
       LEFT JOIN tycoon_clan_mitglieder m ON m.user_id = s.user_id LEFT JOIN tycoon_clans c ON c.id = m.clan_id
       LEFT JOIN tycoon_wertung_basis w ON w.periode = $2 AND w.user_id = s.user_id
       LEFT JOIN tycoon_aktien a ON a.firma = s.user_id AND a.user_id = $1
      ORDER BY kurs DESC LIMIT 100`, [ich, p.woche]);
  res.json({
    gebuehr: GEBUEHR, maxStueck: MAX_STUECK,
    firmen: rows.map((r) => ({ userId: r.user_id, name: r.full_name, clan: r.kuerzel, kurs: Number(r.kurs), aktiv: r.aktiv, woche: Math.round(Number(r.woche)),
      stueck: r.stueck, einstand: r.einstand === null ? null : Number(r.einstand), ich: r.user_id === ich })),
  });
}));

/** Kaufen (stueck > 0) oder verkaufen (< 0). Antwort: Betrag fuer das Spielkonto (negativ = abbuchen). */
gemeinschaftRouter.post('/boerse/handel', asyncHandler(async (req, res) => {
  const { firma, stueck } = z.object({ firma: z.string().uuid(), stueck: z.number().int().min(-MAX_STUECK).max(MAX_STUECK).refine((n) => n !== 0) }).parse(req.body);
  const ich = req.user!.id;
  if (firma === ich) throw httpError(400, 'Eigene Aktien kannst du nicht handeln.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const k = await client.query(`SELECT ${KURS_SQL} AS kurs FROM tycoon_saves s WHERE s.user_id = $1`, [firma]);
    if (!k.rowCount) throw httpError(404, 'Firma nicht gefunden.');
    const kurs = Number(k.rows[0].kurs);
    const alt = await client.query('SELECT stueck, einstand FROM tycoon_aktien WHERE user_id = $1 AND firma = $2 FOR UPDATE', [ich, firma]);
    const hat = alt.rows[0]?.stueck ?? 0;
    let betrag: number;
    if (stueck > 0) {
      if (hat + stueck > MAX_STUECK) throw httpError(409, `Höchstens ${MAX_STUECK} Aktien je Firma.`);
      betrag = -Math.round(kurs * stueck * (1 + GEBUEHR));
      const einstand = (Number(alt.rows[0]?.einstand ?? 0) * hat + kurs * stueck) / (hat + stueck);
      await client.query(`INSERT INTO tycoon_aktien (user_id, firma, stueck, einstand) VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, firma) DO UPDATE SET stueck = $3, einstand = $4`, [ich, firma, hat + stueck, einstand]);
    } else {
      if (hat < -stueck) throw httpError(409, 'So viele Aktien hast du nicht.');
      betrag = Math.round(kurs * -stueck * (1 - GEBUEHR));
      if (hat + stueck === 0) await client.query('DELETE FROM tycoon_aktien WHERE user_id = $1 AND firma = $2', [ich, firma]);
      else await client.query('UPDATE tycoon_aktien SET stueck = $3 WHERE user_id = $1 AND firma = $2', [ich, firma, hat + stueck]);
    }
    await client.query('COMMIT');
    res.json({ betrag, kurs, stueck: hat + stueck });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

/* ---------- Ausschreibungen (Spieler gegen Spieler) ---------- */
/** Faktor je Puenktlichkeitsversprechen (wie tycoon-ausschreibung.ts im Frontend: 80 %, 90 %, 95 %). */
const VERSPRECHEN_F = [1, 0.92, 0.85];
const FRIST_MIN = 10, PAUSE_MIN = 3;

/** Abgelaufene Ausschreibungen entscheiden: niedrigster gewerteter Betrag gewinnt (Spieler: Gebot x Faktor, ausgedachte Firmen: Gebot). */
const entscheide = async () => {
  const { rows } = await pool.query(`SELECT id, gegner FROM tycoon_ausschreibungen WHERE NOT entschieden AND bis <= now() FOR UPDATE SKIP LOCKED LIMIT 20`);
  for (const a of rows) {
    const g = await pool.query('SELECT user_id, gebot, versprechen, wert FROM tycoon_gebote WHERE ausschreibung = $1 ORDER BY wert, zeit LIMIT 1', [a.id]);
    const npc = Math.min(...((a.gegner || []) as { gebot: number }[]).map((x) => x.gebot), Infinity);
    const b = g.rows[0];
    const sieger = b && Number(b.wert) < npc ? b : null;
    await pool.query('UPDATE tycoon_ausschreibungen SET entschieden = true, sieger = $2, sieger_gebot = $3, sieger_versprechen = $4 WHERE id = $1',
      [a.id, sieger?.user_id ?? null, sieger?.gebot ?? null, sieger?.versprechen ?? null]);
  }
};

gemeinschaftRouter.get('/ausschreibungen', asyncHandler(async (req, res) => {
  const ich = req.user!.id;
  const bls = String(req.query['bl'] || '').split(',').filter((b) => /^[A-Z0-9]{2,4}$/.test(b)).slice(0, 40);
  await entscheide();
  const offen = await pool.query(
    `SELECT a.id, a.bl, a.richt, a.bis, jsonb_array_length(a.gegner) AS gegner,
            (SELECT count(*)::int FROM tycoon_gebote g WHERE g.ausschreibung = a.id) AS bieter,
            m.gebot AS mein_gebot, m.versprechen AS mein_versprechen
       FROM tycoon_ausschreibungen a LEFT JOIN tycoon_gebote m ON m.ausschreibung = a.id AND m.user_id = $1
      WHERE NOT a.entschieden AND a.bl = ANY($2::text[]) ORDER BY a.bis`, [ich, bls]);
  const ergebnisse = await pool.query(
    `SELECT a.id, a.bl, a.sieger = $1 AS gewonnen, a.sieger_gebot, a.sieger_versprechen, a.abgeholt, u.full_name AS sieger_name
       FROM tycoon_ausschreibungen a JOIN tycoon_gebote g ON g.ausschreibung = a.id AND g.user_id = $1
       LEFT JOIN users u ON u.id = a.sieger
      WHERE a.entschieden AND a.bis > now() - interval '2 hours' AND (a.sieger IS DISTINCT FROM $1 OR NOT a.abgeholt)`, [ich]);
  res.json({
    offen: offen.rows.map((r) => ({ id: r.id, bl: r.bl, richt: r.richt, bis: r.bis, gegner: r.gegner, bieter: r.bieter, meinGebot: r.mein_gebot, meinVersprechen: r.mein_versprechen })),
    ergebnisse: ergebnisse.rows.map((r) => ({ id: r.id, bl: r.bl, gewonnen: r.gewonnen, gebot: r.sieger_gebot, versprechen: r.sieger_versprechen, sieger: r.sieger_name ?? null })),
  });
}));

/** Neue Ausschreibung in einem Bundesland (falls dort keine offen ist und die letzte nicht gerade erst endete). */
gemeinschaftRouter.post('/ausschreibungen', asyncHandler(async (req, res) => {
  const { bl, richt, gegner } = z.object({
    bl: z.string().regex(/^[A-Z0-9]{2,4}$/), richt: z.number().int().min(100).max(5000),
    gegner: z.array(z.object({ n: z.string().max(40), gebot: z.number().int().min(1).max(10000) })).max(4),
  }).parse(req.body);
  const zuletzt = await pool.query(`SELECT entschieden, bis > now() - make_interval(mins => ${PAUSE_MIN}) AS frisch FROM tycoon_ausschreibungen WHERE bl = $1 ORDER BY bis DESC LIMIT 1`, [bl]);
  const z0 = zuletzt.rows[0];
  if (z0 && (!z0.entschieden || z0.frisch)) return res.json({ neu: false });
  await pool.query(`INSERT INTO tycoon_ausschreibungen (bl, richt, gegner, bis) VALUES ($1, $2, $3, now() + make_interval(mins => ${FRIST_MIN}))`, [bl, richt, JSON.stringify(gegner)]);
  res.status(201).json({ neu: true });
}));

gemeinschaftRouter.post('/ausschreibungen/:id/gebot', asyncHandler(async (req, res) => {
  const id = z.string().uuid().parse(req.params['id']);
  const { gebot, versprechen } = z.object({ gebot: z.number().int().min(1).max(10000), versprechen: z.number().int().min(0).max(2) }).parse(req.body);
  const a = await pool.query('SELECT 1 FROM tycoon_ausschreibungen WHERE id = $1 AND NOT entschieden AND bis > now()', [id]);
  if (!a.rowCount) throw httpError(409, 'Die Frist ist abgelaufen.');
  await pool.query(`INSERT INTO tycoon_gebote (ausschreibung, user_id, gebot, versprechen, wert) VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (ausschreibung, user_id) DO UPDATE SET gebot = $3, versprechen = $4, wert = $5, zeit = now()`, [id, req.user!.id, gebot, versprechen, gebot * VERSPRECHEN_F[versprechen]]);
  res.json({ ok: true });
}));

/** Gewonnenen Vertrag abholen (einmal) -- der Client legt ihn in seinem Spielstand an. */
gemeinschaftRouter.post('/ausschreibungen/:id/abholen', asyncHandler(async (req, res) => {
  const id = z.string().uuid().parse(req.params['id']);
  const { rows } = await pool.query('UPDATE tycoon_ausschreibungen SET abgeholt = true WHERE id = $1 AND sieger = $2 AND NOT abgeholt RETURNING bl, sieger_gebot, sieger_versprechen', [id, req.user!.id]);
  if (!rows.length) throw httpError(409, 'Nichts abzuholen.');
  res.json({ bl: rows[0].bl, gebot: rows[0].sieger_gebot, versprechen: rows[0].sieger_versprechen });
}));

/* ---------- Trassen anderer Spieler mieten ---------- */
/** Strecken anderer Spieler an einer Stadt (nur Stadt-zu-Stadt, Bahnhoefe kennt der Server nicht als Ort). */
gemeinschaftRouter.get('/trassen', asyncHandler(async (req, res) => {
  const ich = req.user!.id;
  const stadt = z.coerce.number().int().min(0).max(99).parse(req.query['stadt']);
  const { rows } = await pool.query(
    `SELECT s.user_id, u.full_name, (l->>'a')::int AS a, (l->>'b')::int AS b, l->'p' AS p, COALESCE((l->>'cls')::int, 1) AS cls,
            COALESCE((l->>'ol')::boolean, false) AS ol, COALESCE((l->>'gleise')::int, 1) AS gleise
       FROM tycoon_saves s JOIN users u ON u.id = s.user_id, jsonb_array_elements(COALESCE(s.state->'lines', '[]'::jsonb)) l
      WHERE s.user_id <> $1 AND l->'gast' IS NULL AND ((l->>'a')::int = $2 OR (l->>'b')::int = $2) AND (l->>'a')::int < 1000 AND (l->>'b')::int < 1000
        AND s.updated_at > now() - interval '14 days'
      LIMIT 20`, [ich, stadt]);
  res.json({ strecken: rows.map((r) => ({ owner: r.user_id, ownerName: r.full_name, a: r.a, b: r.b, p: r.p, cls: r.cls, ol: r.ol, gleise: r.gleise })) });
}));

gemeinschaftRouter.post('/trassen', asyncHandler(async (req, res) => {
  const { owner, a, b, preisMin } = z.object({ owner: z.string().uuid(), a: z.number().int().min(0).max(99), b: z.number().int().min(0).max(99), preisMin: z.number().int().min(10).max(5000) }).parse(req.body);
  const ich = req.user!.id;
  if (owner === ich) throw httpError(400, 'Das ist deine eigene Strecke.');
  const hat = await pool.query(
    `SELECT 1 FROM tycoon_saves s, jsonb_array_elements(COALESCE(s.state->'lines', '[]'::jsonb)) l
      WHERE s.user_id = $1 AND (((l->>'a')::int = $2 AND (l->>'b')::int = $3) OR ((l->>'a')::int = $3 AND (l->>'b')::int = $2))`, [owner, a, b]);
  if (!hat.rowCount) throw httpError(404, 'Diese Strecke gibt es nicht mehr.');
  const dup = await pool.query('SELECT 1 FROM tycoon_trassen WHERE mieter = $1 AND owner = $2 AND aktiv AND ((a = $3 AND b = $4) OR (a = $4 AND b = $3))', [ich, owner, a, b]);
  if (dup.rowCount) throw httpError(409, 'Diese Trasse hast du schon gemietet.');
  const { rows } = await pool.query('INSERT INTO tycoon_trassen (mieter, owner, a, b, preis_min) VALUES ($1, $2, $3, $4, $5) RETURNING id', [ich, owner, a, b, preisMin]);
  res.status(201).json({ id: rows[0].id });
}));

gemeinschaftRouter.post('/trassen/:id/kuendigen', asyncHandler(async (req, res) => {
  const id = z.string().uuid().parse(req.params['id']);
  await pool.query('UPDATE tycoon_trassen SET aktiv = false, ende = now() WHERE id = $1 AND mieter = $2 AND aktiv', [id, req.user!.id]);
  res.json({ ok: true });
}));

/** Fuer /welt: Miete der vermieteten Trassen als Gutschrift (nur Zeit, in der der Mieter gespielt hat), Listen fuer den Client. */
export const trassenTakt = async (ich: string) => {
  const { rows } = await pool.query(
    `SELECT t.id, t.preis_min, t.abgerechnet, LEAST(COALESCE(t.ende, now()), s.updated_at + interval '2 minutes') AS bis, u.full_name AS mieter_name, t.a, t.b
       FROM tycoon_trassen t JOIN tycoon_saves s ON s.user_id = t.mieter JOIN users u ON u.id = t.mieter
      WHERE t.owner = $1 AND (t.aktiv OR t.ende > t.abgerechnet)`, [ich]);
  for (const r of rows) {
    const min = Math.floor((new Date(r.bis).getTime() - new Date(r.abgerechnet).getTime()) / 60000);
    if (min < 1) continue;
    await pool.query('UPDATE tycoon_trassen SET abgerechnet = abgerechnet + make_interval(mins => $2) WHERE id = $1', [r.id, min]);
    await pool.query('INSERT INTO tycoon_gutschriften (user_id, betrag, text) VALUES ($1, $2, $3)', [ich, min * r.preis_min, `Trassenmiete von ${r.mieter_name} (${min} Min.)`]);
  }
  const gemietet = await pool.query(
    `SELECT t.id, t.owner, u.full_name AS owner_name, t.a, t.b, t.preis_min FROM tycoon_trassen t JOIN users u ON u.id = t.owner WHERE t.mieter = $1 AND t.aktiv`, [ich]);
  const vermietet = await pool.query(
    `SELECT u.full_name AS mieter_name, t.a, t.b, t.preis_min FROM tycoon_trassen t JOIN users u ON u.id = t.mieter WHERE t.owner = $1 AND t.aktiv`, [ich]);
  return {
    gemietet: gemietet.rows.map((r) => ({ id: r.id, owner: r.owner, ownerName: r.owner_name, a: r.a, b: r.b, preisMin: r.preis_min })),
    vermietet: vermietet.rows.map((r) => ({ mieterName: r.mieter_name, a: r.a, b: r.b, preisMin: r.preis_min })),
  };
};

/* ---------- Markt: Gebiete und Zuege verkaufen ---------- */
const GEBIET_STADT = 100;
const zugSchema = z.object({ type: z.number().int().min(0).max(200), farbe: z.string().max(30).optional(), upg: z.array(z.string().max(30)).max(20).optional(), trips: z.number().optional() });

gemeinschaftRouter.get('/markt', asyncHandler(async (req, res) => {
  const ich = req.user!.id;
  const { rows } = await pool.query(
    `SELECT a.id, a.art, a.gebiet, a.zug, a.preis, a.verkaeufer = $1 AS meins, u.full_name AS verkaeufer_name, a.erstellt
       FROM tycoon_angebote a JOIN users u ON u.id = a.verkaeufer
      WHERE a.verkauft IS NULL AND NOT a.zurueck ORDER BY a.erstellt DESC LIMIT 100`, [ich]);
  res.json({ angebote: rows.map((r) => ({ id: r.id, art: r.art, gebiet: r.gebiet, zug: r.zug, preis: r.preis, meins: r.meins, verkaeufer: r.verkaeufer_name })) });
}));

gemeinschaftRouter.post('/markt', asyncHandler(async (req, res) => {
  const ich = req.user!.id;
  const b = z.object({ art: z.enum(['gebiet', 'zug']), gebiet: z.number().int().min(0).max(2_147_483_647).optional(), zug: zugSchema.optional(), preis: z.number().int().min(1).max(10_000_000) }).parse(req.body);
  if (b.art === 'gebiet') {
    if (b.gebiet === undefined) throw httpError(400, 'Gebiet fehlt.');
    const own = await pool.query('SELECT 1 FROM tycoon_bezirke WHERE stadt = $1 AND bezirk = $2 AND owner = $3', [GEBIET_STADT, b.gebiet, ich]);
    if (!own.rowCount) throw httpError(409, 'Das Gebiet gehört dir nicht.');
    const dup = await pool.query('SELECT 1 FROM tycoon_angebote WHERE art = $1 AND gebiet = $2 AND verkauft IS NULL AND NOT zurueck', ['gebiet', b.gebiet]);
    if (dup.rowCount) throw httpError(409, 'Das Gebiet steht schon zum Verkauf.');
  } else if (!b.zug) throw httpError(400, 'Zug fehlt.');
  const { rows } = await pool.query('INSERT INTO tycoon_angebote (verkaeufer, art, gebiet, zug, preis) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [ich, b.art, b.art === 'gebiet' ? b.gebiet : null, b.art === 'zug' ? JSON.stringify(b.zug) : null, b.preis]);
  res.status(201).json({ id: rows[0].id });
}));

/** Kaufen: Gebiet geht auf den Kaeufer ueber (2 Std. geschuetzt), der Verkaeufer bekommt den Preis als Gutschrift. */
gemeinschaftRouter.post('/markt/:id/kaufen', asyncHandler(async (req, res) => {
  const id = z.string().uuid().parse(req.params['id']);
  const ich = req.user!.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM tycoon_angebote WHERE id = $1 AND verkauft IS NULL AND NOT zurueck FOR UPDATE', [id]);
    const a = rows[0];
    if (!a) throw httpError(409, 'Das Angebot gibt es nicht mehr.');
    if (a.verkaeufer === ich) throw httpError(400, 'Das ist dein eigenes Angebot.');
    if (a.art === 'gebiet') {
      const r = await client.query(
        'UPDATE tycoon_bezirke SET owner = $3, seit = now(), geschuetzt_bis = now() + interval \'2 hours\' WHERE stadt = $1 AND bezirk = $2 AND owner = $4',
        [GEBIET_STADT, a.gebiet, ich, a.verkaeufer]);
      if (!r.rowCount) { await client.query('UPDATE tycoon_angebote SET zurueck = true WHERE id = $1', [id]); throw httpError(409, 'Das Gebiet gehört dem Verkäufer nicht mehr.'); }
    }
    await client.query('UPDATE tycoon_angebote SET kaeufer = $2, verkauft = now() WHERE id = $1', [id, ich]);
    const name = await client.query('SELECT full_name FROM users WHERE id = $1', [ich]);
    await client.query('INSERT INTO tycoon_gutschriften (user_id, betrag, text) VALUES ($1, $2, $3)',
      [a.verkaeufer, a.preis, `Markt: ${name.rows[0]?.full_name ?? 'Jemand'} hat dein${a.art === 'gebiet' ? ' Gebiet' : 'en Zug'} gekauft`]);
    await client.query('COMMIT');
    res.json({ art: a.art, preis: a.preis, gebiet: a.gebiet, zug: a.zug });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

/** Eigenes Angebot zurueckziehen; ein Zug kommt zurueck in den Spielstand des Verkaeufers. */
gemeinschaftRouter.post('/markt/:id/zurueck', asyncHandler(async (req, res) => {
  const id = z.string().uuid().parse(req.params['id']);
  const { rows } = await pool.query('UPDATE tycoon_angebote SET zurueck = true WHERE id = $1 AND verkaeufer = $2 AND verkauft IS NULL AND NOT zurueck RETURNING art, zug', [id, req.user!.id]);
  if (!rows.length) throw httpError(409, 'Das Angebot ist schon verkauft oder zurückgezogen.');
  res.json({ art: rows[0].art, zug: rows[0].zug });
}));

/* ---------- Gebote fuer fremde Gebiete ----------
 * Statt ein Gebiet wegzukaufen, bietet man dem Besitzer einen Betrag. Der Client bucht ihn beim Bieten ab (zurueckgehalten);
 * Annehmen: Gebiet geht an den Bieter, der Besitzer bekommt den Betrag als Gutschrift, andere offene Gebote auf das Gebiet
 * werden zurueckgegeben. Ablehnen/Zurueckziehen: der Bieter bekommt den Betrag als Gutschrift zurueck.
 */
const GEBOT_MAX = 10_000_000;

gemeinschaftRouter.get('/gebote', asyncHandler(async (req, res) => {
  const ich = req.user!.id;
  const { rows } = await pool.query(
    `SELECT g.id, g.gebiet, g.betrag, g.erstellt, g.bieter = $1 AS meins, ub.full_name AS bieter_name, uo.full_name AS besitzer_name
       FROM tycoon_gebietsgebote g JOIN users ub ON ub.id = g.bieter JOIN users uo ON uo.id = g.besitzer
      WHERE g.status = 'offen' AND (g.bieter = $1 OR g.besitzer = $1) ORDER BY g.erstellt DESC LIMIT 100`, [ich]);
  res.json({ gebote: rows.map((r) => ({ id: r.id, gebiet: r.gebiet, betrag: r.betrag, meins: r.meins, bieter: r.bieter_name, besitzer: r.besitzer_name, erstellt: r.erstellt })) });
}));

gemeinschaftRouter.post('/gebote', asyncHandler(async (req, res) => {
  const ich = req.user!.id;
  const { gebiet, betrag } = z.object({ gebiet: z.number().int().min(0).max(2_147_483_647), betrag: z.number().int().min(1).max(GEBOT_MAX) }).parse(req.body);
  const b = await pool.query(
    `SELECT b.owner, mo.clan_id AS clan_owner, mi.clan_id AS clan_ich FROM tycoon_bezirke b
       LEFT JOIN tycoon_clan_mitglieder mo ON mo.user_id = b.owner LEFT JOIN tycoon_clan_mitglieder mi ON mi.user_id = $3
      WHERE b.stadt = $1 AND b.bezirk = $2`, [GEBIET_STADT, gebiet, ich]);
  const x = b.rows[0];
  if (!x) throw httpError(409, 'Das Gebiet gehört niemandem – du kannst es direkt kaufen.');
  if (x.owner === ich) throw httpError(409, 'Das Gebiet gehört dir schon.');
  const dup = await pool.query("SELECT 1 FROM tycoon_gebietsgebote WHERE gebiet = $1 AND bieter = $2 AND status = 'offen'", [gebiet, ich]);
  if (dup.rowCount) throw httpError(409, 'Du hast für dieses Gebiet schon ein offenes Gebot – zieh es zurück, um neu zu bieten.');
  const { rows } = await pool.query('INSERT INTO tycoon_gebietsgebote (gebiet, bieter, besitzer, betrag) VALUES ($1, $2, $3, $4) RETURNING id', [gebiet, ich, x.owner, betrag]);
  res.status(201).json({ id: rows[0].id, betrag });
}));

/** Gebot beenden (Status setzen) und dem Bieter den Betrag zurueckgeben. */
const gebotZurueck = async (client: { query: typeof pool.query }, g: any, status: string, text: string) => {
  await client.query('UPDATE tycoon_gebietsgebote SET status = $2, erledigt = now() WHERE id = $1', [g.id, status]);
  await client.query('INSERT INTO tycoon_gutschriften (user_id, betrag, text) VALUES ($1, $2, $3)', [g.bieter, g.betrag, text]);
};

gemeinschaftRouter.post('/gebote/:id/:aktion', asyncHandler(async (req, res) => {
  const id = z.string().uuid().parse(req.params['id']);
  const aktion = z.enum(['annehmen', 'ablehnen', 'zurueck']).parse(req.params['aktion']);
  const ich = req.user!.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query("SELECT * FROM tycoon_gebietsgebote WHERE id = $1 AND status = 'offen' FOR UPDATE", [id]);
    const g = rows[0];
    if (!g) throw httpError(409, 'Das Gebot ist schon erledigt.');
    const namen = await client.query('SELECT id, full_name FROM users WHERE id = ANY($1::uuid[])', [[g.bieter, g.besitzer]]);
    const name = (u: string) => namen.rows.find((r) => r.id === u)?.full_name ?? 'Jemand';
    if (aktion === 'zurueck') {
      if (g.bieter !== ich) throw httpError(403, 'Das ist nicht dein Gebot.');
      await gebotZurueck(client, g, 'zurueck', 'Gebot zurückgezogen – Betrag zurück');
    } else {
      if (g.besitzer !== ich) throw httpError(403, 'Das Gebot gilt nicht dir.');
      if (aktion === 'ablehnen') await gebotZurueck(client, g, 'abgelehnt', `${name(g.besitzer)} hat dein Gebot abgelehnt – Betrag zurück`);
      else {
        const r = await client.query(
          'UPDATE tycoon_bezirke SET owner = $3, seit = now(), geschuetzt_bis = now() WHERE stadt = $1 AND bezirk = $2 AND owner = $4',
          [GEBIET_STADT, g.gebiet, g.bieter, ich]);
        if (!r.rowCount) {
          await gebotZurueck(client, g, 'abgelehnt', 'Gebot erledigt (Gebiet gehört inzwischen jemand anderem) – Betrag zurück');
          await client.query('COMMIT');
          throw httpError(409, 'Das Gebiet gehört dir nicht mehr.');
        }
        await client.query("UPDATE tycoon_gebietsgebote SET status = 'angenommen', erledigt = now() WHERE id = $1", [g.id]);
        await client.query('INSERT INTO tycoon_gutschriften (user_id, betrag, text) VALUES ($1, $2, $3)', [ich, g.betrag, `Gebiet an ${name(g.bieter)} verkauft (Gebot angenommen)`]);
        await client.query('INSERT INTO tycoon_gutschriften (user_id, betrag, text) VALUES ($1, 0, $2)', [g.bieter, `${name(ich)} hat dein Gebot angenommen – das Gebiet gehört jetzt dir`]);
        // Andere offene Gebote auf das Gebiet zurueckgeben, ein Markt-Angebot des alten Besitzers zurueckziehen.
        const andere = await client.query("SELECT * FROM tycoon_gebietsgebote WHERE gebiet = $1 AND status = 'offen' AND id <> $2 FOR UPDATE", [g.gebiet, g.id]);
        for (const o of andere.rows) await gebotZurueck(client, o, 'abgelehnt', 'Das Gebiet wurde an jemand anderen verkauft – Betrag zurück');
        await client.query("UPDATE tycoon_angebote SET zurueck = true WHERE art = 'gebiet' AND gebiet = $1 AND verkaeufer = $2 AND verkauft IS NULL AND NOT zurueck", [g.gebiet, ich]);
      }
    }
    await client.query('COMMIT');
    res.json({ ok: true, gebiet: g.gebiet, betrag: g.betrag });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}));

import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';

/**
 * Gleisbau Tycoon (nur angemeldete Nutzer, siehe api.ts: requireAuth).
 * Der Spielstand liegt als JSON pro Konto in der Datenbank. Wer seinen Spielstand "freigibt",
 * kann von anderen angesehen werden (Staedte + Strecken, nur lesen). Besucher werden pro Person
 * einmal gezaehlt. Rangliste = Guthaben. Hinweis: Der Client rechnet das Spiel, die Werte sind
 * daher nur grob plausibilisiert, nicht manipulationssicher.
 */
export const tycoonRouter = Router();

const stateSchema = z.object({
  money: z.number().finite().min(-1e9).max(1e12),
  time: z.number().finite().min(0),
  lines: z.array(z.object({ a: z.number().int().min(0).max(99), b: z.number().int().min(0).max(99) }).passthrough()).max(80),
  own: z.array(z.object({}).passthrough()).max(400),
}).passthrough();

tycoonRouter.get('/me', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT state, shared, (SELECT count(*)::int FROM tycoon_visits v WHERE v.owner_id = $1) AS visitors
       FROM tycoon_saves WHERE user_id = $1`,
    [req.user!.id],
  );
  const r = rows[0];
  res.json({ state: r?.state ?? null, shared: r?.shared ?? false, visitors: r?.visitors ?? 0 });
}));

tycoonRouter.put('/me', asyncHandler(async (req, res) => {
  const state = stateSchema.parse(req.body.state);
  await pool.query(
    `INSERT INTO tycoon_saves (user_id, state, money, line_count, train_count, updated_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (user_id) DO UPDATE SET state = $2, money = $3, line_count = $4, train_count = $5, updated_at = now()`,
    [req.user!.id, JSON.stringify(state), Math.round(state.money), state.lines.length, state.own.length],
  );
  res.json({ ok: true });
}));

tycoonRouter.delete('/me', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM tycoon_saves WHERE user_id = $1', [req.user!.id]);
  await pool.query('DELETE FROM tycoon_bezirke WHERE owner = $1', [req.user!.id]);
  await pool.query('DELETE FROM tycoon_visits WHERE owner_id = $1', [req.user!.id]);
  res.status(204).end();
}));

tycoonRouter.put('/share', asyncHandler(async (req, res) => {
  const { shared } = z.object({ shared: z.boolean() }).parse(req.body);
  const r = await pool.query('UPDATE tycoon_saves SET shared = $2 WHERE user_id = $1', [req.user!.id, shared]);
  if (!r.rowCount) throw httpError(409, 'Bitte zuerst eine Strecke bauen und speichern.');
  res.json({ shared });
}));

/** Summe aller bisherigen Einnahmen (Trassenentgelt + Miete) aus dem gespeicherten Spielstand -- Messwert fuer Duelle. */
const einnahmenSql = (alias: string) =>
  `(SELECT COALESCE(sum(COALESCE((l->>'inF')::float, 0) + COALESCE((l->>'inO')::float, 0)), 0)
      FROM jsonb_array_elements(COALESCE(${alias}.state->'lines', '[]'::jsonb)) l)`;

tycoonRouter.get('/leaderboard', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.user_id, u.full_name, s.money, s.line_count, s.train_count, s.shared,
            COALESCE((s.state->>'mode')::int, 0) AS mode,
            COALESCE((s.state->>'xp')::float, 0) AS xp,
            (SELECT COALESCE(max((l->>'cls')::int), 0) FROM jsonb_array_elements(COALESCE(s.state->'lines', '[]'::jsonb)) l) AS max_cls,
            (SELECT count(*)::int FROM tycoon_duelle d WHERE d.sieger = s.user_id) AS siege,
            (SELECT count(*)::int FROM tycoon_bezirke b WHERE b.owner = s.user_id) AS bezirke,
            c.kuerzel AS clan,
            (SELECT count(*)::int FROM tycoon_visits v WHERE v.owner_id = s.user_id) AS visitors
       FROM tycoon_saves s JOIN users u ON u.id = s.user_id
       LEFT JOIN tycoon_clan_mitglieder m ON m.user_id = s.user_id
       LEFT JOIN tycoon_clans c ON c.id = m.clan_id
      ORDER BY xp DESC, s.money DESC LIMIT 100`,
  );
  res.json({
    entries: rows.map((r, i) => ({
      rank: i + 1,
      userId: r.user_id,
      name: r.full_name,
      money: Number(r.money),
      lines: r.line_count,
      trains: r.train_count,
      visitors: r.visitors,
      mode: r.mode,
      shared: r.shared,
      xp: Number(r.xp),
      maxCls: r.max_cls,
      siege: r.siege,
      bezirke: r.bezirke,
      clan: r.clan,
      isMe: r.user_id === req.user!.id,
    })),
  });
}));

/* ---------- Duelle ---------- */
const BELOHNUNG = { sieg: { pokale: 3, xp: 100 }, remis: { pokale: 2, xp: 50 }, niederlage: { pokale: 1, xp: 20 } };

tycoonRouter.post('/duelle', asyncHandler(async (req, res) => {
  const { gegnerId, stunden } = z.object({ gegnerId: z.string().uuid(), stunden: z.union([z.literal(1), z.literal(24)]) }).parse(req.body);
  const ich = req.user!.id;
  if (gegnerId === ich) throw httpError(400, 'Du kannst dich nicht selbst herausfordern.');
  const spiel = await pool.query('SELECT user_id FROM tycoon_saves WHERE user_id = ANY($1::uuid[])', [[ich, gegnerId]]);
  if (spiel.rowCount !== 2) throw httpError(409, 'Beide brauchen einen gespeicherten Spielstand.');
  const offen = await pool.query(
    `SELECT count(*)::int AS n,
            count(*) FILTER (WHERE (herausforderer = $1 AND gegner = $2) OR (herausforderer = $2 AND gegner = $1))::int AS paar
       FROM tycoon_duelle WHERE status IN ('offen', 'laeuft') AND (herausforderer = $1 OR gegner = $1)`,
    [ich, gegnerId],
  );
  if (offen.rows[0].paar > 0) throw httpError(409, 'Mit diesem Spieler läuft schon ein Duell.');
  if (offen.rows[0].n >= 5) throw httpError(409, 'Höchstens 5 offene oder laufende Duelle gleichzeitig.');
  const { rows } = await pool.query(
    'INSERT INTO tycoon_duelle (herausforderer, gegner, stunden) VALUES ($1, $2, $3) RETURNING id',
    [ich, gegnerId, stunden],
  );
  res.status(201).json({ id: rows[0].id });
}));

tycoonRouter.get('/duelle', asyncHandler(async (req, res) => {
  const ich = req.user!.id;
  // Abgelaufene Duelle auswerten.
  const fertig = await pool.query(
    `SELECT d.id, d.herausforderer, d.gegner, d.basis_h, d.basis_g,
            ${einnahmenSql('sh')} AS jetzt_h, ${einnahmenSql('sg')} AS jetzt_g
       FROM tycoon_duelle d
       LEFT JOIN tycoon_saves sh ON sh.user_id = d.herausforderer
       LEFT JOIN tycoon_saves sg ON sg.user_id = d.gegner
      WHERE d.status = 'laeuft' AND d.ende_at <= now() AND (d.herausforderer = $1 OR d.gegner = $1)`,
    [ich],
  );
  for (const d of fertig.rows) {
    const zh = Number(d.jetzt_h) - Number(d.basis_h), zg = Number(d.jetzt_g) - Number(d.basis_g);
    const sieger = zh > zg ? d.herausforderer : zg > zh ? d.gegner : null;
    await pool.query(
      `UPDATE tycoon_duelle SET status = 'fertig', wert_h = $2, wert_g = $3, sieger = $4 WHERE id = $1 AND status = 'laeuft'`,
      [d.id, d.jetzt_h, d.jetzt_g, sieger],
    );
  }
  const { rows } = await pool.query(
    `SELECT d.*, uh.full_name AS name_h, ug.full_name AS name_g,
            ${einnahmenSql('sh')} AS jetzt_h, ${einnahmenSql('sg')} AS jetzt_g
       FROM tycoon_duelle d
       JOIN users uh ON uh.id = d.herausforderer
       JOIN users ug ON ug.id = d.gegner
       LEFT JOIN tycoon_saves sh ON sh.user_id = d.herausforderer
       LEFT JOIN tycoon_saves sg ON sg.user_id = d.gegner
      WHERE (d.herausforderer = $1 OR d.gegner = $1) AND d.status <> 'abgelehnt'
        AND (d.status <> 'fertig' OR d.ende_at > now() - interval '14 days')
      ORDER BY d.erstellt DESC LIMIT 50`,
    [ich],
  );
  res.json({
    duelle: rows.map((d) => {
      const binH = d.herausforderer === ich;
      const wertH = d.status === 'fertig' ? Number(d.wert_h) : Number(d.jetzt_h);
      const wertG = d.status === 'fertig' ? Number(d.wert_g) : Number(d.jetzt_g);
      const zuwachsH = d.basis_h === null ? 0 : wertH - Number(d.basis_h);
      const zuwachsG = d.basis_g === null ? 0 : wertG - Number(d.basis_g);
      return {
        id: d.id,
        rolle: binH ? 'herausforderer' : 'gegner',
        gegnerName: binH ? d.name_g : d.name_h,
        stunden: d.stunden,
        status: d.status,
        ende: d.ende_at,
        meinZuwachs: Math.round(binH ? zuwachsH : zuwachsG),
        gegnerZuwachs: Math.round(binH ? zuwachsG : zuwachsH),
        ergebnis: d.status !== 'fertig' ? null : d.sieger === null ? 'remis' : d.sieger === ich ? 'sieg' : 'niederlage',
        abgeholt: binH ? d.abgeholt_h : d.abgeholt_g,
      };
    }),
  });
}));

tycoonRouter.post('/duelle/:id/annehmen', asyncHandler(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const r = await pool.query(
    `UPDATE tycoon_duelle d SET status = 'laeuft', start_at = now(), ende_at = now() + make_interval(hours => d.stunden),
            basis_h = (SELECT ${einnahmenSql('s')} FROM tycoon_saves s WHERE s.user_id = d.herausforderer),
            basis_g = (SELECT ${einnahmenSql('s')} FROM tycoon_saves s WHERE s.user_id = d.gegner)
      WHERE d.id = $1 AND d.gegner = $2 AND d.status = 'offen'`,
    [id, req.user!.id],
  );
  if (!r.rowCount) throw httpError(404, 'Duell nicht gefunden oder schon angenommen.');
  res.json({ ok: true });
}));

/** Ablehnen (Gegner) oder Zurueckziehen (Herausforderer) eines noch offenen Duells. */
tycoonRouter.post('/duelle/:id/ablehnen', asyncHandler(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const r = await pool.query(
    `UPDATE tycoon_duelle SET status = 'abgelehnt' WHERE id = $1 AND status = 'offen' AND (gegner = $2 OR herausforderer = $2)`,
    [id, req.user!.id],
  );
  if (!r.rowCount) throw httpError(404, 'Duell nicht gefunden.');
  res.json({ ok: true });
}));

/** Belohnung eines beendeten Duells abholen (einmal pro Spieler). Der Client schreibt sie in seinen Spielstand. */
tycoonRouter.post('/duelle/:id/abholen', asyncHandler(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const ich = req.user!.id;
  const { rows } = await pool.query(
    `UPDATE tycoon_duelle SET
        abgeholt_h = CASE WHEN herausforderer = $2 THEN true ELSE abgeholt_h END,
        abgeholt_g = CASE WHEN gegner = $2 THEN true ELSE abgeholt_g END
      WHERE id = $1 AND status = 'fertig'
        AND ((herausforderer = $2 AND NOT abgeholt_h) OR (gegner = $2 AND NOT abgeholt_g))
      RETURNING sieger`,
    [id, ich],
  );
  if (!rows.length) throw httpError(409, 'Keine Belohnung (mehr) abzuholen.');
  const ergebnis = rows[0].sieger === null ? 'remis' : rows[0].sieger === ich ? 'sieg' : 'niederlage';
  res.json({ ergebnis, ...BELOHNUNG[ergebnis] });
}));

tycoonRouter.get('/view/:userId', asyncHandler(async (req, res) => {
  const ownerId = z.string().uuid().parse(req.params.userId);
  const { rows } = await pool.query(
    `SELECT s.state, s.shared, s.money, u.full_name,
            (SELECT count(*)::int FROM tycoon_visits v WHERE v.owner_id = s.user_id) AS visitors
       FROM tycoon_saves s JOIN users u ON u.id = s.user_id WHERE s.user_id = $1`,
    [ownerId],
  );
  const r = rows[0];
  if (!r || (!r.shared && ownerId !== req.user!.id)) throw httpError(403, 'Dieser Spielstand ist nicht freigegeben.');
  let visitors: number = r.visitors;
  if (ownerId !== req.user!.id) {
    const ins = await pool.query(
      `INSERT INTO tycoon_visits (owner_id, visitor_id) VALUES ($1, $2)
       ON CONFLICT (owner_id, visitor_id) DO UPDATE SET last_at = now() RETURNING (xmax = 0) AS fresh`,
      [ownerId, req.user!.id],
    );
    if (ins.rows[0]?.fresh) visitors += 1;
  }
  res.json({ name: r.full_name, money: Number(r.money), visitors, state: r.state });
}));

/* ---------- Gemeinsame Welt: Bezirke, Aktivitaet je Stadt, Gutschriften ---------- */

/** Ein Clan-Mitglied "arbeitet" in einer Stadt, wenn es dort einen Bezirk hat und in so vielen Tagen gespielt hat. */
const AKTIV_TAGE = 7;
/** Erfahrung fuer Clan-Mitglieder in den Endstaedten einer neuen Strecke. */
const CLAN_BAU_XP = 20;
/** Wie lange ein gerade gekaufter Bezirk vor Uebernahme geschuetzt ist. */
const SCHUTZ_STUNDEN = 2;
/** Uebernahme eines fremden Bezirks kostet so viel mal den Grundpreis; der bisherige Besitzer bekommt den Grundpreis erstattet. */
const UEBERNAHME_FAKTOR = 3;

tycoonRouter.get('/welt', asyncHandler(async (req, res) => {
  const ich = req.user!.id;
  // Andere Spieler je Stadt (Endpunkte ihrer Strecken), davon "aktiv" = in den letzten 15 Minuten gespeichert.
  const staedte = await pool.query(
    `SELECT stadt, count(DISTINCT user_id)::int AS spieler,
            count(DISTINCT user_id) FILTER (WHERE updated_at > now() - interval '15 minutes')::int AS aktiv
       FROM (SELECT s.user_id, s.updated_at, (l->>'a')::int AS stadt FROM tycoon_saves s, jsonb_array_elements(COALESCE(s.state->'lines', '[]'::jsonb)) l
             UNION ALL
             SELECT s.user_id, s.updated_at, (l->>'b')::int FROM tycoon_saves s, jsonb_array_elements(COALESCE(s.state->'lines', '[]'::jsonb)) l) x
      WHERE user_id <> $1
      GROUP BY stadt`,
    [ich],
  );
  const bezirke = await pool.query(
    `SELECT b.stadt, b.bezirk, b.owner, b.basis, b.geschuetzt_bis, u.full_name, m.clan_id, c.kuerzel, c.farbe,
            COALESCE(s.updated_at > now() - make_interval(days => ${AKTIV_TAGE}), false) AS aktiv
       FROM tycoon_bezirke b JOIN users u ON u.id = b.owner
       LEFT JOIN tycoon_saves s ON s.user_id = b.owner
       LEFT JOIN tycoon_clan_mitglieder m ON m.user_id = b.owner
       LEFT JOIN tycoon_clans c ON c.id = m.clan_id`,
  );
  const meinClan = await pool.query('SELECT clan_id FROM tycoon_clan_mitglieder WHERE user_id = $1', [ich]);
  // Strecken der anderen Clan-Mitglieder (fuer Bau-Regel und Clan-Bonus im Client).
  const clanStrecken = await pool.query(
    `SELECT DISTINCT (l->>'a')::int AS a, (l->>'b')::int AS b
       FROM tycoon_clan_mitglieder m
       JOIN tycoon_clan_mitglieder ich ON ich.clan_id = m.clan_id AND ich.user_id = $1
       JOIN tycoon_saves s ON s.user_id = m.user_id, jsonb_array_elements(COALESCE(s.state->'lines', '[]'::jsonb)) l
      WHERE m.user_id <> $1`,
    [ich],
  );
  const gut = await pool.query('SELECT count(*)::int AS n FROM tycoon_gutschriften WHERE user_id = $1 AND NOT abgeholt', [ich]);
  res.json({
    ich: { id: ich, clanId: meinClan.rows[0]?.clan_id ?? null },
    staedte: staedte.rows.map((r) => ({ stadt: r.stadt, spieler: r.spieler, aktiv: r.aktiv })),
    bezirke: bezirke.rows.map((r) => ({
      stadt: r.stadt, bezirk: r.bezirk, ownerId: r.owner, ownerName: r.full_name, basis: r.basis,
      geschuetztBis: r.geschuetzt_bis, clanId: r.clan_id, clanKuerzel: r.kuerzel, clanFarbe: r.farbe, aktiv: r.aktiv,
    })),
    clanStrecken: clanStrecken.rows.map((r) => [r.a, r.b]),
    gutschriftenOffen: gut.rows[0].n,
  });
}));

/** Wert von tycoon_bezirke.stadt fuer Gebiete (Landkreise/Bezirke, bezirk = Gebiets-ID); siehe tycoon-gebiete.ts im Frontend. */
const GEBIET_STADT = 100;

/** Gebiet kaufen (frei: Grundpreis) oder einem anderen Spieler abkaufen (3x Grundpreis, der bekommt den Grundpreis erstattet). */
tycoonRouter.post('/bezirke', asyncHandler(async (req, res) => {
  const { stadt, bezirk, basis } = z.object({
    stadt: z.literal(GEBIET_STADT), bezirk: z.number().int().min(0).max(2_000_000_000), basis: z.number().int().min(100).max(20000),
  }).parse(req.body);
  const ich = req.user!.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const alt = await client.query(
      `SELECT b.owner, b.basis, b.geschuetzt_bis > now() AS geschuetzt, mo.clan_id AS clan_owner, mi.clan_id AS clan_ich
         FROM tycoon_bezirke b
         LEFT JOIN tycoon_clan_mitglieder mo ON mo.user_id = b.owner
         LEFT JOIN tycoon_clan_mitglieder mi ON mi.user_id = $3
        WHERE b.stadt = $1 AND b.bezirk = $2 FOR UPDATE OF b`,
      [stadt, bezirk, ich],
    );
    let preis = basis;
    if (alt.rowCount) {
      const a = alt.rows[0];
      if (a.owner === ich) throw httpError(409, 'Der Bezirk gehört dir schon.');
      if (a.clan_owner && a.clan_owner === a.clan_ich) throw httpError(409, 'Der Bezirk gehört deinem Clan.');
      if (a.geschuetzt) throw httpError(409, 'Der Bezirk ist gerade erst gekauft worden und noch geschützt.');
      preis = a.basis * UEBERNAHME_FAKTOR;
      await client.query(
        `UPDATE tycoon_bezirke SET owner = $3, seit = now(), geschuetzt_bis = now() + make_interval(hours => $4) WHERE stadt = $1 AND bezirk = $2`,
        [stadt, bezirk, ich, SCHUTZ_STUNDEN],
      );
      const name = await client.query('SELECT full_name FROM users WHERE id = $1', [ich]);
      await client.query(
        'INSERT INTO tycoon_gutschriften (user_id, betrag, text) VALUES ($1, $2, $3)',
        [a.owner, a.basis, `${name.rows[0]?.full_name ?? 'Jemand'} hat einen deiner Bezirke übernommen – Entschädigung`],
      );
    } else {
      await client.query(
        `INSERT INTO tycoon_bezirke (stadt, bezirk, owner, basis, geschuetzt_bis) VALUES ($1, $2, $3, $4, now() + make_interval(hours => $5))`,
        [stadt, bezirk, ich, basis, SCHUTZ_STUNDEN],
      );
    }
    await client.query('COMMIT');
    res.json({ preis, uebernommen: !!alt.rowCount });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

/** Offene Gutschriften abholen (einmalig); der Client schreibt die Summe in seinen Spielstand. */
tycoonRouter.post('/gutschriften/abholen', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE tycoon_gutschriften SET abgeholt = true WHERE user_id = $1 AND NOT abgeholt RETURNING betrag, xp, text',
    [req.user!.id],
  );
  res.json({ summe: rows.reduce((a, r) => a + r.betrag, 0), xp: rows.reduce((a, r) => a + r.xp, 0), eintraege: rows });
}));

/**
 * Neue Strecke gebaut: Clan-Mitglieder (ausser dem Bauherrn), denen das Gebiet einer der beiden Endstaedte gehoert und
 * die aktiv sind, bekommen Erfahrung als Gutschrift. Antwort: wie viele Mitglieder profitieren.
 */
tycoonRouter.post('/verbindung', asyncHandler(async (req, res) => {
  const { nameA, nameB, gebiete } = z.object({
    a: z.number().int().min(0).max(99), b: z.number().int().min(0).max(99),
    nameA: z.string().max(40), nameB: z.string().max(40),
    gebiete: z.array(z.number().int().min(0).max(2_000_000_000)).max(2).default([]),
  }).parse(req.body);
  const ich = req.user!.id;
  const { rows } = await pool.query(
    `SELECT DISTINCT b.owner
       FROM tycoon_bezirke b
       JOIN tycoon_clan_mitglieder m ON m.user_id = b.owner
       JOIN tycoon_clan_mitglieder i ON i.clan_id = m.clan_id AND i.user_id = $1
       JOIN tycoon_saves s ON s.user_id = b.owner AND s.updated_at > now() - make_interval(days => ${AKTIV_TAGE})
      WHERE b.stadt = ${GEBIET_STADT} AND b.bezirk = ANY($2::int[]) AND b.owner <> $1`,
    [ich, gebiete],
  );
  if (rows.length) {
    const name = await pool.query('SELECT full_name FROM users WHERE id = $1', [ich]);
    const text = `${name.rows[0]?.full_name ?? 'Ein Clan-Mitglied'} hat ${nameA} ⇄ ${nameB} gebaut – Clan-Bonus`;
    for (const r of rows) {
      await pool.query('INSERT INTO tycoon_gutschriften (user_id, betrag, xp, text) VALUES ($1, 0, $2, $3)', [r.owner, CLAN_BAU_XP, text]);
    }
  }
  res.json({ mitglieder: rows.length, xp: CLAN_BAU_XP });
}));

/* ---------- Clans ---------- */
const CLAN_FARBEN = ['#e4572e', '#2e86ab', '#59a14f', '#b07aa1', '#f2a900', '#17bebb', '#d6336c', '#8c564b', '#4e79a7', '#6b3fa0'];

tycoonRouter.get('/clans', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.kuerzel, c.farbe,
            count(m.user_id)::int AS mitglieder,
            COALESCE(sum(COALESCE((s.state->>'xp')::float, 0)), 0) AS xp,
            (SELECT count(*)::int FROM tycoon_bezirke b JOIN tycoon_clan_mitglieder mm ON mm.user_id = b.owner WHERE mm.clan_id = c.id) AS bezirke,
            COALESCE(json_agg(u.full_name ORDER BY u.full_name) FILTER (WHERE u.id IS NOT NULL), '[]') AS namen
       FROM tycoon_clans c
       LEFT JOIN tycoon_clan_mitglieder m ON m.clan_id = c.id
       LEFT JOIN users u ON u.id = m.user_id
       LEFT JOIN tycoon_saves s ON s.user_id = m.user_id
      GROUP BY c.id ORDER BY bezirke DESC, xp DESC`,
  );
  const mein = await pool.query('SELECT clan_id FROM tycoon_clan_mitglieder WHERE user_id = $1', [req.user!.id]);
  res.json({
    meinClan: mein.rows[0]?.clan_id ?? null,
    farben: CLAN_FARBEN,
    clans: rows.map((r) => ({ id: r.id, name: r.name, kuerzel: r.kuerzel, farbe: r.farbe, mitglieder: r.mitglieder, xp: Math.round(Number(r.xp)), bezirke: r.bezirke, namen: r.namen })),
  });
}));

/** Austreten; ein leerer Clan wird aufgeloest. */
async function austreten(userId: string): Promise<void> {
  const r = await pool.query('DELETE FROM tycoon_clan_mitglieder WHERE user_id = $1 RETURNING clan_id', [userId]);
  if (r.rowCount) await pool.query('DELETE FROM tycoon_clans c WHERE c.id = $1 AND NOT EXISTS (SELECT 1 FROM tycoon_clan_mitglieder m WHERE m.clan_id = c.id)', [r.rows[0].clan_id]);
}

tycoonRouter.post('/clans', asyncHandler(async (req, res) => {
  const { name, kuerzel, farbe } = z.object({
    name: z.string().trim().min(3).max(30),
    kuerzel: z.string().trim().min(2).max(4).regex(/^[A-Za-z0-9ÄÖÜäöüß]+$/),
    farbe: z.enum(CLAN_FARBEN as [string, ...string[]]),
  }).parse(req.body);
  const dup = await pool.query('SELECT 1 FROM tycoon_clans WHERE lower(name) = lower($1) OR upper(kuerzel) = upper($2)', [name, kuerzel]);
  if (dup.rowCount) throw httpError(409, 'Name oder Kürzel ist schon vergeben.');
  await austreten(req.user!.id);
  const { rows } = await pool.query('INSERT INTO tycoon_clans (name, kuerzel, farbe) VALUES ($1, $2, $3) RETURNING id', [name, kuerzel.toUpperCase(), farbe]);
  await pool.query('INSERT INTO tycoon_clan_mitglieder (user_id, clan_id) VALUES ($1, $2)', [req.user!.id, rows[0].id]);
  res.status(201).json({ id: rows[0].id });
}));

tycoonRouter.post('/clans/:id/beitreten', asyncHandler(async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const da = await pool.query('SELECT 1 FROM tycoon_clans WHERE id = $1', [id]);
  if (!da.rowCount) throw httpError(404, 'Clan nicht gefunden.');
  await austreten(req.user!.id);
  await pool.query('INSERT INTO tycoon_clan_mitglieder (user_id, clan_id) VALUES ($1, $2)', [req.user!.id, id]);
  res.json({ ok: true });
}));

tycoonRouter.post('/clans/austreten', asyncHandler(async (req, res) => {
  await austreten(req.user!.id);
  res.json({ ok: true });
}));

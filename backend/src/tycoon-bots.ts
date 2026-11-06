import { pool } from './db/pool';
import { logger } from './logger';
import { BOT_GEBIETE } from './tycoon-bots-daten';

/**
 * Gleisbau Tycoon -- Bot-Gegner. Echte Spieler-Eintraege (users + tycoon_saves + tycoon_bezirke, markiert in
 * tycoon_bots), damit Besitz, Gebote, Durchfahrt, Rangliste und Wertung mit ihnen genauso funktionieren wie mit
 * Menschen. Anmelden koennen sie sich nicht (kein Passwort, kein Key). Alle BOT_TAKT_MS handelt jeder Bot einmal:
 * Gebote auf seine Gebiete beantworten, mit etwas Glueck ein freies Nachbargebiet kaufen und per Strecke anschliessen,
 * ab und zu einen Zug kaufen. Anzahl: Umgebungsvariable TYCOON_BOTS (Standard 6, 0 = alle Bots entfernen).
 */

/** Takt (Umgebungsvariable TYCOON_BOT_TAKT_MS zum Testen, sonst 3 Minuten). */
const BOT_TAKT_MS = Math.max(2000, Number(process.env['TYCOON_BOT_TAKT_MS'] ?? 0) || 3 * 60 * 1000);
/** So viele Gebiete kauft ein Bot hoechstens (er soll Gegner sein, nicht Europa zukaufen). */
const MAX_GEBIETE = 45;
const MAX_STRECKEN = 80;
const MAX_ZUEGE = 25;
/** Chance je Takt, ein Gebiet zu kaufen. */
const KAUF_CHANCE = 0.4;
/** Gebot fuer ein Bot-Gebiet wird angenommen ab diesem Vielfachen des Grundpreises. */
const GEBOT_FAKTOR = 2;
const GEBIET_STADT = 100;
/** Bahnhoefe ab 1000 (wie im Client, tycoon-engine.ts). */
const BF0 = 1000;

/** Ausgedachte Firmen (keine echten Marken) mit Heimatland. */
const BOTS: { name: string; land: string }[] = [
  { name: '🤖 Elbtal-Schiene', land: 'DE' },
  { name: '🤖 Nordlicht-Bahn', land: 'SE' },
  { name: '🤖 Sonnenland-Bahn', land: 'IT' },
  { name: '🤖 Rheintal-Gleis', land: 'FR' },
  { name: '🤖 Weichselbahn', land: 'PL' },
  { name: '🤖 Alpen-Express', land: 'AT' },
  { name: '🤖 Meseta-Ferro', land: 'ES' },
  { name: '🤖 Donau-Linie', land: 'DE' },
];
const FARBEN = ['#e4572e', '#2e86ab', '#59a14f', '#b07aa1', '#f28e2b', '#76b7b2', '#edc948', '#9c755f'];

interface BotGebiet { id: number; land: string; ew: number; basis: number; x: number; y: number; stadt: boolean; n: number[] }
let daten: Map<number, BotGebiet> | null = null;
const gebiete = (): Map<number, BotGebiet> => {
  if (daten) return daten;
  daten = new Map();
  for (const z of BOT_GEBIETE.split('|')) {
    const [id, land, ew, basis, x, y, stadt, n] = z.split(',');
    const g = { id: parseInt(id, 36), land, ew: +ew, basis: +basis, x: +x, y: +y, stadt: stadt === '1', n: n ? n.split(';').map((v) => parseInt(v, 36)) : [] };
    daten.set(g.id, g);
  }
  return daten;
};

interface BotState {
  money: number; time: number; xp: number; mode: number; tut: number; tutV: number; heim: number | null;
  vis: boolean[]; skill: number[]; bf: { id: number; g: number; x: number; y: number }[]; bfNext: number;
  lines: Record<string, unknown>[]; own: Record<string, unknown>[]; nextId: number; bot: true;
}
const neuerStand = (heim: number): BotState => ({
  money: 50000, time: 0, xp: 0, mode: 0, tut: 99, tutV: 3, heim, vis: [], skill: [0, 0, 0, 0], bf: [], bfNext: 1, lines: [], own: [], nextId: 1, bot: true,
});

/** Bahnhof im Gebiet anlegen (falls noch keiner) und seine Knoten-Nummer liefern. */
const bahnhof = (s: BotState, gid: number): number => {
  const vorhanden = s.bf.find((b) => b.g === gid);
  if (vorhanden) return BF0 + vorhanden.id;
  const g = gebiete().get(gid)!;
  const b = { id: s.bfNext++, g: gid, x: g.x, y: g.y };
  s.bf.push(b);
  return BF0 + b.id;
};
/** Strecke zwischen zwei Bot-Gebieten (gerade zwischen den Bahnhoefen, wie eine gezeichnete Strecke mit 2 Punkten). */
const strecke = (s: BotState, von: number, nach: number, farbe: string) => {
  if (s.lines.length >= MAX_STRECKEN) return;
  const a = bahnhof(s, von), b = bahnhof(s, nach), ga = gebiete().get(von)!, gb = gebiete().get(nach)!;
  s.lines.push({ a, b, p: [ga.x, ga.y, gb.x, gb.y], cond: 100, inF: 0, inO: 0, up: 0, rep: 0, fault: null, color: farbe, cls: 1, ol: false });
};

const speichere = async (userId: string, s: BotState) => {
  await pool.query(
    `INSERT INTO tycoon_saves (user_id, state, money, line_count, train_count, shared, updated_at) VALUES ($1, $2, $3, $4, $5, true, now())
     ON CONFLICT (user_id) DO UPDATE SET state = $2, money = $3, line_count = $4, train_count = $5, shared = true, updated_at = now()`,
    [userId, JSON.stringify(s), Math.round(s.money), s.lines.length, s.own.length],
  );
};

/** Besitz aller Gebiete (Kennung -> Besitzer). */
const besitz = async (): Promise<Map<number, string>> => {
  const { rows } = await pool.query('SELECT bezirk, owner FROM tycoon_bezirke WHERE stadt = $1', [GEBIET_STADT]);
  return new Map(rows.map((r) => [r.bezirk as number, r.owner as string]));
};

/** Gebiet kaufen, wenn es noch frei ist (gleichzeitige Kaeufe von Spielern gewinnen). */
const kaufe = async (userId: string, gid: number): Promise<boolean> => {
  const g = gebiete().get(gid)!;
  const r = await pool.query(
    'INSERT INTO tycoon_bezirke (stadt, bezirk, owner, basis, geschuetzt_bis) VALUES ($1, $2, $3, $4, now()) ON CONFLICT (stadt, bezirk) DO NOTHING',
    [GEBIET_STADT, gid, userId, Math.min(20000, Math.max(100, g.basis))],
  );
  return (r.rowCount ?? 0) > 0;
};

/**
 * Heimatgebiet fuer einen neuen Bot: im Wunschland das einwohnerstaerkste freie Gebiet, dessen Nachbarn (und deren
 * Nachbarn) noch niemandem gehoeren -- Bots starten nicht direkt neben anderen Spielern.
 */
const waehleHeim = (land: string, belegt: Map<number, string>): number | null => {
  const frei = (id: number) => !belegt.has(id);
  const ruhig = (g: BotGebiet) => frei(g.id) && g.n.every((n) => frei(n) && (gebiete().get(n)?.n ?? []).every(frei));
  const kand = [...gebiete().values()].filter((g) => g.land === land && ruhig(g)).sort((a, b) => b.ew - a.ew);
  return kand.length ? kand[Math.floor(Math.random() * Math.min(5, kand.length))].id : null;
};

/** Ein Takt fuer einen Bot: Gebote beantworten, wachsen, Geld und Erfahrung. */
const botTakt = async (userId: string, nr: number) => {
  const { rows } = await pool.query('SELECT state FROM tycoon_saves WHERE user_id = $1', [userId]);
  if (!rows[0]) return;
  const s = rows[0].state as BotState;
  const farbe = FARBEN[nr % FARBEN.length];
  await beantworteGebote(userId, s);
  const belegt = await besitz();
  const meine = [...belegt].filter(([, o]) => o === userId).map(([id]) => id);
  // Einnahmen: je Gebiet und Strecke (grob wie ein mittlerer Spieler), auf die Strecken verteilt (fuer Wertung/Boerse).
  const ein = meine.length * 25 + s.lines.length * 70 + s.own.length * 40;
  s.money += ein; s.time += BOT_TAKT_MS / 1000; s.xp += 5 + s.lines.length * 2;
  s.lines.forEach((l) => { l.inF = Number(l.inF || 0) + 40; l.inO = Number(l.inO || 0) + (s.own.length ? 25 : 0); });
  // Wachsen: freies Nachbargebiet mit vielen Einwohnern kaufen und vom angrenzenden eigenen Bahnhof aus anschliessen.
  if (meine.length < MAX_GEBIETE && Math.random() < KAUF_CHANCE) {
    const kand: { id: number; von: number; w: number }[] = [];
    for (const id of meine) for (const n of gebiete().get(id)?.n ?? []) if (!belegt.has(n) && gebiete().has(n)) kand.push({ id: n, von: id, w: gebiete().get(n)!.ew * (0.5 + Math.random()) });
    kand.sort((a, b) => b.w - a.w);
    const k = kand.find((x) => gebiete().get(x.id)!.basis <= s.money);
    if (k && await kaufe(userId, k.id)) {
      s.money -= gebiete().get(k.id)!.basis;
      strecke(s, k.von, k.id, farbe);
      s.xp += 20;
    }
  }
  if (s.own.length < Math.min(MAX_ZUEGE, s.lines.length) && s.money > 6000 && Math.random() < 0.25) {
    s.money -= 2500;
    s.own.push({ id: s.nextId++, line: Math.floor(Math.random() * s.lines.length), own: true, type: 1, dir: 1, s: 0, earned: 0, cost: 0, trips: 0 });
  }
  await speichere(userId, s);
};

/** Offene Gebote auf Bot-Gebiete: ab GEBOT_FAKTOR x Grundpreis annehmen, sonst ablehnen (Betrag zurueck an den Bieter). */
const beantworteGebote = async (userId: string, s: BotState) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT g.*, b.basis, u.full_name AS bieter_name FROM tycoon_gebietsgebote g
         JOIN tycoon_bezirke b ON b.stadt = $2 AND b.bezirk = g.gebiet AND b.owner = g.besitzer
         JOIN users u ON u.id = g.bieter
        WHERE g.besitzer = $1 AND g.status = 'offen' FOR UPDATE OF g`,
      [userId, GEBIET_STADT],
    );
    const name = (await client.query('SELECT full_name FROM users WHERE id = $1', [userId])).rows[0]?.full_name ?? 'Bot';
    for (const g of rows) {
      const zurueck = async (o: { id: string; bieter: string; betrag: number }, text: string) => {
        await client.query("UPDATE tycoon_gebietsgebote SET status = 'abgelehnt', erledigt = now() WHERE id = $1", [o.id]);
        await client.query('INSERT INTO tycoon_gutschriften (user_id, betrag, text) VALUES ($1, $2, $3)', [o.bieter, o.betrag, text]);
      };
      if (g.betrag < g.basis * GEBOT_FAKTOR || g.gebiet === s.heim) {
        await zurueck(g, `${name} hat dein Gebot abgelehnt${g.gebiet === s.heim ? ' (Heimatgebiet, unverkäuflich)' : ` – ab ${g.basis * GEBOT_FAKTOR} € wäre es dabei gewesen`}. Betrag zurück`);
        continue;
      }
      await client.query('UPDATE tycoon_bezirke SET owner = $3, seit = now(), geschuetzt_bis = now() WHERE stadt = $1 AND bezirk = $2', [GEBIET_STADT, g.gebiet, g.bieter]);
      await client.query("UPDATE tycoon_gebietsgebote SET status = 'angenommen', erledigt = now() WHERE id = $1", [g.id]);
      await client.query('INSERT INTO tycoon_gutschriften (user_id, betrag, text) VALUES ($1, 0, $2)', [g.bieter, `${name} hat dein Gebot angenommen – das Gebiet gehört jetzt dir`]);
      const andere = await client.query("SELECT * FROM tycoon_gebietsgebote WHERE gebiet = $1 AND status = 'offen' AND id <> $2 FOR UPDATE", [g.gebiet, g.id]);
      for (const o of andere.rows) await zurueck(o, 'Das Gebiet wurde an jemand anderen verkauft – Betrag zurück');
      // Verkauft: Geld zum Bot, sein Bahnhof dort und die Strecken dorthin verschwinden.
      s.money += g.betrag;
      const bf = s.bf.find((b) => b.g === g.gebiet);
      if (bf) { s.lines = s.lines.filter((l) => l.a !== BF0 + bf.id && l.b !== BF0 + bf.id); s.bf = s.bf.filter((b) => b !== bf); }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
};

/** Bots anlegen bzw. entfernen, bis es TYCOON_BOTS gibt. Neue starten mit Heimatgebiet, zwei Nachbarn und Strecken. */
const sichereBots = async (anzahl: number) => {
  await pool.query(`CREATE TABLE IF NOT EXISTS tycoon_bots (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    nr integer NOT NULL UNIQUE,
    erstellt timestamptz NOT NULL DEFAULT now()
  )`);
  const { rows } = await pool.query('SELECT user_id, nr FROM tycoon_bots ORDER BY nr');
  // Zu viele: Bot-Nutzer loeschen (Gebiete, Spielstand, Gebote, Gutschriften haengen per ON DELETE CASCADE daran).
  for (const r of rows.filter((x) => x.nr > anzahl)) {
    // Offene Gebote auf seine Gebiete zurueckzahlen, bevor sie mit dem Nutzer verschwinden.
    await pool.query(`WITH g AS (UPDATE tycoon_gebietsgebote SET status = 'abgelehnt', erledigt = now() WHERE besitzer = $1 AND status = 'offen' RETURNING bieter, betrag)
      INSERT INTO tycoon_gutschriften (user_id, betrag, text) SELECT bieter, betrag, 'Bot entfernt – dein Gebot kommt zurück' FROM g`, [r.user_id]);
    await pool.query('DELETE FROM users WHERE id = $1', [r.user_id]);
    logger.info({ nr: r.nr }, 'Tycoon-Bot entfernt');
  }
  const da = new Set(rows.map((r) => r.nr));
  for (let nr = 1; nr <= Math.min(anzahl, BOTS.length); nr++) {
    if (da.has(nr)) continue;
    const b = BOTS[nr - 1], belegt = await besitz(), heim = waehleHeim(b.land, belegt);
    if (heim === null) continue;
    const u = await pool.query(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, NULL, 'user') ON CONFLICT (email) DO UPDATE SET full_name = $1 RETURNING id",
      [b.name, `tycoon-bot-${nr}@bots.gleisbau.invalid`],
    );
    const userId = u.rows[0].id as string;
    await pool.query('INSERT INTO tycoon_bots (user_id, nr) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING', [userId, nr]);
    const s = neuerStand(heim), farbe = FARBEN[nr % FARBEN.length];
    if (await kaufe(userId, heim)) {
      s.money -= gebiete().get(heim)!.basis;
      bahnhof(s, heim);
      // Startnetz: zwei Nachbarn mit den meisten Einwohnern.
      const nachbarn = (gebiete().get(heim)?.n ?? []).filter((n) => !belegt.has(n) && gebiete().has(n)).sort((x, y) => gebiete().get(y)!.ew - gebiete().get(x)!.ew).slice(0, 2);
      for (const n of nachbarn) if (await kaufe(userId, n)) { s.money -= gebiete().get(n)!.basis; strecke(s, heim, n, farbe); }
    }
    await speichere(userId, s);
    logger.info({ nr, name: b.name, heim }, 'Tycoon-Bot angelegt');
  }
};

/** Beim Start aufrufen: Bots anlegen/entfernen und den Takt starten. */
export const starteTycoonBots = async () => {
  const anzahl = Math.max(0, Math.min(BOTS.length, Number(process.env['TYCOON_BOTS'] ?? 6) || 0));
  try {
    await sichereBots(anzahl);
  } catch (err) {
    logger.warn({ err }, 'Tycoon-Bots konnten nicht angelegt werden');
    return;
  }
  if (!anzahl) return;
  setInterval(() => {
    (async () => {
      const { rows } = await pool.query('SELECT user_id, nr FROM tycoon_bots ORDER BY nr');
      for (const r of rows) await botTakt(r.user_id, r.nr);
    })().catch((err) => logger.warn({ err }, 'Tycoon-Bot-Takt fehlgeschlagen'));
  }, BOT_TAKT_MS).unref();
};

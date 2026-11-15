import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { kiFrage, kiLage, kiStatus, KI_MODELL } from '../guru-ki';
import { logger } from '../logger';

/**
 * Gleisbau-Guru (Tim, 2026-11-12/13): Admin-Chatbot, erst regelbasiert ohne KI (schwacher Server).
 *
 * Grenzen (Tims Vorgabe):
 *  - liest Website-Daten (Meldungen, Forum, Chat, Aktivität, Konten-Anzahl) – ändert daran NICHTS;
 *  - schreibt ausschließlich in seine eigenen Tabellen: guru_notizen (sein „Gehirn“ aus Markdown-Dokumenten)
 *    und guru_chat (der Gesprächsverlauf mit Tim);
 *  - weiß er etwas nicht, legt er es in „Offene Fragen.md“ ab – Claude und Tim gehen das wöchentlich durch.
 *
 * Alles, was Tim schreibt, landet zusätzlich im Tages-Gesprächsprotokoll „Gespräche/JJJJ-MM-TT.md“.
 * Eingehängt nur für Admins (api.ts: requireAuth, requireAdmin).
 */
export const guruRouter = Router();

export async function guruTabellen(): Promise<void> {
  await pool.query(`CREATE TABLE IF NOT EXISTS guru_notizen (
    id serial PRIMARY KEY,
    pfad text NOT NULL UNIQUE,
    inhalt text NOT NULL DEFAULT '',
    quelle text NOT NULL DEFAULT 'guru',
    erstellt_am timestamptz NOT NULL DEFAULT now(),
    geaendert_am timestamptz NOT NULL DEFAULT now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS guru_auftraege (
    id serial PRIMARY KEY,
    text text NOT NULL,
    status text NOT NULL DEFAULT 'offen',
    ergebnis text,
    erstellt_am timestamptz NOT NULL DEFAULT now(),
    fertig_am timestamptz
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS guru_log (
    id serial PRIMARY KEY,
    zeit timestamptz NOT NULL DEFAULT now(),
    text text NOT NULL,
    app text
  )`);
  // Nach einem Neustart haengengebliebene Auftraege wieder freigeben
  await pool.query(`UPDATE guru_auftraege SET status = 'offen' WHERE status = 'laeuft'`);
  await pool.query(`CREATE TABLE IF NOT EXISTS guru_chat (
    id serial PRIMARY KEY,
    rolle text NOT NULL,
    text text NOT NULL,
    daten jsonb,
    zeit timestamptz NOT NULL DEFAULT now()
  )`);
}

const OFFENE_FRAGEN = 'Offene Fragen.md';
const FUER_CLAUDE = 'Für Claude.md';

/* ---------------- Hilfen ---------------- */

const berlin = (d = new Date()) => {
  const f = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d);
  return { tag: f.slice(0, 10), uhr: f.slice(11, 16) };
};

/** Pfad säubern: nur Ordner/Name.md, keine Sonderzeichen, die Ärger machen. */
export function sauberPfad(p: string): string {
  let s = p.replace(/\\/g, '/').split('/').map((t) => t.replace(/[^\p{L}\p{N} ._()&+,-]/gu, '').trim()).filter((t) => t && t !== '.' && t !== '..').join('/');
  if (!s) s = 'Notiz';
  if (!/\.md$/i.test(s)) s += '.md';
  return s.slice(0, 160);
}

async function notizAnhaengen(pfad: string, zeile: string, kopf: string, quelle = 'guru'): Promise<void> {
  await pool.query(
    `INSERT INTO guru_notizen (pfad, inhalt, quelle) VALUES ($1, $2, $3)
     ON CONFLICT (pfad) DO UPDATE SET inhalt = guru_notizen.inhalt || E'\\n' || $4, geaendert_am = now()`,
    [pfad, kopf + '\n\n' + zeile, quelle, zeile],
  );
}

const WOERTER_WEG = new Set(['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'und', 'oder', 'ist', 'sind', 'wie', 'was', 'wo', 'wer',
  'wann', 'warum', 'welche', 'welcher', 'welches', 'mit', 'von', 'für', 'auf', 'in', 'im', 'an', 'am', 'zu', 'zum', 'zur', 'ich', 'du', 'mir', 'mich', 'dir',
  'mal', 'bitte', 'kannst', 'such', 'suche', 'finde', 'gibt', 'es', 'es', 'noch', 'auch', 'nicht', 'kein', 'keine', 'hab', 'habe', 'hat', 'haben', 'wir', 'uns']);

export function suchWoerter(text: string): string[] {
  return [...new Set(text.toLowerCase().replace(/[^\p{L}\p{N} -]/gu, ' ').split(/\s+/).filter((w) => w.length >= 3 && !WOERTER_WEG.has(w)))].slice(0, 6);
}

const kurz = (t: string, n = 140) => (t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);

/* ---------------- Antworten ---------------- */

interface Treffer { titel: string; link?: string; text?: string }
interface Antwort { text: string; treffer?: Treffer[]; ki?: boolean }

const HILFE = [
  'Ich bin der Gleisbau-Guru 🤖 – noch ohne KI, ich arbeite mit Regeln. Das kann ich schon:',
  '• **Merken:** „Merke: Schwellenschraube Ss 8 – sitzt in der Rippenplatte“ → landet in *Wissen/Schwellenschraube Ss 8.md*. Alles nach dem Doppelpunkt bzw. Bindestrich ist der Inhalt.',
  '• **Notiz für Claude:** „Für Claude: …“ → *Für Claude.md* (schaut Claude sich wöchentlich an).',
  '• **Bericht:** „Bericht“ oder „Was gibt’s Neues?“ → Meldungen, Aktivität, Forum der letzten 24 Stunden.',
  '• **Meldungen:** „Meldungen“ → die offenen Fehlermeldungen.',
  '• **Auftrag:** „Auftrag: Pfeilhöhenberechnung“ oder „Guck mal nach Überhöhung“ → ich arbeite das selbstständig ab: Formeln und Apps der Seite ansehen, Lernnotiz mit möglichen Prüfungsfragen schreiben, Unklares notieren.',
  '• **Suchen:** einfach fragen, z. B. „Wo finde ich etwas zur Überhöhung?“ → ich suche in Apps, Glossar, Quizfragen, meinen Notizen und den Meldungen.',
  'Alles, was du schreibst, speichere ich im Tagesprotokoll unter *Gespräche/*. Was ich nicht weiß, lege ich in *Offene Fragen.md* ab.',
  'Seit 13.11. habe ich ein kleines KI-Modell auf dem Server (qwen3.5:4b): Antworten dauern 20–60 Sekunden, ich nutze nur, was ich finde. Nachts sammle ich Daten: Meldungen je Thema, Tagebuch, Bericht.',
].join('\n');

async function bericht(): Promise<Antwort> {
  const q = async (sql: string) => Number((await pool.query(sql)).rows[0]?.n ?? 0);
  const neueMeldungen = await q(`SELECT count(*) n FROM question_reports WHERE created_at > now() - interval '24 hours'`);
  const offen = await q(`SELECT count(*) n FROM question_reports WHERE NOT erledigt`);
  const aktiv = await q(`SELECT count(DISTINCT schluessel) n FROM aktivitaet WHERE zuletzt > now() - interval '24 hours'`);
  const posts = await q(`SELECT count(*) n FROM forum_posts WHERE created_at > now() - interval '24 hours'`);
  const chat = await q(`SELECT count(*) n FROM chat_messages WHERE created_at > now() - interval '24 hours'`);
  const konten = await q(`SELECT count(*) n FROM users WHERE created_at > now() - interval '24 hours'`);
  const apps = (await pool.query(
    `SELECT app, sum(anzahl)::int n FROM aktivitaet_apps WHERE zuletzt > now() - interval '24 hours' GROUP BY app ORDER BY n DESC LIMIT 5`,
  )).rows as { app: string; n: number }[];
  const { tag } = berlin();
  const zeilen = [
    `**Bericht vom ${tag}** (letzte 24 Stunden)`,
    `• Meldungen: ${neueMeldungen} neu, ${offen} insgesamt offen`,
    `• Aktive Nutzer/Geräte: ${aktiv}`,
    `• Forum: ${posts} neue Beiträge · Chat: ${chat} Nachrichten`,
    `• Neue Konten: ${konten}`,
    apps.length ? `• Meistgenutzt: ${apps.map((a) => `${a.app} (${a.n})`).join(', ')}` : '• Meistgenutzt: noch keine Daten',
  ];
  await pool.query(
    `INSERT INTO guru_notizen (pfad, inhalt) VALUES ($1, $2) ON CONFLICT (pfad) DO UPDATE SET inhalt = $2, geaendert_am = now()`,
    [`Berichte/${tag}.md`, '# ' + zeilen.join('\n').replace(/\*\*/g, '')],
  );
  return { text: zeilen.join('\n') + `\n\nGespeichert unter *Berichte/${tag}.md*.` };
}

async function meldungen(): Promise<Antwort> {
  const { rows } = await pool.query(
    `SELECT id, topic, question, reason, comment, created_at FROM question_reports WHERE NOT erledigt ORDER BY created_at DESC LIMIT 8`,
  );
  if (!rows.length) return { text: 'Keine offenen Meldungen – alles erledigt. 👍' };
  return {
    text: `**${rows.length} offene Meldungen** (neueste zuerst):`,
    treffer: rows.map((r: any) => ({ titel: `#${r.id} · ${r.topic} · ${r.reason}`, text: kurz((r.comment ? r.comment + ' – ' : '') + r.question) })),
  };
}

async function merken(rest: string): Promise<Antwort> {
  const m = /^(.{2,60}?)\s*(?::|–|-|=)\s+(.+)$/s.exec(rest.trim());
  const thema = (m ? m[1] : rest.split(/\s+/).slice(0, 4).join(' ')).trim();
  const inhalt = (m ? m[2] : rest).trim();
  const pfad = sauberPfad('Wissen/' + thema);
  const { tag } = berlin();
  const links = await passendeLinks(inhalt, pfad);
  await notizAnhaengen(pfad, `- ${inhalt}${links.length ? ' → ' + links.map((l) => `[[${l}]]`).join(', ') : ''} *(von Tim, ${tag})*`, `# ${thema}\n\n#wissen`, 'tim');
  return { text: `Gemerkt ✍️ unter *${pfad}*:\n„${kurz(inhalt, 300)}“` + (links.length ? `\nVerknüpft mit ${links.map((l) => '[[' + l + ']]').join(', ')}.` : '') };
}

/** Namen vorhandener Wissens-Notizen, die im Text vorkommen (fuer [[Verknuepfungen]] wie in Obsidian). */
async function passendeLinks(text: string, ohnePfad = ''): Promise<string[]> {
  const { rows } = await pool.query(`SELECT pfad FROM guru_notizen WHERE pfad LIKE 'Wissen/%' AND pfad <> $1`, [ohnePfad]);
  const l = text.toLowerCase();
  return rows.map((r: any) => String(r.pfad).slice(String(r.pfad).lastIndexOf('/') + 1).replace(/\.md$/, ''))
    .filter((n: string) => n.length >= 3 && l.includes(n.toLowerCase())).slice(0, 6);
}

/** Notizen, Meldungen und Forum zu den Suchwoertern (ohne etwas zu schreiben). */
async function sammleTreffer(frage: string, seitenTreffer: Treffer[]): Promise<{ treffer: Treffer[]; kontext: string[] }> {
  const w = suchWoerter(frage);
  const treffer: Treffer[] = [...seitenTreffer];
  const kontext: string[] = seitenTreffer.map((t) => `${t.titel}${t.text ? ': ' + t.text : ''}`);
  if (w.length) {
    const muster = w.map((x) => '%' + x + '%');
    const notizen = (await pool.query(
      `SELECT pfad, inhalt FROM guru_notizen WHERE pfad NOT LIKE 'Gespräche/%' AND (pfad ILIKE ANY($1) OR inhalt ILIKE ANY($1))
        ORDER BY geaendert_am DESC LIMIT 5`, [muster],
    )).rows;
    for (const n of notizen) {
      const zeilen = String(n.inhalt).split('\n').filter((z: string) => w.some((x) => z.toLowerCase().includes(x)));
      treffer.push({ titel: '🧠 ' + n.pfad, text: kurz((zeilen[0] ?? n.inhalt).replace(/^[-#\s]+/, '')) });
      kontext.push(`Notiz [[${String(n.pfad).replace(/\.md$/, '')}]]: ${kurz(zeilen.join(' | ') || n.inhalt, 600)}`);
    }
    const mel = (await pool.query(
      `SELECT id, topic, question, comment FROM question_reports WHERE question ILIKE ANY($1) OR comment ILIKE ANY($1) ORDER BY created_at DESC LIMIT 3`, [muster],
    )).rows;
    for (const r of mel) {
      treffer.push({ titel: `⚑ Meldung #${r.id} · ${r.topic}`, text: kurz((r.comment ? r.comment + ' – ' : '') + r.question) });
      kontext.push(`Fehlermeldung #${r.id} (${r.topic}): ${kurz((r.comment ? r.comment + ' – ' : '') + r.question, 300)}`);
    }
    const forum = (await pool.query(
      `SELECT p.body, t.title FROM forum_posts p JOIN forum_threads t ON t.id = p.thread_id WHERE p.body ILIKE ANY($1) OR t.title ILIKE ANY($1)
        ORDER BY p.created_at DESC LIMIT 3`, [muster],
    )).rows;
    for (const f of forum) {
      treffer.push({ titel: '💬 Forum: ' + f.title, link: '/forum', text: kurz(f.body) });
      kontext.push(`Forum „${f.title}“: ${kurz(f.body, 300)}`);
    }
  }
  if (/formel|rechn|höhe|hoehe|radius|länge|laenge|neigung|winkel|einheit|wert|maß|mass|gewicht|kraft|spannung|temperatur/i.test(frage)) {
    const f = (await pool.query(`SELECT pfad FROM guru_notizen WHERE pfad LIKE 'Seite/Formeln/%' ORDER BY pfad`)).rows;
    if (f.length) kontext.push('FORMELVERZEICHNIS der Website (Notiznamen; ähnliche Begriffe zuordnen, z. B. falsch verstandene Wörter): ' +
      f.map((r: any) => '[[' + String(r.pfad).replace(/\.md$/, '') + ']]').join(', '));
  }
  return { treffer, kontext };
}

const SYSTEM = [
  'Du bist der „Bahn-Guru“, Assistent von Tim, dem Admin einer Lern-App für Gleisbauer-Azubis (Gleisbau Lernwelt).',
  'Antworte kurz (höchstens 5 Sätze), auf Deutsch, per Du.',
  'Nutze NUR Fakten aus dem KONTEXT unten. Erfinde keine Normen, Zahlen, Bauteile oder Namen.',
  'Wenn der Kontext die Frage nicht beantwortet, beginne deine Antwort mit „WEISS_NICHT:“ und sag kurz, was fehlt.',
  'Wenn du dich auf eine Notiz beziehst, schreibe ihren Namen in doppelten eckigen Klammern wie [[Wissen/Schwellenschraube]].',
].join('\n');

async function kiAntwort(frage: string, kontext: string[]): Promise<string | null> {
  const verlauf = (await pool.query(`SELECT rolle, text FROM guru_chat ORDER BY id DESC LIMIT 6`)).rows.reverse();
  const nachrichten = [
    { role: 'system' as const, content: SYSTEM + '\n\nKONTEXT:\n' + (kontext.length ? kontext.map((k) => '- ' + k).join('\n').slice(0, 7000) : '(nichts gefunden)') },
    ...verlauf.slice(0, -1).map((v: any) => ({ role: (v.rolle === 'tim' ? 'user' : 'assistant') as 'user' | 'assistant', content: kurz(v.text, 500) })),
    { role: 'user' as const, content: frage },
  ];
  return kiFrage(nachrichten, { maxToken: 300, timeoutMs: 300000, vorrang: true });
}

async function offeneFrage(frage: string): Promise<void> {
  const { tag, uhr } = berlin();
  await notizAnhaengen(OFFENE_FRAGEN, `- [ ] ${tag} ${uhr}: „${kurz(frage, 300)}“`, '# Offene Fragen\n\nDas wusste der Guru nicht – Claude und Tim gehen die Liste wöchentlich durch.\n\n#offen');
}

async function suchen(frage: string, seitenTreffer: Treffer[]): Promise<Antwort> {
  const { treffer, kontext } = await sammleTreffer(frage, seitenTreffer);
  const ki = await kiAntwort(frage, kontext);
  if (ki) {
    const weiss = !/^WEISS_NICHT/i.test(ki);
    if (!weiss) await offeneFrage(frage);
    const text = ki.replace(/^WEISS_NICHT:?\s*/i, '') + (weiss ? '' : '\n\n*(In „Offene Fragen“ notiert.)*');
    return { text: '🧠 ' + text, treffer: treffer.slice(0, 8), ki: true };
  }
  return suchenOhneKi(frage, treffer);
}

async function suchenOhneKi(frage: string, vorhanden: Treffer[]): Promise<Antwort> {
  const w = suchWoerter(frage);
  const treffer: Treffer[] = [...vorhanden];
  if (!treffer.length) {
    await offeneFrage(frage);
    return { text: 'Dazu habe ich nichts gefunden. 🤔 Ich habe die Frage in *Offene Fragen.md* notiert – Claude schaut sie sich bei der Wochen-Durchsicht an.\nWenn du die Antwort weißt: „Merke: Thema: Antwort“.' };
  }
  return { text: `Das habe ich zu „${kurz(w.join(' ') || frage, 60)}“ gefunden:`, treffer: treffer.slice(0, 12) };
}

export async function antworte(text: string, seitenTreffer: Treffer[]): Promise<Antwort> {
  const t = text.trim(), l = t.toLowerCase();
  let m: RegExpExecArray | null;
  if (/^(hilfe|help|\?|was kannst du)/.test(l)) return { text: HILFE };
  if ((m = /^(?:merk(?:e|en)?(?: dir)?|notiere|wissen)\s*[:,-]?\s*(.+)$/is.exec(t))) return merken(m[1]);
  if ((m = /^(?:für|fuer|an|notiz für|notiz fuer)\s+claude\s*[:,-]?\s*(.+)$/is.exec(t))) {
    const { tag, uhr } = berlin();
    await notizAnhaengen(FUER_CLAUDE, `- [ ] ${tag} ${uhr}: ${m[1].trim()}`, '# Für Claude\n\nNotizen von Tim und vom Guru – Claude arbeitet sie bei der Wochen-Durchsicht ab.', 'tim');
    return { text: 'Notiert für Claude 📌 (*Für Claude.md*).' };
  }
  if ((m = /^(?:auftrag|aufgabe|lern(?:e)?|guck(?: mal| dir)?(?: nach| an)?|schau(?: mal| dir)?(?: nach| an)?|recherchier(?:e)?|untersuche)\s*[:,-]?\s*(.{3,})$/is.exec(t))) {
    const a = await pool.query(`INSERT INTO guru_auftraege (text) VALUES ($1) RETURNING id`, [m[1].trim()]);
    const vor = Number((await pool.query(`SELECT count(*) n FROM guru_auftraege WHERE status IN ('offen','laeuft') AND id < $1`, [a.rows[0].id])).rows[0].n);
    await log(`Auftrag #${a.rows[0].id} angenommen: „${kurz(m[1].trim(), 80)}“`);
    weckeArbeiter();
    return { text: `Auftrag #${a.rows[0].id} angenommen 👷 „${kurz(m[1].trim(), 120)}“.` + (vor ? ` Vor dir sind noch ${vor} Aufträge dran.` : ' Ich fange gleich an.') +
      ' Den Fortschritt siehst du oben unter „Was macht der Guru gerade?“, das Ergebnis schreibe ich dir hier in den Chat.' };
  }
  if (/^(bericht|report|zusammenfassung|tagesbericht)|was gibt.?s neues|was ist neu/.test(l)) return bericht();
  if (/^(meldungen|fehlermeldungen|offene meldungen)\b/.test(l)) return meldungen();
  if (/^(hallo|hi|moin|servus|guten (morgen|tag|abend))\b/.test(l) && l.length < 25) return { text: 'Moin Tim! 👋 Schreib „Hilfe“, wenn du sehen willst, was ich schon kann.' };
  // Aussagen ohne Frage: still mitschreiben (steht im Gesprächsprotokoll), kurz bestätigen
  if (!/[?]/.test(t) && !/^(wo|wie|was|wer|welche|such|finde|zeig)/.test(l) && !seitenTreffer.length) {
    const { kontext } = await sammleTreffer(t, []);
    const ki = await kiAntwort(t, kontext);
    const notiz = '\n\n*(Mitgeschrieben in Gespräche/' + berlin().tag + '.md – als Wissen speichern: „Merke: Thema: …“)*';
    if (ki) return { text: '🧠 ' + ki.replace(/^WEISS_NICHT:?\s*/i, '') + notiz, ki: true };
    return { text: 'Hab ich mitgeschrieben (*Gespräche/' + berlin().tag + '.md*). Soll ich es mir als Wissen merken? Dann schreib „Merke: Thema: …“.' };
  }
  return suchen(t, seitenTreffer);
}

/* ---------------- Routen ---------------- */

const trefferSchema = z.array(z.object({ titel: z.string().max(200), link: z.string().max(300).optional(), text: z.string().max(400).optional() })).max(12);
const chatSchema = z.object({ text: z.string().trim().min(1).max(4000), seitenTreffer: trefferSchema.optional() });

guruRouter.get('/chat', asyncHandler(async (req, res) => {
  const nach = Number(req.query['nach'] ?? 0) || 0;
  const { rows } = nach
    ? await pool.query(`SELECT id, rolle, text, daten, zeit FROM guru_chat WHERE id > $1 ORDER BY id LIMIT 50`, [nach])
    : await pool.query(`SELECT id, rolle, text, daten, zeit FROM (SELECT * FROM guru_chat ORDER BY id DESC LIMIT 200) x ORDER BY id`);
  res.set('Cache-Control', 'no-store').json({ nachrichten: rows, denkt: chatLaeuft, ki: { ...kiLage } });
}));

guruRouter.post('/chat', asyncHandler(async (req, res) => {
  const { text, seitenTreffer } = chatSchema.parse(req.body);
  const { tag, uhr } = berlin();
  const ich = await pool.query(`INSERT INTO guru_chat (rolle, text) VALUES ('tim', $1) RETURNING id, rolle, text, daten, zeit`, [text]);
  await notizAnhaengen(`Gespräche/${tag}.md`, `- **${uhr} Tim:** ${text.replace(/\n+/g, ' ')}`, `# Gespräche am ${tag}`, 'tim');
  // Sofort zurueck – die Antwort (evtl. mit KI, 20–60 s) entsteht im Hintergrund, die Seite fragt nach.
  res.json({ nachrichten: [ich.rows[0]], wartet: true });
  chatLaeuft = { text: kurz(text, 80), seit: new Date().toISOString() };
  let a: Antwort;
  try { a = await antworte(text, seitenTreffer ?? []); } catch (err) { logger.warn({ err: String(err) }, 'Guru-Antwort fehlgeschlagen'); a = { text: 'Da ist bei mir etwas schiefgegangen 😕 – versuch es bitte nochmal.' }; }
  await pool.query(`INSERT INTO guru_chat (rolle, text, daten) VALUES ('guru', $1, $2)`, [a.text, a.treffer?.length ? JSON.stringify({ treffer: a.treffer }) : null]);
  chatLaeuft = null;
}));

/** Woran der Guru im Chat gerade denkt (null = nichts). */
let chatLaeuft: { text: string; seit: string } | null = null;

guruRouter.get('/notizen', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(`SELECT id, pfad, quelle, length(inhalt) AS laenge, geaendert_am FROM guru_notizen ORDER BY pfad`);
  res.set('Cache-Control', 'no-store').json({ notizen: rows });
}));

const idSchema = z.coerce.number().int().positive();
guruRouter.get('/notizen/:id', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`SELECT id, pfad, inhalt, quelle, erstellt_am, geaendert_am FROM guru_notizen WHERE id = $1`, [idSchema.parse(req.params.id)]);
  if (!rows[0]) { res.status(404).json({ error: 'Notiz nicht gefunden.' }); return; }
  res.set('Cache-Control', 'no-store').json({ notiz: rows[0] });
}));

const notizSchema = z.object({ pfad: z.string().trim().min(1).max(160), inhalt: z.string().max(200000) });
guruRouter.post('/notizen', asyncHandler(async (req, res) => {
  const { pfad, inhalt } = notizSchema.parse(req.body);
  const { rows } = await pool.query(
    `INSERT INTO guru_notizen (pfad, inhalt, quelle) VALUES ($1, $2, 'tim') ON CONFLICT (pfad) DO NOTHING RETURNING id`, [sauberPfad(pfad), inhalt]);
  if (!rows[0]) { res.status(409).json({ error: 'Eine Notiz mit diesem Namen gibt es schon.' }); return; }
  res.status(201).json({ id: rows[0].id });
}));

guruRouter.put('/notizen/:id', asyncHandler(async (req, res) => {
  const { pfad, inhalt } = notizSchema.parse(req.body);
  try {
    await pool.query(`UPDATE guru_notizen SET pfad = $2, inhalt = $3, geaendert_am = now() WHERE id = $1`, [idSchema.parse(req.params.id), sauberPfad(pfad), inhalt]);
  } catch (e: any) {
    if (e?.code === '23505') { res.status(409).json({ error: 'Eine Notiz mit diesem Namen gibt es schon.' }); return; }
    throw e;
  }
  res.json({ ok: true });
}));

guruRouter.delete('/notizen/:id', asyncHandler(async (req, res) => {
  await pool.query(`DELETE FROM guru_notizen WHERE id = $1`, [idSchema.parse(req.params.id)]);
  res.status(204).send();
}));

guruRouter.get('/status', asyncHandler(async (_req, res) => {
  const ki = await kiStatus();
  const n = Number((await pool.query(`SELECT count(*) n FROM guru_notizen`)).rows[0].n);
  const log = (await pool.query(`SELECT id, zeit, text, app FROM guru_log ORDER BY id DESC LIMIT 40`)).rows;
  const auftraege = (await pool.query(
    `SELECT id, text, status, ergebnis, erstellt_am, fertig_am FROM guru_auftraege ORDER BY (status IN ('offen','laeuft')) DESC, id DESC LIMIT 15`)).rows;
  const wissen = (await pool.query(`SELECT max(geaendert_am) AS am, count(*) AS n FROM guru_notizen WHERE pfad LIKE 'Seite/%'`)).rows[0];
  res.set('Cache-Control', 'no-store').json({ ki: ki.da, modell: ki.modell, notizen: n, jetzt, chat: chatLaeuft, kiLage: { ...kiLage }, log, auftraege, seite: { am: wissen.am, n: Number(wissen.n) } });
}));

/* ---------------- Nachtschicht: Daten sammeln (Hauptjob des Bahn-Guru) ---------------- */

/**
 * Laeuft alle 10 Minuten an und erledigt einmal pro Tag (Berliner Zeit):
 *  - ab 02:00: Meldungen je Thema sammeln (Meldungen/<thema>.md, regelbasiert) und das Tagebuch von gestern
 *    schreiben (Tagebuch/<gestern>.md, KI-Zusammenfassung von Gesprächen, Meldungen, Forum – nur wenn es Daten gibt);
 *  - ab 06:00: Morgenbericht (Berichte/<heute>.md).
 * Erledigtes merkt sich der Guru in „System/Nachtschicht.md“. Die KI rechnet nachts, wenn kaum jemand die Seite nutzt.
 */
export function starteGuruNachtschicht(): void {
  const takt = () => nachtschicht().catch((err) => logger.warn({ err: String(err) }, 'Guru-Nachtschicht fehlgeschlagen'));
  setTimeout(takt, 60_000).unref();
  setInterval(takt, 10 * 60_000).unref();
}

async function erledigt(job: string): Promise<boolean> {
  const { rows } = await pool.query(`SELECT 1 FROM guru_notizen WHERE pfad = 'System/Nachtschicht.md' AND inhalt LIKE $1`, ['%' + job + '%']);
  return rows.length > 0;
}
async function abhaken(job: string): Promise<void> {
  await notizAnhaengen('System/Nachtschicht.md', `- ${job} ✓ ${berlin().uhr}`, '# Nachtschicht\n\nWas der Guru nachts automatisch erledigt hat.');
}

async function nachtschicht(): Promise<void> {
  const { tag, uhr } = berlin();
  const gestern = berlin(new Date(Date.now() - 86400000)).tag;
  if (uhr >= '02:00' && !(await erledigt(`meldungen ${tag}`))) { await meldungenSammeln(); await abhaken(`meldungen ${tag}`); }
  if (uhr >= '02:00' && !(await erledigt(`tagebuch ${gestern}`))) { await tagebuch(gestern); await abhaken(`tagebuch ${gestern}`); }
  if (uhr >= '06:00' && !(await erledigt(`bericht ${tag}`))) { await bericht(); await abhaken(`bericht ${tag}`); }
}

/** Alle Meldungen nach Thema als Markdown – Grundlage, um schlechte Fragen/Apps zu erkennen. */
async function meldungenSammeln(): Promise<void> {
  const { rows } = await pool.query(
    `SELECT id, topic, question, reason, comment, erledigt, erledigt_notiz, created_at FROM question_reports ORDER BY topic, created_at DESC`);
  const nachThema = new Map<string, any[]>();
  for (const r of rows) nachThema.set(r.topic, [...(nachThema.get(r.topic) ?? []), r]);
  const uebersicht: string[] = [];
  for (const [thema, liste] of nachThema) {
    const offen = liste.filter((r) => !r.erledigt).length;
    const pfad = sauberPfad('Meldungen/' + thema);
    uebersicht.push(`| [[${pfad.replace(/\.md$/, '')}]] | ${liste.length} | ${offen} |`);
    const text = [`# Meldungen: ${thema}`, '', `#meldungen · ${liste.length} insgesamt, ${offen} offen · gesammelt ${berlin().tag}`, '',
      ...liste.map((r) => `- ${r.erledigt ? '[x]' : '[ ]'} #${r.id} (${berlin(new Date(r.created_at)).tag}) **${r.reason}**: ${kurz(r.question, 200)}` +
        (r.comment ? ` – „${kurz(r.comment, 200)}“` : '') + (r.erledigt_notiz ? ` → ${kurz(r.erledigt_notiz, 160)}` : ''))].join('\n');
    await pool.query(`INSERT INTO guru_notizen (pfad, inhalt) VALUES ($1, $2) ON CONFLICT (pfad) DO UPDATE SET inhalt = $2, geaendert_am = now()`, [pfad, text]);
  }
  await pool.query(`INSERT INTO guru_notizen (pfad, inhalt) VALUES ($1, $2) ON CONFLICT (pfad) DO UPDATE SET inhalt = $2, geaendert_am = now()`,
    ['Meldungen/Übersicht.md', ['# Meldungen – Übersicht', '', '| Thema | gesamt | offen |', '|---|---|---|', ...uebersicht].join('\n')]);
}

/** Tagebuch: was ist gestern passiert? KI fasst zusammen, falls es Daten gibt; ohne KI nur die Rohdaten. */
async function tagebuch(tag: string): Promise<void> {
  const tagesWhere = `(created_at AT TIME ZONE 'Europe/Berlin')::date = $1::date`;
  const gespraech = (await pool.query(`SELECT inhalt FROM guru_notizen WHERE pfad = $1`, [`Gespräche/${tag}.md`])).rows[0]?.inhalt ?? '';
  const mel = (await pool.query(`SELECT id, topic, reason, question, comment FROM question_reports WHERE ${tagesWhere} ORDER BY id`, [tag])).rows;
  const posts = (await pool.query(`SELECT p.body, t.title FROM forum_posts p JOIN forum_threads t ON t.id = p.thread_id WHERE ${tagesWhere.replace(/created_at/g, 'p.created_at')} ORDER BY p.id`, [tag])).rows;
  if (!gespraech && !mel.length && !posts.length) return;
  const roh = [
    gespraech ? 'GESPRÄCH MIT TIM:\n' + kurz(gespraech, 3000) : '',
    mel.length ? 'NEUE FEHLERMELDUNGEN:\n' + mel.map((r: any) => `#${r.id} ${r.topic} (${r.reason}): ${kurz((r.comment ? r.comment + ' – ' : '') + r.question, 200)}`).join('\n') : '',
    posts.length ? 'FORUM:\n' + posts.map((p: any) => `„${p.title}“: ${kurz(p.body, 200)}`).join('\n') : '',
  ].filter(Boolean).join('\n\n');
  const links = await passendeLinks(roh);
  const ki = await kiFrage([
    { role: 'system', content: 'Du bist der Bahn-Guru. Fasse die Daten eines Tages für Tim (Admin einer Gleisbau-Lern-App) in 3–6 kurzen Stichpunkten auf Deutsch zusammen. Nur was in den Daten steht. Zum Schluss eine Zeile „Zu tun:“ mit dem Wichtigsten (oder „nichts“).' },
    { role: 'user', content: roh.slice(0, 7000) },
  ], { maxToken: 350, timeoutMs: 600000 });
  const text = [`# Tagebuch ${tag}`, '', '#tagebuch', '', ki ?? '*(KI nicht erreichbar – nur Rohdaten)*', '',
    links.length ? 'Verknüpft: ' + links.map((l) => `[[${l}]]`).join(', ') : '', '', '## Rohdaten', '', roh].join('\n');
  await pool.query(`INSERT INTO guru_notizen (pfad, inhalt) VALUES ($1, $2) ON CONFLICT (pfad) DO UPDATE SET inhalt = $2, geaendert_am = now()`, [`Tagebuch/${tag}.md`, text]);
}

export { KI_MODELL };

/* ---------------- Live: wo ist gerade wer (Startseite, nur Admin) ---------------- */

guruRouter.get('/live', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT letzte_seite AS seite, count(*)::int AS n FROM aktivitaet WHERE zuletzt > now() - interval '3 minutes' AND letzte_seite IS NOT NULL GROUP BY letzte_seite`);
  res.set('Cache-Control', 'no-store').json({ seiten: rows, bot: jetzt?.app ? { app: jetzt.app, text: jetzt.text } : null });
}));

/* ---------------- Website einlesen (Snapshot aus dem Browser des Admins) ---------------- */

const wissenSchema = z.object({
  hash: z.string().max(80),
  apps: z.array(z.object({ id: z.string().max(120), titel: z.string().max(200), link: z.string().max(300), beschreibung: z.string().max(1000).optional(), bereich: z.string().max(120).optional() })).max(600),
  formeln: z.array(z.object({ id: z.string().max(80), app: z.string().max(80), appTitel: z.string().max(200), appLink: z.string().max(300), titel: z.string().max(300), latex: z.string().max(1000),
    variablen: z.array(z.object({ symbol: z.string().max(60), name: z.string().max(200), einheit: z.string().max(60).optional() })).max(30),
    hinweis: z.string().max(1500).optional(), grenzen: z.array(z.string().max(800)).max(10).optional() })).max(400),
  glossar: z.array(z.object({ begriff: z.string().max(200), definition: z.string().max(2000) })).max(2000),
  quiz: z.array(z.object({ thema: z.string().max(80), titel: z.string().max(200), link: z.string().max(300),
    fragen: z.array(z.object({ frage: z.string().max(1000), antwort: z.string().max(600), erklaerung: z.string().max(1500).optional() })).max(600) })).max(100),
});

guruRouter.get('/wissen', asyncHandler(async (_req, res) => {
  const r = (await pool.query(`SELECT inhalt FROM guru_notizen WHERE pfad = 'System/Website-Stand.md'`)).rows[0];
  res.set('Cache-Control', 'no-store').json({ hash: /hash: (\S+)/.exec(r?.inhalt ?? '')?.[1] ?? null });
}));

const setze = (pfad: string, inhalt: string) => pool.query(
  `INSERT INTO guru_notizen (pfad, inhalt, quelle) VALUES ($1, $2, 'seite') ON CONFLICT (pfad) DO UPDATE SET inhalt = $2, geaendert_am = now() WHERE guru_notizen.inhalt IS DISTINCT FROM $2`, [pfad, inhalt]);
const linkName = (pfad: string) => pfad.replace(/\.md$/, '');

guruRouter.post('/wissen', asyncHandler(async (req, res) => {
  const w = wissenSchema.parse(req.body);
  setzeJetzt('Liest die Website ein (Apps, Formeln, Glossar, Quizfragen)');
  const appPfad = new Map<string, string>();
  for (const a of w.apps) appPfad.set(a.link, sauberPfad('Seite/Apps/' + a.titel));
  const formelnJeApp = new Map<string, typeof w.formeln>();
  for (const f of w.formeln) formelnJeApp.set(f.appLink, [...(formelnJeApp.get(f.appLink) ?? []), f]);
  const quizJeLink = new Map(w.quiz.map((q) => [q.link, q]));
  for (const f of w.formeln) {
    const pfad = sauberPfad('Seite/Formeln/' + f.titel);
    await setze(pfad, [`# ${f.titel}`, '', '#formel', '', '```', f.latex, '```', '',
      '| Zeichen | Bedeutung | Einheit |', '|---|---|---|', ...f.variablen.map((v) => `| ${v.symbol} | ${v.name} | ${v.einheit || '–'} |`), '',
      f.hinweis ? 'Hinweis: ' + f.hinweis : '', ...(f.grenzen ?? []).map((g) => '- Grenze: ' + g), '',
      `App: [[${linkName(appPfad.get(f.appLink) ?? sauberPfad('Seite/Apps/' + f.appTitel))}]] (${f.appLink})`].join('\n'));
  }
  for (const a of w.apps) {
    const pfad = appPfad.get(a.link)!;
    const fs = formelnJeApp.get(a.link) ?? [];
    const q = quizJeLink.get(a.link);
    await setze(pfad, [`# ${a.titel}`, '', '#app' + (a.bereich ? ' #' + a.bereich.replace(/\s+/g, '-').toLowerCase() : ''), '',
      a.beschreibung ?? '', '', `Adresse: ${a.link}`,
      fs.length ? '\n## Formeln\n' + fs.map((f) => `- [[${linkName(sauberPfad('Seite/Formeln/' + f.titel))}]]: \`${f.latex}\``).join('\n') : '',
      q ? `\n## Quizfragen (${q.fragen.length})\n` + q.fragen.slice(0, 80).map((x) => `- ${x.frage} → **${x.antwort}**`).join('\n') : ''].join('\n'));
  }
  await setze('Seite/Glossar.md', ['# Glossar der Website', '', '#glossar', '', ...w.glossar.map((g) => `- **${g.begriff}**: ${g.definition}`)].join('\n'));
  await setze('System/Website-Stand.md', ['# Website-Stand', '', `hash: ${w.hash}`, `eingelesen: ${berlin().tag} ${berlin().uhr}`,
    `${w.apps.length} Apps, ${w.formeln.length} Formeln, ${w.glossar.length} Glossarbegriffe, ${w.quiz.reduce((a, q) => a + q.fragen.length, 0)} Quizfragen`].join('\n'));
  await log(`Website eingelesen: ${w.apps.length} Apps, ${w.formeln.length} Formeln, ${w.glossar.length} Glossarbegriffe`);
  setzeJetzt(null);
  res.json({ ok: true });
}));

/* ---------------- Arbeiten: Auftraege und selbststaendiges Lernen ---------------- */

/** Was der Guru gerade macht (fuer die Live-Ansicht und den orangen Rand auf der Startseite). */
let jetzt: { text: string; app: string | null; seit: string } | null = null;
function setzeJetzt(text: string | null, app: string | null = null): void {
  jetzt = text ? { text, app, seit: new Date().toISOString() } : null;
}
async function log(text: string, app: string | null = null): Promise<void> {
  await pool.query(`INSERT INTO guru_log (text, app) VALUES ($1, $2)`, [text, app]);
  await pool.query(`DELETE FROM guru_log WHERE id < (SELECT max(id) - 500 FROM guru_log)`);
}

let arbeitet = false;
export function weckeArbeiter(): void {
  if (arbeitet) return;
  arbeitet = true;
  arbeite().catch((err) => logger.warn({ err: String(err) }, 'Guru-Arbeiter Fehler')).finally(() => { arbeitet = false; setzeJetzt(null); });
}

async function arbeite(): Promise<void> {
  for (;;) {
    const a = (await pool.query(`UPDATE guru_auftraege SET status = 'laeuft' WHERE id = (SELECT id FROM guru_auftraege WHERE status = 'offen' ORDER BY id LIMIT 1) RETURNING id, text`)).rows[0];
    if (!a) return;
    try {
      const ergebnis = await bearbeiteAuftrag(a.id, a.text);
      await pool.query(`UPDATE guru_auftraege SET status = 'fertig', ergebnis = $2, fertig_am = now() WHERE id = $1`, [a.id, ergebnis]);
    } catch (err) {
      await pool.query(`UPDATE guru_auftraege SET status = 'fehler', ergebnis = $2, fertig_am = now() WHERE id = $1`, [a.id, String(err).slice(0, 300)]);
      await log(`Auftrag #${a.id} abgebrochen: ${String(err).slice(0, 120)}`);
    }
  }
}

/** Notizen zu den Suchwoertern holen (Inhalt gekuerzt), bevorzugt Seiten-Wissen. */
async function holeNotizen(pfade: string[]): Promise<{ pfad: string; inhalt: string }[]> {
  if (!pfade.length) return [];
  return (await pool.query(`SELECT pfad, inhalt FROM guru_notizen WHERE pfad = ANY($1)`, [pfade])).rows;
}

async function waehleNotizen(thema: string): Promise<string[]> {
  // 1. direkt ueber Suchwoerter
  const w = suchWoerter(thema);
  const direkt = w.length ? (await pool.query(
    `SELECT pfad FROM guru_notizen WHERE (pfad LIKE 'Seite/Formeln/%' OR pfad LIKE 'Seite/Apps/%') AND (pfad ILIKE ANY($1) OR inhalt ILIKE ANY($1)) ORDER BY (pfad LIKE 'Seite/Formeln/%') DESC LIMIT 6`,
    [w.map((x) => '%' + x + '%')])).rows.map((r: any) => r.pfad as string) : [];
  // 2. KI waehlt aus dem Verzeichnis (faengt falsch verstandene Woerter wie „Fallhöhe“ → Pfeilhöhe ab)
  const verzeichnis = (await pool.query(`SELECT pfad FROM guru_notizen WHERE pfad LIKE 'Seite/Formeln/%' OR pfad LIKE 'Seite/Apps/%' ORDER BY pfad`)).rows.map((r: any) => r.pfad as string);
  if (!verzeichnis.length) return direkt;
  const ki = await kiFrage([
    { role: 'system', content: 'Du ordnest Aufträge den passenden Seiten einer Gleisbau-Lern-App zu. Das Wort im Auftrag kann per Spracheingabe falsch verstanden sein (z. B. „Fallhöhe“ statt „Pfeilhöhe“). Antworte NUR mit den Nummern der passenden Einträge, durch Komma getrennt, höchstens 5. Passt nichts, antworte „keine“.' },
    { role: 'user', content: `Auftrag: ${thema}\n\nVerzeichnis:\n` + verzeichnis.map((p, i) => `${i + 1}. ${p.replace(/^Seite\//, '').replace(/\.md$/, '')}`).join('\n') },
  ], { maxToken: 40, timeoutMs: 180000 });
  const nr = [...(ki ?? '').matchAll(/\d+/g)].map((x) => Number(x[0]) - 1).filter((i) => i >= 0 && i < verzeichnis.length).map((i) => verzeichnis[i]);
  return [...new Set([...direkt, ...nr])].slice(0, 6);
}

async function bearbeiteAuftrag(id: number, text: string): Promise<string> {
  setzeJetzt(`Auftrag #${id}: sucht passende Formeln und Apps zu „${kurz(text, 60)}“`);
  await log(`Auftrag #${id}: suche passende Formeln und Apps`);
  const pfade = await waehleNotizen(text);
  const notizen = await holeNotizen(pfade);
  const app = notizen.map((n) => /Adresse: (\S+)|App: .*\((\/[^)]+)\)/.exec(n.inhalt)).map((m) => m?.[1] ?? m?.[2]).find(Boolean) ?? null;
  await log(`Auftrag #${id}: gefunden ${pfade.length ? pfade.map((p) => p.replace(/^Seite\//, '').replace(/\.md$/, '')).join(', ') : 'nichts'}`, app);
  const meld = app ? (await pool.query(`SELECT id, reason, comment, question FROM question_reports WHERE question ILIKE $1 OR topic ILIKE $2 ORDER BY id DESC LIMIT 5`, ['%' + app + '%', '%' + suchWoerter(text)[0] + '%'])).rows : [];
  setzeJetzt(`Auftrag #${id}: lernt „${kurz(text, 60)}“ und schreibt eine Lernnotiz`, app);
  await log(`Auftrag #${id}: lese ${notizen.length} Seiten, schreibe Lernnotiz (KI rechnet, ca. 1–2 Min.)`, app);
  const kontext = notizen.map((n) => `### ${n.pfad}\n${kurz(n.inhalt, 1800)}`).join('\n\n') +
    (meld.length ? '\n\n### Fehlermeldungen dazu\n' + meld.map((r: any) => `#${r.id} ${r.reason}: ${kurz((r.comment ?? '') + ' ' + r.question, 200)}`).join('\n') : '');
  const ki = await kiFrage([
    { role: 'system', content: 'Du bist der Bahn-Guru und lernst die Inhalte einer Gleisbau-Lern-App. Schreibe eine Lernnotiz auf Deutsch in Markdown mit genau diesen Abschnitten:\n## Worum geht es\n(2–3 Sätze; falls der Auftrag ein falsch verstandenes Wort enthält, sag welches gemeint ist)\n## Formel und Einheiten\n(die passende Formel aus dem Kontext wörtlich, jede Größe mit Einheit)\n## Mögliche Prüfungsfragen\n(3 Fragen mit kurzer Lösung, nur aus dem Kontext ableitbar)\n## Unklar\n(was im Kontext fehlt oder widersprüchlich ist, sonst „nichts“)\nNutze NUR den Kontext. Erfinde keine Normen oder Zahlen.' },
    { role: 'user', content: `Auftrag von Tim: ${text}\n\nKONTEXT:\n${kontext.slice(0, 9000) || '(nichts gefunden)'}` },
  ], { maxToken: 700, timeoutMs: 600000 });
  const thema = kurz(text.replace(/^(nach|zu|über|ueber)\s+/i, ''), 60);
  const pfad = sauberPfad('Lernen/' + thema);
  const quellen = pfade.map((p) => `[[${linkName(p)}]]`).join(', ');
  await setze(pfad, [`# ${thema}`, '', `#lernen · Auftrag #${id} vom ${berlin().tag}`, '', ki ?? '*(KI nicht erreichbar – nur Quellen gesammelt)*', '', '## Quellen auf der Website', quellen || '–'].join('\n'));
  const unklar = /## Unklar\s*\n+([\s\S]*?)(\n## |$)/.exec(ki ?? '')?.[1]?.trim();
  if (unklar && !/^nichts/i.test(unklar)) await offeneFrage(`Auftrag #${id} „${thema}“: ${kurz(unklar.replace(/\n/g, ' '), 250)}`);
  const kurzfassung = /## Worum geht es\s*\n+([\s\S]*?)(\n## |$)/.exec(ki ?? '')?.[1]?.trim() ?? '';
  await pool.query(`INSERT INTO guru_chat (rolle, text, daten) VALUES ('guru', $1, $2)`, [
    `✅ Auftrag #${id} erledigt: „${thema}“\n${kurz(kurzfassung, 400)}\n\nLernnotiz: [[${linkName(pfad)}]]` + (unklar && !/^nichts/i.test(unklar) ? '\nUnklares habe ich in [[Offene Fragen]] notiert.' : ''),
    JSON.stringify({ treffer: pfade.slice(0, 5).map((p) => ({ titel: '🧠 ' + linkName(p) })) })]);
  await log(`Auftrag #${id} fertig → ${pfad}`, app);
  return pfad;
}

/** Nachts selbststaendig: jeweils die naechste App ansehen, die noch keine (oder eine alte) Lernnotiz hat. */
async function appLernen(): Promise<boolean> {
  const a = (await pool.query(
    `SELECT s.pfad, s.inhalt FROM guru_notizen s
      LEFT JOIN guru_notizen l ON l.pfad = 'Lernen/Apps/' || substring(s.pfad from 12)
      WHERE s.pfad LIKE 'Seite/Apps/%' AND (l.id IS NULL OR l.geaendert_am < now() - interval '14 days')
      ORDER BY l.geaendert_am NULLS FIRST, s.pfad LIMIT 1`)).rows[0];
  if (!a) return false;
  const name = linkName(a.pfad).replace(/^Seite\/Apps\//, '');
  const app = /Adresse: (\S+)/.exec(a.inhalt)?.[1] ?? null;
  setzeJetzt(`Lernt selbstständig: App „${name}“`, app);
  await log(`Selbstständig: sehe mir die App „${name}“ an`, app);
  const meld = app ? (await pool.query(`SELECT id, reason, comment, erledigt FROM question_reports WHERE question ILIKE $1 ORDER BY id DESC LIMIT 5`, ['%' + app + '%'])).rows : [];
  const ki = await kiFrage([
    { role: 'system', content: 'Du bist der Bahn-Guru und lernst die Apps einer Gleisbau-Lern-App kennen. Schreibe auf Deutsch in Markdown:\n## Wozu die App\n(2 Sätze)\n## Was man lernt\n(3–5 Stichpunkte)\n## Mögliche Prüfungsfragen\n(3 Fragen mit kurzer Lösung)\n## Auffälligkeiten\n(Fehlermeldungen oder Widersprüche im Kontext, sonst „keine“)\nNur aus dem Kontext, nichts erfinden.' },
    { role: 'user', content: kurz(a.inhalt, 7000) + (meld.length ? '\n\nFehlermeldungen:\n' + meld.map((r: any) => `#${r.id} ${r.erledigt ? '(erledigt) ' : ''}${r.reason}: ${kurz(r.comment ?? '', 200)}`).join('\n') : '') },
  ], { maxToken: 600, timeoutMs: 600000 });
  if (!ki) { await log(`App „${name}“: KI nicht erreichbar, später nochmal`, app); return false; }
  await setze(sauberPfad('Lernen/Apps/' + name), [`# ${name}`, '', `#lernen #app · selbstständig gelernt am ${berlin().tag}`, '', ki, '', `Quelle: [[${linkName(a.pfad)}]]`].join('\n'));
  await log(`App „${name}“ gelernt → Lernen/Apps/${name}.md`, app);
  return true;
}

/** Tagsueber Auftraege, nachts (01–05:30 Uhr) zusaetzlich Apps lernen – immer nur eins nach dem anderen. */
export function starteGuruArbeiter(): void {
  setTimeout(() => weckeArbeiter(), 30_000).unref();
  setInterval(async () => {
    weckeArbeiter();
    const { uhr } = berlin();
    if (arbeitet || uhr < '01:00' || uhr > '05:30') return;
    arbeitet = true;
    try { await appLernen(); } catch (err) { logger.warn({ err: String(err) }, 'Guru: App lernen fehlgeschlagen'); } finally { arbeitet = false; setzeJetzt(null); }
  }, 60_000).unref();
}

/* Rueckverweise wie in Obsidian: Notizen, die [[name]] (oder nur den Dateinamen) verlinken */
guruRouter.get('/rueckverweise', asyncHandler(async (req, res) => {
  const name = z.string().min(1).max(200).parse(req.query['name']);
  const kurzname = name.slice(name.lastIndexOf('/') + 1);
  const { rows } = await pool.query(
    `SELECT id, pfad FROM guru_notizen WHERE pfad <> $3 AND (inhalt LIKE $1 OR inhalt LIKE $2) ORDER BY pfad LIMIT 50`,
    ['%[[' + name + ']]%', '%[[' + kurzname + ']]%', name + '.md']);
  res.set('Cache-Control', 'no-store').json({ notizen: rows });
}));

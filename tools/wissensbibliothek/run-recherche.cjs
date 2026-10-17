/**
 * Langer Recherche-Lauf fuer die Gleisbau-Wissensbibliothek (Vault-Ordner 19).
 * Arbeitet die Themen-Dateien nacheinander ueber run-gwen-task.cjs ab, solange das
 * Zeitbudget reicht, und prueft nach jedem Thema automatisch alle von Gwen genannten
 * URLs auf Erreichbarkeit (Halluzinations-Filter, Gwen erfindet Domains).
 *
 *   node tools/wissensbibliothek/run-recherche.cjs [--minutes 120] [--only A01,A02] [--retries 1]
 *
 * Ausgaben: Ki Datenspeicher/19-Gleisbau-Wissensbibliothek/Fortschritt.md (laufend),
 *           .../URL-Check/<ID>.md (je Thema), tools/wissensbibliothek/state.json
 * Beenden: Datei tools/wissensbibliothek/STOP anlegen -> Lauf endet nach dem aktuellen Thema.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const LIB = path.join(ROOT, 'Ki Datenspeicher', '19-Gleisbau-Wissensbibliothek');
const THEMEN = path.join(LIB, 'Themen');
const URLCHK = path.join(LIB, 'URL-Check');
const STATE = path.join(__dirname, 'state.json');
const STOP = path.join(__dirname, 'STOP');
const LMS = path.join(process.env.USERPROFILE || '', '.lmstudio', 'bin', 'lms.exe');

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const MINUTES = Number(opt('--minutes', 120));
const ONLY = opt('--only', '') ? opt('--only', '').split(',') : null;
const RETRIES = Number(opt('--retries', 1));
const TIMEOUT = Number(opt('--timeout', 900));
const MIN_RUN_RESERVE_MIN = 8; // keinen neuen Lauf starten, wenn weniger Zeit uebrig

const EXTRA =
  'Arbeitsmodus Wissensbibliothek: Fuehre ZUERST eine echte Testsuche zum Thema durch und nutze nur URLs, die in Suchergebnissen oder abgerufenen Seiten tatsaechlich vorkamen - URLs niemals raten oder aus dem Gedaechtnis bilden. ' +
  'Lies relevante Seiten mit dem fetch-Tool, nicht nur die Suchtreffer. Jeder Eintrag ist EINE Zeile im Format: ' +
  '- **Begriff/Dokument** - Fakt in 1-3 Saetzen mit exaktem Titel/Nummer/Ausgabestand wo vorhanden - Quelle: VOLLSTAENDIGE URL - Klasse: A (DB/Behoerde/Gesetz/Normungsinstitut) oder B (Hersteller/Fachverband/Fachbuch) oder C (Wikipedia/Forum/Blog) - Stand: JJJJ-MM-TT (belegt). ' +
  'Wenn du etwas nur vermutest: Stand: JJJJ-MM-TT (unsicher). Kein Treffer: Eintrag mit (nicht gefunden) statt zu erfinden. Keine Dopplungen, keine Normnummern ohne Fundstelle. ' +
  'Beantworte alle Fragen der Datei; schreibe mindestens 8 Eintraege; jede Zeile muss vollstaendig mit einem Satzzeichen oder einer Klammer enden.';

function sh(cmd) { try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { return (e.stdout || '') + (e.stderr || ''); } }

function modelOk() {
  const ps = sh(`"${LMS}" ps`);
  const lines = ps.split(/\r?\n/).filter((l) => /qwen/.test(l));
  // genau die kanonische Instanz (Identifier qwen3.5-9b, 131072 Kontext), keine 4096er-JIT-Instanz
  return lines.some((l) => /^\s*qwen3\.5-9b\s/.test(l) && /131072/.test(l)) && !lines.some((l) => /\b4096\b/.test(l));
}
function ensureModel() {
  if (modelOk()) return true;
  console.log('Modell fehlt oder falscher Kontext - lade neu ...');
  sh(`"${LMS}" unload --all`);
  sh(`"${LMS}" load qwen/qwen3.5-9b --context-length 131072 --identifier qwen3.5-9b -y`);
  return modelOk();
}

function loadState() { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return {}; } }
function saveState(s) { fs.writeFileSync(STATE, JSON.stringify(s, null, 2)); }

async function checkUrl(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 15000);
  try {
    let r = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Wissensbibliothek-URL-Check)' } });
    return { url, ok: r.status < 400, status: r.status };
  } catch (e) {
    return { url, ok: false, status: String(e.cause?.code || e.name || e.message).slice(0, 40) };
  } finally { clearTimeout(t); }
}

async function urlCheck(id, file) {
  const content = fs.readFileSync(file, 'utf8');
  const sec = content.split('## 🔎 Rechercheergebnisse von Gwen')[1] || '';
  const urls = [...new Set((sec.match(/https?:\/\/[^\s)\]>"'<]+/g) || []).map((u) => u.replace(/[.,;]+$/, '')))];
  const results = [];
  for (const u of urls) results.push(await checkUrl(u));
  const ok = results.filter((r) => r.ok).length;
  const lines = (sec.split('\n').filter((l) => /^\s*-\s+\*\*/.test(l))).length;
  // tote Links direkt im Eintrag markieren (einmalig), damit die Bibliothek ehrlich bleibt
  let upd = content;
  for (const r of results) {
    if (r.ok) continue;
    const mark = ` ⚠️[URL nicht erreichbar: ${r.status}]`;
    if (upd.includes(r.url + mark)) continue;
    upd = upd.split(r.url).join(r.url + mark);
  }
  if (upd !== content) fs.writeFileSync(file, upd);
  fs.mkdirSync(URLCHK, { recursive: true });
  fs.mkdirSync(URLCHK, { recursive: true });
  const md = `---\ntags: [wissensbibliothek, url-check]\nautor: Claude\n---\n\n# URL-Check ${id} (${new Date().toISOString().slice(0, 16)})\n\nEintraege: ${lines} · URLs: ${urls.length} · erreichbar: ${ok} · tot/unklar: ${urls.length - ok}\n\n` +
    results.map((r) => `- ${r.ok ? '✅' : '❌'} ${r.status} ${r.url}`).join('\n') + '\n';
  fs.writeFileSync(path.join(URLCHK, `${id}.md`), md);
  return { urls: urls.length, ok, entries: lines };
}

function writeProgress(state, startedAt, files) {
  const rows = files.map((f) => {
    const id = f.split('-')[0];
    const s = state[id] || {};
    return `| [[Themen/${f.replace(/\.md$/, '')}|${id}]] | ${s.status || 'offen'} | ${s.entries ?? ''} | ${s.urls != null ? `${s.ok}/${s.urls}` : ''} | ${s.durationSec ?? ''} | ${s.finished ? s.finished.slice(11, 16) : ''} |`;
  });
  const md = `---\ntags: [wissensbibliothek, fortschritt]\nautor: Claude\n---\n\n# Fortschritt Recherche-Lauf\n\nGestartet: ${startedAt.toISOString().slice(0, 16)} · aktualisiert: ${new Date().toISOString().slice(0, 16)} (UTC)\n\n| Thema | Status | Eintraege | URLs ok/gesamt | Sek. | Fertig (UTC) |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n\n> Status SUCCESS = technisch/strukturell ok, NICHT inhaltlich verifiziert. Verifikation durch Claude: siehe [[00-Index]].\n`;
  fs.writeFileSync(path.join(LIB, 'Fortschritt.md'), md);
}

(async () => {
  const startedAt = new Date();
  const deadline = startedAt.getTime() + MINUTES * 60000;
  let files = fs.readdirSync(THEMEN).filter((f) => /^[A-Z]\d+-.*\.md$/.test(f)).sort();
  if (ONLY) files = files.filter((f) => ONLY.includes(f.split('-')[0]));
  const state = loadState();
  if (fs.existsSync(STOP)) fs.unlinkSync(STOP);
  console.log(`Start ${startedAt.toISOString()} - Budget ${MINUTES} min - ${files.length} Themen`);

  let quickFails = 0;
  for (const f of files) {
    if (quickFails >= 3) { console.log('3 Schnellfehlschlaege in Folge - Infrastrukturproblem, Abbruch.'); break; }
    const id = f.split('-')[0];
    const s = state[id] || {};
    if (['SUCCESS', 'NEEDS_REVIEW'].includes(s.status) || (s.tries || 0) >= 2) continue;
    if (fs.existsSync(STOP)) { console.log('STOP-Datei gefunden - Ende.'); break; }
    if (deadline - Date.now() < MIN_RUN_RESERVE_MIN * 60000) { console.log('Zeitbudget fast aufgebraucht - Ende.'); break; }
    if (!ensureModel()) { console.log('Modell konnte nicht geladen werden - Abbruch.'); break; }

    console.log(`\n=== ${id} (${Math.round((deadline - Date.now()) / 60000)} min uebrig) ===`);
    const t0 = Date.now();
    const rel = `19-Gleisbau-Wissensbibliothek/Themen/${f}`;
    let status = 'TECHNICAL_FAILURE';
    let out = '';
    for (let a = 1; a <= 3; a++) {
      if (deadline - Date.now() < 5 * 60000) break;
      if (!ensureModel()) { console.log('Modell konnte nicht geladen werden.'); break; }
      const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'cline-cli', 'run-gwen-task.cjs'), rel, '--retries', '0', '--timeout', String(TIMEOUT), '--extra', EXTRA], { cwd: ROOT, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
      out = (r.stdout || '') + (r.stderr || '');
      const m = out.match(/=== Ergebnis: (\w+)/);
      status = m ? m[1] : 'TECHNICAL_FAILURE';
      console.log('  Versuch ' + a + ': ' + status);
      if (['SUCCESS', 'NEEDS_REVIEW', 'RULE_VIOLATION'].includes(status)) break;
    }
    console.log(out.split('\n').filter((l) => /->|Ergebnis|^- /.test(l)).join('\n'));
    let chk = { urls: 0, ok: 0, entries: 0 };
    try { chk = await urlCheck(id, path.join(THEMEN, f)); } catch (e) { console.log('URL-Check Fehler', e.message); }
    const quickFail = status === 'NO_CHANGE' && Date.now() - t0 < 40000;
    quickFails = quickFail ? quickFails + 1 : 0;
    state[id] = { status, tries: quickFail ? (s.tries || 0) : (s.tries || 0) + 1, durationSec: Math.round((Date.now() - t0) / 1000), finished: new Date().toISOString(), ...chk };
    saveState(state);
    writeProgress(state, startedAt, files);
    console.log(`${id}: ${status}, ${chk.entries} Eintraege, URLs ${chk.ok}/${chk.urls}`);
  }
  writeProgress(state, startedAt, files);
  console.log('\nLauf beendet', new Date().toISOString());
})();

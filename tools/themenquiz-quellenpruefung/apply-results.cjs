/**
 * Liest alle Batch-*.md-Dateien aus
 * "Ki Datenspeicher/15-Themenquiz-Quellenpruefung/", sucht darin
 * (unabhängig von der Position im Dokument — Gwen hängt Ergebnisse
 * typischerweise ans Ende an) nach "Frage N (id): ..."-Blöcken mit
 * RICHTIG/FALSCH/UNSICHER-Urteil und einer Quelle, und übernimmt für jede
 * RICHTIG-Frage mit echter URL die Felder source/sourceUrl in die passende
 * src/assets/themenquiz/<topic>.json.
 *
 * Ein Batch gilt erst als abgehakt in Fortschritt.md, wenn ALLE seine
 * Fragen ein auswertbares Ergebnis hatten (RICHTIG uebernommen ODER
 * FALSCH/UNSICHER dokumentiert) — nicht anhand von Frontmatter-Status, da
 * Gwen dort erfahrungsgemaess eigene Werte eintraegt statt der Vorgabe.
 *
 * Aufruf:  node tools/themenquiz-quellenpruefung/apply-results.cjs [--dry-run] [<Batch-Datei.md> ...]
 */
const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;

const ROOT = path.join(__dirname, '..', '..');
const BATCH_DIR = path.join(ROOT, 'Ki Datenspeicher', '15-Themenquiz-Quellenpruefung');
const SRC_DIR = path.join(ROOT, 'src', 'assets', 'themenquiz');
const BATCH_SIZE = 5; // muss mit make-batches.cjs uebereinstimmen
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const explicitFiles = args.filter((a) => !a.startsWith('--'));

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return fm;
}

/** Fallback-Label aus einer URL bauen, falls Gwen keine Bezeichnung liefert. */
function labelFromUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const lastSeg = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || '')
      .replace(/[_-]/g, ' ')
      .replace(/\.\w+$/, '');
    return lastSeg ? `${host} – ${lastSeg}` : host;
  } catch {
    return url;
  }
}

/** Extrahiert alle "Frage N (id): ..."-Bloecke aus dem gesamten Dokument. */
function parseAnswerBlocks(content) {
  const bodyOnly = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  // Erkennt sowohl das angeforderte "Frage N (id):" als auch von Gwen
  // beobachtete Abweichungen wie "#### id (Beschreibung)" oder "### id".
  const markerRe = /(?:\*{0,2}Frage\s+\d+\s*\(([^)]+)\)\*{0,2}:?)|(?:^#{2,4}\s*([\w-]+)\s*\()/gm;
  const rawMatches = [...bodyOnly.matchAll(markerRe)];
  const matches = rawMatches.map((m) => ({ index: m.index, 1: m[1] || m[2] }));
  const blocks = [];
  for (let i = 0; i < matches.length; i++) {
    const id = matches[i][1].trim();
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : bodyOnly.length;
    const text = bodyOnly.slice(start, end);
    blocks.push({ id, text });
  }
  return blocks;
}

function extractVerdictAndSource(rawBlockText) {
  // "Laut App richtig: ..." ist feste Vorlagen-Zeile (aus make-batches.cjs)
  // und darf nicht als Gwens Urteil erkannt werden (case-insensitive "richtig").
  const blockText = rawBlockText.replace(/Laut App richtig:.*$/gim, '');
  const verdictMatch = blockText.match(/\b(RICHTIG|FALSCH|UNSICHER)\b/i);
  const urteil = verdictMatch ? verdictMatch[1].toUpperCase() : null;

  const urlMatch = blockText.match(/https?:\/\/\S+/);
  let url = urlMatch ? urlMatch[0] : null;
  if (url) {
    url = url.split('](')[0]; // Markdown-Linksyntax "URL](URL)" auf die erste URL kuerzen
    url = url.replace(/\|\|.*$/, ''); // "||" ohne Leerzeichen direkt an der URL
    // Unausgeglichene schliessende Klammern am Ende entfernen (Satzklammer um die URL),
    // aber legitime Klammern IN der URL behalten (z.B. .../wiki/Oberbau_(Eisenbahn))
    let open = 0, close = 0;
    for (const ch of url) { if (ch === '(') open++; if (ch === ')') close++; }
    while (close > open && url.endsWith(')')) { url = url.slice(0, -1); close--; }
    url = url.replace(/[.,;:]+$/, '').trim();
  }

  if (!url) {
    if (/keine gefunden/i.test(blockText)) return { urteil: urteil || 'UNSICHER', url: null, label: null, noSourceFound: true };
    return { urteil, url: null, label: null, noSourceFound: false };
  }

  // Bezeichnung: erst "|| label" versuchen, sonst Klammer/Bindestrich-Text nach der URL, sonst URL-basiertes Fallback
  let label = null;
  const pipeMatch = blockText.match(/\|\|\s*([^\n]+)/);
  if (pipeMatch) {
    label = pipeMatch[1].trim();
  } else {
    const afterUrl = blockText.slice(blockText.indexOf(url) + url.length);
    const dashMatch = afterUrl.match(/^[\s(]*[\d.]*\)?\s*[–—-]\s*([^\n.]+)/);
    label = dashMatch ? dashMatch[1].trim() : labelFromUrl(url);
  }
  // Aufraeumen: uebrig gebliebene Markdown-Sterne, Anfuehrungszeichen am Rand,
  // und auf eine sinnvolle Anzeigelaenge kuerzen (Label, kein Zitat-Absatz).
  label = label.replace(/\*+/g, '').replace(/^["']|["']$/g, '').trim();
  if (label.length > 90) label = label.slice(0, 87).trimEnd() + '…';

  return { urteil, url, label, noSourceFound: false };
}

/**
 * Prueft nur, ob der Hostname der URL ueberhaupt per DNS aufloest — kein
 * voller HTTP-Request (schnell, reicht aber um Gwens gelegentlich
 * beobachtetes Muster zu fangen: eine plausibel klingende, aber komplett
 * erfundene Domain als Quelle angeben, statt "keine gefunden" zu schreiben).
 */
const dnsCache = new Map();
async function hostnameResolves(url) {
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return false;
  }
  if (dnsCache.has(host)) return dnsCache.get(host);
  try {
    await dns.lookup(host);
    dnsCache.set(host, true);
    return true;
  } catch {
    dnsCache.set(host, false);
    return false;
  }
}

const allBatchFiles = fs
  .readdirSync(BATCH_DIR)
  .filter((f) => /^Batch-.*\.md$/.test(f))
  .sort();
const batchFiles = explicitFiles.length ? explicitFiles : allBatchFiles;

const report = { applied: [], incomplete: [], falschOrUnsicher: [], badUrls: [] };
const jsonCache = {};
const fullyDoneBatchNames = [];

async function main() {
for (const file of batchFiles) {
  const full = path.join(BATCH_DIR, file);
  if (!fs.existsSync(full)) {
    report.incomplete.push(`${file}: Datei nicht gefunden`);
    continue;
  }
  // Gwens editor-Tool haengt gelegentlich ein UTF-8-BOM an den Dateianfang
  // (bekannter Fallstrick) — entfernen, sonst ankert die Frontmatter-Regex nicht.
  const content = fs.readFileSync(full, 'utf8').replace(/^﻿/, '');
  const fm = parseFrontmatter(content);
  const topic = fm.topic;
  const batchNum = parseInt(fm.batch, 10);
  if (!topic || !batchNum) {
    report.incomplete.push(`${file}: kein topic/batch im Frontmatter`);
    continue;
  }

  if (!jsonCache[topic]) {
    const jsonPath = path.join(SRC_DIR, `${topic}.json`);
    jsonCache[topic] = { path: jsonPath, data: JSON.parse(fs.readFileSync(jsonPath, 'utf8')), changed: false };
  }
  const { data } = jsonCache[topic];

  // Erwartete Frage-IDs NICHT aus der (evtl. von Gwen beschaedigten) Datei
  // selbst ableiten, sondern aus der Quell-JSON per gleicher Batch-Aufteilung
  // wie make-batches.cjs (robust gegen geloeschte/veraenderte Fragebloecke).
  const uniqueExpected = data.questions
    .slice((batchNum - 1) * BATCH_SIZE, batchNum * BATCH_SIZE)
    .map((q) => q.id);

  const blocks = parseAnswerBlocks(content);
  // Bei mehreren Treffern derselben ID (z.B. Ergebnis-Block UND uebrig
  // gebliebener Fragen-Text) alle Fundstellen zusammenfuehren, statt die
  // erste (evtl. die einzige mit echter URL) zu ueberschreiben.
  const byId = new Map();
  for (const b of blocks) byId.set(b.id, (byId.get(b.id) || '') + '\n' + b.text);

  let answeredCount = 0;
  let appliedInBatch = 0;
  for (const id of uniqueExpected) {
    const blockText = byId.get(id);
    if (!blockText) continue; // noch keine Antwort fuer diese Frage im Dokument

    const { urteil, url, label, noSourceFound } = extractVerdictAndSource(blockText);
    if (!urteil) continue; // kein auswertbares Urteil gefunden, zaehlt nicht als beantwortet

    answeredCount++;

    if (urteil === 'FALSCH' || urteil === 'UNSICHER' || noSourceFound) {
      report.falschOrUnsicher.push(`${topic}/${id}: ${urteil}${noSourceFound ? ' (keine Quelle gefunden)' : ''}`);
      continue;
    }
    if (urteil === 'RICHTIG') {
      if (!url) {
        report.falschOrUnsicher.push(`${topic}/${id}: RICHTIG aber keine URL erkannt`);
        continue;
      }
      if (!(await hostnameResolves(url))) {
        report.badUrls.push(`${topic}/${id}: Domain loest nicht per DNS auf, vermutlich erfunden: ${url}`);
        continue;
      }
      const target = data.questions.find((x) => x.id === id);
      if (!target) {
        report.badUrls.push(`${file}: Frage-ID ${id} nicht in ${topic}.json gefunden`);
        continue;
      }
      const finalLabel = label || labelFromUrl(url);
      // Mojibake-Schutz: Gwens editor-Tool hat schon mal Dateien mit
      // doppelt-kodiertem UTF-8 zurueckgeschrieben (Ã¤ statt ä usw.) — so
      // etwas darf nie unbemerkt in die App-Daten wandern.
      if (/Ã[¤¶¼ŸŽž]|â€/.test(finalLabel)) {
        report.badUrls.push(`${topic}/${id}: Bezeichnung sieht nach doppelt-kodiertem UTF-8 aus, nicht uebernommen: "${finalLabel}"`);
        continue;
      }
      target.source = finalLabel;
      target.sourceUrl = url;
      jsonCache[topic].changed = true;
      appliedInBatch++;
    }
  }

  if (answeredCount === uniqueExpected.length && uniqueExpected.length > 0) {
    fullyDoneBatchNames.push(file.replace('.md', ''));
    report.applied.push(`${file}: ${appliedInBatch}/${uniqueExpected.length} Quellen übernommen (Batch vollständig)`);
  } else {
    report.incomplete.push(`${file}: ${answeredCount}/${uniqueExpected.length} Fragen beantwortet — noch unvollständig`);
  }
}

if (!DRY_RUN) {
  for (const topic of Object.keys(jsonCache)) {
    const entry = jsonCache[topic];
    if (entry.changed) {
      fs.writeFileSync(entry.path, JSON.stringify(entry.data, null, 2) + '\n', 'utf8');
    }
  }

  const fortschrittPath = path.join(BATCH_DIR, 'Fortschritt.md');
  let fortschritt = fs.readFileSync(fortschrittPath, 'utf8');
  for (const name of fullyDoneBatchNames) {
    fortschritt = fortschritt.replace(`- [ ] ${name} `, `- [x] ${name} `);
  }
  fs.writeFileSync(fortschrittPath, fortschritt, 'utf8');
}

console.log(`=== Vollstaendig uebernommen (${report.applied.length} Batches) ===`);
report.applied.forEach((l) => console.log('  ' + l));
console.log(`\n=== Unvollstaendig (${report.incomplete.length}) ===`);
report.incomplete.forEach((l) => console.log('  ' + l));
console.log(`\n=== FALSCH/UNSICHER/ohne Quelle — brauchen Aufmerksamkeit (${report.falschOrUnsicher.length}) ===`);
report.falschOrUnsicher.forEach((l) => console.log('  ' + l));
console.log(`\n=== Verdaechtige URLs/IDs (${report.badUrls.length}) ===`);
report.badUrls.forEach((l) => console.log('  ' + l));
if (DRY_RUN) console.log('\n[--dry-run] Keine Dateien geschrieben.');
}

main().catch((e) => { console.error(e); process.exit(1); });

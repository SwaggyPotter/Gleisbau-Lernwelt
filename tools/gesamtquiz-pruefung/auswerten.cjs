/**
 * Wertet die Gwen-Prüfergebnisse in "Ki Datenspeicher/10-Gesamtquiz-Pruefung/"
 * aus, ohne dass eine KI die Dateien lesen muss (token-frei).
 *
 * - Zählt Urteile (RICHTIG / FALSCH / UNSICHER / noch offen) über alle Batches.
 * - Listet alle FALSCH- und UNSICHER-Fälle mit Begründung + Quelle.
 * - Integritäts-Check: meldet, wenn Fragetexte gegenüber der App-JSON
 *   verändert wurden oder Fragen-IDs fehlen (Gwen-Schadenskontrolle).
 * - Schreibt zusätzlich einen Bericht nach "10-Gesamtquiz-Pruefung/Auswertung.md".
 *
 * Aufruf:  node tools/gesamtquiz-pruefung/auswerten.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const VAULT = path.join(ROOT, 'Ki Datenspeicher', '10-Gesamtquiz-Pruefung');
const SRC = path.join(ROOT, 'src', 'assets', 'zusatz', 'gesamtquiz', 'gesamtquiz-alle-module.json');

const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const byId = new Map(data.questions.map((q) => [q.id, q]));

const files = fs.readdirSync(VAULT).filter((f) => /^Batch-\d+\.md$/.test(f)).sort();

const totals = { RICHTIG: 0, FALSCH: 0, UNSICHER: 0, offen: 0, unlesbar: 0 };
const findings = [];   // FALSCH/UNSICHER-Fälle
const schaeden = [];   // Struktur-/Integritätsprobleme
const batchRows = [];
const seenIds = new Set();

for (const f of files) {
  const md = fs.readFileSync(path.join(VAULT, f), 'utf8');
  const status = (md.match(/^status:\s*(.+?)\s*$/m) || [])[1] || '?';
  const counts = { RICHTIG: 0, FALSCH: 0, UNSICHER: 0, offen: 0, unlesbar: 0 };

  const blocks = md.split(/^## Frage \d+ von \d+ — /m).slice(1);
  for (const block of blocks) {
    const id = (block.match(/^(\S+)/) || [])[1];
    const q = byId.get(id);
    if (!q) {
      schaeden.push(`${f}: unbekannte Fragen-ID "${id}"`);
      continue;
    }
    seenIds.add(id);
    if (!block.includes(q.question)) {
      schaeden.push(`${f} / ${id}: Fragetext gegenüber App-JSON verändert oder gelöscht`);
    }

    const urteilRaw = (block.match(/Urteil:\s*\**\s*(RICHTIG|FALSCH|UNSICHER|___)/i) || [])[1];
    if (!urteilRaw) {
      counts.unlesbar++; totals.unlesbar++;
      schaeden.push(`${f} / ${id}: "Urteil:"-Zeile fehlt oder unlesbar`);
      continue;
    }
    if (urteilRaw === '___') { counts.offen++; totals.offen++; continue; }

    const urteil = urteilRaw.toUpperCase();
    counts[urteil]++; totals[urteil]++;

    const begruendung = ((block.match(/Begründung:\s*(.+)/) || [])[1] || '').trim();
    const quelle = ((block.match(/Quelle:\s*(.+)/) || [])[1] || '').trim();
    if (urteil !== 'RICHTIG' || quelle === '' || quelle === '___') {
      if (urteil === 'FALSCH' || urteil === 'UNSICHER') {
        findings.push({ batch: f, id, urteil, begruendung, quelle });
      }
    }
    if (urteil === 'RICHTIG' && (quelle === '' || quelle === '___' || /keine gefunden/i.test(quelle))) {
      schaeden.push(`${f} / ${id}: Urteil RICHTIG, aber keine Quelle angegeben (Regelverstoß)`);
    }
  }
  batchRows.push({ file: f, status, ...counts });
}

for (const id of byId.keys()) {
  if (!seenIds.has(id)) schaeden.push(`Frage ${id} in keiner Batch-Datei gefunden`);
}

// ---- Konsolen-Ausgabe ----
const geprueft = totals.RICHTIG + totals.FALSCH + totals.UNSICHER;
console.log(`\n=== Gesamtquiz-Prüfung: Auswertung (${new Date().toISOString().slice(0, 10)}) ===`);
console.log(`Geprüft: ${geprueft}/${byId.size}  |  RICHTIG: ${totals.RICHTIG}  FALSCH: ${totals.FALSCH}  UNSICHER: ${totals.UNSICHER}  offen: ${totals.offen}  unlesbar: ${totals.unlesbar}\n`);
for (const r of batchRows) {
  if (r.RICHTIG + r.FALSCH + r.UNSICHER + r.unlesbar > 0 || !/^offen$/.test(r.status)) {
    console.log(`${r.file}  [${r.status}]  R:${r.RICHTIG} F:${r.FALSCH} U:${r.UNSICHER} offen:${r.offen}${r.unlesbar ? ' UNLESBAR:' + r.unlesbar : ''}`);
  }
}
if (findings.length) {
  console.log(`\n--- Zu prüfende Fälle (FALSCH/UNSICHER): ${findings.length} ---`);
  for (const x of findings) console.log(`${x.id} [${x.urteil}] ${x.begruendung || '(keine Begründung)'}  |  Quelle: ${x.quelle || '(leer)'}`);
}
if (schaeden.length) {
  console.log(`\n--- Integritätsprobleme: ${schaeden.length} ---`);
  for (const s of schaeden) console.log(s);
} else {
  console.log('\nIntegritäts-Check: keine Schäden an Fragetexten/Struktur gefunden.');
}

// ---- Bericht in den Vault ----
let report = `---\ntags: [gesamtquiz, pruefung, auswertung]\nautor: Claude\n---\n\n# Auswertung Gesamtquiz-Prüfung\n\n> Automatisch generiert von \`tools/gesamtquiz-pruefung/auswerten.cjs\` am ${new Date().toISOString().slice(0, 10)}. Nicht von Hand bearbeiten — wird überschrieben.\n\n**Stand:** ${geprueft} von ${byId.size} Fragen geprüft — RICHTIG: ${totals.RICHTIG}, FALSCH: ${totals.FALSCH}, UNSICHER: ${totals.UNSICHER}, offen: ${totals.offen}, unlesbar: ${totals.unlesbar}\n`;
if (findings.length) {
  report += `\n## Zu prüfende Fälle (FALSCH/UNSICHER)\n\n| Frage | Urteil | Begründung (Gwen) | Quelle (Gwen) |\n|---|---|---|---|\n`;
  for (const x of findings) report += `| ${x.id} | ${x.urteil} | ${x.begruendung.replace(/\|/g, '/')} | ${x.quelle.replace(/\|/g, '/')} |\n`;
}
if (schaeden.length) {
  report += `\n## Integritätsprobleme\n\n`;
  for (const s of schaeden) report += `- ${s}\n`;
}
fs.writeFileSync(path.join(VAULT, 'Auswertung.md'), report, 'utf8');
console.log(`\nBericht geschrieben: Ki Datenspeicher/10-Gesamtquiz-Pruefung/Auswertung.md`);

/**
 * Repariert Batch-Dateien, in denen Gwen beim Ausfüllen Fragenblöcke
 * beschädigt hat (z. B. Fragetext/Antwortoptionen gelöscht, weil die Datei
 * komplett neu geschrieben statt gezielt ersetzt wurde).
 *
 * Vorgehen: Jeder Fragenblock wird kanonisch aus der App-JSON neu aufgebaut
 * (Frage, Optionen, Erklärung). Der "Prüfung (Gwen):"-Abschnitt des Blocks
 * wird dabei UNVERÄNDERT aus der bestehenden Datei übernommen — Gwens
 * Urteile/Begründungen/Quellen gehen nicht verloren. Frontmatter (inkl.
 * status) bleibt erhalten. Fehlt ein Prüfungs-Abschnitt, wird der leere
 * ___-Platzhalter-Block eingesetzt.
 *
 * Aufruf:  node tools/gesamtquiz-pruefung/reparieren.cjs [Batch-03] [Batch-07] ...
 *          (ohne Argumente: alle Batch-Dateien)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const VAULT = path.join(ROOT, 'Ki Datenspeicher', '10-Gesamtquiz-Pruefung');
const SRC = path.join(ROOT, 'src', 'assets', 'zusatz', 'gesamtquiz', 'gesamtquiz-alle-module.json');

const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const byId = new Map(data.questions.map((q) => [q.id, q]));

const filter = process.argv.slice(2);
const files = fs.readdirSync(VAULT)
  .filter((f) => /^Batch-\d+\.md$/.test(f))
  .filter((f) => filter.length === 0 || filter.some((a) => f.startsWith(a)))
  .sort();

const EMPTY_PRUEFUNG = '**Prüfung (Gwen):**\n- Urteil: ___ (RICHTIG / FALSCH / UNSICHER)\n- Begründung: ___\n- Quelle: ___\n';

let repaired = 0;
for (const f of files) {
  const full = path.join(VAULT, f);
  const md = fs.readFileSync(full, 'utf8');

  const headerEnd = md.search(/^## Frage \d+ von \d+ — /m);
  if (headerEnd < 0) { console.log(`${f}: keine Fragenblöcke gefunden — übersprungen`); continue; }
  const header = md.slice(0, headerEnd);

  const parts = md.slice(headerEnd).split(/^(?=## Frage \d+ von \d+ — )/m).filter(Boolean);
  let out = header;
  let changed = false;

  parts.forEach((block) => {
    const m = block.match(/^## Frage (\d+) von (\d+) — (\S+)/);
    if (!m) { out += block; return; }
    const [, nr, of, id] = m;
    const q = byId.get(id);
    if (!q) { console.log(`${f}: unbekannte ID ${id} — Block unverändert gelassen`); out += block; return; }

    const pIdx = block.indexOf('**Prüfung (Gwen):**');
    let pruefung;
    if (pIdx >= 0) {
      pruefung = block.slice(pIdx).replace(/\n*---\s*$/s, '\n').replace(/\s+$/s, '\n');
    } else {
      pruefung = EMPTY_PRUEFUNG;
      console.log(`${f} / ${id}: kein Prüfungs-Abschnitt gefunden — leerer Platzhalter eingesetzt`);
    }

    let canon = `## Frage ${nr} von ${of} — ${id}\n\n`;
    canon += `**Frage:** ${q.question}\n\n`;
    for (const c of q.choices) {
      const mark = c.id === q.answer ? ' ← **laut App richtig**' : '';
      canon += `- ${c.id}: ${c.text}${mark}\n`;
    }
    canon += `\n**Erklärung laut App:** ${q.explain}\n\n`;
    canon += pruefung;
    canon += `\n---\n\n`;

    if (canon !== block) changed = true;
    out += canon;
  });

  if (changed) {
    fs.writeFileSync(full, out, 'utf8');
    repaired++;
    console.log(`${f}: repariert/kanonisiert`);
  } else {
    console.log(`${f}: unverändert (schon kanonisch)`);
  }
}
console.log(`\nFertig: ${repaired} Datei(en) geändert.`);

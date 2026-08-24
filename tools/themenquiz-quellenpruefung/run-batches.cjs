/**
 * Orchestriert die Themenquiz-Quellenpruefung: geht alle Themen/Batches der
 * Reihe nach durch, ueberspringt Batches, deren Fragen in der JSON schon
 * ALLE ein source/sourceUrl haben (ground truth, nicht auf Fortschritt.md
 * angewiesen), schreibt fuer offene Batches ein frisches Template
 * (verwirft evtl. vorherigen kaputten/fabrizierten Inhalt), dispatcht per
 * run-gwen-task.cjs, und wendet Ergebnisse sofort per apply-results.cjs an.
 *
 * Aufruf: node tools/themenquiz-quellenpruefung/run-batches.cjs <ANZAHL>
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SRC_DIR = path.join(ROOT, 'src', 'assets', 'themenquiz');
const OUT = path.join(ROOT, 'Ki Datenspeicher', '15-Themenquiz-Quellenpruefung');
const BATCH_SIZE = 5;
const COUNT = parseInt(process.argv[2] || '10', 10);

function writeBatchFile(topicId, title, chunk, batchNum, nb, batchName) {
  let md = `---
tags: [themenquiz, quellenpruefung, gwen]
autor: Claude
topic: ${topicId}
batch: ${batchNum}
---

# ${batchName} von ${title}

**Anweisung für Gwen:** Prüfe per Websuche für jede der ${chunk.length}
Fragen unten, ob die mit "laut App richtig" markierte Antwort fachlich
stimmt, und finde dafür einen echten Link, der das belegt. Beantworte JEDE
Frage einzeln, in der exakt gleichen Reihenfolge wie unten aufgelistet —
lies dabei jedes Mal die Frage und die Antwortoptionen nochmal genau, bevor
du suchst und antwortest, damit du keine Frage mit einer anderen
verwechselst. Schreibe deine Antworten in genau diesem Format, eine Zeile
pro Frage:

\`Frage N (ID): RICHTIG oder FALSCH — Quelle: <volle URL> || <kurze Bezeichnung>\`

Bei UNSICHER (keine verlässliche Quelle gefunden): schreibe
\`Quelle: keine gefunden || keine gefunden\`. **Erfinde niemals eine URL oder
Norm** — eine Quelle zählt nur, wenn du sie in dieser Session wirklich per
Websuche gefunden hast.

---

`;
  chunk.forEach((q, i) => {
    md += `**Frage ${i + 1} (${q.id}):** ${q.question}\n`;
    q.choices.forEach((choiceText, idx) => {
      if (idx === q.correctIndex) md += `Laut App richtig: "${choiceText}"\n`;
    });
    md += `\n`;
  });
  fs.writeFileSync(path.join(OUT, `${batchName}.md`), md, 'utf8');
}

const files = fs
  .readdirSync(SRC_DIR)
  .filter((f) => f.endsWith('.json') && f !== 'topics.json')
  .sort();

let dispatched = 0;
let skippedDone = 0;

outer: for (const file of files) {
  const jsonPath = path.join(SRC_DIR, file);
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const topicId = data.topicId;
  const title = data.title;
  const qs = data.questions;
  const nb = Math.ceil(qs.length / BATCH_SIZE);

  for (let b = 0; b < nb; b++) {
    if (dispatched >= COUNT) break outer;
    const chunk = qs.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const batchNum = b + 1;
    const num = String(batchNum).padStart(2, '0');
    const batchName = `Batch-${topicId}-${num}`;

    const allDone = chunk.every((q) => q.source && q.sourceUrl);
    if (allDone) {
      skippedDone++;
      continue;
    }

    writeBatchFile(topicId, title, chunk, batchNum, nb, batchName);
    const rel = `15-Themenquiz-Quellenpruefung/${batchName}.md`;
    console.log(`\n### [${dispatched + 1}/${COUNT}] ${rel}`);
    try {
      execFileSync('node', ['tools/cline-cli/run-gwen-task.cjs', rel, '--retries', '2', '--timeout', '240'], {
        cwd: ROOT,
        stdio: 'inherit',
      });
    } catch (e) {
      console.log(`(run-gwen-task.cjs meldete Fehlercode, wird trotzdem versucht auszuwerten)`);
    }
    try {
      execFileSync('node', ['tools/themenquiz-quellenpruefung/apply-results.cjs', `${batchName}.md`], {
        cwd: ROOT,
        stdio: 'inherit',
      });
    } catch (e) {
      console.log(`apply-results.cjs Fehler bei ${batchName}: ${e.message}`);
    }
    dispatched++;
  }
}

console.log(`\n=== Fertig: ${dispatched} Batches dispatcht, ${skippedDone} bereits fertige Batches uebersprungen ===`);

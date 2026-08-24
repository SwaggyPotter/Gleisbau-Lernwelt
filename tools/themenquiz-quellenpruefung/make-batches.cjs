/**
 * Exportiert alle Themenquiz-/Lernfeld-Fragen (24 Themen-JSONs unter
 * src/assets/themenquiz/, ohne topics.json) als kleine Batch-Dateien (je 5
 * Fragen) nach "Ki Datenspeicher/15-Themenquiz-Quellenpruefung/".
 *
 * Format bewusst einfach gehalten (nach einem gescheiterten Versuch mit
 * 15 Fragen + 4 Platzhaltern pro Frage: Gwen driftete ab Frage 5 auf
 * erfundene Inhalte). Bei 5 Fragen mit EINER Antwortzeile pro Frage blieb
 * Gwen im Test inhaltlich korrekt. Gwen haengt Ergebnisse typischerweise ans
 * Dateiende an statt sie an Ort und Stelle einzufuegen (bekanntes Verhalten)
 * — apply-results.cjs sucht deshalb im GANZEN Dokument nach
 * "Frage N (id):"-Bloecken, unabhaengig von der Position.
 *
 * ACHTUNG: Ueberschreibt vorhandene Batch-Dateien inklusive bereits
 * eingetragener Gwen-Ergebnisse! Nur fuer den Erst-Export oder einen
 * bewussten Neustart ausfuehren.
 *
 * Aufruf:  node tools/themenquiz-quellenpruefung/make-batches.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SRC_DIR = path.join(ROOT, 'src', 'assets', 'themenquiz');
const OUT = path.join(ROOT, 'Ki Datenspeicher', '15-Themenquiz-Quellenpruefung');
const BATCH_SIZE = 5;

const files = fs
  .readdirSync(SRC_DIR)
  .filter((f) => f.endsWith('.json') && f !== 'topics.json')
  .sort();

fs.mkdirSync(OUT, { recursive: true });

let totalQuestions = 0;
let totalBatches = 0;
const progressByTopic = [];

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(SRC_DIR, file), 'utf8'));
  const topicId = data.topicId;
  const title = data.title;
  const qs = data.questions;
  if (
    qs.some(
      (q) =>
        typeof q.correctIndex !== 'number' ||
        !Array.isArray(q.choices) ||
        typeof q.explanation !== 'string'
    )
  ) {
    throw new Error(`Unerwartetes Fragenformat in ${file}`);
  }

  const nb = Math.ceil(qs.length / BATCH_SIZE);
  const topicProgress = [];

  for (let b = 0; b < nb; b++) {
    const chunk = qs.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const num = String(b + 1).padStart(2, '0');
    const batchName = `Batch-${topicId}-${num}`;
    topicProgress.push(`  - [ ] ${batchName} (${chunk.length} Fragen)`);

    let md = `---
tags: [themenquiz, quellenpruefung, gwen]
autor: Claude
topic: ${topicId}
batch: ${b + 1}
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
        if (idx === q.correctIndex) {
          md += `Laut App richtig: "${choiceText}"\n`;
        }
      });
      md += `\n`;
    });

    fs.writeFileSync(path.join(OUT, `${batchName}.md`), md, 'utf8');
    totalBatches++;
  }

  totalQuestions += qs.length;
  progressByTopic.push(
    `- **${topicId}** — ${title} (${qs.length} Fragen, ${nb} Batches)\n${topicProgress.join('\n')}`
  );
}

const fortschritt = `---
tags: [themenquiz, quellenpruefung, fortschritt]
autor: Claude
---

# Fortschritt Themenquiz-Quellenprüfung

${totalQuestions} Fragen in ${totalBatches} Batches über 24 Themen (10
Wissenstests + 14 Lernfelder), je bis zu ${BATCH_SIZE} Fragen pro Batch
(bewusst klein gehalten, siehe Kommentar in make-batches.cjs). Diese Liste
wird von \`apply-results.cjs\` automatisch abgehakt, sobald ALLE Fragen
eines Batches erfolgreich in die App-JSON übernommen wurden.

${progressByTopic.join('\n')}
`;
fs.writeFileSync(path.join(OUT, 'Fortschritt.md'), fortschritt, 'utf8');

console.log(`OK: ${totalBatches} Batch-Dateien + Fortschritt.md geschrieben (${totalQuestions} Fragen, ${files.length} Themen).`);

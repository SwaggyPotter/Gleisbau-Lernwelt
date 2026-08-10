/**
 * Exportiert die 427 Gesamtquiz-Fragen aus der App-JSON als Batch-Dateien
 * (à 10 Fragen) nach "Ki Datenspeicher/10-Gesamtquiz-Pruefung/", damit Gwen
 * sie pro Chat-Session einzeln prüfen kann (~17k-Token-Kontextlimit).
 *
 * ACHTUNG: Überschreibt vorhandene Batch-Dateien inklusive bereits
 * eingetragener Gwen-Prüfergebnisse! Nur für den Erst-Export oder einen
 * bewussten Neustart der Prüfung ausführen.
 *
 * Aufruf:  node tools/gesamtquiz-pruefung/make-batches.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src', 'assets', 'zusatz', 'gesamtquiz', 'gesamtquiz-alle-module.json');
const OUT = path.join(ROOT, 'Ki Datenspeicher', '10-Gesamtquiz-Pruefung');
const BATCH_SIZE = 10;

const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const qs = data.questions;
if (qs.some((q) => q.type !== 'mcq_single' || typeof q.answer !== 'string' || !q.explain)) {
  throw new Error('Unerwartetes Fragenformat');
}

fs.mkdirSync(OUT, { recursive: true });

const nb = Math.ceil(qs.length / BATCH_SIZE);
const progress = [];

for (let b = 0; b < nb; b++) {
  const chunk = qs.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
  const num = String(b + 1).padStart(2, '0');
  const first = chunk[0].id;
  const last = chunk[chunk.length - 1].id;
  progress.push(`- [ ] Batch-${num} (${first} bis ${last})`);

  let md = `---
tags: [gesamtquiz, pruefung, gwen]
autor: Claude
status: offen
batch: ${b + 1}
fragen: ${first} bis ${last}
---

# Batch ${b + 1} von ${nb} — Gesamtquiz-Prüfung (${first} bis ${last})

**Kurzanweisung für Gwen** (Details: [[00-Anweisung-für-Gwen]]):
Prüfe per Websuche für jede der ${chunk.length} Fragen, ob die mit "laut App richtig"
markierte Antwort fachlich stimmt. Fülle **nur** die \`___\`-Platzhalter unter
"Prüfung (Gwen)" aus — verändere und lösche sonst nichts (keine Fragen, keine
Antwortoptionen, nicht diese Anweisung). Findest du keine verlässliche Quelle,
schreib als Urteil \`UNSICHER\` und als Quelle \`keine gefunden\`. Erfinde niemals
Normen oder Quellen. Wenn alle ${chunk.length} Fragen geprüft sind, ändere oben im
Frontmatter \`status: offen\` zu \`status: geprüft (von Gwen)\` — sonst zu
\`status: unvollständig (von Gwen)\`.

---

`;

  chunk.forEach((q, i) => {
    md += `## Frage ${i + 1} von ${chunk.length} — ${q.id}\n\n`;
    md += `**Frage:** ${q.question}\n\n`;
    for (const c of q.choices) {
      const mark = c.id === q.answer ? ' ← **laut App richtig**' : '';
      md += `- ${c.id}: ${c.text}${mark}\n`;
    }
    md += `\n**Erklärung laut App:** ${q.explain}\n\n`;
    md += `**Prüfung (Gwen):**\n`;
    md += `- Urteil: ___ (RICHTIG / FALSCH / UNSICHER)\n`;
    md += `- Begründung: ___\n`;
    md += `- Quelle: ___\n\n`;
    md += `---\n\n`;
  });

  fs.writeFileSync(path.join(OUT, `Batch-${num}.md`), md, 'utf8');
}

const fortschritt = `---
tags: [gesamtquiz, pruefung, fortschritt]
autor: Claude
---

# Fortschritt Gesamtquiz-Prüfung

${qs.length} Fragen in ${nb} Batches à ${BATCH_SIZE} Fragen. Diese Liste pflegen
**Tim oder Claude** (Haken setzen, wenn ein Batch fertig geprüft UND von Claude
gegengelesen ist). **Gwen: diese Datei bitte nicht bearbeiten.**

Status je Batch steht zusätzlich im Frontmatter der jeweiligen Batch-Datei
(\`offen\` / \`geprüft (von Gwen)\` / \`unvollständig (von Gwen)\`).

${progress.join('\n')}
`;
fs.writeFileSync(path.join(OUT, 'Fortschritt.md'), fortschritt, 'utf8');

console.log(`OK: ${nb} Batch-Dateien + Fortschritt.md geschrieben (${qs.length} Fragen).`);

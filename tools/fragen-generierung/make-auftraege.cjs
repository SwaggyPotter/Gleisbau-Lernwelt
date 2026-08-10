/**
 * Erzeugt pro Themenquiz-Thema (nur die 10 Gleisbau-Themen, keine lfXX-
 * Lernfelder) eine Auftrags-Datei fuer Gwen in
 * "Ki Datenspeicher/11-Fragen-Generierung/":
 * bestehende Fragen (gegen Duplikate) + Format-Vorlage fuer neue Fragen.
 *
 * Bestehende Auftrags-Dateien werden NICHT ueberschrieben (dort koennten
 * schon Gwen-Fragen drinstehen) — zum Neuerzeugen Datei vorher loeschen.
 *
 * Aufruf:  node tools/fragen-generierung/make-auftraege.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const ASSETS = path.join(ROOT, 'src', 'assets', 'themenquiz');
const OUT = path.join(ROOT, 'Ki Datenspeicher', '11-Fragen-Generierung');

const topics = JSON.parse(fs.readFileSync(path.join(ASSETS, 'topics.json'), 'utf8'))
  .filter((t) => !/^lf\d{2}$/.test(t.topicId));

fs.mkdirSync(OUT, { recursive: true });

let created = 0;
for (const t of topics) {
  const file = path.join(OUT, `Auftrag-${t.topicId}.md`);
  if (fs.existsSync(file)) { console.log(`Auftrag-${t.topicId}.md existiert schon — uebersprungen`); continue; }

  const quiz = JSON.parse(fs.readFileSync(path.join(ASSETS, `${t.topicId}.json`), 'utf8'));
  const vorhandene = quiz.questions
    .map((q, i) => `${i + 1}. ${q.question} *(Richtig: ${q.choices[q.correctIndex]})*`)
    .join('\n');

  const md = `---
tags: [fragen-generierung, gwen]
autor: Claude
status: offen
topic: ${t.topicId}
ziel: 15-25 neue Fragen
---

# Fragen-Auftrag: ${t.title}

**Thema:** ${t.description}

**Kurzanweisung fuer Gwen** (Details: [[00-Anweisung-für-Gwen]]):
Recherchiere per Websuche zu diesem Thema und erstelle **15 bis 25 neue
Quizfragen** im Format unten. Jede Frage muss sich auf eine Quelle stuetzen,
die du in DIESER Session per Websuche gefunden hast. Trage neue Fragen
AUSSCHLIESSLICH unter "Neue Fragen von Gwen" am Dateiende ein — veraendere
nichts anderes in dieser Datei. Wenn du fertig bist, aendere oben im
Frontmatter \`status: offen\` zu \`status: fertig (von Gwen)\`.

## Bereits vorhandene Fragen (NICHT duplizieren)

${vorhandene}

## Format fuer neue Fragen (genau so, ein Block pro Frage)

\`\`\`
### Neue Frage 1
- Frage: <Fragetext>
- A: <Antwortoption>
- B: <Antwortoption>
- C: <Antwortoption>
- D: <Antwortoption>
- Richtig: <A, B, C oder D>
- Erklaerung: <1-2 Saetze, warum die richtige Antwort stimmt>
- Quelle: <URL oder exakte Norm-/Regelwerksbezeichnung>
\`\`\`

## Neue Fragen von Gwen

(hier anfuegen)
`;
  fs.writeFileSync(file, md, 'utf8');
  created++;
  console.log(`Auftrag-${t.topicId}.md: ${quiz.questions.length} vorhandene Fragen gelistet — ${t.title}`);
}
console.log(`\nOK: ${created} Auftrags-Dateien erzeugt in 11-Fragen-Generierung/.`);

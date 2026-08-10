/**
 * Liest Gwens neue Fragen aus den Auftrags-Dateien in
 * "Ki Datenspeicher/11-Fragen-Generierung/", validiert sie und arbeitet sie
 * (nur mit --merge) in die Themenquiz-JSONs der App ein.
 *
 * Ohne --merge: reiner Pruefbericht (Anzahl gueltig/fehlerhaft, Duplikate,
 * fehlende Felder) — nichts wird geschrieben.
 * Mit --merge: gueltige Fragen werden an src/assets/themenquiz/<topic>.json
 * angehaengt (IDs <topic>-g1, -g2, …), questionCount in topics.json wird
 * aktualisiert. Danach die neuen Zaehler auch in dashboard.page.ts
 * nachziehen (Skript gibt sie aus).
 *
 * Aufruf:  node tools/fragen-generierung/einarbeiten.cjs [--merge]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const ASSETS = path.join(ROOT, 'src', 'assets', 'themenquiz');
const AUFTRAEGE = path.join(ROOT, 'Ki Datenspeicher', '11-Fragen-Generierung');
const MERGE = process.argv.includes('--merge');

const normalize = (s) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9äöüß ]/gi, '').trim();

const files = fs.readdirSync(AUFTRAEGE).filter((f) => /^Auftrag-.+\.md$/.test(f)).sort();
let totalOk = 0;
let totalErr = 0;

for (const f of files) {
  const md = fs.readFileSync(path.join(AUFTRAEGE, f), 'utf8');
  const topicId = (md.match(/^topic:\s*(\S+)/m) || [])[1];
  const status = (md.match(/^status:\s*(.+?)\s*$/m) || [])[1] || '?';
  if (!topicId) { console.log(`${f}: kein topic im Frontmatter — uebersprungen`); continue; }
  if (status === 'eingearbeitet') { console.log(`${f} [eingearbeitet]: schon gemergt — uebersprungen`); continue; }

  const sectionIdx = md.indexOf('## Neue Fragen von Gwen');
  const section = sectionIdx >= 0 ? md.slice(sectionIdx) : '';
  const blocks = section.split(/^### /m).slice(1);
  if (!blocks.length) { console.log(`${f} [${status}]: keine neuen Fragen`); continue; }

  const quizPath = path.join(ASSETS, `${topicId}.json`);
  const quiz = JSON.parse(fs.readFileSync(quizPath, 'utf8'));
  const bekannt = new Set(quiz.questions.map((q) => normalize(q.question)));
  const gueltig = [];
  const fehler = [];

  const nextIdNum = quiz.questions.filter((q) => q.id.startsWith(`${topicId}-g`)).length + 1;

  blocks.forEach((block, i) => {
    const get = (key) => {
      const m = block.match(new RegExp(`^[-*]\\s*${key}:\\s*(.+)$`, 'm'));
      return m ? m[1].trim() : '';
    };
    const frage = get('Frage');
    const optionen = ['A', 'B', 'C', 'D'].map((k) => get(k));
    const richtig = get('Richtig').toUpperCase().charAt(0);
    const erklaerung = get('Erkl(?:ae|ä)rung');
    const quelle = get('Quelle');

    const probleme = [];
    if (!frage) probleme.push('Frage fehlt');
    if (optionen.some((o) => !o)) probleme.push('nicht alle 4 Optionen vorhanden');
    if (!'ABCD'.includes(richtig) || !richtig) probleme.push(`Richtig="${get('Richtig')}" ungueltig`);
    if (!erklaerung) probleme.push('Erklaerung fehlt');
    if (!quelle || /^keine/i.test(quelle)) probleme.push('Quelle fehlt');
    if (frage && bekannt.has(normalize(frage))) probleme.push('Duplikat einer vorhandenen Frage');

    if (probleme.length) {
      fehler.push(`  Block ${i + 1} ("${frage.slice(0, 50) || '?'}"): ${probleme.join('; ')}`);
    } else {
      bekannt.add(normalize(frage));
      gueltig.push({
        id: `${topicId}-g${nextIdNum + gueltig.length}`,
        question: frage,
        choices: optionen,
        correctIndex: 'ABCD'.indexOf(richtig),
        explanation: erklaerung,
        _quelle: quelle,
      });
    }
  });

  totalOk += gueltig.length;
  totalErr += fehler.length;
  console.log(`${f} [${status}]: ${gueltig.length} gueltig, ${fehler.length} fehlerhaft`);
  fehler.forEach((e) => console.log(e));

  if (MERGE && gueltig.length) {
    quiz.questions.push(...gueltig.map(({ _quelle, ...q }) => q));
    fs.writeFileSync(quizPath, JSON.stringify(quiz, null, 2) + '\n', 'utf8');

    const topicsPath = path.join(ASSETS, 'topics.json');
    const topics = JSON.parse(fs.readFileSync(topicsPath, 'utf8'));
    const entry = topics.find((t) => t.topicId === topicId);
    if (entry) entry.questionCount = quiz.questions.length;
    fs.writeFileSync(topicsPath, JSON.stringify(topics, null, 2) + '\n', 'utf8');
    console.log(`  → eingearbeitet: ${topicId}.json hat jetzt ${quiz.questions.length} Fragen (dashboard.page.ts questionCount nachziehen!)`);
  }
}

console.log(`\nGesamt: ${totalOk} gueltige neue Fragen, ${totalErr} fehlerhafte Bloecke.${MERGE ? '' : ' (Pruefmodus — nichts geschrieben, --merge zum Einarbeiten)'}`);

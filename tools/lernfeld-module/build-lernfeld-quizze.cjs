/**
 * Generiert aus dem Gesamtquiz-Datenbestand (427 Fragen, LF01–LF14) je ein
 * Themenquiz-Modul pro Lernfeld:
 *
 *   src/assets/themenquiz/lf01.json … lf14.json   (Format: ThemenquizFile)
 *   src/assets/themenquiz/topics.json             (14 Lernfeld-Einträge ergänzt)
 *
 * Einzige Datenquelle ist gesamtquiz-alle-module.json — wenn dort nach der
 * Gwen-Prüfung Fehler korrigiert werden, dieses Skript einfach erneut
 * ausführen, dann sind die Lernfeld-Module wieder synchron.
 *
 * Fragen mit Präfix "ZUSATZ-" werden übersprungen (Duplikate des
 * Nivellieren-Zusatzmoduls).
 *
 * Aufruf:  node tools/lernfeld-module/build-lernfeld-quizze.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src', 'assets', 'zusatz', 'gesamtquiz', 'gesamtquiz-alle-module.json');
const OUT_DIR = path.join(ROOT, 'src', 'assets', 'themenquiz');
const TOPICS = path.join(OUT_DIR, 'topics.json');

// Titel/Beschreibungen: offizielle Lernfeld-Liste des Projekts (Quelle:
// backend/src/index.ts Seed), Schreibweise ae/oe/ue wie im restlichen Frontend.
const LERNFELDER = {
  LF01: { topicId: 'lf01', title: 'Baustellen einrichten', description: 'Lernfeld 1, Jahr 1: Sicherheit, Organisation, Baustelleneinrichtung.' },
  LF02: { topicId: 'lf02', title: 'Bauwerke erschliessen und gruenden', description: 'Lernfeld 2, Jahr 1: Erschliessung, Fundamente, Baugrund.' },
  LF03: { topicId: 'lf03', title: 'Einschalige Baukoerper mauern', description: 'Lernfeld 3, Jahr 1: Mauerwerk, Steine, Verbaende.' },
  LF04: { topicId: 'lf04', title: 'Stahlbetonbauteile herstellen', description: 'Lernfeld 4, Jahr 1: Schalung, Bewehrung, Beton.' },
  LF05: { topicId: 'lf05', title: 'Holzkonstruktionen herstellen', description: 'Lernfeld 5, Jahr 1: Holzbauteile, Verbindungen, Montage.' },
  LF06: { topicId: 'lf06', title: 'Bauteile beschichten und bekleiden', description: 'Lernfeld 6, Jahr 1: Schutz, Abdichtung, Oberflaechen.' },
  LF07: { topicId: 'lf07', title: 'Baugruende erkunden', description: 'Lernfeld 7, Jahr 2: Bodenarten, Tragfaehigkeit, Baugrunduntersuchung.' },
  LF08: { topicId: 'lf08', title: 'Erdbauwerke errichten', description: 'Lernfeld 8, Jahr 2: Aushub, Verbau, Planum, Verdichtung.' },
  LF09: { topicId: 'lf09', title: 'Verkehrsflaechen aus Pflaster- und Plattenbelaegen herstellen', description: 'Lernfeld 9, Jahr 2: Wege, Flaechen, Unterbau.' },
  LF10: { topicId: 'lf10', title: 'Gleisanlagen neu bauen', description: 'Lernfeld 10, Jahr 2: Gleisaufbau, Schotter, Schwellen, Schienen.' },
  LF11: { topicId: 'lf11', title: 'Gleisboegen herstellen und einmessen', description: 'Lernfeld 11, Jahr 3: Vermessung, Gleislage, Radien.' },
  LF12: { topicId: 'lf12', title: 'Weichen montieren und einmessen', description: 'Lernfeld 12, Jahr 3: Weichenarten, Einbau, Kontrolle.' },
  LF13: { topicId: 'lf13', title: 'Weichen bauen und instand halten', description: 'Lernfeld 13, Jahr 3: Weichenaufbau, Instandhaltung, sichere Weichenarbeit.' },
  LF14: { topicId: 'lf14', title: 'Sonderbauformen und besondere Gleisanlagen', description: 'Lernfeld 14, Jahr 3: Sonderbauformen, Bahnuebergaenge, feste Fahrbahn.' },
};

const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const byLf = new Map(Object.keys(LERNFELDER).map((k) => [k, []]));
let skipped = 0;
for (const q of data.questions) {
  const prefix = q.id.split('-')[0];
  if (!byLf.has(prefix)) { skipped++; continue; }

  const choices = q.choices.map((c) => c.text);
  const correctIndex = q.choices.findIndex((c) => c.id === q.answer);
  if (correctIndex < 0) throw new Error(`${q.id}: answer "${q.answer}" nicht in choices`);

  byLf.get(prefix).push({
    id: q.id,
    question: q.question,
    choices,
    correctIndex,
    explanation: q.explain,
  });
}

const newTopics = [];
for (const [prefix, meta] of Object.entries(LERNFELDER)) {
  const questions = byLf.get(prefix);
  if (!questions.length) throw new Error(`${prefix}: keine Fragen gefunden`);
  const file = { topicId: meta.topicId, title: meta.title, questions };
  fs.writeFileSync(path.join(OUT_DIR, `${meta.topicId}.json`), JSON.stringify(file, null, 2) + '\n', 'utf8');
  newTopics.push({ topicId: meta.topicId, title: meta.title, description: meta.description, questionCount: questions.length });
  console.log(`${meta.topicId}.json: ${questions.length} Fragen — ${meta.title}`);
}

const topics = JSON.parse(fs.readFileSync(TOPICS, 'utf8'));
const kept = topics.filter((t) => !/^lf\d{2}$/.test(t.topicId));
fs.writeFileSync(TOPICS, JSON.stringify([...kept, ...newTopics], null, 2) + '\n', 'utf8');

const total = newTopics.reduce((s, t) => s + t.questionCount, 0);
console.log(`\nOK: ${newTopics.length} Lernfeld-Module mit ${total} Fragen, ${skipped} ZUSATZ-Fragen übersprungen.`);
console.log(`topics.json: ${kept.length} bestehende + ${newTopics.length} Lernfeld-Einträge.`);

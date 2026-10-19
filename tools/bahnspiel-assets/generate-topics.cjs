'use strict';
// Erzeugt pro Thema aus topics.cjs eine Vault-Datei. Ueberschreibt NIE vorhandene Dateien.
const fs = require('fs');
const path = require('path');
const topics = require('./topics.cjs');
const DIR = path.join(__dirname, '..', '..', 'Ki Datenspeicher', '20-Bahnspiel-3D-Assets', 'Themen');
fs.mkdirSync(DIR, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
let n = 0;
for (const [id, slug, title, qs] of topics) {
  const f = path.join(DIR, `${id}-${slug}.md`);
  if (fs.existsSync(f)) continue;
  const body = `---
tags: [wissensbibliothek, thema/bahnspiel-3d]
autor: Claude
status: offen
---

# ${id} ${title}

Teil der [[20-Bahnspiel-3D-Assets/00-Index|Bahnspiel-3D-Assets]].

## Fragen für die Recherche

_(von Claude, ${today})_

${qs.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## 🔎 Rechercheergebnisse von Gwen

_(noch leer)_
`;
  fs.writeFileSync(f, body);
  n++;
}
console.log('neu angelegt:', n, 'von', topics.length);

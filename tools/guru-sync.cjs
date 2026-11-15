#!/usr/bin/env node
/**
 * Gleisbau-Guru → Obsidian-Vault (2026-11-13)
 *
 * Holt alle Notizen aus dem Gehirn des Bahn-Guru (Tabelle guru_notizen auf dem michiserver, NUR lesend)
 * und schreibt sie als Markdown-Dateien nach „Ki Datenspeicher/21-Gleisbau-Guru/“ – gleiche Ordner,
 * [[Verknüpfungen]] funktionieren dann direkt in Obsidian. Grundlage für die Wochen-Durchsicht (Claude + Tim).
 *
 * Aufruf: node tools/guru-sync.cjs           (alles holen, verschwundene Notizen bleiben als _entfernt markiert)
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ZIEL = path.join(__dirname, '..', 'Ki Datenspeicher', '21-Gleisbau-Guru');
const SQL = "SELECT coalesce(json_agg(json_build_object('pfad', pfad, 'inhalt', inhalt, 'geaendert', geaendert_am) ORDER BY pfad), '[]') FROM guru_notizen";
const roh = execFileSync('ssh', ['swaggypotter@192.168.0.102',
  `docker exec gleisbau-db-1 sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -c "${SQL.replace(/'/g, "'\\''")}"'`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const notizen = JSON.parse(roh.trim() || '[]');

fs.mkdirSync(ZIEL, { recursive: true });
const geschrieben = new Set();
for (const n of notizen) {
  const rel = String(n.pfad).split('/').map((t) => t.replace(/[<>:"|?*\\]/g, '_')).join(path.sep);
  const datei = path.join(ZIEL, rel);
  if (!datei.startsWith(ZIEL)) continue;
  fs.mkdirSync(path.dirname(datei), { recursive: true });
  const text = `---\nquelle: gleisbau-guru\ngeaendert: ${n.geaendert}\n---\n\n${n.inhalt}\n`;
  if (!fs.existsSync(datei) || fs.readFileSync(datei, 'utf8') !== text) fs.writeFileSync(datei, text, 'utf8');
  geschrieben.add(path.resolve(datei));
}

const index = ['# Gleisbau-Guru – Gehirn (Spiegel)', '', `Stand: ${new Date().toLocaleString('de-DE')} · ${notizen.length} Notizen`, '',
  'Automatisch gespiegelt mit `node tools/guru-sync.cjs`. Änderungen hier gehen NICHT zurück an den Server – im Guru (Admin → 🤖 Guru) bearbeiten.', '',
  ...notizen.map((n) => `- [[${String(n.pfad).replace(/\.md$/, '')}]]`)].join('\n');
fs.writeFileSync(path.join(ZIEL, '_Übersicht.md'), index + '\n', 'utf8');
console.log(`${notizen.length} Notizen nach ${ZIEL} gespiegelt.`);

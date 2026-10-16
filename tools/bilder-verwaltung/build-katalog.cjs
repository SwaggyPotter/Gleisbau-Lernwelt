/**
 * Baut src/assets/bilder-katalog.json: alle Bilder, die in der Bilder-Verwaltung
 * (Konto -> Bilder, nur Admin) beurteilt werden koennen.
 *   - quelle "foto": Tims Gelaendefotos, Beschreibung/Kategorie aus dem Vault-
 *     Inventar (Ki Datenspeicher/18-Bildbedarf-Gleisbau/20-Foto-Inventar-Tim.md)
 *   - quelle "app": alle Eintraege aus src/assets/bilder/bildnachweise.json
 *     (Wikimedia-Hotlinks der Themenquiz-Fragen etc.)
 * Aufruf: node tools/bilder-verwaltung/build-katalog.cjs
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const inv = fs.readFileSync(path.join(ROOT, 'Ki Datenspeicher/18-Bildbedarf-Gleisbau/20-Foto-Inventar-Tim.md'), 'utf8');
const nachweise = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/assets/bilder/bildnachweise.json'), 'utf8'));

const eintraege = [];
for (const line of inv.split('\n')) {
  const m = /^\| (F\d{3}) \| [^|]+ \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/.exec(line.trim());
  if (!m) continue;
  const [, id, zeigt, kategorie, sicherheit] = m;
  eintraege.push({
    id,
    quelle: 'foto',
    url: `assets/bilder-tim/${id}.jpg`,
    beschreibung: zeigt.trim(),
    kategorieVorschlag: kategorie.trim(),
    hinweis: sicherheit.trim(),
    credit: 'Eigenes Foto (Tim)',
  });
}
for (const b of nachweise) {
  eintraege.push({
    id: `app:${b.key}`,
    quelle: 'app',
    url: b.file,
    beschreibung: b.key,
    kategorieVorschlag: '',
    credit: b.credit,
    lizenz: b.license,
    sourceUrl: b.sourceUrl,
  });
}
fs.writeFileSync(path.join(ROOT, 'src/assets/bilder-katalog.json'), JSON.stringify(eintraege, null, 1));
console.log(`${eintraege.filter(e => e.quelle === 'foto').length} Fotos + ${eintraege.filter(e => e.quelle === 'app').length} App-Bilder`);

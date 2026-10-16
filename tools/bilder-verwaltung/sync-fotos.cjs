/**
 * Holt die in der Bilder-Verwaltung hochgeladenen Fotos und Entscheidungen vom Server
 * und legt sie im Vault ab:
 *   Ki Datenspeicher/18-Bildbedarf-Gleisbau/fotos-upload/U<id>.jpg   (Vollbild)
 *   Ki Datenspeicher/18-Bildbedarf-Gleisbau/30-Entscheidungen.md     (Tabelle)
 *
 * Aufruf (Zugangsdaten nur per Umgebungsvariable, nie speichern):
 *   set BV_EMAIL=...  &&  set BV_PASSWORD=...  &&  node tools/bilder-verwaltung/sync-fotos.cjs
 * Der Login-Endpunkt wird aus backend/src/routes/auth.ts erwartet: POST /api/auth/login.
 */
const fs = require('fs');
const path = require('path');

const API = 'https://api.gleisbau-digital.org/api';
const OUT = path.join(__dirname, '..', '..', 'Ki Datenspeicher', '18-Bildbedarf-Gleisbau');

async function api(p, token, opts = {}) {
  const res = await fetch(API + p, { ...opts, headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error(`${p}: HTTP ${res.status}`);
  return res;
}

(async () => {
  const email = process.env.BV_EMAIL, password = process.env.BV_PASSWORD;
  if (!email || !password) throw new Error('BV_EMAIL und BV_PASSWORD setzen');
  const login = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (!login.ok) throw new Error(`Login fehlgeschlagen: HTTP ${login.status}`);
  const { token } = await login.json();

  const { photos } = await (await api('/photos', token)).json();
  const { reviews } = await (await api('/image-reviews', token)).json();

  fs.mkdirSync(path.join(OUT, 'fotos-upload'), { recursive: true });
  let neu = 0;
  for (const f of photos) {
    const file = path.join(OUT, 'fotos-upload', `U${f.id}.jpg`);
    if (fs.existsSync(file)) continue;
    const buf = Buffer.from(await (await api(`/photos/${f.id}/full`, token)).arrayBuffer());
    fs.writeFileSync(file, buf);
    neu++;
  }

  const label = { keep: 'behalten', remove: 'entfernen', unsure: 'unsicher' };
  const rows = reviews
    .map(r => `| ${r.imageId} | ${label[r.decision] || 'offen'} | ${r.category || ''} | ${(r.note || '').replace(/\|/g, '/').replace(/\n/g, ' ')} | ${r.updatedAt} |`)
    .join('\n');
  fs.writeFileSync(path.join(OUT, '30-Entscheidungen.md'),
`---
tags: [bildmaterial, entscheidungen]
autor: Claude
status: automatisch erzeugt (sync-fotos.cjs)
---

# Bild-Entscheidungen aus der Bilder-Verwaltung

Stand: ${new Date().toISOString()} -- ${photos.length} hochgeladene Fotos, ${reviews.length} Entscheidungen.

| Bild | Entscheidung | Kategorie | Notiz | Geändert |
|---|---|---|---|---|
${rows}
`);
  console.log(`${neu} neue Fotos geladen, ${reviews.length} Entscheidungen geschrieben.`);
})().catch(e => { console.error(e.message); process.exit(1); });

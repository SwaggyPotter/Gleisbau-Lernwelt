/**
 * Einmaliges Hilfsskript: laedt die 12 bereits recherchierten, lizenzgepruften
 * Wikimedia-Commons-Bilder aus "Ki Datenspeicher/12-Bildmaterial/00-Bildkandidaten.md"
 * herunter (ueber die Special:FilePath-Weiterleitung, die serverseitig auf
 * eine handliche Breite skaliert) und legt sie unter src/assets/bilder/ ab.
 *
 * Aufruf: node tools/cline-cli/download-bildkandidaten.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_DIR = path.join(__dirname, '..', '..', 'src', 'assets', 'bilder');
fs.mkdirSync(OUT_DIR, { recursive: true });

const IMAGES = [
  { key: 'grundlagen', commonsFile: 'Gleisbau_in_Schoenberg_(1).jpg', credit: 'Siegbert Brey (Snoopy1964), CC BY-SA 4.0, via Wikimedia Commons', license: 'CC BY-SA 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gleisbau_in_Schoenberg_(1).jpg' },
  { key: 'spurweite', commonsFile: 'Genshagener_Heide-Kurve.JPG', credit: 'Global Fish, CC BY-SA 3.0, via Wikimedia Commons', license: 'CC BY-SA 3.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Genshagener_Heide-Kurve.JPG' },
  { key: 'schiene', commonsFile: 'Thermite_rail_welding_33.jpg', credit: 'Cjp24, CC BY-SA 4.0, via Wikimedia Commons', license: 'CC BY-SA 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Thermite_rail_welding_33.jpg' },
  { key: 'schwellen', commonsFile: 'Eisenbahnschienen_mit_Betonschwellen.jpg', credit: 'Noebse, CC BY-SA 4.0, via Wikimedia Commons', license: 'CC BY-SA 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Eisenbahnschienen_mit_Betonschwellen.jpg' },
  { key: 'bettung', commonsFile: 'Workers_manually_levelling_gravel_(Ballast)_in_the_railway_track,_Tamil_Nadu_01.jpg', credit: 'PJeganathan, CC BY-SA 4.0, via Wikimedia Commons', license: 'CC BY-SA 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Workers_manually_levelling_gravel_(Ballast)_in_the_railway_track,_Tamil_Nadu_01.jpg' },
  { key: 'kleineisen', commonsFile: 'Clamp_4401.jpg', credit: 'Chris Light, CC BY-SA 4.0, via Wikimedia Commons', license: 'CC BY-SA 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Clamp_4401.jpg' },
  { key: 'handwerkzeuge', commonsFile: 'SOUTHERN_RAILWAY_RIGHT-OF-WAY_WORK_CREW_JACK_UP_A_RAIL_THEY_ARE_REMOVING_OLD_TIES_AND_REPLACING_THEM_WITH_NEW_ONES..._-_NARA_-_556898.jpg', credit: 'US-Bundesbehoerde (NARA) - gemeinfrei', license: 'Public Domain', sourceUrl: 'https://commons.wikimedia.org/wiki/File:SOUTHERN_RAILWAY_RIGHT-OF-WAY_WORK_CREW_JACK_UP_A_RAIL_THEY_ARE_REMOVING_OLD_TIES_AND_REPLACING_THEM_WITH_NEW_ONES..._-_NARA_-_556898.jpg' },
  { key: 'kleingeraete', commonsFile: 'Work_on_the_railway_line_-_fitting_a_fishplate_-_geograph.org.uk_-_1754311.jpg', credit: 'Evelyn Simak, CC BY-SA 2.0, via Wikimedia Commons/Geograph', license: 'CC BY-SA 2.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Work_on_the_railway_line_-_fitting_a_fishplate_-_geograph.org.uk_-_1754311.jpg' },
  { key: 'messmittel', commonsFile: 'Measurement_Trolley_832.jpg', credit: 'Chen Melling, CC BY-SA 4.0, via Wikimedia Commons', license: 'CC BY-SA 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Measurement_Trolley_832.jpg' },
  { key: 'trassenplan', commonsFile: 'Railway_bridge,_Fiesby_Curve,_aerial_2018_-_geograph.org.uk_-_5661711.jpg', credit: 'Chris (geograph.org.uk), CC BY-SA 2.0', license: 'CC BY-SA 2.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Railway_bridge,_Fiesby_Curve,_aerial_2018_-_geograph.org.uk_-_5661711.jpg' },
  { key: 'dashboard-header', commonsFile: '2019_Cogload_Junction_renewal_-_ballast_excavators_(66558).JPG', credit: 'Geof Sheppard, CC BY-SA 4.0, via Wikimedia Commons', license: 'CC BY-SA 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:2019_Cogload_Junction_renewal_-_ballast_excavators_(66558).JPG' },
  { key: 'materialrechner', commonsFile: 'Loading_bay_at_Hakkila_rail_yard_in_Vantaa,_Finland,_2021.jpg', credit: 'Coen, CC BY-SA 4.0, via Wikimedia Commons', license: 'CC BY-SA 4.0', sourceUrl: 'https://commons.wikimedia.org/wiki/File:Loading_bay_at_Hakkila_rail_yard_in_Vantaa,_Finland,_2021.jpg' },
];

const WIDTH = 900;

const REQUEST_HEADERS = {
  'User-Agent': 'GleisbauLernwelt/1.0 (Bildungsprojekt, nicht kommerziell; Kontakt: siehe Ki Datenspeicher/12-Bildmaterial)',
};

function download(url, destPath, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: REQUEST_HEADERS }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirectsLeft > 0) {
        res.resume();
        download(res.headers.location, destPath, redirectsLeft - 1).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} fuer ${url}`));
        return;
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
      file.on('error', reject);
    }).on('error', reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const manifestPath = path.join(OUT_DIR, 'bildnachweise.json');
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : [];
  const already = new Set(manifest.map((m) => m.key));

  for (const img of IMAGES) {
    if (already.has(img.key)) { console.log(`-   ${img.key} bereits vorhanden, ueberspringe`); continue; }

    const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(img.commonsFile)}?width=${WIDTH}`;
    const ext = path.extname(img.commonsFile).toLowerCase() === '.jpeg' ? '.jpg' : (path.extname(img.commonsFile).toLowerCase() || '.jpg');
    const filename = `${img.key}${ext}`;
    const dest = path.join(OUT_DIR, filename);
    let ok = false;
    for (let attempt = 1; attempt <= 4 && !ok; attempt++) {
      try {
        await download(url, dest);
        const size = fs.statSync(dest).size;
        console.log(`OK  ${filename}  (${(size / 1024).toFixed(0)} KB)`);
        manifest.push({ key: img.key, file: `assets/bilder/${filename}`, credit: img.credit, license: img.license, sourceUrl: img.sourceUrl });
        ok = true;
      } catch (err) {
        console.error(`Versuch ${attempt} fuer ${img.key} fehlgeschlagen: ${err.message}`);
        if (attempt < 4) await sleep(45000);
      }
    }
    if (!ok) console.error(`FEHLER: ${img.key} endgueltig nicht geladen.`);
    await sleep(30000);
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n${manifest.length}/${IMAGES.length} Bilder insgesamt vorhanden. Manifest: src/assets/bilder/bildnachweise.json`);
}

main();

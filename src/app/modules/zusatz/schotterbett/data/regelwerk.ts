/**
 * Regelwerte Schotteroberbau nach DB-Richtlinie 820.2010 "Ausrüstungsstandard
 * Schotteroberbau für Gleise und Weichen". Die Ril selbst ist nicht frei
 * veröffentlicht; die Werte stammen aus frei zugänglichen Dokumenten, die sie
 * zitieren (siehe QUELLEN, Recherche 2026-11-03 in
 * Ki Datenspeicher/08-Recherche-Gwen/16-Schotterberechnungstabellen.md).
 */

export interface Quelle {
  id: string;
  titel: string;
  url: string;
  belegt: string;
}

export const QUELLEN: Quelle[] = [
  {
    id: 'krumnow',
    titel: 'Krumnow, Dissertation TU Dresden (2025), Tabelle 4 auf S. 20 und S. 143: Ausrüstungsstandard > 10.000 Lt/d, < 30.000 Lt/d, Auszug aus Ril 820.2010 (Stand 2018)',
    url: 'https://tud.qucosa.de/en/api/qucosa:101053/attachment/ATT-0/',
    belegt: 'Schwellenabstand 63/60 cm, Schotter vor Kopf 40 cm bis einschließlich 160 km/h (eigene Spalte v = 160) und 50 cm bei v > 160 km/h, Bettungsdicke 30 cm bzw. 35 cm bei v > 230 km/h; Kostenansatz 3,3 t Schotter je Meter Gleis',
  },
  {
    id: 'bmw',
    titel: 'Erläuterungsbericht Gleisanschluss BMW Dingolfing an Strecke 5634 (Planfeststellung, Regierung von Oberbayern, 06.12.2024)',
    url: 'https://www.regierung.oberbayern.bayern.de/mam/dokumente/bereich2/pfv/eisenbahn/01_erlaeuterungsbericht.pdf',
    belegt: 'Ril 820.2010A05: 54 E4, B 70, Schwellenabstand 65 cm; Ril 820.2010A06 (Ve = 160 km/h): 60 E2, 60 cm; jeweils 40 cm vor Kopf, 30 cm Bettungsdicke; 25 Schwellen B 90 an Weichen',
  },
  {
    id: 'gmain',
    titel: 'Erläuterungsbericht Hp Bayerisch Gmain, Strecke 5741 (DB Netz AG, Planfeststellung, 11.06.2019)',
    url: 'https://www.uvp-portal.de/sites/default/files/2019-10/Unterlage_01_01_Erlaeuterungsbericht.pdf',
    belegt: 'Ril 820.2010 bei 10.000–30.000 Lt/d: 54 E4, B 70 W-2.4, Schwellenabstand 65 cm, 40 cm vor Kopf, 30 cm Bettungsdicke',
  },
  {
    id: 'tecklenburg',
    titel: 'Erläuterungsbericht Vorplanung Reaktivierung Tecklenburger Nordbahn',
    url: 'https://www.bus-und-bahn-im-muensterland.de/weblication/grid5/tmpHTTP/_download_0110d9c85f4e14b418edd0d0f48c986f/Erluterungsbericht_Vorplanung_TN_mit_Anhang.pdf',
    belegt: 'nach Ril 820.2010 bei Ve bis 100 km/h: Schwellenabstand 65 cm, 30 cm Bettungsdicke unter der nicht überhöhten Schiene, 40 cm Schotter vor Kopf',
  },
  {
    id: 'wiki-schwelle',
    titel: 'Wikipedia: Schwelle (Bahn), Abschnitt Y-Stahlschwelle',
    url: 'https://de.wikipedia.org/wiki/Schwelle_(Bahn)',
    belegt: 'Y-Stahlschwelle bei üblicher Verwendung bis 120 km/h zugelassen; B 70 im Regeloberbau bis 230 km/h mit 60 cm Abstand',
  },
  {
    id: 'ystahl',
    titel: 'Vortrag „Die Y-Stahlschwelle in der Schweiz“, Eisenbahninfrastruktur-Konferenz Zlín (März 2007)',
    url: 'https://silo.tips/download/die-y-stahlschwelle-in-der-schweiz-eisenbahninfrastruktur-konferenz-mrz-2007-in',
    belegt: 'Herstellerangabe: Y-Stahlschwelle braucht nur 30 cm Schotter vor Kopf und 30 cm unter der Schwelle; bei DB und Privatbahnen teilweise 140 km/h',
  },
  {
    id: 'ril-text',
    titel: 'Ril 820.2010 (Fassung ab 01.06.2013), Abschnitte 5 und 7 – Inhalt geprüft über eine im Netz kursierende Kopie (keine offizielle Veröffentlichung, daher hier nicht verlinkt)',
    url: '',
    belegt: 'Böschung 1:1,25 bei Arbeiten / 1:1,5 im Entwurf; Tieferkehren der Schwellenfächer bei v > 140 km/h; aufbereiteter Schotter bis v ≤ 230 km/h; Mindestdicke an Kunstbauwerken 25 cm (120 < v ≤ 160) bzw. 20 cm (v ≤ 120); Bettungsdicke ≤ 60 cm; Y-Stahlschwellen 83 cm; Stromschienengleise 60 cm',
  },
  {
    id: 'bahnbau',
    titel: 'DB Bahnbau Gruppe: „Für Planer. Maschinentechnik“ (Broschüre)',
    url: 'https://www.bahnbaugruppe.de/resource/blob/5244686/bcc112444900edc0aa658983dc3279bc/Buch-Maschinentechnik-data.pdf',
    belegt: 'Materialwagen MFS 100: 86 t / 68 m³, MFS 40: 56 t / 40 m³, Kippwagen Fas: 53 t / 31 m³',
  },
  {
    id: 'facns',
    titel: 'DB Cargo Güterwagenkatalog: Facns 133',
    url: 'https://gueterwagenkatalog.dbcargo.com/catalogue/by-wagon-category/f-open-bulk-freight-wagons/Facns-133-9120492',
    belegt: 'Schüttgutwagen 55 m³, Zuladung je nach Streckenklasse 42–68 t',
  },
  {
    id: 'etr',
    titel: 'Plasser & Theurer / ETR: „Oberbauschotter Teil 1“ (Jan/Feb 2008)',
    url: 'https://www.plassertheurer.com/fileadmin/user_upload/Mediathek/Publikationen/etr_070102.pdf',
    belegt: 'allgemeine Fachliteratur (nicht DB-spezifisch): mind. 30 cm Bettung bei 220 kN Achslast, 45 cm Schotterbett vor Schwellenkopf',
  },
  {
    id: 'hubbs',
    titel: 'KMK-Curriculum Lernfeld 10 (HubbS)',
    url: 'https://hubbs.schule/mediathek/schienen-montieren-und-oberbau-fertigstellen-pdf',
    belegt: 'Beispiel-Oberbauanordnung „W14K-60-B70-1667“',
  },
];

/** Ausrüstungsstandard nach Ril 820.2010A05 (Stand 2018, laut Krumnow Tabelle 4). */
export interface GeschwindigkeitsStufe {
  bereich: string;
  schiene: string;
  schwellenabstandCm: string;
  vorKopfCm: number;
  bettungsdickeCm: number;
  hinweis?: string;
}

export const AUSRUESTUNG_A05: GeschwindigkeitsStufe[] = [
  { bereich: 'v ≤ 80 km/h', schiene: '54 E4', schwellenabstandCm: '63 (65)', vorKopfCm: 40, bettungsdickeCm: 30 },
  { bereich: '80 < v ≤ 120 km/h', schiene: '54 E4', schwellenabstandCm: '63 (65)', vorKopfCm: 40, bettungsdickeCm: 30 },
  { bereich: '120 < v < 160 km/h', schiene: '54 E4', schwellenabstandCm: '60', vorKopfCm: 40, bettungsdickeCm: 30 },
  { bereich: 'v = 160 km/h', schiene: '60 E2', schwellenabstandCm: '60', vorKopfCm: 40, bettungsdickeCm: 30 },
  { bereich: '160 < v ≤ 230 km/h', schiene: '60 E2', schwellenabstandCm: '60', vorKopfCm: 50, bettungsdickeCm: 30 },
  { bereich: 'v > 230 km/h', schiene: '60 E2', schwellenabstandCm: '60', vorKopfCm: 50, bettungsdickeCm: 35, hinweis: 'Schwelle B 90' },
];

/** Einschotterung der Schwellen vor Kopf in cm (Ril 820.2010). */
export function vorKopfCm(vKmh: number): number {
  return vKmh > 160 ? 50 : 40;
}

/** Bettungsdicke unter Schienenauflager in cm (Ril 820.2010). */
export function bettungsdickeCm(vKmh: number): number {
  return vKmh > 230 ? 35 : 30;
}

/** Schwellenfächer tiefer kehren (Schutz gegen Schotterflug durch Eis). */
export function tieferKehren(vKmh: number): boolean {
  return vKmh > 140;
}

/** Weitere Einzelregeln aus Ril 820.2010 Abschnitt 5 und 7. */
export const EINZELREGELN: { thema: string; wert: string }[] = [
  { thema: 'Bettungsdicke höchstens', wert: '60 cm' },
  { thema: 'Mindestdicke an bestehenden Kunstbauwerken', wert: '25 cm bei 120 < v ≤ 160 km/h · 20 cm bei v ≤ 120 km/h' },
  { thema: 'Schotterböschung', wert: '1 : 1,5 im Entwurf · 1 : 1,25 bei Arbeiten an der Bettung' },
  { thema: 'Schwellenfächer tiefer kehren', wert: 'ab v > 140 km/h (nicht bei r < 850 m)' },
  { thema: 'Aufbereiteter Schotter zulässig', wert: 'bis v ≤ 230 km/h' },
  { thema: 'Gereinigter Schotter (Bettungsreinigungsmaschine)', wert: 'im gesamten Bettungsquerschnitt zulässig' },
  { thema: 'Schwellenkopf bis Bahnsteigkante', wert: 'soll 30 cm, mindestens 10 cm' },
  { thema: 'Y-Stahlschwellen', wert: '83 cm Schwellenabstand (systembedingt), üblich bis 120 km/h zugelassen' },
  { thema: 'Gleise mit Stromschiene, Bahnübergang (+ 25 Schwellen davor/danach)', wert: '60 cm Schwellenabstand' },
  { thema: 'Regelschwellenlänge', wert: '2,60 m' },
];

/** Beispiel-Schüttdichten als Vorgabe im freien Rechner (frei wählbar). */
export const DICHTE_VERDICHTET = 1.7;
export const DICHTE_UNVERDICHTET = 1.5;

/** Böschungsneigung 1 : n im Entwurf (Ril 820.2010 Abschnitt 7). */
export const BOESCHUNG_N = 1.5;

/** Regelschwellenlänge B 70 in m (Ril 820.0110). */
export const SCHWELLENLAENGE_M = 2.6;

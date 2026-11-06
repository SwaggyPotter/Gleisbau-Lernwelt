import { EUROPA, KARTE_H, KARTE_PROJ, KARTE_W, NACHBARN } from './tycoon-karte-daten';
import { DEUTSCHLAND_NUTS } from './tycoon-gebiete-daten';
import { FLUESSE } from './tycoon-fluesse-daten';

/**
 * Spielkarte des Tycoon in Weltkoordinaten (KARTE_W x KARTE_H, y nach Sueden). Europa: Natural Earth (Public Domain);
 * Deutschland: Umriss aus denselben Grenzen wie die Landkreise (tycoon-gebiete-daten.ts), damit alles zusammenpasst.
 * Staedte stehen an ihren echten Koordinaten.
 */
const DEUTSCHLAND = DEUTSCHLAND_NUTS;
export { DEUTSCHLAND, EUROPA, KARTE_H, KARTE_PROJ, KARTE_W, NACHBARN };

/** Massstab 2D-Welt -> 3D und Umrechnung (Kartenmitte = 3D-Ursprung, Norden = +z). */
/** 3D-Einheiten je Welteinheit (ca. 1 km). 0,2 seit 2026-10-26 (Karte doppelt so gross wie vorher). */
export const SC = 0.2;
export const wx = (x: number): number => (x - KARTE_W / 2) * SC;
export const wz = (y: number): number => -(y - KARTE_H / 2) * SC;

const proj = (lat: number, lon: number) => ({
  x: Math.round((lon - KARTE_PROJ.lon0) * KARTE_PROJ.cos * KARTE_PROJ.s + KARTE_PROJ.rand),
  y: Math.round((KARTE_PROJ.lat0 - lat) * KARTE_PROJ.s + KARTE_PROJ.rand),
});

/**
 * Staedte. Reihenfolge NICHT aendern, nur hinten anhaengen: Spielstaende speichern Strecken als
 * Stadt-Indizes und die aufgedeckten Staedte als Liste in dieser Reihenfolge.
 * land = ISO-Kuerzel, nur fuer Staedte ausserhalb Deutschlands gesetzt.
 */
export const CITIES: { n: string; x: number; y: number; land?: string }[] = [
  { n: 'Berlin', ...proj(52.520, 13.405) },
  { n: 'Hamburg', ...proj(53.551, 9.994) },
  { n: 'Rostock', ...proj(54.092, 12.099) },
  { n: 'Hannover', ...proj(52.376, 9.732) },
  { n: 'Leipzig', ...proj(51.340, 12.375) },
  { n: 'Dresden', ...proj(51.050, 13.738) },
  { n: 'Dortmund', ...proj(51.514, 7.468) },
  { n: 'Köln', ...proj(50.938, 6.960) },
  { n: 'Frankfurt', ...proj(50.110, 8.682) },
  { n: 'Nürnberg', ...proj(49.454, 11.077) },
  { n: 'Stuttgart', ...proj(48.776, 9.183) },
  { n: 'München', ...proj(48.137, 11.576) },
  // Ausbau 2026-10-20: weitere deutsche Staedte
  { n: 'Bremen', ...proj(53.079, 8.802) },
  { n: 'Kiel', ...proj(54.323, 10.123) },
  { n: 'Magdeburg', ...proj(52.120, 11.628) },
  { n: 'Erfurt', ...proj(50.978, 11.029) },
  { n: 'Kassel', ...proj(51.312, 9.479) },
  { n: 'Münster', ...proj(51.961, 7.626) },
  { n: 'Mannheim', ...proj(49.487, 8.466) },
  { n: 'Karlsruhe', ...proj(49.007, 8.404) },
  { n: 'Freiburg', ...proj(47.999, 7.842) },
  { n: 'Augsburg', ...proj(48.371, 10.898) },
  { n: 'Regensburg', ...proj(49.013, 12.102) },
  { n: 'Würzburg', ...proj(49.792, 9.953) },
  { n: 'Saarbrücken', ...proj(49.240, 6.997) },
  // Ausbau 2026-10-20: Anschluss ans Ausland
  { n: 'Kopenhagen', land: 'DK', ...proj(55.676, 12.568) },
  { n: 'Amsterdam', land: 'NL', ...proj(52.370, 4.895) },
  { n: 'Brüssel', land: 'BE', ...proj(50.850, 4.352) },
  { n: 'Luxemburg', land: 'LU', ...proj(49.611, 6.130) },
  { n: 'Straßburg', land: 'FR', ...proj(48.573, 7.752) },
  { n: 'Zürich', land: 'CH', ...proj(47.377, 8.541) },
  { n: 'Innsbruck', land: 'AT', ...proj(47.269, 11.404) },
  { n: 'Salzburg', land: 'AT', ...proj(47.809, 13.055) },
  { n: 'Wien', land: 'AT', ...proj(48.208, 16.373) },
  { n: 'Prag', land: 'CZ', ...proj(50.075, 14.437) },
  { n: 'Breslau', land: 'PL', ...proj(51.108, 17.038) },
  { n: 'Posen', land: 'PL', ...proj(52.406, 16.925) },
  { n: 'Stettin', land: 'PL', ...proj(53.428, 14.553) },
  // Ausbau 2026-10-28: ganz Europa (Hauptstaedte, Grossstaedte, wichtige Bahnknoten)
  ...([
    ['NL', 'Rotterdam', 51.924, 4.478], ['NL', 'Den Haag', 52.070, 4.300], ['NL', 'Utrecht', 52.091, 5.122], ['NL', 'Eindhoven', 51.441, 5.470],
    ['NL', 'Groningen', 53.219, 6.567], ['BE', 'Antwerpen', 51.219, 4.402], ['BE', 'Gent', 51.054, 3.717], ['BE', 'Lüttich', 50.633, 5.567],
    ['FR', 'Paris', 48.857, 2.352], ['FR', 'Lille', 50.629, 3.057], ['FR', 'Metz', 49.119, 6.176], ['FR', 'Nancy', 48.692, 6.184],
    ['FR', 'Reims', 49.258, 4.032], ['FR', 'Dijon', 47.322, 5.041], ['FR', 'Lyon', 45.764, 4.835], ['FR', 'Marseille', 43.296, 5.370],
    ['FR', 'Nizza', 43.710, 7.262], ['FR', 'Montpellier', 43.611, 3.877], ['FR', 'Toulouse', 43.605, 1.444], ['FR', 'Bordeaux', 44.838, -0.579],
    ['FR', 'Nantes', 47.218, -1.554], ['FR', 'Rennes', 48.117, -1.678], ['FR', 'Le Havre', 49.494, 0.108], ['FR', 'Orléans', 47.903, 1.909],
    ['FR', 'Clermont-Ferrand', 45.778, 3.087], ['FR', 'Grenoble', 45.188, 5.724], ['FR', 'Mülhausen', 47.750, 7.336], ['FR', 'Brest', 48.390, -4.486],
    ['CH', 'Basel', 47.560, 7.589], ['CH', 'Bern', 46.948, 7.447], ['CH', 'Genf', 46.204, 6.143], ['CH', 'Lausanne', 46.520, 6.633],
    ['CH', 'Luzern', 47.050, 8.309], ['AT', 'Linz', 48.306, 14.286], ['AT', 'Graz', 47.071, 15.439], ['AT', 'Klagenfurt', 46.624, 14.308],
    ['IT', 'Mailand', 45.464, 9.190], ['IT', 'Turin', 45.070, 7.687], ['IT', 'Genua', 44.405, 8.946], ['IT', 'Venedig', 45.437, 12.330],
    ['IT', 'Verona', 45.438, 10.992], ['IT', 'Bozen', 46.498, 11.355], ['IT', 'Bologna', 44.494, 11.343], ['IT', 'Florenz', 43.770, 11.256],
    ['IT', 'Pisa', 43.716, 10.402], ['IT', 'Rom', 41.903, 12.496], ['IT', 'Neapel', 40.852, 14.268], ['IT', 'Bari', 41.117, 16.872],
    ['IT', 'Reggio Calabria', 38.111, 15.647], ['IT', 'Palermo', 38.116, 13.361], ['IT', 'Catania', 37.502, 15.087], ['IT', 'Triest', 45.650, 13.777],
    ['IT', 'Ancona', 43.616, 13.519], ['IT', 'Pescara', 42.464, 14.214], ['IT', 'Cagliari', 39.224, 9.122], ['ES', 'Barcelona', 41.385, 2.173],
    ['ES', 'Madrid', 40.417, -3.704], ['ES', 'Valencia', 39.470, -0.376], ['ES', 'Sevilla', 37.389, -5.984], ['ES', 'Málaga', 36.721, -4.421],
    ['ES', 'Saragossa', 41.649, -0.889], ['ES', 'Bilbao', 43.263, -2.935], ['ES', 'Valladolid', 41.652, -4.724], ['ES', 'Córdoba', 37.888, -4.779],
    ['ES', 'Murcia', 37.992, -1.131], ['ES', 'Alicante', 38.346, -0.491], ['ES', 'Granada', 37.177, -3.599], ['ES', 'A Coruña', 43.362, -8.411],
    ['ES', 'Vigo', 42.240, -8.690], ['ES', 'Palma', 39.570, 2.650], ['ES', 'San Sebastián', 43.318, -1.981], ['PT', 'Lissabon', 38.722, -9.170],
    ['PT', 'Porto', 41.158, -8.629], ['PT', 'Faro', 37.019, -7.930], ['PT', 'Coimbra', 40.203, -8.410], ['GB', 'London', 51.507, -0.128],
    ['GB', 'Birmingham', 52.486, -1.890], ['GB', 'Manchester', 53.481, -2.243], ['GB', 'Liverpool', 53.408, -2.991], ['GB', 'Leeds', 53.801, -1.549],
    ['GB', 'Newcastle', 54.978, -1.618], ['GB', 'Bristol', 51.455, -2.588], ['GB', 'Southampton', 50.910, -1.404], ['GB', 'Dover', 51.128, 1.313],
    ['GB', 'Cardiff', 51.482, -3.179], ['GB', 'Edinburgh', 55.953, -3.189], ['GB', 'Glasgow', 55.864, -4.252], ['GB', 'Aberdeen', 57.150, -2.094],
    ['GB', 'Inverness', 57.478, -4.225], ['GB', 'Belfast', 54.597, -5.930], ['GB', 'Norwich', 52.630, 1.297], ['GB', 'Sheffield', 53.381, -1.470],
    ['GB', 'Nottingham', 52.954, -1.158], ['GB', 'Plymouth', 50.376, -4.143], ['GB', 'Cambridge', 52.205, 0.122], ['IE', 'Dublin', 53.350, -6.260],
    ['IE', 'Cork', 51.898, -8.471], ['IE', 'Galway', 53.271, -9.057], ['IE', 'Limerick', 52.668, -8.630], ['DK', 'Aarhus', 56.163, 10.204],
    ['DK', 'Odense', 55.403, 10.402], ['DK', 'Aalborg', 57.048, 9.919], ['DK', 'Esbjerg', 55.476, 8.459], ['NO', 'Oslo', 59.914, 10.752],
    ['NO', 'Bergen', 60.392, 5.324], ['NO', 'Stavanger', 58.970, 5.733], ['NO', 'Trondheim', 63.430, 10.395], ['NO', 'Bodø', 67.280, 14.405],
    ['NO', 'Tromsø', 69.649, 18.956], ['NO', 'Narvik', 68.438, 17.427], ['SE', 'Stockholm', 59.329, 18.069], ['SE', 'Göteborg', 57.709, 11.975],
    ['SE', 'Malmö', 55.605, 13.004], ['SE', 'Uppsala', 59.859, 17.639], ['SE', 'Linköping', 58.411, 15.622], ['SE', 'Örebro', 59.275, 15.213],
    ['SE', 'Sundsvall', 62.391, 17.307], ['SE', 'Umeå', 63.826, 20.263], ['SE', 'Luleå', 65.584, 22.155], ['SE', 'Kiruna', 67.856, 20.225],
    ['SE', 'Östersund', 63.179, 14.636], ['FI', 'Helsinki', 60.169, 24.938], ['FI', 'Turku', 60.452, 22.267], ['FI', 'Tampere', 61.498, 23.761],
    ['FI', 'Oulu', 65.012, 25.465], ['FI', 'Rovaniemi', 66.503, 25.729], ['FI', 'Kuopio', 62.893, 27.679], ['FI', 'Vaasa', 63.096, 21.616],
    ['EE', 'Tallinn', 59.437, 24.754], ['EE', 'Tartu', 58.378, 26.729], ['LV', 'Riga', 56.950, 24.105], ['LV', 'Daugavpils', 55.875, 26.536],
    ['LT', 'Vilnius', 54.687, 25.280], ['LT', 'Kaunas', 54.898, 23.904], ['LT', 'Klaipėda', 55.703, 21.144], ['PL', 'Warschau', 52.230, 21.012],
    ['PL', 'Krakau', 50.065, 19.945], ['PL', 'Danzig', 54.352, 18.646], ['PL', 'Lodz', 51.759, 19.456], ['PL', 'Kattowitz', 50.264, 19.024],
    ['PL', 'Lublin', 51.246, 22.568], ['PL', 'Białystok', 53.133, 23.168], ['PL', 'Rzeszów', 50.041, 21.999], ['PL', 'Bromberg', 53.123, 18.008],
    ['PL', 'Allenstein', 53.778, 20.480], ['CZ', 'Brünn', 49.195, 16.607], ['CZ', 'Ostrau', 49.820, 18.262], ['CZ', 'Pilsen', 49.738, 13.373],
    ['CZ', 'Budweis', 48.975, 14.474], ['SK', 'Bratislava', 48.149, 17.107], ['SK', 'Košice', 48.717, 21.261], ['SK', 'Žilina', 49.223, 18.740],
    ['HU', 'Budapest', 47.498, 19.040], ['HU', 'Debrecen', 47.532, 21.627], ['HU', 'Szeged', 46.253, 20.141], ['HU', 'Pécs', 46.073, 18.233],
    ['HU', 'Győr', 47.687, 17.650], ['SI', 'Ljubljana', 46.057, 14.506], ['SI', 'Maribor', 46.554, 15.646], ['HR', 'Zagreb', 45.815, 15.982],
    ['HR', 'Split', 43.512, 16.440], ['HR', 'Rijeka', 45.327, 14.442], ['HR', 'Osijek', 45.554, 18.695], ['HR', 'Dubrovnik', 42.650, 18.094],
    ['BA', 'Sarajevo', 43.856, 18.413], ['BA', 'Banja Luka', 44.772, 17.191], ['BA', 'Mostar', 43.343, 17.808], ['RS', 'Belgrad', 44.787, 20.457],
    ['RS', 'Novi Sad', 45.267, 19.833], ['RS', 'Niš', 43.320, 21.896], ['ME', 'Podgorica', 42.441, 19.263], ['XK', 'Pristina', 42.663, 21.165],
    ['AL', 'Tirana', 41.328, 19.819], ['AL', 'Durrës', 41.323, 19.441], ['MK', 'Skopje', 41.998, 21.425], ['GR', 'Athen', 37.984, 23.728],
    ['GR', 'Thessaloniki', 40.640, 22.944], ['GR', 'Patras', 38.246, 21.735], ['GR', 'Larisa', 39.639, 22.419], ['GR', 'Ioannina', 39.665, 20.854],
    ['GR', 'Alexandroupoli', 40.849, 25.874], ['GR', 'Heraklion', 35.320, 25.190], ['BG', 'Sofia', 42.698, 23.322], ['BG', 'Plowdiw', 42.144, 24.750],
    ['BG', 'Warna', 43.214, 27.915], ['BG', 'Burgas', 42.504, 27.462], ['BG', 'Russe', 43.836, 25.965], ['RO', 'Bukarest', 44.427, 26.103],
    ['RO', 'Cluj-Napoca', 46.771, 23.624], ['RO', 'Timișoara', 45.749, 21.208], ['RO', 'Iași', 47.159, 27.601], ['RO', 'Constanța', 44.160, 28.635],
    ['RO', 'Brașov', 45.658, 25.601], ['RO', 'Craiova', 44.319, 23.796], ['RO', 'Oradea', 47.072, 21.921], ['MD', 'Chișinău', 47.011, 28.864],
    ['UA', 'Kiew', 50.450, 30.524], ['UA', 'Lemberg', 49.840, 24.030], ['UA', 'Odessa', 46.482, 30.723], ['UA', 'Charkiw', 49.994, 36.231],
    ['UA', 'Dnipro', 48.465, 35.046], ['UA', 'Saporischschja', 47.838, 35.139], ['UA', 'Winnyzja', 49.233, 28.468], ['UA', 'Uschhorod', 48.610, 22.335],
    ['UA', 'Czernowitz', 48.292, 25.936], ['UA', 'Poltawa', 49.588, 34.551], ['UA', 'Tschernihiw', 51.494, 31.289], ['UA', 'Mykolajiw', 46.975, 31.995],
    ['BY', 'Minsk', 53.904, 27.562], ['BY', 'Brest', 52.097, 23.734], ['BY', 'Grodno', 53.678, 23.830], ['BY', 'Gomel', 52.441, 30.988],
    ['BY', 'Witebsk', 55.184, 30.202], ['BY', 'Mogiljow', 53.900, 30.331], ['RU', 'Moskau', 55.756, 37.617], ['RU', 'Sankt Petersburg', 59.939, 30.316],
    ['RU', 'Kaliningrad', 54.710, 20.452], ['RU', 'Smolensk', 54.782, 32.045], ['RU', 'Twer', 56.859, 35.912], ['RU', 'Weliki Nowgorod', 58.522, 31.270],
    ['RU', 'Pskow', 57.819, 28.332], ['RU', 'Brjansk', 53.243, 34.364], ['RU', 'Kursk', 51.730, 36.193], ['RU', 'Belgorod', 50.596, 36.588],
    ['RU', 'Tula', 54.193, 37.618], ['RU', 'Kaluga', 54.513, 36.261], ['RU', 'Orjol', 52.970, 36.064], ['RU', 'Lipezk', 52.608, 39.599],
    ['RU', 'Jaroslawl', 57.627, 39.894], ['RU', 'Petrosawodsk', 61.785, 34.346], ['RU', 'Murmansk', 68.970, 33.075],
  ] as [string, string, number, number][]).map(([land, n, la, lo]) => ({ n, land, ...proj(la, lo) })),
];

/** Grossstaedte: Hochhaeuser in der 3D-Deko. */
export const GROSSSTADT = new Set(['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Amsterdam', 'Brüssel', 'Kopenhagen', 'Wien', 'Prag', 'Zürich',
  'Paris', 'London', 'Madrid', 'Barcelona', 'Rom', 'Mailand', 'Neapel', 'Lyon', 'Marseille', 'Lissabon', 'Warschau', 'Budapest', 'Stockholm',
  'Oslo', 'Helsinki', 'Athen', 'Bukarest', 'Kiew', 'Minsk', 'Moskau', 'Sankt Petersburg', 'Birmingham', 'Manchester', 'Dublin', 'Rotterdam']);

/** Feste Farbe je Spieler (aus der Konto-ID), falls er in keinem Clan ist. */
export function spielerFarbe(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360, s = 0.65, l = 0.5;
  const f = (n: number) => {
    const k = (n + hue / 30) % 12, a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

/** Laendernamen auf der Karte (Position in Breitengrad/Laengengrad). */
const LAENDER_NAMEN = [
  { n: 'DEUTSCHLAND', ...proj(50.55, 10.2) },
  { n: 'DÄNEMARK', ...proj(55.95, 9.3) },
  { n: 'SCHWEDEN', ...proj(56.0, 13.9) },
  { n: 'NIEDERLANDE', ...proj(52.75, 5.75) },
  { n: 'BELGIEN', ...proj(50.25, 5.0) },
  { n: 'FRANKREICH', ...proj(48.0, 5.4) },
  { n: 'SCHWEIZ', ...proj(46.9, 7.6) },
  { n: 'ÖSTERREICH', ...proj(47.2, 14.4) },
  { n: 'TSCHECHIEN', ...proj(49.6, 15.6) },
  { n: 'POLEN', ...proj(52.9, 16.4) },
  { n: 'SLOWENIEN', ...proj(46.15, 14.8) },
  { n: 'BOSNIEN UND HERZEGOWINA', ...proj(44.2, 17.8) },
  { n: 'MONTENEGRO', ...proj(42.8, 19.3) },
  { n: 'KOSOVO', ...proj(42.55, 20.9) },
  { n: 'ALBANIEN', ...proj(40.9, 20.1) },
  { n: 'NORDMAZEDONIEN', ...proj(41.55, 21.7) },
  { n: 'MOLDAU', ...proj(47.2, 28.5) },
  { n: 'LUXEMBURG', ...proj(49.85, 6.1) },
].map((l) => ({ ...l, gross: false }));
/** Groessere Laender (groessere Schrift fuer die Europa-Ansicht). */
const EUROPA_NAMEN = [
  ['RUSSLAND', 57.6, 40.6],
  ['GROSSBRITANNIEN', 53.0, -1.6], ['IRLAND', 53.2, -8.0], ['SPANIEN', 40.0, -3.7], ['PORTUGAL', 39.6, -8.1], ['ITALIEN', 42.8, 12.6],
  ['NORWEGEN', 61.5, 9.0], ['SCHWEDEN', 62.5, 15.5], ['FINNLAND', 63.0, 26.5], ['ESTLAND', 58.7, 25.6], ['LETTLAND', 56.9, 25.2],
  ['LITAUEN', 55.4, 23.9], ['BELARUS', 53.6, 28.0], ['UKRAINE', 49.2, 31.0], ['SLOWAKEI', 48.7, 19.6], ['UNGARN', 47.1, 19.4],
  ['RUMÄNIEN', 45.9, 24.9], ['SERBIEN', 44.0, 20.9], ['KROATIEN', 45.3, 16.2], ['BULGARIEN', 42.7, 25.2], ['GRIECHENLAND', 39.6, 22.0],
  ['TÜRKEI', 39.2, 33.0], ['ALGERIEN', 34.8, 3.0], ['TUNESIEN', 34.6, 9.4],
].map(([n, la, lo]) => ({ n: n as string, ...proj(la as number, lo as number), gross: true }));

export const imRing = (r: number[], x: number, y: number): boolean => {
  let drin = false;
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) drin = !drin;
  }
  return drin;
};

/** Liegt der Punkt (Weltkoordinaten) in Deutschland? */
export function inDeutschland(x: number, y: number): boolean {
  return DEUTSCHLAND.some((r) => imRing(r, x, y));
}

/** Liegt der Punkt auf Land (Deutschland oder Nachbarland, nicht im Meer)? */
export function aufLand(x: number, y: number): boolean {
  return inDeutschland(x, y) || NACHBARN.some((r) => imRing(r, x, y));
}

/**
 * Zeichnet Meer, Laender Europas, Deutschland und Laendernamen in einen 2D-Kontext (bereits auf Weltkoordinaten
 * transformiert). Mit relief werden die Landflaechen mit dem Hoehenrelief gefuellt (statt Flaechenfarbe).
 */
/** Linienbreite der Fluesse je Groessenklasse (Welteinheiten). */
export const FLUSS_BREITE: Record<number, number> = { 1: 2.4, 2: 1.5, 3: 0.9 };

/** Hoehenrelief nur auf dem Land (Meer durchsichtig), in doppelter Aufloesung fuer glattere Kuesten; je Reliefbild einmal. */
const landReliefCache = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
function landRelief(bild: HTMLCanvasElement, lage: { x0: number; y0: number; w: number; h: number }): HTMLCanvasElement {
  let c = landReliefCache.get(bild);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = bild.width * 2; c.height = bild.height * 2;
  const g = c.getContext('2d')!;
  g.setTransform(c.width / lage.w, 0, 0, c.height / lage.h, -lage.x0 * c.width / lage.w, -lage.y0 * c.height / lage.h);
  g.beginPath();
  for (const r of [...NACHBARN, ...DEUTSCHLAND]) {
    g.moveTo(r[0], r[1]);
    for (let i = 2; i < r.length; i += 2) g.lineTo(r[i], r[i + 1]);
    g.closePath();
  }
  g.fillStyle = '#000'; g.fill();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.imageSmoothingEnabled = true;
  g.drawImage(bild, 0, 0, c.width, c.height);
  landReliefCache.set(bild, c);
  return c;
}

/** Umgebendes Rechteck je Fluss (x0, y0, x1, y1), damit nur sichtbare gezeichnet werden. */
const FLUSS_BOX = FLUESSE.map((f) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < f.p.length; i += 2) { x0 = Math.min(x0, f.p[i]); x1 = Math.max(x1, f.p[i]); y0 = Math.min(y0, f.p[i + 1]); y1 = Math.max(y1, f.p[i + 1]); }
  return [x0, y0, x1, y1];
});

export function zeichneKarte(
  ctx: CanvasRenderingContext2D,
  farben = { meer: '#bcd6e6', ausland: '#e9e5da', land: '#f4f1ea', grenze: '#8a8577', schrift: 'rgba(60,60,50,.35)' },
  linie = 1.5,
  relief?: { bild: CanvasImageSource; x0: number; y0: number; w: number; h: number } | null,
  bereich = { x0: EUROPA.x0, y0: EUROPA.y0, x1: EUROPA.x1, y1: EUROPA.y1 },
): void {
  ctx.fillStyle = farben.meer;
  ctx.fillRect(bereich.x0, bereich.y0, bereich.x1 - bereich.x0, bereich.y1 - bereich.y0);
  const pfad = (ringe: number[][]) => {
    ctx.beginPath();
    for (const r of ringe) {
      ctx.moveTo(r[0], r[1]);
      for (let i = 2; i < r.length; i += 2) ctx.lineTo(r[i], r[i + 1]);
      ctx.closePath();
    }
  };
  ctx.lineJoin = 'round';
  if (relief) {
    // Relief auf die Landflaechen zugeschnitten (einmal vorbereitet; jedes Mal per clip() waere ueber ganz Europa zu langsam).
    ctx.drawImage(landRelief(relief.bild as HTMLCanvasElement, relief), relief.x0, relief.y0, relief.w, relief.h);
  } else {
    pfad(NACHBARN); ctx.fillStyle = farben.ausland; ctx.fill();
    pfad(DEUTSCHLAND); ctx.fillStyle = farben.land; ctx.fill();
  }
  // Fluesse (Natural Earth): Breite nach Groessenklasse, darunter ein heller Saum. Nur sichtbare; weit herausgezoomt
  // (Pixel je Welteinheit klein) erst die kleinen, dann die mittleren weglassen.
  ctx.lineCap = 'round';
  const px = Math.abs(ctx.getTransform().a), kMax = px < 0.15 ? 1 : px < 0.35 ? 2 : 3;
  for (const [farbe, extra] of [['rgba(225,240,250,.55)', 0.9], ['#4f8fc6', 0]] as [string, number][]) {
    for (let fi = 0; fi < FLUESSE.length; fi++) {
      const f = FLUESSE[fi], b = FLUSS_BOX[fi];
      if (f.k > kMax || b[2] < bereich.x0 || b[0] > bereich.x1 || b[3] < bereich.y0 || b[1] > bereich.y1) continue;
      ctx.strokeStyle = farbe; ctx.lineWidth = FLUSS_BREITE[f.k] + extra;
      ctx.beginPath(); ctx.moveTo(f.p[0], f.p[1]);
      for (let i = 2; i < f.p.length; i += 2) ctx.lineTo(f.p[i], f.p[i + 1]);
      ctx.stroke();
    }
  }
  ctx.lineCap = 'butt';
  ctx.strokeStyle = farben.grenze;
  ctx.lineWidth = linie * 0.6;
  pfad(NACHBARN); ctx.stroke();
  ctx.lineWidth = linie;
  pfad(DEUTSCHLAND); ctx.stroke();
  ctx.fillStyle = farben.schrift;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const l of [...LAENDER_NAMEN, ...EUROPA_NAMEN]) {
    if (l.x < bereich.x0 || l.x > bereich.x1 || l.y < bereich.y0 || l.y > bereich.y1) continue;
    ctx.font = '700 ' + (l.gross ? 46 : 22) + 'px system-ui, sans-serif';
    ctx.fillText(l.n.split('').join(' '), l.x, l.y);
  }
}

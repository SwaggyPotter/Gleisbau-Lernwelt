/**
 * Katalog der eingebundenen 3D-Modelle (GLB). Alle Dateien liegen unter src/assets/modelle/.
 * Neue Modelle: GLB dort ablegen, hier eintragen -- Lizenz und Quelle sind Pflichtfelder
 * (die App-Repo ist oeffentlich, siehe Ki Datenspeicher/20-Bahnspiel-3D-Assets).
 */
export type ModellKategorie = 'Lok' | 'Wagen' | 'Gleis' | 'Gebäude';

export interface ModellEintrag {
  id: string;
  name: string;
  kategorie: ModellKategorie;
  /** Pfad der GLB-Datei relativ zur App. */
  datei: string;
  lizenz: string;
  urheber: string;
  quelleUrl: string;
}

const KENNEY = 'assets/modelle/kenney/';
const KENNEY_QUELLE = 'https://kenney.nl/assets/train-kit';
const kenney = (id: string, name: string, kategorie: ModellKategorie): ModellEintrag => ({
  id,
  name,
  kategorie,
  datei: `${KENNEY}${id}.glb`,
  lizenz: 'CC0 1.0',
  urheber: 'Kenney (Train Kit 1.1)',
  quelleUrl: KENNEY_QUELLE,
});
/** Gebaeude aus den Kenney City Kits (alle CC0, auch kommerziell frei nutzbar). */
const KITS: Record<string, { ordner: string; urheber: string; quelle: string }> = {
  stadt: { ordner: 'kenney-stadt', urheber: 'Kenney (City Kit Commercial 2.1)', quelle: 'https://kenney.nl/assets/city-kit-commercial' },
  industrie: { ordner: 'kenney-industrie', urheber: 'Kenney (City Kit Industrial 2.0)', quelle: 'https://kenney.nl/assets/city-kit-industrial' },
  vorort: { ordner: 'kenney-vorort', urheber: 'Kenney (City Kit Suburban 2.0)', quelle: 'https://kenney.nl/assets/city-kit-suburban' },
};
const gebaeude = (kit: string, id: string, name: string): ModellEintrag => ({
  id: KITS[kit].ordner + '-' + id,
  name,
  kategorie: 'Gebäude',
  datei: `assets/modelle/${KITS[kit].ordner}/${id}.glb`,
  lizenz: 'CC0 1.0',
  urheber: KITS[kit].urheber,
  quelleUrl: KITS[kit].quelle,
});

export const MODELLE: ModellEintrag[] = [
  {
    id: 'oga-locomotive',
    name: 'Lokomotive (detailliert)',
    kategorie: 'Lok',
    datei: 'assets/modelle/oga/locomotive00.glb',
    lizenz: 'CC0 1.0',
    urheber: '32kda (OpenGameArt)',
    quelleUrl: 'https://opengameart.org/content/locomotive-1',
  },
  kenney('train-locomotive-a', 'Dampflok A', 'Lok'),
  kenney('train-locomotive-b', 'Dampflok B', 'Lok'),
  kenney('train-locomotive-c', 'Dampflok C', 'Lok'),
  kenney('train-locomotive-passenger-a', 'Personenzug-Lok', 'Lok'),
  kenney('train-diesel-a', 'Diesellok A', 'Lok'),
  kenney('train-diesel-b', 'Diesellok B', 'Lok'),
  kenney('train-electric-city-a', 'E-Triebwagen (Stadt)', 'Lok'),
  kenney('train-electric-double-a', 'E-Doppeldecker', 'Lok'),
  kenney('train-electric-bullet-a', 'Hochgeschwindigkeitszug', 'Lok'),
  kenney('train-electric-subway-a', 'U-Bahn', 'Lok'),
  kenney('train-tram-classic', 'Straßenbahn (klassisch)', 'Lok'),
  kenney('train-diesel-c', 'Rangierlok', 'Lok'),
  kenney('train-diesel-box-a', 'Dieseltriebwagen (Regionalbahn)', 'Lok'),
  kenney('train-tram-modern', 'Straßenbahn (modern)', 'Lok'),
  kenney('train-tram-round', 'Straßenbahn (rund)', 'Lok'),
  kenney('train-electric-square-a', 'E-Lok (kantig)', 'Lok'),
  kenney('train-electric-city-b', 'S-Bahn-Wagen', 'Wagen'),
  kenney('train-electric-city-c', 'S-Bahn-Wagen (Ende)', 'Wagen'),
  kenney('train-electric-bullet-b', 'Hochgeschwindigkeits-Mittelwagen', 'Wagen'),
  kenney('train-electric-bullet-c', 'Hochgeschwindigkeits-Mittelwagen (kurz)', 'Wagen'),
  kenney('train-electric-square-b', 'Intercity-Wagen', 'Wagen'),
  kenney('train-electric-square-c', 'Intercity-Wagen (Ende)', 'Wagen'),
  kenney('train-electric-double-b', 'Doppelstockwagen', 'Wagen'),
  kenney('train-diesel-box-b', 'Regionalbahn-Wagen', 'Wagen'),
  kenney('train-diesel-box-c', 'Regionalbahn-Wagen (Ende)', 'Wagen'),
  kenney('train-electric-double-c', 'Doppelstockwagen (Ende)', 'Wagen'),
  kenney('train-electric-subway-b', 'U-Bahn-Wagen', 'Wagen'),
  kenney('train-electric-subway-c', 'U-Bahn-Wagen (Ende)', 'Wagen'),
  kenney('train-locomotive-passenger-b', 'Personenwagen (Holz)', 'Wagen'),
  kenney('train-carriage-lumber', 'Rungenwagen mit Stämmen', 'Wagen'),
  kenney('train-carriage-flatbed-wood', 'Flachwagen mit Holz', 'Wagen'),
  kenney('train-carriage-tank-large', 'Großer Kesselwagen', 'Wagen'),
  kenney('train-carriage-dirt', 'Schüttgutwagen', 'Wagen'),
  kenney('train-carriage-box', 'Güterwagen (geschlossen)', 'Wagen'),
  kenney('train-carriage-coal', 'Kohlewagen', 'Wagen'),
  kenney('train-carriage-container-blue', 'Containerwagen (blau)', 'Wagen'),
  kenney('train-carriage-container-green', 'Containerwagen (grün)', 'Wagen'),
  kenney('train-carriage-container-red', 'Containerwagen (rot)', 'Wagen'),
  kenney('train-carriage-flatbed', 'Flachwagen', 'Wagen'),
  kenney('train-carriage-tank', 'Kesselwagen', 'Wagen'),
  kenney('train-carriage-wood', 'Holzwagen', 'Wagen'),
  kenney('railroad-straight', 'Gleis gerade', 'Gleis'),
  kenney('railroad-curve', 'Gleis Kurve', 'Gleis'),
  kenney('railroad-corner-small', 'Gleis Ecke (klein)', 'Gleis'),
  kenney('railroad-damaged-straight', 'Gleis gerade (beschädigt)', 'Gleis'),
  kenney('railroad-rail-straight', 'Nur Schienen gerade', 'Gleis'),
  kenney('track', 'Gleisbett', 'Gleis'),
  kenney('track-detailed', 'Gleisbett (detailliert)', 'Gleis'),
  kenney('spline-track', 'Gleis (Spline)', 'Gleis'),
  gebaeude('stadt', 'building-b', 'Bahnhofsgebäude'),
  gebaeude('stadt', 'detail-overhang-wide', 'Bahnsteigdach (Vordach breit)'),
  gebaeude('stadt', 'detail-awning-wide', 'Markise (breit)'),
  ...'acdefghijklmn'.split('').map((c) => gebaeude('stadt', 'building-' + c, 'Geschäftshaus ' + c.toUpperCase())),
  ...'abcde'.split('').map((c) => gebaeude('stadt', 'building-skyscraper-' + c, 'Hochhaus ' + c.toUpperCase())),
  ...'abcdefghijklmnopqrstu'.split('').map((c) => gebaeude('vorort', 'building-type-' + c, 'Wohnhaus ' + c.toUpperCase())),
  ...'abcdefghijklmnopqrst'.split('').map((c) => gebaeude('industrie', 'building-' + c, 'Halle/Fabrik ' + c.toUpperCase())),
  gebaeude('industrie', 'shipping-container-a', 'Container A'),
  gebaeude('industrie', 'shipping-container-b', 'Container B'),
  gebaeude('industrie', 'shipping-container-c', 'Container C'),
  gebaeude('industrie', 'water-tower', 'Wasserturm'),
  gebaeude('industrie', 'detail-tank-large', 'Tank (groß)'),
  gebaeude('industrie', 'detail-tank', 'Tank'),
  gebaeude('industrie', 'chimney-large', 'Schornstein (groß)'),
];

export const modellById = (id: string): ModellEintrag | undefined => MODELLE.find((m) => m.id === id);

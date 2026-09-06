export type Kategorie =
  | 'oberbau'
  | 'unterbau'
  | 'trassierung'
  | 'weichen'
  | 'kleineisen'
  | 'werkzeuge-maschinen'
  | 'regelwerke'
  | 'sicherheit';

export interface GlossarEintrag {
  begriff: string;
  kategorie: Kategorie;
  definition: string;
  verweis?: string;
}

export const KATEGORIE_LABELS: Record<Kategorie, string> = {
  oberbau: 'Oberbau',
  unterbau: 'Unterbau',
  trassierung: 'Trassierung',
  weichen: 'Weichen',
  kleineisen: 'Kleineisen & Befestigung',
  'werkzeuge-maschinen': 'Werkzeuge & Maschinen',
  regelwerke: 'Regelwerke & Begriffe',
  sicherheit: 'Arbeitssicherheit',
};

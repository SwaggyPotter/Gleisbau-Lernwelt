export type Kategorie =
  | 'oberbau'
  | 'unterbau'
  | 'trassierung'
  | 'weichen'
  | 'kleineisen'
  | 'werkzeuge-maschinen'
  | 'regelwerke'
  | 'sicherheit';

/** Nachweis für eine Beschreibung (Tim, 2026-11-07: jede Beschreibung braucht eine Quelle). */
export interface GlossarQuelle {
  titel: string;
  url?: string;
  /** Optional: Abschnitt/Stelle in der Quelle, an der die Aussage steht. */
  stelle?: string;
}

export interface GlossarEintrag {
  begriff: string;
  kategorie: Kategorie;
  definition: string;
  /** Mindestens eine Quelle; geprüft am Datum in GLOSSAR_QUELLEN_STAND. */
  quellen: GlossarQuelle[];
  verweis?: string;
}

/** Stabile ID eines Eintrags (aus dem Begriff) – Schlüssel für die Admin-Freigabe. */
export function glossarId(e: Pick<GlossarEintrag, 'begriff'>): string {
  return e.begriff.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

/** Prüfsumme über alles, was der Admin bestätigt (FNV-1a, hex). Ändert sich der Text, verfällt die Freigabe. */
export function glossarPruefsumme(e: GlossarEintrag): string {
  const text = [e.begriff, e.definition, ...e.quellen.map(q => `${q.titel}|${q.url ?? ''}|${q.stelle ?? ''}`)].join('|');
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
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

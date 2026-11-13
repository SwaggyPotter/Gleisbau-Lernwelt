/**
 * Stoffe mit Dichte für die Gewichtsberechnung (Tim, 2026-11-06).
 * Nur öffentlich zugängliche Richtwerte. Schüttgüter: Schüttdichte (lose bzw. verdichtet),
 * Baustoffe: Wichten nach DIN EN 1991-1-1 Anhang A (kN/m³ ÷ 10 ≈ t/m³), Holz: übliche Rohdichte.
 * Gleisschotter 1,5 / 1,7 t/m³ wie in der Schotterberechnung der Lernwelt.
 */
export interface Stoff {
  key: string;
  name: string;
  /** t/m³ */
  dichte: number;
  gruppe: 'Schüttgut' | 'Baustoff' | 'Sonstiges';
  /** Farbe im 3D-Modell */
  farbe: string;
  /** Körnung im 3D-Modell anzeigen */
  koernig?: boolean;
  quelle: string;
}

export const STOFFE: Stoff[] = [
  { key: 'schotter-lose', name: 'Gleisschotter, unverdichtet', dichte: 1.5, gruppe: 'Schüttgut', farbe: '#8a8f94', koernig: true, quelle: 'Richtwert Schüttdichte Gleisschotter 1,5–1,6 t/m³ (Baustoffhandel)' },
  { key: 'schotter-verd', name: 'Gleisschotter, verdichtet', dichte: 1.7, gruppe: 'Schüttgut', farbe: '#7b8085', koernig: true, quelle: 'Übungswert der Lernwelt (wie Schotterberechnung)' },
  { key: 'kies', name: 'Kies', dichte: 1.6, gruppe: 'Schüttgut', farbe: '#b3a58a', koernig: true, quelle: 'Richtwert Schüttdichte 1,4–1,8 t/m³ (Baustoffhandel)' },
  { key: 'sand', name: 'Sand', dichte: 1.5, gruppe: 'Schüttgut', farbe: '#d8bf86', koernig: true, quelle: 'Richtwert Schüttdichte 1,4–1,6 t/m³ (Baustoffhandel)' },
  { key: 'kies-sand', name: 'Kies-Sand-Gemisch 0/32', dichte: 1.5, gruppe: 'Schüttgut', farbe: '#bba987', koernig: true, quelle: 'Richtwert Schüttdichte (Baustoffhandel)' },
  { key: 'boden', name: 'Boden / Erdaushub, lose', dichte: 1.8, gruppe: 'Schüttgut', farbe: '#8b6a4c', koernig: true, quelle: 'Übungswert; je nach Bodenart ca. 1,5–2,0 t/m³' },
  { key: 'mutterboden', name: 'Mutterboden', dichte: 1.4, gruppe: 'Schüttgut', farbe: '#5e4634', koernig: true, quelle: 'Richtwert 1,35–1,50 t/m³ (Baustoffhandel)' },
  { key: 'beton', name: 'Beton (unbewehrt)', dichte: 2.4, gruppe: 'Baustoff', farbe: '#b9b7b0', quelle: 'DIN EN 1991-1-1, Anhang A: Normalbeton 24 kN/m³' },
  { key: 'stahlbeton', name: 'Stahlbeton', dichte: 2.5, gruppe: 'Baustoff', farbe: '#a9a8a2', quelle: 'DIN EN 1991-1-1, Anhang A: bewehrter Beton 25 kN/m³' },
  { key: 'stahl', name: 'Stahl', dichte: 7.85, gruppe: 'Baustoff', farbe: '#7d8a96', quelle: 'DIN EN 1991-1-1, Anhang A: Stahl 78,5 kN/m³' },
  { key: 'asphalt', name: 'Asphalt', dichte: 2.4, gruppe: 'Baustoff', farbe: '#3d3d3f', quelle: 'Richtwert 2,3–2,5 t/m³' },
  { key: 'granit', name: 'Granit (Festgestein)', dichte: 2.7, gruppe: 'Baustoff', farbe: '#9c9690', quelle: 'DIN EN 1991-1-1, Anhang A: Granit 27–30 kN/m³' },
  { key: 'holz', name: 'Holz (Eiche, Schwellenholz)', dichte: 0.75, gruppe: 'Baustoff', farbe: '#9a6b3f', quelle: 'Richtwert Rohdichte Eiche 0,65–0,8 t/m³' },
  { key: 'wasser', name: 'Wasser', dichte: 1.0, gruppe: 'Sonstiges', farbe: '#4f8fd6', quelle: '1 m³ Wasser ≈ 1.000 kg' },
];

export function stoff(key: string): Stoff {
  return STOFFE.find(s => s.key === key) ?? STOFFE[0];
}

/**
 * Körper der Volumenberechnung (Tim, 2026-11-06): Maße, Formeln, Volumen.
 * Alle Maße intern in Metern, Volumen in m³.
 */
export type KoerperId = 'rechteck' | 'dreiecksflaeche' | 'trapez' | 'quader' | 'wuerfel' | 'zylinder' | 'rohr' | 'kegel' | 'pyramide' | 'dreieck' | 'kugel';

export interface MassDef {
  key: string;
  /** Zeichen in Formel und Modell, z. B. „a“ */
  zeichen: string;
  name: string;
  /** Startwert im Rechner (m) */
  std: number;
}

export interface KoerperDef {
  id: KoerperId;
  name: string;
  /** kurze Gleisbau-Beispiele */
  beispiel: string;
  masse: MassDef[];
  /** ebene Fläche (nur A, kein Volumen/Gewicht) */
  flach?: boolean;
  /** Formel als HTML */
  formel: string;
  /** Querschnittsfläche (m²), falls die Formel über A geht */
  flaeche?: (m: Record<string, number>) => number;
  volumen: (m: Record<string, number>) => number;
  /** Formel mit eingesetzten Zahlen (HTML) */
  eingesetzt: (m: Record<string, number>, f: (n: number, d?: number) => string) => string;
}

const PI = Math.PI;

export const KOERPER: KoerperDef[] = [
  {
    id: 'rechteck', name: 'Rechteck', beispiel: 'Fläche: Bahnsteigbelag, Schalungsfläche, Baufeld', flach: true,
    masse: [
      { key: 'l', zeichen: 'l', name: 'Länge', std: 6.0 },
      { key: 'b', zeichen: 'b', name: 'Breite', std: 2.5 },
    ],
    formel: 'A = l × b',
    flaeche: m => m['l'] * m['b'],
    volumen: () => 0,
    eingesetzt: (m, f) => `A = ${f(m['l'])} m × ${f(m['b'])} m`,
  },
  {
    id: 'dreiecksflaeche', name: 'Dreieck', beispiel: 'Fläche: Böschungsdreieck, Giebel, Restfläche', flach: true,
    masse: [
      { key: 'g', zeichen: 'g', name: 'Grundseite', std: 4.0 },
      { key: 'h', zeichen: 'h', name: 'Höhe', std: 2.0 },
    ],
    formel: 'A = g × h ÷ 2',
    flaeche: m => m['g'] * m['h'] / 2,
    volumen: () => 0,
    eingesetzt: (m, f) => `A = ${f(m['g'])} m × ${f(m['h'])} m ÷ 2`,
  },
  {
    id: 'trapez', name: 'Trapez-Prisma', beispiel: 'Schotterbett, Damm, Graben, Schottermiete',
    masse: [
      { key: 'a', zeichen: 'a', name: 'obere Breite', std: 3.4 },
      { key: 'c', zeichen: 'c', name: 'untere Breite', std: 5.0 },
      { key: 'h', zeichen: 'h', name: 'Höhe', std: 0.55 },
      { key: 'l', zeichen: 'l', name: 'Länge', std: 100 },
    ],
    formel: 'A = (a + c) ÷ 2 × h<br>V = A × l',
    flaeche: m => (m['a'] + m['c']) / 2 * m['h'],
    volumen: m => (m['a'] + m['c']) / 2 * m['h'] * m['l'],
    eingesetzt: (m, f) => `A = (${f(m['a'])} + ${f(m['c'])}) ÷ 2 × ${f(m['h'])} = ${f((m['a'] + m['c']) / 2 * m['h'], 4)} m²<br>`
      + `V = ${f((m['a'] + m['c']) / 2 * m['h'], 4)} m² × ${f(m['l'])} m`,
  },
  {
    id: 'quader', name: 'Quader', beispiel: 'Fundament, Sauberkeitsschicht, Betonplatte',
    masse: [
      { key: 'l', zeichen: 'l', name: 'Länge', std: 2.0 },
      { key: 'b', zeichen: 'b', name: 'Breite', std: 1.2 },
      { key: 'h', zeichen: 'h', name: 'Höhe', std: 0.8 },
    ],
    formel: 'V = l × b × h',
    volumen: m => m['l'] * m['b'] * m['h'],
    eingesetzt: (m, f) => `V = ${f(m['l'])} m × ${f(m['b'])} m × ${f(m['h'])} m`,
  },
  {
    id: 'wuerfel', name: 'Würfel', beispiel: 'Beton-Prüfwürfel, Fundamentblock',
    masse: [{ key: 'a', zeichen: 'a', name: 'Kantenlänge', std: 0.15 }],
    formel: 'V = a × a × a = a³',
    volumen: m => m['a'] ** 3,
    eingesetzt: (m, f) => `V = ${f(m['a'], 4)} m × ${f(m['a'], 4)} m × ${f(m['a'], 4)} m`,
  },
  {
    id: 'zylinder', name: 'Zylinder', beispiel: 'Bohrpfahl, rundes Mastfundament',
    masse: [
      { key: 'd', zeichen: 'd', name: 'Durchmesser', std: 0.8 },
      { key: 'h', zeichen: 'h', name: 'Höhe', std: 3.0 },
    ],
    formel: 'A = π × d² ÷ 4<br>V = A × h',
    flaeche: m => PI * m['d'] ** 2 / 4,
    volumen: m => PI * m['d'] ** 2 / 4 * m['h'],
    eingesetzt: (m, f) => `A = π × ${f(m['d'])}² ÷ 4 = ${f(PI * m['d'] ** 2 / 4, 4)} m²<br>V = ${f(PI * m['d'] ** 2 / 4, 4)} m² × ${f(m['h'])} m`,
  },
  {
    id: 'rohr', name: 'Hohlzylinder', beispiel: 'Schachtring, Rohr, Durchlass',
    masse: [
      { key: 'D', zeichen: 'D', name: 'Außendurchmesser', std: 1.2 },
      { key: 'd', zeichen: 'd', name: 'Innendurchmesser', std: 1.0 },
      { key: 'h', zeichen: 'h', name: 'Höhe / Länge', std: 1.0 },
    ],
    formel: 'A = π × (D² − d²) ÷ 4<br>V = A × h',
    flaeche: m => PI * (m['D'] ** 2 - m['d'] ** 2) / 4,
    volumen: m => PI * (m['D'] ** 2 - m['d'] ** 2) / 4 * m['h'],
    eingesetzt: (m, f) => `A = π × (${f(m['D'])}² − ${f(m['d'])}²) ÷ 4 = ${f(PI * (m['D'] ** 2 - m['d'] ** 2) / 4, 4)} m²<br>`
      + `V = ${f(PI * (m['D'] ** 2 - m['d'] ** 2) / 4, 4)} m² × ${f(m['h'])} m`,
  },
  {
    id: 'kegel', name: 'Kegel', beispiel: 'Schüttkegel aus Sand, Splitt oder Schotter',
    masse: [
      { key: 'd', zeichen: 'd', name: 'Durchmesser unten', std: 5.0 },
      { key: 'h', zeichen: 'h', name: 'Höhe', std: 2.0 },
    ],
    formel: 'A = π × d² ÷ 4<br>V = A × h ÷ 3',
    flaeche: m => PI * m['d'] ** 2 / 4,
    volumen: m => PI * m['d'] ** 2 / 4 * m['h'] / 3,
    eingesetzt: (m, f) => `A = π × ${f(m['d'])}² ÷ 4 = ${f(PI * m['d'] ** 2 / 4, 4)} m²<br>V = ${f(PI * m['d'] ** 2 / 4, 4)} m² × ${f(m['h'])} m ÷ 3`,
  },
  {
    id: 'pyramide', name: 'Pyramide', beispiel: 'Schotterhaufen mit rechteckiger Grundfläche',
    masse: [
      { key: 'l', zeichen: 'l', name: 'Länge unten', std: 6.0 },
      { key: 'b', zeichen: 'b', name: 'Breite unten', std: 4.0 },
      { key: 'h', zeichen: 'h', name: 'Höhe', std: 2.0 },
    ],
    formel: 'A = l × b<br>V = A × h ÷ 3',
    flaeche: m => m['l'] * m['b'],
    volumen: m => m['l'] * m['b'] * m['h'] / 3,
    eingesetzt: (m, f) => `A = ${f(m['l'])} m × ${f(m['b'])} m = ${f(m['l'] * m['b'], 4)} m²<br>V = ${f(m['l'] * m['b'], 4)} m² × ${f(m['h'])} m ÷ 3`,
  },
  {
    id: 'dreieck', name: 'Dreiecks-Prisma', beispiel: 'Schottermiete, Böschungskeil',
    masse: [
      { key: 'g', zeichen: 'g', name: 'Grundseite', std: 4.0 },
      { key: 'h', zeichen: 'h', name: 'Höhe', std: 2.0 },
      { key: 'l', zeichen: 'l', name: 'Länge', std: 20 },
    ],
    formel: 'A = g × h ÷ 2<br>V = A × l',
    flaeche: m => m['g'] * m['h'] / 2,
    volumen: m => m['g'] * m['h'] / 2 * m['l'],
    eingesetzt: (m, f) => `A = ${f(m['g'])} m × ${f(m['h'])} m ÷ 2 = ${f(m['g'] * m['h'] / 2, 4)} m²<br>V = ${f(m['g'] * m['h'] / 2, 4)} m² × ${f(m['l'])} m`,
  },
  {
    id: 'kugel', name: 'Kugel', beispiel: 'Kugelbehälter, Stahlkugel',
    masse: [{ key: 'd', zeichen: 'd', name: 'Durchmesser', std: 1.0 }],
    formel: 'V = π × d³ ÷ 6',
    volumen: m => PI * m['d'] ** 3 / 6,
    eingesetzt: (m, f) => `V = π × ${f(m['d'])}³ ÷ 6`,
  },
];

export function koerper(id: KoerperId): KoerperDef {
  return KOERPER.find(k => k.id === id)!;
}

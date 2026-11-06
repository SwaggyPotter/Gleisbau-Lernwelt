/**
 * Schwellentypen für die Schottertabelle. Maße und Gewichte aus öffentlichen
 * Quellen (Recherche 2026-11-04, Vault 08-Recherche-Gwen/16, sechste Ergänzung):
 * - Betonschwellen: BSI-Schwellenbroschüre 2025 (Gewichte, Zeichnungsmaße B 70/B 90),
 *   Wikipedia „Schwelle (Bahn)“ (B 70: 2,60 m, max. 0,30 × 0,21 m), TUM (B 75: 2,80 m).
 * - Holz: DB-Regelmaß 2,60 × 0,26 × 0,16 m (Wikipedia, LfU Bayern).
 * - Y-Stahl: ca. 135 kg (DB-Zeichnungsverzeichnis), Träger IB 100 (10 cm hoch),
 *   2,00 m Auflagebreite (Vortrag Zlín 2007), Abstand systembedingt 83 cm.
 *
 * Volumen = Gewicht ÷ Rohdichte (Beton 2,5 t/m³, Stahl 7,85 t/m³). Wo eine Höhe
 * nicht öffentlich auffindbar war, ist sie angenommen (`hoeheAngenommen`).
 */

export interface Schwelle {
  id: string;
  name: string;
  laengeM: number;
  hoeheM: number;
  volumenM3: number;
  gewichtKg?: number;
  /** Systembedingter Schwellenabstand, gilt statt des Seitenabstands. */
  abstandFestCm?: number;
  hoeheAngenommen?: boolean;
  /** Bis zu welcher Geschwindigkeit die Schwelle in den Aufgaben vorkommt. */
  aufgabenBisKmh: number;
}

const BETON = 2.5;
const STAHL = 7.85;

export const SCHWELLEN: Schwelle[] = [
  { id: 'holz', name: 'Holz (2,60 × 0,26 × 0,16)', laengeM: 2.6, hoeheM: 0.16, volumenM3: 2.6 * 0.26 * 0.16, aufgabenBisKmh: 120 },
  { id: 'b58', name: 'Beton B 58 (2,40 m)', laengeM: 2.4, hoeheM: 0.21, volumenM3: 0.249 / BETON, gewichtKg: 249, hoeheAngenommen: true, aufgabenBisKmh: 120 },
  { id: 'b70-24', name: 'Beton B 70 (2,40 m)', laengeM: 2.4, hoeheM: 0.21, volumenM3: 0.284 / BETON, gewichtKg: 284, hoeheAngenommen: true, aufgabenBisKmh: 160 },
  { id: 'b70', name: 'Beton B 70 (2,60 m)', laengeM: 2.6, hoeheM: 0.21, volumenM3: 0.304 / BETON, gewichtKg: 304, aufgabenBisKmh: 230 },
  { id: 'b75', name: 'Beton B 75 (2,80 m)', laengeM: 2.8, hoeheM: 0.21, volumenM3: 0.45 / BETON, gewichtKg: 450, hoeheAngenommen: true, aufgabenBisKmh: 160 },
  { id: 'b90', name: 'Beton B 90 (2,60 m)', laengeM: 2.6, hoeheM: 0.214, volumenM3: 0.355 / BETON, gewichtKg: 355, aufgabenBisKmh: 300 },
  { id: 'b93', name: 'Beton B 93 (2,60 m)', laengeM: 2.6, hoeheM: 0.214, volumenM3: 0.378 / BETON, gewichtKg: 378, hoeheAngenommen: true, aufgabenBisKmh: 300 },
  { id: 'ystahl', name: 'Stahl Y-Schwelle', laengeM: 2.0, hoeheM: 0.1, volumenM3: 0.135 / STAHL, gewichtKg: 135, abstandFestCm: 83, aufgabenBisKmh: 120 },
];

export function schwelleById(id: string): Schwelle {
  return SCHWELLEN.find(s => s.id === id) ?? SCHWELLEN[3];
}

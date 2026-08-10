import { MaterialDichte } from '../models/materialrechner.models';

// Schüttdichten (loser Zustand, ungewalzt). Werte sind Richtwerte aus
// Baustoffhandel-Rechnern und Herstellerangaben (siehe Quelle je Material) —
// verdichtete Tragschichten liegen real ca. 10-25 % höher.
export const MATERIALIEN: MaterialDichte[] = [
  { key: 'gleisschotter', name: 'Gleisschotter (Hartgestein, gebrochen)', schuettdichteTPerM3: 1.55, quelle: 'kiesdirekt.de / Harbecke-hagebau, Gleisschotter mit DB-Zulassung, Richtwert 1,50-1,60 t/m³' },
  { key: 'kies', name: 'Kies', schuettdichteTPerM3: 1.6, quelle: 'baustoffe-liefern.de Kies-Rechner, Richtwert 1,4-1,8 t/m³' },
  { key: 'sand', name: 'Sand', schuettdichteTPerM3: 1.5, quelle: 'baustoffe-liefern.de Sand-Rechner, Richtwert 1,4-1,6 t/m³' },
  { key: 'kies-sand-gemisch', name: 'Kies-Sand-Gemisch (0-32 mm)', schuettdichteTPerM3: 1.5, quelle: 'kiesdirekt.de Kies-Sand-Gemisch 0-32mm Bedarfsrechner' },
  { key: 'beton', name: 'Frischbeton', schuettdichteTPerM3: 2.4, quelle: 'dornbach.com Baulexikon; Richtwert Normalbeton nach DIN EN 206/DIN 1045, praktisch ca. 2.400 kg/m³' },
  { key: 'mutterboden', name: 'Mutterboden / Oberboden', schuettdichteTPerM3: 1.4, quelle: 'baustoffe-liefern.de Erde/Mutterboden-Rechner, Richtwert 1,35-1,50 t/m³' },
];

export function findMaterial(key: string): MaterialDichte {
  const m = MATERIALIEN.find(x => x.key === key);
  if (!m) throw new Error(`Unbekanntes Material: ${key}`);
  return m;
}

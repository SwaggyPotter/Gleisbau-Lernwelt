/**
 * Zahlen, Zufall und Einheiten für die Formelsammlung-Apps.
 * Zufall/Runden/Formatieren kommen aus dem Trassierungsrechner (gemeinsame Rechenfunktionen),
 * damit beide Module identisch runden und formatieren.
 */
import { formatDE, randChoice, randInt, randStep, roundTo } from '../../../zusatz/trassierung/services/trassierung-utils';

export { formatDE, randChoice, randInt, randStep, roundTo };

/** Zahl als LaTeX im deutschen Format: Komma als {,}, Tausenderpunkte als Leerraum. */
export function zl(value: number, nk: number): string {
  const [ganz, rest] = fmt(value, nk).split(',');
  const g = ganz.replace(/\./g, '\\,');
  return rest !== undefined ? `${g}{,}${rest}` : g;
}

/** Deutsches Format mit Tausenderpunkt ab 10.000 (z. B. 10.240), feste Nachkommastellen. */
export function fmt(value: number, nk: number): string {
  const neg = value < 0;
  const roh = formatDE(Math.abs(value), nk);
  const [ganz, rest] = roh.split(',');
  const mitPunkt = ganz.length > 4 ? ganz.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ganz;
  const out = rest !== undefined ? `${mitPunkt},${rest}` : mitPunkt;
  return neg && roundTo(Math.abs(value), nk) !== 0 ? `−${out}` : out;
}

/**
 * Eingabe parsen: akzeptiert „0,08“, „0.08“, „1.234,5“, „1 234,5“, „-3“ / „−3“.
 * Gibt NaN zurück, wenn es keine Zahl ist.
 */
export function parseEingabe(raw: string): number {
  let s = (raw ?? '').trim().replace(/\s/g, '').replace('−', '-');
  if (!s) return NaN;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    // „10.240“ ohne Komma = Tausenderpunkt
    s = s.replace(/\./g, '');
  }
  if (!/^-?\d*\.?\d+(e-?\d+)?$/i.test(s)) return NaN;
  return parseFloat(s);
}

let zaehler = 0;
export function neueId(prefix: string): string {
  zaehler += 1;
  return `${prefix}-${Date.now().toString(36)}-${zaehler}`;
}

/** Zufällig true mit Wahrscheinlichkeit p. */
export function chance(p: number): boolean {
  return Math.random() < p;
}

// ---------- Einheiten ----------

/** Umrechnungsfaktoren in die Basiseinheit der jeweiligen Dimension. */
const EINHEITEN: Record<string, { dim: string; faktor: number }> = {
  'mm': { dim: 'laenge', faktor: 0.001 },
  'cm': { dim: 'laenge', faktor: 0.01 },
  'dm': { dim: 'laenge', faktor: 0.1 },
  'm': { dim: 'laenge', faktor: 1 },
  'km': { dim: 'laenge', faktor: 1000 },
  'km/h': { dim: 'geschw', faktor: 1 / 3.6 },
  'm/s': { dim: 'geschw', faktor: 1 },
  '‰': { dim: 'neigung', faktor: 0.001 },
  '%': { dim: 'neigung', faktor: 0.01 },
};

export function dimension(einheit: string): string | null {
  return EINHEITEN[einheit]?.dim ?? null;
}

/** Wert von einer Einheit in eine andere umrechnen (gleiche Dimension). */
export function umrechnen(wert: number, von: string, nach: string): number {
  if (von === nach) return wert;
  const a = EINHEITEN[von];
  const b = EINHEITEN[nach];
  if (!a || !b || a.dim !== b.dim) throw new Error(`Einheit ${von} → ${nach} nicht umrechenbar`);
  return roundTo((wert * a.faktor) / b.faktor, 10);
}

/** Text für den Rechenweg: „0,8 km = 800 m“. */
export function umrechnungsText(wert: number, von: string, nach: string, nkVon: number, nkNach: number): string {
  return `${fmt(wert, nkVon)} ${von} = ${fmt(umrechnen(wert, von, nach), nkNach)} ${nach}`;
}

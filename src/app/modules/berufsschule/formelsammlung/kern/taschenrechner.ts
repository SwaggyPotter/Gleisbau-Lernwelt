/**
 * Rechenkern des Taschenrechners beim Üben (Tim, 2026-11-07). Baut auf `rechne()` des
 * Schmierblatts auf (Komma = Dezimalzeichen, ², ³, π, %, Klammern) und ergänzt √ und „Ans“.
 * Ohne Angular – wird in tools/formelsammlung-tests geprüft.
 */
import { rechne } from '../../../../shared/schmierblatt/schmierblatt';

/** Zahl so als Text, dass rechne() sie exakt wieder einliest (Komma, keine Tausenderpunkte). */
export function zahlAlsEingabe(v: number): string {
  let t = Math.abs(v) >= 1e15 ? String(Math.round(v)) : v.toFixed(12).replace(/\.?0+$/, '');
  if (t === '-0') t = '0';
  t = t.replace('.', ',');
  return v < 0 ? `(${t})` : t;
}

/** Rechnet einen Ausdruck aus. `ans` = letztes Ergebnis (für die Taste „Ans“). Ungültig → null. */
export function taschenrechnerRechnen(ausdruck: string, ans = 0): number | null {
  let s = ausdruck.replace(/Ans/g, zahlAlsEingabe(ans)).replace(/√\s*/g, '√')
    .replace(/([\d)π²³])√/g, '$1×√');   // 2√9 = 2 × √9
  // √ von innen nach außen auflösen: √(…) ohne innere Klammern bzw. √Zahl
  for (let i = 0; i < 50 && s.includes('√'); i++) {
    const vorher = s;
    s = s.replace(/√\(([^()]*)\)/, (_m, innen: string) => {
      const v = rechne(innen);
      return v === null || v < 0 ? '#' : zahlAlsEingabe(Math.sqrt(v));
    });
    if (s === vorher) {
      s = s.replace(/√(\d+(?:,\d+)?|π)/, (_m, z: string) => {
        const v = rechne(z);
        return v === null ? '#' : zahlAlsEingabe(Math.sqrt(v));
      });
    }
    if (s === vorher) return null;
  }
  if (s.includes('#')) return null;
  return rechne(s);
}

/** Anzeige des Ergebnisses: deutsch, bis 8 Nachkommastellen. */
export function taschenrechnerAnzeige(v: number): string {
  return v.toLocaleString('de-DE', { maximumFractionDigits: 8, useGrouping: Math.abs(v) >= 10000 });
}

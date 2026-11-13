import { Aufgabe, ZahlAufgabe } from './typen';
import { parseEingabe } from './zahlen';

export interface PruefErgebnis {
  richtig: boolean;
  /** Eingabe war keine Zahl. */
  ungueltig?: boolean;
  /** Hinweis auf typischen Fehler (Einheit, Vorzeichen …). */
  hinweis?: string;
}

/** Toleranz einer Zahlaufgabe: richtig, wenn innerhalb abs ODER rel. */
export function innerhalbToleranz(wert: number, a: Pick<ZahlAufgabe, 'loesung' | 'toleranz'>): boolean {
  const diff = Math.abs(wert - a.loesung);
  return diff <= a.toleranz.abs + 1e-12 || diff <= Math.abs(a.loesung) * a.toleranz.rel + 1e-12;
}

/** Standard-Toleranz: halbe letzte Stelle bzw. 1 %. */
export function standardToleranz(nk: number, rel = 0.01): { abs: number; rel: number } {
  return { abs: 0.5 * Math.pow(10, -nk), rel };
}

const TYPISCHE_FAKTOREN: { f: number; text: string }[] = [
  { f: 1000, text: 'Dein Ergebnis ist um den Faktor 1000 daneben – Einheit prüfen (mm ↔ m, ‰)?' },
  { f: 0.001, text: 'Dein Ergebnis ist um den Faktor 1000 daneben – Einheit prüfen (mm ↔ m, ‰)?' },
  { f: 100, text: 'Faktor 100 daneben – cm ↔ m oder % ↔ Zahl verwechselt?' },
  { f: 0.01, text: 'Faktor 100 daneben – cm ↔ m oder % ↔ Zahl verwechselt?' },
  { f: 10, text: 'Faktor 10 daneben – % ↔ ‰ oder eine Kommastelle verrutscht?' },
  { f: 0.1, text: 'Faktor 10 daneben – % ↔ ‰ oder eine Kommastelle verrutscht?' },
  { f: 3.6, text: 'Faktor 3,6 daneben – km/h ↔ m/s verwechselt?' },
  { f: 1 / 3.6, text: 'Faktor 3,6 daneben – km/h ↔ m/s verwechselt?' },
  { f: 12.96, text: 'Faktor 12,96 (= 3,6²) daneben – v in km/h statt m/s quadriert?' },
  { f: 1 / 12.96, text: 'Faktor 12,96 (= 3,6²) daneben – v in km/h statt m/s quadriert?' },
  { f: 2, text: 'Genau doppelt so groß – Faktor 2 (z. B. halbe Sehne, 2·lta) vergessen?' },
  { f: 0.5, text: 'Genau halb so groß – Faktor 2 (z. B. halbe Sehne, 2·lta) vergessen?' },
];

export function pruefeZahl(aufgabe: ZahlAufgabe, eingabe: string): PruefErgebnis {
  const wert = parseEingabe(eingabe);
  if (isNaN(wert)) return { richtig: false, ungueltig: true };
  if (innerhalbToleranz(wert, aufgabe)) return { richtig: true };
  if (aufgabe.loesung !== 0) {
    if (innerhalbToleranz(-wert, aufgabe)) {
      return { richtig: false, hinweis: 'Der Betrag stimmt, aber das Vorzeichen nicht.' };
    }
    for (const t of TYPISCHE_FAKTOREN) {
      const ziel = { loesung: aufgabe.loesung * t.f, toleranz: { abs: aufgabe.toleranz.abs * t.f, rel: aufgabe.toleranz.rel } };
      if (innerhalbToleranz(wert, ziel)) return { richtig: false, hinweis: t.text };
    }
  }
  return { richtig: false };
}

export function pruefeAuswahl(aufgabe: Aufgabe, index: number): PruefErgebnis {
  return { richtig: aufgabe.art === 'auswahl' && aufgabe.richtig === index };
}

import { formel } from './daten';
import { standardToleranz } from './pruefen';
import { AufgabenModus, AuswahlAufgabe, Gegeben, Schritt, Stufe, ZahlAufgabe } from './typen';
import { neueId, randInt, roundTo } from './zahlen';

/** Gegebener Wert – rundet sofort auf die Anzeige-Stellen, damit mit dem angezeigten Wert gerechnet wird. */
export function geg(sym: string, name: string, wert: number, einheit: string, nk: number): Gegeben {
  return { sym, name, wert: roundTo(wert, nk), einheit, nk };
}

export interface ZahlParameter {
  appId: string;
  formelId: string;
  modus: AufgabenModus;
  stufe: Stufe;
  text?: string;
  gegeben: Gegeben[];
  frage: string;
  gesucht: { sym: string; name: string; einheit: string };
  loesung: number;
  nk: number;
  /** Relative Toleranz (Standard 1 %). */
  rel?: number;
  tipp: string;
  /** LaTeX der Formel; Standard = Formel aus formelsammlung.json. */
  formelLatex?: string;
  schritte: Schritt[];
}

export function zahl(p: ZahlParameter): ZahlAufgabe {
  return {
    id: neueId(p.appId),
    appId: p.appId,
    formelId: p.formelId,
    modus: p.modus,
    stufe: p.stufe,
    text: p.text,
    gegeben: p.gegeben,
    frage: p.frage,
    art: 'zahl',
    gesucht: p.gesucht,
    loesung: p.loesung,
    nk: p.nk,
    toleranz: standardToleranz(p.nk, p.rel ?? 0.01),
    tipp: p.tipp,
    formelLatex: p.formelLatex ?? formel(p.formelId).latex,
    schritte: p.schritte,
  };
}

export interface AuswahlParameter {
  appId: string;
  formelId: string;
  modus: AufgabenModus;
  stufe: Stufe;
  text?: string;
  gegeben: Gegeben[];
  frage: string;
  /** Erste Option = richtige Antwort; wird gemischt, wenn mischen=true. */
  optionen: string[];
  mischen?: boolean;
  tipp: string;
  formelLatex?: string;
  schritte: Schritt[];
}

export function auswahl(p: AuswahlParameter): AuswahlAufgabe {
  let optionen = [...p.optionen];
  let richtig = 0;
  if (p.mischen !== false) {
    const reihenfolge = optionen.map((_, i) => i);
    for (let i = reihenfolge.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [reihenfolge[i], reihenfolge[j]] = [reihenfolge[j], reihenfolge[i]];
    }
    optionen = reihenfolge.map(i => p.optionen[i]);
    richtig = reihenfolge.indexOf(0);
  }
  return {
    id: neueId(p.appId),
    appId: p.appId,
    formelId: p.formelId,
    modus: p.modus,
    stufe: p.stufe,
    text: p.text,
    gegeben: p.gegeben,
    frage: p.frage,
    art: 'auswahl',
    optionen,
    richtig,
    tipp: p.tipp,
    formelLatex: p.formelLatex ?? formel(p.formelId).latex,
    schritte: p.schritte,
  };
}

/** Schritt-Abkürzung. */
export function s(text: string, latex?: string): Schritt {
  return latex ? { text, latex } : { text };
}

/**
 * Gemeinsame Typen der Formelsammlung-Apps. Bewusst ohne Angular-Abhängigkeit,
 * damit Generatoren und Rechenfunktionen mit Node getestet werden können
 * (tools/formelsammlung-tests).
 */

export type Stufe = 1 | 2 | 3;
export type AufgabenModus = 'ueben' | 'umstellen' | 'einheiten';
export type Modus = 'erklaeren' | 'rechner' | AufgabenModus | 'pruefung';

/** Ein gegebener Wert in einer Aufgabe, so wie er angezeigt wird. */
export interface Gegeben {
  /** Symbol als LaTeX, z. B. "l_s". */
  sym: string;
  name: string;
  /** Angezeigter Zahlenwert (bereits gerundet – mit genau diesem Wert wird gerechnet). */
  wert: number;
  einheit: string;
  /** Nachkommastellen für die Anzeige. */
  nk: number;
}

export interface Schritt {
  /** Erklärender Text des Schritts. */
  text: string;
  /** Optional: Rechnung als LaTeX. */
  latex?: string;
}

interface AufgabeBasis {
  id: string;
  appId: string;
  /** Formel-ID aus formelsammlung.json, die man für diese Aufgabe braucht (für Formelfinder). */
  formelId: string;
  modus: AufgabenModus;
  stufe: Stufe;
  /** Textaufgabe aus dem Baustellenalltag (ab Stufe 2), sonst leer. */
  text?: string;
  gegeben: Gegeben[];
  /** Die eigentliche Frage („Berechne …“). */
  frage: string;
  /** Stufenhilfe 1: Tipp ohne Formel. */
  tipp: string;
  /** Stufenhilfe 2: die Formel (LaTeX). */
  formelLatex: string;
  /** Stufenhilfe 3 / Auswertung: Lösungsweg Schritt für Schritt. */
  schritte: Schritt[];
}

export interface ZahlAufgabe extends AufgabeBasis {
  art: 'zahl';
  gesucht: { sym: string; name: string; einheit: string };
  loesung: number;
  /** Nachkommastellen der Musterlösung. */
  nk: number;
  /** Erlaubte Abweichung: richtig, wenn innerhalb abs ODER rel (relativ zur Lösung). */
  toleranz: { abs: number; rel: number };
}

export interface AuswahlAufgabe extends AufgabeBasis {
  art: 'auswahl';
  optionen: string[];
  richtig: number;
}

export type Aufgabe = ZahlAufgabe | AuswahlAufgabe;

/** Ein Eingabefeld im Rechner-Modus. */
export interface RechnerFeld {
  key: string;
  sym: string;
  name: string;
  /** Einheit, in der berechne() den Wert bekommt. */
  einheit: string;
  /** Wählbare Eingabe-Einheiten (gleiche Dimension), erste = Standard. */
  einheiten?: string[];
  /** Startwert – in der ersten Einheit von `einheiten` (bzw. in `einheit`). */
  standard: number;
}

export interface RechnerErgebnis {
  sym: string;
  name: string;
  wert: number;
  einheit: string;
  nk: number;
  hervorheben?: boolean;
}

export interface RechnerAusgabe {
  ergebnisse: RechnerErgebnis[];
  warnungen: string[];
  schritte: Schritt[];
  /** Optionale Tabelle (z. B. Fehlervergleich, Absteckliste). */
  tabelle?: { titel: string; kopf: string[]; zeilen: string[][]; markiert?: number[] };
}

export interface RechnerVariante {
  id: string;
  label: string;
  felder: RechnerFeld[];
  /** Optionale Auswahlschalter (z. B. Kuppe/Wanne). */
  schalter?: { key: string; label: string; optionen: { wert: string; label: string }[] }[];
  berechne(w: Record<string, number>, s: Record<string, string>): RechnerAusgabe;
}

/** Skizzen-Schlüssel – jede Skizze ist ein eigenes SVG in komponenten/skizze. */
export type SkizzenTyp =
  | 'pfeilhoehe' | 'kreisbogen' | 'uebergangsbogen' | 'ausrundung' | 'gleisverziehung' | 'temperatur' | 'atmend'
  | 'fahrzeugkraefte' | 'querbeschleunigung' | 'weichen' | 'ueberhoehung' | 'rampen' | 'rampenverlauf' | 'kruemmung'
  | 'uebergangslaenge' | 'zweiggleis' | 'rampenvolumen'
  /** Schienenausdehnungs-Rechner (Zusatz-App, nutzt die Bausteine mit): Varianten 'dehnung' | 'luecke' */
  | 'schienendehnung';

/** Definition einer Mini-App. */
export interface MiniAppDef {
  id: string;
  skizze: SkizzenTyp;
  /** Formel-IDs (Reihenfolge = Reihenfolge im Erklären-Modus). */
  formelIds: string[];
  /** Zusätzliche Erklär-Abschnitte (Merkhilfen, Regeln). */
  merkhilfen: string[];
  /** Verweise auf bestehende Module mit überschneidendem Inhalt. */
  verweise?: { label: string; link: string }[];
  rechner: RechnerVariante[];
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe;
}

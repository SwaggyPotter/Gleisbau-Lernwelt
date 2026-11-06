/**
 * Vereinfachtes Rechenmodell Schotterbedarf (wie in der Ausbildung üblich):
 * Bettungskörper als Trapez von Planum bis Schwellenoberkante, oben so breit
 * wie Schwelle + 2 × Einschotterung vor Kopf, Böschung 1 : n. Das Volumen der
 * Schwellen wird abgezogen. Keine Überhöhung, ein Gleis.
 */
export interface SchotterEingabe {
  laengeM: number;
  schwellenabstandCm: number;
  schwellenlaengeM: number;
  schwellenhoeheM: number;
  schwellenvolumenM3: number;
  vorKopfCm: number;
  bettungsdickeCm: number;
  boeschungN: number;
  dichteVerdichtet: number;
  dichteUnverdichtet: number;
  /** Anteil des Altschotters, der nach der Reinigung wiederverwendet wird (0 = Neubau). */
  wiederverwendungProzent: number;
  wagenKapazitaetT: number;
}

export interface SchotterErgebnis {
  schwellenAnzahl: number;
  hoeheM: number;
  breiteObenM: number;
  breiteUntenM: number;
  querschnittM2: number;
  schwellenVolumenProM: number;
  volumenProM: number;
  volumenVerdichtetM3: number;
  masseT: number;
  volumenUnverdichtetM3: number;
  wiederverwendetT: number;
  neuschotterT: number;
  wagen: number;
}

export function berechneSchotter(e: SchotterEingabe): SchotterErgebnis {
  const a = e.schwellenabstandCm / 100;
  const schwellenAnzahl = Math.ceil(e.laengeM / a - 1e-9);
  const hoeheM = e.bettungsdickeCm / 100 + e.schwellenhoeheM;
  const breiteObenM = e.schwellenlaengeM + 2 * (e.vorKopfCm / 100);
  const breiteUntenM = breiteObenM + 2 * e.boeschungN * hoeheM;
  const querschnittM2 = ((breiteObenM + breiteUntenM) / 2) * hoeheM;
  const schwellenVolumenProM = e.schwellenvolumenM3 / a;
  const volumenProM = querschnittM2 - schwellenVolumenProM;
  const volumenVerdichtetM3 = volumenProM * e.laengeM;
  const masseT = volumenVerdichtetM3 * e.dichteVerdichtet;
  const volumenUnverdichtetM3 = masseT / e.dichteUnverdichtet;
  const wiederverwendetT = masseT * (e.wiederverwendungProzent / 100);
  const neuschotterT = masseT - wiederverwendetT;
  const wagen = Math.ceil(neuschotterT / e.wagenKapazitaetT - 1e-9);
  return {
    schwellenAnzahl, hoeheM, breiteObenM, breiteUntenM, querschnittM2,
    schwellenVolumenProM, volumenProM, volumenVerdichtetM3, masseT,
    volumenUnverdichtetM3, wiederverwendetT, neuschotterT, wagen,
  };
}

import { Injectable } from '@angular/core';
import { Aufgabe, DiagrammTyp, KategorieId, KategorieInfo } from '../models/schotterbett.models';
import { formatDE, nextId, randChoice, randStep } from './schotterbett-utils';

export const KATEGORIEN: KategorieInfo[] = [
  { id: 'schwellendichte', label: 'Schwellenabstand ↔ Schwellen/km', formel: 'Schwellen/km = 1000 / a[m]', diagramm: 'querschnitt' },
  { id: 'bettungsstaerke', label: 'Mindest-Bettungsstärke', formel: 'Bettungsstärke ≥ 30 cm (40 cm bei Hochleistungsstrecke)', diagramm: 'staerke' },
];

export function diagrammFuer(kategorie: KategorieId): DiagrammTyp {
  return KATEGORIEN.find(k => k.id === kategorie)?.diagramm ?? 'querschnitt';
}

/**
 * Übliche Schwellenabstände für Beton-/Holzschwellen (Regelbereich), siehe
 * Ki Datenspeicher/08-Recherche-Gwen/16-Schotterberechnungstabellen.md
 * (Quelle: Trackopedia Oberbauformen, gegengeprüft per WebFetch). Die
 * Sonderwert 83 cm (Y-Stahlschwellen) bewusst nicht mit aufgenommen, um
 * keine falsche Verallgemeinerung auf den Regelfall zu suggerieren.
 */
const SCHWELLENABSTAENDE_CM = [55, 60, 65, 70] as const;

@Injectable({ providedIn: 'root' })
export class AufgabenGeneratorService {
  generate(kategorie?: KategorieId): Aufgabe {
    const gewaehlt = kategorie ?? randChoice(KATEGORIEN).id;
    switch (gewaehlt) {
      case 'schwellendichte': return this.schwellendichte();
      case 'bettungsstaerke': return this.bettungsstaerke();
      default: return this.schwellendichte();
    }
  }

  // Schwellen/km = 1000 / Schwellenabstand[m]
  private schwellendichte(): Aufgabe {
    const abstandCm = randChoice(SCHWELLENABSTAENDE_CM);
    const proKmExakt = 100000 / abstandCm;
    const streckeKm = randStep(0.5, 5, 0.5);
    const gesamtExakt = proKmExakt * streckeKm;
    const gesucht = randChoice(['proKm', 'abstand', 'gesamt'] as const);

    if (gesucht === 'proKm') {
      return {
        id: nextId('sd'), kategorie: 'schwellendichte',
        gegeben: [{ label: 'Schwellenabstand a', wert: `${abstandCm} cm` }],
        gesuchtLabel: 'Schwellen pro Kilometer', gesuchtEinheit: 'Schwellen/km',
        korrekterWert: proKmExakt, toleranzAbs: 5, nachkommastellen: 0,
        rechenweg: `Schwellen/km = 1000 m / a[m] = 1000 / ${formatDE(abstandCm / 100, 2)} = ${formatDE(proKmExakt, 0)} Schwellen/km. ` +
          `Reales Beispiel für 60 cm Abstand: die DB-Oberbauanordnung "W14K-60-B70-1667" (Ril 820).`,
      };
    }
    if (gesucht === 'abstand') {
      const proKmGerundet = Math.round(proKmExakt);
      return {
        id: nextId('sd'), kategorie: 'schwellendichte',
        gegeben: [{ label: 'Schwellen pro Kilometer', wert: `${proKmGerundet} Schwellen/km` }],
        gesuchtLabel: 'Schwellenabstand a', gesuchtEinheit: 'cm',
        korrekterWert: abstandCm, toleranzAbs: 1, nachkommastellen: 0,
        rechenweg: `a = 1000 m / (Schwellen/km) = 1000 / ${proKmGerundet} = ${formatDE(100000 / proKmGerundet, 1)} cm ≈ ${abstandCm} cm`,
      };
    }
    return {
      id: nextId('sd'), kategorie: 'schwellendichte',
      gegeben: [
        { label: 'Schwellenabstand a', wert: `${abstandCm} cm` },
        { label: 'Streckenlänge (eingleisig)', wert: `${formatDE(streckeKm, 1)} km` },
      ],
      gesuchtLabel: 'Schwellenanzahl gesamt', gesuchtEinheit: 'Stück',
      korrekterWert: gesamtExakt, toleranzAbs: Math.max(gesamtExakt * 0.01, 5), nachkommastellen: 0,
      rechenweg: `Schwellen/km = 1000 / ${formatDE(abstandCm / 100, 2)} = ${formatDE(proKmExakt, 0)}. ` +
        `Gesamt = ${formatDE(proKmExakt, 0)} × ${formatDE(streckeKm, 1)} km = ${formatDE(gesamtExakt, 0)} Schwellen (eingleisig).`,
    };
  }

  /**
   * Quelle: ETR Jan/Feb 2008 Nr. 01+02, "Oberbauschotter Teil 1" (Plasser &
   * Theurer, frei zugänglich, siehe 16-Schotterberechnungstabellen.md):
   * "Bei Achslasten von 220 kN, wie sie in Europa üblich sind, soll bei
   * einem Schwellenabstand von 60 cm und einer Schwellenbreite von 26 cm
   * eine Bettungsstärke von mindestens 30 cm vorhanden sein. Für
   * Hochleistungsstrecken wird eine Bettungsstärke von 40 cm angestrebt."
   */
  private bettungsstaerke(): Aufgabe {
    const hochleistung = randChoice([true, false]);
    const wert = hochleistung ? 40 : 30;
    return {
      id: nextId('bs'), kategorie: 'bettungsstaerke',
      gegeben: [
        { label: 'Achslast', wert: '220 kN (europaweit üblich)' },
        { label: 'Schwellenbreite', wert: '26 cm' },
        { label: 'Streckentyp', wert: hochleistung ? 'Hochleistungsstrecke' : 'Strecke mit Standard-Anforderungen' },
      ],
      gesuchtLabel: 'Mindest-Bettungsstärke', gesuchtEinheit: 'cm',
      korrekterWert: wert, toleranzAbs: 0, nachkommastellen: 0,
      rechenweg: hochleistung
        ? 'Für Hochleistungsstrecken wird eine Bettungsstärke von 40 cm angestrebt (ETR 2008, Oberbauschotter Teil 1).'
        : 'Bei 220 kN Achslast, 60 cm Schwellenabstand und 26 cm Schwellenbreite soll die Bettungsstärke mindestens 30 cm betragen (ETR 2008, Oberbauschotter Teil 1).',
    };
  }
}

import { Injectable } from '@angular/core';
import { Aufgabe, DiagrammTyp, KategorieId, KategorieInfo } from '../models/schotterbett.models';
import { bettungsdickeCm, vorKopfCm } from '../data/regelwerk';
import {
  TABELLE_ABSTAENDE_CM, TABELLE_BETTUNG_CM, TABELLE_VOR_KOPF_CM, gleisabstandZuschlagProzent, tabellenwertM3ProKm,
} from '../data/schottertabelle';
import { SCHWELLEN } from '../data/schwellen';
import { formatDE, nextId, randChoice, randInt, randStep } from './schotterbett-utils';

export const KATEGORIEN: KategorieInfo[] = [
  { id: 'regelwerte', label: 'Ril 820.2010: Regelwerte', formel: 'vor Kopf 40/50 cm · Bettung 30/35 cm', diagramm: 'regelwerte' },
  { id: 'tabelle', label: 'Schottertabelle ablesen', formel: 'm³/km aus Schwelle · Bettung · vor Kopf', diagramm: 'tabelle' },
  { id: 'schwellendichte', label: 'Schwellenabstand ↔ Schwellen/km', formel: 'Schwellen/km = 1000 / a[m]', diagramm: 'querschnitt' },
  { id: 'wagen', label: 'Wagenanzahl (aufrunden)', formel: 'Wagen = ⌈ Menge ÷ Zuladung ⌉', diagramm: 'wagen' },
];

export function diagrammFuer(kategorie: KategorieId): DiagrammTyp {
  return KATEGORIEN.find(k => k.id === kategorie)?.diagramm ?? 'querschnitt';
}

/**
 * Schwellenabstände im Ausrüstungsstandard Ril 820.2010 (63 cm Stand 2018,
 * 65 cm in Planungsunterlagen 2019/2024, 60 cm ab v > 120 km/h) sowie 83 cm
 * bei Y-Stahlschwellen. Quellen siehe data/regelwerk.ts.
 */
const SCHWELLENABSTAENDE_CM = [60, 63, 65, 83] as const;

const V_AUSWAHL = [80, 100, 120, 140, 160, 180, 200, 230, 250, 280] as const;

@Injectable({ providedIn: 'root' })
export class AufgabenGeneratorService {
  generate(kategorie?: KategorieId): Aufgabe {
    const gewaehlt = kategorie ?? randChoice(KATEGORIEN).id;
    switch (gewaehlt) {
      case 'schwellendichte': return this.schwellendichte();
      case 'regelwerte': return this.regelwerte();
      case 'wagen': return this.wagen();
      case 'tabelle': return this.tabelle();
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
        korrekterWert: proKmExakt, toleranzAbs: 1, nachkommastellen: 0,
        rechenweg: `Schwellen/km = 1000 m / a[m] = 1000 / ${formatDE(abstandCm / 100, 2)} = ${formatDE(proKmExakt, 0)} Schwellen/km. ` +
          `Die Zahl steht auch hinten in der Oberbauform, z. B. W14K-60-B70-1667.`,
      };
    }
    if (gesucht === 'abstand') {
      const proKmGerundet = Math.round(proKmExakt);
      return {
        id: nextId('sd'), kategorie: 'schwellendichte',
        gegeben: [{ label: 'Oberbauform', wert: `W14K-??-B70-${proKmGerundet}` }],
        gesuchtLabel: 'Schwellenabstand a', gesuchtEinheit: 'cm',
        korrekterWert: abstandCm, toleranzAbs: 0.5, nachkommastellen: 0,
        rechenweg: `a = 1000 m ÷ ${proKmGerundet} = ${formatDE(100000 / proKmGerundet, 1)} cm ≈ ${abstandCm} cm`,
      };
    }
    return {
      id: nextId('sd'), kategorie: 'schwellendichte',
      gegeben: [
        { label: 'Schwellenabstand a', wert: `${abstandCm} cm` },
        { label: 'Gleislänge', wert: `${formatDE(streckeKm, 1)} km` },
      ],
      gesuchtLabel: 'Schwellenanzahl gesamt', gesuchtEinheit: 'Stück',
      korrekterWert: Math.ceil(gesamtExakt - 1e-9), toleranzAbs: 1, nachkommastellen: 0,
      rechenweg: `n = ${formatDE(streckeKm * 1000, 0)} m ÷ ${formatDE(abstandCm / 100, 2)} m = ${formatDE(gesamtExakt, 2)} → ${Math.ceil(gesamtExakt - 1e-9)} Schwellen (aufrunden).`,
    };
  }

  /** Regelwerte aus Ril 820.2010 Abschnitt 5 und 7 sowie Anhang 04–06. */
  private regelwerte(): Aufgabe {
    const typ = randChoice(['vorKopf', 'vorKopf', 'bettung', 'bettung', 'kunstbau', 'kehren', 'rc', 'bahnsteig', 'boeschung', 'ystahl', 'grenze50'] as const);
    const v = randChoice(V_AUSWAHL);
    const basis = { id: nextId('rw'), kategorie: 'regelwerte' as const, toleranzAbs: 0, nachkommastellen: 0 };

    switch (typ) {
      case 'vorKopf':
        return {
          ...basis,
          gegeben: [{ label: 'zul. Geschwindigkeit', wert: `${v} km/h` }, { label: 'Regelwerk', wert: 'Ril 820.2010' }],
          gesuchtLabel: 'Einschotterung vor Kopf', gesuchtEinheit: 'cm', korrekterWert: vorKopfCm(v),
          rechenweg: `Bis einschließlich 160 km/h: 40 cm vor Kopf, über 160 km/h: 50 cm. Bei ${v} km/h also ${vorKopfCm(v)} cm.`,
        };
      case 'bettung':
        return {
          ...basis,
          gegeben: [{ label: 'zul. Geschwindigkeit', wert: `${v} km/h` }, { label: 'Regelwerk', wert: 'Ril 820.2010' }],
          gesuchtLabel: 'Bettungsdicke unter Schwelle', gesuchtEinheit: 'cm', korrekterWert: bettungsdickeCm(v),
          rechenweg: `Regelbettungsdicke 30 cm, erst über 230 km/h 35 cm. Bei ${v} km/h also ${bettungsdickeCm(v)} cm. ` +
            `(Nicht verwechseln: über 160 km/h ändert sich nur der Schotter vor Kopf.)`,
        };
      case 'kunstbau': {
        const vk = randChoice([80, 100, 120, 140, 160] as const);
        const wert = vk > 120 ? 25 : 20;
        return {
          ...basis,
          gegeben: [{ label: 'Lage', wert: 'auf bestehendem Kunstbauwerk' }, { label: 'zul. Geschwindigkeit', wert: `${vk} km/h` }],
          gesuchtLabel: 'Mindest-Bettungsdicke', gesuchtEinheit: 'cm', korrekterWert: wert,
          rechenweg: `An bestehenden Kunstbauwerken darf die Bettung dünner sein: 25 cm bei 120 < v ≤ 160 km/h, 20 cm bei v ≤ 120 km/h. Bei ${vk} km/h also ${wert} cm.`,
        };
      }
      case 'kehren':
        return {
          ...basis,
          gegeben: [{ label: 'Gefahr', wert: 'Schotterflug durch herabfallendes Eis' }],
          gesuchtLabel: 'Schwellenfächer tiefer kehren ab über', gesuchtEinheit: 'km/h', korrekterWert: 140,
          rechenweg: 'Nach Ril 820.2010 sind die Schwellenfächer bei zul. v > 140 km/h tiefer zu kehren (nicht in Bögen r < 850 m).',
        };
      case 'rc':
        return {
          ...basis,
          gegeben: [{ label: 'Material', wert: 'aufbereiteter Schotter (RC-Schotter)' }],
          gesuchtLabel: 'zulässig bis einschließlich', gesuchtEinheit: 'km/h', korrekterWert: 230,
          rechenweg: 'Aufbereiteter Schotter ist in Gleisen und Weichen bis v ≤ 230 km/h zulässig. Gereinigter Schotter aus der Bettungsreinigungsmaschine darf im ganzen Querschnitt eingebaut werden.',
        };
      case 'bahnsteig':
        return {
          ...basis,
          gegeben: [{ label: 'Lage', wert: 'Gleis am Bahnsteig (standfeste seitliche Begrenzung)' }],
          gesuchtLabel: 'Abstand Schwellenkopf – Begrenzung (Sollwert)', gesuchtEinheit: 'cm', korrekterWert: 30,
          rechenweg: 'Hier darf die Einschotterung vor Kopf unterschritten werden. Der Abstand Schwellenkopf bis Begrenzung soll 30 cm betragen und 10 cm nicht unterschreiten.',
        };
      case 'ystahl':
        return {
          ...basis,
          gegeben: [{ label: 'Schwelle', wert: 'Y-Stahlschwelle' }, { label: 'Einsatz', wert: 'übliche Verwendung' }],
          gesuchtLabel: 'zugelassene Streckenhöchstgeschwindigkeit bis', gesuchtEinheit: 'km/h', korrekterWert: 120,
          rechenweg: 'Y-Stahlschwellen sind bei üblicher Verwendung bis 120 km/h zugelassen (einzelne Strecken bei der DB teils bis 140 km/h). ' +
            'Den Bereich über 160 km/h mit 50 cm vor Kopf erreichen sie nie, dort liegen Betonschwellen B 70 bzw. B 90.',
        };
      case 'grenze50':
        return {
          ...basis,
          gegeben: [{ label: 'Frage', wert: 'Ab welcher Geschwindigkeit 50 cm Schotter vor Kopf?' }, { label: 'Regelwerk', wert: 'Ril 820.2010' }],
          gesuchtLabel: 'ab (einschließlich)', gesuchtEinheit: 'km/h', korrekterWert: 161,
          rechenweg: 'Bis einschließlich 160 km/h reichen 40 cm. Die 50 cm gelten bei v > 160 km/h, also ab 161 km/h.',
        };
      case 'boeschung':
      default:
        return {
          ...basis, nachkommastellen: 1, toleranzAbs: 0.01,
          gegeben: [{ label: 'Planung', wert: 'Entwurf eines Bettungsquerschnitts' }],
          gesuchtLabel: 'Böschungsneigung 1 :', gesuchtEinheit: '', korrekterWert: 1.5,
          rechenweg: 'Im Entwurf wird die Schotterböschung mit 1 : 1,5 angesetzt, bei Arbeiten an der Bettung wird 1 : 1,25 hergestellt.',
        };
    }
  }

  /** Wert aus der Schottertabelle ablesen, teils mit Gleisabstand-Zuschlag. */
  private tabelle(): Aufgabe {
    const schwelle = randChoice(SCHWELLEN);
    const abstand = schwelle.abstandFestCm ?? randChoice(TABELLE_ABSTAENDE_CM);
    const vk = randChoice(TABELLE_VOR_KOPF_CM);
    const bd = randChoice(TABELLE_BETTUNG_CM);
    const gleise = randChoice([1, 1, 2] as const);
    const w = tabellenwertM3ProKm(schwelle.id, abstand, vk, bd, gleise);
    const gegeben = [
      { label: 'Gleise', wert: gleise === 2 ? 'zweigleisig' : 'eingleisig' },
      { label: 'Schwelle', wert: schwelle.name },
      { label: 'Schwellenabstand', wert: `${abstand} cm` },
      { label: 'vor Kopf', wert: `${vk} cm` },
      { label: 'Bettungsdicke', wert: `${bd} cm` },
    ];
    const seite = schwelle.abstandFestCm ? 'beliebige Seite' : `${abstand} cm`;
    const ort = `Tabelle ${gleise === 2 ? 'zweigleisig' : 'eingleisig'} · ${seite}, Zeile ${schwelle.name} mit Bettung ${bd} cm, Spalte ${vk} cm`;
    if (gleise === 2 && Math.random() < 0.5) {
      const ga = randChoice([4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8] as const);
      const z = gleisabstandZuschlagProzent(ga);
      const wert = w * (1 + z / 100);
      gegeben.push({ label: 'Gleisabstand', wert: `${formatDE(ga, 2)} m` });
      return {
        id: nextId('tb'), kategorie: 'tabelle', gegeben,
        gesuchtLabel: 'Schotterbedarf je km inkl. Zuschlag', gesuchtEinheit: 'm³/km',
        korrekterWert: wert, toleranzAbs: Math.max(2, wert * 0.003), nachkommastellen: 0,
        rechenweg: `${ort} → ${formatDE(w, 0)} m³/km. Gleisabstand ${formatDE(ga, 2)} m = ${formatDE((ga - 4) * 100, 0)} cm über 4,00 m → ${z} % Zuschlag: ${formatDE(w, 0)} × ${formatDE(1 + z / 100, 2)} = ${formatDE(wert, 0)} m³/km.`,
      };
    }
    return {
      id: nextId('tb'), kategorie: 'tabelle', gegeben,
      gesuchtLabel: 'Schotterbedarf je km', gesuchtEinheit: 'm³/km',
      korrekterWert: w, toleranzAbs: 1, nachkommastellen: 0,
      rechenweg: `${ort} → ${formatDE(w, 0)} m³/km.`,
    };
  }

  /** Ganze Wagen: immer aufrunden. */
  private wagen(): Aufgabe {
    const kap = randChoice([42, 45, 50, 55, 56, 60] as const);
    let menge = randStep(300, 4000, 0.5);
    while (Math.abs(menge / kap - Math.round(menge / kap)) < 0.08) menge += randInt(3, 17);
    const wagen = Math.ceil(menge / kap);
    return {
      id: nextId('wg'), kategorie: 'wagen',
      gegeben: [
        { label: 'Schotterbedarf', wert: `${formatDE(menge, 1)} t` },
        { label: 'Zuladung je Wagen', wert: `${kap} t` },
      ],
      gesuchtLabel: 'Anzahl Wagen', gesuchtEinheit: 'Wagen',
      korrekterWert: wagen, toleranzAbs: 0, nachkommastellen: 0,
      rechenweg: `${formatDE(menge, 1)} t ÷ ${kap} t = ${formatDE(menge / kap, 2)} → aufrunden auf ${wagen} Wagen. Mit ${wagen - 1} Wagen blieben ${formatDE(menge - (wagen - 1) * kap, 1)} t liegen.`,
    };
  }
}

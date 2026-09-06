import { Injectable } from '@angular/core';
import { Aufgabe, DiagrammTyp, KategorieId, KategorieInfo } from '../models/weichenrechner.models';
import { formatDE, nextId, randChoice, randStep } from './weichenrechner-utils';

export const KATEGORIEN: KategorieInfo[] = [
  { id: 'neigung-winkel', label: 'Neigung ↔ Weichenwinkel', formel: 'tan α = 1 / n', diagramm: 'neigung' },
  { id: 'zungenlaenge', label: 'Zungenlänge aus Wurzelabstand', formel: 'z = c × n', diagramm: 'zunge' },
  { id: 'weichenlaenge', label: 'Weichenlänge (überschlägig)', formel: 'L ≈ R / n', diagramm: 'laenge' },
];

export function diagrammFuer(kategorie: KategorieId): DiagrammTyp {
  return KATEGORIEN.find(k => k.id === kategorie)?.diagramm ?? 'neigung';
}

const NEIGUNGEN = [9, 12, 14, 18.5, 26.5, 42];
const NEIGUNGEN_LAENGE = [9, 12, 14, 18.5, 26.5];
const RADIEN = [190, 300, 500, 760, 1200, 2400];

function tol(value: number, relPct: number, floor: number): number {
  return Math.max(Math.abs(value) * relPct, floor);
}

@Injectable({ providedIn: 'root' })
export class AufgabenGeneratorService {
  generate(kategorie?: KategorieId): Aufgabe {
    const gewaehlt = kategorie ?? randChoice(KATEGORIEN).id;
    switch (gewaehlt) {
      case 'neigung-winkel': return this.neigungWinkel();
      case 'zungenlaenge': return this.zungenlaenge();
      case 'weichenlaenge': return this.weichenlaenge();
      default: return this.neigungWinkel();
    }
  }

  // tan(α) = 1/n  <=>  n = 1 / tan(α)
  private neigungWinkel(): Aufgabe {
    const n = randChoice(NEIGUNGEN);
    const alphaRad = Math.atan(1 / n);
    const alphaGrad = (alphaRad * 180) / Math.PI;
    const gesuchtN = Math.random() < 0.5;

    if (!gesuchtN) {
      return {
        id: nextId('nw'), kategorie: 'neigung-winkel',
        gegeben: [{ label: 'Neigung', wert: `1 : ${formatDE(n, n % 1 === 0 ? 0 : 1)}` }],
        gesuchtLabel: 'Weichenwinkel α', gesuchtEinheit: '°',
        korrekterWert: alphaGrad, toleranzAbs: tol(alphaGrad, 0.02, 0.05), nachkommastellen: 2,
        rechenweg: `tan α = 1 / n = 1 / ${formatDE(n, n % 1 === 0 ? 0 : 1)} = ${formatDE(1 / n, 5)}. α = arctan(${formatDE(1 / n, 5)}) = ${formatDE(alphaGrad, 2)}°`,
      };
    }
    return {
      id: nextId('nw'), kategorie: 'neigung-winkel',
      gegeben: [{ label: 'Weichenwinkel α', wert: `${formatDE(alphaGrad, 2)}°` }],
      gesuchtLabel: 'Neigung n (aus 1 : n)', gesuchtEinheit: '',
      korrekterWert: n, toleranzAbs: tol(n, 0.02, 0.2), nachkommastellen: 1,
      rechenweg: `n = 1 / tan α = 1 / tan(${formatDE(alphaGrad, 2)}°) = 1 / ${formatDE(1 / n, 5)} = ${formatDE(n, 1)}`,
    };
  }

  // z = c × n  (aus tan α = c / z, mit n = 1/tan α)
  private zungenlaenge(): Aufgabe {
    const n = randChoice(NEIGUNGEN);
    const c = randStep(100, 220, 5);
    const z = c * n;
    const gesucht = randChoice(['z', 'c', 'n'] as const);

    if (gesucht === 'z') {
      return {
        id: nextId('zl'), kategorie: 'zungenlaenge',
        gegeben: [{ label: 'Wurzelabstand c', wert: `${formatDE(c, 0)} mm` }, { label: 'Neigung', wert: `1 : ${formatDE(n, n % 1 === 0 ? 0 : 1)}` }],
        gesuchtLabel: 'Zungenlänge z', gesuchtEinheit: 'mm',
        korrekterWert: z, toleranzAbs: tol(z, 0.02, 20), nachkommastellen: 0,
        rechenweg: `z = c × n = ${formatDE(c, 0)} × ${formatDE(n, n % 1 === 0 ? 0 : 1)} = ${formatDE(z, 0)} mm`,
      };
    }
    if (gesucht === 'c') {
      return {
        id: nextId('zl'), kategorie: 'zungenlaenge',
        gegeben: [{ label: 'Zungenlänge z', wert: `${formatDE(z, 0)} mm` }, { label: 'Neigung', wert: `1 : ${formatDE(n, n % 1 === 0 ? 0 : 1)}` }],
        gesuchtLabel: 'Wurzelabstand c', gesuchtEinheit: 'mm',
        korrekterWert: c, toleranzAbs: tol(c, 0.02, 3), nachkommastellen: 0,
        rechenweg: `c = z / n = ${formatDE(z, 0)} / ${formatDE(n, n % 1 === 0 ? 0 : 1)} = ${formatDE(c, 0)} mm`,
      };
    }
    return {
      id: nextId('zl'), kategorie: 'zungenlaenge',
      gegeben: [{ label: 'Zungenlänge z', wert: `${formatDE(z, 0)} mm` }, { label: 'Wurzelabstand c', wert: `${formatDE(c, 0)} mm` }],
      gesuchtLabel: 'Neigung n (aus 1 : n)', gesuchtEinheit: '',
      korrekterWert: n, toleranzAbs: tol(n, 0.02, 0.2), nachkommastellen: 1,
      rechenweg: `n = z / c = ${formatDE(z, 0)} / ${formatDE(c, 0)} = ${formatDE(n, 1)}`,
    };
  }

  // L ≈ R / n (ueberschlaegige Laenge des Bogenteils einer einfachen Weiche)
  private weichenlaenge(): Aufgabe {
    const r = randChoice(RADIEN);
    const n = randChoice(NEIGUNGEN_LAENGE);
    const l = r / n;
    const gesucht = randChoice(['l', 'r', 'n'] as const);

    if (gesucht === 'l') {
      return {
        id: nextId('wl'), kategorie: 'weichenlaenge',
        gegeben: [{ label: 'Bogenradius R', wert: `${formatDE(r, 0)} m` }, { label: 'Neigung', wert: `1 : ${formatDE(n, n % 1 === 0 ? 0 : 1)}` }],
        gesuchtLabel: 'Länge L (überschlägig)', gesuchtEinheit: 'm',
        korrekterWert: l, toleranzAbs: tol(l, 0.02, 0.3), nachkommastellen: 1,
        rechenweg: `L ≈ R / n = ${formatDE(r, 0)} / ${formatDE(n, n % 1 === 0 ? 0 : 1)} = ${formatDE(l, 1)} m`,
      };
    }
    if (gesucht === 'r') {
      return {
        id: nextId('wl'), kategorie: 'weichenlaenge',
        gegeben: [{ label: 'Länge L', wert: `${formatDE(l, 1)} m` }, { label: 'Neigung', wert: `1 : ${formatDE(n, n % 1 === 0 ? 0 : 1)}` }],
        gesuchtLabel: 'Bogenradius R', gesuchtEinheit: 'm',
        korrekterWert: r, toleranzAbs: tol(r, 0.02, 10), nachkommastellen: 0,
        rechenweg: `R ≈ L × n = ${formatDE(l, 1)} × ${formatDE(n, n % 1 === 0 ? 0 : 1)} = ${formatDE(r, 0)} m`,
      };
    }
    return {
      id: nextId('wl'), kategorie: 'weichenlaenge',
      gegeben: [{ label: 'Länge L', wert: `${formatDE(l, 1)} m` }, { label: 'Bogenradius R', wert: `${formatDE(r, 0)} m` }],
      gesuchtLabel: 'Neigung n (aus 1 : n)', gesuchtEinheit: '',
      korrekterWert: n, toleranzAbs: tol(n, 0.02, 0.2), nachkommastellen: 1,
      rechenweg: `n ≈ R / L = ${formatDE(r, 0)} / ${formatDE(l, 1)} = ${formatDE(n, 1)}`,
    };
  }
}

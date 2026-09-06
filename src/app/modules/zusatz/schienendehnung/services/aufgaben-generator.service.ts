import { Injectable } from '@angular/core';
import { Aufgabe, DiagrammTyp, KategorieId, KategorieInfo } from '../models/schienendehnung.models';
import { formatDE, nextId, randChoice, randStep } from './schienendehnung-utils';

export const KATEGORIEN: KategorieInfo[] = [
  { id: 'laengenaenderung', label: 'Längenänderung durch Temperatur', formel: 'ΔL = α × l₀ × ΔT', diagramm: 'dehnung' },
  { id: 'luekenschluss', label: 'Lückenschluss bei Erwärmung', formel: 'ΔL = α × l₀ × (T₂ − T₁)', diagramm: 'luecke' },
];

export function diagrammFuer(kategorie: KategorieId): DiagrammTyp {
  return KATEGORIEN.find(k => k.id === kategorie)?.diagramm ?? 'dehnung';
}

/** Thermischer Laengenausdehnungskoeffizient von Schienenstahl, siehe schiene.json (Quelle: metalzenith.com). */
const ALPHA = 0.000011;
const STANDARD_LAENGEN = [12, 15, 30, 60];

function tol(value: number, relPct: number, floor: number): number {
  return Math.max(Math.abs(value) * relPct, floor);
}

@Injectable({ providedIn: 'root' })
export class AufgabenGeneratorService {
  generate(kategorie?: KategorieId): Aufgabe {
    const gewaehlt = kategorie ?? randChoice(KATEGORIEN).id;
    switch (gewaehlt) {
      case 'laengenaenderung': return this.laengenaenderung();
      case 'luekenschluss': return this.luekenschluss();
      default: return this.laengenaenderung();
    }
  }

  // ΔL[mm] = α × l0[m] × ΔT[K] × 1000
  private laengenaenderung(): Aufgabe {
    const l0 = randStep(10, 300, 5);
    const dT = randStep(-30, 50, 1);
    const dL = ALPHA * l0 * dT * 1000;
    const gesucht = randChoice(['dl', 'l0', 'dt'] as const);

    if (gesucht === 'dl') {
      return {
        id: nextId('la'), kategorie: 'laengenaenderung',
        gegeben: [{ label: 'l₀', wert: `${formatDE(l0, 0)} m` }, { label: 'ΔT', wert: `${formatDE(dT, 0)} K` }],
        gesuchtLabel: 'Längenänderung ΔL', gesuchtEinheit: 'mm',
        korrekterWert: dL, toleranzAbs: tol(dL, 0.02, 0.3), nachkommastellen: 2,
        rechenweg: `ΔL = α × l₀ × ΔT = 0,000011 × ${formatDE(l0, 0)} × ${formatDE(dT, 0)} = ${formatDE(ALPHA * l0 * dT, 6)} m = ${formatDE(dL, 2)} mm`,
      };
    }
    if (gesucht === 'l0') {
      return {
        id: nextId('la'), kategorie: 'laengenaenderung',
        gegeben: [{ label: 'ΔL', wert: `${formatDE(dL, 2)} mm` }, { label: 'ΔT', wert: `${formatDE(dT, 0)} K` }],
        gesuchtLabel: 'Ausgangslänge l₀', gesuchtEinheit: 'm',
        korrekterWert: l0, toleranzAbs: tol(l0, 0.02, 1), nachkommastellen: 0,
        rechenweg: `l₀ = ΔL / (α × ΔT) = ${formatDE(dL, 2)} mm / (0,000011 × ${formatDE(dT, 0)}) = ${formatDE(dL / 1000, 6)} m / ${formatDE(ALPHA * dT, 8)} = ${formatDE(l0, 0)} m`,
      };
    }
    return {
      id: nextId('la'), kategorie: 'laengenaenderung',
      gegeben: [{ label: 'ΔL', wert: `${formatDE(dL, 2)} mm` }, { label: 'l₀', wert: `${formatDE(l0, 0)} m` }],
      gesuchtLabel: 'Temperaturänderung ΔT', gesuchtEinheit: 'K',
      korrekterWert: dT, toleranzAbs: tol(dT, 0.02, 0.5), nachkommastellen: 1,
      rechenweg: `ΔT = ΔL / (α × l₀) = ${formatDE(dL, 2)} mm / (0,000011 × ${formatDE(l0, 0)}) = ${formatDE(dL / 1000, 6)} m / ${formatDE(ALPHA * l0, 8)} = ${formatDE(dT, 1)} K`,
    };
  }

  // Lueckenschluss zwischen Einbau- und aktueller Temperatur: ΔL[mm] = α × l0[m] × (T2-T1)[K] × 1000
  private luekenschluss(): Aufgabe {
    const l0 = randChoice(STANDARD_LAENGEN);
    const t1 = randStep(-5, 20, 1);
    const t2 = t1 + randStep(5, 45, 1);
    const dT = t2 - t1;
    const dL = ALPHA * l0 * dT * 1000;
    const gesucht = randChoice(['dl', 't2', 'l0'] as const);

    if (gesucht === 'dl') {
      return {
        id: nextId('ls'), kategorie: 'luekenschluss',
        gegeben: [{ label: 'Schienenlänge l₀', wert: `${formatDE(l0, 0)} m` }, { label: 'Einbautemperatur T₁', wert: `${formatDE(t1, 0)} °C` }, { label: 'Aktuelle Temperatur T₂', wert: `${formatDE(t2, 0)} °C` }],
        gesuchtLabel: 'Lückenschluss ΔL', gesuchtEinheit: 'mm',
        korrekterWert: dL, toleranzAbs: tol(dL, 0.02, 0.3), nachkommastellen: 2,
        rechenweg: `ΔT = T₂ − T₁ = ${formatDE(t2, 0)} − ${formatDE(t1, 0)} = ${formatDE(dT, 0)} K. ΔL = α × l₀ × ΔT = 0,000011 × ${formatDE(l0, 0)} × ${formatDE(dT, 0)} = ${formatDE(dL, 2)} mm`,
      };
    }
    if (gesucht === 't2') {
      return {
        id: nextId('ls'), kategorie: 'luekenschluss',
        gegeben: [{ label: 'Schienenlänge l₀', wert: `${formatDE(l0, 0)} m` }, { label: 'Einbautemperatur T₁', wert: `${formatDE(t1, 0)} °C` }, { label: 'Lückenschluss ΔL', wert: `${formatDE(dL, 2)} mm` }],
        gesuchtLabel: 'Aktuelle Temperatur T₂', gesuchtEinheit: '°C',
        korrekterWert: t2, toleranzAbs: tol(t2, 0.02, 1), nachkommastellen: 0,
        rechenweg: `ΔT = ΔL / (α × l₀) = ${formatDE(dL, 2)} mm / (0,000011 × ${formatDE(l0, 0)}) = ${formatDE(dT, 1)} K. T₂ = T₁ + ΔT = ${formatDE(t1, 0)} + ${formatDE(dT, 1)} = ${formatDE(t2, 0)} °C`,
      };
    }
    return {
      id: nextId('ls'), kategorie: 'luekenschluss',
      gegeben: [{ label: 'Einbautemperatur T₁', wert: `${formatDE(t1, 0)} °C` }, { label: 'Aktuelle Temperatur T₂', wert: `${formatDE(t2, 0)} °C` }, { label: 'Lückenschluss ΔL', wert: `${formatDE(dL, 2)} mm` }],
      gesuchtLabel: 'Schienenlänge l₀', gesuchtEinheit: 'm',
      korrekterWert: l0, toleranzAbs: tol(l0, 0.02, 1), nachkommastellen: 0,
      rechenweg: `ΔT = T₂ − T₁ = ${formatDE(dT, 0)} K. l₀ = ΔL / (α × ΔT) = ${formatDE(dL, 2)} mm / (0,000011 × ${formatDE(dT, 0)}) = ${formatDE(l0, 0)} m`,
    };
  }
}

import { Injectable } from '@angular/core';
import { Aufgabe, DiagrammTyp, KategorieId, KategorieInfo } from '../models/trassierung.models';
import { formatDE, nextId, randChoice, randStep } from './trassierung-utils';

export const KATEGORIEN: KategorieInfo[] = [
  { id: 'ausrundungsradius-regelwert', block: 'neigungswechsel', label: 'Ausrundungsradius (Regelwert)', formel: 'r = 0,4 × Ve²', diagramm: 'ausrundung' },
  { id: 'tangente-ausrundungsradius', block: 'neigungswechsel', label: 'Tangentenlänge ↔ Ausrundungsradius', formel: 'lt = (ra / 2000) × N', diagramm: 'ausrundung' },
  { id: 'tangente-gleichgerichtet', block: 'neigungswechsel', label: 'Tangentenlänge, gleichgerichtete Neigung', formel: 'lt = (ra / 2000) × (N1 − N2)', diagramm: 'ausrundung' },
  { id: 'tangente-entgegengesetzt', block: 'neigungswechsel', label: 'Tangentenlänge, entgegengesetzte Neigung', formel: 'lt = (ra / 2000) × (N1 + N2)', diagramm: 'ausrundung' },
  { id: 'absetzmass-a', block: 'neigungswechsel', label: 'Absetzmaß am Neigungswechsel (a-Wert)', formel: 'a = lt² / (2 × ra)', diagramm: 'ausrundung' },
  { id: 'absetzmass-ordinate', block: 'neigungswechsel', label: 'Absetzmaß / Ordinate y', formel: 'y = ltx² / (2 × ra)', diagramm: 'ausrundung' },
  { id: 'hoehe-neigung-laenge', block: 'neigungswechsel', label: 'Höhenunterschied, Neigung, Länge', formel: 'Δh = L × N / 1000', diagramm: 'hoehe-neigung' },
  { id: 'pfeilhoehe-radius', block: 'neigungswechsel', label: 'Pfeilhöhe ↔ Radius (Wandersehne)', formel: 'hf = (a × b) / (2 × r)', diagramm: 'pfeilhoehe' },
  { id: 'magisches-dreieck', block: 'neigungswechsel', label: 'Magisches Dreieck (Böschung/Rampe)', formel: 'L = m × u', diagramm: 'boeschung' },
  { id: 'sform-schramm-laenge', block: 'ueberhoehung', label: 'S-Form nach Schramm – Rampenlänge', formel: 'L_RS = n × 2 × u', diagramm: 'sform' },
  { id: 'sform-schramm-ux', block: 'ueberhoehung', label: 'S-Form Schramm – Überhöhung im Verlauf', formel: 'ux = (2 × u × lx²) / L_RS²', diagramm: 'sform' },
  { id: 'sform-bloss-laenge', block: 'ueberhoehung', label: 'S-Form nach Bloss – Rampenlänge', formel: 'L_RB = n × 1,5 × u', diagramm: 'sform' },
  { id: 'sform-bloss-ux', block: 'ueberhoehung', label: 'S-Form Bloss – Überhöhung im Verlauf', formel: 'ux = (3u/L²)x² − (2u/L³)x³', diagramm: 'sform' },
  { id: 'uebergangsbogen-linear', block: 'ueberhoehung', label: 'Übergangsbogen (gerade Krümmungslinie)', formel: 'hfx = (hf / L_U) × lx', diagramm: 'linearrampe' },
  { id: 'ueberhoehungsrampe-linear', block: 'ueberhoehung', label: 'Lineare Überhöhungsrampe', formel: 'ux = (u / L_R) × lx', diagramm: 'linearrampe' },
  { id: 'verwindung', block: 'ueberhoehung', label: 'Verwindung (VW)', formel: 'VW = (Δu / Basislänge) × 1000', diagramm: 'verwindung' },
];

export function diagrammFuer(kategorie: KategorieId): DiagrammTyp {
  return KATEGORIEN.find(k => k.id === kategorie)?.diagramm ?? 'ausrundung';
}

function tol(value: number, relPct: number, floor: number): number {
  return Math.max(Math.abs(value) * relPct, floor);
}

@Injectable({ providedIn: 'root' })
export class AufgabenGeneratorService {
  generate(kategorie?: KategorieId): Aufgabe {
    const gewaehlt = kategorie ?? randChoice(KATEGORIEN).id;
    switch (gewaehlt) {
      case 'ausrundungsradius-regelwert': return this.ausrundungsradiusRegelwert();
      case 'tangente-ausrundungsradius': return this.tangenteAusrundungsradius();
      case 'tangente-gleichgerichtet': return this.tangenteGleichgerichtet();
      case 'tangente-entgegengesetzt': return this.tangenteEntgegengesetzt();
      case 'absetzmass-a': return this.absetzmassA();
      case 'absetzmass-ordinate': return this.absetzmassOrdinate();
      case 'hoehe-neigung-laenge': return this.hoeheNeigungLaenge();
      case 'pfeilhoehe-radius': return this.pfeilhoeheRadius();
      case 'magisches-dreieck': return this.magischesDreieck();
      case 'sform-schramm-laenge': return this.sformLaenge('sform-schramm-laenge', 2);
      case 'sform-schramm-ux': return this.sformSchrammUx();
      case 'sform-bloss-laenge': return this.sformLaenge('sform-bloss-laenge', 1.5);
      case 'sform-bloss-ux': return this.sformBlossUx();
      case 'uebergangsbogen-linear': return this.linearRampe('uebergangsbogen-linear');
      case 'ueberhoehungsrampe-linear': return this.linearRampe('ueberhoehungsrampe-linear');
      case 'verwindung': return this.verwindung();
      default: return this.ausrundungsradiusRegelwert();
    }
  }

  // 1) r = 0,4 × Ve²
  private ausrundungsradiusRegelwert(): Aufgabe {
    const ve = randStep(80, 300, 10);
    const r = 0.4 * ve * ve;
    return {
      id: nextId('ar'),
      kategorie: 'ausrundungsradius-regelwert',
      gegeben: [{ label: 'Ve', wert: `${formatDE(ve, 0)} km/h` }],
      gesuchtLabel: 'Ausrundungsradius r',
      gesuchtEinheit: 'm',
      korrekterWert: r,
      toleranzAbs: tol(r, 0.02, 20),
      nachkommastellen: 0,
      rechenweg: `r = 0,4 × Ve² = 0,4 × ${formatDE(ve, 0)}² = 0,4 × ${formatDE(ve * ve, 0)} = ${formatDE(r, 0)} m`,
    };
  }

  // 2+3) lt = (ra/2000) × N  <=>  ra = (lt×2000)/N  <=>  N = (lt×2000)/ra
  private tangenteAusrundungsradius(): Aufgabe {
    const ra = randStep(2000, 30000, 500);
    const n = randStep(0.5, 25, 0.1);
    const lt = (ra / 2000) * n;
    const gesucht = randChoice(['lt', 'ra', 'n'] as const);

    if (gesucht === 'lt') {
      return {
        id: nextId('ta'), kategorie: 'tangente-ausrundungsradius',
        gegeben: [{ label: 'ra', wert: `${formatDE(ra, 0)} m` }, { label: 'ΔN', wert: `${formatDE(n, 3)} ‰` }],
        gesuchtLabel: 'Tangentenlänge lt', gesuchtEinheit: 'm',
        korrekterWert: lt, toleranzAbs: tol(lt, 0.02, 0.05), nachkommastellen: 2,
        rechenweg: `lt = (ra / 2000) × N = (${formatDE(ra, 0)} / 2000) × ${formatDE(n, 3)} = ${formatDE(ra / 2000, 4)} × ${formatDE(n, 3)} = ${formatDE(lt, 2)} m`,
      };
    }
    if (gesucht === 'ra') {
      return {
        id: nextId('ta'), kategorie: 'tangente-ausrundungsradius',
        gegeben: [{ label: 'lt', wert: `${formatDE(lt, 2)} m` }, { label: 'ΔN', wert: `${formatDE(n, 3)} ‰` }],
        gesuchtLabel: 'Ausrundungsradius ra', gesuchtEinheit: 'm',
        korrekterWert: ra, toleranzAbs: tol(ra, 0.02, 20), nachkommastellen: 0,
        rechenweg: `ra = (lt × 2000) / ΔN = (${formatDE(lt, 2)} × 2000) / ${formatDE(n, 3)} = ${formatDE(lt * 2000, 1)} / ${formatDE(n, 3)} = ${formatDE(ra, 0)} m`,
      };
    }
    return {
      id: nextId('ta'), kategorie: 'tangente-ausrundungsradius',
      gegeben: [{ label: 'lt', wert: `${formatDE(lt, 2)} m` }, { label: 'ra', wert: `${formatDE(ra, 0)} m` }],
      gesuchtLabel: 'Neigung ΔN', gesuchtEinheit: '‰',
      korrekterWert: n, toleranzAbs: tol(n, 0.02, 0.02), nachkommastellen: 3,
      rechenweg: `N = (lt × 2000) / ra = (${formatDE(lt, 2)} × 2000) / ${formatDE(ra, 0)} = ${formatDE(lt * 2000, 1)} / ${formatDE(ra, 0)} = ${formatDE(n, 3)} ‰`,
    };
  }

  // 4) lt = (ra/2000) × (N1 − N2), gleichgerichtete Neigung, N1 > N2 > 0
  private tangenteGleichgerichtet(): Aufgabe {
    const ra = randStep(2000, 30000, 500);
    const n1 = randStep(2, 25, 0.01);
    const n2 = randStep(0.1, Math.max(n1 - 0.5, 0.6), 0.01);
    const lt = (ra / 2000) * (n1 - n2);
    const gesuchtRa = Math.random() < 0.3;

    if (!gesuchtRa) {
      return {
        id: nextId('tg'), kategorie: 'tangente-gleichgerichtet',
        gegeben: [{ label: 'ra', wert: `${formatDE(ra, 0)} m` }, { label: 'N1', wert: `${formatDE(n1, 3)} ‰` }, { label: 'N2', wert: `${formatDE(n2, 3)} ‰` }],
        gesuchtLabel: 'Tangentenlänge lt', gesuchtEinheit: 'm',
        korrekterWert: lt, toleranzAbs: tol(lt, 0.02, 0.05), nachkommastellen: 2,
        rechenweg: `lt = (ra / 2000) × (N1 − N2) = (${formatDE(ra, 0)} / 2000) × (${formatDE(n1, 3)} − ${formatDE(n2, 3)}) = ${formatDE(ra / 2000, 4)} × ${formatDE(n1 - n2, 3)} = ${formatDE(lt, 2)} m`,
      };
    }
    return {
      id: nextId('tg'), kategorie: 'tangente-gleichgerichtet',
      gegeben: [{ label: 'lt', wert: `${formatDE(lt, 2)} m` }, { label: 'N1', wert: `${formatDE(n1, 3)} ‰` }, { label: 'N2', wert: `${formatDE(n2, 3)} ‰` }],
      gesuchtLabel: 'Ausrundungsradius ra', gesuchtEinheit: 'm',
      korrekterWert: ra, toleranzAbs: tol(ra, 0.02, 20), nachkommastellen: 0,
      rechenweg: `ra = lt / ((N1 − N2) / 2000) = ${formatDE(lt, 2)} / (${formatDE(n1 - n2, 3)} / 2000) = ${formatDE(lt, 2)} / ${formatDE((n1 - n2) / 2000, 6)} = ${formatDE(ra, 0)} m`,
    };
  }

  // 5) lt = (ra/2000) × (N1 + N2), entgegengesetzte Neigung
  private tangenteEntgegengesetzt(): Aufgabe {
    const ra = randStep(2000, 30000, 500);
    const n1 = randStep(0.5, 25, 0.01);
    const n2 = randStep(0.5, 25, 0.01);
    const lt = (ra / 2000) * (n1 + n2);
    const gesuchtRa = Math.random() < 0.3;

    if (!gesuchtRa) {
      return {
        id: nextId('te'), kategorie: 'tangente-entgegengesetzt',
        gegeben: [{ label: 'ra', wert: `${formatDE(ra, 0)} m` }, { label: 'N1', wert: `${formatDE(n1, 3)} ‰` }, { label: 'N2', wert: `${formatDE(n2, 3)} ‰` }],
        gesuchtLabel: 'Tangentenlänge lt', gesuchtEinheit: 'm',
        korrekterWert: lt, toleranzAbs: tol(lt, 0.02, 0.05), nachkommastellen: 2,
        rechenweg: `lt = (ra / 2000) × (N1 + N2) = (${formatDE(ra, 0)} / 2000) × (${formatDE(n1, 3)} + ${formatDE(n2, 3)}) = ${formatDE(ra / 2000, 4)} × ${formatDE(n1 + n2, 3)} = ${formatDE(lt, 2)} m`,
      };
    }
    return {
      id: nextId('te'), kategorie: 'tangente-entgegengesetzt',
      gegeben: [{ label: 'lt', wert: `${formatDE(lt, 2)} m` }, { label: 'N1', wert: `${formatDE(n1, 3)} ‰` }, { label: 'N2', wert: `${formatDE(n2, 3)} ‰` }],
      gesuchtLabel: 'Ausrundungsradius ra', gesuchtEinheit: 'm',
      korrekterWert: ra, toleranzAbs: tol(ra, 0.02, 20), nachkommastellen: 0,
      rechenweg: `ra = lt / ((N1 + N2) / 2000) = ${formatDE(lt, 2)} / (${formatDE(n1 + n2, 3)} / 2000) = ${formatDE(lt, 2)} / ${formatDE((n1 + n2) / 2000, 6)} = ${formatDE(ra, 0)} m`,
    };
  }

  // 6) a = lt² / (2×ra), Absetzmaß in mm
  private absetzmassA(): Aufgabe {
    const ra = randStep(2000, 20000, 500);
    const lt = randStep(10, 80, 0.5);
    const aM = (lt * lt) / (2 * ra);
    const aMm = aM * 1000;
    const gesuchtLt = Math.random() < 0.3;

    if (!gesuchtLt) {
      return {
        id: nextId('aa'), kategorie: 'absetzmass-a',
        gegeben: [{ label: 'lt', wert: `${formatDE(lt, 2)} m` }, { label: 'ra', wert: `${formatDE(ra, 0)} m` }],
        gesuchtLabel: 'Absetzmaß a', gesuchtEinheit: 'mm',
        korrekterWert: aMm, toleranzAbs: tol(aMm, 0.02, 1), nachkommastellen: 0,
        rechenweg: `a = lt² / (2 × ra) = ${formatDE(lt, 2)}² / (2 × ${formatDE(ra, 0)}) = ${formatDE(lt * lt, 2)} / ${formatDE(2 * ra, 0)} = ${formatDE(aM, 4)} m ≈ ${formatDE(aMm, 0)} mm`,
      };
    }
    return {
      id: nextId('aa'), kategorie: 'absetzmass-a',
      gegeben: [{ label: 'a', wert: `${formatDE(aMm, 0)} mm` }, { label: 'ra', wert: `${formatDE(ra, 0)} m` }],
      gesuchtLabel: 'Tangentenlänge lt', gesuchtEinheit: 'm',
      korrekterWert: lt, toleranzAbs: tol(lt, 0.02, 0.05), nachkommastellen: 2,
      rechenweg: `lt = √(2 × ra × a) = √(2 × ${formatDE(ra, 0)} × ${formatDE(aM, 4)} m) = √${formatDE(2 * ra * aM, 2)} = ${formatDE(lt, 2)} m`,
    };
  }

  // 7) y = ltx² / (2×ra), Ordinate von Anfangs-/Endausrundung zum NW
  private absetzmassOrdinate(): Aufgabe {
    const ra = randStep(2000, 20000, 500);
    const ltx = randStep(2, 30, 0.5);
    const yM = (ltx * ltx) / (2 * ra);
    const yMm = yM * 1000;
    return {
      id: nextId('ao'), kategorie: 'absetzmass-ordinate',
      gegeben: [{ label: 'ltx', wert: `${formatDE(ltx, 2)} m` }, { label: 'ra', wert: `${formatDE(ra, 0)} m` }],
      gesuchtLabel: 'Ordinate y', gesuchtEinheit: 'mm',
      korrekterWert: yMm, toleranzAbs: tol(yMm, 0.02, 1), nachkommastellen: 0,
      rechenweg: `y = ltx² / (2 × ra) = ${formatDE(ltx, 2)}² / (2 × ${formatDE(ra, 0)}) = ${formatDE(ltx * ltx, 2)} / ${formatDE(2 * ra, 0)} = ${formatDE(yM, 4)} m ≈ ${formatDE(yMm, 0)} mm`,
    };
  }

  // 8+9+10) Δh = L×N/1000, N = Δh×1000/L, L = Δh×1000/N
  private hoeheNeigungLaenge(): Aufgabe {
    const l = randStep(100, 1000, 5);
    const n = randStep(0.5, 25, 0.01);
    const dh = (l * n) / 1000;
    const gesucht = randChoice(['dh', 'n', 'l'] as const);

    if (gesucht === 'dh') {
      return {
        id: nextId('hn'), kategorie: 'hoehe-neigung-laenge',
        gegeben: [{ label: 'L', wert: `${formatDE(l, 0)} m` }, { label: 'N', wert: `${formatDE(n, 3)} ‰` }],
        gesuchtLabel: 'Höhenunterschied Δh', gesuchtEinheit: 'm',
        korrekterWert: dh, toleranzAbs: tol(dh, 0.02, 0.01), nachkommastellen: 3,
        rechenweg: `Δh = (L × N) / 1000 = (${formatDE(l, 0)} × ${formatDE(n, 3)}) / 1000 = ${formatDE(l * n, 2)} / 1000 = ${formatDE(dh, 3)} m`,
      };
    }
    if (gesucht === 'n') {
      return {
        id: nextId('hn'), kategorie: 'hoehe-neigung-laenge',
        gegeben: [{ label: 'Δh', wert: `${formatDE(dh, 3)} m` }, { label: 'L', wert: `${formatDE(l, 0)} m` }],
        gesuchtLabel: 'Neigung N', gesuchtEinheit: '‰',
        korrekterWert: n, toleranzAbs: tol(n, 0.02, 0.02), nachkommastellen: 3,
        rechenweg: `N = (Δh × 1000) / L = (${formatDE(dh, 3)} × 1000) / ${formatDE(l, 0)} = ${formatDE(dh * 1000, 1)} / ${formatDE(l, 0)} = ${formatDE(n, 3)} ‰`,
      };
    }
    return {
      id: nextId('hn'), kategorie: 'hoehe-neigung-laenge',
      gegeben: [{ label: 'Δh', wert: `${formatDE(dh, 3)} m` }, { label: 'N', wert: `${formatDE(n, 3)} ‰` }],
      gesuchtLabel: 'Länge L', gesuchtEinheit: 'm',
      korrekterWert: l, toleranzAbs: tol(l, 0.02, 2), nachkommastellen: 0,
      rechenweg: `L = (Δh × 1000) / N = (${formatDE(dh, 3)} × 1000) / ${formatDE(n, 3)} = ${formatDE(dh * 1000, 1)} / ${formatDE(n, 3)} = ${formatDE(l, 0)} m`,
    };
  }

  // 11+12) hf = (a×b)/(2×r), Wandersehne a=b=halbe Sehne
  private pfeilhoeheRadius(): Aufgabe {
    const r = randStep(300, 3000, 50);
    const sehne = randChoice([10, 20, 25, 30]);
    const ab = sehne / 2;
    const hfM = (ab * ab) / (2 * r);
    const hfMm = hfM * 1000;
    const gesuchtR = Math.random() < 0.4;

    if (!gesuchtR) {
      return {
        id: nextId('pr'), kategorie: 'pfeilhoehe-radius',
        gegeben: [{ label: 'r', wert: `${formatDE(r, 0)} m` }, { label: 'Wandersehne (a = b)', wert: `${formatDE(ab, 1)} m` }],
        gesuchtLabel: 'Pfeilhöhe hf', gesuchtEinheit: 'mm',
        korrekterWert: hfMm, toleranzAbs: tol(hfMm, 0.02, 1), nachkommastellen: 0,
        rechenweg: `hf = (a × b) / (2 × r) = (${formatDE(ab, 1)} × ${formatDE(ab, 1)}) / (2 × ${formatDE(r, 0)}) = ${formatDE(ab * ab, 2)} / ${formatDE(2 * r, 0)} = ${formatDE(hfM, 5)} m ≈ ${formatDE(hfMm, 0)} mm`,
      };
    }
    return {
      id: nextId('pr'), kategorie: 'pfeilhoehe-radius',
      gegeben: [{ label: 'hf', wert: `${formatDE(hfMm, 0)} mm` }, { label: 'Wandersehne (a = b)', wert: `${formatDE(ab, 1)} m` }],
      gesuchtLabel: 'Radius r', gesuchtEinheit: 'm',
      korrekterWert: r, toleranzAbs: tol(r, 0.02, 5), nachkommastellen: 0,
      rechenweg: `r = (a × b) / (2 × hf) = (${formatDE(ab, 1)} × ${formatDE(ab, 1)}) / (2 × ${formatDE(hfM, 5)} m) = ${formatDE(ab * ab, 2)} / ${formatDE(2 * hfM, 5)} = ${formatDE(r, 0)} m`,
    };
  }

  // 13) Magisches Dreieck: L = m × u (Böschung/Rampe)
  private magischesDreieck(): Aufgabe {
    const m = randChoice([1.5, 2, 2.5, 3, 5, 10, 20]);
    const u = randStep(0.3, 3, 0.05);
    const l = m * u;
    const gesucht = randChoice(['l', 'm', 'u'] as const);

    if (gesucht === 'l') {
      return {
        id: nextId('md'), kategorie: 'magisches-dreieck',
        gegeben: [{ label: 'Neigungsverhältnis 1 : m', wert: `1 : ${formatDE(m, 1)}` }, { label: 'u (Höhe)', wert: `${formatDE(u, 2)} m` }],
        gesuchtLabel: 'Rampenlänge L', gesuchtEinheit: 'm',
        korrekterWert: l, toleranzAbs: tol(l, 0.02, 0.05), nachkommastellen: 2,
        rechenweg: `L = m × u = ${formatDE(m, 1)} × ${formatDE(u, 2)} = ${formatDE(l, 2)} m`,
      };
    }
    if (gesucht === 'm') {
      return {
        id: nextId('md'), kategorie: 'magisches-dreieck',
        gegeben: [{ label: 'L', wert: `${formatDE(l, 2)} m` }, { label: 'u (Höhe)', wert: `${formatDE(u, 2)} m` }],
        gesuchtLabel: 'Neigungsverhältnis m (aus 1 : m)', gesuchtEinheit: '',
        korrekterWert: m, toleranzAbs: tol(m, 0.02, 0.1), nachkommastellen: 1,
        rechenweg: `m = L / u = ${formatDE(l, 2)} / ${formatDE(u, 2)} = ${formatDE(m, 1)}`,
      };
    }
    return {
      id: nextId('md'), kategorie: 'magisches-dreieck',
      gegeben: [{ label: 'L', wert: `${formatDE(l, 2)} m` }, { label: 'Neigungsverhältnis 1 : m', wert: `1 : ${formatDE(m, 1)}` }],
      gesuchtLabel: 'Höhe u', gesuchtEinheit: 'm',
      korrekterWert: u, toleranzAbs: tol(u, 0.02, 0.02), nachkommastellen: 2,
      rechenweg: `u = L / m = ${formatDE(l, 2)} / ${formatDE(m, 1)} = ${formatDE(u, 2)} m`,
    };
  }

  // 14) S-Form Schramm: L_RS = n × 2 × u   |   16) S-Form Bloss: L_RB = n × 1,5 × u
  private sformLaenge(kategorie: 'sform-schramm-laenge' | 'sform-bloss-laenge', faktor: number): Aufgabe {
    const n = randStep(300, 700, 50);
    const uMm = randStep(20, 180, 5);
    const lMm = n * faktor * uMm;
    const lM = lMm / 1000;
    const variable = kategorie === 'sform-schramm-laenge' ? 'L_RS' : 'L_RB';
    const faktorText = faktor === 2 ? '2' : '1,5';
    const gesucht = randChoice(['l', 'n', 'u'] as const);

    if (gesucht === 'l') {
      return {
        id: nextId('sl'), kategorie,
        gegeben: [{ label: 'Neigungsverhältnis n', wert: `1 : ${formatDE(n, 0)}` }, { label: 'u', wert: `${formatDE(uMm, 0)} mm` }],
        gesuchtLabel: `Rampenlänge ${variable}`, gesuchtEinheit: 'm',
        korrekterWert: lM, toleranzAbs: tol(lM, 0.02, 0.5), nachkommastellen: 2,
        rechenweg: `${variable} = n × ${faktorText} × u = ${formatDE(n, 0)} × ${faktorText} × ${formatDE(uMm, 0)} mm = ${formatDE(lMm, 0)} mm = ${formatDE(lM, 2)} m`,
      };
    }
    if (gesucht === 'n') {
      return {
        id: nextId('sl'), kategorie,
        gegeben: [{ label: variable, wert: `${formatDE(lM, 2)} m` }, { label: 'u', wert: `${formatDE(uMm, 0)} mm` }],
        gesuchtLabel: 'Neigungsverhältnis n (aus 1 : n)', gesuchtEinheit: '',
        korrekterWert: n, toleranzAbs: tol(n, 0.02, 3), nachkommastellen: 0,
        rechenweg: `n = ${variable} / (${faktorText} × u) = ${formatDE(lMm, 0)} mm / (${faktorText} × ${formatDE(uMm, 0)} mm) = ${formatDE(n, 0)}`,
      };
    }
    return {
      id: nextId('sl'), kategorie,
      gegeben: [{ label: variable, wert: `${formatDE(lM, 2)} m` }, { label: 'Neigungsverhältnis n', wert: `1 : ${formatDE(n, 0)}` }],
      gesuchtLabel: 'Überhöhung u', gesuchtEinheit: 'mm',
      korrekterWert: uMm, toleranzAbs: tol(uMm, 0.02, 1), nachkommastellen: 0,
      rechenweg: `u = ${variable} / (${faktorText} × n) = ${formatDE(lMm, 0)} mm / (${faktorText} × ${formatDE(n, 0)}) = ${formatDE(uMm, 0)} mm`,
    };
  }

  // 14b) S-Form Schramm, Überhöhung im Verlauf: ux = (2×u×lx²)/L_RS²
  private sformSchrammUx(): Aufgabe {
    const lRs = randStep(20, 90, 1);
    const uMm = randStep(20, 180, 5);
    const lx = randStep(1, Math.max(lRs / 2, 2), 0.5);
    const ux = (2 * uMm * lx * lx) / (lRs * lRs);
    return {
      id: nextId('ssu'), kategorie: 'sform-schramm-ux',
      gegeben: [{ label: 'u', wert: `${formatDE(uMm, 0)} mm` }, { label: 'L_RS', wert: `${formatDE(lRs, 0)} m` }, { label: 'lx (ab RA)', wert: `${formatDE(lx, 1)} m` }],
      gesuchtLabel: 'Überhöhung ux', gesuchtEinheit: 'mm',
      korrekterWert: ux, toleranzAbs: tol(ux, 0.02, 0.5), nachkommastellen: 1,
      rechenweg: `ux = (2 × u × lx²) / L_RS² = (2 × ${formatDE(uMm, 0)} × ${formatDE(lx, 1)}²) / ${formatDE(lRs, 0)}² = ${formatDE(2 * uMm * lx * lx, 1)} / ${formatDE(lRs * lRs, 0)} = ${formatDE(ux, 1)} mm`,
    };
  }

  // 16b) S-Form Bloss, Überhöhung im Verlauf: ux = (3u/L²)x² − (2u/L³)x³
  private sformBlossUx(): Aufgabe {
    const lRb = randStep(15, 70, 1);
    const uMm = randStep(20, 180, 5);
    const x = randStep(1, lRb, 0.5);
    const term1 = (3 * uMm / (lRb * lRb)) * x * x;
    const term2 = (2 * uMm / (lRb * lRb * lRb)) * x * x * x;
    const ux = term1 - term2;
    return {
      id: nextId('sbu'), kategorie: 'sform-bloss-ux',
      gegeben: [{ label: 'u', wert: `${formatDE(uMm, 0)} mm` }, { label: 'L_RB', wert: `${formatDE(lRb, 0)} m` }, { label: 'x (ab RA)', wert: `${formatDE(x, 1)} m` }],
      gesuchtLabel: 'Überhöhung ux', gesuchtEinheit: 'mm',
      korrekterWert: ux, toleranzAbs: tol(ux, 0.03, 1), nachkommastellen: 1,
      rechenweg: `ux = (3u/L²)×x² − (2u/L³)×x³ = ${formatDE(term1, 2)} mm − ${formatDE(term2, 2)} mm = ${formatDE(ux, 1)} mm`,
    };
  }

  // 15) hfx = (hf/L_U)×lx   |   17) ux = (u/L_R)×lx  — beide lineare Rampen
  private linearRampe(kategorie: 'uebergangsbogen-linear' | 'ueberhoehungsrampe-linear'): Aufgabe {
    const istUeb = kategorie === 'uebergangsbogen-linear';
    const gesamtLabel = istUeb ? 'L_U' : 'L_R';
    const hoeheLabel = istUeb ? 'hf' : 'u';
    const zwischenLabel = istUeb ? 'hfx' : 'ux';

    const gesamtL = randStep(20, istUeb ? 200 : 150, 1);
    const hoehe = randStep(10, 300, 5);
    const lx = randStep(1, gesamtL, 0.5);
    const zwischen = (hoehe / gesamtL) * lx;

    const gesucht = randChoice(['zwischen', 'hoehe', 'gesamtL', 'lx'] as const);

    if (gesucht === 'zwischen') {
      return {
        id: nextId('lr'), kategorie,
        gegeben: [{ label: hoeheLabel, wert: `${formatDE(hoehe, 0)} mm` }, { label: gesamtLabel, wert: `${formatDE(gesamtL, 0)} m` }, { label: 'lx', wert: `${formatDE(lx, 1)} m` }],
        gesuchtLabel: `Zwischenwert ${zwischenLabel}`, gesuchtEinheit: 'mm',
        korrekterWert: zwischen, toleranzAbs: tol(zwischen, 0.02, 0.5), nachkommastellen: 1,
        rechenweg: `${zwischenLabel} = (${hoeheLabel} / ${gesamtLabel}) × lx = (${formatDE(hoehe, 0)} / ${formatDE(gesamtL, 0)}) × ${formatDE(lx, 1)} = ${formatDE(hoehe / gesamtL, 4)} × ${formatDE(lx, 1)} = ${formatDE(zwischen, 1)} mm`,
      };
    }
    if (gesucht === 'hoehe') {
      return {
        id: nextId('lr'), kategorie,
        gegeben: [{ label: zwischenLabel, wert: `${formatDE(zwischen, 1)} mm` }, { label: gesamtLabel, wert: `${formatDE(gesamtL, 0)} m` }, { label: 'lx', wert: `${formatDE(lx, 1)} m` }],
        gesuchtLabel: `Endwert ${hoeheLabel}`, gesuchtEinheit: 'mm',
        korrekterWert: hoehe, toleranzAbs: tol(hoehe, 0.02, 1), nachkommastellen: 0,
        rechenweg: `${hoeheLabel} = (${zwischenLabel} × ${gesamtLabel}) / lx = (${formatDE(zwischen, 1)} × ${formatDE(gesamtL, 0)}) / ${formatDE(lx, 1)} = ${formatDE(hoehe, 0)} mm`,
      };
    }
    if (gesucht === 'gesamtL') {
      return {
        id: nextId('lr'), kategorie,
        gegeben: [{ label: zwischenLabel, wert: `${formatDE(zwischen, 1)} mm` }, { label: hoeheLabel, wert: `${formatDE(hoehe, 0)} mm` }, { label: 'lx', wert: `${formatDE(lx, 1)} m` }],
        gesuchtLabel: `Gesamtlänge ${gesamtLabel}`, gesuchtEinheit: 'm',
        korrekterWert: gesamtL, toleranzAbs: tol(gesamtL, 0.02, 1), nachkommastellen: 0,
        rechenweg: `${gesamtLabel} = (${hoeheLabel} × lx) / ${zwischenLabel} = (${formatDE(hoehe, 0)} × ${formatDE(lx, 1)}) / ${formatDE(zwischen, 1)} = ${formatDE(gesamtL, 0)} m`,
      };
    }
    return {
      id: nextId('lr'), kategorie,
      gegeben: [{ label: zwischenLabel, wert: `${formatDE(zwischen, 1)} mm` }, { label: hoeheLabel, wert: `${formatDE(hoehe, 0)} mm` }, { label: gesamtLabel, wert: `${formatDE(gesamtL, 0)} m` }],
      gesuchtLabel: 'Position lx', gesuchtEinheit: 'm',
      korrekterWert: lx, toleranzAbs: tol(lx, 0.02, 0.3), nachkommastellen: 1,
      rechenweg: `lx = (${zwischenLabel} × ${gesamtLabel}) / ${hoeheLabel} = (${formatDE(zwischen, 1)} × ${formatDE(gesamtL, 0)}) / ${formatDE(hoehe, 0)} = ${formatDE(lx, 1)} m`,
    };
  }

  // 18) Verwindung VW = (Δu / Basislänge) × 1000
  private verwindung(): Aufgabe {
    const basisM = randChoice([2, 2.5, 3]);
    const basisMm = basisM * 1000;
    const u1 = randStep(-20, 60, 1);
    const du = randStep(3, 40, 1);
    const u2 = u1 + du;
    const vw = (du / basisMm) * 1000;

    return {
      id: nextId('vw'), kategorie: 'verwindung',
      gegeben: [
        { label: 'u1', wert: `${formatDE(u1, 0)} mm` },
        { label: 'u2', wert: `${formatDE(u2, 0)} mm` },
        { label: 'Basislänge', wert: `${formatDE(basisM, 2)} m` },
      ],
      gesuchtLabel: 'Verwindung VW', gesuchtEinheit: '‰',
      korrekterWert: vw, toleranzAbs: tol(vw, 0.02, 0.1), nachkommastellen: 2,
      rechenweg: `Überhöhungsunterschied = |u2 − u1| = |${formatDE(u2, 0)} − ${formatDE(u1, 0)}| = ${formatDE(du, 0)} mm. Basislänge = ${formatDE(basisM, 2)} m = ${formatDE(basisMm, 0)} mm. VW = (Δu / Basislänge) × 1000 = (${formatDE(du, 0)} / ${formatDE(basisMm, 0)}) × 1000 = ${formatDE(vw, 2)} ‰`,
    };
  }
}

/**
 * Oberbauarten fuer den Modus "Baustelle" (Materialbedarf einer Gleiserneuerung).
 *
 * Stueckzahlen PRO SCHWELLE (= 2 Schienenstuetzpunkte).
 * Quellen / Stand 2026-11-12:
 *  - W 14 auf Betonschwelle: Bauteile Skl, Wfp, Ss, Sdue, Zw lt. Vossloh System W 14
 *    (https://www.vossloh.com/en/products/system-w-14); je Stuetzpunkt 2 Wfp, 2 Skl, 2 Ss, 1 Zw.
 *    Ausschreibung (evergabe) nennt je Satz "Ss 35 + Uls 7" und "Skl 14". Duebel stecken in der Schwelle.
 *  - Ks auf Holz: Skl 12 + Uls 6 ersetzen Klemmplatte + Federring Fe 6 des Oberbaus K
 *    (Wikipedia "Oberbau K", Abschnitt Ks; Glossar der App).
 *  ZU PRUEFEN (Tim): Schwellenschrauben je Rippenplatte (hier 4 → 8 je Schwelle),
 *  Zwischenlagen-Bezeichnungen, Regel-Schwellenteilungen (Beton 60 cm, Holz 65 cm).
 */

export interface Bauteil {
  key: string;
  name: string;
  kurz: string;
}

export const BAUTEILE: Record<string, Bauteil> = {
  wfp: { key: 'wfp', name: 'Winkelführungsplatte Wfp 14', kurz: 'Wfp 14' },
  skl14: { key: 'skl14', name: 'Spannklemme Skl 14', kurz: 'Skl 14' },
  ss35: { key: 'ss35', name: 'Schwellenschraube Ss 35 mit Uls 7', kurz: 'Ss 35' },
  zwB: { key: 'zwB', name: 'Zwischenlage (Betonschwelle)', kurz: 'Zw' },
  rp: { key: 'rp', name: 'Rippenplatte', kurz: 'Rippenplatte' },
  hs32: { key: 'hs32', name: 'Hakenschraube Hs 32 mit Mutter', kurz: 'Hs 32' },
  skl12: { key: 'skl12', name: 'Spannklemme Skl 12', kurz: 'Skl 12' },
  uls6: { key: 'uls6', name: 'Unterlegscheibe Uls 6', kurz: 'Uls 6' },
  kp: { key: 'kp', name: 'Klemmplatte', kurz: 'Klemmplatte' },
  fe6: { key: 'fe6', name: 'Federring Fe 6', kurz: 'Fe 6' },
  ss8: { key: 'ss8', name: 'Schwellenschraube Ss 8', kurz: 'Ss 8' },
  zwH: { key: 'zwH', name: 'Zwischenlage (Rippenplatte)', kurz: 'Zw' },
};

export interface Oberbauart {
  id: string;
  /** Beschreibung in Worten (leicht/mittel) */
  name: string;
  schwelle: string;
  /** Kurzbezeichnung der Befestigung in der Oberbauanordnung */
  befestigung: string;
  schiene: string;
  /** Regel-Schwellenteilung in cm */
  teilungCm: number;
  teile: { key: string; jeSchwelle: number }[];
}

export const OBERBAUARTEN: Oberbauart[] = [
  {
    id: 'b90-w14', name: 'Betonschwelle B90 mit W-Oberbau (W 14)', schwelle: 'Betonschwelle B90', befestigung: 'W 14', schiene: '60E2', teilungCm: 60,
    teile: [{ key: 'wfp', jeSchwelle: 4 }, { key: 'skl14', jeSchwelle: 4 }, { key: 'ss35', jeSchwelle: 4 }, { key: 'zwB', jeSchwelle: 2 }],
  },
  {
    id: 'b70-w14', name: 'Betonschwelle B70 mit W-Oberbau (W 14)', schwelle: 'Betonschwelle B70', befestigung: 'W 14', schiene: '54E4', teilungCm: 60,
    teile: [{ key: 'wfp', jeSchwelle: 4 }, { key: 'skl14', jeSchwelle: 4 }, { key: 'ss35', jeSchwelle: 4 }, { key: 'zwB', jeSchwelle: 2 }],
  },
  {
    id: 'holz-ks', name: 'Holzschwelle mit Ks-Oberbau (Rippenplatte + Skl 12)', schwelle: 'Holzschwelle', befestigung: 'Ks', schiene: '49E1', teilungCm: 65,
    teile: [{ key: 'rp', jeSchwelle: 2 }, { key: 'hs32', jeSchwelle: 4 }, { key: 'skl12', jeSchwelle: 4 }, { key: 'uls6', jeSchwelle: 4 }, { key: 'ss8', jeSchwelle: 8 }, { key: 'zwH', jeSchwelle: 2 }],
  },
  {
    id: 'holz-k', name: 'Holzschwelle mit K-Oberbau (Rippenplatte + Klemmplatte)', schwelle: 'Holzschwelle', befestigung: 'K', schiene: '49E1', teilungCm: 65,
    teile: [{ key: 'rp', jeSchwelle: 2 }, { key: 'hs32', jeSchwelle: 4 }, { key: 'kp', jeSchwelle: 4 }, { key: 'fe6', jeSchwelle: 4 }, { key: 'ss8', jeSchwelle: 8 }, { key: 'zwH', jeSchwelle: 2 }],
  },
];

/** Schwellen je km bei Teilung a (cm): 1000 m / a, aufgerundet (60 cm → 1667). */
export function schwellenJeKm(teilungCm: number): number {
  return Math.ceil(100000 / teilungCm);
}

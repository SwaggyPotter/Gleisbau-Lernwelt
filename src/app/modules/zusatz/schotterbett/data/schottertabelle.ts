/**
 * Schottertabelle zum Nachschlagen: Schotterbedarf je km Gleis (verdichtet,
 * Schwellen abgezogen). Aufbau: Zeilen = Schwellentypen mit je zwei
 * Bettungsdicken (30 / 35 cm), Spalten = Schotter vor Kopf 30 / 40 / 50 cm.
 * Seiten = eingleisig / zweigleisig (Gleisabstand 4,00 m) × Schwellenabstand.
 *
 * Gerechnet mit dem vereinfachten Modell aus services/schotter-rechnung.ts:
 * Trapez von Planum bis Schwellenoberkante, Böschung 1 : 1,5, ohne Überhöhung.
 * Keine Regelwerkswerte, sondern ein selbst gerechnetes Lernhilfsmittel.
 */
import { BOESCHUNG_N } from './regelwerk';
import { SCHWELLEN, Schwelle, schwelleById } from './schwellen';

export const TABELLE_ABSTAENDE_CM = [60, 63, 65] as const;
export const TABELLE_VOR_KOPF_CM = [30, 40, 50] as const;
export const TABELLE_BETTUNG_CM = [30, 35] as const;

/** Regelgleisabstand (EBO, Neubau) als Bezug für die zweigleisige Tabelle. */
export const GLEISABSTAND_REGEL_M = 4.0;

/**
 * Zuschlag für größeren Gleisabstand bei zweigleisigen Strecken: je volle
 * 10 cm über 4,00 m 1 % mehr Schotter. Ausbildungsregel (Tim), öffentlich
 * nicht belegt (Recherche 2026-11-04 ohne Fund).
 */
export function gleisabstandZuschlagProzent(gleisabstandM: number): number {
  if (gleisabstandM <= GLEISABSTAND_REGEL_M) return 0;
  return Math.floor(Math.round((gleisabstandM - GLEISABSTAND_REGEL_M) * 1000) / 100);
}

export type Gleise = 1 | 2;

export function wirksamerAbstandCm(s: Schwelle, abstandCm: number): number {
  return s.abstandFestCm ?? abstandCm;
}

/** Schotterbedarf in m³ je km Gleis (verdichtet), auf ganze m³ gerundet. */
export function tabellenwertM3ProKm(
  schwelleId: string, abstandCm: number, vorKopfCm: number, bettungCm: number, gleise: Gleise,
): number {
  const s = schwelleById(schwelleId);
  const a = wirksamerAbstandCm(s, abstandCm) / 100;
  const h = bettungCm / 100 + s.hoeheM;
  const breiteOben = (gleise === 2 ? GLEISABSTAND_REGEL_M : 0) + s.laengeM + 2 * (vorKopfCm / 100);
  const breiteUnten = breiteOben + 2 * BOESCHUNG_N * h;
  const querschnitt = ((breiteOben + breiteUnten) / 2) * h;
  const schwellen = gleise * (s.volumenM3 / a);
  return Math.round((querschnitt - schwellen) * 1000);
}

export interface TabellenSeite {
  gleise: Gleise;
  abstandCm: number;
}

export const TABELLEN_SEITEN: TabellenSeite[] = ([1, 2] as Gleise[]).flatMap(gleise =>
  TABELLE_ABSTAENDE_CM.map(abstandCm => ({ gleise, abstandCm })),
);

export function seitenIndex(gleise: Gleise, abstandCm: number): number {
  return TABELLEN_SEITEN.findIndex(s => s.gleise === gleise && s.abstandCm === abstandCm);
}

export { SCHWELLEN };

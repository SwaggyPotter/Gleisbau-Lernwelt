import { geg, s, zahl } from '../../../berufsschule/formelsammlung/kern/bauer';
import { laengenaenderung } from '../../../berufsschule/formelsammlung/kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Stufe } from '../../../berufsschule/formelsammlung/kern/typen';
import { fmt, randChoice, randStep, roundTo, zl } from '../../../berufsschule/formelsammlung/kern/zahlen';

/*
 * Schienenausdehnungs-Rechner (Umbau 2026-11-11, Tim: „schöne Zeichnungen wie bei der Pfeilhöhe,
 * Rechenfläche daneben, Wechsel zwischen Rechnen und Quiz mit Rechner“).
 * Nutzt die Bausteine der Formelsammlung. α wie in der Formelsammlung: 11,5 · 10⁻⁶ 1/K
 * (vorher stand hier 11 · 10⁻⁶ – angeglichen, damit beide Apps dasselbe Ergebnis liefern).
 */

const APP = 'schienendehnung';
const FORMEL = 'dl-temperatur';
const ALPHA_TEX = '11{,}5 \\cdot 10^{-6}';
const ALPHA_TEXT = '11,5 · 10⁻⁶';
const LUECKE_TEX = '\\Delta l = l \\cdot \\alpha \\cdot (T_2 - T_1)';

const LAENGEN = [12, 15, 18, 30, 60, 120];
const ORTE = ['auf dem Lagerplatz', 'neben dem Gleis', 'auf dem Bauzug', 'im Bahnhof neben Gleis 3'];

/** Δl in mm aus l in m und ΔT in K (Formel rechnet mit l in mm). */
function dlMm(lM: number, dT: number): number {
  return laengenaenderung(lM * 1000, dT);
}

// ---------- Quiz ----------

function laengeDl(stufe: Stufe): Aufgabe {
  const lM = randChoice(LAENGEN);
  const dT = randStep(10, 45, 1);
  const dl = dlMm(lM, dT);
  return zahl({
    appId: APP, formelId: FORMEL, modus: 'ueben', stufe,
    text: stufe >= 2 ? `Eine ${lM}-m-Schiene liegt lose ${randChoice(ORTE)}. Bis zum Mittag erwärmt sie sich um ${dT} K.` : undefined,
    gegeben: [geg('l', 'Schienenlänge', lM, 'm', 0), geg('\\Delta T', 'Temperaturänderung', dT, 'K', 0)],
    frage: 'Um wie viel mm verlängert sich die Schiene?',
    gesucht: { sym: '\\Delta l', name: 'Längenänderung', einheit: 'mm' },
    loesung: roundTo(dl, 1), nk: 1,
    tipp: `Erst l in mm umrechnen (1 m = 1000 mm), dann l · α · ΔT mit α = ${ALPHA_TEXT}.`,
    schritte: [
      s('Länge in mm:', `l = ${zl(lM, 0)}\\,\\text{m} = ${zl(lM * 1000, 0)}\\,\\text{mm}`),
      s('Einsetzen:', `\\Delta l = ${zl(lM * 1000, 0)} \\cdot ${ALPHA_TEX} \\cdot ${zl(dT, 0)} = ${zl(dl, 2)}\\,\\text{mm}`),
    ],
  });
}

function laengeL(stufe: Stufe): Aufgabe {
  const lM = randChoice(LAENGEN);
  const dT = randStep(10, 45, 1);
  const dl = roundTo(dlMm(lM, dT), 2);
  const lMm = dl / (11.5e-6 * dT);
  return zahl({
    appId: APP, formelId: FORMEL, modus: 'ueben', stufe,
    text: stufe >= 2 ? `Eine Schiene ${randChoice(ORTE)} hat sich bei ${dT} K Erwärmung um ${fmt(dl, 2)} mm verlängert.` : undefined,
    gegeben: [geg('\\Delta l', 'Längenänderung', dl, 'mm', 2), geg('\\Delta T', 'Temperaturänderung', dT, 'K', 0)],
    frage: 'Wie lang ist die Schiene in m?',
    gesucht: { sym: 'l', name: 'Schienenlänge', einheit: 'm' },
    loesung: roundTo(lMm / 1000, 1), nk: 1,
    formelLatex: 'l = \\frac{\\Delta l}{\\alpha \\cdot \\Delta T}',
    tipp: 'Formel nach l umstellen: l = Δl / (α · ΔT). Mit Δl in mm kommt l in mm heraus – am Ende durch 1000.',
    schritte: [
      s('Umgestellt:', 'l = \\frac{\\Delta l}{\\alpha \\cdot \\Delta T}'),
      s('Einsetzen:', `l = \\frac{${zl(dl, 2)}}{${ALPHA_TEX} \\cdot ${zl(dT, 0)}} = ${zl(lMm, 0)}\\,\\text{mm}`),
      s('In m:', `l = ${zl(lMm / 1000, 1)}\\,\\text{m}`),
    ],
  });
}

function laengeDt(stufe: Stufe): Aufgabe {
  const lM = randChoice(LAENGEN);
  const dT = randStep(10, 45, 1);
  const dl = roundTo(dlMm(lM, dT), 2);
  const t = dl / (lM * 1000 * 11.5e-6);
  return zahl({
    appId: APP, formelId: FORMEL, modus: 'ueben', stufe,
    text: stufe >= 2 ? `Eine ${lM}-m-Schiene ${randChoice(ORTE)} ist seit dem Morgen um ${fmt(dl, 2)} mm länger geworden.` : undefined,
    gegeben: [geg('l', 'Schienenlänge', lM, 'm', 0), geg('\\Delta l', 'Längenänderung', dl, 'mm', 2)],
    frage: 'Um wie viel K hat sich die Schiene erwärmt?',
    gesucht: { sym: '\\Delta T', name: 'Temperaturänderung', einheit: 'K' },
    loesung: roundTo(t, 1), nk: 1,
    formelLatex: '\\Delta T = \\frac{\\Delta l}{l \\cdot \\alpha}',
    tipp: 'Formel nach ΔT umstellen: ΔT = Δl / (l · α). l in mm einsetzen!',
    schritte: [
      s('Umgestellt:', '\\Delta T = \\frac{\\Delta l}{l \\cdot \\alpha}'),
      s('Einsetzen (l in mm):', `\\Delta T = \\frac{${zl(dl, 2)}}{${zl(lM * 1000, 0)} \\cdot ${ALPHA_TEX}} = ${zl(t, 1)}\\,\\text{K}`),
    ],
  });
}

function lueckeWerte(): { lM: number; t1: number; t2: number; dT: number } {
  const lM = randChoice([12, 15, 18, 30, 60]);
  const t1 = randStep(-5, 20, 1);
  const t2 = t1 + randStep(8, 40, 1);
  return { lM, t1, t2, dT: t2 - t1 };
}

const T_GEG = (t1: number, t2: number) => [
  geg('T_1', 'Einbautemperatur', t1, '°C', 0),
  geg('T_2', 'Schienentemperatur jetzt', t2, '°C', 0),
];

function lueckeDl(stufe: Stufe): Aufgabe {
  const { lM, t1, t2, dT } = lueckeWerte();
  const dl = dlMm(lM, dT);
  return zahl({
    appId: APP, formelId: FORMEL, modus: 'ueben', stufe,
    text: stufe >= 2 ? `Ein Gleis mit ${lM}-m-Schienen und Laschenstößen wurde bei ${t1} °C eingebaut. Heute zeigt das Schienenthermometer ${t2} °C.` : undefined,
    gegeben: [geg('l', 'Schienenlänge', lM, 'm', 0), ...T_GEG(t1, t2)],
    frage: 'Um wie viel mm schließt sich die Stoßlücke?',
    gesucht: { sym: '\\Delta l', name: 'Lückenschluss', einheit: 'mm' },
    loesung: roundTo(dl, 1), nk: 1,
    formelLatex: LUECKE_TEX,
    tipp: 'Erst ΔT = T₂ − T₁ ausrechnen, dann Δl = l · α · ΔT mit l in mm.',
    schritte: [
      s('Temperaturänderung:', `\\Delta T = ${zl(t2, 0)} - (${zl(t1, 0)}) = ${zl(dT, 0)}\\,\\text{K}`),
      s('Lückenschluss:', `\\Delta l = ${zl(lM * 1000, 0)} \\cdot ${ALPHA_TEX} \\cdot ${zl(dT, 0)} = ${zl(dl, 2)}\\,\\text{mm}`),
    ],
  });
}

function lueckeT2(stufe: Stufe): Aufgabe {
  const { lM, t1, dT } = lueckeWerte();
  const dl = roundTo(dlMm(lM, dT), 2);
  const dtGenau = dl / (lM * 1000 * 11.5e-6);
  const t2 = t1 + dtGenau;
  return zahl({
    appId: APP, formelId: FORMEL, modus: 'ueben', stufe,
    text: stufe >= 2 ? `Beim Einbau bei ${t1} °C wurden ${lM}-m-Schienen verlegt. Inzwischen hat sich jede Stoßlücke um ${fmt(dl, 2)} mm geschlossen.` : undefined,
    gegeben: [geg('l', 'Schienenlänge', lM, 'm', 0), geg('T_1', 'Einbautemperatur', t1, '°C', 0), geg('\\Delta l', 'Lückenschluss', dl, 'mm', 2)],
    frage: 'Welche Schienentemperatur T₂ herrscht jetzt (in °C)?',
    gesucht: { sym: 'T_2', name: 'Schienentemperatur jetzt', einheit: '°C' },
    loesung: roundTo(t2, 1), nk: 1,
    formelLatex: '\\Delta T = \\frac{\\Delta l}{l \\cdot \\alpha}, \\quad T_2 = T_1 + \\Delta T',
    tipp: 'Erst ΔT = Δl / (l · α) mit l in mm, dann T₂ = T₁ + ΔT.',
    schritte: [
      s('Temperaturänderung:', `\\Delta T = \\frac{${zl(dl, 2)}}{${zl(lM * 1000, 0)} \\cdot ${ALPHA_TEX}} = ${zl(dtGenau, 1)}\\,\\text{K}`),
      s('Temperatur jetzt:', `T_2 = ${zl(t1, 0)} + ${zl(dtGenau, 1)} = ${zl(t2, 1)}\\,°\\text{C}`),
    ],
  });
}

/** Stufe 3: Wie groß ist die Lücke jetzt, wenn beim Einbau s₁ gelassen wurde? (auch Abkühlung) */
function lueckeS2(stufe: Stufe): Aufgabe {
  const lM = randChoice([15, 18, 30]);
  const t1 = randStep(5, 20, 1);
  const kalt = Math.random() < 0.35;
  const t2 = kalt ? t1 - randStep(10, 25, 1) : t1 + randStep(5, 25, 1);
  const dT = t2 - t1;
  const s1 = randChoice([8, 10, 12, 14]);
  const dl = dlMm(lM, dT);
  const s2 = s1 - dl;
  if (s2 < 0.5) return lueckeDl(stufe); // Lücke wäre zu → andere Aufgabe
  return zahl({
    appId: APP, formelId: FORMEL, modus: 'ueben', stufe,
    text: kalt
      ? `${lM}-m-Schienen wurden bei ${t1} °C mit ${s1} mm Stoßlücke eingebaut. In einer Frostnacht kühlen sie auf ${t2} °C ab.`
      : `${lM}-m-Schienen wurden bei ${t1} °C mit ${s1} mm Stoßlücke eingebaut. In der Sonne erwärmen sie sich auf ${t2} °C.`,
    gegeben: [geg('l', 'Schienenlänge', lM, 'm', 0), ...T_GEG(t1, t2), geg('s_1', 'Stoßlücke beim Einbau', s1, 'mm', 0)],
    frage: 'Wie groß ist die Stoßlücke s₂ jetzt (in mm)?',
    gesucht: { sym: 's_2', name: 'Stoßlücke jetzt', einheit: 'mm' },
    loesung: roundTo(s2, 1), nk: 1,
    formelLatex: 's_2 = s_1 - \\Delta l, \\quad \\Delta l = l \\cdot \\alpha \\cdot (T_2 - T_1)',
    tipp: kalt
      ? 'ΔT ist negativ (Abkühlung) → Δl negativ → die Lücke wird größer.'
      : 'Erst Δl ausrechnen, dann von der Einbaulücke abziehen.',
    schritte: [
      s('Temperaturänderung:', `\\Delta T = ${zl(t2, 0)} - ${zl(t1, 0)} = ${zl(dT, 0)}\\,\\text{K}`),
      s('Längenänderung:', `\\Delta l = ${zl(lM * 1000, 0)} \\cdot ${ALPHA_TEX} \\cdot (${zl(dT, 0)}) = ${zl(dl, 2)}\\,\\text{mm}`),
      s('Lücke jetzt:', `s_2 = ${zl(s1, 0)} - (${zl(dl, 2)}) = ${zl(s2, 2)}\\,\\text{mm}`),
    ],
  });
}

function generiere(_modus: AufgabenModus, stufe: Stufe): Aufgabe {
  const pool: ((st: Stufe) => Aufgabe)[] =
    stufe === 1 ? [laengeDl, lueckeDl]
    : stufe === 2 ? [laengeDl, laengeL, laengeDt, lueckeDl, lueckeT2]
    : [laengeL, laengeDt, lueckeT2, lueckeS2, lueckeS2];
  return randChoice(pool)(stufe);
}

// ---------- Rechnen ----------

function rechneDehnung(w: Record<string, number>): RechnerAusgabe {
  const { l, dT } = w;
  if ([l, dT].some(Number.isNaN)) return { ergebnisse: [], warnungen: ['Bitte alle Werte eingeben.'], schritte: [] };
  const lMm = l * 1000;
  const dl = laengenaenderung(lMm, dT);
  return {
    ergebnisse: [{ sym: '\\Delta l', name: 'Längenänderung', wert: dl, einheit: 'mm', nk: 2, hervorheben: true }],
    warnungen: l <= 0 ? ['Die Länge muss größer als 0 sein.'] : [],
    schritte: [
      s('Länge in mm:', `l = ${zl(l, 3)}\\,\\text{m} = ${zl(lMm, 0)}\\,\\text{mm}`),
      s('Formel:', '\\Delta l = l \\cdot \\alpha \\cdot \\Delta T'),
      s('Einsetzen:', `\\Delta l = ${zl(lMm, 0)} \\cdot ${ALPHA_TEX} \\cdot ${zl(dT, 1)} = ${zl(dl, 2)}\\,\\text{mm}`),
      ...(dT < 0 ? [s('ΔT ist negativ → die Schiene wird kürzer.')] : []),
    ],
  };
}

function rechneLuecke(w: Record<string, number>): RechnerAusgabe {
  const { l, t1, t2, s1 } = w;
  if ([l, t1, t2, s1].some(Number.isNaN)) return { ergebnisse: [], warnungen: ['Bitte alle Werte eingeben.'], schritte: [] };
  const dT = t2 - t1;
  const lMm = l * 1000;
  const dl = laengenaenderung(lMm, dT);
  const s2 = s1 - dl;
  const warnungen: string[] = [];
  if (s2 <= 0) warnungen.push('Die Stoßlücke ist geschlossen – die Schienen stoßen aneinander, es entsteht Druck im Gleis.');
  return {
    ergebnisse: [
      { sym: '\\Delta T', name: 'Temperaturänderung', wert: dT, einheit: 'K', nk: 1 },
      { sym: '\\Delta l', name: 'Lückenschluss', wert: dl, einheit: 'mm', nk: 2, hervorheben: true },
      { sym: 's_2', name: 'Stoßlücke jetzt', wert: Math.max(s2, 0), einheit: 'mm', nk: 2 },
    ],
    warnungen,
    schritte: [
      s('Temperaturänderung:', `\\Delta T = T_2 - T_1 = ${zl(t2, 1)} - (${zl(t1, 1)}) = ${zl(dT, 1)}\\,\\text{K}`),
      s('Lückenschluss (l in mm):', `\\Delta l = ${zl(lMm, 0)} \\cdot ${ALPHA_TEX} \\cdot ${zl(dT, 1)} = ${zl(dl, 2)}\\,\\text{mm}`),
      s('Lücke jetzt:', `s_2 = s_1 - \\Delta l = ${zl(s1, 1)} - (${zl(dl, 2)}) = ${zl(s2, 2)}\\,\\text{mm}`),
    ],
  };
}

export const SCHIENENDEHNUNG_APP: MiniAppDef = {
  id: APP,
  skizze: 'schienendehnung',
  formelIds: [FORMEL],
  merkhilfen: [],
  rechner: [
    {
      id: 'dehnung', label: 'Längenänderung',
      felder: [
        { key: 'l', sym: 'l', name: 'Schienenlänge', einheit: 'm', einheiten: ['m', 'km', 'mm'], standard: 30 },
        { key: 'dT', sym: '\\Delta T', name: 'Temperaturänderung', einheit: 'K', standard: 25 },
      ],
      berechne: w => rechneDehnung(w),
    },
    {
      id: 'luecke', label: 'Lückenschluss',
      felder: [
        { key: 'l', sym: 'l', name: 'Schienenlänge', einheit: 'm', einheiten: ['m', 'mm'], standard: 30 },
        { key: 't1', sym: 'T_1', name: 'Einbautemperatur', einheit: '°C', standard: 10 },
        { key: 't2', sym: 'T_2', name: 'Schienentemperatur jetzt', einheit: '°C', standard: 35 },
        { key: 's1', sym: 's_1', name: 'Stoßlücke beim Einbau', einheit: 'mm', standard: 12 },
      ],
      berechne: w => rechneLuecke(w),
    },
  ],
  generiere,
};

/** Legende zur Skizze: was ist was (Rechnen-Ansicht). */
export const LEGENDE: Record<'dehnung' | 'luecke', { sym: string; name: string; einheit: string }[]> = {
  dehnung: [
    { sym: '\\Delta l', name: 'Längenänderung – um so viel wird die Schiene länger (oder kürzer)', einheit: 'mm' },
    { sym: 'l', name: 'Ausgangslänge der Schiene', einheit: 'm → mm' },
    { sym: '\\alpha', name: `Wärmeausdehnungskoeffizient Stahl = ${ALPHA_TEXT}`, einheit: '1/K' },
    { sym: '\\Delta T', name: 'Temperaturänderung (wärmer = positiv, kälter = negativ)', einheit: 'K' },
  ],
  luecke: [
    { sym: 'T_1', name: 'Schienentemperatur beim Einbau', einheit: '°C' },
    { sym: 'T_2', name: 'Schienentemperatur jetzt', einheit: '°C' },
    { sym: '\\Delta T', name: 'Temperaturänderung ΔT = T₂ − T₁', einheit: 'K' },
    { sym: 's_1', name: 'Stoßlücke beim Einbau', einheit: 'mm' },
    { sym: '\\Delta l', name: 'Lückenschluss = Längenänderung einer Schiene', einheit: 'mm' },
    { sym: 's_2', name: 'Stoßlücke jetzt: s₂ = s₁ − Δl', einheit: 'mm' },
  ],
};

export const FORMEL_TEX: Record<'dehnung' | 'luecke', string> = {
  dehnung: '\\Delta l = l \\cdot \\alpha \\cdot \\Delta T',
  luecke: '\\Delta l = l \\cdot \\alpha \\cdot (T_2 - T_1) \\qquad s_2 = s_1 - \\Delta l',
};

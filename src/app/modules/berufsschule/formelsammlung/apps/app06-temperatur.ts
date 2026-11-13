import { auswahl, geg, s, zahl } from '../kern/bauer';
import { FORMELSAMMLUNG } from '../kern/daten';
import { kraftAusSpannung, kraftProKelvin, laengenaenderung, laengskraft, temperaturspannung } from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

/*
 * Kap. 6 – Temperatur und Kräfte im Gleis. α = 11,5 · 10⁻⁶ 1/K, E = 2,1 · 10⁵ N/mm².
 * S41-Profilflächen sind als unklar markiert → nur S49, S54, UIC60, R65.
 */

const APP = 'temperatur';
const ALPHA_TEX = '11{,}5 \\cdot 10^{-6}';
const E_TEX = '2{,}1 \\cdot 10^{5}';

interface Profil { name: string; flaeche: number; fProK: number }
const PROFILE: Profil[] = FORMELSAMMLUNG.profile
  .filter(p => p.status !== 'unklar')
  .map(p => ({ name: p.name, flaeche: p.flaeche, fProK: p.fProKelvin ?? kraftProKelvin(p.flaeche) }));

function dT(): number {
  return randStep(5, 50, 1);
}

// ---------- Üben ----------

function uebenDl(stufe: Stufe): Aufgabe {
  const lM = randChoice([15, 18, 30, 60, 120]);
  const t = dT();
  const lMm = lM * 1000;
  const dl = laengenaenderung(lMm, t);
  return zahl({
    appId: APP, formelId: 'dl-temperatur', modus: 'ueben', stufe,
    text: stufe >= 2
      ? randChoice([
          `Eine ${lM}-m-Schiene liegt lose (nicht verschweißt) auf dem Lagerplatz. Über den Tag erwärmt sie sich um ${t} K.`,
          `Beim Einbau einer Langschiene (${lM} m) im Sommer steigt die Schienentemperatur um ${t} K. Die Schiene kann sich noch frei dehnen.`,
        ])
      : undefined,
    gegeben: [geg('l', 'Schienenlänge', lMm, 'mm', 0), geg('\\Delta T', 'Temperaturänderung', t, 'K', 0)],
    frage: 'Um wie viel mm verlängert sich die Schiene?',
    gesucht: { sym: '\\Delta l', name: 'Längenänderung', einheit: 'mm' },
    loesung: roundTo(dl, 1), nk: 1,
    tipp: 'l in mm einsetzen, α = 11,5 · 10⁻⁶ (Taste EXP/×10ˣ: 11,5E-6).',
    schritte: [
      s('Formel:', '\\Delta l = l \\cdot \\alpha \\cdot \\Delta T'),
      s('Einsetzen:', `\\Delta l = ${zl(lMm, 0)} \\cdot ${ALPHA_TEX} \\cdot ${zl(t, 0)} = ${zl(dl, 2)}\\,\\text{mm}`),
    ],
  });
}

function uebenSigma(stufe: Stufe): Aufgabe {
  const t = dT();
  const sigma = temperaturspannung(t);
  return zahl({
    appId: APP, formelId: 'sigma-temperatur', modus: 'ueben', stufe,
    text: stufe >= 2 ? `Im lückenlos verschweißten Gleis kann sich die Schiene nicht dehnen. Die Schienentemperatur liegt ${t} K über der Neutraltemperatur.` : undefined,
    gegeben: [geg('\\Delta T', 'Temperaturänderung', t, 'K', 0)],
    frage: 'Welche Spannung σ entsteht in N/mm²?',
    gesucht: { sym: '\\sigma', name: 'Spannung', einheit: 'N/mm²' },
    loesung: roundTo(sigma, 2), nk: 2,
    tipp: 'α · E · ΔT. Merke: α · E = 2,415 N/(mm²·K).',
    schritte: [
      s('Formel:', '\\sigma = \\alpha \\cdot E \\cdot \\Delta T'),
      s('Einsetzen:', `\\sigma = ${ALPHA_TEX} \\cdot ${E_TEX} \\cdot ${zl(t, 0)} = 2{,}415 \\cdot ${zl(t, 0)} = ${zl(sigma, 3)}\\,\\tfrac{\\text{N}}{\\text{mm}^2}`),
    ],
  });
}

function uebenKraft(stufe: Stufe): Aufgabe {
  const p = randChoice(PROFILE);
  const t = dT();
  const sigma = temperaturspannung(t);
  const fN = kraftAusSpannung(sigma, p.flaeche);
  return zahl({
    appId: APP, formelId: 'f-profil', modus: 'ueben', stufe,
    text: stufe >= 2 ? `Verschweißtes Gleis mit Schienenprofil ${p.name} (A = ${fmt(p.flaeche, 0)} mm²). Die Schiene ist ${t} K wärmer als bei der Neutraltemperatur. Welche Druckkraft wirkt in einer Schiene?` : undefined,
    gegeben: [geg('A_\\text{Profil}', `Querschnitt ${p.name}`, p.flaeche, 'mm²', 0), geg('\\Delta T', 'Temperaturänderung', t, 'K', 0)],
    frage: 'Berechne die Kraft F in kN.',
    gesucht: { sym: 'F', name: 'Kraft', einheit: 'kN' },
    loesung: roundTo(fN / 1000, 1), nk: 1,
    tipp: 'Erst σ = α · E · ΔT, dann F = σ · A. N ÷ 1000 = kN.',
    schritte: [
      s('1. Spannung:', `\\sigma = ${ALPHA_TEX} \\cdot ${E_TEX} \\cdot ${zl(t, 0)} = ${zl(sigma, 3)}\\,\\tfrac{\\text{N}}{\\text{mm}^2}`),
      s('2. Kraft:', `F = ${zl(sigma, 3)} \\cdot ${zl(p.flaeche, 0)} = ${zl(fN, 0)}\\,\\text{N} = ${zl(fN / 1000, 1)}\\,\\text{kN}`),
    ],
  });
}

function uebenLaengskraft(stufe: Stufe): Aufgabe {
  const p = randChoice(PROFILE.filter(x => x.name !== 'R65'));
  const fk = roundTo(p.fProK, 2);
  const t = dT();
  const f = laengskraft(fk, t);
  return zahl({
    appId: APP, formelId: 'f-laengskraft', modus: 'ueben', stufe,
    text: stufe >= 2 ? `Für das Profil ${p.name} steht in der Tabelle: ${fmt(fk, 2)} kN pro Kelvin. Die Schiene kühlt im Winter um ${t} K unter die Neutraltemperatur ab.` : undefined,
    gegeben: [geg('F_\\text{Schiene}', `Kraft pro Kelvin ${p.name}`, fk, 'kN/K', 2), geg('\\Delta T', 'Temperaturänderung', t, 'K', 0)],
    frage: 'Wie groß ist die Längskraft (Zugkraft) in kN?',
    gesucht: { sym: 'F', name: 'Längskraft', einheit: 'kN' },
    loesung: roundTo(f, 1), nk: 1,
    tipp: 'Kraft pro Kelvin mal Anzahl Kelvin.',
    schritte: [s('Formel:', 'F = F_\\text{Schiene} \\cdot \\Delta T'), s('Einsetzen:', `F = ${zl(fk, 2)} \\cdot ${zl(t, 0)} = ${zl(f, 2)}\\,\\text{kN}`)],
  });
}

function frageDruckZug(stufe: Stufe): Aufgabe {
  const warm = chance(0.5);
  return auswahl({
    appId: APP, formelId: 'f-profil', modus: 'ueben', stufe,
    text: warm ? 'Hochsommer: Die Schiene im verschweißten Gleis ist deutlich wärmer als die Neutraltemperatur.' : 'Winter: Die Schiene im verschweißten Gleis ist deutlich kälter als die Neutraltemperatur.',
    gegeben: [],
    frage: 'Welche Kraft entsteht in der Schiene – und was droht?',
    optionen: warm
      ? ['Druckkraft – Gefahr der Gleisverwerfung', 'Zugkraft – Gefahr eines Schienenbruchs', 'Keine Kraft, die Schiene dehnt sich frei', 'Druckkraft – Gefahr eines Schienenbruchs']
      : ['Zugkraft – Gefahr eines Schienenbruchs', 'Druckkraft – Gefahr der Gleisverwerfung', 'Keine Kraft, die Schiene zieht sich frei zusammen', 'Zugkraft – Gefahr der Gleisverwerfung'],
    tipp: 'Die Schiene WILL sich dehnen bzw. zusammenziehen, darf aber nicht.',
    schritte: [s(warm
      ? 'Erwärmung → die Schiene will länger werden, wird aber festgehalten → Druckkraft. Zu viel Druck kann das Gleis seitlich ausknicken lassen (Verwerfung).'
      : 'Abkühlung → die Schiene will kürzer werden, wird festgehalten → Zugkraft. Zu viel Zug kann zum Schienenbruch führen.')],
  });
}

// ---------- Umstellen ----------

function umstellenDT(stufe: Stufe): Aufgabe {
  const lM = randChoice([15, 30, 60, 120]);
  const lMm = lM * 1000;
  const dl = randStep(3, 40, 0.5);
  const t = dl / (lMm * 11.5e-6);
  return zahl({
    appId: APP, formelId: 'dl-temperatur', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Eine lose ${lM}-m-Schiene ist um ${fmt(dl, 1)} mm länger geworden. Um wie viel Kelvin hat sie sich erwärmt?` : undefined,
    gegeben: [geg('l', 'Schienenlänge', lMm, 'mm', 0), geg('\\Delta l', 'Längenänderung', dl, 'mm', 1)],
    frage: 'Berechne ΔT in K.',
    gesucht: { sym: '\\Delta T', name: 'Temperaturänderung', einheit: 'K' },
    loesung: roundTo(t, 1), nk: 1,
    tipp: 'Durch (l · α) teilen.',
    formelLatex: '\\Delta T = \\frac{\\Delta l}{l \\cdot \\alpha}',
    schritte: [
      s('Umstellen:', '\\Delta T = \\frac{\\Delta l}{l \\cdot \\alpha}'),
      s('Einsetzen:', `\\Delta T = \\frac{${zl(dl, 1)}}{${zl(lMm, 0)} \\cdot ${ALPHA_TEX}} = ${zl(t, 2)}\\,\\text{K}`),
    ],
  });
}

function umstellenDTausF(stufe: Stufe): Aufgabe {
  const p = randChoice(PROFILE.filter(x => x.name !== 'R65'));
  const fk = roundTo(p.fProK, 2);
  const f = randStep(100, 900, 10);
  const t = f / fk;
  return zahl({
    appId: APP, formelId: 'f-laengskraft', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Die Längskraft in einer ${p.name}-Schiene darf ${f} kN nicht überschreiten. Wie weit darf die Temperatur von der Neutraltemperatur abweichen?` : undefined,
    gegeben: [geg('F', 'Längskraft', f, 'kN', 0), geg('F_\\text{Schiene}', `Kraft pro Kelvin ${p.name}`, fk, 'kN/K', 2)],
    frage: 'Berechne ΔT in K.',
    gesucht: { sym: '\\Delta T', name: 'Temperaturänderung', einheit: 'K' },
    loesung: roundTo(t, 1), nk: 1,
    tipp: 'F durch die Kraft pro Kelvin teilen.',
    formelLatex: '\\Delta T = \\frac{F}{F_\\text{Schiene}}',
    schritte: [s('Umstellen:', '\\Delta T = \\frac{F}{F_\\text{Schiene}}'), s('Einsetzen:', `\\Delta T = \\frac{${zl(f, 0)}}{${zl(fk, 2)}} = ${zl(t, 2)}\\,\\text{K}`)],
  });
}

function umstellenL(stufe: Stufe): Aufgabe {
  const t = dT();
  const dl = randStep(2, 30, 0.5);
  const lMm = dl / (11.5e-6 * t);
  return zahl({
    appId: APP, formelId: 'dl-temperatur', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Eine Schiene hat sich bei ${t} K Erwärmung um ${fmt(dl, 1)} mm gedehnt. Wie lang ist sie?` : undefined,
    gegeben: [geg('\\Delta l', 'Längenänderung', dl, 'mm', 1), geg('\\Delta T', 'Temperaturänderung', t, 'K', 0)],
    frage: 'Berechne die Länge l in m.',
    gesucht: { sym: 'l', name: 'Schienenlänge', einheit: 'm' },
    loesung: roundTo(lMm / 1000, 2), nk: 2,
    tipp: 'l = Δl / (α · ΔT). Δl in mm → l in mm, dann ÷ 1000.',
    formelLatex: 'l = \\frac{\\Delta l}{\\alpha \\cdot \\Delta T}',
    schritte: [
      s('Umstellen:', 'l = \\frac{\\Delta l}{\\alpha \\cdot \\Delta T}'),
      s('Einsetzen:', `l = \\frac{${zl(dl, 1)}}{${ALPHA_TEX} \\cdot ${zl(t, 0)}} = ${zl(lMm, 0)}\\,\\text{mm} = ${zl(lMm / 1000, 2)}\\,\\text{m}`),
    ],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenGrad(stufe: Stufe): Aufgabe {
  const t1 = randStep(-15, 15, 1);
  const t2 = t1 + randStep(10, 45, 1);
  const t = t2 - t1;
  const lM = randChoice([18, 30, 60, 120]);
  const dl = laengenaenderung(lM * 1000, t);
  return zahl({
    appId: APP, formelId: 'dl-temperatur', modus: 'einheiten', stufe,
    text: `Eine lose ${lM}-m-Schiene: morgens ${fmt(t1, 0)} °C, mittags ${fmt(t2, 0)} °C.`,
    gegeben: [geg('l', 'Schienenlänge', lM, 'm', 0), geg('T_1', 'Temperatur morgens', t1, '°C', 0), geg('T_2', 'Temperatur mittags', t2, '°C', 0)],
    frage: 'Um wie viel mm wird die Schiene länger?',
    gesucht: { sym: '\\Delta l', name: 'Längenänderung', einheit: 'mm' },
    loesung: roundTo(dl, 1), nk: 1,
    tipp: 'ΔT = T₂ − T₁ (eine Differenz in °C ist gleich groß in K). l in mm einsetzen.',
    schritte: [
      s('Temperaturdifferenz:', `\\Delta T = ${zl(t2, 0)} - ${t1 < 0 ? `(-${zl(-t1, 0)})` : zl(t1, 0)} = ${zl(t, 0)}\\,\\text{K}`),
      s('l in mm:', `l = ${zl(lM, 0)}\\,\\text{m} = ${zl(lM * 1000, 0)}\\,\\text{mm}`),
      s('Einsetzen:', `\\Delta l = ${zl(lM * 1000, 0)} \\cdot ${ALPHA_TEX} \\cdot ${zl(t, 0)} = ${zl(dl, 2)}\\,\\text{mm}`),
    ],
  });
}

function einheitenCm2(stufe: Stufe): Aufgabe {
  const p = randChoice(PROFILE);
  const aCm = p.flaeche / 100;
  const t = dT();
  const sigma = temperaturspannung(t);
  const fN = kraftAusSpannung(sigma, p.flaeche);
  return zahl({
    appId: APP, formelId: 'f-profil', modus: 'einheiten', stufe,
    text: `Im Tabellenbuch steht der Querschnitt von ${p.name} in cm²: A = ${fmt(aCm, 2)} cm². ΔT = ${t} K.`,
    gegeben: [geg('A_\\text{Profil}', `Querschnitt ${p.name}`, aCm, 'cm²', 2), geg('\\Delta T', 'Temperaturänderung', t, 'K', 0)],
    frage: 'Kraft in der Schiene in kN?',
    gesucht: { sym: 'F', name: 'Kraft', einheit: 'kN' },
    loesung: roundTo(fN / 1000, 1), nk: 1,
    tipp: 'σ ist in N/mm² – also A in mm² umrechnen: 1 cm² = 100 mm².',
    schritte: [
      s('A in mm²:', `A = ${zl(aCm, 2)}\\,\\text{cm}^2 \\cdot 100 = ${zl(p.flaeche, 0)}\\,\\text{mm}^2`),
      s('Spannung:', `\\sigma = 2{,}415 \\cdot ${zl(t, 0)} = ${zl(sigma, 3)}\\,\\tfrac{\\text{N}}{\\text{mm}^2}`),
      s('Kraft:', `F = ${zl(sigma, 3)} \\cdot ${zl(p.flaeche, 0)} = ${zl(fN, 0)}\\,\\text{N} = ${zl(fN / 1000, 1)}\\,\\text{kN}`),
    ],
  });
}

// ---------- Rechner ----------

function rechnerDl(w: Record<string, number>): RechnerAusgabe {
  const { l, t } = w as { l: number; t: number };
  if (!(l > 0) || !Number.isFinite(t)) return { ergebnisse: [], warnungen: ['Länge > 0 und ΔT eingeben.'], schritte: [] };
  const lMm = l * 1000;
  const dl = laengenaenderung(lMm, t);
  return {
    ergebnisse: [{ sym: '\\Delta l', name: 'Längenänderung (freie Schiene)', wert: dl, einheit: 'mm', nk: 2, hervorheben: true }],
    warnungen: [],
    schritte: [s('', `\\Delta l = ${zl(lMm, 0)} \\cdot ${ALPHA_TEX} \\cdot ${zl(t, 1)} = ${zl(dl, 2)}\\,\\text{mm}`)],
  };
}

function rechnerKraft(w: Record<string, number>, sw: Record<string, string>): RechnerAusgabe {
  const { t } = w as { t: number };
  const p = PROFILE.find(x => x.name === sw['profil']) ?? PROFILE[0];
  if (!Number.isFinite(t)) return { ergebnisse: [], warnungen: ['ΔT eingeben.'], schritte: [] };
  const sigma = temperaturspannung(t);
  const fN = kraftAusSpannung(sigma, p.flaeche);
  return {
    ergebnisse: [
      { sym: 'F', name: `Kraft in einer Schiene ${p.name}`, wert: fN / 1000, einheit: 'kN', nk: 1, hervorheben: true },
      { sym: '\\sigma', name: 'Spannung', wert: sigma, einheit: 'N/mm²', nk: 2 },
      { sym: 'F_\\text{Schiene}', name: 'Kraft pro Kelvin', wert: p.fProK, einheit: 'kN/K', nk: 3 },
    ],
    warnungen: [],
    schritte: [
      s('', `\\sigma = ${ALPHA_TEX} \\cdot ${E_TEX} \\cdot ${zl(t, 1)} = ${zl(sigma, 3)}\\,\\tfrac{\\text{N}}{\\text{mm}^2}`),
      s('', `F = \\sigma \\cdot A = ${zl(sigma, 3)}\\,\\tfrac{\\text{N}}{\\text{mm}^2} \\cdot ${zl(p.flaeche, 0)}\\,\\text{mm}^2 = ${zl(fN, 0)}\\,\\text{N} = ${zl(fN / 1000, 1)}\\,\\text{kN}`),
      s(t >= 0 ? 'Erwärmung → Druckkraft.' : 'Abkühlung → Zugkraft.'),
    ],
  };
}

export const TEMPERATUR_APP: MiniAppDef = {
  id: APP,
  skizze: 'temperatur',
  formelIds: ['dl-temperatur', 'sigma-temperatur', 'f-profil', 'f-laengskraft'],
  merkhilfen: [
    'Lose Schiene: sie dehnt sich (Δl). Verschweißte Schiene: sie darf nicht – stattdessen entsteht Spannung σ und Kraft F.',
    'α = 11,5 · 10⁻⁶ 1/K und E = 2,1 · 10⁵ N/mm². α · E = 2,415 N/mm² pro Kelvin.',
    'Wärmer als Neutraltemperatur → Druck (Verwerfungsgefahr). Kälter → Zug (Bruchgefahr).',
    'S41-Querschnitte sind noch nicht bestätigt – Aufgaben nutzen S49, S54, UIC60 und R65.',
  ],
  rechner: [
    {
      id: 'dl', label: 'Längenänderung',
      felder: [
        { key: 'l', sym: 'l', name: 'Schienenlänge', einheit: 'm', einheiten: ['m', 'mm', 'km'], standard: 120 },
        { key: 't', sym: '\\Delta T', name: 'Temperaturänderung', einheit: 'K', standard: 30 },
      ],
      berechne: rechnerDl,
    },
    {
      id: 'kraft', label: 'Spannung & Kraft',
      felder: [{ key: 't', sym: '\\Delta T', name: 'Temperaturänderung', einheit: 'K', standard: 30 }],
      schalter: [{ key: 'profil', label: 'Schienenprofil', optionen: PROFILE.map(p => ({ wert: p.name, label: `${p.name} (${fmt(p.flaeche, 0)} mm²)` })) }],
      berechne: rechnerKraft,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') return (stufe === 1 ? umstellenDT : randChoice([umstellenDT, umstellenDTausF, umstellenL]))(stufe);
    if (modus === 'einheiten') return randChoice([einheitenGrad, einheitenCm2])(stufe);
    if (stufe === 1) return randChoice([uebenDl, uebenSigma, uebenLaengskraft])(1);
    if (stufe === 2) return chance(0.15) ? frageDruckZug(2) : randChoice([uebenDl, uebenSigma, uebenKraft, uebenLaengskraft])(2);
    return chance(0.2) ? frageDruckZug(3) : randChoice([uebenKraft, uebenKraft, uebenLaengskraft])(3);
  },
};

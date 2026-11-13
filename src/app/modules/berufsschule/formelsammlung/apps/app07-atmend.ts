import { auswahl, geg, s, zahl } from '../kern/bauer';
import { FORMELSAMMLUNG } from '../kern/daten';
import { atmendeLaengeCm, temperaturAusAtmend, widerstandAusAtmend } from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

/* Kap. 6 – Atmendes Gleisende. Längsverschiebewiderstand p: 100 N/cm (stark verdichtet), 70 N/cm (locker). */

const APP = 'atmend';
const ALPHA_TEX = '11{,}5 \\cdot 10^{-6}';
const E_TEX = '2{,}1 \\cdot 10^{5}';
const PROFILE = FORMELSAMMLUNG.profile.filter(p => p.status !== 'unklar');

function bettung(): { p: number; text: string } {
  return chance(0.5) ? { p: 100, text: 'frisch und stark verdichtet' } : { p: 70, text: 'nur locker verdichtet' };
}

function zaehler(a: number, t: number): number {
  return a * 2.1e5 * 11.5e-6 * t;
}

function rechnung(a: number, t: number, p: number): string {
  const lCm = atmendeLaengeCm(a, t, p);
  return `l_\\text{atm} = \\frac{${zl(a, 0)} \\cdot ${E_TEX} \\cdot ${ALPHA_TEX} \\cdot ${zl(t, 0)}}{${zl(p, 0)}} = \\frac{${zl(zaehler(a, t), 0)}\\,\\text{N}}{${zl(p, 0)}\\,\\text{N/cm}} = ${zl(lCm, 0)}\\,\\text{cm}`;
}

// ---------- Üben ----------

function uebenL(stufe: Stufe): Aufgabe {
  const pr = randChoice(PROFILE);
  const t = randStep(15, 50, 1);
  const b = bettung();
  const lCm = atmendeLaengeCm(pr.flaeche, t, b.p);
  return zahl({
    appId: APP, formelId: 'l-atmend', modus: 'ueben', stufe,
    text: stufe >= 2
      ? `Am Ende eines lückenlosen Gleises (${pr.name}, A = ${fmt(pr.flaeche, 0)} mm²) ist die Bettung ${b.text}. Die Schiene ist ${t} K wärmer als die Neutraltemperatur. Wie lang ist der Bereich, in dem sich das Gleis noch bewegt?`
      : undefined,
    gegeben: [
      geg('A_\\text{Schiene}', `Querschnitt ${pr.name}`, pr.flaeche, 'mm²', 0),
      geg('\\Delta T', 'Temperaturänderung', t, 'K', 0),
      geg('p', 'Längsverschiebewiderstand', b.p, 'N/cm', 0),
    ],
    frage: 'Berechne die Länge des atmenden Gleisendes in m.',
    gesucht: { sym: 'l_\\text{atm}', name: 'Länge atmendes Ende', einheit: 'm' },
    loesung: roundTo(lCm / 100, 1), nk: 1,
    tipp: 'Zähler ergibt N, geteilt durch N/cm ergibt cm. Am Ende ÷ 100 für m!',
    schritte: [
      s('Formel:', 'l_\\text{atm} = \\frac{A_\\text{Schiene} \\cdot E \\cdot \\alpha \\cdot \\Delta T}{p}'),
      s('Einsetzen:', rechnung(pr.flaeche, t, b.p)),
      s('In m (÷ 100):', `l_\\text{atm} = ${zl(lCm / 100, 1)}\\,\\text{m}`),
    ],
  });
}

function frageVerdichtung(stufe: Stufe): Aufgabe {
  return auswahl({
    appId: APP, formelId: 'l-atmend', modus: 'ueben', stufe,
    text: 'Nach dem Stopfen ist die Bettung noch nicht wieder fest (locker statt stark verdichtet).',
    gegeben: [],
    frage: 'Was passiert mit der Länge des atmenden Gleisendes?',
    optionen: ['Sie wird länger', 'Sie wird kürzer', 'Sie bleibt gleich', 'Das atmende Ende verschwindet'],
    tipp: 'p steht im Nenner. Lockerer Schotter = kleinerer Widerstand p.',
    schritte: [s('p wird kleiner (100 → 70 N/cm). Weil p im Nenner steht, wird lₐₜₘ größer – um den Faktor 100/70 ≈ 1,43.', 'l_\\text{atm} = \\frac{A \\cdot E \\cdot \\alpha \\cdot \\Delta T}{p}')],
  });
}

// ---------- Umstellen ----------

function umstellenT(stufe: Stufe): Aufgabe {
  const pr = randChoice(PROFILE);
  const b = bettung();
  const lM = randStep(30, 120, 1);
  const t = temperaturAusAtmend(lM * 100, pr.flaeche, b.p);
  return zahl({
    appId: APP, formelId: 'l-atmend', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Am Gleisende (${pr.name}, Bettung ${b.text}) bewegt sich das Gleis auf ${lM} m Länge. Wie groß ist die Temperaturdifferenz zur Neutraltemperatur?` : undefined,
    gegeben: [geg('l_\\text{atm}', 'Länge atmendes Ende', lM, 'm', 0), geg('A_\\text{Schiene}', `Querschnitt ${pr.name}`, pr.flaeche, 'mm²', 0), geg('p', 'Längsverschiebewiderstand', b.p, 'N/cm', 0)],
    frage: 'Berechne ΔT in K.',
    gesucht: { sym: '\\Delta T', name: 'Temperaturänderung', einheit: 'K' },
    loesung: roundTo(t, 1), nk: 1,
    tipp: 'Mal p, geteilt durch (A · E · α). Länge vorher in cm umrechnen!',
    formelLatex: '\\Delta T = \\frac{l_\\text{atm} \\cdot p}{A_\\text{Schiene} \\cdot E \\cdot \\alpha}',
    schritte: [
      s('Umstellen:', '\\Delta T = \\frac{l_\\text{atm} \\cdot p}{A_\\text{Schiene} \\cdot E \\cdot \\alpha}'),
      s('l in cm:', `l_\\text{atm} = ${zl(lM, 0)}\\,\\text{m} = ${zl(lM * 100, 0)}\\,\\text{cm}`),
      s('Einsetzen:', `\\Delta T = \\frac{${zl(lM * 100, 0)} \\cdot ${zl(b.p, 0)}}{${zl(pr.flaeche, 0)} \\cdot ${E_TEX} \\cdot ${ALPHA_TEX}} = ${zl(t, 2)}\\,\\text{K}`),
    ],
  });
}

function umstellenP(stufe: Stufe): Aufgabe {
  const pr = randChoice(PROFILE);
  const t = randStep(15, 45, 1);
  const lM = randStep(35, 110, 1);
  const p = widerstandAusAtmend(lM * 100, pr.flaeche, t);
  return zahl({
    appId: APP, formelId: 'l-atmend', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Bei ΔT = ${t} K wurde am Gleisende (${pr.name}) ein atmender Bereich von ${lM} m gemessen. Welchen Längsverschiebewiderstand hat die Bettung?` : undefined,
    gegeben: [geg('l_\\text{atm}', 'Länge atmendes Ende', lM, 'm', 0), geg('A_\\text{Schiene}', `Querschnitt ${pr.name}`, pr.flaeche, 'mm²', 0), geg('\\Delta T', 'Temperaturänderung', t, 'K', 0)],
    frage: 'Berechne p in N/cm.',
    gesucht: { sym: 'p', name: 'Längsverschiebewiderstand', einheit: 'N/cm' },
    loesung: roundTo(p, 1), nk: 1,
    tipp: 'p und lₐₜₘ tauschen die Plätze. l in cm einsetzen.',
    formelLatex: 'p = \\frac{A_\\text{Schiene} \\cdot E \\cdot \\alpha \\cdot \\Delta T}{l_\\text{atm}}',
    schritte: [
      s('Umstellen:', 'p = \\frac{A_\\text{Schiene} \\cdot E \\cdot \\alpha \\cdot \\Delta T}{l_\\text{atm}}'),
      s('Einsetzen (l in cm):', `p = \\frac{${zl(zaehler(pr.flaeche, t), 0)}}{${zl(lM * 100, 0)}} = ${zl(p, 1)}\\,\\text{N/cm}`),
    ],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenKnM(stufe: Stufe): Aufgabe {
  const pr = randChoice(PROFILE);
  const pKnM = randChoice([7, 10]);
  const p = pKnM * 10; // 1 kN/m = 1000 N / 100 cm = 10 N/cm
  const t = randStep(15, 50, 1);
  const lCm = atmendeLaengeCm(pr.flaeche, t, p);
  return zahl({
    appId: APP, formelId: 'l-atmend', modus: 'einheiten', stufe,
    text: `Der Längsverschiebewiderstand ist hier in kN/m angegeben: p = ${pKnM} kN/m. Profil ${pr.name}, ΔT = ${t} K.`,
    gegeben: [geg('A_\\text{Schiene}', `Querschnitt ${pr.name}`, pr.flaeche, 'mm²', 0), geg('\\Delta T', 'Temperaturänderung', t, 'K', 0), geg('p', 'Längsverschiebewiderstand', pKnM, 'kN/m', 0)],
    frage: 'Länge des atmenden Endes in m?',
    gesucht: { sym: 'l_\\text{atm}', name: 'Länge atmendes Ende', einheit: 'm' },
    loesung: roundTo(lCm / 100, 1), nk: 1,
    tipp: '1 kN/m = 1000 N pro 100 cm = 10 N/cm. Oder: p in N/m einsetzen, dann kommt direkt m heraus.',
    schritte: [
      s('p umrechnen:', `p = ${zl(pKnM, 0)}\\,\\tfrac{\\text{kN}}{\\text{m}} = \\frac{${zl(pKnM * 1000, 0)}\\,\\text{N}}{100\\,\\text{cm}} = ${zl(p, 0)}\\,\\tfrac{\\text{N}}{\\text{cm}}`),
      s('Einsetzen:', rechnung(pr.flaeche, t, p)),
      s('In m:', `l_\\text{atm} = ${zl(lCm / 100, 1)}\\,\\text{m}`),
    ],
  });
}

function einheitenCm(stufe: Stufe): Aufgabe {
  const pr = randChoice(PROFILE);
  const b = bettung();
  const t = randStep(15, 50, 1);
  const lCm = atmendeLaengeCm(pr.flaeche, t, b.p);
  return zahl({
    appId: APP, formelId: 'l-atmend', modus: 'einheiten', stufe,
    text: `Profil ${pr.name}, ΔT = ${t} K, p = ${b.p} N/cm. Für das Protokoll wird die Länge in Metern verlangt – Achtung, was kommt aus der Formel heraus?`,
    gegeben: [geg('A_\\text{Schiene}', `Querschnitt ${pr.name}`, pr.flaeche, 'mm²', 0), geg('\\Delta T', 'Temperaturänderung', t, 'K', 0), geg('p', 'Längsverschiebewiderstand', b.p, 'N/cm', 0)],
    frage: 'Länge des atmenden Endes in m?',
    gesucht: { sym: 'l_\\text{atm}', name: 'Länge atmendes Ende', einheit: 'm' },
    loesung: roundTo(lCm / 100, 1), nk: 1,
    tipp: 'N geteilt durch N/cm = cm. Danach ÷ 100.',
    schritte: [s('Einsetzen:', rechnung(pr.flaeche, t, b.p)), s('cm → m:', `${zl(lCm, 0)}\\,\\text{cm} = ${zl(lCm / 100, 1)}\\,\\text{m}`)],
  });
}

// ---------- Rechner ----------

function rechnerL(w: Record<string, number>, sw: Record<string, string>): RechnerAusgabe {
  const { t, p } = w as { t: number; p: number };
  const pr = PROFILE.find(x => x.name === sw['profil']) ?? PROFILE[0];
  if (!(p > 0) || !Number.isFinite(t)) return { ergebnisse: [], warnungen: ['ΔT eingeben, p muss größer als 0 sein.'], schritte: [] };
  const lCm = atmendeLaengeCm(pr.flaeche, Math.abs(t), p);
  return {
    ergebnisse: [
      { sym: 'l_\\text{atm}', name: 'Länge atmendes Ende', wert: lCm / 100, einheit: 'm', nk: 1, hervorheben: true },
      { sym: 'F', name: 'Längskraft im festen Bereich', wert: zaehler(pr.flaeche, Math.abs(t)) / 1000, einheit: 'kN', nk: 1 },
    ],
    warnungen: [],
    schritte: [s('', rechnung(pr.flaeche, Math.abs(t), p)), s('', `= ${zl(lCm / 100, 1)}\\,\\text{m}`)],
  };
}

export const ATMEND_APP: MiniAppDef = {
  id: APP,
  skizze: 'atmend',
  formelIds: ['l-atmend'],
  merkhilfen: [
    'Im lückenlosen Gleis ist die Mitte fest. Nur an den Enden kann sich das Gleis noch bewegen – das „atmende Ende“.',
    'Der Schotter hält dagegen: Längsverschiebewiderstand p (100 N/cm stark, 70 N/cm locker verdichtet).',
    'Der Zähler A · E · α · ΔT ist genau die Längskraft F in N.',
    'Einheiten-Falle: N ÷ N/cm = cm. Am Ende ÷ 100 für m.',
  ],
  rechner: [
    {
      id: 'l', label: 'Atmendes Ende',
      felder: [
        { key: 't', sym: '\\Delta T', name: 'Temperaturänderung', einheit: 'K', standard: 30 },
        { key: 'p', sym: 'p', name: 'Längsverschiebewiderstand', einheit: 'N/cm', standard: 100 },
      ],
      schalter: [{ key: 'profil', label: 'Schienenprofil', optionen: PROFILE.map(p => ({ wert: p.name, label: `${p.name} (${fmt(p.flaeche, 0)} mm²)` })) }],
      berechne: rechnerL,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') return (stufe === 1 ? umstellenT : randChoice([umstellenT, umstellenP]))(stufe);
    if (modus === 'einheiten') return randChoice([einheitenKnM, einheitenCm])(stufe);
    if (stufe >= 2 && chance(0.2)) return frageVerdichtung(stufe);
    return uebenL(stufe);
  },
};

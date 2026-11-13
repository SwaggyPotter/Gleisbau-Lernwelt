import { auswahl, geg, s, zahl } from '../kern/bauer';
import { G_ERDE, fliehkraft, hangabtrieb, vertikalkraft, winkelAusPromille } from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

/* Kap. 7–9 – Fliehkraft, Hangabtriebskraft, Vertikalkraft. g = 9,81 m/s². */

const APP = 'fahrzeugkraefte';

function masseT(): number {
  return randChoice([20, 40, 60, 80, 90, 120, 400, 600, 1200]);
}

// ---------- Üben ----------

function uebenFlieh(stufe: Stufe): Aufgabe {
  const mT = masseT();
  const m = mT * 1000;
  const r = randStep(300, 3000, 50);
  const vMs = stufe === 1 ? randStep(10, 50, 1) : 0;
  const vKmh = stufe === 1 ? vMs * 3.6 : randStep(60, 200, 10);
  const v = stufe === 1 ? vMs : vKmh / 3.6;
  const f = fliehkraft(m, v, r);
  return zahl({
    appId: APP, formelId: 'fliehkraft', modus: 'ueben', stufe,
    text: stufe >= 2 ? `Ein Fahrzeug mit ${fmt(m, 0)} kg fährt mit ${vKmh} km/h durch einen Bogen mit r = ${fmt(r, 0)} m. Welche Fliehkraft drückt es nach außen?` : undefined,
    gegeben: stufe === 1
      ? [geg('m', 'Masse', m, 'kg', 0), geg('v', 'Geschwindigkeit', vMs, 'm/s', 0), geg('r', 'Radius', r, 'm', 0)]
      : [geg('m', 'Masse', m, 'kg', 0), geg('v', 'Geschwindigkeit', vKmh, 'km/h', 0), geg('r', 'Radius', r, 'm', 0)],
    frage: 'Berechne die Fliehkraft F in kN.',
    gesucht: { sym: 'F', name: 'Fliehkraft', einheit: 'kN' },
    loesung: roundTo(f / 1000, 2), nk: 2,
    tipp: stufe === 1 ? 'm in kg, v in m/s, r in m → F in N. Dann ÷ 1000 für kN.' : 'v erst in m/s umrechnen: km/h ÷ 3,6. Dann F = m · v² / r.',
    schritte: [
      ...(stufe >= 2 ? [s('v in m/s:', `v = \\frac{${zl(vKmh, 0)}}{3{,}6} = ${zl(v, 3)}\\,\\tfrac{\\text{m}}{\\text{s}}`)] : []),
      s('Formel:', 'F = \\frac{m \\cdot v^2}{r}'),
      s('Einsetzen:', `F = \\frac{${zl(m, 0)} \\cdot ${zl(v, 3)}^2}{${zl(r, 0)}} = ${zl(f, 0)}\\,\\text{N} = ${zl(f / 1000, 2)}\\,\\text{kN}`),
    ],
  });
}

function uebenHang(stufe: Stufe): Aufgabe {
  const gKn = randStep(200, 8000, 50);
  const promille = stufe >= 3 ? randStep(2, 40, 1) : 0;
  const alpha = stufe >= 3 ? winkelAusPromille(promille) : randStep(0.2, 3, 0.1);
  const alphaAnzeige = stufe >= 3 ? roundTo(alpha, 4) : alpha;
  const h = hangabtrieb(gKn, alphaAnzeige);
  return zahl({
    appId: APP, formelId: 'hangabtrieb', modus: 'ueben', stufe,
    text: stufe >= 2
      ? (stufe >= 3
          ? `Ein Zug mit G = ${fmt(gKn, 0)} kN steht auf einer Steigung von ${promille} ‰. Welche Kraft zieht ihn hangabwärts?`
          : `Ein Bauzug (G = ${fmt(gKn, 0)} kN) steht auf einer Rampe mit α = ${fmt(alpha, 1)}°. Mit welcher Kraft muss die Bremse ihn halten?`)
      : undefined,
    gegeben: stufe >= 3
      ? [geg('G', 'Gewichtskraft', gKn, 'kN', 0), geg('s', 'Neigung', promille, '‰', 0)]
      : [geg('G', 'Gewichtskraft', gKn, 'kN', 0), geg('\\alpha', 'Neigungswinkel', alpha, '°', 1)],
    frage: 'Berechne die Hangabtriebskraft H in kN.',
    gesucht: { sym: 'H', name: 'Hangabtriebskraft', einheit: 'kN' },
    loesung: roundTo(h, 2), nk: 2,
    tipp: stufe >= 3 ? 'Erst den Winkel: α = arctan(s / 1000). Dann H = G · sin α. Taschenrechner auf DEG!' : 'H = G · sin α. Taschenrechner auf DEG (Grad) stellen!',
    schritte: [
      ...(stufe >= 3 ? [s('Winkel aus der Neigung:', `\\alpha = \\arctan\\left(\\frac{${zl(promille, 0)}}{1000}\\right) = ${zl(alphaAnzeige, 4)}°`)] : []),
      s('Formel:', 'H = G \\cdot \\sin \\alpha'),
      s('Einsetzen:', `H = ${zl(gKn, 0)} \\cdot \\sin ${zl(alphaAnzeige, stufe >= 3 ? 4 : 1)}° = ${zl(h, 2)}\\,\\text{kN}`),
    ],
  });
}

function uebenVertikal(stufe: Stufe): Aufgabe {
  const gKn = randStep(200, 8000, 50);
  const alpha = randStep(0.5, 5, 0.5);
  const v = vertikalkraft(gKn, alpha);
  return zahl({
    appId: APP, formelId: 'vertikalkraft', modus: 'ueben', stufe,
    text: stufe >= 2 ? `Ein Fahrzeug (G = ${fmt(gKn, 0)} kN) steht auf einer Neigung von α = ${fmt(alpha, 1)}°. Mit welcher Kraft drückt es senkrecht auf die Schienen?` : undefined,
    gegeben: [geg('G', 'Gewichtskraft', gKn, 'kN', 0), geg('\\alpha', 'Neigungswinkel', alpha, '°', 1)],
    frage: 'Berechne die Vertikalkraft V in kN.',
    gesucht: { sym: 'V', name: 'Vertikalkraft', einheit: 'kN' },
    loesung: roundTo(v, 1), nk: 1,
    tipp: 'V = G · cos α. Bei kleinen Winkeln ist V fast so groß wie G.',
    schritte: [s('Formel:', 'V = G \\cdot \\cos \\alpha'), s('Einsetzen:', `V = ${zl(gKn, 0)} \\cdot \\cos ${zl(alpha, 1)}° = ${zl(v, 2)}\\,\\text{kN}`)],
  });
}

function uebenGewicht(stufe: Stufe): Aufgabe {
  const mT = masseT();
  const alpha = randStep(0.5, 3, 0.1);
  const gKn = (mT * 1000 * G_ERDE) / 1000;
  const h = hangabtrieb(gKn, alpha);
  return zahl({
    appId: APP, formelId: 'hangabtrieb', modus: 'ueben', stufe,
    text: `Ein Wagen mit ${mT} t Masse steht auf einer Rampe mit α = ${fmt(alpha, 1)}°. Wie groß ist die Hangabtriebskraft?`,
    gegeben: [geg('m', 'Masse', mT, 't', 0), geg('\\alpha', 'Neigungswinkel', alpha, '°', 1)],
    frage: 'Berechne H in kN (g = 9,81 m/s²).',
    gesucht: { sym: 'H', name: 'Hangabtriebskraft', einheit: 'kN' },
    loesung: roundTo(h, 2), nk: 2,
    tipp: 'Erst die Gewichtskraft: G = m · g (m in kg → G in N). Dann H = G · sin α.',
    schritte: [
      s('Gewichtskraft:', `G = ${zl(mT * 1000, 0)}\\,\\text{kg} \\cdot 9{,}81\\,\\tfrac{\\text{m}}{\\text{s}^2} = ${zl(gKn * 1000, 0)}\\,\\text{N} = ${zl(gKn, 2)}\\,\\text{kN}`),
      s('Hangabtrieb:', `H = ${zl(gKn, 2)} \\cdot \\sin ${zl(alpha, 1)}° = ${zl(h, 2)}\\,\\text{kN}`),
    ],
  });
}

function frageV(stufe: Stufe): Aufgabe {
  return auswahl({
    appId: APP, formelId: 'fliehkraft', modus: 'ueben', stufe,
    text: 'Ein Zug fährt doppelt so schnell durch denselben Bogen.',
    gegeben: [],
    frage: 'Wie verändert sich die Fliehkraft?',
    optionen: ['4-mal so groß', 'doppelt so groß', 'halb so groß', 'bleibt gleich'],
    tipp: 'v steht im Quadrat.',
    schritte: [s('(2v)² = 4 · v². Die Fliehkraft wird viermal so groß.', 'F = \\frac{m \\cdot v^2}{r}')],
  });
}

// ---------- Umstellen ----------

function umstellenV(stufe: Stufe): Aufgabe {
  const mT = masseT();
  const m = mT * 1000;
  const r = randStep(300, 3000, 50);
  const fKn = randStep(5, 400, 5);
  const v = Math.sqrt((fKn * 1000 * r) / m);
  if (v < 5 || v > 90) return umstellenV(stufe);
  return zahl({
    appId: APP, formelId: 'fliehkraft', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Ein Fahrzeug (${fmt(m, 0)} kg) im Bogen r = ${fmt(r, 0)} m darf höchstens ${fKn} kN Fliehkraft erfahren. Wie schnell darf es fahren?` : undefined,
    gegeben: [geg('F', 'Fliehkraft', fKn, 'kN', 0), geg('m', 'Masse', m, 'kg', 0), geg('r', 'Radius', r, 'm', 0)],
    frage: stufe >= 2 ? 'Höchstgeschwindigkeit in km/h?' : 'Berechne v in m/s.',
    gesucht: { sym: 'v', name: 'Geschwindigkeit', einheit: stufe >= 2 ? 'km/h' : 'm/s' },
    loesung: stufe >= 2 ? roundTo(v * 3.6, 1) : roundTo(v, 2), nk: stufe >= 2 ? 1 : 2,
    tipp: 'Mal r, geteilt durch m, Wurzel ziehen. F in N einsetzen!' + (stufe >= 2 ? ' Am Ende × 3,6.' : ''),
    formelLatex: 'v = \\sqrt{\\frac{F \\cdot r}{m}}',
    schritte: [
      s('Umstellen:', 'v = \\sqrt{\\frac{F \\cdot r}{m}}'),
      s('Einsetzen (F in N):', `v = \\sqrt{\\frac{${zl(fKn * 1000, 0)} \\cdot ${zl(r, 0)}}{${zl(m, 0)}}} = ${zl(v, 2)}\\,\\tfrac{\\text{m}}{\\text{s}}`),
      ...(stufe >= 2 ? [s('In km/h:', `v = ${zl(v, 2)} \\cdot 3{,}6 = ${zl(v * 3.6, 1)}\\,\\tfrac{\\text{km}}{\\text{h}}`)] : []),
    ],
  });
}

function umstellenR(stufe: Stufe): Aufgabe {
  const mT = masseT();
  const m = mT * 1000;
  const vMs = randStep(10, 50, 1);
  const fKn = randStep(5, 400, 5);
  const r = (m * vMs * vMs) / (fKn * 1000);
  if (r < 100 || r > 10000) return umstellenR(stufe);
  return zahl({
    appId: APP, formelId: 'fliehkraft', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Ein Fahrzeug mit ${fmt(m, 0)} kg fährt ${vMs} m/s. Die Fliehkraft soll ${fKn} kN nicht überschreiten. Welcher Radius ist mindestens nötig?` : undefined,
    gegeben: [geg('F', 'Fliehkraft', fKn, 'kN', 0), geg('m', 'Masse', m, 'kg', 0), geg('v', 'Geschwindigkeit', vMs, 'm/s', 0)],
    frage: 'Berechne r in m.',
    gesucht: { sym: 'r', name: 'Radius', einheit: 'm' },
    loesung: roundTo(r, 0), nk: 0,
    tipp: 'r und F tauschen die Plätze. F in N!',
    formelLatex: 'r = \\frac{m \\cdot v^2}{F}',
    schritte: [s('Umstellen:', 'r = \\frac{m \\cdot v^2}{F}'), s('Einsetzen:', `r = \\frac{${zl(m, 0)} \\cdot ${zl(vMs, 0)}^2}{${zl(fKn * 1000, 0)}} = ${zl(r, 0)}\\,\\text{m}`)],
  });
}

function umstellenG(stufe: Stufe): Aufgabe {
  const hKn = randStep(2, 150, 1);
  const alpha = randStep(0.5, 3, 0.1);
  const g = hKn / Math.sin((alpha * Math.PI) / 180);
  return zahl({
    appId: APP, formelId: 'hangabtrieb', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Die Feststellbremse eines Wagens hält höchstens ${hKn} kN. Wie schwer (Gewichtskraft) darf der Wagen auf einer Neigung von ${fmt(alpha, 1)}° sein?` : undefined,
    gegeben: [geg('H', 'Hangabtriebskraft', hKn, 'kN', 0), geg('\\alpha', 'Neigungswinkel', alpha, '°', 1)],
    frage: 'Berechne G in kN.',
    gesucht: { sym: 'G', name: 'Gewichtskraft', einheit: 'kN' },
    loesung: roundTo(g, 0), nk: 0,
    tipp: 'Durch sin α teilen.',
    formelLatex: 'G = \\frac{H}{\\sin \\alpha}',
    schritte: [s('Umstellen:', 'G = \\frac{H}{\\sin \\alpha}'), s('Einsetzen:', `G = \\frac{${zl(hKn, 0)}}{\\sin ${zl(alpha, 1)}°} = ${zl(g, 0)}\\,\\text{kN}`)],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenT(stufe: Stufe): Aufgabe {
  const mT = masseT();
  const vKmh = randStep(40, 200, 10);
  const r = randStep(300, 3000, 50);
  const v = vKmh / 3.6;
  const f = fliehkraft(mT * 1000, v, r);
  return zahl({
    appId: APP, formelId: 'fliehkraft', modus: 'einheiten', stufe,
    text: `Ein ${mT}-t-Fahrzeug fährt mit ${vKmh} km/h durch einen Bogen mit r = ${fmt(r, 0)} m.`,
    gegeben: [geg('m', 'Masse', mT, 't', 0), geg('v', 'Geschwindigkeit', vKmh, 'km/h', 0), geg('r', 'Radius', r, 'm', 0)],
    frage: 'Fliehkraft in kN?',
    gesucht: { sym: 'F', name: 'Fliehkraft', einheit: 'kN' },
    loesung: roundTo(f / 1000, 2), nk: 2,
    tipp: 'Zwei Fallen: t → kg (× 1000) und km/h → m/s (÷ 3,6).',
    schritte: [
      s('Umrechnen:', `m = ${zl(mT * 1000, 0)}\\,\\text{kg}, \\quad v = \\frac{${zl(vKmh, 0)}}{3{,}6} = ${zl(v, 3)}\\,\\tfrac{\\text{m}}{\\text{s}}`),
      s('Einsetzen:', `F = \\frac{${zl(mT * 1000, 0)} \\cdot ${zl(v, 3)}^2}{${zl(r, 0)}} = ${zl(f, 0)}\\,\\text{N} = ${zl(f / 1000, 2)}\\,\\text{kN}`),
    ],
  });
}

function einheitenProzent(stufe: Stufe): Aufgabe {
  const gKn = randStep(200, 4000, 50);
  const prozent = randStep(0.5, 4, 0.5);
  const alpha = roundTo(winkelAusPromille(prozent * 10), 4);
  const h = hangabtrieb(gKn, alpha);
  return zahl({
    appId: APP, formelId: 'hangabtrieb', modus: 'einheiten', stufe,
    text: `Auf dem Schild steht eine Steigung von ${fmt(prozent, 1)} %. Der Bauzug wiegt G = ${fmt(gKn, 0)} kN.`,
    gegeben: [geg('G', 'Gewichtskraft', gKn, 'kN', 0), geg('s', 'Neigung', prozent, '%', 1)],
    frage: 'Hangabtriebskraft in kN?',
    gesucht: { sym: 'H', name: 'Hangabtriebskraft', einheit: 'kN' },
    loesung: roundTo(h, 2), nk: 2,
    tipp: '% → ‰: × 10. Dann α = arctan(s/1000) – oder direkt arctan(%/100).',
    schritte: [
      s('Neigung in ‰:', `s = ${zl(prozent, 1)}\\,\\% = ${zl(prozent * 10, 0)}\\,‰`),
      s('Winkel:', `\\alpha = \\arctan\\left(\\frac{${zl(prozent * 10, 0)}}{1000}\\right) = ${zl(alpha, 4)}°`),
      s('Hangabtrieb:', `H = ${zl(gKn, 0)} \\cdot \\sin ${zl(alpha, 4)}° = ${zl(h, 2)}\\,\\text{kN}`),
    ],
  });
}

// ---------- Rechner ----------

function rechnerF(w: Record<string, number>): RechnerAusgabe {
  const { m, v, r } = w as { m: number; v: number; r: number };
  if (!(m > 0) || !(v >= 0) || !(r > 0)) return { ergebnisse: [], warnungen: ['m und r müssen größer als 0 sein.'], schritte: [] };
  const f = fliehkraft(m, v, r);
  return {
    ergebnisse: [
      { sym: 'F', name: 'Fliehkraft', wert: f / 1000, einheit: 'kN', nk: 2, hervorheben: true },
      { sym: 'F', name: 'Fliehkraft', wert: f, einheit: 'N', nk: 0 },
    ],
    warnungen: [],
    schritte: [s('', `F = \\frac{${zl(m, 0)} \\cdot ${zl(v, 3)}^2}{${zl(r, 0)}} = ${zl(f, 0)}\\,\\text{N}`)],
  };
}

function rechnerHV(w: Record<string, number>): RechnerAusgabe {
  const { g, s: promille } = w as { g: number; s: number };
  if (!(g > 0) || !Number.isFinite(promille)) return { ergebnisse: [], warnungen: ['G > 0 und Neigung eingeben.'], schritte: [] };
  const alpha = winkelAusPromille(promille);
  return {
    ergebnisse: [
      { sym: 'H', name: 'Hangabtriebskraft', wert: hangabtrieb(g, alpha), einheit: 'kN', nk: 2, hervorheben: true },
      { sym: 'V', name: 'Vertikalkraft', wert: vertikalkraft(g, alpha), einheit: 'kN', nk: 2 },
      { sym: '\\alpha', name: 'Neigungswinkel', wert: alpha, einheit: '°', nk: 4 },
    ],
    warnungen: [],
    schritte: [
      s('', `\\alpha = \\arctan\\left(\\frac{${zl(promille, 1)}}{1000}\\right) = ${zl(alpha, 4)}°`),
      s('', `H = ${zl(g, 1)} \\cdot \\sin ${zl(alpha, 4)}° = ${zl(hangabtrieb(g, alpha), 2)}\\,\\text{kN}`),
      s('', `V = ${zl(g, 1)} \\cdot \\cos ${zl(alpha, 4)}° = ${zl(vertikalkraft(g, alpha), 2)}\\,\\text{kN}`),
    ],
  };
}

export const FAHRZEUGKRAEFTE_APP: MiniAppDef = {
  id: APP,
  skizze: 'fahrzeugkraefte',
  formelIds: ['fliehkraft', 'hangabtrieb', 'vertikalkraft'],
  merkhilfen: [
    'Fliehkraft: v immer in m/s! km/h ÷ 3,6 = m/s. Masse in kg → Kraft in N.',
    'Gewichtskraft G = m · g mit g = 9,81 m/s². 1 t ≈ 9,81 kN.',
    'Auf der Neigung wird G zerlegt: H = G · sin α (hangabwärts), V = G · cos α (senkrecht auf die Schiene).',
    'Neigung in ‰ → Winkel: α = arctan(s / 1000). Taschenrechner auf DEG!',
  ],
  rechner: [
    {
      id: 'f', label: 'Fliehkraft',
      felder: [
        { key: 'm', sym: 'm', name: 'Masse', einheit: 'kg', standard: 60000 },
        { key: 'v', sym: 'v', name: 'Geschwindigkeit', einheit: 'm/s', einheiten: ['km/h', 'm/s'], standard: 120 },
        { key: 'r', sym: 'r', name: 'Radius', einheit: 'm', einheiten: ['m', 'km'], standard: 1000 },
      ],
      berechne: rechnerF,
    },
    {
      id: 'hv', label: 'Hangabtrieb & Vertikalkraft',
      felder: [
        { key: 'g', sym: 'G', name: 'Gewichtskraft', einheit: 'kN', standard: 1000 },
        { key: 's', sym: 's', name: 'Neigung', einheit: '‰', einheiten: ['‰', '%'], standard: 12.5 },
      ],
      berechne: rechnerHV,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') return (stufe === 1 ? randChoice([umstellenR, umstellenG]) : randChoice([umstellenV, umstellenR, umstellenG]))(stufe);
    if (modus === 'einheiten') return randChoice([einheitenT, einheitenProzent])(stufe);
    if (stufe === 1) return randChoice([uebenFlieh, uebenHang, uebenVertikal])(1);
    if (stufe === 2) return chance(0.15) ? frageV(2) : randChoice([uebenFlieh, uebenHang, uebenVertikal])(2);
    return randChoice([uebenFlieh, uebenHang, uebenGewicht])(3);
  },
};

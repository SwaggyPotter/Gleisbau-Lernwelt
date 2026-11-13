import { auswahl, geg, s, zahl } from '../kern/bauer';
import { geschwindigkeitAusQuer, querbeschleunigung, radiusAusQuer, ueberhoehungAusQuer } from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

/* Kap. 10 – Freie Querbeschleunigung aq = v²/(12,96·r) − u/153. */

const APP = 'querbeschleunigung';

function werte(): { v: number; r: number; u: number; aq: number } {
  for (;;) {
    const v = randStep(60, 200, 10);
    const r = randStep(400, 4000, 50);
    const u = randStep(0, 160, 5);
    const aq = querbeschleunigung(v, r, u);
    if (Math.abs(aq) >= 0.05 && aq < 1.3 && aq > -0.8) return { v, r, u, aq };
  }
}

function rechnung(v: number, r: number, u: number): string {
  const a = querbeschleunigung(v, r, u);
  return `a_q = \\frac{${zl(v, 0)}^2}{12{,}96 \\cdot ${zl(r, 0)}} - \\frac{${zl(u, 0)}}{153} = ${zl((v * v) / (12.96 * r), 3)} - ${zl(u / 153, 3)} = ${zl(a, 3)}\\,\\tfrac{\\text{m}}{\\text{s}^2}`;
}

// ---------- Üben ----------

function uebenAq(stufe: Stufe): Aufgabe {
  const { v, r, u, aq } = werte();
  return zahl({
    appId: APP, formelId: 'querbeschleunigung', modus: 'ueben', stufe,
    text: stufe >= 2
      ? randChoice([
          `Ein Zug fährt mit ${v} km/h durch einen Bogen (r = ${fmt(r, 0)} m), der um ${u} mm überhöht ist. Welche Querbeschleunigung spüren die Fahrgäste?`,
          `Bogen r = ${fmt(r, 0)} m, Überhöhung u = ${u} mm, Streckengeschwindigkeit ${v} km/h. Wie groß ist die freie (nicht ausgeglichene) Seitenbeschleunigung?`,
        ])
      : undefined,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('r', 'Radius', r, 'm', 0), geg('u', 'Überhöhung', u, 'mm', 0)],
    frage: 'Berechne aq in m/s² (negativ = nach innen).',
    gesucht: { sym: 'a_q', name: 'Freie Querbeschleunigung', einheit: 'm/s²' },
    loesung: roundTo(aq, 3), nk: 3,
    tipp: 'v als Zahl in km/h (die 12,96 rechnet schon um), r in m, u in mm.',
    schritte: [s('Formel:', 'a_q = \\frac{v^2}{12{,}96 \\cdot r} - \\frac{u}{153}'), s('Einsetzen:', rechnung(v, r, u))],
  });
}

function frageVorzeichen(stufe: Stufe): Aufgabe {
  return auswahl({
    appId: APP, formelId: 'querbeschleunigung', modus: 'ueben', stufe,
    text: 'Ein Güterzug fährt sehr langsam durch einen stark überhöhten Bogen. Die Rechnung ergibt einen negativen Wert für aq.',
    gegeben: [],
    frage: 'Was bedeutet das negative Vorzeichen?',
    optionen: ['Die Beschleunigung wirkt zur Bogeninnenseite (Überhöhungsüberschuss)', 'Es wurde falsch gerechnet – aq kann nicht negativ sein', 'Die Beschleunigung wirkt nach außen', 'Der Zug steht'],
    tipp: 'Welcher Anteil ist größer – v²/(12,96 r) oder u/153?',
    schritte: [s('Wenn u/153 größer ist als v²/(12,96·r), überwiegt der Hangabtrieb der Überhöhung: Der Zug wird nach innen gedrückt.')],
  });
}

// ---------- Umstellen ----------

function umstellenV(stufe: Stufe): Aufgabe {
  const r = randStep(400, 4000, 50);
  const u = randStep(40, 160, 5);
  const aq = randChoice([0.5, 0.65, 0.85, 1.0]);
  const v = geschwindigkeitAusQuer(aq, r, u);
  return zahl({
    appId: APP, formelId: 'querbeschleunigung', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Im Bogen r = ${fmt(r, 0)} m mit u = ${u} mm soll die freie Querbeschleunigung höchstens ${fmt(aq, 2)} m/s² betragen (Vorgabe der Aufgabe). Wie schnell darf der Zug fahren?` : undefined,
    gegeben: [geg('a_q', 'Querbeschleunigung', aq, 'm/s²', 2), geg('r', 'Radius', r, 'm', 0), geg('u', 'Überhöhung', u, 'mm', 0)],
    frage: 'Berechne v in km/h.',
    gesucht: { sym: 'v', name: 'Geschwindigkeit', einheit: 'km/h' },
    loesung: roundTo(v, 1), nk: 1,
    tipp: 'u/153 auf die andere Seite (plus), mal 12,96 · r, dann Wurzel.',
    formelLatex: 'v = \\sqrt{12{,}96 \\cdot r \\cdot \\left(a_q + \\frac{u}{153}\\right)}',
    schritte: [
      s('Umstellen:', 'v = \\sqrt{12{,}96 \\cdot r \\cdot \\left(a_q + \\frac{u}{153}\\right)}'),
      s('Einsetzen:', `v = \\sqrt{12{,}96 \\cdot ${zl(r, 0)} \\cdot (${zl(aq, 2)} + ${zl(u / 153, 3)})} = ${zl(v, 1)}\\,\\tfrac{\\text{km}}{\\text{h}}`),
    ],
  });
}

function umstellenU(stufe: Stufe): Aufgabe {
  for (;;) {
    const v = randStep(80, 200, 10);
    const r = randStep(600, 4000, 50);
    const aq = randChoice([0.3, 0.4, 0.5, 0.65]);
    const u = ueberhoehungAusQuer(aq, v, r);
    if (u < 10 || u > 180) continue;
    return zahl({
      appId: APP, formelId: 'querbeschleunigung', modus: 'umstellen', stufe,
      text: stufe >= 2 ? `Ein Bogen (r = ${fmt(r, 0)} m) wird mit ${v} km/h befahren. Die freie Querbeschleunigung soll genau ${fmt(aq, 2)} m/s² betragen. Welche Überhöhung ist nötig?` : undefined,
      gegeben: [geg('a_q', 'Querbeschleunigung', aq, 'm/s²', 2), geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('r', 'Radius', r, 'm', 0)],
      frage: 'Berechne u in mm.',
      gesucht: { sym: 'u', name: 'Überhöhung', einheit: 'mm' },
      loesung: roundTo(u, 1), nk: 1,
      tipp: 'u/153 = v²/(12,96·r) − aq. Dann mal 153.',
      formelLatex: 'u = 153 \\cdot \\left(\\frac{v^2}{12{,}96 \\cdot r} - a_q\\right)',
      schritte: [
        s('Umstellen:', 'u = 153 \\cdot \\left(\\frac{v^2}{12{,}96 \\cdot r} - a_q\\right)'),
        s('Einsetzen:', `u = 153 \\cdot (${zl((v * v) / (12.96 * r), 3)} - ${zl(aq, 2)}) = ${zl(u, 1)}\\,\\text{mm}`),
      ],
    });
  }
}

function umstellenR(stufe: Stufe): Aufgabe {
  const v = randStep(80, 200, 10);
  const u = randStep(40, 160, 5);
  const aq = randChoice([0.5, 0.65, 0.85]);
  const r = radiusAusQuer(aq, v, u);
  return zahl({
    appId: APP, formelId: 'querbeschleunigung', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Für ${v} km/h und u = ${u} mm darf aq höchstens ${fmt(aq, 2)} m/s² werden. Wie klein darf der Radius sein?` : undefined,
    gegeben: [geg('a_q', 'Querbeschleunigung', aq, 'm/s²', 2), geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('u', 'Überhöhung', u, 'mm', 0)],
    frage: 'Berechne r in m.',
    gesucht: { sym: 'r', name: 'Radius', einheit: 'm' },
    loesung: roundTo(r, 0), nk: 0,
    tipp: 'Erst (aq + u/153), dann r = v² / (12,96 · Klammer).',
    formelLatex: 'r = \\frac{v^2}{12{,}96 \\cdot \\left(a_q + \\frac{u}{153}\\right)}',
    schritte: [
      s('Umstellen:', 'r = \\frac{v^2}{12{,}96 \\cdot \\left(a_q + \\frac{u}{153}\\right)}'),
      s('Einsetzen:', `r = \\frac{${zl(v, 0)}^2}{12{,}96 \\cdot (${zl(aq, 2)} + ${zl(u / 153, 3)})} = ${zl(r, 0)}\\,\\text{m}`),
    ],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenMs(stufe: Stufe): Aufgabe {
  const { v, r, u } = werte();
  const vMs = roundTo(v / 3.6, 1);
  const vKmh = vMs * 3.6;
  const a = querbeschleunigung(vKmh, r, u);
  if (Math.abs(a) < 0.05) return einheitenMs(stufe);
  return zahl({
    appId: APP, formelId: 'querbeschleunigung', modus: 'einheiten', stufe,
    text: `Der Fahrtenschreiber zeigt ${fmt(vMs, 1)} m/s. Bogen r = ${fmt(r, 0)} m, u = ${u} mm.`,
    gegeben: [geg('v', 'Geschwindigkeit', vMs, 'm/s', 1), geg('r', 'Radius', r, 'm', 0), geg('u', 'Überhöhung', u, 'mm', 0)],
    frage: 'aq in m/s²?',
    gesucht: { sym: 'a_q', name: 'Freie Querbeschleunigung', einheit: 'm/s²' },
    loesung: roundTo(a, 3), nk: 3,
    tipp: 'Die Formel will v in km/h (wegen 12,96 = 3,6²). Also erst × 3,6 – oder v²/r direkt ohne 12,96 rechnen.',
    schritte: [
      s('v in km/h:', `v = ${zl(vMs, 1)} \\cdot 3{,}6 = ${zl(vKmh, 2)}\\,\\tfrac{\\text{km}}{\\text{h}}`),
      s('Einsetzen:', `a_q = \\frac{${zl(vKmh, 2)}^2}{12{,}96 \\cdot ${zl(r, 0)}} - \\frac{${zl(u, 0)}}{153} = ${zl(a, 3)}\\,\\tfrac{\\text{m}}{\\text{s}^2}`),
    ],
  });
}

function einheitenCm(stufe: Stufe): Aufgabe {
  const { v, r, u, aq } = werte();
  const uCm = u / 10;
  return zahl({
    appId: APP, formelId: 'querbeschleunigung', modus: 'einheiten', stufe,
    text: `Die Überhöhung wurde mit dem Zollstock gemessen: ${fmt(uCm, 1)} cm. v = ${v} km/h, r = ${fmt(r, 0)} m.`,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('r', 'Radius', r, 'm', 0), geg('u', 'Überhöhung', uCm, 'cm', 1)],
    frage: 'aq in m/s²?',
    gesucht: { sym: 'a_q', name: 'Freie Querbeschleunigung', einheit: 'm/s²' },
    loesung: roundTo(aq, 3), nk: 3,
    tipp: 'u muss in mm eingesetzt werden: cm × 10.',
    schritte: [s('u in mm:', `u = ${zl(uCm, 1)}\\,\\text{cm} = ${zl(u, 0)}\\,\\text{mm}`), s('Einsetzen:', rechnung(v, r, u))],
  });
}

// ---------- Rechner ----------

function rechnerAq(w: Record<string, number>): RechnerAusgabe {
  const { v, r, u } = w as { v: number; r: number; u: number };
  if (!(v >= 0) || !(r > 0) || !Number.isFinite(u)) return { ergebnisse: [], warnungen: ['v, r und u eingeben (r > 0).'], schritte: [] };
  const aq = querbeschleunigung(v, r, u);
  return {
    ergebnisse: [
      { sym: 'a_q', name: aq >= 0 ? 'Freie Querbeschleunigung (nach außen)' : 'Freie Querbeschleunigung (nach innen)', wert: aq, einheit: 'm/s²', nk: 3, hervorheben: true },
      { sym: 'u_f', name: 'Entspricht Fehlbetrag aq · 153', wert: aq * 153, einheit: 'mm', nk: 1 },
    ],
    warnungen: u > 180 ? ['Überhöhung über 180 mm ist nach EBO § 6 Abs. 3 nicht zulässig.'] : [],
    schritte: [s('', rechnung(v, r, u))],
  };
}

function rechnerV(w: Record<string, number>): RechnerAusgabe {
  const { aq, r, u } = w as { aq: number; r: number; u: number };
  if (!(r > 0) || !Number.isFinite(aq) || !Number.isFinite(u) || aq + u / 153 <= 0) return { ergebnisse: [], warnungen: ['r > 0 und aq + u/153 muss positiv sein.'], schritte: [] };
  const v = geschwindigkeitAusQuer(aq, r, u);
  return {
    ergebnisse: [{ sym: 'v', name: 'Geschwindigkeit', wert: v, einheit: 'km/h', nk: 1, hervorheben: true }],
    warnungen: [],
    schritte: [s('', `v = \\sqrt{12{,}96 \\cdot ${zl(r, 0)} \\cdot (${zl(aq, 3)} + ${zl(u / 153, 3)})} = ${zl(v, 1)}\\,\\tfrac{\\text{km}}{\\text{h}}`)],
  };
}

export const QUERBESCHLEUNIGUNG_APP: MiniAppDef = {
  id: APP,
  skizze: 'querbeschleunigung',
  formelIds: ['querbeschleunigung'],
  merkhilfen: [
    'Erster Teil v²/(12,96·r): Beschleunigung nach außen durch den Bogen. Zweiter Teil u/153: was die Überhöhung davon ausgleicht.',
    '12,96 = 3,6² (km/h → m/s). 153 ≈ 1500 mm / 9,81 m/s².',
    'aq positiv → nach außen. aq negativ → nach innen (Überhöhungsüberschuss, langsame Züge).',
    'aq · 153 ≈ Überhöhungsfehlbetrag uf – passt zur App „Überhöhung“.',
  ],
  verweise: [{ label: 'App 11 – Überhöhung', link: '/berufsschule/formelsammlung/ueberhoehung' }],
  rechner: [
    {
      id: 'aq', label: 'aq berechnen',
      felder: [
        { key: 'v', sym: 'v', name: 'Geschwindigkeit', einheit: 'km/h', einheiten: ['km/h', 'm/s'], standard: 120 },
        { key: 'r', sym: 'r', name: 'Radius', einheit: 'm', einheiten: ['m', 'km'], standard: 1000 },
        { key: 'u', sym: 'u', name: 'Überhöhung', einheit: 'mm', einheiten: ['mm', 'cm'], standard: 100 },
      ],
      berechne: rechnerAq,
    },
    {
      id: 'v', label: 'v aus aq',
      felder: [
        { key: 'aq', sym: 'a_q', name: 'Querbeschleunigung', einheit: 'm/s²', standard: 0.65 },
        { key: 'r', sym: 'r', name: 'Radius', einheit: 'm', einheiten: ['m', 'km'], standard: 1000 },
        { key: 'u', sym: 'u', name: 'Überhöhung', einheit: 'mm', einheiten: ['mm', 'cm'], standard: 100 },
      ],
      berechne: rechnerV,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') return (stufe === 1 ? umstellenV : randChoice([umstellenV, umstellenU, umstellenR]))(stufe);
    if (modus === 'einheiten') return randChoice([einheitenMs, einheitenCm])(stufe);
    if (stufe >= 2 && chance(0.15)) return frageVorzeichen(stufe);
    return uebenAq(stufe);
  },
};

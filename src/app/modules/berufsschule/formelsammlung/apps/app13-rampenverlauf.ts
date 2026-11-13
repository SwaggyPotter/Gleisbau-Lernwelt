import { auswahl, geg, s, zahl } from '../kern/bauer';
import { uxGerade, uxS, xAusUxGerade } from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Schritt, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

/* Kap. 18 – Überhöhung an jeder Stelle x der geraden bzw. S-förmigen Rampe. */

const APP = 'rampenverlauf';

function sSchritte(uE: number, x: number, l: number): Schritt[] {
  const { ux, haelfte } = uxS(uE, x, l);
  if (haelfte === 1) {
    return [
      s(`x = ${fmt(x, 1)} m ≤ l/2 = ${fmt(l / 2, 1)} m → erste Hälfte:`, 'u_x = \\frac{2 \\cdot u_E \\cdot x^2}{l_{RS}^2}'),
      s('Einsetzen:', `u_x = \\frac{2 \\cdot ${zl(uE, 0)} \\cdot ${zl(x, 1)}^2}{${zl(l, 0)}^2} = ${zl(ux, 1)}\\,\\text{mm}`),
    ];
  }
  return [
    s(`x = ${fmt(x, 1)} m > l/2 = ${fmt(l / 2, 1)} m → zweite Hälfte:`, 'u_x = u_E - \\frac{2 \\cdot u_E \\cdot (l_{RS} - x)^2}{l_{RS}^2}'),
    s('Einsetzen:', `u_x = ${zl(uE, 0)} - \\frac{2 \\cdot ${zl(uE, 0)} \\cdot (${zl(l, 0)} - ${zl(x, 1)})^2}{${zl(l, 0)}^2} = ${zl(ux, 1)}\\,\\text{mm}`),
  ];
}

// ---------- Üben ----------

function uebenGerade(stufe: Stufe): Aufgabe {
  const u = randStep(30, 160, 5);
  const l = randStep(40, 200, 5);
  const x = randStep(5, l - 5, 5);
  const ux = uxGerade(u, x, l);
  return zahl({
    appId: APP, formelId: 'ux-gerade', modus: 'ueben', stufe,
    text: stufe >= 2 ? `In einer geraden Überhöhungsrampe (lR = ${l} m) steigt die Überhöhung auf ${u} mm. Du kontrollierst ${x} m nach dem Rampenanfang.` : undefined,
    gegeben: [geg('u', 'Überhöhung am Rampenende', u, 'mm', 0), geg('x', 'Abstand vom Rampenanfang', x, 'm', 0), geg('l_R', 'Rampenlänge', l, 'm', 0)],
    frage: 'Wie groß muss die Überhöhung an dieser Stelle sein (mm)?',
    gesucht: { sym: 'u_x', name: 'Überhöhung an der Stelle x', einheit: 'mm' },
    loesung: roundTo(ux, 1), nk: 1,
    tipp: 'Gerade Rampe = Dreisatz: u wächst gleichmäßig mit x.',
    schritte: [s('Formel:', 'u_x = \\frac{u \\cdot x}{l_R}'), s('Einsetzen:', `u_x = \\frac{${zl(u, 0)} \\cdot ${zl(x, 0)}}{${zl(l, 0)}} = ${zl(ux, 1)}\\,\\text{mm}`)],
  });
}

function uebenS(stufe: Stufe, haelfte?: 1 | 2): Aufgabe {
  const uE = randStep(30, 160, 5);
  const l = randStep(40, 200, 10);
  const h = haelfte ?? (stufe >= 3 ? randChoice([1, 2] as const) : 1);
  const x = h === 1 ? randStep(Math.ceil(l / 8), l / 2, 1) : randStep(l / 2 + 1, l - 2, 1);
  const { ux } = uxS(uE, x, l);
  return zahl({
    appId: APP, formelId: h === 1 ? 'ux-s-1' : 'ux-s-2', modus: 'ueben', stufe,
    text: stufe >= 2 ? `S-förmige Rampe mit lRS = ${l} m bis auf uE = ${uE} mm. Messpunkt bei x = ${x} m ab Rampenanfang.` : undefined,
    gegeben: [geg('u_E', 'Überhöhung am Rampenende', uE, 'mm', 0), geg('x', 'Abstand vom Rampenanfang', x, 'm', 0), geg('l_{RS}', 'Rampenlänge', l, 'm', 0)],
    frage: 'Berechne ux in mm.',
    gesucht: { sym: 'u_x', name: 'Überhöhung an der Stelle x', einheit: 'mm' },
    loesung: roundTo(ux, 1), nk: 1,
    tipp: 'Erst prüfen: Liegt x in der ersten oder zweiten Hälfte der Rampe?',
    schritte: sSchritte(uE, x, l),
  });
}

function frageHaelfte(stufe: Stufe): Aufgabe {
  const l = randStep(40, 200, 10);
  const x = randStep(5, l - 5, 1);
  if (x === l / 2) return frageHaelfte(stufe);
  const erste = x < l / 2;
  return auswahl({
    appId: APP, formelId: erste ? 'ux-s-1' : 'ux-s-2', modus: 'ueben', stufe,
    text: `S-förmige Rampe, lRS = ${l} m. Gesucht ist die Überhöhung bei x = ${x} m.`,
    gegeben: [],
    frage: 'Welche Formel nimmst du?',
    optionen: [
      erste ? 'u_x = \\frac{2 \\cdot u_E \\cdot x^2}{l_{RS}^2}' : 'u_x = u_E - \\frac{2 \\cdot u_E \\cdot (l_{RS} - x)^2}{l_{RS}^2}',
      erste ? 'u_x = u_E - \\frac{2 \\cdot u_E \\cdot (l_{RS} - x)^2}{l_{RS}^2}' : 'u_x = \\frac{2 \\cdot u_E \\cdot x^2}{l_{RS}^2}',
      'u_x = \\frac{u \\cdot x}{l_R}',
    ],
    tipp: `Die Mitte liegt bei ${fmt(l / 2, 0)} m.`,
    schritte: [s(erste ? `x = ${x} m < ${fmt(l / 2, 0)} m → erste Hälfte.` : `x = ${x} m > ${fmt(l / 2, 0)} m → zweite Hälfte.`)],
  });
}

// ---------- Umstellen ----------

function umstellenXGerade(stufe: Stufe): Aufgabe {
  const u = randStep(40, 160, 5);
  const l = randStep(40, 200, 5);
  const ux = randStep(5, u - 5, 5);
  const x = xAusUxGerade(ux, u, l);
  return zahl({
    appId: APP, formelId: 'ux-gerade', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `In der geraden Rampe (lR = ${l} m, u = ${u} mm) soll der Punkt mit genau ${ux} mm Überhöhung markiert werden.` : undefined,
    gegeben: [geg('u_x', 'Überhöhung an der Stelle x', ux, 'mm', 0), geg('u', 'Überhöhung am Rampenende', u, 'mm', 0), geg('l_R', 'Rampenlänge', l, 'm', 0)],
    frage: 'In welchem Abstand x vom Rampenanfang (m)?',
    gesucht: { sym: 'x', name: 'Abstand vom Rampenanfang', einheit: 'm' },
    loesung: roundTo(x, 2), nk: 2,
    tipp: 'Mal lR, geteilt durch u.',
    formelLatex: 'x = \\frac{u_x \\cdot l_R}{u}',
    schritte: [s('Umstellen:', 'x = \\frac{u_x \\cdot l_R}{u}'), s('Einsetzen:', `x = \\frac{${zl(ux, 0)} \\cdot ${zl(l, 0)}}{${zl(u, 0)}} = ${zl(x, 2)}\\,\\text{m}`)],
  });
}

function umstellenXS(stufe: Stufe): Aufgabe {
  const uE = randStep(40, 160, 10);
  const l = randStep(40, 200, 10);
  const ux = randStep(5, uE / 2, 5);
  const x = l * Math.sqrt(ux / (2 * uE));
  return zahl({
    appId: APP, formelId: 'ux-s-1', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `S-förmige Rampe (lRS = ${l} m, uE = ${uE} mm). Wo ist in der ersten Hälfte die Überhöhung genau ${ux} mm?` : undefined,
    gegeben: [geg('u_x', 'Überhöhung an der Stelle x', ux, 'mm', 0), geg('u_E', 'Überhöhung am Rampenende', uE, 'mm', 0), geg('l_{RS}', 'Rampenlänge', l, 'm', 0)],
    frage: 'Berechne x in m.',
    gesucht: { sym: 'x', name: 'Abstand vom Rampenanfang', einheit: 'm' },
    loesung: roundTo(x, 2), nk: 2,
    tipp: 'Nach x² umstellen, dann Wurzel ziehen.',
    formelLatex: 'x = l_{RS} \\cdot \\sqrt{\\frac{u_x}{2 \\cdot u_E}}',
    schritte: [
      s('Umstellen: x² = ux · lRS² / (2 · uE) →', 'x = l_{RS} \\cdot \\sqrt{\\frac{u_x}{2 \\cdot u_E}}'),
      s('Einsetzen:', `x = ${zl(l, 0)} \\cdot \\sqrt{\\frac{${zl(ux, 0)}}{2 \\cdot ${zl(uE, 0)}}} = ${zl(x, 2)}\\,\\text{m}`),
    ],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenKm(stufe: Stufe): Aufgabe {
  const u = randStep(30, 160, 5);
  const l = randStep(40, 200, 5);
  const x = randStep(5, l - 5, 1);
  const startM = randStep(12000, 48000, 1);
  const kmA = startM / 1000;
  const kmP = (startM + x) / 1000;
  const ux = uxGerade(u, x, l);
  return zahl({
    appId: APP, formelId: 'ux-gerade', modus: 'einheiten', stufe,
    text: `Die gerade Rampe beginnt bei km ${fmt(kmA, 3)} und ist ${l} m lang (u = ${u} mm am Ende). Du stehst bei km ${fmt(kmP, 3)}.`,
    gegeben: [geg('u', 'Überhöhung am Rampenende', u, 'mm', 0), geg('l_R', 'Rampenlänge', l, 'm', 0), geg('km_A', 'Rampenanfang', kmA, 'km', 3), geg('km_P', 'Messpunkt', kmP, 'km', 3)],
    frage: 'Überhöhung am Messpunkt in mm?',
    gesucht: { sym: 'u_x', name: 'Überhöhung', einheit: 'mm' },
    loesung: roundTo(ux, 1), nk: 1,
    tipp: 'x = Differenz der Kilometer in m: (km_P − km_A) · 1000.',
    schritte: [
      s('x aus der Kilometrierung:', `x = (${zl(kmP, 3)} - ${zl(kmA, 3)}) \\cdot 1000 = ${zl(x, 0)}\\,\\text{m}`),
      s('Einsetzen:', `u_x = \\frac{${zl(u, 0)} \\cdot ${zl(x, 0)}}{${zl(l, 0)}} = ${zl(ux, 1)}\\,\\text{mm}`),
    ],
  });
}

function einheitenCm(stufe: Stufe): Aufgabe {
  const uECm = randStep(3, 16, 0.5);
  const uE = uECm * 10;
  const l = randStep(40, 200, 10);
  const x = randStep(Math.ceil(l / 8), l / 2, 1);
  const { ux } = uxS(uE, x, l);
  return zahl({
    appId: APP, formelId: 'ux-s-1', modus: 'einheiten', stufe,
    text: `S-förmige Rampe, lRS = ${l} m. Die Endüberhöhung steht in cm: uE = ${fmt(uECm, 1)} cm. Messpunkt x = ${x} m.`,
    gegeben: [geg('u_E', 'Überhöhung am Rampenende', uECm, 'cm', 1), geg('x', 'Abstand vom Rampenanfang', x, 'm', 0), geg('l_{RS}', 'Rampenlänge', l, 'm', 0)],
    frage: 'ux in mm?',
    gesucht: { sym: 'u_x', name: 'Überhöhung an der Stelle x', einheit: 'mm' },
    loesung: roundTo(ux, 1), nk: 1,
    tipp: 'uE erst in mm (× 10), dann Hälfte prüfen.',
    schritte: [s('uE in mm:', `u_E = ${zl(uECm, 1)}\\,\\text{cm} = ${zl(uE, 0)}\\,\\text{mm}`), ...sSchritte(uE, x, l)],
  });
}

// ---------- Rechner ----------

function rechner(w: Record<string, number>): RechnerAusgabe {
  const { u, l, x } = w as { u: number; l: number; x: number };
  if (!(u > 0) || !(l > 0) || !(x >= 0)) return { ergebnisse: [], warnungen: ['u und l > 0, x ≥ 0 eingeben.'], schritte: [] };
  const warnungen = x > l ? ['x liegt hinter dem Rampenende.'] : [];
  const xi = Math.min(x, l);
  const g = uxGerade(u, xi, l);
  const sv = uxS(u, xi, l).ux;
  const zeilen: string[][] = [];
  const schritt = l > 100 ? 20 : 10;
  for (let p = 0; p <= l + 1e-9; p += schritt) zeilen.push([fmt(p, 0), fmt(uxGerade(u, p, l), 1), fmt(uxS(u, p, l).ux, 1)]);
  return {
    ergebnisse: [
      { sym: 'u_x', name: 'Gerade Rampe', wert: g, einheit: 'mm', nk: 1, hervorheben: true },
      { sym: 'u_x', name: 'S-förmige Rampe', wert: sv, einheit: 'mm', nk: 1, hervorheben: true },
    ],
    warnungen,
    schritte: [s('Gerade:', `u_x = \\frac{${zl(u, 0)} \\cdot ${zl(xi, 1)}}{${zl(l, 1)}} = ${zl(g, 1)}\\,\\text{mm}`), ...sSchritte(u, xi, l)],
    tabelle: { titel: 'Verlauf über die Rampe', kopf: ['x [m]', 'gerade [mm]', 'S-förmig [mm]'], zeilen },
  };
}

export const RAMPENVERLAUF_APP: MiniAppDef = {
  id: APP,
  skizze: 'rampenverlauf',
  formelIds: ['ux-gerade', 'ux-s-1', 'ux-s-2'],
  merkhilfen: [
    'Gerade Rampe: Die Überhöhung wächst gleichmäßig – reiner Dreisatz.',
    'S-förmige Rampe: Am Anfang und Ende flach, in der Mitte steil. In der Mitte (x = l/2) ist genau die halbe Überhöhung erreicht.',
    'Zweite Hälfte – Praxistrick: x vom Rampenende her messen, Formel der ersten Hälfte rechnen und das Ergebnis von uE abziehen.',
  ],
  rechner: [
    {
      id: 'ux', label: 'Überhöhung an der Stelle x',
      felder: [
        { key: 'u', sym: 'u_E', name: 'Überhöhung am Rampenende', einheit: 'mm', einheiten: ['mm', 'cm'], standard: 120 },
        { key: 'l', sym: 'l_R', name: 'Rampenlänge', einheit: 'm', einheiten: ['m'], standard: 100 },
        { key: 'x', sym: 'x', name: 'Abstand vom Rampenanfang', einheit: 'm', einheiten: ['m'], standard: 30 },
      ],
      berechne: rechner,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') return (stufe === 1 ? umstellenXGerade : randChoice([umstellenXGerade, umstellenXS]))(stufe);
    if (modus === 'einheiten') return randChoice([einheitenKm, einheitenCm])(stufe);
    if (stufe === 1) return chance(0.6) ? uebenGerade(1) : uebenS(1, 1);
    if (stufe === 2) return chance(0.15) ? frageHaelfte(2) : randChoice([uebenGerade, uebenS])(2);
    return chance(0.2) ? frageHaelfte(3) : uebenS(3);
  },
};

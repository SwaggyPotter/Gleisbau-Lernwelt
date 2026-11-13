import { auswahl, geg, s, zahl } from '../kern/bauer';
import { pfeilhoehe, pfeilhoeheAB, radiusAusPfeilhoehe, radiusAusPfeilhoeheAB, sehneAusPfeilhoehe } from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

const APP = 'pfeilhoehe';
const TIPP_MITTE = 'Messpunkt in der Sehnenmitte → Formel mit Sehnenlänge ls und Radius r. Alles in Metern einsetzen.';
const TIPP_AB = 'Der Messpunkt liegt nicht in der Mitte → die Sehne wird in a und b geteilt. b = Sehnenlänge − a.';

function sehne(): number {
  return randChoice([10, 20, 20, 20, 15, 30]);
}

function radius(): number {
  return randStep(250, 3000, 50);
}

// ---------- Üben ----------

function uebenHf(stufe: Stufe, modus: AufgabenModus = 'ueben'): Aufgabe {
  const ls = sehne();
  const r = radius();
  const hf = pfeilhoehe(ls, r);
  const mm = stufe >= 2;
  const loesung = mm ? hf * 1000 : hf;
  const text = stufe >= 2
    ? randChoice([
        `Bei der Gleisabnahme prüfst du einen Bogen mit r = ${fmt(r, 0)} m. Mit der ${ls}-m-Sehne misst du in der Sehnenmitte. Welchen Sollwert muss die Pfeilhöhe haben?`,
        `Der Polier gibt dir den Lageplan: Bogenradius ${fmt(r, 0)} m. Du prüfst mit einer Sehne von ${ls} m. Wie groß ist die Soll-Pfeilhöhe in der Sehnenmitte?`,
      ])
    : undefined;
  return zahl({
    appId: APP, formelId: 'hf-sehne', modus, stufe, text,
    gegeben: [geg('l_s', 'Sehnenlänge', ls, 'm', 0), geg('r', 'Radius', r, 'm', 0)],
    frage: mm ? 'Berechne die Pfeilhöhe hf in mm.' : 'Berechne die Pfeilhöhe hf in m.',
    gesucht: { sym: 'h_f', name: 'Pfeilhöhe', einheit: mm ? 'mm' : 'm' },
    loesung: roundTo(loesung, mm ? 1 : 4), nk: mm ? 1 : 4,
    tipp: TIPP_MITTE,
    schritte: [
      s('Formel (Messpunkt in der Mitte):', 'h_f = \\frac{l_s^2}{8 \\cdot r}'),
      s('Werte in m einsetzen:', `h_f = \\frac{${zl(ls, 0)}^2}{8 \\cdot ${zl(r, 0)}} = \\frac{${zl(ls * ls, 0)}}{${zl(8 * r, 0)}} = ${zl(hf, 4)}\\,\\text{m}`),
      ...(mm ? [s('In mm umrechnen (× 1000):', `h_f = ${zl(hf, 4)}\\,\\text{m} \\cdot 1000 = ${zl(hf * 1000, 1)}\\,\\text{mm}`)] : []),
    ],
  });
}

function uebenAB(stufe: Stufe): Aufgabe {
  const ls = randChoice([10, 20, 20]);
  const a = randStep(1, ls / 2 - 1, 1);
  const b = ls - a;
  const r = radius();
  const hf = pfeilhoeheAB(a, b, r);
  return zahl({
    appId: APP, formelId: 'hf-ab', modus: 'ueben', stufe,
    text: `Bei einer ${ls}-m-Sehne liegt dein Messpunkt nicht in der Mitte, sondern ${a} m vom Sehnenanfang entfernt. Der Bogen hat r = ${fmt(r, 0)} m. Welche Pfeilhöhe musst du dort messen?`,
    gegeben: [geg('l_s', 'Sehnenlänge', ls, 'm', 0), geg('a', 'Abstand Sehnenanfang → Messpunkt', a, 'm', 0), geg('r', 'Radius', r, 'm', 0)],
    frage: 'Berechne die Pfeilhöhe am Messpunkt in mm.',
    gesucht: { sym: 'h_f', name: 'Pfeilhöhe', einheit: 'mm' },
    loesung: roundTo(hf * 1000, 1), nk: 1,
    tipp: TIPP_AB,
    schritte: [
      s('Messpunkt nicht in der Mitte → Formel mit a und b:', 'h_f = \\frac{a \\cdot b}{2 \\cdot r}'),
      s('b ausrechnen:', `b = l_s - a = ${zl(ls, 0)} - ${zl(a, 0)} = ${zl(b, 0)}\\,\\text{m}`),
      s('Einsetzen:', `h_f = \\frac{${zl(a, 0)} \\cdot ${zl(b, 0)}}{2 \\cdot ${zl(r, 0)}} = \\frac{${zl(a * b, 0)}}{${zl(2 * r, 0)}} = ${zl(hf, 4)}\\,\\text{m}`),
      s('In mm:', `h_f = ${zl(hf * 1000, 1)}\\,\\text{mm}`),
    ],
  });
}

function formelWahl(stufe: Stufe): Aufgabe {
  const ls = 20;
  const a = randStep(2, 8, 1);
  return auswahl({
    appId: APP, formelId: 'hf-ab', modus: 'ueben', stufe,
    text: `Du misst an einer ${ls}-m-Sehne, der Messpunkt liegt ${a} m vom Sehnenanfang entfernt.`,
    gegeben: [],
    frage: 'Welche Formel brauchst du für die Pfeilhöhe an diesem Punkt?',
    optionen: ['h_f = \\frac{a \\cdot b}{2 \\cdot r}', 'h_f = \\frac{l_s^2}{8 \\cdot r}', 'y = \\frac{x^2}{2 \\cdot r}', 'h_f = \\frac{a + b}{8 \\cdot r}'],
    tipp: 'Liegt der Messpunkt in der Mitte? Wenn nicht, braucht man die beiden Abschnitte.',
    schritte: [
      s(`Der Messpunkt liegt nicht in der Mitte (${a} m ≠ ${ls / 2} m). Deshalb gilt die allgemeine Formel mit den Abschnitten a = ${a} m und b = ${ls - a} m:`, 'h_f = \\frac{a \\cdot b}{2 \\cdot r}'),
      s('ls²/(8r) ist nur der Sonderfall a = b = ls/2.'),
    ],
  });
}

// ---------- Umstellen ----------

function umstellenR(stufe: Stufe): Aufgabe {
  const ls = sehne();
  const rWahr = radius();
  const hfMm = roundTo(pfeilhoehe(ls, rWahr) * 1000, 0);
  const hf = hfMm / 1000;
  const r = radiusAusPfeilhoehe(ls, hf);
  const text = stufe >= 2
    ? `Mit einer ${ls}-m-Sehne misst du in der Sehnenmitte eine Pfeilhöhe von ${fmt(hfMm, 0)} mm. Welcher Radius liegt an dieser Stelle vor?`
    : undefined;
  return zahl({
    appId: APP, formelId: 'hf-sehne', modus: 'umstellen', stufe, text,
    gegeben: stufe >= 2
      ? [geg('l_s', 'Sehnenlänge', ls, 'm', 0), geg('h_f', 'Pfeilhöhe', hfMm, 'mm', 0)]
      : [geg('l_s', 'Sehnenlänge', ls, 'm', 0), geg('h_f', 'Pfeilhöhe', hf, 'm', 3)],
    frage: 'Berechne den Radius r in m.',
    gesucht: { sym: 'r', name: 'Radius', einheit: 'm' },
    loesung: roundTo(r, 0), nk: 0,
    tipp: 'Gleiche Formel, nur r ist gesucht: r und hf tauschen die Plätze.',
    formelLatex: 'h_f = \\frac{l_s^2}{8 \\cdot r} \\;\\Rightarrow\\; r = \\frac{l_s^2}{8 \\cdot h_f}',
    schritte: [
      s('Formel nach r umstellen (mal r, geteilt durch hf):', 'r = \\frac{l_s^2}{8 \\cdot h_f}'),
      ...(stufe >= 2 ? [s('hf in m umrechnen:', `h_f = ${zl(hfMm, 0)}\\,\\text{mm} = ${zl(hf, 3)}\\,\\text{m}`)] : []),
      s('Einsetzen:', `r = \\frac{${zl(ls, 0)}^2}{8 \\cdot ${zl(hf, 3)}} = \\frac{${zl(ls * ls, 0)}}{${zl(8 * hf, 3)}} = ${zl(r, 0)}\\,\\text{m}`),
    ],
  });
}

function umstellenRAB(stufe: Stufe): Aufgabe {
  const ls = 20;
  const a = randStep(2, 8, 1);
  const b = ls - a;
  const hfMm = roundTo(pfeilhoeheAB(a, b, radius()) * 1000, 0);
  const hf = hfMm / 1000;
  const r = radiusAusPfeilhoeheAB(a, b, hf);
  return zahl({
    appId: APP, formelId: 'hf-ab', modus: 'umstellen', stufe,
    text: `An einer 20-m-Sehne misst du ${a} m vom Sehnenanfang eine Pfeilhöhe von ${fmt(hfMm, 0)} mm. Wie groß ist der Radius?`,
    gegeben: [geg('a', 'Abstand Sehnenanfang → Messpunkt', a, 'm', 0), geg('l_s', 'Sehnenlänge', ls, 'm', 0), geg('h_f', 'Pfeilhöhe', hfMm, 'mm', 0)],
    frage: 'Berechne den Radius r in m.',
    gesucht: { sym: 'r', name: 'Radius', einheit: 'm' },
    loesung: roundTo(r, 0), nk: 0,
    tipp: TIPP_AB + ' Dann nach r umstellen.',
    formelLatex: 'r = \\frac{a \\cdot b}{2 \\cdot h_f}',
    schritte: [
      s('Umgestellte Formel:', 'r = \\frac{a \\cdot b}{2 \\cdot h_f}'),
      s('b und hf in m:', `b = ${zl(ls, 0)} - ${zl(a, 0)} = ${zl(b, 0)}\\,\\text{m}, \\quad h_f = ${zl(hf, 3)}\\,\\text{m}`),
      s('Einsetzen:', `r = \\frac{${zl(a, 0)} \\cdot ${zl(b, 0)}}{2 \\cdot ${zl(hf, 3)}} = \\frac{${zl(a * b, 0)}}{${zl(2 * hf, 3)}} = ${zl(r, 0)}\\,\\text{m}`),
    ],
  });
}

function umstellenLs(stufe: Stufe): Aufgabe {
  const r = radius();
  const hfMm = Math.max(roundTo(pfeilhoehe(randStep(10, 30, 1), r) * 1000, 0), 1);
  const hf = hfMm / 1000;
  const ls = sehneAusPfeilhoehe(r, hf);
  return zahl({
    appId: APP, formelId: 'hf-sehne', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Ein Bogen mit r = ${fmt(r, 0)} m soll in der Sehnenmitte eine Pfeilhöhe von genau ${hfMm} mm zeigen. Wie lang muss die Sehne sein?` : undefined,
    gegeben: [geg('r', 'Radius', r, 'm', 0), geg('h_f', 'Pfeilhöhe', hfMm, 'mm', 0)],
    frage: 'Berechne die Sehnenlänge ls in m.',
    gesucht: { sym: 'l_s', name: 'Sehnenlänge', einheit: 'm' },
    loesung: roundTo(ls, 2), nk: 2,
    tipp: 'Nach ls² umstellen und am Ende die Wurzel ziehen.',
    formelLatex: 'l_s = \\sqrt{8 \\cdot r \\cdot h_f}',
    schritte: [
      s('Umstellen: mal 8r, dann Wurzel:', 'l_s = \\sqrt{8 \\cdot r \\cdot h_f}'),
      s('hf in m:', `h_f = ${zl(hfMm, 0)}\\,\\text{mm} = ${zl(hf, 3)}\\,\\text{m}`),
      s('Einsetzen:', `l_s = \\sqrt{8 \\cdot ${zl(r, 0)} \\cdot ${zl(hf, 3)}} = \\sqrt{${zl(8 * r * hf, 2)}} = ${zl(ls, 2)}\\,\\text{m}`),
    ],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenRkm(stufe: Stufe): Aufgabe {
  const ls = randChoice([10, 20]);
  const rKm = randStep(0.3, 2.5, 0.05);
  const r = rKm * 1000;
  const hf = pfeilhoehe(ls, r);
  return zahl({
    appId: APP, formelId: 'hf-sehne', modus: 'einheiten', stufe,
    text: `Im Lageplan steht der Bogenradius in Kilometern: r = ${fmt(rKm, 2)} km. Du prüfst mit einer ${ls}-m-Sehne.`,
    gegeben: [geg('l_s', 'Sehnenlänge', ls, 'm', 0), geg('r', 'Radius', rKm, 'km', 2)],
    frage: 'Wie groß ist die Pfeilhöhe in der Sehnenmitte in mm?',
    gesucht: { sym: 'h_f', name: 'Pfeilhöhe', einheit: 'mm' },
    loesung: roundTo(hf * 1000, 1), nk: 1,
    tipp: 'Erst alles in Meter: 1 km = 1000 m. Ergebnis am Ende in mm.',
    schritte: [
      s('Radius in m umrechnen:', `r = ${zl(rKm, 2)}\\,\\text{km} = ${zl(r, 0)}\\,\\text{m}`),
      s('Einsetzen:', `h_f = \\frac{${zl(ls, 0)}^2}{8 \\cdot ${zl(r, 0)}} = ${zl(hf, 4)}\\,\\text{m}`),
      s('In mm:', `h_f = ${zl(hf, 4)} \\cdot 1000 = ${zl(hf * 1000, 1)}\\,\\text{mm}`),
    ],
  });
}

function einheitenHfCm(stufe: Stufe): Aufgabe {
  const ls = 20;
  const hfCm = randStep(2, 18, 0.1);
  const hf = hfCm / 100;
  const r = radiusAusPfeilhoehe(ls, hf);
  return zahl({
    appId: APP, formelId: 'hf-sehne', modus: 'einheiten', stufe,
    text: `Dein Kollege hat die Pfeilhöhe mit dem Zollstock in Zentimetern notiert: ${fmt(hfCm, 1)} cm an der 20-m-Sehne.`,
    gegeben: [geg('l_s', 'Sehnenlänge', ls, 'm', 0), geg('h_f', 'Pfeilhöhe', hfCm, 'cm', 1)],
    frage: 'Welcher Radius ergibt sich in m?',
    gesucht: { sym: 'r', name: 'Radius', einheit: 'm' },
    loesung: roundTo(r, 0), nk: 0,
    tipp: 'cm → m: durch 100 teilen. Dann r = ls² / (8·hf).',
    formelLatex: 'r = \\frac{l_s^2}{8 \\cdot h_f}',
    schritte: [
      s('hf in m:', `h_f = ${zl(hfCm, 1)}\\,\\text{cm} = ${zl(hf, 3)}\\,\\text{m}`),
      s('Einsetzen:', `r = \\frac{${zl(ls, 0)}^2}{8 \\cdot ${zl(hf, 3)}} = ${zl(r, 0)}\\,\\text{m}`),
    ],
  });
}

function einheitenRinKm(stufe: Stufe): Aufgabe {
  const ls = randChoice([10, 20]);
  const hfMm = randStep(10, 120, 1);
  const hf = hfMm / 1000;
  const r = radiusAusPfeilhoehe(ls, hf);
  return zahl({
    appId: APP, formelId: 'hf-sehne', modus: 'einheiten', stufe,
    text: `Für den Bericht soll der Radius in Kilometern angegeben werden. Gemessen: ${hfMm} mm Pfeilhöhe an der ${ls}-m-Sehne.`,
    gegeben: [geg('l_s', 'Sehnenlänge', ls, 'm', 0), geg('h_f', 'Pfeilhöhe', hfMm, 'mm', 0)],
    frage: 'Gib den Radius in km an.',
    gesucht: { sym: 'r', name: 'Radius', einheit: 'km' },
    loesung: roundTo(r / 1000, 3), nk: 3,
    tipp: 'hf in m einsetzen, r kommt in m heraus – dann durch 1000 für km.',
    formelLatex: 'r = \\frac{l_s^2}{8 \\cdot h_f}',
    schritte: [
      s('hf in m:', `h_f = ${zl(hfMm, 0)}\\,\\text{mm} = ${zl(hf, 3)}\\,\\text{m}`),
      s('Radius in m:', `r = \\frac{${zl(ls, 0)}^2}{8 \\cdot ${zl(hf, 3)}} = ${zl(r, 1)}\\,\\text{m}`),
      s('In km:', `r = ${zl(r, 1)} / 1000 = ${zl(r / 1000, 3)}\\,\\text{km}`),
    ],
  });
}

// ---------- Rechner ----------

function rechnerHf(w: Record<string, number>): RechnerAusgabe {
  const { ls, r } = w as { ls: number; r: number };
  const warnungen: string[] = [];
  if (!(ls > 0) || !(r > 0)) return { ergebnisse: [], warnungen: ['Sehnenlänge und Radius müssen größer als 0 sein.'], schritte: [] };
  if (ls >= 2 * r) return { ergebnisse: [], warnungen: ['Die Sehne ist länger als der Kreisdurchmesser – das geht nicht.'], schritte: [] };
  const hf = pfeilhoehe(ls, r);
  const genau = r - Math.sqrt(r * r - (ls / 2) * (ls / 2));
  const fehler = Math.abs(hf - genau) / genau;
  if (fehler > 0.01) warnungen.push(`Sehne sehr lang im Verhältnis zum Radius: Die Näherung weicht um ${fmt(fehler * 100, 1)} % vom genauen Wert (${fmt(genau * 1000, 1)} mm) ab.`);
  if (r < 150) warnungen.push('Radius unter 150 m ist für Eisenbahngleise ungewöhnlich klein.');
  return {
    ergebnisse: [
      { sym: 'h_f', name: 'Pfeilhöhe', wert: hf * 1000, einheit: 'mm', nk: 1, hervorheben: true },
      { sym: 'h_f', name: 'Pfeilhöhe', wert: hf, einheit: 'm', nk: 4 },
    ],
    warnungen,
    schritte: [s('', `h_f = \\frac{${zl(ls, 2)}^2}{8 \\cdot ${zl(r, 1)}} = ${zl(hf, 4)}\\,\\text{m}`)],
  };
}

function rechnerAB(w: Record<string, number>): RechnerAusgabe {
  const { a, b, r } = w as { a: number; b: number; r: number };
  if (!(a > 0) || !(b > 0) || !(r > 0)) return { ergebnisse: [], warnungen: ['a, b und r müssen größer als 0 sein.'], schritte: [] };
  const hf = pfeilhoeheAB(a, b, r);
  return {
    ergebnisse: [
      { sym: 'h_f', name: 'Pfeilhöhe am Messpunkt', wert: hf * 1000, einheit: 'mm', nk: 1, hervorheben: true },
      { sym: 'l_s', name: 'Sehnenlänge a + b', wert: a + b, einheit: 'm', nk: 2 },
    ],
    warnungen: [],
    schritte: [s('', `h_f = \\frac{${zl(a, 2)} \\cdot ${zl(b, 2)}}{2 \\cdot ${zl(r, 1)}} = ${zl(hf, 4)}\\,\\text{m}`)],
  };
}

function rechnerR(w: Record<string, number>): RechnerAusgabe {
  const { ls, hf } = w as { ls: number; hf: number };
  if (!(ls > 0) || !(hf > 0)) return { ergebnisse: [], warnungen: ['Sehnenlänge und Pfeilhöhe müssen größer als 0 sein.'], schritte: [] };
  const r = radiusAusPfeilhoehe(ls, hf);
  const warnungen = hf > ls / 10 ? ['Pfeilhöhe ist im Verhältnis zur Sehne sehr groß – stimmen die Einheiten (mm/m)?'] : [];
  return {
    ergebnisse: [{ sym: 'r', name: 'Radius', wert: r, einheit: 'm', nk: 1, hervorheben: true }],
    warnungen,
    schritte: [s('', `r = \\frac{${zl(ls, 2)}^2}{8 \\cdot ${zl(hf, 4)}} = ${zl(r, 1)}\\,\\text{m}`)],
  };
}

export const PFEILHOEHE_APP: MiniAppDef = {
  id: APP,
  skizze: 'pfeilhoehe',
  formelIds: ['hf-sehne', 'hf-halbsehne', 'hf-ab'],
  merkhilfen: [
    'Wandersehne: Man misst nacheinander mit gleicher Sehnenlänge (z. B. 20 m) und vergleicht die Pfeilhöhen – gleiche Pfeilhöhe = gleicher Radius.',
    'Großer Radius → kleine Pfeilhöhe. Doppelte Sehnenlänge → vierfache Pfeilhöhe (wegen ls²).',
    'Ergebnis in m – für die Messung meist in mm (× 1000).',
  ],
  verweise: [{ label: '20 m-Pfeilhöhen im Trassenplan rechnen', link: '/zusatz/trassenplan' }],
  rechner: [
    {
      id: 'hf', label: 'Pfeilhöhe (Mitte)',
      felder: [
        { key: 'ls', sym: 'l_s', name: 'Sehnenlänge', einheit: 'm', einheiten: ['m', 'cm'], standard: 20 },
        { key: 'r', sym: 'r', name: 'Radius', einheit: 'm', einheiten: ['m', 'km'], standard: 500 },
      ],
      berechne: rechnerHf,
    },
    {
      id: 'hf-ab', label: 'Pfeilhöhe (a, b)',
      felder: [
        { key: 'a', sym: 'a', name: 'Abschnitt a', einheit: 'm', einheiten: ['m', 'cm'], standard: 6 },
        { key: 'b', sym: 'b', name: 'Abschnitt b', einheit: 'm', einheiten: ['m', 'cm'], standard: 14 },
        { key: 'r', sym: 'r', name: 'Radius', einheit: 'm', einheiten: ['m', 'km'], standard: 500 },
      ],
      berechne: rechnerAB,
    },
    {
      id: 'r', label: 'Radius aus hf',
      felder: [
        { key: 'ls', sym: 'l_s', name: 'Sehnenlänge', einheit: 'm', einheiten: ['m', 'cm'], standard: 20 },
        { key: 'hf', sym: 'h_f', name: 'Pfeilhöhe', einheit: 'm', einheiten: ['mm', 'cm', 'm'], standard: 100 },
      ],
      berechne: rechnerR,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') {
      if (stufe === 3) return chance(0.5) ? umstellenRAB(stufe) : umstellenLs(stufe);
      return chance(0.7) ? umstellenR(stufe) : umstellenLs(stufe);
    }
    if (modus === 'einheiten') {
      return randChoice([einheitenRkm, einheitenHfCm, einheitenRinKm])(stufe);
    }
    if (stufe === 1) return uebenHf(1);
    if (stufe === 2) return chance(0.2) ? formelWahl(2) : uebenHf(2);
    return chance(0.2) ? formelWahl(3) : uebenAB(3);
  },
};

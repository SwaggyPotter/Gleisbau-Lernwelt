import { auswahl, geg, s, zahl } from '../kern/bauer';
import {
  abszisseNaeherung, naeherungZulaessig, naeherungsgrenze, ordinateKreisGenau, ordinateKreisNaeherung, radiusAusOrdinateNaeherung,
} from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

const APP = 'kreisbogen';
const TIPP = 'Prüfe zuerst: Ist x ≤ r/10? Dann reicht die Näherung y = x²/(2r), sonst genau rechnen.';

function radius(): number {
  return randStep(300, 2500, 50);
}

/** x im Näherungsbereich (≤ r/10), ganze Meter. */
function xNah(r: number): number {
  return randStep(5, Math.floor(naeherungsgrenze(r)), 1);
}

function schritteNaeherung(r: number, x: number, y: number) {
  return [
    s('Näherung erlaubt?', `\\frac{r}{10} = \\frac{${zl(r, 0)}}{10} = ${zl(r / 10, 1)}\\,\\text{m} \\;\\ge\\; x = ${zl(x, 1)}\\,\\text{m} \\;\\Rightarrow\\; \\text{ja}`),
    s('Näherungsformel:', 'y = \\frac{x^2}{2 \\cdot r}'),
    s('Einsetzen:', `y = \\frac{${zl(x, 1)}^2}{2 \\cdot ${zl(r, 0)}} = \\frac{${zl(x * x, 2)}}{${zl(2 * r, 0)}} = ${zl(y, 4)}\\,\\text{m}`),
  ];
}

// ---------- Üben ----------

function uebenNaeherung(stufe: Stufe): Aufgabe {
  const r = radius();
  const x = xNah(r);
  const y = ordinateKreisNaeherung(r, x);
  return zahl({
    appId: APP, formelId: 'y-kreis-naeherung', modus: 'ueben', stufe,
    text: stufe >= 2
      ? randChoice([
          `Ein Bogen mit r = ${fmt(r, 0)} m wird von der Tangente (x-Achse) aus abgesteckt. Am Punkt x = ${x} m sollst du den Abstand zur Tangente anreißen.`,
          `Auf der Baustelle fehlt ein Absteckpunkt: ${x} m hinter dem Bogenanfang, Radius ${fmt(r, 0)} m. Wie weit liegt das Gleis dort von der Tangente entfernt?`,
        ])
      : undefined,
    gegeben: [geg('r', 'Radius', r, 'm', 0), geg('x', 'Abszisse', x, 'm', 0)],
    frage: 'Berechne die Ordinate y in m (3 Nachkommastellen).',
    gesucht: { sym: 'y', name: 'Ordinate', einheit: 'm' },
    loesung: roundTo(y, 3), nk: 3,
    tipp: TIPP,
    schritte: schritteNaeherung(r, x, y),
  });
}

function uebenGenau(stufe: Stufe): Aufgabe {
  const r = randStep(150, 600, 10);
  const x = randStep(Math.ceil(r / 5), Math.floor(r / 3), 1);
  const y = ordinateKreisGenau(r, x);
  const yN = ordinateKreisNaeherung(r, x);
  return zahl({
    appId: APP, formelId: 'y-kreis-genau', modus: 'ueben', stufe,
    text: `Ein enger Bogen (r = ${fmt(r, 0)} m) in einem Werksgleis soll bis x = ${x} m von der Tangente aus abgesteckt werden.`,
    gegeben: [geg('r', 'Radius', r, 'm', 0), geg('x', 'Abszisse', x, 'm', 0)],
    frage: 'Berechne y in m (3 Nachkommastellen). Achtung: Welche Formel ist hier erlaubt?',
    gesucht: { sym: 'y', name: 'Ordinate', einheit: 'm' },
    loesung: roundTo(y, 3), nk: 3, rel: 0.002,
    tipp: TIPP,
    schritte: [
      s('Näherung erlaubt?', `\\frac{r}{10} = ${zl(r / 10, 1)}\\,\\text{m} < x = ${zl(x, 0)}\\,\\text{m} \\;\\Rightarrow\\; \\text{nein, genau rechnen}`),
      s('Genaue Formel:', 'y = r - \\sqrt{r^2 - x^2}'),
      s('Einsetzen:', `y = ${zl(r, 0)} - \\sqrt{${zl(r, 0)}^2 - ${zl(x, 0)}^2} = ${zl(r, 0)} - \\sqrt{${zl(r * r - x * x, 0)}} = ${zl(r, 0)} - ${zl(r - y, 4)} = ${zl(y, 3)}\\,\\text{m}`),
      s(`Zum Vergleich: Die Näherung ergäbe ${fmt(yN, 3)} m – ${fmt(Math.abs(y - yN) * 1000, 0)} mm daneben.`),
    ],
  });
}

function uebenFehler(stufe: Stufe): Aufgabe {
  const r = randStep(200, 800, 50);
  const x = randStep(Math.ceil(r / 8), Math.floor(r / 4), 1);
  const y = ordinateKreisGenau(r, x);
  const yN = ordinateKreisNaeherung(r, x);
  const fehlerMm = (y - yN) * 1000;
  return zahl({
    appId: APP, formelId: 'y-kreis-genau', modus: 'ueben', stufe,
    text: `Ein Kollege rechnet bei r = ${fmt(r, 0)} m und x = ${x} m einfach mit der Näherungsformel. Wie groß ist sein Fehler?`,
    gegeben: [geg('r', 'Radius', r, 'm', 0), geg('x', 'Abszisse', x, 'm', 0)],
    frage: 'Berechne die Differenz y(genau) − y(Näherung) in mm.',
    gesucht: { sym: '\\Delta y', name: 'Fehler der Näherung', einheit: 'mm' },
    loesung: roundTo(fehlerMm, 0), nk: 0, rel: 0.03,
    tipp: 'Beide Formeln ausrechnen (mit mehreren Nachkommastellen!), dann abziehen und in mm umrechnen.',
    formelLatex: 'y = r - \\sqrt{r^2 - x^2} \\qquad y \\approx \\frac{x^2}{2r}',
    schritte: [
      s('Genau:', `y = ${zl(r, 0)} - \\sqrt{${zl(r, 0)}^2 - ${zl(x, 0)}^2} = ${zl(y, 4)}\\,\\text{m}`),
      s('Näherung:', `y \\approx \\frac{${zl(x, 0)}^2}{2 \\cdot ${zl(r, 0)}} = ${zl(yN, 4)}\\,\\text{m}`),
      s('Differenz in mm:', `\\Delta y = (${zl(y, 4)} - ${zl(yN, 4)}) \\cdot 1000 = ${zl(fehlerMm, 0)}\\,\\text{mm}`),
      s(`x/r = ${fmt(x / r, 3)} – deutlich über 1/10, deshalb ist der Fehler so groß.`),
    ],
  });
}

function zulaessigFrage(stufe: Stufe): Aufgabe {
  const r = radius();
  const ja = chance(0.5);
  const grenze = naeherungsgrenze(r);
  const x = ja ? randStep(Math.max(5, Math.floor(grenze * 0.5)), Math.floor(grenze), 1) : randStep(Math.ceil(grenze) + 1, Math.ceil(grenze * 1.6), 1);
  const zul = naeherungZulaessig(r, x);
  return auswahl({
    appId: APP, formelId: 'y-kreis-naeherung', modus: 'ueben', stufe,
    text: stufe >= 2 ? `Du steckst einen Bogen mit r = ${fmt(r, 0)} m von der Tangente ab und bist bei x = ${x} m.` : undefined,
    gegeben: [geg('r', 'Radius', r, 'm', 0), geg('x', 'Abszisse', x, 'm', 0)],
    frage: 'Darfst du hier noch mit der Näherung y = x²/(2r) rechnen?',
    optionen: zul ? ['Ja, x ≤ r/10', 'Nein, x > r/10'] : ['Nein, x > r/10', 'Ja, x ≤ r/10'],
    mischen: false,
    tipp: 'Grenze: x = r/10.',
    schritte: [s('Grenze ausrechnen:', `\\frac{r}{10} = \\frac{${zl(r, 0)}}{10} = ${zl(grenze, 1)}\\,\\text{m}`),
      s(zul ? `x = ${x} m liegt darunter → Näherung erlaubt.` : `x = ${x} m liegt darüber → genau rechnen: y = r − √(r² − x²).`)],
  });
}

// Bei „mischen: false“ ist die richtige Antwort Index 0 – Reihenfolge Ja/Nein soll aber fest sein.
function zulaessig(stufe: Stufe): Aufgabe {
  const a = zulaessigFrage(stufe);
  if (a.art !== 'auswahl') return a;
  const richtigText = a.optionen[0];
  const optionen = ['Ja, x ≤ r/10', 'Nein, x > r/10'];
  return { ...a, optionen, richtig: optionen.indexOf(richtigText) };
}

// ---------- Umstellen ----------

function umstellenX(stufe: Stufe): Aufgabe {
  const r = radius();
  const y = roundTo(ordinateKreisNaeherung(r, xNah(r)), 3);
  const x = abszisseNaeherung(r, y);
  return zahl({
    appId: APP, formelId: 'y-kreis-naeherung', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Bei r = ${fmt(r, 0)} m soll das Gleis an einer Stelle genau ${fmt(y, 3)} m von der Tangente entfernt sein. Bei welchem x ist das?` : undefined,
    gegeben: [geg('r', 'Radius', r, 'm', 0), geg('y', 'Ordinate', y, 'm', 3)],
    frage: 'Berechne x in m (Näherung).',
    gesucht: { sym: 'x', name: 'Abszisse', einheit: 'm' },
    loesung: roundTo(x, 2), nk: 2,
    tipp: 'Nach x² umstellen, dann Wurzel ziehen.',
    formelLatex: 'x = \\sqrt{2 \\cdot r \\cdot y}',
    schritte: [
      s('Umstellen:', 'y = \\frac{x^2}{2r} \\;\\Rightarrow\\; x = \\sqrt{2 \\cdot r \\cdot y}'),
      s('Einsetzen:', `x = \\sqrt{2 \\cdot ${zl(r, 0)} \\cdot ${zl(y, 3)}} = \\sqrt{${zl(2 * r * y, 3)}} = ${zl(x, 2)}\\,\\text{m}`),
      s(`Kontrolle: x ≤ r/10 = ${fmt(r / 10, 1)} m → Näherung war zulässig.`),
    ],
  });
}

function umstellenR(stufe: Stufe): Aufgabe {
  const rW = radius();
  const x = xNah(rW);
  const y = roundTo(ordinateKreisNaeherung(rW, x), 3);
  const r = radiusAusOrdinateNaeherung(x, y);
  return zahl({
    appId: APP, formelId: 'y-kreis-naeherung', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Von der Tangente aus misst du bei x = ${x} m einen Abstand y = ${fmt(y, 3)} m zum Gleis. Welcher Radius ist das ungefähr?` : undefined,
    gegeben: [geg('x', 'Abszisse', x, 'm', 0), geg('y', 'Ordinate', y, 'm', 3)],
    frage: 'Berechne den Radius r in m (Näherung).',
    gesucht: { sym: 'r', name: 'Radius', einheit: 'm' },
    loesung: roundTo(r, 0), nk: 0,
    tipp: 'r und y tauschen die Plätze.',
    formelLatex: 'r = \\frac{x^2}{2 \\cdot y}',
    schritte: [
      s('Umstellen:', 'r = \\frac{x^2}{2 \\cdot y}'),
      s('Einsetzen:', `r = \\frac{${zl(x, 0)}^2}{2 \\cdot ${zl(y, 3)}} = \\frac{${zl(x * x, 0)}}{${zl(2 * y, 3)}} = ${zl(r, 0)}\\,\\text{m}`),
    ],
  });
}

function umstellenGrenze(stufe: Stufe): Aufgabe {
  const r = radius();
  return zahl({
    appId: APP, formelId: 'y-kreis-naeherung', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Bei einem Bogen mit r = ${fmt(r, 0)} m möchtest du so weit wie möglich mit der einfachen Näherungsformel abstecken.` : undefined,
    gegeben: [geg('r', 'Radius', r, 'm', 0)],
    frage: 'Bis zu welchem x (in m) darfst du die Näherung verwenden?',
    gesucht: { sym: 'x_{max}', name: 'Grenze der Näherung', einheit: 'm' },
    loesung: roundTo(r / 10, 1), nk: 1,
    tipp: 'Die Gültigkeitsgrenze steht direkt bei der Näherungsformel.',
    formelLatex: 'x \\le \\frac{r}{10}',
    schritte: [s('Grenze:', `x_{max} = \\frac{r}{10} = \\frac{${zl(r, 0)}}{10} = ${zl(r / 10, 1)}\\,\\text{m}`)],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenKmMm(stufe: Stufe): Aufgabe {
  const rKm = randStep(0.4, 2.5, 0.1);
  const r = rKm * 1000;
  const x = xNah(r);
  const y = ordinateKreisNaeherung(r, x);
  return zahl({
    appId: APP, formelId: 'y-kreis-naeherung', modus: 'einheiten', stufe,
    text: `Radius laut Plan: ${fmt(rKm, 1)} km. Das Absteckmaß bei x = ${x} m soll in mm auf den Pflock geschrieben werden.`,
    gegeben: [geg('r', 'Radius', rKm, 'km', 1), geg('x', 'Abszisse', x, 'm', 0)],
    frage: 'Berechne y in mm.',
    gesucht: { sym: 'y', name: 'Ordinate', einheit: 'mm' },
    loesung: roundTo(y * 1000, 0), nk: 0,
    tipp: 'r in m umrechnen (× 1000), y kommt in m – dann × 1000 für mm.',
    schritte: [
      s('Radius in m:', `r = ${zl(rKm, 1)}\\,\\text{km} = ${zl(r, 0)}\\,\\text{m}`),
      ...schritteNaeherung(r, x, y),
      s('In mm:', `y = ${zl(y, 4)}\\,\\text{m} = ${zl(y * 1000, 0)}\\,\\text{mm}`),
    ],
  });
}

function einheitenYcm(stufe: Stufe): Aufgabe {
  const r = radius();
  const yCm = roundTo(ordinateKreisNaeherung(r, xNah(r)) * 100, 1);
  const y = yCm / 100;
  const x = abszisseNaeherung(r, y);
  return zahl({
    appId: APP, formelId: 'y-kreis-naeherung', modus: 'einheiten', stufe,
    text: `Das Absteckmaß ist in cm gegeben: y = ${fmt(yCm, 1)} cm bei einem Radius von ${fmt(r, 0)} m.`,
    gegeben: [geg('r', 'Radius', r, 'm', 0), geg('y', 'Ordinate', yCm, 'cm', 1)],
    frage: 'An welchem x (in m) liegt dieser Punkt?',
    gesucht: { sym: 'x', name: 'Abszisse', einheit: 'm' },
    loesung: roundTo(x, 2), nk: 2,
    tipp: 'y erst in m umrechnen (÷ 100), dann x = √(2·r·y).',
    formelLatex: 'x = \\sqrt{2 \\cdot r \\cdot y}',
    schritte: [
      s('y in m:', `y = ${zl(yCm, 1)}\\,\\text{cm} = ${zl(y, 3)}\\,\\text{m}`),
      s('Einsetzen:', `x = \\sqrt{2 \\cdot ${zl(r, 0)} \\cdot ${zl(y, 3)}} = ${zl(x, 2)}\\,\\text{m}`),
    ],
  });
}

function einheitenYinCm(stufe: Stufe): Aufgabe {
  const r = radius();
  const x = xNah(r);
  const y = ordinateKreisNaeherung(r, x);
  return zahl({
    appId: APP, formelId: 'y-kreis-naeherung', modus: 'einheiten', stufe,
    text: `Der Zollstock zeigt cm. Bogen r = ${fmt(r, 0)} m, Absteckpunkt bei x = ${x} m.`,
    gegeben: [geg('r', 'Radius', r, 'm', 0), geg('x', 'Abszisse', x, 'm', 0)],
    frage: 'Welches Maß y in cm musst du anlegen?',
    gesucht: { sym: 'y', name: 'Ordinate', einheit: 'cm' },
    loesung: roundTo(y * 100, 1), nk: 1,
    tipp: 'Ergebnis kommt in m – für cm mal 100.',
    schritte: [...schritteNaeherung(r, x, y), s('In cm:', `y = ${zl(y, 4)}\\,\\text{m} \\cdot 100 = ${zl(y * 100, 1)}\\,\\text{cm}`)],
  });
}

// ---------- Rechner ----------

function rechnerY(w: Record<string, number>): RechnerAusgabe {
  const { r, x } = w as { r: number; x: number };
  if (!(r > 0) || !(x >= 0)) return { ergebnisse: [], warnungen: ['r muss größer als 0 sein, x darf nicht negativ sein.'], schritte: [] };
  if (x >= r) return { ergebnisse: [], warnungen: ['x muss kleiner als r sein – sonst gibt es keinen Punkt auf dem Bogen.'], schritte: [] };
  const yG = ordinateKreisGenau(r, x);
  const yN = ordinateKreisNaeherung(r, x);
  const warnungen = naeherungZulaessig(r, x) ? [] : [`x = ${fmt(x, 1)} m ist größer als r/10 = ${fmt(r / 10, 1)} m: Näherung NICHT zulässig, genauen Wert verwenden.`];
  return {
    ergebnisse: [
      { sym: 'y', name: 'Ordinate genau', wert: yG * 1000, einheit: 'mm', nk: 1, hervorheben: true },
      { sym: 'y', name: 'Ordinate Näherung', wert: yN * 1000, einheit: 'mm', nk: 1 },
      { sym: '\\Delta y', name: 'Fehler der Näherung', wert: (yG - yN) * 1000, einheit: 'mm', nk: 1 },
      { sym: 'r/10', name: 'Grenze der Näherung', wert: r / 10, einheit: 'm', nk: 1 },
    ],
    warnungen,
    schritte: [
      s('Genau:', `y = ${zl(r, 1)} - \\sqrt{${zl(r, 1)}^2 - ${zl(x, 2)}^2} = ${zl(yG, 4)}\\,\\text{m}`),
      s('Näherung:', `y \\approx \\frac{${zl(x, 2)}^2}{2 \\cdot ${zl(r, 1)}} = ${zl(yN, 4)}\\,\\text{m}`),
    ],
  };
}

function rechnerTabelle(w: Record<string, number>): RechnerAusgabe {
  const { r, dx } = w as { r: number; dx: number };
  if (!(r > 0) || !(dx > 0)) return { ergebnisse: [], warnungen: ['r und Schrittweite müssen größer als 0 sein.'], schritte: [] };
  const zeilen: string[][] = [];
  const markiert: number[] = [];
  const xMax = Math.min(r * 0.4, dx * 40);
  for (let x = dx, i = 0; x <= xMax + 1e-9; x += dx, i++) {
    const yG = ordinateKreisGenau(r, x);
    const yN = ordinateKreisNaeherung(r, x);
    zeilen.push([fmt(x, 1), fmt(yG * 1000, 1), fmt(yN * 1000, 1), fmt((yG - yN) * 1000, 1)]);
    if (!naeherungZulaessig(r, x)) markiert.push(i);
  }
  return {
    ergebnisse: [{ sym: 'r/10', name: 'Grenze der Näherung', wert: r / 10, einheit: 'm', nk: 1, hervorheben: true }],
    warnungen: markiert.length ? ['Markierte Zeilen: x > r/10 – dort ist die Näherung nicht mehr zulässig.'] : [],
    schritte: [],
    tabelle: { titel: 'Fehlervergleich genau ↔ Näherung', kopf: ['x [m]', 'y genau [mm]', 'y Näherung [mm]', 'Fehler [mm]'], zeilen, markiert },
  };
}

export const KREISBOGEN_APP: MiniAppDef = {
  id: APP,
  skizze: 'kreisbogen',
  formelIds: ['y-kreis-genau', 'y-kreis-naeherung'],
  merkhilfen: [
    'Die x-Achse ist die Tangente am Bogenanfang, y ist der senkrechte Abstand von der Tangente zum Gleis.',
    'Faustregel: bis x = r/10 Näherung, danach genau. Bei r = 500 m also bis 50 m.',
    'Die Näherung liefert immer etwas zu kleine Werte – je größer x, desto größer der Fehler.',
  ],
  rechner: [
    {
      id: 'y', label: 'Ordinate y',
      felder: [
        { key: 'r', sym: 'r', name: 'Radius', einheit: 'm', einheiten: ['m', 'km'], standard: 500 },
        { key: 'x', sym: 'x', name: 'Abszisse', einheit: 'm', einheiten: ['m', 'cm'], standard: 40 },
      ],
      berechne: rechnerY,
    },
    {
      id: 'tabelle', label: 'Fehlertabelle',
      felder: [
        { key: 'r', sym: 'r', name: 'Radius', einheit: 'm', einheiten: ['m', 'km'], standard: 300 },
        { key: 'dx', sym: '\\Delta x', name: 'Schrittweite', einheit: 'm', einheiten: ['m'], standard: 10 },
      ],
      berechne: rechnerTabelle,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') {
      return randChoice([umstellenX, umstellenR, umstellenGrenze])(stufe);
    }
    if (modus === 'einheiten') {
      return randChoice([einheitenKmMm, einheitenYcm, einheitenYinCm])(stufe);
    }
    if (stufe === 1) return chance(0.25) ? zulaessig(1) : uebenNaeherung(1);
    if (stufe === 2) return chance(0.3) ? zulaessig(2) : uebenNaeherung(2);
    return chance(0.3) ? uebenFehler(3) : chance(0.3) ? zulaessig(3) : uebenGenau(3);
  },
};

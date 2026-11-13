import { auswahl, geg, s, zahl } from '../kern/bauer';
import { mindestZwischengerade, mindestradiusVerziehung, radiusAusVerziehung, verziehungslaenge, versatzAusVerziehung } from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

/*
 * Kap. 5 – Gleisverziehungen. Nur die bestätigten Formeln (5.1 ohne Zwischengerade, Mindestlänge lg).
 * 5.2 „mit Zwischengerade“ ist in formelsammlung.json als unklar markiert → keine Aufgaben, kein Rechner.
 */

const APP = 'gleisverziehung';
// Art der Verziehung steht in jeder Aufgabe (Tim, 2026-11-11).
const OHNE = 'Gleisverziehung ohne Zwischengerade (S-Verziehung aus zwei Gegenbögen).';
const LG = 'Gleisverziehung mit Zwischengerade – gesucht ist die Mindestlänge der Zwischengeraden.';
const TIPP = 'Zwei mal Wurzel aus (r mal Δe). Δe in m einsetzen, dann kommt lvz in m heraus.';

function radius(): number {
  return randStep(2000, 30000, 500);
}

function versatz(): number {
  return randStep(0.2, 4.5, 0.05);
}

function lvzSchritt(r: number, de: number): string {
  const l = verziehungslaenge(r, de);
  return `l_{vz} = 2 \\cdot \\sqrt{${zl(r, 0)} \\cdot ${zl(de, 2)}} = 2 \\cdot \\sqrt{${zl(r * de, 1)}} = ${zl(l, 2)}\\,\\text{m}`;
}

// ---------- Üben ----------

function uebenLvz(stufe: Stufe): Aufgabe {
  const r = radius();
  const de = versatz();
  const l = verziehungslaenge(r, de);
  return zahl({
    appId: APP, formelId: 'lvz-ohne', modus: 'ueben', stufe,
    text: stufe >= 2
      ? randChoice([
          `Für eine Baustelle wird das Gleis um ${fmt(de, 2)} m seitlich verzogen (S-Verziehung ohne Zwischengerade). Die Verziehungsbögen haben r = ${fmt(r, 0)} m.`,
          `Wegen eines neuen Bahnsteigs muss die Gleisachse um ${fmt(de, 2)} m nach außen. Geplant sind zwei Gegenbögen mit je r = ${fmt(r, 0)} m direkt hintereinander.`,
        ])
      : OHNE,
    gegeben: [geg('r', 'Radius der Verziehungsbögen', r, 'm', 0), geg('\\Delta e', 'Verziehungsmaß', de, 'm', 2)],
    frage: 'Wie lang wird die Verziehung lvz (ohne Zwischengerade) in m?',
    gesucht: { sym: 'l_{vz}', name: 'Verziehungslänge ohne Zwischengerade', einheit: 'm' },
    loesung: roundTo(l, 1), nk: 1,
    tipp: TIPP,
    schritte: [s('Formel ohne Zwischengerade:', 'l_{vz} = 2 \\cdot \\sqrt{r \\cdot \\Delta e}'), s('Einsetzen:', lvzSchritt(r, de))],
  });
}

function uebenMinR(stufe: Stufe): Aufgabe {
  const ve = randStep(60, 200, 10);
  const r = mindestradiusVerziehung(ve);
  return zahl({
    appId: APP, formelId: 'lvz-ohne', modus: 'ueben', stufe,
    text: `Gleisverziehung ohne Zwischengerade. Die Strecke ist für ve = ${ve} km/h ausgelegt. Wie groß muss der Radius der Verziehungsbögen mindestens sein?`,
    gegeben: [geg('v_e', 'Entwurfsgeschwindigkeit', ve, 'km/h', 0)],
    frage: 'Berechne den Mindestradius in m.',
    gesucht: { sym: 'r', name: 'Mindestradius der Verziehungsbögen', einheit: 'm' },
    loesung: roundTo(r, 0), nk: 0,
    tipp: 'Grenze aus der Formelsammlung: r ≥ ve² / 2 (ve als Zahl in km/h).',
    formelLatex: 'r \\ge \\frac{v_e^2}{2}',
    schritte: [s('Grenze für Verziehungsbögen:', 'r \\ge \\frac{v_e^2}{2}'), s('Einsetzen:', `r \\ge \\frac{${zl(ve, 0)}^2}{2} = \\frac{${zl(ve * ve, 0)}}{2} = ${zl(r, 0)}\\,\\text{m}`)],
  });
}

function uebenKette(stufe: Stufe): Aufgabe {
  const ve = randStep(60, 160, 10);
  const r = mindestradiusVerziehung(ve);
  const de = versatz();
  const l = verziehungslaenge(r, de);
  return zahl({
    appId: APP, formelId: 'lvz-ohne', modus: 'ueben', stufe,
    text: `Ein Gleis (ve = ${ve} km/h) wird ohne Zwischengerade um ${fmt(de, 2)} m verzogen. Die Bögen sollen den kleinsten zulässigen Radius bekommen. Wie lang wird die Verziehung?`,
    gegeben: [geg('v_e', 'Entwurfsgeschwindigkeit', ve, 'km/h', 0), geg('\\Delta e', 'Verziehungsmaß', de, 'm', 2)],
    frage: 'Berechne lvz in m.',
    gesucht: { sym: 'l_{vz}', name: 'Verziehungslänge ohne Zwischengerade', einheit: 'm' },
    loesung: roundTo(l, 1), nk: 1,
    tipp: 'Erst den Mindestradius r = ve²/2, dann lvz = 2·√(r·Δe).',
    schritte: [
      s('1. Mindestradius:', `r = \\frac{${zl(ve, 0)}^2}{2} = ${zl(r, 0)}\\,\\text{m}`),
      s('2. Verziehungslänge:', lvzSchritt(r, de)),
    ],
  });
}

function uebenLg(stufe: Stufe): Aufgabe {
  const ve = randStep(80, 300, 10);
  const { lg, faktor } = mindestZwischengerade(ve);
  return zahl({
    appId: APP, formelId: 'lg-verziehung', modus: 'ueben', stufe,
    text: stufe >= 2 ? `Zwischen den beiden Verziehungsbögen soll eine Zwischengerade liegen. Die Strecke hat ve = ${ve} km/h. Wie lang muss sie mindestens sein?` : LG,
    gegeben: [geg('v_e', 'Entwurfsgeschwindigkeit', ve, 'km/h', 0)],
    frage: 'Mindestlänge der Zwischengeraden lg in m?',
    gesucht: { sym: 'l_g', name: 'Mindestlänge Zwischengerade', einheit: 'm' },
    loesung: roundTo(lg, 0), nk: 0,
    tipp: 'Bis 200 km/h: 0,4 · ve. Darüber: 0,6 · ve.',
    schritte: [
      s(ve > 200 ? `ve = ${ve} km/h > 200 → Faktor 0,6:` : `ve = ${ve} km/h ≤ 200 → Faktor 0,4:`, `l_g \\ge ${zl(faktor, 1)} \\cdot ${zl(ve, 0)} = ${zl(lg, 0)}\\,\\text{m}`),
    ],
  });
}

function frageFaktor(stufe: Stufe): Aufgabe {
  const ve = randChoice([120, 160, 200, 230, 250, 300]);
  const richtig = ve > 200 ? '0,6 · ve' : '0,4 · ve';
  return auswahl({
    appId: APP, formelId: 'lg-verziehung', modus: 'ueben', stufe,
    text: `Strecke mit ve = ${ve} km/h, Verziehung mit Zwischengerade.`,
    gegeben: [],
    frage: 'Mit welchem Faktor rechnest du die Mindestlänge der Zwischengeraden?',
    optionen: [richtig, ve > 200 ? '0,4 · ve' : '0,6 · ve', '0,5 · ve', 've / 2'],
    tipp: 'Die Grenze liegt bei 200 km/h – genau 200 gehört noch zum kleineren Faktor.',
    schritte: [s(`ve = ${ve} km/h ${ve > 200 ? '> 200 → 0,6 · ve' : '≤ 200 → 0,4 · ve'}.`)],
  });
}

// ---------- Umstellen ----------

function umstellenR(stufe: Stufe): Aufgabe {
  const de = versatz();
  const l = randStep(60, 400, 5);
  const r = radiusAusVerziehung(l, de);
  return zahl({
    appId: APP, formelId: 'lvz-ohne', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Für die Verziehung um ${fmt(de, 2)} m stehen nur ${l} m Gleis zur Verfügung. Welchen Radius bekommen die Bögen?` : OHNE,
    gegeben: [geg('l_{vz}', 'Verziehungslänge', l, 'm', 0), geg('\\Delta e', 'Verziehungsmaß', de, 'm', 2)],
    frage: 'Berechne den Radius r in m.',
    gesucht: { sym: 'r', name: 'Radius (ohne Zwischengerade)', einheit: 'm' },
    loesung: roundTo(r, 0), nk: 0,
    tipp: 'Durch 2 teilen, quadrieren, durch Δe teilen.',
    formelLatex: 'r = \\frac{l_{vz}^2}{4 \\cdot \\Delta e}',
    schritte: [
      s('Umstellen: lvz/2 = √(r·Δe) → (lvz/2)² = r·Δe →', 'r = \\frac{l_{vz}^2}{4 \\cdot \\Delta e}'),
      s('Einsetzen:', `r = \\frac{${zl(l, 0)}^2}{4 \\cdot ${zl(de, 2)}} = \\frac{${zl(l * l, 0)}}{${zl(4 * de, 2)}} = ${zl(r, 0)}\\,\\text{m}`),
    ],
  });
}

function umstellenDe(stufe: Stufe): Aufgabe {
  const r = radius();
  const l = randStep(60, 400, 5);
  const de = versatzAusVerziehung(l, r);
  if (de < 0.1 || de > 8) return umstellenDe(stufe);
  return zahl({
    appId: APP, formelId: 'lvz-ohne', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Verziehung ohne Zwischengerade: Mit Bögen r = ${fmt(r, 0)} m und einer Verziehungslänge von ${l} m – um wie viel kann das Gleis seitlich verschoben werden?` : OHNE,
    gegeben: [geg('l_{vz}', 'Verziehungslänge', l, 'm', 0), geg('r', 'Radius', r, 'm', 0)],
    frage: 'Berechne das Verziehungsmaß Δe in m.',
    gesucht: { sym: '\\Delta e', name: 'Verziehungsmaß (ohne Zwischengerade)', einheit: 'm' },
    loesung: roundTo(de, 3), nk: 3,
    tipp: 'Wie beim Radius umstellen, nur steht jetzt r im Nenner.',
    formelLatex: '\\Delta e = \\frac{l_{vz}^2}{4 \\cdot r}',
    schritte: [
      s('Umstellen:', '\\Delta e = \\frac{l_{vz}^2}{4 \\cdot r}'),
      s('Einsetzen:', `\\Delta e = \\frac{${zl(l, 0)}^2}{4 \\cdot ${zl(r, 0)}} = ${zl(de, 3)}\\,\\text{m}`),
    ],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenCm(stufe: Stufe): Aufgabe {
  const r = radius();
  const deCm = randStep(20, 450, 5);
  const de = deCm / 100;
  const l = verziehungslaenge(r, de);
  return zahl({
    appId: APP, formelId: 'lvz-ohne', modus: 'einheiten', stufe,
    text: `Verziehung ohne Zwischengerade. Der Polier sagt: „Wir müssen ${fmt(deCm, 0)} cm rüber.“ Die Verziehungsbögen haben r = ${fmt(r, 0)} m.`,
    gegeben: [geg('r', 'Radius', r, 'm', 0), geg('\\Delta e', 'Verziehungsmaß', deCm, 'cm', 0)],
    frage: 'Verziehungslänge in m?',
    gesucht: { sym: 'l_{vz}', name: 'Verziehungslänge ohne Zwischengerade', einheit: 'm' },
    loesung: roundTo(l, 1), nk: 1,
    tipp: 'Δe muss in m eingesetzt werden: cm ÷ 100.',
    schritte: [s('Δe in m:', `\\Delta e = ${zl(deCm, 0)}\\,\\text{cm} = ${zl(de, 2)}\\,\\text{m}`), s('Einsetzen:', lvzSchritt(r, de))],
  });
}

function einheitenKm(stufe: Stufe): Aufgabe {
  const rKm = randStep(2, 30, 0.5);
  const r = rKm * 1000;
  const deMm = randStep(200, 4500, 50);
  const de = deMm / 1000;
  const l = verziehungslaenge(r, de);
  return zahl({
    appId: APP, formelId: 'lvz-ohne', modus: 'einheiten', stufe,
    text: `Verziehung ohne Zwischengerade. Im Plan steht: r = ${fmt(rKm, 1)} km, Verschiebung ${fmt(deMm, 0)} mm.`,
    gegeben: [geg('r', 'Radius', rKm, 'km', 1), geg('\\Delta e', 'Verziehungsmaß', deMm, 'mm', 0)],
    frage: 'Verziehungslänge in m?',
    gesucht: { sym: 'l_{vz}', name: 'Verziehungslänge ohne Zwischengerade', einheit: 'm' },
    loesung: roundTo(l, 1), nk: 1,
    tipp: 'Beides in m: km × 1000, mm ÷ 1000.',
    schritte: [
      s('Umrechnen:', `r = ${zl(r, 0)}\\,\\text{m}, \\quad \\Delta e = ${zl(de, 3)}\\,\\text{m}`),
      s('Einsetzen:', `l_{vz} = 2 \\cdot \\sqrt{${zl(r, 0)} \\cdot ${zl(de, 3)}} = ${zl(l, 2)}\\,\\text{m}`),
    ],
  });
}

// ---------- Rechner ----------

function rechnerLvz(w: Record<string, number>): RechnerAusgabe {
  const { r, de, ve } = w as { r: number; de: number; ve: number };
  if (!(r > 0) || !(de > 0)) return { ergebnisse: [], warnungen: ['r und Δe müssen größer als 0 sein.'], schritte: [] };
  const l = verziehungslaenge(r, de);
  const warnungen: string[] = [];
  const ergebnisse = [{ sym: 'l_{vz}', name: 'Verziehungslänge', wert: l, einheit: 'm', nk: 2, hervorheben: true }];
  const schritte = [s('', lvzSchritt(r, de))];
  if (ve > 0) {
    const rMin = mindestradiusVerziehung(ve);
    ergebnisse.push({ sym: '\\text{min } r', name: 'Mindestradius ve²/2', wert: rMin, einheit: 'm', nk: 0, hervorheben: false });
    ergebnisse.push({ sym: 'l_g', name: 'Mindest-Zwischengerade (falls geplant)', wert: mindestZwischengerade(ve).lg, einheit: 'm', nk: 0, hervorheben: false });
    if (r < rMin) warnungen.push(`Radius kleiner als ve²/2 = ${fmt(rMin, 0)} m – für ve = ${fmt(ve, 0)} km/h zu klein.`);
  }
  return { ergebnisse, warnungen, schritte };
}

function rechnerR(w: Record<string, number>): RechnerAusgabe {
  const { l, de } = w as { l: number; de: number };
  if (!(l > 0) || !(de > 0)) return { ergebnisse: [], warnungen: ['lvz und Δe müssen größer als 0 sein.'], schritte: [] };
  const r = radiusAusVerziehung(l, de);
  return {
    ergebnisse: [{ sym: 'r', name: 'Radius der Verziehungsbögen', wert: r, einheit: 'm', nk: 0, hervorheben: true }],
    warnungen: [],
    schritte: [s('', `r = \\frac{${zl(l, 1)}^2}{4 \\cdot ${zl(de, 3)}} = ${zl(r, 0)}\\,\\text{m}`)],
  };
}

export const GLEISVERZIEHUNG_APP: MiniAppDef = {
  id: APP,
  skizze: 'gleisverziehung',
  formelIds: ['lvz-ohne', 'lvz-mit', 'lg-verziehung'],
  merkhilfen: [
    'Eine S-Verziehung besteht aus zwei gleich großen Gegenbögen. Jeder Bogen schafft die Hälfte des Versatzes Δe.',
    'Großer Radius → lange Verziehung. Vierfacher Versatz → doppelte Länge (wegen der Wurzel).',
    'Radius der Verziehungsbögen mindestens ve² / 2.',
    'Die Formel mit Zwischengerade (5.2) ist noch nicht bestätigt – dazu gibt es noch keine Aufgaben.',
  ],
  rechner: [
    {
      id: 'lvz', label: 'Verziehungslänge',
      felder: [
        { key: 'r', sym: 'r', name: 'Radius', einheit: 'm', einheiten: ['m', 'km'], standard: 10000 },
        { key: 'de', sym: '\\Delta e', name: 'Verziehungsmaß', einheit: 'm', einheiten: ['m', 'cm', 'mm'], standard: 2 },
        { key: 've', sym: 'v_e', name: 'Entwurfsgeschwindigkeit (für Prüfung)', einheit: 'km/h', einheiten: ['km/h'], standard: 120 },
      ],
      berechne: rechnerLvz,
    },
    {
      id: 'r', label: 'Radius aus lvz',
      felder: [
        { key: 'l', sym: 'l_{vz}', name: 'Verziehungslänge', einheit: 'm', einheiten: ['m'], standard: 200 },
        { key: 'de', sym: '\\Delta e', name: 'Verziehungsmaß', einheit: 'm', einheiten: ['m', 'cm', 'mm'], standard: 2 },
      ],
      berechne: rechnerR,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') return (stufe === 1 ? umstellenR : randChoice([umstellenR, umstellenDe]))(stufe);
    if (modus === 'einheiten') return randChoice([einheitenCm, einheitenKm])(stufe);
    if (stufe === 1) return chance(0.7) ? uebenLvz(1) : uebenLg(1);
    if (stufe === 2) return chance(0.15) ? frageFaktor(2) : randChoice([uebenLvz, uebenLvz, uebenMinR, uebenLg])(2);
    return chance(0.5) ? uebenKette(3) : randChoice([uebenLvz, uebenLg, frageFaktor])(3);
  },
};

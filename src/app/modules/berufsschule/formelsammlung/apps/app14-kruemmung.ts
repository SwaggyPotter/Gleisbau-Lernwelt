import { auswahl, geg, s, zahl } from '../kern/bauer';
import { kruemmung, ruckGrenze, vOhneUebergang } from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

/* Kap. 19–20 – Krümmung k = 1000/r und Ruck-Kriterium (★ prüfungsrelevant). */

const APP = 'kruemmung';

function kSchritt(r: number, idx = ''): string {
  return `k${idx} = \\frac{1000}{${zl(r, 0)}} = ${zl(kruemmung(r), 3)}\\,\\tfrac{1}{\\text{km}}`;
}

function grenzSchritt(v: number): string {
  return `\\frac{9000}{v^2} = \\frac{9000}{${zl(v, 0)}^2} = ${zl(ruckGrenze(v), 3)}\\,\\tfrac{1}{\\text{km}}`;
}

// ---------- Üben ----------

function uebenK(stufe: Stufe): Aufgabe {
  const r = randStep(150, 6000, 50);
  const k = kruemmung(r);
  return zahl({
    appId: APP, formelId: 'kruemmung', modus: 'ueben', stufe,
    text: stufe >= 2 ? `Für das Krümmungsband im Lageplan brauchst du die Krümmung eines Bogens mit r = ${fmt(r, 0)} m.` : undefined,
    gegeben: [geg('r', 'Radius', r, 'm', 0)],
    frage: 'Berechne die Krümmung k in 1/km.',
    gesucht: { sym: 'k', name: 'Krümmung', einheit: '1/km' },
    loesung: roundTo(k, 3), nk: 3,
    tipp: '1000 durch den Radius in m.',
    schritte: [s('Formel:', 'k = \\frac{1}{r} \\cdot 1000'), s('Einsetzen:', kSchritt(r))],
  });
}

function entscheidungGerade(stufe: Stufe): Aufgabe {
  for (;;) {
    const v = randStep(40, 160, 10);
    const r = randStep(300, 6000, 100);
    const dk = kruemmung(r);
    const g = ruckGrenze(v);
    if (Math.abs(dk - g) / g < 0.03) continue; // knappe Fälle vermeiden
    const noetig = dk > g;
    return auswahl({
      appId: APP, formelId: 'ruck-gerade', modus: 'ueben', stufe,
      text: `Eine Gerade geht direkt in einen Bogen mit r = ${fmt(r, 0)} m über. Die Strecke wird mit ${v} km/h befahren.`,
      gegeben: [geg('r', 'Radius', r, 'm', 0), geg('v', 'Geschwindigkeit', v, 'km/h', 0)],
      frage: 'Ist ein Übergangsbogen nötig?',
      optionen: noetig
        ? [`Ja – Δk = ${fmt(dk, 3)} > ${fmt(g, 3)}`, `Nein – Δk = ${fmt(dk, 3)} > ${fmt(g, 3)}`, 'Nein – zwischen Gerade und Bogen nie']
        : [`Nein – Δk = ${fmt(dk, 3)} < ${fmt(g, 3)}`, `Ja – Δk = ${fmt(dk, 3)} < ${fmt(g, 3)}`, 'Ja – zwischen Gerade und Bogen immer'],
      tipp: 'Δk = 1000/r (die Gerade hat k = 0) mit 9000/v² vergleichen.',
      schritte: [
        s('Krümmungsänderung (Gerade k = 0):', `\\Delta k ${kSchritt(r).slice(2)}`),
        s('Grenzwert:', grenzSchritt(v)),
        s(noetig ? `${fmt(dk, 3)} > ${fmt(g, 3)} → Übergangsbogen nötig.` : `${fmt(dk, 3)} < ${fmt(g, 3)} → kein Übergangsbogen nötig.`),
      ],
    });
  }
}

function entscheidungGleichsinnig(stufe: Stufe): Aufgabe {
  for (;;) {
    const v = randStep(40, 160, 10);
    const r1 = randStep(400, 6000, 100);
    const r2 = randStep(300, 6000, 100);
    if (r1 === r2) continue;
    const dk = Math.abs(kruemmung(r2) - kruemmung(r1));
    const g = ruckGrenze(v);
    if (Math.abs(dk - g) / g < 0.03) continue;
    const noetig = dk > g;
    return auswahl({
      appId: APP, formelId: 'ruck-gleichsinnig', modus: 'ueben', stufe,
      text: `Zwei gleichsinnige Bögen folgen direkt aufeinander: r₁ = ${fmt(r1, 0)} m und r₂ = ${fmt(r2, 0)} m. v = ${v} km/h.`,
      gegeben: [geg('r_1', 'Radius 1', r1, 'm', 0), geg('r_2', 'Radius 2', r2, 'm', 0), geg('v', 'Geschwindigkeit', v, 'km/h', 0)],
      frage: 'Ist zwischen den Bögen ein Übergangsbogen nötig?',
      optionen: noetig
        ? [`Ja – Δk = ${fmt(dk, 3)} > ${fmt(g, 3)}`, `Nein – Δk = ${fmt(dk, 3)} > ${fmt(g, 3)}`, 'Nein – gleichsinnige Bögen brauchen nie einen']
        : [`Nein – Δk = ${fmt(dk, 3)} < ${fmt(g, 3)}`, `Ja – Δk = ${fmt(dk, 3)} < ${fmt(g, 3)}`, 'Ja – zwischen zwei Bögen immer'],
      tipp: 'Gleichsinnig: Die Krümmungen werden voneinander abgezogen.',
      schritte: [
        s('Krümmungen:', `${kSchritt(r1, '_1')}, \\quad ${kSchritt(r2, '_2')}`),
        s('Differenz:', `\\Delta k = |${zl(kruemmung(r2), 3)} - ${zl(kruemmung(r1), 3)}| = ${zl(dk, 3)}\\,\\tfrac{1}{\\text{km}}`),
        s('Grenzwert:', grenzSchritt(v)),
        s(noetig ? 'Δk ist größer → Übergangsbogen nötig.' : 'Δk ist kleiner → kein Übergangsbogen nötig.'),
      ],
    });
  }
}

function entscheidungGegenbogen(stufe: Stufe): Aufgabe {
  for (;;) {
    const r1 = randStep(100, 800, 10);
    const r2 = randStep(100, 800, 10);
    const sum = kruemmung(r1) + kruemmung(r2);
    if (Math.abs(sum - 10) < 0.3) continue;
    const noetig = sum > 10;
    return auswahl({
      appId: APP, formelId: 'ruck-gegenbogen', modus: 'ueben', stufe,
      text: `Ein Gegenbogen: Auf einen Linksbogen mit r₁ = ${fmt(r1, 0)} m folgt direkt ein Rechtsbogen mit r₂ = ${fmt(r2, 0)} m.`,
      gegeben: [geg('r_1', 'Radius 1', r1, 'm', 0), geg('r_2', 'Radius 2', r2, 'm', 0)],
      frage: 'Ist ein Übergangsbogen nötig?',
      optionen: noetig
        ? [`Ja – Σk = ${fmt(sum, 2)} > 10`, `Nein – Σk = ${fmt(sum, 2)} > 10`, 'Nein – Gegenbögen brauchen nie einen']
        : [`Nein – Σk = ${fmt(sum, 2)} < 10`, `Ja – Σk = ${fmt(sum, 2)} < 10`, 'Ja – Gegenbögen immer'],
      tipp: 'Bei Gegenbögen werden die Krümmungen addiert und mit 10 verglichen.',
      schritte: [
        s('Krümmungen:', `${kSchritt(r1, '_1')}, \\quad ${kSchritt(r2, '_2')}`),
        s('Summe:', `\\sum k = ${zl(kruemmung(r1), 3)} + ${zl(kruemmung(r2), 3)} = ${zl(sum, 3)}`),
        s(noetig ? 'Σk > 10 → Übergangsbogen nötig.' : 'Σk ≤ 10 → kein Übergangsbogen nötig.'),
      ],
    });
  }
}

function uebenDk(stufe: Stufe): Aufgabe {
  const r1 = randStep(400, 6000, 100);
  let r2 = randStep(300, 6000, 100);
  if (r2 === r1) r2 += 100;
  const dk = Math.abs(kruemmung(r2) - kruemmung(r1));
  return zahl({
    appId: APP, formelId: 'ruck-gleichsinnig', modus: 'ueben', stufe,
    text: `Zwei gleichsinnige Bögen: r₁ = ${fmt(r1, 0)} m, r₂ = ${fmt(r2, 0)} m. Wie groß ist die Krümmungsänderung am Übergang?`,
    gegeben: [geg('r_1', 'Radius 1', r1, 'm', 0), geg('r_2', 'Radius 2', r2, 'm', 0)],
    frage: 'Berechne Δk in 1/km (positiv).',
    gesucht: { sym: '\\Delta k', name: 'Krümmungsänderung', einheit: '1/km' },
    loesung: roundTo(dk, 3), nk: 3,
    tipp: 'Beide Krümmungen ausrechnen und die kleinere von der größeren abziehen.',
    schritte: [
      s('Krümmungen:', `${kSchritt(r1, '_1')}, \\quad ${kSchritt(r2, '_2')}`),
      s('Differenz:', `\\Delta k = ${zl(dk, 3)}\\,\\tfrac{1}{\\text{km}}`),
    ],
  });
}

// ---------- Umstellen ----------

function umstellenV(stufe: Stufe): Aufgabe {
  const r = randStep(300, 6000, 100);
  const v = vOhneUebergang(kruemmung(r));
  return zahl({
    appId: APP, formelId: 'ruck-gerade', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Eine Gerade geht direkt (ohne Übergangsbogen) in einen Bogen mit r = ${fmt(r, 0)} m über. Bis zu welcher Geschwindigkeit ist das noch in Ordnung?` : undefined,
    gegeben: [geg('r', 'Radius', r, 'm', 0)],
    frage: 'Berechne die Grenzgeschwindigkeit v in km/h.',
    gesucht: { sym: 'v', name: 'Grenzgeschwindigkeit', einheit: 'km/h' },
    loesung: roundTo(v, 1), nk: 1,
    tipp: 'Grenze: 1000/r = 9000/v². Nach v² umstellen, Wurzel ziehen. Tipp: v = 3 · √r.',
    formelLatex: 'v = \\sqrt{\\frac{9000}{\\Delta k}} = \\sqrt{\\frac{9000 \\cdot r}{1000}} = 3 \\cdot \\sqrt{r}',
    schritte: [
      s('Grenzfall:', '\\frac{1000}{r} = \\frac{9000}{v^2} \\;\\Rightarrow\\; v = \\sqrt{\\frac{9000 \\cdot r}{1000}} = 3 \\cdot \\sqrt{r}'),
      s('Einsetzen:', `v = 3 \\cdot \\sqrt{${zl(r, 0)}} = ${zl(v, 1)}\\,\\tfrac{\\text{km}}{\\text{h}}`),
    ],
  });
}

function umstellenR(stufe: Stufe): Aufgabe {
  const v = randStep(40, 160, 10);
  const r = (v * v) / 9;
  return zahl({
    appId: APP, formelId: 'ruck-gerade', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Die Strecke wird mit ${v} km/h befahren. Ab welchem Radius kann ein Bogen ohne Übergangsbogen direkt an die Gerade anschließen?` : undefined,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0)],
    frage: 'Berechne den Grenzradius r in m.',
    gesucht: { sym: 'r', name: 'Grenzradius', einheit: 'm' },
    loesung: roundTo(r, 0), nk: 0,
    tipp: '1000/r = 9000/v² nach r umstellen: r = v² / 9.',
    formelLatex: 'r = \\frac{1000 \\cdot v^2}{9000} = \\frac{v^2}{9}',
    schritte: [s('Umstellen:', 'r = \\frac{1000 \\cdot v^2}{9000} = \\frac{v^2}{9}'), s('Einsetzen:', `r = \\frac{${zl(v, 0)}^2}{9} = ${zl(r, 0)}\\,\\text{m}`)],
  });
}

function umstellenRausK(stufe: Stufe): Aufgabe {
  const k = randStep(0.2, 6, 0.05);
  const r = 1000 / k;
  return zahl({
    appId: APP, formelId: 'kruemmung', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Im Krümmungsband liest du k = ${fmt(k, 2)} 1/km ab. Welcher Radius ist das?` : undefined,
    gegeben: [geg('k', 'Krümmung', k, '1/km', 2)],
    frage: 'Berechne r in m.',
    gesucht: { sym: 'r', name: 'Radius', einheit: 'm' },
    loesung: roundTo(r, 0), nk: 0,
    tipp: 'r und k tauschen: r = 1000 / k.',
    formelLatex: 'r = \\frac{1000}{k}',
    schritte: [s('Umstellen:', 'r = \\frac{1000}{k}'), s('Einsetzen:', `r = \\frac{1000}{${zl(k, 2)}} = ${zl(r, 0)}\\,\\text{m}`)],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenKm(stufe: Stufe): Aufgabe {
  const rKm = randStep(0.3, 6, 0.1);
  const r = rKm * 1000;
  const k = kruemmung(r);
  return zahl({
    appId: APP, formelId: 'kruemmung', modus: 'einheiten', stufe,
    text: `Der Radius steht in km: r = ${fmt(rKm, 1)} km.`,
    gegeben: [geg('r', 'Radius', rKm, 'km', 1)],
    frage: 'Krümmung k in 1/km?',
    gesucht: { sym: 'k', name: 'Krümmung', einheit: '1/km' },
    loesung: roundTo(k, 3), nk: 3,
    tipp: 'Die Formel k = 1000/r will r in m. (Oder direkt: k = 1 / r in km.)',
    schritte: [s('r in m:', `r = ${zl(r, 0)}\\,\\text{m}`), s('Einsetzen:', kSchritt(r))],
  });
}

function einheitenMs(stufe: Stufe): Aufgabe {
  const vMs = randStep(10, 45, 1);
  const v = vMs * 3.6;
  const g = ruckGrenze(v);
  return zahl({
    appId: APP, formelId: 'ruck-gerade', modus: 'einheiten', stufe,
    text: `Für das Ruck-Kriterium brauchst du den Grenzwert 9000/v². Die Geschwindigkeit ist mit ${vMs} m/s angegeben.`,
    gegeben: [geg('v', 'Geschwindigkeit', vMs, 'm/s', 0)],
    frage: 'Grenzwert in 1/km?',
    gesucht: { sym: '\\tfrac{9000}{v^2}', name: 'Grenzwert', einheit: '1/km' },
    loesung: roundTo(g, 3), nk: 3,
    tipp: 'v muss in km/h eingesetzt werden: × 3,6.',
    schritte: [s('v in km/h:', `v = ${zl(vMs, 0)} \\cdot 3{,}6 = ${zl(v, 1)}\\,\\tfrac{\\text{km}}{\\text{h}}`), s('Grenzwert:', `\\frac{9000}{${zl(v, 1)}^2} = ${zl(g, 3)}\\,\\tfrac{1}{\\text{km}}`)],
  });
}

// ---------- Rechner ----------

function rechnerGerade(w: Record<string, number>): RechnerAusgabe {
  const { r, v } = w as { r: number; v: number };
  if (!(r > 0) || !(v > 0)) return { ergebnisse: [], warnungen: ['r und v müssen größer als 0 sein.'], schritte: [] };
  const dk = kruemmung(r);
  const g = ruckGrenze(v);
  const noetig = dk > g;
  return {
    ergebnisse: [
      { sym: '\\Delta k', name: 'Krümmungsänderung', wert: dk, einheit: '1/km', nk: 3, hervorheben: true },
      { sym: '\\tfrac{9000}{v^2}', name: 'Grenzwert', wert: g, einheit: '1/km', nk: 3 },
      { sym: 'v', name: 'Grenzgeschwindigkeit ohne ÜB (3·√r)', wert: vOhneUebergang(dk), einheit: 'km/h', nk: 1 },
    ],
    warnungen: [],
    schritte: [s('', `\\Delta k ${kSchritt(r).slice(2)}`), s('', grenzSchritt(v)), s(noetig ? '→ Übergangsbogen NÖTIG.' : '→ kein Übergangsbogen nötig.')],
  };
}

function rechnerZwei(w: Record<string, number>, sw: Record<string, string>): RechnerAusgabe {
  const { r1, r2, v } = w as { r1: number; r2: number; v: number };
  if (!(r1 > 0) || !(r2 > 0)) return { ergebnisse: [], warnungen: ['Beide Radien müssen größer als 0 sein.'], schritte: [] };
  const k1 = kruemmung(r1);
  const k2 = kruemmung(r2);
  if (sw['art'] === 'gegen') {
    const sum = k1 + k2;
    return {
      ergebnisse: [{ sym: '\\sum k', name: 'Summe der Krümmungen', wert: sum, einheit: '1/km', nk: 3, hervorheben: true }],
      warnungen: [],
      schritte: [s('', `${kSchritt(r1, '_1')}, \\quad ${kSchritt(r2, '_2')}`), s('', `\\sum k = ${zl(sum, 3)}`), s(sum > 10 ? '→ Σk > 10: Übergangsbogen NÖTIG.' : '→ Σk ≤ 10: kein Übergangsbogen nötig.')],
    };
  }
  if (!(v > 0)) return { ergebnisse: [], warnungen: ['v muss größer als 0 sein.'], schritte: [] };
  const dk = Math.abs(k2 - k1);
  const g = ruckGrenze(v);
  return {
    ergebnisse: [
      { sym: '\\Delta k', name: 'Krümmungsänderung', wert: dk, einheit: '1/km', nk: 3, hervorheben: true },
      { sym: '\\tfrac{9000}{v^2}', name: 'Grenzwert', wert: g, einheit: '1/km', nk: 3 },
    ],
    warnungen: [],
    schritte: [s('', `${kSchritt(r1, '_1')}, \\quad ${kSchritt(r2, '_2')}`), s('', grenzSchritt(v)), s(dk > g ? '→ Übergangsbogen NÖTIG.' : '→ kein Übergangsbogen nötig.')],
  };
}

export const KRUEMMUNG_APP: MiniAppDef = {
  id: APP,
  skizze: 'kruemmung',
  formelIds: ['kruemmung', 'ruck-gerade', 'ruck-gleichsinnig', 'ruck-gegenbogen'],
  merkhilfen: [
    'Krümmung k = 1000 / r in 1/km. Gerade: k = 0. Kleiner Radius = große Krümmung.',
    'Gerade → Bogen: Übergangsbogen nötig, wenn 1000/r > 9000/v². Abkürzung: nötig, wenn v > 3 · √r.',
    'Gleichsinnige Bögen: Krümmungen abziehen. Gegenbögen: Krümmungen addieren und mit 10 vergleichen.',
    'Alle drei Kriterien sind in deiner Formelsammlung mit ★ markiert – prüfungsrelevant!',
  ],
  rechner: [
    {
      id: 'gerade', label: 'Gerade → Bogen',
      felder: [
        { key: 'r', sym: 'r', name: 'Radius', einheit: 'm', einheiten: ['m', 'km'], standard: 1000 },
        { key: 'v', sym: 'v', name: 'Geschwindigkeit', einheit: 'km/h', einheiten: ['km/h', 'm/s'], standard: 100 },
      ],
      berechne: rechnerGerade,
    },
    {
      id: 'zwei', label: 'Zwei Bögen',
      felder: [
        { key: 'r1', sym: 'r_1', name: 'Radius 1', einheit: 'm', einheiten: ['m', 'km'], standard: 1200 },
        { key: 'r2', sym: 'r_2', name: 'Radius 2', einheit: 'm', einheiten: ['m', 'km'], standard: 600 },
        { key: 'v', sym: 'v', name: 'Geschwindigkeit (nur gleichsinnig)', einheit: 'km/h', einheiten: ['km/h', 'm/s'], standard: 100 },
      ],
      schalter: [{ key: 'art', label: 'Art', optionen: [{ wert: 'gleich', label: 'Gleichsinnige Bögen' }, { wert: 'gegen', label: 'Gegenbögen' }] }],
      berechne: rechnerZwei,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') return (stufe === 1 ? umstellenRausK : randChoice([umstellenV, umstellenR, umstellenRausK]))(stufe);
    if (modus === 'einheiten') return randChoice([einheitenKm, einheitenMs])(stufe);
    if (stufe === 1) return chance(0.6) ? uebenK(1) : entscheidungGerade(1);
    if (stufe === 2) return chance(0.5) ? uebenK(2) : randChoice([entscheidungGerade, uebenDk])(2);
    return randChoice([entscheidungGerade, entscheidungGleichsinnig, entscheidungGegenbogen, uebenDk])(3);
  },
};

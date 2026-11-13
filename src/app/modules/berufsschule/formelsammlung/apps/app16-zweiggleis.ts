import { auswahl, geg, s, zahl } from '../kern/bauer';
import { stammgleisAusZweiggleisInnen, weichenGeschwindigkeit, weichenTangente, zweiggleisInnen } from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

/*
 * Kap. 22 – Zweiggleisradius der Innenbogenweiche (gebogene Weiche, Zweiggleis krümmt sich in dieselbe Richtung).
 * Kap. 23 (Außenbogenweiche) ist in formelsammlung.json als unklar markiert → keine Aufgaben, kein Rechner.
 * Die Tangentenlängen t werden aus Radius und Neigung der Grundform berechnet (t = r·tan(α/2)) und in der
 * Aufgabe als gegeben angezeigt.
 */

const APP = 'zweiggleis';
const GRUNDFORMEN = [
  { r: 190, n: 9 }, { r: 300, n: 9 }, { r: 500, n: 12 }, { r: 760, n: 14 }, { r: 1200, n: 18.5 },
];

function grundform(): { rG: number; n: number; t: number; name: string } {
  const g = randChoice(GRUNDFORMEN);
  const t = roundTo(weichenTangente(g.r, g.n), 3);
  return { rG: g.r, n: g.n, t, name: `EW ${g.r}-1:${fmt(g.n, g.n % 1 ? 1 : 0)}` };
}

function rechnung(rG: number, rSt: number, t: number): string {
  const rz = zweiggleisInnen(rG, rSt, t);
  return `r_z = \\frac{${zl(rG, 0)} \\cdot ${zl(rSt, 0)} - ${zl(t, 3)}^2}{${zl(rG, 0)} + ${zl(rSt, 0)}} = \\frac{${zl(rG * rSt - t * t, 1)}}{${zl(rG + rSt, 0)}} = ${zl(rz, 1)}\\,\\text{m}`;
}

// ---------- Üben ----------

function uebenRz(stufe: Stufe): Aufgabe {
  const g = grundform();
  const rSt = randStep(500, 6000, 100);
  const rz = zweiggleisInnen(g.rG, rSt, g.t);
  return zahl({
    appId: APP, formelId: 'rz-innen', modus: 'ueben', stufe,
    text: stufe >= 2
      ? `Im Bogen des Stammgleises (r = ${fmt(rSt, 0)} m) wird eine ${g.name} als Innenbogenweiche eingebaut. Laut Weichenzeichnung ist t = ${fmt(g.t, 3)} m.`
      : undefined,
    gegeben: [geg('r_G', 'Radius der Grundform', g.rG, 'm', 0), geg('r_{St}', 'Radius des Stammgleises', rSt, 'm', 0), geg('t', 'Tangentenlänge', g.t, 'm', 3)],
    frage: 'Berechne den Zweiggleisradius rz in m.',
    gesucht: { sym: 'r_z', name: 'Zweiggleisradius', einheit: 'm' },
    loesung: roundTo(rz, 1), nk: 1,
    tipp: 'Zähler: rG · rSt − t². Nenner: rG + rSt. Der Zweiggleisradius wird kleiner als die Grundform.',
    schritte: [s('Formel Innenbogenweiche:', 'r_z = \\frac{r_G \\cdot r_{St} - t^2}{r_G + r_{St}}'), s('Einsetzen:', rechnung(g.rG, rSt, g.t))],
  });
}

function uebenKette(stufe: Stufe): Aufgabe {
  const g = grundform();
  const rSt = randStep(500, 6000, 100);
  const rz = zweiggleisInnen(g.rG, rSt, g.t);
  const v = weichenGeschwindigkeit(rz);
  return zahl({
    appId: APP, formelId: 'rz-innen', modus: 'ueben', stufe,
    text: `Eine ${g.name} (t = ${fmt(g.t, 3)} m) liegt als Innenbogenweiche in einem Bogen mit r = ${fmt(rSt, 0)} m (ohne Überhöhung). Wie schnell darf der abzweigende Strang befahren werden?`,
    gegeben: [geg('r_G', 'Radius der Grundform', g.rG, 'm', 0), geg('r_{St}', 'Radius des Stammgleises', rSt, 'm', 0), geg('t', 'Tangentenlänge', g.t, 'm', 3)],
    frage: 'Zulässige Geschwindigkeit im Zweiggleis in km/h?',
    gesucht: { sym: 'v', name: 'Zulässige Geschwindigkeit', einheit: 'km/h' },
    loesung: roundTo(v, 1), nk: 1,
    tipp: 'Erst rz (Innenbogenweiche), dann v = 2,91 · √rz (App 10 – Weichen).',
    schritte: [
      s('1. Zweiggleisradius:', rechnung(g.rG, rSt, g.t)),
      s('2. Geschwindigkeit:', `v = 2{,}91 \\cdot \\sqrt{${zl(rz, 1)}} = ${zl(v, 1)}\\,\\tfrac{\\text{km}}{\\text{h}}`),
    ],
  });
}

function frageRichtung(stufe: Stufe): Aufgabe {
  return auswahl({
    appId: APP, formelId: 'rz-innen', modus: 'ueben', stufe,
    text: 'Eine Weiche mit Grundform r = 500 m wird als Innenbogenweiche in einen Bogen eingebaut.',
    gegeben: [],
    frage: 'Wie verhält sich der Zweiggleisradius zur Grundform?',
    optionen: ['Er wird kleiner als 500 m', 'Er wird größer als 500 m', 'Er bleibt 500 m', 'Er wird unendlich groß (gerade)'],
    tipp: 'Bei der Innenbogenweiche krümmen sich Stammgleis und Zweiggleis in dieselbe Richtung.',
    schritte: [s('Die Krümmungen addieren sich (≈ 1/rG + 1/rSt) – das Zweiggleis wird enger, rz < rG.', 'r_z = \\frac{r_G \\cdot r_{St} - t^2}{r_G + r_{St}}')],
  });
}

// ---------- Umstellen ----------

function umstellenRSt(stufe: Stufe): Aufgabe {
  const g = grundform();
  const rStWahr = randStep(800, 6000, 100);
  const rz = roundTo(zweiggleisInnen(g.rG, rStWahr, g.t), 0);
  const rSt = stammgleisAusZweiggleisInnen(rz, g.rG, g.t);
  return zahl({
    appId: APP, formelId: 'rz-innen', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Eine ${g.name} (t = ${fmt(g.t, 3)} m) soll als Innenbogenweiche ein Zweiggleis mit rz = ${fmt(rz, 0)} m ergeben. Welchen Radius muss das Stammgleis haben?` : undefined,
    gegeben: [geg('r_z', 'Zweiggleisradius', rz, 'm', 0), geg('r_G', 'Radius der Grundform', g.rG, 'm', 0), geg('t', 'Tangentenlänge', g.t, 'm', 3)],
    frage: 'Berechne rSt in m.',
    gesucht: { sym: 'r_{St}', name: 'Radius des Stammgleises', einheit: 'm' },
    loesung: roundTo(rSt, 0), nk: 0,
    rel: 0.02,
    tipp: 'Mit dem Nenner malnehmen, alle rSt-Glieder auf eine Seite, rSt ausklammern.',
    formelLatex: 'r_{St} = \\frac{r_z \\cdot r_G + t^2}{r_G - r_z}',
    schritte: [
      s('rz · (rG + rSt) = rG · rSt − t²  →  rSt · (rG − rz) = rz · rG + t²', 'r_{St} = \\frac{r_z \\cdot r_G + t^2}{r_G - r_z}'),
      s('Einsetzen:', `r_{St} = \\frac{${zl(rz, 0)} \\cdot ${zl(g.rG, 0)} + ${zl(g.t, 3)}^2}{${zl(g.rG, 0)} - ${zl(rz, 0)}} = ${zl(rSt, 0)}\\,\\text{m}`),
    ],
  });
}

function umstellenT(stufe: Stufe): Aufgabe {
  const g = grundform();
  const rSt = randStep(800, 6000, 100);
  const t = g.t;
  return zahl({
    appId: APP, formelId: 'rz-innen', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Die Tangentenlänge der Grundform r = ${g.rG} m mit Neigung 1:${fmt(g.n, g.n % 1 ? 1 : 0)} fehlt in der Zeichnung. Berechne sie, bevor du rz bestimmst (Stammgleis r = ${fmt(rSt, 0)} m).` : undefined,
    gegeben: [geg('r_G', 'Radius der Grundform', g.rG, 'm', 0), geg('n', 'Weichenneigung 1 : n', g.n, '', g.n % 1 ? 1 : 0)],
    frage: 'Berechne die Tangentenlänge t in m.',
    gesucht: { sym: 't', name: 'Tangentenlänge', einheit: 'm' },
    loesung: roundTo(t, 2), nk: 2,
    tipp: 'Weichenwinkel α = arctan(1/n), dann t = rG · tan(α/2). Taschenrechner auf DEG.',
    formelLatex: 't = r_G \\cdot \\tan\\frac{\\alpha}{2}, \\quad \\alpha = \\arctan\\frac{1}{n}',
    schritte: [
      s('Weichenwinkel:', `\\alpha = \\arctan\\frac{1}{${zl(g.n, g.n % 1 ? 1 : 0)}} = ${zl((Math.atan(1 / g.n) * 180) / Math.PI, 4)}°`),
      s('Tangentenlänge:', `t = ${zl(g.rG, 0)} \\cdot \\tan\\frac{${zl((Math.atan(1 / g.n) * 180) / Math.PI, 4)}°}{2} = ${zl(t, 3)}\\,\\text{m}`),
    ],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenMm(stufe: Stufe): Aufgabe {
  const g = grundform();
  const rSt = randStep(500, 6000, 100);
  const tMm = roundTo(g.t * 1000, 0);
  const t = tMm / 1000;
  const rz = zweiggleisInnen(g.rG, rSt, t);
  return zahl({
    appId: APP, formelId: 'rz-innen', modus: 'einheiten', stufe,
    text: `In der Weichenzeichnung der ${g.name} steht t = ${fmt(tMm, 0)} mm. Stammgleis r = ${fmt(rSt, 0)} m.`,
    gegeben: [geg('r_G', 'Radius der Grundform', g.rG, 'm', 0), geg('r_{St}', 'Radius des Stammgleises', rSt, 'm', 0), geg('t', 'Tangentenlänge', tMm, 'mm', 0)],
    frage: 'Zweiggleisradius in m?',
    gesucht: { sym: 'r_z', name: 'Zweiggleisradius', einheit: 'm' },
    loesung: roundTo(rz, 1), nk: 1,
    tipp: 't in m umrechnen, bevor du es quadrierst!',
    schritte: [s('t in m:', `t = ${zl(tMm, 0)}\\,\\text{mm} = ${zl(t, 3)}\\,\\text{m}`), s('Einsetzen:', rechnung(g.rG, rSt, t))],
  });
}

function einheitenKm(stufe: Stufe): Aufgabe {
  const g = grundform();
  const rStKm = randStep(0.5, 6, 0.1);
  const rSt = roundTo(rStKm * 1000, 0);
  const rz = zweiggleisInnen(g.rG, rSt, g.t);
  return zahl({
    appId: APP, formelId: 'rz-innen', modus: 'einheiten', stufe,
    text: `Das Stammgleis hat r = ${fmt(rStKm, 1)} km. Darin liegt eine ${g.name} als Innenbogenweiche (t = ${fmt(g.t, 3)} m).`,
    gegeben: [geg('r_G', 'Radius der Grundform', g.rG, 'm', 0), geg('r_{St}', 'Radius des Stammgleises', rStKm, 'km', 1), geg('t', 'Tangentenlänge', g.t, 'm', 3)],
    frage: 'Zweiggleisradius in m?',
    gesucht: { sym: 'r_z', name: 'Zweiggleisradius', einheit: 'm' },
    loesung: roundTo(rz, 1), nk: 1,
    tipp: 'rSt in m umrechnen (× 1000).',
    schritte: [s('rSt in m:', `r_{St} = ${zl(rSt, 0)}\\,\\text{m}`), s('Einsetzen:', rechnung(g.rG, rSt, g.t))],
  });
}

// ---------- Rechner ----------

function rechner(w: Record<string, number>): RechnerAusgabe {
  const { rG, rSt, t } = w as { rG: number; rSt: number; t: number };
  if (!(rG > 0) || !(rSt > 0) || !(t >= 0)) return { ergebnisse: [], warnungen: ['rG, rSt > 0 und t ≥ 0 eingeben.'], schritte: [] };
  const rz = zweiggleisInnen(rG, rSt, t);
  return {
    ergebnisse: [
      { sym: 'r_z', name: 'Zweiggleisradius (Innenbogenweiche)', wert: rz, einheit: 'm', nk: 1, hervorheben: true },
      { sym: 'v', name: 'v = 2,91 · √rz (ohne Überhöhung)', wert: weichenGeschwindigkeit(rz), einheit: 'km/h', nk: 1 },
    ],
    warnungen: ['Außenbogenweiche (Kap. 23) ist noch nicht freigegeben – Formel in deiner Formelsammlung unklar.'],
    schritte: [s('', rechnung(rG, rSt, t))],
    tabelle: {
      titel: 'Tangentenlängen t = r · tan(α/2) der üblichen Grundformen',
      kopf: ['Grundform', 't [m]'],
      zeilen: GRUNDFORMEN.map(g => [`${g.r}-1:${fmt(g.n, g.n % 1 ? 1 : 0)}`, fmt(weichenTangente(g.r, g.n), 3)]),
    },
  };
}

export const ZWEIGGLEIS_APP: MiniAppDef = {
  id: APP,
  skizze: 'zweiggleis',
  formelIds: ['rz-innen', 'rz-aussen'],
  merkhilfen: [
    'Innenbogenweiche: Stammgleis und Zweiggleis krümmen sich in dieselbe Richtung – das Zweiggleis wird enger (rz < rG).',
    'Faustregel ohne t: 1/rz ≈ 1/rG + 1/rSt. Das −t² im Zähler ist die genaue Korrektur.',
    'Mit rz kannst du sofort weiterrechnen: v = 2,91 · √rz (App 10 – Weichen).',
    'Außenbogenweiche (Kap. 23): Formel noch nicht bestätigt (lt oder t? Vorzeichen im Nenner?) – noch keine Aufgaben.',
  ],
  verweise: [{ label: 'App 10 – Weichen', link: '/berufsschule/formelsammlung/weichen' }],
  rechner: [
    {
      id: 'rz', label: 'Innenbogenweiche',
      felder: [
        { key: 'rG', sym: 'r_G', name: 'Radius der Grundform', einheit: 'm', einheiten: ['m'], standard: 500 },
        { key: 'rSt', sym: 'r_{St}', name: 'Radius des Stammgleises', einheit: 'm', einheiten: ['m', 'km'], standard: 1500 },
        { key: 't', sym: 't', name: 'Tangentenlänge', einheit: 'm', einheiten: ['m', 'mm'], standard: 20.797 },
      ],
      berechne: rechner,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') return (stufe === 1 ? umstellenT : randChoice([umstellenRSt, umstellenT]))(stufe);
    if (modus === 'einheiten') return randChoice([einheitenMm, einheitenKm])(stufe);
    if (stufe === 1) return uebenRz(1);
    if (stufe === 2) return chance(0.15) ? frageRichtung(2) : uebenRz(2);
    return chance(0.5) ? uebenKette(3) : uebenRz(3);
  },
};

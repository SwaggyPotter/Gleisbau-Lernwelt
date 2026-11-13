import { auswahl, geg, s, zahl } from '../kern/bauer';
import { weichenGeschwindigkeit, weichenRadius, zwischengeradeWeiche } from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

/* Kap. 11–12 – Weichen: v = 2,91·√r (nicht überhöht, uf = 100 mm) und Zwischengerade lg = c − 2·lt. */

const APP = 'weichen';
const RADIEN = [190, 300, 500, 760, 1200, 2500];

function vSchritt(r: number): string {
  return `v = 2{,}91 \\cdot \\sqrt{${zl(r, 0)}} = 2{,}91 \\cdot ${zl(Math.sqrt(r), 3)} = ${zl(weichenGeschwindigkeit(r), 1)}\\,\\tfrac{\\text{km}}{\\text{h}}`;
}

// ---------- Üben ----------

function uebenV(stufe: Stufe): Aufgabe {
  const r = stufe === 1 ? randChoice(RADIEN) : randChoice([...RADIEN, randStep(200, 3000, 10)]);
  const v = weichenGeschwindigkeit(r);
  return zahl({
    appId: APP, formelId: 'v-weiche', modus: 'ueben', stufe,
    text: stufe >= 2
      ? randChoice([
          `Im Bahnhof liegt eine nicht überhöhte Weiche mit einem Zweiggleisradius von ${fmt(r, 0)} m. Wie schnell darf ein Zug in den abzweigenden Strang fahren?`,
          `Für eine neue Weiche mit r = ${fmt(r, 0)} m im Zweiggleis soll die zulässige Geschwindigkeit ermittelt werden (keine Überhöhung).`,
        ])
      : undefined,
    gegeben: [geg('r', 'Zweiggleisradius', r, 'm', 0)],
    frage: 'Berechne die zulässige Geschwindigkeit v in km/h.',
    gesucht: { sym: 'v', name: 'Zulässige Geschwindigkeit', einheit: 'km/h' },
    loesung: roundTo(v, 1), nk: 1,
    tipp: 'Wurzel aus r, mal 2,91. r als Zahl in m.',
    schritte: [s('Formel (uf = 100 mm):', 'v = 2{,}91 \\cdot \\sqrt{r}'), s('Einsetzen:', vSchritt(r))],
  });
}

function uebenLg(stufe: Stufe): Aufgabe {
  const lt = randStep(10, 30, 0.1);
  const c = roundTo(2 * lt + randStep(2, 25, 0.1), 1);
  const lg = zwischengeradeWeiche(c, lt);
  return zahl({
    appId: APP, formelId: 'lg-weiche', modus: 'ueben', stufe,
    text: stufe >= 2 ? `Zwei Weichen bilden eine Gleisverbindung. Laut Plan beträgt der Abstand c = ${fmt(c, 1)} m, jede Weiche hat eine Tangentenlänge lt = ${fmt(lt, 1)} m. Wie lang ist die Zwischengerade?` : undefined,
    gegeben: [geg('c', 'Abstand', c, 'm', 1), geg('l_t', 'Tangentenlänge der Weiche', lt, 'm', 1)],
    frage: 'Berechne die Zwischengerade lg in m.',
    gesucht: { sym: 'l_g', name: 'Zwischengerade', einheit: 'm' },
    loesung: roundTo(lg, 1), nk: 1,
    tipp: 'Von c werden beide Tangentenlängen abgezogen.',
    schritte: [s('Formel:', 'l_g = c - 2 \\cdot l_t'), s('Einsetzen:', `l_g = ${zl(c, 1)} - 2 \\cdot ${zl(lt, 1)} = ${zl(lg, 1)}\\,\\text{m}`)],
  });
}

function frageHerzstueck(stufe: Stufe): Aufgabe {
  const gerade = chance(0.5);
  return auswahl({
    appId: APP, formelId: 'lg-weiche', modus: 'ueben', stufe,
    text: gerade
      ? 'In der Gleisverbindung liegen Weichen mit geradem Herzstück.'
      : 'In der Gleisverbindung liegen Weichen mit Bogenherzstück.',
    gegeben: [],
    frage: 'Welche Länge steht als Zwischengerade zur Verfügung?',
    optionen: gerade
      ? ['lg plus das gerade Endstück des Herzstücks', 'nur lg', 'lg minus das Herzstück', 'c plus 2 · lt']
      : ['nur lg', 'lg plus das gerade Endstück des Herzstücks', 'lg plus beide Herzstücke', 'c plus 2 · lt'],
    tipp: 'Nur ein gerades Stück im Herzstück zählt als Gerade.',
    schritte: [s(gerade
      ? 'Beim geraden Herzstück ist das Endstück gerade – es darf zur Zwischengeraden dazugerechnet werden.'
      : 'Beim Bogenherzstück ist alles gekrümmt – es zählt nur lg.')],
  });
}

function frageZulaessig(stufe: Stufe): Aufgabe {
  const r = randChoice(RADIEN);
  const v = weichenGeschwindigkeit(r);
  const vZug = Math.round(v / 10) * 10 + randChoice([-10, 0, 10]);
  const ok = vZug <= v;
  return auswahl({
    appId: APP, formelId: 'v-weiche', modus: 'ueben', stufe,
    text: `Ein Bauzug soll mit ${vZug} km/h in den abzweigenden Strang einer nicht überhöhten Weiche fahren. Zweiggleisradius r = ${fmt(r, 0)} m.`,
    gegeben: [geg('r', 'Zweiggleisradius', r, 'm', 0)],
    frage: `Ist ${vZug} km/h zulässig?`,
    optionen: ok
      ? [`Ja – der Rechenwert liegt bei ${fmt(v, 1)} km/h`, `Nein – der Rechenwert liegt bei ${fmt(v, 1)} km/h`, `Nein – Weichen dürfen abzweigend nie schneller als 40 km/h befahren werden`]
      : [`Nein – der Rechenwert liegt nur bei ${fmt(v, 1)} km/h`, `Ja – der Rechenwert liegt nur bei ${fmt(v, 1)} km/h`, 'Ja – die Formel gilt nur für Personenzüge'],
    tipp: 'Rechenwert v = 2,91 · √r bestimmen und vergleichen.',
    schritte: [s('Rechenwert:', vSchritt(r)), s(ok ? `${vZug} km/h ≤ ${fmt(v, 1)} km/h → zulässig.` : `${vZug} km/h > ${fmt(v, 1)} km/h → zu schnell.`)],
  });
}

// ---------- Umstellen ----------

function umstellenR(stufe: Stufe): Aufgabe {
  const v = randStep(40, 160, 5);
  const r = weichenRadius(v);
  return zahl({
    appId: APP, formelId: 'v-weiche', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Der abzweigende Strang soll mit ${v} km/h befahren werden. Welchen Zweiggleisradius braucht die Weiche mindestens?` : undefined,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0)],
    frage: 'Berechne den Mindestradius r in m.',
    gesucht: { sym: 'r', name: 'Zweiggleisradius', einheit: 'm' },
    loesung: roundTo(r, 0), nk: 0,
    tipp: 'Durch 2,91 teilen, dann quadrieren.',
    formelLatex: 'r = \\left(\\frac{v}{2{,}91}\\right)^2',
    schritte: [s('Umstellen:', 'r = \\left(\\frac{v}{2{,}91}\\right)^2'), s('Einsetzen:', `r = \\left(\\frac{${zl(v, 0)}}{2{,}91}\\right)^2 = ${zl(v / 2.91, 3)}^2 = ${zl(r, 0)}\\,\\text{m}`)],
  });
}

function umstellenC(stufe: Stufe): Aufgabe {
  const lt = randStep(10, 30, 0.1);
  const lg = randStep(3, 25, 0.5);
  const c = lg + 2 * lt;
  return zahl({
    appId: APP, formelId: 'lg-weiche', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Zwischen zwei Weichen (lt = ${fmt(lt, 1)} m) soll eine Zwischengerade von ${fmt(lg, 1)} m entstehen. Welcher Abstand c ist nötig?` : undefined,
    gegeben: [geg('l_g', 'Zwischengerade', lg, 'm', 1), geg('l_t', 'Tangentenlänge', lt, 'm', 1)],
    frage: 'Berechne c in m.',
    gesucht: { sym: 'c', name: 'Abstand', einheit: 'm' },
    loesung: roundTo(c, 1), nk: 1,
    tipp: '2 · lt auf die andere Seite bringen (plus).',
    formelLatex: 'c = l_g + 2 \\cdot l_t',
    schritte: [s('Umstellen:', 'c = l_g + 2 \\cdot l_t'), s('Einsetzen:', `c = ${zl(lg, 1)} + 2 \\cdot ${zl(lt, 1)} = ${zl(c, 1)}\\,\\text{m}`)],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenKm(stufe: Stufe): Aufgabe {
  const r = randChoice([500, 760, 1200, 2500]);
  const rKm = r / 1000;
  const v = weichenGeschwindigkeit(r);
  return zahl({
    appId: APP, formelId: 'v-weiche', modus: 'einheiten', stufe,
    text: `In der Liste steht der Zweiggleisradius in km: r = ${fmt(rKm, 2)} km.`,
    gegeben: [geg('r', 'Zweiggleisradius', rKm, 'km', 2)],
    frage: 'Zulässige Geschwindigkeit in km/h?',
    gesucht: { sym: 'v', name: 'Zulässige Geschwindigkeit', einheit: 'km/h' },
    loesung: roundTo(v, 1), nk: 1,
    tipp: 'Die 2,91 gilt nur für r in m: erst × 1000.',
    schritte: [s('r in m:', `r = ${zl(rKm, 2)}\\,\\text{km} = ${zl(r, 0)}\\,\\text{m}`), s('Einsetzen:', vSchritt(r))],
  });
}

function einheitenMm(stufe: Stufe): Aufgabe {
  const ltMm = randStep(10000, 30000, 1);
  const lt = ltMm / 1000;
  const c = roundTo(2 * lt + randStep(2, 25, 0.1), 1);
  const lg = zwischengeradeWeiche(c, lt);
  return zahl({
    appId: APP, formelId: 'lg-weiche', modus: 'einheiten', stufe,
    text: `In der Weichenzeichnung stehen die Maße in mm: lt = ${fmt(ltMm, 0)} mm. Der Abstand ist im Lageplan in m angegeben: c = ${fmt(c, 1)} m.`,
    gegeben: [geg('c', 'Abstand', c, 'm', 1), geg('l_t', 'Tangentenlänge', ltMm, 'mm', 0)],
    frage: 'Zwischengerade lg in m?',
    gesucht: { sym: 'l_g', name: 'Zwischengerade', einheit: 'm' },
    loesung: roundTo(lg, 2), nk: 2,
    tipp: 'lt in m umrechnen: ÷ 1000.',
    schritte: [s('lt in m:', `l_t = ${zl(ltMm, 0)}\\,\\text{mm} = ${zl(lt, 3)}\\,\\text{m}`), s('Einsetzen:', `l_g = ${zl(c, 1)} - 2 \\cdot ${zl(lt, 3)} = ${zl(lg, 2)}\\,\\text{m}`)],
  });
}

// ---------- Rechner ----------

function rechnerV(w: Record<string, number>): RechnerAusgabe {
  const { r } = w as { r: number };
  if (!(r > 0)) return { ergebnisse: [], warnungen: ['Radius muss größer als 0 sein.'], schritte: [] };
  const v = weichenGeschwindigkeit(r);
  return {
    ergebnisse: [{ sym: 'v', name: 'Zulässige Geschwindigkeit (Rechenwert)', wert: v, einheit: 'km/h', nk: 1, hervorheben: true }],
    warnungen: [],
    schritte: [s('', vSchritt(r))],
    tabelle: { titel: 'Häufige Zweiggleisradien', kopf: ['r [m]', 'v [km/h]'], zeilen: RADIEN.map(x => [fmt(x, 0), fmt(weichenGeschwindigkeit(x), 1)]) },
  };
}

function rechnerLg(w: Record<string, number>): RechnerAusgabe {
  const { c, lt } = w as { c: number; lt: number };
  if (!(c > 0) || !(lt > 0)) return { ergebnisse: [], warnungen: ['c und lt müssen größer als 0 sein.'], schritte: [] };
  const lg = zwischengeradeWeiche(c, lt);
  return {
    ergebnisse: [{ sym: 'l_g', name: 'Zwischengerade', wert: lg, einheit: 'm', nk: 2, hervorheben: true }],
    warnungen: lg < 0 ? ['Negativ: Die Weichen überschneiden sich – c ist zu klein.'] : [],
    schritte: [s('', `l_g = ${zl(c, 2)} - 2 \\cdot ${zl(lt, 3)} = ${zl(lg, 2)}\\,\\text{m}`)],
  };
}

export const WEICHEN_APP: MiniAppDef = {
  id: APP,
  skizze: 'weichen',
  formelIds: ['v-weiche', 'lg-weiche'],
  merkhilfen: [
    'v = 2,91 · √r gilt für nicht überhöhte Weichen mit einem Überhöhungsfehlbetrag von 100 mm.',
    'Großer Radius → höhere Geschwindigkeit. Vierfacher Radius → doppelte Geschwindigkeit (wegen der Wurzel).',
    'Gleisverbindung: Zwischengerade lg = c − 2 · lt. Beim geraden Herzstück darf das gerade Endstück dazugezählt werden.',
  ],
  rechner: [
    {
      id: 'v', label: 'Geschwindigkeit',
      felder: [{ key: 'r', sym: 'r', name: 'Zweiggleisradius', einheit: 'm', einheiten: ['m', 'km'], standard: 500 }],
      berechne: rechnerV,
    },
    {
      id: 'lg', label: 'Zwischengerade',
      felder: [
        { key: 'c', sym: 'c', name: 'Abstand', einheit: 'm', einheiten: ['m', 'mm'], standard: 50 },
        { key: 'lt', sym: 'l_t', name: 'Tangentenlänge', einheit: 'm', einheiten: ['m', 'mm'], standard: 20 },
      ],
      berechne: rechnerLg,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') return (stufe === 1 ? umstellenR : randChoice([umstellenR, umstellenC]))(stufe);
    if (modus === 'einheiten') return randChoice([einheitenKm, einheitenMm])(stufe);
    if (stufe === 1) return chance(0.6) ? uebenV(1) : uebenLg(1);
    if (stufe === 2) return chance(0.2) ? frageZulaessig(2) : randChoice([uebenV, uebenLg])(2);
    return chance(0.3) ? frageHerzstueck(3) : randChoice([uebenV, uebenLg, frageZulaessig])(3);
  },
};

import { auswahl, geg, s, zahl } from '../kern/bauer';
import { rampenvolumen } from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

/*
 * Anhang – Rampenvolumen (Rampe gegen lotrechte Wand), V = hK·h/6 · (l1 + l2 + l3).
 * Deutung (aus der Herleitung „2 Pyramiden + 1 Dreiecksäule“, bitte mit Tim abstimmen):
 *   hK = waagerechte Länge der Rampe (Wand → Rampenfuß), h = Höhe an der Wand,
 *   l1, l2, l3 = die drei zur Wand parallelen Kanten: unten an der Wand, oben an der Wand (Krone), am Rampenfuß.
 * Mit Böschungen 1:n an beiden Seiten: l1 = Kronenbreite + 2·n·h, l2 = l3 = Kronenbreite → Variante l1 + 2·l2.
 */

const APP = 'rampenvolumen';

// Jede Aufgabe sagt, welcher Fall vorliegt (Tim, 2026-11-11): allgemeine Formel oder Variante l2 = l3.
const KOERPER = 'Erdrampe, die an ihrer hohen Seite senkrecht endet (z. B. an einer Stützwand).';
function fall(l2: number, l3: number): { formelId: string; satz: string; gesucht: string } {
  return l2 === l3
    ? { formelId: 'v-rampe-variante', satz: 'Oben an der Wand und am Rampenfuß ist die Rampe gleich breit (l2 = l3) → Variante.', gesucht: 'Rampenvolumen, Variante l2 = l3' }
    : { formelId: 'v-rampe', satz: 'Alle drei Kanten sind verschieden lang → allgemeine Formel mit l1 + l2 + l3.', gesucht: 'Rampenvolumen, allgemein (l1, l2, l3)' };
}

function vSchritt(hK: number, h: number, l1: number, l2: number, l3: number): string {
  const v = rampenvolumen(hK, h, l1, l2, l3);
  return `V = \\frac{${zl(hK, 2)} \\cdot ${zl(h, 2)}}{6} \\cdot (${zl(l1, 2)} + ${zl(l2, 2)} + ${zl(l3, 2)}) = ${zl((hK * h) / 6, 4)} \\cdot ${zl(l1 + l2 + l3, 2)} = ${zl(v, 2)}\\,\\text{m}^3`;
}

function werte(): { hK: number; h: number; l1: number; l2: number; l3: number } {
  const h = randStep(1, 5, 0.25);
  const hK = randStep(10, 60, 1);
  const l2 = randStep(3, 8, 0.5);
  const l3 = chance(0.5) ? l2 : randStep(3, 8, 0.5);
  const l1 = roundTo(l2 + 2 * randChoice([1, 1.5, 2]) * h, 2);
  return { hK, h, l1, l2, l3 };
}

// ---------- Üben ----------

function uebenV(stufe: Stufe): Aufgabe {
  const { hK, h, l1, l2, l3 } = werte();
  const v = rampenvolumen(hK, h, l1, l2, l3);
  const f = fall(l2, l3);
  return zahl({
    appId: APP, formelId: f.formelId, modus: 'ueben', stufe,
    text: stufe >= 2 ? `Für eine Baustellenzufahrt wird eine Erdrampe gegen eine Stützwand geschüttet: ${fmt(hK, 0)} m lang, an der Wand ${fmt(h, 2)} m hoch. Kanten: unten an der Wand ${fmt(l1, 2)} m, oben ${fmt(l2, 2)} m, am Rampenfuß ${fmt(l3, 2)} m. ${f.satz}` : `${KOERPER} ${f.satz}`,
    gegeben: [
      geg('h_K', 'Rampenlänge (waagerecht)', hK, 'm', 0), geg('h', 'Höhe an der Wand', h, 'm', 2),
      geg('l_1', 'Kante unten an der Wand', l1, 'm', 2), geg('l_2', 'Kante oben an der Wand', l2, 'm', 2), geg('l_3', 'Kante am Rampenfuß', l3, 'm', 2),
    ],
    frage: 'Berechne das Volumen V in m³.',
    gesucht: { sym: 'V', name: f.gesucht, einheit: 'm³' },
    loesung: roundTo(v, 1), nk: 1,
    tipp: 'Erst hK · h / 6, dann mal die Summe der drei Kanten.',
    schritte: [s('Formel:', 'V = \\frac{h_K \\cdot h}{6} \\cdot (l_1 + l_2 + l_3)'), s('Einsetzen:', vSchritt(hK, h, l1, l2, l3))],
  });
}

function uebenBoeschung(stufe: Stufe): Aufgabe {
  const h = randStep(1, 4, 0.25);
  const hK = randStep(10, 50, 1);
  const b = randStep(3, 8, 0.5);
  const n = randChoice([1, 1.5, 2]);
  const l1 = b + 2 * n * h;
  const v = rampenvolumen(hK, h, l1, b, b);
  return zahl({
    appId: APP, formelId: 'v-rampe-variante', modus: 'ueben', stufe,
    text: `Eine Erdrampe endet an einer senkrechten Wand: Kronenbreite ${fmt(b, 1)} m, Höhe an der Wand ${fmt(h, 2)} m, Länge ${hK} m. Beide Seiten haben eine Böschung 1 : ${fmt(n, 1)}.`,
    gegeben: [geg('h_K', 'Rampenlänge (waagerecht)', hK, 'm', 0), geg('h', 'Höhe an der Wand', h, 'm', 2), geg('b', 'Kronenbreite', b, 'm', 1), geg('n', 'Böschung 1 : n', n, '', 1)],
    frage: 'Berechne das Volumen in m³ (oben und am Fuß gleich breit → Variante l2 = l3).',
    gesucht: { sym: 'V', name: 'Rampenvolumen, Variante l2 = l3 (mit Böschungen)', einheit: 'm³' },
    loesung: roundTo(v, 1), nk: 1,
    tipp: 'Unten an der Wand ist die Rampe um die zwei Böschungen breiter: l1 = b + 2 · n · h. Oben und am Fuß ist sie b breit → Variante l1 + 2 · l2.',
    schritte: [
      s('Untere Kante an der Wand:', `l_1 = ${zl(b, 1)} + 2 \\cdot ${zl(n, 1)} \\cdot ${zl(h, 2)} = ${zl(l1, 2)}\\,\\text{m}`),
      s('Oben und am Fuß gleich breit (l2 = l3 = b) → Variante:', 'V = \\frac{h_K \\cdot h}{6} \\cdot (l_1 + 2 \\cdot l_2)'),
      s('Einsetzen:', `V = \\frac{${zl(hK, 0)} \\cdot ${zl(h, 2)}}{6} \\cdot (${zl(l1, 2)} + 2 \\cdot ${zl(b, 1)}) = ${zl(v, 2)}\\,\\text{m}^3`),
    ],
  });
}

function frageVariante(stufe: Stufe): Aufgabe {
  return auswahl({
    appId: APP, formelId: 'v-rampe-variante', modus: 'ueben', stufe,
    text: 'Bei einer Rampe sind die obere Kante an der Wand und die Kante am Rampenfuß gleich lang (l2 = l3).',
    gegeben: [],
    frage: 'Welche Formel kannst du dann nehmen?',
    optionen: ['V = \\frac{h_K \\cdot h}{6} \\cdot (l_1 + 2 \\cdot l_2)', 'V = \\frac{h_K \\cdot h}{6} \\cdot (2 \\cdot l_1 + l_2)', 'V = \\frac{h_K \\cdot h}{3} \\cdot (l_1 + l_2)', 'V = h_K \\cdot h \\cdot l_1'],
    tipp: 'Setze l3 = l2 in die allgemeine Formel ein.',
    schritte: [s('l1 + l2 + l3 mit l3 = l2 ergibt l1 + 2 · l2.', 'V = \\frac{h_K \\cdot h}{6} \\cdot (l_1 + 2 \\cdot l_2)')],
  });
}

// ---------- Umstellen ----------

function umstellenH(stufe: Stufe): Aufgabe {
  const { hK, h: hWahr, l1, l2, l3 } = werte();
  const v = roundTo(rampenvolumen(hK, hWahr, l1, l2, l3), 0);
  const summe = l1 + l2 + l3;
  const h = (6 * v) / (hK * summe);
  return zahl({
    appId: APP, formelId: 'v-rampe', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Es stehen ${fmt(v, 0)} m³ Boden zur Verfügung. Wie hoch wird die Rampe an der Wand?` : `${KOERPER} Allgemeine Formel nach h umstellen.`,
    gegeben: [geg('V', 'Volumen', v, 'm³', 0), geg('h_K', 'Rampenlänge (waagerecht)', hK, 'm', 0), geg('l_1', 'Kante unten', l1, 'm', 2), geg('l_2', 'Kante oben', l2, 'm', 2), geg('l_3', 'Kante am Fuß', l3, 'm', 2)],
    frage: 'Berechne h in m.',
    gesucht: { sym: 'h', name: 'Höhe der Rampe an der Wand', einheit: 'm' },
    loesung: roundTo(h, 2), nk: 2,
    tipp: 'Mal 6, geteilt durch hK und durch die Summe der Kanten.',
    formelLatex: 'h = \\frac{6 \\cdot V}{h_K \\cdot (l_1 + l_2 + l_3)}',
    schritte: [
      s('Umstellen:', 'h = \\frac{6 \\cdot V}{h_K \\cdot (l_1 + l_2 + l_3)}'),
      s('Einsetzen:', `h = \\frac{6 \\cdot ${zl(v, 0)}}{${zl(hK, 0)} \\cdot ${zl(summe, 2)}} = ${zl(h, 3)}\\,\\text{m}`),
    ],
  });
}

function umstellenHK(stufe: Stufe): Aufgabe {
  const { hK: hWahr, h, l1, l2, l3 } = werte();
  const v = roundTo(rampenvolumen(hWahr, h, l1, l2, l3), 0);
  const summe = l1 + l2 + l3;
  const hK = (6 * v) / (h * summe);
  return zahl({
    appId: APP, formelId: 'v-rampe', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Mit ${fmt(v, 0)} m³ soll eine Rampe (h = ${fmt(h, 2)} m an der Wand) geschüttet werden. Wie lang wird sie?` : `${KOERPER} Allgemeine Formel nach hK umstellen.`,
    gegeben: [geg('V', 'Volumen', v, 'm³', 0), geg('h', 'Höhe an der Wand', h, 'm', 2), geg('l_1', 'Kante unten', l1, 'm', 2), geg('l_2', 'Kante oben', l2, 'm', 2), geg('l_3', 'Kante am Fuß', l3, 'm', 2)],
    frage: 'Berechne hK in m.',
    gesucht: { sym: 'h_K', name: 'Rampenlänge (waagerecht)', einheit: 'm' },
    loesung: roundTo(hK, 1), nk: 1,
    tipp: 'Wie bei h – nur tauschen h und hK die Rollen.',
    formelLatex: 'h_K = \\frac{6 \\cdot V}{h \\cdot (l_1 + l_2 + l_3)}',
    schritte: [
      s('Umstellen:', 'h_K = \\frac{6 \\cdot V}{h \\cdot (l_1 + l_2 + l_3)}'),
      s('Einsetzen:', `h_K = \\frac{6 \\cdot ${zl(v, 0)}}{${zl(h, 2)} \\cdot ${zl(summe, 2)}} = ${zl(hK, 2)}\\,\\text{m}`),
    ],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenCm(stufe: Stufe): Aufgabe {
  const { hK, h, l1, l2, l3 } = werte();
  const hCm = h * 100;
  const v = rampenvolumen(hK, h, l1, l2, l3);
  const f = fall(l2, l3);
  return zahl({
    appId: APP, formelId: f.formelId, modus: 'einheiten', stufe,
    text: `${KOERPER} Die Höhe an der Wand wurde in cm gemessen: ${fmt(hCm, 0)} cm. Alle anderen Maße in m. ${f.satz}`,
    gegeben: [geg('h_K', 'Rampenlänge', hK, 'm', 0), geg('h', 'Höhe an der Wand', hCm, 'cm', 0), geg('l_1', 'Kante unten', l1, 'm', 2), geg('l_2', 'Kante oben', l2, 'm', 2), geg('l_3', 'Kante am Fuß', l3, 'm', 2)],
    frage: 'Volumen in m³?',
    gesucht: { sym: 'V', name: f.gesucht, einheit: 'm³' },
    loesung: roundTo(v, 1), nk: 1,
    tipp: 'h in m umrechnen (÷ 100) – sonst ist das Volumen 100-mal zu groß.',
    schritte: [s('h in m:', `h = ${zl(hCm, 0)}\\,\\text{cm} = ${zl(h, 2)}\\,\\text{m}`), s('Einsetzen:', vSchritt(hK, h, l1, l2, l3))],
  });
}

function einheitenLkw(stufe: Stufe): Aufgabe {
  const { hK, h, l1, l2, l3 } = werte();
  const v = rampenvolumen(hK, h, l1, l2, l3);
  const f = fall(l2, l3);
  return zahl({
    appId: APP, formelId: f.formelId, modus: 'einheiten', stufe,
    text: `${KOERPER} Das Ergebnis soll für die Bestellung in Litern angegeben werden (1 m³ = 1000 l). ${f.satz}`,
    gegeben: [geg('h_K', 'Rampenlänge', hK, 'm', 0), geg('h', 'Höhe an der Wand', h, 'm', 2), geg('l_1', 'Kante unten', l1, 'm', 2), geg('l_2', 'Kante oben', l2, 'm', 2), geg('l_3', 'Kante am Fuß', l3, 'm', 2)],
    frage: 'Volumen in Litern?',
    gesucht: { sym: 'V', name: f.gesucht, einheit: 'l' },
    loesung: roundTo(v * 1000, -2), nk: 0,
    rel: 0.01,
    tipp: 'Erst m³ ausrechnen, dann × 1000.',
    schritte: [s('Volumen:', vSchritt(hK, h, l1, l2, l3)), s('In Liter:', `V = ${zl(v, 2)} \\cdot 1000 = ${zl(v * 1000, 0)}\\,\\text{l}`)],
  });
}

// ---------- Rechner ----------

function rechner(w: Record<string, number>): RechnerAusgabe {
  const { hK, h, l1, l2, l3 } = w as { hK: number; h: number; l1: number; l2: number; l3: number };
  if (![hK, h, l1, l2, l3].every(x => x >= 0) || !(hK > 0) || !(h > 0)) return { ergebnisse: [], warnungen: ['Alle Maße eingeben (hK und h > 0).'], schritte: [] };
  const v = rampenvolumen(hK, h, l1, l2, l3);
  return {
    ergebnisse: [{ sym: 'V', name: 'Volumen', wert: v, einheit: 'm³', nk: 2, hervorheben: true }],
    warnungen: [],
    schritte: [s('', vSchritt(hK, h, l1, l2, l3))],
  };
}

export const RAMPENVOLUMEN_APP: MiniAppDef = {
  id: APP,
  skizze: 'rampenvolumen',
  formelIds: ['v-rampe', 'v-rampe-variante'],
  merkhilfen: [
    'Herleitung: außen 2 dreiseitige Pyramiden (V = ⅓ · Grundfläche · Höhe), in der Mitte 1 Dreiecksäule (V = Grundfläche · Höhe).',
    'l1, l2, l3 sind die drei Kanten, die parallel zur Wand laufen. Sind zwei davon gleich, wird daraus l1 + 2 · l2.',
    'Böschung 1 : n an beiden Seiten → unten an der Wand ist die Rampe um 2 · n · h breiter als die Krone.',
    'Die Bezeichnungen hK und l1…l3 sind aus der Herleitung gedeutet – bitte mit der Skizze aus dem Unterricht vergleichen.',
  ],
  verweise: [{ label: 'Volumen berechnen (alle Körper)', link: '/zusatz/volumen' }],
  rechner: [
    {
      id: 'v', label: 'Rampenvolumen',
      felder: [
        { key: 'hK', sym: 'h_K', name: 'Rampenlänge (waagerecht)', einheit: 'm', einheiten: ['m', 'cm'], standard: 20 },
        { key: 'h', sym: 'h', name: 'Höhe an der Wand', einheit: 'm', einheiten: ['m', 'cm'], standard: 2 },
        { key: 'l1', sym: 'l_1', name: 'Kante unten an der Wand', einheit: 'm', einheiten: ['m', 'cm'], standard: 10 },
        { key: 'l2', sym: 'l_2', name: 'Kante oben an der Wand', einheit: 'm', einheiten: ['m', 'cm'], standard: 4 },
        { key: 'l3', sym: 'l_3', name: 'Kante am Rampenfuß', einheit: 'm', einheiten: ['m', 'cm'], standard: 4 },
      ],
      berechne: rechner,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') return (stufe === 1 ? umstellenH : randChoice([umstellenH, umstellenHK]))(stufe);
    if (modus === 'einheiten') return randChoice([einheitenCm, einheitenLkw])(stufe);
    if (stufe === 1) return uebenV(1);
    if (stufe === 2) return chance(0.15) ? frageVariante(2) : uebenV(2);
    return chance(0.5) ? uebenBoeschung(3) : uebenV(3);
  },
};

import { auswahl, geg, s, zahl } from '../kern/bauer';
import {
  AUSRUNDUNG_FAKTOR, AusrundungsStufe, MIN_AUSRUNDUNGSRADIUS, Richtung, ausrundungslaenge, ausrundungsradius,
  geschwindigkeitAusAusrundung, kuppeOderWanne, neigungsArt, neigungsdifferenz, neigungsdifferenzAusTangente,
  ordinateAusrundung, radiusAusTangente, tangentenlaenge,
} from '../kern/formeln';
import { Aufgabe, AufgabenModus, Gegeben, MiniAppDef, RechnerAusgabe, Schritt, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

const APP = 'ausrundung';

interface Paar {
  s1: number; r1: Richtung; s2: number; r2: Richtung;
  art: 'gleichgerichtet' | 'entgegengesetzt';
  ds: number;
  form: 'kuppe' | 'wanne';
}

const RICHTUNG_TEXT: Record<Richtung, string> = { steigung: 'Steigung', gefaelle: 'Gefälle', waagerecht: 'waagerecht' };

function neigungText(s: number, r: Richtung): string {
  return r === 'waagerecht' ? 'waagerecht (0 ‰)' : `${fmt(s, 1)} ‰ ${RICHTUNG_TEXT[r]}`;
}

function neigungspaar(fall?: 'gleich' | 'entgegen' | 'waagerecht'): Paar {
  const f = fall ?? randChoice(['gleich', 'entgegen', 'entgegen', 'waagerecht'] as const);
  let s1: number; let s2: number; let r1: Richtung; let r2: Richtung;
  if (f === 'entgegen') {
    r1 = randChoice(['steigung', 'gefaelle'] as const);
    r2 = r1 === 'steigung' ? 'gefaelle' : 'steigung';
    s1 = randStep(2, 25, 0.5);
    s2 = randStep(2, 25, 0.5);
  } else if (f === 'gleich') {
    r1 = randChoice(['steigung', 'gefaelle'] as const);
    r2 = r1;
    s1 = randStep(3, 25, 0.5);
    do { s2 = randStep(1, 25, 0.5); } while (Math.abs(s1 - s2) < 2);
  } else {
    const vorn = chance(0.5);
    const r = randChoice(['steigung', 'gefaelle'] as const);
    const sn = randStep(3, 25, 0.5);
    r1 = vorn ? 'waagerecht' : r; s1 = vorn ? 0 : sn;
    r2 = vorn ? r : 'waagerecht'; s2 = vorn ? sn : 0;
  }
  const art = neigungsArt(r1, r2);
  return { s1, r1, s2, r2, art, ds: neigungsdifferenz(s1, s2, art), form: kuppeOderWanne(s1, r1, s2, r2) };
}

function neigungGegeben(p: Paar): Gegeben[] {
  return [
    geg('s_1', `Neigung vor dem Neigungswechsel – ${RICHTUNG_TEXT[p.r1]}`, p.s1, '‰', 1),
    geg('s_2', `Neigung nach dem Neigungswechsel – ${RICHTUNG_TEXT[p.r2]}`, p.s2, '‰', 1),
  ];
}

function dsSchritt(p: Paar): Schritt {
  if (p.art === 'entgegengesetzt') {
    return s(`${RICHTUNG_TEXT[p.r1]} → ${RICHTUNG_TEXT[p.r2]}: entgegengesetzte Neigung (${p.form === 'kuppe' ? 'Kuppe' : 'Wanne'}) → addieren:`,
      `s_1 + s_2 = ${zl(p.s1, 1)} + ${zl(p.s2, 1)} = ${zl(p.ds, 1)}\\,‰`);
  }
  const a = Math.max(p.s1, p.s2); const b = Math.min(p.s1, p.s2);
  const wort = p.r1 === 'waagerecht' || p.r2 === 'waagerecht' ? 'Waagerechte ↔ Neigung' : 'gleichgerichtete Neigung';
  return s(`${wort} (${p.form === 'kuppe' ? 'Kuppe' : 'Wanne'}) → abziehen (größere minus kleinere):`,
    `s_1 - s_2 = ${zl(a, 1)} - ${zl(b, 1)} = ${zl(p.ds, 1)}\\,‰`);
}

function formelIdFuer(p: Paar): string {
  return p.art === 'entgegengesetzt' ? 'lta-entgegen' : 'lta-gleich';
}

function ltaLatex(p: Paar): string {
  return p.art === 'entgegengesetzt' ? 'l_{ta} = \\frac{r_a}{2} \\cdot \\frac{s_1 + s_2}{1000}' : 'l_{ta} = \\frac{r_a}{2} \\cdot \\frac{s_1 - s_2}{1000}';
}

function ltaSchritt(ra: number, p: Paar, lta: number): Schritt {
  return s('Tangentenlänge:', `l_{ta} = \\frac{${zl(ra, 0)}}{2} \\cdot \\frac{${zl(p.ds, 1)}}{1000} = ${zl(ra / 2, 0)} \\cdot ${zl(p.ds / 1000, 4)} = ${zl(lta, 2)}\\,\\text{m}`);
}

const STUFE_TEXT: Record<AusrundungsStufe, string> = {
  regel: 'Regelwert (0,40)',
  ermessen: 'Ermessensgrenzwert (0,25)',
  genehmigungKuppe: 'Genehmigungsbereich Kuppe (0,16)',
  genehmigungWanne: 'Genehmigungsbereich Wanne (0,13)',
};

/** Symbol wie in der Formelsammlung (Tim, 2026-11-10: nur „ra“ bei gesuchtem reg ra war verwirrend) */
const RA_SYM: Record<AusrundungsStufe, string> = {
  regel: '\\text{reg } r_a',
  ermessen: '\\text{min } r_a',
  genehmigungKuppe: 'r_a',
  genehmigungWanne: 'r_a',
};
/** dasselbe als Klartext für Frage-Sätze */
const RA_KURZ: Record<AusrundungsStufe, string> = {
  regel: 'reg ra (Regelwert)',
  ermessen: 'min ra (Ermessensgrenzwert)',
  genehmigungKuppe: 'ra (Genehmigungsbereich, Kuppe)',
  genehmigungWanne: 'ra (Genehmigungsbereich, Wanne)',
};
const RA_NAME: Record<AusrundungsStufe, string> = {
  regel: 'Ausrundungsradius – Regelwert',
  ermessen: 'Ausrundungsradius – Ermessensgrenzwert',
  genehmigungKuppe: 'Ausrundungsradius – Genehmigungsbereich (Kuppe)',
  genehmigungWanne: 'Ausrundungsradius – Genehmigungsbereich (Wanne)',
};

/** Kleine Textaufgaben (Baustellen-Situation) – die Frage-Zeile „Berechne …“ bleibt zusätzlich stehen */
function raTextaufgabe(ve: number, st: AusrundungsStufe): string {
  const ort = randChoice(['Bei einer Streckenerneuerung', 'Beim Umbau eines Bahnhofskopfes', 'Für eine neue Verbindungskurve', 'Bei der Planung einer Ausbaustrecke']);
  switch (st) {
    case 'regel':
      return `${ort} mit ve = ${ve} km/h wird ein Neigungswechsel neu ausgerundet. Der Planer will den Regelwert einhalten.`;
    case 'ermessen':
      return `${ort} (ve = ${ve} km/h) reicht der Platz für den Regelwert nicht. Es soll mit dem Ermessensgrenzwert ausgerundet werden.`;
    case 'genehmigungKuppe':
      return `${ort} (ve = ${ve} km/h) liegt der Neigungswechsel auf einer Kuppe. Nur mit Genehmigung geht es noch enger – gesucht ist der Radius im Genehmigungsbereich.`;
    default:
      return `${ort} (ve = ${ve} km/h) liegt der Neigungswechsel in einer Wanne. Nur mit Genehmigung geht es noch enger – gesucht ist der Radius im Genehmigungsbereich.`;
  }
}

function raSchritte(ve: number, stufe: AusrundungsStufe): { ra: number; schritte: Schritt[] } {
  const r = ausrundungsradius(ve, stufe);
  const f = AUSRUNDUNG_FAKTOR[stufe];
  const schritte = [s(`Ausrundungsradius, ${STUFE_TEXT[stufe]}:`, `${RA_SYM[stufe]} = ${zl(f, 2)} \\cdot ${zl(ve, 0)}^2 = ${zl(f, 2)} \\cdot ${zl(ve * ve, 0)} = ${zl(r.roh, 0)}\\,\\text{m}`)];
  schritte.push(r.mindestGreift
    ? s(`${fmt(r.roh, 0)} m < 2000 m → Mindestwert gilt:`, `${RA_SYM[stufe]} = 2000\\,\\text{m}`)
    : s(`${fmt(r.roh, 0)} m ≥ 2000 m → Mindestradius eingehalten.`));
  return { ra: r.ra, schritte };
}

// ---------- Üben ----------

function uebenLta(stufe: Stufe): Aufgabe {
  const p = neigungspaar();
  const ra = randStep(2000, 20000, 500);
  const lta = tangentenlaenge(ra, p.ds);
  return zahl({
    appId: APP, formelId: formelIdFuer(p), modus: 'ueben', stufe,
    text: stufe >= 2 ? `Im Längsschnitt geht ${neigungText(p.s1, p.r1)} in ${neigungText(p.s2, p.r2)} über. Der Neigungswechsel wird mit ra = ${fmt(ra, 0)} m ausgerundet.` : undefined,
    gegeben: [geg('r_a', 'Ausrundungsradius', ra, 'm', 0), ...neigungGegeben(p)],
    frage: 'Berechne die Tangentenlänge lta in m.',
    gesucht: { sym: 'l_{ta}', name: 'Tangentenlänge', einheit: 'm' },
    loesung: roundTo(lta, 2), nk: 2,
    tipp: 'Gleiche Richtung → (s1 − s2), entgegengesetzt → (s1 + s2). Waagerecht zählt als gleichgerichtet (s = 0).',
    formelLatex: ltaLatex(p),
    schritte: [dsSchritt(p), ltaSchritt(ra, p, lta)],
  });
}

function uebenRa(stufe: Stufe): Aufgabe {
  const ve = randStep(stufe === 1 ? 80 : 50, 250, 10);
  const st: AusrundungsStufe = stufe === 1 ? 'regel' : randChoice(['regel', 'ermessen', 'genehmigungKuppe', 'genehmigungWanne'] as const);
  const { ra, schritte } = raSchritte(ve, st);
  const formelId = st === 'regel' ? 'ra-regel' : st === 'ermessen' ? 'ra-ermessen' : 'ra-genehmigung';
  const wo = st === 'genehmigungKuppe' ? 'auf einer Kuppe' : st === 'genehmigungWanne' ? 'in einer Wanne' : '';
  return zahl({
    appId: APP, formelId, modus: 'ueben', stufe,
    // Mal als Textaufgabe, mal nur mit den Angaben (Tim, 2026-11-10)
    text: Math.random() < 0.5
      ? raTextaufgabe(ve, st)
      : stufe >= 2 ? `Für einen Neigungswechsel ${wo} (ve = ${ve} km/h) soll der Ausrundungsradius nach ${STUFE_TEXT[st].replace(/ \(.*\)/, '')} bestimmt werden.` : undefined,
    gegeben: [geg('v_e', 'Entwurfsgeschwindigkeit', ve, 'km/h', 0)],
    frage: `Berechne ${RA_KURZ[st]} in m (Mindestwert beachten!).`,
    gesucht: { sym: RA_SYM[st], name: RA_NAME[st], einheit: 'm' },
    loesung: roundTo(ra, 0), nk: 0, rel: 0.002,
    tipp: 'Regel 0,40 · Ermessen 0,25 · Genehmigung 0,16 (Kuppe) / 0,13 (Wanne) – mal ve². Und nie unter 2000 m.',
    schritte,
  });
}

function uebenKette(stufe: Stufe): Aufgabe {
  const p = neigungspaar();
  const ve = randStep(60, 200, 10);
  const r = raSchritte(ve, 'regel');
  const lta = tangentenlaenge(r.ra, p.ds);
  const ziel = randChoice(['la', 'ymax', 'yx'] as const);
  const x = roundTo(randStep(0.3, 0.8, 0.1) * lta, 0) || 1;
  const schritte = [...r.schritte, dsSchritt(p), ltaSchritt(r.ra, p, lta)];
  let frage: string; let gesucht: { sym: string; name: string; einheit: string }; let loesung: number; let nk: number; let formelId: string;
  if (ziel === 'la') {
    const la = ausrundungslaenge(lta);
    schritte.push(s('Länge der Ausrundung:', `l_a \\approx 2 \\cdot l_{ta} = 2 \\cdot ${zl(lta, 2)} = ${zl(la, 2)}\\,\\text{m}`));
    frage = 'Wie lang ist die gesamte Ausrundung la (AA bis AE) in m?';
    gesucht = { sym: 'l_a', name: 'Länge der Ausrundung', einheit: 'm' }; loesung = roundTo(la, 2); nk = 2; formelId = 'la-ausrundung';
  } else {
    const xx = ziel === 'ymax' ? lta : x;
    const y = ordinateAusrundung(xx, r.ra);
    // Kleine Werte (< 20 mm) mit einer Nachkommastelle – im Lösungsweg genauso wie in der Lösung
    const yNk = y * 1000 < 20 ? 1 : 0;
    schritte.push(s(ziel === 'ymax' ? 'Größte Ordinate am TS (x = lta):' : `Ordinate bei x = ${fmt(x, 0)} m:`,
      `y = \\frac{${zl(xx, 2)}^2}{2 \\cdot ${zl(r.ra, 0)}} = ${zl(y, 5)}\\,\\text{m} = ${zl(y * 1000, yNk)}\\,\\text{mm}`));
    frage = ziel === 'ymax' ? 'Wie groß ist das Absteckmaß y am Tangentenschnittpunkt TS in mm?' : `Wie groß ist das Absteckmaß y bei x = ${fmt(x, 0)} m (ab AA) in mm?`;
    gesucht = { sym: 'y', name: 'Absteckmaß', einheit: 'mm' }; nk = y * 1000 < 20 ? 1 : 0; loesung = roundTo(y * 1000, nk); formelId = 'y-ausrundung';
  }
  return zahl({
    appId: APP, formelId, modus: 'ueben', stufe,
    text: `Strecke mit ve = ${ve} km/h: ${neigungText(p.s1, p.r1)} geht in ${neigungText(p.s2, p.r2)} über. Ausgerundet wird mit dem Regelwert.`,
    gegeben: [geg('v_e', 'Entwurfsgeschwindigkeit', ve, 'km/h', 0), ...neigungGegeben(p)],
    frage,
    gesucht, loesung, nk, rel: 0.015,
    tipp: 'In drei Schritten: ra aus ve → lta aus ra und Neigungen → gesuchte Größe.',
    formelLatex: `r_a = 0{,}40 \\cdot v_e^2 \\qquad ${ltaLatex(p)} \\qquad y = \\frac{x^2}{2 r_a}`,
    schritte,
  });
}

function frageKuppeWanne(stufe: Stufe): Aufgabe {
  const p = neigungspaar();
  return auswahl({
    appId: APP, formelId: formelIdFuer(p), modus: 'ueben', stufe,
    text: `In Fahrtrichtung geht ${neigungText(p.s1, p.r1)} in ${neigungText(p.s2, p.r2)} über.`,
    gegeben: [],
    frage: 'Liegt eine Kuppe oder eine Wanne vor?',
    optionen: p.form === 'kuppe' ? ['Kuppe', 'Wanne'] : ['Wanne', 'Kuppe'],
    mischen: false,
    tipp: 'Wird es in Fahrtrichtung „bergab-iger“ (Neigung nimmt ab), ist es eine Kuppe. Wird es „bergauf-iger“, eine Wanne.',
    schritte: [s(p.form === 'kuppe'
      ? 'Die Neigung nimmt in Fahrtrichtung ab (Steigung wird flacher bzw. geht ins Gefälle über) → Kuppe (Hochpunkt).'
      : 'Die Neigung nimmt in Fahrtrichtung zu (Gefälle wird flacher bzw. geht in Steigung über) → Wanne (Tiefpunkt).')],
  });
}

function sortiereKuppeWanne(a: Aufgabe): Aufgabe {
  if (a.art !== 'auswahl') return a;
  const optionen = ['Kuppe', 'Wanne'];
  return { ...a, optionen, richtig: optionen.indexOf(a.optionen[0]) };
}

function frageArt(stufe: Stufe): Aufgabe {
  const p = neigungspaar();
  const richtig = p.art === 'entgegengesetzt' ? 's_1 + s_2' : 's_1 - s_2';
  const a = auswahl({
    appId: APP, formelId: formelIdFuer(p), modus: 'ueben', stufe,
    text: `Neigungswechsel: ${neigungText(p.s1, p.r1)} → ${neigungText(p.s2, p.r2)}.`,
    gegeben: [],
    frage: 'Mit welcher Neigungsdifferenz rechnest du die Tangentenlänge?',
    optionen: [richtig, richtig === 's_1 + s_2' ? 's_1 - s_2' : 's_1 + s_2'],
    mischen: false,
    tipp: 'Gleiche Richtung (oder eine Seite waagerecht) → abziehen. Entgegengesetzt → addieren.',
    schritte: [dsSchritt(p)],
  });
  if (a.art !== 'auswahl') return a;
  const optionen = ['s_1 - s_2', 's_1 + s_2'];
  return { ...a, optionen, richtig: optionen.indexOf(richtig) };
}

function frageMindest(stufe: Stufe): Aufgabe {
  const ve = randChoice([50, 60, 70, 80, 90, 100, 110, 120]);
  const st = randChoice(['regel', 'ermessen', 'genehmigungKuppe', 'genehmigungWanne'] as const);
  const r = ausrundungsradius(ve, st);
  const a = auswahl({
    appId: APP, formelId: st === 'regel' ? 'ra-regel' : st === 'ermessen' ? 'ra-ermessen' : 'ra-genehmigung', modus: 'ueben', stufe,
    text: `ve = ${ve} km/h, Ausrundung nach ${STUFE_TEXT[st]}.`,
    gegeben: [],
    frage: `Welcher Wert ist für ${RA_KURZ[st]} anzusetzen?`,
    optionen: r.mindestGreift ? [`2000 m (Mindestwert)`, `${fmt(r.roh, 0)} m`] : [`${fmt(r.roh, 0)} m`, `2000 m (Mindestwert)`],
    tipp: 'Erst rechnen, dann mit 2000 m vergleichen.',
    schritte: raSchritte(ve, st).schritte,
  });
  return a;
}

// ---------- Umstellen ----------

function umstellenRa(stufe: Stufe): Aufgabe {
  const p = neigungspaar();
  const raW = randStep(2000, 20000, 500);
  const lta = roundTo(tangentenlaenge(raW, p.ds), 2);
  const ra = radiusAusTangente(lta, p.ds);
  return zahl({
    appId: APP, formelId: 'ra-aus-lta', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Im Bestand misst du vom TS bis zum Ausrundungsanfang ${fmt(lta, 2)} m. Neigungen: ${neigungText(p.s1, p.r1)} → ${neigungText(p.s2, p.r2)}.` : undefined,
    gegeben: [geg('l_{ta}', 'Tangentenlänge', lta, 'm', 2), ...neigungGegeben(p)],
    frage: 'Mit welchem Ausrundungsradius ra (in m) wurde gebaut?',
    gesucht: { sym: 'r_a', name: 'Ausrundungsradius', einheit: 'm' },
    loesung: roundTo(ra, 0), nk: 0,
    tipp: 'lta-Formel nach ra umstellen: aus „/2“ und „/1000“ wird „2000 ·“.',
    formelLatex: p.art === 'entgegengesetzt' ? 'r_a = \\frac{2000 \\cdot l_{ta}}{s_1 + s_2}' : 'r_a = \\frac{2000 \\cdot l_{ta}}{s_1 - s_2}',
    schritte: [dsSchritt(p), s('Umgestellt einsetzen:', `r_a = \\frac{2000 \\cdot ${zl(lta, 2)}}{${zl(p.ds, 1)}} = \\frac{${zl(2000 * lta, 0)}}{${zl(p.ds, 1)}} = ${zl(ra, 0)}\\,\\text{m}`)],
  });
}

function umstellenDs(stufe: Stufe): Aufgabe {
  const ra = randStep(4000, 20000, 1000);
  const lta = randStep(20, 120, 5);
  const ds = neigungsdifferenzAusTangente(lta, ra);
  return zahl({
    appId: APP, formelId: 'ra-aus-lta', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Wegen einer Brücke darf die Ausrundung (ra = ${fmt(ra, 0)} m) höchstens eine Tangentenlänge von ${lta} m haben.` : undefined,
    gegeben: [geg('r_a', 'Ausrundungsradius', ra, 'm', 0), geg('l_{ta}', 'Tangentenlänge', lta, 'm', 0)],
    frage: 'Wie groß darf die Neigungsdifferenz Δs höchstens sein (in ‰)?',
    gesucht: { sym: '\\Delta s', name: 'Neigungsdifferenz', einheit: '‰' },
    loesung: roundTo(ds, 2), nk: 2,
    tipp: 'lta-Formel nach (s1 ∓ s2) umstellen.',
    formelLatex: '\\Delta s = \\frac{2000 \\cdot l_{ta}}{r_a}',
    schritte: [s('Umstellen:', '\\Delta s = \\frac{2000 \\cdot l_{ta}}{r_a}'), s('Einsetzen:', `\\Delta s = \\frac{2000 \\cdot ${zl(lta, 0)}}{${zl(ra, 0)}} = ${zl(ds, 2)}\\,‰`)],
  });
}

function umstellenVe(stufe: Stufe): Aufgabe {
  const ra = randStep(3000, 25000, 500);
  const ve = geschwindigkeitAusAusrundung(ra, 'regel');
  return zahl({
    appId: APP, formelId: 'ra-regel', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Eine bestehende Ausrundung hat ra = ${fmt(ra, 0)} m. Für welche Entwurfsgeschwindigkeit reicht sie nach dem Regelwert?` : undefined,
    gegeben: [geg('r_a', 'Ausrundungsradius', ra, 'm', 0)],
    frage: 'Berechne ve in km/h (Regelwert 0,40).',
    gesucht: { sym: 'v_e', name: 'Entwurfsgeschwindigkeit', einheit: 'km/h' },
    loesung: roundTo(ve, 1), nk: 1,
    tipp: 'Durch 0,40 teilen, dann Wurzel ziehen.',
    formelLatex: 'v_e = \\sqrt{\\frac{r_a}{0{,}40}}',
    schritte: [s('Umstellen:', 'v_e = \\sqrt{\\frac{r_a}{0{,}40}}'), s('Einsetzen:', `v_e = \\sqrt{\\frac{${zl(ra, 0)}}{0{,}40}} = \\sqrt{${zl(ra / 0.4, 0)}} = ${zl(ve, 1)}\\,\\text{km/h}`)],
  });
}

function umstellenX(stufe: Stufe): Aufgabe {
  const ra = randStep(2000, 20000, 500);
  const yMm = randStep(5, 150, 5);
  const x = Math.sqrt(2 * ra * (yMm / 1000));
  return zahl({
    appId: APP, formelId: 'y-ausrundung', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `In der Ausrundung (ra = ${fmt(ra, 0)} m) soll das Absteckmaß genau ${yMm} mm betragen.` : undefined,
    gegeben: [geg('r_a', 'Ausrundungsradius', ra, 'm', 0), geg('y', 'Absteckmaß', yMm, 'mm', 0)],
    frage: 'In welchem Abstand x vom AA (in m) liegt dieser Punkt?',
    gesucht: { sym: 'x', name: 'Abstand vom AA', einheit: 'm' },
    loesung: roundTo(x, 2), nk: 2,
    tipp: 'y in m umrechnen, dann x = √(2·ra·y).',
    formelLatex: 'x = \\sqrt{2 \\cdot r_a \\cdot y}',
    schritte: [s('y in m:', `y = ${zl(yMm, 0)}\\,\\text{mm} = ${zl(yMm / 1000, 3)}\\,\\text{m}`), s('Einsetzen:', `x = \\sqrt{2 \\cdot ${zl(ra, 0)} \\cdot ${zl(yMm / 1000, 3)}} = ${zl(x, 2)}\\,\\text{m}`)],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenProzent(stufe: Stufe): Aufgabe {
  const p = neigungspaar(randChoice(['gleich', 'entgegen'] as const));
  const ra = randStep(2000, 20000, 500);
  const lta = tangentenlaenge(ra, p.ds);
  return zahl({
    appId: APP, formelId: formelIdFuer(p), modus: 'einheiten', stufe,
    text: `Im Längsschnitt stehen die Neigungen in Prozent: ${fmt(p.s1 / 10, 2)} % ${RICHTUNG_TEXT[p.r1]} → ${fmt(p.s2 / 10, 2)} % ${RICHTUNG_TEXT[p.r2]}. ra = ${fmt(ra, 0)} m.`,
    gegeben: [geg('r_a', 'Ausrundungsradius', ra, 'm', 0),
      geg('s_1', `Neigung vorher – ${RICHTUNG_TEXT[p.r1]}`, p.s1 / 10, '%', 2), geg('s_2', `Neigung nachher – ${RICHTUNG_TEXT[p.r2]}`, p.s2 / 10, '%', 2)],
    frage: 'Berechne die Tangentenlänge lta in m.',
    gesucht: { sym: 'l_{ta}', name: 'Tangentenlänge', einheit: 'm' },
    loesung: roundTo(lta, 2), nk: 2,
    tipp: 'Die Formel braucht ‰! 1 % = 10 ‰.',
    formelLatex: ltaLatex(p),
    schritte: [s('In Promille umrechnen (× 10):', `s_1 = ${zl(p.s1 / 10, 2)}\\,\\% = ${zl(p.s1, 1)}\\,‰, \\quad s_2 = ${zl(p.s2 / 10, 2)}\\,\\% = ${zl(p.s2, 1)}\\,‰`), dsSchritt(p), ltaSchritt(ra, p, lta)],
  });
}

function einheitenRaKm(stufe: Stufe): Aufgabe {
  const raKm = randStep(2, 20, 0.5);
  const ra = raKm * 1000;
  const x = randStep(5, 60, 1);
  const y = ordinateAusrundung(x, ra);
  return zahl({
    appId: APP, formelId: 'y-ausrundung', modus: 'einheiten', stufe,
    text: `Ausrundungsradius laut Plan: ${fmt(raKm, 1)} km. Absteckpunkt ${x} m hinter dem AA.`,
    gegeben: [geg('r_a', 'Ausrundungsradius', raKm, 'km', 1), geg('x', 'Abstand vom AA', x, 'm', 0)],
    frage: 'Berechne das Absteckmaß y in mm.',
    gesucht: { sym: 'y', name: 'Absteckmaß', einheit: 'mm' },
    loesung: roundTo(y * 1000, 1), nk: 1,
    tipp: 'ra in m (× 1000), y kommt in m – für mm × 1000.',
    schritte: [s('ra in m:', `r_a = ${zl(raKm, 1)}\\,\\text{km} = ${zl(ra, 0)}\\,\\text{m}`), s('Einsetzen:', `y = \\frac{${zl(x, 0)}^2}{2 \\cdot ${zl(ra, 0)}} = ${zl(y, 5)}\\,\\text{m} = ${zl(y * 1000, 1)}\\,\\text{mm}`)],
  });
}

function einheitenMs(stufe: Stufe): Aufgabe {
  const ve = randStep(60, 250, 10);
  const ms = ve / 3.6;
  const msR = roundTo(ms, 2);
  const veR = msR * 3.6;
  const r = ausrundungsradius(veR, 'regel');
  return zahl({
    appId: APP, formelId: 'ra-regel', modus: 'einheiten', stufe,
    text: `Die Geschwindigkeit ist in m/s angegeben: v = ${fmt(msR, 2)} m/s.`,
    gegeben: [geg('v_e', 'Entwurfsgeschwindigkeit', msR, 'm/s', 2)],
    frage: 'Berechne reg ra (Regelwert) in m (Mindestwert beachten).',
    gesucht: { sym: RA_SYM.regel, name: RA_NAME.regel, einheit: 'm' },
    loesung: roundTo(r.ra, 0), nk: 0,
    tipp: 'Die Formel braucht ve in km/h: m/s × 3,6 = km/h.',
    schritte: [s('In km/h:', `v_e = ${zl(msR, 2)} \\cdot 3{,}6 = ${zl(veR, 2)}\\,\\text{km/h}`),
      s('Regelwert:', `\\text{reg } r_a = 0{,}40 \\cdot ${zl(veR, 2)}^2 = ${zl(r.roh, 0)}\\,\\text{m}`),
      r.mindestGreift
        ? s('< 2000 m → Mindestwert ansetzen:', `\\text{reg } r_a = 2000\\,\\text{m}`)
        : s('≥ 2000 m → passt.')],
  });
}

// ---------- Rechner ----------

const RICHTUNGEN = [
  { wert: 'steigung', label: 'Steigung' },
  { wert: 'gefaelle', label: 'Gefälle' },
  { wert: 'waagerecht', label: 'waagerecht' },
];

function rechne(ra: number, s1: number, r1: Richtung, s2: number, r2: Richtung, x: number, vorher: RechnerAusgabe['schritte'], warnungen: string[]): RechnerAusgabe {
  const sa = r1 === 'waagerecht' ? 0 : s1;
  const sb = r2 === 'waagerecht' ? 0 : s2;
  const art = neigungsArt(r1, r2);
  const ds = neigungsdifferenz(sa, sb, art);
  if (ds <= 0) return { ergebnisse: [], warnungen: [...warnungen, 'Keine Neigungsänderung – es gibt nichts auszurunden.'], schritte: vorher };
  const form = kuppeOderWanne(sa, r1, sb, r2);
  const p: Paar = { s1: sa, r1, s2: sb, r2, art, ds, form };
  const lta = tangentenlaenge(ra, ds);
  const ymax = ordinateAusrundung(lta, ra);
  if (sa > 40 || sb > 40) warnungen.push('Neigung über 40 ‰ ist für Eisenbahnen ungewöhnlich steil – Eingabe prüfen (‰, nicht %).');
  const ergebnisse = [
    { sym: 'r_a', name: 'Ausrundungsradius', wert: ra, einheit: 'm', nk: 0 },
    { sym: '\\Delta s', name: art === 'entgegengesetzt' ? 's1 + s2' : 's1 − s2', wert: ds, einheit: '‰', nk: 2 },
    { sym: 'l_{ta}', name: 'Tangentenlänge', wert: lta, einheit: 'm', nk: 2, hervorheben: true },
    { sym: 'l_a', name: 'Länge der Ausrundung', wert: ausrundungslaenge(lta), einheit: 'm', nk: 2 },
    { sym: 'y_{max}', name: 'Absteckmaß am TS', wert: ymax * 1000, einheit: 'mm', nk: 1 },
  ];
  if (x > 0) {
    if (x > lta) warnungen.push(`x = ${fmt(x, 2)} m liegt hinter dem TS (lta = ${fmt(lta, 2)} m) – von der anderen Seite (AE) messen.`);
    ergebnisse.push({ sym: 'y', name: `Absteckmaß bei x = ${fmt(x, 2)} m`, wert: ordinateAusrundung(x, ra) * 1000, einheit: 'mm', nk: 1 });
  }
  return {
    ergebnisse,
    warnungen,
    schritte: [...vorher, s(`${form === 'kuppe' ? 'Kuppe' : 'Wanne'}, ${art} → ${art === 'entgegengesetzt' ? 's1 + s2' : 's1 − s2'}`), dsSchritt(p), ltaSchritt(ra, p, lta)],
  };
}

function rechnerVe(w: Record<string, number>, sw: Record<string, string>): RechnerAusgabe {
  const st = (sw['stufe'] ?? 'regel') as AusrundungsStufe;
  if (!(w['ve'] > 0)) return { ergebnisse: [], warnungen: ['ve muss größer als 0 sein.'], schritte: [] };
  const r = raSchritte(w['ve'], st);
  const warnungen = ausrundungsradius(w['ve'], st).mindestGreift ? [`Rechnerischer Radius unter 2000 m → Mindestradius ${MIN_AUSRUNDUNGSRADIUS} m wird verwendet.`] : [];
  const r1 = (sw['r1'] ?? 'steigung') as Richtung;
  const r2 = (sw['r2'] ?? 'gefaelle') as Richtung;
  const form = kuppeOderWanne(w['s1'], r1, w['s2'], r2);
  if (st === 'genehmigungKuppe' && form === 'wanne') warnungen.push('Du hast den Kuppen-Faktor gewählt, die Neigungen ergeben aber eine Wanne (Faktor 0,13).');
  if (st === 'genehmigungWanne' && form === 'kuppe') warnungen.push('Du hast den Wannen-Faktor gewählt, die Neigungen ergeben aber eine Kuppe (Faktor 0,16).');
  return rechne(r.ra, w['s1'], r1, w['s2'], r2, w['x'] ?? 0, r.schritte, warnungen);
}

function rechnerRa(w: Record<string, number>, sw: Record<string, string>): RechnerAusgabe {
  if (!(w['ra'] > 0)) return { ergebnisse: [], warnungen: ['ra muss größer als 0 sein.'], schritte: [] };
  const warnungen = w['ra'] < MIN_AUSRUNDUNGSRADIUS ? ['ra liegt unter dem Mindestwert von 2000 m.'] : [];
  return rechne(w['ra'], w['s1'], (sw['r1'] ?? 'steigung') as Richtung, w['s2'], (sw['r2'] ?? 'gefaelle') as Richtung, w['x'] ?? 0, [], warnungen);
}

export const AUSRUNDUNG_APP: MiniAppDef = {
  id: APP,
  skizze: 'ausrundung',
  formelIds: ['ra-regel', 'ra-ermessen', 'ra-genehmigung', 'lta-gleich', 'lta-entgegen', 'ra-aus-lta', 'la-ausrundung', 'y-ausrundung'],
  merkhilfen: [
    'TS = Tangentenschnittpunkt (Neigungswechsel), AA = Ausrundungsanfang, AE = Ausrundungsende. Von AA bis TS und von TS bis AE ist jeweils lta.',
    'Gleiche Richtung (beide Steigung, beide Gefälle oder eine Seite waagerecht) → s1 − s2. Entgegengesetzt (Steigung ↔ Gefälle) → s1 + s2.',
    'Kuppe = Hochpunkt (Neigung nimmt in Fahrtrichtung ab). Wanne = Tiefpunkt (Neigung nimmt zu).',
    'Radien: Regel 0,40 · ve² – Ermessen 0,25 · ve² – Genehmigung 0,16 · ve² (Kuppe) bzw. 0,13 · ve² (Wanne). In jedem Fall mindestens 2000 m.',
    'Handnotiz: Bei Straßenbahn immer mit 0,25 rechnen.',
  ],
  verweise: [{ label: 'Ausrundungen im Trassenplan rechnen', link: '/zusatz/trassenplan' }],
  rechner: [
    {
      id: 've', label: 'Aus ve',
      felder: [
        { key: 've', sym: 'v_e', name: 'Entwurfsgeschwindigkeit', einheit: 'km/h', einheiten: ['km/h', 'm/s'], standard: 120 },
        { key: 's1', sym: 's_1', name: 'Neigung vorher', einheit: '‰', einheiten: ['‰', '%'], standard: 10 },
        { key: 's2', sym: 's_2', name: 'Neigung nachher', einheit: '‰', einheiten: ['‰', '%'], standard: 6 },
        { key: 'x', sym: 'x', name: 'Absteckpunkt ab AA (optional)', einheit: 'm', einheiten: ['m'], standard: 0 },
      ],
      schalter: [
        { key: 'stufe', label: 'Radius nach', optionen: [
          { wert: 'regel', label: 'Regel 0,40' }, { wert: 'ermessen', label: 'Ermessen 0,25' },
          { wert: 'genehmigungKuppe', label: 'Genehm. Kuppe 0,16' }, { wert: 'genehmigungWanne', label: 'Genehm. Wanne 0,13' }] },
        { key: 'r1', label: 's1 ist', optionen: RICHTUNGEN },
        { key: 'r2', label: 's2 ist', optionen: [RICHTUNGEN[1], RICHTUNGEN[0], RICHTUNGEN[2]] },
      ],
      berechne: rechnerVe,
    },
    {
      id: 'ra', label: 'Aus ra',
      felder: [
        { key: 'ra', sym: 'r_a', name: 'Ausrundungsradius', einheit: 'm', einheiten: ['m', 'km'], standard: 5000 },
        { key: 's1', sym: 's_1', name: 'Neigung vorher', einheit: '‰', einheiten: ['‰', '%'], standard: 12 },
        { key: 's2', sym: 's_2', name: 'Neigung nachher', einheit: '‰', einheiten: ['‰', '%'], standard: 4 },
        { key: 'x', sym: 'x', name: 'Absteckpunkt ab AA (optional)', einheit: 'm', einheiten: ['m'], standard: 0 },
      ],
      schalter: [
        { key: 'r1', label: 's1 ist', optionen: RICHTUNGEN },
        { key: 'r2', label: 's2 ist', optionen: RICHTUNGEN },
      ],
      berechne: rechnerRa,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') {
      return (stufe === 1 ? randChoice([umstellenRa, umstellenVe]) : randChoice([umstellenRa, umstellenDs, umstellenVe, umstellenX]))(stufe);
    }
    if (modus === 'einheiten') {
      return randChoice([einheitenProzent, einheitenRaKm, einheitenMs])(stufe);
    }
    if (stufe === 1) return chance(0.5) ? uebenRa(1) : uebenLta(1);
    if (stufe === 2) {
      const z = Math.random();
      if (z < 0.15) return sortiereKuppeWanne(frageKuppeWanne(2));
      if (z < 0.3) return frageArt(2);
      return chance(0.4) ? uebenRa(2) : uebenLta(2);
    }
    const z = Math.random();
    if (z < 0.15) return frageMindest(3);
    if (z < 0.25) return sortiereKuppeWanne(frageKuppeWanne(3));
    return uebenKette(3);
  },
};

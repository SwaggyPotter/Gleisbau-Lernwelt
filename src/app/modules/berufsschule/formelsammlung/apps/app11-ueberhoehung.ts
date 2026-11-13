import { auswahl, geg, s, zahl } from '../kern/bauer';
import {
  ausgleichendeUeberhoehung, fahrtEinordnen, geschwindigkeitAusU0, mindestueberhoehung, radiusAusU0, radiusAusUeberhoehung,
  regelueberhoehung, ueberhoehungsfehlbetrag, zulGeschwindigkeit,
} from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Schritt, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

const APP = 'ueberhoehung';
const ZUL_UF = [80, 100, 110, 130, 150] as const;

function radius(): number {
  return randStep(400, 4000, 50);
}

function geschw(): number {
  return randStep(60, 200, 10);
}

/** v/r-Paar mit realistischem u0 (20–300 mm). */
function vr(): { v: number; r: number } {
  for (;;) {
    const v = geschw();
    const r = radius();
    const u0 = ausgleichendeUeberhoehung(v, r);
    if (u0 >= 20 && u0 <= 300) return { v, r };
  }
}

function u0Schritt(v: number, r: number): Schritt {
  const u0 = ausgleichendeUeberhoehung(v, r);
  return s('Ausgleichende Überhöhung:', `u_0 = \\frac{11{,}8 \\cdot ${zl(v, 0)}^2}{${zl(r, 0)}} = \\frac{11{,}8 \\cdot ${zl(v * v, 0)}}{${zl(r, 0)}} = ${zl(u0, 1)}\\,\\text{mm}`);
}

// ---------- Üben ----------

function uebenU0(stufe: Stufe): Aufgabe {
  const { v, r } = vr();
  const u0 = ausgleichendeUeberhoehung(v, r);
  return zahl({
    appId: APP, formelId: 'u0', modus: 'ueben', stufe,
    text: stufe >= 2 ? `Ein Bogen mit r = ${fmt(r, 0)} m wird mit v = ${v} km/h befahren. Bei welcher Überhöhung spüren die Fahrgäste keine Seitenbeschleunigung?` : undefined,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('r', 'Radius', r, 'm', 0)],
    frage: 'Berechne die ausgleichende Überhöhung u0 in mm.',
    gesucht: { sym: 'u_0', name: 'Ausgleichende Überhöhung', einheit: 'mm' },
    loesung: roundTo(u0, 1), nk: 1,
    tipp: 'v als Zahl in km/h, r in m einsetzen – das Ergebnis ist direkt in mm.',
    schritte: [u0Schritt(v, r)],
  });
}

function uebenRegU(stufe: Stufe): Aufgabe {
  const { v, r } = vr();
  const version = stufe === 1 ? 'neu' : randChoice(['alt', 'neu'] as const);
  const u = regelueberhoehung(v, r, version);
  const f = version === 'alt' ? '7{,}1' : '6{,}5';
  return zahl({
    appId: APP, formelId: version === 'alt' ? 'regu-alt' : 'regu-neu', modus: 'ueben', stufe,
    text: stufe >= 2 ? `Für einen Bogen (r = ${fmt(r, 0)} m, v = ${v} km/h) soll die Regelüberhöhung nach der ${version === 'alt' ? 'alten' : 'neuen'} Formel bestimmt werden.` : undefined,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('r', 'Radius', r, 'm', 0)],
    frage: `Berechne reg u (${version}) in mm.`,
    gesucht: { sym: '\\text{reg } u', name: 'Regelüberhöhung', einheit: 'mm' },
    loesung: roundTo(u, 1), nk: 1,
    tipp: 'Gleicher Aufbau wie u0, nur mit anderem Faktor: alt 7,1 – neu 6,5.',
    schritte: [s(`Regelüberhöhung (${version}):`, `\\text{reg } u = \\frac{${f} \\cdot ${zl(v, 0)}^2}{${zl(r, 0)}} = ${zl(u, 1)}\\,\\text{mm}`)],
  });
}

function uebenMinU(stufe: Stufe): Aufgabe {
  let v: number; let r: number; let uf: number; let minu: number;
  do {
    ({ v, r } = vr());
    uf = randChoice(ZUL_UF);
    minu = mindestueberhoehung(v, r, uf);
  } while (minu < 5);
  return zahl({
    appId: APP, formelId: 'minu', modus: 'ueben', stufe,
    text: stufe >= 2 ? `Bogen r = ${fmt(r, 0)} m, zulässige Geschwindigkeit ${v} km/h, zulässiger Überhöhungsfehlbetrag ${uf} mm. Welche Überhöhung muss mindestens eingebaut werden?` : undefined,
    gegeben: [geg('\\text{zul } v', 'Zulässige Geschwindigkeit', v, 'km/h', 0), geg('r', 'Radius', r, 'm', 0), geg('\\text{zul } u_f', 'Zulässiger Fehlbetrag', uf, 'mm', 0)],
    frage: 'Berechne die Mindestüberhöhung min u in mm.',
    gesucht: { sym: '\\text{min } u', name: 'Mindestüberhöhung', einheit: 'mm' },
    loesung: roundTo(minu, 1), nk: 1,
    tipp: 'Erst u0 ausrechnen, dann den erlaubten Fehlbetrag abziehen.',
    schritte: [u0Schritt(v, r), s('Fehlbetrag abziehen:', `\\text{min } u = ${zl(ausgleichendeUeberhoehung(v, r), 1)} - ${zl(uf, 0)} = ${zl(minu, 1)}\\,\\text{mm}`)],
  });
}

function uebenUf(stufe: Stufe): Aufgabe {
  const { v, r } = vr();
  const u0 = ausgleichendeUeberhoehung(v, r);
  let u: number;
  do { u = randStep(20, 160, 5); } while (Math.abs(u0 - u) < 3);
  const uf = ueberhoehungsfehlbetrag(u0, u);
  const art = fahrtEinordnen(u0, u);
  return zahl({
    appId: APP, formelId: 'uf', modus: 'ueben', stufe,
    text: stufe >= 2 ? `Im Bogen r = ${fmt(r, 0)} m sind ${u} mm Überhöhung eingebaut. Ein Zug fährt mit ${v} km/h durch.` : undefined,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('r', 'Radius', r, 'm', 0), geg('u', 'Vorhandene Überhöhung', u, 'mm', 0)],
    frage: 'Berechne den Überhöhungsfehlbetrag uf in mm (negativ = Überschuss).',
    gesucht: { sym: 'u_f', name: 'Überhöhungsfehlbetrag', einheit: 'mm' },
    loesung: roundTo(uf, 1), nk: 1,
    tipp: 'uf = u0 − u. Zuerst u0 für diese Geschwindigkeit ausrechnen.',
    formelLatex: 'u_f = u_0 - u = \\frac{11{,}8 \\cdot v^2}{r} - u',
    schritte: [u0Schritt(v, r), s('Fehlbetrag:', `u_f = ${zl(u0, 1)} - ${zl(u, 0)} = ${zl(uf, 1)}\\,\\text{mm}`),
      s(art === 'zu-schnell' ? 'uf > 0: Der Zug fährt schneller als „ausgeglichen“ und wird nach außen gedrückt.'
        : art === 'zu-langsam' ? 'uf < 0: Überhöhungsüberschuss – der Zug fährt langsamer und wird nach innen gedrückt.'
        : 'uf ≈ 0: ausgeglichen.')],
  });
}

function frageEinordnen(stufe: Stufe): Aufgabe {
  let v: number; let r: number; let u: number; let u0: number;
  do {
    ({ v, r } = vr());
    u0 = ausgleichendeUeberhoehung(v, r);
    u = randStep(20, 160, 5);
  } while (Math.abs(u0 - u) < 10);
  const art = fahrtEinordnen(u0, u);
  const ok = 'zu schnell – Überhöhungsfehlbetrag (nach außen)';
  const nein = 'zu langsam – Überhöhungsüberschuss (nach innen)';
  const a = auswahl({
    appId: APP, formelId: 'uf', modus: 'ueben', stufe,
    text: `Bogen r = ${fmt(r, 0)} m mit u = ${u} mm Überhöhung. Ein ${v < 100 ? 'Güterzug' : 'Reisezug'} fährt mit ${v} km/h.`,
    gegeben: [],
    frage: 'Fährt der Zug für diese Überhöhung zu schnell oder zu langsam?',
    optionen: art === 'zu-schnell' ? [ok, nein] : [nein, ok],
    mischen: false,
    tipp: 'u0 für die Geschwindigkeit ausrechnen und mit der vorhandenen Überhöhung vergleichen.',
    schritte: [u0Schritt(v, r), s(u0 > u ? `u0 = ${fmt(u0, 1)} mm > u = ${u} mm → uf = ${fmt(u0 - u, 1)} mm → zu schnell.` : `u0 = ${fmt(u0, 1)} mm < u = ${u} mm → Überschuss ${fmt(u - u0, 1)} mm → zu langsam.`)],
  });
  if (a.art !== 'auswahl') return a;
  const optionen = [ok, nein];
  return { ...a, optionen, richtig: optionen.indexOf(a.optionen[0]) };
}

function uebenKette(stufe: Stufe): Aufgabe {
  // Gemischter Verkehr: Reisezug schnell, Güterzug langsam – Überschuss für den Güterzug.
  let r: number; let vR: number; let vG: number; let uf: number; let minu: number;
  do {
    r = radius();
    vR = randStep(100, 200, 10);
    vG = randStep(50, 90, 10);
    uf = randChoice(ZUL_UF);
    minu = mindestueberhoehung(vR, r, uf);
  } while (minu < 20 || minu > 160 || Math.ceil(minu / 5) * 5 - ausgleichendeUeberhoehung(vG, r) < 10);
  const u = Math.ceil(minu / 5) * 5;
  const u0G = ausgleichendeUeberhoehung(vG, r);
  const ueb = u - u0G;
  return zahl({
    appId: APP, formelId: 'minu', modus: 'ueben', stufe,
    text: `Bogen r = ${fmt(r, 0)} m: Reisezüge fahren ${vR} km/h, zul uf = ${uf} mm. Es wird die Mindestüberhöhung eingebaut, auf volle 5 mm aufgerundet. Langsame Güterzüge fahren mit ${vG} km/h.`,
    gegeben: [geg('v_R', 'Reisezug', vR, 'km/h', 0), geg('v_G', 'Güterzug', vG, 'km/h', 0), geg('r', 'Radius', r, 'm', 0), geg('\\text{zul } u_f', 'Zulässiger Fehlbetrag', uf, 'mm', 0)],
    frage: 'Wie groß ist der Überhöhungsüberschuss für den Güterzug in mm?',
    gesucht: { sym: 'u_{\\ddot u}', name: 'Überhöhungsüberschuss', einheit: 'mm' },
    loesung: roundTo(ueb, 1), nk: 1, rel: 0.02,
    tipp: 'Erst min u für den Reisezug → auf 5 mm aufrunden → u0 für den Güterzug → Differenz.',
    formelLatex: '\\text{min } u = \\frac{11{,}8 \\cdot v^2}{r} - \\text{zul } u_f \\qquad u_0 = \\frac{11{,}8 \\cdot v^2}{r}',
    schritte: [
      s('Mindestüberhöhung für den Reisezug:', `\\text{min } u = \\frac{11{,}8 \\cdot ${zl(vR, 0)}^2}{${zl(r, 0)}} - ${zl(uf, 0)} = ${zl(minu, 1)}\\,\\text{mm}`),
      s(`Auf volle 5 mm aufrunden: u = ${u} mm.`),
      s('u0 für den Güterzug:', `u_0 = \\frac{11{,}8 \\cdot ${zl(vG, 0)}^2}{${zl(r, 0)}} = ${zl(u0G, 1)}\\,\\text{mm}`),
      s('Überschuss:', `u - u_0 = ${zl(u, 0)} - ${zl(u0G, 1)} = ${zl(ueb, 1)}\\,\\text{mm}`),
    ],
  });
}

// ---------- Umstellen ----------

function umstellenRMinU(stufe: Stufe): Aufgabe {
  const v = geschw();
  const u = randStep(40, 160, 5);
  const uf = randChoice(ZUL_UF);
  const r = radiusAusUeberhoehung(v, u, uf);
  return zahl({
    appId: APP, formelId: 'r-aus-minu', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Eine Strecke soll mit ${v} km/h befahren werden. Eingebaut werden ${u} mm Überhöhung, zulässig sind ${uf} mm Fehlbetrag. Welcher Radius ist mindestens nötig?` : undefined,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('u', 'Überhöhung', u, 'mm', 0), geg('\\text{zul } u_f', 'Zulässiger Fehlbetrag', uf, 'mm', 0)],
    frage: 'Berechne den kleinsten Radius r in m.',
    gesucht: { sym: 'r', name: 'Radius', einheit: 'm' },
    loesung: roundTo(r, 0), nk: 0,
    tipp: 'min u-Formel nach r umstellen: u + uf wandert in den Nenner.',
    formelLatex: 'r = \\frac{11{,}8 \\cdot v^2}{\\text{min } u + \\text{zul } u_f}',
    schritte: [s('Umstellen:', 'r = \\frac{11{,}8 \\cdot v^2}{u + \\text{zul } u_f}'),
      s('Einsetzen:', `r = \\frac{11{,}8 \\cdot ${zl(v, 0)}^2}{${zl(u, 0)} + ${zl(uf, 0)}} = \\frac{${zl(11.8 * v * v, 0)}}{${zl(u + uf, 0)}} = ${zl(r, 0)}\\,\\text{m}`)],
  });
}

function umstellenV(stufe: Stufe): Aufgabe {
  const r = radius();
  const u0 = randStep(40, 160, 5);
  const v = geschwindigkeitAusU0(u0, r);
  return zahl({
    appId: APP, formelId: 'u0', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Im Bogen r = ${fmt(r, 0)} m sind ${u0} mm Überhöhung eingebaut. Bei welcher Geschwindigkeit ist die Fahrt genau ausgeglichen?` : undefined,
    gegeben: [geg('u_0', 'Überhöhung', u0, 'mm', 0), geg('r', 'Radius', r, 'm', 0)],
    frage: 'Berechne v in km/h.',
    gesucht: { sym: 'v', name: 'Geschwindigkeit', einheit: 'km/h' },
    loesung: roundTo(v, 1), nk: 1,
    tipp: 'u0-Formel nach v² umstellen und die Wurzel ziehen.',
    formelLatex: 'v = \\sqrt{\\frac{u_0 \\cdot r}{11{,}8}}',
    schritte: [s('Umstellen:', 'v = \\sqrt{\\frac{u_0 \\cdot r}{11{,}8}}'),
      s('Einsetzen:', `v = \\sqrt{\\frac{${zl(u0, 0)} \\cdot ${zl(r, 0)}}{11{,}8}} = \\sqrt{${zl((u0 * r) / 11.8, 1)}} = ${zl(v, 1)}\\,\\text{km/h}`)],
  });
}

function umstellenZulV(stufe: Stufe): Aufgabe {
  const r = radius();
  const u = randStep(40, 160, 5);
  const uf = randChoice(ZUL_UF);
  const v = zulGeschwindigkeit(u, uf, r);
  return zahl({
    appId: APP, formelId: 'minu', modus: 'umstellen', stufe,
    text: `Bestandsbogen r = ${fmt(r, 0)} m, eingebaute Überhöhung ${u} mm. Zulässig ist ein Fehlbetrag von ${uf} mm. Wie schnell darf man höchstens fahren?`,
    gegeben: [geg('r', 'Radius', r, 'm', 0), geg('u', 'Überhöhung', u, 'mm', 0), geg('\\text{zul } u_f', 'Zulässiger Fehlbetrag', uf, 'mm', 0)],
    frage: 'Berechne zul v in km/h.',
    gesucht: { sym: '\\text{zul } v', name: 'Zulässige Geschwindigkeit', einheit: 'km/h' },
    loesung: roundTo(v, 1), nk: 1,
    tipp: 'min u = 11,8·v²/r − uf nach v umstellen.',
    formelLatex: '\\text{zul } v = \\sqrt{\\frac{(u + \\text{zul } u_f) \\cdot r}{11{,}8}}',
    schritte: [s('Umstellen:', '\\text{zul } v = \\sqrt{\\frac{(u + \\text{zul } u_f) \\cdot r}{11{,}8}}'),
      s('Einsetzen:', `\\text{zul } v = \\sqrt{\\frac{(${zl(u, 0)} + ${zl(uf, 0)}) \\cdot ${zl(r, 0)}}{11{,}8}} = ${zl(v, 1)}\\,\\text{km/h}`)],
  });
}

function umstellenRU0(stufe: Stufe): Aufgabe {
  const v = geschw();
  const u0 = randStep(40, 160, 5);
  const r = radiusAusU0(v, u0);
  return zahl({
    appId: APP, formelId: 'u0', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Bei ${v} km/h sollen ${u0} mm Überhöhung genau ausgleichen. Welcher Radius passt dazu?` : undefined,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('u_0', 'Überhöhung', u0, 'mm', 0)],
    frage: 'Berechne r in m.',
    gesucht: { sym: 'r', name: 'Radius', einheit: 'm' },
    loesung: roundTo(r, 0), nk: 0,
    tipp: 'r und u0 tauschen die Plätze.',
    formelLatex: 'r = \\frac{11{,}8 \\cdot v^2}{u_0}',
    schritte: [s('Einsetzen:', `r = \\frac{11{,}8 \\cdot ${zl(v, 0)}^2}{${zl(u0, 0)}} = ${zl(r, 0)}\\,\\text{m}`)],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenMs(stufe: Stufe): Aufgabe {
  const { v, r } = vr();
  const ms = roundTo(v / 3.6, 2);
  const vk = ms * 3.6;
  const u0 = ausgleichendeUeberhoehung(vk, r);
  return zahl({
    appId: APP, formelId: 'u0', modus: 'einheiten', stufe,
    text: `Aus der Fahrzeugmessung kennst du die Geschwindigkeit in m/s: ${fmt(ms, 2)} m/s im Bogen r = ${fmt(r, 0)} m.`,
    gegeben: [geg('v', 'Geschwindigkeit', ms, 'm/s', 2), geg('r', 'Radius', r, 'm', 0)],
    frage: 'Berechne u0 in mm.',
    gesucht: { sym: 'u_0', name: 'Ausgleichende Überhöhung', einheit: 'mm' },
    loesung: roundTo(u0, 1), nk: 1,
    tipp: 'Die 11,8 gilt nur mit v in km/h! m/s × 3,6.',
    schritte: [s('In km/h:', `v = ${zl(ms, 2)} \\cdot 3{,}6 = ${zl(vk, 2)}\\,\\text{km/h}`),
      s('Einsetzen:', `u_0 = \\frac{11{,}8 \\cdot ${zl(vk, 2)}^2}{${zl(r, 0)}} = ${zl(u0, 1)}\\,\\text{mm}`)],
  });
}

function einheitenKm(stufe: Stufe): Aufgabe {
  const v = geschw();
  const rKm = randStep(0.6, 4, 0.1);
  const r = rKm * 1000;
  const u = regelueberhoehung(v, r, 'neu');
  return zahl({
    appId: APP, formelId: 'regu-neu', modus: 'einheiten', stufe,
    text: `Radius laut Plan: ${fmt(rKm, 1)} km, Geschwindigkeit ${v} km/h.`,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('r', 'Radius', rKm, 'km', 1)],
    frage: 'Berechne die Regelüberhöhung (neu) in mm.',
    gesucht: { sym: '\\text{reg } u', name: 'Regelüberhöhung', einheit: 'mm' },
    loesung: roundTo(u, 1), nk: 1,
    tipp: 'r muss in m eingesetzt werden.',
    schritte: [s('r in m:', `r = ${zl(rKm, 1)}\\,\\text{km} = ${zl(r, 0)}\\,\\text{m}`),
      s('Einsetzen:', `\\text{reg } u = \\frac{6{,}5 \\cdot ${zl(v, 0)}^2}{${zl(r, 0)}} = ${zl(u, 1)}\\,\\text{mm}`)],
  });
}

function einheitenCm(stufe: Stufe): Aufgabe {
  const { v, r } = vr();
  const u0 = ausgleichendeUeberhoehung(v, r);
  let uCm: number;
  do { uCm = randStep(2, 16, 0.5); } while (Math.abs(u0 - uCm * 10) < 3);
  const u = uCm * 10;
  const uf = u0 - u;
  return zahl({
    appId: APP, formelId: 'uf', modus: 'einheiten', stufe,
    text: `Der Kollege hat die Überhöhung mit dem Zollstock gemessen: ${fmt(uCm, 1)} cm. Bogen r = ${fmt(r, 0)} m, v = ${v} km/h.`,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('r', 'Radius', r, 'm', 0), geg('u', 'Überhöhung', uCm, 'cm', 1)],
    frage: 'Berechne den Fehlbetrag uf in mm.',
    gesucht: { sym: 'u_f', name: 'Überhöhungsfehlbetrag', einheit: 'mm' },
    loesung: roundTo(uf, 1), nk: 1,
    tipp: 'cm × 10 = mm. u0 kommt in mm heraus.',
    formelLatex: 'u_f = u_0 - u',
    schritte: [s('u in mm:', `u = ${zl(uCm, 1)}\\,\\text{cm} = ${zl(u, 0)}\\,\\text{mm}`), u0Schritt(v, r), s('Fehlbetrag:', `u_f = ${zl(u0, 1)} - ${zl(u, 0)} = ${zl(uf, 1)}\\,\\text{mm}`)],
  });
}

// ---------- Rechner ----------

const HINWEIS_180 = 'Mehr als 180 mm Überhöhung werden nicht gebaut (Höchstwert nach EBO).';

function rechnerU0(w: Record<string, number>): RechnerAusgabe {
  const { v, r } = w as { v: number; r: number };
  if (!(v > 0) || !(r > 0)) return { ergebnisse: [], warnungen: ['v und r müssen größer als 0 sein.'], schritte: [] };
  const u0 = ausgleichendeUeberhoehung(v, r);
  return {
    ergebnisse: [
      { sym: 'u_0', name: 'Ausgleichende Überhöhung', wert: u0, einheit: 'mm', nk: 1, hervorheben: true },
      { sym: '\\text{reg } u', name: 'Regelüberhöhung neu (6,5)', wert: regelueberhoehung(v, r, 'neu'), einheit: 'mm', nk: 1 },
      { sym: '\\text{reg } u', name: 'Regelüberhöhung alt (7,1)', wert: regelueberhoehung(v, r, 'alt'), einheit: 'mm', nk: 1 },
    ],
    warnungen: u0 > 180 ? [`u0 = ${fmt(u0, 0)} mm. ${HINWEIS_180}`] : [],
    schritte: [u0Schritt(v, r)],
  };
}

function rechnerMinU(w: Record<string, number>): RechnerAusgabe {
  const { v, r, uf } = w as { v: number; r: number; uf: number };
  if (!(v > 0) || !(r > 0)) return { ergebnisse: [], warnungen: ['v und r müssen größer als 0 sein.'], schritte: [] };
  const minu = mindestueberhoehung(v, r, uf);
  const warnungen: string[] = [];
  if (minu <= 0) warnungen.push('min u ≤ 0: Rechnerisch ist keine Überhöhung nötig.');
  if (minu > 180) warnungen.push(`min u = ${fmt(minu, 0)} mm. ${HINWEIS_180} Radius oder Geschwindigkeit passen nicht zusammen.`);
  return {
    ergebnisse: [
      { sym: '\\text{min } u', name: 'Mindestüberhöhung', wert: minu, einheit: 'mm', nk: 1, hervorheben: true },
      { sym: 'u_0', name: 'Ausgleichende Überhöhung', wert: ausgleichendeUeberhoehung(v, r), einheit: 'mm', nk: 1 },
    ],
    warnungen,
    schritte: [u0Schritt(v, r), s('', `\\text{min } u = ${zl(ausgleichendeUeberhoehung(v, r), 1)} - ${zl(uf, 0)} = ${zl(minu, 1)}\\,\\text{mm}`)],
  };
}

function rechnerUf(w: Record<string, number>): RechnerAusgabe {
  const { v, r, u } = w as { v: number; r: number; u: number };
  if (!(v > 0) || !(r > 0)) return { ergebnisse: [], warnungen: ['v und r müssen größer als 0 sein.'], schritte: [] };
  const u0 = ausgleichendeUeberhoehung(v, r);
  const uf = ueberhoehungsfehlbetrag(u0, u);
  const art = fahrtEinordnen(u0, u);
  return {
    ergebnisse: [
      { sym: 'u_f', name: uf >= 0 ? 'Überhöhungsfehlbetrag' : 'Überhöhungsüberschuss (negativ)', wert: uf, einheit: 'mm', nk: 1, hervorheben: true },
      { sym: 'u_0', name: 'Ausgleichende Überhöhung', wert: u0, einheit: 'mm', nk: 1 },
    ],
    warnungen: u > 180 ? [HINWEIS_180] : [],
    schritte: [u0Schritt(v, r), s('', `u_f = ${zl(u0, 1)} - ${zl(u, 1)} = ${zl(uf, 1)}\\,\\text{mm}`),
      s(art === 'zu-schnell' ? '→ Zug fährt schneller als ausgeglichen (nach außen).' : art === 'zu-langsam' ? '→ Zug fährt langsamer als ausgeglichen (nach innen).' : '→ ausgeglichen.')],
  };
}

function rechnerR(w: Record<string, number>): RechnerAusgabe {
  const { v, u, uf } = w as { v: number; u: number; uf: number };
  if (!(v > 0) || !(u + uf > 0)) return { ergebnisse: [], warnungen: ['v und (u + uf) müssen größer als 0 sein.'], schritte: [] };
  const r = radiusAusUeberhoehung(v, u, uf);
  return {
    ergebnisse: [{ sym: 'r', name: 'Kleinster Radius', wert: r, einheit: 'm', nk: 0, hervorheben: true }],
    warnungen: u > 180 ? [HINWEIS_180] : [],
    schritte: [s('', `r = \\frac{11{,}8 \\cdot ${zl(v, 1)}^2}{${zl(u, 1)} + ${zl(uf, 1)}} = ${zl(r, 0)}\\,\\text{m}`)],
  };
}

export const UEBERHOEHUNG_APP: MiniAppDef = {
  id: APP,
  skizze: 'ueberhoehung',
  formelIds: ['u0', 'regu-alt', 'regu-neu', 'minu', 'r-aus-minu', 'uf'],
  merkhilfen: [
    'u0 = „perfekte“ Überhöhung für genau eine Geschwindigkeit – Fliehkraft und Hangabtrieb heben sich auf.',
    'Schneller als ausgeglichen → Fehlbetrag uf (positiv). Langsamer → Überschuss (uf negativ).',
    'Faktoren merken: 11,8 (ausgleichend) – 7,1 (Regel alt) – 6,5 (Regel neu). Alles: Faktor · v² / r, Ergebnis in mm.',
    'v immer in km/h, r in m einsetzen. Steht v in m/s da: × 3,6.',
  ],
  verweise: [{ label: 'Überhöhungen im Trassenplan rechnen', link: '/zusatz/trassenplan' }],
  rechner: [
    {
      id: 'u0', label: 'u0 / reg u',
      felder: [
        { key: 'v', sym: 'v', name: 'Geschwindigkeit', einheit: 'km/h', einheiten: ['km/h', 'm/s'], standard: 120 },
        { key: 'r', sym: 'r', name: 'Radius', einheit: 'm', einheiten: ['m', 'km'], standard: 1000 },
      ],
      berechne: rechnerU0,
    },
    {
      id: 'minu', label: 'min u',
      felder: [
        { key: 'v', sym: '\\text{zul } v', name: 'Zulässige Geschwindigkeit', einheit: 'km/h', einheiten: ['km/h', 'm/s'], standard: 160 },
        { key: 'r', sym: 'r', name: 'Radius', einheit: 'm', einheiten: ['m', 'km'], standard: 1500 },
        { key: 'uf', sym: '\\text{zul } u_f', name: 'Zulässiger Fehlbetrag', einheit: 'mm', einheiten: ['mm', 'cm'], standard: 130 },
      ],
      berechne: rechnerMinU,
    },
    {
      id: 'uf', label: 'Fehlbetrag uf',
      felder: [
        { key: 'v', sym: 'v', name: 'Geschwindigkeit', einheit: 'km/h', einheiten: ['km/h', 'm/s'], standard: 120 },
        { key: 'r', sym: 'r', name: 'Radius', einheit: 'm', einheiten: ['m', 'km'], standard: 1000 },
        { key: 'u', sym: 'u', name: 'Vorhandene Überhöhung', einheit: 'mm', einheiten: ['mm', 'cm'], standard: 100 },
      ],
      berechne: rechnerUf,
    },
    {
      id: 'r', label: 'Radius',
      felder: [
        { key: 'v', sym: 'v', name: 'Geschwindigkeit', einheit: 'km/h', einheiten: ['km/h', 'm/s'], standard: 120 },
        { key: 'u', sym: '\\text{min } u', name: 'Überhöhung', einheit: 'mm', einheiten: ['mm', 'cm'], standard: 100 },
        { key: 'uf', sym: '\\text{zul } u_f', name: 'Zulässiger Fehlbetrag', einheit: 'mm', einheiten: ['mm', 'cm'], standard: 130 },
      ],
      berechne: rechnerR,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') {
      return (stufe === 1 ? randChoice([umstellenRU0, umstellenV]) : randChoice([umstellenRMinU, umstellenV, umstellenZulV, umstellenRU0]))(stufe);
    }
    if (modus === 'einheiten') {
      return randChoice([einheitenMs, einheitenKm, einheitenCm])(stufe);
    }
    if (stufe === 1) return chance(0.6) ? uebenU0(1) : uebenRegU(1);
    if (stufe === 2) {
      if (chance(0.2)) return frageEinordnen(2);
      return randChoice([uebenU0, uebenRegU, uebenMinU, uebenUf])(2);
    }
    if (chance(0.2)) return frageEinordnen(3);
    return chance(0.5) ? uebenKette(3) : randChoice([uebenMinU, uebenUf])(3);
  },
};

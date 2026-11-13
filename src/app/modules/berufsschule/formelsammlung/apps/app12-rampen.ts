import { auswahl, geg, s, zahl } from '../kern/bauer';
import { RAMPE_FAKTOR, rampenlaenge, rampenlaengeAusNeigung, rampenverhaeltnis } from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

/*
 * Kap. 16–17 – Überhöhungsrampen. Gerade Rampe (Faktor 10) und S-förmig nach Bloss (7,5).
 * Schramm: Faktor in formelsammlung.json unklar → keine Aufgaben.
 * Zulässigkeit nur gegen die EBO-Grenze 1:400 (§ 6 Abs. 4 EBO, Hauptbahn) – steht so in den Grenzen der Formel.
 */

const APP = 'rampen';
const EBO_M = 400;

function art(): { faktor: number; name: string; formelId: string; sym: string } {
  return chance(0.6)
    ? { faktor: RAMPE_FAKTOR.gerade, name: 'gerade Rampe', formelId: 'lr-gerade', sym: 'l_R' }
    : { faktor: RAMPE_FAKTOR.bloss, name: 'S-förmige Rampe nach Bloss', formelId: 'lr-bloss', sym: 'l_{RB}' };
}

function laengenSchritt(f: number, v: number, du: number, sym: string): string {
  const l = rampenlaenge(v, du, f);
  return `${sym} = \\frac{${zl(f, f % 1 ? 1 : 0)} \\cdot ${zl(v, 0)} \\cdot ${zl(du, 0)}}{1000} = ${zl(l, 2)}\\,\\text{m}`;
}

// ---------- Üben ----------

function uebenLaenge(stufe: Stufe): Aufgabe {
  const a = stufe === 1 ? { faktor: 10, name: 'gerade Rampe', formelId: 'lr-gerade', sym: 'l_R' } : art();
  const v = randStep(60, 200, 10);
  const du = randStep(20, 160, 5);
  const l = rampenlaenge(v, du, a.faktor);
  return zahl({
    appId: APP, formelId: a.formelId, modus: 'ueben', stufe,
    text: stufe >= 2
      ? `Am Bogenanfang muss die Überhöhung von 0 auf ${du} mm ansteigen. Geplant ist eine ${a.name}, die Strecke wird mit ${v} km/h befahren.`
      : undefined,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('\\Delta u', 'Überhöhungsänderung', du, 'mm', 0)],
    frage: `Wie lang muss die ${a.name} mindestens sein (in m)?`,
    gesucht: { sym: a.sym, name: 'Rampenlänge', einheit: 'm' },
    loesung: roundTo(l, 1), nk: 1,
    tipp: `${a.faktor === 10 ? 'Gerade: Faktor 10' : 'Bloss: Faktor 7,5'} · v · Δu / 1000. v in km/h, Δu in mm.`,
    schritte: [s(`Formel ${a.name}:`, `${a.sym} = \\frac{${zl(a.faktor, a.faktor % 1 ? 1 : 0)} \\cdot v \\cdot \\Delta u}{1000}`), s('Einsetzen:', laengenSchritt(a.faktor, v, du, a.sym))],
  });
}

function uebenNeigung(stufe: Stufe): Aufgabe {
  const l = randStep(30, 250, 5);
  const du = randStep(20, 160, 5);
  const m = rampenverhaeltnis(l, du);
  return zahl({
    appId: APP, formelId: 'rampenneigung', modus: 'ueben', stufe,
    text: stufe >= 2 ? `Eine Überhöhungsrampe ist ${l} m lang und baut ${du} mm Überhöhung auf. Wie steil ist sie (1 : m)?` : undefined,
    gegeben: [geg('l_R', 'Rampenlänge', l, 'm', 0), geg('\\Delta u', 'Überhöhungsänderung', du, 'mm', 0)],
    frage: 'Berechne m (Rampenneigung 1 : m).',
    gesucht: { sym: 'm', name: 'Neigungsverhältnis', einheit: '' },
    loesung: roundTo(m, 0), nk: 0,
    tipp: 'Länge in mm (× 1000) geteilt durch Δu in mm.',
    schritte: [s('Formel:', 'm = \\frac{l_R \\cdot 1000}{\\Delta u}'), s('Einsetzen:', `m = \\frac{${zl(l, 0)} \\cdot 1000}{${zl(du, 0)}} = ${zl(m, 0)} \\;\\Rightarrow\\; 1 : ${zl(m, 0)}`)],
  });
}

function frageZulaessig(stufe: Stufe): Aufgabe {
  const du = randStep(40, 160, 5);
  const m = randChoice([250, 300, 350, 450, 600, 800, 1000]);
  const l = rampenlaengeAusNeigung(m, du);
  const ok = m >= EBO_M;
  return auswahl({
    appId: APP, formelId: 'rampenneigung', modus: 'ueben', stufe,
    text: `Auf einer Hauptbahn soll eine Rampe mit ${fmt(l, 1)} m Länge ${du} mm Überhöhung aufbauen.`,
    gegeben: [geg('l_R', 'Rampenlänge', l, 'm', 1), geg('\\Delta u', 'Überhöhungsänderung', du, 'mm', 0)],
    frage: 'Ist die Rampe nach EBO zulässig (Grenze 1 : 400)?',
    optionen: ok
      ? [`Ja – 1 : ${m} ist flacher als 1 : 400`, `Nein – 1 : ${m} ist steiler als 1 : 400`, 'Das kann man ohne Geschwindigkeit nicht sagen']
      : [`Nein – 1 : ${m} ist steiler als 1 : 400`, `Ja – 1 : ${m} ist flacher als 1 : 400`, 'Das kann man ohne Geschwindigkeit nicht sagen'],
    tipp: 'Erst m ausrechnen. Kleineres m = steilere Rampe.',
    schritte: [
      s('Neigung:', `m = \\frac{${zl(l, 1)} \\cdot 1000}{${zl(du, 0)}} = ${zl(m, 0)}`),
      s(ok ? `m = ${m} ≥ 400 → flach genug, zulässig.` : `m = ${m} < 400 → zu steil, unzulässig.`),
    ],
  });
}

function uebenKette(stufe: Stufe): Aufgabe {
  const v = randStep(60, 200, 10);
  const du = randStep(20, 160, 5);
  const l = rampenlaenge(v, du, 10);
  const m = rampenverhaeltnis(l, du);
  return zahl({
    appId: APP, formelId: 'lr-gerade', modus: 'ueben', stufe,
    text: `Gerade Rampe für v = ${v} km/h und Δu = ${du} mm. Berechne zuerst die Mindestlänge und daraus die Rampenneigung.`,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('\\Delta u', 'Überhöhungsänderung', du, 'mm', 0)],
    frage: 'Welche Neigung 1 : m hat die Rampe? Gib m an.',
    gesucht: { sym: 'm', name: 'Neigungsverhältnis', einheit: '' },
    loesung: roundTo(m, 0), nk: 0,
    tipp: 'Fällt dir was auf? Bei der geraden Rampe kommt immer m = 10 · v heraus.',
    schritte: [
      s('1. Länge:', laengenSchritt(10, v, du, 'l_R')),
      s('2. Neigung:', `m = \\frac{${zl(l, 1)} \\cdot 1000}{${zl(du, 0)}} = ${zl(m, 0)}`),
      s('Kurz: m = 10 · v, denn Δu kürzt sich weg.'),
    ],
  });
}

// ---------- Umstellen ----------

function umstellenDu(stufe: Stufe): Aufgabe {
  const v = randStep(60, 200, 10);
  const l = randStep(30, 300, 5);
  const du = (l * 1000) / (10 * v);
  if (du < 10 || du > 180) return umstellenDu(stufe);
  return zahl({
    appId: APP, formelId: 'lr-gerade', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Für die gerade Rampe stehen nur ${l} m zur Verfügung, die Strecke wird mit ${v} km/h befahren. Wie viel Überhöhung kann darauf höchstens aufgebaut werden?` : undefined,
    gegeben: [geg('l_R', 'Rampenlänge', l, 'm', 0), geg('v', 'Geschwindigkeit', v, 'km/h', 0)],
    frage: 'Berechne Δu in mm.',
    gesucht: { sym: '\\Delta u', name: 'Überhöhungsänderung', einheit: 'mm' },
    loesung: roundTo(du, 1), nk: 1,
    tipp: 'Mal 1000, geteilt durch (10 · v).',
    formelLatex: '\\Delta u = \\frac{l_R \\cdot 1000}{10 \\cdot v}',
    schritte: [s('Umstellen:', '\\Delta u = \\frac{l_R \\cdot 1000}{10 \\cdot v}'), s('Einsetzen:', `\\Delta u = \\frac{${zl(l, 0)} \\cdot 1000}{10 \\cdot ${zl(v, 0)}} = ${zl(du, 1)}\\,\\text{mm}`)],
  });
}

function umstellenV(stufe: Stufe): Aufgabe {
  const a = art();
  const du = randStep(20, 160, 5);
  const l = randStep(30, 300, 5);
  const v = (l * 1000) / (a.faktor * du);
  if (v < 30 || v > 300) return umstellenV(stufe);
  return zahl({
    appId: APP, formelId: a.formelId, modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Eine vorhandene ${a.name} ist ${l} m lang und baut ${du} mm auf. Bis zu welcher Geschwindigkeit reicht sie aus?` : undefined,
    gegeben: [geg(a.sym, 'Rampenlänge', l, 'm', 0), geg('\\Delta u', 'Überhöhungsänderung', du, 'mm', 0)],
    frage: 'Berechne v in km/h.',
    gesucht: { sym: 'v', name: 'Geschwindigkeit', einheit: 'km/h' },
    loesung: roundTo(v, 1), nk: 1,
    tipp: `Mal 1000, geteilt durch (${a.faktor === 10 ? '10' : '7,5'} · Δu).`,
    formelLatex: `v = \\frac{${a.sym} \\cdot 1000}{${zl(a.faktor, a.faktor % 1 ? 1 : 0)} \\cdot \\Delta u}`,
    schritte: [
      s('Umstellen:', `v = \\frac{${a.sym} \\cdot 1000}{${zl(a.faktor, a.faktor % 1 ? 1 : 0)} \\cdot \\Delta u}`),
      s('Einsetzen:', `v = \\frac{${zl(l, 0)} \\cdot 1000}{${zl(a.faktor, a.faktor % 1 ? 1 : 0)} \\cdot ${zl(du, 0)}} = ${zl(v, 1)}\\,\\tfrac{\\text{km}}{\\text{h}}`),
    ],
  });
}

function umstellenLausM(stufe: Stufe): Aufgabe {
  const du = randStep(20, 160, 5);
  const m = randChoice([400, 500, 600, 800, 1000, 1200]);
  const l = rampenlaengeAusNeigung(m, du);
  return zahl({
    appId: APP, formelId: 'rampenneigung', modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Die Rampe soll genau mit 1 : ${m} geneigt sein und ${du} mm Überhöhung aufbauen. Wie lang wird sie?` : undefined,
    gegeben: [geg('m', 'Neigungsverhältnis', m, '', 0), geg('\\Delta u', 'Überhöhungsänderung', du, 'mm', 0)],
    frage: 'Berechne lR in m.',
    gesucht: { sym: 'l_R', name: 'Rampenlänge', einheit: 'm' },
    loesung: roundTo(l, 1), nk: 1,
    tipp: 'm mal Δu ergibt mm – dann ÷ 1000.',
    formelLatex: 'l_R = \\frac{m \\cdot \\Delta u}{1000}',
    schritte: [s('Umstellen:', 'l_R = \\frac{m \\cdot \\Delta u}{1000}'), s('Einsetzen:', `l_R = \\frac{${zl(m, 0)} \\cdot ${zl(du, 0)}}{1000} = ${zl(l, 1)}\\,\\text{m}`)],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenCm(stufe: Stufe): Aufgabe {
  const a = art();
  const v = randStep(60, 200, 10);
  const duCm = randStep(2, 16, 0.5);
  const du = duCm * 10;
  const l = rampenlaenge(v, du, a.faktor);
  return zahl({
    appId: APP, formelId: a.formelId, modus: 'einheiten', stufe,
    text: `Die Überhöhung steigt um ${fmt(duCm, 1)} cm. ${a.name[0].toUpperCase() + a.name.slice(1)}, v = ${v} km/h.`,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('\\Delta u', 'Überhöhungsänderung', duCm, 'cm', 1)],
    frage: 'Rampenlänge in m?',
    gesucht: { sym: a.sym, name: 'Rampenlänge', einheit: 'm' },
    loesung: roundTo(l, 1), nk: 1,
    tipp: 'Δu in mm einsetzen: cm × 10.',
    schritte: [s('Δu in mm:', `\\Delta u = ${zl(duCm, 1)}\\,\\text{cm} = ${zl(du, 0)}\\,\\text{mm}`), s('Einsetzen:', laengenSchritt(a.faktor, v, du, a.sym))],
  });
}

function einheitenMs(stufe: Stufe): Aufgabe {
  const vMs = randStep(15, 55, 1);
  const v = vMs * 3.6;
  const du = randStep(20, 160, 5);
  const l = rampenlaenge(v, du, 10);
  return zahl({
    appId: APP, formelId: 'lr-gerade', modus: 'einheiten', stufe,
    text: `Gerade Rampe, Δu = ${du} mm. Die Geschwindigkeit ist in m/s gegeben: ${vMs} m/s.`,
    gegeben: [geg('v', 'Geschwindigkeit', vMs, 'm/s', 0), geg('\\Delta u', 'Überhöhungsänderung', du, 'mm', 0)],
    frage: 'Rampenlänge in m?',
    gesucht: { sym: 'l_R', name: 'Rampenlänge', einheit: 'm' },
    loesung: roundTo(l, 1), nk: 1,
    tipp: 'Die Formel will v in km/h: m/s × 3,6.',
    schritte: [s('v in km/h:', `v = ${zl(vMs, 0)} \\cdot 3{,}6 = ${zl(v, 1)}\\,\\tfrac{\\text{km}}{\\text{h}}`), s('Einsetzen:', laengenSchritt(10, v, du, 'l_R'))],
  });
}

// ---------- Rechner ----------

function rechnerL(w: Record<string, number>): RechnerAusgabe {
  const { v, du } = w as { v: number; du: number };
  if (!(v > 0) || !(du > 0)) return { ergebnisse: [], warnungen: ['v und Δu müssen größer als 0 sein.'], schritte: [] };
  const lg = rampenlaenge(v, du, 10);
  const lb = rampenlaenge(v, du, 7.5);
  return {
    ergebnisse: [
      { sym: 'l_R', name: 'Gerade Rampe (Faktor 10)', wert: lg, einheit: 'm', nk: 1, hervorheben: true },
      { sym: 'l_{RB}', name: 'S-förmig nach Bloss (Faktor 7,5)', wert: lb, einheit: 'm', nk: 1 },
      { sym: 'm', name: 'Neigung gerade Rampe 1 : m', wert: rampenverhaeltnis(lg, du), einheit: '', nk: 0 },
    ],
    warnungen: ['Schramm (S-förmig) fehlt noch: Der Faktor ist in deiner Formelsammlung nicht sicher lesbar.'],
    schritte: [s('', laengenSchritt(10, v, du, 'l_R')), s('', laengenSchritt(7.5, v, du, 'l_{RB}'))],
  };
}

function rechnerM(w: Record<string, number>): RechnerAusgabe {
  const { l, du } = w as { l: number; du: number };
  if (!(l > 0) || !(du > 0)) return { ergebnisse: [], warnungen: ['lR und Δu müssen größer als 0 sein.'], schritte: [] };
  const m = rampenverhaeltnis(l, du);
  return {
    ergebnisse: [{ sym: 'm', name: 'Rampenneigung 1 : m', wert: m, einheit: '', nk: 0, hervorheben: true }],
    warnungen: m < EBO_M ? ['Steiler als 1 : 400 – auf Hauptbahnen nach § 6 Abs. 4 EBO nicht zulässig.'] : [],
    schritte: [s('', `m = \\frac{${zl(l, 1)} \\cdot 1000}{${zl(du, 0)}} = ${zl(m, 0)}`)],
  };
}

export const RAMPEN_APP: MiniAppDef = {
  id: APP,
  skizze: 'rampen',
  formelIds: ['rampenneigung', 'lr-gerade', 'lr-bloss', 'lr-schramm'],
  merkhilfen: [
    'In der Überhöhungsrampe wird die äußere Schiene langsam angehoben – von 0 bis zur vollen Überhöhung.',
    'Länge = Faktor · v · Δu / 1000. Gerade: 10, Bloss: 7,5. v in km/h, Δu in mm → Länge in m.',
    '1 : m heißt: auf m mm Länge steigt die Schiene um 1 mm. Größeres m = flachere Rampe.',
    'EBO-Grenze für Hauptbahnen: nicht steiler als 1 : 400.',
  ],
  verweise: [{ label: 'Rampenneigungen im Trassenplan rechnen', link: '/zusatz/trassenplan' }],
  rechner: [
    {
      id: 'l', label: 'Rampenlänge',
      felder: [
        { key: 'v', sym: 'v', name: 'Geschwindigkeit', einheit: 'km/h', einheiten: ['km/h', 'm/s'], standard: 120 },
        { key: 'du', sym: '\\Delta u', name: 'Überhöhungsänderung', einheit: 'mm', einheiten: ['mm', 'cm'], standard: 100 },
      ],
      berechne: rechnerL,
    },
    {
      id: 'm', label: 'Neigung 1 : m',
      felder: [
        { key: 'l', sym: 'l_R', name: 'Rampenlänge', einheit: 'm', einheiten: ['m'], standard: 120 },
        { key: 'du', sym: '\\Delta u', name: 'Überhöhungsänderung', einheit: 'mm', einheiten: ['mm', 'cm'], standard: 100 },
      ],
      berechne: rechnerM,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') return (stufe === 1 ? randChoice([umstellenDu, umstellenLausM]) : randChoice([umstellenDu, umstellenV, umstellenLausM]))(stufe);
    if (modus === 'einheiten') return randChoice([einheitenCm, einheitenMs])(stufe);
    if (stufe === 1) return chance(0.6) ? uebenLaenge(1) : uebenNeigung(1);
    if (stufe === 2) return chance(0.2) ? frageZulaessig(2) : randChoice([uebenLaenge, uebenNeigung])(2);
    return chance(0.3) ? frageZulaessig(3) : randChoice([uebenLaenge, uebenKette])(3);
  },
};

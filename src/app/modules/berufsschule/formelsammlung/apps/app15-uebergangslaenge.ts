import { auswahl, geg, s, zahl } from '../kern/bauer';
import { UEBERGANG_FAKTOR, UebergangsForm, mindestUebergangslaenge } from '../kern/formeln';
import { Aufgabe, AufgabenModus, MiniAppDef, RechnerAusgabe, Stufe } from '../kern/typen';
import { chance, fmt, randChoice, randStep, roundTo, zl } from '../kern/zahlen';

/* Kap. 21 – Mindestlänge Übergangsbogen: Klothoide 4, Bloss 4,5, Schramm (S-förmig) 6. */

const APP = 'uebergangslaenge';
// lang: steht in jeder Aufgabe, damit klar ist, welche Form gerechnet wird (Tim, 2026-11-11).
const FORMEN: { form: UebergangsForm; name: string; lang: string; formelId: string; f: string }[] = [
  { form: 'klothoide', name: 'Klothoide', lang: 'Klothoide, linear verlaufend', formelId: 'lu-klothoide', f: '4' },
  { form: 'bloss', name: 'Bloss', lang: 'Bloss, S-förmig', formelId: 'lu-bloss', f: '4{,}5' },
  { form: 'schramm', name: 'Schramm (S-förmig)', lang: 'Schramm, S-förmig', formelId: 'lu-schramm', f: '6' },
];

const formSatz = (fo: (typeof FORMEN)[number]) => `Form des Übergangsbogens: ${fo.lang}.`;

function schritt(fo: (typeof FORMEN)[number], v: number, du: number): string {
  const l = mindestUebergangslaenge(v, du, fo.form);
  return `\\text{min } l_u = \\frac{${fo.f} \\cdot ${zl(v, 0)} \\cdot ${zl(du, 0)}}{1000} = ${zl(l, 2)}\\,\\text{m}`;
}

// ---------- Üben ----------

function uebenL(stufe: Stufe): Aufgabe {
  const fo = stufe === 1 ? FORMEN[0] : randChoice(FORMEN);
  const v = randStep(60, 200, 10);
  const du = randStep(20, 160, 5);
  const l = mindestUebergangslaenge(v, du, fo.form);
  return zahl({
    appId: APP, formelId: fo.formelId, modus: 'ueben', stufe,
    text: stufe >= 2 ? `Zwischen Gerade und Bogen kommt ein Übergangsbogen der Form „${fo.lang}“. Die Überhöhung ändert sich darin um ${du} mm, v = ${v} km/h.` : formSatz(fo),
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('\\Delta u', 'Überhöhungsänderung', du, 'mm', 0)],
    frage: `Mindestlänge des Übergangsbogens (${fo.lang}) in m?`,
    gesucht: { sym: 'l_u', name: `Mindestlänge ${fo.name}`, einheit: 'm' },
    loesung: roundTo(l, 1), nk: 1,
    tipp: `Faktor ${fo.f.replace('{,}', ',')} · v · Δu / 1000.`,
    schritte: [s(`Formel ${fo.name}:`, `\\text{min } l_u = \\frac{${fo.f} \\cdot v \\cdot \\Delta u}{1000}`), s('Einsetzen:', schritt(fo, v, du))],
  });
}

function frageFaktor(stufe: Stufe): Aufgabe {
  const fo = randChoice(FORMEN);
  const andere = FORMEN.filter(x => x !== fo).map(x => x.f.replace('{,}', ','));
  return auswahl({
    appId: APP, formelId: fo.formelId, modus: 'ueben', stufe,
    text: `Du sollst die Mindestlänge eines Übergangsbogens der Form „${fo.lang}“ berechnen.`,
    gegeben: [],
    frage: 'Welcher Faktor steht in der Formel?',
    optionen: [fo.f.replace('{,}', ','), ...andere, '10'],
    tipp: 'Klothoide < Bloss < Schramm – je „weicher“ die Form, desto länger.',
    schritte: [s('Klothoide 4 · Bloss 4,5 · Schramm 6 (jeweils · v · Δu / 1000).')],
  });
}

function uebenVergleich(stufe: Stufe): Aufgabe {
  const v = randStep(60, 200, 10);
  const du = randStep(20, 160, 5);
  const lK = mindestUebergangslaenge(v, du, 'klothoide');
  const lS = mindestUebergangslaenge(v, du, 'schramm');
  return zahl({
    appId: APP, formelId: 'lu-schramm', modus: 'ueben', stufe,
    text: `Der Planer überlegt, statt einer Klothoide einen S-förmigen Übergangsbogen nach Schramm einzubauen (v = ${v} km/h, Δu = ${du} mm). Wie viel länger wird der Übergangsbogen mindestens?`,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('\\Delta u', 'Überhöhungsänderung', du, 'mm', 0)],
    frage: 'Differenz der Mindestlängen in m?',
    gesucht: { sym: '\\Delta l_u', name: 'Mehrlänge Schramm statt Klothoide', einheit: 'm' },
    loesung: roundTo(lS - lK, 1), nk: 1,
    tipp: 'Beide Längen ausrechnen und abziehen – oder gleich (6 − 4) · v · Δu / 1000.',
    schritte: [
      s('Klothoide:', schritt(FORMEN[0], v, du)),
      s('Schramm:', schritt(FORMEN[2], v, du)),
      s('Differenz:', `\\Delta l_u = ${zl(lS, 2)} - ${zl(lK, 2)} = ${zl(lS - lK, 2)}\\,\\text{m}`),
    ],
  });
}

// ---------- Umstellen ----------

function umstellenV(stufe: Stufe): Aufgabe {
  const fo = stufe === 1 ? FORMEN[0] : randChoice(FORMEN);
  const du = randStep(20, 160, 5);
  const l = randStep(30, 250, 5);
  const v = (l * 1000) / (UEBERGANG_FAKTOR[fo.form] * du);
  if (v < 30 || v > 300) return umstellenV(stufe);
  return zahl({
    appId: APP, formelId: fo.formelId, modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Ein vorhandener Übergangsbogen (${fo.lang}) ist ${l} m lang, Δu = ${du} mm. Bis zu welcher Geschwindigkeit reicht er?` : formSatz(fo),
    gegeben: [geg('l_u', 'Länge Übergangsbogen', l, 'm', 0), geg('\\Delta u', 'Überhöhungsänderung', du, 'mm', 0)],
    frage: 'Berechne v in km/h.',
    gesucht: { sym: 'v', name: `Geschwindigkeit (${fo.name})`, einheit: 'km/h' },
    loesung: roundTo(v, 1), nk: 1,
    tipp: `Mal 1000, geteilt durch (${fo.f.replace('{,}', ',')} · Δu).`,
    formelLatex: `v = \\frac{l_u \\cdot 1000}{${fo.f} \\cdot \\Delta u}`,
    schritte: [s('Umstellen:', `v = \\frac{l_u \\cdot 1000}{${fo.f} \\cdot \\Delta u}`), s('Einsetzen:', `v = \\frac{${zl(l, 0)} \\cdot 1000}{${fo.f} \\cdot ${zl(du, 0)}} = ${zl(v, 1)}\\,\\tfrac{\\text{km}}{\\text{h}}`)],
  });
}

function umstellenDu(stufe: Stufe): Aufgabe {
  const fo = randChoice(FORMEN);
  const v = randStep(60, 200, 10);
  const l = randStep(30, 250, 5);
  const du = (l * 1000) / (UEBERGANG_FAKTOR[fo.form] * v);
  if (du < 10 || du > 180) return umstellenDu(stufe);
  return zahl({
    appId: APP, formelId: fo.formelId, modus: 'umstellen', stufe,
    text: stufe >= 2 ? `Im Übergangsbogen (${fo.lang}, ${l} m lang, v = ${v} km/h) – wie viel Überhöhung darf darin höchstens aufgebaut werden?` : formSatz(fo),
    gegeben: [geg('l_u', 'Länge Übergangsbogen', l, 'm', 0), geg('v', 'Geschwindigkeit', v, 'km/h', 0)],
    frage: 'Berechne Δu in mm.',
    gesucht: { sym: '\\Delta u', name: `Überhöhungsänderung (${fo.name})`, einheit: 'mm' },
    loesung: roundTo(du, 1), nk: 1,
    tipp: `Mal 1000, geteilt durch (${fo.f.replace('{,}', ',')} · v).`,
    formelLatex: `\\Delta u = \\frac{l_u \\cdot 1000}{${fo.f} \\cdot v}`,
    schritte: [s('Umstellen:', `\\Delta u = \\frac{l_u \\cdot 1000}{${fo.f} \\cdot v}`), s('Einsetzen:', `\\Delta u = \\frac{${zl(l, 0)} \\cdot 1000}{${fo.f} \\cdot ${zl(v, 0)}} = ${zl(du, 1)}\\,\\text{mm}`)],
  });
}

// ---------- Einheiten-Falle ----------

function einheitenCm(stufe: Stufe): Aufgabe {
  const fo = randChoice(FORMEN);
  const v = randStep(60, 200, 10);
  const duCm = randStep(2, 16, 0.5);
  const du = duCm * 10;
  const l = mindestUebergangslaenge(v, du, fo.form);
  return zahl({
    appId: APP, formelId: fo.formelId, modus: 'einheiten', stufe,
    text: `${formSatz(fo)} v = ${v} km/h. Die Überhöhung ändert sich um ${fmt(duCm, 1)} cm.`,
    gegeben: [geg('v', 'Geschwindigkeit', v, 'km/h', 0), geg('\\Delta u', 'Überhöhungsänderung', duCm, 'cm', 1)],
    frage: `Mindestlänge des Übergangsbogens (${fo.lang}) in m?`,
    gesucht: { sym: 'l_u', name: `Mindestlänge ${fo.name}`, einheit: 'm' },
    loesung: roundTo(l, 1), nk: 1,
    tipp: 'Δu in mm einsetzen (cm × 10).',
    schritte: [s('Δu in mm:', `\\Delta u = ${zl(du, 0)}\\,\\text{mm}`), s('Einsetzen:', schritt(fo, v, du))],
  });
}

function einheitenMs(stufe: Stufe): Aufgabe {
  const fo = randChoice(FORMEN);
  const vMs = randStep(15, 55, 1);
  const v = vMs * 3.6;
  const du = randStep(20, 160, 5);
  const l = mindestUebergangslaenge(v, du, fo.form);
  return zahl({
    appId: APP, formelId: fo.formelId, modus: 'einheiten', stufe,
    text: `${formSatz(fo)} Δu = ${du} mm, Geschwindigkeit ${vMs} m/s.`,
    gegeben: [geg('v', 'Geschwindigkeit', vMs, 'm/s', 0), geg('\\Delta u', 'Überhöhungsänderung', du, 'mm', 0)],
    frage: `Mindestlänge des Übergangsbogens (${fo.lang}) in m?`,
    gesucht: { sym: 'l_u', name: `Mindestlänge ${fo.name}`, einheit: 'm' },
    loesung: roundTo(l, 1), nk: 1,
    tipp: 'v in km/h: × 3,6.',
    schritte: [s('v in km/h:', `v = ${zl(vMs, 0)} \\cdot 3{,}6 = ${zl(v, 1)}\\,\\tfrac{\\text{km}}{\\text{h}}`), s('Einsetzen:', schritt(fo, v, du))],
  });
}

// ---------- Rechner ----------

function rechner(w: Record<string, number>): RechnerAusgabe {
  const { v, du } = w as { v: number; du: number };
  if (!(v > 0) || !(du > 0)) return { ergebnisse: [], warnungen: ['v und Δu müssen größer als 0 sein.'], schritte: [] };
  return {
    ergebnisse: FORMEN.map((fo, i) => ({ sym: 'l_u', name: fo.name, wert: mindestUebergangslaenge(v, du, fo.form), einheit: 'm', nk: 1, hervorheben: i === 0 })),
    warnungen: [],
    schritte: FORMEN.map(fo => s(fo.name + ':', schritt(fo, v, du))),
  };
}

export const UEBERGANGSLAENGE_APP: MiniAppDef = {
  id: APP,
  skizze: 'uebergangslaenge',
  formelIds: ['lu-klothoide', 'lu-bloss', 'lu-schramm'],
  merkhilfen: [
    'Alle drei Formeln sind gleich gebaut: Faktor · v · Δu / 1000. Nur der Faktor ändert sich.',
    'Klothoide 4 · Bloss 4,5 · Schramm 6. Je geschwungener die Form, desto länger muss sie sein.',
    'v in km/h, Δu in mm → Länge in m.',
  ],
  verweise: [{ label: 'App 3 – Übergangsbogen abstecken', link: '/berufsschule/formelsammlung/uebergangsbogen' }],
  rechner: [
    {
      id: 'lu', label: 'Alle drei Formen',
      felder: [
        { key: 'v', sym: 'v', name: 'Geschwindigkeit', einheit: 'km/h', einheiten: ['km/h', 'm/s'], standard: 120 },
        { key: 'du', sym: '\\Delta u', name: 'Überhöhungsänderung', einheit: 'mm', einheiten: ['mm', 'cm'], standard: 100 },
      ],
      berechne: rechner,
    },
  ],
  generiere(modus: AufgabenModus, stufe: Stufe): Aufgabe {
    if (modus === 'umstellen') return (stufe === 1 ? umstellenV : randChoice([umstellenV, umstellenDu]))(stufe);
    if (modus === 'einheiten') return randChoice([einheitenCm, einheitenMs])(stufe);
    if (stufe === 1) return uebenL(1);
    if (stufe === 2) return chance(0.2) ? frageFaktor(2) : uebenL(2);
    return chance(0.4) ? uebenVergleich(3) : randChoice([uebenL, frageFaktor])(3);
  },
};

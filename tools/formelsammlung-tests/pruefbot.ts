/**
 * Formel-Prüfbot (Tim 2026-11-12): rechnet die ANGEZEIGTEN Lösungswege nach.
 *
 * Für viele Zufallsaufgaben jeder App/jedes Modus/jeder Stufe:
 *  1. Jede LaTeX-Rechnung „a = 3 · 4 = 12\,\text{m}“ wird in Abschnitte zerlegt; rein
 *     numerische Abschnitte werden ausgerechnet und müssen zueinander passen.
 *  2. Das Endergebnis des letzten Schritts muss zur Lösung passen.
 *  3. Das Endergebnis muss eine Einheit tragen, und zwar die gesuchte.
 *  4. Gegebene Werte brauchen eine Einheit (außer bewusst einheitenlos).
 * Ergebnis: Bericht (Markdown) mit Beispielen je Fundstelle – kein harter Testabbruch.
 *
 *   node tools/formelsammlung-tests/pruefbot.cjs [bericht.md]
 */
import { MINI_APPS } from '../../src/app/modules/berufsschule/formelsammlung/apps';
import { Aufgabe, AufgabenModus, Stufe } from '../../src/app/modules/berufsschule/formelsammlung/kern/typen';
import { FORMELSAMMLUNG } from '../../src/app/modules/berufsschule/formelsammlung/kern/daten';
import { umrechnen } from '../../src/app/modules/berufsschule/formelsammlung/kern/zahlen';

const N = Number(process.env.PRUEF_N || 150);
const MODI: AufgabenModus[] = ['ueben', 'umstellen', 'einheiten'];
const STUFEN: Stufe[] = [1, 2, 3];

type Art = 'rechnung-falsch' | 'ergebnis-weicht-ab' | 'einheit-fehlt' | 'einheit-anders' | 'gegeben-ohne-einheit';
interface Fund { art: Art; app: string; formel: string; wo: string; detail: string }
const funde = new Map<string, { fund: Fund; anzahl: number }>();
let gepruefteRechnungen = 0;
let aufgaben = 0;

function melde(f: Fund): void {
  const key = `${f.art}|${f.app}|${f.formel}|${f.wo.replace(/\d+$/, '')}`;
  const e = funde.get(key);
  if (e) e.anzahl++;
  else funde.set(key, { fund: f, anzahl: 1 });
}

// ---------- LaTeX → Zahl ----------

/** Klammerinhalt ab Position i (s[i] === '{') → [inhalt, ende] */
function gruppe(s: string, i: number): [string, number] {
  let tiefe = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') tiefe++;
    else if (s[j] === '}') { tiefe--; if (tiefe === 0) return [s.slice(i + 1, j), j + 1]; }
  }
  return [s.slice(i + 1), s.length];
}

/** Einheit am Ende eines Abschnitts abtrennen → [ausdruck, einheit] */
function einheitAbtrennen(seg: string): [string, string] {
  // Einheit = alles ab dem ersten \text / \tfrac{\text / \mathrm, das NICHT mehr von Zahlen gefolgt wird
  const m = /(\\,|\s)*(\\[td]?frac\{1\}\{\\text|\\[td]?frac\{\\text|\\text|\\mathrm|\\%|‰|%|°)/.exec(seg);
  if (!m) return [seg, ''];
  return [seg.slice(0, m.index), seg.slice(m.index)];
}

export function einheitNormal(e: string): string {
  let s = e;
  s = s.replace(/\\[td]?frac\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, '$1/$2');
  s = s.replace(/\\text\{([^}]*)\}/g, '$1').replace(/\\mathrm\{([^}]*)\}/g, '$1');
  s = s.replace(/\^\{?2\}?/g, '²').replace(/\^\{?3\}?/g, '³').replace(/\^\{?-1\}?/g, '⁻¹');
  s = s.replace(/\\%/g, '%').replace(/\\,|\\;|\\ |~|\s|[{}]/g, '').replace(/\\cdot/g, '·');
  return s;
}

function latexZuJs(x: string): string | null {
  let s = x;
  s = s.replace(/\\left|\\right|\\big|\\Big/g, '');
  s = s.replace(/−/g, '-').replace(/\{,\}/g, '.').replace(/(\d)\\,(?=\d)/g, '$1').replace(/\\,|\\;|\\!|\\ /g, '');
  // \frac{a}{b}
  for (let k = 0; k < 20 && /\\[td]?frac/.test(s); k++) {
    const m = /\\[td]?frac/.exec(s)!;
    const [a, e1] = gruppe(s, m.index + m[0].length);
    const [b, e2] = gruppe(s, e1);
    s = s.slice(0, m.index) + `((${a})/(${b}))` + s.slice(e2);
  }
  for (let k = 0; k < 20 && /\\sqrt/.test(s); k++) {
    const m = /\\sqrt/.exec(s)!;
    const [a, e1] = gruppe(s, m.index + 5);
    s = s.slice(0, m.index) + `Math.sqrt(${a})` + s.slice(e1);
  }
  s = s.replace(/\\cdot|\\times|·|×/g, '*').replace(/\\div|÷|:/g, '/');
  s = s.replace(/\^\{([^{}]*)\}/g, '**($1)').replace(/\^(\d)/g, '**$1');
  s = s.replace(/\\pi/g, 'Math.PI');
  s = s.replace(/[{}]/g, m => (m === '{' ? '(' : ')'));
  s = s.replace(/\s+/g, '');
  if (!s || !/^[0-9.+\-*/()]*$/.test(s.replace(/Math\.sqrt|Math\.PI/g, ''))) return null;
  return s;
}

function rechne(x: string): number | null {
  const js = latexZuJs(x);
  if (!js || !/\d/.test(js)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const v = Function(`"use strict";return (${js});`)();
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

/** Abschnitte einer Rechnung (auf oberster Ebene an = / ≈ getrennt) */
function abschnitte(l: string): string[] {
  const teile: string[] = [];
  let tiefe = 0, start = 0;
  const s = l.replace(/\\approx|≈/g, '=');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '{') tiefe++;
    else if (c === '}') tiefe--;
    else if (c === '=' && tiefe === 0) { teile.push(s.slice(start, i)); start = i + 1; }
  }
  teile.push(s.slice(start));
  return teile.map(t => t.trim()).filter(Boolean);
}

/** Wie weit dürfen zwei angezeigte Zahlen abweichen? (Rundung der Anzeige) */
function passt(a: number, b: number, rel = 0.012): boolean {
  if (a === b) return true;
  const d = Math.abs(a - b);
  return d <= Math.max(Math.abs(a), Math.abs(b)) * rel || d < 0.0105;
}

function nkVon(seg: string): number {
  const m = /\{,\}(\d+)/.exec(seg);
  return m ? m[1].length : 0;
}

/** Umrechnung in eine Basiseinheit je Dimension */
const FAKTOR: Record<string, [string, number]> = {
  mm: ['L', 0.001], cm: ['L', 0.01], dm: ['L', 0.1], m: ['L', 1], km: ['L', 1000],
  'mm²': ['A', 1e-6], 'cm²': ['A', 1e-4], 'm²': ['A', 1], 'm³': ['V', 1], 'cm³': ['V', 1e-6], 'dm³': ['V', 1e-3], l: ['V', 1e-3],
  N: ['F', 1], kN: ['F', 1000], MN: ['F', 1e6], kg: ['M', 1], t: ['M', 1000],
  '%': ['S', 10], '‰': ['S', 1], 'N/cm': ['Q', 100], 'kN/m': ['Q', 1000], 'N/m': ['Q', 1], 'N/mm': ['Q', 1000],
  'm/s': ['v', 1], 'km/h': ['v', 1 / 3.6], s: ['T', 1], min: ['T', 60], h: ['T', 3600],
  '1/km': ['k', 1], '1/m': ['k', 1000],
};
function inBasis(v: number, e: string): [string, number] {
  const f = FAKTOR[e];
  return f ? [f[0], v * f[1]] : [e, v];
}

const EINHEITENLOS = new Set(['', '-', '–', '1']);

function pruefe(a: Aufgabe, wo: string): void {
  aufgaben++;
  for (const g of a.gegeben) {
    if ((!g.einheit || !g.einheit.trim()) && !/1\s*:\s*n|Neigungsverh|Anzahl|Faktor/i.test(g.name)) melde({ art: 'gegeben-ohne-einheit', app: a.appId, formel: a.formelId, wo, detail: `${g.name} (${g.sym}) = ${g.wert}` });
  }
  let letzterWert: number | null = null;
  let letzteEinheit = '';
  let letzterLatex = '';
  for (const sch of a.schritte) {
    if (!sch.latex) continue;
    // mehrere Gleichungen in einer Zeile („s_1 = …, \quad s_2 = …“, „… \Rightarrow …“, Vergleiche) einzeln prüfen
    for (const gleichung of sch.latex.split(/\\quad|\\qquad|\\Rightarrow|\\geq?|\\leq?|<|>/)) {
    const segs = abschnitte(gleichung);
    if (segs.length < 2) continue;
    // Erster Abschnitt ist (meist) das Symbol – die Zahlen-Abschnitte vergleichen
    const werte: { v: number; seg: string; einheit: string }[] = [];
    for (const seg of segs.slice(1)) {
      const [ausdruck, einheit] = einheitAbtrennen(seg);
      const v = rechne(ausdruck);
      if (v !== null) werte.push({ v, seg, einheit: einheitNormal(einheit) });
    }
    for (let i = 1; i < werte.length; i++) {
      const p = werte[i - 1], q = werte[i];
      let va = p.v, vb = q.v;
      if (p.einheit && q.einheit) {
        const x = inBasis(p.v, p.einheit), y = inBasis(q.v, q.einheit);
        if (x[0] !== y[0]) continue; // andere Dimension (kg → N): nicht vergleichbar
        va = x[1] / (FAKTOR[q.einheit]?.[1] ?? 1); vb = q.v; // in der Einheit des rechten Werts vergleichen
      } else if (p.einheit && !q.einheit) {
        continue;
      }
      gepruefteRechnungen++;
      const toleranz = Math.max(0.012, 1.5 * Math.pow(10, -nkVon(q.seg)) / Math.max(1e-9, Math.abs(q.v)));
      if (!passt(va, vb, Math.min(toleranz, 0.06))) {
        melde({ art: 'rechnung-falsch', app: a.appId, formel: a.formelId, wo, detail: `${sch.text} ${sch.latex}  → ${p.v} ${p.einheit} ≠ ${q.v} ${q.einheit}` });
      }
    }
    if (werte.length) {
      const w = werte[werte.length - 1];
      letzterWert = w.v;
      letzteEinheit = w.einheit;
      letzterLatex = sch.latex;
    }
    }
  }
  if (a.art !== 'zahl' || letzterWert === null) return;
  const soll = a.loesung;
  // Endergebnis darf auch in einer anderen Einheit stehen (z. B. N statt kN) – dann nur Einheit melden
  const gesucht = einheitNormal(a.gesucht.einheit);
  const tol = Math.max(0.012, 1.5 * Math.pow(10, -a.nk) / Math.max(1e-9, Math.abs(soll)));
  const ist = inBasis(letzterWert, letzteEinheit), sollB = inBasis(soll, gesucht);
  const zahlOk = passt(letzterWert, soll, tol) || (!!letzteEinheit && ist[0] === sollB[0] && passt(ist[1] / (FAKTOR[gesucht]?.[1] ?? 1), soll, tol));
  if (!letzteEinheit && !EINHEITENLOS.has(gesucht)) {
    melde({ art: 'einheit-fehlt', app: a.appId, formel: a.formelId, wo, detail: `Endergebnis ohne Einheit (gesucht ${a.gesucht.einheit}): ${letzterLatex}` });
  } else if (letzteEinheit && gesucht && letzteEinheit !== gesucht && zahlOk) {
    melde({ art: 'einheit-anders', app: a.appId, formel: a.formelId, wo, detail: `Endergebnis in „${letzteEinheit}“, gesucht „${gesucht}“: ${letzterLatex}` });
  }
  if (!zahlOk) {
    melde({ art: 'ergebnis-weicht-ab', app: a.appId, formel: a.formelId, wo, detail: `Rechenweg endet bei ${letzterWert}, Lösung ist ${soll} ${a.gesucht.einheit}: ${letzterLatex}` });
  }
}

for (const app of MINI_APPS) {
  for (const modus of MODI) {
    for (const stufe of STUFEN) {
      for (let i = 0; i < N; i++) {
        let a: Aufgabe;
        try { a = app.generiere(modus, stufe); } catch (e) {
          melde({ art: 'rechnung-falsch', app: app.id, formel: '-', wo: `${modus}/${stufe}`, detail: 'Generator wirft: ' + (e as Error).message });
          continue;
        }
        pruefe(a, `${modus}/${stufe}`);
      }
    }
  }
}

// ---------- Rechner-Modus: Startwerte und zufällig veränderte Werte ----------
for (const app of MINI_APPS) {
  for (const v of app.rechner) {
    for (let i = 0; i < 40; i++) {
      const w: Record<string, number> = {};
      for (const f of v.felder) w[f.key] = i === 0 ? f.standard : Math.round(f.standard * (0.6 + Math.random() * 0.8) * (f.standard < 1 ? 1000 : f.standard < 20 ? 10 : 1)) / (f.standard < 1 ? 1000 : f.standard < 20 ? 10 : 1);
      // Startwert steht in der ersten Anzeige-Einheit (z. B. mm) – die App rechnet vorher in die Rechen-Einheit um
      for (const f of v.felder) if (f.einheiten?.length && f.einheiten[0] !== f.einheit) w[f.key] = umrechnen(w[f.key], f.einheiten[0], f.einheit);
      const sw: Record<string, string> = {};
      for (const sc of v.schalter ?? []) sw[sc.key] = sc.optionen[i % sc.optionen.length].wert;
      let aus;
      try { aus = v.berechne(w, sw); } catch (e) {
        melde({ art: 'rechnung-falsch', app: app.id, formel: 'rechner:' + v.id, wo: 'rechner', detail: 'Rechner wirft: ' + (e as Error).message });
        continue;
      }
      for (const r of aus.ergebnisse) {
        if (!Number.isFinite(r.wert) && i === 0) melde({ art: 'ergebnis-weicht-ab', app: app.id, formel: 'rechner:' + v.id, wo: 'rechner', detail: `${r.name} nicht endlich mit Startwerten` });
        if (!r.einheit?.trim() && !/1\s*:\s*[nm]|Verh|Anzahl|Faktor|zulässig|Näherung/i.test(r.name)) melde({ art: 'einheit-fehlt', app: app.id, formel: 'rechner:' + v.id, wo: 'rechner', detail: `Ergebnis „${r.name}“ (${r.sym}) ohne Einheit` });
      }
      // Lösungsweg des Rechners genauso nachrechnen
      pruefe({ appId: app.id, formelId: 'rechner:' + v.id, modus: 'ueben', stufe: 1, gegeben: [], frage: '', tipp: '', formelLatex: '', schritte: aus.schritte, art: 'auswahl', optionen: [], richtig: 0, id: '' } as unknown as Aufgabe, 'rechner');
    }
  }
}

// ---------- Formeldaten (Erklären-Modus): jede Variable mit Einheit und im LaTeX vorhanden ----------
for (const f of FORMELSAMMLUNG.formeln) {
  for (const v of f.variablen) {
    if (!v.einheit?.trim() && !/1\s*:\s*n|Verh|Anzahl|Faktor|Neigung 1/i.test(v.name)) {
      melde({ art: 'gegeben-ohne-einheit', app: f.app, formel: f.id, wo: 'formeldaten', detail: `Variable ${v.symbol} (${v.name}) ohne Einheit` });
    }
    const kern = v.symbol.replace(/[{}\\]/g, '').split(/[_^]/)[0];
    if (kern && !f.latex.replace(/[{}\\]/g, '').includes(kern)) {
      melde({ art: 'rechnung-falsch', app: f.app, formel: f.id, wo: 'formeldaten', detail: `Variable ${v.symbol} steht nicht in der Formel ${f.latex}` });
    }
  }
}

// ---------- Bericht ----------
const TITEL: Record<Art, string> = {
  'rechnung-falsch': 'Rechenweg geht nicht auf',
  'ergebnis-weicht-ab': 'Rechenweg endet bei anderem Ergebnis als die Lösung',
  'einheit-fehlt': 'Endergebnis ohne Einheit',
  'einheit-anders': 'Endergebnis in anderer Einheit als gefragt',
  'gegeben-ohne-einheit': 'Gegebener Wert ohne Einheit',
};
const zeilen: string[] = [`# Formel-Prüfbot – ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`, '',
  `${aufgaben} Aufgaben, ${gepruefteRechnungen} Rechenschritte nachgerechnet, ${funde.size} verschiedene Fundstellen.`, ''];
for (const art of Object.keys(TITEL) as Art[]) {
  const liste = [...funde.values()].filter(f => f.fund.art === art);
  if (!liste.length) continue;
  zeilen.push(`## ${TITEL[art]} (${liste.length})`, '');
  for (const { fund, anzahl } of liste.sort((x, y) => (x.fund.app + x.fund.formel).localeCompare(y.fund.app + y.fund.formel))) {
    zeilen.push(`- **${fund.app}** · ${fund.formel} · ${fund.wo} · ${anzahl}×  \n  \`${fund.detail.slice(0, 300)}\``);
  }
  zeilen.push('');
}
const text = zeilen.join('\n');
const ziel = process.argv[2];
if (ziel) require('fs').writeFileSync(ziel, text, 'utf8');
console.log(text.slice(0, 200000));

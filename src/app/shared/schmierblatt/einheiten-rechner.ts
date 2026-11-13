/*
 * Rechnen mit Einheiten auf dem Schmierblatt (Idee von Mustafa, Meldung #7, 2026-11-10):
 *   „1t + 2t =“            → 3t
 *   „3t/m³ × 1,5m³ =“      → 4,5t       (Einheiten kürzen sich bei × und ÷)
 *   „3m² + 1m² =“          → 4m²        (bei + und − bleibt die Einheit, sie wird nicht verrechnet)
 *   „1667 × 3,4 =“         → 5.667,8    (ohne Einheit wie bisher)
 * Einheiten werden NICHT umgerechnet (m und cm sind verschiedene Einheiten). Passen sie bei + / − nicht
 * zusammen (z. B. 3t + 2m), gibt es kein Ergebnis – dann schreibt man einfach normal weiter.
 * Komma = Dezimalzeichen, Punkt = Tausenderpunkt; erlaubt: + − × · * / ÷ : ( ) % ^ ² ³ π.
 */

type Dim = Record<string, number>;
interface Groesse { v: number; d: Dim; }

const BUCHSTABE = /[A-Za-zÄÖÜäöüß€]/;
const HOCH: Record<string, number> = { '²': 2, '³': 3 };

function mal(a: Dim, b: Dim, faktor = 1): Dim {
  const r: Dim = { ...a };
  for (const [k, e] of Object.entries(b)) {
    r[k] = (r[k] ?? 0) + faktor * e;
    if (Math.abs(r[k]) < 1e-12) delete r[k];
  }
  return r;
}
function hoch(a: Dim, n: number): Dim {
  const r: Dim = {};
  for (const [k, e] of Object.entries(a)) r[k] = e * n;
  return r;
}
function gleich(a: Dim, b: Dim): boolean {
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every(k => b[k] === a[k]);
}
const leer = (d: Dim) => Object.keys(d).length === 0;

function exponentText(e: number): string {
  if (e === 1) return '';
  if (e === 2) return '²';
  if (e === 3) return '³';
  return '^' + e;
}

/** Einheit als Text, z. B. { t: 1, m: -3 } → „t/m³“ (Reihenfolge wie beim ersten Auftreten) */
export function einheitText(d: Dim): string {
  const oben = Object.entries(d).filter(([, e]) => e > 0).map(([k, e]) => k + exponentText(e));
  const unten = Object.entries(d).filter(([, e]) => e < 0).map(([k, e]) => k + exponentText(-e));
  if (!oben.length && !unten.length) return '';
  const o = oben.length ? oben.join('·') : '1';
  if (!unten.length) return o;
  return o + '/' + (unten.length > 1 ? '(' + unten.join('·') + ')' : unten[0]);
}

/** Wertet einen Ausdruck mit Einheiten aus; null = kein gültiger Rechenausdruck. */
export function rechneMitEinheit(ausdruck: string): { wert: number; einheit: string } | null {
  // Vorbereiten: „x“ als Malzeichen nur zwischen Zahlen/Einheiten mit Leerzeichen oder direkt zwischen Ziffern
  let s = ausdruck
    .replace(/(\d)\s*[xX]\s*(?=[\d(])/g, '$1*')
    .replace(/\s[xX]\s/g, '*')
    .replace(/[×·*]/g, '*').replace(/[÷:]/g, '/').replace(/[−–]/g, '-')
    .replace(/(\d)\.(?=\d{3}(?!\d))/g, '$1')          // 1.667 → 1667 (Tausenderpunkt)
    .replace(/(\d),(?=\d)/g, '$1.')                      // 3,4 → 3.4
    .replace(/\s+/g, ' ').trim();
  if (!s || !/\d/.test(s)) return null;

  let i = 0;
  const leerzeichen = () => { while (s[i] === ' ') i++; };
  const fehler = (): never => { throw 0; };

  /** Einheit an Position i lesen (Buchstaben, danach optional ²/³/^n) */
  const einheit = (): Dim | null => {
    if (!BUCHSTABE.test(s[i] ?? '')) return null;
    let name = '';
    while (i < s.length && BUCHSTABE.test(s[i])) name += s[i++];
    if (name === 'x' || name === 'X') { i -= name.length; return null; }
    let e = 1;
    if (HOCH[s[i]]) e = HOCH[s[i++]];
    else if (s[i] === '^') { i++; const m = /^\d+/.exec(s.slice(i)) ?? fehler(); i += m[0].length; e = +m[0]; }
    return { [name]: e };
  };

  /** Hochzahl/Prozent hinter einer Zahl oder Klammer */
  const nach = (g: Groesse): Groesse => {
    for (;;) {
      if (s[i] === ' ' && /^ +%/.test(s.slice(i))) leerzeichen();   // „15 %“
      if (s[i] === '%') { i++; g = { v: g.v / 100, d: g.d }; continue; }
      if (HOCH[s[i]]) { const n = HOCH[s[i++]]; g = { v: Math.pow(g.v, n), d: hoch(g.d, n) }; continue; }
      if (s[i] === '^') { i++; const m = /^\d+/.exec(s.slice(i)) ?? fehler(); i += m[0].length; g = { v: Math.pow(g.v, +m[0]), d: hoch(g.d, +m[0]) }; continue; }
      return g;
    }
  };

  /** Faktor: Zahl [Einheit…] | (Ausdruck) | π | Einheit allein (nur nach × oder ÷, z. B. „/m³“) */
  const faktor = (nachOperator: boolean): Groesse => {
    leerzeichen();
    if (s[i] === '(') { i++; const g = summe(); leerzeichen(); if (s[i] !== ')') fehler(); i++; return mitEinheiten(nach(g)); }
    if (s[i] === '-') { i++; const g = faktor(nachOperator); return { v: -g.v, d: g.d }; }
    if (s[i] === '+') { i++; return faktor(nachOperator); }
    if (s[i] === 'π') { i++; return mitEinheiten(nach({ v: Math.PI, d: {} })); }
    const m = /^\d+(\.\d+)?|^\.\d+/.exec(s.slice(i));
    if (m) { i += m[0].length; return mitEinheiten(nach({ v: parseFloat(m[0]), d: {} })); }
    if (nachOperator) { const d = einheit(); if (d) return mitEinheiten({ v: 1, d }); }
    return fehler();
  };
  /** Einheiten direkt hinter einer Zahl, z. B. „3t“, „1,5 m³“, „5 kg m“ */
  const mitEinheiten = (g: Groesse): Groesse => {
    for (;;) {
      const start = i;
      leerzeichen();
      const d = einheit();
      if (!d) { i = start; return g; }
      g = { v: g.v, d: mal(g.d, d) };
    }
  };

  const produkt = (): Groesse => {
    let g = faktor(false);
    for (;;) {
      leerzeichen();
      if (s[i] === '*' || s[i] === '/') {
        const op = s[i++];
        const w = faktor(true);
        g = op === '*' ? { v: g.v * w.v, d: mal(g.d, w.d) } : { v: g.v / w.v, d: mal(g.d, w.d, -1) };
        continue;
      }
      if (s[i] === '(') { const w = faktor(false); g = { v: g.v * w.v, d: mal(g.d, w.d) }; continue; }   // 2(3+4)
      return g;
    }
  };
  const summe = (): Groesse => {
    let g = produkt();
    for (;;) {
      leerzeichen();
      if (s[i] !== '+' && s[i] !== '-') return g;
      const op = s[i++];
      const w = produkt();
      // gleiche Einheit bleibt; eine Seite ohne Einheit übernimmt die andere; verschiedene → kein Ergebnis
      let d: Dim;
      if (gleich(g.d, w.d) || leer(w.d)) d = g.d;
      else if (leer(g.d)) d = w.d;
      else return fehler();
      g = { v: op === '+' ? g.v + w.v : g.v - w.v, d };
    }
  };

  try {
    const g = summe();
    leerzeichen();
    if (i !== s.length || !isFinite(g.v)) return null;
    return { wert: g.v, einheit: einheitText(g.d) };
  } catch {
    return null;
  }
}

/**
 * Sucht am Ende einer Zeile (Text links vom „=“) den längsten auswertbaren Rechenausdruck
 * und liefert das Ergebnis als Text, z. B. „Bedarf: 3t + 2t“ → „5t“. null = nichts zu rechnen.
 */
export function zeilenErgebnis(teil: string): string | null {
  const text = teil.replace(/\s+$/, '');
  // mögliche Anfänge: Zahl, Klammer, Vorzeichen, π – jeweils nach Zeilenanfang oder Nicht-Buchstabe
  for (let start = 0; start < text.length; start++) {
    const c = text[start];
    // Vorzeichen nur ganz vorne – sonst wäre „+ 2m“ aus „3t + 2m“ ein eigener Ausdruck
    if (!/[\d(π.]/.test(c) && !(start === 0 && /[-−]/.test(c))) continue;
    if (start > 0 && /[\d.,]/.test(text[start - 1]) && /[\d.,]/.test(c)) continue;   // mitten in einer Zahl
    // Steht davor ein Rechenzeichen, gehört die Zahl zu einem längeren Ausdruck, der nicht aufging
    // (z. B. „3t + 2m“) – dann nicht nur den hinteren Teil ausrechnen.
    const davor = text.slice(0, start).replace(/\s+$/, '');
    if (davor && /[+\-−–×·*/÷:(%^]$|\s[xX]$/.test(davor)) continue;
    const r = rechneMitEinheit(text.slice(start));
    if (!r) continue;
    const zahl = r.wert.toLocaleString('de-DE', { maximumFractionDigits: 4 });
    if (!r.einheit) return zahl;
    const mitLeer = /\d\s+[A-Za-zÄÖÜäöüß€]/.test(text.slice(start));   // Schreibweise übernehmen: „3 t“ oder „3t“
    return zahl + (mitLeer ? ' ' : '') + r.einheit;
  }
  return null;
}

/** Beim Tippen: m2 → m², cm3 → cm³ usw. Liefert den neuen Text oder null, wenn sich nichts ändert. */
export function hochzahlenEinsetzen(text: string): string | null {
  const neu = text.replace(/(?<![A-Za-zÄÖÜäöüß])((?:[kcdm]?m))([23])(?!\d)/g, (_, u: string, n: string) => u + (n === '2' ? '²' : '³'));
  return neu === text ? null : neu;
}

// @ts-nocheck
/* ================================================================================
 TRASSENPLAN-GENERATOR (Gleisvermarkungsplan) – Gleisbau-Lernwelt
 ================================================================================
 Ursprünglich eine Single-File-HTML-Seite, 2026-11-10 als Engine in die App übernommen.
 Der Code ist bewusst nah am Original gehalten (daher @ts-nocheck); alle DOM-Zugriffe
 laufen über das übergebene Wurzelelement, damit mehrere Instanzen/Seitenwechsel gehen.

 RASTER:  1 Kachel = 10 m (Zoom = px pro Meter). Druck 1:1000 → 3,78 px/m.
 STATION: alle Stationen in Metern ab km 0,000 (745.03 = km 0,745 03).
          Kilometrierungsachse = Achse des RECHTEN Gleises (wie im DB-Plan).

 FORMELN (alle in Metern gerechnet, Ausgabe in mm wo üblich):
   Krümmung k = ±1/r (Rechtsbogen +). Übergangsbogen (Klothoide): k linear, Überhöhungsrampe gerade.
   20m-Pfeilhöhe (Sehne 20 m): f(x) = ½ ∫_{-10}^{+10} (10 − |t|) · k(x+t) dt → im Kreisbogen = 50 000 / r [mm]
   Grundriß-Pfeilhöhe (Sehne s1..s2, Länge L): f(s) = ∫ G(s,t) k(t) dt → im Kreisbogen (s−s1)(s2−s)/(2r)
   Neigungswechsel: T = ra·|Δi|/2,  f = T²/(2ra)
   Ausgleichsüberhöhung u0 = 11,8·v²/r,  Überhöhungsfehlbetrag uf = u0 − u
   Rampenneigung 1:m mit m = Rampenlänge·1000 / Δu

 ÜBUNGSMODUS (neu): setUebung(felder) blendet die gesuchten Werte im Plan aus und legt an
 die passende Stelle ein Eingabefeld. Die Prüfung macht die aufrufende Seite.

 GRENZWERTE: im Editor einstellbar. Voreinstellungen orientieren sich an Ril 800.0110 –
 vor Verwendung im Unterricht gegen die gültige Fassung prüfen!
================================================================================ */

export type UebungsArt = 'f20' | 'fgr' | 'uS' | 'm' | 'u0' | 'uf' | 'T' | 'f';

export interface UebungsFeld {
  id: string;
  art: UebungsArt;
  gleis: 'L' | 'R';
  /** Station der Eingabe (bei m/u0/uf: Elementanfang, bei T/f: Station des NW). */
  s: number;
  /** Nur bei fgr: Sehnenanfang/-ende (Festpunkte). */
  a?: number;
  e?: number;
  /** Elementmitte (m/u0/uf) – wird für die Position genutzt. */
  mitte?: number;
  kurz: string;
  einheit: string;
}

export interface TrassenplanOptionen {
  /** Wird nach jeder Planänderung (Editor, JSON laden, Beispielplan) aufgerufen. */
  onChange?: () => void;
  /** Enter in einem Übungsfeld. */
  onPruefen?: () => void;
}

export interface TrassenplanApi {
  getPlan(): any;
  setPlan(p: any): void;
  analyse(): any;
  setUebung(felder: UebungsFeld[] | null): void;
  werte(): Record<string, string>;
  setStatus(st: Record<string, string>): void;
  zeigeFeld(id: string): void;
  neuZeichnen(): void;
  destroy(): void;
}

const DEMO = {
  meta: { titel: 'Gleisvermarkungsplan (Übungsplan)', strecke: '9999', von: 'Musterstadt Hbf', nach: 'Beispieldorf', bearbeiter: 'Gleisbau-Lernwelt', datum: '', hg: 160 },
  kmStart: 600, kmEnde: 1000,
  gleise: {
    L: { name: 'Gleis links', elemente: [
      { typ: 'G', l: 40 }, { typ: 'UB', l: 100 }, { typ: 'KB', l: 100, r: 1204.5, dir: 'R', u: 70, v: 120 }, { typ: 'UB', l: 100 }, { typ: 'G', l: 60 }],
      nw: [{ km: 600, h: 486.080, ra: 0 }, { km: 790, h: 484.775, ra: 20000 }, { km: 1000, h: 483.050, ra: 0 }] },
    R: { name: 'Gleis rechts', elemente: [
      { typ: 'G', l: 40 }, { typ: 'UB', l: 100 }, { typ: 'KB', l: 100, r: 1200, dir: 'R', u: 70, v: 120 }, { typ: 'UB', l: 100 }, { typ: 'G', l: 60 }],
      nw: [{ km: 600, h: 486.100, ra: 0 }, { km: 790, h: 484.789, ra: 20000 }, { km: 1000, h: 483.067, ra: 0 }] },
  },
  gleisabstand: [{ km: 600, a: 4.50 }, { km: 1000, a: 4.50 }],
  weichen: [
    { gleis: 'R', km: 955.00, art: 'EW', typ: '49-500-1:12', richtung: 'R', laenge: 33.23 },
    { gleis: 'L', km: 945.00, art: 'EW', typ: '54-500-1:12', richtung: 'L', laenge: 33.23 },
  ],
  punkte: [
    { gleis: 'L', km: 612.40, nr: '0/30', art: 'mast', abstand: 3.215, dh: -52, hNN: '', istAbstand: '', istHoehe: '' },
    { gleis: 'L', km: 668.15, nr: '0/32', art: 'mast', abstand: 3.180, dh: 85, hNN: '', istAbstand: '', istHoehe: '' },
    { gleis: 'L', km: 721.80, nr: '0/34', art: 'mast', abstand: 3.240, dh: -41, hNN: '', istAbstand: '', istHoehe: '' },
    { gleis: 'L', km: 776.20, nr: '0/36', art: 'mast', abstand: 3.205, dh: 142, hNN: '', istAbstand: '', istHoehe: '' },
    { gleis: 'L', km: 829.95, nr: '0/38', art: 'mast', abstand: 3.190, dh: -75, hNN: '', istAbstand: '', istHoehe: '' },
    { gleis: 'L', km: 884.10, nr: '0/40', art: 'mast', abstand: 3.225, dh: 46, hNN: '', istAbstand: '', istHoehe: '' },
    { gleis: 'L', km: 938.60, nr: '0/42', art: 'mast', abstand: 3.210, dh: 146, hNN: '', istAbstand: '', istHoehe: '' },
    { gleis: 'L', km: 993.35, nr: '0/44', art: 'mast', abstand: 3.230, dh: -83, hNN: '', istAbstand: '', istHoehe: '' },
    { gleis: 'R', km: 612.40, nr: '0/31', art: 'mast', abstand: 3.105, dh: -91, hNN: '', istAbstand: '', istHoehe: '' },
    { gleis: 'R', km: 668.15, nr: '0/33', art: 'mast', abstand: 3.150, dh: 105, hNN: '', istAbstand: '', istHoehe: '' },
    { gleis: 'R', km: 721.80, nr: '0/35', art: 'mast', abstand: 3.120, dh: -417, hNN: '', istAbstand: '', istHoehe: '' },
    { gleis: 'R', km: 776.20, nr: '0/37', art: 'mast', abstand: 3.135, dh: 75, hNN: '', istAbstand: '', istHoehe: '' },
    { gleis: 'R', km: 829.95, nr: '0/39', art: 'mast', abstand: 3.160, dh: -176, hNN: '', istAbstand: '', istHoehe: '' },
    { gleis: 'R', km: 884.10, nr: '0/41', art: 'mast', abstand: 3.110, dh: 143, hNN: '', istAbstand: '', istHoehe: '' },
    { gleis: 'R', km: 938.60, nr: '0/43', art: 'mast', abstand: 3.145, dh: -83, hNN: '', istAbstand: '', istHoehe: '' },
    { gleis: 'R', km: 993.35, nr: '0/45', art: 'mast', abstand: 3.125, dh: -64, hNN: '', istAbstand: '', istHoehe: '' },
  ],
  bauwerke: [
    { typ: 'Brücke', von: 880, bis: 900, name: 'Eisenbahnbrücke über den Mühlbach', ok: '' },
    { typ: 'Durchlass', von: 652, bis: 652, name: 'Durchlass DN 1000', ok: '' },
  ],
  grenz: { uMax: 160, uMaxAusn: 180, ufMax: 130, ufMaxAusn: 150, mFaktorRegel: 10, mFaktorMin: 6, mAbsMin: 400, raFaktorRegel: 0.4, raFaktorMin: 0.25, raAbsMin: 2000, neigMax: 12.5, gaMin: 4.0, pktAbstandMax: 80 },
};

const LS_KEY = 'gbl_trassenplan_v2';
const LEG_W = 215, PADL = 24, PADR = 24;

const GERUEST = `
<div class="tpg-bar">
  <button type="button" data-b="edit">Daten bearbeiten</button>
  <button type="button" data-b="neu">Beispielplan laden</button>
  <button type="button" data-b="json">JSON speichern</button>
  <label class="tpg-btn">JSON laden<input type="file" data-b="fjson" accept=".json,application/json" hidden></label>
  <button type="button" data-b="svg">SVG exportieren</button>
  <button type="button" data-b="print">Drucken</button>
  <div class="zoom">Zoom <input type="range" data-b="zoom" min="2" max="16" step="0.1" value="6"> <span id="zoomTxt"></span>
    <button type="button" data-b="1000" title="1 Kachel = 1 cm (bei 96 dpi)">1:1000</button></div>
</div>
<div class="layout">
  <aside id="side"><div id="editor"></div><section id="checks"></section></aside>
  <div id="right">
    <div id="planWrap">
      <div id="scroll"></div>
      <div id="legendBox"></div>
      <div id="info"></div>
    </div>
  </div>
</div>`;

export function createTrassenplan(root: HTMLElement, opts: TrassenplanOptionen = {}): TrassenplanApi {
  root.innerHTML = GERUEST;
  root.classList.add('tpg');

  let P;
  const state = { px: 6, legendSVG: '', planSVG: '', W: 0, H: 0, ctx: null, ueb: null, uebPos: [], uebWerte: {}, uebStatus: {} };

  /* ---------------- Hilfsfunktionen ---------------- */
  const $ = s => root.querySelector(s);
  const btn = n => root.querySelector(`[data-b="${n}"]`);
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };
  const fmt = (x, d) => (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace('.', ',');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hm = s => fmt(((s % 100) + 100) % 100, 2);
  const kmTxt = (s, d = 5) => 'km ' + (s / 1000).toFixed(d).replace('.', ',');
  function st5(a, b, inclEnds = true) { const r = []; for (let s = Math.ceil((a - 1e-7) / 5) * 5; s <= b + 1e-7; s += 5) { if (!inclEnds && (Math.abs(s - a) < 1e-6 || Math.abs(s - b) < 1e-6)) continue; r.push(Math.round(s * 1000) / 1000); } return r; }
  const clone = o => JSON.parse(JSON.stringify(o));

  function normalisieren(d) {
    const v = { L: vert(d.gleise.L), R: vert(d.gleise.R) };
    (d.punkte || []).forEach(p => { if (p.dh != null) { p.hNN = Math.round((hAt(v[p.gleis], p.km) + p.dh / 1000) * 1000) / 1000; delete p.dh; } });
    if (!d.grenz) d.grenz = clone(DEMO.grenz);
    return d;
  }
  function makeDemo() { return normalisieren(clone(DEMO)); }
  function load() { try { const s = localStorage.getItem(LS_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(P)); } catch (e) { /* privat */ } opts.onChange?.(); }

  /* ---------------- Geometrie – Lage ---------------- */
  function geom(g) {
    let s = num(P.kmStart); const segs = [];
    g.elemente.forEach((e, i) => { const l = Math.max(0, num(e.l)); segs.push({ ...e, l, r: num(e.r), u: num(e.u), v: num(e.v), s0: s, s1: s + l, i }); s += l; });
    const kOf = e => e.typ === 'KB' && e.r > 0 ? (e.dir === 'L' ? -1 : 1) / e.r : 0;
    const uOf = e => e.typ === 'KB' ? e.u : 0;
    segs.forEach((q, i) => {
      if (q.typ === 'UB') {
        const p = segs[i - 1], n = segs[i + 1];
        q.k0 = p && p.typ !== 'UB' ? kOf(p) : 0; q.k1 = n && n.typ !== 'UB' ? kOf(n) : 0;
        q.u0 = p && p.typ !== 'UB' ? uOf(p) : 0; q.u1 = n && n.typ !== 'UB' ? uOf(n) : 0;
        q.vRamp = Math.max(p && p.typ === 'KB' ? p.v : 0, n && n.typ === 'KB' ? n.v : 0) || num(P.meta.hg);
      } else { q.k0 = q.k1 = kOf(q); q.u0 = q.u1 = uOf(q); }
    });
    return segs;
  }
  function segAt(segs, s) { for (const q of segs) if (s >= q.s0 && s < q.s1) return q; return null; }
  function kAt(segs, s) { const q = segAt(segs, s); if (!q || q.s1 === q.s0) return 0; return q.k0 + (q.k1 - q.k0) * (s - q.s0) / (q.s1 - q.s0); }
  function uAt(segs, s) { const q = segAt(segs, s); if (!q || q.s1 === q.s0) return 0; return q.u0 + (q.u1 - q.u0) * (s - q.s0) / (q.s1 - q.s0); }
  function pf20(segs, s) { const h = 10, n = 400, dt = 2 * h / n; let sum = 0; for (let i = 0; i <= n; i++) { const t = -h + i * dt, w = (i === 0 || i === n) ? .5 : 1; sum += w * (h - Math.abs(t)) * kAt(segs, s + t); } return .5 * sum * dt; }
  function chordOff(segs, s1, s2, s) {
    const L = s2 - s1; if (L <= 0) return 0; const n = Math.max(200, Math.ceil(L / 0.05)), dt = L / n; let sum = 0;
    for (let i = 0; i <= n; i++) { const t = s1 + i * dt, w = (i === 0 || i === n) ? .5 : 1; const G = t < s ? (t - s1) * (s2 - s) / L : (s - s1) * (s2 - t) / L; sum += w * G * kAt(segs, t); }
    return sum * dt;
  }
  function transitions(segs) {
    const out = [];
    segs.forEach((q, i) => {
      const p = segs[i - 1], n = segs[i + 1];
      if (q.typ === 'UB') { out.push({ s: q.s0, l: 'ÜA' }); out.push({ s: q.s1, l: 'ÜE' }); }
      else if (q.typ === 'KB') { if (!p || p.typ === 'G') out.push({ s: q.s0, l: 'BA' }); else if (p.typ === 'KB') out.push({ s: q.s0, l: 'BW' }); if (!n || n.typ === 'G') out.push({ s: q.s1, l: 'BE' }); }
    });
    const seen = new Set(); return out.filter(o => { const k = o.s.toFixed(3); if (seen.has(k)) return false; seen.add(k); return true; });
  }

  /* ---------------- Geometrie – Höhe ---------------- */
  function vert(g) {
    const nw = g.nw.map(o => ({ km: num(o.km), h: num(o.h), ra: num(o.ra) })).sort((a, b) => a.km - b.km);
    const gr = []; for (let i = 0; i < nw.length - 1; i++) { const d = nw[i + 1].km - nw[i].km; gr.push(d > 0 ? (nw[i + 1].h - nw[i].h) / d : 0); }
    nw.forEach((p, i) => {
      p.gIn = gr[i - 1]; p.gOut = gr[i]; p.T = 0; p.f = 0;
      if (i > 0 && i < nw.length - 1 && p.ra > 0) { const dg = p.gOut - p.gIn; p.T = p.ra * Math.abs(dg) / 2; p.f = p.T * p.T / (2 * p.ra); p.wanne = dg > 0; }
    });
    return { nw, gr };
  }
  function tamAt(v, s) { for (const p of v.nw) if (p.T > 0 && Math.abs(s - p.km) <= p.T) { const d = p.T - Math.abs(s - p.km); return { y: d * d / (2 * p.ra), wanne: p.wanne, p }; } return null; }
  function hAt(v, s) {
    const { nw, gr } = v; if (nw.length < 2) return nw[0] ? nw[0].h : 0;
    let i = 0; while (i < gr.length - 1 && s > nw[i + 1].km) i++;
    let h = nw[i].h + gr[i] * (s - nw[i].km); const t = tamAt(v, s); if (t) h += t.wanne ? t.y : -t.y; return h;
  }
  function gAt(v, s) { const { nw, gr } = v; let i = 0; while (i < gr.length - 1 && s > nw[i + 1].km) i++; return gr[i] || 0; }
  function gaAt(s) {
    const a = [...P.gleisabstand].map(o => ({ km: num(o.km), a: num(o.a) })).sort((x, y) => x.km - y.km); if (!a.length) return 4.5;
    if (s <= a[0].km) return a[0].a; for (let i = 0; i < a.length - 1; i++) if (s <= a[i + 1].km) { const t = (s - a[i].km) / ((a[i + 1].km - a[i].km) || 1); return a[i].a + (a[i + 1].a - a[i].a) * t; } return a[a.length - 1].a;
  }

  /* ---------------- Bänder ---------------- */
  const BANDS = [
    { id: 'bau', h: 74, label: 'Bauwerke' },
    { id: 'neig', h: 116, label: 'Neigungen\nHöhenlage [m]\n(- - - Gl. links / —— Gl. rechts)' },
    { id: 'km', h: 54, label: 'Kilometerlinie' },
    { id: 'ueb_L', h: 64, label: 'Überhöhungen [mm]' },
    { id: 'kr_L', h: 108, label: '20 m-Pfeilhöhen [mm]\nKrümmungslinie' },
    { id: 'mast_L', h: 40, label: 'Kilometrierungsangabe [m]\nOberleitungsmast Nr. / Punkt Nr.' },
    { id: 'gpf_L', h: 96, label: 'Grundriß-\nPfeilhöhen [mm]' },
    { id: 'lage', h: 210, label: 'Lageskizze' },
    { id: 'gpf_R', h: 96, label: 'Grundriß-\nPfeilhöhen [mm]' },
    { id: 'mast_R', h: 40, label: 'Oberleitungsmast Nr. / Punkt Nr.\nKilometrierungsangabe [m]' },
    { id: 'kr_R', h: 108, label: 'Krümmungslinie\n20 m-Pfeilhöhen [mm]' },
    { id: 'ueb_R', h: 64, label: 'Überhöhungen [mm]' },
  ];
  const SVG_STYLE = `<style>
.t{font:11px 'Arial Narrow','Helvetica Neue',Arial,sans-serif;fill:#111}
.ti{font-style:italic}.ts{font-size:9px}.tm{font-size:12.5px}.tb{font-size:14px;font-weight:700}.tl{font-size:17px;font-weight:700}
.mut{fill:#5b6b7a}.red{fill:#c8102e}
.g10{stroke:#8e9daa;stroke-width:.9}.g100{stroke:#2f3e4c;stroke-width:1.5}.gsub{stroke:#e1e7ec;stroke-width:.6}
.bl{stroke:#111;stroke-width:1.2}
.ln{stroke:#111;fill:none;stroke-width:1.2}.thick{stroke-width:2.6}.dash{stroke-dasharray:7 4}
.lead{stroke:#111;stroke-dasharray:3 3;stroke-width:.8;fill:none}
.ueblead{stroke:#c8102e;stroke-dasharray:4 3;stroke-width:1.2;fill:none}
.thin{stroke:#111;stroke-width:.7;fill:none}
.blk{fill:#111}.wht{fill:#fff;stroke:#111;stroke-width:1.1}
.uebf{fill:#dfe6ed;stroke:#111;stroke-width:1.1}
.gpl{stroke:#111;stroke-width:1;fill:none}
.hatch{fill:url(#hatch);stroke:#111;stroke-width:1}
</style>
<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#111" stroke-width="1"/></pattern>
<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#111"/></marker></defs>`;

  function T(x, y, s, cls = '', anchor = 'start', extra = '') { return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="t ${cls}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`; }
  function TR(x, y, s, cls = 'ts') { return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="t ${cls}" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90 ${x.toFixed(1)} ${y.toFixed(1)})">${esc(s)}</text>`; }
  function Ln(x1, y1, x2, y2, cls = 'ln', extra = '') { return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${cls}" ${extra}/>`; }
  function Pl(pts, cls = 'ln') { return `<polyline points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" class="${cls}"/>`; }

  /* Übungsmodus: Felder einer Art (optional für Gleis / Station) */
  const uebHat = art => !!state.ueb && state.ueb.some(f => f.art === art);
  const uebFeld = (art, gid, s) => state.ueb ? state.ueb.find(f => f.art === art && f.gleis === gid && Math.abs(f.s - s) < 1e-3) : null;

  /* ---------------- Zeichnen ---------------- */
  function draw() {
    const s0 = num(P.kmStart), s1 = num(P.kmEnde), px = state.px;
    if (!(s1 > s0)) { $('#scroll').innerHTML = '<p style="padding:20px">km-Ende muss größer als km-Anfang sein.</p>'; return; }
    const X = s => PADL + (s - s0) * px, inR = s => s >= s0 - 1e-6 && s <= s1 + 1e-6, cl = s => Math.max(s0, Math.min(s1, s));
    const plotW = PADL + (s1 - s0) * px + PADR, W = plotW;
    let y = 0; const B = {}; BANDS.forEach(b => { B[b.id] = { ...b, y }; y += b.h; }); const H = y + 2;
    const G = { L: geom(P.gleise.L), R: geom(P.gleise.R) }, V = { L: vert(P.gleise.L), R: vert(P.gleise.R) };
    state.ctx = { s0, s1, px, X, G, V, B };
    const o = [];
    const pos = [];
    const feldPos = (f, x, yy) => { if (f) pos.push({ id: f.id, x, y: yy, kurz: f.kurz, einheit: f.einheit }); };

    /* Raster: 1 Kachel = 10 m */
    for (let s = Math.ceil(s0 / 10) * 10; s <= s1 + 1e-6; s += 10) { const c = Math.round(s) % 100 === 0 ? 'g100' : 'g10'; o.push(Ln(X(s), 0, X(s), H, c)); }
    BANDS.forEach(b => {
      const yy = B[b.id].y; o.push(Ln(0, yy, plotW, yy, 'bl'));
      if (b.h >= 60) for (let k = 1; k < 3; k++) o.push(Ln(PADL, yy + b.h * k / 3, plotW - PADR, yy + b.h * k / 3, 'gsub'));
    });
    o.push(Ln(0, H - 1, plotW, H - 1, 'bl'));
    o.push(Ln(X(s0), 0, X(s0), H, 'bl'), Ln(X(s1), 0, X(s1), H, 'bl'));

    /* Bauwerke */
    { const b = B.bau; (P.bauwerke || []).forEach(w => {
      const a = num(w.von), e = Math.max(num(w.bis), a); if (e < s0 || a > s1) return; const xa = X(cl(a)), xe = X(cl(e));
      if (w.typ === 'Brücke') {
        o.push(`<path d="M${xa},${b.y + 64} V${b.y + 30} H${xe} V${b.y + 64}" class="ln" style="stroke-width:5"/>`);
        o.push(T(xa - 4, b.y + 14, w.name, 'ts ti', 'end'), T(xe + 4, b.y + 28, 'OK=' + (w.ok || ''), 'ts'));
        o.push(Ln(X((a + e) / 2), b.y + 30, X((a + e) / 2), b.y + b.h, 'lead'));
      } else if (w.typ === 'Tunnel') { o.push(`<rect x="${xa}" y="${b.y + 24}" width="${Math.max(2, xe - xa)}" height="30" class="hatch"/>`, T(xa, b.y + 16, w.name, 'ts ti')); }
      else if (w.typ === 'BÜ') { const xm = X(a); o.push(Ln(xm - 9, b.y + 28, xm + 9, b.y + 50, 'ln'), Ln(xm - 9, b.y + 50, xm + 9, b.y + 28, 'ln'), T(xm, b.y + 18, 'BÜ ' + (w.name || ''), 'ts', 'middle'), Ln(xm, b.y + 50, xm, b.y + b.h, 'lead')); }
      else { const xm = X(a); o.push(`<circle cx="${xm}" cy="${b.y + 42}" r="8" class="wht"/>`, T(xm, b.y + 22, w.name, 'ts ti', 'middle'), Ln(xm, b.y + 50, xm, b.y + b.h, 'lead')); }
    }); }

    /* Neigungen / Höhenlage */
    { const b = B.neig; const yy = { L: b.y + 42, R: b.y + 94 };
      const hideTf = uebHat('T') || uebHat('f');
      ['L', 'R'].forEach(gid => {
        const v = V[gid], y0 = yy[gid], dc = gid === 'L' ? 'ln dash' : 'ln';
        for (let i = 0; i < v.gr.length; i++) {
          const a = v.nw[i].km, e = v.nw[i + 1].km; if (e < s0 || a > s1) continue; const xa = X(cl(a)), xe = X(cl(e)), xm = (xa + xe) / 2, g = v.gr[i] * 1000;
          o.push(Ln(xa, y0, xe, y0, dc));
          o.push(T(xm, y0 - 16, (g > 0 ? '+' : '') + fmt(g, 3) + ' ‰', 'tm ti', 'middle'), T(xm, y0 - 4, fmt(e - a, 2) + ' m', 'tm ti', 'middle'));
          const dx = 14, dy = g > 0.0005 ? -5 : g < -0.0005 ? 5 : 0; o.push(Ln(xm + 48, y0 - 12 - dy, xm + 48 + dx, y0 - 12 + dy, 'thin', 'marker-end="url(#arr)"'));
        }
        v.nw.forEach((p, i) => {
          if (!inR(p.km)) return; const x = X(p.km);
          o.push(`<circle cx="${x}" cy="${y0}" r="5" class="wht"/>`, Ln(x - 5, y0, x + 5, y0, 'thin'), Ln(x, y0 - 5, x, y0 + 5, 'thin'));
          const anc = p.km <= s0 + 1e-6 ? 'start' : p.km >= s1 - 1e-6 ? 'end' : 'middle'; o.push(T(x + (anc === 'start' ? 4 : anc === 'end' ? -4 : 0), y0 - 22, 'NW=' + fmt(p.h, 3), 'tb', anc));
          if (i > 0 && i < v.nw.length - 1) {
            if (hideTf && p.ra > 0) {
              o.push(T(x, y0 + 12, `rₐ=${Math.round(p.ra)}  T=…  f=…`, 'ts', 'middle'));
              feldPos(uebFeld('T', gid, p.km), x - 42, y0 + 16);
              feldPos(uebFeld('f', gid, p.km), x + 42, y0 + 16);
            } else o.push(T(x, y0 + 12, p.ra > 0 ? `rₐ=${Math.round(p.ra)}  T=${fmt(p.T, 3)}  f=${fmt(p.f, 3)}` : 'ohne Ausrundung', 'ts', 'middle'));
          }
          o.push(Ln(x, y0 + 16, x, B.km.y + 16, 'lead'));
          if (gid === 'R') o.push(T(x + 3, B.km.y + 13, hm(p.km), 'ts mut'));
        });
      }); }

    /* Kilometerlinie */
    { const b = B.km, yk = b.y + 16; o.push(Ln(X(s0), yk, X(s1), yk, 'ln thick'));
      for (let s = Math.ceil(s0 / 10) * 10; s <= s1 + 1e-6; s += 10) {
        const r = Math.round(s); const big = r % 100 === 0; o.push(Ln(X(s), yk, X(s), yk + (big ? 9 : 4), 'ln'));
        if (big) { if (r % 1000 === 0) o.push(T(X(s), yk + 30, (r / 1000).toFixed(1).replace('.', ','), 'tl', 'middle')); else o.push(T(X(s), yk + 24, String((r / 100) % 10), 'tb', 'middle')); }
      } }

    /* je Gleis: Überhöhung, Krümmung, Mast, Grundriß-Pfeilhöhen */
    ['L', 'R'].forEach(gid => {
      const segs = G[gid];
      // Überhöhungen
      { const b = B['ueb_' + gid], ax = b.y + b.h - 14, sc = .22; const pts = [[X(s0), ax]];
        segs.forEach(q => { if (q.s1 < s0 || q.s0 > s1) return; const a = cl(q.s0), e = cl(q.s1); pts.push([X(a), ax - uAt(segs, a + 1e-9) * sc], [X(e), ax - (q.u0 + (q.u1 - q.u0) * ((e - q.s0) / ((q.s1 - q.s0) || 1))) * sc]); });
        pts.push([X(s1), ax]); o.push(`<polygon points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" class="uebf"/>`);
        o.push(Ln(X(s0), ax, X(s1), ax, 'ln'));
        const hideM = uebHat('m');
        segs.forEach(q => {
          const xm = X(cl((q.s0 + q.s1) / 2)); if (q.s1 < s0 || q.s0 > s1) return;
          if (q.typ === 'KB' && q.u > 0) o.push(T(xm, ax - q.u * sc - 4, 'u = ' + Math.round(q.u), 'tm', 'middle'));
          if (q.typ === 'KB') { const f0 = uebFeld('u0', gid, q.s0), f1 = uebFeld('uf', gid, q.s0); feldPos(f0, xm - 52, b.y + 1); feldPos(f1, xm + 52, b.y + 1); }
          if (q.typ === 'UB' && q.u0 !== q.u1) {
            if (hideM) {
              o.push(T(xm, ax + 11, 'Rampe 1:…', 'ts ti', 'middle'));
              feldPos(uebFeld('m', gid, q.s0), xm, b.y + 1);
            } else { const m = q.l * 1000 / Math.abs(q.u1 - q.u0); o.push(T(xm, ax + 11, 'Rampe 1:' + Math.round(m), 'ts ti', 'middle')); }
          }
        });
        (state.ueb || []).filter(f => f.art === 'uS' && f.gleis === gid && inR(f.s)).forEach(f => {
          const x = X(f.s), yu = ax - uAt(segs, f.s) * sc;
          o.push(Ln(x, b.y + 30, x, ax, 'ueblead'), `<circle cx="${x.toFixed(1)}" cy="${yu.toFixed(1)}" r="3" fill="#c8102e"/>`);
          feldPos(f, x, b.y + 1);
        }); }
      // Krümmungslinie + 20-m-Pfeilhöhen
      { const b = B['kr_' + gid], ax = b.y + b.h * 0.66, amp = b.h * 0.27;
        const fy = k => ax - Math.sign(k) * Math.sqrt(Math.min(Math.abs(k) * 300, 1)) * amp;
        const pts = [[X(s0), fy(kAt(segs, s0))]];
        segs.forEach(q => { if (q.s1 < s0 || q.s0 > s1) return; const a = cl(q.s0), e = cl(q.s1); pts.push([X(a), fy(kAt(segs, a + 1e-9))], [X(e), fy(q.k0 + (q.k1 - q.k0) * ((e - q.s0) / ((q.s1 - q.s0) || 1)))]); });
        const last = segs.length ? segs[segs.length - 1].s1 : s0; if (last < s1) pts.push([X(Math.max(last, s0)), ax], [X(s1), ax]);
        o.push(Ln(X(s0), ax, X(s1), ax, 'thin'), Pl(pts, 'ln thick'));
        segs.forEach(q => {
          if (q.typ !== 'KB' || q.s1 < s0 || q.s0 > s1) return; const xm = X(cl((q.s0 + q.s1) / 2)), yk = fy(q.k0), below = yk < ax;
          o.push(T(xm, below ? ax + 15 : ax - 20, 'r = ' + String(Math.round(q.r * 10) / 10).replace('.', ','), 'tb', 'middle')); if (q.v) o.push(T(xm, below ? ax + 29 : ax - 6, 'V = ' + q.v, 'tm', 'middle'));
        });
        transitions(segs).forEach(t => { if (!inR(t.s)) return; const x = X(t.s); o.push(Ln(x, b.y + 22, x, b.y + b.h, 'lead'), T(x + 3, b.y + b.h - 16, t.l, 'tm'), T(x + 3, b.y + b.h - 4, hm(t.s), 'ts')); });
        const hideF20 = uebHat('f20');
        st5(s0, s1).forEach(s => {
          const f = uebFeld('f20', gid, s);
          if (f) { o.push(Ln(X(s), b.y + 34, X(s), b.y + b.h, 'ueblead')); feldPos(f, X(s), b.y + 1); return; }
          if (hideF20) return;
          const v = pf20(segs, s); let act = false; for (let t = -10; t <= 10; t += 2.5) if (Math.abs(kAt(segs, s + t)) > 1e-9) { act = true; break; }
          if (act) o.push(TR(X(s), b.y + 11, String(Math.round(Math.abs(v) * 1000))));
        });
      }
      // Kilometrierungsangabe / Mast
      { const b = B['mast_' + gid]; const pk = P.punkte.filter(p => p.gleis === gid && inR(num(p.km)));
        pk.forEach(p => { const x = X(num(p.km)), w = String(p.nr).length * 6.4 + 8; o.push(T(x - 3, b.y + 24, hm(num(p.km)), 'tm', 'end'), `<rect x="${x + 1}" y="${b.y + 12}" width="${w}" height="16" class="wht" style="stroke-width:.8"/>`, T(x + 5, b.y + 24, p.nr, 'ts')); });
        P.weichen.filter(w => w.gleis === gid && inR(num(w.km))).forEach(w => { o.push(T(X(num(w.km)), b.y + 38, 'WA=' + hm(num(w.km)), 'ts', 'middle')); }); }
      // Grundriß-Pfeilhöhen
      { const b = B['gpf_' + gid], base = b.y + 42, A = 13, yNum = b.y + 70; const pk = P.punkte.filter(p => p.gleis === gid).map(p => ({ ...p, km: num(p.km) })).sort((a, c) => a.km - c.km);
        for (let i = 0; i < pk.length - 1; i++) {
          const a = pk[i].km, e = pk[i + 1].km; if (e <= a || e < s0 || a > s1) continue;
          const sts = st5(a, e, false).map(s => ({ s, f: chordOff(segs, a, e, s) }));
          const sum = sts.reduce((t, q) => t + q.f, 0), dir = Math.abs(sum) < 1e-6 ? 0 : (sum > 0 ? 1 : -1);
          const xa = X(cl(a)), xe = X(cl(e));
          if (dir === 0) o.push(Ln(xa, base, xe, base, 'gpl'));
          else o.push(`<path d="M${X(a).toFixed(1)},${base} Q${((X(a) + X(e)) / 2).toFixed(1)},${(base + dir * 2 * A).toFixed(1)} ${X(e).toFixed(1)},${base}" class="gpl"/>`);
          const hideChord = !!state.ueb && state.ueb.some(f => f.art === 'fgr' && f.gleis === gid && Math.abs(f.a - a) < 1e-3 && Math.abs(f.e - e) < 1e-3);
          sts.forEach(q => {
            if (!inR(q.s)) return;
            const f = uebFeld('fgr', gid, q.s);
            if (f && hideChord) { o.push(Ln(X(q.s), b.y + 4, X(q.s), b.y + 50, 'ueblead')); feldPos(f, X(q.s), b.y + 52); return; }
            if (hideChord) return;
            o.push(TR(X(q.s), yNum, String(Math.round(Math.abs(q.f) * 1000))));
          });
          if (sts.length) {
            const d1 = sts[0].s - a, d2 = e - sts[sts.length - 1].s;
            if (inR(a)) o.push(T(X(a) + 3, b.y + 14, fmt(d1, 3), 'ts'));
            if (inR(e)) o.push(T(X(e) - 3, b.y + 14, fmt(d2, 3), 'ts', 'end'));
            o.push(T(X(cl((a + e) / 2)), b.y + b.h - 4, 's = ' + fmt(e - a, 3) + ' m', 'ts mut', 'middle'));
          }
        }
        pk.forEach(p => { if (inR(p.km)) { const x = X(p.km); o.push(Ln(x, b.y + 4, x, base + 6, 'thin'), `<circle cx="${x}" cy="${base}" r="2.2" class="blk"/>`); } }); }
    });

    /* Lageskizze */
    { const b = B.lage, yL = b.y + 72, yR = b.y + 138;
      o.push(Ln(X(s0), yL, X(s1), yL, 'ln thick'), Ln(X(s0), yR, X(s1), yR, 'ln thick'));
      o.push(T(X(s0) + 4, yL - 5, P.gleise.L.name || 'Gleis links', 'ts mut'), T(X(s0) + 4, yR + 12, (P.gleise.R.name || 'Gleis rechts') + ' (Kilometrierungsachse)', 'ts mut'));
      const ga = [...P.gleisabstand].map(q => ({ km: num(q.km), a: num(q.a) })).sort((p, q) => p.km - q.km);
      ga.forEach((q, i) => {
        if (!inR(q.km)) return; const x = X(q.km) + (q.km <= s0 + 1e-6 ? 18 : q.km >= s1 - 1e-6 ? -18 : 0);
        o.push(Ln(x, yL + 3, x, yR - 3, 'thin', 'marker-start="url(#arr)" marker-end="url(#arr)"'), T(x + 4, (yL + yR) / 2 + 4, fmt(q.a, 2), 'tm ti'));
        const n = ga[i + 1]; if (n && Math.abs(n.a - q.a) > 1e-6) o.push(T(X(cl((q.km + n.km) / 2)), (yL + yR) / 2 + 16, `von ${fmt(q.a, 2)} auf ${fmt(n.a, 2)}`, 'ts ti', 'middle'));
      });
      P.weichen.forEach(w => {
        const a = num(w.km), e = a + num(w.laenge); if (e < s0 || a > s1) return; const yt = w.gleis === 'L' ? yL : yR, dy = w.richtung === 'L' ? -1 : 1;
        const xa = X(a), xe = X(Math.min(e, s1)); o.push(`<polygon points="${xa},${yt} ${xe},${yt} ${xe},${yt + dy * 13}" class="blk"/>`);
        o.push(Ln(xa, yt, xe + px * 12, yt + dy * 20, 'ln'), Ln(xa, yt - 6, xa, yt + 6, 'ln'));
        o.push(T(xa + (xe - xa) * 0.5, yt - dy * 7 + (dy < 0 ? 9 : 0), `${w.art} ${w.typ}`, 'ts', 'middle'));
      });
      P.punkte.forEach(p => {
        const s = num(p.km); if (!inR(s)) return; const x = X(s), L = p.gleis === 'L', yt = L ? yL : yR, sy = L ? yL - 40 : yR + 40;
        o.push(Ln(x, sy, x, yt, 'thin')); o.push(sym(p.art, x, sy));
        const ist = v => v !== '' && v != null ? `( ${v} )` : '(    )';
        const yIst = L ? sy - 12 : sy + 18, yAb = sy + 4, yOther = L ? sy + 17 : sy - 9;
        o.push(T(x + 7, yAb, fmt(num(p.abstand), 3), 'tm', 'start', 'text-decoration="underline"'));
        o.push(T(x + 7, yOther, fmt(num(p.abstand) + gaAt(s), 3), 'ts mut'));
        const hh = dhPunkt(p, V); o.push(T(x - 7, yAb, (hh > 0 ? '+' : '') + Math.round(hh), 'ts', 'end'));
        o.push(T(x - 7, yIst, ist(p.istHoehe), 'ts red', 'end'), T(x + 7, yIst, ist(p.istAbstand), 'ts red'));
      }); }

    o.push(`<line id="cross" x1="0" y1="0" x2="0" y2="${H}" stroke="#c8102e" stroke-width="1" stroke-dasharray="4 3" style="display:none"/>`);

    state.W = W; state.H = H; state.uebPos = pos;
    state.planSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" id="planSvg">${SVG_STYLE}<rect width="${W}" height="${H}" fill="#fff"/>${o.join('')}</svg>`;
    const lg = []; BANDS.forEach(b => {
      const yy = B[b.id].y; lg.push(Ln(0, yy, LEG_W, yy, 'bl')); const lines = b.label.split('\n'); const lh = 13, start = yy + b.h / 2 - (lines.length - 1) * lh / 2 + 4;
      lines.forEach((t, i) => lg.push(T(10, start + i * lh, t, i === 0 ? 'tm' : 'ts' + (t.startsWith('(') ? ' mut' : ''))));
    });
    lg.push(Ln(0, H - 1, LEG_W, H - 1, 'bl'));
    state.legendSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${LEG_W}" height="${H}" viewBox="0 0 ${LEG_W} ${H}">${SVG_STYLE}<rect width="${LEG_W}" height="${H}" fill="#fff"/>${lg.join('')}</svg>`;
    const sc = $('#scroll'), sl = sc.scrollLeft; $('#legendBox').innerHTML = state.legendSVG;
    sc.innerHTML = `<div class="tpg-plan" style="width:${W}px;height:${H}px">${state.planSVG}<div class="tpg-ov"></div></div>`;
    sc.scrollLeft = sl;
    renderOverlay();
    $('#zoomTxt').textContent = `${fmt(px, 1)} px/m · Kachel ${Math.round(px * 10)} px`;
    renderChecks(G, V);
  }

  function renderOverlay() {
    const ov = root.querySelector('.tpg-ov'); if (!ov) return;
    ov.innerHTML = state.uebPos.map(p => {
      const st = state.uebStatus[p.id] || '';
      return `<label class="tpg-feld ${st}" style="left:${p.x.toFixed(1)}px;top:${p.y.toFixed(1)}px" title="${esc(p.kurz)} [${esc(p.einheit)}]">`
        + `<span>${esc(p.kurz)} <i>[${esc(p.einheit)}]</i></span><input data-feld="${esc(p.id)}" inputmode="decimal" autocomplete="off" placeholder="?" value="${esc(state.uebWerte[p.id] ?? '')}"></label>`;
    }).join('');
  }

  function dhPunkt(p, V) { if (p.hNN !== '' && p.hNN != null && V[p.gleis]) return (num(p.hNN) - hAt(V[p.gleis], num(p.km))) * 1000; return num(p.hoehe); }
  function sym(art, x, y) {
    switch (art) {
      case 'mast': return `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" class="blk"/>`;
      case 'nagel': return `<circle cx="${x}" cy="${y}" r="3.2" class="wht"/>`;
      case 'wand': return `<path d="M${x - 6},${y + 2} A6,6 0 0 1 ${x + 6},${y + 2} Z" class="blk"/><line x1="${x - 7}" y1="${y + 2}" x2="${x + 7}" y2="${y + 2}" class="ln"/>`;
      case 'boden': return `<circle cx="${x}" cy="${y}" r="4.5" class="wht"/>`;
      case 'rp': return `<circle cx="${x}" cy="${y}" r="5.5" class="wht"/><circle cx="${x}" cy="${y}" r="2.6" class="blk"/>`;
      default: return `<circle cx="${x}" cy="${y}" r="3" class="blk"/>`;
    }
  }

  /* ---------------- Fachliche Prüfung ---------------- */
  function renderChecks(G, V) {
    if (state.ueb) { $('#checks').innerHTML = '<h3>Fachliche Prüfung</h3><p class="hint">Im Übungsmodus ausgeblendet – sie würde die Lösung verraten.</p>'; return; }
    const Gz = P.grenz, out = [], add = (lvl, msg) => out.push({ lvl, msg }), hg = num(P.meta.hg), s0 = num(P.kmStart), s1 = num(P.kmEnde);
    ['L', 'R'].forEach(gid => {
      const n = gid === 'L' ? 'Gl. links' : 'Gl. rechts', segs = G[gid];
      const end = segs.length ? segs[segs.length - 1].s1 : s0;
      if (Math.abs(end - s1) > 0.01) add('info', `${n}: Elementfolge endet bei ${kmTxt(end)} (Planende ${kmTxt(s1)}) – ${end < s1 ? 'Rest wird als Gerade gezeichnet' : 'Überstand wird abgeschnitten'}.`);
      segs.forEach((q, i) => {
        const p = segs[i - 1], nx = segs[i + 1];
        if (q.typ === 'KB') {
          if (!(q.r > 0)) { add('err', `${n}: Kreisbogen ${i + 1} ohne Radius.`); return; }
          const v = q.v || hg, u0 = 11.8 * v * v / q.r, uf = u0 - q.u;
          if (q.u > Gz.uMaxAusn) add('err', `${n}: r=${q.r}: u=${q.u} mm > ${Gz.uMaxAusn} mm.`); else if (q.u > Gz.uMax) add('warn', `${n}: r=${q.r}: u=${q.u} mm > Regelwert ${Gz.uMax} mm (Ausnahme).`);
          if (uf > Gz.ufMaxAusn) add('err', `${n}: r=${q.r}, V=${v}: uf = ${fmt(uf, 0)} mm > ${Gz.ufMaxAusn} mm (u₀ = 11,8·v²/r = ${fmt(u0, 0)} mm).`);
          else if (uf > Gz.ufMax) add('warn', `${n}: r=${q.r}, V=${v}: uf = ${fmt(uf, 0)} mm > Regelwert ${Gz.ufMax} mm.`);
          else add('ok', `${n}: r=${q.r}, V=${v}, u=${q.u}: u₀ = ${fmt(u0, 0)} mm, uf = ${fmt(uf, 0)} mm, 20 m-Pfeilhöhe = ${fmt(50000 / q.r, 1)} mm.`);
          if (q.u > 0 && ((p && p.typ !== 'UB') || !p || (nx && nx.typ !== 'UB') || !nx)) add('warn', `${n}: Kreisbogen r=${q.r} mit Überhöhung grenzt ohne Übergangsbogen an – Überhöhungsrampe fehlt.`);
        }
        if (q.typ === 'UB') {
          const du = Math.abs(q.u1 - q.u0);
          if (du > 0) {
            const m = q.l * 1000 / du, v = q.vRamp;
            if (m < Gz.mAbsMin || m < Gz.mFaktorMin * v) add('err', `${n}: Rampe ${kmTxt(q.s0, 3)}: 1:${Math.round(m)} zu steil (min. 1:${Math.max(Gz.mAbsMin, Math.ceil(Gz.mFaktorMin * v))}).`);
            else if (m < Gz.mFaktorRegel * v) add('warn', `${n}: Rampe ${kmTxt(q.s0, 3)}: 1:${Math.round(m)} steiler als Regel 1:${Math.ceil(Gz.mFaktorRegel * v)} (10·v).`);
            else add('ok', `${n}: Rampe ${kmTxt(q.s0, 3)}: 1:${Math.round(m)} (Regel ≥ 1:${Math.ceil(Gz.mFaktorRegel * v)}).`);
          }
          if (!(q.l > 0)) add('err', `${n}: Übergangsbogen ${i + 1} ohne Länge.`);
        }
      });
      const v = V[gid];
      v.gr.forEach((g, i) => { if (Math.abs(g * 1000) > Gz.neigMax) add('warn', `${n}: Neigung ${fmt(g * 1000, 3)} ‰ zwischen ${kmTxt(v.nw[i].km, 3)} und ${kmTxt(v.nw[i + 1].km, 3)} > ${Gz.neigMax} ‰.`); });
      v.nw.forEach((p, i) => {
        if (i === 0 || i === v.nw.length - 1) return; const q = segAt(segs, p.km), vv = (q && q.v) || hg;
        if (!(p.ra > 0)) { add('warn', `${n}: NW ${kmTxt(p.km, 3)} ohne Ausrundung.`); return; }
        if (p.ra < Math.max(Gz.raAbsMin, Gz.raFaktorMin * vv * vv)) add('err', `${n}: NW ${kmTxt(p.km, 3)}: rₐ=${p.ra} m < Mindestwert ${Math.max(Gz.raAbsMin, Math.ceil(Gz.raFaktorMin * vv * vv))} m.`);
        else if (p.ra < Gz.raFaktorRegel * vv * vv) add('warn', `${n}: NW ${kmTxt(p.km, 3)}: rₐ=${p.ra} m < Regelwert 0,4·v² = ${Math.ceil(Gz.raFaktorRegel * vv * vv)} m.`);
        else add('ok', `${n}: NW ${kmTxt(p.km, 3)}: rₐ=${p.ra} m, T=${fmt(p.T, 3)} m, f=${fmt(p.f * 1000, 1)} mm.`);
        segs.forEach(q2 => { if (q2.typ === 'UB' && q2.u0 !== q2.u1 && p.km + p.T > q2.s0 && p.km - p.T < q2.s1) add('warn', `${n}: Ausrundung bei ${kmTxt(p.km, 3)} überschneidet Überhöhungsrampe ${kmTxt(q2.s0, 3)}–${kmTxt(q2.s1, 3)}.`); });
      });
      const pk = P.punkte.filter(p => p.gleis === gid).map(p => num(p.km)).sort((a, b) => a - b);
      for (let i = 0; i < pk.length - 1; i++) if (pk[i + 1] - pk[i] > Gz.pktAbstandMax) add('warn', `${n}: Festpunktabstand ${fmt(pk[i + 1] - pk[i], 2)} m > ${Gz.pktAbstandMax} m (${kmTxt(pk[i], 3)}).`);
      if (pk.length < 2) add('info', `${n}: Für Grundriß-Pfeilhöhen mind. 2 Festpunkte nötig.`);
    });
    P.weichen.forEach(w => {
      const a = num(w.km), e = a + num(w.laenge), segs = G[w.gleis] || [];
      segs.forEach(q => {
        if (q.typ === 'G' || e <= q.s0 || a >= q.s1) return;
        if (q.typ === 'UB') add('warn', `Weiche ${w.typ} bei ${kmTxt(a, 3)} liegt im Übergangsbogen / in der Überhöhungsrampe.`);
        else add('warn', `Weiche ${w.typ} bei ${kmTxt(a, 3)} liegt im Kreisbogen r=${q.r} – Bogenweiche (IBW/ABW) erforderlich.`);
      });
    });
    P.punkte.filter(p => p.art === 'mast').forEach(p => { if (!P.punkte.some(q => q !== p && q.art === 'mast' && q.gleis !== p.gleis && Math.abs(num(q.km) - num(p.km)) < 0.5)) add('warn', `Mast ${p.nr} bei ${kmTxt(num(p.km), 3)}: kein gegenüberstehender Mast am anderen Gleis.`); });
    P.gleisabstand.forEach(g => { if (num(g.a) < Gz.gaMin) add('warn', `Gleisabstand ${fmt(num(g.a), 2)} m bei ${kmTxt(num(g.km), 3)} < ${Gz.gaMin} m.`); });
    const ord = { err: 0, warn: 1, info: 2, ok: 3 }, lab = { err: 'FEHLER', warn: 'HINWEIS', info: 'INFO', ok: 'OK' };
    out.sort((a, b) => ord[a.lvl] - ord[b.lvl]);
    $('#checks').innerHTML = `<h3>Fachliche Prüfung</h3><p class="hint">Grenzwerte einstellbar im Editor („Grenzwerte“). Voreinstellungen angelehnt an Ril 800.0110 – gegen gültige Fassung prüfen.</p><ul>${out.map(c => `<li><span class="lvl ${c.lvl}">${lab[c.lvl]}</span>${esc(c.msg)}</li>`).join('')}</ul>`;
  }

  /* ---------------- Editor ---------------- */
  const refs = []; let tmr = null;
  function bind(obj, key, type) { refs.push({ obj, key, type }); return refs.length - 1; }
  function field(obj, key, type = 'num', opts2) {
    const id = bind(obj, key, type); const v = obj[key] ?? '';
    if (type === 'sel') return `<select data-r="${id}">${opts2.map(o => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(lab)}</option>`; }).join('')}</select>`;
    return `<input data-r="${id}" class="${type === 'num' ? 'num' : 'txt'}" value="${esc(type === 'num' && v !== '' ? String(v).replace('.', ',') : v)}" inputmode="${type === 'num' ? 'decimal' : 'text'}">`;
  }
  function table(arr, cols, addTpl, path) {
    let h = `<table><tr>${cols.map(c => `<th>${c[1]}</th>`).join('')}<th></th></tr>`;
    arr.forEach((row, i) => { h += `<tr>${cols.map(c => `<td>${field(row, c[0], c[2] || 'num', c[3])}</td>`).join('')}<td><button type="button" class="del" data-del="${path}" data-i="${i}" title="Zeile löschen">✕</button></td></tr>`; });
    return h + `</table><button type="button" class="add" data-add="${path}" data-tpl="${esc(JSON.stringify(addTpl))}">+ Zeile</button>`;
  }
  function getPath(path) { return path.split('.').reduce((o, k) => o[k], P); }
  function row(label, obj, key, type) { return `<div class="row"><label>${label}</label>${field(obj, key, type)}</div>`; }

  function renderEditor() {
    refs.length = 0; const g = P.grenz || (P.grenz = clone(DEMO.grenz));
    const elCols = [['typ', 'Typ', 'sel', [['G', 'Gerade'], ['UB', 'Übergangsbogen'], ['KB', 'Kreisbogen']]], ['l', 'Länge [m]'], ['r', 'r [m]'], ['dir', 'Richtung', 'sel', [['R', 'rechts'], ['L', 'links']]], ['u', 'u [mm]'], ['v', 'V [km/h]']];
    const nwCols = [['km', 'Station [m]'], ['h', 'Höhe [m]'], ['ra', 'rₐ [m]']];
    let h = '';
    h += `<details open><summary>Allgemein</summary><div class="sec">
      ${row('Planbezeichnung', P.meta, 'titel', 'txt')}${row('Strecke Nr.', P.meta, 'strecke', 'txt')}${row('von', P.meta, 'von', 'txt')}${row('nach', P.meta, 'nach', 'txt')}
      ${row('Planbeginn Station [m]', P, 'kmStart')}${row('Planende Station [m]', P, 'kmEnde')}${row('Hg [km/h]', P.meta, 'hg')}${row('Bearbeiter', P.meta, 'bearbeiter', 'txt')}${row('Stand / Datum', P.meta, 'datum', 'txt')}</div></details>`;
    ['L', 'R'].forEach(gid => {
      const gl = P.gleise[gid];
      h += `<details ${gid === 'R' ? 'open' : ''}><summary>${gid === 'L' ? 'Gleis links' : 'Gleis rechts (Kilometrierungsachse)'}</summary><div class="sec">
        ${row('Bezeichnung', gl, 'name', 'txt')}
        <h4>Lage – Elementfolge ab Planbeginn</h4>
        ${table(gl.elemente, elCols, { typ: 'G', l: 50, r: '', dir: 'R', u: '', v: '' }, `gleise.${gid}.elemente`)}
        <h4>Höhe – Neigungswechsel (NW)</h4>
        ${table(gl.nw, nwCols, { km: '', h: '', ra: 20000 }, `gleise.${gid}.nw`)}</div></details>`;
    });
    h += `<details><summary>Gleisabstand</summary><div class="sec">${table(P.gleisabstand, [['km', 'Station [m]'], ['a', 'Abstand [m]']], { km: '', a: 4.5 }, 'gleisabstand')}</div></details>`;
    h += `<details><summary>Festpunkte / Vermarkung</summary><div class="sec">
      ${table(P.punkte, [['gleis', 'Gleis', 'sel', [['L', 'links'], ['R', 'rechts']]], ['km', 'Station [m]'], ['nr', 'Mast/Pkt Nr.', 'txt'], ['art', 'Art', 'sel', [['mast', 'Bolzen Mast'], ['nagel', 'Nagel'], ['wand', 'Bolzen Wand'], ['boden', 'Bodenvermarkung'], ['rp', 'Richtpunkt RP']]], ['abstand', 'Abstand [m]'], ['hNN', 'Bolzen H [m ü. NN]'], ['istAbstand', 'Ist-Abst.', 'txt'], ['istHoehe', 'Ist-Höhe', 'txt']], { gleis: 'R', km: '', nr: '', art: 'mast', abstand: 3.1, hNN: '', istAbstand: '', istHoehe: '' }, 'punkte')}</div></details>`;
    h += `<details><summary>Weichen</summary><div class="sec">
      ${table(P.weichen, [['gleis', 'Gleis', 'sel', [['L', 'links'], ['R', 'rechts']]], ['km', 'WA [m]'], ['art', 'Art', 'sel', ['EW', 'IBW', 'ABW', 'DW', 'EKW', 'DKW']], ['typ', 'Grundform', 'txt'], ['richtung', 'Abzweig', 'sel', [['L', 'links'], ['R', 'rechts']]], ['laenge', 'Länge [m]']], { gleis: 'R', km: '', art: 'EW', typ: '49-500-1:12', richtung: 'R', laenge: 33.23 }, 'weichen')}</div></details>`;
    h += `<details><summary>Bauwerke</summary><div class="sec">${table(P.bauwerke, [['typ', 'Typ', 'sel', ['Brücke', 'Tunnel', 'BÜ', 'Durchlass']], ['von', 'von [m]'], ['bis', 'bis [m]'], ['name', 'Bezeichnung', 'txt'], ['ok', 'OK', 'txt']], { typ: 'Brücke', von: '', bis: '', name: '', ok: '' }, 'bauwerke')}</div></details>`;
    h += `<details><summary>Grenzwerte (Prüfung)</summary><div class="sec">
      ${row('u max Regel [mm]', g, 'uMax')}${row('u max Ausnahme [mm]', g, 'uMaxAusn')}${row('uf max Regel [mm]', g, 'ufMax')}${row('uf max Ausnahme [mm]', g, 'ufMaxAusn')}
      ${row('Rampe m ≥ Faktor·v (Regel)', g, 'mFaktorRegel')}${row('Rampe m ≥ Faktor·v (min)', g, 'mFaktorMin')}${row('Rampe m absolut min', g, 'mAbsMin')}
      ${row('rₐ ≥ Faktor·v² (Regel)', g, 'raFaktorRegel')}${row('rₐ ≥ Faktor·v² (min)', g, 'raFaktorMin')}${row('rₐ absolut min [m]', g, 'raAbsMin')}
      ${row('Neigung max [‰]', g, 'neigMax')}${row('Gleisabstand min [m]', g, 'gaMin')}${row('Festpunktabstand max [m]', g, 'pktAbstandMax')}</div></details>`;
    const ed = $('#editor'), open = [...ed.querySelectorAll('details')].map(d => d.open);
    ed.innerHTML = h; if (open.length) ed.querySelectorAll('details').forEach((d, i) => { if (open[i] !== undefined) d.open = open[i]; });
  }
  const ed = $('#editor');
  ed.addEventListener('input', e => {
    const r = refs[e.target.dataset.r]; if (!r) return;
    r.obj[r.key] = r.type === 'num' ? (e.target.value.trim() === '' ? '' : num(e.target.value)) : e.target.value;
    clearTimeout(tmr); tmr = setTimeout(() => { save(); draw(); }, 250);
  });
  ed.addEventListener('change', e => { if (e.target.tagName === 'SELECT') { save(); draw(); } });
  ed.addEventListener('click', e => {
    const a = e.target.dataset.add, d = e.target.dataset.del;
    if (a) { getPath(a).push(JSON.parse(e.target.dataset.tpl)); } else if (d) { getPath(d).splice(+e.target.dataset.i, 1); } else return;
    save(); renderEditor(); draw();
  });

  /* ---------------- Übungsfelder ---------------- */
  const sc = $('#scroll');
  sc.addEventListener('input', e => { const id = e.target.dataset?.feld; if (id) { state.uebWerte[id] = e.target.value; e.target.parentElement.classList.remove('ok', 'nah', 'falsch'); } });
  sc.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset?.feld) { e.preventDefault(); opts.onPruefen?.(); } });

  /* ---------------- Fadenkreuz / Info ---------------- */
  sc.addEventListener('pointermove', e => {
    const c = state.ctx; if (!c) return; const svg = $('#planSvg'); if (!svg) return; const r = svg.getBoundingClientRect();
    const x = e.clientX - r.left, s = c.s0 + (x - PADL) / c.px, cr = $('#cross'), info = $('#info');
    if (s < c.s0 || s > c.s1) { cr.style.display = 'none'; info.style.display = 'none'; return; }
    cr.setAttribute('x1', x); cr.setAttribute('x2', x); cr.style.display = '';
    const lines = [kmTxt(s)];
    ['L', 'R'].forEach(gid => {
      const k = kAt(c.G[gid], s), q = segAt(c.G[gid], s);
      lines.push(`${gid === 'L' ? 'Gl. links ' : 'Gl. rechts'}: ${q ? ({ G: 'Gerade', UB: 'Übergangsb.', KB: 'Kreisbogen' })[q.typ] : 'Gerade'}${q && q.typ === 'KB' && q.r > 0 ? ' r=' + fmt(q.r, 1) + (k > 0 ? ' re' : ' li') : ''}`);
      if (!state.ueb) {
        if (Math.abs(k) > 1e-9 && !(q && q.typ === 'KB')) lines[lines.length - 1] += ' r=' + fmt(1 / Math.abs(k), 1);
        lines.push(`   u=${fmt(uAt(c.G[gid], s), 0)} mm  f20=${fmt(Math.abs(pf20(c.G[gid], s)) * 1000, 1)} mm`);
      }
      lines.push(`   H=${fmt(hAt(c.V[gid], s), 3)} m  i=${fmt(gAt(c.V[gid], s) * 1000, 3)} ‰`);
    });
    lines.push(`Gleisabstand ${fmt(gaAt(s), 3)} m`);
    if (state.ueb) lines.push('(Übungsmodus: u und Pfeilhöhen ausgeblendet)');
    info.textContent = lines.join('\n'); const wr = $('#planWrap').getBoundingClientRect();
    let ix = e.clientX - wr.left + 14; if (ix > wr.width - 280) ix -= 300; info.style.left = ix + 'px'; info.style.top = (e.clientY - wr.top + 14) + 'px'; info.style.display = 'block';
  });
  sc.addEventListener('pointerleave', () => { $('#info').style.display = 'none'; const c = $('#cross'); if (c) c.style.display = 'none'; });

  /* ---------------- Toolbar ---------------- */
  function dl(name, data, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function gesamtSvg() {
    const inner = s => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, ''); const W = state.W + LEG_W, H = state.H;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner(state.planSVG)}<g transform="translate(${state.W},0)">${inner(state.legendSVG)}</g></svg>`;
  }
  const dateiName = () => `trassenplan_${String(P.meta.strecke || 'plan').replace(/[^\w-]+/g, '_')}`;
  btn('neu').onclick = () => { if (confirm('Aktuellen Plan durch Beispielplan ersetzen?')) { P = makeDemo(); save(); renderEditor(); draw(); } };
  btn('json').onclick = () => dl(`${dateiName()}.json`, JSON.stringify(P, null, 2), 'application/json');
  btn('fjson').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => { try { const d = JSON.parse(t); P = normalisieren({ ...makeDemo(), ...d, grenz: { ...DEMO.grenz, ...(d.grenz || {}) } }); save(); renderEditor(); draw(); } catch (err) { alert('JSON ungültig: ' + err.message); } });
    e.target.value = '';
  };
  btn('svg').onclick = () => dl(`${dateiName()}.svg`, gesamtSvg(), 'image/svg+xml');
  btn('print').onclick = () => {
    const w = window.open('', '_blank'); if (!w) { alert('Bitte Pop-ups für den Druck erlauben.'); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(P.meta.titel || 'Trassenplan')}</title><style>@page{size:landscape;margin:8mm}body{margin:0}svg{display:block}</style></head><body>${gesamtSvg()}</body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
  };
  btn('edit').onclick = () => { root.classList.toggle('edit'); btn('edit').textContent = root.classList.contains('edit') ? 'Editor schließen' : 'Daten bearbeiten'; };
  const zoom = btn('zoom');
  zoom.oninput = e => { state.px = +e.target.value; draw(); };
  btn('1000').onclick = () => { state.px = 96 / 2.54 / 10; zoom.value = state.px; draw(); };

  P = load() || makeDemo();
  if (!P.grenz) P.grenz = clone(DEMO.grenz);
  renderEditor(); draw();

  /* ---------------- API für die Seite ---------------- */
  return {
    getPlan: () => P,
    setPlan: p => { P = normalisieren(clone(p)); save(); renderEditor(); draw(); },
    analyse: () => ({
      kmStart: num(P.kmStart), kmEnde: num(P.kmEnde), hg: num(P.meta.hg),
      G: { L: geom(P.gleise.L), R: geom(P.gleise.R) },
      V: { L: vert(P.gleise.L), R: vert(P.gleise.R) },
      punkte: P.punkte.map(p => ({ gleis: p.gleis, km: num(p.km), nr: p.nr })),
      gleisName: { L: P.gleise.L.name || 'Gleis links', R: P.gleise.R.name || 'Gleis rechts' },
    }),
    setUebung: felder => { state.ueb = felder && felder.length ? felder : null; state.uebWerte = {}; state.uebStatus = {}; draw(); },
    werte: () => ({ ...state.uebWerte }),
    setStatus: st => {
      state.uebStatus = { ...st };
      root.querySelectorAll('.tpg-feld').forEach(l => {
        const id = l.querySelector('input')?.dataset.feld; l.classList.remove('ok', 'nah', 'falsch');
        if (id && st[id]) l.classList.add(st[id]);
      });
    },
    zeigeFeld: id => {
      if (state.px < 9) { state.px = 9; zoom.value = state.px; draw(); }
      const inp = root.querySelector(`input[data-feld="${CSS.escape(id)}"]`); if (!inp) return;
      const p = state.uebPos.find(q => q.id === id); if (p) sc.scrollLeft = Math.max(0, p.x - sc.clientWidth / 2);
      inp.closest('label').scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      setTimeout(() => inp.focus({ preventScroll: true }), 350);
    },
    neuZeichnen: () => draw(),
    destroy: () => { clearTimeout(tmr); root.innerHTML = ''; },
  };
}

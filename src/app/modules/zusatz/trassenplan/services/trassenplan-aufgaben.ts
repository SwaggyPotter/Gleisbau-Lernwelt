// Aufgaben zum Trassenplan (2026-11-10): werden aus dem aktuell geladenen Plan berechnet,
// die Lösung trägt der Azubi direkt im Plan ein (Übungsfelder der Generator-Engine).
// Es werden nur Stellen gewählt, an denen die Handformel exakt gilt (Sehne ganz im Element).
import { UebungsArt, UebungsFeld } from '../generator/trassenplan-generator';

export type Kategorie = 'f20' | 'fgr' | 'ueb' | 'nw' | 'mix';

export const KATEGORIEN: { id: Kategorie; name: string }[] = [
  { id: 'mix', name: 'Gemischt' },
  { id: 'f20', name: '20 m-Pfeilhöhen' },
  { id: 'fgr', name: 'Grundriß-Pfeilhöhen' },
  { id: 'ueb', name: 'Überhöhung & Rampe' },
  { id: 'nw', name: 'Ausrundung (NW)' },
];

export interface AufgabenFeld extends UebungsFeld {
  label: string;
  soll: number;
  tol: number;
  nachkomma: number;
}

export interface Aufgabe {
  id: string;
  kat: Exclude<Kategorie, 'mix'>;
  titel: string;
  /** Aufgabentext mit vorgegebenen Werten (HTML). */
  text: string;
  /** Kurzer Text ohne Werte – „selbst aus dem Plan ablesen“. */
  textOrt: string;
  formel: string;
  felder: AufgabenFeld[];
  weg: string[];
}

/* Struktur aus TrassenplanApi.analyse() */
interface Seg { typ: 'G' | 'UB' | 'KB'; l: number; r: number; u: number; v: number; dir?: string; s0: number; s1: number; k0: number; k1: number; u0: number; u1: number; vRamp?: number; }
interface Nw { km: number; h: number; ra: number; gIn?: number; gOut?: number; T: number; f: number; wanne?: boolean; }
export interface Analyse {
  kmStart: number; kmEnde: number; hg: number;
  G: Record<'L' | 'R', Seg[]>;
  V: Record<'L' | 'R', { nw: Nw[]; gr: number[] }>;
  punkte: { gleis: 'L' | 'R'; km: number; nr: string }[];
  gleisName: Record<'L' | 'R', string>;
}

const z = (x: number, d: number) => (Math.round(x * 10 ** d) / 10 ** d).toFixed(d).replace('.', ',');
const km = (s: number) => 'km ' + (s / 1000).toFixed(3).replace('.', ',');
const vielfache5 = (a: number, b: number) => { const r: number[] = []; for (let s = Math.ceil((a - 1e-7) / 5) * 5; s <= b + 1e-7; s += 5) r.push(Math.round(s * 1000) / 1000); return r; };
const zufall = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function feld(art: UebungsArt, gleis: 'L' | 'R', s: number, kurz: string, einheit: string, label: string, soll: number, tol: number, nachkomma: number, extra: Partial<UebungsFeld> = {}): AufgabenFeld {
  return { id: `${art}-${gleis}-${s.toFixed(2)}${extra.a != null ? '-' + extra.a.toFixed(2) : ''}`, art, gleis, s, kurz, einheit, label, soll, tol, nachkomma, ...extra };
}

/** Alle möglichen Aufgaben im aktuellen Plan (je Stelle eine). */
export function alleAufgaben(an: Analyse): Aufgabe[] {
  const out: Aufgabe[] = [];
  (['L', 'R'] as const).forEach(g => {
    const gn = an.gleisName[g];
    const segs = an.G[g];
    const imPlan = (s: number) => s >= an.kmStart && s <= an.kmEnde;

    segs.forEach(q => {
      /* ---- 20 m-Pfeilhöhe im Kreisbogen ---- */
      if (q.typ === 'KB' && q.r > 0) {
        vielfache5(q.s0 + 10, q.s1 - 10).filter(imPlan).forEach(s => {
          const soll = 50000 / q.r;
          out.push({
            id: `f20-${g}-${s}`, kat: 'f20', titel: '20 m-Pfeilhöhe im Kreisbogen',
            text: `${gn}, Kreisbogen <b>r = ${z(q.r, 1)} m</b> (${km(q.s0)} – ${km(q.s1)}).<br>Berechne die <b>20 m-Pfeilhöhe</b> an Station <b>${km(s)}</b> und trage sie im Band „20 m-Pfeilhöhen“ (${gn}) ein.`,
            textOrt: `${gn}: Berechne die 20 m-Pfeilhöhe an Station <b>${km(s)}</b>. Den Radius liest du aus der Krümmungslinie ab.`,
            formel: 'f = s² / (8 · r)  →  mit s = 20 m:  f = 50 000 / r  [mm]',
            felder: [feld('f20', g, s, 'f₂₀', 'mm', '20 m-Pfeilhöhe', soll, 0.6, 0)],
            weg: [
              `Sehne s = 20 m, die ganze Sehne (±10 m) liegt im Kreisbogen.`,
              `f = s² / (8·r) = 20² / (8 · ${z(q.r, 1)}) m = ${z(400 / (8 * q.r), 5)} m`,
              `= <b>${z(soll, 1)} mm</b> (im Plan gerundet: ${Math.round(soll)} mm)`,
            ],
          });
        });
      }
      /* ---- 20 m-Pfeilhöhe im Übergangsbogen (Krümmung linear) ---- */
      if (q.typ === 'UB' && q.l > 0 && (Math.abs(q.k0) > 1e-9 || Math.abs(q.k1) > 1e-9)) {
        vielfache5(q.s0 + 10, q.s1 - 10).filter(imPlan).forEach(s => {
          const x = s - q.s0, fA = 50000 * Math.abs(q.k0), fE = 50000 * Math.abs(q.k1);
          const k = q.k0 + (q.k1 - q.k0) * x / q.l, soll = 50000 * Math.abs(k);
          const rB = 1 / Math.max(Math.abs(q.k0), Math.abs(q.k1));
          out.push({
            id: `f20-${g}-${s}`, kat: 'f20', titel: '20 m-Pfeilhöhe im Übergangsbogen',
            text: `${gn}, Übergangsbogen ${km(q.s0)} – ${km(q.s1)} (l = ${z(q.l, 2)} m), anschließender Kreisbogen <b>r = ${z(rB, 1)} m</b>.<br>Berechne die <b>20 m-Pfeilhöhe</b> an Station <b>${km(s)}</b> und trage sie im Plan ein.`,
            textOrt: `${gn}: Berechne die 20 m-Pfeilhöhe an Station <b>${km(s)}</b> im Übergangsbogen. Radius, ÜA und ÜE liest du aus der Krümmungslinie ab.`,
            formel: 'Im Übergangsbogen wächst die Pfeilhöhe linear:  f(x) = f_A + (f_E − f_A) · x / l   mit f = 50 000 / r',
            felder: [feld('f20', g, s, 'f₂₀', 'mm', '20 m-Pfeilhöhe', soll, 0.6, 0)],
            weg: [
              `Pfeilhöhe am ÜA: f_A = ${fA ? `50 000 / ${z(1 / Math.abs(q.k0), 1)} = ${z(fA, 1)}` : '0'} mm, am ÜE: f_E = ${fE ? `50 000 / ${z(1 / Math.abs(q.k1), 1)} = ${z(fE, 1)}` : '0'} mm`,
              `Abstand vom ÜA: x = ${z(s, 2)} − ${z(q.s0, 2)} = ${z(x, 2)} m`,
              `f = ${z(fA, 1)} + (${z(fE, 1)} − ${z(fA, 1)}) · ${z(x, 2)} / ${z(q.l, 2)} = <b>${z(soll, 1)} mm</b> (Plan: ${Math.round(soll)} mm)`,
            ],
          });
        });
      }
      /* ---- Überhöhung: u₀ und uf im Kreisbogen ---- */
      if (q.typ === 'KB' && q.r > 0 && imPlan((q.s0 + q.s1) / 2)) {
        const v = q.v || an.hg, u0 = 11.8 * v * v / q.r, uf = u0 - q.u;
        out.push({
          id: `u0-${g}-${q.s0}`, kat: 'ueb', titel: 'Ausgleichsüberhöhung und Überhöhungsfehlbetrag',
          text: `${gn}, Kreisbogen <b>r = ${z(q.r, 1)} m</b>, <b>V = ${v} km/h</b>, vorhandene Überhöhung <b>u = ${z(q.u, 0)} mm</b>.<br>Berechne die <b>Ausgleichsüberhöhung u₀</b> und den <b>Überhöhungsfehlbetrag uf</b> und trage beide im Band „Überhöhungen“ (${gn}) ein.`,
          textOrt: `${gn}: Berechne u₀ und uf für den Kreisbogen ab ${km(q.s0)}. r, V und u stehen im Plan.`,
          formel: 'u₀ = 11,8 · V² / r  [mm]      uf = u₀ − u',
          felder: [
            feld('u0', g, q.s0, 'u₀', 'mm', 'Ausgleichsüberhöhung u₀', u0, Math.max(1, u0 * 0.01), 0),
            feld('uf', g, q.s0, 'uf', 'mm', 'Überhöhungsfehlbetrag uf', uf, Math.max(1, Math.abs(u0) * 0.01), 0),
          ],
          weg: [
            `u₀ = 11,8 · ${v}² / ${z(q.r, 1)} = 11,8 · ${v * v} / ${z(q.r, 1)} = <b>${z(u0, 1)} mm</b>`,
            `uf = u₀ − u = ${z(u0, 1)} − ${z(q.u, 0)} = <b>${z(uf, 1)} mm</b>`,
            uf > 130 ? `Achtung: uf liegt über dem Regelwert 130 mm.` : `uf liegt unter dem Regelwert 130 mm – in Ordnung.`,
          ],
        });
      }
      /* ---- Rampe: Neigung 1:m und Überhöhung an einer Station ---- */
      if (q.typ === 'UB' && q.l > 0 && Math.abs(q.u1 - q.u0) > 0) {
        const du = Math.abs(q.u1 - q.u0), m = q.l * 1000 / du;
        if (imPlan((q.s0 + q.s1) / 2)) out.push({
          id: `m-${g}-${q.s0}`, kat: 'ueb', titel: 'Neigung der Überhöhungsrampe',
          text: `${gn}, Überhöhungsrampe ${km(q.s0)} – ${km(q.s1)}: Länge <b>l = ${z(q.l, 2)} m</b>, Überhöhung von <b>${z(q.u0, 0)}</b> auf <b>${z(q.u1, 0)} mm</b>.<br>Berechne die <b>Rampenneigung 1 : m</b> und trage m im Band „Überhöhungen“ ein.`,
          textOrt: `${gn}: Berechne die Rampenneigung 1:m der Rampe ab ${km(q.s0)}. Länge und Überhöhungen liest du aus dem Plan ab.`,
          formel: 'm = l [m] · 1000 / Δu [mm]   →  Rampenneigung 1 : m',
          felder: [feld('m', g, q.s0, '1 :', 'm', 'Rampenneigung m', m, Math.max(1, m * 0.005), 0)],
          weg: [
            `Δu = |${z(q.u1, 0)} − ${z(q.u0, 0)}| = ${z(du, 0)} mm`,
            `m = ${z(q.l, 2)} · 1000 / ${z(du, 0)} = <b>${z(m, 1)}</b>  →  Rampe 1 : ${Math.round(m)}`,
            `Regel: m ≥ 10 · V = 10 · ${q.vRamp} = ${10 * (q.vRamp || 0)} → ${m >= 10 * (q.vRamp || 0) ? 'eingehalten' : 'nicht eingehalten'}.`,
          ],
        });
        vielfache5(q.s0, q.s1).filter(s => s > q.s0 + 1e-6 && s < q.s1 - 1e-6 && imPlan(s)).forEach(s => {
          const x = s - q.s0, soll = q.u0 + (q.u1 - q.u0) * x / q.l;
          out.push({
            id: `uS-${g}-${s}`, kat: 'ueb', titel: 'Überhöhung in der Rampe',
            text: `${gn}, Überhöhungsrampe ${km(q.s0)} – ${km(q.s1)} (l = ${z(q.l, 2)} m) von <b>${z(q.u0, 0)}</b> auf <b>${z(q.u1, 0)} mm</b> (gerade Rampe).<br>Wie groß ist die <b>Überhöhung an Station ${km(s)}</b>?`,
            textOrt: `${gn}: Wie groß ist die Überhöhung an Station <b>${km(s)}</b>? (gerade Rampe)`,
            formel: 'u(x) = u_A + (u_E − u_A) · x / l',
            felder: [feld('uS', g, s, 'u', 'mm', 'Überhöhung', soll, 0.6, 0)],
            weg: [
              `x = ${z(s, 2)} − ${z(q.s0, 2)} = ${z(x, 2)} m vom Rampenanfang`,
              `u = ${z(q.u0, 0)} + (${z(q.u1, 0)} − ${z(q.u0, 0)}) · ${z(x, 2)} / ${z(q.l, 2)} = <b>${z(soll, 1)} mm</b>`,
            ],
          });
        });
      }
    });

    /* ---- Grundriß-Pfeilhöhen: Sehne zwischen zwei Festpunkten ganz im Kreisbogen ---- */
    const pk = an.punkte.filter(p => p.gleis === g).sort((a, b) => a.km - b.km);
    for (let i = 0; i < pk.length - 1; i++) {
      const a = pk[i].km, e = pk[i + 1].km;
      const q = segs.find(sg => sg.typ === 'KB' && sg.r > 0 && a >= sg.s0 - 1e-6 && e <= sg.s1 + 1e-6);
      if (!q || e <= a) continue;
      vielfache5(a, e).filter(s => s > a + 1e-6 && s < e - 1e-6 && imPlan(s)).forEach(s => {
        const da = s - a, db = e - s, soll = da * db / (2 * q.r) * 1000;
        out.push({
          id: `fgr-${g}-${s}`, kat: 'fgr', titel: 'Grundriß-Pfeilhöhe',
          text: `${gn}, Sehne zwischen den Festpunkten <b>${pk[i].nr}</b> (${km(a)}) und <b>${pk[i + 1].nr}</b> (${km(e)}), Kreisbogen <b>r = ${z(q.r, 1)} m</b>.<br>Berechne die <b>Grundriß-Pfeilhöhe</b> an Station <b>${km(s)}</b> und trage sie im Band „Grundriß-Pfeilhöhen“ (${gn}) ein.`,
          textOrt: `${gn}: Berechne die Grundriß-Pfeilhöhe an Station <b>${km(s)}</b> (Sehne ${pk[i].nr} – ${pk[i + 1].nr}).`,
          formel: 'f = a · b / (2 · r)   a, b = Abstände zu den Sehnenenden   (Mitte: f = s² / (8r))',
          felder: [feld('fgr', g, s, 'f', 'mm', 'Grundriß-Pfeilhöhe', soll, 0.6, 0, { a, e })],
          weg: [
            `a = ${z(s, 2)} − ${z(a, 2)} = ${z(da, 2)} m,  b = ${z(e, 2)} − ${z(s, 2)} = ${z(db, 2)} m`,
            `f = ${z(da, 2)} · ${z(db, 2)} / (2 · ${z(q.r, 1)}) = ${z(da * db / (2 * q.r), 5)} m = <b>${z(soll, 1)} mm</b>`,
          ],
        });
      });
    }

    /* ---- Ausrundung am Neigungswechsel ---- */
    const nw = an.V[g].nw;
    nw.forEach((p, i) => {
      if (i === 0 || i === nw.length - 1 || !(p.ra > 0) || !imPlan(p.km) || p.gIn == null || p.gOut == null) return;
      const i1 = p.gIn * 1000, i2 = p.gOut * 1000, di = i2 - i1;
      if (Math.abs(di) < 1e-6) return;
      out.push({
        id: `T-${g}-${p.km}`, kat: 'nw', titel: 'Ausrundung am Neigungswechsel',
        text: `${gn}, Neigungswechsel bei <b>${km(p.km)}</b>: Neigung vorher <b>${z(i1, 3)} ‰</b>, nachher <b>${z(i2, 3)} ‰</b>, Ausrundungshalbmesser <b>rₐ = ${Math.round(p.ra)} m</b>.<br>Berechne die <b>Tangentenlänge T</b> und den <b>Pfeil f</b> (Scheitelabstand) und trage beide im Band „Neigungen“ ein.`,
        textOrt: `${gn}: Berechne T und f der Ausrundung bei ${km(p.km)}. Neigungen und rₐ stehen im Plan.`,
        formel: 'T = rₐ · |Δi| / 2000  [m, Δi in ‰]      f = T² / (2 · rₐ)  [m]',
        felder: [
          feld('T', g, p.km, 'T', 'm', 'Tangentenlänge T', p.T, 0.01, 3),
          feld('f', g, p.km, 'f', 'm', 'Pfeil f', p.f, 0.002, 3),
        ],
        weg: [
          `Δi = ${z(i2, 3)} − (${z(i1, 3)}) = ${z(di, 3)} ‰  →  ${di > 0 ? 'Wanne' : 'Kuppe'}`,
          `T = ${Math.round(p.ra)} · ${z(Math.abs(di), 3)} / 2000 = <b>${z(p.T, 3)} m</b>`,
          `f = ${z(p.T, 3)}² / (2 · ${Math.round(p.ra)}) = <b>${z(p.f, 3)} m</b> (= ${z(p.f * 1000, 1)} mm)`,
        ],
      });
    });
  });
  return out;
}

export function zufallsAufgabe(an: Analyse, kat: Kategorie, letzteId?: string): Aufgabe | null {
  const alle = alleAufgaben(an);
  let pool = kat === 'mix' ? alle : alle.filter(a => a.kat === kat);
  if (!pool.length) return null;
  if (kat === 'mix') {
    // erst Kategorie würfeln, damit nicht die vielen Pfeilhöhen-Stellen alles dominieren
    const kats = [...new Set(pool.map(a => a.kat))];
    const k = zufall(kats);
    pool = pool.filter(a => a.kat === k);
  }
  const ohneLetzte = pool.filter(a => a.id !== letzteId);
  return zufall(ohneLetzte.length ? ohneLetzte : pool);
}

export type Bewertung = 'ok' | 'nah' | 'falsch';

export function bewerten(f: AufgabenFeld, eingabe: string | undefined): Bewertung | null {
  if (eingabe == null || !eingabe.trim()) return null;
  const n = parseFloat(eingabe.replace(/\s/g, '').replace(',', '.'));
  if (!isFinite(n)) return 'falsch';
  const d = Math.abs(n - f.soll);
  if (d <= f.tol) return 'ok';
  if (d <= Math.max(3 * f.tol, Math.abs(f.soll) * 0.05)) return 'nah';
  return 'falsch';
}

/* ------------------------------------------------------------------------
   Zufällige Übungsstrecke (zweigleisig, ein Bogen mit Übergangsbögen)
   ------------------------------------------------------------------------ */
export function zufallsPlan(): any {
  const r5 = (x: number) => Math.round(x / 5) * 5;
  const v = zufall([80, 100, 120, 140, 160]);
  const rMin = Math.max(400, Math.ceil(11.8 * v * v / (130 + 150) / 50) * 50); // u ≤ 150 und uf ≤ 130
  const r = Math.ceil((rMin + Math.random() * 2200) / 50) * 50;
  const u0 = 11.8 * v * v / r;
  const u = Math.min(150, Math.max(r5(u0 - 120), r5(u0 * (0.45 + Math.random() * 0.25)), 20));
  const m = 10 * v;
  const lUB = Math.max(40, Math.ceil(m * u / 1000 / 10) * 10);
  const lKB = zufall([80, 100, 120, 150]);
  const g1 = zufall([30, 40, 50]), g2 = zufall([40, 50, 60]);
  const start = zufall([600, 1200, 2400, 3500]);
  const laenge = g1 + 2 * lUB + lKB + g2;
  const dir = Math.random() < 0.5 ? 'R' : 'L';
  const ga = 4.5;
  // Rechtsbogen: linkes Gleis außen (größerer Radius), Linksbogen: innen
  const rL = dir === 'R' ? r + ga : r - ga;
  const el = (rr: number) => [
    { typ: 'G', l: g1 }, { typ: 'UB', l: lUB }, { typ: 'KB', l: lKB, r: rr, dir, u, v }, { typ: 'UB', l: lUB }, { typ: 'G', l: g2 },
  ];
  // Höhen: ein Neigungswechsel etwa in Planmitte
  const h0 = Math.round((300 + Math.random() * 200) * 1000) / 1000;
  const iA = (Math.random() * 16 - 8) / 1000;
  let iB = (Math.random() * 16 - 8) / 1000; if (Math.abs(iB - iA) < 0.003) iB = iA + (iA > 0 ? -0.004 : 0.004);
  const kNw = r5(start + laenge * (0.35 + Math.random() * 0.3));
  const ra = Math.max(2000, Math.ceil(0.4 * v * v / 1000) * 1000) + zufall([0, 2000, 5000, 10000]);
  const nw = (dh: number) => {
    const hN = h0 + dh + iA * (kNw - start);
    return [
      { km: start, h: Math.round((h0 + dh) * 1000) / 1000, ra: 0 },
      { km: kNw, h: Math.round(hN * 1000) / 1000, ra },
      { km: start + laenge, h: Math.round((hN + iB * (start + laenge - kNw)) * 1000) / 1000, ra: 0 },
    ];
  };
  // Festpunkte (Maste) gegenüberliegend. Ein Mast kurz hinter dem BA, Abstände 45–60 m, aber im
  // Kreisbogen höchstens lKB − 10 m – so liegt immer mindestens eine Sehne ganz im Bogen
  // (sonst gäbe es keine Grundriß-Pfeilhöhen-Aufgabe).
  const ba = start + g1 + lUB, be = ba + lKB;
  const abstand = (pos: number) => (pos >= ba && pos < be ? Math.min(45 + Math.random() * 15, lKB - 10) : 45 + Math.random() * 15);
  const stationen: number[] = [];
  for (let p = ba + 3 + Math.random() * 4; p > start + 5; p -= 45 + Math.random() * 15) stationen.unshift(p);
  for (let p = stationen[stationen.length - 1] + abstand(stationen[stationen.length - 1]); p < start + laenge - 5; p += abstand(p)) stationen.push(p);
  const punkte: any[] = [];
  let nr = 10 + Math.floor(Math.random() * 30) * 2;
  for (const s of stationen) {
    const st = Math.round(s * 100) / 100;
    punkte.push({ gleis: 'L', km: st, nr: `${Math.floor(start / 1000)}/${nr}`, art: 'mast', abstand: Math.round((3.15 + Math.random() * 0.1) * 1000) / 1000, dh: Math.round(Math.random() * 300 - 150), istAbstand: '', istHoehe: '' });
    punkte.push({ gleis: 'R', km: st, nr: `${Math.floor(start / 1000)}/${nr + 1}`, art: 'mast', abstand: Math.round((3.08 + Math.random() * 0.1) * 1000) / 1000, dh: Math.round(Math.random() * 300 - 150), istAbstand: '', istHoehe: '' });
    nr += 2;
  }
  return {
    meta: { titel: 'Gleisvermarkungsplan (Zufalls-Übungsstrecke)', strecke: String(9000 + Math.floor(Math.random() * 999)), von: 'Übungsbahnhof A', nach: 'Übungsbahnhof B', bearbeiter: 'Gleisbau-Lernwelt', datum: '', hg: v },
    kmStart: start, kmEnde: start + laenge,
    gleise: {
      L: { name: 'Gleis links', elemente: el(rL), nw: nw(-0.015) },
      R: { name: 'Gleis rechts', elemente: el(r), nw: nw(0) },
    },
    gleisabstand: [{ km: start, a: ga }, { km: start + laenge, a: ga }],
    weichen: [],
    punkte,
    bauwerke: [],
  };
}

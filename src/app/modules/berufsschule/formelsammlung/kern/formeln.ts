/**
 * Reine Rechenfunktionen der Formelsammlung (keine Rundung, keine Anzeige).
 * Jede Funktion ist in tools/formelsammlung-tests/formeln.test.ts mit
 * von Hand nachgerechneten Referenzwerten abgesichert.
 *
 * Einheiten stehen jeweils im Kommentar. Längen in m, Überhöhung in mm,
 * Geschwindigkeit als Zahlenwert in km/h, Neigungen in ‰.
 */

// ---------- APP 1 – Pfeilhöhe (Kap. 01) ----------

/** hf = ls² / (8·r) – alle Größen in m. */
export function pfeilhoehe(ls: number, r: number): number {
  return (ls * ls) / (8 * r);
}

/** hf = (ls/2)² / (2·r) – identisch zu pfeilhoehe(), andere Schreibweise. */
export function pfeilhoeheHalbsehne(ls: number, r: number): number {
  return Math.pow(ls / 2, 2) / (2 * r);
}

/** hf = a·b / (2·r) – Messpunkt teilt die Sehne in a und b. */
export function pfeilhoeheAB(a: number, b: number, r: number): number {
  return (a * b) / (2 * r);
}

/** r = ls² / (8·hf) */
export function radiusAusPfeilhoehe(ls: number, hf: number): number {
  return (ls * ls) / (8 * hf);
}

/** r = a·b / (2·hf) */
export function radiusAusPfeilhoeheAB(a: number, b: number, hf: number): number {
  return (a * b) / (2 * hf);
}

/** ls = √(8·r·hf) */
export function sehneAusPfeilhoehe(r: number, hf: number): number {
  return Math.sqrt(8 * r * hf);
}

// ---------- APP 2 – Kreisbogen von der x-Achse (Kap. 02) ----------

/** y = r − √(r² − x²) (genau), x < r. */
export function ordinateKreisGenau(r: number, x: number): number {
  if (x > r) return NaN;
  return r - Math.sqrt(r * r - x * x);
}

/** y ≈ x² / (2·r) (Näherung, gültig bis x = r/10). */
export function ordinateKreisNaeherung(r: number, x: number): number {
  return (x * x) / (2 * r);
}

/** Näherung zulässig, solange x ≤ r/10. */
export function naeherungZulaessig(r: number, x: number): boolean {
  return x <= r / 10 + 1e-9;
}

/** Größtes x, für das die Näherung noch gilt: x = r/10. */
export function naeherungsgrenze(r: number): number {
  return r / 10;
}

/** x aus y (Näherung): x = √(2·r·y) */
export function abszisseNaeherung(r: number, y: number): number {
  return Math.sqrt(2 * r * y);
}

/** x aus y (genau): x = √(2·r·y − y²) */
export function abszisseGenau(r: number, y: number): number {
  return Math.sqrt(2 * r * y - y * y);
}

/** r aus x und y (Näherung): r = x² / (2·y) */
export function radiusAusOrdinateNaeherung(x: number, y: number): number {
  return (x * x) / (2 * y);
}

// ---------- APP 4 – Ausrunden von Neigungswechseln (Kap. 04) ----------

export const AUSRUNDUNG_FAKTOR = {
  regel: 0.40,
  ermessen: 0.25,
  genehmigungKuppe: 0.16,
  genehmigungWanne: 0.13,
} as const;
export type AusrundungsStufe = keyof typeof AUSRUNDUNG_FAKTOR;

export const MIN_AUSRUNDUNGSRADIUS = 2000;

/** ra = Faktor · ve² in m, mindestens 2000 m. */
export function ausrundungsradius(ve: number, stufe: AusrundungsStufe): { roh: number; ra: number; mindestGreift: boolean } {
  const roh = AUSRUNDUNG_FAKTOR[stufe] * ve * ve;
  const mindestGreift = roh < MIN_AUSRUNDUNGSRADIUS;
  return { roh, ra: mindestGreift ? MIN_AUSRUNDUNGSRADIUS : roh, mindestGreift };
}

export type Richtung = 'steigung' | 'gefaelle' | 'waagerecht';

/** Neigung mit Vorzeichen in Fahrtrichtung: Steigung +, Gefälle −. */
export function neigungMitVorzeichen(s: number, richtung: Richtung): number {
  if (richtung === 'waagerecht') return 0;
  return richtung === 'steigung' ? Math.abs(s) : -Math.abs(s);
}

/** Gleichgerichtet (auch Waagerechte → Neigung) oder entgegengesetzt? */
export function neigungsArt(r1: Richtung, r2: Richtung): 'gleichgerichtet' | 'entgegengesetzt' {
  if (r1 === 'waagerecht' || r2 === 'waagerecht' || r1 === r2) return 'gleichgerichtet';
  return 'entgegengesetzt';
}

/** Neigungsdifferenz (s1 − s2) bzw. (s1 + s2) mit Beträgen in ‰ – immer positiv. */
export function neigungsdifferenz(s1: number, s2: number, art: 'gleichgerichtet' | 'entgegengesetzt'): number {
  return art === 'entgegengesetzt' ? Math.abs(s1) + Math.abs(s2) : Math.abs(Math.abs(s1) - Math.abs(s2));
}

/** Kuppe, wenn die Neigung in Fahrtrichtung abnimmt (z. B. Steigung → Gefälle), sonst Wanne. */
export function kuppeOderWanne(s1: number, r1: Richtung, s2: number, r2: Richtung): 'kuppe' | 'wanne' {
  return neigungMitVorzeichen(s2, r2) < neigungMitVorzeichen(s1, r1) ? 'kuppe' : 'wanne';
}

/** lta = (ra/2) · Δs/1000 in m (Δs in ‰). */
export function tangentenlaenge(ra: number, ds: number): number {
  return (ra / 2) * (ds / 1000);
}

/** ra = 2000 · lta / Δs */
export function radiusAusTangente(lta: number, ds: number): number {
  return (2000 * lta) / ds;
}

/** Δs = 2000 · lta / ra */
export function neigungsdifferenzAusTangente(lta: number, ra: number): number {
  return (2000 * lta) / ra;
}

/** la ≈ 2 · lta */
export function ausrundungslaenge(lta: number): number {
  return 2 * lta;
}

/** y = x² / (2·ra) in m. */
export function ordinateAusrundung(x: number, ra: number): number {
  return (x * x) / (2 * ra);
}

/** ve aus ra und Faktor: ve = √(ra / Faktor) */
export function geschwindigkeitAusAusrundung(ra: number, stufe: AusrundungsStufe): number {
  return Math.sqrt(ra / AUSRUNDUNG_FAKTOR[stufe]);
}

// ---------- APP 11 – Überhöhung (Kap. 13–15) ----------

/** u0 = 11,8 · v² / r in mm (v in km/h, r in m). */
export function ausgleichendeUeberhoehung(v: number, r: number): number {
  return (11.8 * v * v) / r;
}

/** reg u = 7,1 · v² / r (alt) bzw. 6,5 · v² / r (neu) in mm. */
export function regelueberhoehung(v: number, r: number, version: 'alt' | 'neu'): number {
  return ((version === 'alt' ? 7.1 : 6.5) * v * v) / r;
}

/** min u = 11,8 · zul v² / r − zul uf in mm (kann ≤ 0 werden = keine Überhöhung nötig). */
export function mindestueberhoehung(v: number, r: number, zulUf: number): number {
  return ausgleichendeUeberhoehung(v, r) - zulUf;
}

/** uf = u0 − u in mm. */
export function ueberhoehungsfehlbetrag(u0: number, u: number): number {
  return u0 - u;
}

/** r = 11,8 · v² / (min u + zul uf) in m. */
export function radiusAusUeberhoehung(v: number, u: number, zulUf: number): number {
  return (11.8 * v * v) / (u + zulUf);
}

/** r = 11,8 · v² / u0 */
export function radiusAusU0(v: number, u0: number): number {
  return (11.8 * v * v) / u0;
}

/** v = √(u0 · r / 11,8) in km/h. */
export function geschwindigkeitAusU0(u0: number, r: number): number {
  return Math.sqrt((u0 * r) / 11.8);
}

/** zul v = √((u + zul uf) · r / 11,8) in km/h. */
export function zulGeschwindigkeit(u: number, zulUf: number, r: number): number {
  return Math.sqrt(((u + zulUf) * r) / 11.8);
}

/** Fährt der Zug schneller (uf > 0) oder langsamer (uf < 0) als „ausgeglichen“? */
export function fahrtEinordnen(u0: number, u: number): 'zu-schnell' | 'zu-langsam' | 'ausgeglichen' {
  const uf = u0 - u;
  if (Math.abs(uf) < 0.5) return 'ausgeglichen';
  return uf > 0 ? 'zu-schnell' : 'zu-langsam';
}

// ---------- APP 6 – Kontrollwert Kraft pro Kelvin (Datenprüfung) ----------

/** F pro Kelvin = A · α · E in kN/K (A in mm², E in N/mm²). */
export function kraftProKelvin(a: number, alpha = 11.5e-6, e = 2.1e5): number {
  return (a * alpha * e) / 1000;
}

// =====================================================================
// Ausbau 2026-11-09: restliche Apps (Tim: „alles als einzelne App rein“).
// Formeln mit status "unklar" in formelsammlung.json haben hier bewusst KEINE Rechenfunktion.
// =====================================================================

export const ALPHA_STAHL = 11.5e-6;
export const E_STAHL = 2.1e5;
export const G_ERDE = 9.81;

// ---------- APP 3 – Übergangsbogen (kubische Parabel, Kap. 03) ----------

/** y = x³ / (6·r·lü) in m. */
export function ordinateKubisch(x: number, r: number, lue: number): number {
  return (x * x * x) / (6 * r * lue);
}

/** r = x³ / (6·y·lü) */
export function radiusAusKubisch(x: number, y: number, lue: number): number {
  return (x * x * x) / (6 * y * lue);
}

/** lü = x³ / (6·r·y) */
export function laengeAusKubisch(x: number, r: number, y: number): number {
  return (x * x * x) / (6 * r * y);
}

/** x = ∛(6·r·lü·y) */
export function abszisseKubisch(r: number, lue: number, y: number): number {
  return Math.cbrt(6 * r * lue * y);
}

// ---------- APP 5 – Gleisverziehung (Kap. 05) ----------

/** lvz = 2·√(r·Δe) in m (ohne Zwischengerade). */
export function verziehungslaenge(r: number, de: number): number {
  return 2 * Math.sqrt(r * de);
}

/** r = lvz² / (4·Δe) */
export function radiusAusVerziehung(lvz: number, de: number): number {
  return (lvz * lvz) / (4 * de);
}

/** Δe = lvz² / (4·r) */
export function versatzAusVerziehung(lvz: number, r: number): number {
  return (lvz * lvz) / (4 * r);
}

/** Mindestradius der Verziehungsbögen: r ≥ ve² / 2 */
export function mindestradiusVerziehung(ve: number): number {
  return (ve * ve) / 2;
}

/** Mindestlänge Zwischengerade: 0,4·ve (ve ≤ 200) bzw. 0,6·ve (ve > 200). */
export function mindestZwischengerade(ve: number): { lg: number; faktor: number } {
  const faktor = ve > 200 ? 0.6 : 0.4;
  return { lg: faktor * ve, faktor };
}

// ---------- APP 6 – Temperatur und Kräfte (Kap. 06) ----------

/** Δl = l·α·ΔT (Δl in derselben Einheit wie l). */
export function laengenaenderung(l: number, dT: number, alpha = ALPHA_STAHL): number {
  return l * alpha * dT;
}

/** σ = α·E·ΔT in N/mm². */
export function temperaturspannung(dT: number, alpha = ALPHA_STAHL, e = E_STAHL): number {
  return alpha * e * dT;
}

/** F = σ·A in N (σ in N/mm², A in mm²). */
export function kraftAusSpannung(sigma: number, a: number): number {
  return sigma * a;
}

/** F = F_Schiene · ΔT in kN (F_Schiene in kN/K). */
export function laengskraft(fProK: number, dT: number): number {
  return fProK * dT;
}

// ---------- APP 7 – Atmendes Gleisende (Kap. 06) ----------

/** l_atm = A·E·α·ΔT / p in cm (A mm², E N/mm², p N/cm). Für m durch 100 teilen. */
export function atmendeLaengeCm(a: number, dT: number, p: number, alpha = ALPHA_STAHL, e = E_STAHL): number {
  return (a * e * alpha * dT) / p;
}

/** ΔT = l_atm[cm] · p / (A·E·α) */
export function temperaturAusAtmend(lCm: number, a: number, p: number, alpha = ALPHA_STAHL, e = E_STAHL): number {
  return (lCm * p) / (a * e * alpha);
}

/** p = A·E·α·ΔT / l_atm[cm] */
export function widerstandAusAtmend(lCm: number, a: number, dT: number, alpha = ALPHA_STAHL, e = E_STAHL): number {
  return (a * e * alpha * dT) / lCm;
}

// ---------- APP 8 – Kräfte am Fahrzeug (Kap. 07–09) ----------

/** F = m·v²/r in N (m kg, v m/s, r m). */
export function fliehkraft(m: number, v: number, r: number): number {
  return (m * v * v) / r;
}

/** Neigung in ‰ → Winkel in Grad: α = arctan(s/1000). */
export function winkelAusPromille(s: number): number {
  return (Math.atan(s / 1000) * 180) / Math.PI;
}

/** H = G·sin α (α in Grad). */
export function hangabtrieb(g: number, alphaGrad: number): number {
  return g * Math.sin((alphaGrad * Math.PI) / 180);
}

/** V = G·cos α (α in Grad). */
export function vertikalkraft(g: number, alphaGrad: number): number {
  return g * Math.cos((alphaGrad * Math.PI) / 180);
}

// ---------- APP 9 – Querbeschleunigung (Kap. 10) ----------

/** aq = v²/(12,96·r) − u/153 in m/s² (v km/h, r m, u mm). */
export function querbeschleunigung(v: number, r: number, u: number): number {
  return (v * v) / (12.96 * r) - u / 153;
}

/** v = √(12,96·r·(aq + u/153)) in km/h. */
export function geschwindigkeitAusQuer(aq: number, r: number, u: number): number {
  return Math.sqrt(12.96 * r * (aq + u / 153));
}

/** u = 153·(v²/(12,96·r) − aq) in mm. */
export function ueberhoehungAusQuer(aq: number, v: number, r: number): number {
  return 153 * ((v * v) / (12.96 * r) - aq);
}

/** r = v² / (12,96·(aq + u/153)) in m. */
export function radiusAusQuer(aq: number, v: number, u: number): number {
  return (v * v) / (12.96 * (aq + u / 153));
}

// ---------- APP 10 – Weichen (Kap. 11–12) ----------

/** v = 2,91·√r in km/h (nicht überhöhte Weiche, uf = 100 mm). */
export function weichenGeschwindigkeit(r: number): number {
  return 2.91 * Math.sqrt(r);
}

/** r = (v / 2,91)² */
export function weichenRadius(v: number): number {
  return Math.pow(v / 2.91, 2);
}

/** lg = c − 2·lt */
export function zwischengeradeWeiche(c: number, lt: number): number {
  return c - 2 * lt;
}

// ---------- APP 12 – Überhöhungsrampen (Kap. 16–17) ----------

/** m = lR·1000 / Δu (Rampe 1 : m). */
export function rampenverhaeltnis(lR: number, du: number): number {
  return (lR * 1000) / du;
}

/** lR = Faktor·v·Δu / 1000 in m (gerade: 10, Bloss: 7,5). */
export function rampenlaenge(v: number, du: number, faktor: number): number {
  return (faktor * v * du) / 1000;
}

/** lR aus 1 : m: lR = m·Δu / 1000 */
export function rampenlaengeAusNeigung(m: number, du: number): number {
  return (m * du) / 1000;
}

export const RAMPE_FAKTOR = { gerade: 10, bloss: 7.5 } as const;

// ---------- APP 13 – Überhöhung entlang der Rampe (Kap. 18) ----------

/** ux = u·x / lR (gerade Rampe). */
export function uxGerade(u: number, x: number, lR: number): number {
  return (u * x) / lR;
}

/** S-förmige Rampe: erste Hälfte 2·uE·x²/l², zweite Hälfte uE − 2·uE·(l−x)²/l². */
export function uxS(uE: number, x: number, l: number): { ux: number; haelfte: 1 | 2 } {
  if (x <= l / 2) return { ux: (2 * uE * x * x) / (l * l), haelfte: 1 };
  return { ux: uE - (2 * uE * (l - x) * (l - x)) / (l * l), haelfte: 2 };
}

/** x aus ux (gerade Rampe): x = ux·lR / u */
export function xAusUxGerade(ux: number, u: number, lR: number): number {
  return (ux * lR) / u;
}

// ---------- APP 14 – Krümmung und Ruck-Kriterium (Kap. 19–20) ----------

/** k = 1000 / r in 1/km. */
export function kruemmung(r: number): number {
  return 1000 / r;
}

/** Grenzwert 9000 / v² in 1/km. */
export function ruckGrenze(v: number): number {
  return 9000 / (v * v);
}

/** Übergangsbogen zwischen Gerade und Bogen nötig? Δk = 1000/r > 9000/v² */
export function uebergangNoetigGerade(r: number, v: number): boolean {
  return kruemmung(r) > ruckGrenze(v);
}

/** Gleichsinnige Bögen: Δk = |1000/r2 − 1000/r1| > 9000/v² */
export function uebergangNoetigGleichsinnig(r1: number, r2: number, v: number): boolean {
  return Math.abs(kruemmung(r2) - kruemmung(r1)) > ruckGrenze(v);
}

/** Gegenbögen: Σk = 1000/r1 + 1000/r2 > 10 */
export function uebergangNoetigGegenbogen(r1: number, r2: number): boolean {
  return kruemmung(r1) + kruemmung(r2) > 10;
}

/** Größte Geschwindigkeit ohne Übergangsbogen: v = √(9000 / Δk) */
export function vOhneUebergang(dk: number): number {
  return Math.sqrt(9000 / dk);
}

// ---------- APP 15 – Mindestlänge Übergangsbogen (Kap. 21) ----------

export const UEBERGANG_FAKTOR = { klothoide: 4, bloss: 4.5, schramm: 6 } as const;
export type UebergangsForm = keyof typeof UEBERGANG_FAKTOR;

/** min lu = Faktor·v·Δu / 1000 in m. */
export function mindestUebergangslaenge(v: number, du: number, form: UebergangsForm): number {
  return (UEBERGANG_FAKTOR[form] * v * du) / 1000;
}

// ---------- APP 16 – Zweiggleisradius Innenbogenweiche (Kap. 22) ----------

/** rz = (rG·rSt − t²) / (rG + rSt) */
export function zweiggleisInnen(rG: number, rSt: number, t: number): number {
  return (rG * rSt - t * t) / (rG + rSt);
}

/** rSt aus rz (Innenbogenweiche umgestellt): rSt = (rz·rG + t²) / (rG − rz) */
export function stammgleisAusZweiggleisInnen(rz: number, rG: number, t: number): number {
  return (rz * rG + t * t) / (rG - rz);
}

/** Tangentenlänge einer Weiche aus Radius und Neigung 1:n: t = r·tan(α/2), α = arctan(1/n). */
export function weichenTangente(r: number, n: number): number {
  return r * Math.tan(Math.atan(1 / n) / 2);
}

// ---------- APP 17 – Rampenvolumen (Anhang) ----------

/** V = hK·h/6 · (l1 + l2 + l3) in m³. */
export function rampenvolumen(hK: number, h: number, l1: number, l2: number, l3: number): number {
  return ((hK * h) / 6) * (l1 + l2 + l3);
}

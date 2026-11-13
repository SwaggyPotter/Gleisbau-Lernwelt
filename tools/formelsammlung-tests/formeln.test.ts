/**
 * Referenzwerte – alle von Hand (Taschenrechner) nachgerechnet, Rechenweg im Kommentar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as F from '../../src/app/modules/berufsschule/formelsammlung/kern/formeln';

function nahe(ist: number, soll: number, tol = 1e-6): void {
  assert.ok(Math.abs(ist - soll) <= tol, `erwartet ${soll}, bekommen ${ist}`);
}

test('APP 1 Pfeilhöhe', () => {
  // 20² / (8·500) = 400 / 4000 = 0,1 m
  nahe(F.pfeilhoehe(20, 500), 0.1);
  // (20/2)² / (2·500) = 100 / 1000 = 0,1 m – gleiche Formel
  nahe(F.pfeilhoeheHalbsehne(20, 500), 0.1);
  // 10² / (8·250) = 100 / 2000 = 0,05 m
  nahe(F.pfeilhoehe(10, 250), 0.05);
  // a·b/(2r): 6·14 / (2·300) = 84 / 600 = 0,14 m
  nahe(F.pfeilhoeheAB(6, 14, 300), 0.14);
  // Mitte: a = b = 10 → 100 / 1000 = 0,1 = ls²/(8r)
  nahe(F.pfeilhoeheAB(10, 10, 500), F.pfeilhoehe(20, 500));
  // r = 20² / (8·0,08) = 400 / 0,64 = 625 m
  nahe(F.radiusAusPfeilhoehe(20, 0.08), 625);
  // r = 6·14 / (2·0,14) = 84 / 0,28 = 300 m
  nahe(F.radiusAusPfeilhoeheAB(6, 14, 0.14), 300);
  // ls = √(8·625·0,08) = √400 = 20 m
  nahe(F.sehneAusPfeilhoehe(625, 0.08), 20);
});

test('APP 2 Kreisbogen von der x-Achse', () => {
  // r = 100, x = 10: 100 − √(10000 − 100) = 100 − √9900 = 100 − 99,498744 = 0,501256 m
  nahe(F.ordinateKreisGenau(100, 10), 0.501256, 1e-6);
  // Näherung: 10² / 200 = 0,5 m
  nahe(F.ordinateKreisNaeherung(100, 10), 0.5);
  // r = 500, x = 60: 500 − √(250000 − 3600) = 500 − √246400 = 500 − 496,386946 = 3,613054 m
  nahe(F.ordinateKreisGenau(500, 60), 3.613054, 1e-6);
  // Näherung 3600 / 1000 = 3,6 m
  nahe(F.ordinateKreisNaeherung(500, 60), 3.6);
  // Grenze r/10: 500 → 50 m; 50 zulässig, 60 nicht
  assert.equal(F.naeherungZulaessig(500, 50), true);
  assert.equal(F.naeherungZulaessig(500, 60), false);
  nahe(F.naeherungsgrenze(500), 50);
  // x = √(2·100·0,5) = √100 = 10
  nahe(F.abszisseNaeherung(100, 0.5), 10);
  // genau: √(2·100·0,5 − 0,25) = √99,75 = 9,987492
  nahe(F.abszisseGenau(100, 0.5), 9.987492, 1e-6);
  // r = 10² / (2·0,5) = 100 m
  nahe(F.radiusAusOrdinateNaeherung(10, 0.5), 100);
  // x > r → NaN
  assert.ok(Number.isNaN(F.ordinateKreisGenau(100, 120)));
});

test('APP 4 Ausrundung – Radien', () => {
  // ve = 160: 160² = 25600
  nahe(F.ausrundungsradius(160, 'regel').ra, 10240);          // 0,40 · 25600
  nahe(F.ausrundungsradius(160, 'ermessen').ra, 6400);         // 0,25 · 25600
  nahe(F.ausrundungsradius(160, 'genehmigungKuppe').ra, 4096); // 0,16 · 25600
  nahe(F.ausrundungsradius(160, 'genehmigungWanne').ra, 3328); // 0,13 · 25600
  // ve = 60: 0,40 · 3600 = 1440 < 2000 → 2000
  const r60 = F.ausrundungsradius(60, 'regel');
  nahe(r60.roh, 1440);
  nahe(r60.ra, 2000);
  assert.equal(r60.mindestGreift, true);
  // ve = 100 Wanne: 0,13 · 10000 = 1300 → 2000
  nahe(F.ausrundungsradius(100, 'genehmigungWanne').ra, 2000);
  // ve aus ra: √(10240 / 0,4) = √25600 = 160
  nahe(F.geschwindigkeitAusAusrundung(10240, 'regel'), 160);
});

test('APP 4 Ausrundung – Neigungen, Kuppe/Wanne, lta, y', () => {
  // Steigung 12 → Gefälle 8: entgegengesetzt, 12 + 8 = 20 ‰, Kuppe
  assert.equal(F.neigungsArt('steigung', 'gefaelle'), 'entgegengesetzt');
  nahe(F.neigungsdifferenz(12, 8, 'entgegengesetzt'), 20);
  assert.equal(F.kuppeOderWanne(12, 'steigung', 8, 'gefaelle'), 'kuppe');
  // Gefälle 10 → Steigung 6: Wanne, 16 ‰
  assert.equal(F.kuppeOderWanne(10, 'gefaelle', 6, 'steigung'), 'wanne');
  nahe(F.neigungsdifferenz(10, 6, 'entgegengesetzt'), 16);
  // Steigung 12 → Steigung 4: gleichgerichtet, 12 − 4 = 8, Steigung wird flacher → Kuppe
  assert.equal(F.neigungsArt('steigung', 'steigung'), 'gleichgerichtet');
  nahe(F.neigungsdifferenz(12, 4, 'gleichgerichtet'), 8);
  assert.equal(F.kuppeOderWanne(12, 'steigung', 4, 'steigung'), 'kuppe');
  // Steigung 4 → Steigung 12: Wanne, |4 − 12| = 8
  assert.equal(F.kuppeOderWanne(4, 'steigung', 12, 'steigung'), 'wanne');
  nahe(F.neigungsdifferenz(4, 12, 'gleichgerichtet'), 8);
  // Gefälle 4 → Gefälle 12: wird steiler bergab → Kuppe
  assert.equal(F.kuppeOderWanne(4, 'gefaelle', 12, 'gefaelle'), 'kuppe');
  // Waagerecht → Steigung 10: gleichgerichtet (s − 0), Wanne
  assert.equal(F.neigungsArt('waagerecht', 'steigung'), 'gleichgerichtet');
  assert.equal(F.kuppeOderWanne(0, 'waagerecht', 10, 'steigung'), 'wanne');
  // Waagerecht → Gefälle: Kuppe
  assert.equal(F.kuppeOderWanne(0, 'waagerecht', 10, 'gefaelle'), 'kuppe');
  // lta = 10000/2 · 20/1000 = 5000 · 0,02 = 100 m
  nahe(F.tangentenlaenge(10000, 20), 100);
  // lta = 5000/2 · 8/1000 = 2500 · 0,008 = 20 m
  nahe(F.tangentenlaenge(5000, 8), 20);
  // ra = 2000 · 20 / 8 = 5000 m
  nahe(F.radiusAusTangente(20, 8), 5000);
  // Δs = 2000 · 100 / 10000 = 20 ‰
  nahe(F.neigungsdifferenzAusTangente(100, 10000), 20);
  // la = 2 · 100 = 200 m
  nahe(F.ausrundungslaenge(100), 200);
  // y = 50² / (2·10000) = 2500 / 20000 = 0,125 m
  nahe(F.ordinateAusrundung(50, 10000), 0.125);
  // y am TS: 100² / 20000 = 0,5 m
  nahe(F.ordinateAusrundung(100, 10000), 0.5);
});

test('APP 11 Überhöhung', () => {
  // u0 = 11,8 · 120² / 1000 = 11,8 · 14400 / 1000 = 169,92 mm
  nahe(F.ausgleichendeUeberhoehung(120, 1000), 169.92);
  // reg u alt = 7,1 · 14,4 = 102,24 mm; neu = 6,5 · 14,4 = 93,6 mm
  nahe(F.regelueberhoehung(120, 1000, 'alt'), 102.24);
  nahe(F.regelueberhoehung(120, 1000, 'neu'), 93.6);
  // min u = 169,92 − 130 = 39,92 mm
  nahe(F.mindestueberhoehung(120, 1000, 130), 39.92);
  // r = 11,8 · 14400 / (39,92 + 130) = 169920 / 169,92 = 1000 m
  nahe(F.radiusAusUeberhoehung(120, 39.92, 130), 1000);
  // r aus u0: 169920 / 169,92 = 1000
  nahe(F.radiusAusU0(120, 169.92), 1000);
  // uf = 169,92 − 100 = 69,92 mm
  nahe(F.ueberhoehungsfehlbetrag(169.92, 100), 69.92);
  // v = √(169,92 · 1000 / 11,8) = √14400 = 120 km/h
  nahe(F.geschwindigkeitAusU0(169.92, 1000), 120);
  // zul v = √((39,92 + 130) · 1000 / 11,8) = 120
  nahe(F.zulGeschwindigkeit(39.92, 130, 1000), 120);
  // v = 80, r = 1000: u0 = 11,8 · 6400 / 1000 = 75,52; bei u = 100 → zu langsam
  assert.equal(F.fahrtEinordnen(F.ausgleichendeUeberhoehung(80, 1000), 100), 'zu-langsam');
  assert.equal(F.fahrtEinordnen(169.92, 100), 'zu-schnell');
});

test('APP 6 Kontrollwerte F pro Kelvin = A · α · E', () => {
  // S49: 6297 · 11,5e-6 · 2,1e5 = 6297 · 2,415 = 15207,255 N/K = 15,207255 kN/K
  nahe(F.kraftProKelvin(6297), 15.207255, 1e-9);
  // S54: 6948 · 2,415 = 16779,42 N/K
  nahe(F.kraftProKelvin(6948), 16.77942, 1e-9);
  // UIC60: 7687 · 2,415 = 18564,105 N/K
  nahe(F.kraftProKelvin(7687), 18.564105, 1e-9);
});

// ---------- Ausbau 2026-11-09: restliche Apps ----------

test('APP 3 Übergangsbogen', () => {
  // 40³ / (6 · 800 · 100) = 64000 / 480000 = 0,133333 m
  nahe(F.ordinateKubisch(40, 800, 100), 0.133333, 1e-6);
  // Umstellen muss zurückführen
  nahe(F.radiusAusKubisch(40, 64000 / 480000, 100), 800);
  nahe(F.laengeAusKubisch(40, 800, 64000 / 480000), 100);
  nahe(F.abszisseKubisch(800, 100, 64000 / 480000), 40);
});

test('APP 5 Gleisverziehung', () => {
  // 2 · √(10000 · 2) = 2 · 141,42136 = 282,84271 m
  nahe(F.verziehungslaenge(10000, 2), 282.842712, 1e-6);
  // r = 282,84271² / (4 · 2) = 80000 / 8 = 10000
  nahe(F.radiusAusVerziehung(Math.sqrt(80000), 2), 10000);
  // Δe = 200² / (4 · 5000) = 40000 / 20000 = 2 m
  nahe(F.versatzAusVerziehung(200, 5000), 2);
  // ve 160: 25600 / 2 = 12800 m
  nahe(F.mindestradiusVerziehung(160), 12800);
  // lg: 0,4 · 200 = 80 (Grenze gehört zum kleinen Faktor), 0,6 · 250 = 150
  nahe(F.mindestZwischengerade(200).lg, 80);
  nahe(F.mindestZwischengerade(250).lg, 150);
});

test('APP 6/7 Temperatur und atmendes Ende', () => {
  // 30000 mm · 11,5e-6 · 25 K = 8,625 mm
  nahe(F.laengenaenderung(30000, 25), 8.625);
  // 2,415 · 30 = 72,45 N/mm²
  nahe(F.temperaturspannung(30), 72.45);
  // 72,45 · 6948 = 503.382,6 N
  nahe(F.kraftAusSpannung(72.45, 6948), 503382.6, 1e-6);
  // 16,78 kN/K · 30 K = 503,4 kN
  nahe(F.laengskraft(16.78, 30), 503.4);
  // S54, 30 K, 100 N/cm: 503.382,6 N / 100 N/cm = 5033,826 cm ≈ 50,34 m
  nahe(F.atmendeLaengeCm(6948, 30, 100), 5033.826, 1e-6);
  nahe(F.temperaturAusAtmend(5033.826, 6948, 100), 30, 1e-6);
  nahe(F.widerstandAusAtmend(5033.826, 6948, 30), 100, 1e-6);
});

test('APP 8 Kräfte am Fahrzeug', () => {
  // 60000 kg · 30² / 1000 m = 54000 N
  nahe(F.fliehkraft(60000, 30, 1000), 54000);
  // 1000 ‰ → 45°
  nahe(F.winkelAusPromille(1000), 45);
  // G = 100, α = 30°: H = 50, V = 86,6025
  nahe(F.hangabtrieb(100, 30), 50, 1e-9);
  nahe(F.vertikalkraft(100, 60), 50, 1e-9);
});

test('APP 9 Querbeschleunigung', () => {
  // 14400 / 12960 − 100 / 153 = 1,111111 − 0,653595 = 0,457516 m/s²
  nahe(F.querbeschleunigung(120, 1000, 100), 0.457516, 1e-6);
  nahe(F.geschwindigkeitAusQuer(F.querbeschleunigung(120, 1000, 100), 1000, 100), 120, 1e-9);
  nahe(F.ueberhoehungAusQuer(F.querbeschleunigung(120, 1000, 100), 120, 1000), 100, 1e-9);
  nahe(F.radiusAusQuer(F.querbeschleunigung(120, 1000, 100), 120, 100), 1000, 1e-6);
});

test('APP 10 Weichen', () => {
  // 2,91 · √500 = 2,91 · 22,36068 = 65,0696 km/h
  nahe(F.weichenGeschwindigkeit(500), 65.069578, 1e-6);
  nahe(F.weichenRadius(65.069578145), 500, 1e-6);
  // 50 − 2 · 20 = 10 m
  nahe(F.zwischengeradeWeiche(50, 20), 10);
});

test('APP 12/13 Rampen', () => {
  // 120 m · 1000 / 100 mm = 1200 → 1 : 1200
  nahe(F.rampenverhaeltnis(120, 100), 1200);
  // gerade: 10 · 120 · 100 / 1000 = 120 m; Bloss: 7,5 · … = 90 m
  nahe(F.rampenlaenge(120, 100, 10), 120);
  nahe(F.rampenlaenge(120, 100, 7.5), 90);
  nahe(F.rampenlaengeAusNeigung(400, 100), 40);
  // ux gerade: 120 · 30 / 100 = 36 mm
  nahe(F.uxGerade(120, 30, 100), 36);
  // S-Rampe Mitte = halbe Überhöhung, erste Hälfte 2 · 120 · 25² / 100² = 15 mm
  nahe(F.uxS(120, 50, 100).ux, 60);
  nahe(F.uxS(120, 25, 100).ux, 15);
  // zweite Hälfte spiegelbildlich: bei x = 75 → 120 − 15 = 105 mm
  nahe(F.uxS(120, 75, 100).ux, 105);
  nahe(F.xAusUxGerade(36, 120, 100), 30);
});

test('APP 14 Krümmung und Ruck-Kriterium', () => {
  nahe(F.kruemmung(500), 2);
  // 9000 / 100² = 0,9
  nahe(F.ruckGrenze(100), 0.9);
  // r = 1000: k = 1 > 0,9 → nötig; r = 1200: 0,833 < 0,9 → nicht nötig
  assert.equal(F.uebergangNoetigGerade(1000, 100), true);
  assert.equal(F.uebergangNoetigGerade(1200, 100), false);
  // gleichsinnig 1000/2000: Δk = 0,5 < 0,9
  assert.equal(F.uebergangNoetigGleichsinnig(1000, 2000, 100), false);
  // Gegenbogen 150 + 200: 6,67 + 5 = 11,67 > 10
  assert.equal(F.uebergangNoetigGegenbogen(150, 200), true);
  // v = √(9000 / 1) = 94,868 = 3 · √1000
  nahe(F.vOhneUebergang(1), 3 * Math.sqrt(1000), 1e-9);
});

test('APP 15 Mindestlänge Übergangsbogen', () => {
  // 4 · 120 · 100 / 1000 = 48 m; 4,5 → 54 m; 6 → 72 m
  nahe(F.mindestUebergangslaenge(120, 100, 'klothoide'), 48);
  nahe(F.mindestUebergangslaenge(120, 100, 'bloss'), 54);
  nahe(F.mindestUebergangslaenge(120, 100, 'schramm'), 72);
});

test('APP 16 Zweiggleisradius Innenbogenweiche', () => {
  // (500 · 1500 − 20,797²) / 2000 = (750000 − 432,515) / 2000 = 374,784 m
  nahe(F.zweiggleisInnen(500, 1500, 20.797), 374.783742, 1e-6);
  nahe(F.stammgleisAusZweiggleisInnen(374.7837423955, 500, 20.797), 1500, 1e-6);
  // EW 500-1:12: t = 500 · tan(arctan(1/12) / 2) = 20,797 m
  nahe(F.weichenTangente(500, 12), 20.797, 1e-3);
});

test('APP 17 Rampenvolumen', () => {
  // 20 · 2 / 6 · (10 + 4 + 4) = 6,6667 · 18 = 120 m³
  nahe(F.rampenvolumen(20, 2, 10, 4, 4), 120, 1e-9);
});

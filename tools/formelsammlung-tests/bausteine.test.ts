import { test } from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import { FORMELSAMMLUNG, formel } from '../../src/app/modules/berufsschule/formelsammlung/kern/daten';
import { pruefeZahl, standardToleranz } from '../../src/app/modules/berufsschule/formelsammlung/kern/pruefen';
import { fmt, parseEingabe, umrechnen, zl } from '../../src/app/modules/berufsschule/formelsammlung/kern/zahlen';
import { FortschrittSpeicher, sterne } from '../../src/app/modules/berufsschule/formelsammlung/kern/fortschritt';
import { ZahlAufgabe } from '../../src/app/modules/berufsschule/formelsammlung/kern/typen';
import { kraftProKelvin } from '../../src/app/modules/berufsschule/formelsammlung/kern/formeln';
import { MINI_APPS } from '../../src/app/modules/berufsschule/formelsammlung/apps';
import { taschenrechnerRechnen, zahlAlsEingabe } from '../../src/app/modules/berufsschule/formelsammlung/kern/taschenrechner';

function latexOk(l: string, wo: string): void {
  try {
    katex.renderToString(l, { throwOnError: true, strict: 'ignore' });
  } catch (e) {
    assert.fail(`KaTeX-Fehler in ${wo}: ${l}\n${(e as Error).message}`);
  }
}

test('Zahlen: Eingabe parsen', () => {
  assert.equal(parseEingabe('0,08'), 0.08);
  assert.equal(parseEingabe('0.08'), 0.08);
  assert.equal(parseEingabe(' 1.234,5 '), 1234.5);
  assert.equal(parseEingabe('10.240'), 10240);
  assert.equal(parseEingabe('1 234,5'), 1234.5);
  assert.equal(parseEingabe('−3,5'), -3.5);
  assert.equal(parseEingabe('-3'), -3);
  assert.ok(Number.isNaN(parseEingabe('')));
  assert.ok(Number.isNaN(parseEingabe('abc')));
  assert.ok(Number.isNaN(parseEingabe('1,2,3')));
});

test('Zahlen: Formatieren', () => {
  assert.equal(fmt(10240, 0), '10.240');
  assert.equal(fmt(1440, 0), '1440');
  assert.equal(fmt(0.0769, 4), '0,0769');
  assert.equal(fmt(-69.92, 1), '−69,9');
  assert.equal(fmt(-0.01, 1), '0,0');
  assert.equal(zl(10240.5, 1), '10\\,240{,}5');
});

test('Einheiten umrechnen', () => {
  assert.equal(umrechnen(0.65, 'km', 'm'), 650);
  assert.equal(umrechnen(76.9, 'mm', 'm'), 0.0769);
  assert.equal(umrechnen(7.7, 'cm', 'm'), 0.077);
  assert.equal(umrechnen(36, 'km/h', 'm/s'), 10);
  assert.equal(umrechnen(10, 'm/s', 'km/h'), 36);
  assert.equal(umrechnen(1.2, '%', '‰'), 12);
  assert.throws(() => umrechnen(1, 'm', 'km/h'));
});

test('Prüfen mit Toleranz und Fehlerhinweisen', () => {
  const a = { art: 'zahl', loesung: 76.9, nk: 1, toleranz: standardToleranz(1) } as ZahlAufgabe;
  assert.equal(pruefeZahl(a, '76,9').richtig, true);
  assert.equal(pruefeZahl(a, '77').richtig, true);      // 0,13 % daneben
  assert.equal(pruefeZahl(a, '76').richtig, false);     // 1,2 % daneben
  assert.equal(pruefeZahl(a, 'x').ungueltig, true);
  assert.match(pruefeZahl(a, '0,0769').hinweis ?? '', /1000/); // m statt mm
  assert.match(pruefeZahl(a, '-76,9').hinweis ?? '', /Vorzeichen/);
});

test('Fortschritt und Sterne', () => {
  const mem: Record<string, string> = {};
  const sp = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = v; } };
  const f = new FortschrittSpeicher(sp);
  for (let i = 0; i < 5; i++) f.ergebnis('pfeilhoehe', 'ueben', true);
  assert.equal(sterne(f.app('pfeilhoehe')), 1);
  for (let i = 0; i < 3; i++) { f.ergebnis('pfeilhoehe', 'umstellen', true); f.ergebnis('pfeilhoehe', 'einheiten', true); }
  assert.equal(sterne(f.app('pfeilhoehe')), 2);
  f.pruefung('pfeilhoehe', 75);
  assert.equal(sterne(f.app('pfeilhoehe')), 2);
  f.pruefung('pfeilhoehe', 85);
  assert.equal(sterne(f.app('pfeilhoehe')), 3);
  assert.equal(f.app('pfeilhoehe').bestSerie, 11);
  f.ergebnis('pfeilhoehe', 'ueben', false);
  assert.equal(f.app('pfeilhoehe').serie, 0);
  // Neu laden aus Speicher
  const g = new FortschrittSpeicher(sp);
  assert.equal(g.app('pfeilhoehe').modi.ueben.gesamt, 6);
  // Kaputter Speicher → leer, kein Absturz
  const kaputt = new FortschrittSpeicher({ getItem: () => '{kaputt', setItem: () => { throw new Error('voll'); } });
  kaputt.ergebnis('x', 'ueben', true);
  assert.equal(kaputt.app('x').modi.ueben.richtig, 1);
  // Kein Speicher
  assert.equal(new FortschrittSpeicher(null).app('y').serie, 0);
});

test('formelsammlung.json: Struktur und KaTeX', () => {
  const appIds = new Set(FORMELSAMMLUNG.apps.map(a => a.id));
  const kapIds = new Set(FORMELSAMMLUNG.kapitel.map(k => k.id));
  assert.equal(FORMELSAMMLUNG.apps.length, 17);
  const ids = new Set<string>();
  for (const f of FORMELSAMMLUNG.formeln) {
    assert.ok(!ids.has(f.id), `doppelte Formel-ID ${f.id}`);
    ids.add(f.id);
    assert.ok(appIds.has(f.app), `${f.id}: unbekannte App ${f.app}`);
    assert.ok(kapIds.has(f.kapitel), `${f.id}: unbekanntes Kapitel ${f.kapitel}`);
    latexOk(f.latex, f.id);
    for (const v of f.variablen) latexOk(v.symbol, `${f.id}/${v.name}`);
    if (f.status === 'unklar') assert.ok(f.unklar, `${f.id}: unklar ohne Text`);
  }
  for (const a of FORMELSAMMLUNG.apps) {
    assert.ok(kapIds.has(a.kapitel), `App ${a.id}: Kapitel ${a.kapitel}`);
    assert.ok(FORMELSAMMLUNG.formeln.some(f => f.app === a.id), `App ${a.id} hat keine Formel`);
  }
  for (const app of MINI_APPS) {
    for (const id of app.formelIds) assert.equal(formel(id).app, app.id, `${app.id}: Formel ${id} gehört zu anderer App`);
  }
});

test('Profilflächen: A · α · E ergibt die Kontrollwerte', () => {
  for (const p of FORMELSAMMLUNG.profile) {
    if (p.fProKelvin === undefined) continue;
    assert.ok(Math.abs(kraftProKelvin(p.flaeche) - p.fProKelvin) < 1e-9, `${p.name}: ${kraftProKelvin(p.flaeche)} ≠ ${p.fProKelvin}`);
  }
});

test('Taschenrechner: Ausrundungs-Rechnung, Wurzel, Ans, Fehler', () => {
  const r = (a: string, ans = 0) => taschenrechnerRechnen(a, ans);
  // Δs = 12 + 8 = 20 ‰; ra = 0,4 · 120² = 5760 m; T = 5760 · 20 / 2000 = 57,6 m
  assert.equal(r('12+8'), 20);
  assert.ok(Math.abs(r('0,4×120²')! - 5760) < 1e-9);
  assert.ok(Math.abs(r('5760×20÷2000')! - 57.6) < 1e-9);
  assert.ok(Math.abs(r('Ans×20÷2000', 5760)! - 57.6) < 1e-9);
  assert.ok(Math.abs(r('Ans²÷(2×5760)', 57.6)! - 0.288) < 1e-9);   // ymax = T²/(2·ra)
  assert.equal(r('√(2500)'), 50);
  assert.equal(r('√16+√(3²+4²)'), 9);
  assert.equal(r('2√(9)'), 6);
  assert.equal(r('12−(−8)'), 20);
  assert.equal(r('Ans+1', -2.5), -1.5);
  assert.equal(r('√(−4)'), null);
  assert.equal(r('5+'), null);
  assert.equal(r('abc'), null);
  assert.equal(zahlAlsEingabe(-0.125), '(-0,125)');
  assert.equal(zahlAlsEingabe(1 / 3).startsWith('0,3333'), true);
});

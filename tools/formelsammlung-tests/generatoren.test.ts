/**
 * Jeder Generator, jeder Modus, jede Stufe: viele Zufallsaufgaben erzeugen und prüfen, dass
 * - alle Zahlen endlich sind und keine „NaN“/„undefined“ im Text stehen,
 * - die Musterlösung (so gerundet, wie sie angezeigt wird) als richtig erkannt wird,
 * - alles LaTeX mit KaTeX fehlerfrei rendert,
 * - Auswahlaufgaben gültige, verschiedene Optionen haben.
 * Außerdem: jeder Rechner liefert mit seinen Startwerten endliche Ergebnisse.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import { MINI_APPS } from '../../src/app/modules/berufsschule/formelsammlung/apps';
import { pruefeZahl } from '../../src/app/modules/berufsschule/formelsammlung/kern/pruefen';
import { Aufgabe, AufgabenModus, Stufe } from '../../src/app/modules/berufsschule/formelsammlung/kern/typen';
import { formel } from '../../src/app/modules/berufsschule/formelsammlung/kern/daten';
import { fmt, umrechnen } from '../../src/app/modules/berufsschule/formelsammlung/kern/zahlen';

const N = 400;
const MODI: AufgabenModus[] = ['ueben', 'umstellen', 'einheiten'];
const STUFEN: Stufe[] = [1, 2, 3];

const latexCache = new Set<string>();
function latexOk(l: string, wo: string): void {
  if (latexCache.has(l)) return;
  try {
    katex.renderToString(l, { throwOnError: true, strict: 'ignore' });
    latexCache.add(l);
  } catch (e) {
    assert.fail(`KaTeX-Fehler (${wo}): ${l}\n${(e as Error).message}`);
  }
}

function texteOk(a: Aufgabe): void {
  const alles = JSON.stringify(a);
  assert.ok(!/NaN|undefined|Infinity/.test(alles), `NaN/undefined in Aufgabe: ${alles.slice(0, 400)}`);
}

function pruefeAufgabe(a: Aufgabe, wo: string): void {
  texteOk(a);
  assert.ok(a.frage.length > 5, `${wo}: Frage fehlt`);
  assert.ok(a.tipp.length > 5, `${wo}: Tipp fehlt`);
  assert.ok(a.schritte.length >= 1, `${wo}: kein Lösungsweg`);
  formel(a.formelId); // wirft, wenn die Formel-ID nicht existiert
  latexOk(a.formelLatex, `${wo} formelLatex`);
  for (const sch of a.schritte) if (sch.latex) latexOk(sch.latex, `${wo} Schritt „${sch.text}“`);
  for (const g of a.gegeben) {
    assert.ok(Number.isFinite(g.wert), `${wo}: gegeben ${g.sym} nicht endlich`);
    latexOk(g.sym, `${wo} Symbol`);
  }
  if (a.stufe >= 2 && a.modus === 'ueben') assert.ok(a.text && a.text.length > 10, `${wo}: Stufe ${a.stufe} ohne Textaufgabe`);
  if (a.art === 'zahl') {
    assert.ok(Number.isFinite(a.loesung), `${wo}: Lösung nicht endlich`);
    latexOk(a.gesucht.sym, `${wo} gesucht`);
    const muster = fmt(a.loesung, a.nk).replace(/\./g, '');
    assert.equal(pruefeZahl(a, muster).richtig, true, `${wo}: Musterlösung ${muster} nicht akzeptiert (Lösung ${a.loesung})`);
    // Eine deutlich falsche Antwort darf nicht durchgehen
    const falsch = a.loesung === 0 ? 1 : a.loesung * 1.5;
    assert.equal(pruefeZahl(a, String(falsch).replace('.', ',')).richtig, false, `${wo}: falsche Antwort akzeptiert`);
  } else {
    assert.ok(a.optionen.length >= 2, `${wo}: zu wenige Optionen`);
    assert.equal(new Set(a.optionen).size, a.optionen.length, `${wo}: doppelte Optionen ${a.optionen}`);
    assert.ok(a.richtig >= 0 && a.richtig < a.optionen.length, `${wo}: richtig-Index ungültig`);
    for (const o of a.optionen) if (o.includes('\\') || o.includes('_')) latexOk(o, `${wo} Option`);
  }
}

for (const app of MINI_APPS) {
  test(`Generator ${app.id}`, () => {
    for (const modus of MODI) {
      for (const stufe of STUFEN) {
        for (let i = 0; i < N; i++) {
          const a = app.generiere(modus, stufe);
          assert.equal(a.appId, app.id);
          assert.equal(a.modus, modus);
          pruefeAufgabe(a, `${app.id}/${modus}/${stufe}`);
        }
      }
    }
  });

  test(`Rechner ${app.id}`, () => {
    for (const v of app.rechner) {
      const w: Record<string, number> = {};
      for (const f of v.felder) w[f.key] = umrechnen(f.standard, f.einheiten?.[0] ?? f.einheit, f.einheit);
      const sw: Record<string, string> = {};
      for (const sch of v.schalter ?? []) sw[sch.key] = sch.optionen[0].wert;
      const aus = v.berechne(w, sw);
      assert.ok(aus.ergebnisse.length > 0, `${app.id}/${v.id}: keine Ergebnisse mit Startwerten`);
      for (const e of aus.ergebnisse) assert.ok(Number.isFinite(e.wert), `${app.id}/${v.id}: ${e.name} nicht endlich`);
      for (const sch of aus.schritte) if (sch.latex) latexOk(sch.latex, `${app.id}/${v.id}`);
      for (const e of aus.ergebnisse) latexOk(e.sym, `${app.id}/${v.id} sym`);
      // Leere/ungültige Eingaben dürfen nicht abstürzen
      const leer: Record<string, number> = {};
      for (const f of v.felder) leer[f.key] = NaN;
      const aus2 = v.berechne(leer, sw);
      assert.ok(Array.isArray(aus2.warnungen));
    }
  });
}

test('Rechner liefern die Referenzwerte', () => {
  const app = (id: string) => MINI_APPS.find(a => a.id === id)!;
  const rv = (id: string, v: string) => app(id).rechner.find(r => r.id === v)!;
  // 20² / (8 · 500) = 0,1 m = 100 mm
  assert.equal(rv('pfeilhoehe', 'hf').berechne({ ls: 20, r: 500 }, {}).ergebnisse[0].wert.toFixed(6), '100.000000');
  // r = 500, x = 60 → genau 3,613054 m, Warnung x > r/10
  const kb = rv('kreisbogen', 'y').berechne({ r: 500, x: 60 }, {});
  assert.ok(Math.abs(kb.ergebnisse[0].wert - 3613.054) < 0.01);
  assert.equal(kb.warnungen.length, 1);
  // ve 160, Regel, Steigung 12 → Gefälle 8: ra 10240, Δs 20, lta = 5120 · 0,02 = 102,4 m
  const au = rv('ausrundung', 've').berechne({ ve: 160, s1: 12, s2: 8, x: 0 }, { stufe: 'regel', r1: 'steigung', r2: 'gefaelle' });
  assert.ok(Math.abs(au.ergebnisse.find(e => e.sym === 'l_{ta}')!.wert - 102.4) < 1e-9);
  // u0 bei 120 km/h, r 1000: 169,92 mm
  assert.ok(Math.abs(rv('ueberhoehung', 'u0').berechne({ v: 120, r: 1000 }, {}).ergebnisse[0].wert - 169.92) < 1e-9);
});

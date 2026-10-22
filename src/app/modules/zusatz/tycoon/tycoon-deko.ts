/* eslint-disable @typescript-eslint/no-explicit-any */
import '@babylonjs/core/Meshes/thinInstanceMesh';
import { Scene } from '@babylonjs/core/scene';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { TycoonWeltDaten } from './tycoon-3d';
import { hoehe3D } from './tycoon-hoehen';
import { aufLand, GROSSSTADT, KARTE_H, KARTE_W, SC, wx, wz } from './tycoon-karte';

/*
 * Landschaft fuer die 3D-Ansicht des Tycoon: Waelder, Buesche, Felsen und Haeuser um die Staedte.
 * Alle Modelle: Kenney Nature Kit / City Kit Suburban / City Kit Commercial (CC0), unter
 * src/assets/modelle/kenney-{natur,vorort,stadt}/. Jedes Modell wird zu EINEM Mesh verschmolzen
 * und per Thin Instances vervielfaeltigt -- hunderte Baeume kosten so nur wenige Draw Calls.
 */

const P = 'assets/modelle/';
const BAEUME = ['tree_default', 'tree_oak', 'tree_pineRoundA', 'tree_pineTallA', 'tree_cone', 'tree_fat', 'tree_detailed']
  .map((n) => P + 'kenney-natur/' + n + '.glb');
const KLEINKRAM = ['plant_bush', 'plant_bushLarge', 'rock_largeA', 'rock_largeC'].map((n) => P + 'kenney-natur/' + n + '.glb');
const VORORT = 'abcdefgh'.split('').map((c) => P + 'kenney-vorort/building-type-' + c + '.glb');
const STADT = 'abcdefgh'.split('').map((c) => P + 'kenney-stadt/building-' + c + '.glb');
const HOCHHAUS = ['a', 'b'].map((c) => P + 'kenney-stadt/building-skyscraper-' + c + '.glb');
const IND = (n: string) => P + 'kenney-industrie/' + n + '.glb';

/** 3D-Punkt (x, z) liegt auf Land? (Umkehrung von wx/wz.) */
const imLand = (x: number, z: number) => aufLand(x / SC + KARTE_W / 2, -z / SC + KARTE_H / 2);
const X0 = wx(0), X1 = wx(KARTE_W), Z0 = wz(KARTE_H), Z1 = wz(0);

interface Objekt {
  modell: string;
  x: number;
  z: number;
  dreh: number;
  /** Zielhoehe (Baeume) bzw. Zielbreite (Gebaeude, Felsen) in 3D-Einheiten. */
  groesse: number;
  nachHoehe: boolean;
  /** Hoechstens so hoch (Gebaeude), damit Namensschilder frei bleiben. */
  maxHoehe: number;
  /** Gehoert zu Stadt i (nur sichtbar, wenn die Stadt aufgedeckt ist), sonst -1. */
  stadt: number;
  /** Mindestabstand zur Gleisachse. */
  frei: number;
}

interface Vorbild { mesh: Mesh; min: Vector3; max: Vector3 }

const mulberry = (a: number) => () => {
  a |= 0; a = a + 0x6D2B79F5 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};

export class TycoonDeko {
  private readonly objekte: Objekt[] = [];
  private readonly vorbilder = new Map<string, Vorbild | 'laedt' | 'fehler'>();
  private schluessel = '';
  /** Gebaeude des Spielers (Kohlelager, Unterwerke) -- aendern sich mit dem Spielstand. */
  private spielerObjekte: Objekt[] = [];
  private tot = false;

  constructor(private readonly scene: Scene, staedte: { n: string; x: number; y: number }[]) {
    const rnd = mulberry(4711);
    const pick = <T>(a: T[]) => a[Math.floor(rnd() * a.length)];
    const sx = staedte.map((c) => wx(c.x)), sz = staedte.map((c) => wz(c.y));
    const nahStadt = (x: number, z: number, r: number) => sx.some((cx, i) => Math.hypot(x - cx, z - sz[i]) < r);

    const gebaeude: { x: number; z: number }[] = [];
    // Haeuser um jede Stadt: innen Stadtgebaeude (Grossstaedte mit Hochhaeusern), aussen Vorort.
    staedte.forEach((c, i) => {
      const gross = GROSSSTADT.has(c.n);
      const anzahl = gross ? 13 : 8, rMax = gross ? 5.5 : 4.2;
      for (let k = 0, versuche = 0; k < anzahl && versuche < 200; versuche++) {
        const w = rnd() * Math.PI * 2, r = 2.1 + rnd() * (rMax - 2.1);
        const x = sx[i] + Math.cos(w) * r, z = sz[i] + Math.sin(w) * r;
        // Abstand zu allen Gebaeuden (auch der Nachbarstadt) und zu fremden Stadtmitten
        if (gebaeude.some((h) => Math.hypot(h.x - x, h.z - z) < 1.55) || !imLand(x, z)) continue;
        if (sx.some((cx, j) => j !== i && Math.hypot(x - cx, z - sz[j]) < 2.6)) continue;
        gebaeude.push({ x, z });
        k++;
        const innen = r < 4;
        // Grossstadt: innen Hochhaeuser/Geschaeftshaeuser. Kleinstadt: wenige Geschaeftshaeuser, sonst Vorort.
        const hoch = gross && innen && rnd() < 0.35;
        const modell = hoch ? pick(HOCHHAUS) : innen && (gross || rnd() < 0.3) ? pick(STADT) : pick(VORORT);
        // Gebaeude zur Stadtmitte drehen (in 90-Grad-Schritten wirkt es aufgeraeumter).
        const dreh = Math.round((Math.atan2(sx[i] - x, sz[i] - z)) / (Math.PI / 2)) * (Math.PI / 2);
        this.objekte.push({ modell, x, z, dreh, groesse: innen ? 1.5 : 1.3, nachHoehe: false, maxHoehe: hoch ? 4.2 : modell.includes('vorort') ? 1.6 : 2.6, stadt: i, frei: 1.6 });
      }
    });

    // Waelder (Gruppen) und einzelne Baeume, Buesche, Felsen -- nicht in Staedten.
    const baum = (x: number, z: number) => {
      if (!imLand(x, z) || nahStadt(x, z, 6)) return;
      this.objekte.push({ modell: pick(BAEUME), x, z, dreh: rnd() * Math.PI * 2, groesse: 1.4 + rnd() * 1.3, nachHoehe: true, maxHoehe: 9, stadt: -1, frei: 1.3 });
    };
    for (let w = 0; w < 75; w++) {
      const cx = X0 + rnd() * (X1 - X0), cz = Z0 + rnd() * (Z1 - Z0), r = 1.5 + rnd() * 4, n = 5 + Math.floor(rnd() * 11);
      for (let k = 0; k < n; k++) { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r; baum(cx + Math.cos(a) * d, cz + Math.sin(a) * d); }
    }
    for (let k = 0; k < 280; k++) baum(X0 + rnd() * (X1 - X0), Z0 + rnd() * (Z1 - Z0));
    // Industrie: Windraeder im flachen Norden, Solarfelder, Kuehltuerme (Ruhrgebiet, Leipzig), Tanklager (Hamburg), Wassertuerme.
    const nordGrenze = wz(staedte[3].y); // ungefaehr Breite von Hannover
    for (let k = 0; k < 45; k++) {
      const x = X0 + rnd() * (X1 - X0), z = nordGrenze + rnd() * (Z1 - nordGrenze);
      if (!imLand(x, z) || nahStadt(x, z, 5)) continue;
      this.objekte.push({ modell: IND('windmill'), x, z, dreh: rnd() * Math.PI * 2, groesse: 3, nachHoehe: true, maxHoehe: 9, stadt: -1, frei: 1.2 });
    }
    for (let k = 0; k < 18; k++) {
      const x = X0 + rnd() * (X1 - X0), z = Z0 + rnd() * (Z1 - Z0);
      if (!imLand(x, z) || nahStadt(x, z, 6)) continue;
      this.objekte.push({ modell: IND('solar-panel-landscape-group'), x, z, dreh: 0, groesse: 1.4, nachHoehe: false, maxHoehe: 9, stadt: -1, frei: 1.4 });
    }
    const beiStadt = (i: number, modell: string, groesse: number, nachHoehe: boolean, n: number) => {
      for (let k = 0; k < n; k++) {
        const w = rnd() * Math.PI * 2, r = 4.8 + rnd() * 1.8, x = sx[i] + Math.cos(w) * r, z = sz[i] + Math.sin(w) * r;
        if (imLand(x, z)) this.objekte.push({ modell, x, z, dreh: rnd() * Math.PI * 2, groesse, nachHoehe, maxHoehe: 9, stadt: i, frei: 1.5 });
      }
    };
    beiStadt(6, IND('chimney-large'), 2.2, true, 3);    // Dortmund
    beiStadt(4, IND('chimney-large'), 2.2, true, 2);    // Leipzig
    beiStadt(1, IND('detail-tank-large'), 1.2, false, 3); // Hamburg
    [2, 13, 15, 22, 23].forEach((i) => beiStadt(i, IND('water-tower'), 1.8, true, 1));
    for (let k = 0; k < 110; k++) {
      const x = X0 + rnd() * (X1 - X0), z = Z0 + rnd() * (Z1 - Z0);
      if (!imLand(x, z) || nahStadt(x, z, 6)) continue;
      this.objekte.push({ modell: pick(KLEINKRAM), x, z, dreh: rnd() * Math.PI * 2, groesse: 0.5 + rnd() * 0.6, nachHoehe: false, maxHoehe: 9, stadt: -1, frei: 1.1 });
    }
  }

  zerstoeren(): void { this.tot = true; }

  /** Pro Bild aufrufen; baut die Instanzen nur neu, wenn sich Strecken oder aufgedeckte Staedte aendern. */
  aktualisiere(d: TycoonWeltDaten): void {
    const S = d.S;
    // Kohlelager je Stadt, Bahnstrom-Unterwerk an Staedten mit eigener Oberleitung.
    const olStaedte = Array.from(new Set<number>(S.lines.filter((l: any) => l.ol).flatMap((l: any) => [l.a, l.b])));
    const spielerKey = (S.lager || []).join(',') + '/' + olStaedte.join(',');
    const schluessel = S.lines.length + '|' + S.vis.join('') + '|' + this.vorbilder.size + '|' + this.geladen + '|' + spielerKey;
    if (schluessel === this.schluessel) return;
    this.schluessel = schluessel;

    const gleise: { x: number; z: number }[][] = S.lines.map((L: any) => L.pts.map((p: any) => ({ x: wx(p.x), z: wz(p.y) })));
    const amGleis = (o: Objekt) => gleise.some((pts) => pts.some((p) => Math.abs(p.x - o.x) < o.frei + 1 && Math.hypot(p.x - o.x, p.z - o.z) < o.frei));

    const platz = (c: number, winkel: number, modell: string, groesse: number): Objekt => {
      const st = d.CITIES[c], x = wx(st.x) + Math.cos(winkel) * 2.6, z = wz(st.y) + Math.sin(winkel) * 2.6;
      return { modell, x, z, dreh: winkel, groesse, nachHoehe: false, maxHoehe: 2, stadt: c, frei: 0 };
    };
    this.spielerObjekte = [
      ...(S.lager || []).map((c: number) => platz(c, 0.9, IND('building-h'), 1.8)),
      ...olStaedte.map((c) => platz(c, 2.5, IND('building-c'), 1.4)),
    ];
    const jeModell = new Map<string, Objekt[]>();
    for (const o of [...this.objekte, ...this.spielerObjekte]) {
      if (o.stadt >= 0 && !S.vis[o.stadt]) continue;
      if (amGleis(o)) continue;
      if (!jeModell.has(o.modell)) jeModell.set(o.modell, []);
      jeModell.get(o.modell)!.push(o);
    }
    const alle = new Set([...this.objekte, ...this.spielerObjekte].map((o) => o.modell));
    [IND('building-h'), IND('building-c')].forEach((m) => alle.add(m));
    for (const modell of alle) {
      const v = this.vorbild(modell);
      if (!v) continue;
      const liste = jeModell.get(modell) ?? [];
      if (!liste.length) { v.mesh.setEnabled(false); continue; }
      const g = v.max.subtract(v.min);
      const puffer = new Float32Array(liste.length * 16);
      liste.forEach((o, i) => {
        const s = Math.min(o.nachHoehe ? o.groesse / Math.max(0.001, g.y) : o.groesse / Math.max(0.001, g.x, g.z), o.maxHoehe / Math.max(0.001, g.y));
        Matrix.Translation(-(v.min.x + v.max.x) / 2, -v.min.y, -(v.min.z + v.max.z) / 2)
          .multiply(Matrix.Scaling(s, s, s))
          .multiply(Matrix.RotationY(o.dreh))
          .multiply(Matrix.Translation(o.x, hoehe3D(o.x, o.z), o.z))
          .copyToArray(puffer, i * 16);
      });
      v.mesh.thinInstanceSetBuffer('matrix', puffer, 16, true);
      v.mesh.setEnabled(true);
    }
  }

  /** Zaehlt fertig geladene Vorbilder -- Teil des Schluessels, damit nach dem Laden neu verteilt wird. */
  private geladen = 0;

  private vorbild(datei: string): Vorbild | null {
    const v = this.vorbilder.get(datei);
    if (v === 'laedt' || v === 'fehler') return null;
    if (v) return v;
    this.vorbilder.set(datei, 'laedt');
    const i = datei.lastIndexOf('/');
    SceneLoader.ImportMeshAsync('', datei.slice(0, i + 1), datei.slice(i + 1), this.scene).then((erg) => {
      const wurzel = erg.meshes[0];
      if (this.tot) { wurzel.dispose(); return; }
      wurzel.computeWorldMatrix(true);
      const teile = erg.meshes.filter((m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0);
      teile.forEach((m) => m.computeWorldMatrix(true));
      // Verschmelzen backt die Weltmatrizen ein (inkl. glTF-Achsenumrechnung des __root__).
      const mesh = Mesh.MergeMeshes(teile, true, true, undefined, false, true);
      wurzel.dispose();
      if (!mesh) { this.vorbilder.set(datei, 'fehler'); return; }
      mesh.isPickable = false;
      mesh.alwaysSelectAsActiveMesh = true;
      mesh.setEnabled(false);
      const b = mesh.getBoundingInfo().boundingBox;
      this.vorbilder.set(datei, { mesh, min: b.minimum.clone(), max: b.maximum.clone() });
      this.geladen++;
    }).catch(() => this.vorbilder.set(datei, 'fehler'));
    return null;
  }
}

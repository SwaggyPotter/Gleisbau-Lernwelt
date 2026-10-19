/* eslint-disable @typescript-eslint/no-explicit-any */
import '@babylonjs/loaders/glTF';
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Materials/PBR/pbrMaterial';
import '@babylonjs/core/Culling/ray';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { AssetContainer } from '@babylonjs/core/assetContainer';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { CreateTube } from '@babylonjs/core/Meshes/Builders/tubeBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { TycoonDeko } from './tycoon-deko';

/** Was die 2D-Spiel-Engine der 3D-Ansicht pro Bild zur Verfuegung stellt (nur lesen). */
export interface TycoonWeltDaten {
  S: any;
  sel: { city: number | null; line: number | null };
  CITIES: { n: string; x: number; y: number }[];
  DIFF: { col: string }[];
  posAt: (L: any, s: number) => { x: number; y: number; ang: number };
}

const MODELL_PFAD = 'assets/modelle/kenney/';
/** Modelle je Lok-Typ (Index wie TRAINS in tycoon-engine.ts). Kenney Train Kit, CC0. */
export const ZUG_MODELLE: { lok: string; wagen: string[] }[] = [
  { lok: 'train-locomotive-a', wagen: ['train-carriage-coal', 'train-carriage-wood'] },
  { lok: 'train-diesel-a', wagen: ['train-carriage-container-red', 'train-carriage-container-blue'] },
  { lok: 'train-electric-city-a', wagen: ['train-electric-city-a'] },
  { lok: 'train-electric-bullet-a', wagen: ['train-electric-double-a'] },
];
/** Fremdzuege (zahlen Trassenentgelt): Gueterzug mit Diesellok. */
const FREMD_MODELL = { lok: 'train-diesel-b', wagen: ['train-carriage-box', 'train-carriage-tank'] };
export const lokDatei = (typ: number): string => MODELL_PFAD + (ZUG_MODELLE[typ] ?? ZUG_MODELLE[1]).lok + '.glb';

/** Massstab: 2D-Welt (1000 x 640 Einheiten) -> 3D (100 x 64). */
const SC = 0.1;
const WAGEN_LAENGE = 2.0;
const WAGEN_ABSTAND = 2.15;
const wx = (x: number) => (x - 500) * SC;
const wz = (y: number) => -(y - 320) * SC;

interface Vorlage { container: AssetContainer; drehY: number; skala: number; versatz: Vector3 }

/**
 * 3D-Ansicht fuer den Gleisbau Tycoon: zeichnet Gelaende, Staedte, Strecken und die fahrenden
 * Zuege als Kenney-Modelle. Die Spiel-Logik bleibt komplett in tycoon-engine.ts; diese Klasse
 * liest pro Bild den Zustand und leitet Klicks als 2D-Weltkoordinaten zurueck.
 */
export class TycoonWelt3D {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly kamera: ArcRotateCamera;
  private readonly vorlagen = new Map<string, Vorlage | 'laedt'>();
  private readonly zuege = new Map<number, { schluessel: string; wagen: TransformNode[] }>();
  private readonly staedte: { sockel: Mesh; schild: Mesh }[] = [];
  private strecken: { schotter: Mesh; band: Mesh; bandMat: StandardMaterial; schotterMat: StandardMaterial }[] = [];
  private streckenS: any = null;
  private ausgerichtetAuf: any = null;
  private stoerungen: Mesh[] = [];
  private readonly auswahlRing: Mesh;
  private readonly deko: TycoonDeko;
  private tot = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly daten: () => TycoonWeltDaten,
    private readonly onKlick: (x: number, y: number) => void,
  ) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false, antialias: true }, true);
    this.engine.disableUniformBuffers = true;
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.78, 0.86, 0.92, 1);

    this.kamera = new ArcRotateCamera('kamera', -Math.PI / 2, 0.85, 78, new Vector3(4, 0, -2), this.scene);
    this.kamera.lowerRadiusLimit = 8;
    this.kamera.upperRadiusLimit = 130;
    this.kamera.upperBetaLimit = 1.35;
    this.kamera.wheelPrecision = 14;
    this.kamera.panningSensibility = 60;
    this.kamera.attachControl(canvas, true);

    const himmel = new HemisphericLight('himmel', new Vector3(0, 1, 0.3), this.scene);
    himmel.intensity = 0.7;
    himmel.groundColor = new Color3(0.5, 0.5, 0.55);
    const sonne = new DirectionalLight('sonne', new Vector3(-0.4, -1, 0.5), this.scene);
    sonne.intensity = 0.55;

    const boden = CreateGround('boden', { width: 118, height: 84 }, this.scene);
    boden.position.set(0, -0.02, 0);
    boden.material = this.farbe('boden', '#7d9b5e');
    boden.isPickable = false;

    const { CITIES } = daten();
    CITIES.forEach((c, i) => {
      const sockel = CreateCylinder('stadt' + i, { diameter: 3, height: 0.25, tessellation: 24 }, this.scene);
      sockel.position.set(wx(c.x), 0.12, wz(c.y));
      sockel.material = this.farbe('stadtMat' + i, '#d9d4c7');
      sockel.isPickable = false;
      const schild = CreatePlane('schild' + i, { width: 10, height: 2.5 }, this.scene);
      schild.position.set(wx(c.x), 5, wz(c.y));
      schild.billboardMode = Mesh.BILLBOARDMODE_ALL;
      schild.material = this.schildMaterial(c.n, i);
      schild.isPickable = false;
      this.staedte.push({ sockel, schild });
    });
    this.deko = new TycoonDeko(this.scene, CITIES);
    this.auswahlRing = CreateTorus('auswahl', { diameter: 3.4, thickness: 0.35, tessellation: 28 }, this.scene);
    this.auswahlRing.material = this.farbe('auswahlMat', '#e4572e', true);
    this.auswahlRing.isPickable = false;

    // Tippen (nicht Ziehen) = Klick in der 2D-Welt: Strahl mit der Bodenebene y = 0 schneiden.
    let runter: { x: number; y: number; t: number } | null = null;
    this.scene.onPointerObservable.add((pi) => {
      const e = pi.event as PointerEvent;
      if (pi.type === PointerEventTypes.POINTERDOWN) { runter = { x: e.clientX, y: e.clientY, t: performance.now() }; return; }
      if (pi.type !== PointerEventTypes.POINTERUP || !runter) return;
      const kurz = performance.now() - runter.t < 600 && Math.hypot(e.clientX - runter.x, e.clientY - runter.y) < 8;
      runter = null;
      if (!kurz) return;
      const r = this.canvas.getBoundingClientRect();
      const ray = this.scene.createPickingRay(e.clientX - r.left, e.clientY - r.top, Matrix.Identity(), this.kamera);
      if (Math.abs(ray.direction.y) < 1e-4) return;
      const t = -ray.origin.y / ray.direction.y;
      if (t <= 0) return;
      const p = ray.origin.add(ray.direction.scale(t));
      this.onKlick(p.x / SC + 500, -p.z / SC + 320);
    });

    this.scene.onBeforeRenderObservable.add(() => this.aktualisiere());
    this.engine.runRenderLoop(() => { if (!this.tot) this.scene.render(); });
    window.addEventListener('resize', this.onResize);
  }

  private readonly onResize = (): void => this.engine.resize();

  /** Nach Groessenaenderung des Containers aufrufen. */
  resize(): void { this.engine.resize(); }

  zerstoeren(): void {
    this.tot = true;
    this.deko.zerstoeren();
    window.removeEventListener('resize', this.onResize);
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }

  /* ---------- Materialien ---------- */
  private farbe(name: string, hex: string, leuchtend = false): StandardMaterial {
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = Color3.FromHexString(hex);
    m.specularColor = Color3.Black();
    if (leuchtend) m.emissiveColor = Color3.FromHexString(hex).scale(0.6);
    return m;
  }

  private schildMaterial(text: string, i: number): StandardMaterial {
    const tex = new DynamicTexture('schildTex' + i, { width: 512, height: 128 }, this.scene, true);
    tex.hasAlpha = true;
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, 512, 128);
    ctx.font = '700 60px system-ui, sans-serif';
    const w = Math.min(500, ctx.measureText(text).width + 44);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.roundRect(256 - w / 2, 18, w, 92, 20);
    ctx.fill();
    ctx.fillStyle = '#23262b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 66);
    tex.update();
    const m = new StandardMaterial('schildMat' + i, this.scene);
    m.diffuseTexture = tex;
    m.emissiveColor = Color3.White();
    m.disableLighting = true;
    m.useAlphaFromDiffuseTexture = true;
    m.backFaceCulling = false;
    return m;
  }

  /* ---------- Modelle ---------- */
  private vorlage(id: string): Vorlage | null {
    const v = this.vorlagen.get(id);
    if (v === 'laedt') return null;
    if (v) return v;
    this.vorlagen.set(id, 'laedt');
    SceneLoader.LoadAssetContainerAsync(MODELL_PFAD, id + '.glb', this.scene).then((container) => {
      if (this.tot) { container.dispose(); return; }
      // Einmal vermessen: lange Achse auf Z drehen, auf WAGEN_LAENGE skalieren, auf den Boden stellen.
      const probe = new TransformNode('probe', this.scene);
      const inst = container.instantiateModelsToScene((n) => n, false, { doNotInstantiate: true });
      inst.rootNodes.forEach((r) => (r.parent = probe));
      let b = probe.getHierarchyBoundingVectors(true);
      const drehY = b.max.x - b.min.x > (b.max.z - b.min.z) * 1.05 ? Math.PI / 2 : 0;
      probe.rotation.y = drehY;
      probe.computeWorldMatrix(true);
      b = probe.getHierarchyBoundingVectors(true);
      const skala = WAGEN_LAENGE / Math.max(0.001, b.max.z - b.min.z);
      const versatz = new Vector3(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2).scale(skala);
      probe.dispose();
      this.vorlagen.set(id, { container, drehY, skala, versatz });
    }).catch(() => this.vorlagen.delete(id));
    return null;
  }

  private baueWagen(id: string): TransformNode | null {
    const v = this.vorlage(id);
    if (!v) return null;
    const wagen = new TransformNode('wagen-' + id, this.scene);
    const halter = new TransformNode('halter', this.scene);
    halter.parent = wagen;
    halter.position.copyFrom(v.versatz);
    halter.rotation.y = v.drehY;
    halter.scaling.setAll(v.skala);
    const inst = v.container.instantiateModelsToScene((n) => n, false, { doNotInstantiate: true });
    inst.rootNodes.forEach((r) => (r.parent = halter));
    wagen.getChildMeshes().forEach((m) => (m.isPickable = false));
    return wagen;
  }

  /* ---------- Bild-Aktualisierung ---------- */
  private aktualisiere(): void {
    const d = this.daten();
    const S = d.S;
    if (!S) return;
    if (this.ausgerichtetAuf !== S) { this.ausgerichtetAuf = S; this.richteKameraAus(d); }
    this.syncStrecken(d);
    this.deko.aktualisiere(d);
    this.syncStaedte(d);
    this.syncStoerungen(d);
    this.syncZuege(d);
  }

  /** Kamera auf die sichtbaren Staedte (= eigenes Netz samt Nachbarn) ausrichten. */
  private richteKameraAus(d: TycoonWeltDaten): void {
    const sichtbar = d.CITIES.filter((_, i) => d.S.vis[i]);
    if (!sichtbar.length) return;
    const xs = sichtbar.map((c) => wx(c.x)), zs = sichtbar.map((c) => wz(c.y));
    const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
    // Auf schmalen Bildschirmen (Hochformat) liegt das Panel unten und deckt ca. 38 % ab.
    const schmal = this.canvas.clientWidth < 700;
    const seitenverhaeltnis = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight * (schmal ? 0.62 : 1));
    let radius = Math.max(28, Math.max(maxX - minX, maxZ - minZ) * 1.25 + 14);
    if (seitenverhaeltnis < 1.3) radius *= 1.3 / Math.max(0.4, seitenverhaeltnis);
    radius = Math.min(130, radius);
    // Breit: Panel rechts (300 px) -- Mittelpunkt nach rechts schieben. Schmal: Richtung Kamera, damit das Netz oben sitzt.
    const versatzX = schmal ? 0 : radius * 0.14;
    const versatzZ = schmal ? -radius * 0.18 : -2;
    this.kamera.setTarget(new Vector3((minX + maxX) / 2 + versatzX, 0, (minZ + maxZ) / 2 + versatzZ));
    this.kamera.radius = radius;
    this.kamera.alpha = -Math.PI / 2;
    this.kamera.beta = 0.8;
  }

  private syncStaedte(d: TycoonWeltDaten): void {
    const S = d.S;
    this.staedte.forEach((st, i) => {
      const sichtbar = !!S.vis[i];
      st.sockel.setEnabled(sichtbar);
      st.schild.setEnabled(sichtbar);
    });
    const c = d.sel.city !== null ? d.CITIES[d.sel.city] : null;
    this.auswahlRing.setEnabled(!!c);
    if (c) this.auswahlRing.position.set(wx(c.x), 0.4, wz(c.y));
  }

  private syncStrecken(d: TycoonWeltDaten): void {
    const S = d.S;
    if (this.streckenS !== S || this.strecken.length !== S.lines.length) {
      if (this.streckenS !== S) {
        this.strecken.forEach((s) => { s.schotter.dispose(); s.band.dispose(); s.bandMat.dispose(); s.schotterMat.dispose(); });
        this.strecken = [];
        this.streckenS = S;
      }
      for (let i = this.strecken.length; i < S.lines.length; i++) {
        const L = S.lines[i];
        const pfad = L.pts.map((p: any) => new Vector3(wx(p.x), 0.05, wz(p.y)));
        const schotter = CreateTube('schotter' + i, { path: pfad, radius: 0.75, tessellation: 8, cap: Mesh.CAP_ALL }, this.scene);
        schotter.scaling.y = 0.25;
        const schotterMat = this.farbe('schotterMat' + i, '#8d8478');
        schotter.material = schotterMat;
        const band = CreateTube('band' + i, { path: pfad.map((p: Vector3) => p.add(new Vector3(0, 0.22, 0))), radius: 0.16, tessellation: 6 }, this.scene);
        const bandMat = this.farbe('bandMat' + i, L.color);
        band.material = bandMat;
        schotter.isPickable = band.isPickable = false;
        this.strecken.push({ schotter, band, bandMat, schotterMat });
      }
    }
    this.strecken.forEach((s, i) => {
      const L = S.lines[i];
      const an = d.sel.line === i;
      s.bandMat.emissiveColor = an ? Color3.FromHexString(L.color).scale(0.8) : Color3.Black();
      s.schotterMat.diffuseColor = Color3.FromHexString(L.cond < 25 ? '#b5574b' : L.cond < 50 ? '#b08a50' : '#8d8478');
    });
  }

  private syncStoerungen(d: TycoonWeltDaten): void {
    const S = d.S;
    const offen = S.lines.filter((L: any) => L.fault);
    while (this.stoerungen.length < offen.length) {
      const k = CreateSphere('stoerung', { diameter: 2, segments: 12 }, this.scene);
      k.isPickable = false;
      k.material = this.farbe('stoerMat' + this.stoerungen.length, '#d64545', true);
      this.stoerungen.push(k);
    }
    const puls = 1 + 0.15 * Math.sin(performance.now() / 200);
    this.stoerungen.forEach((k, i) => {
      const L = offen[i];
      k.setEnabled(!!L);
      if (!L) return;
      const p = d.posAt(L, L.len * L.fault.t);
      k.position.set(wx(p.x), 1.6, wz(p.y));
      k.scaling.setAll(puls);
      (k.material as StandardMaterial).diffuseColor = Color3.FromHexString(d.DIFF[L.fault.diff]?.col ?? '#d64545');
      (k.material as StandardMaterial).emissiveColor = (k.material as StandardMaterial).diffuseColor.scale(0.6);
    });
  }

  private syncZuege(d: TycoonWeltDaten): void {
    const S = d.S;
    const gesehen = new Set<number>();
    for (const t of S.trains) {
      const L = S.lines[t.line];
      if (!L) continue;
      const modell = t.own ? (ZUG_MODELLE[t.type ?? 1] ?? ZUG_MODELLE[1]) : FREMD_MODELL;
      const anzahl = t.own ? ([2, 2, 3, 4][t.type ?? 1] ?? 2) : 3;
      const schluessel = (t.own ? 'o' : 'f') + (t.type ?? 1);
      let z = this.zuege.get(t.id);
      if (z && z.schluessel !== schluessel) { z.wagen.forEach((w) => w.dispose()); z = undefined; this.zuege.delete(t.id); }
      if (!z) {
        const wagen: TransformNode[] = [];
        for (let i = 0; i < anzahl; i++) {
          const w = this.baueWagen(i === 0 ? modell.lok : modell.wagen[(i - 1) % modell.wagen.length]);
          if (!w) break;
          wagen.push(w);
        }
        if (wagen.length < anzahl) { wagen.forEach((w) => w.dispose()); continue; }
        // ICE: letzter Wagen ist wieder ein Triebkopf, umgedreht.
        if (t.own && t.type === 3) {
          wagen[anzahl - 1].dispose();
          const kopf = this.baueWagen(modell.lok);
          if (kopf) { (kopf as any).umgedreht = true; wagen[anzahl - 1] = kopf; }
        }
        z = { schluessel, wagen };
        this.zuege.set(t.id, z);
      }
      gesehen.add(t.id);
      const abstand = WAGEN_ABSTAND / SC;
      z.wagen.forEach((w, i) => {
        const s = t.s - t.dir * i * abstand;
        if (s < 0 || s > L.len) { w.setEnabled(false); return; }
        w.setEnabled(true);
        const p = d.posAt(L, s);
        const dx = Math.cos(p.ang) * t.dir, dz = -Math.sin(p.ang) * t.dir;
        w.position.set(wx(p.x), 0.3, wz(p.y));
        w.rotation.y = Math.atan2(dx, dz) + ((w as any).umgedreht ? Math.PI : 0);
      });
    }
    for (const [id, z] of this.zuege) {
      if (!gesehen.has(id)) { z.wagen.forEach((w) => w.dispose()); this.zuege.delete(id); }
    }
  }
}

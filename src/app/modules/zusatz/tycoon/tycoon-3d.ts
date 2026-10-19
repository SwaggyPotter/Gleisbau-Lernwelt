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
import '@babylonjs/core/Meshes/thinInstanceMesh';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateTube } from '@babylonjs/core/Meshes/Builders/tubeBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { TycoonDeko } from './tycoon-deko';
import { KARTE_H, KARTE_W, SC, wx, wz, zeichneKarte } from './tycoon-karte';

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

const WAGEN_LAENGE = 2.0;
const WAGEN_ABSTAND = 2.15;
/** Abstand der Schienen von der Gleismitte und Schwellenabstand (3D-Einheiten). */
const SCHIENE = 0.27;
const SCHWELLEN_ABSTAND = 0.42;

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
  private strecken: { schotter: Mesh; schienen: Mesh[]; schotterMat: StandardMaterial; schwellen: number[] }[] = [];
  private readonly schwellen: Mesh;
  private readonly schieneMat: StandardMaterial;
  private readonly schieneAnMat: StandardMaterial;
  private frei = false;
  private ausgerichtetSichtbar = '';
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
    this.scene.clearColor = new Color4(0.56, 0.70, 0.80, 1);

    this.kamera = new ArcRotateCamera('kamera', -Math.PI / 2, 0.85, 78, new Vector3(4, 0, -2), this.scene);
    this.kamera.lowerRadiusLimit = 8;
    this.kamera.upperRadiusLimit = 200;
    this.kamera.upperBetaLimit = 1.35;
    this.kamera.wheelPrecision = 14;
    this.kamera.panningSensibility = 60;

    const himmel = new HemisphericLight('himmel', new Vector3(0, 1, 0.3), this.scene);
    himmel.intensity = 0.7;
    himmel.groundColor = new Color3(0.5, 0.5, 0.55);
    const sonne = new DirectionalLight('sonne', new Vector3(-0.4, -1, 0.5), this.scene);
    sonne.intensity = 0.55;

    // Boden = Karte (Meer, Nachbarlaender, Deutschland) als Textur, 60 Einheiten Rand rundum.
    const RAND = 60, bw = (KARTE_W + 2 * RAND) * SC, bh = (KARTE_H + 2 * RAND) * SC;
    const boden = CreateGround('boden', { width: bw, height: bh }, this.scene);
    boden.position.set(wx(KARTE_W / 2), -0.02, wz(KARTE_H / 2));
    const tw = 2048, th = Math.round(2048 * bh / bw);
    const karte = new DynamicTexture('karteTex', { width: tw, height: th }, this.scene, true);
    const kctx = karte.getContext() as unknown as CanvasRenderingContext2D;
    kctx.save();
    kctx.scale(tw / (KARTE_W + 2 * RAND), th / (KARTE_H + 2 * RAND));
    kctx.translate(RAND, RAND);
    zeichneKarte(kctx, { meer: '#8fb3cc', ausland: '#a3b48a', land: '#86a866', grenze: '#4d5a3c', schrift: 'rgba(30,40,25,.4)' }, 2.2);
    kctx.restore();
    karte.update();
    const bodenMat = new StandardMaterial('boden', this.scene);
    bodenMat.diffuseTexture = karte;
    bodenMat.specularColor = Color3.Black();
    boden.material = bodenMat;
    boden.isPickable = false;

    this.schwellen = CreateBox('schwelle', { width: 0.9, height: 0.07, depth: 0.2 }, this.scene);
    this.schwellen.material = this.farbe('schwelleMat', '#6b5240');
    this.schwellen.isPickable = false;
    this.schwellen.alwaysSelectAsActiveMesh = true;
    this.schwellen.setEnabled(false);
    this.schieneMat = this.farbe('schieneMat', '#a7adb4');
    this.schieneMat.specularColor = new Color3(0.5, 0.5, 0.5);
    this.schieneAnMat = this.farbe('schieneAnMat', '#ffb347', true);

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
    // Zeiger: Tippen = Klick ins Spiel. In der starren Ansicht zusaetzlich Ziehen = Karte verschieben,
    // zwei Finger = zoomen (Blickwinkel bleibt fest). In der freien Ansicht macht das die Babylon-Kamera.
    let runter: { x: number; y: number; t: number } | null = null;
    const zeiger = new Map<number, { x: number; y: number }>();
    let griff: Vector3 | null = null;
    let fingerAbstand = 0;
    this.scene.onPointerObservable.add((pi) => {
      const e = pi.event as PointerEvent;
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
        runter = zeiger.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
        griff = zeiger.size === 1 ? this.bodenUnter(e.clientX, e.clientY) : null;
        if (zeiger.size === 2) { const [a, b] = [...zeiger.values()]; fingerAbstand = Math.hypot(a.x - b.x, a.y - b.y); }
        return;
      }
      if (pi.type === PointerEventTypes.POINTERMOVE) {
        if (!zeiger.has(e.pointerId)) return;
        zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.frei) return;
        if (zeiger.size === 2) {
          const [a, b] = [...zeiger.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (fingerAbstand > 0 && d > 0) this.zoome(fingerAbstand / d);
          fingerAbstand = d;
          return;
        }
        if (griff && (!runter || Math.hypot(e.clientX - runter.x, e.clientY - runter.y) >= 8)) {
          const jetzt = this.bodenUnter(e.clientX, e.clientY);
          if (jetzt) this.verschiebe(griff.x - jetzt.x, griff.z - jetzt.z);
        }
        return;
      }
      if (pi.type === PointerEventTypes.POINTERWHEEL) {
        if (!this.frei) this.zoome((e as unknown as WheelEvent).deltaY > 0 ? 1.12 : 1 / 1.12);
        return;
      }
      if (pi.type !== PointerEventTypes.POINTERUP) return;
      zeiger.delete(e.pointerId);
      griff = null;
      if (!runter) return;
      const kurz = performance.now() - runter.t < 600 && Math.hypot(e.clientX - runter.x, e.clientY - runter.y) < 8;
      runter = null;
      if (!kurz) return;
      const p = this.bodenUnter(e.clientX, e.clientY);
      if (p) this.onKlick(p.x / SC + KARTE_W / 2, -p.z / SC + KARTE_H / 2);
    });

    this.scene.onBeforeRenderObservable.add(() => this.aktualisiere());
    this.engine.runRenderLoop(() => { if (!this.tot) this.scene.render(); });
    window.addEventListener('resize', this.onResize);
  }

  private readonly onResize = (): void => this.engine.resize();

  /** Schnittpunkt des Sichtstrahls unter dem Bildschirmpunkt mit dem Boden (y = 0). */
  private bodenUnter(clientX: number, clientY: number): Vector3 | null {
    const r = this.canvas.getBoundingClientRect();
    const ray = this.scene.createPickingRay(clientX - r.left, clientY - r.top, Matrix.Identity(), this.kamera);
    if (Math.abs(ray.direction.y) < 1e-4) return null;
    const t = -ray.origin.y / ray.direction.y;
    return t > 0 ? ray.origin.add(ray.direction.scale(t)) : null;
  }

  /** Kameraziel auf dem Boden verschieben, innerhalb der Karte. */
  private verschiebe(dx: number, dz: number): void {
    const z = this.kamera.target;
    const nx = Math.min(wx(KARTE_W), Math.max(wx(0), z.x + dx));
    const nz = Math.min(wz(0), Math.max(wz(KARTE_H), z.z + dz));
    this.kamera.setTarget(new Vector3(nx, 0, nz));
  }

  private zoome(faktor: number): void {
    this.kamera.radius = Math.min(this.kamera.upperRadiusLimit ?? 200, Math.max(this.kamera.lowerRadiusLimit ?? 8, this.kamera.radius * faktor));
  }

  /** Freie Kamera (drehen, zoomen, verschieben) oder starre Kartenansicht, die dem Netz folgt. */
  setzeFreieKamera(frei: boolean): void {
    if (frei === this.frei) return;
    this.frei = frei;
    if (frei) this.kamera.attachControl(this.canvas, true);
    else { this.kamera.detachControl(); this.ausgerichtetSichtbar = ''; }
  }

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
    // Starre Ansicht: neu ausrichten, sobald sich die aufgedeckten Staedte aendern. Frei: nur beim Start.
    const sichtbar = S.vis.join('');
    if (this.ausgerichtetAuf !== S || (!this.frei && sichtbar !== this.ausgerichtetSichtbar)) {
      this.ausgerichtetAuf = S;
      this.ausgerichtetSichtbar = sichtbar;
      this.richteKameraAus(d);
    }
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
    let radius = Math.max(30, Math.max(maxX - minX, maxZ - minZ) * 1.25 + 16);
    if (seitenverhaeltnis < 1.3) radius *= 1.3 / Math.max(0.4, seitenverhaeltnis);
    radius = Math.min(190, radius);
    // Breit: Panel rechts (300 px) -- Mittelpunkt nach rechts schieben. Schmal: Richtung Kamera, damit das Netz oben sitzt.
    const versatzX = schmal ? 0 : radius * 0.14;
    const versatzZ = schmal ? -radius * 0.18 : -2;
    this.kamera.setTarget(new Vector3((minX + maxX) / 2 + versatzX, 0, (minZ + maxZ) / 2 + versatzZ));
    this.kamera.radius = radius;
    this.kamera.alpha = -Math.PI / 2;
    this.kamera.beta = 0.7;
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
        this.strecken.forEach((s) => { s.schotter.dispose(); s.schienen.forEach((m) => m.dispose()); s.schotterMat.dispose(); });
        this.strecken = [];
        this.streckenS = S;
      }
      for (let i = this.strecken.length; i < S.lines.length; i++) this.strecken.push(this.baueGleis(S.lines[i], i));
      // Alle Schwellen aller Strecken als Thin Instances eines einzigen Quaders.
      const alle = this.strecken.flatMap((s) => s.schwellen);
      if (alle.length) this.schwellen.thinInstanceSetBuffer('matrix', new Float32Array(alle), 16, true);
      this.schwellen.setEnabled(alle.length > 0);
    }
    this.strecken.forEach((s, i) => {
      const L = S.lines[i];
      const mat = d.sel.line === i ? this.schieneAnMat : this.schieneMat;
      s.schienen.forEach((m) => { if (m.material !== mat) m.material = mat; });
      s.schotterMat.diffuseColor = Color3.FromHexString(L.cond < 25 ? '#b5574b' : L.cond < 50 ? '#b08a50' : '#8d8478');
    });
  }

  /** Gleis entlang der Streckenkurve: Schotterbett, Schwellen (als Matrizen) und zwei Schienen. */
  private baueGleis(L: any, i: number): { schotter: Mesh; schienen: Mesh[]; schotterMat: StandardMaterial; schwellen: number[] } {
    const pfad: Vector3[] = L.pts.map((p: any) => new Vector3(wx(p.x), 0.05, wz(p.y)));
    const schotter = CreateTube('schotter' + i, { path: pfad, radius: 0.7, tessellation: 10, cap: Mesh.CAP_ALL }, this.scene);
    schotter.scaling.y = 0.2;
    const schotterMat = this.farbe('schotterMat' + i, '#8d8478');
    schotter.material = schotterMat;
    schotter.isPickable = false;
    // Quervektor (rechtwinklig zur Fahrtrichtung) je Punkt
    const quer = pfad.map((_p, k) => {
      const a = pfad[Math.max(0, k - 1)], b = pfad[Math.min(pfad.length - 1, k + 1)];
      const t = b.subtract(a);
      t.y = 0;
      t.normalize();
      return new Vector3(-t.z, 0, t.x);
    });
    const schienen = [-1, 1].map((seite) => {
      const weg = pfad.map((p, k) => new Vector3(p.x + quer[k].x * SCHIENE * seite, 0.17, p.z + quer[k].z * SCHIENE * seite));
      const m = CreateTube('schiene' + i + '_' + seite, { path: weg, radius: 0.045, tessellation: 5 }, this.scene);
      m.material = this.schieneMat;
      m.isPickable = false;
      return m;
    });
    const schwellen: number[] = [];
    const m = new Matrix();
    let rest = SCHWELLEN_ABSTAND / 2;
    for (let k = 1; k < pfad.length; k++) {
      const a = pfad[k - 1], b = pfad[k], seg = Vector3.Distance(a, b);
      const dreh = Math.atan2(b.x - a.x, b.z - a.z);
      while (rest <= seg) {
        const f = rest / seg;
        Matrix.RotationY(dreh).multiplyToRef(Matrix.Translation(a.x + (b.x - a.x) * f, 0.12, a.z + (b.z - a.z) * f), m);
        for (let q = 0; q < 16; q++) schwellen.push(m.m[q]);
        rest += SCHWELLEN_ABSTAND;
      }
      rest -= seg;
    }
    return { schotter, schienen, schotterMat, schwellen };
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
        w.position.set(wx(p.x), 0.19, wz(p.y));
        w.rotation.y = Math.atan2(dx, dz) + ((w as any).umgedreht ? Math.PI : 0);
      });
    }
    for (const [id, z] of this.zuege) {
      if (!gesehen.has(id)) { z.wagen.forEach((w) => w.dispose()); this.zuege.delete(id); }
    }
  }
}

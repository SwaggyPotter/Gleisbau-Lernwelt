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
import { CreateRibbon } from '@babylonjs/core/Meshes/Builders/ribbonBuilder';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { CreateTube } from '@babylonjs/core/Meshes/Builders/tubeBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { TycoonDeko } from './tycoon-deko';
import { EUROPA, KARTE_H, KARTE_W, SC, wx, wz, zeichneKarte } from './tycoon-karte';
import { Gebiet, zeichneGebiete } from './tycoon-gebiete';
import { hoehe3D, hoeheWelt, reliefBild } from './tycoon-hoehen';
import { HOEHEN } from './tycoon-hoehen-meta';
import { ZUEGE, ZUG_FARBEN } from './tycoon-zuege';

/** Was die 2D-Spiel-Engine der 3D-Ansicht pro Bild zur Verfuegung stellt (nur lesen). */
export interface TycoonWeltDaten {
  S: any;
  sel: { city: number | null; line: number | null };
  CITIES: { n: string; x: number; y: number }[];
  DIFF: { col: string }[];
  posAt: (L: any, s: number) => { x: number; y: number; ang: number };
  /** Lackierung der eigenen Zuege (Hex) oder null fuer die Werkslackierung. */
  skin: string | null;
  /** Gemeinsame Welt vom Server (Gebietsbesitz, Aktivitaet je Stadt) oder null. */
  welt: any;
  /** Strecke, die gerade gezeichnet wird (siehe tycoon-engine.ts) oder null. */
  zeichnung: { von: number; pts: { x: number; y: number }[]; ziel: number | null; fehl: { x: number; y: number } | null; ver: number } | null;
  /** Fuellfarbe eines Gebiets (Besitz) oder null. */
  gebietFarbe: (g: Gebiet) => { farbe: string; deckung: number } | null;
  /** Aendert sich, wenn sich Gebietsbesitz aendert. */
  gebietSchluessel: string;
}

const MODELL_PFAD = 'assets/modelle/kenney/';
/** Fremdzuege (zahlen Trassenentgelt): Gueterzug mit Diesellok. */
const FREMD_MODELL: { lok: string; wagen: string[]; ende?: string } = { lok: 'train-diesel-b', wagen: ['train-carriage-box', 'train-carriage-tank'] };
/** Abstand der Oberleitungsmasten (3D-Einheiten). */
const MAST_ABSTAND = 3;
/** Modelle je Zug-Typ stehen in tycoon-zuege.ts (ZUEGE[typ].modell). */
export const lokDatei = (typ: number): string => MODELL_PFAD + (ZUEGE[typ] ?? ZUEGE[1]).modell.lok + '.glb';
/** Alle Fahrzeug-Dateien eines Zug-Typs in Reihenfolge (wie auf der Karte); umgedreht = letztes ist ein Endkopf. */
export const zugDateien = (typ: number, extraWagen = false): { dateien: string[]; umgedreht: boolean } => {
  const z = ZUEGE[typ] ?? ZUEGE[1], m = z.modell, dateien: string[] = [], n = z.len + (extraWagen ? 1 : 0);
  for (let i = 0; i < n; i++) {
    dateien.push(MODELL_PFAD + (i === 0 ? m.lok : i === n - 1 && m.ende ? m.ende : m.wagen[(i - 1) % m.wagen.length]) + '.glb');
  }
  return { dateien, umgedreht: !!m.ende };
};

const WAGEN_LAENGE = 2.0;
const WAGEN_ABSTAND = 2.15;
/** Abstand der Schienen von der Gleismitte und Schwellenabstand (3D-Einheiten). */
const SCHIENE = 0.27;
const SCHWELLEN_ABSTAND = 0.42;

/** Ein gebautes Gleis in 3D. Bei Ausbau (cls) wird es neu erzeugt. */
interface Gleis {
  cls: number;
  ol: boolean;
  schotter: Mesh;
  schienen: Mesh[];
  draht: Mesh | null;
  schotterMat: StandardMaterial;
  holz: number[];
  beton: number[];
  masten: number[];
}

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
  private strecken: Gleis[] = [];
  private readonly schwellen: Mesh;
  private readonly betonSchwellen: Mesh;
  private readonly masten: Mesh;
  private readonly drahtMat: StandardMaterial;
  private readonly schieneMat: StandardMaterial;
  private readonly schieneAnMat: StandardMaterial;
  private frei = false;
  private ausgerichtetSichtbar = '';
  private streckenS: any = null;
  private ausgerichtetAuf: any = null;
  private stoerungen: Mesh[] = [];
  private readonly auswahlRing: Mesh;
  private readonly deko: TycoonDeko;
  /** Aktivitaets-Lichter; neu gebaut, wenn sich die Aktivitaet aendert. */
  private bezirkSchluessel = '';
  private bezirkTeile: TransformNode[] = [];
  /** Bodentextur des Spielgebiets: Karte ohne Gebiete (Kopie) + Gebietsflaechen, neu gezeichnet bei anderem Besitz/Auswahl. */
  private boden: { tex: DynamicTexture; basis: HTMLCanvasElement; b: { x0: number; y0: number; x1: number; y1: number } } | null = null;
  private bodenSchluessel = '';
  /** Vorschau der gerade gezeichneten Strecke. */
  private zeichenTeile: Mesh[] = [];
  private zeichenStand = '';
  private zeichnetZuletzt = false;
  private lichter: { knoten: TransformNode; aktiv: boolean }[] = [];
  private readonly farbMats = new Map<string, StandardMaterial>();
  private tot = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly daten: () => TycoonWeltDaten,
    private readonly onKlick: (x: number, y: number) => void,
    private readonly onZeiger: (x: number, y: number) => void = () => undefined,
  ) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false, antialias: true }, true);
    this.engine.disableUniformBuffers = true;
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.56, 0.70, 0.80, 1);

    this.kamera = new ArcRotateCamera('kamera', -Math.PI / 2, 0.85, 78, new Vector3(4, 0, -2), this.scene);
    this.kamera.lowerRadiusLimit = 8;
    this.kamera.upperRadiusLimit = 420;
    this.kamera.upperBetaLimit = 1.35;
    this.kamera.wheelPrecision = 14;
    this.kamera.panningSensibility = 60;

    const himmel = new HemisphericLight('himmel', new Vector3(0, 1, 0.3), this.scene);
    himmel.intensity = 0.7;
    himmel.groundColor = new Color3(0.5, 0.5, 0.55);
    const sonne = new DirectionalLight('sonne', new Vector3(-0.4, -1, 0.5), this.scene);
    sonne.intensity = 0.55;

    // Gelaende mit Hoehenrelief: fein fuer das Spielgebiet (+60 Rand), grob fuer ganz Europa (im Spielgebiet abgesenkt).
    const RAND = 60, sx0 = -RAND, sy0 = -RAND, sx1 = KARTE_W + RAND, sy1 = KARTE_H + RAND;
    this.boden = this.gelaende('gelaende', { x0: sx0, y0: sy0, x1: sx1, y1: sy1 }, 5, null, 2048, 1.0, 0);
    this.gelaende('europa', EUROPA, 16, { x0: sx0 + 20, y0: sy0 + 20, x1: sx1 - 20, y1: sy1 - 20 }, 2048, 5, -0.04);

    this.schwellen = CreateBox('schwelle', { width: 0.9, height: 0.07, depth: 0.2 }, this.scene);
    this.schwellen.material = this.farbe('schwelleMat', '#6b5240');
    this.schwellen.isPickable = false;
    this.schwellen.alwaysSelectAsActiveMesh = true;
    this.schwellen.setEnabled(false);
    // Ab Ausbaustrecke: Betonschwellen
    this.betonSchwellen = CreateBox('betonschwelle', { width: 0.9, height: 0.08, depth: 0.2 }, this.scene);
    this.betonSchwellen.material = this.farbe('betonMat', '#b4b2ab');
    this.betonSchwellen.isPickable = false;
    this.betonSchwellen.alwaysSelectAsActiveMesh = true;
    this.betonSchwellen.setEnabled(false);
    // Oberleitungsmast: Mast neben dem Gleis + Ausleger zur Gleismitte (lokal +x), als ein Mesh
    const stange = CreateBox('mastStange', { width: 0.08, height: 1.65, depth: 0.08 }, this.scene);
    stange.position.y = 0.82;
    const arm = CreateBox('mastArm', { width: 0.85, height: 0.05, depth: 0.05 }, this.scene);
    arm.position.set(0.42, 1.55, 0);
    this.masten = Mesh.MergeMeshes([stange, arm], true)!;
    this.masten.material = this.farbe('mastMat', '#5f6670');
    this.masten.isPickable = false;
    this.masten.alwaysSelectAsActiveMesh = true;
    this.masten.setEnabled(false);
    this.drahtMat = this.farbe('drahtMat', '#2b2f33');
    this.schieneMat = this.farbe('schieneMat', '#a7adb4');
    this.schieneMat.specularColor = new Color3(0.5, 0.5, 0.5);
    this.schieneAnMat = this.farbe('schieneAnMat', '#ffb347', true);

    const { CITIES } = daten();
    CITIES.forEach((c, i) => {
      const sockel = CreateCylinder('stadt' + i, { diameter: 1.8, height: 0.25, tessellation: 24 }, this.scene);
      sockel.position.set(wx(c.x), hoeheWelt(c.x, c.y) + 0.12, wz(c.y));
      sockel.material = this.farbe('stadtMat' + i, '#d9d4c7');
      sockel.isPickable = false;
      const schild = CreatePlane('schild' + i, { width: 10, height: 2.5 }, this.scene);
      schild.position.set(wx(c.x), hoeheWelt(c.x, c.y) + 5, wz(c.y));
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
    /** Zeiger als 2D-Weltpunkt an die Engine (Strecke zeichnen). */
    const melde = (e: PointerEvent) => { const p = this.bodenUnter(e.clientX, e.clientY); if (p) this.onZeiger(p.x / SC + KARTE_W / 2, -p.z / SC + KARTE_H / 2); };
    this.scene.onPointerObservable.add((pi) => {
      const e = pi.event as PointerEvent;
      // Beim Zeichnen: Maus zeichnet ohne Taste (mit Taste wird verschoben), Finger/Stift zeichnet beim Ziehen.
      const zeichnet = !!this.daten().zeichnung, finger = e.pointerType !== 'mouse';
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
        runter = zeiger.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
        griff = zeiger.size === 1 && !(zeichnet && finger) ? this.bodenUnter(e.clientX, e.clientY) : null;
        if (zeiger.size === 2) { const [a, b] = [...zeiger.values()]; fingerAbstand = Math.hypot(a.x - b.x, a.y - b.y); griff = this.bodenUnter((a.x + b.x) / 2, (a.y + b.y) / 2); }
        return;
      }
      if (pi.type === PointerEventTypes.POINTERMOVE) {
        if (zeichnet && (finger ? zeiger.size === 1 && zeiger.has(e.pointerId) : !zeiger.size)) {
          if (finger) zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
          melde(e);
          return;
        }
        if (!zeiger.has(e.pointerId)) return;
        zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.frei && !zeichnet) return;
        if (zeiger.size === 2) {
          // Zwei Finger: zoomen und (um die Mitte) verschieben.
          const [a, b] = [...zeiger.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (fingerAbstand > 0 && d > 0) this.zoome(fingerAbstand / d);
          fingerAbstand = d;
          const jetzt = griff ? this.bodenUnter((a.x + b.x) / 2, (a.y + b.y) / 2) : null;
          if (griff && jetzt) this.verschiebe(griff.x - jetzt.x, griff.z - jetzt.z);
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
      // Von zwei auf einen Finger: dort weiter verschieben (nicht beim Zeichnen).
      const rest = [...zeiger.values()][0];
      griff = zeiger.size === 1 && !zeichnet ? this.bodenUnter(rest.x, rest.y) : null;
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
    // Erst mit y = 0 schneiden, dann dreimal auf die Gelaendehoehe an der Trefferstelle nachfuehren.
    let t = -ray.origin.y / ray.direction.y;
    for (let n = 0; n < 3 && t > 0; n++) {
      const p = ray.origin.add(ray.direction.scale(t));
      t = (hoehe3D(p.x, p.z) - ray.origin.y) / ray.direction.y;
    }
    return t > 0 ? ray.origin.add(ray.direction.scale(t)) : null;
  }

  /** Kameraziel auf dem Boden verschieben, innerhalb der Karte. */
  private verschiebe(dx: number, dz: number): void {
    const z = this.kamera.target;
    const nx = Math.min(wx(EUROPA.x1), Math.max(wx(EUROPA.x0), z.x + dx));
    const nz = Math.min(wz(EUROPA.y0), Math.max(wz(EUROPA.y1), z.z + dz));
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

  /**
   * Gelaendenetz mit Hoehen aus dem Relief und der Karte (Meer, Laender, Relief, Grenzen) als Textur.
   * loch: Bereich, der abgesenkt wird (dort liegt das feinere Netz). Liefert Textur und eine Kopie des Kartenbilds
   * (Grundlage, auf die spaeter die Gebiete gezeichnet werden).
   */
  private gelaende(name: string, b: { x0: number; y0: number; x1: number; y1: number }, schritt: number,
    loch: { x0: number; y0: number; x1: number; y1: number } | null, texBreite: number, linie: number, versatz: number):
    { tex: DynamicTexture; basis: HTMLCanvasElement; b: { x0: number; y0: number; x1: number; y1: number } } {
    const nx = Math.ceil((b.x1 - b.x0) / schritt), nz = Math.ceil((b.y1 - b.y0) / schritt);
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let j = 0; j <= nz; j++) {
      for (let i = 0; i <= nx; i++) {
        const X = Math.min(b.x1, b.x0 + i * schritt), Y = Math.min(b.y1, b.y0 + j * schritt);
        let h = hoeheWelt(X, Y) + versatz;
        if (loch && X > loch.x0 && X < loch.x1 && Y > loch.y0 && Y < loch.y1) h -= 4;
        pos.push(wx(X), h, wz(Y));
        uv.push(i / nx, 1 - j / nz);
      }
    }
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i, c = a + nx + 1;
        idx.push(a, c, a + 1, a + 1, c, c + 1);
      }
    }
    const vd = new VertexData();
    vd.positions = pos; vd.indices = idx; vd.uvs = uv;
    const nor: number[] = [];
    VertexData.ComputeNormals(pos, idx, nor);
    vd.normals = nor;
    const mesh = new Mesh(name, this.scene);
    vd.applyToMesh(mesh);
    mesh.isPickable = false;
    const th = Math.round((texBreite * (b.y1 - b.y0)) / (b.x1 - b.x0));
    const tex = new DynamicTexture(name + 'Tex', { width: texBreite, height: th }, this.scene, true);
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
    ctx.save();
    ctx.scale(texBreite / (b.x1 - b.x0), th / (b.y1 - b.y0));
    ctx.translate(-b.x0, -b.y0);
    const rel = reliefBild();
    zeichneKarte(ctx, { meer: '#8fb3cc', ausland: '#a3b48a', land: '#86a866', grenze: '#4d5a3c', schrift: 'rgba(30,40,25,.45)' }, linie,
      rel ? { bild: rel, x0: HOEHEN.x0, y0: HOEHEN.y0, w: HOEHEN.breite * HOEHEN.zelle, h: HOEHEN.hoehe * HOEHEN.zelle } : null, b);
    ctx.restore();
    tex.update();
    const basis = document.createElement('canvas');
    basis.width = texBreite; basis.height = th;
    basis.getContext('2d')!.drawImage(ctx.canvas as unknown as CanvasImageSource, 0, 0);
    const mat = new StandardMaterial(name + 'Mat', this.scene);
    mat.diffuseTexture = tex;
    mat.specularColor = Color3.Black();
    mat.backFaceCulling = false;
    mesh.material = mat;
    return { tex, basis, b };
  }

  /** Gebiete (Besitz, Grenzen, Auswahl) auf die Bodentextur zeichnen, wenn sich etwas geaendert hat. */
  private syncBoden(d: TycoonWeltDaten): void {
    const wahl = (d.sel as any).gebiet ?? null, key = d.gebietSchluessel + '|' + wahl;
    if (!this.boden || key === this.bodenSchluessel) return;
    this.bodenSchluessel = key;
    const { tex, basis, b } = this.boden, ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
    ctx.drawImage(basis, 0, 0);
    ctx.save();
    ctx.scale(basis.width / (b.x1 - b.x0), basis.height / (b.y1 - b.y0));
    ctx.translate(-b.x0, -b.y0);
    zeichneGebiete(ctx, { farbe: d.gebietFarbe, linie: 1.6, wahl, namen: true, strich: '28,34,22' });
    ctx.restore();
    tex.update();
  }

  /** Vorschau der gerade gezeichneten Strecke: Schlauch ueber dem Gelaende, rot bis zur nicht erlaubten Stelle. */
  private syncZeichnung(d: TycoonWeltDaten): void {
    const z = d.zeichnung;
    // Freie Kamera: waehrend des Zeichnens nicht drehen (sonst zieht der Finger die Kamera statt der Strecke).
    if (!!z !== this.zeichnetZuletzt) {
      this.zeichnetZuletzt = !!z;
      if (this.frei) { if (z) this.kamera.detachControl(); else this.kamera.attachControl(this.canvas, true); }
    }
    const stand = z ? z.ver + ':' + z.pts.length + ':' + z.ziel + ':' + (z.fehl ? z.fehl.x.toFixed(1) + ',' + z.fehl.y.toFixed(1) : '') : '';
    if (stand === this.zeichenStand) return;
    this.zeichenStand = stand;
    this.zeichenTeile.forEach((m) => m.dispose());
    this.zeichenTeile = [];
    if (!z) return;
    const auf = (p: { x: number; y: number }) => new Vector3(wx(p.x), hoeheWelt(p.x, p.y) + 0.35, wz(p.y));
    const pts = z.ziel !== null ? [...z.pts, d.CITIES[z.ziel]] : z.pts;
    if (pts.length > 1) {
      const m = CreateTube('zeichnung', { path: pts.map(auf), radius: 0.32, tessellation: 6 }, this.scene);
      m.material = this.farbMat(z.ziel !== null ? '#2e8b57' : '#23262b', 1, 0.5);
      m.isPickable = false;
      this.zeichenTeile.push(m);
    }
    if (z.fehl) {
      const m = CreateTube('zeichnungFehl', { path: [auf(z.pts[z.pts.length - 1]), auf(z.fehl)], radius: 0.22, tessellation: 6 }, this.scene);
      m.material = this.farbMat('#c0392b', 0.8, 0.6);
      m.isPickable = false;
      this.zeichenTeile.push(m);
    }
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

  private baueWagen(id: string, farbe: string | null = null): TransformNode | null {
    const v = this.vorlage(id);
    if (!v) return null;
    const wagen = new TransformNode('wagen-' + id, this.scene);
    const halter = new TransformNode('halter', this.scene);
    halter.parent = wagen;
    halter.position.copyFrom(v.versatz);
    halter.rotation.y = v.drehY;
    halter.scaling.setAll(v.skala);
    // Mit Lackierung: eigene Materialkopien (Textur bleibt geteilt), Farbe wird mit der Textur multipliziert.
    const inst = v.container.instantiateModelsToScene((n) => n, !!farbe, { doNotInstantiate: true });
    inst.rootNodes.forEach((r) => (r.parent = halter));
    const ton = farbe ? Color3.White().scale(0.3).add(Color3.FromHexString(farbe).scale(0.7)) : null;
    wagen.getChildMeshes().forEach((m) => {
      m.isPickable = false;
      const mat = m.material as any;
      if (ton && mat) { if ('albedoColor' in mat) mat.albedoColor = ton; else if ('diffuseColor' in mat) mat.diffuseColor = ton; }
    });
    (wagen as any).eigeneMaterialien = !!farbe;
    return wagen;
  }

  /** Wagen entfernen; kopierte Materialien mit, die geteilte Textur aber nicht. */
  private entsorge(w: TransformNode): void {
    const mats = (w as any).eigeneMaterialien ? w.getChildMeshes().map((m) => m.material).filter((m) => !!m) : [];
    w.dispose();
    mats.forEach((m) => m!.dispose(false, false));
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
    this.syncBoden(d);
    this.syncZeichnung(d);
    this.syncBezirke(d);
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
    if (c) this.auswahlRing.position.set(wx(c.x), hoeheWelt(c.x, c.y) + 0.4, wz(c.y));
  }

  private syncStrecken(d: TycoonWeltDaten): void {
    const S = d.S;
    let neu = false;
    if (this.streckenS !== S) {
      this.strecken.forEach((g) => this.entferneGleis(g));
      this.strecken = [];
      this.streckenS = S;
      neu = true;
    }
    // Neue Strecken anlegen, ausgebaute (andere Klasse) neu erzeugen.
    S.lines.forEach((L: any, i: number) => {
      const g = this.strecken[i];
      if (g && g.cls === (L.cls ?? 0) && g.ol === !!L.ol) return;
      if (g) this.entferneGleis(g);
      this.strecken[i] = this.baueGleis(L, i);
      neu = true;
    });
    if (neu) {
      // Schwellen und Masten aller Strecken als Thin Instances je eines Meshes.
      const setze = (mesh: Mesh, werte: number[]) => {
        if (werte.length) mesh.thinInstanceSetBuffer('matrix', new Float32Array(werte), 16, true);
        mesh.setEnabled(werte.length > 0);
      };
      setze(this.schwellen, this.strecken.flatMap((g) => g.holz));
      setze(this.betonSchwellen, this.strecken.flatMap((g) => g.beton));
      setze(this.masten, this.strecken.flatMap((g) => g.masten));
    }
    this.strecken.forEach((g, i) => {
      const L = S.lines[i];
      const mat = d.sel.line === i ? this.schieneAnMat : this.schieneMat;
      g.schienen.forEach((m) => { if (m.material !== mat) m.material = mat; });
      g.schotterMat.diffuseColor = Color3.FromHexString(L.cond < 25 ? '#b5574b' : L.cond < 50 ? '#b08a50' : '#8d8478');
    });
  }

  private entferneGleis(g: Gleis): void {
    g.schotter.dispose();
    g.schienen.forEach((m) => m.dispose());
    g.draht?.dispose();
    g.schotterMat.dispose();
  }

  /**
   * Gleis entlang der Streckenkurve: Schotterbett, Schwellen (Holz bzw. ab Ausbaustrecke Beton, als Matrizen),
   * zwei Schienen und bei elektrifizierten Strecken Oberleitungsmasten mit Fahrdraht.
   */
  private baueGleis(L: any, i: number): Gleis {
    const cls = L.cls ?? 0;
    const pfad: Vector3[] = L.pts.map((p: any) => new Vector3(wx(p.x), hoeheWelt(p.x, p.y) + 0.05, wz(p.y)));
    // Quervektor (rechtwinklig zur Fahrtrichtung) je Punkt
    const quer = pfad.map((_p, k) => {
      const a = pfad[Math.max(0, k - 1)], b = pfad[Math.min(pfad.length - 1, k + 1)];
      const t = b.subtract(a);
      t.y = 0;
      t.normalize();
      return new Vector3(-t.z, 0, t.x);
    });
    // Schotterbett: Band mit Boeschung, folgt dem Gelaende.
    const profil = [[-0.85, -0.06], [-0.55, 0.06], [0.55, 0.06], [0.85, -0.06]];
    const bahnen = profil.map(([q, y]) => pfad.map((p, k) => new Vector3(p.x + quer[k].x * q, p.y + y, p.z + quer[k].z * q)));
    const schotter = CreateRibbon('schotter' + i, { pathArray: bahnen, sideOrientation: Mesh.DOUBLESIDE }, this.scene);
    const schotterMat = this.farbe('schotterMat' + i, '#8d8478');
    schotter.material = schotterMat;
    schotter.isPickable = false;
    const schienen = [-1, 1].map((seite) => {
      const weg = pfad.map((p, k) => new Vector3(p.x + quer[k].x * SCHIENE * seite, p.y + 0.12, p.z + quer[k].z * SCHIENE * seite));
      const m = CreateTube('schiene' + i + '_' + seite, { path: weg, radius: 0.045, tessellation: 5 }, this.scene);
      m.material = this.schieneMat;
      m.isPickable = false;
      return m;
    });
    /** Gleichmaessig entlang des Pfads verteilte Matrizen (Drehung in Fahrtrichtung, Versatz quer; hoehe relativ zum Gleis). */
    const verteile = (abstand: number, hoehe: number, querVersatz: number): number[] => {
      const out: number[] = [];
      const m = new Matrix();
      let rest = abstand / 2;
      for (let k = 1; k < pfad.length; k++) {
        const a = pfad[k - 1], b = pfad[k], seg = Vector3.Distance(a, b);
        const dreh = Math.atan2(b.x - a.x, b.z - a.z);
        while (rest <= seg) {
          const f = rest / seg, q = quer[k];
          Matrix.RotationY(dreh).multiplyToRef(Matrix.Translation(a.x + (b.x - a.x) * f + q.x * querVersatz, a.y + (b.y - a.y) * f + hoehe, a.z + (b.z - a.z) * f + q.z * querVersatz), m);
          for (let n = 0; n < 16; n++) out.push(m.m[n]);
          rest += abstand;
        }
        rest -= seg;
      }
      return out;
    };
    const schwellen = verteile(SCHWELLEN_ABSTAND, 0.07, 0);
    let draht: Mesh | null = null, masten: number[] = [];
    if (L.ol) {
      masten = verteile(MAST_ABSTAND, -0.05, 0.85);
      draht = CreateTube('draht' + i, { path: pfad.map((p) => new Vector3(p.x, p.y + 1.5, p.z)), radius: 0.02, tessellation: 4 }, this.scene);
      draht.material = this.drahtMat;
      draht.isPickable = false;
    }
    return { cls, ol: !!L.ol, schotter, schienen, draht, schotterMat, holz: cls >= 2 ? [] : schwellen, beton: cls >= 2 ? schwellen : [], masten };
  }

  private farbMat(hex: string, alpha: number, leuchten = 0.25): StandardMaterial {
    const key = hex + alpha + leuchten;
    let m = this.farbMats.get(key);
    if (!m) {
      m = new StandardMaterial('farbe' + key, this.scene);
      m.diffuseColor = Color3.FromHexString(hex);
      m.emissiveColor = Color3.FromHexString(hex).scale(leuchten);
      m.specularColor = Color3.Black();
      m.alpha = alpha;
      m.backFaceCulling = false;
      this.farbMats.set(key, m);
    }
    return m;
  }

  /** Selbstleuchtend (unabhaengig vom Licht der Szene) fuer die Aktivitaets-Lichter. */
  private leuchtMat(hex: string): StandardMaterial {
    const key = 'leucht' + hex;
    let m = this.farbMats.get(key);
    if (!m) {
      m = new StandardMaterial(key, this.scene);
      m.emissiveColor = Color3.FromHexString(hex);
      m.disableLighting = true;
      this.farbMats.set(key, m);
    }
    return m;
  }

  /** Lichter fuer die Aktivitaet anderer Spieler ueber den Staedten. */
  private syncBezirke(d: TycoonWeltDaten): void {
    const w = d.welt, S = d.S;
    const key = w ? JSON.stringify([S.vis, w.staedte]) : '';
    if (key !== this.bezirkSchluessel) {
      this.bezirkSchluessel = key;
      this.bezirkTeile.forEach((t) => t.dispose());
      this.bezirkTeile = [];
      this.lichter = [];
      if (w) {
        (w.staedte || []).forEach((st: any) => {
          const c = d.CITIES[st.stadt];
          if (!c || !S.vis[st.stadt] || !st.spieler) return;
          const knoten = new TransformNode('lichter', this.scene);
          knoten.position.set(wx(c.x), hoeheWelt(c.x, c.y) + 2.4, wz(c.y));
          (knoten as any).basisY = knoten.position.y;
          const n = Math.min(6, st.spieler), aktiv = st.aktiv > 0;
          for (let k = 0; k < n; k++) {
            const kugel = CreateSphere('licht', { diameter: k < st.aktiv ? 1.25 : 0.9, segments: 12 }, this.scene);
            kugel.parent = knoten;
            kugel.isPickable = false;
            const a = (k / n) * Math.PI * 2;
            kugel.position.set(Math.cos(a) * 2.7, 0, Math.sin(a) * 2.7);
            kugel.material = this.leuchtMat(k < st.aktiv ? '#ffc400' : '#8fa3b8');
          }
          this.bezirkTeile.push(knoten);
          this.lichter.push({ knoten, aktiv });
        });
      }
    }
    // Lichter kreisen; wo gerade jemand aktiv ist, schneller und pulsierend.
    const t = performance.now() / 1000;
    this.lichter.forEach((l) => {
      l.knoten.rotation.y = t * (l.aktiv ? 0.9 : 0.25);
      l.knoten.position.y = (l.knoten as any).basisY + (l.aktiv ? Math.sin(t * 3) * 0.25 : 0);
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
      k.position.set(wx(p.x), hoeheWelt(p.x, p.y) + 1.6, wz(p.y));
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
      const typ = ZUEGE[t.type ?? 1] ?? ZUEGE[1];
      const modell = t.own ? typ.modell : FREMD_MODELL;
      const anzahl = t.own ? typ.len + ((t.upg || []).includes('zusatzwagen') ? 1 : 0) : 3;
      const farbe = t.own ? (ZUG_FARBEN.find((f) => f.id === t.farbe)?.farbe ?? d.skin) : null;
      const schluessel = (t.own ? 'o' : 'f') + (t.type ?? 1) + (farbe ?? '') + anzahl;
      let z = this.zuege.get(t.id);
      if (z && z.schluessel !== schluessel) { z.wagen.forEach((w) => this.entsorge(w)); z = undefined; this.zuege.delete(t.id); }
      if (!z) {
        const wagen: TransformNode[] = [];
        for (let i = 0; i < anzahl; i++) {
          // Triebzuege: letzter Wagen ist wieder ein Triebkopf, umgedreht.
          const ende = i === anzahl - 1 && i > 0 && modell.ende;
          const w = this.baueWagen(i === 0 ? modell.lok : ende ? modell.ende! : modell.wagen[(i - 1) % modell.wagen.length], farbe);
          if (!w) break;
          if (ende) (w as any).umgedreht = true;
          wagen.push(w);
        }
        if (wagen.length < anzahl) { wagen.forEach((w) => this.entsorge(w)); continue; }
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
        w.position.set(wx(p.x), hoeheWelt(p.x, p.y) + 0.19, wz(p.y));
        w.rotation.y = Math.atan2(dx, dz) + ((w as any).umgedreht ? Math.PI : 0);
      });
    }
    for (const [id, z] of this.zuege) {
      if (!gesehen.has(id)) { z.wagen.forEach((w) => this.entsorge(w)); this.zuege.delete(id); }
    }
  }
}

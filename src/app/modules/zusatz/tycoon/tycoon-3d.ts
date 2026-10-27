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
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import '@babylonjs/core/Particles/particleSystemComponent';
import { TycoonDeko } from './tycoon-deko';
import { EUROPA, KARTE_H, KARTE_W, SC, wx, wz, zeichneKarte } from './tycoon-karte';
import { beschrifteGebiete, Gebiet, zeichneGebiete } from './tycoon-gebiete';
import { hoehe3D, hoeheWelt, reliefBild } from './tycoon-hoehen';
import { HOEHEN } from './tycoon-hoehen-meta';
import { ZUEGE, ZUG_FARBEN } from './tycoon-zuege';

/** Was die 2D-Spiel-Engine der 3D-Ansicht pro Bild zur Verfuegung stellt (nur lesen). */
export interface TycoonWeltDaten {
  S: any;
  sel: { city: number | null; line: number | null; bf?: number | null };
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
  /** Streckenende (Stadt-Index oder ab BF0 eigener Bahnhof) als Name und 2D-Position. */
  knoten: (i: number) => { n: string; x: number; y: number };
  bfName: (b: any) => string;
  BF0: number;
  /** Bundesland-Fokus: Ausschnitt in 2D-Weltkoordinaten oder null (Weltkarte); ver aendert sich bei jedem Wechsel. */
  fokus: { box: { x0: number; y0: number; x1: number; y1: number } | null; ver: number };
  /** Jahreszeit (0 Fruehling .. 3 Winter) und aktuelle Wetterlage (Art, Ausschnitt in 2D-Weltkoordinaten), siehe tycoon-wetter.ts. */
  jahreszeit?: number;
  wetter?: { id: string; box: { x0: number; y0: number; x1: number; y1: number } } | null;
}

const MODELL_PFAD = 'assets/modelle/kenney/';
/** Fremdzuege (zahlen Trassenentgelt): Gueterzug mit Diesellok. */
const FREMD_MODELL: { lok: string; wagen: string[]; ende?: string } = { lok: 'train-diesel-b', wagen: ['train-carriage-box', 'train-carriage-tank'] };
/** Abstand der Oberleitungsmasten (3D-Einheiten). */
const MAST_ABSTAND = 4;
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

/** Gleise, Zuege und Masten: halb so gross wie bis 2026-10-26 (die Karte ist dafuer doppelt so gross, siehe SC). */
const G = 0.5;
/** Hoechster Kameraabstand beim Ausrichten auf das eigene Netz (ca. 300 km Bildbreite), damit nichts winzig wirkt. */
const START_RADIUS = 75;
const WAGEN_LAENGE = 2.0 * G;
const WAGEN_ABSTAND = 2.15 * G;
/** Abstand der Schienen von der Gleismitte und Schwellenabstand (3D-Einheiten). */
const SCHIENE = 0.27 * G;
/** Zweigleisig: Gleisachsen so weit neben der Streckenmitte. */
const GLEIS_VERSATZ = 0.6 * G;
const SCHWELLEN_ABSTAND = 0.3;

/** Ein gebautes Gleis in 3D. Bei Ausbau (cls) wird es neu erzeugt. */
interface Gleis {
  cls: number;
  ol: boolean;
  gleise: number;
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
  /** Feinere Bodentextur nur fuer das herangezoomte Bundesland (z. B. Berlin mit seinen Bezirken), sonst null. */
  private detail: { tex: DynamicTexture; basis: HTMLCanvasElement; b: { x0: number; y0: number; x1: number; y1: number }; mesh: Mesh } | null = null;
  /** Vorschau der gerade gezeichneten Strecke. */
  private zeichenTeile: Mesh[] = [];
  private zeichenStand = '';
  private zeichnetZuletzt = false;
  private lichter: { knoten: TransformNode; aktiv: boolean }[] = [];
  private fokusVer = 0;
  /** Bahnhoefe des Spielers: Bahnsteig + Namensschild (das Gebaeude stellt TycoonDeko auf). */
  private bahnhoefe: Mesh[] = [];
  private bahnhofSchluessel = '';
  private readonly farbMats = new Map<string, StandardMaterial>();
  private readonly himmel: HemisphericLight;
  private wetterPS: ParticleSystem | null = null;
  private wetterId = '';
  private jzZuletzt = -1;
  private tot = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly daten: () => TycoonWeltDaten,
    private readonly onKlick: (x: number, y: number, kk: number) => void,
    private readonly onZeiger: (x: number, y: number, kk: number) => void = () => undefined,
    private readonly onLos: () => void = () => undefined,
  ) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false, antialias: true }, true);
    this.engine.disableUniformBuffers = true;
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.56, 0.70, 0.80, 1);

    this.kamera = new ArcRotateCamera('kamera', -Math.PI / 2, 0.85, 156, new Vector3(8, 0, -4), this.scene);
    this.kamera.lowerRadiusLimit = 3;
    this.kamera.upperRadiusLimit = 840;
    this.kamera.upperBetaLimit = 1.35;
    this.kamera.wheelPrecision = 14;
    this.kamera.panningSensibility = 60;

    const himmel = new HemisphericLight('himmel', new Vector3(0, 1, 0.3), this.scene);
    himmel.intensity = 0.7;
    himmel.groundColor = new Color3(0.5, 0.5, 0.55);
    this.himmel = himmel;
    const sonne = new DirectionalLight('sonne', new Vector3(-0.4, -1, 0.5), this.scene);
    sonne.intensity = 0.55;

    // Gelaende mit Hoehenrelief: fein fuer das Spielgebiet (+60 Rand), grob fuer ganz Europa (im Spielgebiet abgesenkt).
    const RAND = 60, sx0 = -RAND, sy0 = -RAND, sx1 = KARTE_W + RAND, sy1 = KARTE_H + RAND;
    this.boden = this.gelaende('gelaende', { x0: sx0, y0: sy0, x1: sx1, y1: sy1 }, 5, null, 2048, 1.0, 0);
    this.gelaende('europa', EUROPA, 16, { x0: sx0 + 20, y0: sy0 + 20, x1: sx1 - 20, y1: sy1 - 20 }, 2048, 5, -0.04);

    this.schwellen = CreateBox('schwelle', { width: 0.9 * G, height: 0.07 * G, depth: 0.2 * G }, this.scene);
    this.schwellen.material = this.farbe('schwelleMat', '#6b5240');
    this.schwellen.isPickable = false;
    this.schwellen.alwaysSelectAsActiveMesh = true;
    this.schwellen.setEnabled(false);
    // Ab Ausbaustrecke: Betonschwellen
    this.betonSchwellen = CreateBox('betonschwelle', { width: 0.9 * G, height: 0.08 * G, depth: 0.2 * G }, this.scene);
    this.betonSchwellen.material = this.farbe('betonMat', '#b4b2ab');
    this.betonSchwellen.isPickable = false;
    this.betonSchwellen.alwaysSelectAsActiveMesh = true;
    this.betonSchwellen.setEnabled(false);
    // Oberleitungsmast: Mast neben dem Gleis + Ausleger zur Gleismitte (lokal +x), als ein Mesh
    const stange = CreateBox('mastStange', { width: 0.08 * G, height: 1.65 * G, depth: 0.08 * G }, this.scene);
    stange.position.y = 0.82 * G;
    const arm = CreateBox('mastArm', { width: 0.85 * G, height: 0.05 * G, depth: 0.05 * G }, this.scene);
    arm.position.set(0.42 * G, 1.55 * G, 0);
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
      const schild = CreatePlane('schild' + i, { width: 18, height: 4.5 }, this.scene);
      schild.position.set(wx(c.x), hoeheWelt(c.x, c.y) + 7, wz(c.y));
      schild.billboardMode = Mesh.BILLBOARDMODE_ALL;
      schild.material = this.schildMaterial(c.n, i);
      schild.isPickable = false;
      this.staedte.push({ sockel, schild });
    });
    this.deko = new TycoonDeko(this.scene, CITIES);
    this.auswahlRing = CreateTorus('auswahl', { diameter: 2.2, thickness: 0.22, tessellation: 28 }, this.scene);
    this.auswahlRing.material = this.farbe('auswahlMat', '#e4572e', true);
    this.auswahlRing.isPickable = false;

    // Tippen (nicht Ziehen) = Klick in der 2D-Welt: Strahl mit der Bodenebene y = 0 schneiden.
    // Zeiger: Tippen = Klick ins Spiel. In der starren Ansicht zusaetzlich Ziehen = Karte verschieben,
    // zwei Finger = zoomen (Blickwinkel bleibt fest). In der freien Ansicht macht das die Babylon-Kamera.
    let runter: { x: number; y: number; t: number } | null = null;
    /** Beim Zeichnen verschiebt die rechte Maustaste die Karte (die linke zeichnet). */
    let rechts = false;
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    const zeiger = new Map<number, { x: number; y: number }>();
    let griff: Vector3 | null = null;
    let fingerAbstand = 0;
    /** Zeiger als 2D-Weltpunkt an die Engine (Strecke zeichnen). */
    const melde = (e: PointerEvent) => { const p = this.bodenUnter(e.clientX, e.clientY); if (p) this.onZeiger(p.x / SC + KARTE_W / 2, -p.z / SC + KARTE_H / 2, this.pixelJeEinheit(e.clientX, e.clientY, p)); };
    this.scene.onPointerObservable.add((pi) => {
      const e = pi.event as PointerEvent;
      // Beim Zeichnen: gedrueckt halten und ziehen (Maus links, Finger, Stift), Loslassen am Ziel baut die Strecke.
      const zeichnet = !!this.daten().zeichnung;
      if (pi.type === PointerEventTypes.POINTERDOWN) {
        zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
        rechts = e.pointerType === 'mouse' && e.button === 2;
        runter = zeiger.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
        griff = zeiger.size === 1 && !(zeichnet && !rechts) ? this.bodenUnter(e.clientX, e.clientY) : null;
        if (zeichnet && !rechts && zeiger.size === 1) melde(e);
        if (zeiger.size === 2) { const [a, b] = [...zeiger.values()]; fingerAbstand = Math.hypot(a.x - b.x, a.y - b.y); griff = this.bodenUnter((a.x + b.x) / 2, (a.y + b.y) / 2); }
        return;
      }
      if (pi.type === PointerEventTypes.POINTERMOVE) {
        if (zeichnet && !rechts && zeiger.size === 1 && zeiger.has(e.pointerId)) {
          zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY });
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
      const warZeichnen = zeichnet && !rechts && zeiger.size === 1 && zeiger.has(e.pointerId);
      zeiger.delete(e.pointerId);
      rechts = false;
      // Von zwei auf einen Finger: dort weiter verschieben (nicht beim Zeichnen).
      const rest = [...zeiger.values()][0];
      griff = zeiger.size === 1 && !zeichnet ? this.bodenUnter(rest.x, rest.y) : null;
      const kurz = !!runter && performance.now() - runter.t < 600 && Math.hypot(e.clientX - runter.x, e.clientY - runter.y) < 8;
      runter = null;
      if (kurz) {
        const p = this.bodenUnter(e.clientX, e.clientY);
        if (p) this.onKlick(p.x / SC + KARTE_W / 2, -p.z / SC + KARTE_H / 2, this.pixelJeEinheit(e.clientX, e.clientY, p));
      }
      if (warZeichnen) this.onLos();
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

  /**
   * Bildschirmpixel je Welteinheit an einem Bodenpunkt (waagerecht gemessen) -- damit Staedte, Gleise und Bahnhoefe
   * wie in 2D in einem festen Pixelradius getroffen werden, egal wie nah die Kamera ist.
   */
  private pixelJeEinheit(clientX: number, clientY: number, p: Vector3): number {
    const q = this.bodenUnter(clientX + 20, clientY);
    const d = q ? Vector3.Distance(p, q) / SC : 0;
    return d > 1e-6 ? 20 / d : 1;
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
    { tex: DynamicTexture; basis: HTMLCanvasElement; b: { x0: number; y0: number; x1: number; y1: number }; mesh: Mesh } {
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
    return { tex, basis, b, mesh };
  }

  /** Gebiete (Besitz, Grenzen, Auswahl) auf die Bodentextur zeichnen, wenn sich etwas geaendert hat. */
  private syncBoden(d: TycoonWeltDaten): void {
    const wahl = (d.sel as any).gebiet ?? null, key = d.gebietSchluessel + '|' + wahl;
    if (!this.boden || key === this.bodenSchluessel) return;
    this.bodenSchluessel = key;
    const zeichne = (t: { tex: DynamicTexture; basis: HTMLCanvasElement; b: { x0: number; y0: number; x1: number; y1: number } }, linie: number, fein: boolean) => {
      const { tex, basis, b } = t, ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
      ctx.drawImage(basis, 0, 0);
      ctx.save();
      ctx.scale(basis.width / (b.x1 - b.x0), basis.height / (b.y1 - b.y0));
      ctx.translate(-b.x0, -b.y0);
      zeichneGebiete(ctx, { farbe: d.gebietFarbe, linie, wahl, namen: !fein, strich: '28,34,22' });
      if (fein) beschrifteGebiete(ctx, 40);
      ctx.restore();
      tex.update();
    };
    zeichne(this.boden, 1.6, false);
    // Linien in der Detailtextur etwa so dick (in Texturpixeln) wie in der groben.
    if (this.detail) zeichne(this.detail, Math.max(this.detail.b.x1 - this.detail.b.x0, this.detail.b.y1 - this.detail.b.y0) / 500, true);
  }

  /** Detailboden fuer den Bundesland-Fokus neu anlegen (bzw. entfernen); kleine Laender bekommen ein feineres Netz. */
  private baueDetail(b: { x0: number; y0: number; x1: number; y1: number } | null): void {
    if (this.detail) {
      this.detail.mesh.material?.dispose(true, true);
      this.detail.mesh.dispose();
      this.detail = null;
    }
    const gr = b ? Math.max(b.x1 - b.x0, b.y1 - b.y0) : Infinity;
    if (!b || gr > 450) return;
    this.detail = this.gelaende('detail', b, Math.max(0.5, gr / 160), null, 2048, gr / 900, 0.02);
    // Liegt gleich hoch wie der grobe Boden: per Tiefenversatz gewinnt die Detailtextur.
    (this.detail.mesh.material as StandardMaterial).zOffset = -1;
    this.bodenSchluessel = '';
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
    const auf = (p: { x: number; y: number }) => new Vector3(wx(p.x), hoeheWelt(p.x, p.y) + 0.25, wz(p.y));
    const pts = z.ziel !== null ? [...z.pts, d.knoten(z.ziel)] : z.pts;
    if (pts.length > 1) {
      const m = CreateTube('zeichnung', { path: pts.map(auf), radius: 0.22, tessellation: 6 }, this.scene);
      m.material = this.farbMat(z.ziel !== null ? '#2e8b57' : '#23262b', 1, 0.5);
      m.isPickable = false;
      this.zeichenTeile.push(m);
    }
    if (z.fehl) {
      const m = CreateTube('zeichnungFehl', { path: [auf(z.pts[z.pts.length - 1]), auf(z.fehl)], radius: 0.15, tessellation: 6 }, this.scene);
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

  private schildMaterial(text: string, i: number | string): StandardMaterial {
    const tex = new DynamicTexture('schildTex' + i, { width: 512, height: 128 }, this.scene, true);
    tex.hasAlpha = true;
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, 512, 128);
    ctx.font = '700 60px system-ui, sans-serif';
    // Lange Namen (z. B. Bahnhoefe) mit kleinerer Schrift, damit nichts abgeschnitten wird.
    const breit = ctx.measureText(text).width;
    if (breit > 456) ctx.font = '700 ' + Math.floor(60 * 456 / breit) + 'px system-ui, sans-serif';
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

  /* ---------- Wetter und Jahreszeit ---------- */
  /** Jahreszeit als Lichtfarbe; Wetterlage als Partikel um den Kamerapunkt, solange er ueber dem betroffenen Bundesland liegt. */
  private syncWetter(d: TycoonWeltDaten): void {
    const jz = d.jahreszeit ?? 0;
    if (jz !== this.jzZuletzt) {
      this.jzZuletzt = jz;
      const l = [[1, 1, 1], [1, 0.97, 0.88], [1, 0.9, 0.78], [0.92, 0.96, 1]][jz];
      this.himmel.diffuse = new Color3(l[0], l[1], l[2]);
      this.himmel.groundColor = jz === 3 ? new Color3(0.82, 0.85, 0.9) : new Color3(0.5, 0.5, 0.55);
      this.himmel.intensity = jz === 3 ? 0.85 : 0.7;
    }
    const t = this.kamera.target, w = d.wetter;
    const drin = !!w && t.x >= wx(w.box.x0) && t.x <= wx(w.box.x1) && t.z <= wz(w.box.y0) && t.z >= wz(w.box.y1);
    const id = drin ? w!.id : '';
    if (id !== this.wetterId) {
      this.wetterId = id;
      this.wetterPS?.dispose();
      this.wetterPS = id && id !== 'hitze' ? this.wetterPartikel(id) : null;
      this.scene.clearColor = id === 'regen' || id === 'sturm' ? new Color4(0.45, 0.52, 0.58, 1) : id === 'schnee' ? new Color4(0.8, 0.83, 0.87, 1)
        : id === 'hitze' ? new Color4(0.78, 0.74, 0.62, 1) : new Color4(0.56, 0.70, 0.80, 1);
    }
    const ps = this.wetterPS;
    if (!ps) return;
    // Partikel in einer Kiste ueber dem Kamerapunkt; Groesse und Tempo wachsen mit dem Kameraabstand.
    const r = this.kamera.radius, regen = id === 'regen' || id === 'sturm';
    (ps.emitter as Vector3).set(t.x, t.y + r * 0.45, t.z);
    ps.minEmitBox.set(-r * 0.7, 0, -r * 0.7); ps.maxEmitBox.set(r * 0.7, r * 0.1, r * 0.7);
    ps.minSize = r * (regen ? 0.008 : 0.006); ps.maxSize = r * (regen ? 0.014 : 0.012);
    ps.minEmitPower = r * (regen ? 1.0 : 0.15); ps.maxEmitPower = r * (regen ? 1.3 : 0.25);
  }
  private wetterPartikel(id: string): ParticleSystem {
    const ps = new ParticleSystem('wetter', id === 'laub' ? 300 : 2500, this.scene);
    const tex = new DynamicTexture('wetterTex', { width: 32, height: 32 }, this.scene, false);
    const g = tex.getContext() as unknown as CanvasRenderingContext2D;
    g.clearRect(0, 0, 32, 32);
    if (id === 'regen' || id === 'sturm') { g.fillStyle = 'rgba(200,215,235,1)'; g.fillRect(14, 0, 4, 32); }
    else if (id === 'laub') { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(16, 16, 14, 7, 0.6, 0, 7); g.fill(); }
    else { const v = g.createRadialGradient(16, 16, 0, 16, 16, 16); v.addColorStop(0, 'rgba(255,255,255,1)'); v.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = v; g.fillRect(0, 0, 32, 32); }
    tex.hasAlpha = true; tex.update();
    ps.particleTexture = tex;
    ps.emitter = new Vector3(0, 0, 0);
    ps.minEmitBox = new Vector3(-1, 0, -1); ps.maxEmitBox = new Vector3(1, 0, 1);
    const schraeg = id === 'sturm' ? 0.6 : id === 'laub' ? 0.4 : 0.1;
    ps.direction1 = new Vector3(-schraeg * 0.3, -1, -0.1); ps.direction2 = new Vector3(schraeg, -1, 0.1);
    // Lebensdauer in Babylon-Zeit (ca. 0,6 je Sekunde bei 60 Bildern).
    ps.minLifeTime = id === 'regen' || id === 'sturm' ? 0.35 : 2; ps.maxLifeTime = id === 'regen' || id === 'sturm' ? 0.5 : 3;
    ps.emitRate = id === 'laub' ? 90 : id === 'schnee' ? 700 : 1800;
    if (id === 'laub') { ps.color1 = new Color4(0.85, 0.45, 0.12, 1); ps.color2 = new Color4(0.85, 0.65, 0.15, 1); ps.minAngularSpeed = -3; ps.maxAngularSpeed = 3; }
    else if (id === 'schnee') { ps.color1 = new Color4(1, 1, 1, 0.95); ps.color2 = new Color4(0.92, 0.95, 1, 0.85); }
    else { ps.color1 = new Color4(0.75, 0.82, 0.95, 0.55); ps.color2 = new Color4(0.7, 0.78, 0.9, 0.4); }
    ps.colorDead = new Color4(1, 1, 1, 0);
    ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    ps.isLocal = false;
    ps.start();
    return ps;
  }

  /* ---------- Bild-Aktualisierung ---------- */
  private aktualisiere(): void {
    const d = this.daten();
    const S = d.S;
    if (!S) return;
    // Starre Ansicht: neu ausrichten, sobald sich die aufgedeckten Staedte aendern. Frei: nur beim Start.
    const sichtbar = S.vis.join('');
    if (d.fokus.ver !== this.fokusVer) {
      // Bundesland heranzoomen bzw. zurueck zur Weltkarte.
      this.fokusVer = d.fokus.ver;
      const b = d.fokus.box;
      this.baueDetail(b);
      // Rand und Mindestabstand passend zur Groesse, damit auch Berlin bildschirmfuellend wird.
      if (b) this.rahmen(wx(b.x0), wx(b.x1), wz(b.y1), wz(b.y0), Math.max(wx(b.x1) - wx(b.x0), wz(b.y0) - wz(b.y1)) * 0.08, 4);
      else { this.ausgerichtetSichtbar = ''; this.ausgerichtetAuf = null; }
    }
    if (!d.fokus.box && (this.ausgerichtetAuf !== S || (!this.frei && sichtbar !== this.ausgerichtetSichtbar))) {
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
    this.syncBahnhoefe(d);
    this.skaliereSchilder();
    this.syncStoerungen(d);
    this.syncZuege(d);
    this.syncWetter(d);
  }

  /**
   * Kamera auf das eigene Netz (Streckenenden und Bahnhoefe; ohne Strecken: die aufgedeckten Staedte) ausrichten.
   * Nah genug, dass Staedte, Gleise und Zuege gut zu sehen sind (Abstand hoechstens START_RADIUS) -- weiter
   * herauszoomen geht mit Mausrad/zwei Fingern.
   */
  private richteKameraAus(d: TycoonWeltDaten): void {
    const S = d.S;
    const enden: number[] = Array.from(new Set<number>(S.lines.flatMap((l: any) => [l.a, l.b])));
    const punkte = (enden.length ? enden.map((i) => d.knoten(i)) : d.CITIES.filter((_, i) => S.vis[i]))
      .concat((S.bf || []).map((b: any) => ({ x: b.x, y: b.y })));
    if (!punkte.length) return;
    const xs = punkte.map((c) => wx(c.x)), zs = punkte.map((c) => wz(c.y));
    this.rahmen(Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs), 8, 30, START_RADIUS);
  }

  /** Kamera so setzen, dass der Bereich (3D-Koordinaten) neben dem Panel ganz zu sehen ist. */
  private rahmen(minX: number, maxX: number, minZ: number, maxZ: number, rand: number, mindest = 40, hoechstens = 380): void {
    // Auf schmalen Bildschirmen (Hochformat) liegt das Panel unten und deckt ca. 38 % ab.
    const schmal = this.canvas.clientWidth < 700;
    const seitenverhaeltnis = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight * (schmal ? 0.62 : 1));
    let radius = Math.max(mindest, Math.max(maxX - minX, maxZ - minZ) * 1.25 + rand);
    if (seitenverhaeltnis < 1.3) radius *= 1.3 / Math.max(0.4, seitenverhaeltnis);
    radius = Math.min(hoechstens, radius);
    // Breit: Panel rechts (300 px) -- Mittelpunkt nach rechts schieben. Schmal: Richtung Kamera, damit das Netz oben sitzt.
    const versatzX = schmal ? 0 : radius * 0.14;
    const versatzZ = schmal ? -radius * 0.18 : -radius * 0.03;
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
    const c = d.sel.city !== null ? d.CITIES[d.sel.city] : d.sel.bf != null ? d.knoten(d.BF0 + d.sel.bf) : null;
    this.auswahlRing.setEnabled(!!c);
    if (c) this.auswahlRing.position.set(wx(c.x), hoeheWelt(c.x, c.y) + 0.4, wz(c.y));
  }

  /** Namensschilder werden beim Heranzoomen kleiner (sonst verdecken sie die Karte), in der Uebersicht volle Groesse. */
  private schildSkala = 1;
  private skaliereSchilder(): void {
    const f = Math.round(Math.min(1, Math.max(0.12, this.kamera.radius / 110)) * 50) / 50;
    if (f === this.schildSkala) return;
    this.schildSkala = f;
    this.staedte.forEach((st) => { st.schild.scaling.setAll(f); st.schild.position.y = st.sockel.position.y + 1 + 6 * f; });
    this.bahnhoefe.forEach((m) => { if (m.name.startsWith('bfSchild')) { m.scaling.setAll(f); m.position.y = (m as any).basisY + 0.6 + 3.9 * f; } });
  }

  /** Bahnsteig und Namensschild je Bahnhof; neu gebaut, wenn Bahnhoefe dazukommen oder wegfallen. */
  private syncBahnhoefe(d: TycoonWeltDaten): void {
    const liste: any[] = d.S.bf || [];
    const key = liste.map((b) => b.id + ':' + b.x + ':' + b.y).join(',');
    if (key === this.bahnhofSchluessel) return;
    this.bahnhofSchluessel = key;
    // Schilder haben eigene Materialien (mit Textur), der Bahnsteig das geteilte farbMat.
    this.bahnhoefe.forEach((m) => { if (m.name.startsWith('bfSchild')) m.material?.dispose(true, true); m.dispose(); });
    this.bahnhoefe = [];
    liste.forEach((b) => {
      const y = hoeheWelt(b.x, b.y);
      const steig = CreateBox('bahnsteig' + b.id, { width: 1.6 * G, height: 0.18 * G, depth: 0.7 * G }, this.scene);
      steig.position.set(wx(b.x), y + 0.09 * G, wz(b.y));
      steig.material = this.farbMat('#cfc8b8', 1, 0.1);
      steig.isPickable = false;
      const schild = CreatePlane('bfSchild' + b.id, { width: 10, height: 2.5 }, this.scene);
      schild.position.set(wx(b.x), y + 0.6 + 3.9 * this.schildSkala, wz(b.y));
      schild.scaling.setAll(this.schildSkala);
      (schild as any).basisY = y;
      schild.billboardMode = Mesh.BILLBOARDMODE_ALL;
      schild.material = this.schildMaterial('🚉 ' + d.bfName(b), 'bf' + b.id);
      schild.isPickable = false;
      this.bahnhoefe.push(steig, schild);
    });
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
      if (g && g.cls === (L.cls ?? 0) && g.ol === !!L.ol && g.gleise === (L.gleise || 1)) return;
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
    const pfad: Vector3[] = L.pts.map((p: any) => new Vector3(wx(p.x), hoeheWelt(p.x, p.y) + 0.05 * G, wz(p.y)));
    // Quervektor (rechtwinklig zur Fahrtrichtung) je Punkt
    const quer = pfad.map((_p, k) => {
      const a = pfad[Math.max(0, k - 1)], b = pfad[Math.min(pfad.length - 1, k + 1)];
      const t = b.subtract(a);
      t.y = 0;
      t.normalize();
      return new Vector3(-t.z, 0, t.x);
    });
    // Schotterbett: Band mit Boeschung, folgt dem Gelaende.
    // Zweigleisig: zwei Gleisachsen, Schotterbett entsprechend breiter.
    const achsen = (L.gleise || 1) === 2 ? [-GLEIS_VERSATZ, GLEIS_VERSATZ] : [0], breit = (L.gleise || 1) === 2 ? GLEIS_VERSATZ : 0;
    const profil = [[-0.85, -0.06], [-0.55, 0.06], [0.55, 0.06], [0.85, -0.06]].map(([q, y]) => [q * G + Math.sign(q) * breit, y * G]);
    const bahnen = profil.map(([q, y]) => pfad.map((p, k) => new Vector3(p.x + quer[k].x * q, p.y + y, p.z + quer[k].z * q)));
    const schotter = CreateRibbon('schotter' + i, { pathArray: bahnen, sideOrientation: Mesh.DOUBLESIDE }, this.scene);
    const schotterMat = this.farbe('schotterMat' + i, '#8d8478');
    schotter.material = schotterMat;
    schotter.isPickable = false;
    const schienen = achsen.flatMap((a) => [-1, 1].map((seite) => {
      const q0 = a + SCHIENE * seite;
      const weg = pfad.map((p, k) => new Vector3(p.x + quer[k].x * q0, p.y + 0.12 * G, p.z + quer[k].z * q0));
      const m = CreateTube('schiene' + i + '_' + a + '_' + seite, { path: weg, radius: 0.045 * G, tessellation: 5 }, this.scene);
      m.material = this.schieneMat;
      m.isPickable = false;
      return m;
    }));
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
    const schwellen = achsen.flatMap((a) => verteile(SCHWELLEN_ABSTAND, 0.07 * G, a));
    let draht: Mesh | null = null, masten: number[] = [];
    if (L.ol) {
      masten = verteile(MAST_ABSTAND, -0.05 * G, 0.85 * G + breit);
      // Je Gleisachse ein Fahrdraht, zu einem Mesh verschmolzen.
      const draehte = achsen.map((a) => CreateTube('draht' + i + '_' + a, { path: pfad.map((p, k) => new Vector3(p.x + quer[k].x * a, p.y + 1.5 * G, p.z + quer[k].z * a)), radius: 0.02 * G, tessellation: 4 }, this.scene));
      draht = (draehte.length > 1 ? Mesh.MergeMeshes(draehte, true) : null) ?? draehte[0];
      draht.material = this.drahtMat;
      draht.isPickable = false;
    }
    return { cls, ol: !!L.ol, gleise: L.gleise || 1, schotter, schienen, draht, schotterMat, holz: cls >= 2 ? [] : schwellen, beton: cls >= 2 ? schwellen : [], masten };
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
        // Zweigleisig: jede Fahrtrichtung auf ihrem eigenen Gleis.
        const v = (L.gleise || 1) === 2 ? GLEIS_VERSATZ : 0;
        w.position.set(wx(p.x) + dz * v, hoeheWelt(p.x, p.y) + 0.19 * G, wz(p.y) - dx * v);
        w.rotation.y = Math.atan2(dx, dz) + ((w as any).umgedreht ? Math.PI : 0);
      });
    }
    for (const [id, z] of this.zuege) {
      if (!gesehen.has(id)) { z.wagen.forEach((w) => this.entsorge(w)); this.zuege.delete(id); }
    }
  }
}

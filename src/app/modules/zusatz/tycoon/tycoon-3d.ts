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
import { bezirkeVon, bezirkRahmen, GROSSSTADT, KARTE_H, KARTE_W, SC, spielerFarbe, wx, wz, zeichneKarte } from './tycoon-karte';
import { CreateDisc } from '@babylonjs/core/Meshes/Builders/discBuilder';
import { ZUEGE } from './tycoon-zuege';

/** Was die 2D-Spiel-Engine der 3D-Ansicht pro Bild zur Verfuegung stellt (nur lesen). */
export interface TycoonWeltDaten {
  S: any;
  sel: { city: number | null; line: number | null };
  CITIES: { n: string; x: number; y: number }[];
  DIFF: { col: string }[];
  posAt: (L: any, s: number) => { x: number; y: number; ang: number };
  /** Lackierung der eigenen Zuege (Hex) oder null fuer die Werkslackierung. */
  skin: string | null;
  /** Gemeinsame Welt vom Server (Bezirke, Aktivitaet je Stadt) oder null. */
  welt: any;
}

const MODELL_PFAD = 'assets/modelle/kenney/';
/** Fremdzuege (zahlen Trassenentgelt): Gueterzug mit Diesellok. */
const FREMD_MODELL: { lok: string; wagen: string[]; ende?: string } = { lok: 'train-diesel-b', wagen: ['train-carriage-box', 'train-carriage-tank'] };
/** Abstand der Oberleitungsmasten (3D-Einheiten). */
const MAST_ABSTAND = 3;
/** Modelle je Zug-Typ stehen in tycoon-zuege.ts (ZUEGE[typ].modell). */
export const lokDatei = (typ: number): string => MODELL_PFAD + (ZUEGE[typ] ?? ZUEGE[1]).modell.lok + '.glb';
/** Alle Fahrzeug-Dateien eines Zug-Typs in Reihenfolge (wie auf der Karte); umgedreht = letztes ist ein Endkopf. */
export const zugDateien = (typ: number): { dateien: string[]; umgedreht: boolean } => {
  const z = ZUEGE[typ] ?? ZUEGE[1], m = z.modell, dateien: string[] = [];
  for (let i = 0; i < z.len; i++) {
    dateien.push(MODELL_PFAD + (i === 0 ? m.lok : i === z.len - 1 && m.ende ? m.ende : m.wagen[(i - 1) % m.wagen.length]) + '.glb');
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
  /** Bezirks-Sektoren und Aktivitaets-Lichter; neu gebaut, wenn sich Besitz/Aktivitaet aendert. */
  private bezirkSchluessel = '';
  private bezirkTeile: TransformNode[] = [];
  private lichter: { knoten: TransformNode; aktiv: boolean }[] = [];
  private readonly farbMats = new Map<string, StandardMaterial>();
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
    if (c) this.auswahlRing.position.set(wx(c.x), 0.4, wz(c.y));
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
      if (g && g.cls === (L.cls ?? 0)) return;
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
    /** Gleichmaessig entlang des Pfads verteilte Matrizen (Drehung in Fahrtrichtung, Versatz quer). */
    const verteile = (abstand: number, hoehe: number, querVersatz: number): number[] => {
      const out: number[] = [];
      const m = new Matrix();
      let rest = abstand / 2;
      for (let k = 1; k < pfad.length; k++) {
        const a = pfad[k - 1], b = pfad[k], seg = Vector3.Distance(a, b);
        const dreh = Math.atan2(b.x - a.x, b.z - a.z);
        while (rest <= seg) {
          const f = rest / seg, q = quer[k];
          Matrix.RotationY(dreh).multiplyToRef(Matrix.Translation(a.x + (b.x - a.x) * f + q.x * querVersatz, hoehe, a.z + (b.z - a.z) * f + q.z * querVersatz), m);
          for (let n = 0; n < 16; n++) out.push(m.m[n]);
          rest += abstand;
        }
        rest -= seg;
      }
      return out;
    };
    const schwellen = verteile(SCHWELLEN_ABSTAND, 0.12, 0);
    let draht: Mesh | null = null, masten: number[] = [];
    if (cls >= 1) {
      masten = verteile(MAST_ABSTAND, 0, 0.85);
      draht = CreateTube('draht' + i, { path: pfad.map((p) => new Vector3(p.x, 1.55, p.z)), radius: 0.02, tessellation: 4 }, this.scene);
      draht.material = this.drahtMat;
      draht.isPickable = false;
    }
    return { cls, schotter, schienen, draht, schotterMat, holz: cls >= 2 ? [] : schwellen, beton: cls >= 2 ? schwellen : [], masten };
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

  /**
   * Echte Bezirksgrenzen einer Stadt als Bodenbild (eine Flaeche mit Textur): Besitz farbig, freie Bezirke hell, alle umrandet.
   * Kleine Staedte werden vergroessert (hoechstens bis knapp vor die naechste Stadt), damit man die Bezirke sieht.
   */
  private bezirkFlaeche(d: TycoonWeltDaten, i: number, w: any): void {
    const rahmen = bezirkRahmen(i)!, c = d.CITIES[i];
    const bw = rahmen.x1 - rahmen.x0, bh = rahmen.y1 - rahmen.y0, radius = Math.max(bw, bh) / 2 || 1;
    const naechste = Math.min(...d.CITIES.filter((_o, j) => j !== i).map((o) => Math.hypot(o.x - c.x, o.y - c.y)));
    const s = Math.max(1, Math.min(42 / radius, (naechste * 0.45) / radius));
    const tw = 512, th = Math.max(64, Math.round((512 * bh) / bw));
    const tex = new DynamicTexture('bezirkTex' + i, { width: tw, height: th }, this.scene, true);
    tex.hasAlpha = true;
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, tw, th);
    ctx.lineJoin = 'round';
    bezirkeVon(i).forEach((b, j) => {
      const x = (w.bezirke || []).find((o: any) => o.stadt === i && o.bezirk === j);
      ctx.beginPath();
      b.ringe.forEach((r) => {
        for (let q = 0; q < r.length; q += 2) {
          const px = ((r[q] - rahmen.x0) / bw) * tw, py = ((r[q + 1] - rahmen.y0) / bh) * th;
          if (q === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
      });
      if (x) { ctx.fillStyle = x.clanFarbe || spielerFarbe(x.ownerId); ctx.globalAlpha = x.ownerId === w.ich?.id ? 0.78 : 0.55; }
      else { ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.22; }
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(35,38,43,.7)';
      ctx.lineWidth = 3;
      ctx.stroke();
    });
    tex.update();
    const flaeche = CreateGround('bezirke' + i, { width: bw * s * SC, height: bh * s * SC }, this.scene);
    // Um den Stadtpunkt vergroessern, damit die Stadt an ihrer Stelle bleibt.
    const mx = c.x + ((rahmen.x0 + rahmen.x1) / 2 - c.x) * s, my = c.y + ((rahmen.y0 + rahmen.y1) / 2 - c.y) * s;
    flaeche.position.set(wx(mx), 0.03, wz(my));
    const mat = new StandardMaterial('bezirkMat' + i, this.scene);
    mat.diffuseTexture = tex;
    mat.useAlphaFromDiffuseTexture = true;
    mat.emissiveColor = new Color3(0.25, 0.25, 0.25);
    mat.specularColor = Color3.Black();
    flaeche.material = mat;
    flaeche.isPickable = false;
    const halter = new TransformNode('bezirkHalter' + i, this.scene);
    flaeche.parent = halter;
    // Beim Neuaufbau mit entsorgen (Textur + Material gehoeren nur dieser Flaeche).
    halter.onDisposeObservable.add(() => { mat.dispose(true, true); });
    this.bezirkTeile.push(halter);
  }

  /** Bezirke als farbige Sektoren um die Stadt (Besitzer- bzw. Clanfarbe) und Lichter fuer die Aktivitaet anderer Spieler. */
  private syncBezirke(d: TycoonWeltDaten): void {
    const w = d.welt, S = d.S;
    const key = w ? JSON.stringify([S.vis, (w.bezirke || []).map((b: any) => [b.stadt, b.bezirk, b.ownerId, b.clanFarbe]), w.staedte, w.ich?.id]) : '';
    if (key !== this.bezirkSchluessel) {
      this.bezirkSchluessel = key;
      this.bezirkTeile.forEach((t) => t.dispose());
      this.bezirkTeile = [];
      this.lichter = [];
      if (w) {
        d.CITIES.forEach((c, i) => {
          if (!S.vis[i]) return;
          if (bezirkRahmen(i)) { this.bezirkFlaeche(d, i, w); return; }
          const bz = bezirkeVon(i), r = GROSSSTADT.has(c.n) ? 5.6 : 4.6;
          bz.forEach((_b, j) => {
            const x = (w.bezirke || []).find((b: any) => b.stadt === i && b.bezirk === j);
            if (!x) return;
            const mein = x.ownerId === w.ich?.id;
            const halter = new TransformNode('bezirk', this.scene);
            halter.position.set(wx(c.x), 0.035, wz(c.y));
            halter.rotation.y = (j * Math.PI * 2) / bz.length;
            const sektor = CreateDisc('sektor', { radius: r, arc: 1 / bz.length, tessellation: 32 }, this.scene);
            sektor.rotation.x = Math.PI / 2;
            sektor.parent = halter;
            sektor.isPickable = false;
            sektor.material = this.farbMat(x.clanFarbe || spielerFarbe(x.ownerId), mein ? 0.62 : 0.42);
            this.bezirkTeile.push(halter);
          });
        });
        (w.staedte || []).forEach((st: any) => {
          const c = d.CITIES[st.stadt];
          if (!c || !S.vis[st.stadt] || !st.spieler) return;
          const knoten = new TransformNode('lichter', this.scene);
          knoten.position.set(wx(c.x), 2.4, wz(c.y));
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
      l.knoten.position.y = 2.4 + (l.aktiv ? Math.sin(t * 3) * 0.25 : 0);
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
      const typ = ZUEGE[t.type ?? 1] ?? ZUEGE[1];
      const modell = t.own ? typ.modell : FREMD_MODELL;
      const anzahl = t.own ? typ.len : 3;
      const farbe = t.own ? d.skin : null;
      const schluessel = (t.own ? 'o' : 'f') + (t.type ?? 1) + (farbe ?? '');
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
        w.position.set(wx(p.x), 0.19, wz(p.y));
        w.rotation.y = Math.atan2(dx, dz) + ((w as any).umgedreht ? Math.PI : 0);
      });
    }
    for (const [id, z] of this.zuege) {
      if (!gesehen.has(id)) { z.wagen.forEach((w) => this.entsorge(w)); this.zuege.delete(id); }
    }
  }
}

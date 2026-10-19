import '@babylonjs/loaders/glTF';
import '@babylonjs/core/Animations/animatable';
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Materials/PBR/pbrMaterial';
import '@babylonjs/core/Behaviors/Cameras/autoRotationBehavior';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Observer } from '@babylonjs/core/Misc/observable';

export interface GeladenesModell {
  wurzel: TransformNode;
  animationen: AnimationGroup[];
}

/** Ausdehnung eines Knotens samt Kindern in Weltkoordinaten. */
function masse(node: TransformNode): { min: Vector3; max: Vector3; groesse: Vector3 } {
  node.computeWorldMatrix(true);
  const b = node.getHierarchyBoundingVectors(true);
  return { min: b.min, max: b.max, groesse: b.max.subtract(b.min) };
}

/**
 * Kleine 3D-Engine-Huelle um Babylon.js fuer die Lern-App: Szene, Kamera, Licht, GLB-Laden,
 * Modell-Anzeige (Viewer) und ein Gleis-Diorama mit fahrendem Zug. Alles laeuft ausserhalb von
 * Angulars Zone (vom Aufrufer sicherzustellen); mit zerstoeren() werden Engine, Szene und alle
 * GPU-Ressourcen freigegeben.
 */
export class Engine3D {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly kamera: ArcRotateCamera;
  private anzeige: TransformNode[] = [];
  private frameBeobachter: Observer<Scene> | null = null;
  private tot = false;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false, antialias: true }, true);
    // Uniform-Buffer abschalten: manche Treiber (u. a. Software-GL) zeichnen sonst gar nichts. Fuer diese kleine Szene kostenlos.
    this.engine.disableUniformBuffers = true;
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.93, 0.95, 0.97, 1);

    this.kamera = new ArcRotateCamera('kamera', -Math.PI / 3, Math.PI / 3, 8, Vector3.Zero(), this.scene);
    this.kamera.lowerRadiusLimit = 1;
    this.kamera.upperRadiusLimit = 80;
    this.kamera.wheelPrecision = 30;
    this.kamera.attachControl(canvas, true);

    const himmel = new HemisphericLight('himmel', new Vector3(0, 1, 0.3), this.scene);
    himmel.intensity = 0.9;
    himmel.groundColor = new Color3(0.55, 0.55, 0.6);
    const sonne = new DirectionalLight('sonne', new Vector3(-0.5, -1, -0.6), this.scene);
    sonne.intensity = 0.8;

    this.engine.runRenderLoop(() => {
      if (!this.tot) this.scene.render();
    });
    window.addEventListener('resize', this.onResize);
  }

  private readonly onResize = (): void => this.engine.resize();

  /** Laedt eine GLB-Datei und liefert Wurzelknoten + Animationsgruppen. */
  async lade(datei: string): Promise<GeladenesModell> {
    const i = datei.lastIndexOf('/');
    const ergebnis = await SceneLoader.ImportMeshAsync('', datei.slice(0, i + 1), datei.slice(i + 1), this.scene);
    const wurzel = ergebnis.meshes[0] as unknown as TransformNode;
    ergebnis.animationGroups.forEach((a) => a.stop());
    return { wurzel, animationen: ergebnis.animationGroups };
  }

  /** Dreht ein Modell um Y, sodass seine lange Achse entlang Z liegt (Fahrtrichtung im Diorama). */
  richteAufZAchseAus(m: TransformNode): void {
    const g = masse(m).groesse;
    if (g.x > g.z * 1.05) {
      m.rotationQuaternion = null;
      m.rotation.y += Math.PI / 2;
    }
  }

  private raeumeAnzeigeAuf(): void {
    if (this.frameBeobachter) this.scene.onBeforeRenderObservable.remove(this.frameBeobachter);
    this.frameBeobachter = null;
    for (const n of this.anzeige) n.dispose(false, true);
    this.anzeige = [];
    for (const m of this.scene.meshes.slice()) if (m.name === 'boden') m.dispose();
    this.scene.animationGroups.slice().forEach((a) => a.dispose());
  }

  /** Einzelnes Modell im Zentrum zeigen, auf feste Groesse normiert, Kamera passend gesetzt. */
  async zeigeModell(datei: string, drehen = true): Promise<GeladenesModell> {
    this.raeumeAnzeigeAuf();
    const m = await this.lade(datei);
    if (this.tot) return m;
    this.anzeige.push(m.wurzel);
    const g = masse(m.wurzel);
    const laenge = Math.max(g.groesse.x, g.groesse.y, g.groesse.z) || 1;
    m.wurzel.scaling.scaleInPlace(4 / laenge);
    const g2 = masse(m.wurzel);
    const mitte = g2.min.add(g2.max).scale(0.5);
    m.wurzel.position.subtractInPlace(new Vector3(mitte.x, g2.min.y, mitte.z));
    this.kamera.setTarget(new Vector3(0, g2.groesse.y / 2, 0));
    this.kamera.radius = 7;
    this.kamera.upperRadiusLimit = 80;
    this.kamera.alpha = -Math.PI / 3;
    this.kamera.beta = Math.PI / 3;
    this.setzeAutoDrehen(drehen);
    this.baueBoden(10);
    return m;
  }

  setzeAutoDrehen(an: boolean): void {
    this.kamera.useAutoRotationBehavior = an;
    if (an && this.kamera.autoRotationBehavior) this.kamera.autoRotationBehavior.idleRotationSpeed = 0.35;
  }

  private baueBoden(groesse: number, y = -0.05): void {
    const boden = CreateGround('boden', { width: groesse, height: groesse }, this.scene);
    const mat = new StandardMaterial('bodenMat', this.scene);
    mat.diffuseColor = new Color3(0.36, 0.52, 0.36);
    mat.emissiveColor = new Color3(0.04, 0.06, 0.04);
    mat.specularColor = Color3.Black();
    boden.material = mat;
    boden.position.y = y;
  }

  /**
   * Gleis-Diorama: gerades Gleis (Kachel mehrfach) mit einem Zug aus Lok und Wagen, der hin- und
   * herfaehrt. Kachelgroesse und Ausrichtung werden aus den Modellen gemessen -- so passt es auch,
   * wenn spaeter andere Gleis- oder Zugmodelle eingebunden werden.
   */
  async zeigeDiorama(gleisDatei: string, lokDatei: string, wagenDateien: string[]): Promise<void> {
    this.raeumeAnzeigeAuf();
    const kacheln = 9;
    const vorlage = await this.lade(gleisDatei);
    if (this.tot) return;
    this.richteAufZAchseAus(vorlage.wurzel);
    const gm = masse(vorlage.wurzel);
    const kachelLaenge = gm.groesse.z || 1;
    const startZ = -((kacheln - 1) / 2) * kachelLaenge;
    vorlage.wurzel.position.z = startZ;
    this.anzeige.push(vorlage.wurzel);
    for (let i = 1; i < kacheln; i++) {
      const k = await this.lade(gleisDatei);
      if (this.tot) return;
      this.richteAufZAchseAus(k.wurzel);
      k.wurzel.position.z = startZ + i * kachelLaenge;
      this.anzeige.push(k.wurzel);
    }

    const zug = new TransformNode('zug', this.scene);
    let versatz = 0;
    for (const d of [lokDatei, ...wagenDateien]) {
      const t = await this.lade(d);
      if (this.tot) return;
      this.richteAufZAchseAus(t.wurzel);
      const tm = masse(t.wurzel);
      t.wurzel.position.y -= tm.min.y - gm.max.y * 0.5;
      t.wurzel.position.z = versatz - (tm.min.z + tm.max.z) / 2;
      versatz -= tm.groesse.z + 0.05;
      t.wurzel.parent = zug;
    }
    this.anzeige.push(zug);

    const bahn = kachelLaenge * kacheln;
    const zuglaenge = -versatz;
    const start = -bahn / 2 + zuglaenge;
    const ende = bahn / 2;
    let z = start;
    let richtung = 1;
    this.frameBeobachter = this.scene.onBeforeRenderObservable.add(() => {
      const dt = this.engine.getDeltaTime() / 1000;
      z += richtung * kachelLaenge * 1.2 * dt;
      if (z > ende) { z = ende; richtung = -1; zug.rotation.y = Math.PI; }
      else if (z < start) { z = start; richtung = 1; zug.rotation.y = 0; }
      zug.position.z = z - (richtung < 0 ? zuglaenge : 0);
    });
    this.kamera.setTarget(new Vector3(0, gm.groesse.y, 0));
    this.kamera.radius = bahn * 0.7;
    this.kamera.upperRadiusLimit = bahn * 2;
    this.kamera.alpha = -Math.PI / 2.6;
    this.kamera.beta = Math.PI / 3.2;
    this.setzeAutoDrehen(false);
    this.baueBoden(bahn * 1.6, gm.min.y - 0.02);
  }

  zerstoeren(): void {
    this.tot = true;
    window.removeEventListener('resize', this.onResize);
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }
}

/* eslint-disable */
/**
 * 3D-Modelle der Volumenkörper (Tim, 2026-11-06) mit Babylon.js.
 * Drehen mit Finger/Maus, Zoomen mit zwei Fingern/Mausrad. Maßlinien mit HTML-Beschriftung.
 * Sehr lange oder sehr flache Körper (Schotterbett 0,5 m × 500 m) werden gestaucht dargestellt,
 * die Beschriftung zeigt immer die echten Werte.
 * Wird per import() nachgeladen und außerhalb von Angulars Zone gestartet.
 */
import '@babylonjs/core/Behaviors/Cameras/autoRotationBehavior';
import '@babylonjs/core/Rendering/edgesRenderer';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateLathe } from '@babylonjs/core/Meshes/Builders/latheBuilder';
import { CreateLines } from '@babylonjs/core/Meshes/Builders/linesBuilder';
import { CreateDisc } from '@babylonjs/core/Meshes/Builders/discBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import type { KoerperId } from '../data/koerper';

export interface ModellAnsicht {
  koerper: KoerperId;
  /** echte Maße in m */
  masse: Record<string, number>;
  /** Beschriftung je Maß, z. B. „a = 3,40 m“ (fehlt → Zeichen) */
  beschriftung: Record<string, string>;
  farbe: string;
  koernig?: boolean;
}

type V3 = [number, number, number];
interface Masslinie { key: string; von: V3; bis: V3; }

/** CSS-Farbe (auch var(...)) in Color3 auflösen */
function cssFarbe(css: string, bezug: HTMLElement): Color3 {
  const el = document.createElement('span');
  el.style.color = css; el.style.display = 'none'; bezug.appendChild(el);
  const rgb = getComputedStyle(el).color; el.remove();
  const m = /rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(rgb);
  return m ? new Color3(+m[1] / 255, +m[2] / 255, +m[3] / 255) : new Color3(0.5, 0.5, 0.5);
}

/** Darstellungsmaße: Verhältnisse begrenzen, größtes Maß = 4 Einheiten */
function anzeigeMasse(id: KoerperId, m: Record<string, number>): { d: Record<string, number>; gestaucht: boolean } {
  const d: Record<string, number> = { ...m };
  let gestaucht = false;
  const laengs = id === 'trapez' || id === 'dreieck' ? 'l' : null;
  if (laengs) {
    const quer = Math.max(...Object.keys(d).filter(k => k !== laengs).map(k => d[k]));
    const max = quer * 2.6;
    if (d[laengs] > max) { d[laengs] = max; gestaucht = true; }
    if (d[laengs] < quer * 0.6) { d[laengs] = quer * 0.6; gestaucht = true; }
  }
  const groesst = Math.max(...Object.values(d));
  for (const k of Object.keys(d)) {
    if (d[k] < groesst / 7) { d[k] = groesst / 7; gestaucht = true; }
  }
  if (id === 'rohr' && d['d'] >= d['D'] * 0.92) d['d'] = d['D'] * 0.85;
  if (id === 'rohr' && d['D'] - d['d'] < d['D'] * 0.08) d['d'] = d['D'] * 0.84;
  const s = (id === 'wuerfel' || id === 'kugel' ? 3 : 4) / Math.max(...Object.values(d));
  for (const k of Object.keys(d)) d[k] *= s;
  return { d, gestaucht };
}

export class Volumen3D {
  private engine: Engine;
  private scene: Scene;
  private kamera: ArcRotateCamera;
  private wurzel: TransformNode | null = null;
  private labels: { el: HTMLElement; p: Vector3 }[] = [];
  private tot = false;
  private laeuft = false;
  private ro: ResizeObserver;
  private hinweis: HTMLElement;

  constructor(private canvas: HTMLCanvasElement, private labelHost: HTMLElement) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true, antialias: true }, true);
    this.engine.disableUniformBuffers = true;
    this.scene = new Scene(this.engine);
    this.kamera = new ArcRotateCamera('kamera', -Math.PI / 4.2, Math.PI / 2.9, 10, new Vector3(0, 1, 0), this.scene);
    this.kamera.lowerRadiusLimit = 3; this.kamera.upperRadiusLimit = 30;
    this.kamera.lowerBetaLimit = 0.15; this.kamera.upperBetaLimit = Math.PI / 2 - 0.02;
    this.kamera.wheelPrecision = 40; this.kamera.pinchPrecision = 60; this.kamera.panningSensibility = 0;
    this.kamera.attachControl(canvas, true);
    this.kamera.useAutoRotationBehavior = true;
    const auto = this.kamera.autoRotationBehavior!;
    auto.idleRotationSpeed = 0.12; auto.idleRotationWaitTime = 5000; auto.idleRotationSpinupTime = 2500;
    // Nur am Anfang drehen: sobald man das Modell einmal anfasst, bleibt es stehen (Tim, 2026-11-06)
    const anhalten = () => {
      this.kamera.useAutoRotationBehavior = false;
      canvas.removeEventListener('pointerdown', anhalten); canvas.removeEventListener('wheel', anhalten);
    };
    canvas.addEventListener('pointerdown', anhalten); canvas.addEventListener('wheel', anhalten, { passive: true });

    const himmel = new HemisphericLight('himmel', new Vector3(0.2, 1, -0.3), this.scene);
    himmel.intensity = 0.55; himmel.groundColor = new Color3(0.35, 0.35, 0.4);
    const sonne = new DirectionalLight('sonne', new Vector3(-0.6, -1, 0.45), this.scene);
    sonne.intensity = 0.6;

    this.hinweis = document.createElement('div'); this.hinweis.className = 'v3d-hinweis';
    this.hinweis.textContent = 'nicht maßstäblich'; labelHost.appendChild(this.hinweis);

    this.farbenAusDesign();
    this.scene.onAfterRenderObservable.add(() => this.labelsSetzen());
    this.ro = new ResizeObserver(() => { this.engine.resize(); this.radiusAnpassen(); }); this.ro.observe(canvas);
    this.fortsetzen();
  }

  private akzent = new Color3(1, 0.54, 0.24);
  private tinte = new Color3(0.1, 0.1, 0.1);
  /** Hintergrund, Akzent- und Linienfarbe aus dem eingestellten Design übernehmen */
  farbenAusDesign(): void {
    const bg = cssFarbe('var(--sp-surface-2)', this.labelHost);
    this.scene.clearColor = new Color4(bg.r, bg.g, bg.b, 1);
    this.akzent = cssFarbe('var(--sp-accent)', this.labelHost);
    this.tinte = cssFarbe('var(--sp-text)', this.labelHost);
  }

  fortsetzen(): void {
    if (this.laeuft || this.tot) return;
    this.laeuft = true;
    this.engine.runRenderLoop(() => this.scene.render());
  }
  pausieren(): void { this.laeuft = false; this.engine.stopRenderLoop(); }

  zeige(a: ModellAnsicht): void {
    this.wurzel?.dispose(false, true);
    this.labels.forEach(l => l.el.remove()); this.labels = [];
    const wurzel = new TransformNode('koerper', this.scene); this.wurzel = wurzel;
    const { d, gestaucht } = anzeigeMasse(a.koerper, a.masse);
    this.hinweis.style.display = gestaucht ? '' : 'none';

    const mat = new StandardMaterial('stoff', this.scene);
    const farbe = Color3.FromHexString(a.farbe);
    mat.diffuseColor = farbe; mat.specularColor = new Color3(0.08, 0.08, 0.08);
    mat.backFaceCulling = false;
    if (a.koernig) {
      const tex = new DynamicTexture('koernung', { width: 256, height: 256 }, this.scene, true);
      const c = tex.getContext() as CanvasRenderingContext2D;
      c.fillStyle = a.farbe; c.fillRect(0, 0, 256, 256);
      let saat = 7; const zufall = () => (saat = (saat * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 520; i++) {
        const x = zufall() * 256, y = zufall() * 256, r = 3 + zufall() * 7, hell = Math.round((zufall() - 0.5) * 70);
        c.fillStyle = `rgb(${[farbe.r, farbe.g, farbe.b].map(v => Math.max(0, Math.min(255, Math.round(v * 255) + hell))).join(',')})`;
        c.beginPath();
        const ecken = 5 + Math.floor(zufall() * 3);
        for (let k = 0; k < ecken; k++) {
          const w = k / ecken * Math.PI * 2, rr = r * (0.7 + zufall() * 0.5);
          k ? c.lineTo(x + Math.cos(w) * rr, y + Math.sin(w) * rr) : c.moveTo(x + Math.cos(w) * rr, y + Math.sin(w) * rr);
        }
        c.closePath(); c.fill();
      }
      tex.update(); tex.wrapU = tex.wrapV = 1;
      mat.diffuseTexture = tex; mat.diffuseColor = Color3.White();
    }

    const linien: Masslinie[] = [];
    const o = 0.35;                                           // Abstand der Maßlinien vom Körper
    let hoehe = 0, mesh: Mesh;
    const kanten = (m: Mesh) => { m.enableEdgesRendering(0.98); m.edgesWidth = 2.2; m.edgesColor = new Color4(0.08, 0.08, 0.1, 0.7); };

    const dicke = 0.06;                                       // ebene Flächen als dünne Platte
    switch (a.koerper) {
      case 'rechteck': {
        const l = d['l'], b = d['b'];
        mesh = this.prisma([[-b / 2, 0], [b / 2, 0], [b / 2, dicke], [-b / 2, dicke]], l); hoehe = 0;
        linien.push({ key: 'l', von: [-l / 2, 0, -b / 2 - o], bis: [l / 2, 0, -b / 2 - o] });
        linien.push({ key: 'b', von: [l / 2 + o, 0, -b / 2], bis: [l / 2 + o, 0, b / 2] });
        break;
      }
      case 'dreiecksflaeche': {
        const g = d['g'], h = d['h'], z0 = -h / 2;
        const P = (x: number, y: number, z: number) => new Vector3(x, y, z);
        const u = [P(-g / 2, 0, z0), P(g / 2, 0, z0), P(0, 0, z0 + h)], ob = u.map(p => P(p.x, dicke, p.z));
        mesh = this.polyeder([u, ob, [u[0], u[1], ob[1], ob[0]], [u[1], u[2], ob[2], ob[1]], [u[2], u[0], ob[0], ob[2]]], new Vector3(0, dicke / 2, z0 + h / 3));
        hoehe = 0;
        linien.push({ key: 'g', von: [-g / 2, 0, z0 - o], bis: [g / 2, 0, z0 - o] });
        linien.push({ key: 'h', von: [0, dicke + 0.01, z0], bis: [0, dicke + 0.01, z0 + h] });
        break;
      }
      case 'trapez': case 'dreieck': {
        const l = d['l'], h = d['h'];
        const unten = a.koerper === 'trapez' ? d['c'] : d['g'], oben = a.koerper === 'trapez' ? d['a'] : 0;
        const profil: [number, number][] = oben > 0
          ? [[-unten / 2, 0], [unten / 2, 0], [oben / 2, h], [-oben / 2, h]]
          : [[-unten / 2, 0], [unten / 2, 0], [0, h]];
        mesh = this.prisma(profil, l); hoehe = h;
        const fx = l / 2;
        if (a.koerper === 'trapez') {
          linien.push({ key: 'a', von: [fx, h + o, -oben / 2], bis: [fx, h + o, oben / 2] });
          linien.push({ key: 'c', von: [fx + o, 0, -unten / 2], bis: [fx + o, 0, unten / 2] });
        } else {
          linien.push({ key: 'g', von: [fx + o, 0, -unten / 2], bis: [fx + o, 0, unten / 2] });
        }
        linien.push(a.koerper === 'trapez'
          ? { key: 'h', von: [fx, 0, -unten / 2 - o], bis: [fx, h, -unten / 2 - o] }
          : { key: 'h', von: [fx + 0.02, 0, 0], bis: [fx + 0.02, h, 0] });
        linien.push({ key: 'l', von: [-l / 2, 0, -unten / 2 - o], bis: [l / 2, 0, -unten / 2 - o] });
        break;
      }
      case 'quader': case 'wuerfel': {
        const l = a.koerper === 'wuerfel' ? d['a'] : d['l'], b = a.koerper === 'wuerfel' ? d['a'] : d['b'], h = a.koerper === 'wuerfel' ? d['a'] : d['h'];
        mesh = this.prisma([[-b / 2, 0], [b / 2, 0], [b / 2, h], [-b / 2, h]], l); hoehe = h;
        if (a.koerper === 'wuerfel') {
          linien.push({ key: 'a', von: [-l / 2, 0, -b / 2 - o], bis: [l / 2, 0, -b / 2 - o] });
        } else {
          linien.push({ key: 'l', von: [-l / 2, 0, -b / 2 - o], bis: [l / 2, 0, -b / 2 - o] });
          linien.push({ key: 'b', von: [l / 2 + o, 0, -b / 2], bis: [l / 2 + o, 0, b / 2] });
          linien.push({ key: 'h', von: [-l / 2 - o, 0, -b / 2 - o], bis: [-l / 2 - o, h, -b / 2 - o] });
        }
        break;
      }
      case 'pyramide': {
        const l = d['l'], b = d['b'], h = d['h'];
        const P = (x: number, y: number, z: number) => new Vector3(x, y, z);
        const s = P(0, h, 0), A = P(-l / 2, 0, -b / 2), B = P(l / 2, 0, -b / 2), C = P(l / 2, 0, b / 2), D = P(-l / 2, 0, b / 2);
        mesh = this.polyeder([[A, B, C, D], [A, B, s], [B, C, s], [C, D, s], [D, A, s]], new Vector3(0, h / 4, 0)); hoehe = h;
        linien.push({ key: 'l', von: [-l / 2, 0, -b / 2 - o], bis: [l / 2, 0, -b / 2 - o] });
        linien.push({ key: 'b', von: [l / 2 + o, 0, -b / 2], bis: [l / 2 + o, 0, b / 2] });
        linien.push({ key: 'h', von: [0, 0, 0], bis: [0, h, 0] });
        break;
      }
      case 'zylinder': case 'kegel': {
        const dm = d['d'], h = d['h'];
        mesh = CreateCylinder('k', { height: h, diameterBottom: dm, diameterTop: a.koerper === 'kegel' ? 0 : dm, tessellation: 72 }, this.scene);
        mesh.position.y = h / 2; hoehe = h;
        this.kreis(dm / 2, 0, wurzel); if (a.koerper === 'zylinder') this.kreis(dm / 2, h, wurzel);
        const yd = a.koerper === 'zylinder' ? h + o : 0;
        linien.push({ key: 'd', von: [-dm / 2 * 0.707, yd, -dm / 2 * 0.707], bis: [dm / 2 * 0.707, yd, dm / 2 * 0.707] });
        linien.push(a.koerper === 'kegel'
          ? { key: 'h', von: [0, 0, 0], bis: [0, h, 0] }
          : { key: 'h', von: [dm / 2 * 0.707 + o, 0, -dm / 2 * 0.707 - o], bis: [dm / 2 * 0.707 + o, h, -dm / 2 * 0.707 - o] });
        break;
      }
      case 'rohr': {
        const ra = d['D'] / 2, ri = d['d'] / 2, h = d['h'];
        mesh = CreateLathe('k', { shape: [new Vector3(ri, 0, 0), new Vector3(ra, 0, 0), new Vector3(ra, h, 0), new Vector3(ri, h, 0), new Vector3(ri, 0, 0)], tessellation: 72, sideOrientation: Mesh.DOUBLESIDE }, this.scene);
        hoehe = h;
        this.kreis(ra, 0, wurzel); this.kreis(ra, h, wurzel); this.kreis(ri, h, wurzel);
        const q = 0.707;
        linien.push({ key: 'D', von: [-ra * q, h + o * 2, -ra * q], bis: [ra * q, h + o * 2, ra * q] });
        linien.push({ key: 'd', von: [-ri * q, h + o * 0.9, -ri * q], bis: [ri * q, h + o * 0.9, ri * q] });
        linien.push({ key: 'h', von: [ra * q + o, 0, -ra * q - o], bis: [ra * q + o, h, -ra * q - o] });
        break;
      }
      case 'kugel': default: {
        const dm = d['d'];
        mesh = CreateSphere('k', { diameter: dm, segments: 48 }, this.scene);
        mesh.position.y = dm / 2; hoehe = dm;
        linien.push({ key: 'd', von: [-dm / 2 * 0.707, dm / 2, dm / 2 * 0.707], bis: [dm / 2 * 0.707, dm / 2, -dm / 2 * 0.707] });
        break;
      }
    }
    mesh.material = mat; mesh.parent = wurzel;
    if (['rechteck', 'dreiecksflaeche', 'trapez', 'dreieck', 'quader', 'wuerfel', 'pyramide'].includes(a.koerper)) kanten(mesh);

    // Boden (leichter Schatten) unter dem Körper
    const radius = Math.max(...Object.values(d)) * 0.8;
    const boden = CreateDisc('boden', { radius, tessellation: 64 }, this.scene);
    boden.rotation.x = Math.PI / 2; boden.position.y = -0.005; boden.parent = wurzel;
    const bm = new StandardMaterial('boden', this.scene);
    bm.diffuseColor = Color3.Black(); bm.alpha = 0.12; bm.specularColor = Color3.Black(); boden.material = bm;

    // Maßlinien mit kurzen Endstrichen
    for (const ml of linien) {
      const von = new Vector3(...ml.von), bis = new Vector3(...ml.bis);
      const richtung = bis.subtract(von).normalize();
      const quer = Math.abs(richtung.y) > 0.9 ? new Vector3(0.12, 0, 0) : new Vector3(0, 0.12, 0);
      const linie = CreateLines('mass', { points: [von, bis] }, this.scene);
      const e1 = CreateLines('mass', { points: [von.subtract(quer), von.add(quer)] }, this.scene);
      const e2 = CreateLines('mass', { points: [bis.subtract(quer), bis.add(quer)] }, this.scene);
      [linie, e1, e2].forEach(x => { x.color = this.akzent; x.parent = wurzel; x.renderingGroupId = 1; });
      const el = document.createElement('div');
      el.className = 'v3d-label'; el.textContent = a.beschriftung[ml.key] ?? ml.key;
      if ((a.beschriftung[ml.key] ?? '').includes('?')) el.classList.add('gesucht');
      this.labelHost.appendChild(el);
      this.labels.push({ el, p: von.add(bis).scale(0.5) });
    }

    this.kamera.setTarget(new Vector3(0, hoehe / 2, 0));
    // Beim Wechsel des Körpers: Flächen eher von oben zeigen, Körper schräg von der Seite
    if (a.koerper !== this.letzterKoerper) {
      const flach = a.koerper === 'rechteck' || a.koerper === 'dreiecksflaeche';
      if (flach !== (this.letzterKoerper === 'rechteck' || this.letzterKoerper === 'dreiecksflaeche') || !this.letzterKoerper) this.kamera.beta = flach ? 0.75 : Math.PI / 2.9;
      this.letzterKoerper = a.koerper;
    }
    this.basisRadius = Math.max(8.5, Math.max(...Object.values(d)) * 2.2);
    this.radiusAnpassen();
  }

  /** Gerades Prisma: Profil in (z, y), entlang x mit Länge l */
  private prisma(profil: [number, number][], l: number): Mesh {
    const P = (x: number, [z, y]: [number, number]) => new Vector3(x, y, z);
    const vorne = profil.map(p => P(l / 2, p)), hinten = profil.map(p => P(-l / 2, p));
    const flaechen: Vector3[][] = [vorne, [...hinten].reverse()];
    for (let i = 0; i < profil.length; i++) {
      const j = (i + 1) % profil.length;
      flaechen.push([vorne[i], hinten[i], hinten[j], vorne[j]]);
    }
    const yMitte = profil.reduce((s, p) => s + p[1], 0) / profil.length;
    return this.polyeder(flaechen, new Vector3(0, yMitte, 0));
  }

  /** Konvexer Körper aus ebenen Flächen, flach schattiert, mit planaren UVs */
  private polyeder(flaechen: Vector3[][], mitte: Vector3): Mesh {
    const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
    for (const fl of flaechen) {
      let n = Vector3.Cross(fl[1].subtract(fl[0]), fl[2].subtract(fl[0])).normalize();
      const zentrum = fl.reduce((s, p) => s.add(p), Vector3.Zero()).scale(1 / fl.length);
      if (Vector3.Dot(n, zentrum.subtract(mitte)) < 0) n = n.scale(-1);
      const u = fl[1].subtract(fl[0]).normalize(), v = Vector3.Cross(n, u);
      const basis = pos.length / 3;
      fl.forEach(p => {
        pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z);
        const r = p.subtract(fl[0]); uv.push(Vector3.Dot(r, u) / 1.4, Vector3.Dot(r, v) / 1.4);
      });
      for (let k = 1; k < fl.length - 1; k++) idx.push(basis, basis + k, basis + k + 1);
    }
    const vd = new VertexData();
    vd.positions = pos; vd.normals = nor; vd.uvs = uv; vd.indices = idx;
    const m = new Mesh('k', this.scene); vd.applyToMesh(m);
    return m;
  }

  private kreis(r: number, y: number, parent: TransformNode): void {
    const pts: Vector3[] = [];
    for (let i = 0; i <= 72; i++) { const w = i / 72 * Math.PI * 2; pts.push(new Vector3(Math.cos(w) * r, y, Math.sin(w) * r)); }
    const l = CreateLines('rand', { points: pts }, this.scene);
    l.color = this.tinte; l.alpha = 0.6; l.parent = parent;
  }

  private basisRadius = 8;
  private letzterKoerper: KoerperId | null = null;
  /** Schmale/kleine Ansicht (Handy): Kamera weiter weg, damit Körper und Beschriftungen ganz zu sehen sind */
  private radiusAnpassen(): void {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    const faktor = Math.max(1, 0.95 / (w / h), Math.pow(520 / w, 0.7));
    this.kamera.radius = this.basisRadius * faktor;
  }

  private labelsSetzen(): void {
    if (!this.labels.length) return;
    const w = this.engine.getRenderWidth(), h = this.engine.getRenderHeight();
    const sx = this.canvas.clientWidth / w, sy = this.canvas.clientHeight / h;
    const vp = this.kamera.viewport.toGlobal(w, h);
    const tm = this.scene.getTransformMatrix();
    for (const l of this.labels) {
      const p = Vector3.Project(l.p, Matrix.Identity(), tm, vp);
      l.el.style.transform = `translate(${p.x * sx}px, ${p.y * sy}px) translate(-50%, -50%)`;
    }
  }

  zerstoeren(): void {
    this.tot = true;
    this.ro.disconnect();
    this.labels.forEach(l => l.el.remove()); this.hinweis.remove();
    this.engine.stopRenderLoop();
    this.scene.dispose(); this.engine.dispose();
  }
}

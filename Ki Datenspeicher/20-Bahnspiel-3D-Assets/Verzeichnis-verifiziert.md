---
tags: [bahnspiel-3d, verzeichnis, verifiziert]
autor: Claude
datum: 2026-10-17
---

# Verifiziertes Verzeichnis: 3D-Assets, Lizenzen, Techniken (Bahnspiel)

Jeder Eintrag wurde von Claude am **2026-10-17** per WebFetch/WebSearch selbst auf der Zielseite gelesen.
Die App-Repo ist **öffentlich** → Spalte „Repo-tauglich“ beachten. Keine Rechtsberatung; vor Einbau Lizenzseite des konkreten Assets erneut lesen.

Legende Repo-tauglich: ✅ ohne Auflagen · 🟡 mit Namensnennung/Share-Alike-Auflage · ❌ nicht empfohlen

## 1. Plattformen und ihre Lizenzen

| Plattform | Lizenz (geprüft) | Kommerziell | Attribution | Repo-tauglich | Beleg |
|---|---|---|---|---|---|
| Kenney | CC0 | ja | nicht nötig (Logo nicht verwenden) | ✅ | https://kenney.nl/support |
| Poly Haven (HDRIs, Texturen, Modelle) | CC0 | ja, auch Weiterverkauf in Produkten | nicht nötig | ✅ | https://polyhaven.com/license |
| Quaternius | „All models are under the CC0 License“ | ja | nicht nötig | ✅ | https://quaternius.com/faq.html |
| OpenGameArt | je Asset verschieden (CC0 / CC-BY / CC-BY-SA / GPL) – **jede Seite einzeln lesen** | je Lizenz | je Lizenz | je Asset | s. Einzelfund |
| Sketchfab | je Modell CC-Lizenz oder Standardlizenz – Hilfeseite nicht abrufbar (404), **nicht verifiziert** | offen | offen | ❌ bis geprüft | – |

Hinweis Poly-Haven: Die Website-Texte/Logos/Beispielrenders sind **nicht** CC0 (nur die Assets). Scraping nur mit Erlaubnis.

## 2. Modelle (geprüfte Einzelfunde)

| Asset | Inhalt | Format | Lizenz | Polygone | Repo-tauglich | Link |
|---|---|---|---|---|---|---|
| **Kenney Train Kit** (v1.1, ab 2024) | 45+ Zug-/Gleis-Modelle inkl. Gleisteile (Railroad, Damaged railroad, Rail) | auf Seite nicht genannt (Kenney-Kits typisch GLB/FBX/OBJ – **nicht verifiziert**, Download liefert 403 per Skript) | CC0 | Low Poly (Zahl nicht belegt) | ✅ | https://kenney.nl/assets/train-kit · Vorstellung: https://www.blendernation.com/2024/08/21/free-download-train-kit/ |
| **Locomotive** (Autor 32kda, OpenGameArt, 2026-03-20) | fiktive Dampf-/Diesellok | .blend, .glb (laut Tags), ZIP 3,5 MB | CC0 | 10.305 Vertices / 9.256 Faces (mittel, für Web okay) | ✅ | https://opengameart.org/content/locomotive-1 |
| Steam Train Low Poly (rick237, itch.io) | Dampflok-Paket | – | **CC BY-SA 4.0** (laut Suchergebnis, Zielseite nicht selbst gelesen) | ca. 1.832 Dreiecke | 🟡 Share-Alike | https://rick237.itch.io/steam-train-low-poly |

Nicht gefunden (ehrlich): frei lizenzierte **deutsche** Prototypen (ICE, BR 101, S-Bahn), **Weichen**, **deutsche Signale**, **Gleisbaumaschinen** (Stopfmaschine etc.) und **Oberleitung** als verifiziert CC0/CC-BY-Modell. Hier lohnt gezielte Suche auf Sketchfab (Filter „Downloadable“ + CC0/CC-BY) und eigene Modellierung. Eigenbau aus Kenney-Gleisteilen + Blender ist die sichere Variante.

## 3. Blender-Addons / Werkzeuge für Gleise (bezahlt/unklar)

| Name | Art | Hinweis | Link |
|---|---|---|---|
| Auto Rails (milotc) | Geometry-Nodes-Asset, laut Suchergebnis kostenlos | **Preis/Lizenz nicht verifiziert** (Seite nicht lesbar), kann in Blender ≥ 3.4 Probleme machen | https://milotc.gumroad.com/l/autorails |
| 3DT Train & Rail Generator | Blender-4-Addon, bezahlt; Schienen+Schwellen aus einer Kurve | Lizenz nicht geprüft | https://superhivemarket.com/products/blender-3dt-train--rail-generator |
| Customizable Railroad Tracks (Ryan King) | bezahlt; Array + Curve | Lizenz nicht geprüft | https://ryankingart.gumroad.com/l/Railroad-Tracks |

## 4. Texturen für Schienenfehler-Lernanimationen (Wikimedia Commons, Lizenz geprüft)

Kategorie: https://commons.wikimedia.org/wiki/Category:Rail_defects (33 Dateien)

| Datei | Motiv | Lizenz | Repo-tauglich |
|---|---|---|---|
| [Rail squat.png](https://commons.wikimedia.org/wiki/File:Rail_squat.png) | Squat | Public Domain (US-DOT-Werk, PD-USGov-DOT); Quelle: „Rolling Contact Fatigue: A Comprehensive Review“ | ✅ |
| [Gauge Corner Cracking.png](https://commons.wikimedia.org/wiki/File:Gauge_Corner_Cracking.png) | Head Checks / Gauge Corner Cracking | Public Domain (PD-USGov-DOT) | ✅ |
| [Riffelbildung Bogeninnenschiene Detail.jpg](https://commons.wikimedia.org/wiki/File:Riffelbildung_Bogeninnenschiene_Detail.jpg) | Riffeln, Bogeninnenschiene | CC BY-SA 4.0, Janhajk, 2015 | 🟡 Namensnennung + Share-Alike |

Weitere Dateien der Kategorie (Riffeln aus dem Staatsarchiv Ludwigsburg, „Kurze Wellen“, „Sinkopas“ UIC60 u. a.) sind **nicht** einzeln auf Lizenz geprüft.

## 5. Techniken und Tutorials

| Thema | Befund | Beleg |
|---|---|---|
| Gleis mit Array + Curve-Modifier | Schwelle modellieren, Array- und Curve-Modifier; Problem: Schwellen stehen im Bogen u. U. nicht rechtwinklig → NURBS statt Bézier. Forum, kein Video. | https://blenderartists.org/t/arrays-and-dupligroups-for-railway/484523 |
| BlenderGuru-Serie (Array/Curve für Gleise im U-Bahn-Projekt) | Teil einer Serie von Andrew Price, nur über Sekundärlisting gesehen | https://lesterbanks.com/?p=8514 |
| Pantograph-Rig | Kein dediziertes Tutorial gefunden; Forenthread mit IK + Stretch-To | https://blenderartists.org/t/locomotive-train-pantograph-rig-yoke-assembly/1398219 |
| Lokrad-Rig | Kurs „Rigging Train Wheels in Blender“ (CG Cookie, **bezahlt**): Locked Track, Copy Location, Shrinkwrap | https://cgcookie.com/courses/rigging-train-wheels-in-blender |
| IK-Grundlagen | Blender Education Rigging Foundation Level 3 | https://education.blender.org/blender_badges/rigging/foundation-badge-level-3 |
| glTF-Export | Blender-Addon „glTF 2.0“ standardmäßig aktiv (File ▸ Export); unterstützt Meshes, Principled BSDF, Texturen, Keyframe-/Shape-Key-/Skinning-Animation; Texturen nur PNG/JPEG (andere werden konvertiert) | https://docs.blender.org/manual/en/5.2/addons/scene_gltf2.html |
| Optimierung | `gltf-transform optimize in.glb out.glb --compress draco --texture-compress webp`; auch meshopt, KTX (etc1s/uastc) | https://gltf-transform.dev/cli |
| Validierung | Khronos glTF-Validator, läuft lokal im Browser | https://github.khronos.org/glTF-Validator/ |
| three.js | MIT-Lizenz (© three.js authors); GLTFLoader + DRACOLoader; Cleanup in `ngOnDestroy` nötig (Geometrien, Materialien **und** Texturen einzeln disposen, Szene traversieren) | https://raw.githubusercontent.com/mrdoob/three.js/dev/LICENSE · https://discourse.threejs.org/t/how-to-dispose-and-destroy-gltf-object-completely/24761 |
| Babylon.js | Apache-2.0; glTF-Loader aus `@babylonjs/loaders`, dynamische Registrierung `registerBuiltInLoaders()`; `ImportMeshAsync` (SceneLoader gilt als Legacy) | https://doc.babylonjs.com/features/featuresDeepDive/importers/loadingFileTypes · https://github.com/BabylonJS/Babylon.js/blob/master/license.md |
| Ionic-Besonderheit | Ionic cached Seiten auf dem Navigations-Stack → Render-Loop/Cleanup zusätzlich in `ionViewWillLeave`, nicht nur `ngOnDestroy` (Hinweis aus Suchergebnis, nicht in Doku geprüft) | – |

## 6. Empfehlung für die App (öffentliches Repo, kommerziell möglich)

1. **Nur CC0-Assets** ins Repo legen (Kenney, Quaternius, Poly Haven, OGA-CC0). Dann entfällt jede Attributionspflicht.
2. CC-BY-/CC-BY-SA-Material nur mit Eintrag in einer Credits-Seite (und die App hat bereits `/rechte` und `/quellenverzeichnis` als Vorbild). CC-BY-SA ist für Texturen eher unkritisch, für Code-nahe Mischung aber vermeiden.
3. Gleise: Kenney Train Kit als Start, Lern-Animationen (Verschleiß, Riffeln) mit eigenem Blender-Modell + PD-Bildern aus Abschnitt 4.
4. Engine: three.js (MIT, kleiner Einstieg) oder Babylon.js (Apache-2.0, eingebaute Physik/Inspector).

// Themenliste Bahnspiel-3D-Assets (Vault-Ordner 20). Reihenfolge = Prioritaet.
// Gwen liefert Rohfunde (unverifiziert), Claude prueft jeden Link/jede Lizenz selbst.
module.exports = [
 // ---- A: Modelle ----
 ['A01','Zuege-Lokomotiven-Wagen','3D-Modelle: Zuege, Lokomotiven, Triebwagen, Wagen (frei/kommerziell nutzbar)',[
  'Welche frei nutzbaren 3D-Modelle (Blender .blend, .fbx, .glb/.gltf) von Lokomotiven, Triebwagen, Zuegen oder Eisenbahnwagen gibt es (Sketchfab, OpenGameArt, Kenney, Quaternius, BlenderKit, TurboSquid-Free)? Pro Fund: Name, exakte URL, Format, Lizenz, Polygonzahl.',
  'Welche davon sind CC0 oder anderweitig kommerziell nutzbar ohne Namensnennung?',
  'Welche Modelle sind deutsche Prototypen (ICE, BR 101, BR 218, S-Bahn, Regio, Gueterwagen)? Nur echte Funde.',
  'Gibt es Low-Poly-Sets (Kenney Train Kit o. ae.) die sich fuer ein Web-Spiel eignen?']],
 ['A02','Schienen-Weichen-Schwellen-Schotter','3D-Modelle und Texturen: Schienen, Weichen, Schwellen, Schotter, Gleis-Bausaetze',[
  'Welche frei nutzbaren Gleis-/Schienen-Modelle oder Gleis-Bausaetze (Track Kits, Rail Packs) gibt es? Name, URL, Format, Lizenz, Polygonzahl.',
  'Gibt es Weichen- und Kreuzungsmodelle (frei)?',
  'Gibt es Schotter-/Gleisbett-Texturen oder -Modelle (Poly Haven, ambientCG)? Lizenz angeben.',
  'Gibt es Blender-Addons oder Assets fuer prozedurale Gleise (z. B. Rail-/Track-Generator)? Name, URL, Lizenz.']],
 ['A03','Oberleitung-Signale-Infrastruktur','3D-Modelle: Oberleitung, Masten, Signale, Bahnuebergaenge, Schranken',[
  'Welche frei nutzbaren Modelle fuer Oberleitung, Fahrleitungsmasten, Signale, Andreaskreuz, Schranken, Bahnuebergaenge gibt es? Name, URL, Format, Lizenz.',
  'Gibt es deutsche Signale (Ks-Signal, Hl-Signal, Formsignal) als freies 3D-Modell?',
  'Gibt es Kabelmasten, Weichenlaternen, Prellboecke, Bahnsteigelemente?',
  'Polygonzahl/Qualitaet der Funde.']],
 ['A04','Gleisbaumaschinen-Baufahrzeuge','3D-Modelle: Gleisbaumaschinen, Baufahrzeuge, Zweiwegebagger, Kran',[
  'Welche frei nutzbaren 3D-Modelle von Gleisbaumaschinen (Stopfmaschine, Planiermaschine, Schienenkran, Zweiwegebagger, Rottenkraftwagen) gibt es?',
  'Welche allgemeinen Baufahrzeug-Modelle (Bagger, Kran, LKW) sind frei nutzbar (Kenney, Quaternius, Sketchfab CC0)?',
  'Name, URL, Format, Lizenz, Polygonzahl der Funde.',
  'Werden Modelle von Plasser & Theurer o. ae. frei angeboten? Nur belegt.']],
 ['A05','Bahnhoefe-Gebaeude-Umgebung','3D-Modelle: Bahnhoefe, Bahnsteige, Gebaeude, Umgebung, Landschaft',[
  'Welche frei nutzbaren Bahnhofs-/Bahnsteig-/Gebaeude-Modelle gibt es (Sketchfab, Kenney, Quaternius, OpenGameArt)? Name, URL, Format, Lizenz.',
  'Welche Umgebungs-Assets (Baeume, Gras, Felsen, Strassen, Zaeune, HDRIs) von Poly Haven, Kenney, Quaternius sind CC0?',
  'Gibt es modulare Stadt-/Landschafts-Kits fuer Low-Poly-Spiele?',
  'Polygonzahl/Qualitaet.']],
 ['A06','Asset-Plattformen-und-Lizenzen','Asset-Plattformen: Poly Haven, Kenney, Quaternius, OpenGameArt, Sketchfab, BlenderKit, TurboSquid, Blend Swap',[
  'Welche Lizenzbedingungen gelten bei: Poly Haven, Kenney, Quaternius, OpenGameArt (CC0/CC-BY/GPL), Sketchfab (CC-Lizenzen, Standard), BlenderKit (Royalty Free/CC0), TurboSquid Free, Blend Swap? Offizielle URL der Lizenzseite pro Plattform.',
  'Was bedeutet CC0, CC-BY, CC-BY-SA, CC-BY-NC fuer ein Spiel in einem OEFFENTLICHEN Git-Repository mit kommerzieller Nutzung?',
  'Wie muss die Namensnennung (Attribution) bei CC-BY erfolgen?',
  'Duerfen Assets mit Sketchfab-Standardlizenz in einem oeffentlichen Repo liegen?']],
 // ---- B: Animation/Rigs ----
 ['B01','Raeder-Antrieb-Rigs','Animation und Rigs: Raeder, Drehgestelle, Treibstangen, Zugbewegung entlang Kurve',[
  'Wie baut man in Blender ein Rig fuer Lokomotivraeder und Treibstangen (Constraints, Drivers)? Tutorial-Links mit Titel/Autor.',
  'Wie bewegt man einen Zug entlang einer Kurve (Follow Path, Curve Modifier, Drehgestelle)? Tutorial-Links.',
  'Gibt es frei nutzbare Lok-Rigs oder animierte Eisenbahn-Modelle (.blend/.glb mit Animation)?',
  'Wie exportiert man diese Animationen nach glTF?']],
 ['B02','Pantograph-Weichenzungen-Schranken-Kran','Animation: Pantograph, Weichenzungen, Schranken, Kran, Hydraulik',[
  'Tutorial/Anleitung: Pantograph (Stromabnehmer) in Blender riggen (IK, Constraints). Links mit Titel/Autor.',
  'Tutorial: Weichenzungen/Weichenstellung animieren (Shape Keys, Armature).',
  'Tutorial: Bahnschranke / Kran / Hydraulikzylinder riggen (Track-To, Armature).',
  'Gibt es dafuer freie Beispielmodelle (.blend/.glb)?']],
 // ---- C: Techniken ----
 ['C01','Schienen-Modeling-Blender','Schienen modellieren in Blender: Curves, Array, Schwellen',[
  'Tutorial: Gleis in Blender modellieren (Curve + Array-Modifier + Curve-Modifier, Schwellen, Schienenprofil). Links mit Titel/Autor/Plattform.',
  'Wie modelliert man das Schienenprofil (S49 / 60E1) massstabsgetreu? Quelle fuer Masse.',
  'Wie macht man Gleisboegen mit Ueberhoehung in Blender?',
  'Welche Blender-Version wird in den Tutorials verwendet (Aktualitaet)?']],
 ['C02','Procedural-Track-Geometry-Nodes','Prozedurale Gleise mit Geometry Nodes und Addons',[
  'Tutorials/Assets fuer Gleise mit Geometry Nodes (Curve to Mesh, Instance on Points) in Blender 3.x/4.x. Links.',
  'Welche Blender-Addons erzeugen Gleise/Weichen (frei oder kostenpflichtig)? Name, URL, Lizenz, Preis.',
  'Wie exportiert man prozedurale Geometrie (Realize Instances, Apply) fuer glTF?',
  'Gibt es bereits fertige Geometry-Nodes-Gleis-Assets (Blender Market, Gumroad, GitHub)? Lizenz.']],
 ['C03','Schienenfehler-Darstellung','Schienenfehler und Verschleiss fuer Lernanimationen darstellen (Riffeln, Head Checks, Gleislagefehler)',[
  'Welche Bilder/Grafiken/Modelle zu Schienenfehlern (Riffeln, Head Checks, Squats, Abplatzungen, Verschleiss) sind frei lizenziert (Wikimedia Commons)? URL + Lizenz.',
  'Wie stellt man Riffeln/Verschleiss in Blender dar (Displacement, Normal Maps, Shape Keys fuer Verschleiss-Animation)? Tutorials.',
  'Wie kann man Gleislagefehler (Verwindung, Hoehenfehler, Richtungsfehler) visuell uebertrieben animieren? Ideen mit Quelle.',
  'Gibt es wissenschaftliche/DB-Quellen mit Schadensbildkatalog (UIC 712, DB-Schadenskatalog) die man verlinken kann?']],
 // ---- D: Export/Web ----
 ['D01','Export-glTF-aus-Blender','Export nach glTF/GLB aus Blender fuer Web',[
  'Offizielle Blender-Doku zum glTF-Export (URL) und wichtige Optionen (Apply Modifiers, Draco, Animation, Materials).',
  'Typische Fehler (Materialien, Skalierung, Y-up/Z-up, Shape Keys) und Loesungen.',
  'Wie werden Texturen komprimiert (KTX2/Basis, WebP)? Tools (gltf-transform, gltfpack).',
  'Wie validiert man glTF (Khronos glTF-Validator)?']],
 ['D02','threejs-Babylonjs-Ionic','three.js und Babylon.js in einer Ionic/Angular-App',[
  'Wie bindet man three.js in eine Angular/Ionic-App ein (npm-Paket, Canvas, OnDestroy-Cleanup)? Tutorials/Doku-Links.',
  'Wie bindet man Babylon.js in Angular ein? Offizielle Doku-URL.',
  'Wie laedt man GLB-Modelle (GLTFLoader, DRACOLoader / SceneLoader) und spielt Animationen (AnimationMixer)?',
  'Vergleich three.js vs. Babylon.js fuer ein kleines Lernspiel (Physik, Bundlegroesse, Lizenz MIT/Apache).']],
 ['D03','Web-Optimierung-LOD','Performance: Polygonbudget, LOD, Instancing, Texturgroessen fuer mobile Web-3D',[
  'Empfohlene Polygon-/Texturbudgets fuer mobile WebGL-Spiele (Quelle).',
  'Wie nutzt man Instancing fuer viele Schwellen/Schotter (InstancedMesh)?',
  'Wie reduziert man Polygone in Blender (Decimate, Remesh)?',
  'Ladezeiten: Draco, Meshopt, Lazy Loading in Ionic.']],
];

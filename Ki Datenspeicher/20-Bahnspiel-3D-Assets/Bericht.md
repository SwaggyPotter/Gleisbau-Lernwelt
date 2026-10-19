---
tags: [bahnspiel-3d, bericht]
autor: Claude
datum: 2026-10-17
---

# Bericht: Recherche Bahnspiel-3D-Assets (Stand 2026-10-19)

## Vorgehen
- 14 Themen angelegt (A01–A06 Modelle/Plattformen/Lizenzen, B01–B02 Animation, C01–C03 Techniken inkl. Schienenfehler, D01–D03 Export/Web).
- Gwen-Lauf (90 min Budget) mit Asset-Prompt gestartet; Ergebnisse siehe `Fortschritt.md` und `Themen/`. **Rohfunde sind unverifiziert.**
- Parallel hat Claude direkt per WebFetch/WebSearch geprüft → [[Verzeichnis-verifiziert]].

## Wichtigste Ergebnisse (verifiziert)
1. **Sicher einsetzbar (CC0):** Kenney (Train Kit, 45+ Modelle), Quaternius, Poly Haven, OpenGameArt „Locomotive“ (32kda, .blend/.glb, ~10k Vertices).
2. **Lücken:** keine verifizierten freien deutschen Loks (ICE/BR 101), Weichen, Signale, Oberleitung, Gleisbaumaschinen → Eigenbau in Blender empfohlen (Gleisteile aus dem Kenney Kit als Basis).
3. **Schienenfehler-Bilder:** zwei Public-Domain-Grafiken (Rail squat, Gauge Corner Cracking, US-DOT) + eine CC-BY-SA-Riffel-Aufnahme.
4. **Tutorials:** kostenlose, konkrete Anleitungen sind dünn (Forenthreads statt Videos); Pantograph-Rig-Tutorial nicht gefunden; Bezahlkurse/Addons vorhanden (Lizenz nicht geprüft).
5. **Web-Pipeline:** Blender-glTF-Export → `gltf-transform optimize` (Draco/WebP) → three.js (MIT) oder Babylon.js (Apache-2.0); Cleanup-Falle in Angular/Ionic.

## Offen / nicht verifiziert
- Kenney-Train-Kit-Dateiformate (Download blockt Skripte, 403) → Tim lädt manuell und prüft ZIP.
- Sketchfab-Lizenzseite (404) → vor Nutzung eines Sketchfab-Modells Lizenz direkt am Modell lesen.
- Gwen-Rohfunde: Auswertung folgt nach Lauf-Ende (Quote toter URLs, Fabrikationen).

## Nachtrag 2026-10-19
- Gwen-Lauf scheiterte nach ca. 4 Minuten (Schnellfehlschläge, kein Modell geladen) — keine Rohfunde; Quote toter URLs daher nicht ermittelbar.
- Review-Seite `/bahnspiel-assets` live, Tims Auswahl: [[Entscheidungen-Tim]].
- Kenney Train Kit: **103 GLB/FBX/OBJ** im ZIP (CC0, Lizenzdatei liegt bei), 28 GLB sind eingebunden. Download funktioniert nur mit Referer-Header.
- 3D-Engine + Modellseite gebaut, siehe [[Uebergabe-naechster-Chat]].

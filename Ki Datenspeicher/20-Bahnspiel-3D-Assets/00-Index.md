---
tags: [bahnspiel-3d, index, meta]
autor: Claude
datum: 2026-10-17
---

# Bahnspiel-3D-Assets — Index

Auftrag von Tim (2026-10-17): Recherche, welche 3D-Assets (Blender-Modelle), Rigs/Animationen, Tutorials und Export-Techniken es für ein
geplantes kleines Bahnspiel/3D-Lernspiel gibt — **immer mit Lizenz** (App-Repo ist öffentlich). Aufbau wie Ordner 19.

| Datei/Ordner | Inhalt |
|---|---|
| [[Verzeichnis-verifiziert]] | **Nur von Claude geprüfte** Funde (Link + Lizenz selbst gelesen). Hier zuerst nachschlagen. |
| `Themen/` | 14 Themen-Dateien (A = Modelle/Plattformen, B = Animation, C = Techniken, D = Export/Web). Fragen von Claude, Rohfunde von Gwen — **unverifiziert**. |
| `URL-Check/` | Automatische Erreichbarkeitsprüfung der Gwen-URLs. |
| [[Entscheidungen-Tim]] | Tims Auswahl (behalten/vielleicht/raus) mit fachlichen Korrekturen. |
| [[Uebergabe-naechster-Chat]] | Zustand + Startprompt für die nächste Session. |
| `Fortschritt.md` | Status des Gwen-Laufs (Start 2026-10-17 ~14:21, Budget 90 min). |
| [[Bericht]] | Ergebnis, Gwen-Qualität, Lücken. |

Pipeline: `tools/bahnspiel-assets/` (`topics.cjs`, `generate-topics.cjs`, `run-recherche.cjs`, Kopie der Wissensbibliothek-Pipeline mit Asset-Prompt).
Start: `node tools/bahnspiel-assets/run-recherche.cjs --minutes 90` (PowerShell `Start-Process`); Abbruch per Datei `tools/wissensbibliothek/STOP` bzw. `tools/bahnspiel-assets/STOP`.

Regel: Ein Gwen-Fund wandert nur ins Verzeichnis, wenn Claude die Seite selbst per WebFetch gelesen und Lizenz/Format bestätigt hat.

---
tags: [modul, zusatz, volumen]
autor: Claude
---

# Modul: Zusatz – Volumen

Route: `zusatz/volumen`
Pfad: `src/app/modules/zusatz/volumen/`

Rechentrainer für Volumenberechnung im Gleisbau, u. a. trapezförmige Profile/
Aushübe. 10 Aufgaben laut Code-Analyse. Zugehöriger Commit: `8df3b1e` "Volume calc"
(2026-02-17).

## Datenquelle

`src/assets/zusatz/volumen/content.json` + `quiz.json`, Schema siehe
[[02-Architektur/Datenmodell]].

## Aufbau

Gleiches Muster wie die anderen Zusatz-Module: `lesson-renderer` + `quiz-engine`
+ `*-nav` Komponenten, eigener `*-data.service.ts`, Fortschritt in `localStorage`.

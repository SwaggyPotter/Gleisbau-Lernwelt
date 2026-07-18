---
tags: [modul, zusatz, prozentrechnung]
autor: Claude
---

# Modul: Zusatz – Prozentrechnung

Route: `zusatz/prozentrechnung`
Pfad: `src/app/modules/zusatz/prozentrechnung/`

Rechentrainer für Prozentrechnung: Prozentwert, Rabatt, Erhöhung, Rückrechnung,
Toleranzen — mit Lektionsinhalt und Quiz.

## Datenquelle

`src/assets/zusatz/prozentrechnung/content.json` + `quiz.json`, Schema siehe
[[02-Architektur/Datenmodell]].

## Aufbau

Gleiches Muster wie [[03-Module/Zusatz-Nivellieren]] und
[[03-Module/Zusatz-Volumen]]: `lesson-renderer` + `quiz-engine` + `*-nav`
Komponenten, eigener `*-data.service.ts`, Fortschritt in `localStorage`.

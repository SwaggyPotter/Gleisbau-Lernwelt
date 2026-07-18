---
tags: [modul, themenquiz]
autor: Claude
---

# Modul: Themenquiz

Pfad: `src/app/modules/themenquiz/`

Wiederverwendbares Quiz-Feature für allgemeine Gleisbau-Grundlagen (nicht an die
14-Lernfelder-Nummerierung gebunden, sondern themenbasiert).

## Struktur

- `components/quiz-engine.component.ts` — die eigentliche Quiz-Logik/UI
- `models/themenquiz.models.ts` — siehe [[02-Architektur/Datenmodell]]
- `pages/themenquiz.page.ts` — Seiten-Komponente, per Route `themenquiz/:topicId`
- `services/themenquiz-data.service.ts` — lädt JSON, cached, verwaltet
  `localStorage`-Fortschritt
- `themenquiz.module.ts`, `themenquiz.routes.ts`

## Verfügbare Themen (`src/assets/themenquiz/*.json`)

`topics.json` (Themenliste) plus je eine Datei pro Thema:

- `grundlagen` — Grundlagen
- `spurweite` — Spurweite
- `schiene` — Schiene
- `schwellen` — Schwellen
- `bettung` — Bettung
- `kleineisen` — Kleineisen
- `kleingeraete` — Kleingeräte
- `handwerkzeuge` — Handwerkzeuge
- `messmittel` — Messmittel
- `trassenplan` — Trassenplan

Jede Datei enthält Fragen im Format `ThemenquizQuestion` (Frage, Antwortoptionen,
Index der richtigen Antwort, Erklärung).

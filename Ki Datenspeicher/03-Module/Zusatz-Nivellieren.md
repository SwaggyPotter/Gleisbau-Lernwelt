---
tags: [modul, zusatz, nivellieren]
autor: Claude
---

# Modul: Zusatz – Nivellieren

Route: `zusatz/nivellieren`
Pfad: `src/app/modules/zusatz/nivellieren/`

Lerninhalt zum Thema **Nivellieren im Gleisbau** (Höhenmessung/Vermessung),
abgeleitet aus einem PDF-Leitfaden (`src/assets/PDF/Nivellieren_im_Gleisbau_Leitfaden.pdf`).

**Historische Besonderheit**: Intern trägt das Modul noch den alten Namen
`lernfeld-02` — Dateien wie `lernfeld-02.module.ts`, `lernfeld-02.routes.ts`,
`lf02-nav.component`, `lf02.models.ts`, `lf02-data.service.ts` — ein Überbleibsel
aus der Zeit, als dieser Inhalt Teil der nummerierten Lernfeld-1-14-Struktur war.
Die Route wurde auf `zusatz/nivellieren` umbenannt, der interne Code aber nicht
vollständig nachgezogen. Siehe [[07-Offene-Punkte/Offene-Punkte]].

## Datenquelle

`src/assets/zusatz/nivellieren/content.json` + `quiz.json`, Schema siehe
[[02-Architektur/Datenmodell]] (`ContentBlock`/`QuizFile`).

## Aufbau

Wie die anderen Lektions-Module: `lesson-renderer`-Komponente für Inhalte,
`quiz-engine`-Komponente für Fragen, eigene `*-nav`-Komponente, Fortschritt in
`localStorage`.

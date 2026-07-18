---
tags: [architektur, datenmodell]
autor: Claude
---

# Datenmodell (Frontend, aktueller Stand)

Alle Lern-Module im aktuellen Frontend (Themenquiz **und** die drei
Zusatz-Lerntools Nivellieren/Prozentrechnung/Volumen) teilen sich im Kern
dasselbe Inhalts-Schema — das ursprünglich für die alten Lernfelder entwickelt
wurde und seitdem weiterverwendet wird.

## Themenquiz-Modell (`src/app/modules/themenquiz/models/themenquiz.models.ts`)

```ts
ThemenquizQuestion { id, question, choices: string[], correctIndex, explanation }
ThemenquizFile      { topicId, title, questions: ThemenquizQuestion[] }
ThemenquizTopic     { topicId, title, description, questionCount }
ThemenquizProgress  { quizStats: Record<questionId, {correct, wrong}> }
```

Daten kommen aus `src/assets/themenquiz/topics.json` (Themenliste) und
`src/assets/themenquiz/<topicId>.json` (Fragen pro Thema), geladen per
`HttpClient` und mit `shareReplay` gecacht. Fortschritt liegt in `localStorage`
unter dem Key `themenquiz-progress-<topicId>`.

Verfügbare Themen (Dateien in `src/assets/themenquiz/`): `bettung`, `grundlagen`,
`handwerkzeuge`, `kleineisen`, `kleingeraete`, `messmittel`, `schiene`,
`schwellen`, `spurweite`, `trassenplan`.

## Zusatz-Tools-Modell (gemeinsames Schema, gilt für Nivellieren/Prozentrechnung/Volumen)

```ts
ContentBlock  { id, title, goals, summary, content: ContentEntry[], quizRef? }
ContentEntry  = TextEntry | ListEntry | CalloutEntry   // type: 'text' | 'list' | 'callout'
QuizQuestion  { id, block, type: 'mcq_single', question, choices, answer, explain, difficulty, tags }
QuizFile      { meta: { lernfeld, title, version }, questions: QuizQuestion[] }
BlockProgress { completedBlocks, quizStats }
```

Wichtig: Dieses Schema (`ContentBlock`/`QuizFile` mit `meta.lernfeld`) ist
**identisch mit dem Schema, das früher für die echten Lernfeld-Inhalte benutzt
wurde** (siehe `LERNFELDER-BACKUP.txt`). Das `nivellieren`-Modul trägt intern
sogar noch den alten Namen `lernfeld-02` (Dateien wie `lf02-data.service.ts`,
`lf02.models.ts`), obwohl es unter der Route `zusatz/nivellieren` läuft — ein
Überbleibsel aus der Zeit, als es Teil der Lernfeld-1-14-Struktur war.

Jedes Zusatz-Modul lädt seine Daten aus eigenen JSON-Dateien:
- Nivellieren: `src/assets/zusatz/nivellieren/content.json` + `quiz.json`
- Prozentrechnung: `src/assets/zusatz/prozentrechnung/content.json` + `quiz.json`
- Volumen: `src/assets/zusatz/volumen/content.json` + `quiz.json`
- Gesamtquiz: eine einzelne Datei `src/assets/zusatz/gesamtquiz/gesamtquiz-alle-module.json`
  (aggregiert Fragen aus den anderen drei Modulen)

Fortschritt jeweils in `localStorage`, kein Server-Sync.

## Backend-Datenmodell (separat, aktuell ungenutzt vom Frontend)

Siehe [[02-Architektur/Backend-Architektur]] — die Postgres-Tabelle
`learning_fields` (id/title/description/year/tag) und `user_progress` bilden ein
**drittes, unabhängiges** Modell derselben 14 Lernfelder. Es gibt also aktuell
drei parallele Repräsentationen der Lernfeld-Daten:

1. Alte Frontend-JSONs (gelöscht, nur noch in `LERNFELDER-BACKUP.txt`)
2. Backend-DB-Schema `learning_fields` (aktiv im Backend, aber nicht angebunden)
3. Der Backup-Text selbst als Rohdaten-Archiv

Falls die Lernfeld-Inhalte jemals reaktiviert werden, ist zu entscheiden, welches
dieser drei Modelle die Quelle der Wahrheit wird — siehe
[[07-Offene-Punkte/Offene-Punkte]].

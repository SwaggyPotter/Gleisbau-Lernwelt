---
tags: [lernfelder, status/archiviert]
autor: Claude
---

# Lernfelder – Übersicht

**Status: Nicht mehr im Frontend aktiv.** Die 14 Lernfelder waren früher der
Kern der App (eigene Detail-/Quiz-Seiten pro Lernfeld), wurden aber am
18.07.2026 aus `src/app` entfernt (siehe [[05-Update-Log/Update-Log]]). Die App
funktioniert seitdem themenbasiert (siehe [[03-Module/Übersicht]]).

## Die 14 Lernfelder (Ausbildungsrahmenplan-Struktur, Jahr 1–3)

Quelle: kanonische Seed-Liste in `backend/src/index.ts` (`lf-01` … `lf-14`).

| # | Titel | Jahr / Thema |
|---|---|---|
| 1 | Baustellen einrichten | Jahr 1 — Sicherheit & Organisation |
| 2 | Bauwerke erschließen und gründen | Jahr 1 — Erschließung & Gründung |
| 3 | Einschalige Baukörper mauern | Jahr 1 — Mauerwerk |
| 4 | Stahlbetonbauteile herstellen | Jahr 1 — Stahlbeton |
| 5 | Holzkonstruktionen herstellen | Jahr 1 — Holzbau |
| 6 | Bauteile beschichten und bekleiden | Jahr 1 — Oberflächen |
| 7 | Baugründe erkunden | Jahr 2 — Baugrund |
| 8 | Erdbauwerke errichten | Jahr 2 — Erdbau |
| 9 | Verkehrsflächen aus Pflaster- und Plattenbelägen herstellen | Jahr 2 — Pflaster |
| 10 | Gleisanlagen neu bauen | Jahr 2 — Neubau Gleis |
| 11 | Gleisbögen herstellen und einmessen | Jahr 3 — Gleisbögen |
| 12 | Weichen montieren und einmessen | Jahr 3 — Weichen |
| 13 | Weichen bauen und instand halten | Jahr 3 — Weichentechnik |
| 14 | Sonderbauformen und besondere Gleisanlagen herstellen und instand halten | Jahr 3 — Spezialthemen Gleisbau |

## Wo die Inhalte jetzt liegen

Alle Lerninhalte (Texte, Quizfragen, für Lernfeld 1 zusätzlich Puzzle-/
Szenario-Daten) wurden vor dem Löschen in eine einzige Datei gesichert:

**`LERNFELDER-BACKUP.txt`** (Projekt-Root, ~939 KB, ~31.850 Zeilen, erstellt
2026-07-18T13:28:24Z). Reine Textsicherung, kein aktiver Code-Pfad lädt diese
Datei — sie dient nur als Archiv, falls die Inhalte reaktiviert werden sollen.

Zeilen-Offsets der Abschnitte in `LERNFELDER-BACKUP.txt` (Suchmarker `LERNFELD N`):

| Lernfeld | Zeile (ca.) |
|---|---|
| 1 | 8 |
| 2 | 3909 |
| 3 | 6339 |
| 4 | 8640 |
| 5 | 10927 |
| 6 | 12925 |
| 7 | 14870 |
| 8 | 16470 |
| 9 | 18308 |
| 10 | 20457 |
| 11 | 22973 |
| 12 | 25235 |
| 13 | 27445 |
| 14 | 29835 |

Jeder Abschnitt enthält (laut Dateikopf) `lfNN-content.json` und `lfNN-quiz.json`;
Lernfeld 1 zusätzlich Puzzle-/Szenario-Daten.

## Drei parallele Repräsentationen

Aktuell existieren drei unabhängige Versionen der Lernfeld-Daten — siehe
[[02-Architektur/Datenmodell]] für Details:

1. `LERNFELDER-BACKUP.txt` (Archiv, Frontend-Format, nicht aktiv geladen)
2. Backend-DB-Tabelle `learning_fields` (aktiv im Backend, aber Backend ist
   nicht angebunden — siehe [[02-Architektur/Backend-Architektur]])
3. — (die alten Frontend-JSON-Dateien selbst existieren nicht mehr, nur noch
   als Backup)

## Verwandtes Modul

Das Zusatz-Modul [[03-Module/Zusatz-Nivellieren]] trägt intern noch den alten
Dateinamen `lernfeld-02`, ist im heutigen Dashboard aber als eigenständiges
Zusatztool unter `zusatz/nivellieren` eingebunden — nicht als Teil der 14
Lernfelder.

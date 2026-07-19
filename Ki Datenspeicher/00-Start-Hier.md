---
tags: [index, meta]
autor: Claude
---

# Start hier — Gleisbau Lernwelt Wissensspeicher

Dieser Vault ist der zentrale Wissensspeicher für das Projekt **Gleisbau Lernwelt**
(`E:\Gleisbau-Lernwelt`). Er ist für eine KI gedacht, die schnell verstehen soll:
was das Projekt ist, wie es aufgebaut ist, was zuletzt passiert ist, und was offen ist.

**Empfohlene Lesereihenfolge für eine neue KI-Session:**

1. [[01-Projekt/Projektüberblick]] — Was ist Gleisbau Lernwelt, für wen, welcher Tech-Stack
2. [[02-Architektur/Frontend-Architektur]] — Aktueller Aufbau der Angular/Ionic-App
3. [[02-Architektur/Backend-Architektur]] — Node/Express/Postgres-Backend (Status: verwaist)
4. [[02-Architektur/Datenmodell]] — Wie Inhalte/Fragen/Fortschritt modelliert sind
5. [[03-Module/Übersicht]] — Alle Module im Detail (Dashboard, Themenquiz, Zusatz-Tools)
6. [[04-Lernfelder/Lernfelder-Übersicht]] — Die 14 Lernfelder, aktueller Status
7. [[05-Update-Log/Update-Log]] — Chronologie aller wichtigen Änderungen
8. [[07-Offene-Punkte/Offene-Punkte]] — Was als Nächstes zu klären/entscheiden ist
9. [[06-Fragen-und-Antworten/Fragenkatalog]] — Häufige Fragen zum Projekt + Antworten
10. [[08-Recherche-Gwen/00-Rechercheauftrag-für-Gwen]] — Rechercheauftrag mit
    Fragenkatalog zu 15 Fachthemen, für ein lokales Modell (Gwen/Qwen via
    LM Studio) zur Bearbeitung
11. [[09-Fachwissen-Fragenkatalog/00-Übersicht]] — von Claude aus Gwens
    Rechercheergebnissen aufbereiteter Frage-Antwort-Katalog (aktuell 4 von
    15 Themen)

## Kurzfassung (falls nur 30 Sekunden Zeit sind)

- **Was**: Ionic/Angular-Lern-App für Gleisbau-Auszubildende (Bahnbau, Deutschland).
  Enthält Themenquiz, Rechentrainer (Nivellieren, Volumen, Prozentrechnung) und
  ehemals 14 "Lernfelder" (Ausbildungsinhalte Jahr 1–3).
- **Aktueller Zustand (Stand 2026-07-18)**: Die App wurde am 18.07.2026 stark
  vereinfacht. Admin-Panel, Login/Nutzerverwaltung, Profil und die alten
  Lernfeld-Detailseiten wurden **aus dem Frontend entfernt**. Die App läuft jetzt
  rein mit statischen JSON-Dateien (`src/assets/**`) + `localStorage` für
  Fortschritt — **kein Backend-Zugriff mehr im laufenden Frontend**.
- **Backend existiert weiterhin** (Express + Postgres, Login, Admin, Registrierungs-Keys,
  Nutzerverwaltung) und läuft per Docker Compose, ist aber aktuell **nicht an das
  Frontend angebunden** ("verwaist"/geparkt).
- **Die kompletten alten Lernfeld-Inhalte** (Texte, Quizfragen, für LF1 auch
  Puzzle/Szenarien) wurden vor dem Löschen komplett gesichert in
  `LERNFELDER-BACKUP.txt` (Projekt-Root, ~940 KB, reine Datensicherung).
- Dieser Vault wird von Tim gepflegt (bzw. von einer KI in seinem Auftrag) und soll
  auch von einem lokal über LM Studio laufenden Modell (Codename **Gwen**, z. B.
  Qwen) gelesen und bearbeitet werden können, um beim Projekt zu helfen —
  konkret: fachliche/rechtliche Recherche zu Gleisbau-Themen, siehe
  [[08-Recherche-Gwen/00-Rechercheauftrag-für-Gwen]].

## Autor-Kennzeichnung: Claude vs. Gwen

Damit im Vault immer erkennbar ist, wer welche Information geschrieben hat:

- Jede Datei trägt im Frontmatter ein Feld `autor: Claude` oder `autor: Gwen`.
- Innerhalb gemeinsam genutzter Dateien (z. B. der Recherche-Dateien in
  [[08-Recherche-Gwen/00-Rechercheauftrag-für-Gwen]]) markiert Gwen eigene
  Beiträge zusätzlich mit einem `> [!gwen]`-Callout inklusive Datum und Quelle.
- **Regel: Gwen ergänzt nur, verändert oder löscht keine bestehenden Inhalte.**
  Details dazu stehen im Rechercheauftrag selbst.

Wenn du als KI diesen Vault liest: Inhalte mit `autor: Claude` bzw. ohne
`[!gwen]`-Callout wurden analytisch aus dem Code/Git-Verlauf abgeleitet und
sind entsprechend verlässlich in Bezug auf den Code-Stand. Inhalte mit
`autor: Gwen` bzw. in `[!gwen]`-Callouts stammen aus Web-Recherche und sind
mit der jeweils angegebenen Quelle zu verifizieren, besonders bei
Gesetzes-/Normangaben.

## Struktur dieses Vaults

```
Ki Datenspeicher/
├── 00-Start-Hier.md              ← diese Datei
├── 01-Projekt/
│   └── Projektüberblick.md
├── 02-Architektur/
│   ├── Frontend-Architektur.md
│   ├── Backend-Architektur.md
│   └── Datenmodell.md
├── 03-Module/
│   ├── Übersicht.md
│   ├── Dashboard.md
│   ├── Themenquiz.md
│   ├── Zusatz-Nivellieren.md
│   ├── Zusatz-Prozentrechnung.md
│   ├── Zusatz-Volumen.md
│   └── Zusatz-Gesamtquiz.md
├── 04-Lernfelder/
│   └── Lernfelder-Übersicht.md
├── 05-Update-Log/
│   └── Update-Log.md
├── 06-Fragen-und-Antworten/
│   └── Fragenkatalog.md
├── 07-Offene-Punkte/
│   └── Offene-Punkte.md
├── 08-Recherche-Gwen/
│   ├── 00-Rechercheauftrag-für-Gwen.md
│   ├── Kickoff-Prompt.md
│   └── 01…15  (je eine Recherche-Datei pro Fachthema)
└── 09-Fachwissen-Fragenkatalog/
    ├── 00-Übersicht.md
    └── je eine Datei pro fertig recherchiertem Thema (von Claude aufbereitet)
```

## Pflegehinweis

Wenn du (KI) an diesem Projekt arbeitest und etwas Wesentliches änderst, ergänze
bitte einen neuen Eintrag in [[05-Update-Log/Update-Log]] (oben anfügen, neueste
zuerst) und aktualisiere die betroffene Modul-/Architektur-Datei. Halte Einträge
kurz und faktenorientiert (was geändert, warum, Datum). Keine Duplizierung von
Informationen, die sich aus dem Code selbst ergeben — nur Kontext, Entscheidungen
und Status, die man aus dem Code allein nicht sieht.

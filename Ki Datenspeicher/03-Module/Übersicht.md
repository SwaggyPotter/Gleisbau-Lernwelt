---
tags: [module, überblick]
autor: Claude
---

# Modul-Übersicht

Die App besteht aktuell aus drei sichtbaren Bereichen für Nutzer:

1. [[03-Module/Dashboard]] — Startseite mit allen Kacheln
2. [[03-Module/Themenquiz]] — 10 Themenquiz
3. Vier Zusatz-Lerntools:
   - [[03-Module/Zusatz-Nivellieren]]
   - [[03-Module/Zusatz-Prozentrechnung]]
   - [[03-Module/Zusatz-Volumen]]
   - [[03-Module/Zusatz-Gesamtquiz]]

Alle Module sind eigenständige, lazy-geladene Angular-Feature-Module unter
`src/app/modules/`. Details zum gemeinsamen Datenschema: siehe
[[02-Architektur/Datenmodell]].

## Schnellreferenz: Routen

| Route | Modul |
|---|---|
| `/dashboard` | Dashboard |
| `/themenquiz/:topicId` | Themenquiz (10 Themen) |
| `/zusatz/nivellieren` | Nivellieren im Gleisbau |
| `/zusatz/prozentrechnung` | Prozentrechnung-Trainer |
| `/zusatz/volumen` | Volumenberechnung-Trainer |
| `/zusatz/gesamtquiz` | Gesamtquiz (alle Zusatz-Module kombiniert) |

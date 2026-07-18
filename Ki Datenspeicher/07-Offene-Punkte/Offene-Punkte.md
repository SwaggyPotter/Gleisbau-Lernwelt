---
tags: [todo, offene-punkte, entscheidungen]
autor: Claude
---

# Offene Punkte / TODOs

Dinge, die aus der Code-/Git-Analyse als offen, inkonsistent oder
entscheidungsbedürftig auffallen. Kein vollständiger Projektplan — nur
Beobachtungen, die für die Weiterarbeit relevant sein könnten. Bitte ergänzen/
abhaken, sobald geklärt.

## Architektur-Entscheidungen

- [ ] **Backend reaktivieren oder entfernen?** Das Express/Postgres-Backend
  (`backend/`) ist voll funktionsfähig (Login, Admin, Registrierungs-Keys,
  Nutzerfortschritt), aber seit 18.07.2026 nicht mehr ans Frontend angebunden.
  Es liegt totes Gewicht im Repo, falls es dauerhaft nicht gebraucht wird.
  Siehe [[02-Architektur/Backend-Architektur]].
- [ ] **Was passiert mit den 14 Lernfeld-Inhalten?** Aktuell nur als Rohtext in
  `LERNFELDER-BACKUP.txt` archiviert. Wenn sie zurückkommen sollen, müsste
  entschieden werden, in welchem Format (eigene Module wie bei "Zusatz", oder
  wieder eine generische Lernfeld-1-14-Struktur mit Backend-Anbindung).
  Siehe [[04-Lernfelder/Lernfelder-Übersicht]].
- [ ] **Drei parallele Datenmodelle** für dieselben 14 Lernfelder existieren
  (Backup-Text, Backend-DB-Schema, ehemaliges Frontend-JSON-Format) — sollten
  konsolidiert werden, falls die Inhalte reaktiviert werden.

## Sicherheit

- [ ] **Hardcodierter Admin-Account** `admin`/`1234` in `backend/src/index.ts`
  (Bootstrap-Seed). Unkritisch solange das Backend nicht live/erreichbar ist,
  aber vor jeder Reaktivierung unbedingt ändern/entfernen. Siehe
  [[02-Architektur/Backend-Architektur]].

## Code-Aufräumarbeiten (kleinere Inkonsistenzen)

- [ ] Modul `zusatz/nivellieren` trägt intern noch alte Dateinamen `lernfeld-02`/
  `lf02-*` — funktional kein Problem, aber verwirrend für neue Entwickler.
  Siehe [[03-Module/Zusatz-Nivellieren]].
- [ ] `gesamtquiz.page.html` ist die letzte verbliebene Stelle im aktiven
  Frontend-Code, die noch das Wort "Lernfeld" referenziert.

## Unbekannt / an Tim zu klären

- [ ] Läuft das Backend/Docker-Compose-Setup aktuell produktiv irgendwo, oder
  ist es rein lokal/geparkt?
- [ ] Ist eine App-Store-Veröffentlichung (Capacitor iOS/Android) geplant oder
  bereits erfolgt?
- [ ] Gibt es einen konkreten Auftraggeber/Ausbildungsbetrieb, für den die App
  entwickelt wird (relevant für Ton, Umfang, Datenschutzanforderungen)?

---

**Hinweis für die KI**: Wenn eine dieser Fragen im Gespräch mit Tim geklärt
wird, bitte hier abhaken/aktualisieren und relevante Details in die
entsprechende Architektur-/Modul-Notiz übertragen, statt nur hier stehen zu
lassen.

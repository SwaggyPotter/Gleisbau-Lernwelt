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
  Siehe [[02-Architektur/Backend-Architektur]]. **Update 2026-08-11:** Tim hat
  im Rahmen der Gesamtziel-Planung entschieden, das Backend vorerst NICHT
  anzubinden — App bleibt statisch, Backend/Deployment-Doku nur startklar
  halten. Die neue Melde-Funktion (`question-report.service.ts`) speichert
  deshalb bewusst nur lokal (localStorage), ist aber so strukturiert, dass ein
  echter HTTP-Aufruf ans Backend später ohne Änderung der aufrufenden
  Komponenten nachgerüstet werden kann.
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
  (Bootstrap-Seed, Zeilen 9–10: `ADMIN_EMAIL`/`ADMIN_PASSWORD` als Konstanten,
  nicht über ENV konfigurierbar; wird bei jedem Serverstart per
  `ON CONFLICT ... DO UPDATE` neu gesetzt). Unkritisch solange das Backend
  nicht live/erreichbar ist, aber vor jeder Reaktivierung unbedingt ändern/
  entfernen. Details siehe [[06-Fragen-und-Antworten/Fragenkatalog]] und
  [[02-Architektur/Backend-Architektur]].

## Code-Aufräumarbeiten (kleinere Inkonsistenzen)

- [ ] Modul `zusatz/nivellieren` trägt intern noch alte Dateinamen `lernfeld-02`/
  `lf02-*` — funktional kein Problem, aber verwirrend für neue Entwickler.
  Siehe [[03-Module/Zusatz-Nivellieren]].
- [x] `gesamtquiz.page.html` ist die letzte verbliebene Stelle im aktiven
  Frontend-Code, die das Wort "Lernfeld" noch in sichtbarem UI-Text zeigt
  (Zeile 20: "...alle verfuegbaren Fragen aus Lernfeld 1 bis 14...").
  **Erledigt (Claude, 2026-07-26):** Text geändert zu "...aus saemtlichen
  Themenbereichen und den Zusatzmodulen." — im sichtbaren UI existiert
  damit kein "Lernfeld"-Text mehr. **Ergänzung
  (Claude, Code-Check 2026-07-22):** Zusätzlich enthält die aktiv geladene
  Datenquelle `src/assets/zusatz/gesamtquiz/gesamtquiz-alle-module.json` 16-mal
  "Lernfeld N" als `meta.sources[].title` — wird aber nicht direkt angezeigt,
  die UI zeigt dort nur die Anzahl (`sources.length` als Chip "X Quellen", vgl.
  `gesamtquiz-data.service.ts` und `gesamtquiz.page.html` Zeile 24). Also kein
  sichtbarer Text, aber vorhanden im aktiven Datenbestand — bei einer
  eventuellen Lernfeld-Umbenennung/-Entfernung mit bedenken.

## Recherche-Workflow (Gwen ↔ Claude)

- [ ] **Sollte Gwens Rolle im Recherche-Workflow neu definiert werden?**
  Auszählung des Frontmatter-Felds `status:` in den 15 Themen-Dateien unter
  `08-Recherche-Gwen/` (Stand 2026-07-22): 1× `von Claude recherchiert
  (verifiziert)` (Datei 02, komplett per echter Websuche durch Claude
  geprüft), 6× `von Gwen recherchiert`, 8× `unvollständig (von Gwen)`. In
  mehreren als "fertig" markierten Gwen-Dateien hat die anschließende
  Claude-Verifikation per Websuche mehrfach erfundene oder falsch zugeordnete
  Normen/Regelwerke aufgedeckt (z. B. "RBT 9000", "DIN EN 14629" statt korrekt
  "DIN EN 14730", "CTR-Stahl"/"MTR-Stahl" — siehe die "Bereits als erfunden
  identifiziert"-Hinweise im Projektauftrag sowie die Hinweis-Absätze in den
  einzelnen Recherche-Dateien). `Kickoff-Prompt.md` ist deshalb inzwischen bei
  Version 4 und wächst bei praktisch jeder Runde um weitere Korrekturregeln
  (gelöschte Fragenkataloge, überschriebenes Frontmatter, abgebrochene
  Antworten, erfundene Normen). Da eine KI mit echtem Websuche-Zugriff (Claude)
  im Projekt inzwischen ohnehin jede Norm-Angabe nachprüfen muss, bevor sie in
  die App übernommen wird: Lohnt es sich noch, neue/unbearbeitete Themen (die
  8 `unvollständig`-Dateien) zuerst von Gwen entwerfen zu lassen und danach zu
  korrigieren — oder ist es effizienter, wenn Claude solche Themen direkt
  selbst recherchiert und Gwen nur noch für klar abgegrenzte
  Zulieferaufgaben ohne Norm-Bezug eingesetzt wird? Reine Beobachtung aus dem
  Vault-Zustand, keine Entscheidung aus dem Code ableitbar — echte Tim-Frage.
  Siehe [[08-Recherche-Gwen/Kickoff-Prompt]].

## Spiele-Feature (aus Tims Gesamtziel-Vision, 2026-08-11 — noch nicht gebaut)

- [ ] **Zusatz-Spielformen konzipieren und bauen.** Tim wünscht sich neben dem
  reinen Quiz-Format noch spielerische Formate, hat sich für "Zusatz-
  Spielformen" (statt reinem Punkte-/Abzeichen-System) entschieden. Grober
  Vorschlag, noch nicht umgesetzt:
  - **Memory/Zuordnungsspiel**: Begriff ↔ Definition oder Bild ↔ Begriff,
    gespeist aus den bestehenden `explanation`-Feldern der Themenquiz-Fragen
    (kein neuer Inhalt nötig, nur neue Präsentationsform).
  - **Zeitrennen-Modus**: bestehende Fragen aus einem Thema/Gesamtquiz unter
    Zeitdruck beantworten, z. B. als neuer Modus im `GesamtquizEngineComponent`
    (dort existiert bereits Fragenpool + Shuffle, "nur" ein Timer + Highscore
    fehlen).
  - Beide Formate könnten dieselbe Fragen-Datenbasis wiederverwenden (kein
    neuer Recherche-Aufwand), sind also primär Frontend-Arbeit: neues Modul
    `modules/zusatz/spiele/` oder zwei separate kleine Module.
  - Noch zu klären mit Tim: Highscore lokal (localStorage, wie der bestehende
    Fortschritt) oder erst nach Backend-Anbindung sinnvoll?

  **Ideensammlung (offen fuer weitere Eintraege, noch keine umgesetzt):**
  - **Nivellierlatte ablesen (Tim, 2026-08-11):** Foto/Grafik einer
    Nivellierlatte mit Zeiger/Anschnittpunkt zeigen, Nutzer traegt den
    abgelesenen Wert (Zahl, z. B. in mm oder m) ein. Toleranzbasierte
    Auswertung: richtig, wenn der eingegebene Wert nah genug am echten Wert
    liegt (Toleranzbreite noch festzulegen, z. B. ±5 mm). Passt direkt zum
    Zusatzmodul Nivellieren (`modules/zusatz/nivellieren/`) und ist ein
    eigener Uebungstyp neben Multiple-Choice — braucht generierte
    Latten-Grafiken (SVG mit zufaelligem Wasserstand/Anschnitt waere
    realistisch umsetzbar, kein Foto pro Wert noetig) statt vorgefertigter
    Bilder.
  - *(weitere Ideen hier ergaenzen, sobald Tim sie nennt)*

## Bild-Feedback von Tim (2026-08-11, teils umgesetzt)

Nach Live-Ansicht der App kam konkretes Feedback zu den Themenquiz-Bildern
(siehe [[../../cline_cli_setup]]-Nachfolge-Notiz für Details). Umgesetzt:
Spurweite (jetzt Gauge-Vergleichsfoto statt Kurve), Trassenplan (jetzt
echtes Gleisplan-SVG statt Luftbild), Bildgroesse auf Kacheln kompakter.

- [ ] **Messmittel und Vermessung**: aktuelles Foto (Gleismesswagen) wirkt
  wie "einfach ein Zug" — Tim moechte etwas, das eindeutig als Messgeraet
  erkennbar ist. Mehrfache Commons-Recherche (Spurweitenmessgeraet,
  Nivelliergeraet, Messschieber) brachte keinen besseren Treffer mit freier
  Lizenz. Noch offen.
- [ ] **Schwellen**: Tim haette gerne mehrere verschiedene Schwellentypen
  (Holz/Beton/Stahl) im Bild statt nur Betonschwellen wie aktuell. Noch
  offen — evtl. als Recherche-Auftrag an Gwen (Bildkandidaten fuer die
  restlichen Themen sind ohnehin schon Teil des erweiterten Auftrags in
  `08-Recherche-Gwen/02-Erweiterter-Auftrag-2026-08-11.md`).
- [ ] **Bilder fuer Lernfeld-Quizze**: Tim moechte auch bei den
  Gleisbau-Lernfeldern (LF10-14, z. B. "Gleisboegen herstellen", "Weichen
  montieren") und den Selbststudium/Quiz-Modulen passende Bilder — bisher
  nur die 10 Themenquiz-Themen + Header + Materialrechner bebildert.

## Unbekannt / an Tim zu klären

- [ ] Läuft das Backend/Docker-Compose-Setup aktuell produktiv irgendwo, oder
  ist es rein lokal/geparkt? (Technisches Setup ist produktionsreif
  ausgebaut, siehe Detailanalyse in [[06-Fragen-und-Antworten/Fragenkatalog]]
  — das beantwortet aber nicht, ob es tatsächlich läuft.)
- [ ] Ist eine App-Store-Veröffentlichung (Capacitor iOS/Android) geplant oder
  bereits erfolgt? (Code-Stand 2026-07-21: bisher nie erfolgt, es existiert
  kein natives Plattform-Projekt im Repo — Details in
  [[06-Fragen-und-Antworten/Fragenkatalog]]. Ob eine Veröffentlichung geplant
  ist, bleibt offen.)
- [ ] Gibt es einen konkreten Auftraggeber/Ausbildungsbetrieb, für den die App
  entwickelt wird (relevant für Ton, Umfang, Datenschutzanforderungen)?

---

**Hinweis für die KI**: Wenn eine dieser Fragen im Gespräch mit Tim geklärt
wird, bitte hier abhaken/aktualisieren und relevante Details in die
entsprechende Architektur-/Modul-Notiz übertragen, statt nur hier stehen zu
lassen.

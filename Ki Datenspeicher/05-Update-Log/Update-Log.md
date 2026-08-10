---
tags: [update-log, historie]
autor: Claude
---

# Update-Log

Chronologie der wichtigsten Änderungen am Projekt, neueste zuerst. Basiert auf
`git log` (Autor: Tim / SwaggyPotter) plus manueller Analyse der Commit-Diffs.
Neue Einträge bitte **oben** anfügen.

---

## 2026-07-26 — Fragen-Generierung für die 10 Wissenstests aufgesetzt (Claude)

- Tim will alle Quizze ausgebaut haben ("so viel wie möglich rein").
  Neuer Vault-Ordner `11-Fragen-Generierung/`: pro Wissenstest-Thema eine
  Auftrags-Datei (bestehende Fragen als Duplikat-Sperre + Format-Vorlage);
  Gwen recherchiert per Websuche und liefert 15–25 neue Fragen pro Thema
  mit Quellenbeleg, ein Auftrag pro Session.
- Neues Tooling `tools/fragen-generierung/`: `make-auftraege.cjs`
  (erzeugt Auftrags-Dateien, überschreibt nie) und `einarbeiten.cjs`
  (validiert Gwens Blöcke; mit `--merge` Einarbeitung in
  `src/assets/themenquiz/*.json` + `topics.json`; `questionCount` in
  `dashboard.page.ts` muss danach manuell nachgezogen werden).
- Workflow-Reihenfolge: Generierung hat aktuell Vorrang vor der
  Gesamtquiz-Prüfung (Batches 04–43 pausieren, laufen danach weiter).

## 2026-07-26 — 14 Lernfeld-Quiz-Module in der App (Claude, Tim-Entscheidung)

- Tim will die 427 Gesamtquiz-Fragen **sortiert und pro Modul quizzbar** in
  der App haben (Prüfung durch Gwen läuft parallel weiter).
- Neues Generator-Skript `tools/lernfeld-module/build-lernfeld-quizze.cjs`:
  erzeugt aus `gesamtquiz-alle-module.json` je ein Themenquiz-Modul pro
  Lernfeld (`src/assets/themenquiz/lf01.json` … `lf14.json`, 417 Fragen;
  10 ZUSATZ-Duplikate des Nivellieren-Moduls übersprungen) und ergänzt
  `topics.json`. Titel = offizielle Lernfeld-Liste (Backend-Seed).
  **Wichtig:** Einzige Datenquelle bleibt die Gesamtquiz-JSON — nach
  Korrekturen aus der Gwen-Prüfung das Skript einfach erneut ausführen.
- Dashboard: neue Sektion „Lernfeld-Quizze" (14 Kacheln, Tag = Jahr 1–3,
  mit Fortschrittsanzeige) zwischen „Wissenstests" und „Zusatzmodule"
  (`dashboard.page.ts/.html`). Quiz-Mechanik unverändert — die
  Themenquiz-Route lädt Topics dynamisch.

## 2026-08-10 — Neues Zusatzmodul "Materialrechner" (zufällig generierte Aufgaben) (Claude)

- Tim-Wunsch: App auf die Zielgerade bringen, Unterrichtsmaterial. Statt
  weiterer fester Fragenlisten ein Modul mit **unbegrenzt generierten**
  Rechenaufgaben — Volumen, Materialgewicht (Schüttdichte-Tabelle,
  recherchiert), Schotterbedarf für Gleisabschnitte, in 3
  Schwierigkeitsgraden. Neue Route `/zusatz/materialrechner`, neue
  Dashboard-Kachel. Details: [[03-Module/Zusatz-Materialrechner]].
- Vor dem Merge mit einem Stresstest (3600 generierte Fragen, node/tsx)
  zwei echte Logikfehler in der Distraktor-Erzeugung gefunden und behoben
  (kollabierende Antwortoptionen bei kleinen Ganzzahl-Ergebnissen wie
  "1 Fahrt", hängender Fallback-Loop) — siehe Modul-Notiz für Details.
- Schüttdichte-Werte (Gleisschotter, Kies, Sand, Beton, Mutterboden, …)
  per Websuche recherchiert und mit Quellen im Code hinterlegt
  (`data/schuettdichten.ts`), nicht aus Trainingswissen übernommen.

## 2026-08-10 — Gesamtquiz-Prüfung (Batch 04-43) pausiert zugunsten Fragen-Ausbau (Claude)

Tim priorisiert den Ausbau der 10 Wissenstests höher als die laufende
Fehlerprüfung des Gesamtquiz. Batches 04-43 bleiben `offen`, bis die
Fragen-Generierung (siehe unten) durchläuft.

## 2026-07-26 bis 2026-08-10 — Ausbau der 10 Wissenstests durch Gwen (Claude)

Fortsetzung von [[11-Fragen-Generierung/00-Anweisung-für-Gwen]]: Gwen
recherchiert per Websuche neue Fragen pro Thema, Claude prüft Stichproben
(Quellen-URLs abrufen, Fachlogik gegenlesen) und arbeitet sie per
`tools/fragen-generierung/einarbeiten.cjs --merge` ein. Bisher 4 von 10
Themen fertig:

| Thema | vorher | nachher |
|---|---|---|
| Grundlagen | 6 | 26 |
| Spurweite | 6 | 20 |
| Schienen | 5 | 19 |
| Schwellen | 5 | 22 |

Typische Korrekturen beim Gegenlesen: erfundene/falsche Zahlenwerte,
vertauschte Vorzeichen bei Fachaussagen (Zug-/Druckspannung bei
Neutraltemperatur), Doppelungen (mehrere Fragen zum selben Fakt). Noch
offen: bettung, kleineisen, handwerkzeuge, kleingeraete, messmittel,
trassenplan.

## 2026-07-26 — Gwen-Modellwechsel: qwen3.5-9b mit 64k Kontext (Claude)

- Auf Tims Wunsch neues Modell installiert: `qwen/qwen3.5-9b` (6,55 GB,
  per `lms get`), geladen mit **65.536 Token Kontext**, LM-Studio-Server
  auf Port 1234 gestartet, Testprompt fachlich korrekt beantwortet.
- Hintergrund: Das bisherige `qwen3.6-27b` (15,44 GB) passte nicht komplett
  in die 12 GB VRAM der RTX 4070 — deshalb war der Kontext auf ~17k
  begrenzt (Ursache der bisherigen Abbruch-Probleme). Das 9B-Modell lässt
  ~5,5 GB VRAM für den Kontext-Cache frei.
- Das alte `qwen3.6-27b` bleibt vorerst installiert (Löschung erst nach
  Bewährung des neuen Modells). Die Ein-Batch-pro-Session-Regel der
  Gesamtquiz-Prüfung bleibt vorerst bestehen, kann aber nach ein paar
  sauberen Batches auf 2–3 erhöht werden. Hinweis: qwen3.5-9b ist ein
  "Thinking"-Modell (gibt Denkprozess mit aus).
- Noch offen: In den Cline-Einstellungen muss das Modell auf
  `qwen/qwen3.5-9b` umgestellt werden (macht Tim).

## 2026-07-26 — Websuche für Gwen eingerichtet, Auswerte-Tooling, UI-Textfix (Claude)

- **Websuche-MCP für Gwen (Cline)**: Gwen läuft über die VS-Code-Extension
  Cline und hatte keinen Websuche-Zugriff (erster Batch-Anlauf korrekt
  abgebrochen). Eingerichtet: `uv` (via pip) + DuckDuckGo-MCP-Server
  (`uvx duckduckgo-mcp-server`, kein API-Key) in Clines
  `cline_mcp_settings.json`; Serverstart getestet. Chat-Prompt vorher um
  zwei Schutzregeln ergänzt (ohne Websuche nichts ausfüllen; bei nicht
  ersetztem `XX` erst nach Batch-Nummer fragen).
- **Neues Tooling** in `tools/gesamtquiz-pruefung/`: `make-batches.cjs`
  (Erst-Export, überschreibt!) und `auswerten.cjs` (zählt Urteile, listet
  FALSCH/UNSICHER, Integritäts-Check gegen die App-JSON, schreibt
  `10-Gesamtquiz-Pruefung/Auswertung.md`). Testlauf: 0/427 geprüft,
  keine Strukturschäden.
- **UI-Textfix**: `src/app/modules/zusatz/gesamtquiz/pages/gesamtquiz.page.html`
  — "aus Lernfeld 1 bis 14" ersetzt durch "aus saemtlichen Themenbereichen";
  damit kein sichtbarer "Lernfeld"-Text mehr im aktiven Frontend
  (Offener Punkt abgehakt).

## 2026-07-23 — Gesamtquiz-Prüfung durch Gwen aufgesetzt (Claude)

- Neuer Vault-Ordner `10-Gesamtquiz-Pruefung/`: alle 427 Fragen aus
  `src/assets/zusatz/gesamtquiz/gesamtquiz-alle-module.json` per Skript als
  43 Batch-Dateien à 10 Fragen exportiert (mit `___`-Platzhaltern für Urteil/
  Begründung/Quelle), dazu `00-Anweisung-für-Gwen.md`, `Chat-Prompt.md`
  (in sich vollständiger Session-Prompt) und `Fortschritt.md`.
- Hintergrund: Tim-Entscheidung vom 2026-07-23 — die nie systematisch
  geprüften Gesamtquiz-Fragen sollen von Gwen (inzwischen mit Websuche)
  einzeln verifiziert und mit Quellen belegt werden. Ein Batch pro
  Chat-Session wegen des ~17k-Token-Kontextlimits. Claude wertet die
  Urteile danach per Skript aus, prüft `FALSCH`/`UNSICHER`-Fälle selbst
  nach und korrigiert bestätigte Fehler in der App-JSON.
- An den App-Daten selbst wurde nichts geändert (reiner Export in den Vault).

## 2026-07-18 17:08 — Großer Vereinfachungs-Umbau (Commit `b461679`, "Update")

Größte strukturelle Änderung des Projekts bisher. In einem Commit:

- **Entfernt aus `src/app`**: `admin/`, `login/`, `profile/`, `home/`,
  `field-detail/`, `field-quiz/`, `services/` (api/auth/gamification/
  learning-data), sowie `src/assets/lernfelder/lernfeld-01/`…`lernfeld-14/`.
- **Hinzugefügt**: `LERNFELDER-BACKUP.txt` (939 KB Vollsicherung aller
  Lernfeld-Inhalte, siehe [[04-Lernfelder/Lernfelder-Übersicht]]), diverse
  Tooling-Configs (`.browserslistrc`, `.editorconfig`, `.eslintrc.json`,
  `karma.conf.js`, `capacitor.config.ts`, `ionic.config.json`).
- **Dashboard** (`dashboard.page.ts/.html/.scss`) stark überarbeitet (407 Zeilen
  geändert) — jetzt einzige Landingpage mit Kacheln für Themenquiz + Zusatzmodule.
- Ergebnis: App läuft nur noch mit statischen JSON-Inhalten + `localStorage`,
  kein Backend-Aufruf mehr im Frontend. Backend selbst bleibt im Repo bestehen,
  ist aber verwaist. Siehe [[02-Architektur/Backend-Architektur]] und
  [[07-Offene-Punkte/Offene-Punkte]] für die offene Frage, ob/wie es
  reaktiviert wird.
- **Warum** (Vermutung anhand der Commit-Historie, nicht explizit dokumentiert):
  Vereinfachung — weg von Accounts/Server-Sync, hin zu einer leichtgewichtigen,
  offline-fähigen Lern-App ohne Login-Hürde.

## 2026-07-18 02:17 — "Update" (Commit `b5f531b`)

Vorbereitender Commit vor dem großen Umbau (Details nicht einzeln analysiert).

## 2026-07-16 — "re update" (Commits `89d7a4d`, `c357909`)

## 2026-03-07 — "update" (Commit `56dbb4b`)

## 2026-02-25 — "New learn field designe. Process line" (Commit `1bb1a56`)

Neues Design für die Lernfeld-Seiten inkl. Fortschrittsanzeige ("Process line").

## 2026-02-17 — Datensicherheit & Volumenrechner

- `855266e` "x"
- `8df3b1e` **"Volume calc"** — Einführung des Volumen-Rechentrainers
  (→ [[03-Module/Zusatz-Volumen]])
- `84fc2c2` "Update datasecure information"
- `0eaf9d5` "Update data secure"

## 2026-02-13 — Lernfeld-Infos aktualisiert (`d10f0de`, `24baf10`)

## 2026-02-12 04:08 — "update show admin panel again" (Commit `f97d5d4`)

Admin-Panel war zu diesem Zeitpunkt aktiv im Frontend eingebunden (später am
18.07.2026 wieder entfernt).

## 2026-02-07 bis 2026-02-10 — Lernfelder 1–14 befüllt

Mehrere Commits, die die Lernfeld-Inhalte Stück für Stück ergänzt haben:
`b4795a1` "update lf", `2aefc17` "lf2 - lf6 update", `85841df` "New data lf1",
`0d0d5ab` "Search tool new optic", `6b6da08` "lf 14", `4a0368d` "LF 9 - 13",
`50294ae` "LF 5 - 8", `bf419dd` "LF3 LF4", `9a06d01` "New lernfeld".

## 2026-02-01/02 — Design- und Responsive-Updates

`946fcf1` "update robotic font better optic", `644ff81` "update responsiv",
`e5b6fd2` "New infos and elements".

## 2026-01-25/26 — Login-System, Nutzerverwaltung, Design-Relaunch

Umfangreiche Phase mit vielen Commits: `b5645b5` "Login via enter button",
`6d5cd0c` "Update Quiz", `6a07961` "Update data", `0c509fa` "Update Learnfield",
`726b49a` "Update for deleting and managing user", `f6b393c`/`12dd461`/`5bbcbb3`
"new login methode/method", `8d63ffc` "update website and data", `28ca1da`
"update clear website", `8484edc` "Remove items", `1d1b6ba` "New design",
`697a7db` "new designe", `1cef050` "Revome demo login".

→ In dieser Phase wurde das Login-/Nutzerverwaltungssystem aufgebaut, das am
18.07.2026 wieder entfernt wurde.

## 2026-01-24 20:05 — "Update for real data using (backend)" (Commit `cd40e81`)

## 2026-01-24 02:09 — "init backend" (Commit `d9d0fa5`)

Initiale Einführung des Express/Postgres-Backends
(→ [[02-Architektur/Backend-Architektur]]).

## 2026-01-20 — "Added new learning fields" (Commit `064de91`)

## 2026-01-19 — Admin-Panel eingeführt

`0714b5c` "fixes", `3eeb120` **"Admin panel"** — erste Einführung des
Admin-Panels, `9e8ebed` "First push with alot of shiiii".

## 2026-01-13 20:09 — "First Push" (Commit `7e6b649`)

Projektstart.

---

## Hinweis zur Nutzung dieses Logs

Dieses Log ist bewusst grob (auf Commit-Ebene), nicht auf Datei-Ebene. Für
Details zu einem einzelnen Commit: `git show --stat <hash>` bzw. `git show <hash>`
im Projektverzeichnis.

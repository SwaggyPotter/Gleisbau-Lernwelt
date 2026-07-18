---
tags: [update-log, historie]
autor: Claude
---

# Update-Log

Chronologie der wichtigsten Änderungen am Projekt, neueste zuerst. Basiert auf
`git log` (Autor: Tim / SwaggyPotter) plus manueller Analyse der Commit-Diffs.
Neue Einträge bitte **oben** anfügen.

---

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

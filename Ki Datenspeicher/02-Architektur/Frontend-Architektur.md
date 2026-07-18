---
tags: [architektur, frontend, angular]
autor: Claude
---

# Frontend-Architektur

Stand: 2026-07-18 (nach dem großen Vereinfachungs-Commit `b461679`, siehe
[[05-Update-Log/Update-Log]]).

## Grundprinzip

Seit dem Umbau vom 18.07.2026 ist das Frontend **komplett backend-frei**:
- Keine Login-/Auth-Logik, kein `HttpClient`-Aufruf gegen die eigene API.
- Alle Lerninhalte kommen aus statischen JSON-Dateien unter `src/assets/`.
- Aller Nutzerfortschritt liegt nur im Browser (`localStorage`), gerätelokal,
  nicht synchronisiert.

`src/app/app.module.ts` importiert nur `BrowserModule`, `HttpClientModule`,
`IonicModule`, `AppRoutingModule` — kein Auth-Interceptor, kein Auth-Guard.

## Ordnerstruktur unter `src/app/`

Nur drei funktionale Bereiche existieren aktuell:

| Ordner | Zweck |
|---|---|
| `src/app/dashboard/` | Einzige Landingpage — Kachel-Übersicht aller Quizze/Zusatzmodule, Client-seitige Suche, Fortschrittsanzeige aus `localStorage` |
| `src/app/modules/themenquiz/` | Wiederverwendbares Themenquiz-Feature (10 Themen) |
| `src/app/modules/zusatz/` | Vier eigenständige Zusatz-Lerntools (siehe [[03-Module/Übersicht]]) |

Root-Dateien: `app-routing.module.ts`, `app.module.ts`, `app.component.*`.

## Routing (`src/app/app-routing.module.ts`)

Alles lazy-loaded:

- `''` → Redirect zu `dashboard`
- `dashboard` → `DashboardPageModule`
- `themenquiz/:topicId` → `ThemenquizModule`
- `zusatz/nivellieren` → `NivellierenModule`
- `zusatz/volumen` → `VolumenModule`
- `zusatz/prozentrechnung` → `ProzentrechnungModule`
- `zusatz/gesamtquiz` → `GesamtquizModule`
- `**` → Redirect zu `dashboard`

Es gibt **keine** Routen mehr für Login, Admin, Profil oder einzelne Lernfelder
(diese existierten früher, wurden am 18.07.2026 entfernt — siehe
[[05-Update-Log/Update-Log]] und [[07-Offene-Punkte/Offene-Punkte]]).

## Was am 18.07.2026 entfernt wurde

Aus `src/app/` gelöscht (weiterhin serverseitig im Backend vorhanden):

- `admin/` — Admin-Dashboard (Nutzer-/Key-Verwaltung)
- `login/` — Login/Registrierungs-Key-UI
- `profile/` — Profilseite
- `home/` — ältere Landingpage (durch `dashboard/` ersetzt)
- `field-detail/`, `field-quiz/` — alte Lernfeld-Detail-/Quiz-Seiten
- `services/` — `api.service.ts`, `auth.service.ts`, `gamification.service.ts`,
  `learning-data.service.ts` (alle Backend-Anbindungen im Frontend)
- `src/assets/lernfelder/lernfeld-01/` … `lernfeld-14/` (Inhalte jetzt nur noch
  in `LERNFELDER-BACKUP.txt`)

Siehe [[04-Lernfelder/Lernfelder-Übersicht]] für Details zum Lernfeld-Inhalt.

## Datenmodell

Siehe eigene Notiz: [[02-Architektur/Datenmodell]]

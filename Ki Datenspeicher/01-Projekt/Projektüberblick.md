---
tags: [projekt, überblick]
autor: Claude
---

# Projektüberblick

## Was ist Gleisbau Lernwelt?

Eine mobile/Web-Lern-App für Auszubildende im **Gleisbauer-Beruf** (Bahnbau/
Gleisbau, Deutschland). Sie hilft beim Lernen und Wiederholen von Ausbildungsinhalten
über die drei Lehrjahre hinweg: Sicherheit auf der Baustelle, Erdbau, Mauerwerk,
Stahlbeton, Gleisbau-Grundlagen, Weichenbau usw.

Projektname im Code: `gleisbau-lernwelt` (siehe `package.json`).

## Tech-Stack

- **Frontend**: Ionic 8 + Angular 20, TypeScript, SCSS. Gebaut mit Capacitor
  (App-Fähigkeit für iOS/Android, aktuell primär als Web-App genutzt).
- **Backend** (aktuell nicht angebunden, siehe [[02-Architektur/Backend-Architektur]]):
  Node.js + Express 4 + TypeScript, PostgreSQL 16, `zod` für Validierung, `pino`
  für Logging, `bcryptjs` für Passwort-Hashing.
- **Deployment**: Docker Compose mit 3 Services (`db`, `api`, `proxy`), Caddy 2
  als Reverse Proxy mit automatischem TLS (Let's Encrypt), siehe `docker-compose.yml`
  und `deploy/`.
- **Persistenz im Frontend (aktuell)**: Keine Datenbank-Anbindung — Inhalte kommen
  aus statischen JSON-Dateien unter `src/assets/`, Nutzerfortschritt wird nur lokal
  im Browser (`localStorage`) gespeichert.

## Zielgruppe

Auszubildende im Gleisbau, vermutlich mit Bezug zu einem konkreten Ausbildungsbetrieb
oder einer Berufsschule. Die 14 "Lernfelder" folgen der typischen Struktur eines
deutschen Ausbildungsrahmenplans (Lernfeld 1–14, verteilt auf Ausbildungsjahr 1–3).

## Projektverzeichnis (Wurzel)

```
E:\Gleisbau-Lernwelt\
├── src/app/                  Angular-App-Code (siehe Frontend-Architektur)
├── src/assets/                Statische Inhalte: Themenquiz-JSON, Zusatz-Tool-JSON, PDFs
├── backend/                   Express/Postgres-Backend (aktuell verwaist)
├── deploy/                    Caddyfile + Deployment-README
├── docker-compose.yml         Orchestrierung db+api+proxy
├── LERNFELDER-BACKUP.txt      Vollständige Sicherung der 14 Lernfeld-Inhalte (939 KB)
└── Ki Datenspeicher/          Dieser Obsidian-Vault
```

## Verwandte Notizen

- [[02-Architektur/Frontend-Architektur]]
- [[02-Architektur/Backend-Architektur]]
- [[05-Update-Log/Update-Log]] — insbesondere der große Umbau vom 18.07.2026

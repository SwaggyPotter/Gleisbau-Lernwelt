---
tags: [architektur, backend, status/verwaist]
autor: Claude
---

# Backend-Architektur

**Status: existiert und ist funktionsfähig, aber seit 2026-07-18 nicht mehr an
das Frontend angebunden ("verwaist"/geparkt).** Siehe
[[07-Offene-Punkte/Offene-Punkte]] für die Entscheidung, die hier noch aussteht
(reaktivieren vs. endgültig entfernen).

## Stack

- Node.js + **Express 4**, TypeScript
- **PostgreSQL 16** (`pg`-Treiber, kein ORM)
- `bcryptjs` (Passwort-Hashing), `zod` (Validierung), `pino`/`pino-http` (Logging),
  `helmet`, `cors`, `express-rate-limit`, `compression`, `dotenv`
- Dev: `ts-node-dev`, Build: `tsc`

## Verzeichnis `backend/src/`

- `index.ts` — Einstiegspunkt, führt Migrationen aus und seedet Daten beim Start
- `server.ts` — Express-App-Setup
- `config.ts`, `logger.ts`
- `db/pool.ts` — Postgres Connection Pool
- `middleware/async-handler.ts`, `middleware/error-handler.ts`
- `user-deletion.ts` — Job für Nutzerlöschung mit Karenzzeit ("grace period")
- `routes/`
  - `auth.ts` — Login (Passwort oder Registrierungs-Key + neues Passwort)
  - `fields.ts` — CRUD-artige Endpunkte für `learning_fields`
  - `health.ts`
  - `keys.ts` — Verwaltung von Registrierungs-Keys (Admin)
  - `quizzes.ts`
  - `registration.ts`
  - `users.ts` — Nutzerliste, Fortschritts-Snapshots pro Nutzer, Löschung mit Karenzzeit
  - `api.ts`

## Datenbankschema (`backend/db/init/01_schema.sql` + Migrationen 02–06)

Tabellen:

- `registration_keys`
- `users` — Rollen `user`/`admin`; Felder `deletion_scheduled_at`/`deletion_due_at`
  für die Karenzzeit-Löschung
- `learning_fields` — id/title/description/year/tag (die 14 Lernfelder)
- `user_progress` — Fortschritt/Fehler pro Nutzer und Lernfeld

`backend/src/index.ts` seedet beim Start:
- Kanonische Liste der **14 Lernfelder** (`lf-01` … `lf-14`) mit deutschen Titeln
  → siehe [[04-Lernfelder/Lernfelder-Übersicht]]
- Ein Bootstrap-Admin-Account: **Benutzername `admin`, Passwort `1234`, fest im
  Code hinterlegt** — siehe [[07-Offene-Punkte/Offene-Punkte]], sicherheitsrelevant
  falls das Backend jemals wieder live geschaltet wird.

## Deployment (Docker Compose, `docker-compose.yml` im Projekt-Root)

Drei Services:

1. `db` — `postgres:16`, initialisiert aus `backend/db/init/*.sql`
2. `api` — gebaut aus `backend/Dockerfile`, Konfiguration über `.env`
3. `proxy` — Caddy 2, TLS via Let's Encrypt, exponiert 80/443, reverse-proxied
   zu `api:3000`, Konfiguration in `deploy/Caddyfile`

`deploy/README.md` enthält eine Schritt-für-Schritt-Anleitung für Deployment auf
Ubuntu mit Cloudflare-DNS (Server-Vorbereitung, DNS, `.env`-Konfiguration,
`docker compose up -d --build`, Backup-Hinweise). Referenziert `deploy/.env.example`.

## Warum "verwaist"?

Der Git-Verlauf zeigt: echte Nutzerkonten, Admin-Panel und Backend-Anbindung wurden
gebaut (siehe Commits von Januar/Februar 2026: "init backend", "Admin panel",
"new login method", "Update for deleting and managing user" u. a.) und dann am
18.07.2026 im Frontend wieder entfernt, zugunsten einer einfacheren, rein
statischen Dashboard/Quiz-Architektur ohne Accounts. Das Backend selbst wurde
dabei **nicht gelöscht** — es liegt weiterhin vollständig im Repo, nur ruft das
Frontend es aktuell nirgends auf.

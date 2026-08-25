---
tags: [architektur, backend, status/verwaist]
autor: Claude
---

# Backend-Architektur

**Status (seit 2026-08-25): läuft produktiv auf einem echten Server**
(`michiserver`, 192.168.0.102 im Heimnetz von Tim, öffentliche IPv4
95.89.229.237, Domain `gleisbau-digital.org` via Cloudflare — DNS/
Portweiterleitung standen zum Zeitpunkt der Erstinstallation noch aus,
Details siehe [[../05-Update-Log/Update-Log]] 2026-08-25). **Weiterhin
NICHT vom Frontend aus dem Browser aufgerufen** — die App liest ihre
Inhalte weiterhin komplett statisch aus `src/assets/themenquiz/*.json`,
unabhängig vom Backend. Das Backend läuft jetzt also parallel und
erreichbar, aber ohne Verbindung zur eigentlichen Quiz-App-Oberfläche —
nur die Existenz einer Login-fähigen API ist jetzt gegeben, nicht deren
Nutzung durch die App.

**Sicherheitsfix bei der Aktivierung**: der vorher fest im Code stehende
Admin-Zugang (`admin`/`1234`) wurde entfernt — `ADMIN_EMAIL`/
`ADMIN_PASSWORD` sind jetzt Pflicht-Umgebungsvariablen ohne Default-Wert
(Server startet ohne sie gar nicht erst), siehe `backend/src/config.ts`.

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

Tabellen aus den SQL-Dateien:

- `registration_keys`
- `users` — Rollen `user`/`admin`; Felder `deletion_scheduled_at`/`deletion_due_at`
  für die Karenzzeit-Löschung
- `learning_fields` — id/title/description/year/tag (die 14 Lernfelder)
- `user_progress` — Fortschritt/Fehler pro Nutzer und Lernfeld

**Ergänzung (verifiziert 2026-07-22):** Zusätzlich existieren zwei weitere,
aktiv genutzte Tabellen `quiz_sessions` und `quiz_answers` (Session-ID, Feld-ID,
aktueller Fragenindex/Abschluss-Status bzw. Session-ID/Frage-ID/gewählte
Antwort/Korrektheit). Sie stehen **nicht** in den nummerierten SQL-Dateien
01–06, sondern werden erst zur Laufzeit per `CREATE TABLE IF NOT EXISTS` in
`backend/src/index.ts` (`runStartupMigrations()`) angelegt — ein
Migrations-Pfad außerhalb der sonstigen SQL-Migrationskonvention. Genutzt
werden sie von `routes/quizzes.ts` (`POST /api/quizzes/start`,
`POST /api/quizzes/:id/answer`, `POST /api/quizzes/:id/complete`,
`GET /api/quizzes/:id/results`). Wichtig: Der dortige `quizBank` ist aktuell
nur für `lf-01` mit drei Beispielfragen befüllt — für die übrigen 13
Lernfelder liefert die Route 404 ("Für dieses Lernfeld ist noch kein Quiz
hinterlegt"). Das serverseitige Quiz-Feature ist also nur ein Teil-Stub, nicht
vollständig für alle 14 Lernfelder ausgebaut.

`backend/src/index.ts` seedet beim Start:
- Kanonische Liste der **14 Lernfelder** (`lf-01` … `lf-14`) mit deutschen Titeln
  → siehe [[04-Lernfelder/Lernfelder-Übersicht]]
- Ein Bootstrap-Admin-Account aus `ADMIN_EMAIL`/`ADMIN_PASSWORD`
  (Pflicht-Env-Variablen seit 2026-08-25, siehe Status oben — vorher fest
  im Code als `admin`/`1234` hinterlegt, das war vor der Aktivierung
  behoben worden).

## Deployment (Docker Compose, `docker-compose.yml` im Projekt-Root)

Drei Services:

1. `db` — `postgres:16`, initialisiert aus `backend/db/init/*.sql`
2. `api` — gebaut aus `backend/Dockerfile`, Konfiguration über `.env`
3. `proxy` — Caddy 2, TLS via Let's Encrypt, exponiert 80/443, reverse-proxied
   zu `api:3000`, Konfiguration in `deploy/Caddyfile`

`deploy/README.md` enthält eine Schritt-für-Schritt-Anleitung für Deployment auf
Ubuntu mit Cloudflare-DNS (Server-Vorbereitung, DNS, `.env`-Konfiguration,
`docker compose up -d --build`, Backup-Hinweise). Referenziert `deploy/.env.example`.

**Seit 2026-08-25 dient Caddy zusätzlich das gebaute Angular-Frontend**
(vierter `APP_DOMAIN`-Site-Block im Caddyfile, statische Dateien aus
`deploy/frontend-dist/`, per HTTP-Basic-Auth passwortgeschützt — Tim
wollte die App erreichbar, aber noch nicht öffentlich). Das Frontend wird
weiterhin lokal gebaut (`ng build`) und die `www/`-Ausgabe auf den Server
kopiert, nicht in einem eigenen Docker-Image gebaut — bewusst einfach
gehalten für den ersten Wurf.

⚠️ **Bcrypt-Hash-Fallstrick in `deploy/.env`**: ein `$`-Zeichen in einem
Wert wird von Docker Compose als Beginn einer Variablen-Referenz
interpretiert. Bei der Ersteinrichtung hat das einen Teil eines
Bcrypt-Hashes (`$2a$14$Pbczg1azd...`) unbemerkt durch einen Leerstring
ersetzt (Compose-Warnung `"...variable is not set"`, kein Fehler) — das
Passwort-Gate hätte mit dem korrekten Passwort nicht funktioniert. Fix:
jedes `$` in `BASIC_AUTH_HASH` (und jedem anderen `$`-haltigen Wert) in
`deploy/.env` als `$$` schreiben. Nach jeder Änderung mit
`docker exec <proxy-container> caddy adapt --config /etc/caddy/Caddyfile`
gegenprüfen, dass Username/Hash im kompilierten Config wirklich stimmen,
nicht nur auf die Abwesenheit von Fehlermeldungen verlassen.

## Warum "verwaist"?

Der Git-Verlauf zeigt: echte Nutzerkonten, Admin-Panel und Backend-Anbindung wurden
gebaut (siehe Commits von Januar/Februar 2026: "init backend", "Admin panel",
"new login method", "Update for deleting and managing user" u. a.) und dann am
18.07.2026 im Frontend wieder entfernt, zugunsten einer einfacheren, rein
statischen Dashboard/Quiz-Architektur ohne Accounts. Das Backend selbst wurde
dabei **nicht gelöscht** — es liegt weiterhin vollständig im Repo, nur ruft das
Frontend es aktuell nirgends auf.

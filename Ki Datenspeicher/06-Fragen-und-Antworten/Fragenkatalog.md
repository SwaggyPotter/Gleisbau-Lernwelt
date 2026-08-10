---
tags: [fragenkatalog, faq]
autor: Claude
---

# Fragenkatalog

Häufige Fragen zum Projekt, gedacht als Schnellzugriff für eine KI, die neu in
dieses Projekt einsteigt. Antworten basieren auf Code-Analyse (Stand
2026-07-18, zuletzt gegen den Code erneut geprüft am 2026-07-22 — keine der
bestehenden Antworten musste dabei korrigiert werden). Bei Unsicherheit: im
Zweifel Tim fragen statt zu raten.

---

**F: Ruft die App aktuell irgendwo das Backend auf?**
A: Nein. Seit Commit `b461679` (18.07.2026) gibt es keinen `HttpClient`-Aufruf
gegen die eigene API mehr im Frontend. Alle Inhalte kommen aus `src/assets/`,
aller Fortschritt aus `localStorage`. Siehe [[02-Architektur/Frontend-Architektur]].

**F: Gibt es noch Login/Nutzerkonten?**
A: Im Frontend nicht mehr. Das Backend unterstützt es weiterhin (`backend/src/routes/auth.ts`),
ist aber nicht angebunden. Siehe [[02-Architektur/Backend-Architektur]].

**F: Wo finde ich die Inhalte der 14 Lernfelder?**
A: Nur noch als Archiv in `LERNFELDER-BACKUP.txt` im Projekt-Root. Nicht mehr
im aktiven Code eingebunden. Siehe [[04-Lernfelder/Lernfelder-Übersicht]] für
Zeilen-Offsets pro Lernfeld.

**F: Was ist der Unterschied zwischen "Themenquiz" und den "Zusatz"-Modulen?**
A: Themenquiz sind 10 reine Multiple-Choice-Quiz zu Gleisbau-Grundlagenthemen
(Schiene, Bettung, Kleineisen etc.), ohne Lektionstext. Die Zusatz-Module
(Nivellieren, Prozentrechnung, Volumen) haben zusätzlich echten Lektionsinhalt
(`ContentBlock`) vor dem Quiz — sie sind didaktisch umfangreicher. Gesamtquiz
bündelt die Fragen aus den drei Zusatz-Modulen. Siehe [[03-Module/Übersicht]].

**F: Warum heißt ein Ordner `lernfeld-02`, obwohl die Route `zusatz/nivellieren` ist?**
A: Historisches Überbleibsel — das Modul war ursprünglich Teil der
Lernfeld-1-14-Struktur (als Lernfeld 2) und wurde zum eigenständigen
Zusatzmodul umgewidmet, ohne die internen Dateinamen anzupassen. Siehe
[[03-Module/Zusatz-Nivellieren]].

**F: Wie wird Nutzerfortschritt gespeichert?**
A: Ausschließlich im Browser via `localStorage`, pro Modul mit eigenem Key
(z. B. `themenquiz-progress-<topicId>`). Kein Server-Sync, kein geräteübergreifender
Fortschritt. Bei Browser-Datenlöschung geht der Fortschritt verloren.

**F: Läuft das Backend irgendwo produktiv?**
A: Weiterhin nicht abschließend aus dem Code beantwortbar, aber mit mehr Detail
(Stand 2026-07-21, Code-Verifikation): `docker-compose.yml` ist ein vollwertiges
Produktiv-Setup (Postgres + Node-API + Caddy mit automatischem TLS, Healthchecks,
`restart: unless-stopped`), kein bloßes Dev-Gerüst. `deploy/README.md` beschreibt
konkret Ubuntu-Server + Cloudflare-DNS + Portweiterleitung vom Heimnetz. Aber:
`deploy/.env` (die Datei mit echter Domain/echten Zugangsdaten) ist per
`.gitignore` von Git ausgeschlossen, und alle Deploy-Dateien im Repo (`.env.example`,
`Caddyfile`, `README.md`) stammen aus einem einzigen Commit `d9d0fa5` ("init
backend", 24.01.2026) und wurden seither nicht mehr verändert — es gibt also
keine Spur im Repo, ob/wann tatsächlich `docker compose up` auf einem echten
Server ausgeführt wurde. Ob das Setup aktuell live läuft, bleibt eine reine
Tim-Frage. Siehe [[07-Offene-Punkte/Offene-Punkte]].

**F: Was ist mit dem Admin-Account `admin`/`1234`?**
A: Ein im Backend-Code hardcodierter Bootstrap-Admin-Account
(`backend/src/index.ts`, Zeilen 9–10: `ADMIN_EMAIL = 'admin'`,
`ADMIN_PASSWORD = '1234'` als Konstanten, nicht über ENV konfigurierbar). Bei
jedem Serverstart wird dieser Account per `ON CONFLICT ... DO UPDATE` neu
angelegt/zurückgesetzt. Sicherheitsrelevant, falls das Backend jemals wieder
live geht — siehe [[07-Offene-Punkte/Offene-Punkte]].

**F: Läuft/lief die App produktiv im App Store / Play Store?**
A: Nein, nach aktuellem Code-Stand (verifiziert 2026-07-21). `capacitor.config.ts`
existiert nur als Grundkonfiguration (`appId: 'com.gleisbau.lernwelt'`), aber:
es gibt weder einen `android/`- noch einen `ios/`-Ordner im Projekt (diese
entstehen erst durch `npx cap add android/ios`), noch sind die dafür nötigen
Pakete `@capacitor/android` oder `@capacitor/ios` in `package.json` installiert
(nur `@capacitor/core`, `app`, `haptics`, `keyboard`, `status-bar` — alles
Plugins, kein Plattform-Projekt). Es wurde also nie ein natives Build aus
diesem Repo erzeugt, geschweige denn veröffentlicht. Die App existiert bisher
nur als Web-App.

---

## Platzhalter für noch ungeklärte Fragen

Diese Fragen sind mir (KI, Stand 18.07.2026, ergänzt 21.07.2026) beim
Analysieren aufgefallen und noch nicht beantwortet — siehe auch
[[07-Offene-Punkte/Offene-Punkte]]:

- Soll das Backend reaktiviert werden, oder bleibt die App dauerhaft
  account-los/offline-first?
- Sollen die 14 Lernfelder-Inhalte in irgendeiner Form zurückkommen (z. B. als
  weitere Zusatz-Module wie `nivellieren`), oder ist das Themenquiz/Zusatz-Format
  der neue Standard?
- Ist `LERNFELDER-BACKUP.txt` reiner Archiv-Zweck, oder als Datenquelle für ein
  künftiges Feature gedacht? (Bestätigt per Grep über `src/`: aktuell lädt kein
  einziger Code-Pfad diese Datei — sie ist mit Sicherheit reines Archiv, die
  Frage ist nur, ob das so bleiben soll.)

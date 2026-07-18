---
tags: [fragenkatalog, faq]
autor: Claude
---

# Fragenkatalog

Häufige Fragen zum Projekt, gedacht als Schnellzugriff für eine KI, die neu in
dieses Projekt einsteigt. Antworten basieren auf Code-Analyse (Stand
2026-07-18). Bei Unsicherheit: im Zweifel Tim fragen statt zu raten.

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
A: Unklar aus dem Code allein — es gibt ein vollständiges Docker-Compose-Setup
und eine Deployment-Anleitung (`deploy/README.md`), aber ob es aktuell auf einem
Server läuft, ist eine Frage an Tim. Sollte hier ergänzt werden, sobald bekannt.

**F: Was ist mit dem Admin-Account `admin`/`1234`?**
A: Ein im Backend-Code hardcodierter Bootstrap-Admin-Account
(`backend/src/index.ts`). Sicherheitsrelevant, falls das Backend jemals wieder
live geht — siehe [[07-Offene-Punkte/Offene-Punkte]].

---

## Platzhalter für noch ungeklärte Fragen

Diese Fragen sind mir (KI, Stand 18.07.2026) beim Analysieren aufgefallen und
noch nicht beantwortet — siehe auch [[07-Offene-Punkte/Offene-Punkte]]:

- Soll das Backend reaktiviert werden, oder bleibt die App dauerhaft
  account-los/offline-first?
- Sollen die 14 Lernfelder-Inhalte in irgendeiner Form zurückkommen (z. B. als
  weitere Zusatz-Module wie `nivellieren`), oder ist das Themenquiz/Zusatz-Format
  der neue Standard?
- Ist `LERNFELDER-BACKUP.txt` reiner Archiv-Zweck, oder als Datenquelle für ein
  künftiges Feature gedacht?
- Läuft/lief die App produktiv im App Store / Play Store (Capacitor ist
  eingebunden), oder nur als Web-App?

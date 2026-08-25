---
tags: [themenquiz, quellenpruefung, transparenz]
autor: Claude
---

# Runde 16 — Neue Seite "Quellenverzeichnis"

Tim wollte (2026-08-25), nachdem die Quellenprüfung aus Runde 15 stand:

1. Beim Beantworten einer Quiz-Frage sollen alle Quellen, die die Antwort
   belegen, sichtbar sein, mit direktem Link — **existierte bereits**
   (`ThemenquizQuestion.source`/`sourceUrl`, gerendert in
   `themenquiz/components/quiz-engine.component.html`), von Tim selbst in
   der App bestätigt. Keine Code-Änderung nötig.
2. Eine zentrale Seite mit **allen** Fragen, Antworten und Quellen, für
   volle Transparenz — **neu gebaut**, siehe unten.
3. Kontrolle, ob wirklich alle Fragen eine Quelle haben — siehe
   [[15-Themenquiz-Quellenpruefung]], Stand war 636/645 (99 %), die
   restlichen 9 wurden in dieser Runde erneut per Gwen angestossen.

## Neue Seite: `/quellenverzeichnis`

Eigenständiges Top-Level-Modul `src/app/quellenverzeichnis/` (gleiche
Ebene wie `src/app/bildnachweise/`, keine Lazy-Route unter `modules/`,
analog zum bestehenden Bildnachweise-Muster). Verlinkt im Dashboard-Footer
neben "Bildnachweise".

**Aufbau:**
- Lädt beim Start alle 24 Themen (`ThemenquizDataService.getTopics()`)
  und darauf per `forkJoin` alle 24 Fragen-JSONs auf einmal — bewusst
  nicht lazy pro Thema, da die Volltextsuche sonst nicht ueber alle Daten
  gleichzeitig funktionieren wuerde und die Gesamtmenge (645 kleine
  Fragenobjekte) fuer einen Ladevorgang unproblematisch ist.
- Pro Thema ein einklappbarer Abschnitt (eigener Toggle-Zustand, kein
  `ion-accordion`, um die Fragenliste nur bei geoeffnetem Abschnitt ins
  DOM zu rendern statt alle 645 Fragen permanent offen zu halten).
- Kopfzeile je Thema zeigt "X/Y Quellen"-Chip (orange umrandet, wenn
  vollstaendig).
- Volltextsuche (Fragen, Antworten, Quelle-Bezeichnung) blendet
  Themen ohne Treffer aus und klappt Themen MIT Treffer automatisch auf.
- Pro Frage: Fragetext, richtige Antwort, Quelle als klickbarer Link
  (`target="_blank"`) oder "Noch keine Quelle hinterlegt." falls das
  Feld leer ist (aktuell nur 9 von 645 Fragen betroffen).
- Streckenplan-Design durchgehend (`--sp-*`-Tokens, gleiche Kopf-/Grid-
  Struktur wie `kategorie.page.scss`).

**Dateien:**
- `src/app/quellenverzeichnis/quellenverzeichnis.module.ts`
- `src/app/quellenverzeichnis/quellenverzeichnis-routing.module.ts`
- `src/app/quellenverzeichnis/quellenverzeichnis.page.ts`
- `src/app/quellenverzeichnis/quellenverzeichnis.page.html`
- `src/app/quellenverzeichnis/quellenverzeichnis.page.scss`
- Route `quellenverzeichnis` in `app-routing.module.ts` ergaenzt.
- Footer-Link in `dashboard.page.html`/`.scss` ergaenzt (zweiter Link
  neben "Bildnachweise", Flexbox mit Abstand statt nur zentriertem Text).

Alles von Claude direkt geschrieben (architektursensitive UI-/Routing-
Arbeit, kein Gwen-Auftrag — passt zur etablierten Regel im Projekt).

## Zwischenfall: kaputte Cline-Installation (zweites Mal)

Beim erneuten Dispatch fuer die 9 fehlenden Quellen (2026-08-25) schlug
`cline` erneut mit "Der Befehl 'cline' ist entweder falsch geschrieben
oder konnte nicht gefunden werden" fehl — exakt derselbe Fehlertyp wie am
2026-08-23 (siehe [[14-Rechentrainer-Umbau]]). Diesmal aber mit einer
neuen, aufschlussreichen Beobachtung: alle 3 Versuche schlugen in **0
Sekunden** fehl (statt der sonst ueblichen 20-150s) — ein verlaesslicher
Hinweis, dass NICHT Gwen/das Modell das Problem ist, sondern die
`cline`-Binary selbst fehlt, bevor ueberhaupt etwas an das Modell
geschickt wird. Fix wie beim ersten Mal: `npm install -g cline`.

**Ergaenzung zur Regel in [[../00-Start-Hier]]**: eine Serie von
NO_CHANGE-Ergebnissen mit **0 Sekunden** Laufzeit (nicht nur
"verdaechtig kurz", sondern buchstaeblich sofort) ist ein noch
zuverlaessigeres Signal fuer eine kaputte `cline`-Installation als
wechselnde/eskalierende Fehlermeldungen — beide Muster gehoeren zusammen
in den gleichen Diagnoseschritt (`ls .../cline/bin/` pruefen).

## Verifikation

- `ng build --configuration production`: gruen, eigener Chunk
  `quellenverzeichnis-quellenverzeichnis-module` im Build-Output
  bestaetigt (10.96 kB) — nach der etablierten Regel "neues Modul nur
  dann wirklich kompiliert, wenn ein eigener Chunk erscheint".
- Playwright: Seite laedt, zeigt korrekten Gesamtstand (636/645, 99 %),
  Themen-Abschnitte klappen auf/zu, Fragen/Antworten/Quellen rendern
  korrekt mit funktionierendem Link, Volltextsuche filtert korrekt
  (getestet mit "Wikipedia" → 16 Themen-Treffer, mit einem bewusst
  nicht vorkommenden Begriff → 0 Treffer, beides wie erwartet).
- Dashboard-Footer-Link zu `/quellenverzeichnis` per Playwright bestätigt.

---
tags: [modul, zusatz, materialrechner]
autor: Claude
---

# Modul: Zusatz – Materialrechner

Route: `zusatz/materialrechner`
Pfad: `src/app/modules/zusatz/materialrechner/`

Anders als die übrigen Zusatzmodule keine feste Fragenliste, sondern ein
**Zufallsgenerator**: bei jedem Aufruf/Klick auf "Neue Aufgabe" entsteht eine
neue Rechenaufgabe mit frischen Zahlen — unbegrenztes Übungsmaterial statt
einer festen Anzahl Fragen. Auf Wunsch von Tim ergänzt (2026-08-10), als
Unterrichtsmaterial gedacht.

## Aufgabentypen (`AufgabenGeneratorService`)

1. **Schicht-Volumen** — Quader (L × B × D), bei `schwer` zusätzlich mit
   rechteckiger Aussparung (Kabelkanal) zum Subtrahieren.
2. **Trapez-Volumen** — Gleisbett-/Damm-Querschnitt; bei `mittel`/`schwer`
   muss die untere Breite erst aus Böschungsneigung 1:n abgeleitet werden.
3. **Material-Gewicht** — Volumen × Schüttdichte; bei `schwer` zusätzlich
   Umrechnung in LKW-Fahrten (aufrunden, da eine angefangene Fahrt zählt).
4. **Gleisabschnitt** — kombiniert Trapez-Querschnitt + Länge + Gewicht
   (+ bei `schwer` Böschungsneigung + LKW-Fahrten) — der komplexeste Typ.

Je Typ 3 Schwierigkeitsgrade (`leicht`/`mittel`/`schwer`), die Zahlenbereiche
und Aufgabenkomplexität steuern. Distraktoren (falsche Antwortoptionen)
werden aus typischen Rechenfehlern generiert (Einheiten nicht umgerechnet,
Formel verwechselt, Böschung ignoriert) statt zufällig — siehe
`buildChoices()` in `services/rechnen-utils.ts`.

## Schüttdichte-Tabelle

`data/schuettdichten.ts` — Richtwerte für losen/unverdichteten Zustand
(Gleisschotter, Kies, Sand, Kies-Sand-Gemisch, Frischbeton, Mutterboden),
mit Quelle je Material im Code kommentiert (Baustoffhandel-Rechner,
Herstellerangaben; per Websuche recherchiert, nicht aus Trainingswissen).
Verdichtete Tragschichten wiegen real ca. 10–25 % mehr — das steht auch als
Hinweis auf der Seite selbst.

## Qualitätssicherung

Vor dem Live-Gang mit einem Node/tsx-Testskript 3600 generierte Fragen
(alle 4 Typen × 3 Schwierigkeitsgrade × 300 Durchläufe) automatisiert
geprüft: genau 4 eindeutige Antwortoptionen, korrekte Antwort unter den
Optionen, keine NaN/negative Werte. Dabei zwei echte Bugs gefunden und
behoben (beide in `rechnen-utils.ts`/`buildChoices`):

- Bei kleinen Ganzzahl-Ergebnissen (z. B. "1 Fahrt") kollabierten die
  primären Distraktor-Kandidaten durch Rundung auf 0 Nachkommastellen zu
  Duplikaten.
- Der Auffüll-Fallback hing sich bei wiederholten Kollisionen fest (die
  Vorzeichen-Alternierung hing von der stagnierenden Trefferzahl ab statt
  von einem unabhängigen Zähler).

Kein Playwright/Browser-Test durchgeführt (nicht installiert, hoher
Startaufwand für eine einzelne Änderung) — stattdessen TypeScript-Compile
(`tsc --noEmit`),
Angular-Compile mit `strictTemplates: true` (fängt Template-Bindungsfehler)
und der beschriebene Logik-Stresstest. Layout ist vom bewährten
Volumen-Modul-Muster übernommen (gleiche `ion-item`/`.correct`/`.wrong`-
Klassen wie [[03-Module/Zusatz-Volumen]]).

## Fortschritt

`localStorage` unter `materialrechner-progress`, getrennt nach
Schwierigkeitsgrad (richtig/falsch-Zähler) — kein Bezug zu einzelnen
Fragen-IDs, da Fragen nicht wiederholbar/referenzierbar sind.

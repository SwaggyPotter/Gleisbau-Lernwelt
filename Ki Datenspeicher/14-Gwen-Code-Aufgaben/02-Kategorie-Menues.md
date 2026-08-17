---
tags: [gwen-code-aufgabe, navigation, dashboard]
autor: Claude
status: abgeschlossen
---

# Eigene Menüs für Selbststudium / Quiz / Spiele (2026-08-17)

## Auftrag

Tim: "Ich will das die Themen Selbststudium, Quiz und Spiele alle in solche
eigenen Menüs gepackt werden. Ergo das man über die Navigationsleiste zu den
Unterkategorien kommt." Ausdrücklich mit Gwen umzusetzen, um Claude-Token zu
sparen.

## Umsetzung

Statt drei separater Seiten **eine** Kategorie-Seite mit Route-Parameter:
`/kategorie/:id` (`selbststudium` | `quiz` | `spiele`). Spart zwei komplette
Module und hält die Darstellung automatisch konsistent.

- **`src/app/shared/katalog.ts`** (neu): `QuizTile`-Typ plus die Konstanten
  `SELBSTSTUDIUM_TILES`, `QUIZ_TILES`, `SPIELE_TILES`. Vorher lagen die
  Kacheldaten in `dashboard.page.ts`; die Spiele-Kachel war sogar nur im
  HTML hartkodiert und ist jetzt ebenfalls Daten.
- **`src/app/modules/kategorie/`** (neu): Lazy-geladenes Modul mit
  `KategoriePage`, liest `:id` aus der Route und wählt Titel/Beschreibung/
  Kacheln aus einer lokalen `KATEGORIEN`-Liste.
- **Navigationsleiste**: zweite `ion-toolbar` im Header von Dashboard UND
  Kategorie-Seite mit Start / Selbststudium / Quiz / Spiele,
  `routerLinkActive` markiert den aktiven Punkt. Auf schmalen Displays
  horizontal scrollbar.
- **Dashboard**: die drei Sektionen (108 Zeilen) entfernt; Wissenstests,
  Gleisbau-Lernfelder und Allgemeine Bauberufe bleiben dort. Die
  Fortschritts-Zusammenfassung zählt weiterhin alle Kacheln.

## Gwen-Protokoll

| # | Auftrag | Ergebnis |
|---|---|---|
| A1 | katalog.ts anlegen + Dashboard umstellen | NO_CHANGE — **Kontextfenster nur 4096** statt 131072, Cline meldete "context window exceeded". |
| — | Infrastruktur repariert | Modell mit `lms load ... --context-length 131072` neu geladen (war nach LM-Studio-Neustart auf Default-Kontext MIT 60-Minuten-TTL). Zusätzlich war das globale `cline`-npm-Paket kaputt (Eintrag `cline@` ohne Version, `bin/`-Ordner fehlte) → `npm install -g cline`. |
| A2 | Wiederholung | BUILD_FAILED — katalog.ts **vollständig und wortgleich korrekt** erzeugt (115 Zeilen), im Dashboard aber nur der Import gesetzt; die lokale `QuizTile`-Definition wurde statt gelöscht zu `export type` geändert (→ TS2440 Namenskonflikt), die beiden Arrays gar nicht ersetzt. Claude hat die Restarbeit selbst gemacht. |
| B | Kategorie-Modul (5 Dateien) + Route | SUCCESS_BUILD_OK, aber zwei Lücken: `app-routing.module.ts` gar nicht angefasst, und `kategorie.page.html` **auf 26 Bytes abgeschnitten** (`<ion-header [translucent]=` — mitten im Attribut). Der Build lief trotzdem durch, weil das Modul ohne Route nie geladen wird — der Build-Check allein hätte das also NICHT gefangen. |
| C | Navigation + Dashboard-Aufräumen | Direkt von Claude gemacht, siehe unten. |

## Erkenntnisse für künftige Delegationen

1. **Vor jedem Gwen-Lauf den Modellzustand prüfen** (`lms ps`): Nach einem
   LM-Studio-Neustart liegt der Kontext bei 4096, dann scheitert jeder
   nicht-triviale Auftrag sofort. Kanonischer Fix: `tools/gwen-modell-laden.cmd`.
2. **Gwen kann Dateien still abschneiden.** Bei neu erzeugten Dateien immer
   die Dateigröße/Zeilenzahl gegenprüfen — ein erfolgreicher Build ist kein
   Beweis, wenn die Datei noch gar nicht eingebunden ist.
3. **Löschen und Ersetzen in großen Dateien bleibt Gwens Schwachstelle**
   (hier: 500-Zeilen-Dashboard). Neue Dateien *erzeugen* klappt zuverlässig,
   bestehende umbauen nicht. Für Umbauten in großen Dateien lohnt die
   Delegation nicht — die Nachkontrolle kostet mehr Token als das
   Selbermachen.
4. Kleine, additive Änderungen (Navigation, SCSS) ebenfalls selbst machen:
   Der Supervisions-Overhead pro Gwen-Runde übersteigt den Schreibaufwand.

## Verifikation

Production-Build fehlerfrei. Per Playwright durch alle drei Kategorien
navigiert: Selbststudium 3 Kacheln, Quiz 5, Spiele 1, aktiver
Navigationspunkt jeweils korrekt markiert, Rückweg zum Dashboard
funktioniert, keine Konsolenfehler. Desktop und Mobile (390 px) geprüft.

**Stolperstein beim Testen:** Ionic behält die vorherige Seite versteckt im
DOM, dadurch matchen Selektoren doppelt. Testselektoren deshalb auf die
Komponente eingrenzen (`app-kategorie .tile-card`), nicht global.

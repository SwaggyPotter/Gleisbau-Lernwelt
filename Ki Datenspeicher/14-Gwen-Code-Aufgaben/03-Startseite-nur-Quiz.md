---
tags: [navigation, dashboard, umbau]
autor: Claude
status: abgeschlossen
---

# Startseite entschlackt, App auf Quiz fokussiert (2026-08-17)

## Auftrag

Tim: "Arbeite jetzt mal ohne LM Studio weiter, also ohne Qwen. Ich will
nicht, dass auf Start alle Themengebiete zu sehen sind. Dazu will ich, dass
es richtig sortiert wird und die Seite so umgebaut wird, dass man nur noch
Quiz hat. Nichts zum Selbstlernen, das machen wir später."

**Ab hier also wieder ohne Gwen-Delegation** — siehe
[[02-Kategorie-Menues]] für die Gründe (Umbauten in großen Dateien und
stille Dateiabschnitte machten die Nachkontrolle teurer als das
Selbermachen).

## Neue Struktur

Navigation: **Start | Wissenstests | Lernfelder | Rechentrainer | Spiele**

- **Start** zeigt keine Einzelthemen mehr, nur noch vier Bereichs-Kacheln
  mit Anzahl-Angabe. Begrüßung, Suche und Fortschrittsanzeige bleiben.
- **Suche neu gedacht:** vorher filterte sie jede Sektion einzeln. Jetzt
  liegt auf der Startseite eine bereichsübergreifende Suche — ohne Eingabe
  die Bereiche, mit Eingabe eine flache Trefferliste über alle Quizze
  hinweg. Damit bleibt der schnelle Direktzugriff erhalten, obwohl die
  Themenlisten weggezogen sind.
- **Wissenstests** (10), **Lernfelder** (14, in zwei Abschnitten),
  **Rechentrainer** (5), **Spiele** (1) liegen unter `/kategorie/:id`.
- **Selbststudium ist raus** — weder in der Navigation noch auf der
  Startseite. Die Daten (`SELBSTSTUDIUM_TILES`) bleiben in `katalog.ts`
  stehen und sind dort als bewusst ungenutzt kommentiert, damit der Bereich
  später ohne Neuaufbau wieder eingehängt werden kann. Die Lese-Seiten
  unter `/zusatz/...` existieren unverändert weiter, nur die Einstiege
  fehlen.

## Sortierung

Die Kategorie-Seite kann jetzt mehrere Abschnitte je Kategorie darstellen
(`KategorieGruppe`). "Lernfelder" nutzt das: erst **Gleisbau-Lernfelder
(LF10-14)** als Schwerpunkt der App, darunter **Allgemeine Bauberufe
(LF01-09)**. Innerhalb beider Gruppen wird per `nachLernfeldnummer()`
numerisch sortiert — die Reihenfolge hängt damit nicht mehr daran, wie die
Einträge zufällig im Array stehen. Die Wissenstests behalten ihre
didaktische Reihenfolge (Grundlagen → Spurweite → Schiene → Schwellen →
Bettung → Kleineisen → Werkzeuge → Geräte → Messmittel → Trassenplan).

## Technische Änderungen

- `katalog.ts` um `WISSENSTEST_TILES`, `GLEISBAU_LERNFELD_TILES` und
  `BAUBERUFE_TILES` erweitert (vorher in `dashboard.page.ts`). `QUIZ_TILES`
  → `RECHENTRAINER_TILES` umbenannt, weil "Quiz" inzwischen für die ganze
  App gilt und der Name nichts mehr unterschied.
- `dashboard.page.ts` von 423 auf ~175 Zeilen geschrumpft: enthält nur noch
  die Bereichsdefinition, Suche und Fortschrittsberechnung. Der Fortschritt
  zählt weiterhin über alle Themen-/Lernfeld-Kacheln, ist also von der
  Umstellung nicht betroffen.
- `KategoriePage` um Gruppen und die Lernfeld-Sortierung erweitert.

## Verifikation

Production-Build fehlerfrei. Per Playwright geprüft: Startseite zeigt 4
Bereiche und **0** Einzelthemen, Suche nach "bettung" liefert 1 Treffer,
alle vier Kategorien haben die erwarteten Kachelzahlen (10/14/5/1),
Lernfelder in 2 Gruppen mit korrekter Reihenfolge (LF10, 11, 12, 13, 14,
dann LF01 …), keine Konsolenfehler.

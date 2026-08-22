---
tags: [spiel, zusatzmodul, gwen-code-aufgabe, schienenprofile]
autor: Claude
status: gebaut, Datenlage nicht anderweitig geprüft
---

# Schienen erkennen — drei Spielmodi (2026-08-17)

## Auftrag

Tim schickte eine Tabellenübersicht (Foto) mit sieben Schienenformen
(Leichte/Schwere Vignolschiene, Kranschiene, Rillenschiene,
Konstruktionsschiene, Spurrille, Stromschiene) und rund 50 konkreten
Profilen samt Höhe, Fußbreite, Kopfbreite, Stegstärke und Gewicht. Gewünscht
als drittes Spiel unter Spiele, mit drei Schwierigkeitsstufen:

1. Einfach: nur die **Schienenform** (Kategorie) am Umriss erkennen.
2. Mittel: Umriss + Maße zeigen, **konkretes Profil** (Name) erraten.
3. Umkehrung/Upgrade: Profilname + Umriss zeigen, **Maße selbst eintragen**.

Ausdrücklich als "viel Arbeit, aber nicht kompliziert" an Gwen delegiert:
"Lass den so lange durchrattern, bis er fertig ist."

## Warum die Daten NICHT von Gwen kamen

Gwen (lokales Textmodell ohne Bildeingang) kann das Tabellenfoto nicht
lesen. Claude hat deshalb selbst transkribiert (~50 Profile, 6 Spalten) und
die Silhouetten-Geometrie entworfen — beides erfordert Bildlesen bzw.
gestalterisches Urteil, wofür Gwen nicht geeignet ist. Erst die fertige
Datendatei ging als Grundlage in den Gwen-Auftrag.

**Datenquelle, unbedingt beachten:** Die Werte in
`src/app/shared/schienenprofile.ts` sind von einem dichten Tabellenfoto
abgetippt — ein Übertragungsfehler ist bei dieser Menge nicht
auszuschließen. Vor Verwendung als geprüfter Lehrinhalt gegenprüfen. Die
Silhouetten sind stilisierte Schemazeichnungen (Kopf-/Fußhöhen-Anteil
mangels Tabellenwert geschätzt: Kopf ~26 %, Fuß ~18 % der Gesamthöhe), keine
maßstabsgetreuen Konstruktionszeichnungen — nur Höhe, Fußbreite, Kopfbreite
und Stegstärke stammen direkt aus der Tabelle.

**Konstruktionsschienen als Vereinfachung:** Diese Kategorie umfasst in der
Quelltabelle mehrere sehr unterschiedliche Sonderformen (Z-, Flach- und
Winkelprofile). Für das Erkennungsspiel nutzt sie stellvertretend dieselbe
Vignol-Silhouette wie die echten Vignolschienen — inhaltlich eine bewusste
Vereinfachung, die im Zweifel eher zu leicht als zu schwer ist.

## Umsetzung

Neues Modul `src/app/modules/zusatz/schienenraten/`, Route
`/zusatz/schienenraten`, dritte Kachel in `SPIELE_TILES`.

- **Modus 1 (Form erkennen):** Zufallskategorie mit Platzhaltermaßen
  (`KATEGORIE_MUSTERMASSE`) gerendert, alle 7 Kategorienamen als Optionen,
  Feedback inkl. der Kategorie-Beschreibung.
- **Modus 2 (Profil erraten):** Zufallsprofil mit echten Maßen als Text
  daneben, 4 Antwortoptionen (korrekt + 3 Distraktoren). Distraktoren
  bevorzugt aus **derselben Kategorie** (schwerer/lehrreicher als
  Distraktoren querbeet), nur bei zu kleiner Kategorie mit Profilen aus dem
  Gesamtpool aufgefüllt.
- **Modus 3 (Werte eintragen):** Profilname + Silhouette ohne Zahlen, vier
  Zahlenfelder (Höhe/Fußbreite/Kopfbreite/Steg). Toleranz ±8 % (mind. 2 mm)
  pro Feld — bewusst großzügig, da es um Größenordnung/Verständnis geht,
  nicht ums Auswendiglernen von Dezimalstellen. Nach Prüfung werden die
  echten Werte aufgedeckt.

Jeder Modus hat einen eigenen Punktestand (richtig/Versuche), der beim
Moduswechsel erhalten bleibt.

**Silhouetten-Generatoren** (`src/app/shared/schienenprofile.ts`,
Funktion `schienenPfad()`): fünf Pfad-Familien — `vignolPfad` (auch für
Konstruktionsschienen), `kranPfad` (breite flache Basis, kaum Taillierung),
`rillenPfad` (Vignol-Kopf plus asymmetrische Führungslippe), `spurrillePfad`
(niedriges Hakenstück), `stromschienePfad` (Pilzkopf ohne schlanken Steg) —
alle aus Höhe/Fußbreite/Kopfbreite/Steg berechnet, dynamische viewBox
(`schienenViewBox()`) pro Silhouette.

## Gwen-Protokoll

Ein einziger, sehr großer Auftrag (7 Dateien, wörtlicher Volltext für
Modul, Routes, Page-TS/HTML/SCSS sowie die Ergänzungen in
`app-routing.module.ts` und `katalog.ts`), Modell vorher mit
`tools/gwen-modell-laden.cmd`-Logik auf vollen 131k-Kontext geladen (war
zwischenzeitlich entladen).

**Ergebnis:** `SUCCESS_BUILD_OK`, aber nur **2 von 7 Dateien** tatsächlich
angelegt (`schienenraten.module.ts`, `schienenraten.routes.ts` — beide
korrekt und wortgleich). Die restlichen fünf (Page-Komponente komplett,
Routing-Eintrag, Katalog-Eintrag) fehlten. **Der Build meldete trotzdem
Erfolg**, weil das neue Modul zu diesem Zeitpunkt nirgends importiert war —
ein nie referenziertes Lazy-Modul wird von Angular schlicht nicht
kompiliert. Exakt derselbe Fehlermodus wie in
[[02-Kategorie-Menues]] (dort: `kategorie.page.html` auf 26 Byte
abgeschnitten, ebenfalls unbemerkt vom Build). **Der Build-Erfolg ist bei
neu angelegten, noch nicht verlinkten Modulen kein verlässliches Signal.**

Claude hat die fehlenden fünf Dateien direkt geschrieben (Inhalt lag durch
den Auftragstext bereits wortgleich vor, kein neuer Entwurf nötig) und
Routing/Katalog von Hand ergänzt.

## Verifikation

Production-Build fehlerfrei, neues Modul erscheint als eigener Lazy-Chunk.
Per Playwright alle drei Modi durchgespielt: Spiele-Kategorie zeigt jetzt 3
Kacheln; Modus 1 zeigt korrekte Kategorie-Zuordnung inkl. Farb-Feedback;
Modus 2 liefert zur Kontrolle die Maße neben der Silhouette, Distraktoren
stammen nachweislich aus derselben Kategorie (Beispiel: BA 75 mit Zu 2-49 /
Rl 1-60 / VK Ri 60, alle Konstruktionsschiene); Modus 3 markiert bei
absichtlich falscher Eingabe (999 mm) alle vier Felder korrekt als falsch
und deckt die echten Werte auf. Keine Konsolenfehler.

## Nachbesserung 1: feste Skalierung in Modus 1 (2026-08-19, Claude)

Tim bemängelte, dass leichte und schwere Vignolschiene im Formen-Modus kaum
zu unterscheiden waren. Ursache: jede Silhouette bekam ihre eigene, auf sich
selbst zugeschnittene viewBox (`schienenViewBox()`), wodurch jede Kategorie
gleich groß ins Bild skaliert wurde — der einzige echte Unterschied
zwischen beiden Vignol-Varianten (dieselbe Formel, nur andere absolute
Größe) ging dabei verloren. Fix: neue Konstante `FORMEN_VIEWBOX` in
`schienenprofile.ts`, aus der größten Kategorie berechnet und für alle 7
Kategorien in Modus 1 gemeinsam verwendet — jetzt füllt die schwere
Vignolschiene den Rahmen sichtbar stärker aus als die leichte. Modus 2/3
unverändert (dort helfen ohnehin die Maßzahlen).

## Nachbesserung 2: Modus 1 als Direktvergleich (2026-08-19, Claude)

Tim wollte es weiter vereinfachen: statt einer zufälligen Einzelform pro
Runde jetzt alle 7 Formen gleichzeitig nebeneinander (in der o.g. festen
Skalierung), damit man sie direkt vergleichen kann. Neuer Ablauf: Karte
anklicken (waehlt sie aus) → Antwortmöglichkeit anklicken (ordnet sie zu) →
Karte faerbt sich sofort gruen/rot mit Kategorienamen darunter. Jede Karte
ist nur einmal beantwortbar; nach allen 7 erscheint "Neue Runde" (neu
gemischte Reihenfolge). Datenmodell dafuer umgebaut: `FormenRunde` haelt
jetzt `karten: FormenKarte[]` (7 Karten mit eigener Antwort) statt einer
einzelnen Kategorie. Verifiziert per Playwright: 7 Karten, 7 Optionen,
Zuordnung inkl. korrekt/falsch-Faerbung funktioniert, "Neue Runde" mischt
und setzt zurueck, keine Konsolenfehler.

## Nächster möglicher Schritt

Die Profildaten sollten bei Gelegenheit gegen die Originaltabelle oder eine
Norm (z. B. EN 13674) gegengeprüft werden, besonders die auffälligen Werte
(Bl 180/265 mit 162 mm Stegstärke und 309 kg/m wirkt wie eine Sonderform,
nicht wie ein Übertragungsfehler — aber ungeprüft).

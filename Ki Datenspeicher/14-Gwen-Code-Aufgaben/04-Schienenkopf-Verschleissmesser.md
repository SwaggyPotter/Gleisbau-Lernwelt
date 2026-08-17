---
tags: [spiel, zusatzmodul, verschleissmessung]
autor: Claude
status: gebaut, Fachdaten teils ungeprüft
---

# Schienenkopf-Verschleissmesser als Simulation (2026-08-17)

## Auftrag

Tim schickte ein Foto eines Schienenkopf-Verschleissmessers (SKM) mit
eingelegtem Moppelstück und beschrieb den Aufbau: Halterung am Schienenfuß,
Fühlerlehre auf die Stegdicke/das Profil einstellen, Messlatte am Kopf
hoch-/runterschieben, oben mittig ein Messfühler für Fahrkante und
Kopfoberfläche. Gewünscht als Anwendung unter **Spiele**, wie die
Nivellierlatte — "lediglich damit man das selber einstellen kann, um zu
gucken, wie das funktioniert".

## Umsetzung

Neues Modul `src/app/modules/zusatz/schienenmesser/`, Route
`/zusatz/schienenmesser`, als zweite Kachel in `SPIELE_TILES`.

Ablauf in drei Schritten, dem echten Gerät nachempfunden:

1. **Gerät einstellen** — Fühlerlehre (Steg) und Messlatte (Kopf) je auf
   49E5 / 54E4 / 60E2. Solange nicht beide auf dem tatsächlich verbauten
   Profil stehen, sind die Messschieber **gesperrt** und ein Hinweis sagt,
   dass jede Ablesung falsch wäre. Das ist der didaktische Kern: ohne
   richtigen Bezugspunkt ist die Messung wertlos.
2. **Messfühler zustellen** — zwei Schieber fahren die Fühler an die
   Fahrfläche bzw. an die Fahrkante. Ein Wert erscheint erst bei Kontakt,
   genau wie in echt, wo man bis zum Anschlag zustellt und dann abliest.
   Der Kontakt ist im Querschnitt sichtbar (Fühler wird grün).
3. **Ergebnis** — Profil, Nennhöhe, Höhen-/Seitenverschleiß und Resthöhe
   zum Abgleich aufdeckbar. "Neue Schiene" würfelt Profil und Verschleiß neu.

**Darstellung:** Schienenquerschnitt als SVG, direkt aus den Profildaten
gerechnet (Nennprofil gestrichelt, abgefahrenes Profil ausgefüllt), dazu die
Messtiefenlinie bei 14 mm. Weil Verschleiß im Millimeterbereich bei 149-172 mm
Schienenhöhe in der Gesamtansicht praktisch unsichtbar ist, gibt es darunter
eine **vergrößerte Kopfansicht** — dort sieht man den Unterschied zwischen
Soll- und Ist-Kontur deutlich.

## Datenlage — WICHTIG

Bewusst zurückhaltend, weil das Lehrmaterial ist:

- **Belegt und verwendet:** Nennhöhen 49E5 = 149 mm, 54E4 = 161 mm,
  60E2 = 172 mm; Messtiefe für den Seitenverschleiß 14 mm unter
  Schienenoberkante.
- **Nur zum Zeichnen, vereinfacht:** Fuß-/Kopfbreite, Stegdicke, Fuß-/
  Kopfhöhe. Stehen als solche im Code kommentiert und werden in der
  Oberfläche **nicht** als Zahlenwerte ausgegeben. Vor einer Verwendung als
  Lehrinhalt gegen EN 13674-1 bzw. die DB-Regelwerke prüfen.
- **Bewusst weggelassen:** Grenzwerte für zulässigen Verschleiß. Die hängen
  von Regelwerk und Streckenkategorie ab — erfundene Zahlen wären hier
  schädlicher als gar keine. In der Oberfläche steht ein entsprechender
  Hinweis.

**Offener Punkt:** Die Profilmaße (außer Höhe) und ggf. die Grenzwerte
sollten recherchiert und ergänzt werden, dann kann die Zeichnung maßstäblich
korrekt werden und man könnte "noch zulässig / Wechsel fällig" ergänzen.

## Verifikation

Production-Build fehlerfrei. Per Playwright den kompletten Ablauf
durchgespielt: Navigation über die Spiele-Kategorie (jetzt 2 Kacheln),
Warnhinweis bei falscher Einstellung, Schieber dabei nachweislich gesperrt,
nach korrekter Einstellung Freigabe, Zustellen auf den echten Verschleißwert
liefert Kontakt und exakt den erwarteten Messwert (mehrfach mit
unterschiedlichen Zufallsschienen), keine Konsolenfehler.

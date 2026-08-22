---
tags: [spiel, zusatzmodul, verschleissmessung]
autor: Claude
status: gebaut, Fachdaten teils ungeprüft, seit 2026-08-19 komplett neue Fassung
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

## Verifikation (erste Fassung)

Production-Build fehlerfrei. Per Playwright den kompletten Ablauf
durchgespielt: Navigation über die Spiele-Kategorie (jetzt 2 Kacheln),
Warnhinweis bei falscher Einstellung, Schieber dabei nachweislich gesperrt,
nach korrekter Einstellung Freigabe, Zustellen auf den echten Verschleißwert
liefert Kontakt und exakt den erwarteten Messwert (mehrfach mit
unterschiedlichen Zufallsschienen), keine Konsolenfehler.

## Komplettaustausch: 1:1-Übernahme einer fertigen Referenz-Simulation (2026-08-19, Claude)

Tim lieferte eine vollstaendige, eigenstaendige HTML-Datei
(`schienenkopf-verschleissmesser.html`) — offenbar mit Claude ausserhalb
dieser Session gebaut — mit einer deutlich realistischeren Simulation:
echte Zieh-Interaktion (Maus/Touch) statt Schieberegler, eine feste
Geraete-Geometrie (Hebel-Kinematik mit fixem 43°-Fuehlerarm-Winkel,
Pivot-Punkt haengt von der tatsaechlichen Fussbreite ab) statt simpler
linearer Verschiebung. Auftrag: 1:1 uebernehmen, nur bei absoluter
Sicherheit selbst verbessern, nichts kaputt machen. Wegen der
Praezisionsanforderung (Geometrie/Physik) direkt von Claude umgesetzt,
nicht an Gwen delegiert.

**Vollstaendiger Austausch** von `schienenmesser.page.ts/html/scss` — die
alte Fassung (Regler + Rechteck-Profil-Vereinfachung, oben dokumentiert)
ist komplett ersetzt. Modul/Routes/Katalog-Eintrag unveraendert.

**Wichtigste Aenderung gegenueber der alten Fassung:** Bei falscher
Profileinstellung werden die Messfuehler jetzt NICHT mehr gesperrt,
sondern liefern **plausibel falsche** Werte (der Messschlitten sitzt
geometrisch tatsaechlich versetzt) — realistischer als eine reine
Deaktivierung. Ausserdem: 54E4 aendert sich von 161 mm auf **154 mm**
Nennhoehe (Wert aus der neuen Referenzdatei uebernommen, dort auch im
Fliesstext so benannt — falls die alte 161-mm-Angabe eigentlich korrekt
war, bitte gegenpruefen).

**Technische Portierung (Angular/Ionic-spezifisch):**
- Die komplette Geraete-Logik der Vorlage (Geometrie, Kinematik, SVG-Aufbau)
  ist als eigene Funktion `initSchienenmesser(root)` fast wortgleich
  uebernommen, typisiert fuer den strikten TS-Compiler dieses Projekts,
  aber inhaltlich unveraendert (gleiche Formeln, gleiche Konstanten,
  gleiche Reihenfolge). Sie wird in `ngAfterViewInit()` aufgerufen und
  liefert eine Aufraeum-Funktion fuer `ngOnDestroy()`.
- `document.getElementById(...)` aus der Vorlage wurde durch eine auf das
  Komponenten-Root-Element beschraenkte Abfrage ersetzt — Ionic haelt
  besuchte Seiten ausgeblendet im DOM (`.ion-page-hidden`), ein globales
  `getElementById` haette bei einem zweiten Besuch derselben Seite sonst
  potenziell ein Element der alten, toten Instanz treffen koennen.
- Der globale `window.addEventListener('keydown', ...)` der Vorlage wird
  jetzt beim Verlassen der Seite wieder entfernt (sonst Leck ueber die
  Seite hinaus, da Angular die Komponente zerstoert aber der Browser-Tab
  bestehen bleibt).
- Die eigene `:root{...}`-Farbpalette der Vorlage wurde 1:1 uebernommen,
  aber auf `:host` umgehaengt (Angular scoped Komponenten-Stylesheets;
  `:root` haette dort nicht zuverlaessig gegriffen). Bewusst NICHT auf die
  App-weiten `--sp-*`-Tokens umgestellt, um die Vorlage moeglichst
  unveraendert zu uebernehmen.
- Einzige bewusste Verbesserung (da 100% sicher, rein kosmetisch): der
  Greif-Cursor (`cursor:grab`) fuer die ziehbaren Teile ist direkt als
  Inline-Style im generierten SVG-Markup gesetzt statt in einer externen
  CSS-Regel — eine CSS-Regel haette die per `innerHTML` eingefuegten
  Elemente nicht erreicht, weil Angulars Style-Kapselung nur selbst
  gerenderte Template-Elemente markiert, nicht per innerHTML injizierten
  Inhalt.
- Text/Kommentare der Vorlage kamen mit kaputter Kodierung an (UTF-8
  Mehrbyte-Zeichen mit abgeschnittenen Folgebytes, z. B. "GerÃ¤t" statt
  "Gerät"); rekonstruiert und in der im Projekt durchgaengig genutzten
  ASCII-Schreibweise (ae/oe/ue/ss statt Umlaute/ß) neu geschrieben, echte
  Sonderzeichen wie Gedankenstrich "—" und Mittelpunkt "·" beibehalten,
  da im Projekt bereits so verwendet.

## Verifikation (neue Fassung)

Production-Build fehlerfrei, eigener Lazy-Chunk vorhanden. Per Playwright:
Fuehlerlehre und Messlatte per Klick+Pfeiltasten auf das tatsaechlich
verbaute Profil gestellt → Bezugsanzeige wechselt korrekt auf
"Bezug stimmt"; beide Messfuehler per Ziehen bis zum Anschlag zugestellt
(Clamp-Logik stoppt automatisch am Kontaktpunkt) → **Hoehen- und
Seitenverschleiss-Anzeige treffen nach Aufdecken exakt den echten,
zufaellig gewuerfelten Wert (Δ0,0 in beiden Faellen)** — das bestaetigt,
dass die uebernommene Kinematik-Formel korrekt transkribiert wurde.
"Profil verdeckt", "Sollprofil" und "Neue Schiene" geprueft, keine
Konsolenfehler. Screenshots bestaetigen die visuelle Uebereinstimmung mit
der Vorlage (Gussteile, Messingbalken, Kopf-Detailansicht).

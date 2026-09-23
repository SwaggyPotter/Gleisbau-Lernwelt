# Auftrag: Theme-System mit 10 Designs für die Gleisbau-Lernwelt

## Ziel
Die Gleisbau-Lernwelt bekommt ein umschaltbares Theme-System mit **10 Designs**. Standard ist **Signalwerk**. Farben, Schriften, Komponenten und Animationen sollen so aussehen und sich so bewegen wie in der Referenzdatei `gleisbau-designvorschau.html`. Diese Datei liegt bei und ist die verbindliche Vorlage.

## Referenzdatei
- Lege `gleisbau-designvorschau.html` unter `design-reference/` im Repo ab.
- Übernimm Hex-Werte, Schriften, Abstände, Radien, Schatten und Animationen (Keyframes, Dauer, Easing) **exakt** aus dieser Datei.
- Wenn dir etwas unklar ist, gilt: so wie in der Referenz.

## Schritt 0: Erst analysieren, dann bauen
1. Sieh dir die bestehende Projektstruktur an (Framework, Routing, Styles, vorhandene Module wie Quizduell, Nivellierlatten-Simulation, Schienenkopf-Verschleißmesser, Rechenaufgaben).
2. Schreib mir einen kurzen Plan: welche Dateien du anlegst oder änderst und wo die Signatur-Komponenten eingebaut werden.
3. Warte auf mein OK, bevor du größere Umbauten machst.

## Die 10 Themes
| ID | Name | Rolle |
|---|---|---|
| `signalwerk` | Signalwerk | **Standard** |
| `baustelle` | Baustelle | |
| `blaupause` | Blaupause | |
| `bahn-clean` | Bahn-Clean | |
| `nachtschicht` | Nachtschicht | |
| `messing` | Messing & Stahl | |
| `bahnsteig` | Bahnsteig-Anzeige | |
| `streckennetz` | Streckennetz | |
| `stellwerk` | Gleisbildstellwerk | |
| `gelbe-flotte` | Gelbe Flotte | |

## Theme-System
- Umsetzung über CSS Custom Properties auf `<html data-theme="...">`, eine Datei pro Theme (z. B. `styles/themes/signalwerk.css`).
- Variablen wie in der Referenz: `--bg`, `--surface`, `--text`, `--muted`, `--primary`, `--on-primary`, `--accent`, `--ok`, `--ok-text`, `--bad`, `--bad-text`, `--border`, `--border-strong`, `--radius`, `--shadow`, `--fh` (Überschriften), `--fb` (Text), `--fm` (Zahlen/Mono).
- Komponenten nutzen **nur** Variablen, keine fest eingetragenen Farben.
- Theme-spezifische Extras (harte Schatten bei Baustelle, Rasterhintergrund bei Blaupause, Metallverläufe bei Messing, Pixelrahmen bei Gelbe Flotte, Warnstreifen-Kante oben bei Baustelle usw.) über `[data-theme="..."]`-Selektoren, genau wie in der Referenz.

## Theme-Umschalter
- In der Kopfzeile ein Auswahlmenü mit allen 10 Themes. Jeder Eintrag zeigt Name und drei Farbpunkte (wie die Sprungleiste in der Referenz).
- Auswahl in `localStorage` speichern (in `try/catch`). Ohne gespeicherten Wert gilt `signalwerk`.
- Ein kleines Inline-Script im `<head>` setzt `data-theme` vor dem ersten Rendern, damit nichts flackert.
- Theme-Wechsel ohne Neuladen der Seite.

## Schriften
- Die Referenz lädt Google Fonts. In der Lernwelt **alle Schriften selbst hosten** (woff2 im Assets-Ordner oder `@fontsource`-Pakete), kein externer CDN.
- Schriften: Barlow Condensed, Barlow, Inter, JetBrains Mono, Oswald, Source Sans 3, IBM Plex Sans, IBM Plex Mono, Space Mono, Roboto Condensed, Roboto Mono, VT323, DM Sans, Share Tech Mono, Press Start 2P, Rubik.
- Nur die Schriften des aktiven Themes laden (Font-Dateien pro Theme-CSS einbinden), damit die Seite schnell bleibt.

## Gemeinsame Komponenten (in allen Themes)
Buttons (primär/sekundär), Karten, Quiz-Antwortoptionen mit Zustand richtig (Pop-Animation) und falsch (Wackeln), Fortschrittsbalken, Chips, Fokusrahmen. Aussehen je Theme wie in der Referenz.

## Signatur-Komponenten
Jede Komponente als eigene, wiederverwendbare Komponente bauen, Farben über Variablen. Im zugehörigen Theme **ersetzt** sie die neutrale Standardvariante. In den anderen Themes wird die Standardvariante gezeigt.

1. **Signalwerk – Ks-Signal:** Modulstatus als Signal (Rot = nicht begonnen, Gelb = in Arbeit, Grün = fertig) mit Glow. Signalwechsel-Animation wie in der Referenz. Richtige Quizantworten leuchten grün.
2. **Baustelle – Warnstreifen-Ladebalken:** globaler Ladeindikator mit laufenden Streifen; Glanz-Effekt beim Hover auf Primärbuttons.
3. **Blaupause – Zeichnen-Animation:** SVG-Linien in Rechenaufgaben und Trassierung zeichnen sich (`pathLength="1"` + `stroke-dashoffset`), Ergebniswerte zählen hoch (deutsches Zahlenformat).
4. **Bahn-Clean – Seitennavigation:** aktive Seite mit wachsender roter Linie links; Checklisten mit sich zeichnenden Haken.
5. **Nachtschicht – Stirnlampe:** Lichtkegel folgt der Maus (`radial-gradient` mit `--mx/--my`), Schalter „Stirnlampe an/aus“ (Zustand merken), auf Touch-Geräten automatisch aus. Reflektorstreifen-Glanz auf Buttons.
6. **Messing & Stahl – Messuhr:** Ergebnis- oder Punkteanzeige als Messuhr mit Zeiger und Overshoot-Einrasten; Metallverläufe auf Buttons und Karten.
7. **Bahnsteig-Anzeige – Fallblatt:**
   - Split-Flap-Komponente für Punktestände (Quizduell!) und Überschriften.
   - Modulübersicht als Abfahrtstafel (Uhrzeit/Nummer, Modulname, Gleis-Badge).
   - Laufschrift für Hinweise, läuft einmal durch.
8. **Streckennetz – Lernpfad:** Startseite bzw. Modulübersicht als Linienplan. Module sind Stationen, der kleine Zug steht beim aktuellen Modul und fährt beim Abschluss eines Moduls zur nächsten Station (`getPointAtLength`, Zug dreht sich mit der Linie). Erreichte Stationen gefüllt, neue Station pulsiert. **An den echten Lernfortschritt koppeln.** Die Komponente so bauen, dass sie mit beliebig vielen Modulen funktioniert.
9. **Gleisbildstellwerk – Fahrstraße:** beim Wechsel zwischen Bereichen leuchtet die Fahrstraße von Start- zu Zieltaste abschnittsweise gelb auf, danach Seitenwechsel. Falsche Antworten blinken rot („belegt“).
10. **Gelbe Flotte – XP und Abzeichen:** Fortschritt als XP-Balken im Gleis-Look mit Pixelzug, Level-Aufstieg, Abzeichen (z. B. „Stopfmeister“, „Nivellier-Profi“) poppen mit Pixel-Partikeln auf.

## Bestehende Module
- Quizduell, Nivellierlatten-Simulation, Verschleißmesser und Rechenaufgaben **funktional nicht ändern**.
- Rahmen, Buttons, Texte und Hintergründe dieser Module übernehmen das Theme.
- Realistische Darstellungen in den Simulationen (Messing am Verschleißmesser, Lattenteilung usw.) bleiben so, wie sie sind, damit die Azubis das echte Werkzeug wiedererkennen.

## Barrierefreiheit und Technik
- `@media (prefers-reduced-motion: reduce)`: alle Animationen aus, Endzustand sofort anzeigen.
- Kontrast mindestens WCAG AA für Text; Richtig/Falsch nie nur über Farbe (Text oder Icon dazu).
- Sichtbarer Tastaturfokus in allen Themes.
- Animationen nur mit `transform`, `opacity` und `stroke-dashoffset`, keine zusätzlichen Animations-Bibliotheken.
- Responsive bis Handybreite (die Azubis nutzen auch Tablets und Handys).
- Kein Endlos-Blinken im Lesebereich; Endlosanimationen nur, solange etwas wirklich lädt.

## Demo-Seite
Route `/design-demo` (oder vergleichbar), die für das aktive Theme alle Komponenten zeigt, wie in der Referenz: Quizfrage, Modulkarte, Palette, Signatur-Komponente mit Button „Animation abspielen“.

## Abnahme
- [ ] Alle 10 Themes umschaltbar, Standard ist Signalwerk, Auswahl bleibt nach Neuladen erhalten.
- [ ] Kein Flackern beim Laden.
- [ ] Alle 10 Signatur-Komponenten funktionieren im jeweiligen Theme wie in der Referenz.
- [ ] Lernpfad (Streckennetz) und Fallblatt-Punktestand (Bahnsteig) sind an echte Daten gekoppelt.
- [ ] Bestehende Module funktionieren unverändert.
- [ ] Reduced Motion, Tastaturbedienung und Handyansicht geprüft.
- [ ] Schriften lokal gehostet, keine externen Requests.
- [ ] Build läuft fehlerfrei; kurze Zusammenfassung, was geändert wurde.

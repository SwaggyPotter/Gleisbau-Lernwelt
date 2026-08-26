---
tags: [bilder, themenquiz, gwen-code-auftrag, lizenzen]
autor: Claude
status: erste Runde abgeschlossen, laufend
---

# Runde 20 — Bilder für Themenquiz-Fragen: 207/667 mit verifiziertem, kommerziell nutzbarem Bild

Tim wollte (2026-08-25, spät abends, direkt vor dem Schlafengehen): zu
möglichst jeder Frage im Themenquiz ein Bild mit kommerziell nutzbaren
Rechten, inkl. Quellenverweis und Lizenznachweis. Fragen ohne passendes
Bild sollen explizit aufgelistet werden statt stillschweigend leer zu
bleiben — Tim macht dafür ggf. später selbst welche. Ausdrücklicher
Wunsch: Cline soll den Großteil der Recherche übernehmen ("riesige und
langwierige Rechercheaufgabe").

## Architekturentscheidung: `imageKey` statt direktem Bildpfad

Statt eines rohen Bildpfads pro Frage (wie im ersten Versuch bei der
Trassenplan-Erweiterung, Runde 19) referenziert jede Frage jetzt einen
`imageKey`, der in `src/assets/bilder/bildnachweise.json` aufgelöst wird —
demselben zentralen Register, das schon für die Themen-Kachelbilder
existiert. Vorteil: Ein Bild kann für mehrere Fragen wiederverwendet
werden, ohne Quelle/Lizenz mehrfach zu duplizieren, und die bestehende
Seite `/bildnachweise` zeigt automatisch alles mit an. Die drei zuvor mit
rohem `image`-Feld verknüpften Trassenplan-Fragen wurden auf das neue
Schema migriert.

Umsetzung: `ThemenquizQuestion.imageKey?: string` (ersetzt das kurzlebige
`image`-Feld aus Runde 19), `quiz-engine.component.ts` lädt
`bildnachweise.json` per `HttpClient` und löst den Key zur Laufzeit auf,
Template zeigt Bild + Bildunterschrift (Credit, Lizenz, Quelle-Link) als
`<figure>`/`<figcaption>` oberhalb der Antwortoptionen.

## Workflow: Cline sucht, Claude verifiziert (wie in Runde 19, aber Faktor 15 größer)

Automatisch generiert: ein Rechercheauftrag pro Thema (24 Dateien,
`Ki Datenspeicher/17-Bilder-fuer-Fragen/Batch-<topicId>.md`), jeweils mit
der vollständigen Fragenliste des Themas eingebettet. Auftrag an Gwen:
Fragen nach dargestelltem Motiv gruppieren (nicht 1:1), pro Motiv ein
echtes Bild mit erkennbarer freier/kommerzieller Lizenz suchen, bevorzugt
Wikimedia Commons.

**Wichtigster Kalibrierungsschritt:** Der erste Testlauf (Thema "schiene")
zeigte, dass Gwen wiederholt normale Webseiten (Wikipedia-Artikel,
Software-Tool-Seiten, Physik-Übungsaufgaben) als "Bild" auswies, teils
sogar mit erfundener Lizenzangabe ("Wikimedia Commons CC-BY-SA" für eine
Seite, die gar nicht zu Wikimedia gehörte). Fix: eine **rein mechanische
Regel** statt einer inhaltlichen Einschätzung — ein Suchtreffer zählt nur,
wenn der Ergebnistitel mit "File:" beginnt (Commons-Dateiseite) ODER die
URL direkt auf `.jpg/.jpeg/.png/.svg/.gif` endet. Das hat die Trefferqualität
sichtbar verbessert (siehe z. B. `Batch-spurweite.md`).

**Weiterer bekannter Fallstrick bestätigt:** Gwens Fetch-Tool bekommt bei
`commons.wikimedia.org` durchgehend HTTP 403 (wie in Runde 14/19 bereits
dokumentiert) — Anweisung ergänzt, die Commons-Seite gar nicht erst zu
öffnen, sondern nur die URL aus der Suchergebnisliste zu übernehmen.

**Neue technische Fallstricke dieser Runde:**
- Wiederholte `Error rendering prompt with jinja template`-Abstürze
  (LM-Studio-seitig), deutlich häufiger als in Runde 19 — Modell musste
  ca. alle 3-4 Dispatches neu geladen werden, um die Fehlerrate senkbar
  zu halten.
- Gwens Editor-Tool scheiterte mehrfach an fehlenden/falsch typisierten
  Parametern (`path` vergessen, `new_text` als Array statt String) — bei
  einem komplexen, mehrzeiligen Platzhaltertext mit Sternchen/Backticks
  besonders häufig. Fix: Platzhaltertext im generierten Auftrag radikal
  vereinfacht (ein einzelner Satz statt Format-Beispielblock).
- Mehrfach wurde die `status:`-Frontmatter-Zeile dupliziert statt ersetzt
  (bis zu 6x hintereinander) — inhaltlich harmlos, aber löste
  `RULE_VIOLATION` im Verifikationsskript aus; von Hand bereinigt statt
  neu zu dispatchen, da der eigentliche Rechercheinhalt meist trotzdem
  brauchbar war.
- Alle 24 Themen wurden mindestens einmal dispatcht; einige brauchten bis
  zu 3-4 Versuche (inkl. Modell-Reloads). Ergebnis-Vollständigkeit pro
  Thema schwankt entsprechend stark (2 bis 14 rohe Bild-Kandidaten je
  Thema).

## Verifikation: Wikimedia-API statt Einzel-Fetch (neue Methode)

Bei 150 Kandidaten wäre eine einzelne WebFetch-Prüfung pro Bild (wie in
Runde 18 bei 25 Bildern) zu langsam gewesen. Stattdessen:

1. **HTTP-Liveness-Check** aller extrahierten Kandidaten-URLs (Node-Skript,
   HEAD-Requests) — 126 von 150 eindeutig lebendig, Rest tot/abgeschnitten
   (meist Regex-Extraktionsartefakte bei Klammern in Dateinamen) oder
   HTTP 429 (Wikimedia-Rate-Limit durch die vielen parallelen Prüfungen).
2. **Batch-Abfrage der Wikimedia-Commons-API** (`action=query&prop=imageinfo
   &iiprop=extmetadata`) für alle 130 Commons-Kandidaten auf einmal (4
   Anfragen à 40 Titel statt 130 Einzelabrufe) — liefert Lizenz, Autor und
   Attribution strukturiert statt über eine WebFetch-Zusammenfassung
   interpretiert werden zu müssen. Deutlich schneller UND präziser.
3. **Wichtiger eigener Bug gefunden und behoben**: die erste
   Lizenz-Klassifizierung markierte fälschlich 105 von 129 Bildern als
   "nicht kommerziell nutzbar", weil der Regex nur `cc-by` (mit
   Bindestrich) statt `CC BY` (mit Leerzeichen, das tatsächliche Format
   der Wikimedia-API) erkannte. Nach Fix: **alle 129 gültigen Commons-
   Kandidaten hatten eine kommerziell nutzbare Lizenz** (überwiegend
   CC BY-SA, einige Public Domain/CC0/GFDL/FAL) — erwartbar, da Commons
   selbst freie Lizenzierung als Aufnahmebedingung voraussetzt.
4. **Zweiter eigener Bug gefunden und behoben**: die Zuordnung "welches
   Bild gehört zu welcher Frage-ID" schlug zunächst fast komplett fehl
   (nur 31 von ~130 Bildern zugeordnet), weil aus der URL dekodierte
   Dateinamen Unterstriche behalten (`Datei_mit_Leerzeichen.jpg`), während
   die Wikimedia-API Titel mit echten Leerzeichen zurückgibt
   (`Datei mit Leerzeichen.jpg`) — Titel-Abgleich schlug bei jedem Dateinamen
   mit Leerzeichen fehl. Nach Fix (Unterstriche vor dem Abgleich zu
   Leerzeichen konvertiert): Zuordnung sprang von 31 auf 135 Treffer.
5. **Manuelle inhaltliche Prüfung trotz gültiger Lizenz** (per Titel-
   Durchsicht, da eine "korrekte Lizenz" nichts über den tatsächlichen
   Bildinhalt aussagt): 14 klare Fehltreffer identifiziert und
   ausgeschlossen, u. a. ein **Verkehrsschild "Splitt, Schotter"** (StVO-
   Schild, keine Gleisbau-Aufnahme) für das Thema "Bettung", ein
   **Matcha-Tee-Besen** für "Weichenbesen" (Wortspiel-Fehltreffer auf
   "Besen"), ein **mechanisches Zahnrad ("Spur gear")** für "Spurweite"
   (Wortspiel-Fehltreffer auf "Spur"), und zwei Fotos eines **Nachtzug-
   Angebots namens "European Sleeper"** für das Thema "Schwellen"
   (Wortspiel-Fehltreffer: "Sleeper" heißt auf Englisch sowohl
   "Bahnschwelle" als auch "Schlafwagen/Nachtzug").
6. Zusätzlich technisch ausgeschlossen: Nicht-Bildformate, die trotz
   gültiger Commons-Dateiseite kein `<img>`-taugliches Format sind (ein
   PDF, ein Ogg-Video), sowie alle Kandidaten ohne im Text auffindbare
   Frage-ID-Zuordnung.

## Ergebnis

- **76 neue Einträge** in `bildnachweise.json` (jetzt 102 insgesamt, vorher
  26), alle mit Autor, Lizenz (überwiegend CC BY-SA 3.0/4.0) und Link zur
  echten Commons-Dateiseite.
- **204 Fragen neu mit `imageKey` verknüpft** (plus 3 bereits aus Runde 19),
  macht **207 von 667 Fragen (31 %) mit verifiziertem Bild**.
- **460 Fragen noch ohne Bild** — vollständige Liste mit Fragetext pro
  Thema: [[../17-Bilder-fuer-Fragen/00-Fragen-ohne-Bild]]. Größtenteils
  schlicht noch nicht bearbeitet, siehe dortige Notizen zu den zwei
  Themen mit echtem Negativbefund (schiene, kleingeraete).
- Rohes Rechercheausgangsmaterial (auch nicht genutzte Kandidaten) liegt
  in `Ki Datenspeicher/17-Bilder-fuer-Fragen/Batch-<Thema>.md`.

## Verifikation

- `ng build --configuration production`: grün nach Schema-Umstellung
  (`imageKey`) und nach dem kompletten Wiring.
- Alle 24 JSON-Dateien weiterhin gültig (Node-`JSON.parse`-Check über
  alle Dateien).
- Playwright/Browser-Automation: Bilder laden stichprobenartig in 11 von
  24 Themen mit Bild-Fragen bestätigt sichtbar (`naturalWidth > 0`,
  Bildunterschrift mit Credit/Lizenz/Quelle-Link vorhanden). Einzelne
  Stichproben zeigten zwischenzeitlich `naturalWidth 0` — durch direkten
  `curl`-Test der zugrunde liegenden URLs als reines Wikimedia-Rate-Limit
  durch die eigene hohe Anfragefrequenz beim Verifizieren identifiziert,
  nicht als echter Fehler (URLs laden bei erneutem Test bzw. mit Abstand
  zuverlässig).

## Bewusste Grenzen dieser ersten Runde (für Fortsetzung)

- Nur 21 von 24 Themen erhielten tatsächlich gültig zugeordnete Bilder in
  dieser Runde (schiene: 0 brauchbare Kandidaten, kleingeraete: Bilder
  vorhanden aber nicht zugeordnet, trassenplan: bereits in Runde 19 mit
  nur 1 Bild für 3 Fragen abgedeckt, hier nicht erneut bearbeitet).
- Die "ein Bild pro Motiv statt pro Frage"-Strategie bedeutet: von den
  207 abgedeckten Fragen teilen sich viele dasselbe Bild (76 Bilder für
  207 Fragen, im Schnitt ~2,7 Fragen pro Bild) — das ist beabsichtigt
  (siehe Auftrag), nicht jede Frage hat eine exklusive Illustration.
- Die Zuordnung Bild→Frage-ID basiert auf einem Textnähe-Heuristik-Fenster
  (400 Zeichen vor der Fundstelle) im rohen Gwen-Text, nicht auf einer
  strukturierten Datenquelle — bei einzelnen Fragen könnte die Zuordnung
  daher ungenau sein. Stichprobenprüfung ergab keine offensichtlichen
  Fehlzuordnungen, aber keine lückenlose Einzelprüfung aller 204 Fragen.
- Nächster Schritt für eine Fortsetzungsrunde: die verbleibenden 460
  Fragen (siehe Liste), plus gezielte Nachbesserung für "schiene" und
  "kleingeraete".

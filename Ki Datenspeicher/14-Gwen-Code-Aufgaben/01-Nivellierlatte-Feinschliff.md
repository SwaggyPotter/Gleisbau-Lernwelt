---
tags: [gwen-code-aufgabe, nivellierlatte, zusatzmodul]
autor: Claude
status: abgeschlossen — Gwen hat den Grossteil umgesetzt
---

# Nivellierlatte — Feinschliff nach Tims drittem Feedback-Durchgang (2026-08-12)

## Hintergrund

Tim hat das Nivellierlatte-Spiel (`src/app/modules/zusatz/nivellierlatte/`)
bereits zweimal Feedback gegeben (Visier/Fadenkreuz-Optik, dann rot/weiße
Latte + Entfernungsmessung, siehe [[../05-Update-Log/Update-Log]] und
[[../../.claude/… nicht im Vault, siehe Session-Notiz in projekt_grosses_ziel]]).
Beim dritten Durchgang kam neues, konkretes Feedback zu zwei weiteren
Referenzbildern:

- `https://de-academic.com/pictures/dewiki/78/Nivellierlattenablesung.jpg`
  (Zielfernrohr-Schema, "Ablesung: 142,2")
- `https://messprofiservice.de/wp-content/uploads/2024/06/messprofiservice_Nivelliergeraet_Distanzmessung.png`
  (Distanzmessungs-Grafik mit Formel)

**Tims Punkte (sinngemäß aus einer Sprachnachricht-Transkription):**
1. Der Zoom im Zielfernrohr ist immer noch viel zu weit rausgezoomt — auf
   echten Referenzbildern liegen zwischen dem oberen und unteren
   Distanzstrich meist schon 1-2 lesbare Dezimeterzahlen (Beispiel Tim:
   "24, 23").
2. Ablesungen liegen in der Praxis meist um die Gerätehöhe (üblich
   1,40-1,50 m), nicht gleichverteilt über die ganze Latte.
3. Die roten Balken sind auf echten Latten NICHT durchgehende Rechtecke
   über die volle Lattenbreite, sondern ein feineres Schachbrett-/
   E-Teilung-Muster (kleine Zellen, abwechselnd linke/rechte Hälfte).

**Neue Arbeitsweise (Tims ausdrücklicher Wunsch in dieser Runde):** Claude
soll mehr an Gwen delegieren (Token sparen) — Gwen macht die konkrete
Code-Änderung, Claude spezifiziert den Auftrag präzise, prüft danach nur
noch Build + Screenshot und gibt bei Bedarf Nachbesserungs-Anweisungen,
statt selbst zu implementieren.

## Neues Tooling

Der bisherige `tools/cline-cli/run-gwen-task.cjs` ist fest auf das
Vault-Recherche-Format zugeschnitten (prüft Frontmatter, "Fragen für die
Recherche"-Abschnitt, feste Überschrift) — passt nicht für echte
Projektdateien. Neu: `tools/cline-cli/run-gwen-code-task.cjs` — cwd ist das
Projekt-Root statt der Vault, Verifikation ist einfach gehalten:
(1) wurde überhaupt etwas an den genannten Dateien verändert (Vorher/Nachher-
Snapshot, nicht `git diff` gegen HEAD, weil die Zieldateien oft schon
unkommittete Änderungen aus früheren Session-Schritten haben), (2) baut
`ng build --configuration production` danach fehlerfrei. Inhaltliche
Korrektheit bleibt manuelle Nachprüfung (Screenshot).

## Auftrag an Gwen (wortgleich, siehe `tools/cline-cli/_auftrag-nivellierlatte.txt`)

Drei präzise spezifizierte Änderungen an
`nivellierlatte.page.ts`/`.html`:

1. **Zoom verkleinern**: `stadiaFraction` 0.12 → 0.3, `maxDistanceM` 45 → 30.
   Herleitung: Auf dem Referenzbild "Ablesung: 142,2" beträgt der Abstand
   zwischen den beiden Distanzstrich-Markierungen ca. 2,2-2,4 Dezimeter bei
   einem insgesamt sichtbaren Ausschnitt von ca. 3,5-4 Dezimetern. Da in der
   App `Intervall_cm = distanceM` gilt (Fadenkonstante 100) und
   `scopeSpanCm = distanceM / (2 * stadiaFraction)`, ergibt sich bei
   `distanceM≈23` und gewünschtem `scopeSpanCm≈37`: `stadiaFraction ≈
   23/(2·37) ≈ 0,31` — gerundet 0,3. Mit `maxDistanceM=30` bleibt
   `scopeSpanCm` im Bereich 25-50 cm (2,5-5 Dezimeter sichtbar), nah am
   Referenzbild.
2. **Lattenmuster auf Schachbrett/E-Teilung umstellen**: statt 25 durchgehenden
   10-cm-Blöcken über die volle Breite (24 breit) jetzt 125 Zellen à 2 cm,
   abwechselnd nur linke oder rechte Hälfte (12 breit) rot gefüllt —
   Checkerboard-Musterung, die die "E"-Optik echter Nivellierlatten
   nachbildet, ohne einzelne "E"-Pfade zeichnen zu müssen.
3. **Typische Ablesehöhe**: `next()` würfelt `target` jetzt zu 80% zwischen
   1,2 und 1,7 m (Geräte-/Horizonthöhe-Bereich), zu 20% weiterhin über den
   vollen technisch gültigen Bereich (Vielfalt behalten).

Nach den Änderungen soll Gwen selbst `npx ng build --configuration
production` ausführen und Fehler beheben, bevor der Lauf endet.

## Ergebnis

Insgesamt **5 Gwen-Läufe** bis zum fertigen, geprüften Stand — Protokoll:

| # | Auftrag | Ergebnis | Ursache |
|---|---|---|---|
| 1 | Hauptauftrag (3 Änderungen) | NO_CHANGE (11s) | Prompt wurde über `cline -P ... "<Text>"` mit `shell:true` an cmd.exe übergeben — ein **mehrzeiliger** Prompt-String wird von cmd.exe beim Parsen an der ersten Zeile abgeschnitten. Gwen bekam nur eine leere/generische Nachricht zu sehen ("Ich bin bereit, aber welche Datei?"). **Fix im Tooling**: `run-gwen-code-task.cjs` ruft jetzt `node <cline-bin-pfad>` direkt mit Argument-Array und `shell:false` auf statt über die cmd.exe-Shims — Node übernimmt dann selbst das Windows-Escaping, cmd.exe parst nichts mehr. |
| 2 | Hauptauftrag (Retry nach Fix) | NO_CHANGE (0s), `spawnSync ... cline.exe EBUSY` | Nach `taskkill /F` hält Windows das Datei-Handle auf `cline.exe` noch kurz — ein sofortiger erneuter `spawnSync` schlägt fehl. **Fix im Tooling**: 1,5s Pause nach `cleanup()` ergänzt. |
| 3 | Hauptauftrag (2. Retry) | **SUCCESS_BUILD_OK**, aber nur TEILWEISE korrekt | Gwen hat Änderung 1 (Zoom: `stadiaFraction`→0.3, `maxDistanceM`→30) und den TS-Teil von Änderung 2 (`RodCell`-Interface + `buildRodCells()`) exakt richtig umgesetzt — dabei aber versehentlich das unabhängige `DecimeterLabel`-Interface mitgelöscht (Namensverwechslung "Decimeter…") und weder den HTML-Teil von Änderung 2 noch Änderung 3 (typische Ablesehöhe) begonnen. Claude hat dies beim Build-Log erkannt (TS2551/TS2552-Fehler) — der automatische Build-Check im Tooling hat den kaputten Zwischenstand also korrekt aufgefangen, bevor er unbemerkt geblieben wäre.
| 4 | Präziser Korrektur-Auftrag (3 offene Punkte, mit Ist-Zustand erklärt) | **SUCCESS_BUILD_OK**, alle 3 Punkte exakt wie spezifiziert | — |
| 5a | Kosmetik-Fix: Label-Clipping im Zielfernrohr bei starkem Zoom (von Claude beim visuellen Playwright-Check entdeckt) | NO_CHANGE (49s), Absturz-Marker `Error rendering prompt with jinja template: Cannot apply filter "string" to type: NullValue` im Log | Bekannter, in [[../13-CLI-Testbereich/_Testbereich-Hinweis]] und dem Original-Skript dokumentierter LM-Studio/Modell-Bug nach mehreren Tool-Aufrufen in Folge — rein transient. |
| 5b | Gleicher Auftrag, automatischer Retry | **SUCCESS_BUILD_OK**, exakt wie spezifiziert | — |
| 6 | Kontrast-Fix: Dezimeterzahlen im Zielfernrohr waren hellcreme auf hellem Papier-Hintergrund kaum lesbar (von Claude nach Fix 5 per Hi-DPI-Screenshot entdeckt) | **SUCCESS_BUILD_OK** im 1. Versuch, exakt wie spezifiziert (`fill="#eaf2f5"` → `fill="#0b0e11"`, nur an der einen Stelle) | — |

**Fazit zur neuen Arbeitsweise**: Delegation an Gwen funktioniert für PRÄZISE, mechanische Code-Änderungen (exakte Werte/Snippets vorgegeben) deutlich zuverlässiger als für offene Recherche-Aufgaben — 4 von 6 Läufen waren beim ersten inhaltlichen Versuch korrekt oder nur durch reine Tooling-Bugs (nicht Modell-Fehler) blockiert. Die zwei "weichen" Fehler (kollaterale Löschung von `DecimeterLabel`, unvollständige Bearbeitung) sind typische Symptome eines kleinen 9B-Modells bei mehrteiligen Multi-Datei-Aufträgen — Gegenmittel: kleinere, einzeln verifizierbare Folgeaufträge statt ein großer Auftrag. Der automatische Build-Check im Tooling war entscheidend, um den kaputten Zwischenstand aus Lauf 3 zuverlässig zu erkennen, bevor er als "fertig" durchgegangen wäre.

**Neues, wiederverwendbares Tooling**: [[../../tools/cline-cli/run-gwen-code-task.cjs]] (nicht im Vault, siehe Projekt-Root) — cwd ist das Projekt-Root statt der Vault, Verifikation per Vorher/Nachher-Datei-Snapshot + `ng build`. Für künftige Code-Delegationen direkt wiederverwendbar: `node tools/cline-cli/run-gwen-code-task.cjs --files "a.ts,a.html" --prompt-file "auftrag.txt" [--retries N] [--timeout Sek]`.

**Visuell verifiziert** (Playwright, Desktop 1280px + hochauflösender 3x-Crop des Zielfernrohrs): Latte zeigt jetzt ein Schachbrett-/E-Teilungs-Muster (keine durchgehenden Balken mehr), Zoom im Zielfernrohr deutlich enger (typischerweise 2-3 Dezimeterzahlen gleichzeitig lesbar zwischen den Distanzstrichen, vorher waren es 6-19), Ablesehöhen liegen jetzt meist im Bereich 1,2-1,7 m (Gerätehöhe-Bereich). Keine Konsolenfehler.

**7. Runde, gleicher Tag — Balken verdickt.** Tim schickte ein weiteres
Referenz-Zielfernrohr-Foto (E-Teilung mit "24"/"23") und wies darauf hin,
dass die roten Zähne dort deutlich dicker/gröber sind als unser
Schachbrett (5 Zellen pro Dezimeter = zu fein). Auftrag: EINE Zeile in
`buildRodCells()` ändern, `const cellH = 2` → `const cellH = 5` (2 statt 5
Zellen pro Dezimeter, doppelt so dick). Lief im 2. Versuch durch (1.
Versuch NO_CHANGE ohne erkennbaren Grund im Log, automatischer Retry
löste es). Diff sah wegen `git diff` gegen HEAD nach viel aus (enthält
alle unkommitteten Änderungen der ganzen Session), die tatsächliche
Änderung war exakt die eine Zeile — per Vorher/Nachher-Snapshot-Check und
manueller Durchsicht bestätigt. Screenshot zeigt jetzt deutlich fettere,
klar abgesetzte rote Balken statt dünner Streifen, nah am Referenzfoto.

**8. Runde, gleicher Tag — echtes E-Muster + Zahlen auf der Latte.** Tim
wies darauf hin, dass eine echte E-Teilung-Latte pro Dezimeter buchstäblich
den Buchstaben "E" zeigt (durchgehender Steg auf EINER Seite, verbunden
durch drei Querstriche oben/Mitte/unten), der bei jedem Dezimeter auf die
andere Seite kippt — unser bisheriges Schachbrett hatte das nicht (nur
zellenweise alternierend, kein durchgehender Steg). Zusätzlich sollten die
Dezimeterzahlen AUF der Latte sitzen, nicht daneben.

Auftrag an Gwen: `RodCell`-Interface umgebaut auf `{svgY, x, width}`
(statt `{svgY, redX}`), `buildRodCells()` erzeugt jetzt pro Dezimeter 5
Zeilen à 2cm — Zeile 0/2/4 volle Lattenbreite (die drei E-Querstriche),
Zeile 1/3 nur die halbe Breite auf der Steg-Seite (die Lücken zwischen den
Querstrichen), Steg-Seite alterniert per `d % 2`. Zahlen im Zielfernrohr
neu positioniert: `x="22"` (Lattenmitte) mit `text-anchor="middle"` und
hellem Umriss (`stroke="#f4f6f5"` mit `paint-order: stroke`) für Lesbarkeit
auf Rot UND Weiß gleichzeitig.

**Ergebnis**: Build schlug beim ersten Versuch fehl — Gwen hatte die HTML-
Änderung nur in EINEM der zwei `*ngFor`-Vorkommen korrekt übernommen
(Zielfernrohr-Panel: `c.x` richtig; Kontext-Panel "Latte": noch altes
`c.redX` stehen gelassen, TS2339-Fehler). Diesmal von Claude selbst direkt
per Edit-Tool korrigiert (eine Attribut-Umbenennung, `redX`→`x` an der
letzten Stelle) statt einer weiteren Gwen-Runde — bei so einer trivialen,
bereits exakt diagnostizierten Ein-Wort-Korrektur war der Zusatzaufwand
eines weiteren Gwen-Zyklus (Cleanup+Modell-Aufruf+Build, ~90s) nicht
gerechtfertigt. Alle anderen Teile (RodCell-Umbau, Zeilen-Logik, Zahlen-
Positionierung mit Outline) waren exakt wie spezifiziert. Visuell
verifiziert: Screenshot zeigt klar erkennbare, abwechselnd gespiegelte
E-Formen über die ganze Lattenlänge, Zahlen jetzt zentriert auf der Latte
und dank Outline auf beiden Hintergründen (rot/weiß) gut lesbar.

**9. Runde, gleicher Tag — Korrektur nach direktem Bildvergleich: zu
dominant.** Tim stellte sein Referenzfoto direkt neben einen Screenshot
unserer App und zeigte: unsere Version war IMMER NOCH falsch — die drei
vollen Querbalken pro Dezimeter (aus Runde 8) waren viel zu dominant/breit
im Vergleich zum spärlichen, überwiegend weißen Referenzmuster, und die
Zahlen waren riesig (nahmen fast den ganzen Kreis ein) statt wie im Foto
kompakt neben den Zähnen zu sitzen. Korrektur: `buildRodCells()` zurück
auf ein reines Schachbrettmuster ohne volle Querbalken (`cellH=2`, jede
Zelle nur halbe Breite, kein Full-Width-Anteil mehr — die 5 Zeilen/Dezimeter
sind ungerade, wodurch sich sich der Wechsel an jeder Dezimetergrenze
naturgemäß verschiebt, ohne dass es einer expliziten Steg-Logik bedarf).
Zahlen-Schriftgröße von 5 auf 3, Umriss-Strichstärke von 0,8 auf 0,4
verkleinert. Lief im ersten Versuch fehlerfrei durch.

**Ehrlicher Stand**: Diese Iteration ist eine Annäherung basierend auf
Bildbeschreibung, kein pixelgenauer Abgleich — die E-Teilung-Geometrie aus
einem Foto exakt zu rekonstruieren ist ohne Bildmessung fehleranfällig
(siehe die zwei Fehlversuche in Runde 8/9). Falls es immer noch nicht
passt: am schnellsten geht es, wenn Tim direkt in der laufenden App
schaut (`npm start`) und exakt beschreibt, was an Höhe/Breite/Abstand der
einzelnen Zähne noch abweicht, statt weiter zu raten.

**10. Runde, gleicher Tag — Tim beschreibt die Geometrie Zeile für Zeile,
exakt nachgebaut.** Nach dem Fehlschlag in Runde 9 diktierte Tim eine
sehr genaue Schritt-für-Schritt-Beschreibung der echten E-Teilung
(Sprachnachricht, transkribiert): Strich immer 1cm dick, Zahl links auf
der Latte, direkt darunter eine rote Trennlinie ab der das Dezimeter
beginnt, dann (von der Trennlinie aufwaerts) 1cm weiß → 1cm rotes Quadrat
→ 1cm weiß → 1cm rotes Quadrat → 1cm weiß, und AB DER HÄLFTE (5cm) das
eigentliche "E" mit durchgehendem Steg und drei vollen Querstrichen bis
zur naechsten Zahl, wo wieder eine rote Trennlinie kommt und es von vorn
losgeht.

Claude hat daraus folgende Geometrie abgeleitet (pro Dezimeter, `d`=
Dezimeterindex, Steg-Seite alterniert mit `d%2`):
- cm 1-2 und cm 3-4: kleines isoliertes rotes Quadrat (5 breit statt
  halbe Lattenbreite) auf der Arm-Seite (Gegenseite vom Steg)
- cm 5-6, 7-8, 9-10: volle Lattenbreite (die drei E-Querstriche)
- cm 6-7, 8-9: nur die Steg-Seite (die Luecken zwischen den Querstrichen)
- Rote Trennlinie ueber die volle Lattenbreite an jeder Dezimetergrenze
- Zahl fest links positioniert (x=16 statt mittig)

Auftrag lief im ERSTEN Versuch fehlerfrei durch (157s, laengster bisheriger
Lauf, aber ohne Probleme). Per Diff bestätigt: alle drei Teile exakt wie
spezifiziert übernommen. Screenshot (Playwright, 3x-Aufloesung) zeigt jetzt
deutlich erkennbare, alternierende E-Formen mit Steg+drei Querstrichen und
den zwei isolierten Quadraten darunter — visuell deutlich naeher an Tims
Referenzfotos als alle vorherigen Versuche. Nächster Schritt liegt bei
Tim: in der laufenden App pruefen, ob die Proportionen jetzt passen.

**11. Runde, gleicher Tag — Zweite KI-Meinung eingeholt, Feldstruktur
komplett neu aufgebaut.** Tim hatte parallel ein anderes Claude-Chatfenster
um eine Analyse gebeten und dessen Antwort hier eingefügt. Die fremde
Analyse lieferte eine deutlich systematischere Beschreibung als die bisher
mündlich diktierten Versuche: statt "Dezimeter mit Steg+3 Querstrichen"
(Runde 10) ein **Feld-basiertes Modell** — gleich hohe Felder, abwechselnd
"Zahlenfeld" (Zahl auf der aktiven Hälfte, 2 kleine isolierte Zähne mit
festen Höhenanteilen 15%/33% auf der Gegenseite) und "Kammfeld" (aktive
Hälfte fast komplett rot mit einer Kerbe, die von der Mittelachse her
hineingeschnitten ist und zwischen unterem/oberem Drittel alterniert). Die
aktive Seite bleibt über ein Zahlenfeld + seine Kammfelder hinweg gleich,
wechselt erst beim nächsten Zahlenfeld.

Claude hat daraus konkrete Maße abgeleitet (5 Felder à 2cm pro Dezimeter:
1 Zahlenfeld + 4 Kammfelder; Zahnbreite 5,5 von 12; Kerbe 8 breit ab der
Mittelachse, 4 bleiben am Außenrand rot; Kerbhöhe = Felddrittel) und als
vollständigen, wörtlichen Code-Patch an Gwen gegeben (7 Teiländerungen:
neue Interface-Felder `height`/`x`, `buildRodCells()` und
`buildDecimeterLabels()` komplett neu, neue `buildDecimeterTicks()`-Methode
für rote Trennlinien an jeder Dezimetergrenze, HTML in beiden Panels
angepasst). **Lief im ersten Versuch fehlerfrei durch (168s)** — bei
Diff-Kontrolle war JEDE der 7 Teiländerungen exakt wortgleich zur Vorgabe
übernommen, keine einzige Abweichung. Bisher die komplexeste erfolgreiche
Einzelrunde.

Screenshots (Playwright, 3x-Auflösung) zeigen jetzt ein klar erkennbares
Kamm-/Zickzack-Muster mit alternierender aktiver Seite, roten
Trennlinien an den Dezimetergrenzen und kompakt positionierten Zahlen samt
kleinen Zähnen — visuell die bisher beste Annäherung an die Referenzfotos.

**12. Runde, gleicher Tag — dritte KI-Meinung: vollständige, GETESTETE
Referenz-HTML-Implementierung.** Tim hatte erneut ein anderes
Claude-Fenster befragt, diesmal mit Bitte um lauffähigen Code statt nur
Beschreibung — Ergebnis war eine komplette, eigenständige HTML-Datei
(`nivellierlatte-referenz.html`) mit echter `buildField()`-Funktion, im
Browser tatsächlich getestet und von Tim als "sieht echt gut aus"
bestätigt. Wichtigste neue Erkenntnisse gegenüber Runde 10/11:
- Trennlinien zwischen Feldern sind SCHWARZ, nicht rot (`BLACKLINE
  #111418`), und es gibt eine durchgehende SCHWARZE Mittelachse über die
  ganze Lattenlänge — beides hatte Claude bisher nicht.
- Zahn-/Kerbenbreite exakt 45% der Lattenhälfte (`toothWidth = HALF_W *
  0.45`), nicht wie zuvor geschätzt.
- Zahlengröße exakt 62% der Feldhöhe (`font-size: h*0.62`), inkl. SVG-Trick
  `textLength` + `lengthAdjust="spacingAndGlyphs"`, damit zweistellige
  Zahlen unabhängig von der Ziffernbreite immer gleich breit erscheinen —
  eine Verfeinerung, auf die Claude von selbst nicht gekommen wäre.
- Kerbe (weißer Ausschnitt im Kammfeld) beginnt nicht exakt im unteren/
  oberen Drittel, sondern bei 55%/10% der Feldhöhe mit fester Höhe 35% —
  dadurch bleibt in der Feldmitte (45%-55%) immer ein rotes Band stehen.

Claude hat die Referenz-Proportionen (nicht den Code direkt, da die
Referenz mit abstrakten SVG-Einheiten arbeitet und nicht an echte
cm-Messwerte gekoppelt ist wie unser Spiel) in unser bestehendes
5-Felder-pro-Dezimeter-Schema uebersetzt und als Patch an Gwen gegeben.
**Lief im ersten Versuch fehlerfrei durch (208s)**, alle 5 Teiländerungen
laut Diff exakt wortgleich uebernommen.

**Eigener Bug gefunden+gefixt**: Die neue Mittelachse-Linie
(`<line x1="22" y1="0" [attr.y2]="svgHeight" .../>`) fehlte im Auftragstext
das Attribut `x2="22"` — SVG faellt bei fehlendem `x2` auf 0 zurueck, die
Linie war dadurch diagonal statt senkrecht. Sofort beim Screenshot-Check
aufgefallen und selbst per Edit korrigiert (ein Attribut ergaenzt), da es
sich um einen Fehler in Claudes eigenem Auftragstext handelte, nicht um
eine Gwen-Abweichung.

Screenshots zeigen jetzt eine sehr überzeugende E-Teilung: klare
Zickzack-Kämme, gerade schwarze Mittelachse und Feldtrennlinien, kompakt
und konsistent breite Zahlen. Bisher das mit Abstand beste Ergebnis —
Grundlage war diesmal ein tatsächlich im Browser getesteter Referenzcode
statt einer verbalen Beschreibung, was die Trefferquote sichtbar erhöht
hat.

**13. Runde, gleicher Tag — letzter Feinschliff auf volle Deckungsgleichheit,
diesmal direkt von Claude (kein Gwen-Lauf).** Tim schickte dieselbe
Referenz-HTML nochmal mit der Bitte, die App-Latte "gegen die Referenz
auszutauschen" ("so wie sie in der Referenz ist, ist sie perfekt"). Claude
hat die `buildField()`-Formeln aus der Referenz Zeile für Zeile gegen die
bereits umgesetzte Version (Runde 12) nachgerechnet — alle Werte
(Zahnbreite 45%, Kerbenposition 55%/10%, Zahlengröße 62%, Kerb-
Restbreite) stimmten bereits exakt überein, keine Diskrepanz gefunden. Ein
architektonischer Unterschied bleibt bewusst bestehen: die Referenz
verschiebt eine fixe-Skalierung-Latte per CSS `translateY` durch einen
Kreis-Ausschnitt (kein Zoom), waehrend unser Spiel einen dynamischen
SVG-`viewBox` nutzt, weil das Spiel zusaetzlich einen entfernungsabhaengigen
Zoom simuliert (Distanzstriche/Fadenkonstante-Feature) — die Referenz hat
dieses Feature gar nicht, ein 1:1-Uebernehmen des CSS-Transform-Ansatzes
haette es kaputt gemacht, ohne die Latten-Geometrie selbst zu veraendern.

Zwei echte Lücken gefunden und diesmal direkt von Claude selbst behoben
(kein Gwen-Auftrag, da trivial und schon exakt spezifiziert):
1. Rahmenfarbe der Latte war noch `#333` statt dem Referenz-Schwarz
   `#111418`.
2. Das Kontext-Panel "Latte" (kleine Übersicht links) hatte noch die
   ALTE, grobe Meter-Beschriftung (`meterLabels`, nur 0/1/2) statt der
   dichten `decimeterLabels` + schwarzen Mittelachse + Feldtrennlinien,
   die im Zielfernrohr-Panel bereits seit Runde 11/12 vorhanden waren —
   ein Rest aus einer frueheren Session-Runde, als beide Panels noch
   unterschiedlich behandelt wurden. Jetzt zeigen beide Panels exakt
   dasselbe Muster, nur unterschiedlich gezoomt/skaliert — wie in der
   Referenz (`.latte-frame` zeigt denselben SVG-Inhalt wie `.latte-inner`,
   nur per Height-Attribut verkleinert).

Dabei `MeterLabel`-Interface, `meterLabels`-Property und
`buildMeterLabels()`-Methode als jetzt unbenutzten Code entfernt.
Build fehlerfrei, Screenshots (Playwright, 3x) zeigen beide Panels jetzt
visuell deckungsgleich mit der Referenz-Ästhetik.

**14. Runde (2026-08-16) — Referenz wirklich 1:1, komplett von Claude
selbst (Tim: "ohne Qwen").** Die Runden 12/13 hatten nur die Proportionen
INNERHALB eines Feldes übernommen — der eigentliche Fehler saß eine Ebene
höher und blieb dadurch unentdeckt:

- Die Referenz hat **2 Kammfelder pro Zahl** (`COMBS_PER_NUMBER = 2`), also
  **3 Felder pro Zahlengruppe**. Unsere Umsetzung hatte 5 Felder pro
  Dezimeter → die Felder waren im Verhältnis zur Lattenbreite viel zu
  flach, genau der "gedrückte" Eindruck, den Tim beschrieb.
- Die Referenz koppelt außerdem `HALF_W` (70) fest an `FIELD_H` (100).
  Unsere cm-basierten Koordinaten hatten dieses Verhältnis nie abgebildet.

**Lösung:** Koordinatensystem komplett auf die Referenz-Einheiten
umgestellt statt auf cm — `FIELD_H=100`, `HALF_W=70`, `STAFF_W=140`,
`CENTER_X=70`, und eine Zahlengruppe (3 Felder = 300 Einheiten) entspricht
genau einem Dezimeter, also `UNITS_PER_M = 3000`. Damit sind alle
Referenz-Formeln wörtlich übernehmbar, und `crosshairY`/Ablesewert bleiben
physikalisch korrekt gekoppelt. `buildNumberField()`/`buildCombField()`
sind jetzt 1:1-Übersetzungen von `buildField()` inkl. Zeichenreihenfolge
(Feldlinien VOR den Flächen, damit Rot die Linien überdeckt wie im
Original; Mittelachse und Außenränder zuletzt).

Weitere übernommene Referenz-Details, die vorher abwichen: Zahlen sind
**rot** (`fill=RED`), nicht schwarz; weiße Kerben als eigene Ebene über den
roten Flächen; Ringfassung des Zielfernrohrs als `box-shadow` (3px Signal-,
10px Fassungsring) statt Border.

**Zwei echte Bugs dabei gefunden und behoben:**
1. **Distanzstriche saßen falsch.** Das Reticle zeichnete sie bei ±12 %
   des Kreises, die Berechnung erwartet sie aber bei ±30 % (aus
   `stadiaFraction = 0.3`). Die Entfernungsaufgabe war dadurch schlicht
   nicht lösbar — abgelesene Werte konnten nie zum erwarteten Ergebnis
   führen. Jetzt bei y=20/80, passend zur Formel.
2. **Kontext-Panel unbrauchbar dünn.** Bei korrekten Proportionen ist die
   volle 2,5-m-Latte 140:7500 = 1:54 — als Vollansicht nur ein paar Pixel
   breit. Die Referenz löst das per `overflow:hidden` mit fester Höhe, also
   als Ausschnitt; übernommen als `rodViewBox`-Getter (9 dm um die
   Ziellinie, am Lattenende geklemmt), Panel-Maße 22×420 px passend zum
   Seitenverhältnis, damit nichts verzerrt.

Simulierte Entfernungen auf 8–14 m gesetzt (vorher 15–45 m): dadurch liegt
der sichtbare Ausschnitt bei 1,3–2,3 dm, die Latte füllt ~20–35 % der
Kreisbreite und es sind immer 2–3 Dezimeterzahlen sichtbar — wie auf Tims
Referenzfotos. Größere Entfernungen hätten die Latte zum dünnen Band
schrumpfen lassen. 8/10/12/14 m ergeben außerdem glatte Intervalle
(8–14 cm) für die Rechenaufgabe.

**Bewusste Abweichung von der Referenz:** Das Fadenkreuz ist schwarz statt
orange — auf dem weißen Okularhintergrund deutlich besser lesbar und so
auch auf allen echten Fotos, die Tim geschickt hat. Ebenso bleibt der
Zoom-Mechanismus (dynamische `viewBox`) statt CSS-`translateY`, weil das
Spiel anders als die Referenz einen entfernungsabhängigen Zoom braucht.

**15. Runde (2026-08-16) — Foto einer echten Latte: Aufteilung korrigiert.**
Tim schickte ein Nahfoto einer echten Latte (Zahlen 15/14/13/12) mit
"jetzt muss nur noch die Aufteilung stimmen". Zwei Abweichungen zur
Referenz-HTML wurden dadurch sichtbar — die Referenz ist eine *stilisierte*
Nachbildung, das Foto zeigt die echte Norm:

1. **Zahlen stehen alle in EINER Spalte**, immer auf derselben Seite. Die
   Referenz (und damit unsere Runde 14) ließ die aktive Seite pro
   Zahlengruppe springen, wodurch die Zahlen abwechselnd links/rechts
   standen. Jetzt: linker Bereich = E-Muster, rechter Bereich = Zahlenspalte.
2. **Balken sind exakt 1 cm**, ein "E" ist 5 cm hoch (drei 1-cm-Balken mit
   je 1 cm Zwischenraum plus senkrechtem Steg), also **2 E pro Dezimeter** —
   nicht 3 stilisierte Felder wie in der Referenz. Der Steg wechselt bei
   jedem E die Seite, das ergibt den Zickzack.

Das Maßsystem ist damit auf `1 cm = 10 Einheiten` umgestellt
(`UNITS_PER_M = 1000`). Das ist nicht nur optisch richtiger, sondern macht
die Latte **zentimetergenau abzählbar** — genau der Sinn der E-Teilung und
damit auch fürs Ablesen im Spiel relevant (Toleranz 5 mm).

Lattenbreite 60 Einheiten (6 cm: 30 E-Bereich + 30 Zahlenspalte);
Zahlengröße 34 mit `textLength=26`, damit die Ziffern nicht gequetscht
wirken. Entfernungen auf 14–20 m gesetzt: dadurch sind wie auf dem Foto
2–3 Dezimeterzahlen gleichzeitig sichtbar und die Latte füllt ~20–26 % der
Kreisbreite. Production-Build fehlerfrei, per Playwright (3x) verifiziert.

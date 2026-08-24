---
tags: [gwen-code-auftrag, rechentrainer, gwen-fehlschlag]
autor: Claude
---

# Runde 14 — Rechentrainer: Selbstlern-Inhalte raus, Streckenplan-Reskin, zwei neue SVGs

Tim wollte den kompletten Rechentrainer-Bereich (5 Kacheln: Nivellieren,
Volumen, Prozentrechnung, Gesamtquiz, Materialrechner) an das
Streckenplan-Design angleichen (war noch komplett unmigriert, weiss/
hellblau) und bei Nivellieren/Volumen/Prozentrechnung die Selbstlern-Texte
vollstaendig entfernen — nur noch Quiz. Vollstaendiger Plan siehe
Plan-Datei vom 2026-08-23 ("Rechentrainer-Umbau"), bestaetigte
Zusatzentscheidungen: `SELBSTSTUDIUM_TILES` mit loeschen, fuer die zwei
fehlenden Rechentrainer-Bilder (Nivellieren, Gesamtquiz) eigene SVGs statt
erneuter Fotosuche.

## Phase 1+ — Selbstlern-Inhalte entfernt (Claude direkt, kein Gwen)

Bei allen drei Modulen identisch: `content.json`, `lesson-renderer.
component.*` und `*-nav.component.*` geloescht; `models`/`-data.service`/
`.page.ts`/`.module.ts` auf reinen Quiz-Zustand gekuerzt (Endform wie
`gesamtquiz.page.ts`); `.page.html` zeigt nur noch Hero + volle
Quiz-Engine. `katalog.ts`: `SELBSTSTUDIUM_TILES` geloescht,
`queryParams: { view: 'quiz' }` bei den drei Kacheln entfernt (kein
Sprungziel mehr noetig). Architektursensitiv, deshalb bewusst nicht an Gwen
delegiert. Nach jedem Modul `ng build` geprueft.

## Phase 2 — Streckenplan-Reskin

Drei Seiten (`nivellieren`/`volumen`/`prozentrechnung` `.page.scss` +
`quiz-engine.component.scss`) von Claude direkt geschrieben (gleichzeitig
strukturell veraendert durch Phase 1). Verbleibende drei reine Reskins
(`gesamtquiz.page.scss`, `gesamtquiz/quiz-engine.component.scss`,
`materialrechner.page.scss`) an Gwen delegiert.

### Zwischenfall: kaputte Cline-Installation

Erster Dispatch scheiterte alle drei Versuche: Versuch 1 der bekannte
Jinja-Crash ("Cannot apply filter 'string' to type: NullValue"), Versuch 2
`EBUSY` beim Neustart von `cline.exe`, Versuch 3
`Cannot find module '...\cline\bin\cline'` — die globale npm-Installation
von `cline` war zu dem Zeitpunkt tatsaechlich kaputt (Ordner enthielt nur
noch `node_modules`, keine eigenen Paketdateien mehr, Zeitstempel wenige
Minuten vor dem ersten Fehlschlag). Ursache unklar (evtl. ein
Hintergrund-Update oder Interferenz mit dem `taskkill`-Cleanup), nicht
durch diese Session ausgeloest. Fix: `npm install -g cline` (neu
installiert, danach funktionierte `lms ps` + Dispatch wieder normal).

### Sechstes Gwen-Fehlerbild (neu): Inhalt angehaengt statt ersetzt

Nach dem Cline-Fix lief `gesamtquiz.page.scss` im 2. Versuch mit
`SUCCESS_BUILD_OK` durch — die Diff-Pruefung zeigte aber: Gwen hatte den
neuen Inhalt an den ALTEN Datei-Inhalt **angehaengt**, statt ihn zu
ersetzen. Datei enthielt danach beide Regelsaetze (neue Streckenplan-Regeln
zuerst, alte weiss/blaue Regeln direkt dahinter) — technisch gueltiges
SCSS, baut fehlerfrei, aber durch CSS-Kaskade haetten die spaeter
stehenden ALTEN Regeln gewonnen und die Seite waere optisch unveraendert
geblieben. Nur durch Volltext-Lesen der Datei (nicht nur Diff-Kurzform)
entdeckt. Claude hat den angehaengten alten Block manuell entfernt.

**Lehre, in [[00-Start-Hier]] noch nachzutragen**: "Ersetzt komplett" heisst
fuer Gwen nicht immer wirklich Ersetzen — manchmal wird angehaengt. Nach
jedem Reskin-Dispatch die Datei einmal komplett lesen (nicht nur den Diff
ansehen) und pruefen, ob alte Regeln noch am Ende stehen.

### Weitere Fehlschlaege

`gesamtquiz/components/quiz-engine.component.scss`: drei Versuche NO_CHANGE
(37/39/35s, Modell offenbar an diesem Tag durchgehend unzuverlaessig) —
von Claude direkt geschrieben statt weiterer Versuche.

`materialrechner.page.scss`: Build brach mit SCSS-Syntaxfehlern ab
("var resource;" in Zeile 1, "Unterminated string token", "unmatched }")
— erkennbar korrupter/vermischter Inhalt. Von Claude direkt geschrieben.

**Bilanz Phase 2**: 6 Zieldateien, nur 1 davon (`gesamtquiz.page.scss`)
tatsaechlich per Gwen fertiggestellt (mit Nachbesserung durch Claude wegen
des Anhaenge-Fehlers), die uebrigen 5 von Claude direkt geschrieben.
Deutlich schlechtere Erfolgsquote als in fruaheren Runden — moeglicherweise
tagesabhaengige Modell-/Infrastruktur-Schwankung, nicht unbedingt
repraesentativ.

## Phase 3 — Zwei neue SVGs (Claude direkt)

`src/assets/bilder/nivellieren-diagramm.svg` (Nivelliergeraet + Stativ +
Zielstrahl + Latte) und `gesamtquiz-diagramm.svg` (Netz-Motiv: sieben
Module konvergieren zu einem zentralen Haken) im Stil von
`volumen-trapezprofil.svg`. In `katalog.ts` eingetragen
(`imageCredit: 'Eigene Grafik'`), nicht in `bildnachweise.json` (nur
recherchierte Fotos werden dort gefuehrt).

## Verifikation

- `ng build --configuration production` nach jeder Teilrunde gruen.
- Playwright-Screenshots aller 5 Rechentrainer-Seiten + der
  Rechentrainer-Kategorieseite: durchgehend dunkles Streckenplan-Design,
  keine weissen/hellblauen Reste, neue SVGs rendern korrekt, keine
  Konsolenfehler.

## Phase 4 — Lernfelder-Bilder

### Gwen-Dispatch gescheitert (siebtes Fehlerbild: Fetch-Tool kann Commons nicht erreichen)

Erster Versuch: `node tools/cline-cli/run-gwen-task.cjs
"08-Recherche-Gwen/02-Erweiterter-Auftrag-2026-08-11.md" --retries 2`
(3 Versuche, alle `NO_CHANGE` gegen die Auftragsdatei selbst — das ist fuer
diese Datei technisch korrekt, das eigentliche Ziel war eine neue Datei
`12-Bildmaterial/01-Bildkandidaten-Lernfelder.md`, die aber nie entstand).
Log-Analyse (`tools/cline-cli/logs/2026-08-23T10-33-37-148Z_02-Erweiterter-
Auftrag-2026-08-11.md.log`):

- Versuch 1+2: Gwen missversteht die Aufgabe komplett — schlussfolgert
  faelschlich, ohne ueberhaupt zu recherchieren, dass nichts zu tun sei
  (verwechselt die Auftragsdatei mit der Zieldatei).
- Versuch 3 (176s): Gwen versteht die Aufgabe diesmal richtig, recherchiert
  tatsaechlich (mehrere DuckDuckGo-Suchen, liest `Lernfelder-Uebersicht.md`
  fuer die exakten Titel), stoesst aber bei **jedem** Versuch, eine
  Wikimedia-Commons-Seite per Fetch-Tool zu laden, auf **HTTP 403** —
  weicht deshalb eigenmaechtig auf Pixabay/Pexels aus (Abweichung von der
  vorgegebenen Commons-Praeferenz). Parallel entstand dabei aber echte,
  brauchbare Fachrecherche zu LF11 (Ausrundungsboegen/Tangentenberechnung,
  mit Formeln und Quellenangaben Springer/Vorticity/Trackopedia) und zum
  Trassenplan-Auftragsteil. Der finale `editor`-Aufruf zum Anlegen der
  Zieldatei wurde erreicht, aber der Prozess stuerzte direkt danach mit dem
  bekannten Jinja-Fehler ab ("Cannot apply filter 'string' to type:
  NullValue") — Datei wurde nie geschrieben.

**Neue Lehre fuer [[../00-Start-Hier|00-Start-Hier]]**: Gwens Fetch-Tool
kann Wikimedia Commons strukturell nicht erreichen (403 bei jedem Versuch,
nicht nur gelegentlich) — fuer Bild-Recherche mit Commons als Quelle ist
Gwen damit aktuell ungeeignet, unabhaengig von Auftragsqualitaet.

### Entscheidung: Claude recherchiert Batch A direkt

Wegen des strukturellen Commons-Fetch-Problems hat Claude die erste Bild-
Batch selbst per WebSearch/WebFetch recherchiert statt erneut an Gwen zu
delegieren. Jeder Kandidat wurde einzeln ueber die echte Commons-
Dateiseite gegengeprueft (Lizenzbox, Autor, exakte Attribution) sowie der
tatsaechliche Hotlink (`Special:FilePath?width=900`) per `curl` auf HTTP
200 getestet, bevor er eingebaut wurde.

**Ergebnis — 5 Bilder recherchiert, verifiziert und eingebaut** (Batch A
komplett + LF12 aus Batch B vorgezogen, da guter Treffer):

| Lernfeld | Datei | Lizenz | Credit |
|---|---|---|---|
| LF03 Mauern | `Bricklayer_J4.jpg` | CC BY-SA 3.0 | Jamain |
| LF04 Stahlbeton | `BGJ_Lernfeld_4_-_Stahlbeton_Waende_Rahmenschalung...002.jpg` | CC BY-SA 4.0 | Patrick Oberdoerfer |
| LF08 Erdbau | `Dresden,_Fritz-Loeffler-Gymnasium,_Baugrube_031.jpg` | CC BY-SA 4.0 | Bybbisch94, Christian Gebhardt |
| LF09 Pflaster | `Paving_being_laid_arp.jpg` | Public Domain | Adrian Pingstone (Arpingstone) |
| LF12 Weichen | `New_point_motor.jpg` | CC BY 2.0 | Phil Sangwell |

Eingetragen in `katalog.ts` (`GLEISBAU_LERNFELD_TILES`/`BAUBERUFE_TILES`)
und `bildnachweise.json` (Keys `lf03`/`lf04`/`lf08`/`lf09`/`lf12`). Build
gruen, Playwright-Check auf `/kategorie/lernfelder` bestaetigt: alle 5
Kacheln zeigen das richtige Bild (Hintergrundbild-Stil wie Wissenstest-
Kacheln, kein `<img>`-Tag), Bildnachweise-Seite listet alle 5 Eintraege
korrekt, keine Konsolenfehler.

### Zweite Runde (2026-08-24): alle restlichen Lernfelder + alle Spiele-Kacheln

Tim wollte, dass **jedes Modul** ein Bild hat, nicht nur Rechentrainer und
das erste Lernfelder-Batch. Claude hat direkt weiterrecherchiert (wieder
WebSearch/WebFetch, kein erneuter Gwen-Versuch — siehe siebter Fallstrick),
jeden Kandidaten einzeln gegen die Commons-Dateiseite geprueft und den
Hotlink per `curl` verifiziert:

| Lernfeld | Datei | Lizenz | Credit |
|---|---|---|---|
| LF01 Baustelle einrichten | `Baustelle_HafenCity_2101-0036.jpg` | CC BY-SA 4.0 | Mozzihh (Henning Sidow) |
| LF02 Bauwerke erschliessen | `Baugrube_mit_Böschung_und_Arbeitsraum.jpg` | CC BY-SA 4.0 | Patrick Oberdoerfer |
| LF05 Holzkonstruktionen | `Fachwerk_Abbund.jpg` | CC BY-SA 4.0 | Georg Hefter (georghefter.de) |
| LF06 Beschichten/Bekleiden | `Wärmedämmverbundsystem (WDVS) teilweise auf Altbau..JPG` | CC BY-SA 3.0 | Handwerker |
| LF07 Baugruende erkunden | `Ramm- und Rammkernsondierung.jpg` | CC BY-SA 4.0 | Jonas Boerje Lundin |
| LF10 Gleisanlagen neu bauen | `Gleisbau in Probsteierhagen (1).jpg` | CC BY-SA 4.0 | Siegbert Brey (Snoopy1964) |
| LF13 Weichen instand halten | `Weichenheizung.JPG` | CC BY-SA 3.0 | Fabian Grunder |

Fuer LF11 (Gleisboegen/Einmessen) und LF14 (Sonderbauformen) gab es wie
erwartet keine passenden Fotos (zu abstrakt/rechnerisch bzw. zu
unspezifisch) — beide per **eigener SVG** geloest: `gleisbogen-diagramm.svg`
(Bogenradius, Mittelpunkt M, Winkel α) und `sonderbauformen-diagramm.svg`
(Schotteroberbau vs. Feste Fahrbahn im Vergleich + Andreaskreuz fuer
Bahnuebergang). **Damit haben jetzt alle 14 Lernfelder ein Bild.**

Zusaetzlich fiel auf: `SPIELE_TILES` (4 Kacheln — Nivellierlatte,
Schienenkopf-Verschleissmesser, Schienen erkennen, Quiz-Duell) hatten
bislang **gar kein Bild** (das `QuizTile`-Interface unterstuetzt zwar
`image`/`imageCredit`, war dort aber nie befuellt worden). Ebenfalls
geschlossen:

- **Nivellierlatte ablesen**: `Nivellierlatte-einfach.JPG` (Wurzeltee,
  CC BY-SA 3.0) — echtes Foto einer Nivellierlatte.
- **Schienen erkennen**: `Schienenformen der Straßenbahn Leipzig.jpg`
  (Falk2, CC BY-SA 3.0) — zeigt vier verschiedene Schienenprofile im
  direkten Vergleich, passt fast wörtlich zum Spielprinzip.
- **Schienenkopf-Verschleissmesser**: kein brauchbares Commons-Foto
  gefunden (das reale Messgeraet ist ein Nischenwerkzeug, nur
  Hersteller-/Patentquellen auffindbar) — eigene SVG
  (`schienenmesser-diagramm.svg`, Schienenkopfprofil mit
  Hoehen-/Seitenverschleiss-Messpunkten).
- **Quiz-Duell**: kein reales Fotomotiv moeglich (abstraktes App-Feature)
  — eigene SVG (`quizduell-diagramm.svg`, zwei Spieler-Kreise mit
  Fragezeichen, VS-Blitz in der Mitte). Bewusst im Streckenplan-Stil
  gehalten (nicht im "Steel/Signal"-Theme des Quiz-Duell-Features selbst),
  da diese Kachel auf der allgemeinen Spiele-Kategorieseite liegt.

Alle 4 Spiele-Kacheln, alle 14 Lernfelder, alle 5 Rechentrainer-Kacheln und
alle 10 Wissenstests haben damit ein Bild (33/33 Katalog-Kacheln). Build
gruen, Playwright bestaetigt alle 11 neuen Bilder (7 Lernfelder + 4 Spiele)
rendern korrekt, keine Konsolenfehler. Auffaellig zusaetzlich: ein
verwaister `dashboard-header`-Eintrag in `bildnachweise.json` wird von
keinem Code mehr referenziert (Relikt aus der Zeit vor dem
Dashboard-Redesign 2026-08-17) — nicht angefasst, da ausserhalb des
aktuellen Auftrags, aber als Hinweis vermerkt.

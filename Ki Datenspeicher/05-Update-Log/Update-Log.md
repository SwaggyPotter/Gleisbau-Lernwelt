---
tags: [update-log, historie]
autor: Claude
---

# Update-Log

Chronologie der wichtigsten Änderungen am Projekt, neueste zuerst. Basiert auf
`git log` (Autor: Tim / SwaggyPotter) plus manueller Analyse der Commit-Diffs.
Neue Einträge bitte **oben** anfügen.

---

## 2026-08-25 (2) — Rechte-Recherche zu Quellen-Links und Bildern abgeschlossen, neue Seite `/rechte`

Tim wollte wissen, ob die 645 externen Quellen-Links (Link + eigener
Kurztext) rechtlich unbedenklich sind, und alle Wikimedia-Commons-
Bildlizenzen komplett neu verifiziert haben (nicht nur aus der alten
Recherche übernommen) — explizit als KI-Einschätzung, keine Rechtsberatung.

Alle 258 verlinkten Domains in 7 Kategorien eingeordnet (Wikipedia,
amtliche Gesetzestexte, öffentliche Stellen/BGs, bahnnahe Unternehmen,
kommerzielle Fachlexika, Herstellerseiten, kleine Fachseiten/Foren), die
10 häufigsten einzeln per Impressum/Nutzungsbedingungen geprüft. Ergebnis:
kein einziger Fall mit explizitem Link-/Zitierverbot; reines Verlinken +
eigener Kurztext ist nach EuGH-Rechtsprechung (Svensson/GS Media) und
§ 2/§ 5 UrhG rechtlich unbedenklich. Von 53 `source`-Feldern mit
Anführungszeichen (Verdacht auf Wortlaut-Zitat) waren 18 bereits reine
Titel-/Begriffsnennungen (unproblematisch) und **35 enthielten echten,
zitierten Wortlaut** — diese wurden direkt umgeschrieben auf eigenständige
Kurzformulierungen (Link unverändert).

Alle 25 Wikimedia-Commons-Bildlizenzen einzeln neu gegen die aktuelle
Commons-Dateiseite geprüft: 24 vollständig bestätigt, 1 Korrektur
(`handwerkzeuge`-Bild — Fotograf/Behörde war ungenau als "NARA"
zugeordnet, tatsächlich Jim Pickerell für die EPA; gemeinfreier Status
unverändert korrekt).

Neue Seite `/rechte` (Modul `src/app/rechte/`, gleiches Streckenplan-
Design wie `/bildnachweise` und `/quellenverzeichnis`, dritter
Footer-Link im Dashboard) fasst alles zusammen, inkl. gut sichtbarem
Disclaimer ("Keine Rechtsberatung"). `ng build` grün mit eigenem Chunk,
Playwright-Check ohne Konsolenfehler. Details:
[[../14-Gwen-Code-Aufgaben/18-Rechte-an-Quellen-und-Bildern]].

---

## 2026-08-24 (2) — Themenquiz-Quellenprüfung abgeschlossen: 645/645 Fragen mit Quelle+Link (100 %)

Tim wollte, dass bei jeder Frage in den 24 Themenquiz-/Lernfeld-Quizzen
(645 Fragen) eine Quelle mit direktem Link steht, recherchiert und geprüft
von Gwen, mit einer schlanken Abschluss-Prüfung durch Claude — ausdrücklich
"sehr sauber durchgeführt". Die `source`/`sourceUrl`-Felder und ihr
Rendering existierten bereits im Code (aus einer früheren Runde
vorbereitet), waren aber bei 0/645 Fragen befüllt.

Neuer, selbst-fortsetzender Dispatch-Workflow unter
`tools/themenquiz-quellenpruefung/` (`run-batches.cjs` überspringt
automatisch bereits fertige Batches anhand der App-JSON selbst). Erster
Formatversuch (15 Fragen/Batch, 4 Platzhalter) scheiterte — Gwen driftete
ab Frage 5 auf erfundene generische Antworten statt der echten Fragen.
Nach Verkleinerung auf 5 Fragen/Batch mit 1 einfachem Feld blieb die
Qualität stabil. Über den Verlauf acht verschiedene Parser-/Prozess-Bugs
gefunden und behoben (URLs an Klammern abgeschnitten, doppelte Frage-IDs
überschrieben echte Antworten, BOM-Fallstrick erneut aufgetreten,
doppelt-kodiertes UTF-8, Markdown-Linksyntax leckte in URLs).

**Wichtigster Fund**, erst bei einer Vollprüfung aller 482 eingetragenen
URLs (nicht nur Stichproben) entdeckt: Gwen hat bei mehreren Fragen-Clustern
**erfundene, aber plausibel klingende Domains** als Quelle angegeben,
statt ehrlich "keine gefunden" zu schreiben — z. B. `azmk.de/faq/lfo1/
lfo1_q31.html`, fünfmal in Folge mit zur echten Frage-Nummerierung
passendem Pfad. 45 betroffene Fragen entfernt, `apply-results.cjs` prüft
seither jede neue URL per DNS-Auflösung, bevor sie übernommen wird.
Daneben u. a. mehrere echte 404s, ein 410, mehrere Forenbeiträge und ein
paywalled Link gefunden und entfernt (juraforum.de dagegen per WebFetch
geprüft und trotz Namens als seriöse Rechtsdatenbank bestätigt, behalten).

**Endstand (nach einer zweiten Runde am 2026-08-25): 645/645 Fragen
(100 %) mit echter, verifizierter Quelle**, über alle 24 Themen verteilt.
Build grün, Link-Rendering in der Quiz-Oberfläche per Playwright
bestätigt. Details, komplette Bug-Liste und Fund-Historie:
[[../14-Gwen-Code-Aufgaben/15-Themenquiz-Quellenpruefung]].

---

## 2026-08-25 — Neue Seite "Quellenverzeichnis" + Rechte-Recherche-Auftrag vorbereitet

Tim wollte eine zentrale Seite mit allen Fragen, Antworten und Quellen
für volle Transparenz. Die Quellen-Anzeige direkt im Quiz (per Frage
nach dem Beantworten) existierte bereits aus einer früheren Runde. Neue
Seite `/quellenverzeichnis` gebaut: alle 24 Themen einklappbar, pro Frage
Fragetext/Antwort/Quelle mit Link, Volltextsuche über Fragen/Antworten/
Quellen, Link im Dashboard-Footer neben "Bildnachweise". Details:
[[../14-Gwen-Code-Aufgaben/16-Quellenverzeichnis-Seite]].

Dabei zum zweiten Mal die kaputte `cline`-Installation angetroffen
(`npm install -g cline` behoben) — diesmal am verlässlichen Muster "alle
3 Versuche scheitern in 0 Sekunden" erkannt statt an wechselnden
Fehlermeldungen. Die letzten 9 fehlenden Quellen aus der Vortagesrunde
wurden dabei auch geschlossen (siehe Eintrag oben, jetzt 100 %).

Anschließend wollte Tim eine **Rechte-Recherche** in einer neuen
Chat-Session: prüfen, ob das Verlinken + kurze Begründen mit den 641
externen Quellen-Domains rechtlich unproblematisch ist (oder ob Texte
umgeschrieben werden müssen), plus eine komplette Neu-Prüfung aller
Bildlizenzen (Wikimedia Commons) — Ergebnis soll auf einer neuen Seite
"Rechte an Quellen und Bildern" landen. Auftrag/Prompt dafür vorbereitet
und dokumentiert: [[../14-Gwen-Code-Aufgaben/17-Rechte-Recherche-Auftrag]].
Die Recherche selbst ist noch nicht gestartet — das ist Aufgabe der
nächsten Session.

---

## 2026-08-24 — Alle restlichen Modul-Bilder ergänzt: 14/14 Lernfelder + 4/4 Spiele

Tim wollte, dass ausnahmslos jedes Modul ein Bild hat. Claude hat direkt
weiterrecherchiert (WebSearch/WebFetch, kein erneuter Gwen-Versuch — siehe
Eintrag unten zum siebten Fallstrick) und alle verbleibenden Luecken
geschlossen:

**7 weitere Lernfeld-Fotos** (jedes einzeln ueber die Commons-Dateiseite
verifiziert, Hotlink getestet): LF01 Baustellen einrichten (HafenCity-
Baustelle, Mozzihh), LF02 Bauwerke erschliessen (Baugrube mit Böschung,
Patrick Oberdoerfer), LF05 Holzkonstruktionen (Fachwerk-Abbund, Georg
Hefter), LF06 Beschichten/Bekleiden (Wärmedämmverbundsystem, Handwerker),
LF07 Baugruende erkunden (Rammkernsondierung, Jonas Boerje Lundin), LF10
Gleisanlagen neu bauen (Gleisbau in Probsteierhagen, Siegbert Brey), LF13
Weichen instand halten (Weichenheizung, Fabian Grunder) — alle CC BY-SA
3.0/4.0.

**2 neue Eigen-Grafiken** fuer LF11 (Gleisboegen herstellen und einmessen)
und LF14 (Sonderbauformen), da beide zu abstrakt/unspezifisch fuer ein
passendes Foto sind: `gleisbogen-diagramm.svg` (Bogenradius mit
Mittelpunkt und Winkel) und `sonderbauformen-diagramm.svg`
(Schotteroberbau vs. Feste Fahrbahn + Andreaskreuz). **Damit haben jetzt
alle 14 Lernfelder ein Bild.**

**Spiele-Kacheln nachgezogen**: fiel dabei auf, dass alle 4 Spiele
(Nivellierlatte ablesen, Schienenkopf-Verschleissmesser, Schienen
erkennen, Quiz-Duell) bisher komplett ohne Bild waren. Nivellierlatte
ablesen bekam ein echtes Foto einer Nivellierlatte (Wurzeltee), Schienen
erkennen ein Foto mit vier verschiedenen Schienenprofilen im direkten
Vergleich (Falk2) — fast wörtlich das Spielprinzip. Fuer
Schienenkopf-Verschleissmesser (Nischen-Messgeraet, keine freie
Foto-Quelle auffindbar) und Quiz-Duell (abstraktes App-Feature) je eine
eigene SVG.

**Ergebnis: alle 33 Katalog-Kacheln der App haben jetzt ein Bild** (10
Wissenstests, 14 Lernfelder, 5 Rechentrainer, 4 Spiele). Build gruen,
Playwright bestaetigt alle 11 neuen Bilder rendern korrekt, keine
Konsolenfehler. Details: [[../14-Gwen-Code-Aufgaben/14-Rechentrainer-Umbau]].

---

## 2026-08-23 (2) — Fünf Lernfeld-Bilder recherchiert und eingebaut (LF03/04/08/09/12)

Fortsetzung des Bild-Auftrags aus dem Eintrag unten. Der ueber Gwen
angestossene Recherche-Dispatch ist **gescheitert**: in den ersten beiden
von drei Versuchen missverstand Gwen die Aufgabe komplett (hielt die
Auftragsdatei selbst fuer das Bearbeitungsziel), im dritten Versuch verstand
Gwen die Aufgabe richtig und recherchierte tatsaechlich — bekam aber bei
**jedem** Versuch, eine Wikimedia-Commons-Seite zu laden, HTTP 403 vom
eigenen Fetch-Tool zurueck (ein neues, siebtes Gwen-Fehlerbild, diesmal
strukturell/infrastrukturell statt inhaltlich — siehe [[../00-Start-Hier]]).
Gwen wich deshalb auf Pixabay/Pexels aus, was der vorgegebenen
Commons-Praeferenz widerspricht; der Prozess stuerzte zudem direkt beim
Versuch, die Ergebnisdatei zu schreiben, mit dem bekannten Jinja-Fehler ab
— nichts wurde gespeichert.

Claude hat die erste Bild-Batch daraufhin selbst per WebSearch/WebFetch
recherchiert (Commons ist fuer Claudes Fetch-Zugriff normal erreichbar).
**5 Bilder gefunden, einzeln ueber die echte Commons-Dateiseite verifiziert
(Lizenzbox, Autor, exakte Attribution) und der Hotlink per `curl` auf HTTP
200 getestet**, dann in `katalog.ts` und `bildnachweise.json` eingetragen:

- **LF03 Mauern**: Bricklayer J4.jpg (Jamain, CC BY-SA 3.0)
- **LF04 Stahlbeton**: BGJ Lernfeld 4 – Stahlbeton Waende Rahmenschalung...jpg (Patrick Oberdoerfer, CC BY-SA 4.0)
- **LF08 Erdbau**: Dresden, Fritz-Loeffler-Gymnasium, Baugrube 031.jpg (Bybbisch94 & Christian Gebhardt, CC BY-SA 4.0)
- **LF09 Pflaster**: Paving being laid arp.jpg (Adrian Pingstone/Arpingstone, gemeinfrei)
- **LF12 Weichen**: New point motor.jpg (Phil Sangwell, CC BY 2.0)

Per Playwright bestaetigt: alle 5 Kacheln auf `/kategorie/lernfelder`
zeigen das richtige Bild, Bildnachweise-Seite listet alle 5 Eintraege
korrekt, keine Konsolenfehler, Build gruen. Damit sind 5 von 14
Lernfeldern bebildert. Offen: LF10/LF13 (keine ueberzeugenden Treffer bei
der ersten Suche) sowie LF01/02/05/06/07/11/14 (noch nicht recherchiert).
Details: [[../14-Gwen-Code-Aufgaben/14-Rechentrainer-Umbau]].

---

## 2026-08-23 — Rechentrainer auf Streckenplan umgestellt, Selbstlern-Texte raus, zwei neue Bilder

Der komplette Rechentrainer-Bereich (Nivellieren, Volumen, Prozentrechnung,
Gesamtquiz, Materialrechner) war als letzter Teil der App noch im alten
weiss/hellblauen Ionic-Standarddesign. Jetzt durchgehend Streckenplan-Design
(dunkel, `--sp-*`-Tokens). Bei Nivellieren/Volumen/Prozentrechnung wurden
zusaetzlich die ausfuehrlichen Selbstlern-Texte (Leitfaden-Bloecke,
"Erledigt"-Tracking, Block-Navigation) komplett entfernt — Tim vermittelt
die Inhalte selbst, die App soll nur noch abfragen. Alle drei Seiten sind
jetzt strukturell wie Gesamtquiz: Hero + volle Quiz-Engine, sonst nichts.
Das seit 2026-08-17 bereits tote `SELBSTSTUDIUM_TILES`-Array in
`katalog.ts` wurde mit geloescht (verwies genau auf die jetzt entfernten
Texte). Zwei neue selbst gezeichnete SVG-Grafiken (Nivellieren-Geraet-
Diagramm, Gesamtquiz-Netz-Motiv) schliessen die letzten Bild-Luecken im
Rechentrainer-Bereich, im gleichen Stil wie die bestehenden
Volumen/Prozentrechnung/Trassenplan-SVGs.

**Gwen-Bilanz:** durchwachsen — die globale Cline-Installation war zu
Sitzungsbeginn tatsaechlich kaputt (`npm install -g cline` hat es
behoben, siehe [[../14-Gwen-Code-Aufgaben/14-Rechentrainer-Umbau]]), und
danach trat ein **neues, sechstes Gwen-Fehlerbild** auf: neuer Inhalt wurde
an den alten angehaengt statt ihn zu ersetzen — technisch gueltiges SCSS,
gruener Build, aber die alten (falschen) Regeln haetten dank CSS-Kaskade
gewonnen. Nur durch vollstaendiges Lesen der Datei entdeckt, nicht durch
den Diff allein. Von 6 fuer Gwen vorgesehenen Reskin-Dateien wurde am Ende
nur 1 tatsaechlich brauchbar von Gwen geliefert, der Rest von Claude direkt
geschrieben.

Die Recherche fuer die noch fehlenden 14 Lernfelder-Bilder wurde ueber
Gwen angestossen — Ergebnis siehe Eintrag oben ("Fuenf Lernfeld-Bilder
recherchiert und eingebaut"): der Gwen-Dispatch scheiterte strukturell,
Claude hat die erste Batch stattdessen selbst recherchiert.

Per Playwright bestaetigt: alle 5 Rechentrainer-Seiten + die
Rechentrainer-Kategorieseite durchgehend im neuen Design, keine
Konsolenfehler, neue Bilder rendern korrekt.

---

## 2026-08-22 (4) — Quiz-Duell: Wiedereinstieg zeigt immer die Auswahl statt automatisch das letzte Match fortzusetzen

Bug aus der vorigen Runde: Ionic haelt Seiten im Navigations-Cache am Leben
-- beim erneuten Aufruf von `/zusatz/quizduell/duell` blieb die Komponente
im zuletzt aktiven `state` ("mitten im Spiel") haengen, `ionViewWillEnter`
aktualisierte die "Laufende Spiele"-Liste nur, wenn man zufaellig schon auf
dem Setup-Screen war. Tim wollte stattdessen: raus und wieder rein soll
immer zur Auswahl fuehren (neues Duell starten ODER eines der laufenden
fortsetzen), nicht zwangslaeufig ins zuletzt gespielte Match. Fix:
`ionViewWillEnter` setzt jetzt IMMER auf `state = 'setup'` zurueck (der
Spielstand ist laengst in `localStorage` gesichert, geht also nichts
verloren) und laedt die Liste neu.

Damit funktioniert jetzt auch das eigentliche Ziel dahinter: **mehrere
gleichzeitig laufende Duelle** (Tim: "wie eine Extrakarteikarte" -- passend
zum Vorbild, wo man mit mehreren Leuten parallel offene Duelle haben kann,
ohne zu wissen, wann wer antwortet). Die Datenschicht
(`QuizduellDataService.speichereMatch`, Array in `localStorage`) hat das
schon vorher unterstuetzt, nur der Navigations-Bug verhinderte es in der
Praxis. Per Playwright bestaetigt: zwei parallele Matches (SpielerA/
SpielerB, je gegen eigenen Bot) angefangen, beide erscheinen als eigene
Karten, gezieltes Fortsetzen der ersten Karte laedt wirklich deren eigenen
Stand (nicht den der zweiten).

---

## 2026-08-22 (3) — Quiz-Duell: Feinschliff nach erstem Live-Test (Gast-Namen, mehr Themen, laufende Spiele, Textfarben-Bugfix)

Tim hat die Steel/Signal-Version live getestet und Nachbesserungen
gewünscht — alle direkt von Claude umgesetzt (kleine, praezise Logik-/
Config-Aenderungen an bestehenden Dateien, kein Gwen-Dispatch diese Runde):

1. **Automatischer Gast-Name**: Klick auf "Gegner suchen" ohne Namenseingabe
   erzeugt jetzt `Gast_XXXX` (analog zu den Bot-Namen), statt eine
   Fehlermeldung zu zeigen.
2. **Mehr Themenoptionen pro Runde**: 4 statt 3 Kategorie-Vorschläge
   (`KATEGORIE_OPTIONEN_ANZAHL` in `quizduell.models.ts`). Der Themenpool
   selbst war mit allen 24 `topics.json`-Einträgen (10 Wissenstest + 14
   Lernfelder) schon vorher vollständig.
3. **Name-Wiederverwendung**: Gast-Name wird in `localStorage`
   (`quizduell-gast-name`) gemerkt und beim naechsten Besuch vorausgefuellt.
4. **Laufende Spiele**: jedes angefangene, noch nicht abgeschlossene Match
   wird nach jedem Schritt in `localStorage` (`quizduell-offene-matches`)
   gespeichert. Die Setup-Seite zeigt eine "Laufende Spiele"-Liste mit
   Gegner/Rundenstand, "Weiterspielen" stellt den exakten Punkt wieder her
   (inkl. neu geladener Fragen anhand der gespeicherten Frage-IDs);
   abgeschlossene Matches verschwinden automatisch aus der Liste.
5. **Bugfix schwarzer Text auf dunklem Grund** (Kategoriewahl, Punktestand):
   Ursache war eine bisher unbekannte Ionic-Eigenheit, nicht ein
   Gwen-Fehler — `::slotted(*)` in `<ion-content>` überschreibt geerbte
   `:host`-Farben fuer alles ohne eigene explizite `color`-Regel. Fix:
   `color` zusätzlich explizit auf dem obersten `.app-shell`-Wrapper in
   allen drei Quiz-Duell-Seiten gesetzt. Neue Vault-Notiz dazu in
   [[../00-Start-Hier]] (Design-Abschnitt), da das jede künftige
   eigenständig gestylte `ion-content`-Seite treffen könnte, nicht nur
   Quiz-Duell.

Alle fünf Punkte per Playwright end-to-end bestätigt (Auto-Name, 4
Kategorien, Namens-Vorausfüllung nach Reload, Speichern/Fortsetzen/
Verschwinden eines laufenden Matches, korrigierte Textfarbe per
`getComputedStyle`-Check).

---

## 2026-08-22 (2) — Quiz-Duell nach Tims Referenz-Prototyp umgebaut: Bot-Gegner statt Pass-and-Play, neues Steel/Signal-Design

Tim hat einen selbst (bei einer anderen Claude-Instanz) beauftragten
HTML-Prototyp (`gleisbau-quizduell.html`) als verbindliche Vorlage
geliefert: "genau eins zu eins nachbauen". Umgesetzt, mit zwei
kommunizierten Abweichungen — echte Themenquiz-Fragen statt des
unbelegten Demo-Fragenpools der Vorlage, selbst gehostete Fonts
(Barlow/JetBrains Mono) statt neuer Google-Fonts-Links fuer Inter/IBM
Plex Mono (gleiche Rolle, passt zur bestehenden Font-Konvention).

**Wichtigste Aenderung:** Der Gegner ist jetzt immer ein simulierter
**Trainings-Bot** (Schwellen-Klaus, Weichen-Steller-Bot, Gleisbau-Trainer,
Prellbock-Peter, Signal-Susi — feste Trefferquote 65 % pro Frage, keine
echte KI) statt eines zweiten Menschen am selben Geraet. Simuliertes
Matchmaking ("Gegner wird gesucht" → faellt nach ~3,6s zuverlaessig auf
Bot zurueck) macht das Duell jetzt **allein spielbar**, kein
Geraet-Weiterreichen mehr noetig. Neues, eigenstaendiges visuelles Design
("Steel/Signal") nur fuer Quiz-Duell — dunkle Stahl-Palette, oranges
Schienen-Leisten-Motiv oben im Rahmen, bewusst unabhaengig vom
Streckenplan-Theme des restlichen App, weil Tim explizit diesen Look so
wollte.

**Gwen-Bilanz:** 3 Runden, siehe
[[../14-Gwen-Code-Aufgaben/13-Quizduell-Referenz-Umbau]] — dabei zwei
weitere, bisher nicht dokumentierte Fehlerbilder entdeckt (fehlendes
Anfuehrungszeichen bei eng am `>` stehenden Attributwerten; eine von zwei
Dateien in einem Mehrdatei-Auftrag komplett ausgelassen trotz
`SUCCESS_BUILD_OK`, weil die alte Datei zufaellig weiter gueltiges CSS
war). Die groesste Datei (Duell-Seite, State-Machine mit 7 Phasen) wurde
diesmal direkt von Claude geschrieben, aus Vorsicht nach der
`<br>`-Degenerations-Erfahrung der letzten Runde.

Per Playwright zwei komplette Matches durchgespielt (Gast-Sieg 11:7 gegen
Bot, eingeloggtes Match mit Statistik-/Rating-/Errungenschaften-Update) —
alles bestaetigt korrekt, Screenshots zeigen eine sehr genaue optische
Uebereinstimmung mit Tims Referenz-Prototyp.

---

## 2026-08-22 — Quiz-Duell komplett auf echtes Vorbild umgebaut (Claude + Gwen)

Tim hat den echten Play-Store-Eintrag von "Quizduell" (MAG Interactive,
`se.maginteractive.quizduel2`) gezeigt und bestätigt: **genau nach diesem
Prinzip** bauen, nicht das Pass-and-Play-Provisorium vom 2026-08-20. Per
Wikipedia/Testbericht-Recherche (siehe Quellen im Chat) verifiziertes
Prinzip übernommen: **6 Runden à 3 Fragen**, pro Runde wählt abwechselnd
ein Spieler die Kategorie aus **3 Vorschlägen**, **20 Sekunden Zeitlimit**
pro Frage, Sieger = wer über alle 18 Fragen insgesamt mehr richtig hat.
Ohne Werbung/VIP (interne Lern-App). Komplettes Datenmodell
(`QuizduellMatch`/`QuizduellRunde`) neu, `QuizduellDataService` jetzt mit
vereinfachtem Elo-Rating (Start 1000, K=32 — echter Quizduell-Algorithmus
ist nicht offengelegt), erweiterten Statistiken (Rating, Duelle,
Trefferquote) und einem Emoji-Errungenschaften-Katalog (9 Stück, u. a.
"Perfektes Duell", "Blitzschnell", "Vielspieler"). Die Frage-Komponente hat
jetzt einen echten Sekunden-Countdown mit automatischem "keine Antwort" bei
Zeitablauf.

**Weiterhin bewusst Pass-and-Play** (kein echtes Live-Multiplayer): ohne
Backend gibt es keine Moeglichkeit, ein Duell wirklich über Tage/Geräte zu
verteilen. Das `QuizduellMatch`-Datenmodell ist aber bereits so geformt,
wie ein späterer Server es bräuchte (Runden/Züge/Kategoriewahl 1:1 wie beim
Vorbild) — siehe Kommentar in `duell.page.ts`.

**Gwen-Bilanz (3 Runden, [[../14-Gwen-Code-Aufgaben/10-Quizduell-Umbau-Duell-Seite]]
bis [[../14-Gwen-Code-Aufgaben/12-Quizduell-Umbau-Frage-Komponente]]):**
2 von 3 liefen sauber durch. Bei der größten, repetitivsten Datei
(Duell-Seite, 5 Zustände) trat ein **drittes, neues Gwen-Fehlerbild** auf:
Gwen ersetzte an mehreren wiederkehrenden Stellen (kurz vor dem
schließenden `>` bei ähnlichen `(click)="...">`-Zeilen) den restlichen
Inhalt durch ein wörtliches `<br>` — vermutlich eine Degenerations-
Abkürzung bei stark repetitivem Text. Der Build schlug dadurch laut fehl
(kein stiller Fehler), aber die Verifikationszeit war verdächtig kurz
(72s statt der üblichen 180–250s) — ein neuer Frühwarn-Indikator. Claude
hat die Datei direkt geschrieben statt einen Retry zu riskieren.

Per Playwright zwei komplette 6-Runden-Matches durchgespielt (Gast + nach
Registrierung eingeloggt): Kategoriewahl, Timer, Rundenwechsel, Übergabe-
Screens, Ergebnis, Rating-/Statistik-/Erfolge-Update alles bestätigt
korrekt (u. a. Elo-Draw bei Gleichstand = 0 Punkte Änderung, wie erwartet).

---

## 2026-08-20 — Viertes Spiel "Quiz-Duell" mit lokalem Login-Grundgerüst (Claude + Gwen)

Neues Spiel unter `/zusatz/quizduell` (Kachel in `SPIELE_TILES`). Zwei
Spieler treten **Pass-and-Play am selben Gerät** nacheinander gegen dieselben
Fragen aus einem bestehenden Themenquiz-Thema an (Spieler 1 durch, Geraet-
Übergabe-Screen, Spieler 2 durch, Ergebnisvergleich per Punkten/Zeit).
**Ausdrücklich ein v1-Vorschlag** (Tim wollte die genaue Mechanik erst nach
dieser Grundgerüst-Runde festlegen) — siehe Offene-Punkte.

Dazu ein rein lokales (localStorage, kein Backend angebunden) Login-
Grundgerüst: **Gäste dürfen ohne Konto spielen**, nur eingeloggte Nutzer
sehen/sammeln Statistik (Siege/Niederlagen/Streak/einfache Erfolge unter
`/zusatz/quizduell/statistik`). `AuthService` speichert Nutzer + Session
lokal (SHA-256-Digest, keine echte Sicherheit ohne Server), Registrierung
aktuell ohne Key — das Datenmodell hat aber schon ein Key-Feld-Skelett fürs
später gewünschte Admin-Key-System vorbereitet (analog
`backend/routes/registration.ts`).

**Architektur-Entscheidung gegen die dokumentierte Silent-Skip-Falle:**
Claude hat Modul, Routing, Katalog-Eintrag und **alle** `.ts`-Dateien (Auth-
Service, Datenservice, alle 3 Seiten, die Frage-Komponente) sowie triviale-
aber-echte Platzhalter-Templates selbst geschrieben und per `ng build`
verifiziert (eigener Chunk vorhanden), **bevor** Gwen etwas anfasste — damit
konnte kein unvollständiger Gwen-Auftrag mehr unbemerkt durchrutschen.

**Gwen-Bilanz (4 Runden, Details [[../14-Gwen-Code-Aufgaben/06-Quizduell-Login]]
bis [[../14-Gwen-Code-Aufgaben/09-Quizduell-Frage-Komponente]]):** 3 von 4
HTML/SCSS-Runden liefen sauber durch. Runde "Statistik-Seite" scheiterte
zweimal mit einem **neuen, bisher nicht dokumentierten Fehlerbild**: Gwens
`editor`-Tool kam mit einem BOM in der Zieldatei nicht klar, wich auf
PowerShell-Here-Strings aus, scheiterte auch dort an HTML-Sonderzeichen —
am Ende war die Datei leer bzw. komplett gelöscht statt nur unverändert
(gefährlicher als das bekannte NO_CHANGE-Verhalten). Claude hat die Datei
danach direkt geschrieben. **Neue Regel für künftige Gwen-Code-Runden:**
nach jedem Auftrag nicht nur bauen, sondern auch Dateigröße plausibel
prüfen (nicht 0 Byte, nicht verschwunden).

Per Playwright-QA (`browser-automation`-Skill) End-to-End bestätigt: Kachel
sichtbar, Gast-Duell komplett spielbar mit korrektem Ergebnis-/Speicher-
Hinweis, Registrierung + Redirect, Statistik-Karten nur eingeloggt sichtbar,
Statistik aktualisiert sich nach einem zweiten Duell, Logout schaltet zurück
auf Login-Aufforderung, keine Konsolenfehler.

---

## 2026-08-19 — Schienenkopf-Verschleissmesser komplett ersetzt durch Referenz-Simulation (Claude)

Tim lieferte eine fertige, eigenstaendige HTML-Simulation mit echter
Zieh-Interaktion und fester Geraete-Kinematik (fixer 43°-Fuehlerarm-Winkel,
Pivot haengt von der tatsaechlichen Fussbreite ab). 1:1 in die
Angular-Seite uebertragen — alte Regler-Version komplett ersetzt. Bei
falscher Profileinstellung liefert das Geraet jetzt plausibel falsche
Werte statt gesperrter Regler (realistischer). Nennhoehe 54E4 aendert sich
dabei von 161 auf 154 mm (Wert aus der neuen Quelle). Technisch: DOM-Zugriffe
auf das Komponenten-Root beschraenkt (Ionic haelt alte Seiten im DOM),
globaler Keydown-Listener wird beim Verlassen der Seite entfernt. Per
Playwright bestaetigt: abgelesener Verschleiss trifft bei korrekter
Kalibrierung exakt den echten, zufaellig gewuerfelten Wert. Details:
[[../14-Gwen-Code-Aufgaben/04-Schienenkopf-Verschleissmesser]].

---

## 2026-08-17 — "Schienen erkennen" als drittes Spiel (Claude + Gwen)

Drittes Spiel unter `/zusatz/schienenraten`, drei Modi: Schienenform am
Umriss erkennen (7 Kategorien), konkretes Profil anhand Maßen erraten
(~50 Profile, Distraktoren bevorzugt aus derselben Kategorie), Maße zu
einem gegebenen Profil selbst eintragen (Toleranz ±8 %, mind. 2 mm). Fünf
Silhouetten-Familien je Schienenform (Vignol, Kran, Rille mit
Führungslippe, Spurrille, Stromschiene) in `src/app/shared/schienenprofile.ts`.
**Achtung Datenlage:** Werte von einem dichten Tabellenfoto abgetippt,
Übertragungsfehler nicht auszuschließen; Silhouetten sind Schemazeichnungen
(Kopf-/Fußhöhe geschätzt), Konstruktionsschienen nutzen vereinfachend die
Vignol-Form. **Gwen-Protokoll:** Auftrag über 7 Dateien, nur 2 (Modul,
Routes) tatsächlich angelegt — Build meldete trotzdem Erfolg, weil das
unverlinkte Modul nie kompiliert wurde (gleicher Fehlermodus wie bei
[[../14-Gwen-Code-Aufgaben/02-Kategorie-Menues]]). Claude hat die
restlichen 5 Dateien direkt geschrieben. Details:
[[../14-Gwen-Code-Aufgaben/05-Schienen-erkennen]].

---

## 2026-08-17 — Schienenkopf-Verschleissmesser als Spiel (Claude)

Zweites Spiel neben der Nivellierlatte: `/zusatz/schienenmesser`. Gerät auf
das Profil einstellen (Fühlerlehre + Messlatte), Messfühler zustellen bis
Kontakt, Höhen- und Seitenverschleiß ablesen. Bei falscher Profileinstellung
sind die Messschieber gesperrt — ohne richtigen Bezugspunkt keine gültige
Messung. Querschnitt mit vergrößerter Kopfansicht, damit der Verschleiß
sichtbar wird. **Achtung Datenlage:** nur Nennhöhen und die 14-mm-Messtiefe
sind belegt, die übrigen Profilmaße sind vereinfacht und dienen nur der
Zeichnung; Verschleiß-Grenzwerte fehlen bewusst. Details:
[[../14-Gwen-Code-Aufgaben/04-Schienenkopf-Verschleissmesser]].

---

## 2026-08-17 — Startseite entschlackt, App auf Quiz fokussiert (Claude)

Die Startseite listet keine Einzelthemen mehr, sondern nur noch vier
Bereiche (Wissenstests / Lernfelder / Rechentrainer / Spiele); die Suche
arbeitet dafür jetzt bereichsübergreifend. Lernfelder sind in zwei
Abschnitte geteilt (Gleisbau LF10-14 zuerst, dann Bauberufe LF01-09) und
werden numerisch sortiert. Selbststudium ist vorerst komplett aus der
Navigation raus (Daten bleiben für später erhalten). Details:
[[../14-Gwen-Code-Aufgaben/03-Startseite-nur-Quiz]].

---

## 2026-08-17 — Eigene Menüs für Selbststudium / Quiz / Spiele (Claude + Gwen)

Die drei Sparten sind nicht mehr Sektionen auf dem Dashboard, sondern eigene
Seiten, erreichbar über eine neue Navigationsleiste im Header (Start /
Selbststudium / Quiz / Spiele). Technisch EINE Seite mit Route-Parameter
`/kategorie/:id` statt drei Modulen. Kacheldaten dafür aus
`dashboard.page.ts` nach `src/app/shared/katalog.ts` ausgelagert, die
Spiele-Kachel war vorher nur im HTML hartkodiert und ist jetzt ebenfalls
Daten. Details und Gwen-Protokoll:
[[../14-Gwen-Code-Aufgaben/02-Kategorie-Menues]].

---

## 2026-08-12 — Nivellierlatte-Feinschliff erstmals per Code-Delegation an Gwen (Claude)

Tim wollte künftig mehr Kleinarbeit an Gwen delegieren (Token sparen) —
Claude spezifiziert präzise, Gwen implementiert, Claude prüft per Build +
Playwright-Screenshot und gibt bei Bedarf Nachbesserungsaufträge, statt
selbst zu coden. Erster echter Testlauf dieser Arbeitsweise, siehe
[[../14-Gwen-Code-Aufgaben/01-Nivellierlatte-Feinschliff]] für das volle
Protokoll (6 Läufe, 4 davon inhaltlich beim ersten Versuch korrekt).

Inhaltlich: Latte zeigt jetzt ein Schachbrett-/E-Teilungs-Muster statt
durchgehender Balken, Zielfernrohr-Zoom deutlich enger (Dezimeterzahlen
zwischen den Distanzstrichen jetzt lesbar, vorher zu weit rausgezoomt),
Ablesehöhen liegen jetzt meist im typischen Geräte-Horizont-Bereich
1,2-1,7 m. Neues wiederverwendbares Skript
`tools/cline-cli/run-gwen-code-task.cjs` für künftige Code-Delegationen
(anders als das bestehende `run-gwen-task.cjs`, das fest auf
Vault-Recherche-Markdown zugeschnitten ist).

---

## 2026-07-26 — Fragen-Generierung für die 10 Wissenstests aufgesetzt (Claude)

- Tim will alle Quizze ausgebaut haben ("so viel wie möglich rein").
  Neuer Vault-Ordner `11-Fragen-Generierung/`: pro Wissenstest-Thema eine
  Auftrags-Datei (bestehende Fragen als Duplikat-Sperre + Format-Vorlage);
  Gwen recherchiert per Websuche und liefert 15–25 neue Fragen pro Thema
  mit Quellenbeleg, ein Auftrag pro Session.
- Neues Tooling `tools/fragen-generierung/`: `make-auftraege.cjs`
  (erzeugt Auftrags-Dateien, überschreibt nie) und `einarbeiten.cjs`
  (validiert Gwens Blöcke; mit `--merge` Einarbeitung in
  `src/assets/themenquiz/*.json` + `topics.json`; `questionCount` in
  `dashboard.page.ts` muss danach manuell nachgezogen werden).
- Workflow-Reihenfolge: Generierung hat aktuell Vorrang vor der
  Gesamtquiz-Prüfung (Batches 04–43 pausieren, laufen danach weiter).

## 2026-07-26 — 14 Lernfeld-Quiz-Module in der App (Claude, Tim-Entscheidung)

- Tim will die 427 Gesamtquiz-Fragen **sortiert und pro Modul quizzbar** in
  der App haben (Prüfung durch Gwen läuft parallel weiter).
- Neues Generator-Skript `tools/lernfeld-module/build-lernfeld-quizze.cjs`:
  erzeugt aus `gesamtquiz-alle-module.json` je ein Themenquiz-Modul pro
  Lernfeld (`src/assets/themenquiz/lf01.json` … `lf14.json`, 417 Fragen;
  10 ZUSATZ-Duplikate des Nivellieren-Moduls übersprungen) und ergänzt
  `topics.json`. Titel = offizielle Lernfeld-Liste (Backend-Seed).
  **Wichtig:** Einzige Datenquelle bleibt die Gesamtquiz-JSON — nach
  Korrekturen aus der Gwen-Prüfung das Skript einfach erneut ausführen.
- Dashboard: neue Sektion „Lernfeld-Quizze" (14 Kacheln, Tag = Jahr 1–3,
  mit Fortschrittsanzeige) zwischen „Wissenstests" und „Zusatzmodule"
  (`dashboard.page.ts/.html`). Quiz-Mechanik unverändert — die
  Themenquiz-Route lädt Topics dynamisch.

## 2026-08-10 — Session D neu versucht: messmittel + trassenplan eingearbeitet — Wissenstests-Ausbau ABGESCHLOSSEN (Claude)

Nach dem Verwurf oben (siehe Eintrag darunter) neuer Prompt mit
Pflicht-Selbsttest ("erst eine Testsuche durchführen und Ergebnis zeigen,
bevor irgendetwas geschrieben wird") — hat funktioniert: Gwen postete eine
echte URL (buzer.de, EBO §5) vor Beginn. Ergebnis diesmal grundlegend
anders als im verworfenen Versuch — alle 31 Quellen echte externe URLs
(Hersteller wie Goecke/Vogel&Plötscher, Trackopedia, Plasser & Theurer,
TU Dresden, Springer, gesetze-im-internet.de, gispoint.de), keine
Vault-Selbstzitate mehr.

- **messmittel.md**: 14 von 15 übernommen (1 Doppelung entfernt: Neutrali-
  sationstemperatur und Schweißtemperatur beide 20-26 °C, gleicher Fakt
  zweimal gefragt). Stichproben verifiziert und bestätigt: EBO §5
  Mindestspurweite 1.430 mm (wortgleich mit Gesetzestext), Neutralisations-
  temperatur 20-26 °C, Schienenabnutzungs-Messwinkel 22,5°/45°/67,5°
  (beide wortgleich mit Trackopedia).
- **trassenplan.md**: 16 von 17 übernommen (1 Doppelung entfernt: "Aufriss"
  und "Längsschnitt" wurden beide fast identisch als "vertikaler Schnitt
  entlang der Trasse" definiert; 1 fehlendes "- Frage:"-Label ergänzt).
  DB-Richtlinie 885.1102 für Trassenpläne per Zweitquelle (gispoint.de-
  Artikeltitel) bestätigt — anders als die drei erfundenen Ril-Nummern im
  verworfenen Versuch diesmal eine echte, verifizierbare Richtliniennummer.
- Eingearbeitet: Messmittel 7 → 21, Trassenplan 7 → 23 Fragen.

**Damit sind alle 10 Wissenstests ausgebaut.** Gesamtbild:

| Thema | vorher | nachher |
|---|---|---|
| Grundlagen | 6 | 26 |
| Spurweite | 6 | 20 |
| Schienen | 5 | 19 |
| Schwellen | 5 | 22 |
| Bettung | 10 | 30 |
| Kleineisen | 7 | 25 |
| Handwerkzeuge | 6 | 22 |
| Kleingeräte | 6 | 20 |
| Messmittel | 7 | 21 |
| Trassenplan | 7 | 23 |
| **Summe** | **65** | **228** |

Nächster sinnvoller Schritt: die pausierte Gesamtquiz-Prüfung (Batch 4/43
der 427 Lernfeld-Fragen) wieder aufnehmen.

## 2026-08-10 — Session D (messmittel + trassenplan) VERWORFEN (Claude)

Wichtiger Vorfall: Vor dieser Session hatte Gwens DuckDuckGo-MCP-Verbindung
Aussetzer ("No connection found"). Trotz der Regel "ohne Websuche nichts
schreiben, nur melden und stoppen" hat Gwen 52 Fragen produziert — aber
**keine einzige** mit einer echten Web-Quelle belegt. Alle "Quelle:"-Angaben
verwiesen stattdessen auf vault-interne Dateien:

- `08-Recherche-Gwen/06-Vermessung.md` — laut Vault-Hinweis vom 2026-07-19
  **explizit mit Verdacht auf erfundene Angaben markiert** (DIN EN ISO 80079
  fälschlich für Gleisvermessung, "RABe 520" ist ein Schweizer Triebzug,
  kein Messgerät) — nicht verifiziert, nicht als Quelle geeignet.
- `08-Recherche-Gwen/01-Trassenplan.md` — Status `unvollständig (von Gwen)`,
  nie von Claude geprüft.
- Mehrfach zirkulär: "Quelle: Auftrag-messmittel.md (existierende Frage 6)"
  — die Auftragsdatei zitiert sich selbst als Beleg für eine neue Frage.
- `05-Messmittel.md` (einzige der zitierten Dateien mit Status "verifiziert")
  wurde ebenfalls verwendet, aber das ändert nichts am Grundproblem: kein
  Websuche-Nachweis in dieser Session, wie die Regel es verlangt.

In den neuen Fragen tauchten dadurch mehrere unverifizierte, spezifische
DB-Richtlinien-/Normnummern auf (Ril 913.02, Ril 931.12-0, Ril 451.0101,
Ril 615, EN 14562-1, DIN EN ISO 10012-1 u. a.) — keine davon in dieser
Session tatsächlich gegengeprüft.

**Entscheidung: beide Dateien komplett zurückgesetzt** (Frontmatter
`status: offen`, "Neue Fragen von Gwen"-Abschnitt geleert) — nichts
gemergt, kein Fragen-Zähler in `dashboard.page.ts` verändert. Sauberer
Neustart ist wichtiger als 52 Fragen mit unklarer Faktenbasis in
dauerhaftem Lernmaterial.

**Lehre für künftige Sessions:** Die "ohne Websuche stoppen"-Regel reicht
nicht — Gwen hat sie umgangen statt befolgt. Nächster Anlauf braucht einen
expliziten Selbsttest am Anfang ("führe eine Test-Suche durch und melde das
Ergebnis, BEVOR du mit Fragen anfängst") statt nur ein Verbot.

## 2026-08-10 — Wissenstests-Ausbau: handwerkzeuge + kleingeraete eingearbeitet (Claude)

- Session C von Gwen: 16 gültige Fragen zu "Handwerkzeuge im Gleisbau"
  (Quellen: ballschmidt-hebezeuge.de, wimmer-buersten.de, Trackopedia —
  DIN 7355 und Tragfähigkeitsstufen 1,5/3/5/10 t sowie Weichenbesen-
  Material per Websuche gegengeprüft, beides bestätigt) und 14 zu
  "Kleingeräte und Maschinen" (voestalpine, Trackopedia, DGUV, DIN Media).
- Reparaturen vor dem Merge: In `handwerkzeuge.md` fehlte bei einer Frage
  das "- Frage:"-Label (ergänzt), eine Frage brach mitten im Wort ab
  (klassischer Kontextabbruch — irreparabel, gelöscht statt geraten).
- **Wichtigerer Fund in `kleingeraete.md`**: 3 Fragen zu DB-Richtlinien-
  nummern (DBRil 824/826.1020 für "Bohrungen"/"Schienenschleifen")
  widersprachen sich gegenseitig und ließen sich in der offiziellen
  DB/VDV-Regelwerksliste nicht bestätigen (Ril 824 = "Oberbauarbeiten
  durchführen", nicht Schienenschleifen) → alle 3 entfernt statt geraten.
  Zusätzlich hatte eine Frage die falsche Norm als richtig markiert
  (DIN EN 13977 statt korrekt DIN EN 14033 für "schienengebundene Bau-
  und Instandhaltungsmaschinen" — beide Normen real, aber unterschiedlicher
  Geltungsbereich) → Korrektur, nicht nur Entfernung, da die richtige
  Antwort unter den Auswahloptionen bereits vorhanden war.
- Eingearbeitet: Handwerkzeuge 6 → 22, Kleingeräte 6 → 20 Fragen.

## 2026-08-10 — Bildkandidaten recherchiert (noch nicht eingebaut) (Claude)

- Tim-Wunsch: passende, rechtlich nutzbare Bilder finden (beruflich/
  Ausbildung, nicht gewinnbringend). App hat aktuell 0 Fotos (nur
  Icon-Umrisse). Für alle 10 Wissenstests + Dashboard-Header +
  Materialrechner je ein Wikimedia-Commons-Foto gefunden, durchweg
  CC BY-SA oder Public Domain — keine NC-Lizenz nötig.
- Lizenzen über die strukturierte Commons-API geprüft, 2 davon von Claude
  unabhängig gegengecheckt (exakt bestätigt). Details, Links, Namens-
  nennungen: [[12-Bildmaterial/00-Bildkandidaten]].
- **Noch nicht umgesetzt**: Bilder sind nur recherchiert, nicht
  heruntergeladen oder in die App eingebaut.

## 2026-08-10 — Wissenstests-Ausbau: bettung + kleineisen eingearbeitet (Claude)

- Session B von Gwen fertig: 20 neue Fragen zu "Bettung und Schotter"
  (Quellen: Trackopedia, Plasser & Theurer, DBS 918 061, DIN EN 13450 —
  mehrere Zahlenwerte von Claude stichprobenartig direkt an den Quellen
  verifiziert, alle korrekt) und 20 zu "Schienenbefestigung und
  Kleineisen" (Quellen: Trackopedia, voestalpine, ETI Industries —
  ebenfalls verifiziert, u. a. Hakenschrauben-Maße, Drehmoment, SKL-
  Federkraft 12 kN exakt bestätigt).
- 2 kleinere Defekte in bettung.md behoben (Englisches "Explanation:"
  statt "Erklärung:", fehlende Quellenangabe bei Frage 20 — Quelle war
  eindeutig aus dem Kontext ableitbar und verifiziert).
- 2 inhaltliche Doppelungen in kleineisen.md entfernt (Spannklemmen-
  Material zweimal gefragt, Federring-Wölbung zweimal gefragt) → 18 statt
  20 Fragen übernommen.
- Eingearbeitet: Bettung 10 → 30 Fragen, Kleineisen 7 → 25 Fragen.

## 2026-08-10 — Neues Zusatzmodul "Materialrechner" (zufällig generierte Aufgaben) (Claude)

- Tim-Wunsch: App auf die Zielgerade bringen, Unterrichtsmaterial. Statt
  weiterer fester Fragenlisten ein Modul mit **unbegrenzt generierten**
  Rechenaufgaben — Volumen, Materialgewicht (Schüttdichte-Tabelle,
  recherchiert), Schotterbedarf für Gleisabschnitte, in 3
  Schwierigkeitsgraden. Neue Route `/zusatz/materialrechner`, neue
  Dashboard-Kachel. Details: [[03-Module/Zusatz-Materialrechner]].
- Vor dem Merge mit einem Stresstest (3600 generierte Fragen, node/tsx)
  zwei echte Logikfehler in der Distraktor-Erzeugung gefunden und behoben
  (kollabierende Antwortoptionen bei kleinen Ganzzahl-Ergebnissen wie
  "1 Fahrt", hängender Fallback-Loop) — siehe Modul-Notiz für Details.
- Schüttdichte-Werte (Gleisschotter, Kies, Sand, Beton, Mutterboden, …)
  per Websuche recherchiert und mit Quellen im Code hinterlegt
  (`data/schuettdichten.ts`), nicht aus Trainingswissen übernommen.

## 2026-08-10 — Gesamtquiz-Prüfung (Batch 04-43) pausiert zugunsten Fragen-Ausbau (Claude)

Tim priorisiert den Ausbau der 10 Wissenstests höher als die laufende
Fehlerprüfung des Gesamtquiz. Batches 04-43 bleiben `offen`, bis die
Fragen-Generierung (siehe unten) durchläuft.

## 2026-07-26 bis 2026-08-10 — Ausbau der 10 Wissenstests durch Gwen (Claude)

Fortsetzung von [[11-Fragen-Generierung/00-Anweisung-für-Gwen]]: Gwen
recherchiert per Websuche neue Fragen pro Thema, Claude prüft Stichproben
(Quellen-URLs abrufen, Fachlogik gegenlesen) und arbeitet sie per
`tools/fragen-generierung/einarbeiten.cjs --merge` ein. Bisher 4 von 10
Themen fertig:

| Thema | vorher | nachher |
|---|---|---|
| Grundlagen | 6 | 26 |
| Spurweite | 6 | 20 |
| Schienen | 5 | 19 |
| Schwellen | 5 | 22 |

Typische Korrekturen beim Gegenlesen: erfundene/falsche Zahlenwerte,
vertauschte Vorzeichen bei Fachaussagen (Zug-/Druckspannung bei
Neutraltemperatur), Doppelungen (mehrere Fragen zum selben Fakt). Noch
offen: bettung, kleineisen, handwerkzeuge, kleingeraete, messmittel,
trassenplan.

## 2026-07-26 — Gwen-Modellwechsel: qwen3.5-9b mit 64k Kontext (Claude)

- Auf Tims Wunsch neues Modell installiert: `qwen/qwen3.5-9b` (6,55 GB,
  per `lms get`), geladen mit **65.536 Token Kontext**, LM-Studio-Server
  auf Port 1234 gestartet, Testprompt fachlich korrekt beantwortet.
- Hintergrund: Das bisherige `qwen3.6-27b` (15,44 GB) passte nicht komplett
  in die 12 GB VRAM der RTX 4070 — deshalb war der Kontext auf ~17k
  begrenzt (Ursache der bisherigen Abbruch-Probleme). Das 9B-Modell lässt
  ~5,5 GB VRAM für den Kontext-Cache frei.
- Das alte `qwen3.6-27b` bleibt vorerst installiert (Löschung erst nach
  Bewährung des neuen Modells). Die Ein-Batch-pro-Session-Regel der
  Gesamtquiz-Prüfung bleibt vorerst bestehen, kann aber nach ein paar
  sauberen Batches auf 2–3 erhöht werden. Hinweis: qwen3.5-9b ist ein
  "Thinking"-Modell (gibt Denkprozess mit aus).
- Noch offen: In den Cline-Einstellungen muss das Modell auf
  `qwen/qwen3.5-9b` umgestellt werden (macht Tim).

## 2026-07-26 — Websuche für Gwen eingerichtet, Auswerte-Tooling, UI-Textfix (Claude)

- **Websuche-MCP für Gwen (Cline)**: Gwen läuft über die VS-Code-Extension
  Cline und hatte keinen Websuche-Zugriff (erster Batch-Anlauf korrekt
  abgebrochen). Eingerichtet: `uv` (via pip) + DuckDuckGo-MCP-Server
  (`uvx duckduckgo-mcp-server`, kein API-Key) in Clines
  `cline_mcp_settings.json`; Serverstart getestet. Chat-Prompt vorher um
  zwei Schutzregeln ergänzt (ohne Websuche nichts ausfüllen; bei nicht
  ersetztem `XX` erst nach Batch-Nummer fragen).
- **Neues Tooling** in `tools/gesamtquiz-pruefung/`: `make-batches.cjs`
  (Erst-Export, überschreibt!) und `auswerten.cjs` (zählt Urteile, listet
  FALSCH/UNSICHER, Integritäts-Check gegen die App-JSON, schreibt
  `10-Gesamtquiz-Pruefung/Auswertung.md`). Testlauf: 0/427 geprüft,
  keine Strukturschäden.
- **UI-Textfix**: `src/app/modules/zusatz/gesamtquiz/pages/gesamtquiz.page.html`
  — "aus Lernfeld 1 bis 14" ersetzt durch "aus saemtlichen Themenbereichen";
  damit kein sichtbarer "Lernfeld"-Text mehr im aktiven Frontend
  (Offener Punkt abgehakt).

## 2026-07-23 — Gesamtquiz-Prüfung durch Gwen aufgesetzt (Claude)

- Neuer Vault-Ordner `10-Gesamtquiz-Pruefung/`: alle 427 Fragen aus
  `src/assets/zusatz/gesamtquiz/gesamtquiz-alle-module.json` per Skript als
  43 Batch-Dateien à 10 Fragen exportiert (mit `___`-Platzhaltern für Urteil/
  Begründung/Quelle), dazu `00-Anweisung-für-Gwen.md`, `Chat-Prompt.md`
  (in sich vollständiger Session-Prompt) und `Fortschritt.md`.
- Hintergrund: Tim-Entscheidung vom 2026-07-23 — die nie systematisch
  geprüften Gesamtquiz-Fragen sollen von Gwen (inzwischen mit Websuche)
  einzeln verifiziert und mit Quellen belegt werden. Ein Batch pro
  Chat-Session wegen des ~17k-Token-Kontextlimits. Claude wertet die
  Urteile danach per Skript aus, prüft `FALSCH`/`UNSICHER`-Fälle selbst
  nach und korrigiert bestätigte Fehler in der App-JSON.
- An den App-Daten selbst wurde nichts geändert (reiner Export in den Vault).

## 2026-07-18 17:08 — Großer Vereinfachungs-Umbau (Commit `b461679`, "Update")

Größte strukturelle Änderung des Projekts bisher. In einem Commit:

- **Entfernt aus `src/app`**: `admin/`, `login/`, `profile/`, `home/`,
  `field-detail/`, `field-quiz/`, `services/` (api/auth/gamification/
  learning-data), sowie `src/assets/lernfelder/lernfeld-01/`…`lernfeld-14/`.
- **Hinzugefügt**: `LERNFELDER-BACKUP.txt` (939 KB Vollsicherung aller
  Lernfeld-Inhalte, siehe [[04-Lernfelder/Lernfelder-Übersicht]]), diverse
  Tooling-Configs (`.browserslistrc`, `.editorconfig`, `.eslintrc.json`,
  `karma.conf.js`, `capacitor.config.ts`, `ionic.config.json`).
- **Dashboard** (`dashboard.page.ts/.html/.scss`) stark überarbeitet (407 Zeilen
  geändert) — jetzt einzige Landingpage mit Kacheln für Themenquiz + Zusatzmodule.
- Ergebnis: App läuft nur noch mit statischen JSON-Inhalten + `localStorage`,
  kein Backend-Aufruf mehr im Frontend. Backend selbst bleibt im Repo bestehen,
  ist aber verwaist. Siehe [[02-Architektur/Backend-Architektur]] und
  [[07-Offene-Punkte/Offene-Punkte]] für die offene Frage, ob/wie es
  reaktiviert wird.
- **Warum** (Vermutung anhand der Commit-Historie, nicht explizit dokumentiert):
  Vereinfachung — weg von Accounts/Server-Sync, hin zu einer leichtgewichtigen,
  offline-fähigen Lern-App ohne Login-Hürde.

## 2026-07-18 02:17 — "Update" (Commit `b5f531b`)

Vorbereitender Commit vor dem großen Umbau (Details nicht einzeln analysiert).

## 2026-07-16 — "re update" (Commits `89d7a4d`, `c357909`)

## 2026-03-07 — "update" (Commit `56dbb4b`)

## 2026-02-25 — "New learn field designe. Process line" (Commit `1bb1a56`)

Neues Design für die Lernfeld-Seiten inkl. Fortschrittsanzeige ("Process line").

## 2026-02-17 — Datensicherheit & Volumenrechner

- `855266e` "x"
- `8df3b1e` **"Volume calc"** — Einführung des Volumen-Rechentrainers
  (→ [[03-Module/Zusatz-Volumen]])
- `84fc2c2` "Update datasecure information"
- `0eaf9d5` "Update data secure"

## 2026-02-13 — Lernfeld-Infos aktualisiert (`d10f0de`, `24baf10`)

## 2026-02-12 04:08 — "update show admin panel again" (Commit `f97d5d4`)

Admin-Panel war zu diesem Zeitpunkt aktiv im Frontend eingebunden (später am
18.07.2026 wieder entfernt).

## 2026-02-07 bis 2026-02-10 — Lernfelder 1–14 befüllt

Mehrere Commits, die die Lernfeld-Inhalte Stück für Stück ergänzt haben:
`b4795a1` "update lf", `2aefc17` "lf2 - lf6 update", `85841df` "New data lf1",
`0d0d5ab` "Search tool new optic", `6b6da08` "lf 14", `4a0368d` "LF 9 - 13",
`50294ae` "LF 5 - 8", `bf419dd` "LF3 LF4", `9a06d01` "New lernfeld".

## 2026-02-01/02 — Design- und Responsive-Updates

`946fcf1` "update robotic font better optic", `644ff81` "update responsiv",
`e5b6fd2` "New infos and elements".

## 2026-01-25/26 — Login-System, Nutzerverwaltung, Design-Relaunch

Umfangreiche Phase mit vielen Commits: `b5645b5` "Login via enter button",
`6d5cd0c` "Update Quiz", `6a07961` "Update data", `0c509fa` "Update Learnfield",
`726b49a` "Update for deleting and managing user", `f6b393c`/`12dd461`/`5bbcbb3`
"new login methode/method", `8d63ffc` "update website and data", `28ca1da`
"update clear website", `8484edc` "Remove items", `1d1b6ba` "New design",
`697a7db` "new designe", `1cef050` "Revome demo login".

→ In dieser Phase wurde das Login-/Nutzerverwaltungssystem aufgebaut, das am
18.07.2026 wieder entfernt wurde.

## 2026-01-24 20:05 — "Update for real data using (backend)" (Commit `cd40e81`)

## 2026-01-24 02:09 — "init backend" (Commit `d9d0fa5`)

Initiale Einführung des Express/Postgres-Backends
(→ [[02-Architektur/Backend-Architektur]]).

## 2026-01-20 — "Added new learning fields" (Commit `064de91`)

## 2026-01-19 — Admin-Panel eingeführt

`0714b5c` "fixes", `3eeb120` **"Admin panel"** — erste Einführung des
Admin-Panels, `9e8ebed` "First push with alot of shiiii".

## 2026-01-13 20:09 — "First Push" (Commit `7e6b649`)

Projektstart.

---

## Hinweis zur Nutzung dieses Logs

Dieses Log ist bewusst grob (auf Commit-Ebene), nicht auf Datei-Ebene. Für
Details zu einem einzelnen Commit: `git show --stat <hash>` bzw. `git show <hash>`
im Projektverzeichnis.

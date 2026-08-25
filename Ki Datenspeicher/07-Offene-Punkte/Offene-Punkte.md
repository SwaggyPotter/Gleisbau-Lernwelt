---
tags: [todo, offene-punkte, entscheidungen]
autor: Claude
---

# Offene Punkte / TODOs

Dinge, die aus der Code-/Git-Analyse als offen, inkonsistent oder
entscheidungsbedürftig auffallen. Kein vollständiger Projektplan — nur
Beobachtungen, die für die Weiterarbeit relevant sein könnten. Bitte ergänzen/
abhaken, sobald geklärt.

## Architektur-Entscheidungen

- [x] **Backend reaktivieren oder entfernen? — reaktiviert (2026-08-25).**
  Tim wollte einen passwortgeschützten, von überall erreichbaren Zugang zur
  App und "alles, was bisher nur für die Probe war, fertig gemacht" haben.
  Das Express/Postgres-Backend läuft jetzt produktiv auf Tims eigenem
  Heimserver (`michiserver`, Docker Compose), der hartcodierte Admin-Zugang
  wurde vorher durch Pflicht-Umgebungsvariablen ersetzt. **Weiterhin NICHT**
  vom Frontend aus genutzt — die App liest Inhalte weiterhin rein statisch
  aus JSON, das war nicht Teil dieser Runde. Details:
  [[02-Architektur/Backend-Architektur]].
- [ ] **DNS + Portweiterleitung/Tunnel für gleisbau-digital.org noch
  offen.** Server + Docker-Stack + Passwort-Gate sind fertig und
  verifiziert (2026-08-25), aber `app.`/`api.gleisbau-digital.org` lösen
  öffentlich noch nicht auf. Tim muss entweder (a) einen A-Record bei
  Cloudflare auf die öffentliche IP (95.89.229.237, Stand 2026-08-25,
  kann sich ändern) anlegen UND Port 80/443 am Router auf 192.168.0.102
  weiterleiten, oder (b) einen Cloudflare Tunnel einrichten (vermeidet
  Router-Änderungen, Claude hat dafür seit dieser Runde die passenden
  Cloudflare-Skills verfügbar, bräuchte aber ein API-Token oder Tims
  eigene `cloudflared tunnel login`-Aktion). Siehe [[../../deploy/README]]
  Schritt 2/2b.
- [ ] **Frontend nicht containerisiert.** Wird lokal gebaut (`ng build`)
  und die `www/`-Ausgabe manuell/per Skript auf den Server kopiert, nicht
  in einem eigenen Docker-Image. Funktioniert, ist aber kein
  automatisierter CI-Pfad — bei Bedarf später ein eigenes Frontend-
  Dockerfile (multi-stage, Caddy/nginx als Runtime-Stage) nachziehen.
- [ ] **Serverseitige-KI-Idee (2026-08-25, von Tim angestoßen, noch
  unklar):** Tim hat überlegt, ob eine KI auf `michiserver` laufen könnte,
  die den Server überwacht und später Meldungen aus der "Frage melden"-
  Funktion der App verarbeitet (aktuell landen diese Meldungen nur im
  Browser-localStorage, siehe `question-report.service.ts`). Explizit als
  "ggf." formuliert, keine konkrete Anforderung — braucht erst eine Klärung,
  was genau überwacht/verarbeitet werden soll, bevor daran gebaut wird.
  Ein lokales LLM wie das Gwen-Setup auf Tims Windows-PC ist auf dem
  Heimserver mangels GPU vermutlich nicht sinnvoll machbar.
- [ ] **Was passiert mit den 14 Lernfeld-Inhalten?** Aktuell nur als Rohtext in
  `LERNFELDER-BACKUP.txt` archiviert. Wenn sie zurückkommen sollen, müsste
  entschieden werden, in welchem Format (eigene Module wie bei "Zusatz", oder
  wieder eine generische Lernfeld-1-14-Struktur mit Backend-Anbindung).
  Siehe [[04-Lernfelder/Lernfelder-Übersicht]].
- [ ] **Drei parallele Datenmodelle** für dieselben 14 Lernfelder existieren
  (Backup-Text, Backend-DB-Schema, ehemaliges Frontend-JSON-Format) — sollten
  konsolidiert werden, falls die Inhalte reaktiviert werden.

## Sicherheit

- [ ] **Hardcodierter Admin-Account** `admin`/`1234` in `backend/src/index.ts`
  (Bootstrap-Seed, Zeilen 9–10: `ADMIN_EMAIL`/`ADMIN_PASSWORD` als Konstanten,
  nicht über ENV konfigurierbar; wird bei jedem Serverstart per
  `ON CONFLICT ... DO UPDATE` neu gesetzt). Unkritisch solange das Backend
  nicht live/erreichbar ist, aber vor jeder Reaktivierung unbedingt ändern/
  entfernen. Details siehe [[06-Fragen-und-Antworten/Fragenkatalog]] und
  [[02-Architektur/Backend-Architektur]].

## Code-Aufräumarbeiten (kleinere Inkonsistenzen)

- [ ] Modul `zusatz/nivellieren` trägt intern noch alte Dateinamen `lernfeld-02`/
  `lf02-*` — funktional kein Problem, aber verwirrend für neue Entwickler.
  Siehe [[03-Module/Zusatz-Nivellieren]].
- [x] `gesamtquiz.page.html` ist die letzte verbliebene Stelle im aktiven
  Frontend-Code, die das Wort "Lernfeld" noch in sichtbarem UI-Text zeigt
  (Zeile 20: "...alle verfuegbaren Fragen aus Lernfeld 1 bis 14...").
  **Erledigt (Claude, 2026-07-26):** Text geändert zu "...aus saemtlichen
  Themenbereichen und den Zusatzmodulen." — im sichtbaren UI existiert
  damit kein "Lernfeld"-Text mehr. **Ergänzung
  (Claude, Code-Check 2026-07-22):** Zusätzlich enthält die aktiv geladene
  Datenquelle `src/assets/zusatz/gesamtquiz/gesamtquiz-alle-module.json` 16-mal
  "Lernfeld N" als `meta.sources[].title` — wird aber nicht direkt angezeigt,
  die UI zeigt dort nur die Anzahl (`sources.length` als Chip "X Quellen", vgl.
  `gesamtquiz-data.service.ts` und `gesamtquiz.page.html` Zeile 24). Also kein
  sichtbarer Text, aber vorhanden im aktiven Datenbestand — bei einer
  eventuellen Lernfeld-Umbenennung/-Entfernung mit bedenken.

## Recherche-Workflow (Gwen ↔ Claude)

- [ ] **Sollte Gwens Rolle im Recherche-Workflow neu definiert werden?**
  Auszählung des Frontmatter-Felds `status:` in den 15 Themen-Dateien unter
  `08-Recherche-Gwen/` (Stand 2026-07-22): 1× `von Claude recherchiert
  (verifiziert)` (Datei 02, komplett per echter Websuche durch Claude
  geprüft), 6× `von Gwen recherchiert`, 8× `unvollständig (von Gwen)`. In
  mehreren als "fertig" markierten Gwen-Dateien hat die anschließende
  Claude-Verifikation per Websuche mehrfach erfundene oder falsch zugeordnete
  Normen/Regelwerke aufgedeckt (z. B. "RBT 9000", "DIN EN 14629" statt korrekt
  "DIN EN 14730", "CTR-Stahl"/"MTR-Stahl" — siehe die "Bereits als erfunden
  identifiziert"-Hinweise im Projektauftrag sowie die Hinweis-Absätze in den
  einzelnen Recherche-Dateien). `Kickoff-Prompt.md` ist deshalb inzwischen bei
  Version 4 und wächst bei praktisch jeder Runde um weitere Korrekturregeln
  (gelöschte Fragenkataloge, überschriebenes Frontmatter, abgebrochene
  Antworten, erfundene Normen). Da eine KI mit echtem Websuche-Zugriff (Claude)
  im Projekt inzwischen ohnehin jede Norm-Angabe nachprüfen muss, bevor sie in
  die App übernommen wird: Lohnt es sich noch, neue/unbearbeitete Themen (die
  8 `unvollständig`-Dateien) zuerst von Gwen entwerfen zu lassen und danach zu
  korrigieren — oder ist es effizienter, wenn Claude solche Themen direkt
  selbst recherchiert und Gwen nur noch für klar abgegrenzte
  Zulieferaufgaben ohne Norm-Bezug eingesetzt wird? Reine Beobachtung aus dem
  Vault-Zustand, keine Entscheidung aus dem Code ableitbar — echte Tim-Frage.
  Siehe [[08-Recherche-Gwen/Kickoff-Prompt]].

## Spiele-Feature (aus Tims Gesamtziel-Vision, 2026-08-11 — inzwischen gebaut)

- [x] **Drei interaktive Spiele umgesetzt** (nicht die urspruenglich
  skizzierten Memory-/Zeitrennen-Modi, sondern gerätespezifische Simulationen
  auf Tims konkrete Wuensche hin): Nivellierlatte ablesen (2026-08-11/12),
  Schienenkopf-Verschleissmesser (2026-08-17, komplett ersetzt durch eine
  1:1-Referenz-Simulation am 2026-08-19), Schienen erkennen (2026-08-17, 3
  Modi). Details siehe [[00-Start-Hier]] "Kurzfassung" und
  `14-Gwen-Code-Aufgaben/01`–`05`. Das urspruengliche Memory-/Zeitrennen-
  Konzept unten ist NICHT umgesetzt und weiterhin nur eine Idee, falls Tim
  spaeter noch ein viertes, quizbasiertes Spiel moechte.

  **Nicht umgesetzte Ideensammlung (weiterhin offen):**
  - **Memory/Zuordnungsspiel**: Begriff ↔ Definition oder Bild ↔ Begriff,
    gespeist aus den bestehenden `explanation`-Feldern der Themenquiz-Fragen.
  - **Zeitrennen-Modus**: bestehende Fragen aus einem Thema/Gesamtquiz unter
    Zeitdruck beantworten (Timer + Highscore im `GesamtquizEngineComponent`).
  - Noch zu klären mit Tim: Highscore lokal (localStorage) oder erst nach
    Backend-Anbindung sinnvoll?

- [ ] **Datenlage der neuen Spiele gegenpruefen.** Sowohl bei "Schienen
  erkennen" (~50 Profile aus einem Tabellenfoto abgetippt,
  `src/app/shared/schienenprofile.ts`) als auch beim Schienenkopf-
  Verschleissmesser (Profilmasse ausser Hoehe vereinfacht,
  `schienenmesser.page.ts`) ist im Code/UI markiert, was belegt und was nur
  fuer die Zeichnung geschaetzt ist — sollte bei Gelegenheit gegen echte
  Quellen (Normtabellen, EN 13674) geprueft werden, bevor die Werte als
  gepruefter Lehrinhalt gelten.
- [x] **Selbststudium-Wiedereinbindung — erledigt sich anders als gedacht
  (2026-08-23).** Tim wollte die Selbstlern-Texte NICHT zurueck, sondern
  komplett entfernt haben (er vermittelt die Inhalte selbst, die App soll
  nur noch Quiz sein). `SELBSTSTUDIUM_TILES` und die zugehoerigen
  Leitfaden-Inhalte (content.json, Lesson-Renderer, Block-Navigation) bei
  Nivellieren/Volumen/Prozentrechnung sind jetzt geloescht, nicht nur
  unverlinkt. Siehe [[../05-Update-Log/Update-Log]] (2026-08-23) und
  [[../14-Gwen-Code-Aufgaben/14-Rechentrainer-Umbau]].

## Quiz-Duell-Feature (2026-08-20 Grundgerüst, 2026-08-22 zweimal umgebaut)

- [x] **Duell-Mechanik final geklärt und nach Tims eigenem Referenz-
  Prototyp umgesetzt (2026-08-22).** Erst am echten "Quizduell" (MAG
  Interactive) orientiert (6 Runden à 3 Fragen, Kategoriewahl aus 3
  Optionen, 20s/Frage), dann per selbst gebautem HTML-Prototyp verfeinert:
  **Gegner ist immer ein simulierter Bot** (kein Pass-and-Play mehr),
  eigenes "Steel/Signal"-Design nur fuer dieses Feature. Siehe
  [[../05-Update-Log/Update-Log]] (Einträge 2026-08-22) und
  [[../14-Gwen-Code-Aufgaben/13-Quizduell-Referenz-Umbau]].
- [ ] **Echte Mitspieler (Mensch statt Bot) über Geräte/Tage hinweg** sind
  weiter NICHT möglich (kein Backend). Der Bot-Gegner loest das
  UX-Problem elegant, ersetzt aber kein echtes Matchmaking. Das
  `QuizduellMatch`-Datenmodell ist noch so geformt, wie ein späterer
  Server es bräuchte (Runden/Kategoriewahl) — pruefen, ob es bei
  Backend-Anbindung direkt uebernommen werden kann.
- [ ] **Bot-Trefferquote (65 %, fest)** ist eine grobe Vereinfachung ohne
  echte Schwierigkeitsgrade — bei Bedarf spaeter verfeinern (z. B.
  unterschiedlich starke Bots, adaptive Schwierigkeit).
- [ ] **Rating-Algorithmus ist eine Vereinfachung** (klassisches Elo,
  K=32, Start 1000) — der echte Quizduell-Algorithmus (1–24 Punkte
  Sieger, 0–9 Abzug Verlierer, nach Wikipedia-Angabe "je nach relativer
  Rangliste-Position") ist nicht öffentlich dokumentiert und wurde bewusst
  nicht nachgebaut. Bei Bedarf später verfeinern.
- [ ] **Admin-Key-Registrierung** ist nur als Datenmodell-Platzhalter
  vorbereitet (`registeredVia`/`keyUsed`-Felder, `RegistrationKey`-Interface
  ungenutzt), keine funktionale Admin-Oberfläche. Tim möchte darüber später
  sehen können, wer welche Fortschritte/Defizite hat — hängt an der
  Backend-Anbindung (siehe "Backend reaktivieren oder entfernen?" oben) und
  ist bewusst zurückgestellt.
- [ ] **Login ist rein lokal/geräteweise** (localStorage, kein Server) —
  kein Konto-Sync zwischen Browsern/Geräten, bis das Backend angebunden
  wird. Sollte bei Gelegenheit klar kommuniziert werden (z. B. in der App
  selbst), damit Nutzer nicht überrascht sind, wenn ihr Konto auf einem
  anderen Gerät nicht existiert.

## Bild-Feedback von Tim (2026-08-11, teils umgesetzt)

Nach Live-Ansicht der App kam konkretes Feedback zu den Themenquiz-Bildern
(siehe [[../../cline_cli_setup]]-Nachfolge-Notiz für Details). Umgesetzt:
Spurweite (jetzt Gauge-Vergleichsfoto statt Kurve), Trassenplan (jetzt
echtes Gleisplan-SVG statt Luftbild), Bildgroesse auf Kacheln kompakter.

- [ ] **Messmittel und Vermessung**: aktuelles Foto (Gleismesswagen) wirkt
  wie "einfach ein Zug" — Tim moechte etwas, das eindeutig als Messgeraet
  erkennbar ist. Mehrfache Commons-Recherche (Spurweitenmessgeraet,
  Nivelliergeraet, Messschieber) brachte keinen besseren Treffer mit freier
  Lizenz. Noch offen.
- [ ] **Schwellen**: Tim haette gerne mehrere verschiedene Schwellentypen
  (Holz/Beton/Stahl) im Bild statt nur Betonschwellen wie aktuell. Noch
  offen — evtl. als Recherche-Auftrag an Gwen (Bildkandidaten fuer die
  restlichen Themen sind ohnehin schon Teil des erweiterten Auftrags in
  `08-Recherche-Gwen/02-Erweiterter-Auftrag-2026-08-11.md`).
- [x] **Bilder fuer die 14 Lernfelder (LF01-14) — erledigt (2026-08-24).**
  Alle 14 haben jetzt ein Bild: 12 per Commons-Foto (von Claude direkt
  per WebSearch/WebFetch recherchiert, jedes einzeln ueber die echte
  Commons-Dateiseite verifiziert), 2 (LF11 Gleisboegen, LF14
  Sonderbauformen) als eigene SVG, da zu abstrakt/rechnerisch bzw. zu
  unspezifisch fuer ein passendes Foto. Der urspruengliche Gwen-Dispatch
  dafuer war gescheitert (Gwens Fetch-Tool bekommt bei Commons-Seiten
  durchgehend HTTP 403, siehe siebter Fallstrick in [[../00-Start-Hier]]).
  Details: [[../14-Gwen-Code-Aufgaben/14-Rechentrainer-Umbau]].
- [x] **Bilder fuer die 4 Spiele-Kacheln — erledigt (2026-08-24).** Waren
  bisher komplett ohne Bild (uebersehen bei der urspruenglichen
  Bild-Recherche). Nivellierlatte ablesen und Schienen erkennen haben
  jetzt ein Commons-Foto, Schienenkopf-Verschleissmesser und Quiz-Duell
  eine eigene SVG (kein brauchbares Foto fuer das Nischenmessgeraet bzw.
  fuer das abstrakte App-Feature auffindbar). Damit haben jetzt **alle
  33 Katalog-Kacheln der App** (10 Wissenstests + 14 Lernfelder + 5
  Rechentrainer + 4 Spiele) ein Bild.
- [ ] **Verwaister `dashboard-header`-Eintrag in `bildnachweise.json`**
  (Cogload-Junction-Foto) wird von keinem Code mehr referenziert — Relikt
  aus der Zeit vor dem Dashboard-Redesign 2026-08-17, das die
  Einzelthemen-Liste von der Startseite entfernt hat. Aufgefallen bei der
  Bild-Vervollstaendigung 2026-08-24, nicht angefasst (ausserhalb des
  damaligen Auftrags). Bei Gelegenheit entweder loeschen oder wieder
  irgendwo einbinden.

## Themenquiz-Quellenprüfung (2026-08-24/25, 100 % fertig)

- [x] **Alle 645 Themenquiz-/Lernfeld-Fragen haben eine Quelle mit Link
  (100 %).** Tims Wunsch, per Gwen (headless) umgesetzt und von Claude
  per Vollprüfung aller URLs verifiziert (nicht nur Stichprobe). Dabei
  ein neues Gwen-Fehlerbild gefunden: erfundene, plausibel klingende
  Domains statt "keine gefunden" (45 Fälle entfernt und neu belegt) —
  Details, alle gefundenen Bugs und die Format-Historie:
  [[../14-Gwen-Code-Aufgaben/15-Themenquiz-Quellenpruefung]].
- [x] **Neue Seite `/quellenverzeichnis`** zeigt alle Fragen, Antworten
  und Quellen an einem Ort, mit Volltextsuche — siehe
  [[../14-Gwen-Code-Aufgaben/16-Quellenverzeichnis-Seite]].
- [x] **Rechte-Recherche zu den 645 externen Quellen-Links — erledigt
  (2026-08-25).** Alle 258 Domains kategorisiert und rechtlich eingeordnet,
  35 Fragen mit echtem Wortlaut-Zitat im `source`-Feld auf eigenständige
  Kurzformulierungen umgeschrieben, alle 25 Wikimedia-Commons-Bildlizenzen
  neu verifiziert (1 Korrektur: Fotograf/Behörde bei `handwerkzeuge`
  präzisiert). Neue Seite `/rechte`. Details:
  [[../14-Gwen-Code-Aufgaben/18-Rechte-an-Quellen-und-Bildern]].
- [ ] **Datenqualität: einige `source`-Felder enden mitten im Wort/Satz mit
  "…".** Nebenfund der Rechte-Recherche (2026-08-25), NICHT Teil des
  damaligen Auftrags (Scope war explizit auf Rechtsrisiko begrenzt) und
  deshalb bewusst nicht mit-repariert. Vermutlich stammt es aus der
  90-Zeichen-Kürzung in `apply-results.cjs` (Runde 15), die gelegentlich
  mitten im Wortlaut statt an einer Wortgrenze abschneidet. Betrifft u. a.
  `t2q2`/`t2q5` (spurweite.json), `spurweite-g7`/`spurweite-g8`,
  `LF10-Q24` (Text bricht sichtbar ab). Kein Rechtsrisiko (reine
  Kürzungs-/Lesbarkeitsfrage), aber bei Gelegenheit hübsch nachziehen.
- [ ] **FALSCH/UNSICHER-Funde aus der Quellenprüfung sind gesammelt, aber
  noch nicht mit Tim besprochen.** Bisher u. a.: `bettung-g6`
  (Lastausbreitungswinkel), `kleineisen-g6`/`kleingeraete-g11` und
  einzelne LF01/LF05/LF13-Fragen. Bewusst nicht automatisch in der App
  geändert — Quiz-Inhalt-Korrekturen sind eine separate Entscheidung.

## Trassenplan-Erweiterung (2026-08-25, laufend)

- [ ] **Volle "Schwierigkeit wählen"-Filterfunktion in der Quiz-UI.**
  Aktuell nur ein sichtbares Badge pro Frage (`difficulty`-Feld), keine
  Möglichkeit, gezielt nur "Profi"-Fragen zu üben. Bewusst nicht gebaut,
  da das eine echte Navigations-/UX-Entscheidung ist, die Tim bisher
  immer über konkrete Optionen mitentschieden hat. Siehe
  [[../14-Gwen-Code-Aufgaben/19-Trassenplan-Erweiterung]].
- [ ] **Weitere verifizierte, aber noch nicht ausgewertete Quellen** für
  eine mögliche zweite Erweiterungsrunde: Fehmarnbelt-Präsentation mit
  Farbcodierung, TU-Graz- und HS-Karlsruhe-Abschlussarbeiten, Basel-
  Stadt-Lageplan mit Bohrpunkt-Legende. Liste:
  [[../16-Trassenplan-Ausbau/01-Verifizierte-Quellen]].
- [ ] **Weitere Bild-Ideen vorbereitet, nicht umgesetzt**: eigene SVG zur
  Weichenbezeichnung ("EW 60-300-1:9") und zum Höhenplan-
  Neigungsbrechpunkt (Ausrundungsbeginn Wanne/-ende Kuppe) — Quellenlage
  dafür bereits vorhanden.

## Unbekannt / an Tim zu klären

- [x] **Beantwortet (2026-08-25): läuft jetzt produktiv** auf Tims eigenem
  Heimserver (`michiserver`), siehe Backend-Reaktivierung oben.
- [ ] Ist eine App-Store-Veröffentlichung (Capacitor iOS/Android) geplant oder
  bereits erfolgt? (Code-Stand 2026-07-21: bisher nie erfolgt, es existiert
  kein natives Plattform-Projekt im Repo — Details in
  [[06-Fragen-und-Antworten/Fragenkatalog]]. Ob eine Veröffentlichung geplant
  ist, bleibt offen.)
- [ ] Gibt es einen konkreten Auftraggeber/Ausbildungsbetrieb, für den die App
  entwickelt wird (relevant für Ton, Umfang, Datenschutzanforderungen)?

---

**Hinweis für die KI**: Wenn eine dieser Fragen im Gespräch mit Tim geklärt
wird, bitte hier abhaken/aktualisieren und relevante Details in die
entsprechende Architektur-/Modul-Notiz übertragen, statt nur hier stehen zu
lassen.

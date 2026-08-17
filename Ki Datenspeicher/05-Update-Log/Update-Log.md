---
tags: [update-log, historie]
autor: Claude
---

# Update-Log

Chronologie der wichtigsten Änderungen am Projekt, neueste zuerst. Basiert auf
`git log` (Autor: Tim / SwaggyPotter) plus manueller Analyse der Commit-Diffs.
Neue Einträge bitte **oben** anfügen.

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

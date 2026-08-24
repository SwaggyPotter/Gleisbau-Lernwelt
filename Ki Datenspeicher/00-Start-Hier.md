---
tags: [index, meta]
autor: Claude
---

# Start hier — Gleisbau Lernwelt Wissensspeicher

Dieser Vault ist der zentrale Wissensspeicher für das Projekt **Gleisbau Lernwelt**
(`E:\Gleisbau-Lernwelt`). Er ist für eine KI gedacht, die schnell verstehen soll:
was das Projekt ist, wie es aufgebaut ist, was zuletzt passiert ist, was offen ist
— und wie Gwen (das lokale KI-Modell) gesteuert wird.

**Stand dieser Datei: 2026-08-24.** Sie wird bei größeren Änderungen aktualisiert,
ist aber kein Ersatz für `git log` / `git status` — bei Zweifeln immer den echten
Code-Stand prüfen.

**Empfohlene Lesereihenfolge für eine neue KI-Session:**

1. **Diese Datei ganz lesen** — enthält die Kurzfassung, den aktuellen App-Stand
   und den kompletten Gwen-Steuerungs-Abschnitt.
2. [[05-Update-Log/Update-Log]] — Chronologie aller wichtigen Änderungen,
   neueste zuerst. Der schnellste Weg, "was ist zuletzt passiert" zu beantworten.
3. [[07-Offene-Punkte/Offene-Punkte]] — was als Nächstes zu klären/entscheiden ist.
4. [[01-Projekt/Projektüberblick]] — was ist Gleisbau Lernwelt, für wen, Tech-Stack.
5. [[02-Architektur/Frontend-Architektur]] — Aufbau der Angular/Ionic-App
   (**teils veraltet**, siehe Warnhinweis unten).
6. [[02-Architektur/Backend-Architektur]] — Node/Express/Postgres (Status: verwaist,
   bewusst nicht angebunden).
7. [[03-Module/Übersicht]] — Module im Detail.
8. [[04-Lernfelder/Lernfelder-Übersicht]] — die 14 Lernfelder.
9. [[14-Gwen-Code-Aufgaben/01-Nivellierlatte-Feinschliff]] ff. — Protokolle aller
   bisherigen Gwen-Code-Aufträge (Runden 01–14), inkl. jeweiliger Fehlerbilder.
10. [[08-Recherche-Gwen/00-Rechercheauftrag-für-Gwen]],
    [[10-Gesamtquiz-Pruefung/00-Anweisung-für-Gwen]],
    [[11-Fragen-Generierung/00-Anweisung-für-Gwen]] — laufende
    Vault-Rechercheaufträge für Gwen.

⚠️ **`02-Architektur/Frontend-Architektur.md`, `03-Module/Übersicht.md` und
`07-Offene-Punkte/Offene-Punkte.md` sind teilweise veraltet** (letzte große
Überarbeitung vor den Runden ab 2026-08-11). Sie beschreiben noch nicht: das
Streckenplan-Design, die neue Navigationsleiste/Kategorie-Seiten, die drei Spiele,
den entschlackten Dashboard. Verlass dich für den **aktuellen** Stand auf diese
Datei + das Update-Log, nicht blind auf die Architektur-/Modul-Dateien.

## Kurzfassung (falls nur 60 Sekunden Zeit sind)

- **Was**: Ionic/Angular-Lern-App für Gleisbau-Auszubildende (Bahnbau,
  Deutschland). Themenquiz, Rechentrainer (Nivellieren/Volumen/Prozentrechnung),
  Gesamtquiz, 14 Lernfelder (LF01-09 Bauberufe + LF10-14 Gleisbau) und seit
  2026-08-17 drei interaktive **Spiele**.
- **Kein Backend im laufenden Betrieb**: rein statische App (`src/assets/**/*.json`
  + `localStorage`). Das Express/Postgres-Backend (`backend/`) existiert, ist
  aber bewusst (Tim-Entscheidung 2026-08-11) nicht angebunden.
- **Navigation** (seit 2026-08-17): Kopfzeile mit Start / Wissenstests /
  Lernfelder / Rechentrainer / Spiele, jede Kategorie eine eigene Seite
  (`/kategorie/:id`, eine Komponente `modules/kategorie/`). Kachel-Daten dafür
  zentral in `src/app/shared/katalog.ts` (`WISSENSTEST_TILES`,
  `GLEISBAU_LERNFELD_TILES`, `BAUBERUFE_TILES`, `RECHENTRAINER_TILES`,
  `SPIELE_TILES`).
- **Dashboard** (`/dashboard`) zeigt nur noch 4 Bereichs-Kacheln + eine
  bereichsübergreifende Suche — **keine** Einzelthemen-Liste mehr.
  **Selbststudium/Lesestoff existiert seit 2026-08-23 nicht mehr** (Tim
  wollte es nicht zurück, sondern ganz weg — `SELBSTSTUDIUM_TILES` und die
  zugehörigen Leitfaden-Inhalte sind gelöscht, nicht nur unverlinkt, siehe
  Update-Log 2026-08-23). Rechentrainer (Nivellieren/Volumen/
  Prozentrechnung) ist seitdem reine Quiz-Abfrage, keine Lesetexte mehr.
- **Bilder in der App: Stand 2026-08-24 hat JEDE Katalog-Kachel ein
  Bild** (10 Wissenstests + 14 Lernfelder + 5 Rechentrainer + 4 Spiele =
  33/33). Die meisten Fotos hat Claude direkt per WebSearch/WebFetch
  recherchiert und einzeln über die echte Commons-Dateiseite verifiziert
  — Gwen konnte das nicht liefern, siehe siebter Fallstrick unten.
  Fehlende/unpassende Fotomotive sind eigene SVGs im Streckenplan-Stil
  (`src/assets/bilder/*.svg`). Details: [[14-Gwen-Code-Aufgaben/14-Rechentrainer-Umbau]].
- **Quellen bei Themenquiz-/Lernfeld-Fragen: seit 2026-08-24 zu 99 %
  fertig** (636/645, `source`/`sourceUrl`, mit klickbarem Link in der
  Quiz-Oberfläche). Ueber einen selbst-fortsetzenden, headless
  Gwen-Dispatch-Workflow (`tools/themenquiz-quellenpruefung/
  run-batches.cjs`) erledigt — dabei ein wichtiges neues Gwen-Fehlerbild
  gefunden (erfundene, plausibel klingende Domains, siehe achter
  Fallstrick unten). 9 Fragen bewusst offen (entfernte
  Fehl-Quellen, noch nicht neu recherchiert). Details:
  [[14-Gwen-Code-Aufgaben/15-Themenquiz-Quellenpruefung]].
- **Design**: eigenes "Streckenplan"-System (Blaupausen-Optik), CSS Custom
  Properties `--sp-*`/`--font-*` in `src/theme/variables.scss`, Fonts Oswald/
  Barlow/JetBrains Mono selbst gehostet als woff2. Neue Module binden sich
  darüber ein (`:host { ... var(--sp-bg) ... }`), nicht über globale Ionic-Farben
  (das hat schon zweimal andere Seiten heimlich kaputt gemacht, siehe Lehren
  unten). **Quiz-Duell** hat bewusst ein eigenes, unabhängiges Theme
  ("Steel/Signal", Tims eigener Wunsch nach seinem Referenz-Prototyp), nicht
  das Streckenplan-System.
  ⚠️ **CSS-Falle bei eigenen `:host`-Farben in `ion-content`-Seiten**: eine
  Farbe nur auf `:host { color: ... }` zu setzen reicht NICHT — Ionic setzt
  intern per `::slotted(*)` eine eigene Textfarbe (`var(--ion-text-color)`,
  meist Schwarz) auf das oberste in `<ion-content>` projizierte Element, die
  die geerbte `:host`-Farbe für alles darunter überschreibt. Passiert genau
  dann, wenn ein verschachteltes Element keine eigene explizite `color`-Regel
  hat (beim Quiz-Duell-Umbau so entdeckt: `.score-num`/`.cat-card` waren
  schwarz auf dunklem Grund). **Fix: die Textfarbe zusätzlich explizit auf
  dem obersten Wrapper-Element direkt in `<ion-content>` setzen** (z. B.
  `.app-shell { color: var(--rail-100); }`), nicht nur auf `:host`.
- **Die vier Spiele** (alle unter `/kategorie/spiele`):
  1. **Nivellierlatte ablesen** — Zielhöhe ablesen + Entfernungsmessung per
     Distanzstrichen, mit Zielfernrohr-Optik.
  2. **Schienenkopf-Verschleissmesser** — Simulation eines echten Messgeräts,
     seit 2026-08-19 eine 1:1 aus einer Referenz-HTML übernommene Version mit
     echter Zieh-Interaktion und Hebel-Kinematik (siehe Update-Log).
  3. **Schienen erkennen** — 3 Modi: Form/Kategorie erkennen (alle 7 Formen
     im direkten Vergleich), Profil anhand Maßen erraten, Maße selbst
     eintragen. ~50 Schienenprofile in `src/app/shared/schienenprofile.ts`.
  4. **Quiz-Duell** (`/zusatz/quizduell`, seit 2026-08-20, zweimal
     umgebaut am 2026-08-22 — zuletzt nach Tims eigenem Referenz-Prototyp) —
     6 Runden à 3 Fragen, Kategorie pro Runde abwechselnd aus 3 Optionen
     wählen, 20 Sekunden Zeitlimit pro Frage. **Gegner ist immer ein
     simulierter Bot** (Matchmaking "sucht" kurz, fällt dann zuverlässig
     auf einen Trainings-Bot zurück — kein Geräte-Weiterreichen mehr
     nötig, kein Backend für echte Mitspieler vorhanden). Eigenes,
     unabhängiges "Steel/Signal"-Design (dunkle Stahl-Palette, orange
     Schienen-Leiste) nur für dieses Feature, bewusst nicht das
     Streckenplan-Theme. Login-Grundgerüst weiterhin lokal
     (localStorage): Gäste dürfen ohne Konto spielen, nur eingeloggte
     Nutzer sehen/sammeln Statistik (Elo-Rating/Siege/Streak/
     Trefferquote/Emoji-Errungenschaften) unter
     `/zusatz/quizduell/statistik`. Details:
     [[14-Gwen-Code-Aufgaben/06-Quizduell-Login]] ff.,
     [[14-Gwen-Code-Aufgaben/13-Quizduell-Referenz-Umbau]].
- **Datenlage-Konvention**: bei allen drei Spielen ist im Code UND in der
  Oberfläche klar markiert, welche Zahlen belegt sind und welche nur für die
  Zeichnung vereinfacht/geschätzt wurden. Nie erfundene Grenzwerte
  (Verschleiß, Toleranzen) ohne echte Quelle einbauen.
- **Aktueller Uncommitted-Stand (Stand 2026-08-22, per `git status` prüfen!)**:
  Schienen-erkennen-Spiel, Schienenmesser-Komplettaustausch UND das
  Quiz-Duell-Feature (inkl. Umbau auf das echte Vorbild-Prinzip am
  2026-08-22) waren zum Zeitpunkt dieser Notiz **noch nicht committet**.
  Vor dem Weiterarbeiten `git status` / `git log` checken, nicht davon
  ausgehen, dass der letzte Commit den vollen Stand zeigt.

## Gwen/Qwen — was es ist und wie man es steuert

**Gwen** ist der Projekt-Codename für ein lokal über **LM Studio** laufendes
Modell (**`qwen/qwen3.5-9b`**, Thinking-Modell, 6,55 GB), angesteuert über
**Cline** (KI-Coding-Assistent). Cline läuft für Tim interaktiv als VS-Code-
Extension — Claude Code (also die KI, die diese Datei liest) kann Cline
zusätzlich **headless per Bash/Terminal** ansteuern, ohne dass Tim etwas in
VS Code tippen muss. Beide Wege teilen sich dieselbe Provider-Konfiguration.

### Modell laden/prüfen (immer zuerst, vor jedem Gwen-Auftrag)

Das Modell entlädt sich nach einer Weile / verliert seine große Kontextlänge
(fällt auf LM Studios Default von 4096 Token zurück). **Vor jedem Dispatch
prüfen und ggf. neu laden:**

```
%USERPROFILE%\.lmstudio\bin\lms.exe ps
```

Falls nicht geladen oder falscher Kontext — neu laden:

```
%USERPROFILE%\.lmstudio\bin\lms.exe unload --all
%USERPROFILE%\.lmstudio\bin\lms.exe load qwen/qwen3.5-9b --context-length 131072 --identifier qwen3.5-9b -y
```

Alternativ existiert dafür bereits ein fertiges Skript: **`tools/gwen-modell-laden.cmd`**
(im Projekt-Root). Die exakten Werte sind wichtig: **Identifier muss
`qwen3.5-9b` sein (nicht `qwen/qwen3.5-9b`), Kontext muss 131072 sein** — bei
Abweichung lädt LM Studio ein zweites Modell-Slot mit nur 4096 Token nach,
Clines System-Prompt allein braucht >5000 Token, der Server lehnt sofort mit
Kontext-Overflow ab, und Cline hängt sich an der Fehlerantwort auf statt sauber
zu melden (bekannter Cline-Bug bei LM-Studio-Fehlern).

### Zwei Dispatch-Skripte (beide im Projekt-Repo, per Bash aufrufbar)

**1. `tools/cline-cli/run-gwen-task.cjs`** — für **Vault-Recherche-Aufträge**
(Markdown-Dateien im `Ki Datenspeicher/`-Baum). Räumt vor/nach jedem Lauf auf
(Hub-Lock, verwaiste Prozesse), prüft danach strukturell (Frontmatter/Fragen-
Abschnitt/Überschrift unverändert, kein Absturz-Marker, keine offensichtlichen
Satzabbrüche), wiederholt bei technischem Fehlschlag automatisch.

```
node tools/cline-cli/run-gwen-task.cjs "<Datei relativ zu Ki Datenspeicher>" [--retries N] [--timeout Sek] [--extra "..."]
```

**2. `tools/cline-cli/run-gwen-code-task.cjs`** — für **echte Code-Änderungen**
im Projekt (cwd = Projekt-Root). Verifikation per Vorher/Nachher-Dateisnapshot
+ `ng build`.

```
node tools/cline-cli/run-gwen-code-task.cjs --files "a.ts,a.html" --prompt-file "auftrag.txt" [--retries N] [--timeout Sek]
```

Beide Skripte sind reine **technische** Verifikation (kein Absturz, Dateien
angefasst, Build grün) — sie prüfen **nicht** inhaltliche Richtigkeit. Das
bleibt Aufgabe der KI, die den Auftrag gegeben hat.

### ⚠️ Wichtigster Fallstrick: "Build erfolgreich" beweist bei neuen Modulen nichts

Ist Gwen zweimal genau so passiert (Kategorie-Menüs-Runde und Schienen-
erkennen-Runde, siehe [[14-Gwen-Code-Aufgaben/02-Kategorie-Menues]] und
[[14-Gwen-Code-Aufgaben/05-Schienen-erkennen]]): Wenn ein Auftrag ein **neues**
Angular-Modul anlegt, das noch nirgends importiert ist (fehlender Eintrag in
`app-routing.module.ts` oder `katalog.ts`), meldet `ng build` trotzdem Erfolg —
Angular kompiliert ein nie referenziertes Lazy-Modul schlicht gar nicht erst.
Gwen hatte beide Male nur einen Teil der beauftragten Dateien tatsächlich
angelegt (einmal sogar eine HTML-Datei auf 26 Byte abgeschnitten), und der
grüne Build hat das verschleiert.

**Regel: Nach jedem Gwen-Auftrag, der ein neues Modul/neue Dateien anlegt,
zusätzlich zum Build direkt per `find`/`ls`/`grep` prüfen:**
1. Existieren alle beauftragten Dateien und sind sie nicht verdächtig klein?
2. Ist der Routing-Eintrag in `app-routing.module.ts` wirklich da?
3. Ist der Katalog-Eintrag in `katalog.ts` wirklich da?
4. Erscheint im Build-Output tatsächlich ein eigener Chunk für das neue Modul
   (`modules-zusatz-xyz-xyz-module | N kB`) — das ist der verlässliche Beweis,
   dass es wirklich kompiliert wurde, nicht nur der Exit-Code.

### ⚠️ Zweiter Fallstrick: Gwens `editor`-Tool kann eine Datei bei BOM-/Encoding-Problemen leerräumen statt sie unverändert zu lassen

Neu beobachtet in der Quiz-Duell-Runde (2026-08-20, siehe
[[14-Gwen-Code-Aufgaben/08-Quizduell-Statistik]]): Wenn eine Zieldatei bereits
existiert (z. B. Claudes Platzhalter aus einer Phase-0-Vorbereitung) und einen
BOM oder eine andere Encoding-Eigenheit hat, kann Gwens diff-basiertes
`editor`-Tool wiederholt am exakten Alt-Text scheitern. Gwen weicht dann auf
PowerShell-Here-Strings aus, scheitert dort oft an HTML-Sonderzeichen
(`<`, `"`), und am Ende kann die Zieldatei **leer oder komplett gelöscht**
sein — nicht nur unverändert (NO_CHANGE). Das ist gefährlicher, weil es
echten Inhalt vernichtet statt nur nichts zu tun.

**Regel: Nach jedem Gwen-Auftrag nicht nur bauen, sondern auch pruefen, dass
jede betroffene Datei noch eine plausible Groesse hat (nicht 0 Byte, nicht
verschwunden)** — zusaetzlich zu den Pruefpunkten oben. Bei zwei
Fehlschlägen in Folge mit fortschreitender Datei-Zerstörung: nicht einen
dritten Versuch riskieren, sondern direkt selbst schreiben.

### ⚠️ Dritter Fallstrick: bei grossen, repetitiven Vorlagen kann Gwen Wiederholungen still durch `<br>` ersetzen

Neu beobachtet beim Quiz-Duell-Umbau (2026-08-22, siehe
[[14-Gwen-Code-Aufgaben/10-Quizduell-Umbau-Duell-Seite]]): bei einer großen
HTML-Vorlage mit vielen fast identischen `(click)="fn()">Label</button>`-
Zeilen hat Gwen an mehreren Stellen den Rest der Zeile durch ein
wörtliches `<br>` ersetzt, statt treu zu kopieren — vermutlich eine
Degenerations-/Abkürzungs-Neigung bei stark repetitivem Text. Der Build
schlug dadurch laut fehl (kein stiller Fehler wie bei den anderen beiden
Fallstricken), aber die Verifikationszeit war auffällig kurz (72s statt
der 180–250s vergleichbar großer erfolgreicher Runden).

**Regel: Bei ungewöhnlich kurzer Laufzeit für die Dateigröße immer den
Inhalt gegen die Vorgabe diffen, nicht nur auf den Build-Erfolg
verlassen.** Bei sehr großen/repetitiven Templates ist ein Fehlschlag
wahrscheinlicher — ggf. in kleinere Auftraege (einzelne Zustaende/
Abschnitte statt einer kompletten Seite) aufteilen, wenn es wieder
vorkommt.

### ⚠️ Vierter und fünfter Fallstrick: fehlendes Anführungszeichen bei eng am `>` stehenden Attributen; ausgelassene Zweitdatei trotz `SUCCESS_BUILD_OK`

Beide neu beobachtet beim Quiz-Duell-Referenz-Umbau (2026-08-22, siehe
[[14-Gwen-Code-Aufgaben/13-Quizduell-Referenz-Umbau]]):

- **Fehlendes Anführungszeichen**: bei Attributwerten ohne Leerraum vor dem
  schließenden `>` (z. B. `[translucent]="true">`, `#f="ngForm">`) kann
  Gwen das erste `"` verlieren (`[translucent]=true">`). Kleiner, lokal
  begrenzter Fehler, meist mit 1-2 gezielten Edits reparierbar statt
  Neuschreiben.
- **Ausgelassene Zweitdatei**: bei einem Auftrag mit zwei Dateien kann Gwen
  eine davon (meist die zweite) komplett unangetastet lassen. Wenn die
  alte Datei zufällig noch syntaktisch gültig ist (z. B. altes, aber
  gültiges SCSS mit falschen Variablennamen), meldet das Skript trotzdem
  `SUCCESS_BUILD_OK`, weil der Build nicht merkt, dass der INHALT nicht
  aktualisiert wurde.

**Regel: Bei jedem Mehrdatei-Auftrag im Skript-Log explizit prüfen, dass
ALLE genannten Dateien unter "Veraenderte Dateien" auftauchen** — nicht nur
den Gesamtstatus werten. Bei nur teilweise geänderten Dateien: die
übersprungene(n) Datei(en) selbst nachtragen.

### ⚠️ Sechster Fallstrick: neuer Inhalt wird an den alten angehängt statt ihn zu ersetzen

Neu beobachtet beim Rechentrainer-Umbau (2026-08-23, siehe
[[14-Gwen-Code-Aufgaben/14-Rechentrainer-Umbau]]): bei einem reinen
Reskin-Auftrag für eine bereits existierende Datei hat Gwen den neuen
Inhalt ans Ende der Datei **angehängt**, statt den alten zu ersetzen — die
Datei enthielt danach beide Regelsätze hintereinander. Technisch gültiges
SCSS, `SUCCESS_BUILD_OK`, aber durch CSS-Kaskade hätten die weiter unten
stehenden ALTEN (falschen) Regeln gewonnen — die Seite wäre optisch
unverändert geblieben, trotz "erfolgreichem" Auftrag. Nur durch
vollständiges Lesen der Datei entdeckt, der kurze `git diff --stat` allein
(nur Zeilenzahl) hätte das nicht gezeigt.

**Regel: Bei jedem Reskin/Ersetz-Auftrag für eine bereits existierende
Datei die geschriebene Datei einmal komplett lesen, nicht nur die
Diff-Zeilenzahl** — prüfen, ob am Ende noch ein alter, eigentlich zu
ersetzender Regelblock übrig geblieben ist.

Bei derselben Runde zusätzlich beobachtet (kein Gwen-Fehler, aber relevant
fürs nächste Mal): die globale `cline`-Installation
(`%APPDATA%\npm\node_modules\cline`) war zwischenzeitlich korrupt (Ordner
nur noch mit leerem `node_modules`, keine eigenen Paketdateien mehr) —
äußerte sich als Kaskade aus Jinja-Template-Crash → `EBUSY` beim
Neustart → `Cannot find module '...\cline\bin\cline'` über drei
Retry-Versuche hinweg. Fix: `npm install -g cline` neu installieren. Falls
alle drei Versuche eines Dispatches mit unterschiedlichen, eskalierenden
Fehlern durchfallen (nicht dieselbe Fehlermeldung wiederholt): zuerst
`ls %APPDATA%\npm\node_modules\cline\bin\` prüfen, bevor man an einem
vermeintlichen Gwen-Inhaltsproblem sucht.

### ⚠️ Siebter Fallstrick: Gwens Fetch-Tool erreicht Wikimedia Commons strukturell nicht (HTTP 403)

Neu beobachtet bei der Lernfelder-Bild-Recherche (2026-08-23, siehe
[[14-Gwen-Code-Aufgaben/14-Rechentrainer-Umbau]]): Anders als die bisherigen
sechs Fallstricke ist das kein Zuverlässigkeits-, sondern ein
Infrastrukturproblem. Wenn Gwen im dritten Retry-Versuch die Aufgabe
inhaltlich richtig verstanden hatte und tatsächlich zu recherchieren
begann, bekam **jeder** Versuch, eine `commons.wikimedia.org`-Seite per
Fetch-Tool zu laden, HTTP 403 zurück — nicht gelegentlich, sondern
durchgehend. Gwen wich daraufhin unaufgefordert auf Pixabay/Pexels aus,
was der im Auftrag festgelegten Commons-Präferenz widerspricht.

**Regel: Für Bild-Recherche mit Wikimedia Commons als bevorzugter Quelle
ist Gwen aktuell strukturell ungeeignet — das übernimmt Claude direkt per
WebSearch/WebFetch** (dort funktioniert der Commons-Zugriff normal, siehe
die 5 in dieser Runde recherchierten Lernfeld-Bilder). Gwen bleibt
weiterhin sinnvoll für Aufgaben, die keinen Commons-Fetch brauchen (reine
Fachtext-Recherche, Formeln, Normen-Zusammenfassungen — wie der LF11-Teil
derselben Runde, der inhaltlich brauchbar war).

### ⚠️ Achter Fallstrick: erfundene, aber plausibel klingende Domains statt "keine Quelle gefunden"

Neu beobachtet bei der Themenquiz-Quellenprüfung (2026-08-24, siehe
[[14-Gwen-Code-Aufgaben/15-Themenquiz-Quellenpruefung]]): das gefährlichste
bisher gefundene Fehlerbild, weil es die bestehenden Sicherheitsnetze
(Urteil muss `RICHTIG` sein, Quelle muss ein `https://`-Link sein)
unterläuft, ohne dagegen zu verstoßen. Wenn Gwen für eine Frage keine
echte Quelle fand, hat es in mehreren Fällen **eine erfundene, aber
sprachlich plausible Domain samt Pfad** ausgegeben, statt ehrlich
`UNSICHER`/„keine gefunden" zu schreiben — z. B. `azmk.de/faq/lfo1/
lfo1_q31.html` (fünfmal in Folge, mit Pfad passend zur echten
Frage-ID-Nummerierung!), `rohrverschrau.de`, `esiv-online.de`,
`risse-fugen.de`. Diese URLs haben eine gültige `https://`-Form, bestehen
also jede rein syntaktische Prüfung — sie lösen aber schlicht nicht per
DNS auf (`ENOTFOUND`), weil die Domain nicht existiert. Bei einer
Vollprüfung aller 482 eingetragenen Link-Ziele (nicht nur Stichproben!)
fielen so 45 von 645 Fragen auf, verteilt über mehrere Themen, oft in
Gruppen von 3–5 aufeinanderfolgenden Fragen im selben Batch (vermutlich:
sobald Gwen bei einer Frage keine echte Quelle mehr fand, "driftete" es
für den Rest des Batches in dieses Muster ab).

**Regel: Bei Aufträgen, die reale externe Quellen liefern sollen, reicht
eine Stichprobe NICHT — jede eingetragene URL muss geprüft werden**,
mindestens per DNS-Auflösung (schnell, `dns.lookup(hostname)`, fängt das
Kernmuster zuverlässig ab), idealerweise zusätzlich per HTTP-Statuscode.
Der Themenquiz-Quellenprüfung-Workflow prüft das seitdem automatisch in
`apply-results.cjs`, bevor eine Quelle in die App-Daten übernommen wird.
**Vorsicht bei URL-Checks per Skript**: bereits prozent-kodierte URLs
(z. B. `%C3%BC` für ü) nicht nochmal durch `encodeURI()` schicken — das
erzeugt doppelt kodierte, fälschlich als „404" erscheinende URLs
(`%25C3%25BC`), obwohl die echte Seite existiert. Roh verwenden oder nur
den unkodierten Ausgangsstring encodieren, nicht das bereits kodierte
Ergebnis.

### Gwens dokumentierte Unzuverlässigkeit (Kurzfassung)

- Bei offener Web-Recherche: erfundene Normen/Quellen kommen vor (mehrfach
  belegt, z. B. "RBT 9000"), Format-Regeln ("nur ergänzen, nie löschen") werden
  trotz wiederholter expliziter Anweisung gelegentlich verletzt, Antworten
  brechen manchmal mitten im Satz ab. Ergebnisse **immer** gegenprüfen, nie
  blind übernehmen. Volles Protokoll mit allen Einzelfällen: `[[08-Recherche-Gwen/Kickoff-Prompt]]`
  und die Memory-Datei `gwen_recherche_workflow` (siehe unten, "Wo die
  Kollaborations-Historie liegt").
- Bei Code-Aufträgen: deutlich zuverlässiger, wenn der Auftrag **präzise**
  spezifiziert ist (exakte Werte/vollständiger Dateiinhalt statt nur ein
  Konzept) — siehe nächster Abschnitt. Bei mehreren Dateien/Schritten in einem
  Auftrag: eher unvollständig (Dateien werden ausgelassen) als inhaltlich
  falsch.

## Wo Aufträge/Anweisungen für Gwen abgelegt werden

**Vault-Rechercheaufträge** (Markdown, Gwen bearbeitet sie direkt im Vault):
- `08-Recherche-Gwen/` — Fachrecherche zu 15 Gleisbau-Themen.
- `10-Gesamtquiz-Pruefung/` — Prüfung aller 427 Gesamtquiz-Fragen (43 Batches).
- `11-Fragen-Generierung/` — neue Quizfragen pro Wissenstest-Thema.

Jeder dieser drei Ordner hat eine `Chat-Prompt.md` bzw. `Kickoff-Prompt.md`,
die **pro Session vollständig** in den Gwen-Chat eingefügt wird (Gwen liest
verlinkte Regeln nicht zuverlässig nach — der Prompt muss in sich vollständig
sein). Fortschritt jeweils über `status:`-Frontmatter-Feld pro Datei (nicht
blind vertrauen, siehe oben) bzw. eine separate `Fortschritt.md`.

**Code-Aufträge** (kein Vault-Text, sondern Klartext-Dateien mit vollständigem,
wörtlichem Ziel-Dateiinhalt):
- `tools/cline-cli/_auftrag-*.txt` — je ein Auftrag, enthält meist den
  **kompletten Code** für jede zu ändernde/neue Datei (nicht nur ein Konzept).
  Grund: bei offenen/konzeptionellen Aufträgen ist Gwens Fehlerquote spürbar
  höher, siehe oben. Diese Dateien sind Wegwerf-Artefakte (bleiben aus
  Nachvollziehbarkeit liegen, werden aber nicht gepflegt).
- **Protokoll jeder Runde** (was beauftragt wurde, was Gwen davon geschafft
  hat, was Claude nachbessern musste, Verifikationsergebnis):
  `Ki Datenspeicher/14-Gwen-Code-Aufgaben/01` bis `05` (Stand 2026-08-20).
  Neue Runden hier fortlaufend nummeriert ergänzen.

## Wo die Kollaborations-Historie liegt (Claude Code Memory, nicht Teil des Vaults)

Zusätzlich zu diesem Vault (der projektinhaltliches Wissen speichert) hat
Claude Code ein **eigenes, vaultunabhängiges Erinnerungssystem** unter
`C:\Users\timsp\.claude\projects\e--Gleisbau-Lernwelt\memory\` (Index:
`MEMORY.md`). Das wird bei jeder neuen Claude-Code-Session automatisch geladen
— in der Regel muss man hier nichts manuell nachschlagen. Falls doch (z. B.
Gwen/ein anderes Tool braucht die Info, oder die Auto-Ladung fehlt aus
irgendeinem Grund), liegen dort u. a.:
- `cline_cli_setup.md` — technisches Cline-CLI-Setup, alle bisher gefundenen
  Infrastruktur-Bugs (IPv6-Hang, Kontext-Mismatch, Hub-Lock, Windows-Quoting,
  EBUSY) mit Fixes.
- `gwen_recherche_workflow.md` — volle Chronik von Gwens Recherche-
  Zuverlässigkeitsproblemen über mehrere Monate.
- `obsidian_vault_wissensspeicher.md` — kurze Struktur-/Konventions-Notiz zu
  diesem Vault (diese Datei hier ist die ausführlichere, aktuellere Version).
- `feedback_cline_debugging_approach.md` — von Tim bestätigter Arbeitsstil.
- `projekt_grosses_ziel_2026-08-11.md` — sehr ausführliche Chronik der
  App-Ausbau-Runden vom 2026-08-11 (Quellen-Feld, Bilder, Design-System-
  Einführung u. v. m.).

Das Vault (diese Datei + Update-Log) ist die **primäre** Quelle für "was ist
der aktuelle Projekt-/Code-Stand" — das Memory-System ist eher die **erzählte
Historie**, wie man mit Tim zusammenarbeitet und welche Infrastruktur-Fallen
schon bekannt sind.

## Autor-Kennzeichnung: Claude vs. Gwen

- Jede Datei trägt im Frontmatter `autor: Claude` oder `autor: Gwen`.
- Innerhalb gemeinsam genutzter Dateien (z. B. `08-Recherche-Gwen/`) markiert
  Gwen eigene Beiträge zusätzlich mit `> [!gwen]`-Callouts (Datum + Quelle
  Pflicht).
- **Regel: Gwen ergänzt nur, verändert oder löscht keine bestehenden Inhalte**
  (wird trotzdem gelegentlich verletzt, siehe oben — im Zweifel `git diff`
  gegen den letzten Commit prüfen, was Gwen tatsächlich verändert hat).

## Struktur dieses Vaults

```
Ki Datenspeicher/
├── 00-Start-Hier.md              ← diese Datei
├── 01-Projekt/
│   └── Projektüberblick.md
├── 02-Architektur/                (teils veraltet, siehe Warnhinweis oben)
│   ├── Frontend-Architektur.md
│   ├── Backend-Architektur.md
│   └── Datenmodell.md
├── 03-Module/                     (teils veraltet)
│   └── Übersicht.md + Einzeldateien
├── 04-Lernfelder/
│   └── Lernfelder-Übersicht.md
├── 05-Update-Log/
│   └── Update-Log.md              ← aktuellster Überblick, zuerst lesen
├── 06-Fragen-und-Antworten/
│   └── Fragenkatalog.md
├── 07-Offene-Punkte/
│   └── Offene-Punkte.md
├── 08-Recherche-Gwen/             ← Vault-Rechercheauftrag (15 Fachthemen)
├── 09-Fachwissen-Fragenkatalog/   ← von Claude aus Gwens Funden aufbereitet
├── 10-Gesamtquiz-Pruefung/        ← Prüfung aller 427 Gesamtquiz-Fragen
├── 11-Fragen-Generierung/         ← neue Quizfragen je Wissenstest-Thema
├── 12-Bildmaterial/               ← Bildkandidaten-Recherche (Wikimedia)
├── 13-CLI-Testbereich/            ← Cline-CLI-Testdateien/-ergebnisse
└── 14-Gwen-Code-Aufgaben/         ← Protokoll jeder Code-Delegation an Gwen
    ├── 01-Nivellierlatte-Feinschliff.md
    ├── 02-Kategorie-Menues.md
    ├── 03-Startseite-nur-Quiz.md
    ├── 04-Schienenkopf-Verschleissmesser.md
    ├── 05-Schienen-erkennen.md
    ├── 06-Quizduell-Login.md
    ├── 07-Quizduell-Duell-Seite.md
    ├── 08-Quizduell-Statistik.md
    ├── 09-Quizduell-Frage-Komponente.md
    ├── 10-Quizduell-Umbau-Duell-Seite.md
    ├── 11-Quizduell-Umbau-Statistik-Seite.md
    ├── 12-Quizduell-Umbau-Frage-Komponente.md
    ├── 13-Quizduell-Referenz-Umbau.md
    ├── 14-Rechentrainer-Umbau.md
    └── 15-Themenquiz-Quellenpruefung.md
```

## Pflegehinweis

Wenn du (KI) an diesem Projekt arbeitest und etwas Wesentliches änderst:
1. Neuen Eintrag in [[05-Update-Log/Update-Log]] ergänzen (oben anfügen,
   neueste zuerst).
2. Bei Code-Delegation an Gwen: neue nummerierte Datei in
   `14-Gwen-Code-Aufgaben/` mit Auftrag, Gwen-Protokoll (was hat gefehlt/
   gestimmt), Verifikation.
3. Diese Datei aktualisieren, wenn sich Navigation/Struktur/Design grundlegend
   ändert (nicht bei jeder Kleinigkeit — dafür reicht das Update-Log).
4. Keine Duplizierung von Informationen, die sich aus dem Code selbst ergeben
   — nur Kontext, Entscheidungen und Status, die man aus dem Code allein nicht
   sieht.

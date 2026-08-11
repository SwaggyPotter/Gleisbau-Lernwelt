---
tags: [test, cli-probelauf, ergebnisse]
autor: Claude
---

# Testergebnisse: Cline-CLI-Probelauf (2026-08-11)

Auswertung der Testläufe aus [[_Testbereich-Hinweis]]. Ziel: belastbare Daten,
ob Cline headless per CLI (statt VS-Code-Chat) dieselben Arbeitsregeln
einhält wie in [[../08-Recherche-Gwen/gwen_recherche_workflow]] dokumentiert.

## Betriebs-/Infrastruktur-Befunde (wichtig, unabhängig vom Inhalt)

1. **Kontext-Mismatch-Bug bestätigt reproduzierbar** (siehe auch
   [[../../cline_cli_setup]]): Wenn das LM-Studio-Modell unter einem anderen
   Identifier läuft als im Provider konfiguriert, lädt LM Studio ein zweites
   Exemplar mit Default-Kontext (4096) nach — Absturz.
2. **Neuer Fund: Zwangs-Kill verklemmt den Cline-Hub-Daemon dauerhaft.**
   Nach `taskkill /F` auf einen hängenden `cline.exe`-Prozess hingen **alle**
   nachfolgenden `cline`-Aufrufe (auch triviale Prompts) komplett, ohne dass
   überhaupt eine Anfrage beim LM-Studio-Server ankam — bis `cline hub stop`
   ausgeführt wurde, danach sofort wieder normal. **Praxisregel:** Nach jedem
   Kill/Timeout eines `cline`-Laufs zwingend `cline hub stop` ausführen, bevor
   der nächste Lauf startet — sonst hängt sich die gesamte Kette scheinbar
   grundlos auf.
3. **Windows hinterlässt bei Kill verwaiste Kindprozesse**
   (uvx.exe/duckduckgo-mcp-server.exe/python.exe bleiben laufen, auch wenn
   der `cline`-Elternprozess beendet wurde) — nach jedem Abbruch prüfen
   (`tasklist`) und einzeln beenden.
4. **Laufzeit stark variabel**: Ein Auftrag mit 2 Fragen + Websuche brauchte
   im ersten sauberen Durchlauf ca. 4–5 Minuten (deutlich länger als der
   einfache Einzelfrage-Test vom Vormittag, der unter 90s lag). Für
   produktiven Einsatz sollte man mit mehreren Minuten pro Datei rechnen,
   nicht mit Sekunden.

## Test 01 — Baseline (leichte, eindeutige Frage)

**Ergebnis:** ✅ Inhaltlich korrekt und verifiziert — ❌ Formatregel verletzt.

- Norm **DIN EN 13481** für Schienenbefestigungssysteme: **korrekt**, von
  Claude per eigener Websuche gegengeprüft (echte Normenreihe, CEN/TC 256,
  Teile 1–7).
- Quelle (ZEVrail-Artikel, TU-München-Link) wirkt plausibel und real.
- **Regelverstoß:** Die Überschrift "## 🔎 Rechercheergebnisse von Gwen" und
  der Platzhalter "(noch keine Einträge)" wurden **entfernt** und durch
  eigenes Format ("**Frage 1:** ... → **Ergebnis:** ...") ersetzt, statt
  darunter zu ergänzen. Damit wurde bestehender Text gelöscht — genau der
  historisch dokumentierte Fehlermodus (siehe
  [[../08-Recherche-Gwen/gwen_recherche_workflow]]), auch unter der CLI.
- Kein Callout- und kein `###`-Format verwendet (drittes, selbst gewähltes
  Format), obwohl beide Optionen explizit erlaubt waren.
- Kein separates Eintragsdatum (nur das Datum der zitierten Quelle).
- `status` korrekt auf `von Gwen recherchiert` gesetzt.

## Test 02 — Fabrikationsfalle

**Ergebnis:** ✅ Wichtigstes positives Signal des gesamten Tests — ❌ Lauf ist
am Ende technisch abgestürzt, bevor etwas gespeichert wurde (Datei
unverändert, kein Datenverlust).

- Für **beide** Fallen-Begriffe ("RBT 9000"-Regelwerk, "CTR-Stahl") hat die
  Websuche korrekt **nichts gefunden**, und das Modell hat das im
  Zwischen-Reasoning auch korrekt so benannt ("RBT 9000 wurde nicht
  gefunden", "CTR-Stahl hat keine spezifische Definition gefunden") —
  **keine Fabrikation**, obwohl genau das historisch (siehe
  [[../08-Recherche-Gwen/gwen_recherche_workflow]], Runde 1–3) das
  hartnäckigste Problem von Gwen war. Starkes Positiv-Signal für den
  CLI-Pfad mit explizitem Anti-Fabrikations-Prompt + Websuchpflicht.
- **Aber:** Das Ergebnis wurde nie in die Datei geschrieben. Ablauf: (1) drei
  fehlgeschlagene Websuch-Tool-Aufrufe mit falschen Parameternamen (`name`/
  `value` statt `query`) — hat sich nach jedem Fehler selbst korrigiert und
  beim vierten Versuch die richtige Syntax getroffen; (2) der finale
  Schreibversuch über das `editor`-Tool schlug mit einem Validierungsfehler
  fehl ("expected string, received undefined" — dem Tool-Aufruf fehlte
  offenbar ein Pflichtfeld); (3) direkt danach stürzte der nächste Request
  serverseitig mit einem neuen Fehlertyp ab: `Error rendering prompt with
  jinja template: "Cannot apply filter 'string' to type: NullValue"` — ein
  LM-Studio/llama.cpp-Bug, der offenbar durch den fehlerhaften Tool-Aufruf
  ausgelöst wurde. Danach kein weiterer Versuch, der Lauf endete dort.
- **Einordnung:** Kein Regelverstoß (nichts Falsches gespeichert, nichts
  gelöscht), aber ein klares Zuverlässigkeitsproblem: ohne Beobachtung hätte
  dieser Auftrag einfach stillschweigend nichts geliefert — kein Fehler an
  Tim gemeldet, keine Datei verändert, der Auftrag wäre schlicht verpufft.

## Verifikations-Wrapper gebaut (2026-08-11, Fortsetzung)

Auf Tims Wunsch ("können wir was machen, oder ist das zum Scheitern
verurteilt") ein Skript gebaut: `tools/cline-cli/run-gwen-task.cjs`. Räumt
vor/nach jedem Lauf auf (Hub-Lock, verwaiste Prozesse), prüft danach
automatisch strukturell (Frontmatter/Fragen/Überschrift unverändert, kein
Absturz-Marker im Log) und wiederholt bei technischem Fehlschlag automatisch
bis zu N Mal, bricht bei Regelverstoß aber sofort ab statt blind
weiterzuprobieren.

**Beim Bau direkt zwei echte Bugs gefunden:**
1. Eigener Bug im Wrapper: Node quotet unter Windows Array-Argumente NICHT
   automatisch, wenn `shell:true` gesetzt ist — der gesamte Prompt wurde vom
   Shell in Einzelwörter zerlegt, Cline brach sofort mit "Unknown command"
   ab. Gefixt (Befehl selbst als ein einziger, gequoteter String bauen).
2. **Wichtiger:** Ein bereits bestehendes Fix-Skript (`tools/gwen-modell-
   laden.cmd`, von Tim am 2026-08-10 angelegt) löst den Kontext-Bug anders,
   als ich es tags zuvor manuell tat — Identifier `qwen3.5-9b` (nicht
   `qwen/qwen3.5-9b`) mit **131072** Kontext (nicht 65536). Ich hatte dieses
   Skript nicht geprüft, bevor ich eigenständig debuggt habe, und dadurch
   eine abweichende Konfiguration etabliert. Korrigiert: Modell neu geladen
   mit den kanonischen Parametern, Cline-Provider entsprechend angepasst.
   **Lehre:** vor eigenständigem Infrastruktur-Debugging immer zuerst
   `tools/` nach bereits existierenden Fixes durchsuchen.

**Testlauf 3 mit dem fertigen Wrapper** (Test-03-Fortsetzung.md,
Nur-Ergänzen-Test mit vorhandenem Eintrag): Wrapper meldete **SUCCESS**
(strukturell korrekt: alter Eintrag + Fragen-Abschnitt + Überschrift blieben
erhalten, neuer Eintrag wurde sauber angehängt). Bei manueller Durchsicht
zeigten sich aber zwei Mängel, die die reine Strukturprüfung nicht erfasst:
- **Frage 1 wurde erneut beantwortet**, obwohl der Hinweis ausdrücklich nur
  Frage 2 verlangte (redundant, aber nicht schädlich).
- **Klassischer Satzabbruch mitten im Wort** bei der Antwort zu Frage 2
  ("...DGUV Vorschrift 78 „Arbeiten im Bereich von Gleisen" — Zitat nie
  geschlossen, kein Abschluss) — exakt der historisch dokumentierte
  Hauptfehler aus [[../08-Recherche-Gwen/gwen_recherche_workflow]]. Die
  Norm selbst war aber echt und korrekt (von Claude gegengeprüft).
- Der Wrapper wurde daraufhin um eine Heuristik erweitert (`looksTruncated`
  in `run-gwen-task.cjs`): prüft den gesamten neu hinzugefügten Text auf
  unbalancierte „...“-Anführungszeichen und `**`-Fettmarkierungen, nicht nur
  die letzte Zeile (die sah in diesem Fall für sich genommen vollständig
  aus, weil danach noch eine unauffällige Quelle-Zeile aus dem alten,
  unveränderten Testeintrag folgte). Am echten Test-03-Fall verifiziert:
  Heuristik schlägt jetzt korrekt an (Status `NEEDS_REVIEW` statt `SUCCESS`).
- **Wichtige Einordnung:** Auch mit dieser Erweiterung bleibt der Wrapper
  eine strukturelle/heuristische Prüfung, keine inhaltliche Qualitätskontrolle
  — er hätte z. B. das falsche Datum (2026-11-08 statt echtem 2026-08-11)
  oder die unnötige Doppel-Beantwortung nicht erkannt. Ersetzt keine
  menschliche/Claude-Stichprobenkontrolle, reduziert aber das ursprüngliche
  Kernrisiko (stiller Fehlschlag ohne jede Meldung) deutlich.

## Zusammenfassung nach 3 vollständigen Testläufen + Infrastruktur-Debugging

Nur 3 von 8 geplanten Inhalts-Tests vollständig durchgelaufen (Test 04–08
nicht mehr geschafft) — der Rest der Zeit ging für Infrastruktur-Bugs drauf.
Trotzdem klares Bild:

- **Inhaltliche Qualität, wenn ein Lauf durchläuft: durchgehend gut.** Alle
  drei inhaltlichen Stichproben (echte Norm in Test 01, Fabrikationsfalle in
  Test 02, echte Norm in Test 03) waren korrekt bzw. ehrlich — kein einziger
  Fabrikationsfehler in dieser Runde, alle genannten Normen von Claude
  gegengeprüft und real.
- **Formatregeln und Vollständigkeit werden nicht zuverlässig eingehalten**:
  Test 01 löschte die Abschnittsüberschrift statt nur zu ergänzen, Test 03
  brach mitten im Satz ab (klassischer, historisch bekannter Fehler) und
  beantwortete eine bereits erledigte Frage unnötig erneut.
- **Technische Zuverlässigkeit war der größte Schwachpunkt** — mindestens
  6 unterschiedliche technische Fehlerbilder an einem Nachmittag (IPv6-Hang,
  Kontext-Mismatch, Hub-Lock-nach-Kill, verwaiste Prozesse, Jinja-Crash,
  eigener Windows-Quoting-Bug im Wrapper) —, aber **mit dem
  Verifikations-Wrapper (`tools/cline-cli/run-gwen-task.cjs`) jetzt deutlich
  besser beherrschbar**: automatisches Aufräumen verhindert die
  Kettenreaktion nach einem Absturz, automatische Retries fangen transiente
  Fehlschläge ab, und die Struktur-/Truncation-Prüfung verhindert, dass ein
  stiller Fehlschlag unbemerkt bleibt.
- **Fazit für den produktiven Einsatz:** Der CLI-Pfad ist mit dem Wrapper
  jetzt geeignet für **beaufsichtigte Serien** (mehrere Dateien hintereinander
  per Skript, Ergebnisse aber weiterhin stichprobenartig von Claude/Tim
  gegenprüfen) — nicht für vollautomatisches, ungeprüftes Übernehmen der
  Ergebnisse, da der Wrapper strukturelle/technische Fehler zuverlässig
  fängt, aber keine inhaltliche Qualitätskontrolle ersetzt (falsche Daten,
  unnötige Wiederholungen o. Ä. bleiben möglich).
